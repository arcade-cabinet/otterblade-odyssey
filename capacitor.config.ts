import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.otterblade.odyssey',
  appName: 'Otterblade Odyssey',
  webDir: 'dist/public',
  // Server configuration for web platform
  server: {
    // Use the correct hostname for mobile testing
    androidScheme: 'https',
    // Enable clear text traffic for local development
    cleartext: true,
  },
  // Plugins configuration
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      launchFadeOutDuration: 500,
      backgroundColor: '#1a1a2e',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
    },
    StatusBar: {
      style: 'dark',
      backgroundColor: '#1a1a2e',
    },
    ScreenOrientation: {
      // Allow both portrait and landscape for foldables
      defaultOrientation: 'any',
    },
    Haptics: {
      // Enable haptics for tactile feedback
    },
    Preferences: {
      // For storing game state/settings
    },
  },
  // Android-specific configuration
  android: {
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: true,
    // Responsive scaling for foldables
    overrideUserAgent: 'OtterbladeOdyssey/1.0',
    // Enable immersive mode
    hideLogs: false,
  },
  // iOS-specific configuration (for future)
  ios: {
    contentInset: 'always',
    allowsLinkPreview: false,
    scrollEnabled: false,
  },
};

export default config;
