import * as esbuild from 'esbuild'
import { wasmLoader } from 'esbuild-plugin-wasm';

await esbuild.build({
  entryPoints: [
    {in: 'src/index.js', out: 'index.bundle'},
    {in: 'src/worker.js', out: 'worker'}
  ],
  bundle: true,
  outdir: 'public',
  plugins: [wasmLoader()],
  external: ['node:https'],
  sourcemap: true,
  target: 'es2022',
  format: 'esm'
})
