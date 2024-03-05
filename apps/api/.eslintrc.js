/** @type { import("eslint").Linter.Config } */
module.exports = {
  plugins: ["@typescript-eslint/eslint-plugin"],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    project: "tsconfig.json",
    sourceType: "module",
  },
  extends: ["eslint:recommended", "plugin:@typescript-eslint/recommended"],
  root: true,
  env: {
    node: true,
  },
  ignorePatterns: [".eslintrc.js"],
  rules: {
    "no-duplicate-imports": 2,
    "@typescript-eslint/explicit-function-return-type": 2,
    "@typescript-eslint/explicit-module-boundary-types": 2,
    "@typescript-eslint/no-explicit-any": 0,
  },
};
