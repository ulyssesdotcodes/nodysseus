import {describe, expect, test, beforeAll, beforeEach} from "@jest/globals" 
// import {IndependentNode, ioNode, staticNode, dependentNode, addInvalidation, NodysseusRuntime, ComputationNode, fromNode} from "./dependency-tree";
import {varNode, constNode, NodysseusRuntime, mapNode, AnyNode, compareObjectsNeq } from "./dependency-tree";
import generic from "../generic.js";
import { Graph } from "../types";
import { webClientStore } from "../editor/store";
import { objectRefStore } from "../store"
import { initStore, mapStore, nolib, nolibLib } from "../nodysseus";
import { Watch } from "typescript";
import { wrapPromise } from "../util";

import test_dependencies_min_not_working from "./test/test_dependencies_min_not_working.json"
import test_dependencies_working from "./test/test_dependencies_working.json"


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
    const runtime = new NodysseusRuntime("test", store, nolibLib);

    const node4 = runtime.constNode(4)

    const nodeAdd1 = runtime.mapNode({a: node4}, ({a}: {a: number}) => a + 1)

    expect(runtime.run(nodeAdd1)).toBe(5) 
  })

  test("connect 2 parents", () => {
    const runtime = new NodysseusRuntime("test", store, nolibLib);

    const node4 = runtime.constNode(4)
    const node2 = runtime.constNode(2)
    const nodeAdd = runtime.mapNode({a: node4, b: node2}, ({a, b}) => a + b)

    expect(runtime.run(nodeAdd)).toBe(6)
  });

  test("test caching", () => {
    const runtime = new NodysseusRuntime("test", store, nolibLib);

    let a = 0;
    const node2Cache = runtime.mapNode({}, () => {
      a += 1;
      return 2
    }, (p, n) => compareObjectsNeq(p, n) );

    expect(runtime.run(node2Cache)).toBe(2);
    expect(runtime.run(node2Cache)).toBe(2);
    expect(a).toBe(1);
  });

  test("test invalidation", () => {
    const runtime = new NodysseusRuntime("test", store, nolibLib);

    let cachedRunCount = 0;
    const io = runtime.varNode(0)
    const cachedNode = runtime.mapNode({a: io}, ({a}: {a: number}) => {
      cachedRunCount++;
      return a + 1;
    }, (p, n) => compareObjectsNeq(p, n));

    expect(runtime.run(cachedNode)).toBe(1);
    expect(cachedRunCount).toBe(1);

    expect(runtime.run(cachedNode)).toBe(1);
    expect(cachedRunCount).toBe(1);

    io.set(2);
    expect(runtime.run(cachedNode)).toBe(3);
    expect(cachedRunCount).toBe(2);
  })

  // TODO: uncomment for performance test
  // describe("test many", () => {
  //   let runtime, output, ioVal = 1, runcount = 0;
  //   beforeAll(() => {
  //     runtime = new NodysseusRuntime(store, nolibLib);
  //   })
  //
  //   test("first run", () => {
  //     const startNode: AnyNode<number> = runtime.ioNode(() => ioVal);
  //     const nodes = new Array(10000).fill(1).map<AnyNode<number>>(() => runtime.mapNode({a: startNode}, ({a}) => (runcount += 1, a)));
  //     output = runtime.mapNode(Object.fromEntries(nodes.map((n, i) => [i, n])) as Record<string, AnyNode<number>>, (nums: Record<string, number>) => Object.values(nums).reduce((acc, n) => acc + n, 0));
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
    const runtime = new NodysseusRuntime("test", store, nolibLib);
    const predicate = runtime.varNode("tNode");
    const trueNode = runtime.constNode("tNodeValue");
    const falseNode = runtime.constNode("fNodeValue");
    const bindNode = runtime.switchNode(predicate, {tNode: trueNode, fNode: falseNode});
    expect(runtime.run(bindNode)).toBe("tNodeValue")
    predicate.set("fNode");
    expect(runtime.run(bindNode)).toBe("fNodeValue")
  })

  // test("many bind node", () => {
  //   const runtime = new NodysseusRuntime(store, nolibLib);
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
    test("script node", async () => {
      const runtime = new NodysseusRuntime("test", store, nolibLib);

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

      const node = await wrapPromise(runtime.run(runtime.fromNode(graph, "testfn"))).then(nodeOutput =>  nodeOutput.value);

      expect(runtime.run(node)).toBe(4);
    });

    test("script inputs node", async () => {
      const runtime = new NodysseusRuntime("test", store, nolibLib);

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
      const gnode = runtime.fromNode(graph, "testinput");
      const node = await wrapPromise(runtime.run(gnode)).then(nodeOutput =>  nodeOutput.value);
      expect(runtime.run(node)).toBe(6);
    });

    test("return", async () => {
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

      const runtime = new NodysseusRuntime("test", store, nolibLib);
      const node = await wrapPromise(runtime.run(runtime.fromNode(graph, "testfn"))).then(nodeOutput =>  nodeOutput.value);
      expect(runtime.run(node)).toBe(4);
    })

    test("return args", async () => {
      const graph = {
        id: "testreturnargs",
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

      const runtime = new NodysseusRuntime("test", store, nolibLib);
      const node = await wrapPromise(runtime.run(runtime.fromNode(graph, "testfn"))).then(nodeOutput =>  nodeOutput.value);
      expect(runtime.run(node)).toBe(4);
    })
  })

  describe("extern", () => {
    test("single extern", async () => {
      const runtime = new NodysseusRuntime("test", store, nolibLib);
      const random = (await runtime.run(await runtime.fromNode(generic, "@math.random"))).value;
      const randomFn = runtime.run(random);
      expect(typeof randomFn === "function" && randomFn()).toBeGreaterThan(0)
    })

    describe("extern with args", () => {
      let runtime, addNode;
      beforeAll(async () => {
        runtime = new NodysseusRuntime("test", store, nolibLib);

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
        addNode = await runtime.runGraphNode(add, "add").value;

      });

      test("works", async () => {
        const first = await runtime.runNode(addNode);
        const second = await runtime.runNode(addNode)
        expect(second).toBe(6)
      });

      test("caches", () => {
        expect(runtime.run(addNode)).toBe(6)
      });
    })
  })

  describe("env", () => {
    let runtime, addNode, runCount = 0, internalVal = 1, argsNode;
    beforeAll(async () => {
      runtime = new NodysseusRuntime("test", store, nolibLib);

      argsNode = {val3: runtime.varNode(7)};

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
      addNode = (await runtime.run(await runtime.fromNode(add, "testfn", argsNode))).value;
    });

    test("works", async () => {
      expect(runtime.run(addNode)).toBe(11)
    });

    test("caches", async () => {
      expect(runtime.run(addNode)).toBe(11)
    });

    test("invalidates", async () => {
      argsNode.val3.set(8)
      expect(runtime.run(addNode)).toBe(12)
    })

  })

  describe("runnable", () => {
    test("can run runnable", async () => {
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

      const runtime = new NodysseusRuntime("test", store, nolibLib);

      const inval = {x: "A"}
      const closure = {input: runtime.varNode(inval)};
      const result = (await runtime.run(await runtime.fromNode(run_fn, "out", closure))).value;
      runtime.run(result)
      expect(inval.x).toBe("B")
    })
  })

  describe("@templates.simple", () => {
    let runtime, argsNode, htmlNode;
    beforeAll(async () => {
      runtime = new NodysseusRuntime("test", store, nolibLib);
      htmlNode = (await runtime.run(await runtime.fromNode(generic.nodes["@templates.simple"], "out"))).display;
    })

    test("create html", () => {
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

  describe("graph updates", () => {
    let runtime, argsNode, htmlNode, templateSimple;
    beforeEach(async () => {
      runtime = new NodysseusRuntime("test", store, nolibLib);
      argsNode = {_output: runtime.varNode("value")};
      templateSimple = {
        ...generic.nodes["@templates.simple"],
        id: "testhtml"
      }
      nolib.no.runtime.add_ref(templateSimple)
      htmlNode = (await runtime.run(await runtime.fromNode(templateSimple, "out", argsNode))).display;
    })

    test("create html", () => {
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

    test("update text node", () => {
      argsNode._output.set("display")
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
      nolib.no.runtime.add_node(templateSimple.id, {
        "id": "qgbinm2",
        "value": "Hello, again!",
        "ref": "@html.html_text"
      }, nolibLib)
      expect(runtime.run(htmlNode)).toMatchObject({
        "dom_type": "div",
        "props": {},
        "children": [
          {
            "dom_type": "text_value",
            "text": "Hello, again!"
          }
        ]
      });
    })
  })

  describe("@flow.default", () => {
    let runtime, ifGraph, argsNode;
    beforeAll(() => {
      runtime = new NodysseusRuntime("test", store, nolibLib);
      ifGraph = {
        id: "testdefault",
        nodes: {
          "otherwise": {
            id: "otherwise",
            value: "someval"
          },
          "noval": {
            id: "noval",
            ref: "arg",
            value: "nextval"
          },
          "outdefault": {
            id: "outdefault",
            ref: "@flow.default"
          }
        },
        edges: {
          "otherwise": {
            from: "otherwise",
            to: "outdefault",
            as: "otherwise"
          },
          "noval": {
            from: "noval",
            to: "outdefault",
            as: "value"
          }
        }
      }

      argsNode = {nextval: runtime.varNode("someotherval")};
    })


    test("change args", async () => {
      const runNode = (await runtime.run(runtime.fromNode(ifGraph, "outdefault", argsNode))).value;
      expect(runtime.run(runNode)).toBe("someotherval")

      argsNode.nextval.set(undefined)
      expect(runtime.run(runNode)).toBe("someval")
    })
  })


  describe("dependencies basic", () => {
    let runtime, graph, outputNode;

    beforeAll(async () => {
      runtime = new NodysseusRuntime("test", store, nolibLib);
      graph = test_dependencies_working;

      nolib.no.runtime.add_ref(graph)
      outputNode = (await runtime.run(await runtime.fromNode(graph, "out"))).display
    })

    test("change arg", () => {
      const initial = runtime.run(outputNode);
      expect(initial).toMatchSnapshot();
      nolib.no.runtime.add_node(graph.id, {
        "id": "mfsmjwy",
        "value": "xyz",
      }, nolibLib)
      const second = runtime.run(outputNode);
      expect(second).toMatchObject(initial);
      nolib.no.runtime.add_node(graph.id, {
        "id": "jhpw7dr",
        "value": "abcabc",
      }, nolibLib)
      const third = runtime.run(outputNode);
      expect(third).not.toMatchObject(initial);
    })

  })

  describe("dependencies with args", () => {
    let runtime, graph, outputNode;

    beforeAll(async () => {
      runtime = new NodysseusRuntime("test", store, nolibLib);
      graph = test_dependencies_min_not_working;

      nolib.no.runtime.add_ref(graph)
      outputNode = (await runtime.run(await runtime.fromNode(graph, "out"))).display
    })

    test("change arg", () => {
      const initial = runtime.run(outputNode);
      expect(initial).toMatchSnapshot();
      nolib.no.runtime.add_node(graph.id, {
        "id": "mfsmjwy",
        "value": "xyz",
      }, nolibLib)
      const second = runtime.run(outputNode);
      expect(second).toMatchObject(initial);
      nolib.no.runtime.add_node(graph.id, {
        "id": "jhpw7dr",
        "value": "abcabc",
      }, nolibLib)
      const third = runtime.run(outputNode);
      expect(third).not.toMatchObject(initial);
    })


  })
})
