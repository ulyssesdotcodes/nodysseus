import { initStore, nolib, run } from "./nodysseus"
import {expect, test} from "@jest/globals"
import {Graph} from "./types"

test('returning a single value', () => {
  const val = {A: "x"};
  const graph = {
    id: expect.getState().currentTestName,
    nodes: {
      value: {id: "value", value: JSON.stringify(val)},
      out: {id: "out", ref: "return"}
    },
    edges: {
      value: {from: "value", to: "out", as: "value"}
    }
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
  const ret_fn: Graph = {
    id: expect.getState().currentTestName + "ret_fn",
    out: "out",
    nodes: {
      input: {id: "input", ref: "arg", value: "input"},
      // setval: {id: "setval", ref: "set_mutable", value: "x"},
      setval: {id: "setval", ref: "script", value: "console.log('setting');  console.log('' + target); console.log('' + value); console.log('done set'); target.x = value;"},
      finalval: {id: "finalval", value: "B"},
      runnablefn: {id: "runnablefn", ref: "runnable"},
      out: {id: "out", ref: "return"}
    },
    edges: {
      input: {from: "input", to: "setval", as: "target"},
      finalval: {from: "finalval", to: "setval", as: "value"},
      setval: {from: "setval", to: "runnablefn", as: "fn"},
      runnablefn: {from: "runnablefn", to: "out", as: "value"},
    }
  }

  const run_fn = {
    id: expect.getState().currentTestName,
    out: "out",
    nodes: {
      retfn: {id: "retfn", ref: expect.getState().currentTestName + "ret_fn"},
      apfn: {id: "apfn", ref: "ap"},
      // apfn: {id: "apfn", ref: "script", value: "console.log('hi'); return {}"},
      apfnargs: {id: "apfnargs"},
      apfninput: {id: "apfninput", ref: "arg", value: "input"},
      seq: {id: "seq", ref: "sequence"},
      apseqinput: {id: "apseqinput", ref: "arg", value: "input"},
      apseqargs: {id: "apseqargs"},
      apseq: {id: "apseq", ref: "ap"},
      apseqrun: {id: "apseqrun", value: "true"},
      logval: {id: "logval", ref: "log"},
      out: {id: "out", ref: "return"}
    },
    edges: {
      retfn: {from: "retfn", to: "apfn", as: "fn"},
      apfninput: {from: "apfninput", to: "apfnargs", as: "input"},
      apfnargs: {from: "apfnargs", to: "apfn", as: "args"},
      apfn: {from: "apfn", to: "seq", as: "arg0"},
      seq: {from: "seq", to: "apseq", as: "fn"},
      apseqrun: {from: "apseqrun", to: "apseq", as: "run"},
      apseqinput: {from: "apseqinput", to: "apseqargs", as: "input"},
      apseqargs: {from: "apseqargs", to: "apseq", as: "args"},
      apseq: {from: "apseq", to: "out", as: "value"},
    }
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
    nodes: {
      input: {id: "input", ref: "arg", value: "input"},
      setval: {id: "setval", ref: "script", value: "target.x = value;"},
      finalval: {id: "finalval", value: "B"},
      runnablefn: {id: "runnablefn", ref: "runnable"},

      apfn: {id: "apfn", ref: "ap"},
      // apfn: {id: "apfn", ref: "script", value: "console.log('hi'); return {}"},
      apfnargs: {id: "apfnargs"},
      apfninput: {id: "apfninput", ref: "arg", value: "input"},
      ap2fn: {id: "ap2fn", ref: "ap"},
      ap2fnrun: {id: "ap2fnrun", value: "true"},
      ap2fninput: {id: "ap2fninput", ref: "arg", value: "input"},
      ap2fnargs: {id: "ap2fnargs"},
      out: {id: "out", ref: "return"}
    },
    edges: {
      input: {from: "input", to: "setval", as: "target"},
      finalval: {from: "finalval", to: "setval", as: "value"},
      setval: {from: "setval", to: "runnablefn", as: "fn"},
      runnablefn: {from: "runnablefn", to: "apfn", as: "fn"},
      apfninput: {from: "apfninput", to: "apfnargs", as: "input"},
      apfnargs: {from: "apfnargs", to: "apfn", as: "args"},
      apfn: {from: "apfn", to: "ap2fn", as: "fn"},
      ap2fninput: {from: "ap2fninput", to: "ap2fnargs", as: "input"},
      ap2fnrun: {from: "ap2fnrun", to: "ap2fn", as: "run"},
      ap2fnargs: {from: "ap2fnargs", to: "ap2fn", as: "args"},
      ap2fn: {from: "ap2fn", to: "out", as: "value"},
    }
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
    nodes: {
      input: {id: "input", ref: "arg", value: "input"},
      setval: {id: "setval", ref: "script", value: "target.x = value;"},
      finalval: {id: "finalval", value: "B"},
      runnablefn: {id: "runnablefn", ref: "runnable"},

      apfn: {id: "apfn", ref: "ap"},
      // apfn: {id: "apfn", ref: "script", value: "console.log('hi'); return {}"},
      apfnargs: {id: "apfnargs"},
      apfninput: {id: "apfninput", ref: "arg", value: "input"},
      apfnrun: {id: "apfnrun", value: "true"},
      out: {id: "out", ref: "return"}
    },
    edges: {
      input: {from: "input", to: "setval", as: "target"},
      finalval: {from: "finalval", to: "setval", as: "value"},
      setval: {from: "setval", to: "runnablefn", as: "fn"},
      runnablefn: {from: "runnablefn", to: "apfn", as: "fn"},
      apfninput: {from: "apfninput", to: "apfnargs", as: "input"},
      apfnargs: {from: "apfnargs", to: "apfn", as: "args"},
      apfnrun: {from: "apfnrun", to: "apfn", as: "run"},
      apfn: {from: "apfn", to: "out", as: "value"},
    }
  }

  const inval = {x: "A"}
  console.log(run({node: {graph: run_fn, fn: "out", args: {"input": inval}}}));
  expect(inval.x).toBe("B")
})
