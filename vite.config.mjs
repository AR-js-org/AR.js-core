import { defineConfig } from 'vite';

// Library build that produces:
// - dist/arjs-core.mjs (ESM)  -> package.json "module" and "exports.import"
// - dist/arjs-core.js (CJS)   -> package.json "main" and "exports.require"
export default defineConfig({
  build: {
    sourcemap: true,
    target: 'esnext',
    lib: {
      entry: 'src/index.js',
      name: 'ARJSCore', // used for UMD/IIFE only; kept for completeness
    },
    rollupOptions: {
      external: [],
      output: [
        {
          format: 'es',
          entryFileNames: 'arjs-core.mjs',
          exports: 'named',
          dir: 'dist',
          sourcemap: true,
          interop: 'auto',
        },
        {
          format: 'cjs',
          entryFileNames: 'arjs-core.js',
          exports: 'named',
          dir: 'dist',
          sourcemap: true,
          interop: 'auto',
        },
      ],
    },
    emptyOutDir: true,
  },
});
