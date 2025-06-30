const globals = require("globals");

module.exports = {
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: 2022, // Aligns with your .eslintrc.json
    sourceType: "module", // ECMAScript modules
  },
  env: {
    es6: true,
    node: true,
  },
  globals: {
    ...globals.browser, // Browser environment
  },
  plugins: [
    "@typescript-eslint",
    "import",
  ],
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended", // TypeScript recommended rules
    "plugin:import/errors", // Import plugin rules
    "next/core-web-vitals", // Next.js core web vitals
    "prettier", // Prettier integration for code formatting
  ],
  ignorePatterns: ["dist/", ".eslintrc.cjs"], // Use 'ignorePatterns' instead of 'ignores'
  rules: {
    // Additional custom rules can be added here
    "@typescript-eslint/no-unused-vars": [
      "error",
      {
        "argsIgnorePattern": "^_",    // Ignore unused function arguments starting with _
        "varsIgnorePattern": "^_",    // Ignore unused variables starting with _
      }
    ]
  },
  settings: {
    "import/resolver": {
      node: {
        extensions: [".js", ".jsx", ".ts", ".tsx"], // Resolve these file extensions
      },
    },
  },
};
