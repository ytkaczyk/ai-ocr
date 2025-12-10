import nextPlugin from "eslint-config-next";
import tseslint from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";

const eslintConfig = [
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "out/**",
      ".cache/**",
      "next-env.d.ts",
      "coverage/**",
      "playwright-report/**",
      "test-results/**",
      "*.min.js",
      "public/pdf.worker.mjs"
    ]
  },
  ...nextPlugin,
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
      }
    },
    plugins: {
      "@typescript-eslint": tseslint
    },
    rules: {
      "@typescript-eslint/no-unused-vars": ["error", {
        "argsIgnorePattern": "^_",
        "varsIgnorePattern": "^_"
      }],
      "@typescript-eslint/no-explicit-any": "warn",
      "prefer-const": "error",
      "no-console": ["warn", { "allow": ["warn", "error"] }]
    }
  }
];

export default eslintConfig;
