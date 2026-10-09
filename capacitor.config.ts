import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.youmi.gro',
  appName: 'YOUmi',
  webDir: 'dist',
  // Initial integration: load the existing hosted YOUmi platform so current
  // PHP API/session paths remain same-origin and no backend rewrite is needed.
  // Before a Google Play release, review this architecture and native-app policy;
  // a bundled frontend with a properly configured API origin is preferable.
  server: {
    url: 'https://youmi.wuaze.com',
    cleartext: false,
    allowNavigation: ['youmi.wuaze.com', '*.wuaze.com'],
  },
  android: {
    allowMixedContent: false,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1800,
      backgroundColor: '#ffffff',
      showSpinner: false,
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#ffffff',
    },
  },
};

export default config;
