import {nodeResolve} from "@rollup/plugin-node-resolve"
import commonjs from "@rollup/plugin-commonjs"
import json from "@rollup/plugin-json"

let cache = null;
const rucommonjs = commonjs();

export default {
  input: "./nodysseus.js",
  cache,
  output: {
    file: "./nodysseus.bundle.js",
    format: "iife"
  },
  plugins: [nodeResolve(), rucommonjs, json()]
}