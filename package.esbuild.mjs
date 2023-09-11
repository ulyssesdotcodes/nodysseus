import * as esbuild from 'esbuild'
import { wasmLoader } from 'esbuild-plugin-wasm';
import fs from "node:fs";

const result = await esbuild.build({
  entryPoints: [
    {in: 'src/index.js', out: 'index.bundle'},
    {in: 'src/worker.js', out: 'worker'},
    {in: 'src/sharedWorker.js', out: 'sharedWorker'},
    {in: 'src/exported.js', out: 'exported.bundle'}
  ],
  metafile: true,
  bundle: true,
  outdir: 'public',
  plugins: [wasmLoader()],
  external: ['node:https'],
  target: 'es2022',
  format: 'esm',
  minify: true,
  drop: ['console']
})

fs.writeFileSync('meta.json', JSON.stringify(result.metafile))
