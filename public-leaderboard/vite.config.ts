import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  css: {
    // Avoid resolving the monorepo root postcss.config.mjs (@tailwindcss/postcss).
    postcss: './postcss.config.mjs',
  },
  server: {
    port: 5174,
  },
});
