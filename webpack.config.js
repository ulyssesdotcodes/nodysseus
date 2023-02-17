import path from "path";
import {fileURLToPath} from "url";

export default {
  entry: './src/index.js',
  mode: 'development',
  target: "es2022",
  output: {
    path: path.resolve(path.dirname(fileURLToPath(import.meta.url)), 'public'),
    filename: 'index.bundle.js',
    asyncChunks: false,
    chunkFormat: false,
    environment: {
      dynamicImport: true
    }
  },
  externalsPresets: {
    node: true
  },
  resolve: {
    extensions: ['.ts', '.js']
  },
  devServer: {
    headers: {
      "Cache-Control": "no-cache"
    }
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        exclude: /(node_modules)/,
        use: {
          loader: 'swc-loader',
          options: {
            jsc: {
              parser: {
                syntax: "typescript",
                dynamicImport: true
              }
            },
            sourceMaps: true
          }
        }
      },
      {
        test: /\.js$/,
        exclude: /(node_modules)/,
        use: {
          loader: 'swc-loader',
          options: {
            jsc: {
              parser: {
                syntax: "ecmascript",
                dynamicImport: true
              },
              target: "es2022"
            },
            sourceMaps: true
          }
        }
      },
      {
        test: /\.ts$/,
        exclude: /(node_modules)/,
        use: 'ts-loader'
      }
    ]
  }
}
