import * as esbuild from 'esbuild'
import { wasmLoader } from 'esbuild-plugin-wasm';
import fs from "node:fs";

const result = await esbuild.build({
  entryPoints: [
    {in: 'src/index.js', out: 'index.bundle'},
    {in: 'src/worker.js', out: 'worker'}
  ],
  mangleProps: /_[a-zA-Z]*$/,
  mangleQuoted: true,
  drop: ["debugger"],
  metafile: true,
  minify: true,
  bundle: true,
  outdir: 'public',
  plugins: [wasmLoader()],
  external: ['node:https'],
  target: 'es2022',
  format: 'esm'
})

fs.writeFileSync('meta.json', JSON.stringify(result.metafile))
