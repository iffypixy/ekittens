const corejs = "3.22.3";

module.exports = {
  minified: true,
  targets: "> 0.25%, not dead",
  presets: [
    [
      "@babel/preset-env",
      {
        corejs,
        useBuiltIns: "usage",
      },
    ],
    "@babel/preset-typescript",
    [
      "@babel/preset-react",
      {
        runtime: "automatic",
      },
    ],
  ],
};
