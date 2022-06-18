const path = require("path");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");

module.exports = {
  entry: {
    index: `${path.resolve(__dirname, "src")}/index.ts`,
  },
  module: {
    rules: [
      {
        test: /\.ts?$/,
        use: "ts-loader",
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: [".ts", ".js"],
    // alias: {
    //   "~": path.resolve(__dirname, "./demo/js/widgets"),
    // },
  },
  output: {
    clean: true,
    path: path.resolve(__dirname, "lib"),
    filename: `[name].js`,
  },
  plugins: [new CleanWebpackPlugin()],
};
