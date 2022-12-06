import { initStore, nolib, run } from "./nodysseus"
import {expect, test} from "@jest/globals"

test('returning a single value', () => {
  const val = {A: "x"};
  const graph = {
    id: expect.getState().currentTestName,
    nodes: [
      {id: "value", value: JSON.stringify(val)},
      {id: "out", ref: "return"}
    ],
    edges: [
      {from: "value", to: "out", as: "value"}
    ]
  }
  
  expect(run({node: {graph, fn: "out", args: {}}, args: {}})).toEqual(val)
})

// test('caching', () => {
//   const graph = {
//     id: expect.getState().currentTestName,
//     nodes: [
//       {id: "st", ref: "cache"},
//       {id: "val", ref: "arg", value: "val"},
//       {id: "out", ref: "return"}
//     ],
//     edges: [
//       {from: "val", to: "st", as: "value"},
//       {from: "st", to: "out", as: "value"},
//     ]
//   }
//   const a = run({node: {graph, fn: "out", args: {}}, args: {val: {a: 'A'}}});
//   const b = run({node: {graph, fn: "out", args: {}}, args: {val: {b: 'B'}}});
//   expect(a).toBe(b)
// })

test('running a fn arg in sequence', () => {
  initStore()
  const ret_fn = {
    id: expect.getState().currentTestName + "ret_fn",
    out: "out",
    nodes: [
      {id: "input", ref: "arg", value: "input"},
      // {id: "setval", ref: "set_mutable", value: "x"},
      {id: "setval", ref: "script", value: "console.log('setting');  console.log('' + target); console.log('' + value); console.log('done set'); target.x = value;"},
      {id: "finalval", value: "B"},
      {id: "runnablefn", ref: "runnable"},
      {id: "out", ref: "return"}
    ],
    edges: [
      {from: "input", to: "setval", as: "target"},
      {from: "finalval", to: "setval", as: "value"},
      {from: "setval", to: "runnablefn", as: "fn"},
      {from: "runnablefn", to: "out", as: "value"},
    ]
  }

  const run_fn = {
    id: expect.getState().currentTestName,
    out: "out",
    nodes: [
      {id: "retfn", ref: expect.getState().currentTestName + "ret_fn"},
      {id: "apfn", ref: "ap"},
      // {id: "apfn", ref: "script", value: "console.log('hi'); return {}"},
      {id: "apfnargs"},
      {id: "apfninput", ref: "arg", value: "input"},
      {id: "seq", ref: "sequence"},
      {id: "apseqinput", ref: "arg", value: "input"},
      {id: "apseqargs"},
      {id: "apseq", ref: "ap"},
      {id: "apseqrun", value: "true"},
      {id: "logval", ref: "log"},
      {id: "out", ref: "return"}
    ],
    edges: [
      {from: "retfn", to: "apfn", as: "fn"},
      {from: "apfninput", to: "apfnargs", as: "input"},
      {from: "apfnargs", to: "apfn", as: "args"},
      {from: "apfn", to: "seq", as: "arg0"},
      {from: "seq", to: "apseq", as: "fn"},
      {from: "apseqrun", to: "apseq", as: "run"},
      {from: "apseqinput", to: "apseqargs", as: "input"},
      {from: "apseqargs", to: "apseq", as: "args"},
      {from: "apseq", to: "out", as: "value"},
    ]
  }

  const inval = {x: "A"}
  nolib.no.runtime?.add_ref(ret_fn);
  console.log(run({node: {graph: run_fn, fn: "out", args: {"input": inval}}}));
  expect(inval.x).toBe("B")
})

test('applying an fn twice', () => {
  initStore()
  const run_fn = {
    id: expect.getState().currentTestName,
    out: "out",
    nodes: [
      {id: "input", ref: "arg", value: "input"},
      {id: "setval", ref: "script", value: "target.x = value;"},
      {id: "finalval", value: "B"},
      {id: "runnablefn", ref: "runnable"},

      {id: "apfn", ref: "ap"},
      // {id: "apfn", ref: "script", value: "console.log('hi'); return {}"},
      {id: "apfnargs"},
      {id: "apfninput", ref: "arg", value: "input"},
      {id: "ap2fn", ref: "ap"},
      {id: "ap2fnrun", value: "true"},
      {id: "ap2fninput", ref: "arg", value: "input"},
      {id: "ap2fnargs"},
      {id: "out", ref: "return"}
    ],
    edges: [
      {from: "input", to: "setval", as: "target"},
      {from: "finalval", to: "setval", as: "value"},
      {from: "setval", to: "runnablefn", as: "fn"},
      {from: "runnablefn", to: "apfn", as: "fn"},
      {from: "apfninput", to: "apfnargs", as: "input"},
      {from: "apfnargs", to: "apfn", as: "args"},
      {from: "apfn", to: "ap2fn", as: "fn"},
      {from: "ap2fninput", to: "ap2fnargs", as: "input"},
      {from: "ap2fnrun", to: "ap2fn", as: "run"},
      {from: "ap2fnargs", to: "ap2fn", as: "args"},
      {from: "ap2fn", to: "out", as: "value"},
    ]
  }

  const inval = {x: "A"}
  run({node: {graph: run_fn, fn: "out", args: {"input": inval}}});
  expect(inval.x).toBe("B")
})

test('applying a fn once', () => {
  initStore()
  const run_fn = {
    id: expect.getState().currentTestName,
    out: "out",
    nodes: [
      {id: "input", ref: "arg", value: "input"},
      {id: "setval", ref: "script", value: "target.x = value;"},
      {id: "finalval", value: "B"},
      {id: "runnablefn", ref: "runnable"},

      {id: "apfn", ref: "ap"},
      // {id: "apfn", ref: "script", value: "console.log('hi'); return {}"},
      {id: "apfnargs"},
      {id: "apfninput", ref: "arg", value: "input"},
      {id: "apfnrun", value: "true"},
      {id: "out", ref: "return"}
    ],
    edges: [
      {from: "input", to: "setval", as: "target"},
      {from: "finalval", to: "setval", as: "value"},
      {from: "setval", to: "runnablefn", as: "fn"},
      {from: "runnablefn", to: "apfn", as: "fn"},
      {from: "apfninput", to: "apfnargs", as: "input"},
      {from: "apfnargs", to: "apfn", as: "args"},
      {from: "apfnrun", to: "apfn", as: "run"},
      {from: "apfn", to: "out", as: "value"},
    ]
  }

  const inval = {x: "A"}
  console.log(run({node: {graph: run_fn, fn: "out", args: {"input": inval}}}));
  expect(inval.x).toBe("B")
})
