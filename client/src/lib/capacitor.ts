/**
 * Capacitor utilities for native device integration
 * Handles screen orientation, haptics, storage, and status bar
 */

import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { Preferences } from '@capacitor/preferences';
import { ScreenOrientation, type OrientationLockType } from '@capacitor/screen-orientation';
import { SplashScreen } from '@capacitor/splash-screen';
import { StatusBar, Style } from '@capacitor/status-bar';

/** Orientation type alias for compatibility */
type OrientationType = OrientationLockType;

/** Check if running as native app */
export const isNative = Capacitor.isNativePlatform();

/** Check if running on Android */
export const isAndroid = Capacitor.getPlatform() === 'android';

/** Check if running on iOS */
export const isIOS = Capacitor.getPlatform() === 'ios';

/** Check if running on web */
export const isWeb = Capacitor.getPlatform() === 'web';

// ============================================================================
// Screen Orientation
// ============================================================================

/**
 * Lock screen orientation to a specific type
 * Useful for gameplay sections that work best in landscape
 */
export async function lockOrientation(orientation: OrientationType): Promise<void> {
  if (!isNative) return;
  try {
    await ScreenOrientation.lock({ orientation });
  } catch (error) {
    console.warn('Failed to lock orientation:', error);
  }
}

/**
 * Unlock screen orientation to allow user rotation
 * Call this when returning to menus or flexible UI
 */
export async function unlockOrientation(): Promise<void> {
  if (!isNative) return;
  try {
    await ScreenOrientation.unlock();
  } catch (error) {
    console.warn('Failed to unlock orientation:', error);
  }
}

/**
 * Get current screen orientation
 */
export async function getCurrentOrientation(): Promise<OrientationType | null> {
  if (!isNative) return null;
  try {
    const result = await ScreenOrientation.orientation();
    return result.type;
  } catch (error) {
    console.warn('Failed to get orientation:', error);
    return null;
  }
}

/**
 * Listen for screen orientation changes
 * Important for foldable devices like OnePlus Open
 */
export function onOrientationChange(
  callback: (orientation: OrientationType) => void
): () => void {
  if (!isNative) {
    // Web fallback using matchMedia
    const mediaQuery = window.matchMedia('(orientation: portrait)');
    const handler = (e: MediaQueryListEvent) => {
      callback(e.matches ? 'portrait' : 'landscape');
    };
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }

  const listener = ScreenOrientation.addListener('screenOrientationChange', (result) => {
    callback(result.type);
  });

  return () => {
    listener.then((l) => l.remove());
  };
}

// ============================================================================
// Haptics
// ============================================================================

/**
 * Trigger light haptic feedback for UI interactions
 */
export async function hapticLight(): Promise<void> {
  try {
    await Haptics.impact({ style: ImpactStyle.Light });
  } catch {
    // Silently fail on platforms without haptics
  }
}

/**
 * Trigger medium haptic feedback for important actions
 */
export async function hapticMedium(): Promise<void> {
  try {
    await Haptics.impact({ style: ImpactStyle.Medium });
  } catch {
    // Silently fail on platforms without haptics
  }
}

/**
 * Trigger heavy haptic feedback for major events
 */
export async function hapticHeavy(): Promise<void> {
  try {
    await Haptics.impact({ style: ImpactStyle.Heavy });
  } catch {
    // Silently fail on platforms without haptics
  }
}

/**
 * Trigger success haptic notification
 */
export async function hapticSuccess(): Promise<void> {
  try {
    await Haptics.notification({ type: NotificationType.Success });
  } catch {
    // Silently fail on platforms without haptics
  }
}

/**
 * Trigger warning haptic notification
 */
export async function hapticWarning(): Promise<void> {
  try {
    await Haptics.notification({ type: NotificationType.Warning });
  } catch {
    // Silently fail on platforms without haptics
  }
}

/**
 * Trigger error haptic notification
 */
export async function hapticError(): Promise<void> {
  try {
    await Haptics.notification({ type: NotificationType.Error });
  } catch {
    // Silently fail on platforms without haptics
  }
}

/**
 * Trigger selection haptic feedback
 */
export async function hapticSelection(): Promise<void> {
  try {
    await Haptics.selectionStart();
    await Haptics.selectionEnd();
  } catch {
    // Silently fail on platforms without haptics
  }
}

// ============================================================================
// Storage (Preferences)
// ============================================================================

/**
 * Save game data to persistent storage
 */
