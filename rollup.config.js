import {nodeResolve} from "@rollup/plugin-node-resolve"
import commonjs from "@rollup/plugin-commonjs"
import json from "@rollup/plugin-json"
import copy from "rollup-plugin-copy"
import sourcemaps from "rollup-plugin-sourcemaps";

let cache = null;
const rucommonjs = commonjs();

export default [{
  input: "src/nodysseus.js",
  cache,
  output: {
    file: "./public/nodysseus.bundle.js",
    format: "es"
  },
  plugins: [nodeResolve(), rucommonjs, json()],
}, {
  input: "src/worker.js",
  cache,
  output: {
    file: "./public/worker.js",
    format: "iife"
  },
  plugins: [nodeResolve(), rucommonjs, json()],
}, {
  input: "src/editor.js",
  cache,
  output: {
    file: "./public/editor.bundle.js",
    format: "es",
    sourcemap: true
  },
  plugins: [nodeResolve(), rucommonjs, json(), sourcemaps(), copy({
    targets: [
      {src: 'json/*', dest: 'public/json'}
    ]
  })],
}
]