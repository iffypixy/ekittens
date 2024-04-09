/** @type { import("eslint").Linter.Config } */
module.exports = {
  plugins: ["@typescript-eslint/eslint-plugin", "jsx-a11y"],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    project: "tsconfig.json",
    sourceType: "module",
    ecmaVersion: "latest",
  },
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:jsx-a11y/recommended",
  ],
  env: {
    node: true,
    browser: true,
  },
  settings: {
    react: {
      version: "detect",
    },
  },
  ignorePatterns: [".eslintrc.cjs"],
  rules: {
    "@typescript-eslint/no-explicit-any": "off",
  },
};
