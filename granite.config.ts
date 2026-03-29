import { defineConfig } from '@apps-in-toss/web-framework/config';

export default defineConfig({
  appName: 'loljalal',
  brand: {
    displayName: '롤잘알',
    primaryColor: '#C89B3C',
    icon: '',
  },
  web: {
    host: '192.168.35.109',
    port: 5175,
    commands: {
      dev: 'vite --host',
      build: 'vite build',
    },
  },
  permissions: [],
  outdir: 'dist',
  webViewProps: {
    type: 'game',
  },
});
