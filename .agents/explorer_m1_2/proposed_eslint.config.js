const tsParser = require("@typescript-eslint/parser");
const tsPlugin = require("@typescript-eslint/eslint-plugin");
const reactPlugin = require("eslint-plugin-react");
const reactHooksPlugin = require("eslint-plugin-react-hooks");
const reactNativePlugin = require("eslint-plugin-react-native");

module.exports = [
  // 1. Global Ignores
  {
    ignores: [
      "**/node_modules/**",
      "**/.expo/**",
      "**/.agents/**",
      "**/dist/**",
      "**/web-build/**"
    ]
  },

  // 2. TypeScript and React Source Files Configuration
  {
    files: ["**/*.ts", "**/*.tsx"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        ecmaFeatures: {
          jsx: true
        }
      },
      globals: {
        console: "readonly",
        setTimeout: "readonly",
        clearTimeout: "readonly",
        setInterval: "readonly",
        clearInterval: "readonly",
        fetch: "readonly",
        Headers: "readonly",
        Request: "readonly",
        Response: "readonly",
        FormData: "readonly",
        WebSocket: "readonly",
        process: "readonly",
        __DEV__: "readonly",
        alert: "readonly"
      }
    },
    plugins: {
      "@typescript-eslint": tsPlugin,
      "react": reactPlugin,
      "react-hooks": reactHooksPlugin,
      "react-native": reactNativePlugin
    },
    rules: {
      // Unused variables handling (warn instead of error, ignore prefixed with _)
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": ["warn", {
        "argsIgnorePattern": "^_",
        "varsIgnorePattern": "^_",
        "caughtErrorsIgnorePattern": "^_"
      }],

      // Undefined variables handling (TypeScript type-checker handles undefs for TS files)
      "no-undef": "off",

      // React / React Native hooks
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn"
    }
  },

  // 3. JavaScript Configuration Files (Node environment)
  {
    files: [
      "*.config.js",
      "*.config.ts",
      "babel.config.js",
      "metro.config.js",
      "postcss.config.js",
      "tailwind.config.js"
    ],
    languageOptions: {
      globals: {
        module: "readonly",
        exports: "readonly",
        require: "readonly",
        __dirname: "readonly",
        process: "readonly",
        console: "readonly"
      }
    },
    rules: {
      "no-undef": "error",
      "no-unused-vars": "warn"
    }
  },

  // 4. Test Files Configuration (Jest environment globals)
  {
    files: [
      "**/__tests__/**/*.ts",
      "**/__tests__/**/*.tsx",
      "**/*.test.ts",
      "**/*.test.tsx",
      "test-mock-worklets.js"
    ],
    languageOptions: {
      globals: {
        jest: "readonly",
        describe: "readonly",
        test: "readonly",
        it: "readonly",
        expect: "readonly",
        beforeEach: "readonly",
        afterEach: "readonly",
        beforeAll: "readonly",
        afterAll: "readonly",
        module: "readonly",
        require: "readonly"
      }
    }
  }
];
