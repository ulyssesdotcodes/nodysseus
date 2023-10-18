import {describe, expect, test, beforeAll} from "@jest/globals" 
// import {IndependentNode, ioNode, staticNode, dependentNode, addInvalidation, NodysseusRuntime, ComputationNode, fromNode} from "./dependency-tree";
import {ioNode, constNode, NodysseusRuntime, mapNode, WatchNode } from "./dependency-tree";
import generic from "../generic.js";
import { Graph } from "../types";
import { objectRefStore, webClientStore } from "../editor/store";
import { initStore, mapStore } from "../nodysseus";


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
    const runtime = new NodysseusRuntime();

    const node4 = runtime.constNode(4)

    const nodeAdd1 = runtime.mapNode({a: node4}, ({a}: {a: number}) => a + 1)

    expect(runtime.run(nodeAdd1)).toBe(5) 
  })

  test("connect 2 parents", () => {
    const runtime = new NodysseusRuntime();

    const node4 = runtime.constNode(4)
    const node2 = runtime.constNode(2)
    const nodeAdd = runtime.mapNode({a: node4, b: node2}, ({a, b}) => a + b)

    expect(runtime.run(nodeAdd)).toBe(6)
  });

  test("test caching", () => {
    const runtime = new NodysseusRuntime();

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
    const runtime = new NodysseusRuntime();

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
  //     runtime = new NodysseusRuntime();
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
    const runtime = new NodysseusRuntime();
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
  //   const runtime = new NodysseusRuntime();
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
      const runtime = new NodysseusRuntime();

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
      const node = runtime.fromNode(graph, "testfn", store)

      expect(runtime.run(node)).toBe(4);
    });

    test("script inputs node", () => {
      const runtime = new NodysseusRuntime();

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
      const node = runtime.fromNode(graph, "testinput", store);
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

      const runtime = new NodysseusRuntime();
      const node = runtime.fromNode(graph, "testfn", store);
      expect(runtime.run(node)).toBe(4);
    })
  //
  //   test("return args", () => {
  //     const graph = {
  //       id: "testreturn",
  //       out: "testfn",
  //       nodes: {
  //         "testfn": {
  //           id: "testfn",
  //           "ref": "return"
  //         },
  //         "valarg": {
  //           id: "valarg",
  //           ref: "arg",
  //           value: "val"
  //         },
  //         "args": {id: "args"},
  //         "val": {
  //           id: "val",
  //           value: "4"
  //         }
  //       },
  //       edges: {
  //         "val": {
  //           to: "args",
  //           from: "val",
  //           as: "val"
  //         },
  //         "valarg": {
  //           to: "testfn",
  //           from: "valarg",
  //           as: "value"
  //         },
  //         "args": {
  //           to: "testfn",
  //           from: "args",
  //           as: "args"
  //         }
  //       }
  //     }
  //
  //     const runtime = new NodysseusRuntime();
  //     const node = fromNode(graph, "testfn", store);
  //     runtime.add(node);
  //     expect(runtime.run(node.id)).toBe(4);
  //   })
  })
  //
  // describe("extern", () => {
  //   test("single extern", () => {
  //     const runtime = new NodysseusRuntime();
  //     const random = fromNode(generic, "@math.random", store);
  //     runtime.add(random)
  //     const randomFn: () => number = runtime.run(random.id);
  //     expect(randomFn()).toBeGreaterThan(0)
  //   })
  //
  //   describe("extern with args", () => {
  //     let runtime, addNode, invalidate;
  //     beforeAll(() => {
  //       runtime = new NodysseusRuntime();
  //
  //       const add: Graph = {
  //         id: "testadd",
  //         nodes: {
  //           "add": {
  //             id: "add",
  //             ref: "extern",
  //             value: "extern.add"
  //           },
  //           "val1": {
  //             id: "val1",
  //             value: "4"
  //           },
  //           "val2": {
  //             id: "val2",
  //             value: "2"
  //           }
  //         },
  //         edges: {
  //           "val1": {
  //             from: "val1",
  //             to: "add",
  //             as: "arg0"
  //           },
  //           "val2": {
  //             from: "val2",
  //             to: "add",
  //             as: "arg1"
  //           }
  //         }
  //       }
  //       addNode = addInvalidation(fromNode(add, "add", store), inv => invalidate = inv);
  //     });
  //
  //     test("works", () => {
  //       runtime.add(addNode);
  //       expect(runtime.run(addNode.id)).toBe(6)
  //     });
  //
  //     test("caches", () => {
  //       expect(runtime.run(addNode.id)).toBe(6)
  //     });
  //
  //     test("invalidates", () => {
  //       invalidate();
  //       expect(runtime.run(addNode.id)).toBe(6)
  //     })
  //   })
  // })
  //
  // describe("env", () => {
  //   let runtime, addNode, invalidate, runCount = 0;
  //   beforeAll(() => {
  //     runtime = new NodysseusRuntime();
  //
  //     const invalidationNode = addInvalidation(ioNode(() => {
  //       runCount++;
  //       return {val3: 6 + runCount}
  //     }), inv => invalidate = () => inv())
  //
  //     const add = {
  //       id: "testreturn",
  //       out: "testfn",
  //       nodes: {
  //         "testfn": {
  //           id: "testfn",
  //           ref: "return"
  //         },
  //         "add": {
  //           id: "add",
  //           ref: "extern",
  //           value: "extern.add",
  //         },
  //         "valarg": {
  //           id: "valarg",
  //           ref: "arg",
  //           value: "val"
  //         },
  //         "args": {id: "args"},
  //         "val": {
  //           id: "val",
  //           value: "4"
  //         },
  //         "envarg": {
  //           id: "envarg",
  //           ref: "arg",
  //           value: "val3"
  //         }
  //       },
  //       edges: {
  //         "val": {
  //           to: "args",
  //           from: "val",
  //           as: "val"
  //         },
  //         "valarg": {
  //           to: "add",
  //           from: "valarg",
  //           as: "arg0"
  //         },
  //         "envarg": {
  //           to: "add",
  //           from: "envarg",
  //           as: "arg1"
  //         },
  //         "add": {
  //           from: "add",
  //           to: "testfn",
  //           as: "value"
  //         },
  //         "args": {
  //           to: "testfn",
  //           from: "args",
  //           as: "args"
  //         }
  //       }
  //     }
  //     addNode = addInvalidation(fromNode(add, "testfn", store, invalidationNode as any), inv => invalidate = inv);
  //     runtime.add(addNode);
  //   });
  //
  //   test("works", () => {
  //     expect(runtime.run(addNode.id)).toBe(11)
  //   });
  //
  //   test("caches", () => {
  //     expect(runtime.run(addNode.id)).toBe(11)
  //   });
  //
  //   test("invalidates", () => {
  //     invalidate();
  //     expect(runtime.run(addNode.id)).toBe(12)
  //     expect(runCount).toBe(2);
  //   })
  //
  // })
  //
  // describe("html", () => {
  //   let runtime
  //   beforeAll(() => {
  //     runtime = new NodysseusRuntime();
  //   })
  //
  //   test("create html", () => {
  //
  //     const htmlNode = fromNode(generic.nodes["@templates.simple"], "out", store);
  //     runtime.add(htmlNode);
  //     const testres = runtime.run(htmlNode.id, {_output: "display"});
  //     expect(testres).toBe({tag: "div", children: [{tag: "text_value", text: "Hello, world!"}]});
  //   });
  // })
})
