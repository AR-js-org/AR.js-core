import js from '@eslint/js';
import prettier from 'eslint-config-prettier';

export default [
  {
    ignores: ['dist/', 'node_modules/', 'coverage/', 'types/'],
  },
  js.configs.recommended,
  prettier,
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        // Browser globals
        window: 'readonly',
        document: 'readonly',
        navigator: 'readonly',
        console: 'readonly',
        alert: 'readonly',
        HTMLElement: 'readonly',
        HTMLVideoElement: 'readonly',
        HTMLCanvasElement: 'readonly',
        Image: 'readonly',
        ImageData: 'readonly',
        fetch: 'readonly',
        CustomEvent: 'readonly',
        MediaStream: 'readonly',
        performance: 'readonly',
        screen: 'readonly',
        location: 'readonly',
        WebAssembly: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        requestAnimationFrame: 'readonly',
        cancelAnimationFrame: 'readonly',
        // Node.js globals
        process: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        require: 'readonly',
        module: 'readonly',
        exports: 'readonly',
        // Testing globals (vitest)
        describe: 'readonly',
        test: 'readonly',
        it: 'readonly',
        expect: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
        vi: 'readonly',
        // AR.js specific globals
        ArToolkitContext: 'writable',
        ArMarkerControls: 'writable',
      },
    },
    rules: {
      // Relax rules for existing codebase patterns
      'no-empty': 'off',
      'no-unused-vars': 'off',
      'no-unused-private-class-members': 'off',
      'no-redeclare': 'off',
    },
  },
];