export async function saveGameData<T>(key: string, value: T): Promise<void> {
  try {
    await Preferences.set({
      key,
      value: JSON.stringify(value),
    });
  } catch (error) {
    console.error('Failed to save game data:', error);
    // Fallback to localStorage
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Storage unavailable
    }
  }
}

/**
 * Load game data from persistent storage
 */
export async function loadGameData<T>(key: string, defaultValue: T): Promise<T> {
  try {
    const result = await Preferences.get({ key });
    if (result.value) {
      return JSON.parse(result.value) as T;
    }
    return defaultValue;
  } catch (error) {
    console.error('Failed to load game data:', error);
    // Fallback to localStorage
    try {
      const value = localStorage.getItem(key);
      if (value) {
        return JSON.parse(value) as T;
      }
    } catch {
      // Parse error
    }
    return defaultValue;
  }
}

/**
 * Remove game data from persistent storage
 */
export async function removeGameData(key: string): Promise<void> {
  try {
    await Preferences.remove({ key });
    localStorage.removeItem(key);
  } catch (error) {
    console.error('Failed to remove game data:', error);
  }
}

/**
 * Clear all game data from persistent storage
 */
export async function clearAllGameData(): Promise<void> {
  try {
    await Preferences.clear();
    localStorage.clear();
  } catch (error) {
    console.error('Failed to clear game data:', error);
  }
}

// ============================================================================
// Status Bar
// ============================================================================

/**
 * Hide status bar for immersive gameplay
 */
export async function hideStatusBar(): Promise<void> {
  if (!isNative) return;
  try {
    await StatusBar.hide();
  } catch (error) {
    console.warn('Failed to hide status bar:', error);
  }
}

/**
 * Show status bar
 */
export async function showStatusBar(): Promise<void> {
  if (!isNative) return;
  try {
    await StatusBar.show();
  } catch (error) {
    console.warn('Failed to show status bar:', error);
  }
}

/**
 * Set status bar style (dark icons for light backgrounds, light icons for dark)
 */
export async function setStatusBarStyle(style: 'dark' | 'light'): Promise<void> {
  if (!isNative) return;
  try {
    await StatusBar.setStyle({ style: style === 'dark' ? Style.Dark : Style.Light });
  } catch (error) {
    console.warn('Failed to set status bar style:', error);
  }
}

/**
 * Set status bar background color
 */
export async function setStatusBarColor(color: string): Promise<void> {
  if (!isAndroid) return;
  try {
    await StatusBar.setBackgroundColor({ color });
  } catch (error) {
    console.warn('Failed to set status bar color:', error);
  }
}

// ============================================================================
// Splash Screen
// ============================================================================

/**
 * Hide the native splash screen
 * Call this after the app has loaded
 */
export async function hideSplashScreen(): Promise<void> {
  try {
    await SplashScreen.hide();
  } catch (error) {
    console.warn('Failed to hide splash screen:', error);
  }
}

/**
 * Show the native splash screen
 */
export async function showSplashScreen(): Promise<void> {
  try {
    await SplashScreen.show();
  } catch (error) {
    console.warn('Failed to show splash screen:', error);
  }
}

// ============================================================================
// Game-specific helpers
// ============================================================================

/**
 * Initialize Capacitor for gameplay
 * Call this when the game component mounts
 */
export async function initializeGameMode(): Promise<void> {
  await hideSplashScreen();
  await hideStatusBar();
  // Allow rotation for foldables
  await unlockOrientation();
}

/**
 * Get safe area insets for notch/punch-hole displays
 */
export function getSafeAreaInsets(): {
  top: number;
  bottom: number;
  left: number;
  right: number;
} {
  const computedStyle = getComputedStyle(document.documentElement);
  return {
    top: Number.parseInt(computedStyle.getPropertyValue('--safe-area-inset-top') || '0', 10),
    bottom: Number.parseInt(computedStyle.getPropertyValue('--safe-area-inset-bottom') || '0', 10),
    left: Number.parseInt(computedStyle.getPropertyValue('--safe-area-inset-left') || '0', 10),
    right: Number.parseInt(computedStyle.getPropertyValue('--safe-area-inset-right') || '0', 10),
  };
}

/**
 * Vibrate pattern for game events
 */
export async function vibratePattern(pattern: 'damage' | 'collect' | 'checkpoint' | 'death'): Promise<void> {
  switch (pattern) {
    case 'damage':
      await hapticMedium();
      break;
    case 'collect':
      await hapticLight();
      break;
    case 'checkpoint':
      await hapticSuccess();
      break;
    case 'death':
      await hapticError();
      break;
  }
}
