import {nodeResolve} from "@rollup/plugin-node-resolve"
import commonjs from "@rollup/plugin-commonjs"
import json from "@rollup/plugin-json"

export default {
  input: "./nodysseus.js",
  output: {
    file: "./nodysseus.bundle.js",
    format: "iife"
  },
  plugins: [nodeResolve(), commonjs(), json()]
}