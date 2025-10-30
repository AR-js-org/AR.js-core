import { defineConfig } from "vite";

export default defineConfig({
  server: {
    // For local camera access, HTTP on localhost generally works in Chrome.
    // If you need HTTPS (Safari/stricter policies), enable and provide certs:
    // https: true,
    port: 5173,
    open: "/examples/minimal/index.html",
  },
  build: {
    lib: {
      entry: "src/core/engine.js",
      name: "ARJSCore",
      formats: ["es"],
      fileName: (format) => `arjs-core.${format}.js`,
    },
    rollupOptions: {
      external: [],
    },
  },
});
