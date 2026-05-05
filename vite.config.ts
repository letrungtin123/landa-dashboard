import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const lmsUrl = env.VITE_OPENEDX_LMS_URL || 'http://local.openedx.io';

  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      port: 3000,
      strictPort: false,
      proxy: {
        // Forward tất cả API calls đến LMS
        '/oauth2': {
          target: lmsUrl,
          changeOrigin: true,
          cookieDomainRewrite: 'localhost',
        },
        '/api': {
          target: lmsUrl,
          changeOrigin: true,
          cookieDomainRewrite: 'localhost',
        },
        '/login_ajax': {
          target: lmsUrl,
          changeOrigin: true,
          cookieDomainRewrite: 'localhost',
        },
        '/logout': {
          target: lmsUrl,
          changeOrigin: true,
          cookieDomainRewrite: 'localhost',
        },
      },
    },
    build: {
      sourcemap: false,
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom', 'react-router-dom'],
            ui: ['framer-motion', 'recharts', 'sonner'],
          },
        },
      },
    },
  };
});
