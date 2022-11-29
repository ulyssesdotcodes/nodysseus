import path from "path";
import {fileURLToPath} from "url";

export default {
  entry: './src/index.js',
  mode: 'development',
  output: {
    path: path.resolve(path.dirname(fileURLToPath(import.meta.url)), 'public'),
    filename: 'index.bundle.js',
  },
  externalsPresets: {
    node: true
  },
  module: {
    rules: [{
      test: /\.js$/,
      exclude: /(node_modules)/,
      use: {
        loader: 'swc-loader'
      }
    }]
  }
}
