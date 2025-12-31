import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.otterblade.odyssey',
  appName: 'Otterblade Odyssey',
  webDir: 'dist/public',
  // Server configuration for web platform
  server: {
    // Use the correct hostname for mobile testing
    androidScheme: 'https',
    // Security: Only enable cleartext in development
    cleartext: process.env.NODE_ENV !== 'production',
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
    // Security: Only allow mixed content in development
    allowMixedContent: process.env.NODE_ENV !== 'production',
    captureInput: true,
    // Security: Only enable debugging in development
    webContentsDebuggingEnabled: process.env.NODE_ENV !== 'production',
    // Responsive scaling for foldables
    overrideUserAgent: 'OtterbladeOdyssey/1.0',
    // Hide logs in production
    hideLogs: process.env.NODE_ENV === 'production',
  },
  // iOS-specific configuration (for future)
  ios: {
    contentInset: 'always',
    allowsLinkPreview: false,
    scrollEnabled: false,
  },
};

export default config;
