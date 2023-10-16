import {describe, expect, test, beforeAll} from "@jest/globals" 
import {IndependentNode, ioNode, staticNode, dependentNode, addInvalidation, NodysseusRuntime, DependencyTreeNode, fromNode} from "./dependency-tree";
import generic from "../generic.js";
import { Graph } from "../types";
import { initStore } from "../nodysseus";


describe("dependency tree", () => {
  let store;
  beforeAll(() => {
    store = initStore();
  })

  test("connect nodes", () => {
    const node4: IndependentNode<number> = staticNode(4)

    const nodeAdd1: DependencyTreeNode<number, {"a": number}> = dependentNode({a: node4}, ({a}) => a + 1)

    const runtime = new NodysseusRuntime();
    runtime.add(nodeAdd1)
    expect(runtime.run(nodeAdd1.id)).toBe(5) 
  })

  test("connect 2 parents", () => {
    const node4: IndependentNode<number> = staticNode(4)
    const node2: IndependentNode<number> = staticNode(2)
    const nodeAdd: DependencyTreeNode<number, {"a": number, "b": number}> = dependentNode({a: node4, b: node2}, 
      ({a, b}) => a + b)
    const runtime = new NodysseusRuntime();

    runtime.add(nodeAdd)
    expect(runtime.run(nodeAdd.id)).toBe(6)
  });

  test("test caching", () => {
    let a = 0;
    const node2Cache: IndependentNode<number> = ioNode(() => {
      a += 1;
      return 2
    });

    const runtime = new NodysseusRuntime();
    runtime.add(node2Cache);

    expect(runtime.run(node2Cache.id)).toBe(2);
    expect(runtime.run(node2Cache.id)).toBe(2);
    expect(a).toBe(1);
  });

  test("test invalidation", () => {
    let ioVal = 0;
    let ioInvalidate;
    const node = addInvalidation(ioNode(() => ioVal), invalidate => ioInvalidate = invalidate);

    const runtime = new NodysseusRuntime();


    runtime.add(node);

    expect(runtime.run(node.id)).toBe(0);

    ioVal = 2
    expect(runtime.run(node.id)).toBe(0);

    ioInvalidate();
    expect(runtime.run(node.id)).toBe(2);
  })

  describe("test many", () => {
    let runtime, output, ioInvalidate, runcount = 0;
    beforeAll(() => {
      runtime = new NodysseusRuntime();
    })

    test("first run", () => {
      const startNode = addInvalidation(staticNode(1), invalidate => ioInvalidate = invalidate);
      const nodes = new Array(10000).fill(1).map(n => dependentNode({a: startNode}, () => (runcount += 1, n)));
      output = dependentNode(Object.fromEntries(nodes.map((n, i) => [i, n])), (nums) => Object.values(nums).reduce((acc, n) => acc + n, 0));

      runtime.add(output);

      expect(runtime.run(output.id)).toBe(10000);
      expect(runcount).toBe(10000);
      expect(runtime.run(output.id)).toBe(10000);
      expect(runcount).toBe(10000);
    });

    test("cached run", () => {
      expect(runtime.run(output.id)).toBe(10000);
      expect(runcount).toBe(10000);
    });

    test("invalidated run", () => {
      ioInvalidate();
      expect(runtime.run(output.id)).toBe(10000);
      expect(runcount).toBe(20000);
      expect(runtime.run(output.id)).toBe(10000);
      expect(runcount).toBe(20000);
    });
  })

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
      const node = fromNode(graph, "testfn", store)

      runtime.add(node);

      expect(runtime.run(node.id)).toBe(4);
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
      const node = fromNode(graph, "testinput", store);

      runtime.add(node);

      expect(runtime.run(node.id)).toBe(6);
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
      const node = fromNode(graph, "testfn", store);
      runtime.add(node);
      expect(runtime.run(node.id)).toBe(4);
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

      const runtime = new NodysseusRuntime();
      const node = fromNode(graph, "testfn", store);
      runtime.add(node);
      expect(runtime.run(node.id)).toBe(4);
    })
  })

  describe("extern", () => {
    test("single extern", () => {
      const runtime = new NodysseusRuntime();
      const random = fromNode(generic, "@math.random", store);
      runtime.add(random)
      const randomFn: () => number = runtime.run(random.id);
      expect(randomFn()).toBeGreaterThan(0)
    })

    describe("extern with args", () => {
      let runtime, addNode, invalidate;
      beforeAll(() => {
        runtime = new NodysseusRuntime();

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
        addNode = addInvalidation(fromNode(add, "add", store), inv => invalidate = inv);
      });

      test("works", () => {
        runtime.add(addNode);
        expect(runtime.run(addNode.id)).toBe(6)
      });

      test("caches", () => {
        expect(runtime.run(addNode.id)).toBe(6)
      });

      test("invalidates", () => {
        invalidate();
        expect(runtime.run(addNode.id)).toBe(6)
      })
    })
  })

  describe("env", () => {
    let runtime, addNode, invalidate, runCount = 0;
    beforeAll(() => {
      runtime = new NodysseusRuntime();

      const invalidationNode = addInvalidation(ioNode(() => {
        runCount++;
        return {val3: 6}
      }), inv => invalidate = inv)

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
      addNode = addInvalidation(fromNode(add, "testfn", invalidationNode as any), inv => invalidate = inv);
    });

    test("works", () => {
      runtime.add(addNode);
      expect(runtime.run(addNode.id)).toBe(10)
    });

    test("caches", () => {
      expect(runtime.run(addNode.id)).toBe(10)
    });

    test("invalidates", () => {
      invalidate();
      expect(runtime.run(addNode.id)).toBe(10)
      expect(runCount).toBe(2);
    })

  })
})
