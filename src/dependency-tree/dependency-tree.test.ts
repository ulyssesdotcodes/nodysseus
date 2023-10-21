import {describe, expect, test, beforeAll} from "@jest/globals" 
// import {IndependentNode, ioNode, staticNode, dependentNode, addInvalidation, NodysseusRuntime, ComputationNode, fromNode} from "./dependency-tree";
import {ioNode, constNode, NodysseusRuntime, mapNode, WatchNode } from "./dependency-tree";
import generic from "../generic.js";
import { Graph } from "../types";
import { objectRefStore, webClientStore } from "../editor/store";
import { initStore, mapStore } from "../nodysseus";
import { Watch } from "typescript";


describe("dependency tree", () => {
  let store;
  beforeAll(async () => {
    store = {
      refs: objectRefStore({}),
      persist: mapStore(),
      state: mapStore(),
      parents: mapStore(),
      fns: mapStore(),
      assets: mapStore(),
    }
    initStore(store);
  })

  test("connect nodes", () => {
    const runtime = new NodysseusRuntime(store);

    const node4 = runtime.constNode(4)

    const nodeAdd1 = runtime.mapNode({a: node4}, ({a}: {a: number}) => a + 1)

    expect(runtime.run(nodeAdd1)).toBe(5) 
  })

  test("connect 2 parents", () => {
    const runtime = new NodysseusRuntime(store);

    const node4 = runtime.constNode(4)
    const node2 = runtime.constNode(2)
    const nodeAdd = runtime.mapNode({a: node4, b: node2}, ({a, b}) => a + b)

    expect(runtime.run(nodeAdd)).toBe(6)
  });

  test("test caching", () => {
    const runtime = new NodysseusRuntime(store);

    let a = 0;
    const node2Cache = runtime.mapNode({}, () => {
      a += 1;
      return 2
    });

    expect(runtime.run(node2Cache)).toBe(2);
    expect(runtime.run(node2Cache)).toBe(2);
    expect(a).toBe(1);
  });

  test("test invalidation", () => {
    const runtime = new NodysseusRuntime(store);

    let ioVal = 0, cachedRunCount = 0;
    const io = runtime.ioNode(() => {
      return ioVal;
    })
    const cachedNode = runtime.mapNode({a: io}, ({a}) => {
      cachedRunCount++;
      return a + 1;
    });

    expect(runtime.run(cachedNode)).toBe(1);
    expect(cachedRunCount).toBe(1);

    expect(runtime.run(cachedNode)).toBe(1);
    expect(cachedRunCount).toBe(1);

    ioVal = 2
    expect(runtime.run(cachedNode)).toBe(3);
    expect(cachedRunCount).toBe(2);
  })

  // TODO: uncomment for performance test
  // describe("test many", () => {
  //   let runtime, output, ioVal = 1, runcount = 0;
  //   beforeAll(() => {
  //     runtime = new NodysseusRuntime(store);
  //   })
  //
  //   test("first run", () => {
  //     const startNode: WatchNode<number> = runtime.ioNode(() => ioVal);
  //     const nodes = new Array(10000).fill(1).map<WatchNode<number>>(() => runtime.mapNode({a: startNode}, ({a}) => (runcount += 1, a)));
  //     output = runtime.mapNode(Object.fromEntries(nodes.map((n, i) => [i, n])) as Record<string, WatchNode<number>>, (nums: Record<string, number>) => Object.values(nums).reduce((acc, n) => acc + n, 0));
  //
  //     expect(runtime.run(output)).toBe(10000);
  //     expect(runcount).toBe(10000);
  //     expect(runtime.run(output)).toBe(10000);
  //     expect(runcount).toBe(10000);
  //   });
  //
  //   test("cached run", () => {
  //     expect(runtime.run(output)).toBe(10000);
  //     expect(runcount).toBe(10000);
  //   });
  //
  //   test("invalidated run", () => {
  //     ioVal = 2;
  //     expect(runtime.run(output)).toBe(20000);
  //     expect(runcount).toBe(20000);
  //     expect(runtime.run(output)).toBe(20000);
  //     expect(runcount).toBe(20000);
  //   });
  // })

  test("bind node", () => {
    const runtime = new NodysseusRuntime(store);
    let key = "tNode";
    const predicate = runtime.ioNode(() => {
      return key
    });
    const trueNode = runtime.constNode("tNodeValue");
    const falseNode = runtime.constNode("fNodeValue");
    const bindNode = runtime.switchNode(predicate, {tNode: trueNode, fNode: falseNode});
    expect(runtime.run(bindNode)).toBe("tNodeValue")
    key = "fNode";
    expect(runtime.run(bindNode)).toBe("fNodeValue")
  })

  // test("many bind node", () => {
  //   const runtime = new NodysseusRuntime(store);
  //   for(let i = 0; i < 10000; i++) {
  //     let key = "tNode";
  //     const predicate = runtime.ioNode(() => {
  //       return key
  //     });
  //     const trueNode = runtime.constNode("tNodeValue");
  //     const falseNode = runtime.constNode("fNodeValue");
  //     const bindNode = runtime.switchNode(predicate, {tNode: trueNode, fNode: falseNode});
  //     expect(runtime.run(bindNode)).toBe("tNodeValue")
  //     key = "fNode";
  //     expect(runtime.run(bindNode)).toBe("fNodeValue")
  //   }
  // })

  describe("test nodysseus", () => {
    test("script node", () => {
      const runtime = new NodysseusRuntime(store);

      const graph = {
        id: "testgraph",
        out: "testfn",
        nodes: {
          testfn: {
            id: "testfn",
            ref: "@js.script",
            value: "return 4"
          }        
        },
        edges: {}
      }
      const node = runtime.fromNode(graph, "testfn", store) as WatchNode<unknown>

      expect(runtime.run(node)).toBe(4);
    });

    test("script inputs node", () => {
      const runtime = new NodysseusRuntime(store);

      const graph = {
        id: "testgraph",
        out: "testfn",
        nodes: {
          testfn: {
            id: "testfn",
            ref: "@js.script",
            value: "return 4"
          },
          testinput: {
            id: "testinput",
            ref: "@js.script",
            value: "return input + 2"
          },
        },
        edges: {
          "testfn": {
            "from": "testfn",
            "to": "testinput",
            "as": "input"
          }
        }
      }
      const node = runtime.fromNode(graph, "testinput", store) as WatchNode<unknown>;
      expect(runtime.run(node)).toBe(6);
    });

    test("return", () => {
      const graph = {
        id: "testreturn",
        out: "testfn",
        nodes: {
          "testfn": {
            "id": "testfn",
            "ref": "return"
          },
          "val": {
            id: "val",
            value: "4"
          }
        },
        edges: {
          "val": {
            to: "testfn",
            from: "val",
            as: "value"
          }
        }
      }

      const runtime = new NodysseusRuntime(store);
      const node = runtime.fromNode(graph, "testfn", store) as WatchNode<unknown>;
      expect(runtime.run(node)).toBe(4);
    })

    test("return args", () => {
      const graph = {
        id: "testreturn",
        out: "testfn",
        nodes: {
          "testfn": {
            id: "testfn",
            "ref": "return"
          },
          "valarg": {
            id: "valarg",
            ref: "arg",
            value: "val"
          },
          "args": {id: "args"},
          "val": {
            id: "val",
            value: "4"
          }
        },
        edges: {
          "val": {
            to: "args",
            from: "val",
            as: "val"
          },
          "valarg": {
            to: "testfn",
            from: "valarg",
            as: "value"
          },
          "args": {
            to: "testfn",
            from: "args",
            as: "args"
          }
        }
      }

      const runtime = new NodysseusRuntime(store);
      const node = runtime.fromNode(graph, "testfn", store) as WatchNode<unknown>;
      expect(runtime.run(node)).toBe(4);
    })
  })

  describe("extern", () => {
    test("single extern", () => {
      const runtime = new NodysseusRuntime(store);
      const random = runtime.fromNode<() => number, Record<string, unknown>>(generic, "@math.random", store) as WatchNode<unknown>;
      const randomFn = runtime.run(random);
      expect(typeof randomFn === "function" && randomFn()).toBeGreaterThan(0)
    })

    describe("extern with args", () => {
      let runtime, addNode;
      beforeAll(() => {
        runtime = new NodysseusRuntime(store);

        const add: Graph = {
          id: "testadd",
          nodes: {
            "add": {
              id: "add",
              ref: "extern",
              value: "extern.add"
            },
            "val1": {
              id: "val1",
              value: "4"
            },
            "val2": {
              id: "val2",
              value: "2"
            }
          },
          edges: {
            "val1": {
              from: "val1",
              to: "add",
              as: "arg0"
            },
            "val2": {
              from: "val2",
              to: "add",
              as: "arg1"
            }
          }
        }
        addNode = runtime.fromNode(add, "add", store);
      });

      test("works", () => {
        expect(runtime.run(addNode)).toBe(6)
      });

      test("caches", () => {
        expect(runtime.run(addNode)).toBe(6)
      });
    })
  })

  describe("env", () => {
    let runtime, addNode, runCount = 0, internalVal = 1;
    beforeAll(() => {
      runtime = new NodysseusRuntime(store);

      const argsNode = runtime.ioNode(() => {
        runCount++;
        return {val3: 6 + internalVal}
      });

      const add = {
        id: "testreturn",
        out: "testfn",
        nodes: {
          "testfn": {
            id: "testfn",
            ref: "return"
          },
          "add": {
            id: "add",
            ref: "extern",
            value: "extern.add",
          },
          "valarg": {
            id: "valarg",
            ref: "arg",
            value: "val"
          },
          "args": {id: "args"},
          "val": {
            id: "val",
            value: "4"
          },
          "envarg": {
            id: "envarg",
            ref: "arg",
            value: "val3"
          }
        },
        edges: {
          "val": {
            to: "args",
            from: "val",
            as: "val"
          },
          "valarg": {
            to: "add",
            from: "valarg",
            as: "arg0"
          },
          "envarg": {
            to: "add",
            from: "envarg",
            as: "arg1"
          },
          "add": {
            from: "add",
            to: "testfn",
            as: "value"
          },
          "args": {
            to: "testfn",
            from: "args",
            as: "args"
          }
        }
      }
      addNode = runtime.fromNode(add, "testfn", store, argsNode)
    });

    test("works", () => {
      expect(runtime.run(addNode)).toBe(11)
    });

    test("caches", () => {
      expect(runtime.run(addNode)).toBe(11)
    });

    test("invalidates", () => {
      internalVal = 2;
      expect(runtime.run(addNode)).toBe(12)
    })

  })

  describe("runnable", () => {
    test("can run runnable", () => {
      const run_fn = {
        id: "runfn",
        out: "out",
        nodes: {
          input: {id: "input", ref: "arg", value: "input"},
          setval: {id: "setval", ref: "@js.script", value: "target.x = value;"},
          finalval: {id: "finalval", value: "B"},
          runnablefn: {id: "runnablefn", ref: "@flow.runnable"},

          apfn: {id: "apfn", ref: "@flow.ap"},
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
        },
        edges_in: {}
      }

      const runtime = new NodysseusRuntime(store);

      const inval = {x: "A"}
      const closure = runtime.varNode({input: inval});
      const result = runtime.fromNode(run_fn, "out", closure) as WatchNode<unknown>;
      runtime.run(result)
      expect(inval.x).toBe("B")
    })
  })

  describe("html", () => {
    let runtime, argsNode, htmlNode;
    beforeAll(() => {
      runtime = new NodysseusRuntime(store);
      argsNode = runtime.varNode({_output: "value"})
      htmlNode = runtime.fromNode(generic.nodes["@templates.simple"], "out", store, argsNode);
    })

    test("setup value", () => {
      expect(runtime.run(htmlNode)).toBe("some output");
    })

    test("create html", () => {
      argsNode.set({_output: "display"})
      expect(runtime.run(htmlNode)).toMatchObject({
        "dom_type": "div",
        "props": {},
        "children": [
          {
            "dom_type": "text_value",
            "text": "Hello, world!"
          }
        ]
      });
    });

    test("cache html", () => {
      expect(runtime.run(htmlNode)).toMatchObject({
        "dom_type": "div",
        "props": {},
        "children": [
          {
            "dom_type": "text_value",
            "text": "Hello, world!"
          }
        ]
      });
    })
  })
})
