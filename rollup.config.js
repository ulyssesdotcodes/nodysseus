import {nodeResolve} from "@rollup/plugin-node-resolve"
import commonjs from "@rollup/plugin-commonjs"
import json from "@rollup/plugin-json"

export default {
  input: "./copane.js",
  output: {
    file: "./copane.bundle.js",
    format: "iife"
  },
  plugins: [nodeResolve(), commonjs(), json()]
}