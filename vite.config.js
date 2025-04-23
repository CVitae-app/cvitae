import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import AutoImport from 'unplugin-auto-import/vite';
import Components from 'unplugin-react-components/vite';
import path from 'path';

export default defineConfig({
  server: {
    allowedHosts: [
      '7170-82-174-162-60.ngrok-free.app', // Replace with your ngrok URL if different
      'ngrok.io', // Wildcard to allow any ngrok domain
      'localhost', // Allow localhost for local development
    ],
  },
  plugins: [
    react(),
    AutoImport({
      dirs: [
        'src/components',
        'src/components/FormSteps',
        'src/contexts',
        'src/data',
        'src/hooks',
        'src/pages',
        'src/sections',
        'src/styles',
        'src/utils',
      ],
      dts: 'src/auto-imports.d.ts',
      eslintrc: {
        enabled: true,
      },
    }),
    Components({
      dirs: [
        'src/components',
        'src/components/FormSteps',
      ],
      dts: 'src/components.d.ts',
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
});
