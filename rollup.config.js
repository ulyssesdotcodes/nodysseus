import {nodeResolve} from "@rollup/plugin-node-resolve"
import json from "@rollup/plugin-json"
import commonjs from "@rollup/plugin-commonjs";
import copy from "rollup-plugin-copy"
import sourcemaps from "rollup-plugin-sourcemaps";
import globals from "rollup-plugin-node-globals";
import builtins from "rollup-plugin-node-builtins";
import swc from "./node_modules/rollup-plugin-swc/dist/esm/index.js";
import typescript from "rollup-plugin-typescript";


let cache = null;

const oldconfig = [{
  input: "src/nodysseus.js",
  cache,
  output: {
    file: "./public/nodysseus.bundle.js",
    format: "es"
  },
  plugins: [nodeResolve()]
  // plugins: [nodeResolve(), json(), globals(), builtins()],
}, {
  input: "src/worker.js",
  cache,
  output: {
    file: "./public/worker.js",
    format: "iife"
  },
  plugins: [nodeResolve(), json(), globals(), builtins()],
}, {
  input: "src/editor.js",
  cache,
  output: {
    file: "./public/editor.bundle.js",
    esModule: true,
    format: "es",
    sourcemap: true
  },
  plugins: [commonjs(), nodeResolve(), copy({
    targets: [
      {src: 'json/*', dest: 'public/json'}
    ]
  })],
}
]

export default {
  input: 'src/index.js',
  output: {
    file: './public/index.bundle.js',
    sourcemap: true
  },
  plugins: [
    commonjs(),
    nodeResolve(),
    swc({
      jsc: {
        parser: {
          syntax: "typescript"
        },
        target: "es2018"
      },
      sourceMaps: true
    }),
  ]
}
