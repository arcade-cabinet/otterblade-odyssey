/**
 * Fullscreen API utilities for immersive gameplay
 *
 * Provides cross-browser fullscreen support with:
 * - Automatic vendor prefix handling
 * - Screen orientation lock for mobile
 * - Graceful fallback when not supported
 */

import {
  hideStatusBar,
  isNative,
  lockOrientation,
  showStatusBar,
  unlockOrientation,
} from './capacitor';

/** Check if fullscreen API is available */
export function isFullscreenSupported(): boolean {
  const doc = document as Document & {
    webkitFullscreenEnabled?: boolean;
    mozFullScreenEnabled?: boolean;
    msFullscreenEnabled?: boolean;
  };

  return !!(
    doc.fullscreenEnabled ||
    doc.webkitFullscreenEnabled ||
    doc.mozFullScreenEnabled ||
    doc.msFullscreenEnabled
  );
}

/** Check if currently in fullscreen mode */
export function isFullscreen(): boolean {
  const doc = document as Document & {
    webkitFullscreenElement?: Element;
    mozFullScreenElement?: Element;
    msFullscreenElement?: Element;
  };

  return !!(
    doc.fullscreenElement ||
    doc.webkitFullscreenElement ||
    doc.mozFullScreenElement ||
    doc.msFullscreenElement
  );
}

/** Request fullscreen on an element (defaults to document.documentElement) */
export async function enterFullscreen(element?: HTMLElement): Promise<boolean> {
  const el = element || document.documentElement;

  const requestFullscreen = el as HTMLElement & {
    webkitRequestFullscreen?: () => Promise<void>;
    mozRequestFullScreen?: () => Promise<void>;
    msRequestFullscreen?: () => Promise<void>;
  };

  try {
    if (requestFullscreen.requestFullscreen) {
      await requestFullscreen.requestFullscreen();
    } else if (requestFullscreen.webkitRequestFullscreen) {
      await requestFullscreen.webkitRequestFullscreen();
    } else if (requestFullscreen.mozRequestFullScreen) {
      await requestFullscreen.mozRequestFullScreen();
    } else if (requestFullscreen.msRequestFullscreen) {
      await requestFullscreen.msRequestFullscreen();
    } else {
      console.warn('Fullscreen API not supported');
      return false;
    }

    // Hide status bar on native
    if (isNative) {
      await hideStatusBar();
    }

    return true;
  } catch (error) {
    console.warn('Failed to enter fullscreen:', error);
    return false;
  }
}

/** Exit fullscreen mode */
export async function exitFullscreen(): Promise<boolean> {
  const doc = document as Document & {
    webkitExitFullscreen?: () => Promise<void>;
    mozCancelFullScreen?: () => Promise<void>;
    msExitFullscreen?: () => Promise<void>;
  };

  try {
    if (doc.exitFullscreen) {
      await doc.exitFullscreen();
    } else if (doc.webkitExitFullscreen) {
      await doc.webkitExitFullscreen();
    } else if (doc.mozCancelFullScreen) {
      await doc.mozCancelFullScreen();
    } else if (doc.msExitFullscreen) {
      await doc.msExitFullscreen();
    }

    // Show status bar on native
    if (isNative) {
      await showStatusBar();
    }

    return true;
  } catch (error) {
    console.warn('Failed to exit fullscreen:', error);
    return false;
  }
}

/** Toggle fullscreen mode */
export async function toggleFullscreen(element?: HTMLElement): Promise<boolean> {
  if (isFullscreen()) {
    return exitFullscreen();
  }
  return enterFullscreen(element);
}

/** Listen for fullscreen changes */
export function onFullscreenChange(callback: (isFullscreen: boolean) => void): () => void {
  const handler = () => callback(isFullscreen());

  document.addEventListener('fullscreenchange', handler);
  document.addEventListener('webkitfullscreenchange', handler);
  document.addEventListener('mozfullscreenchange', handler);
  document.addEventListener('MSFullscreenChange', handler);

  return () => {
    document.removeEventListener('fullscreenchange', handler);
    document.removeEventListener('webkitfullscreenchange', handler);
    document.removeEventListener('mozfullscreenchange', handler);
    document.removeEventListener('MSFullscreenChange', handler);
  };
}

/**
 * Enter immersive game mode
 * - Fullscreen
 * - Landscape orientation (mobile)
 * - Hidden status bar (native)
 */
export async function enterImmersiveMode(): Promise<boolean> {
  const fullscreenSuccess = await enterFullscreen();

  // Try to lock to landscape for better gameplay on mobile
  try {
    // Use Screen Orientation API if available
    const orientation = screen.orientation as ScreenOrientation & {
      lock?: (orientation: string) => Promise<void>;
    };
    if (orientation?.lock) {
      await orientation.lock('landscape');
    } else if (isNative) {
      await lockOrientation('landscape');
    }
  } catch {
    // Orientation lock not supported or denied - that's fine
  }

  return fullscreenSuccess;
}

/**
 * Exit immersive game mode
 */
export async function exitImmersiveMode(): Promise<void> {
  await exitFullscreen();

  // Unlock orientation
  try {
    if ('orientation' in screen && 'unlock' in (screen.orientation as ScreenOrientation)) {
      (screen.orientation as ScreenOrientation).unlock();
    } else if (isNative) {
      await unlockOrientation();
    }
  } catch {
    // Orientation unlock not supported - that's fine
  }
}

/**
 * Hook-friendly fullscreen state
 * Returns current fullscreen status and control functions
 */
export function createFullscreenController() {
  let isInFullscreen = isFullscreen();
  const listeners = new Set<(isFullscreen: boolean) => void>();

  const notify = () => {
    isInFullscreen = isFullscreen();
    for (const listener of listeners) {
      listener(isInFullscreen);
    }
  };

  // Set up global listener
  const cleanup = onFullscreenChange(notify);

  return {
    get isFullscreen() {
      return isInFullscreen;
    },
    enter: enterFullscreen,
    exit: exitFullscreen,
    toggle: toggleFullscreen,
    enterImmersive: enterImmersiveMode,
    exitImmersive: exitImmersiveMode,
    subscribe: (callback: (isFullscreen: boolean) => void) => {
      listeners.add(callback);
      return () => listeners.delete(callback);
    },
    destroy: cleanup,
  };
}
