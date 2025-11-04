import { defineConfig } from 'vite';

// Library build that produces:
// - dist/arjs-core.es.js (ESM)  -> package.json "module" and "exports.import"
// - dist/arjs-core.js (CJS)     -> package.json "main" and "exports.require"
export default defineConfig({
  build: {
    sourcemap: true,
    target: 'esnext',
    lib: {
      entry: 'src/index.js',
      name: 'ARJSCore', // used for UMD/IIFE only; kept for completeness
    },
    rollupOptions: {
      // Do not bundle large/peer deps. Add here as needed.
      external: [
        '@ar-js-org/artoolkit5-js',
      ],
      output: [
        {
          format: 'es',
          entryFileNames: 'arjs-core.es.js',
          exports: 'named',
          dir: 'dist',
          interop: 'auto',
        },
        {
          format: 'cjs',
          entryFileNames: 'arjs-core.js',
          exports: 'named',
          dir: 'dist',
          interop: 'auto',
        },
      ],
    },
    emptyOutDir: true,
  },
});
