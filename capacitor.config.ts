cat > capacitor.config.ts <<'EOF'
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.youmi.gro',
  appName: 'YOUmi',
  webDir: 'dist',
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
EOF