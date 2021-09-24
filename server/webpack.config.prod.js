const path = require("path");
const webpack = require("webpack");

module.exports = {
  target: "node",
  externals: ["aws-sdk"],
  mode: "production",
  entry: path.resolve(__dirname, "lambda.ts"),
  output: {
    path: path.resolve(__dirname, "dist")
  },
  resolve: {
    extensions: [".ts", ".js"]
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        loader: "ts-loader"
      }
    ]
  },

  plugins: [

  ]
};
