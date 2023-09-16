import * as esbuild from 'esbuild'
import { wasmLoader } from 'esbuild-plugin-wasm';
import fs from "node:fs";

const result = await esbuild.build({
  entryPoints: [
    {in: 'src/index.js', out: 'index.bundle'},
    {in: 'src/worker.js', out: 'worker'},
    {in: 'src/sharedWorker.ts', out: 'sharedWorker'},
    {in: 'src/browser-esm.js', out: 'browser-esm'}
  ],
  metafile: true,
  bundle: true,
  outdir: 'public',
  plugins: [wasmLoader()],
  external: ['node:https'],
  target: 'es2022',
  format: 'esm',
  minify: true,
  drop: ['console'],
  splitting: true
})

fs.writeFileSync('meta.json', JSON.stringify(result.metafile))
