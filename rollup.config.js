import {nodeResolve} from "@rollup/plugin-node-resolve"
import commonjs from "@rollup/plugin-commonjs"
import json from "@rollup/plugin-json"
import copy from "rollup-plugin-copy"
import sourcemaps from "rollup-plugin-sourcemaps";
import globals from "rollup-plugin-node-globals";
import builtins from "rollup-plugin-node-builtins";


let cache = null;

export default [{
  input: "src/nodysseus.mjs",
  cache,
  output: {
    file: "./public/nodysseus.bundle.js",
    format: "es"
  },
  plugins: [nodeResolve(), commonjs(), json(), globals(), /*dynamicImportVars(), */ builtins()],
}, {
  input: "src/worker.js",
  cache,
  output: {
    file: "./public/worker.js",
    format: "iife"
  },
  plugins: [nodeResolve(), commonjs(), json(), globals(), /*dynamicImportVars(),*/ builtins()],
}, {
  input: "src/editor.js",
  cache,
  output: {
    file: "./public/editor.bundle.js",
    format: "es",
    sourcemap: true
  },
  inlineDynamicImports: true,
  plugins: [commonjs(), json(), globals(), builtins(), nodeResolve(), sourcemaps(), /*dynamicImportVars(), */ copy({
    targets: [
      {src: 'json/*', dest: 'public/json'}
    ]
  })],
}
]