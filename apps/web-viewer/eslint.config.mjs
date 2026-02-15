import nextPlugin from "eslint-config-next";

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
