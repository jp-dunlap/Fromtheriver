// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  css: { postcss: './postcss.config.cjs' },
  build: {
    // Hotfix: avoid esbuild identifier minification to prevent
    // "Cannot access 'jt' before initialization" regressions.
    minify: false,
    sourcemap: true,
    target: 'es2019',
    outDir: 'dist',
    assetsDir: 'assets',
    manifest: true,
  },
  esbuild: {
    // Preserve function/class names to keep stacks readable
    keepNames: true
  }
});
