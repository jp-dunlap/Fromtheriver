// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const PROD = JSON.stringify(process.env.NODE_ENV ?? 'production');
const RUNTIME_GUARD =
  ";(function(){try{var g=(typeof globalThis!=='undefined')?globalThis:window;g.process=g.process||{env:{NODE_ENV:'production'}};}catch(e){}})();";

const shared = {
  plugins: [react()],
  css: { postcss: './postcss.config.cjs' },
  esbuild: {
    // Preserve function/class names to keep stacks readable
    keepNames: true,
  },
  define: {
    'process.env.NODE_ENV': PROD,
    'process.env': '{}',
    global: 'window',
  },
};

export default defineConfig(() => {
  const target = process.env.BUILD_TARGET === 'modal' ? 'modal' : 'app';

  if (target === 'modal') {
    return {
      ...shared,
      build: {
        minify: false,
        sourcemap: true,
        target: 'es2019',
        outDir: 'dist-modal',
        lib: {
          entry: 'src/codex-modal-host.tsx',
          name: 'CodexModalHost',
          formats: ['iife', 'es'],
          fileName: (format) => `codex-modal-host.${format}.js`,
        },
        rollupOptions: {
          output: {
            assetFileNames: 'codex-modal-host.[ext]',
            intro: RUNTIME_GUARD,
          },
        },
        cssCodeSplit: true,
        emptyOutDir: false,
      },
    };
  }

  return {
    ...shared,
    build: {
      // Hotfix: avoid esbuild identifier minification to prevent
      // "Cannot access 'jt' before initialization" regressions.
      minify: false,
      sourcemap: true,
      target: 'es2019',
      outDir: 'dist',
      assetsDir: 'assets',
      manifest: true,
      rollupOptions: {
        output: {
          intro: RUNTIME_GUARD,
        },
      },
    },
  };
});
