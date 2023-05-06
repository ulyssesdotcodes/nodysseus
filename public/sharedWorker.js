var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// src/types.ts
var isNodeRef;
var init_types = __esm({
  "src/types.ts"() {
    isNodeRef = (n) => n && !!n?.ref;
  }
});

// src/util.ts
var WRAPPED_KIND, ispromise, isWrappedPromise, tryCatch, wrapPromise, ancestor_graph;
var init_util = __esm({
  "src/util.ts"() {
    init_types();
    WRAPPED_KIND = "wrapped";
    ispromise = (a) => a && typeof a.then === "function" && !isWrappedPromise(a);
    isWrappedPromise = (a) => a && a.__kind === WRAPPED_KIND;
    tryCatch = (fn, t, c) => {
      try {
        return fn(t);
      } catch (e) {
        if (c) {
          return wrapPromise(c(e));
        }
        throw e;
      }
    };
    wrapPromise = (t, c) => isWrappedPromise(t) ? t : {
      __kind: WRAPPED_KIND,
      then: (fn) => wrapPromise(ispromise(t) ? c ? t.then(fn).catch(c) : t.then(fn) : tryCatch(fn, t, c)),
      value: t
    };
    ancestor_graph = (node_id, from_graph, nolib2) => {
      let edges_in;
      let queue = [node_id];
      const graph = { ...from_graph, nodes: {}, edges: {}, edges_in: {} };
      while (queue.length > 0) {
        let node_id2 = queue.pop();
        graph.nodes[node_id2] = { ...from_graph.nodes[node_id2] };
        edges_in = (from_graph.edges_in?.[node_id2] ? Object.values(from_graph.edges_in[node_id2]) : Object.values(from_graph.edges).filter((e) => e.to === node_id2)).filter((e) => from_graph.nodes[e.from] && !graph.nodes[e.from]);
        graph.edges = Object.assign(graph.edges, Object.fromEntries(edges_in.map((e) => [e.from, e])));
        graph.edges_in[node_id2] = Object.fromEntries(edges_in.map((e) => [e.from, e]));
        edges_in.forEach((e) => queue.push(e.from));
      }
      return graph;
    };
  }
});

// node_modules/idb/build/wrap-idb-value.js
function getIdbProxyableTypes() {
  return idbProxyableTypes || (idbProxyableTypes = [
    IDBDatabase,
    IDBObjectStore,
    IDBIndex,
    IDBCursor,
    IDBTransaction
  ]);
}
function getCursorAdvanceMethods() {
  return cursorAdvanceMethods || (cursorAdvanceMethods = [
    IDBCursor.prototype.advance,
    IDBCursor.prototype.continue,
    IDBCursor.prototype.continuePrimaryKey
  ]);
}
function promisifyRequest(request) {
  const promise = new Promise((resolve, reject) => {
    const unlisten = () => {
      request.removeEventListener("success", success);
      request.removeEventListener("error", error);
    };
    const success = () => {
      resolve(wrap(request.result));
      unlisten();
    };
    const error = () => {
      reject(request.error);
      unlisten();
    };
    request.addEventListener("success", success);
    request.addEventListener("error", error);
  });
  promise.then((value) => {
    if (value instanceof IDBCursor) {
      cursorRequestMap.set(value, request);
    }
  }).catch(() => {
  });
  reverseTransformCache.set(promise, request);
  return promise;
}
function cacheDonePromiseForTransaction(tx) {
  if (transactionDoneMap.has(tx))
    return;
  const done = new Promise((resolve, reject) => {
    const unlisten = () => {
      tx.removeEventListener("complete", complete);
      tx.removeEventListener("error", error);
      tx.removeEventListener("abort", error);
    };
    const complete = () => {
      resolve();
      unlisten();
    };
    const error = () => {
      reject(tx.error || new DOMException("AbortError", "AbortError"));
      unlisten();
    };
    tx.addEventListener("complete", complete);
    tx.addEventListener("error", error);
    tx.addEventListener("abort", error);
  });
  transactionDoneMap.set(tx, done);
}
function replaceTraps(callback) {
  idbProxyTraps = callback(idbProxyTraps);
}
function wrapFunction(func) {
  if (func === IDBDatabase.prototype.transaction && !("objectStoreNames" in IDBTransaction.prototype)) {
    return function(storeNames, ...args) {
      const tx = func.call(unwrap(this), storeNames, ...args);
      transactionStoreNamesMap.set(tx, storeNames.sort ? storeNames.sort() : [storeNames]);
      return wrap(tx);
    };
  }
  if (getCursorAdvanceMethods().includes(func)) {
    return function(...args) {
      func.apply(unwrap(this), args);
      return wrap(cursorRequestMap.get(this));
    };
  }
  return function(...args) {
    return wrap(func.apply(unwrap(this), args));
  };
}
function transformCachableValue(value) {
  if (typeof value === "function")
    return wrapFunction(value);
  if (value instanceof IDBTransaction)
    cacheDonePromiseForTransaction(value);
  if (instanceOfAny(value, getIdbProxyableTypes()))
    return new Proxy(value, idbProxyTraps);
  return value;
}
function wrap(value) {
  if (value instanceof IDBRequest)
    return promisifyRequest(value);
  if (transformCache.has(value))
    return transformCache.get(value);
  const newValue = transformCachableValue(value);
  if (newValue !== value) {
    transformCache.set(value, newValue);
    reverseTransformCache.set(newValue, value);
  }
  return newValue;
}
var instanceOfAny, idbProxyableTypes, cursorAdvanceMethods, cursorRequestMap, transactionDoneMap, transactionStoreNamesMap, transformCache, reverseTransformCache, idbProxyTraps, unwrap;
var init_wrap_idb_value = __esm({
  "node_modules/idb/build/wrap-idb-value.js"() {
    instanceOfAny = (object, constructors) => constructors.some((c) => object instanceof c);
    cursorRequestMap = /* @__PURE__ */ new WeakMap();
    transactionDoneMap = /* @__PURE__ */ new WeakMap();
    transactionStoreNamesMap = /* @__PURE__ */ new WeakMap();
    transformCache = /* @__PURE__ */ new WeakMap();
    reverseTransformCache = /* @__PURE__ */ new WeakMap();
    idbProxyTraps = {
      get(target, prop, receiver) {
        if (target instanceof IDBTransaction) {
          if (prop === "done")
            return transactionDoneMap.get(target);
          if (prop === "objectStoreNames") {
            return target.objectStoreNames || transactionStoreNamesMap.get(target);
          }
          if (prop === "store") {
            return receiver.objectStoreNames[1] ? void 0 : receiver.objectStore(receiver.objectStoreNames[0]);
          }
        }
        return wrap(target[prop]);
      },
      set(target, prop, value) {
        target[prop] = value;
        return true;
      },
      has(target, prop) {
        if (target instanceof IDBTransaction && (prop === "done" || prop === "store")) {
          return true;
        }
        return prop in target;
      }
    };
    unwrap = (value) => reverseTransformCache.get(value);
  }
});

// node_modules/idb/build/index.js
function openDB(name, version, { blocked, upgrade, blocking, terminated } = {}) {
  const request = indexedDB.open(name, version);
  const openPromise = wrap(request);
  if (upgrade) {
    request.addEventListener("upgradeneeded", (event) => {
      upgrade(wrap(request.result), event.oldVersion, event.newVersion, wrap(request.transaction), event);
    });
  }
  if (blocked) {
    request.addEventListener("blocked", (event) => blocked(
      // Casting due to https://github.com/microsoft/TypeScript-DOM-lib-generator/pull/1405
      event.oldVersion,
      event.newVersion,
      event
    ));
  }
  openPromise.then((db) => {
    if (terminated)
      db.addEventListener("close", () => terminated());
    if (blocking) {
      db.addEventListener("versionchange", (event) => blocking(event.oldVersion, event.newVersion, event));
    }
  }).catch(() => {
  });
  return openPromise;
}
function getMethod(target, prop) {
  if (!(target instanceof IDBDatabase && !(prop in target) && typeof prop === "string")) {
    return;
  }
  if (cachedMethods.get(prop))
    return cachedMethods.get(prop);
  const targetFuncName = prop.replace(/FromIndex$/, "");
  const useIndex = prop !== targetFuncName;
  const isWrite = writeMethods.includes(targetFuncName);
  if (
    // Bail if the target doesn't exist on the target. Eg, getAll isn't in Edge.
    !(targetFuncName in (useIndex ? IDBIndex : IDBObjectStore).prototype) || !(isWrite || readMethods.includes(targetFuncName))
  ) {
    return;
  }
  const method = async function(storeName, ...args) {
    const tx = this.transaction(storeName, isWrite ? "readwrite" : "readonly");
    let target2 = tx.store;
    if (useIndex)
      target2 = target2.index(args.shift());
    return (await Promise.all([
      target2[targetFuncName](...args),
      isWrite && tx.done
    ]))[0];
  };
  cachedMethods.set(prop, method);
  return method;
}
var readMethods, writeMethods, cachedMethods;
var init_build = __esm({
  "node_modules/idb/build/index.js"() {
    init_wrap_idb_value();
    init_wrap_idb_value();
    readMethods = ["get", "getKey", "getAll", "getAllKeys", "count"];
    writeMethods = ["put", "add", "delete", "clear"];
    cachedMethods = /* @__PURE__ */ new Map();
    replaceTraps((oldTraps) => ({
      ...oldTraps,
      get: (target, prop, receiver) => getMethod(target, prop) || oldTraps.get(target, prop, receiver),
      has: (target, prop) => !!getMethod(target, prop) || oldTraps.has(target, prop)
    }));
  }
});

// src/generic.js
var generic, generic_default;
var init_generic = __esm({
  "src/generic.js"() {
    generic = {
      "id": "generic",
      "nodes": {
        "@templates.simple": {
          "id": "@templates.simple",
          "out": "out",
          "category": "templates",
          "edges": {
            "qgbinm2": {
              "from": "qgbinm2",
              "to": "8dy573e",
              "as": "children"
            },
            "8dy573e": {
              "from": "8dy573e",
              "to": "out",
              "as": "display"
            },
            "output_val": {
              "from": "output_val",
              "to": "out",
              "as": "value"
            },
            "args": {
              "from": "args",
              "to": "out",
              "as": "args"
            }
          },
          "nodes": {
            "args": {
              "id": "args"
            },
            "qgbinm2": {
              "id": "qgbinm2",
              "value": "Hello, world!",
              "ref": "@html.html_text"
            },
            "8dy573e": {
              "id": "8dy573e",
              "ref": "@html.html_element"
            },
            "output_val": {
              "id": "output_val",
              "value": "some output"
            },
            "out": {
              "id": "out",
              "ref": "return",
              "name": "@templates.simple"
            }
          }
        },
        "@debug.log": {
          "id": "@debug.log",
          "description": "Prints value to console.log",
          "category": "debug",
          "out": "out",
          "nodes": {
            "in": {
              "id": "in"
            },
            "value": {
              "id": "value",
              "ref": "arg",
              "value": "value"
            },
            "graph_value": {
              "id": "graph_value",
              "ref": "arg",
              "value": "__graph_value"
            },
            "out": {
              "id": "out",
              "args": [],
              "ref": "@js.script",
              "value": "graph_value ? console.log(graph_value, value) : console.log(value); return value",
              "name": "@debug.log"
            }
          },
          "edges": [
            {
              "from": "in",
              "to": "out",
              "as": "input",
              "type": "ref"
            },
            {
              "from": "graph_value",
              "to": "out",
              "as": "graph_value"
            },
            {
              "from": "value",
              "to": "out",
              "as": "value"
            }
          ]
        },
        "@math.math": {
          "id": "@math.math",
          "category": "math",
          "ref": "extern",
          "value": "extern.math"
        },
        "@debug.expect": {
          "id": "@debug.expect",
          "category": "debug",
          "ref": "extern",
          "value": "extern.expect"
        },
        "@network.fetch": {
          "id": "@network.fetch",
          "category": "network",
          "name": "fetch",
          "description": "Uses the <a target='_blank' href='https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API'>Fetch API</a> to get data.",
          "ref": "extern",
          "value": "extern.fetch"
        },
        "@js.call": {
          "id": "@js.call",
          "name": "call",
          "category": "js",
          "description": "Calls `self.fn` with `args`. If `self is not found, uses the node's context.",
          "ref": "extern",
          "value": "extern.call"
        },
        "@data.stringify": {
          "id": "@data.stringify",
          "name": "stringify",
          "category": "data",
          "description": "<a target='_blank' href='https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify'>JSON.stringify</a> the `value` argument",
          "ref": "extern",
          "value": "extern.stringify"
        },
        "@data.parse": {
          "id": "@data.parse",
          "name": "parse",
          "category": "data",
          "description": "<a target='_blank' href='https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify'>JSON.parse</a> the `value` argument",
          "ref": "extern",
          "value": "extern.parse"
        },
        "@math.add": {
          "id": "@math.add",
          "ref": "extern",
          "category": "math",
          "value": "extern.add",
          "description": "The javascript <a target='_blank' href='https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Addition'>+ operator</a>"
        },
        "@math.mult": {
          "id": "@math.mult",
          "ref": "extern",
          "value": "extern.mult",
          "category": "math",
          "description": "The javascript <a target='_blank' href='https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Multiplication'>* operator</a>"
        },
        "@math.divide": {
          "id": "@math.divide",
          "ref": "extern",
          "value": "extern.divide",
          "category": "math",
          "description": "The javascript <a target='_blank' href='https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Division'>/ operator</a>"
        },
        "@math.negate": {
          "id": "@math.negate",
          "ref": "extern",
          "value": "extern.negate",
          "category": "math",
          "description": "The javascript <a target='_blank' href='https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Subtraction'>- operator</a>"
        },
        "@math.and": {
          "id": "@math.and",
          "ref": "extern",
          "value": "extern.and",
          "category": "math",
          "description": "The javascript <a target='_blank' href='https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Logical_AND'>&& operator</a>"
        },
        "@math.convertAngle": {
          "id": "@math.and",
          "ref": "extern",
          "value": "extern.convertAngle",
          "category": "math",
          "description": "Convert either degrees or radians to the other one."
        },
        "@math.random": {
          "id": "@math.random",
          "category": "math",
          "out": "out",
          "nodes": {
            "args": {
              "id": "args"
            },
            "output_val": {
              "id": "output_val",
              "value": "\n    return function() {\n      var t = a += 0x6D2B79F5;\n      t = Math.imul(t ^ t >>> 15, t | 1);\n      t ^= t + Math.imul(t ^ t >>> 7, t | 61);\n      return ((t ^ t >>> 14) >>> 0) / 4294967296;\n    }\n",
              "ref": "@js.script"
            },
            "out": {
              "id": "out",
              "ref": "return",
              "name": "@math.random"
            },
            "2a5n0mp": {
              "id": "2a5n0mp",
              "name": "128"
            },
            "4twtzbr": {
              "id": "4twtzbr",
              "value": "seed",
              "ref": "arg"
            },
            "t9tt2mz": {
              "id": "t9tt2mz",
              "name": "4"
            }
          },
          "edges": {
            "output_val": {
              "from": "output_val",
              "to": "out",
              "as": "value"
            },
            "args": {
              "from": "args",
              "to": "out",
              "as": "args"
            },
            "2a5n0mp": {
              "from": "2a5n0mp",
              "to": "args",
              "as": "seed"
            },
            "4twtzbr": {
              "from": "4twtzbr",
              "to": "output_val",
              "as": "a"
            },
            "t9tt2mz": {
              "from": "t9tt2mz",
              "to": "args",
              "as": "seedb"
            }
          }
        },
        "@js.typeof": {
          "id": "@js.typeof",
          "ref": "extern",
          "category": "js",
          "value": "extern.typeofvalue",
          "description": "javascript typeof operator"
        },
        "@js.new": {
          "id": "@js.new",
          "ref": "extern",
          "category": "js",
          "value": "extern.construct",
          "description": "javascript constructor"
        },
        "@js.addEventListeners": {
          "id": "@js.addEventListeners",
          "ref": "extern",
          "category": "js",
          "value": "extern.addEventListeners",
          "description": "add js event listeners to a target"
        },
        "@graph.ancestors": {
          "id": "@graph.ancestors",
          "out": "out",
          "category": "graph",
          "description": "Gets the ancestors of the `node` in `graph`",
          "nodes": {
            "in": {
              "id": "in"
            },
            "graph": {
              "id": "graph",
              "ref": "arg",
              "value": "graph"
            },
            "node": {
              "id": "node",
              "ref": "arg",
              "value": "node"
            },
            "out": {
              "id": "out",
              "ref": "@js.script",
              "value": "const parents = (id) => (graph ?? _graph).edges.filter(e => e.to === id).flatMap(e => parents(e.from)).concat([id]); return parents(node ?? graph.out ?? 'out')",
              "name": "@graph.ancestors"
            }
          },
          "edges": [
            {
              "from": "in",
              "to": "out",
              "as": "_",
              "type": "ref"
            },
            {
              "from": "graph",
              "to": "out",
              "as": "graph"
            },
            {
              "from": "node",
              "to": "out",
              "as": "node"
            }
          ]
        },
        "@data.append": {
          "id": "@data.append",
          "category": "data",
          "description": "Appends `item` to `array`. `item` can be a single item or an array.",
          "nodes": {
            "in": {
              "id": "in"
            },
            "array": {
              "id": "array",
              "ref": "arg",
              "value": "array"
            },
            "item": {
              "id": "item",
              "ref": "arg",
              "value": "item"
            },
            "out": {
              "id": "out",
              "ref": "@js.script",
              "value": "return array.concat(Array.isArray(item) ? item : [item])",
              "name": "@data.append"
            }
          },
          "edges": [
            {
              "from": "in",
              "to": "out",
              "as": "_",
              "type": "ref"
            },
            {
              "from": "array",
              "to": "out",
              "as": "array"
            },
            {
              "from": "item",
              "to": "out",
              "as": "item"
            }
          ]
        },
        "@data.concat": {
          "id": "@data.concat",
          "category": "data",
          "description": "Concats `items` to `array`.",
          "nodes": {
            "array": {
              "id": "array",
              "ref": "arg",
              "value": "array"
            },
            "items": {
              "id": "items",
              "ref": "arg",
              "value": "items"
            },
            "out": {
              "id": "out",
              "args": [
                "item",
                "array"
              ],
              "ref": "@js.script",
              "value": "return (array ?? []).concat(items ?? [])",
              "name": "@data.concat"
            }
          },
          "edges": [
            {
              "from": "array",
              "to": "out",
              "as": "array"
            },
            {
              "from": "items",
              "to": "out",
              "as": "items"
            }
          ]
        },
        "@flow.default": {
          "id": "@flow.default",
          "out": "out",
          "category": "flow",
          "description": "Returns `value` if it's defined, if not then returns `otherwise`",
          "nodes": {
            "value": {
              "id": "value",
              "ref": "arg",
              "value": "value"
            },
            "is_value_value": {
              "id": "is_value_value",
              "ref": "arg",
              "value": "value"
            },
            "graph_value": {
              "id": "graph_value",
              "ref": "arg",
              "value": "__graph_value"
            },
            "otherwise_is": {
              "id": "otherwise_is",
              "ref": "arg",
              "value": "otherwise"
            },
            "otherwise_if": {
              "id": "otherwise_if",
              "ref": "arg",
              "value": "otherwise"
            },
            "otherwise_value": {
              "id": "otherwise_value",
              "ref": "arg",
              "value": "otherwise"
            },
            "is_otherwise": {
              "id": "is_otherwise",
              "ref": "@js.script",
              "value": "return otherwise !== undefined && otherwise !== null"
            },
            "if_otherwise": {
              "id": "if_otherwise",
              "ref": "@flow.if"
            },
            "is_value": {
              "id": "is_value",
              "ref": "@js.script",
              "value": "return value !== undefined"
            },
            "if_value": {
              "id": "if_value",
              "ref": "@flow.if"
            },
            "out": {
              "id": "out",
              "ref": "return",
              "name": "@flow.default"
            }
          },
          "edges": [
            {
              "from": "otherwise_if",
              "to": "if_otherwise",
              "as": "true"
            },
            {
              "from": "otherwise_is",
              "to": "is_otherwise",
              "as": "otherwise"
            },
            {
              "from": "is_otherwise",
              "to": "if_otherwise",
              "as": "pred"
            },
            {
              "from": "graph_value",
              "to": "if_otherwise",
              "as": "false"
            },
            {
              "from": "is_value_value",
              "to": "is_value",
              "as": "value"
            },
            {
              "from": "value",
              "to": "if_value",
              "as": "true"
            },
            {
              "from": "is_value",
              "to": "if_value",
              "as": "pred"
            },
            {
              "from": "otherwise_value",
              "to": "if_value",
              "as": "false"
            },
            {
              "from": "if_value",
              "to": "out",
              "as": "value"
            }
          ]
        },
        "@flow.switch": {
          "id": "@flow.switch",
          "ref": "extern",
          "value": "extern.switch",
          "category": "flow"
        },
        "@data.compare": {
          "id": "@data.compare",
          "ref": "extern",
          "value": "compare",
          "category": "data"
        },
        "@flow.if": {
          "id": "@flow.if",
          "out": "out",
          "category": "flow",
          "description": "If `pred` exists in the node's context, return the value from the `true` branch. Otherwise, return the value from the `false` branch.",
          "nodes": {
            "pred": {
              "id": "pred",
              "ref": "arg",
              "value": "pred"
            },
            "true": {
              "id": "true",
              "ref": "arg",
              "value": "true"
            },
            "false": {
              "id": "false",
              "ref": "arg",
              "value": "false"
            },
            "predval": {
              "id": "predval",
              "ref": "@js.script",
              "value": "return !!pred ? 'true_val' : 'false_val'"
            },
            "out": {
              "id": "out",
              "ref": "extern",
              "value": "extern.switch",
              "name": "@flow.if"
            }
          },
          "edges": [
            {
              "from": "true",
              "to": "out",
              "as": "true_val"
            },
            {
              "from": "false",
              "to": "out",
              "as": "false_val"
            },
            {
              "from": "pred",
              "to": "predval",
              "as": "pred"
            },
            {
              "from": "predval",
              "to": "out",
              "as": "input"
            }
          ]
        },
        "@html.svg_text": {
          "id": "@html.svg_text",
          "category": "html",
          "description": "Returns a hyperapp `svg` text element with `text` and `props`",
          "out": "out",
          "nodes": {
            "text": {
              "id": "text",
              "ref": "arg",
              "value": "text"
            },
            "props": {
              "id": "props",
              "ref": "arg",
              "value": "props"
            },
            "dom_type": {
              "id": "dom_type",
              "value": "text"
            },
            "text_el": {
              "id": "text_el",
              "ref": "@html.html_text"
            },
            "children": {
              "id": "children",
              "ref": "@js.script",
              "value": "return [text]"
            },
            "out": {
              "id": "out",
              "ref": "@html.html_element",
              "name": "@html.svg_text"
            }
          },
          "edges": [
            {
              "from": "dom_type",
              "to": "out",
              "as": "dom_type"
            },
            {
              "from": "text",
              "to": "text_el",
              "as": "text"
            },
            {
              "from": "text_el",
              "to": "children",
              "as": "text"
            },
            {
              "from": "props",
              "to": "out",
              "as": "props"
            },
            {
              "from": "children",
              "to": "out",
              "as": "children"
            }
          ]
        },
        "return": {
          "id": "return",
          "category": "flow",
          "description": "Creates an inline graph with args, pub/sub, etc. See docs for more detail.",
          "ref": "extern",
          "value": "extern.return"
        },
        "@data.fold": {
          "id": "@data.fold",
          "category": "data",
          "ref": "extern",
          "value": "extern.fold"
        },
        "@flow.runnable": {
          "id": "@flow.runnable",
          "category": "flow",
          "ref": "extern",
          "value": "extern.runnable"
        },
        "@flow.ap": {
          "id": "@flow.ap",
          "category": "flow",
          "ref": "extern",
          "value": "extern.ap"
        },
        "@js.script": {
          "id": "@js.script",
          "category": "js",
          "description": "Runs this as a javascript function. `return` is needed at the end of the script to return anything.",
          "ref": "extern",
          "value": "extern.script"
        },
        "extern": {
          "id": "extern",
          "category": "nodysseus",
          "description": "Uses a function from the nodysseus extern library directly"
        },
        "@data.array": {
          "id": "@data.array",
          "name": "array",
          "category": "data",
          "description": "Create an array from all the inputs in alphabetical order",
          "ref": "extern",
          "value": "extern.new_array"
        },
        "@js.create_fn": {
          "id": "@js.create_fn",
          "ref": "extern",
          "category": "js",
          "value": "extern.create_fn"
        },
        "@data.merge_objects": {
          "id": "@data.merge_objects",
          "category": "data",
          "description": "Merge the keys of two objects, in descending alphabetical order priority (`Object.assign(...inputs)`).",
          "ref": "extern",
          "value": "extern.merge_objects"
        },
        "@data.merge_objects_mutable": {
          "id": "@data.merge_objects_mutable",
          "category": "data",
          "description": "Merge the keys of one or more objects into the target object, in descending alphabetical order priority (`Object.assign(...inputs)`).",
          "ref": "extern",
          "value": "extern.merge_objects_mutable"
        },
        "@data.get": {
          "id": "@data.get",
          "category": "data",
          "description": "Get the value at the path of object. Accepts a `.` separated path e.g. get(target, 'a.b.c') returns target.a.b.c",
          "out": "out",
          "ref": "extern",
          "value": "extern.get"
        },
        "arg": {
          "id": "arg",
          "category": "flow",
          "description": "Get an input to the graph this is a part of.",
          "ref": "extern",
          "value": "extern.arg"
        },
        "@data.set_mutable": {
          "id": "@data.set_mutable",
          "description": "Sets `target` value at `path` to `value` and returns the object.",
          "category": "data",
          "ref": "extern",
          "value": "extern.set_mutable",
          "_out": "out",
          "_nodes": [
            {
              "id": "path",
              "ref": "arg",
              "value": "path"
            },
            {
              "id": "target",
              "ref": "arg",
              "value": "target"
            },
            {
              "id": "value",
              "ref": "arg",
              "value": "value"
            },
            {
              "id": "out",
              "ref": "extern",
              "value": "extern.set_mutable"
            }
          ],
          "_edges": [
            {
              "from": "path",
              "to": "out",
              "as": "path"
            },
            {
              "from": "target",
              "to": "out",
              "as": "target"
            },
            {
              "from": "value",
              "to": "out",
              "as": "value"
            }
          ]
        },
        "@data.set": {
          "id": "@data.set",
          "category": "data",
          "description": "Returns a new object with the property at `path` (or the node's value) on `target` set to `value`. Accepts a `.` separated path e.g. set(target, 'a.b', 'c') returns {...target, a: {...target.a, b: 'c'}}",
          "type": "(target: any, value: any, path: string) => any",
          "ref": "extern",
          "value": "extern.set"
        },
        "@data.modify": {
          "id": "@data.modify",
          "category": "data",
          "description": "Returns a new object with the property at `path` (or the node's value) on `target` modified with `fn`. Accepts a `.` separated path e.g. set(target, 'a.b', 'c') returns {...target, a: {...target.a, b: 'c'}}",
          "type": "(target: any, value: any, path: string) => any",
          "ref": "extern",
          "value": "extern.modify"
        },
        "@data.delete": {
          "id": "@data.delete",
          "category": "data",
          "description": "Deletes `target` property at `path`",
          "ref": "extern",
          "value": "extern.delete"
        },
        "@html.tapbutton": {
          "id": "@html.tapbutton",
          "category": "html",
          "nodes": {
            "args": {
              "id": "args"
            },
            "8dy573e": {
              "id": "8dy573e",
              "ref": "@html.html_element"
            },
            "out": {
              "id": "out",
              "name": "@html.tapbutton",
              "ref": "return"
            },
            "qgbinm2": {
              "id": "qgbinm2",
              "value": "button",
              "ref": "@html.html_element"
            },
            "label": {
              "id": "label",
              "ref": "arg",
              "value": "__graph_value"
            },
            "9fogdzn": {
              "id": "9fogdzn",
              "value": "signal",
              "ref": "@html.html_text"
            },
            "ehximpo": {
              "id": "ehximpo"
            },
            "4stvov8": {
              "id": "4stvov8",
              "ref": "@flow.ap"
            },
            "8ywgts7": {
              "id": "8ywgts7",
              "ref": "@memory.state"
            },
            "v089o3o": {
              "id": "v089o3o",
              "value": "signal.set",
              "ref": "arg"
            },
            "k3rjgad": {
              "id": "k3rjgad"
            },
            "76he898": {
              "id": "76he898",
              "value": "true"
            },
            "nhmeamz": {
              "id": "nhmeamz",
              "ref": "@flow.ap"
            },
            "7mj35x5": {
              "id": "7mj35x5"
            },
            "bim5wsv": {
              "id": "bim5wsv",
              "value": "signal.set",
              "ref": "arg"
            },
            "4mha35d": {
              "id": "4mha35d",
              "value": "false"
            },
            "hbo5tmq": {
              "id": "hbo5tmq",
              "ref": "@data.array"
            },
            "lgx7u5i": {
              "id": "lgx7u5i",
              "ref": "@html.html_text"
            },
            "g19y12v": {
              "id": "g19y12v",
              "value": "signal.state",
              "ref": "arg"
            },
            "9vqinsg": {
              "id": "9vqinsg"
            },
            "i38qweq": {
              "id": "i38qweq",
              "value": "none"
            },
            "eemfhib": {
              "id": "eemfhib",
              "value": "signal.state",
              "ref": "arg"
            },
            "n2a984s_arr": {
              "id": "n2a984s_arr",
              "ref": "@data.array"
            },
            "n2a984s": {
              "id": "n2a984s",
              "ref": "@flow.ap"
            },
            "a14g4yc": {
              "id": "a14g4yc",
              "value": "ontap",
              "ref": "arg"
            }
          },
          "edges": [
            {
              "from": "8dy573e",
              "to": "out",
              "as": "display"
            },
            {
              "from": "args",
              "to": "out",
              "as": "args"
            },
            {
              "from": "label",
              "to": "9fogdzn",
              "as": "text"
            },
            {
              "from": "9fogdzn",
              "to": "qgbinm2",
              "as": "children"
            },
            {
              "from": "ehximpo",
              "to": "qgbinm2",
              "as": "props"
            },
            {
              "from": "8ywgts7",
              "to": "args",
              "as": "signal"
            },
            {
              "from": "v089o3o",
              "to": "4stvov8",
              "as": "fn"
            },
            {
              "from": "k3rjgad",
              "to": "4stvov8",
              "as": "args"
            },
            {
              "from": "76he898",
              "to": "k3rjgad",
              "as": "value"
            },
            {
              "from": "4stvov8",
              "to": "ehximpo",
              "as": "onpointerdown"
            },
            {
              "from": "bim5wsv",
              "to": "nhmeamz",
              "as": "fn"
            },
            {
              "from": "7mj35x5",
              "to": "nhmeamz",
              "as": "args"
            },
            {
              "from": "4mha35d",
              "to": "7mj35x5",
              "as": "value"
            },
            {
              "from": "hbo5tmq",
              "to": "8dy573e",
              "as": "children"
            },
            {
              "from": "qgbinm2",
              "to": "hbo5tmq",
              "as": "arg1"
            },
            {
              "from": "lgx7u5i",
              "to": "_hbo5tmq",
              "as": "arg2"
            },
            {
              "from": "g19y12v",
              "to": "lgx7u5i",
              "as": "text"
            },
            {
              "from": "9vqinsg",
              "to": "ehximpo",
              "as": "style"
            },
            {
              "from": "i38qweq",
              "to": "9vqinsg",
              "as": "userSelect"
            },
            {
              "from": "eemfhib",
              "to": "8dy573e",
              "as": "value"
            },
            {
              "from": "n2a984s",
              "to": "ehximpo",
              "as": "onpointerup"
            },
            {
              "from": "nhmeamz",
              "to": "n2a984s_arr",
              "as": "arg0"
            },
            {
              "from": "a14g4yc",
              "to": "n2a984s_arr",
              "as": "arg1"
            },
            {
              "from": "n2a984s_arr",
              "to": "n2a984s",
              "as": "fn"
            }
          ],
          "out": "out"
        },
        "@memory.graphchangecache": {
          "category": "memory",
          "edges": {
            "ap_cache_value": {
              "from": "ap_cache_value",
              "to": "ap_cache_args",
              "as": "value"
            },
            "ap_cache_args": {
              "from": "ap_cache_args",
              "to": "cache",
              "as": "args"
            },
            "ap_cache_fn": {
              "from": "ap_cache_fn",
              "to": "cache",
              "as": "fn"
            },
            "pred_cachevalue_state": {
              "from": "pred_cachevalue_state",
              "to": "pred_cache_state",
              "as": "cachevaluestate"
            },
            "recache": {
              "from": "recache",
              "to": "pred_cache_state",
              "as": "recache"
            },
            "cachevalue_state": {
              "from": "cachevalue_state",
              "to": "if_cache_state",
              "as": "false"
            },
            "cache": {
              "from": "cache",
              "to": "kqnga6d",
              "as": "arg0"
            },
            "pred_cache_state": {
              "from": "pred_cache_state",
              "to": "if_cache_state",
              "as": "pred"
            },
            "if_cache_state": {
              "from": "if_cache_state",
              "to": "out",
              "as": "value"
            },
            "cache_state": {
              "from": "cache_state",
              "to": "cache_return_args",
              "as": "_cachevalue"
            },
            "cache_return_args": {
              "from": "cache_return_args",
              "to": "out",
              "as": "args"
            },
            "recache_button_fn_value": {
              "from": "recache_button_fn_value",
              "to": "recache_button_fn_args",
              "as": "value"
            },
            "recache_button_fn_args": {
              "from": "recache_button_fn_args",
              "to": "recache_button_ap",
              "as": "args"
            },
            "recache_button_fn": {
              "from": "recache_button_fn",
              "to": "recache_button_ap",
              "as": "fn"
            },
            "recache_button_ap": {
              "from": "recache_button_ap",
              "to": "recache_button",
              "as": "ontap"
            },
            "recache_button": {
              "from": "recache_button",
              "to": "out",
              "as": "display"
            },
            "fy9ee3e": {
              "from": "fy9ee3e",
              "to": "out",
              "as": "subscribe"
            },
            "h56r87n": {
              "from": "h56r87n",
              "to": "pred_cache_state",
              "as": "_reset"
            },
            "xbhq0f0": {
              "from": "xbhq0f0",
              "to": "cache",
              "as": "run"
            },
            "kqnga6d": {
              "from": "kqnga6d",
              "to": "9w2cqoc",
              "as": "target"
            },
            "9w2cqoc": {
              "from": "9w2cqoc",
              "to": "if_cache_state",
              "as": "true"
            },
            "2nhroiv": {
              "from": "2nhroiv",
              "to": "tebglqx",
              "as": "parameters"
            },
            "dtfbfdm": {
              "from": "dtfbfdm",
              "to": "2nhroiv",
              "as": "dirtyNodes"
            },
            "bxacisq": {
              "from": "bxacisq",
              "to": "zan0upq",
              "as": "dirtyNodes"
            },
            "tebglqx": {
              "from": "tebglqx",
              "to": "fy9ee3e",
              "as": "graphchange"
            },
            "g1lb9hq": {
              "from": "g1lb9hq",
              "to": "zan0upq",
              "as": "state"
            },
            "zan0upq": {
              "from": "zan0upq",
              "to": "ockphl3",
              "as": "pred"
            },
            "jonwhso": {
              "from": "jonwhso",
              "to": "zan0upq",
              "as": "graphid"
            },
            "ockphl3": {
              "from": "ockphl3",
              "to": "tebglqx",
              "as": "fn"
            },
            "ehb5iz5": {
              "from": "ehb5iz5",
              "to": "ockphl3",
              "as": "true"
            },
            "4w9hxjv": {
              "from": "4w9hxjv",
              "to": "ehb5iz5",
              "as": "fn"
            },
            "fr8wvzt": {
              "from": "fr8wvzt",
              "to": "ehb5iz5",
              "as": "run"
            },
            "affc4bs": {
              "from": "affc4bs",
              "to": "ehb5iz5",
              "as": "args"
            },
            "y4c3klu": {
              "from": "y4c3klu",
              "to": "affc4bs",
              "as": "value"
            },
            "sc3gf99": {
              "from": "sc3gf99",
              "to": "2nhroiv",
              "as": "data"
            },
            "juhzde2": {
              "from": "juhzde2",
              "to": "2nhroiv",
              "as": "graph"
            }
          },
          "id": "@memory.graphchangecache",
          "nodes": {
            "value": {
              "id": "value",
              "ref": "arg",
              "value": "value"
            },
            "graphid": {
              "id": "graphid",
              "ref": "arg",
              "value": "__graphid"
            },
            "recache": {
              "id": "recache",
              "ref": "arg",
              "value": "recache"
            },
            "cachevalue_state": {
              "id": "cachevalue_state",
              "value": "_cachevalue.state",
              "ref": "arg"
            },
            "pred_cachevalue_state": {
              "id": "pred_cachevalue_state",
              "value": "_cachevalue.state",
              "ref": "arg"
            },
            "pred_cache_state": {
              "id": "pred_cache_state",
              "value": "const docache = recache === undefined ? (cachevaluestate === undefined || cachevaluestate === null) : (recache !== false && (typeof recache !== 'object' || Object.keys(recache).length > 0))\n\nreturn docache;",
              "ref": "@js.script"
            },
            "ap_cache_value": {
              "id": "ap_cache_value",
              "value": "value: default",
              "ref": "arg"
            },
            "ap_cache_args": {
              "id": "ap_cache_args"
            },
            "ap_cache_fn": {
              "id": "ap_cache_fn",
              "value": "_cachevalue.set",
              "ref": "arg"
            },
            "cache": {
              "id": "cache",
              "ref": "@flow.ap"
            },
            "if_cache_state": {
              "id": "if_cache_state",
              "ref": "@flow.if"
            },
            "cache_state": {
              "id": "cache_state",
              "ref": "@memory.state"
            },
            "cache_return_args": {
              "id": "cache_return_args"
            },
            "recache_button_fn": {
              "id": "recache_button_fn",
              "value": "_cachevalue.set",
              "ref": "arg"
            },
            "recache_button_fn_args": {
              "id": "recache_button_fn_args"
            },
            "recache_button_fn_value": {
              "id": "recache_button_fn_value"
            },
            "recache_button_ap": {
              "id": "recache_button_ap",
              "ref": "@flow.ap"
            },
            "recache_button": {
              "id": "recache_button",
              "value": "reset",
              "ref": "@html.tapbutton"
            },
            "out": {
              "id": "out",
              "name": "@memory.graphchangecache",
              "ref": "return"
            },
            "fy9ee3e": {
              "id": "fy9ee3e"
            },
            "h56r87n": {
              "id": "h56r87n",
              "value": "_reset.state",
              "ref": "arg"
            },
            "xbhq0f0": {
              "id": "xbhq0f0",
              "value": "true"
            },
            "kqnga6d": {
              "id": "kqnga6d",
              "ref": "@data.array"
            },
            "9w2cqoc": {
              "id": "9w2cqoc",
              "value": "0",
              "ref": "@data.get"
            },
            "jmvzfm1": {
              "id": "jmvzfm1"
            },
            "99ld3d7": {
              "id": "99ld3d7"
            },
            "tebglqx": {
              "id": "tebglqx",
              "ref": "@flow.runnable"
            },
            "2nhroiv": {
              "id": "2nhroiv"
            },
            "dtfbfdm": {
              "id": "dtfbfdm"
            },
            "bxacisq": {
              "id": "bxacisq",
              "value": "dirtyNodes",
              "ref": "arg"
            },
            "zan0upq": {
              "id": "zan0upq",
              "value": "const ret =  dirtyNodes && !dirtyNodes.every(n => !graphid.includes(n));\nreturn ret || state === undefined;",
              "ref": "@js.script"
            },
            "jonwhso": {
              "id": "jonwhso",
              "value": "__graphid",
              "ref": "arg"
            },
            "ockphl3": {
              "id": "ockphl3",
              "ref": "@flow.if"
            },
            "ehb5iz5": {
              "id": "ehb5iz5",
              "ref": "@flow.ap"
            },
            "4w9hxjv": {
              "id": "4w9hxjv",
              "value": "_cachevalue.set",
              "ref": "arg"
            },
            "fr8wvzt": {
              "id": "fr8wvzt",
              "value": "true"
            },
            "affc4bs": {
              "id": "affc4bs"
            },
            "y4c3klu": {
              "id": "y4c3klu"
            },
            "sc3gf99": {
              "id": "sc3gf99"
            },
            "juhzde2": {
              "id": "juhzde2"
            },
            "g7fudn7": {
              "id": "g7fudn7"
            },
            "z5jrs71": {
              "id": "z5jrs71"
            },
            "crkuagp": {
              "id": "crkuagp"
            },
            "g1lb9hq": {
              "id": "g1lb9hq",
              "value": "_cachevalue.state",
              "ref": "arg"
            }
          },
          "out": "out",
          "edges_in": {
            "7rk5v07": {},
            "ap_cache_args": {
              "ap_cache_value": {
                "from": "ap_cache_value",
                "to": "ap_cache_args",
                "as": "value"
              }
            },
            "cache": {
              "ap_cache_args": {
                "from": "ap_cache_args",
                "to": "cache",
                "as": "args"
              },
              "ap_cache_fn": {
                "from": "ap_cache_fn",
                "to": "cache",
                "as": "fn"
              },
              "xbhq0f0": {
                "from": "xbhq0f0",
                "to": "cache",
                "as": "run"
              }
            },
            "pred_cache_state": {
              "pred_cachevalue_state": {
                "from": "pred_cachevalue_state",
                "to": "pred_cache_state",
                "as": "cachevaluestate"
              },
              "recache": {
                "from": "recache",
                "to": "pred_cache_state",
                "as": "recache"
              },
              "h56r87n": {
                "from": "h56r87n",
                "to": "pred_cache_state",
                "as": "_reset"
              }
            },
            "if_cache_state": {
              "cachevalue_state": {
                "from": "cachevalue_state",
                "to": "if_cache_state",
                "as": "false"
              },
              "pred_cache_state": {
                "from": "pred_cache_state",
                "to": "if_cache_state",
                "as": "pred"
              },
              "9w2cqoc": {
                "from": "9w2cqoc",
                "to": "if_cache_state",
                "as": "true"
              }
            },
            "kqnga6d": {
              "cache": {
                "from": "cache",
                "to": "kqnga6d",
                "as": "arg0"
              }
            },
            "out": {
              "if_cache_state": {
                "from": "if_cache_state",
                "to": "out",
                "as": "value"
              },
              "cache_return_args": {
                "from": "cache_return_args",
                "to": "out",
                "as": "args"
              },
              "recache_button": {
                "from": "recache_button",
                "to": "out",
                "as": "display"
              },
              "fy9ee3e": {
                "from": "fy9ee3e",
                "to": "out",
                "as": "subscribe"
              }
            },
            "cache_return_args": {
              "cache_state": {
                "from": "cache_state",
                "to": "cache_return_args",
                "as": "_cachevalue"
              }
            },
            "recache_button_fn_args": {
              "recache_button_fn_value": {
                "from": "recache_button_fn_value",
                "to": "recache_button_fn_args",
                "as": "value"
              }
            },
            "recache_button_ap": {
              "recache_button_fn_args": {
                "from": "recache_button_fn_args",
                "to": "recache_button_ap",
                "as": "args"
              },
              "recache_button_fn": {
                "from": "recache_button_fn",
                "to": "recache_button_ap",
                "as": "fn"
              }
            },
            "recache_button": {
              "recache_button_ap": {
                "from": "recache_button_ap",
                "to": "recache_button",
                "as": "ontap"
              }
            },
            "fy9ee3e": {
              "tebglqx": {
                "from": "tebglqx",
                "to": "fy9ee3e",
                "as": "graphchange"
              }
            },
            "hznmgir": {},
            "uwfswa7": {},
            "9w2cqoc": {
              "kqnga6d": {
                "from": "kqnga6d",
                "to": "9w2cqoc",
                "as": "target"
              }
            },
            "tebglqx": {
              "2nhroiv": {
                "from": "2nhroiv",
                "to": "tebglqx",
                "as": "parameters"
              },
              "ockphl3": {
                "from": "ockphl3",
                "to": "tebglqx",
                "as": "fn"
              }
            },
            "2nhroiv": {
              "dtfbfdm": {
                "from": "dtfbfdm",
                "to": "2nhroiv",
                "as": "dirtyNodes"
              },
              "sc3gf99": {
                "from": "sc3gf99",
                "to": "2nhroiv",
                "as": "data"
              },
              "juhzde2": {
                "from": "juhzde2",
                "to": "2nhroiv",
                "as": "graph"
              }
            },
            "zan0upq": {
              "bxacisq": {
                "from": "bxacisq",
                "to": "zan0upq",
                "as": "dirtyNodes"
              },
              "g1lb9hq": {
                "from": "g1lb9hq",
                "to": "zan0upq",
                "as": "state"
              },
              "jonwhso": {
                "from": "jonwhso",
                "to": "zan0upq",
                "as": "graphid"
              }
            },
            "ju4ukmm": {},
            "h0dsw4x": {},
            "ockphl3": {
              "zan0upq": {
                "from": "zan0upq",
                "to": "ockphl3",
                "as": "pred"
              },
              "ehb5iz5": {
                "from": "ehb5iz5",
                "to": "ockphl3",
                "as": "true"
              }
            },
            "ehb5iz5": {
              "4w9hxjv": {
                "from": "4w9hxjv",
                "to": "ehb5iz5",
                "as": "fn"
              },
              "fr8wvzt": {
                "from": "fr8wvzt",
                "to": "ehb5iz5",
                "as": "run"
              },
              "affc4bs": {
                "from": "affc4bs",
                "to": "ehb5iz5",
                "as": "args"
              }
            },
            "affc4bs": {
              "y4c3klu": {
                "from": "y4c3klu",
                "to": "affc4bs",
                "as": "value"
              }
            }
          }
        },
        "@memory.cache": {
          "id": "@memory.cache",
          "out": "out",
          "nodes": {
            "value": {
              "id": "value",
              "ref": "arg",
              "value": "value"
            },
            "graphid": {
              "id": "graphid",
              "ref": "arg",
              "value": "__graphid"
            },
            "recache": {
              "id": "recache",
              "ref": "arg",
              "value": "recache"
            },
            "cachevalue_state": {
              "id": "cachevalue_state",
              "value": "_cachevalue.state",
              "ref": "arg"
            },
            "pred_cachevalue_state": {
              "id": "pred_cachevalue_state",
              "value": "_cachevalue.state",
              "ref": "arg"
            },
            "pred_cachevalue": {
              "id": "pred_cachevalue",
              "value": "_cachevalue",
              "ref": "arg"
            },
            "pred_cache_state": {
              "id": "pred_cache_state",
              "value": "const docache = recache === true || cachevaluestate === undefined || cachevaluestate === null;\n\nreturn docache;",
              "ref": "@js.script"
            },
            "ap_cache_value": {
              "id": "ap_cache_value",
              "ref": "arg",
              "value": "value: default"
            },
            "ap_cache_args": {
              "id": "ap_cache_args"
            },
            "ap_cache_run": {
              "id": "ap_cache_run",
              "value": "true"
            },
            "ap_cache_fn": {
              "id": "ap_cache_fn",
              "value": "_cachevalue.set",
              "ref": "arg"
            },
            "cache": {
              "id": "cache",
              "ref": "@flow.ap"
            },
            "if_cache_state": {
              "id": "if_cache_state",
              "ref": "@flow.if"
            },
            "cache_state": {
              "id": "cache_state",
              "ref": "@memory.state"
            },
            "cache_return_args": {
              "id": "cache_return_args"
            },
            "recache_button_fn": {
              "id": "recache_button_fn",
              "value": "_cachevalue.set",
              "ref": "arg"
            },
            "recache_button_fn_args": {
              "id": "recache_button_fn_args"
            },
            "recache_button_fn_value": {
              "id": "recache_button_fn_value",
              "value": "undefined"
            },
            "recache_button_ap": {
              "id": "recache_button_ap",
              "ref": "@flow.ap"
            },
            "recache_button": {
              "id": "recache_button",
              "value": "recache",
              "ref": "@html.tapbutton"
            },
            "out": {
              "id": "out",
              "ref": "return",
              "name": "@memory.cache"
            },
            "jb9ua5s": {
              "id": "jb9ua5s",
              "ref": "@memory.refval"
            }
          },
          "edges": {
            "ap_cache_value": {
              "from": "ap_cache_value",
              "to": "ap_cache_args",
              "as": "value"
            },
            "ap_cache_args": {
              "from": "ap_cache_args",
              "to": "cache",
              "as": "args"
            },
            "ap_cache_run": {
              "from": "ap_cache_run",
              "to": "cache",
              "as": "run"
            },
            "ap_cache_fn": {
              "from": "ap_cache_fn",
              "to": "cache",
              "as": "fn"
            },
            "pred_cachevalue_state": {
              "from": "pred_cachevalue_state",
              "to": "pred_cache_state",
              "as": "cachevaluestate"
            },
            "recache": {
              "from": "recache",
              "to": "pred_cache_state",
              "as": "recache"
            },
            "cachevalue_state": {
              "from": "cachevalue_state",
              "to": "if_cache_state",
              "as": "false"
            },
            "cache": {
              "from": "cache",
              "to": "if_cache_state",
              "as": "true"
            },
            "pred_cachevalue": {
              "from": "pred_cachevalue",
              "to": "pred_cache_state",
              "as": "cachevalue"
            },
            "pred_cache_state": {
              "from": "pred_cache_state",
              "to": "if_cache_state",
              "as": "pred"
            },
            "if_cache_state": {
              "from": "if_cache_state",
              "to": "out",
              "as": "value"
            },
            "cache_state": {
              "from": "cache_state",
              "to": "cache_return_args",
              "as": "_cachevalue"
            },
            "cache_return_args": {
              "from": "cache_return_args",
              "to": "out",
              "as": "args"
            },
            "recache_button_fn_value": {
              "from": "recache_button_fn_value",
              "to": "recache_button_fn_args",
              "as": "value"
            },
            "recache_button_fn_args": {
              "from": "recache_button_fn_args",
              "to": "recache_button_ap",
              "as": "args"
            },
            "recache_button_fn": {
              "from": "recache_button_fn",
              "to": "recache_button_ap",
              "as": "fn"
            },
            "recache_button_ap": {
              "from": "recache_button_ap",
              "to": "recache_button",
              "as": "ontap"
            },
            "recache_button": {
              "from": "recache_button",
              "to": "out",
              "as": "display"
            }
          },
          "category": "memory"
        },
        "@data.isunchanged": {
          "id": "@data.isunchanged",
          "nodes": {
            "in": {
              "id": "in"
            },
            "eq_fn_value": {
              "id": "eq_fn_value",
              "ref": "arg",
              "value": "value"
            },
            "eq_fn_if": {
              "id": "eq_fn_if",
              "ref": "arg",
              "value": "eq_fn"
            },
            "fn": {
              "id": "fn",
              "ref": "arg",
              "value": "fn"
            },
            "cached": {
              "id": "cached",
              "ref": "arg",
              "value": "cached",
              "type": "internal"
            },
            "eq_default": {
              "id": "eq_default",
              "ref": "eq"
            },
            "eq_runnable": {
              "id": "eq_runnable",
              "ref": "@flow.runnable"
            },
            "fn_runnable": {
              "id": "fn_runnable",
              "ref": "@flow.default"
            },
            "eq_fn_runnable": {
              "id": "eq_fn_runnable",
              "ref": "@js.script",
              "value": "return {...fn, args: {...(fn.args ?? {}), a, b}}"
            },
            "eq_fn": {
              "id": "eq_fn",
              "ref": "run"
            },
            "eq_fn_return_args": {
              "id": "eq_fn_return_args"
            },
            "if_eq_fn": {
              "id": "if_eq_fn",
              "ref": "@flow.if"
            },
            "out": {
              "id": "out",
              "ref": "return",
              "name": "@data.isunchanged"
            },
            "yp2q57b": {
              "id": "yp2q57b"
            },
            "tpe5t4z": {
              "id": "tpe5t4z",
              "ref": "@memory.refval"
            },
            "cy1tm8s": {
              "id": "cy1tm8s",
              "value": "const iseq = saved.value !== value;\n\nif(!iseq) {\n  saved.set.fn(value);\n}\n\nreturn iseq;",
              "ref": "@js.script"
            },
            "khdzxds": {
              "id": "khdzxds",
              "value": "_saved",
              "ref": "arg"
            },
            "lv2gcpk": {
              "id": "lv2gcpk",
              "value": "value",
              "ref": "arg"
            }
          },
          "edges": {
            "eq_default": {
              "from": "eq_default",
              "to": "eq_runnable",
              "as": "fn"
            },
            "eq_runnable": {
              "from": "eq_runnable",
              "to": "fn_runnable",
              "as": "otherwise"
            },
            "fn": {
              "from": "fn",
              "to": "fn_runnable",
              "as": "value"
            },
            "fn_runnable": {
              "from": "fn_runnable",
              "to": "eq_fn_runnable",
              "as": "fn"
            },
            "eq_fn_value": {
              "from": "eq_fn_value",
              "to": "eq_fn_runnable",
              "as": "a"
            },
            "cached": {
              "from": "cached",
              "to": "eq_fn_runnable",
              "as": "b"
            },
            "eq_fn_runnable": {
              "from": "eq_fn_runnable",
              "to": "eq_fn",
              "as": "runnable"
            },
            "eq_fn_if": {
              "from": "eq_fn_if",
              "to": "if_eq_fn",
              "as": "pred"
            },
            "eq_fn": {
              "from": "eq_fn",
              "to": "eq_fn_return_args",
              "as": "eq_fn"
            },
            "yp2q57b": {
              "from": "yp2q57b",
              "to": "out",
              "as": "args"
            },
            "tpe5t4z": {
              "from": "tpe5t4z",
              "to": "yp2q57b",
              "as": "_saved"
            },
            "cy1tm8s": {
              "from": "cy1tm8s",
              "to": "out",
              "as": "value"
            },
            "khdzxds": {
              "from": "khdzxds",
              "to": "cy1tm8s",
              "as": "saved"
            },
            "lv2gcpk": {
              "from": "lv2gcpk",
              "to": "cy1tm8s",
              "as": "value"
            }
          },
          "category": "data"
        },
        "@memory.refval": {
          "id": "@memory.refval",
          "ref": "extern",
          "value": "extern.refval",
          "category": "memory"
        },
        "@memory.state": {
          "id": "@memory.state",
          "name": "state",
          "out": "out",
          "category": "memory",
          "ref": "extern",
          "value": "extern.state"
        },
        "@memory.unwrap": {
          "id": "@memory.unwrap",
          "ref": "extern",
          "value": "extern.unwrapValue"
        },
        "@event.publish_event": {
          "id": "@event.publish_event",
          "out": "out",
          "nodes": {
            "output_val": {
              "id": "output_val",
              "ref": "@flow.runnable"
            },
            "out": {
              "id": "out",
              "ref": "return",
              "name": "@event.publish_event"
            },
            "i5m8bp1": {
              "id": "i5m8bp1",
              "value": "_lib.no.runtime.publish(name, {data})",
              "ref": "@js.script"
            },
            "3pnfu3c": {
              "id": "3pnfu3c",
              "ref": "@flow.default"
            },
            "smopce2": {
              "id": "smopce2",
              "value": "event",
              "ref": "arg"
            },
            "mz8rw6m": {
              "id": "mz8rw6m",
              "value": "__graph_value",
              "ref": "arg"
            },
            "6sffwk9": {
              "id": "6sffwk9",
              "value": "data",
              "ref": "arg"
            },
            "xiqo1q0": {
              "id": "xiqo1q0"
            },
            "k36to2l": {
              "id": "k36to2l"
            }
          },
          "edges": {
            "output_val": {
              "from": "output_val",
              "to": "out",
              "as": "value"
            },
            "i5m8bp1": {
              "from": "i5m8bp1",
              "to": "output_val",
              "as": "fn"
            },
            "3pnfu3c": {
              "from": "3pnfu3c",
              "to": "i5m8bp1",
              "as": "name"
            },
            "smopce2": {
              "from": "smopce2",
              "to": "3pnfu3c",
              "as": "value"
            },
            "mz8rw6m": {
              "from": "mz8rw6m",
              "to": "3pnfu3c",
              "as": "otherwise"
            },
            "6sffwk9": {
              "from": "6sffwk9",
              "to": "i5m8bp1",
              "as": "data"
            },
            "xiqo1q0": {
              "from": "xiqo1q0",
              "to": "output_val",
              "as": "parameters"
            },
            "k36to2l": {
              "from": "k36to2l",
              "to": "xiqo1q0",
              "as": "data"
            }
          }
        },
        "@event.event_publisher_onchange": {
          "id": "@event.event_publisher_onchange",
          "category": "event",
          "description": "Publishes a `name` (or this node's value) event with the data `value` when `value` changes.",
          "out": "out",
          "nodes": {
            "value": {
              "id": "value",
              "ref": "arg",
              "value": "value"
            },
            "value_out": {
              "id": "value_out",
              "ref": "arg",
              "value": "value"
            },
            "value_eq_a": {
              "id": "value_eq_a",
              "ref": "arg",
              "value": "a"
            },
            "value_eq_b": {
              "id": "value_eq_b",
              "ref": "arg",
              "value": "b"
            },
            "value_eq_fn": {
              "id": "value_eq_fn",
              "ref": "@js.script",
              "value": "return _lib.compare(a, b)"
            },
            "value_eq": {
              "id": "value_eq",
              "ref": "@flow.runnable"
            },
            "value_unchanged": {
              "id": "value_unchanged",
              "ref": "@data.isunchanged"
            },
            "publisher": {
              "id": "publisher",
              "ref": "event_publisher"
            },
            "out": {
              "id": "out",
              "ref": "@flow.if",
              "name": "@event.event_publisher_onchange"
            }
          },
          "edges": [
            {
              "from": "value",
              "to": "value_eq",
              "as": "value"
            },
            {
              "from": "value_eq_a",
              "to": "value_eq_fn",
              "as": "a"
            },
            {
              "from": "value_eq_b",
              "to": "value_eq_fn",
              "as": "b"
            },
            {
              "from": "value_eq_fn",
              "to": "value_eq",
              "as": "fn"
            },
            {
              "from": "value_eq",
              "to": "value_unchanged",
              "as": "fn"
            },
            {
              "from": "value_unchanged",
              "to": "out",
              "as": "pred"
            },
            {
              "from": "publisher",
              "to": "out",
              "as": "false"
            },
            {
              "from": "value_out",
              "to": "out",
              "as": "true"
            }
          ]
        },
        "@debug.input_value": {
          "edges": {
            "1c4vbjw": {
              "as": "arg0",
              "from": "1c4vbjw",
              "to": "bi1dbsb"
            },
            "1ovmmn3": {
              "as": "value",
              "from": "1ovmmn3",
              "to": "zfl3aqg"
            },
            "3jphobh": {
              "as": "value",
              "from": "3jphobh",
              "to": "bi1dbsb"
            },
            "4d8qcss": {
              "as": "children",
              "from": "4d8qcss",
              "to": "5a6pljw"
            },
            "5a6pljw": {
              "as": "display",
              "from": "5a6pljw",
              "to": "out"
            },
            "73asljg": {
              "as": "false",
              "from": "73asljg",
              "to": "ut9zq8n"
            },
            "a8nnxeo": {
              "as": "spacer",
              "from": "a8nnxeo",
              "to": "psog7hu"
            },
            "bi1dbsb": {
              "as": "true",
              "from": "bi1dbsb",
              "to": "ut9zq8n"
            },
            "dqau7vz": {
              "as": "fn",
              "from": "dqau7vz",
              "to": "1c4vbjw"
            },
            "h8q885n": {
              "as": "publish",
              "from": "h8q885n",
              "to": "9ukj84k"
            },
            "hm2lkjh": {
              "as": "args",
              "from": "hm2lkjh",
              "to": "out"
            },
            "n028q0n": {
              "as": "stored",
              "from": "n028q0n",
              "to": "xzbcdnj"
            },
            "psog7hu": {
              "as": "value",
              "from": "psog7hu",
              "to": "wo0j48j"
            },
            "rg59xbc": {
              "as": "run",
              "from": "rg59xbc",
              "to": "1c4vbjw"
            },
            "s7kudco": {
              "as": "value",
              "from": "s7kudco",
              "to": "xzbcdnj"
            },
            "ut9zq8n": {
              "as": "value",
              "from": "ut9zq8n",
              "to": "out"
            },
            "wo0j48j": {
              "as": "args",
              "from": "wo0j48j",
              "to": "1c4vbjw"
            },
            "xm523y9": {
              "as": "object",
              "from": "xm523y9",
              "to": "psog7hu"
            },
            "xzbcdnj": {
              "as": "pred",
              "from": "xzbcdnj",
              "to": "ut9zq8n"
            },
            "zfl3aqg": {
              "as": "ischanged",
              "from": "zfl3aqg",
              "to": "xzbcdnj"
            },
            "9ukj84k": {
              "as": "_stored",
              "from": "9ukj84k",
              "to": "hm2lkjh"
            },
            "1znvqbi": {
              "as": "text",
              "from": "1znvqbi",
              "to": "4d8qcss"
            }
          },
          "id": "@debug.input_value",
          "nodes": {
            "1c4vbjw": {
              "id": "1c4vbjw",
              "ref": "@flow.ap"
            },
            "1ovmmn3": {
              "id": "1ovmmn3",
              "ref": "arg",
              "value": "value"
            },
            "1znvqbi": {
              "id": "1znvqbi",
              "ref": "arg",
              "value": "_stored.value"
            },
            "3jphobh": {
              "id": "3jphobh",
              "ref": "arg",
              "value": "value"
            },
            "4d8qcss": {
              "id": "4d8qcss",
              "ref": "@html.html_text"
            },
            "5a6pljw": {
              "id": "5a6pljw",
              "ref": "@html.html_element",
              "value": "pre"
            },
            "73asljg": {
              "id": "73asljg",
              "ref": "arg",
              "value": "value"
            },
            "9ukj84k": {
              "id": "9ukj84k",
              "ref": "@memory.refval"
            },
            "a8nnxeo": {
              "id": "a8nnxeo",
              "value": "2"
            },
            "bi1dbsb": {
              "id": "bi1dbsb",
              "ref": "@js.script",
              "value": "return value"
            },
            "dqau7vz": {
              "id": "dqau7vz",
              "ref": "arg",
              "value": "_stored.set"
            },
            "h8q885n": {
              "id": "h8q885n",
              "value": "true"
            },
            "hm2lkjh": {
              "id": "hm2lkjh"
            },
            "n028q0n": {
              "id": "n028q0n",
              "ref": "arg",
              "value": "_stored.value"
            },
            "out": {
              "id": "out",
              "name": "@debug.input_value",
              "ref": "return"
            },
            "psog7hu": {
              "id": "psog7hu",
              "ref": "@js.script",
              "value": "\nreturn JSON.stringify(object, (key, value) =>  typeof value === 'object' && value && !Array.isArray(value) && Object.getPrototypeOf(value) !== Object.prototype && Object.getPrototypeOf(value) ? Object.getPrototypeOf(value).constructor.name : value, 2)"
            },
            "rg59xbc": {
              "id": "rg59xbc",
              "value": "true"
            },
            "s7kudco": {
              "id": "s7kudco",
              "ref": "arg",
              "value": "value"
            },
            "ut9zq8n": {
              "id": "ut9zq8n",
              "ref": "@flow.if"
            },
            "wo0j48j": {
              "id": "wo0j48j"
            },
            "xm523y9": {
              "id": "xm523y9",
              "ref": "arg",
              "value": "value"
            },
            "xzbcdnj": {
              "id": "xzbcdnj",
              "ref": "@js.script",
              "value": "return stored === undefined || ischanged;"
            },
            "zfl3aqg": {
              "id": "zfl3aqg",
              "ref": "@data.ischanged"
            }
          },
          "out": "out"
        },
        "@data.reduce": {
          "id": "@data.reduce",
          "category": "data",
          "description": "<a target='_blank' href='https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/reduce'>Aray.reduce</a> the `array` with `fn`. Arguments for `fn` are `previous`, `current`, `index`, `array`, and a unique per nested loop `key`.",
          "name": "reduce",
          "in": "m3b5wg3",
          "out": "tgurdpo",
          "nodes": {
            "tgurdpo": {
              "id": "tgurdpo",
              "ref": "@js.call",
              "name": "@data.reduce"
            },
            "key": {
              "id": "key",
              "ref": "arg",
              "value": "key"
            },
            "rielyq8": {
              "id": "rielyq8",
              "value": "reduce",
              "name": "rielyq8"
            },
            "1rre4bx": {
              "ref": "arg",
              "id": "1rre4bx",
              "value": "array",
              "name": "1rre4bx"
            },
            "6g75abk": {
              "ref": "arg",
              "id": "6g75abk",
              "value": "fn",
              "name": "6g75abk"
            },
            "w0zzawl": {
              "id": "w0zzawl",
              "ref": "@data.array",
              "name": "w0zzawl"
            },
            "args": {
              "id": "args",
              "ref": "arg",
              "value": "args",
              "type": "local"
            },
            "initial": {
              "id": "initial",
              "ref": "arg",
              "value": "initial"
            },
            "pdljod1": {
              "id": "pdljod1",
              "name": "pdljod1",
              "ref": "@js.script",
              "value": "return (previous, current, index, array) => _lib.no.run(fn?.graph ?? _graph, fn?.fn ?? fn, Object.assign({}, args ?? {}, fn.args ?? {}, {previous, current, index, array, key: outer_key ? `${index}_${outer_key}` : `${index}`}), _lib);"
            },
            "2lvs5dj": {
              "id": "2lvs5dj",
              "ref": "@js.script",
              "value": "return _graph",
              "name": "2lvs5dj"
            }
          },
          "edges": [
            {
              "from": "rielyq8",
              "to": "tgurdpo",
              "as": "fn"
            },
            {
              "from": "1rre4bx",
              "to": "tgurdpo",
              "as": "self"
            },
            {
              "from": "w0zzawl",
              "to": "tgurdpo",
              "as": "args",
              "type": "resolve"
            },
            {
              "from": "pdljod1",
              "to": "w0zzawl",
              "as": "a0"
            },
            {
              "from": "initial",
              "to": "w0zzawl",
              "as": "a1"
            },
            {
              "from": "2lvs5dj",
              "to": "pdljod1",
              "as": "graph"
            },
            {
              "from": "key",
              "to": "pdljod1",
              "as": "outer_key"
            },
            {
              "from": "args",
              "to": "pdljod1",
              "as": "args"
            },
            {
              "from": "6g75abk",
              "to": "pdljod1",
              "as": "fn"
            }
          ]
        },
        "@data.map": {
          "id": "@data.map",
          "out": "out",
          "category": "data",
          "ref": "extern",
          "value": "extern.map",
          "description": "<a target='_blank' href='https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/map'>Aray.map</a> the `array` with `fn`. Arguments for `fn` are `element`, `index`, `array`, and a unique per nested loop `key`."
        },
        "@data.filter": {
          "id": "@data.filter",
          "category": "data",
          "description": "<a target='_blank' href='https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/filter'>Aray.filter</a> the `array` with `fn`. Arguments for `fn` are `element`, `index`, `array`, and a unique per nested loop `key`.",
          "out": "out",
          "nodes": {
            "object": {
              "id": "object",
              "ref": "arg",
              "value": "array"
            },
            "pred_fn": {
              "id": "pred_fn",
              "ref": "arg",
              "value": "fn"
            },
            "el_currentValue": {
              "id": "el_currentValue",
              "ref": "arg",
              "value": "currentValue"
            },
            "pred_fn_args": {
              "id": "pred_fn_args"
            },
            "run_pred": {
              "id": "run_pred",
              "value": "true"
            },
            "pred_element_fn": {
              "id": "pred_element_fn",
              "ref": "extern",
              "value": "extern.ap"
            },
            "currentValue": {
              "id": "currentValue",
              "ref": "arg",
              "value": "currentValue"
            },
            "previousValue": {
              "id": "previousValue",
              "ref": "arg",
              "value": "previousValue"
            },
            "pred_append": {
              "id": "pred_append",
              "ref": "@js.script",
              "value": "if(pred !== false && pred !== undefined && pred !== null){ arr.push(value); } return arr;"
            },
            "pred_append_fn_args": {
              "id": "pred_append_fn_args",
              "value": '{"previousValue": "undefined", "currentValue": "undefined"}'
            },
            "pred_append_fn": {
              "id": "pred_append_fn",
              "ref": "@flow.runnable"
            },
            "initial": {
              "id": "initial",
              "value": "[]"
            },
            "fold": {
              "id": "fold",
              "ref": "extern",
              "value": "extern.fold"
            },
            "out": {
              "id": "out",
              "ref": "return",
              "name": "@data.filter"
            }
          },
          "edges": [
            {
              "from": "el_currentValue",
              "to": "pred_fn_args",
              "as": "element"
            },
            {
              "from": "pred_fn_args",
              "to": "pred_element_fn",
              "as": "args"
            },
            {
              "from": "pred_fn",
              "to": "pred_element_fn",
              "as": "fn"
            },
            {
              "from": "run_pred",
              "to": "pred_element_fn",
              "as": "run"
            },
            {
              "from": "currentValue",
              "to": "pred_append",
              "as": "value"
            },
            {
              "from": "previousValue",
              "to": "pred_append",
              "as": "arr"
            },
            {
              "from": "pred_element_fn",
              "to": "pred_append",
              "as": "pred"
            },
            {
              "from": "pred_append",
              "to": "pred_append_fn",
              "as": "fn"
            },
            {
              "from": "pred_append_fn_args",
              "to": "pred_append_fn",
              "as": "parameters"
            },
            {
              "from": "pred_append_fn",
              "to": "fold",
              "as": "fn"
            },
            {
              "from": "object",
              "to": "fold",
              "as": "object"
            },
            {
              "from": "initial",
              "to": "fold",
              "as": "initial"
            },
            {
              "from": "fold",
              "to": "out",
              "as": "value"
            }
          ]
        },
        "@nodysseus.import_json": {
          "id": "@nodysseus.import_json",
          "description": "Imports the node or nodes found at the `url`.",
          "name": "import_json",
          "category": "nodysseus",
          "out": "out",
          "nodes": {
            "lapeojg": {
              "id": "lapeojg",
              "ref": "@js.script",
              "value": "import_graph.forEach(_lib.no.runtime.add_ref); _lib.no.runtime.change_graph(_lib.no.runtime.get_graph(graphid.substring(0, graphid.indexOf('/'))))",
              "name": "out"
            },
            "out": {
              "id": "out",
              "ref": "return",
              "name": "@nodysseus.import_json"
            },
            "3zfjt1h": {
              "id": "3zfjt1h",
              "ref": "@js.call"
            },
            "05eag47": {
              "id": "05eag47",
              "ref": "arg",
              "value": "name"
            },
            "graphid": {
              "id": "graphid",
              "ref": "arg",
              "value": "__graphid"
            },
            "2vtokcl": {
              "id": "2vtokcl",
              "ref": "@js.script",
              "value": "return fetch(url);"
            },
            "i9x02is": {
              "id": "i9x02is",
              "value": "json"
            },
            "irr99xz": {
              "id": "irr99xz",
              "ref": "arg",
              "value": "url"
            }
          },
          "edges": [
            {
              "as": "import_graph",
              "from": "3zfjt1h",
              "to": "lapeojg"
            },
            {
              "from": "graphid",
              "to": "lapeojg",
              "as": "graphid"
            },
            {
              "from": "05eag47",
              "to": "lapeojg",
              "as": "name"
            },
            {
              "from": "lapeojg",
              "to": "out",
              "as": "value"
            },
            {
              "as": "self",
              "from": "2vtokcl",
              "to": "3zfjt1h"
            },
            {
              "from": "i9x02is",
              "to": "3zfjt1h",
              "as": "fn"
            },
            {
              "from": "irr99xz",
              "to": "2vtokcl",
              "as": "url"
            }
          ]
        },
        "@data.object_entries": {
          "id": "@data.object_entries",
          "category": "data",
          "description": "Calls <a target='_blank' href='https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/entries'>Object.entries</a> on `object`.",
          "name": "object_entries",
          "in": "tkd4tqn",
          "out": "j8c79uf",
          "nodes": {
            "j8c79uf": {
              "name": "@data.object_entries",
              "id": "j8c79uf",
              "ref": "@data.filter"
            },
            "hfexsuu": {
              "id": "hfexsuu",
              "ref": "@js.script",
              "value": "return !key?.startsWith('_');"
            },
            "runnable_args": {
              "id": "runnable_args",
              "value": '{"element": "undefined"}'
            },
            "runnable": {
              "id": "runnable",
              "ref": "@flow.runnable"
            },
            "bgi2g37": {
              "id": "bgi2g37",
              "ref": "@js.script",
              "value": "return obj instanceof Map ? [...obj.entries()] : Object.entries(obj)"
            },
            "7gqcw0o": {
              "id": "7gqcw0o",
              "ref": "arg",
              "value": "0.0"
            },
            "kpakw50": {
              "id": "kpakw50",
              "ref": "arg",
              "value": "object"
            }
          },
          "edges": [
            {
              "from": "runnable_args",
              "to": "runnable",
              "as": "parameters"
            },
            {
              "from": "hfexsuu",
              "to": "runnable",
              "as": "fn"
            },
            {
              "from": "runnable",
              "to": "j8c79uf",
              "as": "fn"
            },
            {
              "from": "bgi2g37",
              "to": "j8c79uf",
              "as": "array"
            },
            {
              "from": "7gqcw0o",
              "to": "hfexsuu",
              "as": "key"
            },
            {
              "from": "kpakw50",
              "to": "bgi2g37",
              "as": "obj"
            }
          ]
        },
        "@html.css_styles": {
          "id": "@html.css_styles",
          "category": "html",
          "description": "Creates a style element from `css_object`. Inputs to the object should be labeled with css selectors, and inputs to those objects with css properties.",
          "name": "css_styles",
          "in": "xw3pmx7",
          "out": "out",
          "nodes": {
            "out": {
              "id": "out",
              "ref": "return",
              "name": "@html.css_styles"
            },
            "5yxmxua": {
              "id": "5yxmxua",
              "ref": "@html.html_element",
              "name": "out"
            },
            "vgv61zj": {
              "id": "vgv61zj",
              "ref": "@html.html_text"
            },
            "jstjx7g": {
              "id": "jstjx7g"
            },
            "h40e3j9": {
              "id": "h40e3j9",
              "value": "style"
            },
            "xw3pmx7": {
              "id": "xw3pmx7",
              "name": "in"
            },
            "jlgp7uy": {
              "id": "jlgp7uy",
              "ref": "@js.call",
              "name": "named_obj/out"
            },
            "o1j78dd": {
              "id": "o1j78dd",
              "value": "result-view"
            },
            "ij4z84e": {
              "id": "ij4z84e",
              "ref": "@data.map"
            },
            "q3pwj9j": {
              "id": "q3pwj9j",
              "value": "join"
            },
            "d6h3gdw": {
              "id": "d6h3gdw",
              "ref": "@data.array"
            },
            "j8c79uf": {
              "id": "j8c79uf",
              "name": "object_entries",
              "ref": "@data.object_entries"
            },
            "n9g4wyq": {
              "id": "n9g4wyq",
              "ref": "@flow.runnable"
            },
            "z63iaay": {
              "id": "z63iaay",
              "ref": "@js.script",
              "value": 'return "\\n";'
            },
            "vwsgweb": {
              "id": "vwsgweb",
              "ref": "@flow.default"
            },
            "aelf1a7": {
              "id": "aelf1a7",
              "ref": "@js.script",
              "value": "return key + '{' + value + '}'",
              "name": "out"
            },
            "mkwx4yx": {
              "id": "mkwx4yx"
            },
            "fzr4mkv": {
              "id": "fzr4mkv",
              "ref": "arg",
              "value": "css_object"
            },
            "5eqf77t": {
              "id": "5eqf77t",
              "value": "element.0",
              "ref": "arg"
            },
            "5pwetw5": {
              "id": "5pwetw5",
              "ref": "@flow.if"
            },
            "o5ojdyc": {
              "id": "o5ojdyc",
              "ref": "@js.script",
              "value": 'return key.startsWith("@keyframes")'
            },
            "1hpnid4": {
              "id": "1hpnid4",
              "ref": "@js.call"
            },
            "slj7ynn/jlgp7uy": {
              "id": "slj7ynn/jlgp7uy",
              "ref": "@js.call",
              "name": "named_obj/out"
            },
            "ft1oksl": {
              "id": "ft1oksl",
              "ref": "arg",
              "value": "element.0"
            },
            "bbbp82v": {
              "id": "bbbp82v",
              "ref": "@data.map"
            },
            "cp66ig5": {
              "id": "cp66ig5",
              "value": "join"
            },
            "uwq9u81": {
              "id": "uwq9u81",
              "ref": "@data.array"
            },
            "slj7ynn/ij4z84e": {
              "id": "slj7ynn/ij4z84e",
              "ref": "@data.map"
            },
            "slj7ynn/q3pwj9j": {
              "id": "slj7ynn/q3pwj9j",
              "value": "join"
            },
            "slj7ynn/d6h3gdw": {
              "id": "slj7ynn/d6h3gdw",
              "ref": "@data.array"
            },
            "i1ifamx": {
              "id": "i1ifamx",
              "ref": "@data.object_entries"
            },
            "druspar_args": {
              "id": "druspar_args",
              "value": '{"element": ""}'
            },
            "n9g4wyq_args": {
              "id": "n9g4wyq_args",
              "value": '{"element": ""}'
            },
            "slj7ynn/n9g4wyq_args": {
              "id": "slj7ynn/n9g4wyq_args",
              "value": '{"element": ""}'
            },
            "slj7ynn/druspar_args": {
              "id": "slj7ynn/druspar_args",
              "value": '{"element": ""}'
            },
            "druspar": {
              "id": "druspar",
              "ref": "@flow.runnable"
            },
            "gth1wc2": {
              "id": "gth1wc2",
              "ref": "@js.script",
              "value": 'return "\\n";'
            },
            "slj7ynn/j8c79uf": {
              "id": "slj7ynn/j8c79uf",
              "name": "object_entries",
              "ref": "@data.object_entries"
            },
            "slj7ynn/n9g4wyq": {
              "id": "slj7ynn/n9g4wyq",
              "ref": "@flow.runnable"
            },
            "slj7ynn/z63iaay": {
              "id": "slj7ynn/z63iaay",
              "ref": "@js.script",
              "value": 'return "\\n";'
            },
            "y25dg2n": {
              "id": "y25dg2n",
              "value": "element.1",
              "ref": "arg"
            },
            "0d4yh8u": {
              "id": "0d4yh8u",
              "ref": "@js.script",
              "value": `return key + ': ' + value + ";";`
            },
            "slj7ynn/vwsgweb": {
              "id": "slj7ynn/vwsgweb",
              "ref": "@flow.default"
            },
            "slj7ynn/aelf1a7": {
              "id": "slj7ynn/aelf1a7",
              "ref": "@js.script",
              "value": "return key + '{' + value + '}'",
              "name": "out"
            },
            "h13a9fd": {
              "id": "h13a9fd",
              "ref": "arg",
              "value": "element.0"
            },
            "h7me3v8": {
              "id": "h7me3v8",
              "ref": "arg",
              "value": "element.1"
            },
            "slj7ynn/mkwx4yx": {
              "id": "slj7ynn/mkwx4yx"
            },
            "slj7ynn/fzr4mkv": {
              "id": "slj7ynn/fzr4mkv",
              "ref": "arg",
              "value": "element.1"
            },
            "slj7ynn/5eqf77t": {
              "id": "slj7ynn/5eqf77t",
              "value": "element.0",
              "ref": "arg"
            },
            "slj7ynn/1hpnid4": {
              "id": "slj7ynn/1hpnid4",
              "ref": "@js.call"
            },
            "slj7ynn/bbbp82v": {
              "id": "slj7ynn/bbbp82v",
              "ref": "@data.map"
            },
            "slj7ynn/cp66ig5": {
              "id": "slj7ynn/cp66ig5",
              "value": "join"
            },
            "slj7ynn/uwq9u81": {
              "id": "slj7ynn/uwq9u81",
              "ref": "@data.array"
            },
            "slj7ynn/i1ifamx": {
              "id": "slj7ynn/i1ifamx",
              "ref": "@data.object_entries"
            },
            "slj7ynn/druspar": {
              "id": "slj7ynn/druspar",
              "ref": "@flow.runnable"
            },
            "slj7ynn/gth1wc2": {
              "id": "slj7ynn/gth1wc2",
              "ref": "@js.script",
              "value": 'return "\\n";'
            },
            "slj7ynn/y25dg2n": {
              "id": "slj7ynn/y25dg2n",
              "value": "element.1",
              "ref": "arg"
            },
            "slj7ynn/0d4yh8u": {
              "id": "slj7ynn/0d4yh8u",
              "ref": "@js.script",
              "value": `return key + ': ' + value + ";";`
            },
            "slj7ynn/h13a9fd": {
              "id": "slj7ynn/h13a9fd",
              "ref": "arg",
              "value": "element.0"
            },
            "slj7ynn/h7me3v8": {
              "id": "slj7ynn/h7me3v8",
              "ref": "arg",
              "value": "element.1"
            }
          },
          "edges": [
            {
              "from": "5yxmxua",
              "to": "out",
              "as": "value"
            },
            {
              "from": "vgv61zj",
              "to": "5yxmxua",
              "as": "children"
            },
            {
              "from": "jstjx7g",
              "to": "5yxmxua",
              "as": "props"
            },
            {
              "from": "h40e3j9",
              "to": "5yxmxua",
              "as": "dom_type"
            },
            {
              "from": "xw3pmx7",
              "to": "5yxmxua",
              "as": "arg3"
            },
            {
              "from": "jlgp7uy",
              "to": "vgv61zj",
              "as": "text"
            },
            {
              "from": "o1j78dd",
              "to": "jstjx7g",
              "as": "key"
            },
            {
              "from": "ij4z84e",
              "to": "jlgp7uy",
              "as": "self"
            },
            {
              "from": "q3pwj9j",
              "to": "jlgp7uy",
              "as": "fn"
            },
            {
              "from": "d6h3gdw",
              "to": "jlgp7uy",
              "as": "args"
            },
            {
              "from": "j8c79uf",
              "to": "ij4z84e",
              "as": "array"
            },
            {
              "as": "fn",
              "from": "n9g4wyq",
              "to": "ij4z84e"
            },
            {
              "from": "z63iaay",
              "to": "d6h3gdw",
              "as": "arg0"
            },
            {
              "from": "vwsgweb",
              "to": "j8c79uf",
              "as": "object"
            },
            {
              "as": "fn",
              "from": "aelf1a7",
              "to": "n9g4wyq"
            },
            {
              "from": "mkwx4yx",
              "to": "vwsgweb",
              "as": "otherwise"
            },
            {
              "from": "fzr4mkv",
              "to": "vwsgweb",
              "as": "value"
            },
            {
              "from": "5eqf77t",
              "to": "aelf1a7",
              "as": "key"
            },
            {
              "from": "5pwetw5",
              "to": "aelf1a7",
              "as": "value"
            },
            {
              "from": "o5ojdyc",
              "to": "5pwetw5",
              "as": "pred"
            },
            {
              "as": "false",
              "from": "1hpnid4",
              "to": "5pwetw5"
            },
            {
              "from": "slj7ynn/jlgp7uy",
              "to": "5pwetw5",
              "as": "true"
            },
            {
              "as": "key",
              "from": "ft1oksl",
              "to": "o5ojdyc"
            },
            {
              "from": "bbbp82v",
              "to": "1hpnid4",
              "as": "self"
            },
            {
              "from": "cp66ig5",
              "to": "1hpnid4",
              "as": "fn"
            },
            {
              "from": "uwq9u81",
              "to": "1hpnid4",
              "as": "args"
            },
            {
              "from": "slj7ynn/ij4z84e",
              "to": "slj7ynn/jlgp7uy",
              "as": "self"
            },
            {
              "from": "slj7ynn/q3pwj9j",
              "to": "slj7ynn/jlgp7uy",
              "as": "fn"
            },
            {
              "from": "slj7ynn/d6h3gdw",
              "to": "slj7ynn/jlgp7uy",
              "as": "args"
            },
            {
              "from": "i1ifamx",
              "to": "bbbp82v",
              "as": "array"
            },
            {
              "from": "slj7ynn/druspar_args",
              "as": "parameters",
              "to": "slj7ynn/druspar"
            },
            {
              "from": "slj7ynn/n9g4wyq_args",
              "as": "parameters",
              "to": "slj7ynn/n9g4wyq"
            },
            {
              "from": "n9g4wyq_args",
              "as": "parameters",
              "to": "n9g4wyq"
            },
            {
              "from": "druspar_args",
              "as": "parameters",
              "to": "druspar"
            },
            {
              "as": "fn",
              "from": "druspar",
              "to": "bbbp82v"
            },
            {
              "from": "gth1wc2",
              "to": "uwq9u81",
              "as": "arg0"
            },
            {
              "from": "slj7ynn/j8c79uf",
              "to": "slj7ynn/ij4z84e",
              "as": "array"
            },
            {
              "as": "fn",
              "from": "slj7ynn/n9g4wyq",
              "to": "slj7ynn/ij4z84e"
            },
            {
              "from": "slj7ynn/z63iaay",
              "to": "slj7ynn/d6h3gdw",
              "as": "arg0"
            },
            {
              "from": "y25dg2n",
              "to": "i1ifamx",
              "as": "object"
            },
            {
              "as": "fn",
              "from": "0d4yh8u",
              "to": "druspar"
            },
            {
              "from": "slj7ynn/vwsgweb",
              "to": "slj7ynn/j8c79uf",
              "as": "object"
            },
            {
              "as": "fn",
              "from": "slj7ynn/aelf1a7",
              "to": "slj7ynn/n9g4wyq"
            },
            {
              "from": "h13a9fd",
              "to": "0d4yh8u",
              "as": "key"
            },
            {
              "from": "h7me3v8",
              "to": "0d4yh8u",
              "as": "value"
            },
            {
              "from": "slj7ynn/mkwx4yx",
              "to": "slj7ynn/vwsgweb",
              "as": "otherwise"
            },
            {
              "from": "slj7ynn/fzr4mkv",
              "to": "slj7ynn/vwsgweb",
              "as": "value"
            },
            {
              "from": "slj7ynn/5eqf77t",
              "to": "slj7ynn/aelf1a7",
              "as": "key"
            },
            {
              "as": "value",
              "from": "slj7ynn/1hpnid4",
              "to": "slj7ynn/aelf1a7"
            },
            {
              "from": "slj7ynn/bbbp82v",
              "to": "slj7ynn/1hpnid4",
              "as": "self"
            },
            {
              "from": "slj7ynn/cp66ig5",
              "to": "slj7ynn/1hpnid4",
              "as": "fn"
            },
            {
              "from": "slj7ynn/uwq9u81",
              "to": "slj7ynn/1hpnid4",
              "as": "args"
            },
            {
              "from": "slj7ynn/i1ifamx",
              "to": "slj7ynn/bbbp82v",
              "as": "array"
            },
            {
              "as": "fn",
              "from": "slj7ynn/druspar",
              "to": "slj7ynn/bbbp82v"
            },
            {
              "from": "slj7ynn/gth1wc2",
              "to": "slj7ynn/uwq9u81",
              "as": "arg0"
            },
            {
              "from": "slj7ynn/y25dg2n",
              "to": "slj7ynn/i1ifamx",
              "as": "object"
            },
            {
              "as": "fn",
              "from": "slj7ynn/0d4yh8u",
              "to": "slj7ynn/druspar"
            },
            {
              "from": "slj7ynn/h13a9fd",
              "to": "slj7ynn/0d4yh8u",
              "as": "key"
            },
            {
              "from": "slj7ynn/h7me3v8",
              "to": "slj7ynn/0d4yh8u",
              "as": "value"
            }
          ]
        },
        "@html.css_anim": {
          "id": "@html.css_anim",
          "category": "html",
          "description": "Creates a css animation string. For use with `css_styles`.",
          "name": "css_anim",
          "in": "cawqofn",
          "out": "spy9h48",
          "nodes": {
            "spy9h48": {
              "name": "@html.css_anim",
              "id": "spy9h48",
              "ref": "@js.script",
              "value": 'return Object.fromEntries((Array.isArray(arr[0]) ? arr[0] : arr).map((v, i, a) => [Math.floor((i / a.length)*100) + "%", v]))'
            },
            "cawqofn": {
              "id": "cawqofn",
              "ref": "@data.array",
              "name": "in"
            }
          },
          "edges": [
            {
              "as": "arr",
              "from": "cawqofn",
              "to": "spy9h48",
              "type": "resolve"
            }
          ]
        },
        "@html.input": {
          "category": "html",
          "edges": [
            {
              "from": "gvkhkfw",
              "to": "nn4twx9",
              "as": "children"
            },
            {
              "from": "7rhq0q5",
              "to": "nn4twx9",
              "as": "_"
            },
            {
              "from": "4972gx3",
              "to": "gvkhkfw",
              "as": "arg1"
            },
            {
              "from": "1ldhfah",
              "to": "gvkhkfw",
              "as": "arg0"
            },
            {
              "from": "ee5i5r2",
              "to": "4972gx3",
              "as": "dom_type"
            },
            {
              "from": "ro8n2gc",
              "to": "4972gx3",
              "as": "props"
            },
            {
              "from": "wet0jdv",
              "to": "1ldhfah",
              "as": "children"
            },
            {
              "from": "gcuxiw9",
              "to": "1ldhfah",
              "as": "props"
            },
            {
              "from": "875c1wk",
              "to": "1ldhfah",
              "as": "dom_type"
            },
            {
              "from": "t6q6rvf",
              "to": "ro8n2gc",
              "as": "arg0"
            },
            {
              "from": "rjwtb3c",
              "to": "ro8n2gc",
              "as": "props"
            },
            {
              "from": "utkc9o6",
              "to": "wet0jdv",
              "as": "arg0"
            },
            {
              "from": "jxl9r29",
              "to": "gcuxiw9",
              "as": "for"
            },
            {
              "from": "2zxw9oo",
              "to": "t6q6rvf",
              "as": "onkeydown"
            },
            {
              "from": "i7y9dyy",
              "to": "t6q6rvf",
              "as": "onchange"
            },
            {
              "from": "vks4vul",
              "to": "rjwtb3c",
              "as": "value"
            },
            {
              "from": "ddfgy2s",
              "to": "rjwtb3c",
              "as": "otherwise"
            },
            {
              "from": "trd8ptp",
              "to": "utkc9o6",
              "as": "text"
            },
            {
              "from": "zfrrk0z",
              "to": "jxl9r29",
              "as": "value"
            },
            {
              "to": "2zxw9oo",
              "from": "qseh2tb",
              "as": "fn",
              "type": "ref"
            },
            {
              "from": "b0j8nyq",
              "to": "i7y9dyy",
              "as": "dispatch"
            },
            {
              "from": "eotod0l",
              "to": "i7y9dyy",
              "as": "seq"
            },
            {
              "from": "qxwvdfe",
              "to": "i7y9dyy",
              "as": "value"
            },
            {
              "from": "0dnqo5l",
              "to": "i7y9dyy",
              "as": "onchange_fn"
            },
            {
              "from": "1wps21n",
              "to": "qseh2tb",
              "as": "a1"
            },
            {
              "from": "y5q7mbn",
              "to": "qseh2tb",
              "as": "a0"
            },
            {
              "from": "qjc0zt6",
              "to": "eotod0l",
              "as": "arg"
            },
            {
              "from": "widk6u6",
              "to": "qjc0zt6",
              "as": "fn"
            },
            {
              "from": "506ntvb",
              "to": "qjc0zt6",
              "as": "value"
            },
            {
              "from": "4ck1vaf",
              "to": "widk6u6",
              "as": "fn"
            }
          ],
          "nodes": {
            "nn4twx9": {
              "id": "nn4twx9",
              "ref": "@html.html_element",
              "inputs": [
                {
                  "from": "bw4iez5/gvkhkfw",
                  "to": "bw4iez5/nn4twx9",
                  "as": "children"
                },
                {
                  "from": "bw4iez5/7rhq0q5",
                  "to": "bw4iez5/nn4twx9",
                  "as": "props"
                }
              ],
              "name": "@html.input"
            },
            "gvkhkfw": {
              "id": "gvkhkfw",
              "ref": "@data.array"
            },
            "7rhq0q5": {
              "id": "7rhq0q5",
              "name": "in"
            },
            "1ldhfah": {
              "id": "1ldhfah",
              "ref": "@html.html_element",
              "name": "label"
            },
            "4972gx3": {
              "id": "4972gx3",
              "ref": "@html.html_element"
            },
            "wet0jdv": {
              "id": "wet0jdv",
              "ref": "@data.array"
            },
            "gcuxiw9": {
              "id": "gcuxiw9"
            },
            "875c1wk": {
              "id": "875c1wk",
              "value": "label"
            },
            "ee5i5r2": {
              "id": "ee5i5r2",
              "value": "input"
            },
            "ro8n2gc": {
              "id": "ro8n2gc",
              "ref": "@data.merge_objects"
            },
            "n1qcxu2": {
              "id": "n1qcxu2",
              "value": "true"
            },
            "utkc9o6": {
              "id": "utkc9o6",
              "ref": "@html.html_text"
            },
            "jxl9r29": {
              "id": "jxl9r29",
              "ref": "@js.script",
              "value": 'return "input-" + name;'
            },
            "t6q6rvf": {
              "id": "t6q6rvf"
            },
            "rjwtb3c": {
              "id": "rjwtb3c",
              "ref": "@flow.default"
            },
            "varubwp": {
              "id": "varubwp"
            },
            "trd8ptp": {
              "id": "trd8ptp",
              "ref": "arg",
              "value": "name"
            },
            "zfrrk0z": {
              "id": "zfrrk0z",
              "ref": "arg",
              "value": "name"
            },
            "2zxw9oo": {
              "id": "2zxw9oo",
              "ref": "run",
              "name": "stop_propagation"
            },
            "sjw3rie": {
              "id": "sjw3rie",
              "ref": "@flow.default"
            },
            "vks4vul": {
              "id": "vks4vul",
              "ref": "arg",
              "value": "props"
            },
            "ddfgy2s": {
              "id": "ddfgy2s"
            },
            "671rzr9": {
              "id": "671rzr9",
              "ref": "arg",
              "value": "name"
            },
            "ccir2fl": {
              "id": "ccir2fl",
              "ref": "arg",
              "value": "name"
            },
            "qseh2tb": {
              "id": "qseh2tb",
              "ref": "@data.array"
            },
            "i7y9dyy": {
              "id": "i7y9dyy",
              "ref": "@flow.runnable"
            },
            "fihihz0": {
              "id": "fihihz0",
              "ref": "arg",
              "value": "oninput"
            },
            "1wps21n": {
              "id": "1wps21n",
              "name": "stop propagation effect",
              "out": "hj2cig0",
              "nodes": [
                {
                  "id": "hj2cig0",
                  "ref": "array",
                  "name": "stop propagation effect"
                },
                {
                  "id": "1pvaim9",
                  "ref": "run"
                },
                {
                  "id": "0o86xp3",
                  "ref": "arg",
                  "value": "1"
                },
                {
                  "id": "d60jwms",
                  "ref": "script",
                  "value": "payload.stopPropagation();"
                },
                {
                  "id": "xgbubrq",
                  "ref": "arg",
                  "value": "1"
                }
              ],
              "edges": [
                {
                  "from": "1pvaim9",
                  "to": "hj2cig0",
                  "as": "a0"
                },
                {
                  "from": "0o86xp3",
                  "to": "hj2cig0",
                  "as": "a1"
                },
                {
                  "from": "d60jwms",
                  "to": "1pvaim9",
                  "as": "fn",
                  "type": "ref"
                },
                {
                  "from": "xgbubrq",
                  "to": "d60jwms",
                  "as": "payload"
                }
              ]
            },
            "y5q7mbn": {
              "id": "y5q7mbn",
              "ref": "arg",
              "value": "0"
            },
            "y9bkhqc": {
              "id": "y9bkhqc"
            },
            "6m6m1hq_1/ocuonub/qjc0zt6": {
              "id": "6m6m1hq_1/ocuonub/qjc0zt6",
              "ref": "event_publisher"
            },
            "nb2sswc": {
              "id": "nb2sswc",
              "ref": "arg",
              "value": "name"
            },
            "6m6m1hq_1/ocuonub/506ntvb": {
              "id": "6m6m1hq_1/ocuonub/506ntvb",
              "value": "event.target.value",
              "ref": "arg"
            },
            "6m6m1hq_1/ocuonub/4ck1vaf": {
              "id": "6m6m1hq_1/ocuonub/4ck1vaf",
              "ref": "arg",
              "value": "name"
            }
          },
          "out": "nn4twx9",
          "in": "7rhq0q5",
          "name": "input",
          "id": "@html.input"
        },
        "@html.html_text": {
          "id": "@html.html_text",
          "category": "html",
          "description": "Some HTML plaintext of `text` (or this node's value). Usually used as a child of html_element.",
          "out": "out",
          "nodes": {
            "arg_text": {
              "id": "arg_text",
              "ref": "arg",
              "value": "text"
            },
            "value_text": {
              "id": "value_text",
              "ref": "arg",
              "value": "__graph_value"
            },
            "text": {
              "id": "text",
              "ref": "@flow.default"
            },
            "text_value": {
              "id": "text_value",
              "value": "text_value"
            },
            "out": {
              "id": "out",
              "name": "@html.html_text"
            }
          },
          "edges": [
            {
              "from": "text_value",
              "to": "out",
              "as": "dom_type"
            },
            {
              "from": "arg_text",
              "to": "text",
              "as": "value"
            },
            {
              "from": "value_text",
              "to": "text",
              "as": "otherwise"
            },
            {
              "from": "text",
              "to": "out",
              "as": "text"
            }
          ]
        },
        "@html.html_element": {
          "id": "@html.html_element",
          "category": "html",
          "out": "out_ret",
          "description": "An HTML Element. `children` is an array of html_element or html_text, `props` are the attributes for the html element as an object, `dom_type` (or this node's value) is the dom type, `memo` refers to <a target='_blank' href='https://github.com/jorgebucaran/hyperapp/blob/main/docs/api/memo.md'>hyperapp's memo</a>.",
          "nodes": {
            "children": {
              "id": "children",
              "ref": "arg",
              "value": "children"
            },
            "props": {
              "id": "props",
              "ref": "arg",
              "value": "props"
            },
            "dom_type": {
              "id": "dom_type",
              "ref": "arg",
              "value": "dom_type"
            },
            "memo": {
              "id": "memo",
              "ref": "arg",
              "value": "memo"
            },
            "value": {
              "id": "value",
              "ref": "arg",
              "value": "value"
            },
            "element_dt": {
              "id": "element_dt",
              "ref": "arg",
              "value": "element.dom_type"
            },
            "element": {
              "id": "element",
              "ref": "arg",
              "value": "element"
            },
            "element_tv": {
              "id": "element_tv",
              "ref": "arg",
              "value": "element.text_value"
            },
            "div": {
              "id": "div",
              "value": "div"
            },
            "dom_type_value": {
              "id": "dom_type_value",
              "ref": "@flow.default"
            },
            "graph_value": {
              "id": "graph_value",
              "ref": "arg",
              "value": "__graph_value"
            },
            "filter_children_fn": {
              "id": "filter_children_fn",
              "ref": "@js.script",
              "value": "return !!(element_dt || element_tv)"
            },
            "filter_children_fn_runnable_args": {
              "id": "filter_children_fn_runnable_args",
              "value": '{"element": "undefined"}'
            },
            "filter_children_fn_runnable": {
              "id": "filter_children_fn_runnable",
              "ref": "@flow.runnable"
            },
            "fill_children_fn": {
              "id": "fill_children_fn",
              "ref": "@js.script",
              "value": "return element?.el ?? typeof element === 'string' ? {dom_type: 'text_value', text: element} : element"
            },
            "fill_children_fn_runnable_args": {
              "id": "fill_children_fn_runnable_args",
              "value": '{"element": "undefined"}'
            },
            "fill_children_fn_runnable": {
              "id": "fill_children_fn_runnable",
              "ref": "@flow.runnable"
            },
            "wrapped_children": {
              "id": "wrapped_children",
              "ref": "@js.script",
              "value": "return Array.isArray(children) ? children : children !== undefined ? [children] : []"
            },
            "filter_children": {
              "id": "filter_children",
              "ref": "@data.filter"
            },
            "fill_children": {
              "id": "fill_children",
              "ref": "@data.map"
            },
            "fill_props": {
              "id": "fill_props",
              "ref": "@js.script",
              "value": "return props ?? {}"
            },
            "dom_type_def": {
              "id": "dom_type_def",
              "ref": "@flow.default"
            },
            "out": {
              "id": "out",
              "ref": "@js.script",
              "value": "if(!(typeof dom_type === 'string' && typeof children === 'object')){ throw new Error('invalid element');} return {dom_type, props, children: children, memo, value}"
            },
            "out_ret": {
              "id": "out_ret",
              "ref": "return",
              "name": "@html.html_element"
            }
          },
          "edges": [
            {
              "from": "children",
              "to": "wrapped_children",
              "as": "children"
            },
            {
              "from": "wrapped_children",
              "to": "fill_children",
              "as": "array"
            },
            {
              "from": "props",
              "to": "fill_props",
              "as": "props"
            },
            {
              "from": "memo",
              "to": "out",
              "as": "memo"
            },
            {
              "from": "element_dt",
              "to": "filter_children_fn",
              "as": "element_dt"
            },
            {
              "from": "element_tv",
              "to": "filter_children_fn",
              "as": "element_tv"
            },
            {
              "from": "filter_children_fn_runnable_args",
              "to": "filter_children_fn_runnable",
              "as": "parameters"
            },
            {
              "from": "filter_children_fn",
              "to": "filter_children_fn_runnable",
              "as": "fn"
            },
            {
              "from": "filter_children_fn_runnable",
              "to": "filter_children",
              "as": "fn"
            },
            {
              "from": "element",
              "to": "fill_children_fn",
              "as": "element"
            },
            {
              "from": "fill_children_fn_runnable_args",
              "to": "fill_children_fn_runnable",
              "as": "parameters"
            },
            {
              "from": "fill_children_fn",
              "to": "fill_children_fn_runnable",
              "as": "fn"
            },
            {
              "from": "fill_children_fn_runnable",
              "to": "fill_children",
              "as": "fn"
            },
            {
              "from": "fill_children",
              "to": "filter_children",
              "as": "array"
            },
            {
              "from": "filter_children",
              "to": "out",
              "as": "children"
            },
            {
              "from": "value",
              "to": "out",
              "as": "value"
            },
            {
              "from": "fill_props",
              "to": "out",
              "as": "props"
            },
            {
              "from": "dom_type",
              "to": "dom_type_def",
              "as": "value"
            },
            {
              "from": "div",
              "to": "dom_type_value",
              "as": "otherwise"
            },
            {
              "from": "graph_value",
              "to": "dom_type_value",
              "as": "value"
            },
            {
              "from": "dom_type_value",
              "to": "dom_type_def",
              "as": "otherwise"
            },
            {
              "from": "dom_type_def",
              "to": "out",
              "as": "dom_type"
            },
            {
              "from": "out",
              "to": "out_ret",
              "as": "value"
            }
          ]
        },
        "@html.icon": {
          "id": "@html.icon",
          "description": "A ionicon in hyperapp format.",
          "category": "html",
          "name": "icon",
          "out": "c2sko9c",
          "nodes": {
            "c2sko9c": {
              "id": "c2sko9c",
              "ref": "@html.html_element",
              "name": "@html.icon"
            },
            "2lr3ihi": {
              "id": "2lr3ihi",
              "value": "span"
            },
            "empty_obj": {
              "id": "empty_obj",
              "value": {}
            },
            "props": {
              "id": "props",
              "ref": "arg",
              "value": "props"
            },
            "props_pred": {
              "id": "props_pred",
              "ref": "arg",
              "value": "props"
            },
            "iconclass": {
              "id": "iconclass",
              "value": "material-icons-outlined"
            },
            "defined_props": {
              "id": "defined_props",
              "ref": "@flow.if"
            },
            "name_path": {
              "id": "name_path",
              "value": "name"
            },
            "a0jb5es": {
              "id": "a0jb5es",
              "ref": "@data.set",
              "value": "class"
            },
            "s5x2r1f": {
              "id": "s5x2r1f",
              "ref": "arg",
              "value": "icon"
            }
          },
          "edges": [
            {
              "from": "2lr3ihi",
              "to": "c2sko9c",
              "as": "dom_type"
            },
            {
              "from": "props",
              "to": "defined_props",
              "as": "true"
            },
            {
              "from": "props_pred",
              "to": "defined_props",
              "as": "pred"
            },
            {
              "from": "empty_obj",
              "to": "defined_props",
              "as": "false"
            },
            {
              "from": "defined_props",
              "to": "a0jb5es",
              "as": "target"
            },
            {
              "from": "iconclass",
              "to": "a0jb5es",
              "as": "value"
            },
            {
              "from": "a0jb5es",
              "to": "c2sko9c",
              "as": "props"
            },
            {
              "from": "s5x2r1f",
              "to": "c2sko9c",
              "as": "children"
            }
          ]
        },
        "@data.not": {
          "id": "@data.not",
          "ref": "@js.script",
          "category": "data",
          "value": "return !target"
        },
        "@html.canvas_behind_editor": {
          "id": "@html.canvas_behind_editor",
          "out": "out",
          "nodes": {
            "args": {
              "id": "args"
            },
            "5a6pljw": {
              "id": "5a6pljw",
              "ref": "@html.html_element"
            },
            "h2e7s9l": {
              "id": "h2e7s9l",
              "value": "canvas"
            },
            "imr2dvi": {
              "id": "imr2dvi",
              "ref": "@html.html_element"
            },
            "09epq8r": {
              "id": "09epq8r",
              "ref": "@data.array"
            },
            "af9fknz": {
              "id": "af9fknz",
              "value": "canvas",
              "ref": "@html.html_element"
            },
            "cilv4od": {
              "id": "cilv4od"
            },
            "zvop9wi": {
              "id": "zvop9wi",
              "value": "canvas_id",
              "ref": "arg"
            },
            "zvop9wi_2": {
              "id": "zvop9wi_2",
              "value": "canvas_id",
              "ref": "arg"
            },
            "qe7qvud": {
              "id": "qe7qvud",
              "ref": "@html.css_styles"
            },
            "45uuwjl": {
              "id": "45uuwjl"
            },
            "ejd0zjg": {
              "id": "ejd0zjg"
            },
            "50811j9": {
              "id": "50811j9",
              "ref": "@data.set"
            },
            "vmabx98": {
              "id": "vmabx98",
              "value": "return `#${canvas_id}`",
              "ref": "@js.script"
            },
            "ah2tu3m": {
              "id": "ah2tu3m",
              "value": "canvas_id",
              "ref": "arg"
            },
            "cxwaij4": {
              "id": "cxwaij4"
            },
            "8cq1yfs": {
              "id": "8cq1yfs",
              "value": "return window.innerWidth",
              "ref": "@js.script"
            },
            "q96l549": {
              "id": "q96l549",
              "value": "return window.innerHeight",
              "ref": "@js.script"
            },
            "icdi8jh": {
              "id": "icdi8jh",
              "value": "1"
            },
            "b6e9ux3": {
              "id": "b6e9ux3",
              "value": "relative"
            },
            "zq4ni3x": {
              "id": "zq4ni3x"
            },
            "uzulnsq": {
              "id": "uzulnsq",
              "value": "absolute"
            },
            "aoi9bi9": {
              "id": "aoi9bi9",
              "value": "unset"
            },
            "3ucsio2": {
              "id": "3ucsio2"
            },
            "jzduiha": {
              "id": "jzduiha",
              "value": "32"
            },
            "kup95dw": {
              "id": "kup95dw",
              "value": "64"
            },
            "75jvde6": {
              "id": "75jvde6",
              "value": "fixed",
              "name": ""
            },
            "0uhor53": {
              "id": "0uhor53",
              "value": "100%"
            },
            "ag93b9f": {
              "id": "ag93b9f",
              "value": "100%"
            },
            "zgmfuzy": {
              "id": "zgmfuzy",
              "value": "0"
            },
            "dx3qg99": {
              "id": "dx3qg99",
              "value": "0",
              "name": ""
            },
            "z54r0bl": {
              "id": "z54r0bl"
            },
            "tok49em": {
              "id": "tok49em",
              "value": "12"
            },
            "tok49eq": {
              "id": "tok49eq",
              "value": "relative"
            },
            "out": {
              "id": "out",
              "name": "@html.canvas_behind_editor",
              "ref": "return"
            },
            "hzvlwu7": {
              "id": "hzvlwu7"
            },
            "mcpndlx": {
              "id": "mcpndlx",
              "value": "48"
            }
          },
          "edges": {
            "args": {
              "from": "args",
              "to": "out",
              "as": "args"
            },
            "imr2dvi": {
              "from": "imr2dvi",
              "to": "out",
              "as": "value"
            },
            "h2e7s9l": {
              "from": "h2e7s9l",
              "to": "args",
              "as": "canvas_id"
            },
            "09epq8r": {
              "from": "09epq8r",
              "to": "imr2dvi",
              "as": "children"
            },
            "af9fknz": {
              "from": "af9fknz",
              "to": "09epq8r",
              "as": "arg0"
            },
            "cilv4od": {
              "from": "cilv4od",
              "to": "af9fknz",
              "as": "props"
            },
            "zvop9wi": {
              "from": "zvop9wi",
              "to": "cilv4od",
              "as": "id"
            },
            "zvop9wi_2": {
              "from": "zvop9wi_2",
              "to": "cilv4od",
              "as": "key"
            },
            "qe7qvud": {
              "from": "qe7qvud",
              "to": "09epq8r",
              "as": "arg1"
            },
            "50811j9": {
              "from": "50811j9",
              "to": "qe7qvud",
              "as": "css_object"
            },
            "45uuwjl": {
              "from": "45uuwjl",
              "to": "50811j9",
              "as": "target"
            },
            "vmabx98": {
              "from": "vmabx98",
              "to": "50811j9",
              "as": "path"
            },
            "ah2tu3m": {
              "from": "ah2tu3m",
              "to": "vmabx98",
              "as": "canvas_id"
            },
            "cxwaij4": {
              "from": "cxwaij4",
              "to": "50811j9",
              "as": "value"
            },
            "75jvde6": {
              "from": "75jvde6",
              "to": "cxwaij4",
              "as": "position"
            },
            "8cq1yfs": {
              "from": "8cq1yfs",
              "to": "cilv4od",
              "as": "width"
            },
            "q96l549": {
              "from": "q96l549",
              "to": "cilv4od",
              "as": "height"
            },
            "icdi8jh": {
              "from": "icdi8jh",
              "to": "cxwaij4",
              "as": "z-index"
            },
            "jzduiha": {
              "from": "jzduiha",
              "to": "ejd0zjg",
              "as": "z-index"
            },
            "b6e9ux3": {
              "from": "b6e9ux3",
              "to": "ejd0zjg",
              "as": "position"
            },
            "zq4ni3x": {
              "from": "zq4ni3x",
              "to": "45uuwjl",
              "as": "#node-editor-result"
            },
            "uzulnsq": {
              "from": "uzulnsq",
              "to": "zq4ni3x",
              "as": "position"
            },
            "aoi9bi9": {
              "from": "aoi9bi9",
              "to": "zq4ni3x",
              "as": "z-index"
            },
            "kup95dw": {
              "from": "kup95dw",
              "to": "3ucsio2",
              "as": "z-index"
            },
            "3ucsio2": {
              "from": "3ucsio2",
              "to": "45uuwjl",
              "as": "#node-info-wrapper"
            },
            "0uhor53": {
              "from": "0uhor53",
              "to": "cxwaij4",
              "as": "width"
            },
            "ag93b9f": {
              "from": "ag93b9f",
              "to": "cxwaij4",
              "as": "height"
            },
            "dx3qg99": {
              "from": "dx3qg99",
              "to": "cxwaij4",
              "as": "top"
            },
            "zgmfuzy": {
              "from": "zgmfuzy",
              "to": "cxwaij4",
              "as": "left"
            },
            "ejd0zjg": {
              "from": "ejd0zjg",
              "to": "45uuwjl",
              "as": "#node-editor-editor"
            },
            "z54r0bl": {
              "from": "z54r0bl",
              "to": "45uuwjl",
              "as": "#node-editor-error .message"
            },
            "tok49em": {
              "from": "tok49em",
              "to": "z54r0bl",
              "as": "z-index"
            },
            "tok49eq": {
              "from": "tok49eq",
              "to": "z54r0bl",
              "as": "position"
            },
            "hzvlwu7": {
              "from": "hzvlwu7",
              "to": "45uuwjl",
              "as": "#graph-actions"
            },
            "mcpndlx": {
              "from": "mcpndlx",
              "to": "hzvlwu7",
              "as": "z-index"
            }
          },
          "category": "html"
        },
        "@js.import_module": {
          "id": "@js.import_module",
          "category": "js",
          "description": "Dynamically import an es6 module",
          "ref": "extern",
          "value": "extern.import_module"
        },
        "@nodysseus.import": {
          "id": "@nodysseus.import",
          "out": "out",
          "category": "nodysseus",
          "nodes": {
            "args": {
              "id": "args"
            },
            "8dy573e": {
              "id": "8dy573e",
              "ref": "@html.html_element"
            },
            "out": {
              "id": "out",
              "name": "@nodysseus.import",
              "ref": "return"
            },
            "arcnyff": {
              "id": "arcnyff",
              "ref": "@data.array"
            },
            "qgbinm2": {
              "id": "qgbinm2",
              "value": "Upload a json file",
              "ref": "@html.html_text"
            },
            "rtrp3nj": {
              "id": "rtrp3nj",
              "value": "input",
              "ref": "@html.html_element"
            },
            "vnibm4q": {
              "id": "vnibm4q"
            },
            "07fjn2b": {
              "id": "07fjn2b",
              "value": "file"
            },
            "rdt0k55": {
              "id": "rdt0k55",
              "value": ".json"
            },
            "jmqcpll": {
              "id": "jmqcpll",
              "ref": "@flow.runnable"
            },
            "o9ukwn8": {
              "id": "o9ukwn8",
              "value": "event.target.files.0",
              "ref": "arg"
            },
            "1672j69": {
              "id": "1672j69",
              "value": "text",
              "ref": "@js.call"
            },
            "jvoijof": {
              "id": "jvoijof",
              "ref": "@data.parse"
            },
            "uymxrxe": {
              "id": "uymxrxe",
              "ref": "@data.map"
            },
            "yu0e7mk": {
              "id": "yu0e7mk",
              "ref": "@flow.runnable"
            },
            "3z8hhss": {
              "id": "3z8hhss",
              "value": "element",
              "ref": "arg"
            },
            "ij46kiv": {
              "id": "ij46kiv",
              "value": "return ({id: graph.id, value: graph.value, name: graph.name, nodes: graph.nodes, edges: graph.edges, out: graph.out, description: graph.description})",
              "ref": "@js.script"
            },
            "hcp6xds": {
              "id": "hcp6xds",
              "ref": "@debug.log"
            },
            "cixrltc": {
              "id": "cixrltc",
              "value": "_lib.no.runtime.add_ref(graph); return graph;",
              "ref": "@js.script"
            },
            "ukrwz7a": {
              "id": "ukrwz7a"
            },
            "xr7en45": {
              "id": "xr7en45"
            },
            "o58l5no": {
              "id": "o58l5no"
            },
            "n8fhfq0": {
              "id": "n8fhfq0"
            }
          },
          "edges": {
            "8dy573e": {
              "from": "8dy573e",
              "to": "out",
              "as": "display"
            },
            "args": {
              "from": "args",
              "to": "out",
              "as": "args"
            },
            "arcnyff": {
              "from": "arcnyff",
              "to": "8dy573e",
              "as": "children"
            },
            "qgbinm2": {
              "from": "qgbinm2",
              "to": "arcnyff",
              "as": "arg0"
            },
            "rtrp3nj": {
              "from": "rtrp3nj",
              "to": "arcnyff",
              "as": "arg1"
            },
            "vnibm4q": {
              "from": "vnibm4q",
              "to": "rtrp3nj",
              "as": "props"
            },
            "07fjn2b": {
              "from": "07fjn2b",
              "to": "vnibm4q",
              "as": "type"
            },
            "rdt0k55": {
              "from": "rdt0k55",
              "to": "vnibm4q",
              "as": "accept"
            },
            "jmqcpll": {
              "from": "jmqcpll",
              "to": "vnibm4q",
              "as": "onchange"
            },
            "o9ukwn8": {
              "from": "o9ukwn8",
              "to": "1672j69",
              "as": "self"
            },
            "1672j69": {
              "from": "1672j69",
              "to": "jvoijof",
              "as": "string"
            },
            "uymxrxe": {
              "from": "uymxrxe",
              "to": "jmqcpll",
              "as": "fn"
            },
            "jvoijof": {
              "from": "jvoijof",
              "to": "uymxrxe",
              "as": "array"
            },
            "yu0e7mk": {
              "from": "yu0e7mk",
              "to": "uymxrxe",
              "as": "fn"
            },
            "3z8hhss": {
              "from": "3z8hhss",
              "to": "ij46kiv",
              "as": "graph"
            },
            "ij46kiv": {
              "from": "ij46kiv",
              "to": "hcp6xds",
              "as": "value"
            },
            "hcp6xds": {
              "from": "hcp6xds",
              "to": "cixrltc",
              "as": "graph"
            },
            "cixrltc": {
              "from": "cixrltc",
              "to": "yu0e7mk",
              "as": "fn"
            },
            "ukrwz7a": {
              "from": "ukrwz7a",
              "to": "jmqcpll",
              "as": "parameters"
            },
            "xr7en45": {
              "from": "xr7en45",
              "to": "ukrwz7a",
              "as": "event"
            },
            "o58l5no": {
              "from": "o58l5no",
              "to": "yu0e7mk",
              "as": "parameters"
            },
            "n8fhfq0": {
              "from": "n8fhfq0",
              "to": "o58l5no",
              "as": "element"
            }
          }
        },
        "@nodysseus.import_nodes": {
          "id": "@nodysseus.import_nodes",
          "description": "Imports the passed in `nodes`",
          "name": "@nodysseus.import_nodes",
          "category": "nodysseus",
          "nodes": {
            "v10aosf": {
              "id": "v10aosf",
              "name": "@nodysseus.import_nodes",
              "ref": "return"
            },
            "uymxrxe": {
              "id": "uymxrxe",
              "ref": "@data.map"
            },
            "mvg23pd": {
              "id": "mvg23pd"
            },
            "jvoijof": {
              "id": "jvoijof",
              "ref": "@data.parse"
            },
            "yu0e7mk": {
              "id": "yu0e7mk",
              "ref": "@flow.runnable"
            },
            "ffu9m49": {
              "id": "ffu9m49",
              "value": "nodes",
              "ref": "arg"
            },
            "sl7qlmj": {
              "id": "sl7qlmj",
              "value": "scripts.save_graph",
              "ref": "@js.call"
            },
            "cixrltc": {
              "id": "cixrltc",
              "value": "_lib.no.runtime.change_graph(graph); return graph;",
              "ref": "@js.script"
            },
            "odeeqm8": {
              "id": "odeeqm8",
              "value": "return _lib;",
              "ref": "@js.script"
            },
            "hcp6xds": {
              "id": "hcp6xds",
              "ref": "@debug.log"
            },
            "ij46kiv": {
              "id": "ij46kiv",
              "value": "return ({id: graph.id, value: graph.value, name: graph.name, nodes: graph.nodes, edges: graph.edges, out: graph.out})",
              "ref": "@js.script"
            },
            "3z8hhss": {
              "id": "3z8hhss",
              "value": "element",
              "ref": "arg"
            }
          },
          "edges": [
            {
              "from": "uymxrxe",
              "to": "v10aosf",
              "as": "value"
            },
            {
              "from": "mvg23pd",
              "to": "v10aosf",
              "as": "args"
            },
            {
              "from": "jvoijof",
              "to": "uymxrxe",
              "as": "array"
            },
            {
              "from": "yu0e7mk",
              "to": "uymxrxe",
              "as": "fn"
            },
            {
              "from": "ffu9m49",
              "to": "jvoijof",
              "as": "string"
            },
            {
              "from": "sl7qlmj",
              "to": "yu0e7mk",
              "as": "fn"
            },
            {
              "from": "cixrltc",
              "to": "sl7qlmj",
              "as": "args"
            },
            {
              "from": "odeeqm8",
              "to": "sl7qlmj",
              "as": "self"
            },
            {
              "from": "hcp6xds",
              "to": "cixrltc",
              "as": "graph"
            },
            {
              "from": "ij46kiv",
              "to": "hcp6xds",
              "as": "value"
            },
            {
              "from": "3z8hhss",
              "to": "ij46kiv",
              "as": "graph"
            }
          ],
          "out": "v10aosf"
        },
        "@graphics.offscreenCanvas": {
          "id": "@graphics.offscreenCanvas",
          "category": "html",
          "description": "Creates an offscreen canvas for rendering WebGL content. Multiple canvases can be created to allow switching content on a canvas behind the node editor or the info popup canvas.",
          "name": "@graphics.offscreenCanvas",
          "nodes": {
            "0g1zopd": {
              "id": "0g1zopd",
              "name": "@graphics.offscreenCanvas",
              "ref": "return"
            },
            "ein7naf": {
              "id": "ein7naf",
              "ref": "@flow.if"
            },
            "9p0focj": {
              "id": "9p0focj"
            },
            "98f35dl": {
              "id": "98f35dl",
              "value": "return !!window.OffscreenCanvas",
              "ref": "@js.script"
            },
            "dzb8l3m": {
              "id": "dzb8l3m",
              "value": "canvas",
              "ref": "@html.html_element"
            },
            "c2vbqba": {
              "id": "c2vbqba"
            },
            "hdn9zr5": {
              "id": "hdn9zr5",
              "value": "offscreen"
            },
            "o40rphy": {
              "id": "o40rphy"
            },
            "p6vd4i7": {
              "id": "p6vd4i7",
              "value": "canvas_id",
              "ref": "arg"
            },
            "lik4fr6": {
              "id": "lik4fr6",
              "value": "return window.innerWidth;",
              "ref": "@js.script"
            },
            "5q5ltj4": {
              "id": "5q5ltj4",
              "value": "return window.innerHeight",
              "ref": "@js.script"
            },
            "w7dugd7": {
              "id": "w7dugd7",
              "value": "return window.innerWidth;",
              "ref": "@js.script"
            },
            "1wirpfe": {
              "id": "1wirpfe",
              "value": "return window.innerHeight",
              "ref": "@js.script"
            },
            "16rxy2o": {
              "id": "16rxy2o",
              "value": "hidden"
            }
          },
          "edges": [
            {
              "from": "ein7naf",
              "to": "0g1zopd",
              "as": "value"
            },
            {
              "from": "9p0focj",
              "to": "0g1zopd",
              "as": "args"
            },
            {
              "from": "98f35dl",
              "to": "ein7naf",
              "as": "pred"
            },
            {
              "from": "dzb8l3m",
              "to": "ein7naf",
              "as": "false"
            },
            {
              "from": "c2vbqba",
              "to": "dzb8l3m",
              "as": "props"
            },
            {
              "from": "hdn9zr5",
              "to": "c2vbqba",
              "as": "key"
            },
            {
              "from": "o40rphy",
              "to": "c2vbqba",
              "as": "style"
            },
            {
              "from": "p6vd4i7",
              "to": "c2vbqba",
              "as": "id"
            },
            {
              "from": "lik4fr6",
              "to": "c2vbqba",
              "as": "width"
            },
            {
              "from": "5q5ltj4",
              "to": "c2vbqba",
              "as": "height"
            },
            {
              "from": "w7dugd7",
              "to": "o40rphy",
              "as": "width"
            },
            {
              "from": "1wirpfe",
              "to": "o40rphy",
              "as": "height"
            },
            {
              "from": "16rxy2o",
              "to": "o40rphy",
              "as": "visibility"
            }
          ],
          "out": "0g1zopd"
        },
        "@nodysseus.delete_ref": {
          "id": "@nodysseus.delete_ref",
          "name": "@nodysseus.delete_ref",
          "out": "main/out",
          "category": "nodysseus",
          "nodes": {
            "args": {
              "id": "args"
            },
            "jklqh38": {
              "id": "jklqh38",
              "ref": "@html.html_element"
            },
            "6qkew20": {
              "id": "6qkew20",
              "ref": "@data.array"
            },
            "zihm1kd": {
              "id": "zihm1kd"
            },
            "3b7bnzm": {
              "id": "3b7bnzm",
              "ref": "@memory.state"
            },
            "pcx97n4": {
              "id": "pcx97n4",
              "value": "input",
              "ref": "@html.html_element"
            },
            "rk7hcxc": {
              "id": "rk7hcxc"
            },
            "b8wohxv": {
              "id": "b8wohxv",
              "value": "select"
            },
            "x200f4j": {
              "id": "x200f4j",
              "value": "export-list"
            },
            "et5g0m1": {
              "id": "et5g0m1",
              "ref": "@data.map"
            },
            "9tv13iq": {
              "id": "9tv13iq",
              "value": "return _lib.no.runtime.refs()",
              "ref": "@js.script"
            },
            "dd6st1b": {
              "id": "dd6st1b",
              "value": "element",
              "ref": "arg"
            },
            "2yur4h7": {
              "id": "2yur4h7",
              "ref": "@flow.runnable"
            },
            "xdot36k": {
              "id": "xdot36k"
            },
            "1edrrwq": {
              "id": "1edrrwq",
              "value": "option",
              "ref": "@html.html_element"
            },
            "skqnl08": {
              "id": "skqnl08",
              "ref": "@html.html_text"
            },
            "3y8pyc2": {
              "id": "3y8pyc2",
              "value": "datalist",
              "ref": "@html.html_element"
            },
            "tfwqhqf": {
              "id": "tfwqhqf",
              "value": "export-list"
            },
            "tad7830": {
              "id": "tad7830",
              "ref": "@memory.state"
            },
            "jdufmth": {
              "id": "jdufmth",
              "value": "namespace.state",
              "ref": "arg"
            },
            "898n6f7": {
              "id": "898n6f7",
              "ref": "@flow.ap"
            },
            "9jvfgj1": {
              "id": "9jvfgj1",
              "value": "namespace.set",
              "ref": "arg"
            },
            "j2c518b": {
              "id": "j2c518b"
            },
            "qpiqhgp": {
              "id": "qpiqhgp",
              "value": "event.target.value",
              "ref": "arg"
            },
            "main/out": {
              "id": "main/out",
              "name": "@nodysseus.delete_ref",
              "ref": "return"
            },
            "8dy573e": {
              "id": "8dy573e",
              "value": "button",
              "ref": "@html.html_element"
            },
            "n7aaoju": {
              "id": "n7aaoju",
              "value": "delete",
              "ref": "@html.html_text"
            },
            "ibmy4bt": {
              "id": "ibmy4bt",
              "ref": "@flow.runnable"
            },
            "jdoak4g": {
              "id": "jdoak4g",
              "value": 'localStorage.removeItem(ns);\nlocalStorage.setItem("graph_list", JSON.stringify(JSON.parse(localStorage.getItem("graph_list")).filter(g => g !== ns)))\n_lib.no.runtime.remove_ref(ns);',
              "ref": "@js.script"
            },
            "a32fufq": {
              "id": "a32fufq",
              "ref": "@html.icon"
            },
            "pfmdyvv": {
              "id": "pfmdyvv"
            },
            "9cwkm4z": {
              "id": "9cwkm4z",
              "value": "delete"
            },
            "h10oho6": {
              "id": "h10oho6",
              "ref": "@flow.if"
            },
            "2r1dra9": {
              "id": "2r1dra9",
              "value": "check"
            },
            "semslq4": {
              "id": "semslq4",
              "value": "console.log(namespace);\nconst ref = _lib.no.runtime.refs().find(r => r === namespace);\nreturn ref",
              "ref": "@js.script"
            },
            "vffalrt": {
              "id": "vffalrt",
              "value": "namespace.state",
              "ref": "arg"
            },
            "vqk5ztl": {
              "id": "vqk5ztl"
            },
            "ygewxjl": {
              "id": "ygewxjl"
            },
            "i153jv4": {
              "id": "i153jv4",
              "ref": "@flow.ap"
            },
            "nxihxr3": {
              "id": "nxihxr3",
              "ref": "@data.array"
            },
            "pdox5d1": {
              "id": "pdox5d1",
              "value": "graphupdate",
              "ref": "@event.publish_event"
            },
            "qvl4qif": {
              "id": "qvl4qif",
              "value": "__graphid",
              "ref": "arg"
            },
            "dqujder": {
              "id": "dqujder"
            },
            "7c6mxi9": {
              "id": "7c6mxi9",
              "ref": "@data.array"
            },
            "00fj2qe": {
              "id": "00fj2qe",
              "value": "graphupdate",
              "ref": "@event.publish_event"
            },
            "rgoguh4": {
              "id": "rgoguh4"
            },
            "o2uz727": {
              "id": "o2uz727",
              "value": "__graphid",
              "ref": "arg"
            }
          },
          "edges": {
            "args": {
              "from": "args",
              "to": "main/out",
              "as": "args"
            },
            "n7aaoju": {
              "from": "n7aaoju",
              "to": "8dy573e",
              "as": "children"
            },
            "jklqh38": {
              "from": "jklqh38",
              "to": "main/out",
              "as": "display"
            },
            "6qkew20": {
              "from": "6qkew20",
              "to": "jklqh38",
              "as": "children"
            },
            "zihm1kd": {
              "from": "zihm1kd",
              "to": "8dy573e",
              "as": "props"
            },
            "tad7830": {
              "from": "tad7830",
              "to": "args",
              "as": "namespace"
            },
            "jdufmth": {
              "from": "jdufmth",
              "to": "jdoak4g",
              "as": "ns"
            },
            "3b7bnzm": {
              "from": "3b7bnzm",
              "to": "args",
              "as": "hrefstate"
            },
            "pcx97n4": {
              "from": "pcx97n4",
              "to": "6qkew20",
              "as": "arg2"
            },
            "rk7hcxc": {
              "from": "rk7hcxc",
              "to": "pcx97n4",
              "as": "props"
            },
            "b8wohxv": {
              "from": "b8wohxv",
              "to": "rk7hcxc",
              "as": "type"
            },
            "x200f4j": {
              "from": "x200f4j",
              "to": "rk7hcxc",
              "as": "list"
            },
            "3y8pyc2": {
              "from": "3y8pyc2",
              "to": "6qkew20",
              "as": "arg3"
            },
            "et5g0m1": {
              "from": "et5g0m1",
              "to": "3y8pyc2",
              "as": "children"
            },
            "9tv13iq": {
              "from": "9tv13iq",
              "to": "et5g0m1",
              "as": "array"
            },
            "2yur4h7": {
              "from": "2yur4h7",
              "to": "et5g0m1",
              "as": "fn"
            },
            "dd6st1b": {
              "from": "dd6st1b",
              "to": "skqnl08",
              "as": "text"
            },
            "xdot36k": {
              "from": "xdot36k",
              "to": "3y8pyc2",
              "as": "props"
            },
            "1edrrwq": {
              "from": "1edrrwq",
              "to": "2yur4h7",
              "as": "fn"
            },
            "skqnl08": {
              "from": "skqnl08",
              "to": "1edrrwq",
              "as": "children"
            },
            "tfwqhqf": {
              "from": "tfwqhqf",
              "to": "xdot36k",
              "as": "id"
            },
            "898n6f7": {
              "from": "898n6f7",
              "to": "rk7hcxc",
              "as": "onchange"
            },
            "9jvfgj1": {
              "from": "9jvfgj1",
              "to": "7c6mxi9",
              "as": "arg0"
            },
            "j2c518b": {
              "from": "j2c518b",
              "to": "898n6f7",
              "as": "args"
            },
            "qpiqhgp": {
              "from": "qpiqhgp",
              "to": "j2c518b",
              "as": "value"
            },
            "8dy573e": {
              "from": "8dy573e",
              "to": "6qkew20",
              "as": "arg4"
            },
            "ibmy4bt": {
              "from": "ibmy4bt",
              "to": "nxihxr3",
              "as": "arg0"
            },
            "jdoak4g": {
              "from": "jdoak4g",
              "to": "ibmy4bt",
              "as": "fn"
            },
            "a32fufq": {
              "from": "a32fufq",
              "to": "6qkew20",
              "as": "arg5"
            },
            "pfmdyvv": {
              "from": "pfmdyvv",
              "to": "a32fufq",
              "as": "props"
            },
            "9cwkm4z": {
              "from": "9cwkm4z",
              "to": "h10oho6",
              "as": "true"
            },
            "h10oho6": {
              "from": "h10oho6",
              "to": "a32fufq",
              "as": "icon"
            },
            "2r1dra9": {
              "from": "2r1dra9",
              "to": "h10oho6",
              "as": "false"
            },
            "semslq4": {
              "from": "semslq4",
              "to": "h10oho6",
              "as": "pred"
            },
            "vffalrt": {
              "from": "vffalrt",
              "to": "semslq4",
              "as": "namespace"
            },
            "vqk5ztl": {
              "from": "vqk5ztl",
              "to": "2yur4h7",
              "as": "parameters"
            },
            "ygewxjl": {
              "from": "ygewxjl",
              "to": "vqk5ztl",
              "as": "element"
            },
            "i153jv4": {
              "from": "i153jv4",
              "to": "zihm1kd",
              "as": "onclick"
            },
            "nxihxr3": {
              "from": "nxihxr3",
              "to": "i153jv4",
              "as": "fn"
            },
            "pdox5d1": {
              "from": "pdox5d1",
              "to": "nxihxr3",
              "as": "arg1"
            },
            "qvl4qif": {
              "from": "qvl4qif",
              "to": "dqujder",
              "as": "graphid"
            },
            "dqujder": {
              "from": "dqujder",
              "to": "pdox5d1",
              "as": "data"
            },
            "7c6mxi9": {
              "from": "7c6mxi9",
              "to": "898n6f7",
              "as": "fn"
            },
            "rgoguh4": {
              "from": "rgoguh4",
              "to": "00fj2qe",
              "as": "data"
            },
            "o2uz727": {
              "from": "o2uz727",
              "to": "rgoguh4",
              "as": "graphid"
            },
            "00fj2qe": {
              "from": "00fj2qe",
              "to": "7c6mxi9",
              "as": "arg1"
            }
          }
        },
        "@data.changed": {
          "id": "@data.changed",
          "category": "data",
          "description": "Returns true if `value` has changed",
          "name": "changed",
          "nodes": {
            "p8v5ed5": {
              "id": "p8v5ed5",
              "name": "@data.changed",
              "ref": "return"
            },
            "14mzqe3": {
              "id": "14mzqe3"
            },
            "vs4opfd": {
              "id": "vs4opfd",
              "ref": "return"
            },
            "3l4ufol": {
              "id": "3l4ufol"
            },
            "jlmvbt7": {
              "id": "jlmvbt7",
              "value": "comparison",
              "ref": "@data.get"
            },
            "izbtl3g": {
              "id": "izbtl3g",
              "value": "value",
              "ref": "arg"
            },
            "mm880mz": {
              "id": "mm880mz",
              "ref": "@memory.cache"
            },
            "kw0x0bm": {
              "id": "kw0x0bm",
              "value": "state.value",
              "ref": "@data.set_mutable"
            },
            "qqzgl4i": {
              "id": "qqzgl4i"
            },
            "f0ticbo": {
              "id": "f0ticbo"
            },
            "fvvux6n": {
              "id": "fvvux6n",
              "value": "value",
              "ref": "arg"
            },
            "2cvrnm9": {
              "id": "2cvrnm9",
              "value": "initial",
              "ref": "arg"
            },
            "uqm4o4b": {
              "id": "uqm4o4b",
              "value": "state",
              "ref": "arg"
            },
            "a59coum": {
              "id": "a59coum",
              "value": "return state != value;",
              "ref": "@js.script"
            },
            "pt5nb1r": {
              "id": "pt5nb1r",
              "value": "state.value",
              "ref": "arg"
            },
            "hkxrk6s": {
              "id": "hkxrk6s",
              "value": "value",
              "ref": "arg"
            }
          },
          "edges": [
            {
              "from": "14mzqe3",
              "to": "p8v5ed5",
              "as": "args"
            },
            {
              "from": "vs4opfd",
              "to": "p8v5ed5",
              "as": "value"
            },
            {
              "from": "3l4ufol",
              "to": "vs4opfd",
              "as": "args"
            },
            {
              "from": "jlmvbt7",
              "to": "vs4opfd",
              "as": "value"
            },
            {
              "from": "izbtl3g",
              "to": "3l4ufol",
              "as": "value"
            },
            {
              "from": "mm880mz",
              "to": "3l4ufol",
              "as": "state"
            },
            {
              "from": "kw0x0bm",
              "to": "jlmvbt7",
              "as": "target"
            },
            {
              "from": "qqzgl4i",
              "to": "mm880mz",
              "as": "value"
            },
            {
              "from": "f0ticbo",
              "to": "kw0x0bm",
              "as": "target"
            },
            {
              "from": "fvvux6n",
              "to": "kw0x0bm",
              "as": "value"
            },
            {
              "from": "2cvrnm9",
              "to": "qqzgl4i",
              "as": "value"
            },
            {
              "from": "uqm4o4b",
              "to": "f0ticbo",
              "as": "state"
            },
            {
              "from": "a59coum",
              "to": "f0ticbo",
              "as": "comparison"
            },
            {
              "from": "pt5nb1r",
              "to": "a59coum",
              "as": "state"
            },
            {
              "from": "hkxrk6s",
              "to": "a59coum",
              "as": "value"
            }
          ],
          "out": "p8v5ed5"
        },
        "@graphics.webgl": {
          "id": "@graphics.webgl",
          "category": "graphics",
          "description": "Creates a webgl program with vertex shader `vtx`, fragment shader `frg`, in gl context `gl`.",
          "nodes": {
            "j219svq": {
              "id": "j219svq"
            },
            "04xuprq": {
              "id": "04xuprq"
            },
            "jidlrdv": {
              "id": "jidlrdv",
              "value": `return document.getElementById("node-editor-info-canvas").getContext('webgl2')`,
              "ref": "@js.script"
            },
            "gkv4bqi": {
              "id": "gkv4bqi",
              "ref": "@memory.cache"
            },
            "ea0tgct": {
              "id": "ea0tgct",
              "value": "vtx",
              "ref": "arg"
            },
            "rh45l5q": {
              "id": "rh45l5q",
              "value": "gl",
              "ref": "arg"
            },
            "hzz1ww4": {
              "id": "hzz1ww4",
              "value": "return gl.VERTEX_SHADER;",
              "ref": "@js.script"
            },
            "qjktjzv": {
              "id": "qjktjzv",
              "value": "gl",
              "ref": "arg"
            },
            "bu3m3jq": {
              "id": "bu3m3jq",
              "ref": "@graphics.load_shader"
            },
            "camgxqu": {
              "id": "camgxqu",
              "ref": "@graphics.load_shader"
            },
            "3j7l8wk": {
              "id": "3j7l8wk",
              "value": "gl",
              "ref": "arg"
            },
            "wrpwzyg": {
              "id": "wrpwzyg",
              "value": "gl",
              "ref": "arg"
            },
            "l41589j": {
              "id": "l41589j",
              "value": "frg",
              "ref": "arg"
            },
            "5luq4y5": {
              "id": "5luq4y5",
              "value": "return gl.FRAGMENT_SHADER;",
              "ref": "@js.script"
            },
            "esayius": {
              "id": "esayius",
              "value": "gl",
              "ref": "arg"
            },
            "2mgzzwp": {
              "id": "2mgzzwp",
              "ref": "return"
            },
            "bkeent2": {
              "id": "bkeent2",
              "value": "shaderProgram",
              "ref": "arg"
            },
            "qbj2tl2": {
              "id": "qbj2tl2",
              "value": "gl",
              "ref": "arg"
            },
            "wyb1z00": {
              "id": "wyb1z00",
              "name": ""
            },
            "8njh1mx": {
              "id": "8njh1mx",
              "value": "gl",
              "ref": "arg"
            },
            "ca17ykm": {
              "id": "ca17ykm",
              "value": "gl",
              "ref": "arg"
            },
            "out": {
              "id": "out",
              "name": "@graphics.webgl",
              "ref": "return"
            },
            "ng2kjpd": {
              "id": "ng2kjpd",
              "value": "buffer",
              "ref": "arg"
            },
            "7i0o3pn": {
              "id": "7i0o3pn",
              "value": "return `#version 300 es\n\n    precision highp float;\n\n\n\n    out vec2 texCoord;\n\n    void main() {\n      float x = float((gl_VertexID & 1) << 2);\n      float y = float((gl_VertexID & 2) << 1);\n      texCoord.x = x * 0.5;\n      texCoord.y = y * 0.5;\n      gl_Position = vec4(x - 1.0, y - 1.0, 0, 1);\n    }\n  `;",
              "ref": "@js.script"
            },
            "p2ibbe3": {
              "id": "p2ibbe3",
              "value": "return {\n    program: shaderProgram,\n    attribLocations: {\n    },\n    uniformLocations: {\n      dataBuffer: gl.getUniformLocation(shaderProgram, 'uData')\n    },\n  };\n",
              "ref": "@js.script"
            },
            "8dy573e/8dy573e": {
              "id": "8dy573e/8dy573e",
              "out": "8dy573e/8dy573e",
              "nodes": [
                {
                  "id": "8dy573e/8dy573e",
                  "ref": "html_element"
                },
                {
                  "id": "8dy573e/576gi1y",
                  "ref": "array"
                },
                {
                  "id": "8dy573e/t6fz346",
                  "ref": "css_styles"
                },
                {
                  "id": "8dy573e/21xxdy8"
                },
                {
                  "id": "8dy573e/cuio21r"
                },
                {
                  "id": "8dy573e/dx424v3",
                  "value": "block"
                }
              ],
              "edges": [
                {
                  "from": "8dy573e/576gi1y",
                  "to": "8dy573e/8dy573e",
                  "as": "children"
                },
                {
                  "from": "8dy573e/t6fz346",
                  "to": "8dy573e/576gi1y",
                  "as": "arg2"
                },
                {
                  "from": "8dy573e/21xxdy8",
                  "to": "8dy573e/t6fz346",
                  "as": "css_object"
                },
                {
                  "from": "8dy573e/cuio21r",
                  "to": "8dy573e/21xxdy8",
                  "as": "#node-editor-info-canvas"
                },
                {
                  "from": "8dy573e/dx424v3",
                  "to": "8dy573e/cuio21r",
                  "as": "display"
                }
              ]
            },
            "1lgkj23": {
              "id": "1lgkj23",
              "value": "gl",
              "ref": "arg"
            },
            "derz1cv": {
              "id": "derz1cv",
              "value": "vtx",
              "ref": "arg"
            },
            "duubxl9": {
              "id": "duubxl9",
              "value": "frg",
              "ref": "arg"
            },
            "5pjjo2a": {
              "id": "5pjjo2a",
              "value": "return `#version 300 es\n\n    precision highp float;\n\n    uniform int uData[1024];\n\n    in vec2 texCoord;\n\n    out vec4 fragmentColor;\n    \n    void main() {\n      int idx = int(floor(1024.*gl_FragCoord.x/300.0));\n      float val = float(uData[idx]) / 128.;\n      fragmentColor = vec4(val,val,val, 1.0);\n    }\n  `;",
              "ref": "@js.script"
            },
            "4r5fc0b": {
              "id": "4r5fc0b",
              "value": "buffer",
              "ref": "arg"
            },
            "fbru2p5": {
              "id": "fbru2p5",
              "value": "const shaderProgram = gl.createProgram();\n  gl.attachShader(shaderProgram, vertexShader);\n  gl.attachShader(shaderProgram, fragmentShader);\n  gl.linkProgram(shaderProgram);\n\n  // If creating the shader program failed, alert\n\n  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {\n    throw new Error(gl.getProgramInfoLog(shaderProgram));\n    return null;\n  }\n\n  return shaderProgram;",
              "ref": "@js.script"
            },
            "01l4ilv": {
              "id": "01l4ilv",
              "value": "  gl.clearColor(0.0, 0.0, 0.0, 1.0);  // Clear to black, fully opaque\n  gl.clearDepth(1.0);                 // Clear everything\n\n  // Clear the canvas before we start drawing on it.\n\n  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);\n\n  // Tell WebGL to use our program when drawing\n  \n\n  gl.useProgram(programInfo.program);\ngl.uniform1fv(programInfo.uniformLocations.dataBuffer, buffers.data);\n\n  {\n    const offset = 0;\n    const vertexCount = 3;\n    gl.drawArrays(gl.TRIANGLE_STRIP, offset, vertexCount);\n  }",
              "name": "",
              "ref": "@js.script"
            },
            "tfz84l0": {
              "id": "tfz84l0",
              "ref": "@memory.cache"
            },
            "5bt6mgs": {
              "id": "5bt6mgs",
              "ref": "@memory.cache"
            },
            "njrst9d": {
              "id": "njrst9d",
              "value": "const valBuffer = gl.createBuffer();\ngl.bindBuffer(gl.ARRAY_BUFFER, valBuffer);\n\ngl.bufferData(gl.ARRAY_BUFFER, buffer.data, gl.STATIC_DRAW);\n\nreturn {\n  val: valBuffer,\n  data: buffer.data\n}",
              "name": "",
              "ref": "@js.script"
            }
          },
          "edges": [
            {
              "from": "8dy573e/8dy573e",
              "to": "out",
              "as": "display"
            },
            {
              "from": "j219svq",
              "to": "out",
              "as": "subscribe"
            },
            {
              "from": "04xuprq",
              "to": "out",
              "as": "args"
            },
            {
              "from": "jidlrdv",
              "to": "gkv4bqi",
              "as": "value"
            },
            {
              "from": "gkv4bqi",
              "to": "04xuprq",
              "as": "gl"
            },
            {
              "from": "7i0o3pn",
              "to": "04xuprq",
              "as": "vtx"
            },
            {
              "from": "5pjjo2a",
              "to": "04xuprq",
              "as": "frg"
            },
            {
              "from": "ea0tgct",
              "to": "bu3m3jq",
              "as": "source"
            },
            {
              "from": "hzz1ww4",
              "to": "bu3m3jq",
              "as": "shader_type"
            },
            {
              "from": "rh45l5q",
              "to": "hzz1ww4",
              "as": "gl"
            },
            {
              "from": "qjktjzv",
              "to": "bu3m3jq",
              "as": "gl"
            },
            {
              "from": "l41589j",
              "to": "camgxqu",
              "as": "source"
            },
            {
              "from": "5luq4y5",
              "to": "camgxqu",
              "as": "shader_type"
            },
            {
              "from": "3j7l8wk",
              "to": "camgxqu",
              "as": "gl"
            },
            {
              "from": "wrpwzyg",
              "to": "5luq4y5",
              "as": "gl"
            },
            {
              "from": "2mgzzwp",
              "to": "out",
              "as": "value"
            },
            {
              "from": "wyb1z00",
              "to": "2mgzzwp",
              "as": "args"
            },
            {
              "from": "bkeent2",
              "to": "p2ibbe3",
              "as": "shaderProgram"
            },
            {
              "from": "qbj2tl2",
              "to": "p2ibbe3",
              "as": "gl"
            },
            {
              "from": "esayius",
              "to": "fbru2p5",
              "as": "gl"
            },
            {
              "from": "01l4ilv",
              "to": "2mgzzwp",
              "as": "value"
            },
            {
              "from": "8njh1mx",
              "to": "njrst9d",
              "as": "gl"
            },
            {
              "from": "ca17ykm",
              "to": "01l4ilv",
              "as": "gl"
            },
            {
              "from": "camgxqu",
              "to": "fbru2p5",
              "as": "fragmentShader"
            },
            {
              "from": "bu3m3jq",
              "to": "fbru2p5",
              "as": "vertexShader"
            },
            {
              "from": "ng2kjpd",
              "to": "njrst9d",
              "as": "buffer"
            },
            {
              "from": "1lgkj23",
              "to": "wyb1z00",
              "as": "gl"
            },
            {
              "from": "derz1cv",
              "to": "wyb1z00",
              "as": "vtx"
            },
            {
              "from": "duubxl9",
              "to": "wyb1z00",
              "as": "frg"
            },
            {
              "from": "njrst9d",
              "to": "01l4ilv",
              "as": "buffers"
            },
            {
              "from": "4r5fc0b",
              "to": "wyb1z00",
              "as": "buffer"
            },
            {
              "from": "tfz84l0",
              "to": "wyb1z00",
              "as": "shaderProgram"
            },
            {
              "from": "fbru2p5",
              "to": "tfz84l0",
              "as": "value"
            },
            {
              "from": "5bt6mgs",
              "to": "01l4ilv",
              "as": "programInfo"
            },
            {
              "from": "p2ibbe3",
              "to": "5bt6mgs",
              "as": "value"
            }
          ],
          "out": "out"
        },
        "@graphics.load_shader": {
          "id": "@graphics.load_shader",
          "category": "graphics",
          "description": "Loads the `source` shader program in webgl context `gl`",
          "name": "load_shader",
          "nodes": {
            "37nc07d": {
              "id": "37nc07d"
            },
            "c0cr54c": {
              "id": "c0cr54c",
              "value": "const shader = gl.createShader(shader_type);\n\n  // Send the source to the shader object\n\n  gl.shaderSource(shader, source);\n\n  // Compile the shader program\n\n  gl.compileShader(shader);\n\n  // See if it compiled successfully\n\n  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {\n    alert('An error occurred compiling the shaders: ' + gl.getShaderInfoLog(shader));\n    gl.deleteShader(shader);\n    return null;\n  }\n\n  return shader;",
              "name": "",
              "ref": "@js.script"
            },
            "l3qddzc": {
              "id": "l3qddzc",
              "value": "gl",
              "ref": "arg"
            },
            "e5uhxrd": {
              "id": "e5uhxrd",
              "value": "source",
              "ref": "arg"
            },
            "6o4os08": {
              "id": "6o4os08",
              "value": "shader_type",
              "ref": "arg"
            },
            "bu3m3jq": {
              "id": "bu3m3jq",
              "name": "@graphics.load_shader",
              "ref": "return"
            }
          },
          "edges": [
            {
              "from": "37nc07d",
              "to": "bu3m3jq",
              "as": "args"
            },
            {
              "from": "c0cr54c",
              "to": "bu3m3jq",
              "as": "value"
            },
            {
              "from": "l3qddzc",
              "to": "c0cr54c",
              "as": "gl"
            },
            {
              "from": "e5uhxrd",
              "to": "c0cr54c",
              "as": "source"
            },
            {
              "from": "6o4os08",
              "to": "c0cr54c",
              "as": "shader_type"
            }
          ],
          "out": "bu3m3jq"
        },
        "@event.subscribe_many": {
          "id": "@event.subscribe_many",
          "name": "subscribe_many",
          "nodes": {
            "ld37qq4": {
              "id": "ld37qq4",
              "name": "@event.subscribe_many",
              "ref": "return"
            },
            "ndna6vl": {
              "id": "ndna6vl"
            },
            "r0v26jn": {
              "id": "r0v26jn",
              "name": "",
              "ref": "@data.reduce"
            },
            "0n8k0b7": {
              "id": "0n8k0b7",
              "value": "events",
              "ref": "arg"
            },
            "kd528s8": {
              "id": "kd528s8",
              "name": "",
              "ref": "@flow.runnable"
            },
            "rxoook3": {
              "id": "rxoook3",
              "ref": "@data.merge_objects"
            },
            "daykk9b": {
              "id": "daykk9b"
            },
            "6kwqo8l": {
              "id": "6kwqo8l",
              "value": "previous",
              "name": "",
              "ref": "arg"
            },
            "bzkaiyo": {
              "id": "bzkaiyo",
              "name": "",
              "ref": "@data.set"
            },
            "hsq8vrp": {
              "id": "hsq8vrp",
              "value": "base",
              "ref": "arg"
            },
            "5mzlv42": {
              "id": "5mzlv42"
            },
            "pkd8b0p": {
              "id": "pkd8b0p",
              "value": "current",
              "ref": "arg"
            },
            "8zi1gzy": {
              "id": "8zi1gzy",
              "value": "runnable",
              "ref": "arg"
            },
            "9716t7q": {
              "id": "9716t7q",
              "name": "",
              "ref": "sequence"
            },
            "hi50l05": {
              "id": "hi50l05",
              "ref": "@data.get"
            },
            "opox5xi": {
              "id": "opox5xi",
              "value": "base",
              "ref": "arg"
            },
            "5szjf17": {
              "id": "5szjf17",
              "value": "current",
              "ref": "arg"
            },
            "it3evdr": {
              "id": "it3evdr"
            },
            "qd1bvw9": {
              "id": "qd1bvw9"
            },
            "6barb7g": {
              "id": "6barb7g",
              "ref": "@memory.cache"
            },
            "i7tgtne": {
              "id": "i7tgtne",
              "value": "evt_runnable",
              "ref": "arg"
            },
            "7rpfcmk": {
              "id": "7rpfcmk",
              "ref": "@memory.cache"
            },
            "xk6e7zh": {
              "id": "xk6e7zh"
            },
            "pf10ku6": {
              "id": "pf10ku6",
              "ref": "@flow.runnable"
            },
            "km7iwa0": {
              "id": "km7iwa0",
              "ref": "@data.set_mutable"
            },
            "zyqw0ko": {
              "id": "zyqw0ko",
              "value": "datacache",
              "ref": "arg"
            },
            "f0roa3q": {
              "id": "f0roa3q",
              "value": "current",
              "ref": "arg"
            },
            "rat3zkt": {
              "id": "rat3zkt",
              "value": "data",
              "ref": "arg"
            },
            "2mcffa6": {
              "id": "2mcffa6",
              "value": "base",
              "ref": "arg"
            }
          },
          "edges": [
            {
              "from": "ndna6vl",
              "to": "ld37qq4",
              "as": "args"
            },
            {
              "from": "r0v26jn",
              "to": "ld37qq4",
              "as": "return"
            },
            {
              "from": "0n8k0b7",
              "to": "r0v26jn",
              "as": "array"
            },
            {
              "from": "kd528s8",
              "to": "r0v26jn",
              "as": "fn"
            },
            {
              "from": "2mcffa6",
              "to": "r0v26jn",
              "as": "initial"
            },
            {
              "from": "rxoook3",
              "to": "kd528s8",
              "as": "fn"
            },
            {
              "from": "daykk9b",
              "to": "kd528s8",
              "as": "args"
            },
            {
              "from": "hsq8vrp",
              "to": "daykk9b",
              "as": "base"
            },
            {
              "from": "5mzlv42",
              "to": "bzkaiyo",
              "as": "target"
            },
            {
              "from": "pkd8b0p",
              "to": "bzkaiyo",
              "as": "path"
            },
            {
              "from": "opox5xi",
              "to": "hi50l05",
              "as": "target"
            },
            {
              "from": "5szjf17",
              "to": "hi50l05",
              "as": "path"
            },
            {
              "from": "9716t7q",
              "to": "bzkaiyo",
              "as": "value"
            },
            {
              "from": "8zi1gzy",
              "to": "daykk9b",
              "as": "evt_runnable"
            },
            {
              "from": "it3evdr",
              "to": "9716t7q",
              "as": "args"
            },
            {
              "from": "6barb7g",
              "to": "it3evdr",
              "as": "data"
            },
            {
              "from": "qd1bvw9",
              "to": "6barb7g",
              "as": "value"
            },
            {
              "from": "xk6e7zh",
              "to": "7rpfcmk",
              "as": "value"
            },
            {
              "from": "7rpfcmk",
              "to": "daykk9b",
              "as": "datacache"
            },
            {
              "from": "hi50l05",
              "to": "9716t7q",
              "as": "arg2"
            },
            {
              "from": "pf10ku6",
              "to": "9716t7q",
              "as": "arg0"
            },
            {
              "from": "km7iwa0",
              "to": "pf10ku6",
              "as": "fn"
            },
            {
              "from": "zyqw0ko",
              "to": "km7iwa0",
              "as": "target"
            },
            {
              "from": "f0roa3q",
              "to": "km7iwa0",
              "as": "path"
            },
            {
              "from": "rat3zkt",
              "to": "km7iwa0",
              "as": "value"
            },
            {
              "from": "6kwqo8l",
              "to": "rxoook3",
              "as": "arg0"
            },
            {
              "from": "bzkaiyo",
              "to": "rxoook3",
              "as": "arg1"
            },
            {
              "from": "i7tgtne",
              "to": "9716t7q",
              "as": "arg1"
            }
          ],
          "out": "ld37qq4",
          "category": "event"
        },
        "@html.slider": {
          "edges": {
            "0i85qjj": {
              "as": "args",
              "from": "0i85qjj",
              "to": "out"
            },
            "1dhoyv2": {
              "as": "max",
              "from": "1dhoyv2",
              "to": "24q0egm"
            },
            "24q0egm": {
              "as": "props",
              "from": "24q0egm",
              "to": "5mog0bc"
            },
            "2wp8ffd": {
              "as": "fn",
              "from": "2wp8ffd",
              "to": "old0t0c"
            },
            "4dh6wzn": {
              "as": "arg1",
              "from": "4dh6wzn",
              "to": "2wp8ffd"
            },
            "4subc0j": {
              "as": "graphval",
              "from": "4subc0j",
              "to": "1dhoyv2"
            },
            "5mog0bc": {
              "as": "arg1",
              "from": "5mog0bc",
              "to": "sb9qdgy"
            },
            "7c2vt3d": {
              "as": "min",
              "from": "7c2vt3d",
              "to": "24q0egm"
            },
            "8f3izp7": {
              "as": "arg1",
              "from": "8f3izp7",
              "to": "d86emo2"
            },
            "93rx3ru": {
              "as": "display",
              "from": "93rx3ru",
              "to": "sxjhepz"
            },
            "a6rdag9": {
              "as": "props",
              "from": "a6rdag9",
              "to": "y407zfo"
            },
            "av63lw9": {
              "as": "value",
              "from": "av63lw9",
              "to": "y407zfo"
            },
            "bts7694": {
              "as": "otherwise",
              "from": "bts7694",
              "to": "ewycyaq"
            },
            "d1wcpk1": {
              "as": "otherwise",
              "from": "d1wcpk1",
              "to": "tksk4wc"
            },
            "d86emo2": {
              "as": "fn",
              "from": "d86emo2",
              "to": "v0qabyr"
            },
            "doz740g": {
              "as": "arg0",
              "from": "doz740g",
              "to": "sb9qdgy"
            },
            "ewycyaq": {
              "as": "text",
              "from": "ewycyaq",
              "to": "kyu6h8m"
            },
            "ezx9hxj": {
              "as": "args",
              "from": "ezx9hxj",
              "to": "old0t0c"
            },
            "fd7yax9": {
              "as": "value",
              "from": "fd7yax9",
              "to": "7c2vt3d"
            },
            "fgmcy0x": {
              "as": "publish",
              "from": "fgmcy0x",
              "to": "gvk9hec"
            },
            "gibdj45": {
              "as": "val",
              "from": "gibdj45",
              "to": "parseval"
            },
            "gtpf6x9": {
              "as": "arg0",
              "from": "gtpf6x9",
              "to": "d86emo2"
            },
            "gvk9hec": {
              "as": "_sliderstate",
              "from": "gvk9hec",
              "to": "0i85qjj"
            },
            "h19qe28": {
              "as": "persist",
              "from": "h19qe28",
              "to": "gvk9hec"
            },
            "ku4l1v6": {
              "as": "value",
              "from": "ku4l1v6",
              "to": "ewycyaq"
            },
            "kyu6h8m": {
              "as": "arg2",
              "from": "kyu6h8m",
              "to": "sb9qdgy"
            },
            "l5bzesi": {
              "as": "arg0",
              "from": "l5bzesi",
              "to": "2wp8ffd"
            },
            "mpbvtrq": {
              "as": "type",
              "from": "mpbvtrq",
              "to": "24q0egm"
            },
            "n4i4t17": {
              "as": "val",
              "from": "n4i4t17",
              "to": "av63lw9"
            },
            "nrhhdip": {
              "as": "value",
              "from": "nrhhdip",
              "to": "oqbuspj"
            },
            "old0t0c": {
              "as": "oninput",
              "from": "old0t0c",
              "to": "24q0egm"
            },
            "oqbuspj": {
              "as": "args",
              "from": "oqbuspj",
              "to": "v0qabyr"
            },
            "parseval": {
              "as": "value",
              "from": "parseval",
              "to": "ezx9hxj"
            },
            "q09a315": {
              "as": "otherwise",
              "from": "q09a315",
              "to": "yv0o41n"
            },
            "q8ugbch": {
              "as": "flex-direction",
              "from": "q8ugbch",
              "to": "sxjhepz"
            },
            "r1ah7g2": {
              "as": "otherwise",
              "from": "r1ah7g2",
              "to": "7c2vt3d"
            },
            "racg3p7": {
              "as": "text",
              "from": "racg3p7",
              "to": "doz740g"
            },
            "sb9qdgy": {
              "as": "children",
              "from": "sb9qdgy",
              "to": "y407zfo"
            },
            "slidervalpublish": {
              "as": "publish",
              "from": "slidervalpublish",
              "to": "t1deznd"
            },
            "sv49nso": {
              "as": "value",
              "from": "sv49nso",
              "to": "tksk4wc"
            },
            "sxjhepz": {
              "as": "style",
              "from": "sxjhepz",
              "to": "a6rdag9"
            },
            "t1deznd": {
              "as": "_sliderval",
              "from": "t1deznd",
              "to": "0i85qjj"
            },
            "tjzn9ne": {
              "as": "state",
              "from": "tjzn9ne",
              "to": "av63lw9"
            },
            "tksk4wc": {
              "as": "value",
              "from": "tksk4wc",
              "to": "24q0egm"
            },
            "u4k2auv": {
              "as": "label",
              "from": "u4k2auv",
              "to": "0i85qjj"
            },
            "v0qabyr": {
              "as": "onchange",
              "from": "v0qabyr",
              "to": "24q0egm"
            },
            "vgishln": {
              "as": "target",
              "from": "vgishln",
              "to": "ku4l1v6"
            },
            "x4vnm62": {
              "as": "argmax",
              "from": "x4vnm62",
              "to": "1dhoyv2"
            },
            "y407zfo": {
              "as": "display",
              "from": "y407zfo",
              "to": "out"
            },
            "yv0o41n": {
              "as": "step",
              "from": "yv0o41n",
              "to": "24q0egm"
            },
            "z3jopgg": {
              "as": "value",
              "from": "z3jopgg",
              "to": "yv0o41n"
            },
            "z8c7kcy": {
              "as": "val",
              "from": "z8c7kcy",
              "to": "nrhhdip"
            },
            "r0fsdrm": {
              "from": "r0fsdrm",
              "to": "gvk9hec",
              "as": "value"
            },
            "e996mm5": {
              "from": "e996mm5",
              "to": "r0fsdrm",
              "as": "min"
            },
            "on0cfjb": {
              "as": "graphval",
              "from": "on0cfjb",
              "to": "34k9xvb"
            },
            "x4fmyaa": {
              "as": "argmax",
              "from": "x4fmyaa",
              "to": "34k9xvb"
            },
            "34k9xvb": {
              "from": "34k9xvb",
              "to": "r0fsdrm",
              "as": "max"
            }
          },
          "id": "@html.slider",
          "nodes": {
            "0i85qjj": {
              "id": "0i85qjj"
            },
            "1dhoyv2": {
              "id": "1dhoyv2",
              "ref": "@js.script",
              "value": "return !isNaN(argmax) ? argmax : !isNaN(graphval) ? graphval : 1.0"
            },
            "24q0egm": {
              "id": "24q0egm"
            },
            "2wp8ffd": {
              "id": "2wp8ffd",
              "ref": "@data.array"
            },
            "4dh6wzn": {
              "id": "4dh6wzn",
              "ref": "arg",
              "value": "oninput"
            },
            "4subc0j": {
              "id": "4subc0j",
              "ref": "arg",
              "value": "__graph_value"
            },
            "5mog0bc": {
              "id": "5mog0bc",
              "ref": "@html.html_element",
              "value": "input"
            },
            "7c2vt3d": {
              "id": "7c2vt3d",
              "ref": "@flow.default"
            },
            "8f3izp7": {
              "id": "8f3izp7",
              "ref": "arg",
              "value": "onchange"
            },
            "93rx3ru": {
              "id": "93rx3ru",
              "value": "flex"
            },
            "a6rdag9": {
              "id": "a6rdag9"
            },
            "av63lw9": {
              "id": "av63lw9",
              "ref": "@js.script",
              "value": "if (state.state !== undefined && val.value === undefined) {\n  val.set.fn(state.state)\n}\n\nreturn val;"
            },
            "bts7694": {
              "id": "bts7694",
              "ref": "arg",
              "value": "_sliderstate.state"
            },
            "d1wcpk1": {
              "id": "d1wcpk1",
              "ref": "arg",
              "value": "_sliderstate.state"
            },
            "d86emo2": {
              "id": "d86emo2",
              "ref": "@data.array"
            },
            "doz740g": {
              "id": "doz740g",
              "ref": "@html.html_text"
            },
            "ewycyaq": {
              "id": "ewycyaq",
              "ref": "@flow.default"
            },
            "ezx9hxj": {
              "id": "ezx9hxj"
            },
            "fd7yax9": {
              "id": "fd7yax9",
              "ref": "arg",
              "value": "min"
            },
            "fgmcy0x": {
              "id": "fgmcy0x",
              "value": "true"
            },
            "gibdj45": {
              "id": "gibdj45",
              "ref": "arg",
              "value": "event.target.value"
            },
            "gtpf6x9": {
              "id": "gtpf6x9",
              "ref": "arg",
              "value": "_sliderstate.set"
            },
            "gvk9hec": {
              "id": "gvk9hec",
              "ref": "@memory.state"
            },
            "h19qe28": {
              "id": "h19qe28",
              "value": "true"
            },
            "ku4l1v6": {
              "id": "ku4l1v6",
              "ref": "@data.get",
              "value": "value"
            },
            "kyu6h8m": {
              "id": "kyu6h8m",
              "ref": "@html.html_text"
            },
            "l5bzesi": {
              "id": "l5bzesi",
              "ref": "arg",
              "value": "_sliderval.set"
            },
            "mpbvtrq": {
              "id": "mpbvtrq",
              "value": "range"
            },
            "n4i4t17": {
              "id": "n4i4t17",
              "ref": "arg",
              "value": "_sliderval"
            },
            "nrhhdip": {
              "id": "nrhhdip",
              "ref": "@js.script",
              "value": "return parseFloat(val)"
            },
            "old0t0c": {
              "id": "old0t0c",
              "ref": "@flow.ap"
            },
            "oqbuspj": {
              "id": "oqbuspj"
            },
            "out": {
              "id": "out",
              "name": "@html.slider",
              "ref": "return"
            },
            "parseval": {
              "id": "parseval",
              "ref": "@js.script",
              "value": "return parseFloat(val)"
            },
            "q09a315": {
              "id": "q09a315",
              "ref": "",
              "value": "0.01"
            },
            "q8ugbch": {
              "id": "q8ugbch",
              "value": "row"
            },
            "r1ah7g2": {
              "id": "r1ah7g2",
              "value": "0.0"
            },
            "racg3p7": {
              "id": "racg3p7",
              "ref": "arg",
              "value": "label"
            },
            "sb9qdgy": {
              "id": "sb9qdgy",
              "ref": "@data.array"
            },
            "slidervalpublish": {
              "id": "slidervalpublish",
              "value": "true"
            },
            "sv49nso": {
              "id": "sv49nso",
              "ref": "arg",
              "value": "_sliderval.value"
            },
            "sxjhepz": {
              "id": "sxjhepz"
            },
            "t1deznd": {
              "id": "t1deznd",
              "ref": "@memory.refval"
            },
            "tjzn9ne": {
              "id": "tjzn9ne",
              "ref": "arg",
              "value": "_sliderstate"
            },
            "tksk4wc": {
              "id": "tksk4wc",
              "ref": "@flow.default"
            },
            "u4k2auv": {
              "id": "u4k2auv",
              "value": "Slider"
            },
            "v0qabyr": {
              "id": "v0qabyr",
              "ref": "@flow.ap"
            },
            "vgishln": {
              "id": "vgishln",
              "ref": "arg",
              "value": "_sliderval"
            },
            "x4vnm62": {
              "id": "x4vnm62",
              "ref": "arg",
              "value": "max"
            },
            "y407zfo": {
              "id": "y407zfo",
              "ref": "@html.html_element"
            },
            "yv0o41n": {
              "id": "yv0o41n",
              "ref": "@flow.default"
            },
            "z3jopgg": {
              "id": "z3jopgg",
              "ref": "arg",
              "value": "step"
            },
            "z8c7kcy": {
              "id": "z8c7kcy",
              "ref": "arg",
              "value": "event.target.value"
            },
            "r0fsdrm": {
              "id": "r0fsdrm",
              "ref": "@js.script",
              "value": "return 0.5 * ((max ?? 1) - (min ?? 0)) + (min ?? 0)"
            },
            "e996mm5": {
              "id": "e996mm5",
              "ref": "arg",
              "value": "min"
            },
            "34k9xvb": {
              "id": "34k9xvb",
              "ref": "@js.script",
              "value": "return !isNaN(argmax) ? argmax : !isNaN(graphval) ? graphval : 1.0"
            },
            "x4fmyaa": {
              "id": "x4fmyaa",
              "ref": "arg",
              "value": "max"
            },
            "on0cfjb": {
              "id": "on0cfjb",
              "ref": "arg",
              "value": "__graph_value"
            }
          },
          "out": "out"
        },
        "@nodysseus.export": {
          "id": "@nodysseus.export",
          "out": "main/out",
          "category": "nodysseus",
          "nodes": {
            "args": {
              "id": "args"
            },
            "main/out": {
              "id": "main/out",
              "name": "@nodysseus.export",
              "ref": "return"
            },
            "jklqh38": {
              "id": "jklqh38",
              "ref": "@html.html_element"
            },
            "8dy573e": {
              "id": "8dy573e",
              "value": "a",
              "ref": "@html.html_element"
            },
            "6qkew20": {
              "id": "6qkew20",
              "ref": "@data.array"
            },
            "zihm1kd": {
              "id": "zihm1kd"
            },
            "2dz33fg": {
              "id": "2dz33fg",
              "value": "_new"
            },
            "n7aaoju": {
              "id": "n7aaoju",
              "value": "Export",
              "ref": "@html.html_text"
            },
            "jdoak4g": {
              "id": "jdoak4g",
              "value": "return ns + '.json';",
              "ref": "@js.script"
            },
            "3b7bnzm": {
              "id": "3b7bnzm",
              "ref": "@memory.state"
            },
            "ug26ugw": {
              "id": "ug26ugw",
              "value": "hrefstate.state",
              "name": "",
              "ref": "arg"
            },
            "pni2xuu": {
              "id": "pni2xuu",
              "value": "href",
              "ref": "@debug.log"
            },
            "pcx97n4": {
              "id": "pcx97n4",
              "value": "input",
              "ref": "@html.html_element"
            },
            "rk7hcxc": {
              "id": "rk7hcxc"
            },
            "b8wohxv": {
              "id": "b8wohxv",
              "value": "select"
            },
            "x200f4j": {
              "id": "x200f4j",
              "value": "export-list"
            },
            "et5g0m1": {
              "id": "et5g0m1",
              "ref": "@data.map"
            },
            "9tv13iq": {
              "id": "9tv13iq",
              "value": "return _lib.no.runtime.refs()",
              "ref": "@js.script"
            },
            "dd6st1b": {
              "id": "dd6st1b",
              "value": "element",
              "ref": "arg"
            },
            "2yur4h7": {
              "id": "2yur4h7",
              "ref": "@flow.runnable"
            },
            "xdot36k": {
              "id": "xdot36k"
            },
            "1edrrwq": {
              "id": "1edrrwq",
              "value": "option",
              "ref": "@html.html_element"
            },
            "skqnl08": {
              "id": "skqnl08",
              "ref": "@html.html_text"
            },
            "3y8pyc2": {
              "id": "3y8pyc2",
              "value": "datalist",
              "ref": "@html.html_element"
            },
            "tfwqhqf": {
              "id": "tfwqhqf",
              "value": "export-list"
            },
            "xp4pv1h": {
              "id": "xp4pv1h",
              "value": "return element",
              "ref": "@js.script"
            },
            "i5wnhvh": {
              "id": "i5wnhvh",
              "ref": "@flow.ap"
            },
            "mp0ce5t": {
              "id": "mp0ce5t",
              "value": "hrefstate.set",
              "ref": "arg"
            },
            "zucq3k4": {
              "id": "zucq3k4"
            },
            "8470sfe": {
              "id": "8470sfe",
              "value": "return URL.createObjectURL(file)",
              "ref": "@js.script"
            },
            "hke54sp": {
              "id": "hke54sp",
              "value": 'return new Blob([json], {type: "application/json"})',
              "ref": "@js.script"
            },
            "syfso39": {
              "id": "syfso39",
              "ref": "@data.stringify"
            },
            "kaiwusy": {
              "id": "kaiwusy",
              "value": "mapout",
              "ref": "@debug.log"
            },
            "db0reg4": {
              "id": "db0reg4",
              "ref": "@data.map"
            },
            "0pnyh3t": {
              "id": "0pnyh3t",
              "value": "mapin",
              "ref": "@debug.log"
            },
            "l4o1umt": {
              "id": "l4o1umt",
              "value": "return _lib.no.runtime.refs().filter(r => r.startsWith('@' + namespace + '.') || r === namespace)",
              "ref": "@js.script"
            },
            "w78q6vm": {
              "id": "w78q6vm",
              "value": "ns",
              "ref": "@debug.log"
            },
            "959i120": {
              "id": "959i120",
              "ref": "@flow.runnable"
            },
            "a1vqjzz": {
              "id": "a1vqjzz",
              "value": "element",
              "ref": "arg"
            },
            "1148sh5": {
              "id": "1148sh5",
              "value": "2"
            },
            "1axuplc": {
              "id": "1axuplc",
              "value": "event.target.value",
              "ref": "arg"
            },
            "tad7830": {
              "id": "tad7830",
              "ref": "@memory.state"
            },
            "jdufmth": {
              "id": "jdufmth",
              "value": "namespace.state",
              "ref": "arg"
            },
            "91lhfar_arr": {
              "id": "91lhfar_arr",
              "ref": "@data.array"
            },
            "91lhfar": {
              "id": "91lhfar",
              "ref": "@flow.ap"
            },
            "898n6f7": {
              "id": "898n6f7",
              "ref": "@flow.ap"
            },
            "9jvfgj1": {
              "id": "9jvfgj1",
              "value": "namespace.set",
              "ref": "arg"
            },
            "j2c518b": {
              "id": "j2c518b"
            },
            "qpiqhgp": {
              "id": "qpiqhgp",
              "value": "event.target.value",
              "ref": "arg"
            },
            "x8ik3x4": {
              "id": "x8ik3x4",
              "value": "const graph = {...ref};\ndelete graph._nodes_old;\ndelete graph._edges_old;\ndelete graph.edges_in;\nreturn graph;",
              "ref": "@js.script"
            },
            "6ag8lnc": {
              "id": "6ag8lnc"
            },
            "9rf8bds": {
              "id": "9rf8bds"
            },
            "690ivn1": {
              "id": "690ivn1",
              "value": "val",
              "ref": "@debug.log"
            },
            "zpv5bk2": {
              "id": "zpv5bk2"
            },
            "6dadrg0": {
              "id": "6dadrg0",
              "value": "event",
              "ref": "arg"
            },
            "i60dlmh": {
              "id": "i60dlmh"
            },
            "g7pa2bl": {
              "id": "g7pa2bl"
            },
            "8zvzwb5": {
              "id": "8zvzwb5",
              "value": "return _lib.no.runtime.get_ref(ref);",
              "ref": "@js.script"
            }
          },
          "edges": {
            "args": {
              "from": "args",
              "to": "main/out",
              "as": "args"
            },
            "n7aaoju": {
              "from": "n7aaoju",
              "to": "8dy573e",
              "as": "children"
            },
            "jklqh38": {
              "from": "jklqh38",
              "to": "main/out",
              "as": "display"
            },
            "6qkew20": {
              "from": "6qkew20",
              "to": "jklqh38",
              "as": "children"
            },
            "8dy573e": {
              "from": "8dy573e",
              "to": "6qkew20",
              "as": "arg0"
            },
            "zihm1kd": {
              "from": "zihm1kd",
              "to": "8dy573e",
              "as": "props"
            },
            "2dz33fg": {
              "from": "2dz33fg",
              "to": "zihm1kd",
              "as": "target"
            },
            "tad7830": {
              "from": "tad7830",
              "to": "args",
              "as": "namespace"
            },
            "jdufmth": {
              "from": "jdufmth",
              "to": "jdoak4g",
              "as": "ns"
            },
            "jdoak4g": {
              "from": "jdoak4g",
              "to": "zihm1kd",
              "as": "download"
            },
            "3b7bnzm": {
              "from": "3b7bnzm",
              "to": "args",
              "as": "hrefstate"
            },
            "pni2xuu": {
              "from": "pni2xuu",
              "to": "zihm1kd",
              "as": "href"
            },
            "ug26ugw": {
              "from": "ug26ugw",
              "to": "pni2xuu",
              "as": "value"
            },
            "pcx97n4": {
              "from": "pcx97n4",
              "to": "6qkew20",
              "as": "arg2"
            },
            "rk7hcxc": {
              "from": "rk7hcxc",
              "to": "pcx97n4",
              "as": "props"
            },
            "b8wohxv": {
              "from": "b8wohxv",
              "to": "rk7hcxc",
              "as": "type"
            },
            "x200f4j": {
              "from": "x200f4j",
              "to": "rk7hcxc",
              "as": "list"
            },
            "3y8pyc2": {
              "from": "3y8pyc2",
              "to": "6qkew20",
              "as": "arg3"
            },
            "et5g0m1": {
              "from": "et5g0m1",
              "to": "3y8pyc2",
              "as": "children"
            },
            "9tv13iq": {
              "from": "9tv13iq",
              "to": "et5g0m1",
              "as": "array"
            },
            "2yur4h7": {
              "from": "2yur4h7",
              "to": "et5g0m1",
              "as": "fn"
            },
            "dd6st1b": {
              "from": "dd6st1b",
              "to": "xp4pv1h",
              "as": "element"
            },
            "xdot36k": {
              "from": "xdot36k",
              "to": "3y8pyc2",
              "as": "props"
            },
            "1edrrwq": {
              "from": "1edrrwq",
              "to": "2yur4h7",
              "as": "fn"
            },
            "skqnl08": {
              "from": "skqnl08",
              "to": "1edrrwq",
              "as": "children"
            },
            "xp4pv1h": {
              "from": "xp4pv1h",
              "to": "skqnl08",
              "as": "text"
            },
            "tfwqhqf": {
              "from": "tfwqhqf",
              "to": "xdot36k",
              "as": "id"
            },
            "zucq3k4": {
              "from": "zucq3k4",
              "to": "i5wnhvh",
              "as": "args"
            },
            "8470sfe": {
              "from": "8470sfe",
              "to": "zucq3k4",
              "as": "value"
            },
            "hke54sp": {
              "from": "hke54sp",
              "to": "8470sfe",
              "as": "file"
            },
            "syfso39": {
              "from": "syfso39",
              "to": "hke54sp",
              "as": "json"
            },
            "1148sh5": {
              "from": "1148sh5",
              "to": "syfso39",
              "as": "spacer"
            },
            "kaiwusy": {
              "from": "kaiwusy",
              "to": "syfso39",
              "as": "object"
            },
            "db0reg4": {
              "from": "db0reg4",
              "to": "kaiwusy",
              "as": "value"
            },
            "959i120": {
              "from": "959i120",
              "to": "db0reg4",
              "as": "fn"
            },
            "0pnyh3t": {
              "from": "0pnyh3t",
              "to": "db0reg4",
              "as": "array"
            },
            "l4o1umt": {
              "from": "l4o1umt",
              "to": "0pnyh3t",
              "as": "value"
            },
            "w78q6vm": {
              "from": "w78q6vm",
              "to": "l4o1umt",
              "as": "namespace"
            },
            "1axuplc": {
              "from": "1axuplc",
              "to": "w78q6vm",
              "as": "value"
            },
            "x8ik3x4": {
              "from": "x8ik3x4",
              "to": "959i120",
              "as": "fn"
            },
            "a1vqjzz": {
              "from": "a1vqjzz",
              "to": "8zvzwb5",
              "as": "ref"
            },
            "mp0ce5t": {
              "from": "mp0ce5t",
              "to": "i5wnhvh",
              "as": "fn"
            },
            "91lhfar": {
              "from": "91lhfar",
              "to": "rk7hcxc",
              "as": "onchange"
            },
            "i5wnhvh": {
              "from": "i5wnhvh",
              "to": "91lhfar_arr",
              "as": "arg1"
            },
            "898n6f7": {
              "from": "898n6f7",
              "to": "91lhfar_arr",
              "as": "arg0"
            },
            "91lhfar_arr": {
              "from": "91lhfar_arr",
              "to": "91lhfar",
              "as": "fn"
            },
            "9jvfgj1": {
              "from": "9jvfgj1",
              "to": "898n6f7",
              "as": "fn"
            },
            "qpiqhgp": {
              "from": "qpiqhgp",
              "to": "j2c518b",
              "as": "value"
            },
            "6ag8lnc": {
              "from": "6ag8lnc",
              "to": "2yur4h7",
              "as": "parameters"
            },
            "9rf8bds": {
              "from": "9rf8bds",
              "to": "6ag8lnc",
              "as": "element"
            },
            "690ivn1": {
              "from": "690ivn1",
              "to": "898n6f7",
              "as": "args"
            },
            "j2c518b": {
              "from": "j2c518b",
              "to": "690ivn1",
              "as": "value"
            },
            "zpv5bk2": {
              "from": "zpv5bk2",
              "to": "91lhfar",
              "as": "args"
            },
            "6dadrg0": {
              "from": "6dadrg0",
              "to": "zpv5bk2",
              "as": "event"
            },
            "i60dlmh": {
              "from": "i60dlmh",
              "to": "959i120",
              "as": "parameters"
            },
            "g7pa2bl": {
              "from": "g7pa2bl",
              "to": "i60dlmh",
              "as": "element"
            },
            "8zvzwb5": {
              "from": "8zvzwb5",
              "to": "x8ik3x4",
              "as": "ref"
            }
          }
        },
        "@memory.assetmanager": {
          "id": "@memory.assetmanager",
          "out": "out",
          "nodes": {
            "args": {
              "id": "args"
            },
            "qgbinm2": {
              "id": "qgbinm2",
              "value": "input",
              "ref": "@html.html_element"
            },
            "8dy573e": {
              "id": "8dy573e",
              "ref": "@html.html_element"
            },
            "output_val": {
              "id": "output_val",
              "value": "some output"
            },
            "out": {
              "id": "out",
              "ref": "return",
              "name": "@memory.assetmanager"
            },
            "46kgw03": {
              "id": "46kgw03",
              "value": "\nconsole.log(_lib);\n\nreturn _lib.list_assets();",
              "ref": "@js.script"
            },
            "4nx9x10": {
              "id": "4nx9x10",
              "ref": "@debug.log"
            },
            "rrgshuq": {
              "id": "rrgshuq",
              "value": "select",
              "ref": "@html.html_element"
            },
            "chkprox": {
              "id": "chkprox",
              "ref": "@data.map"
            },
            "5hesw9s": {
              "id": "5hesw9s",
              "value": "return _lib.no.runtime.list_assets()",
              "ref": "@js.script"
            },
            "49od031": {
              "id": "49od031",
              "ref": "@flow.runnable"
            },
            "h1z2zqq": {
              "id": "h1z2zqq",
              "value": "element",
              "ref": "arg"
            },
            "znw0jq1": {
              "id": "znw0jq1",
              "value": "option",
              "ref": "@html.html_element"
            },
            "xiv2pw0": {
              "id": "xiv2pw0"
            },
            "yx1sv0e": {
              "id": "yx1sv0e"
            },
            "zk03lef": {
              "id": "zk03lef"
            },
            "23vrr6n": {
              "id": "23vrr6n",
              "value": "element",
              "ref": "arg"
            },
            "md80upr": {
              "id": "md80upr"
            },
            "zhoffc7": {
              "id": "zhoffc7",
              "ref": "@data.array"
            },
            "4zueto7": {
              "id": "4zueto7"
            },
            "5ndg5og": {
              "id": "5ndg5og",
              "value": "file"
            },
            "10ozygd": {
              "id": "10ozygd",
              "ref": "@flow.runnable"
            },
            "6zb4hho": {
              "id": "6zb4hho",
              "value": "event.target.files",
              "ref": "arg"
            },
            "6c04ryh": {
              "id": "6c04ryh",
              "value": "_lib.no.runtime.add_asset(name, files[0])",
              "ref": "@js.script"
            },
            "d4sx4ej": {
              "id": "d4sx4ej",
              "value": "assetname",
              "ref": "arg"
            },
            "drkjew9": {
              "id": "drkjew9"
            },
            "12i36ht": {
              "id": "12i36ht",
              "ref": "@memory.state"
            },
            "gwslf7p": {
              "id": "gwslf7p"
            },
            "g6loz00": {
              "id": "g6loz00",
              "ref": "@flow.ap"
            },
            "7ny91r3": {
              "id": "7ny91r3",
              "value": "event.target.value",
              "ref": "arg"
            },
            "vg773lv": {
              "id": "vg773lv",
              "value": "return _lib.no.runtime.get_asset(asset);",
              "ref": "@js.script"
            },
            "jhyu5pk": {
              "id": "jhyu5pk"
            },
            "gnuhmpf": {
              "id": "gnuhmpf",
              "value": "_asset.set",
              "ref": "arg"
            },
            "dh814lx": {
              "id": "dh814lx",
              "value": "_asset.state",
              "ref": "arg"
            },
            "mhqejl5": {
              "id": "mhqejl5",
              "value": "file",
              "ref": "@data.set"
            },
            "1090db5": {
              "id": "1090db5",
              "ref": "@flow.if"
            },
            "xuyat95": {
              "id": "xuyat95",
              "ref": "@flow.if"
            },
            "mk4gru0": {
              "id": "mk4gru0",
              "value": "assetname",
              "ref": "arg"
            },
            "9ucfrui": {
              "id": "9ucfrui",
              "ref": "@flow.ap"
            },
            "1ts2j8n": {
              "id": "1ts2j8n"
            },
            "gzki6r1": {
              "id": "gzki6r1",
              "value": "return _lib.no.runtime.get_asset(asset);",
              "ref": "@js.script"
            },
            "l7ahauw": {
              "id": "l7ahauw",
              "value": "assetname",
              "ref": "arg"
            },
            "nhruqy5": {
              "id": "nhruqy5",
              "value": "true"
            },
            "g7ew1lp": {
              "id": "g7ew1lp",
              "value": "_asset.set",
              "ref": "arg"
            },
            "riqk7hm": {
              "id": "riqk7hm",
              "value": "_asset.state",
              "ref": "arg"
            },
            "b9gbfro": {
              "id": "b9gbfro",
              "value": "_asset.state",
              "ref": "arg"
            }
          },
          "edges": {
            "qgbinm2": {
              "from": "qgbinm2",
              "to": "zhoffc7",
              "as": "arg2"
            },
            "8dy573e": {
              "from": "8dy573e",
              "to": "mhqejl5",
              "as": "target"
            },
            "args": {
              "from": "args",
              "to": "out",
              "as": "args"
            },
            "rrgshuq": {
              "from": "rrgshuq",
              "to": "zhoffc7",
              "as": "arg3"
            },
            "chkprox": {
              "from": "chkprox",
              "to": "rrgshuq",
              "as": "children"
            },
            "5hesw9s": {
              "from": "5hesw9s",
              "to": "chkprox",
              "as": "array"
            },
            "49od031": {
              "from": "49od031",
              "to": "chkprox",
              "as": "fn"
            },
            "h1z2zqq": {
              "from": "h1z2zqq",
              "to": "xiv2pw0",
              "as": "value"
            },
            "znw0jq1": {
              "from": "znw0jq1",
              "to": "49od031",
              "as": "fn"
            },
            "xiv2pw0": {
              "from": "xiv2pw0",
              "to": "znw0jq1",
              "as": "props"
            },
            "yx1sv0e": {
              "from": "yx1sv0e",
              "to": "49od031",
              "as": "parameters"
            },
            "zk03lef": {
              "from": "zk03lef",
              "to": "yx1sv0e",
              "as": "element"
            },
            "23vrr6n": {
              "from": "23vrr6n",
              "to": "znw0jq1",
              "as": "children"
            },
            "md80upr": {
              "from": "md80upr",
              "to": "drkjew9",
              "as": "event"
            },
            "zhoffc7": {
              "from": "zhoffc7",
              "to": "8dy573e",
              "as": "children"
            },
            "4zueto7": {
              "from": "4zueto7",
              "to": "qgbinm2",
              "as": "props"
            },
            "5ndg5og": {
              "from": "5ndg5og",
              "to": "4zueto7",
              "as": "type"
            },
            "10ozygd": {
              "from": "10ozygd",
              "to": "4zueto7",
              "as": "onchange"
            },
            "6zb4hho": {
              "from": "6zb4hho",
              "to": "6c04ryh",
              "as": "files"
            },
            "6c04ryh": {
              "from": "6c04ryh",
              "to": "10ozygd",
              "as": "fn"
            },
            "d4sx4ej": {
              "from": "d4sx4ej",
              "to": "6c04ryh",
              "as": "name"
            },
            "drkjew9": {
              "from": "drkjew9",
              "to": "10ozygd",
              "as": "parameters"
            },
            "12i36ht": {
              "from": "12i36ht",
              "to": "args",
              "as": "_asset"
            },
            "gwslf7p": {
              "from": "gwslf7p",
              "to": "rrgshuq",
              "as": "props"
            },
            "g6loz00": {
              "from": "g6loz00",
              "to": "gwslf7p",
              "as": "onchange"
            },
            "7ny91r3": {
              "from": "7ny91r3",
              "to": "vg773lv",
              "as": "asset"
            },
            "vg773lv": {
              "from": "vg773lv",
              "to": "jhyu5pk",
              "as": "value"
            },
            "jhyu5pk": {
              "from": "jhyu5pk",
              "to": "g6loz00",
              "as": "args"
            },
            "gnuhmpf": {
              "from": "gnuhmpf",
              "to": "g6loz00",
              "as": "fn"
            },
            "dh814lx": {
              "from": "dh814lx",
              "to": "gwslf7p",
              "as": "value"
            },
            "mhqejl5": {
              "from": "mhqejl5",
              "to": "out",
              "as": "value"
            },
            "b9gbfro": {
              "from": "b9gbfro",
              "to": "1090db5",
              "as": "true"
            },
            "riqk7hm": {
              "from": "riqk7hm",
              "to": "1090db5",
              "as": "pred"
            },
            "xuyat95": {
              "from": "xuyat95",
              "to": "1090db5",
              "as": "false"
            },
            "9ucfrui": {
              "from": "9ucfrui",
              "to": "xuyat95",
              "as": "true"
            },
            "mk4gru0": {
              "from": "mk4gru0",
              "to": "xuyat95",
              "as": "pred"
            },
            "g7ew1lp": {
              "from": "g7ew1lp",
              "to": "9ucfrui",
              "as": "fn"
            },
            "nhruqy5": {
              "from": "nhruqy5",
              "to": "9ucfrui",
              "as": "run"
            },
            "1ts2j8n": {
              "from": "1ts2j8n",
              "to": "9ucfrui",
              "as": "args"
            },
            "gzki6r1": {
              "from": "gzki6r1",
              "to": "1ts2j8n",
              "as": "value"
            },
            "l7ahauw": {
              "from": "l7ahauw",
              "to": "gzki6r1",
              "as": "asset"
            },
            "1090db5": {
              "from": "1090db5",
              "to": "mhqejl5",
              "as": "value"
            }
          },
          "category": "memory"
        },
        "@math.fit": {
          "id": "@math.fit",
          "out": "out",
          "nodes": {
            "args": {
              "id": "args"
            },
            "qgbinm2": {
              "id": "qgbinm2",
              "value": "Hello, world!",
              "ref": "@html.html_text"
            },
            "8dy573e": {
              "id": "8dy573e",
              "ref": "@html.html_element"
            },
            "output_val": {
              "id": "output_val",
              "value": "const ap0 = a0 === undefined ? 0 : a0;\nconst bp0 = b0 === undefined ? 1 : b0;\nconst lerp = (x - ap0) / (bp0 - ap0);\nconst result = a1 + lerp * (b1 - a1);\nreturn clamp ? Math.min(Math.max(result, Math.min(a1, b1)), Math.max(a1, b1)) : result",
              "ref": "@js.script"
            },
            "out": {
              "id": "out",
              "name": "@math.fit",
              "ref": "return"
            },
            "5locpe3": {
              "id": "5locpe3",
              "value": "oldLow",
              "ref": "arg"
            },
            "a8kr545": {
              "id": "a8kr545",
              "value": "oldHigh",
              "ref": "arg"
            },
            "s9mrg9v": {
              "id": "s9mrg9v",
              "value": "newLow",
              "ref": "arg"
            },
            "y1hnt8t": {
              "id": "y1hnt8t",
              "value": "newHigh",
              "ref": "arg"
            },
            "fma0geo": {
              "id": "fma0geo",
              "value": "value",
              "ref": "arg"
            },
            "s351p91": {
              "id": "s351p91",
              "value": "clamp",
              "ref": "arg"
            }
          },
          "edges": {
            "qgbinm2": {
              "from": "qgbinm2",
              "to": "8dy573e",
              "as": "children"
            },
            "8dy573e": {
              "from": "8dy573e",
              "to": "out",
              "as": "display"
            },
            "output_val": {
              "from": "output_val",
              "to": "out",
              "as": "value"
            },
            "args": {
              "from": "args",
              "to": "out",
              "as": "args"
            },
            "5locpe3": {
              "from": "5locpe3",
              "to": "output_val",
              "as": "a0"
            },
            "a8kr545": {
              "from": "a8kr545",
              "to": "output_val",
              "as": "b0"
            },
            "s9mrg9v": {
              "from": "s9mrg9v",
              "to": "output_val",
              "as": "a1"
            },
            "y1hnt8t": {
              "from": "y1hnt8t",
              "to": "output_val",
              "as": "b1"
            },
            "fma0geo": {
              "from": "fma0geo",
              "to": "output_val",
              "as": "x"
            },
            "s351p91": {
              "from": "s351p91",
              "to": "output_val",
              "as": "clamp"
            }
          },
          "category": "math"
        },
        "@flow.switch_inputs": {
          "id": "@flow.switch_inputs",
          "out": "out",
          "nodes": {
            "args": {
              "id": "args"
            },
            "8dy573e": {
              "id": "8dy573e",
              "ref": "@html.html_element"
            },
            "out": {
              "id": "out",
              "name": "@flow.switch_inputs",
              "ref": "return"
            },
            "6280gtl": {
              "id": "6280gtl",
              "ref": "@data.get"
            },
            "gqi2qi3": {
              "id": "gqi2qi3",
              "value": "select",
              "ref": "@html.html_element"
            },
            "9r6mj9s": {
              "id": "9r6mj9s"
            },
            "8f9x43u": {
              "id": "8f9x43u",
              "ref": "@flow.ap"
            },
            "2j5rxq0": {
              "id": "2j5rxq0"
            },
            "q0h1zer": {
              "id": "q0h1zer",
              "value": "event.target.value",
              "ref": "arg"
            },
            "hyw65dk": {
              "id": "hyw65dk",
              "value": "_chosen.set",
              "ref": "arg"
            },
            "ddhrxjw": {
              "id": "ddhrxjw",
              "ref": "@data.map"
            },
            "4ujfj58": {
              "id": "4ujfj58",
              "value": 'return (object instanceof Map ? [...object.keys()] : Object.keys(object)).filter(k => !k.startsWith("_"))',
              "ref": "@js.script"
            },
            "s35ms5l": {
              "id": "s35ms5l",
              "value": "_args",
              "ref": "arg"
            },
            "jdajqk3": {
              "id": "jdajqk3",
              "ref": "@flow.runnable"
            },
            "evpcvvi": {
              "id": "evpcvvi",
              "value": "option",
              "ref": "@html.html_element"
            },
            "86zvrx4": {
              "id": "86zvrx4",
              "value": "element",
              "ref": "arg"
            },
            "m24351r": {
              "id": "m24351r"
            },
            "1s77djh": {
              "id": "1s77djh",
              "value": "element",
              "ref": "arg"
            },
            "65wrg0t": {
              "id": "65wrg0t",
              "ref": "@memory.state"
            },
            "y5r6re6": {
              "id": "y5r6re6",
              "value": "_args",
              "ref": "arg"
            },
            "0adxu2g": {
              "id": "0adxu2g"
            },
            "vz8dmxf": {
              "id": "vz8dmxf"
            },
            "77z7u64": {
              "id": "77z7u64",
              "ref": "@flow.ap"
            },
            "4w1wh15": {
              "id": "4w1wh15",
              "value": "true"
            },
            "fob1r0t": {
              "id": "fob1r0t",
              "value": "_chosen.state",
              "ref": "arg"
            },
            "7uzzghh": {
              "id": "7uzzghh",
              "value": "_chosen.state",
              "ref": "arg"
            },
            "meoy2m1": {
              "id": "meoy2m1",
              "ref": "@flow.default"
            },
            "p53f7fz": {
              "id": "p53f7fz",
              "value": 'return (args instanceof Map ? [...args.keys()] : Object.keys(args)).filter(k => !k.startsWith("_"))[0];',
              "ref": "@js.script"
            },
            "c8500l8": {
              "id": "c8500l8",
              "value": "_args",
              "ref": "arg"
            },
            "dqzwfa3": {
              "id": "dqzwfa3",
              "ref": "@flow.default"
            },
            "y1oibqk": {
              "id": "y1oibqk",
              "value": 'return (args instanceof Map ? [...args.keys()] : Object.keys(args)).filter(k => !k.startsWith("_"))[0];',
              "ref": "@js.script"
            },
            "pbl7fry": {
              "id": "pbl7fry",
              "value": "_args",
              "ref": "arg"
            }
          },
          "edges": {
            "8dy573e": {
              "from": "8dy573e",
              "to": "out",
              "as": "display"
            },
            "args": {
              "from": "args",
              "to": "out",
              "as": "args"
            },
            "6280gtl": {
              "from": "6280gtl",
              "to": "77z7u64",
              "as": "fn"
            },
            "ddhrxjw": {
              "from": "ddhrxjw",
              "to": "gqi2qi3",
              "as": "children"
            },
            "9r6mj9s": {
              "from": "9r6mj9s",
              "to": "gqi2qi3",
              "as": "props"
            },
            "8f9x43u": {
              "from": "8f9x43u",
              "to": "9r6mj9s",
              "as": "onchange"
            },
            "hyw65dk": {
              "from": "hyw65dk",
              "to": "8f9x43u",
              "as": "fn"
            },
            "2j5rxq0": {
              "from": "2j5rxq0",
              "to": "8f9x43u",
              "as": "args"
            },
            "q0h1zer": {
              "from": "q0h1zer",
              "to": "2j5rxq0",
              "as": "value"
            },
            "jdajqk3": {
              "from": "jdajqk3",
              "to": "ddhrxjw",
              "as": "fn"
            },
            "4ujfj58": {
              "from": "4ujfj58",
              "to": "ddhrxjw",
              "as": "array"
            },
            "s35ms5l": {
              "from": "s35ms5l",
              "to": "4ujfj58",
              "as": "object"
            },
            "evpcvvi": {
              "from": "evpcvvi",
              "to": "jdajqk3",
              "as": "fn"
            },
            "m24351r": {
              "from": "m24351r",
              "to": "evpcvvi",
              "as": "props"
            },
            "86zvrx4": {
              "from": "86zvrx4",
              "to": "evpcvvi",
              "as": "children"
            },
            "1s77djh": {
              "from": "1s77djh",
              "to": "m24351r",
              "as": "value"
            },
            "gqi2qi3": {
              "from": "gqi2qi3",
              "to": "8dy573e",
              "as": "children"
            },
            "65wrg0t": {
              "from": "65wrg0t",
              "to": "args",
              "as": "_chosen"
            },
            "y5r6re6": {
              "from": "y5r6re6",
              "to": "6280gtl",
              "as": "target"
            },
            "0adxu2g": {
              "from": "0adxu2g",
              "to": "jdajqk3",
              "as": "parameters"
            },
            "vz8dmxf": {
              "from": "vz8dmxf",
              "to": "0adxu2g",
              "as": "element"
            },
            "77z7u64": {
              "from": "77z7u64",
              "to": "out",
              "as": "value"
            },
            "4w1wh15": {
              "from": "4w1wh15",
              "to": "77z7u64",
              "as": "run"
            },
            "fob1r0t": {
              "from": "fob1r0t",
              "to": "dqzwfa3",
              "as": "value"
            },
            "7uzzghh": {
              "from": "7uzzghh",
              "to": "meoy2m1",
              "as": "value"
            },
            "meoy2m1": {
              "from": "meoy2m1",
              "to": "6280gtl",
              "as": "path"
            },
            "c8500l8": {
              "from": "c8500l8",
              "to": "p53f7fz",
              "as": "args"
            },
            "p53f7fz": {
              "from": "p53f7fz",
              "to": "meoy2m1",
              "as": "otherwise"
            },
            "dqzwfa3": {
              "from": "dqzwfa3",
              "to": "9r6mj9s",
              "as": "arg0"
            },
            "pbl7fry": {
              "from": "pbl7fry",
              "to": "y1oibqk",
              "as": "args"
            },
            "y1oibqk": {
              "from": "y1oibqk",
              "to": "dqzwfa3",
              "as": "otherwise"
            }
          },
          "category": "flow"
        },
        "@memory.store_file": {
          "id": "@memory.store_file",
          "category": "memory",
          "nodes": {
            "args": {
              "id": "args"
            },
            "8dy573e": {
              "id": "8dy573e",
              "ref": "@html.html_element"
            },
            "arcnyff": {
              "id": "arcnyff",
              "ref": "@data.array"
            },
            "qgbinm2": {
              "id": "qgbinm2",
              "value": "Upload a json file",
              "ref": "@html.html_text"
            },
            "rtrp3nj": {
              "id": "rtrp3nj",
              "value": "input",
              "ref": "@html.html_element"
            },
            "vnibm4q": {
              "id": "vnibm4q"
            },
            "07fjn2b": {
              "id": "07fjn2b",
              "value": "file"
            },
            "jmqcpll": {
              "id": "jmqcpll",
              "ref": "@flow.runnable"
            },
            "o9ukwn8": {
              "id": "o9ukwn8",
              "value": "event.target.files.0",
              "ref": "arg"
            },
            "out": {
              "id": "out",
              "name": "@memory.store_file",
              "ref": "return"
            },
            "1672j69": {
              "id": "1672j69",
              "value": "arrayBuffer",
              "ref": "@js.call"
            },
            "qzp14wr": {
              "id": "qzp14wr",
              "value": "add_asset",
              "ref": "extern"
            },
            "v99fk3p": {
              "id": "v99fk3p",
              "ref": "@data.array"
            },
            "y58g8pm": {
              "id": "y58g8pm",
              "value": "img",
              "ref": "@html.html_element"
            },
            "pldugnx": {
              "id": "pldugnx"
            },
            "ceomp2r": {
              "id": "ceomp2r",
              "ref": "@data.array"
            },
            "uyspmvr": {
              "id": "uyspmvr",
              "value": "get_asset",
              "ref": "extern"
            },
            "psxdib2": {
              "id": "psxdib2",
              "ref": "return"
            },
            "nxdj21x": {
              "id": "nxdj21x"
            },
            "gsrb9e6": {
              "id": "gsrb9e6"
            },
            "4j186m3": {
              "id": "4j186m3",
              "value": "50vh"
            },
            "rdt0k55": {
              "id": "rdt0k55",
              "value": "image/*"
            },
            "gi30q1h": {
              "id": "gi30q1h"
            },
            "0clgvk2": {
              "id": "0clgvk2",
              "value": "event.target.files.0.type",
              "ref": "arg"
            },
            "yj9sw4x": {
              "id": "yj9sw4x",
              "value": "asset",
              "ref": "arg"
            },
            "c0gcfke": {
              "id": "c0gcfke",
              "value": "asset.data",
              "ref": "arg"
            },
            "qh60wjb": {
              "id": "qh60wjb",
              "value": "asset.type",
              "ref": "arg"
            },
            "ncih0ts": {
              "id": "ncih0ts",
              "value": "asset_id",
              "ref": "arg"
            },
            "zugbd71": {
              "id": "zugbd71",
              "ref": "@flow.if"
            },
            "fmostjp": {
              "id": "fmostjp",
              "value": "get_asset",
              "ref": "extern"
            },
            "hj6upcm": {
              "id": "hj6upcm",
              "ref": "@data.array"
            },
            "eviegts": {
              "id": "eviegts",
              "value": "asset_id",
              "ref": "arg"
            },
            "kldqqu0": {
              "id": "kldqqu0",
              "value": "asset.type",
              "ref": "arg"
            },
            "ic7fy1m": {
              "id": "ic7fy1m",
              "value": "asset.data",
              "ref": "arg"
            },
            "yx80n2x": {
              "id": "yx80n2x",
              "ref": "return"
            },
            "2qd7694": {
              "id": "2qd7694",
              "value": "const blob = new Blob([data], {type: filetype})\nconst url = URL.createObjectURL(blob);\nreturn url",
              "ref": "@js.script"
            },
            "5mfdcg0": {
              "id": "5mfdcg0"
            },
            "izkowx6": {
              "id": "izkowx6",
              "ref": "@flow.default"
            },
            "i6lfbjh": {
              "id": "i6lfbjh",
              "value": "__graph_value",
              "ref": "arg"
            },
            "b444vmf": {
              "id": "b444vmf",
              "ref": "@flow.default"
            },
            "lpet497": {
              "id": "lpet497",
              "value": "asset_id",
              "ref": "arg"
            },
            "lkz76u7": {
              "id": "lkz76u7",
              "value": "__graph_value",
              "ref": "arg"
            },
            "6t8kqs9": {
              "id": "6t8kqs9",
              "ref": "@flow.default"
            },
            "ke8lvin": {
              "id": "ke8lvin",
              "value": "__graph_value",
              "ref": "arg"
            },
            "j7ct5iw": {
              "id": "j7ct5iw",
              "value": "const blob = new Blob([data], {type: filetype})\nconst url = URL.createObjectURL(blob);\nreturn url",
              "ref": "@js.script"
            }
          },
          "edges": [
            {
              "from": "8dy573e",
              "to": "out",
              "as": "display"
            },
            {
              "from": "args",
              "to": "out",
              "as": "args"
            },
            {
              "from": "arcnyff",
              "to": "8dy573e",
              "as": "children"
            },
            {
              "from": "rtrp3nj",
              "to": "arcnyff",
              "as": "arg1"
            },
            {
              "from": "vnibm4q",
              "to": "rtrp3nj",
              "as": "props"
            },
            {
              "from": "07fjn2b",
              "to": "vnibm4q",
              "as": "type"
            },
            {
              "from": "rdt0k55",
              "to": "vnibm4q",
              "as": "accept"
            },
            {
              "from": "jmqcpll",
              "to": "vnibm4q",
              "as": "onchange"
            },
            {
              "from": "o9ukwn8",
              "to": "1672j69",
              "as": "self"
            },
            {
              "from": "qzp14wr",
              "to": "jmqcpll",
              "as": "fn"
            },
            {
              "from": "v99fk3p",
              "to": "qzp14wr",
              "as": "args"
            },
            {
              "from": "y58g8pm",
              "to": "arcnyff",
              "as": "arg2"
            },
            {
              "from": "ceomp2r",
              "to": "uyspmvr",
              "as": "args"
            },
            {
              "from": "nxdj21x",
              "to": "psxdib2",
              "as": "args"
            },
            {
              "from": "qgbinm2",
              "to": "arcnyff",
              "as": "arg0"
            },
            {
              "from": "psxdib2",
              "to": "pldugnx",
              "as": "src"
            },
            {
              "from": "pldugnx",
              "to": "y58g8pm",
              "as": "props"
            },
            {
              "from": "gsrb9e6",
              "to": "pldugnx",
              "as": "style"
            },
            {
              "from": "4j186m3",
              "to": "gsrb9e6",
              "as": "max-width"
            },
            {
              "from": "gi30q1h",
              "to": "v99fk3p",
              "as": "arg1"
            },
            {
              "from": "1672j69",
              "to": "gi30q1h",
              "as": "data"
            },
            {
              "from": "0clgvk2",
              "to": "gi30q1h",
              "as": "type"
            },
            {
              "from": "qh60wjb",
              "to": "j7ct5iw",
              "as": "filetype"
            },
            {
              "from": "c0gcfke",
              "to": "j7ct5iw",
              "as": "data"
            },
            {
              "from": "j7ct5iw",
              "to": "zugbd71",
              "as": "true"
            },
            {
              "from": "yj9sw4x",
              "to": "zugbd71",
              "as": "pred"
            },
            {
              "from": "yx80n2x",
              "to": "out",
              "as": "value"
            },
            {
              "from": "uyspmvr",
              "to": "nxdj21x",
              "as": "asset"
            },
            {
              "from": "zugbd71",
              "to": "psxdib2",
              "as": "value"
            },
            {
              "from": "hj6upcm",
              "to": "fmostjp",
              "as": "args"
            },
            {
              "from": "kldqqu0",
              "to": "2qd7694",
              "as": "filetype"
            },
            {
              "from": "ic7fy1m",
              "to": "2qd7694",
              "as": "data"
            },
            {
              "from": "2qd7694",
              "to": "yx80n2x",
              "as": "value"
            },
            {
              "from": "5mfdcg0",
              "to": "yx80n2x",
              "as": "args"
            },
            {
              "from": "fmostjp",
              "to": "5mfdcg0",
              "as": "asset"
            },
            {
              "from": "izkowx6",
              "to": "ceomp2r",
              "as": "arg0"
            },
            {
              "from": "i6lfbjh",
              "to": "izkowx6",
              "as": "otherwise"
            },
            {
              "from": "ncih0ts",
              "to": "izkowx6",
              "as": "value"
            },
            {
              "from": "lkz76u7",
              "to": "b444vmf",
              "as": "otherwise"
            },
            {
              "from": "lpet497",
              "to": "b444vmf",
              "as": "value"
            },
            {
              "from": "b444vmf",
              "to": "v99fk3p",
              "as": "arg0"
            },
            {
              "from": "6t8kqs9",
              "to": "hj6upcm",
              "as": "arg0"
            },
            {
              "from": "eviegts",
              "to": "6t8kqs9",
              "as": "value"
            },
            {
              "from": "ke8lvin",
              "to": "6t8kqs9",
              "as": "otherwise"
            }
          ],
          "out": "out"
        },
        "@data.ischanged": {
          "id": "@data.ischanged",
          "nodes": {
            "in": {
              "id": "in"
            },
            "eq_fn_value": {
              "id": "eq_fn_value",
              "ref": "arg",
              "value": "value"
            },
            "eq_fn_if": {
              "id": "eq_fn_if",
              "ref": "arg",
              "value": "eq_fn"
            },
            "fn": {
              "id": "fn",
              "ref": "arg",
              "value": "fn"
            },
            "cached": {
              "id": "cached",
              "ref": "arg",
              "value": "cached",
              "type": "internal"
            },
            "eq_default": {
              "id": "eq_default",
              "ref": "eq"
            },
            "eq_runnable": {
              "id": "eq_runnable",
              "ref": "@flow.runnable"
            },
            "fn_runnable": {
              "id": "fn_runnable",
              "ref": "@flow.default"
            },
            "eq_fn_runnable": {
              "id": "eq_fn_runnable",
              "ref": "@js.script",
              "value": "return {...fn, args: {...(fn.args ?? {}), a, b}}"
            },
            "eq_fn": {
              "id": "eq_fn",
              "ref": "run"
            },
            "eq_fn_return_args": {
              "id": "eq_fn_return_args"
            },
            "if_eq_fn": {
              "id": "if_eq_fn",
              "ref": "@flow.if"
            },
            "out": {
              "id": "out",
              "ref": "return",
              "name": "@data.ischanged"
            },
            "yp2q57b": {
              "id": "yp2q57b"
            },
            "tpe5t4z": {
              "id": "tpe5t4z",
              "ref": "@memory.refval"
            },
            "cy1tm8s": {
              "id": "cy1tm8s",
              "value": "const iseq = saved.value === value;\n\nif(!iseq) {\n  saved.set.fn(value);\n}\n\nreturn !iseq;",
              "ref": "@js.script"
            },
            "khdzxds": {
              "id": "khdzxds",
              "value": "_saved",
              "ref": "arg"
            },
            "lv2gcpk": {
              "id": "lv2gcpk",
              "value": "value",
              "ref": "arg"
            }
          },
          "edges": {
            "eq_default": {
              "from": "eq_default",
              "to": "eq_runnable",
              "as": "fn"
            },
            "eq_runnable": {
              "from": "eq_runnable",
              "to": "fn_runnable",
              "as": "otherwise"
            },
            "fn": {
              "from": "fn",
              "to": "fn_runnable",
              "as": "value"
            },
            "fn_runnable": {
              "from": "fn_runnable",
              "to": "eq_fn_runnable",
              "as": "fn"
            },
            "eq_fn_value": {
              "from": "eq_fn_value",
              "to": "eq_fn_runnable",
              "as": "a"
            },
            "cached": {
              "from": "cached",
              "to": "eq_fn_runnable",
              "as": "b"
            },
            "eq_fn_runnable": {
              "from": "eq_fn_runnable",
              "to": "eq_fn",
              "as": "runnable"
            },
            "eq_fn_if": {
              "from": "eq_fn_if",
              "to": "if_eq_fn",
              "as": "pred"
            },
            "eq_fn": {
              "from": "eq_fn",
              "to": "eq_fn_return_args",
              "as": "eq_fn"
            },
            "yp2q57b": {
              "from": "yp2q57b",
              "to": "out",
              "as": "args"
            },
            "tpe5t4z": {
              "from": "tpe5t4z",
              "to": "yp2q57b",
              "as": "_saved"
            },
            "cy1tm8s": {
              "from": "cy1tm8s",
              "to": "out",
              "as": "value"
            },
            "khdzxds": {
              "from": "khdzxds",
              "to": "cy1tm8s",
              "as": "saved"
            },
            "lv2gcpk": {
              "from": "lv2gcpk",
              "to": "cy1tm8s",
              "as": "value"
            }
          },
          "category": "data"
        },
        "@audio.tapbeat": {
          "edges": {
            "07e1bfn": {
              "as": "args",
              "from": "07e1bfn",
              "to": "j2hh8em"
            },
            "113q4li": {
              "as": "deltas",
              "from": "113q4li",
              "to": "4dgggsq"
            },
            "13e4el1": {
              "as": "height",
              "from": "13e4el1",
              "to": "v1az6xg"
            },
            "1484wjz": {
              "as": "value",
              "from": "1484wjz",
              "to": "ekjdg2h"
            },
            "151za0r": {
              "as": "value",
              "from": "151za0r",
              "to": "6qgqv3l"
            },
            "1fuixnh": {
              "as": "fn",
              "from": "1fuixnh",
              "to": "wleyt8i"
            },
            "1qcwz4u": {
              "as": "pred",
              "from": "1qcwz4u",
              "to": "ecro2kn"
            },
            "1t3aqnb": {
              "as": "fn",
              "from": "1t3aqnb",
              "to": "kf98qgd"
            },
            "1zhv7p5": {
              "as": "value",
              "from": "1zhv7p5",
              "to": "numz8ak"
            },
            "201yzow": {
              "as": "args",
              "from": "201yzow",
              "to": "kf98qgd"
            },
            "33dadts": {
              "as": "value",
              "from": "33dadts",
              "to": "l5h156b"
            },
            "3bf8axp": {
              "as": "publish",
              "from": "3bf8axp",
              "to": "cx9aa91"
            },
            "3y9h7wd": {
              "as": "run",
              "from": "3y9h7wd",
              "to": "wleyt8i"
            },
            "4113r3s": {
              "as": "publish",
              "from": "4113r3s",
              "to": "w4gg9pv"
            },
            "47b969g": {
              "as": "data",
              "from": "47b969g",
              "to": "wrnn8a5"
            },
            "4dgggsq": {
              "as": "value",
              "from": "4dgggsq",
              "to": "hhtc498"
            },
            "4j7h0bp": {
              "as": "fn",
              "from": "4j7h0bp",
              "to": "d3crr2f"
            },
            "4q5sykk": {
              "as": "class",
              "from": "4q5sykk",
              "to": "i4hvk0h"
            },
            "5cn0o7r": {
              "as": "arg2",
              "from": "5cn0o7r",
              "to": "vnxyyu1"
            },
            "5oh2s6z": {
              "as": "arg1",
              "from": "5oh2s6z",
              "to": "n8ppok6"
            },
            "6qgqv3l": {
              "as": "speed",
              "from": "6qgqv3l",
              "to": "hbkg26p"
            },
            "6rtxmde": {
              "as": "args",
              "from": "6rtxmde",
              "to": "l0hqlvw"
            },
            "70h3dpo": {
              "as": "100%",
              "from": "70h3dpo",
              "to": "tr1yujc"
            },
            "7hx0d36": {
              "as": "arg3",
              "from": "7hx0d36",
              "to": "sa34rk4"
            },
            "7jjupav": {
              "as": "fn",
              "from": "7jjupav",
              "to": "7hx0d36"
            },
            "7m5r1ix": {
              "as": "arg1",
              "from": "7m5r1ix",
              "to": "vnxyyu1"
            },
            "7zogdg5": {
              "as": "beatramp",
              "from": "7zogdg5",
              "to": "1qcwz4u"
            },
            "804ufg4": {
              "as": "id",
              "from": "804ufg4",
              "to": "i4hvk0h"
            },
            "8dy573e": {
              "as": "display",
              "from": "8dy573e",
              "to": "out"
            },
            "8gtm109": {
              "as": "arg3",
              "from": "8gtm109",
              "to": "hbo5tmq"
            },
            "8ywgts7": {
              "as": "time",
              "from": "8ywgts7",
              "to": "args"
            },
            "9fogdzn": {
              "as": "children",
              "from": "9fogdzn",
              "to": "qgbinm2"
            },
            "9ikgefi": {
              "as": "abstime",
              "from": "9ikgefi",
              "to": "args"
            },
            "9vqinsg": {
              "as": "style",
              "from": "9vqinsg",
              "to": "ehximpo"
            },
            "a14g4yc": {
              "as": "fn",
              "from": "a14g4yc",
              "to": "n2a984s"
            },
            "args": {
              "as": "args",
              "from": "args",
              "to": "out"
            },
            "b4nhbtt": {
              "as": "background-color",
              "from": "b4nhbtt",
              "to": "70h3dpo"
            },
            "bftgd51": {
              "as": "args",
              "from": "bftgd51",
              "to": "7hx0d36"
            },
            "bqz7j3e": {
              "as": "value",
              "from": "bqz7j3e",
              "to": "1qcwz4u"
            },
            "byap9s1": {
              "as": "value",
              "from": "byap9s1",
              "to": "lozphpd"
            },
            "cnsnetw": {
              "as": "beatramp",
              "from": "cnsnetw",
              "to": "args"
            },
            "cubknyo": {
              "as": "otherwise",
              "from": "cubknyo",
              "to": "ekjdg2h"
            },
            "cx9aa91": {
              "as": "taptime",
              "from": "cx9aa91",
              "to": "args"
            },
            "d21woh4": {
              "as": "publish",
              "from": "d21woh4",
              "to": "kdsdigz"
            },
            "d3crr2f": {
              "as": "arg1",
              "from": "d3crr2f",
              "to": "sa34rk4"
            },
            "dcz42hs": {
              "as": "width",
              "from": "dcz42hs",
              "to": "v1az6xg"
            },
            "dvvevhq": {
              "as": "value",
              "from": "dvvevhq",
              "to": "out"
            },
            "dw8xjx3": {
              "as": "abstime",
              "from": "dw8xjx3",
              "to": "hbkg26p"
            },
            "e1t6r15": {
              "as": "animation-name",
              "from": "e1t6r15",
              "to": "lnpoih5"
            },
            "ecro2kn": {
              "as": "fn",
              "from": "ecro2kn",
              "to": "gov7mj3"
            },
            "eemfhib": {
              "as": "value",
              "from": "eemfhib",
              "to": "8dy573e"
            },
            "eh8vkbv": {
              "as": "css_object",
              "from": "eh8vkbv",
              "to": "getkche"
            },
            "ehximpo": {
              "as": "props",
              "from": "ehximpo",
              "to": "qgbinm2"
            },
            "ekjdg2h": {
              "as": "time",
              "from": "ekjdg2h",
              "to": "1zhv7p5"
            },
            "fh7zimm": {
              "as": "time",
              "from": "fh7zimm",
              "to": "4dgggsq"
            },
            "g19y12v": {
              "as": "value",
              "from": "g19y12v",
              "to": "s1g8j99"
            },
            "g8c1ctx": {
              "as": "value",
              "from": "g8c1ctx",
              "to": "bftgd51"
            },
            "getkche": {
              "as": "arg4",
              "from": "getkche",
              "to": "hbo5tmq"
            },
            "ghdbxof": {
              "as": "arg4",
              "from": "ghdbxof",
              "to": "vnxyyu1"
            },
            "gov7mj3": {
              "as": "arg0",
              "from": "gov7mj3",
              "to": "n8ppok6"
            },
            "gz1klgh": {
              "as": "bpm",
              "from": "gz1klgh",
              "to": "dvvevhq"
            },
            "hbkg26p": {
              "as": "value",
              "from": "hbkg26p",
              "to": "6rtxmde"
            },
            "hbo5tmq": {
              "as": "children",
              "from": "hbo5tmq",
              "to": "8dy573e"
            },
            "hhtc498": {
              "as": "args",
              "from": "hhtc498",
              "to": "wyuwdl4"
            },
            "i38qweq": {
              "as": "userSelect",
              "from": "i38qweq",
              "to": "9vqinsg"
            },
            "i4hvk0h": {
              "as": "props",
              "from": "i4hvk0h",
              "to": "8gtm109"
            },
            "j2hh8em": {
              "as": "text",
              "from": "j2hh8em",
              "to": "lgx7u5i"
            },
            "kdsdigz": {
              "as": "deltas",
              "from": "kdsdigz",
              "to": "args"
            },
            "kf98qgd": {
              "as": "arg1",
              "from": "kf98qgd",
              "to": "si0nmli"
            },
            "khnbkwz": {
              "as": "abstime",
              "from": "khnbkwz",
              "to": "g8c1ctx"
            },
            "khukm2f": {
              "as": "arg1",
              "from": "khukm2f",
              "to": "hbo5tmq"
            },
            "kogmro5": {
              "as": "bpm",
              "from": "kogmro5",
              "to": "oy88wxs"
            },
            "l07y6lz": {
              "as": "background-color",
              "from": "l07y6lz",
              "to": "wds5v52"
            },
            "l0hqlvw": {
              "as": "arg3",
              "from": "l0hqlvw",
              "to": "vnxyyu1"
            },
            "l1zpo0i": {
              "as": "otherwise",
              "from": "l1zpo0i",
              "to": "s1g8j99"
            },
            "l5h156b": {
              "as": "args",
              "from": "l5h156b",
              "to": "ghdbxof"
            },
            "lex0hr5": {
              "as": "fn",
              "from": "lex0hr5",
              "to": "l0hqlvw"
            },
            "lgx7u5i": {
              "as": "arg2",
              "from": "lgx7u5i",
              "to": "hbo5tmq"
            },
            "lkpcx2e": {
              "as": "taptime",
              "from": "lkpcx2e",
              "to": "4dgggsq"
            },
            "lm86y5w": {
              "as": "subscribe",
              "from": "lm86y5w",
              "to": "out"
            },
            "lnpoih5": {
              "as": ".tapbeatbackground",
              "from": "lnpoih5",
              "to": "eh8vkbv"
            },
            "lozphpd": {
              "as": "parameters",
              "from": "lozphpd",
              "to": "gov7mj3"
            },
            "ls56kix": {
              "as": "bpm",
              "from": "ls56kix",
              "to": "1zhv7p5"
            },
            "mq1crnf": {
              "as": "onpointerdown",
              "from": "mq1crnf",
              "to": "ehximpo"
            },
            "mql26eq": {
              "as": "animation-iteration-count",
              "from": "mql26eq",
              "to": "lnpoih5"
            },
            "n0mauz7": {
              "as": "animation-duration",
              "from": "n0mauz7",
              "to": "lnpoih5"
            },
            "n2a984s": {
              "as": "onpointerup",
              "from": "n2a984s",
              "to": "ehximpo"
            },
            "n8ppok6": {
              "as": "fn",
              "from": "n8ppok6",
              "to": "7m5r1ix"
            },
            "nbvoq40": {
              "as": "animationframe",
              "from": "nbvoq40",
              "to": "lm86y5w"
            },
            "numz8ak": {
              "as": "args",
              "from": "numz8ak",
              "to": "7m5r1ix"
            },
            "nva890x": {
              "as": "arg11",
              "from": "nva890x",
              "to": "sa34rk4"
            },
            "okonci6": {
              "as": "arg0",
              "from": "okonci6",
              "to": "sa34rk4"
            },
            "oy88wxs": {
              "as": "value",
              "from": "oy88wxs",
              "to": "yd11ln1"
            },
            "qgbinm2": {
              "as": "value",
              "from": "qgbinm2",
              "to": "khukm2f"
            },
            "rwe5eea": {
              "as": "args",
              "from": "rwe5eea",
              "to": "khukm2f"
            },
            "s1g8j99": {
              "as": "self",
              "from": "s1g8j99",
              "to": "j2hh8em"
            },
            "sa34rk4": {
              "as": "fn",
              "from": "sa34rk4",
              "to": "mq1crnf"
            },
            "segmfh9": {
              "as": "fn",
              "from": "segmfh9",
              "to": "wyuwdl4"
            },
            "si0nmli": {
              "as": "fn",
              "from": "si0nmli",
              "to": "nva890x"
            },
            "tqboq30": {
              "as": "bpm",
              "from": "tqboq30",
              "to": "n0mauz7"
            },
            "tr1yujc": {
              "as": "@keyframes flash",
              "from": "tr1yujc",
              "to": "eh8vkbv"
            },
            "v1az6xg": {
              "as": "style",
              "from": "v1az6xg",
              "to": "i4hvk0h"
            },
            "vnxyyu1": {
              "as": "fn",
              "from": "vnxyyu1",
              "to": "nbvoq40"
            },
            "vp3ljbr": {
              "as": "time",
              "from": "vp3ljbr",
              "to": "hbkg26p"
            },
            "w4gg9pv": {
              "as": "bpm",
              "from": "w4gg9pv",
              "to": "args"
            },
            "wds5v52": {
              "as": "0%",
              "from": "wds5v52",
              "to": "tr1yujc"
            },
            "wleyt8i": {
              "as": "true",
              "from": "wleyt8i",
              "to": "ecro2kn"
            },
            "wr1y755": {
              "as": "args",
              "from": "wr1y755",
              "to": "5cn0o7r"
            },
            "wrnn8a5": {
              "as": "data",
              "from": "wrnn8a5",
              "to": "201yzow"
            },
            "wt1sz85": {
              "as": "fn",
              "from": "wt1sz85",
              "to": "5cn0o7r"
            },
            "wwj50tb": {
              "as": "deltas",
              "from": "wwj50tb",
              "to": "oy88wxs"
            },
            "wyuwdl4": {
              "as": "fn",
              "from": "wyuwdl4",
              "to": "sa34rk4"
            },
            "x2il2a2": {
              "as": "beatramp",
              "from": "x2il2a2",
              "to": "dvvevhq"
            },
            "x9hdd1h": {
              "as": "beatramp",
              "from": "x9hdd1h",
              "to": "wr1y755"
            },
            "ya1q4pd": {
              "as": "fn",
              "from": "ya1q4pd",
              "to": "ghdbxof"
            },
            "yd11ln1": {
              "as": "args",
              "from": "yd11ln1",
              "to": "nva890x"
            },
            "yxdrqfc": {
              "as": "arg0",
              "from": "yxdrqfc",
              "to": "si0nmli"
            }
          },
          "id": "@audio.tapbeat",
          "name": "@audio.tapbeat",
          "nodes": {
            "07e1bfn": {
              "id": "07e1bfn",
              "value": "2"
            },
            "113q4li": {
              "id": "113q4li",
              "ref": "arg",
              "value": "deltas.state"
            },
            "13e4el1": {
              "id": "13e4el1",
              "value": "20px"
            },
            "1484wjz": {
              "id": "1484wjz",
              "ref": "arg",
              "value": "time.value"
            },
            "151za0r": {
              "id": "151za0r",
              "ref": "arg",
              "value": "speed"
            },
            "1fuixnh": {
              "id": "1fuixnh",
              "ref": "@event.publish_event",
              "value": "tapbeatbeat"
            },
            "1qcwz4u": {
              "id": "1qcwz4u",
              "ref": "@js.script",
              "value": "return beatramp.value >= value"
            },
            "1t3aqnb": {
              "id": "1t3aqnb",
              "ref": "@event.publish_event",
              "value": "tapbeatbpmchange"
            },
            "1zhv7p5": {
              "id": "1zhv7p5",
              "ref": "@js.script",
              "value": "const mspb = 60000 / (bpm ?? 120);\nconst dt = performance.now() - (time ?? 0);\nreturn (time % mspb) / mspb"
            },
            "201yzow": {
              "id": "201yzow"
            },
            "33dadts": {
              "id": "33dadts",
              "ref": "@js.script",
              "value": "return performance.now()"
            },
            "3bf8axp": {
              "id": "3bf8axp",
              "value": "true"
            },
            "3y9h7wd": {
              "id": "3y9h7wd",
              "value": "true"
            },
            "4113r3s": {
              "id": "4113r3s",
              "value": "true"
            },
            "47b969g": {
              "id": "47b969g",
              "ref": "arg",
              "value": "value"
            },
            "4dgggsq": {
              "id": "4dgggsq",
              "ref": "@js.script",
              "value": "const delta = time - taptime;\nreturn delta > 2000 || isNaN(delta) ? (deltas ?? []) : deltas && Array.isArray(deltas) ? (deltas.length >= 4 && deltas.shift(), deltas.push(delta), deltas) : time ? [delta] : 0"
            },
            "4j7h0bp": {
              "id": "4j7h0bp",
              "ref": "@js.script",
              "value": 'const el = document.getElementById("tapbeatdisplay"); \nconst newel = el.cloneNode();\nel.parentNode.replaceChild(newel, el);'
            },
            "4q5sykk": {
              "id": "4q5sykk",
              "value": "tapbeatbackground"
            },
            "5cn0o7r": {
              "id": "5cn0o7r",
              "ref": "@flow.ap"
            },
            "5oh2s6z": {
              "id": "5oh2s6z",
              "ref": "arg",
              "value": "beatramp.set"
            },
            "6qgqv3l": {
              "id": "6qgqv3l",
              "ref": "@js.script",
              "value": "return Math.pow(2, isNaN(value) ? 0 : Math.floor(value));"
            },
            "6rtxmde": {
              "id": "6rtxmde"
            },
            "70h3dpo": {
              "id": "70h3dpo"
            },
            "7hx0d36": {
              "id": "7hx0d36",
              "ref": "@flow.ap"
            },
            "7jjupav": {
              "id": "7jjupav",
              "ref": "arg",
              "value": "taptime.set"
            },
            "7m5r1ix": {
              "id": "7m5r1ix",
              "ref": "@flow.ap"
            },
            "7zogdg5": {
              "id": "7zogdg5",
              "ref": "arg",
              "value": "beatramp"
            },
            "804ufg4": {
              "id": "804ufg4",
              "value": "tapbeatdisplay"
            },
            "8dy573e": {
              "id": "8dy573e",
              "ref": "@html.html_element"
            },
            "8gtm109": {
              "id": "8gtm109",
              "ref": "@html.html_element"
            },
            "8hy2e88": {
              "id": "8hy2e88"
            },
            "8ywgts7": {
              "id": "8ywgts7",
              "ref": "@memory.refval"
            },
            "9fogdzn": {
              "id": "9fogdzn",
              "ref": "@html.html_text",
              "value": "tap"
            },
            "9ikgefi": {
              "id": "9ikgefi",
              "ref": "@memory.refval"
            },
            "9vqinsg": {
              "id": "9vqinsg"
            },
            "a14g4yc": {
              "id": "a14g4yc",
              "ref": "arg",
              "value": "ontap"
            },
            "args": {
              "id": "args"
            },
            "b4nhbtt": {
              "id": "b4nhbtt",
              "value": "#ffffff"
            },
            "bftgd51": {
              "id": "bftgd51"
            },
            "bqz7j3e": {
              "id": "bqz7j3e",
              "ref": "arg",
              "value": "value"
            },
            "byap9s1": {
              "id": "byap9s1"
            },
            "cnsnetw": {
              "id": "cnsnetw",
              "ref": "@memory.refval"
            },
            "cubknyo": {
              "id": "cubknyo",
              "ref": "arg",
              "value": "abstime.value"
            },
            "cx9aa91": {
              "id": "cx9aa91",
              "ref": "@memory.state"
            },
            "d21woh4": {
              "id": "d21woh4",
              "value": "true"
            },
            "d3crr2f": {
              "id": "d3crr2f",
              "ref": "@flow.runnable"
            },
            "dcz42hs": {
              "id": "dcz42hs",
              "value": "20px"
            },
            "dvvevhq": {
              "id": "dvvevhq"
            },
            "dw8xjx3": {
              "id": "dw8xjx3",
              "ref": "arg",
              "value": "abstime.value"
            },
            "e1t6r15": {
              "id": "e1t6r15",
              "value": "flash"
            },
            "ecro2kn": {
              "id": "ecro2kn",
              "ref": "@flow.if"
            },
            "eemfhib": {
              "id": "eemfhib",
              "ref": "arg",
              "value": "bpm.state"
            },
            "eh8vkbv": {
              "id": "eh8vkbv"
            },
            "ehximpo": {
              "id": "ehximpo"
            },
            "ekjdg2h": {
              "id": "ekjdg2h",
              "ref": "@flow.default"
            },
            "fh7zimm": {
              "id": "fh7zimm",
              "ref": "arg",
              "value": "abstime.value"
            },
            "g19y12v": {
              "id": "g19y12v",
              "ref": "arg",
              "value": "bpm.state"
            },
            "g8c1ctx": {
              "id": "g8c1ctx",
              "ref": "@js.script",
              "value": "return abstime ?? 0"
            },
            "getkche": {
              "id": "getkche",
              "ref": "@html.css_styles"
            },
            "ghdbxof": {
              "id": "ghdbxof",
              "ref": "@flow.ap"
            },
            "gov7mj3": {
              "id": "gov7mj3",
              "ref": "@flow.runnable"
            },
            "gz1klgh": {
              "id": "gz1klgh",
              "ref": "arg",
              "value": "bpm"
            },
            "hbkg26p": {
              "id": "hbkg26p",
              "ref": "@js.script",
              "value": "return (performance.now() - (abstime ?? 0)) * speed + (time ?? 0)"
            },
            "hbo5tmq": {
              "id": "hbo5tmq",
              "ref": "@data.array"
            },
            "hhtc498": {
              "id": "hhtc498"
            },
            "i38qweq": {
              "id": "i38qweq",
              "value": "none"
            },
            "i4hvk0h": {
              "id": "i4hvk0h"
            },
            "j2hh8em": {
              "id": "j2hh8em",
              "ref": "@js.script",
              "value": "return self.toFixed(2)"
            },
            "kdsdigz": {
              "id": "kdsdigz",
              "ref": "@memory.state"
            },
            "kf98qgd": {
              "id": "kf98qgd",
              "ref": "@flow.ap"
            },
            "khnbkwz": {
              "id": "khnbkwz",
              "ref": "arg",
              "value": "abstime.value"
            },
            "khukm2f": {
              "id": "khukm2f",
              "ref": "return"
            },
            "kogmro5": {
              "id": "kogmro5",
              "ref": "arg",
              "value": "bpm.state"
            },
            "l07y6lz": {
              "id": "l07y6lz",
              "value": "#000000"
            },
            "l0hqlvw": {
              "id": "l0hqlvw",
              "ref": "@flow.ap"
            },
            "l1zpo0i": {
              "id": "l1zpo0i",
              "value": "120"
            },
            "l5h156b": {
              "id": "l5h156b"
            },
            "lex0hr5": {
              "id": "lex0hr5",
              "ref": "arg",
              "value": "time.set"
            },
            "lgx7u5i": {
              "id": "lgx7u5i",
              "ref": "@html.html_text"
            },
            "lkpcx2e": {
              "id": "lkpcx2e",
              "ref": "arg",
              "value": "taptime.state"
            },
            "lm86y5w": {
              "id": "lm86y5w"
            },
            "lnpoih5": {
              "id": "lnpoih5"
            },
            "lozphpd": {
              "id": "lozphpd"
            },
            "ls56kix": {
              "id": "ls56kix",
              "ref": "arg",
              "value": "bpm.state"
            },
            "mq1crnf": {
              "id": "mq1crnf",
              "ref": "@flow.ap"
            },
            "mql26eq": {
              "id": "mql26eq",
              "value": "infinite"
            },
            "n0mauz7": {
              "id": "n0mauz7",
              "ref": "@js.script",
              "value": "return `${60/(isNaN(bpm)? 60 : bpm)}s`"
            },
            "n2a984s": {
              "id": "n2a984s",
              "ref": "@flow.ap"
            },
            "n8ppok6": {
              "id": "n8ppok6",
              "ref": "@data.array"
            },
            "nbvoq40": {
              "id": "nbvoq40",
              "ref": "@flow.ap"
            },
            "numz8ak": {
              "id": "numz8ak"
            },
            "nva890x": {
              "id": "nva890x",
              "ref": "@flow.ap"
            },
            "okonci6": {
              "id": "okonci6",
              "ref": "@event.publish_event",
              "value": "tapbeattap"
            },
            "out": {
              "id": "out",
              "name": "@audio.tapbeat",
              "ref": "return"
            },
            "oy88wxs": {
              "id": "oy88wxs",
              "ref": "@js.script",
              "value": "return Array.isArray(deltas) ? 60000 * deltas.length / deltas.reduce((a, b) => a + b, 0) : 120;"
            },
            "qgbinm2": {
              "id": "qgbinm2",
              "ref": "@html.html_element",
              "value": "button"
            },
            "rwe5eea": {
              "id": "rwe5eea"
            },
            "s1g8j99": {
              "id": "s1g8j99",
              "ref": "@flow.default"
            },
            "sa34rk4": {
              "id": "sa34rk4",
              "ref": "@data.array"
            },
            "segmfh9": {
              "id": "segmfh9",
              "ref": "arg",
              "value": "deltas.set"
            },
            "si0nmli": {
              "id": "si0nmli",
              "ref": "@data.array"
            },
            "tqboq30": {
              "id": "tqboq30",
              "ref": "arg",
              "value": "bpm.state"
            },
            "tr1yujc": {
              "id": "tr1yujc"
            },
            "v1az6xg": {
              "id": "v1az6xg"
            },
            "vnxyyu1": {
              "id": "vnxyyu1",
              "ref": "@data.array"
            },
            "vp3ljbr": {
              "id": "vp3ljbr",
              "ref": "arg",
              "value": "time.value"
            },
            "w4gg9pv": {
              "id": "w4gg9pv",
              "ref": "@memory.state"
            },
            "wds5v52": {
              "id": "wds5v52"
            },
            "wleyt8i": {
              "id": "wleyt8i",
              "ref": "@flow.ap"
            },
            "wr1y755": {
              "id": "wr1y755"
            },
            "wrnn8a5": {
              "id": "wrnn8a5"
            },
            "wt1sz85": {
              "id": "wt1sz85",
              "ref": "arg",
              "value": "onframe"
            },
            "wwj50tb": {
              "id": "wwj50tb",
              "ref": "arg",
              "value": "deltas.state"
            },
            "wyuwdl4": {
              "id": "wyuwdl4",
              "ref": "@flow.ap"
            },
            "x2il2a2": {
              "id": "x2il2a2",
              "ref": "arg",
              "value": "beatramp"
            },
            "x9hdd1h": {
              "id": "x9hdd1h",
              "ref": "arg",
              "value": "beatramp.value"
            },
            "ya1q4pd": {
              "id": "ya1q4pd",
              "ref": "arg",
              "value": "abstime.set"
            },
            "yd11ln1": {
              "id": "yd11ln1"
            },
            "yxdrqfc": {
              "id": "yxdrqfc",
              "ref": "arg",
              "value": "bpm.set"
            }
          },
          "out": "out",
          "category": "templates"
        },
        "@audio.analysis": {
          "id": "@audio.analysis",
          "out": "out",
          "nodes": {
            "fhzn9j7": {
              "id": "fhzn9j7",
              "value": "return arr;",
              "ref": "@js.script"
            },
            "args": {
              "id": "args"
            },
            "qgbinm2": {
              "id": "qgbinm2",
              "value": "rect",
              "ref": "@html.html_element"
            },
            "8dy573e": {
              "id": "8dy573e",
              "ref": "@html.html_element"
            },
            "output_val": {},
            "out": {
              "id": "out",
              "name": "@audio.analysis",
              "ref": "return"
            },
            "jwib1ka": {
              "id": "jwib1ka"
            },
            "hcp14pq": {
              "id": "hcp14pq",
              "ref": "@flow.default"
            },
            "avhgm5q": {
              "id": "avhgm5q",
              "value": "1024"
            },
            "56bla57": {
              "id": "56bla57",
              "value": "fftSize",
              "ref": "arg"
            },
            "sd1ge10": {
              "id": "sd1ge10",
              "ref": "@flow.default"
            },
            "j7nk0p6": {
              "id": "j7nk0p6",
              "value": "smoothingTimeConstant",
              "ref": "arg"
            },
            "3mj0ula": {
              "id": "3mj0ula",
              "value": "0.25"
            },
            "f9t73iw": {
              "id": "f9t73iw",
              "ref": "@flow.if"
            },
            "hvkhebd": {
              "id": "hvkhebd",
              "value": "const analyser = new AnalyserNode(audio.context, options);\nconsole.log(options);\naudio.source.connect(analyser)\nreturn {  ...audio,  analyser}",
              "ref": "@js.script"
            },
            "yi2ezh0": {
              "id": "yi2ezh0",
              "value": "return {\n  context: audioCtx,\n  source: audioCtx.createMediaStreamSource(media)\n}",
              "ref": "@js.script"
            },
            "z6cwmqm": {
              "id": "z6cwmqm",
              "value": "return navigator.mediaDevices\n    .getUserMedia({ audio: true })",
              "ref": "@js.script"
            },
            "kcvpnbr": {
              "id": "kcvpnbr",
              "ref": "@memory.refval"
            },
            "ky27m6w": {
              "id": "ky27m6w"
            },
            "cjn10vv": {
              "id": "cjn10vv",
              "value": "self.getFloatFrequencyData(array);\nreturn array",
              "ref": "@js.script"
            },
            "8b808yt": {
              "id": "8b808yt",
              "value": "_audio.analyser",
              "ref": "arg"
            },
            "ntdapts": {
              "id": "ntdapts"
            },
            "i0ncdhp": {
              "id": "i0ncdhp",
              "value": "svg",
              "ref": "@html.html_element"
            },
            "202qikg": {
              "id": "202qikg",
              "value": "_audio.context.state",
              "ref": "arg"
            },
            "itqudjx": {
              "id": "itqudjx",
              "value": "button",
              "ref": "@html.html_element"
            },
            "n12sjrc": {
              "id": "n12sjrc",
              "value": 'return value !== "suspended"',
              "ref": "@js.script"
            },
            "lr9v8rm": {
              "id": "lr9v8rm",
              "ref": "@memory.cache"
            },
            "nnembhj": {
              "id": "nnembhj",
              "value": "AudioContext",
              "ref": "@js.new"
            },
            "xfpzaer": {
              "id": "xfpzaer",
              "ref": "@memory.cache"
            },
            "32keuwb": {
              "id": "32keuwb",
              "value": "listen",
              "ref": "@html.html_text"
            },
            "58h53vb": {
              "id": "58h53vb"
            },
            "7d5e83b": {
              "id": "7d5e83b",
              "value": "white"
            },
            "0omg02e": {
              "id": "0omg02e"
            },
            "tfv9ab6": {
              "id": "tfv9ab6",
              "value": "_audio.context",
              "ref": "arg"
            },
            "tjau54y": {
              "id": "tjau54y",
              "ref": "@flow.runnable"
            },
            "z5v6iv9": {
              "id": "z5v6iv9",
              "value": "resume",
              "ref": "@js.call"
            },
            "k2n6i8q": {
              "id": "k2n6i8q",
              "ref": "@data.map"
            },
            "hkbnt7q": {
              "id": "hkbnt7q",
              "value": "_fft.value",
              "ref": "arg"
            },
            "9pd2wms": {
              "id": "9pd2wms",
              "ref": "@flow.runnable"
            },
            "4ng68ah": {
              "id": "4ng68ah"
            },
            "bpcb53a": {
              "id": "bpcb53a"
            },
            "crz99st": {
              "id": "crz99st",
              "value": "return 100 / arg0",
              "ref": "@js.script"
            },
            "lokbjgu": {
              "id": "lokbjgu",
              "value": "_waveform.value.length",
              "ref": "arg"
            },
            "5clo4vh": {
              "id": "5clo4vh"
            },
            "rbqic4e": {
              "id": "rbqic4e",
              "value": "return isNaN(arg0) ? 1 : Math.min(64, Math.max(1, arg0)); ",
              "ref": "@js.script"
            },
            "bydhgr0": {
              "id": "bydhgr0",
              "value": "_audio",
              "ref": "arg"
            },
            "v7zp3ck": {
              "id": "v7zp3ck",
              "ref": "@memory.refval"
            },
            "2nk866r": {
              "id": "2nk866r",
              "value": "_waveform",
              "ref": "arg"
            },
            "t4klpg0": {
              "id": "t4klpg0",
              "ref": "@flow.ap"
            },
            "xgav7gf": {
              "id": "xgav7gf",
              "ref": "@data.array"
            },
            "yzm2544": {
              "id": "yzm2544",
              "ref": "@flow.ap"
            },
            "boajzer": {
              "id": "boajzer",
              "value": "_waveform.set",
              "ref": "arg"
            },
            "fw4v0e8": {
              "id": "fw4v0e8"
            },
            "enwnlrg": {
              "id": "enwnlrg",
              "value": "self.getFloatTimeDomainData(array);\nreturn array;",
              "ref": "@js.script"
            },
            "3cn9gm5": {
              "id": "3cn9gm5",
              "value": "_waveform.value",
              "ref": "arg"
            },
            "k81ohi2": {
              "id": "k81ohi2",
              "value": "_audio.analyser",
              "ref": "arg"
            },
            "kce6b36": {
              "id": "kce6b36",
              "ref": "@flow.runnable"
            },
            "3bzpqfw": {
              "id": "3bzpqfw",
              "value": 'const el = document.getElementById("audio-listener");\nconst center = true;\nif(el?.children){\n  let val;\n  for(let i = 0; i < el.children.length; i++) {\n    val = fft.value[i];\n    const height = Math.round(Math.max(0, Math.min(200, (val * 100))));\n    el.children.item(i)\n      .setAttribute("height", `${height}px`);\n    center ? el.children.item(i)\n      .setAttribute("y", `${100 - height * 0.5}px`) : el.children.item(i)\n      .setAttribute("y", `${0}px`);\n    //el.children.item(i).setAttribute("height", `${Math.round(Math.max(0, Math.min(200, (val + 90) * 2)))}px`);\n  }\n}',
              "ref": "@js.script"
            },
            "7re12iu": {
              "id": "7re12iu",
              "value": "_waveform",
              "ref": "arg"
            },
            "9asxtzl": {
              "id": "9asxtzl"
            },
            "or2do3i": {
              "id": "or2do3i",
              "value": "audio-listener"
            },
            "d2m13om": {
              "id": "d2m13om",
              "value": "index",
              "ref": "arg"
            },
            "5mrw162": {
              "id": "5mrw162",
              "ref": "@math.mult"
            },
            "152zzg7": {
              "id": "152zzg7",
              "value": "return 100 / arg0",
              "ref": "@js.script"
            },
            "9y1uozt": {
              "id": "9y1uozt",
              "value": "return isNaN(arg0) ? 1 : Math.max(1, arg0); ",
              "ref": "@js.script"
            },
            "lhm1ktw": {
              "id": "lhm1ktw",
              "value": "_waveform.value.length",
              "ref": "arg"
            },
            "k780ign": {
              "id": "k780ign",
              "value": "_fft.value",
              "ref": "arg"
            },
            "jbgkmd0": {
              "id": "jbgkmd0",
              "ref": "@flow.runnable"
            },
            "6isum4q": {
              "id": "6isum4q",
              "ref": "@memory.refval"
            },
            "8y1pfs1": {
              "id": "8y1pfs1",
              "value": "_fft",
              "ref": "arg"
            },
            "885ujhf": {
              "id": "885ujhf",
              "value": "return new Float32Array(fftSize)",
              "ref": "@js.script"
            },
            "1rszkgx": {
              "id": "1rszkgx",
              "ref": "@flow.if"
            },
            "38hmav3": {
              "id": "38hmav3",
              "value": "fftSize",
              "ref": "arg"
            },
            "mqnh6xj": {
              "id": "mqnh6xj",
              "ref": "@math.mult"
            },
            "iok3jbv": {
              "id": "iok3jbv",
              "value": "0.5"
            },
            "8r9yvc2": {
              "id": "8r9yvc2",
              "value": "fftSize",
              "ref": "arg"
            },
            "xetlgtj": {
              "id": "xetlgtj",
              "value": "128"
            },
            "l59vzq3": {
              "id": "l59vzq3",
              "ref": "@flow.ap"
            },
            "7zifjds": {
              "id": "7zifjds",
              "value": "onframe",
              "ref": "arg"
            },
            "ewwqt0v": {
              "id": "ewwqt0v"
            },
            "xwql547": {
              "id": "xwql547",
              "value": "_loudness",
              "ref": "arg"
            },
            "ld6qjwd": {
              "id": "ld6qjwd",
              "value": "_fft",
              "ref": "arg"
            },
            "1ot7z1u": {
              "id": "1ot7z1u",
              "value": "_waveform",
              "ref": "arg"
            },
            "tqn91t0": {
              "id": "tqn91t0",
              "value": "_audio",
              "ref": "arg"
            },
            "seubbfl": {
              "id": "seubbfl",
              "value": "_loudness",
              "ref": "arg"
            },
            "vcji2y3": {
              "id": "vcji2y3",
              "ref": "@flow.ap"
            },
            "y2eutqi": {
              "id": "y2eutqi"
            },
            "sm6i8iw": {
              "id": "sm6i8iw",
              "value": "_loudness.set",
              "ref": "arg"
            },
            "pioqk5q": {
              "id": "pioqk5q",
              "value": "_waveform.value",
              "ref": "arg"
            },
            "o9owpg5": {
              "id": "o9owpg5",
              "value": "return Math.sqrt(arr.reduce((a, v) => a + v * v, 0), arr.length)",
              "ref": "@js.script"
            },
            "u9t3cmw": {
              "id": "u9t3cmw",
              "value": "return new Float32Array(fftSize)",
              "ref": "@js.script"
            },
            "hkaby14": {
              "id": "hkaby14",
              "ref": "@flow.if"
            },
            "bpdeixu": {
              "id": "bpdeixu",
              "value": "fftSize",
              "ref": "arg"
            },
            "iinolva": {
              "id": "iinolva",
              "value": "fftSize",
              "ref": "arg"
            },
            "0wjbxex": {
              "id": "0wjbxex",
              "value": "1024"
            },
            "6g2x5co": {
              "id": "6g2x5co"
            },
            "iqxfxoq": {
              "id": "iqxfxoq",
              "value": "_loudness",
              "ref": "arg"
            },
            "yhuwqe9": {
              "id": "yhuwqe9",
              "value": "_fft",
              "ref": "arg"
            },
            "m7aljc9": {
              "id": "m7aljc9",
              "value": "_waveform",
              "ref": "arg"
            },
            "q72zw9n": {
              "id": "q72zw9n",
              "value": "_audio",
              "ref": "arg"
            },
            "j5hnwiu": {
              "id": "j5hnwiu",
              "ref": "@flow.if"
            },
            "yleo130": {
              "id": "yleo130",
              "value": "onframe",
              "ref": "arg"
            },
            "u781r0g": {
              "id": "u781r0g",
              "value": "true"
            }
          },
          "edges": {
            "fhzn9j7": {
              "from": "fhzn9j7",
              "to": "k2n6i8q",
              "as": "array"
            },
            "jwib1ka": {
              "from": "jwib1ka",
              "to": "hvkhebd",
              "as": "options"
            },
            "hcp14pq": {
              "from": "hcp14pq",
              "to": "jwib1ka",
              "as": "fftSize"
            },
            "avhgm5q": {
              "from": "avhgm5q",
              "to": "hcp14pq",
              "as": "otherwise"
            },
            "56bla57": {
              "from": "56bla57",
              "to": "hcp14pq",
              "as": "value"
            },
            "sd1ge10": {
              "from": "sd1ge10",
              "to": "jwib1ka",
              "as": "smoothingTimeConstant"
            },
            "j7nk0p6": {
              "from": "j7nk0p6",
              "to": "sd1ge10",
              "as": "value"
            },
            "3mj0ula": {
              "from": "3mj0ula",
              "to": "sd1ge10",
              "as": "otherwise"
            },
            "f9t73iw": {
              "from": "f9t73iw",
              "to": "8dy573e",
              "as": "children"
            },
            "qgbinm2": {
              "from": "qgbinm2",
              "to": "9pd2wms",
              "as": "fn"
            },
            "8dy573e": {
              "from": "8dy573e",
              "to": "out",
              "as": "display"
            },
            "args": {
              "from": "args",
              "to": "out",
              "as": "args"
            },
            "hvkhebd": {
              "from": "hvkhebd",
              "to": "xfpzaer",
              "as": "value"
            },
            "yi2ezh0": {
              "from": "yi2ezh0",
              "to": "hvkhebd",
              "as": "audio"
            },
            "z6cwmqm": {
              "from": "z6cwmqm",
              "to": "yi2ezh0",
              "as": "media"
            },
            "kcvpnbr": {
              "from": "kcvpnbr",
              "to": "args",
              "as": "_fft"
            },
            "cjn10vv": {
              "from": "cjn10vv",
              "to": "jbgkmd0",
              "as": "fn"
            },
            "8b808yt": {
              "from": "8b808yt",
              "to": "cjn10vv",
              "as": "self"
            },
            "ky27m6w": {
              "from": "ky27m6w",
              "to": "out",
              "as": "subscribe"
            },
            "ntdapts": {
              "from": "ntdapts",
              "to": "qgbinm2",
              "as": "props"
            },
            "i0ncdhp": {
              "from": "i0ncdhp",
              "to": "f9t73iw",
              "as": "true"
            },
            "202qikg": {
              "from": "202qikg",
              "to": "n12sjrc",
              "as": "value"
            },
            "itqudjx": {
              "from": "itqudjx",
              "to": "f9t73iw",
              "as": "false"
            },
            "n12sjrc": {
              "from": "n12sjrc",
              "to": "f9t73iw",
              "as": "pred"
            },
            "nnembhj": {
              "from": "nnembhj",
              "to": "lr9v8rm",
              "as": "value"
            },
            "lr9v8rm": {
              "from": "lr9v8rm",
              "to": "yi2ezh0",
              "as": "audioCtx"
            },
            "xfpzaer": {
              "from": "xfpzaer",
              "to": "args",
              "as": "_audio"
            },
            "32keuwb": {
              "from": "32keuwb",
              "to": "itqudjx",
              "as": "children"
            },
            "7d5e83b": {
              "from": "7d5e83b",
              "to": "ntdapts",
              "as": "fill"
            },
            "58h53vb": {
              "from": "58h53vb",
              "to": "out",
              "as": "value"
            },
            "0omg02e": {
              "from": "0omg02e",
              "to": "itqudjx",
              "as": "props"
            },
            "tfv9ab6": {
              "from": "tfv9ab6",
              "to": "z5v6iv9",
              "as": "self"
            },
            "tjau54y": {
              "from": "tjau54y",
              "to": "0omg02e",
              "as": "onclick"
            },
            "z5v6iv9": {
              "from": "z5v6iv9",
              "to": "tjau54y",
              "as": "fn"
            },
            "k2n6i8q": {
              "from": "k2n6i8q",
              "to": "i0ncdhp",
              "as": "children"
            },
            "hkbnt7q": {
              "from": "hkbnt7q",
              "to": "fhzn9j7",
              "as": "arr"
            },
            "9pd2wms": {
              "from": "9pd2wms",
              "to": "k2n6i8q",
              "as": "fn"
            },
            "4ng68ah": {
              "from": "4ng68ah",
              "to": "9pd2wms",
              "as": "parameters"
            },
            "bpcb53a": {
              "from": "bpcb53a",
              "to": "4ng68ah",
              "as": "element"
            },
            "crz99st": {
              "from": "crz99st",
              "to": "ntdapts",
              "as": "width"
            },
            "lokbjgu": {
              "from": "lokbjgu",
              "to": "rbqic4e",
              "as": "arg0"
            },
            "5clo4vh": {
              "from": "5clo4vh",
              "to": "4ng68ah",
              "as": "index"
            },
            "rbqic4e": {
              "from": "rbqic4e",
              "to": "crz99st",
              "as": "arg0"
            },
            "bydhgr0": {
              "from": "bydhgr0",
              "to": "58h53vb",
              "as": "audio"
            },
            "v7zp3ck": {
              "from": "v7zp3ck",
              "to": "args",
              "as": "_waveform"
            },
            "2nk866r": {
              "from": "2nk866r",
              "to": "58h53vb",
              "as": "waveform"
            },
            "t4klpg0": {
              "from": "t4klpg0",
              "to": "ky27m6w",
              "as": "animationframe"
            },
            "xgav7gf": {
              "from": "xgav7gf",
              "to": "t4klpg0",
              "as": "fn"
            },
            "yzm2544": {
              "from": "yzm2544",
              "to": "xgav7gf",
              "as": "arg1"
            },
            "boajzer": {
              "from": "boajzer",
              "to": "yzm2544",
              "as": "fn"
            },
            "fw4v0e8": {
              "from": "fw4v0e8",
              "to": "yzm2544",
              "as": "args"
            },
            "enwnlrg": {
              "from": "enwnlrg",
              "to": "fw4v0e8",
              "as": "value"
            },
            "3cn9gm5": {
              "from": "3cn9gm5",
              "to": "enwnlrg",
              "as": "array"
            },
            "k81ohi2": {
              "from": "k81ohi2",
              "to": "enwnlrg",
              "as": "self"
            },
            "kce6b36": {
              "from": "kce6b36",
              "to": "xgav7gf",
              "as": "arg2"
            },
            "3bzpqfw": {
              "from": "3bzpqfw",
              "to": "kce6b36",
              "as": "fn"
            },
            "7re12iu": {
              "from": "7re12iu",
              "to": "3bzpqfw",
              "as": "fft"
            },
            "9asxtzl": {
              "from": "9asxtzl",
              "to": "i0ncdhp",
              "as": "props"
            },
            "or2do3i": {
              "from": "or2do3i",
              "to": "9asxtzl",
              "as": "id"
            },
            "d2m13om": {
              "from": "d2m13om",
              "to": "5mrw162",
              "as": "arg0"
            },
            "5mrw162": {
              "from": "5mrw162",
              "to": "ntdapts",
              "as": "x"
            },
            "9y1uozt": {
              "from": "9y1uozt",
              "to": "152zzg7",
              "as": "arg0"
            },
            "lhm1ktw": {
              "from": "lhm1ktw",
              "to": "9y1uozt",
              "as": "arg0"
            },
            "152zzg7": {
              "from": "152zzg7",
              "to": "5mrw162",
              "as": "width"
            },
            "k780ign": {
              "from": "k780ign",
              "to": "cjn10vv",
              "as": "array"
            },
            "jbgkmd0": {
              "from": "jbgkmd0",
              "to": "xgav7gf",
              "as": "arg0"
            },
            "6isum4q": {
              "from": "6isum4q",
              "to": "args",
              "as": "_loudness"
            },
            "8y1pfs1": {
              "from": "8y1pfs1",
              "to": "58h53vb",
              "as": "fft"
            },
            "1rszkgx": {
              "from": "1rszkgx",
              "to": "885ujhf",
              "as": "fftSize"
            },
            "xetlgtj": {
              "from": "xetlgtj",
              "to": "1rszkgx",
              "as": "false"
            },
            "mqnh6xj": {
              "from": "mqnh6xj",
              "to": "1rszkgx",
              "as": "true"
            },
            "38hmav3": {
              "from": "38hmav3",
              "to": "1rszkgx",
              "as": "pred"
            },
            "8r9yvc2": {
              "from": "8r9yvc2",
              "to": "mqnh6xj",
              "as": "arg0"
            },
            "iok3jbv": {
              "from": "iok3jbv",
              "to": "mqnh6xj",
              "as": "arg1"
            },
            "885ujhf": {
              "from": "885ujhf",
              "to": "kcvpnbr",
              "as": "initial"
            },
            "l59vzq3": {
              "from": "l59vzq3",
              "to": "j5hnwiu",
              "as": "true"
            },
            "7zifjds": {
              "from": "7zifjds",
              "to": "l59vzq3",
              "as": "fn"
            },
            "tqn91t0": {
              "from": "tqn91t0",
              "to": "ewwqt0v",
              "as": "audio"
            },
            "1ot7z1u": {
              "from": "1ot7z1u",
              "to": "ewwqt0v",
              "as": "waveform"
            },
            "ld6qjwd": {
              "from": "ld6qjwd",
              "to": "ewwqt0v",
              "as": "fft"
            },
            "xwql547": {
              "from": "xwql547",
              "to": "ewwqt0v",
              "as": "loudness"
            },
            "ewwqt0v": {
              "from": "ewwqt0v",
              "to": "l59vzq3",
              "as": "args"
            },
            "seubbfl": {
              "from": "seubbfl",
              "to": "58h53vb",
              "as": "loudness"
            },
            "vcji2y3": {
              "from": "vcji2y3",
              "to": "xgav7gf",
              "as": "arg3"
            },
            "y2eutqi": {
              "from": "y2eutqi",
              "to": "vcji2y3",
              "as": "args"
            },
            "sm6i8iw": {
              "from": "sm6i8iw",
              "to": "vcji2y3",
              "as": "fn"
            },
            "pioqk5q": {
              "from": "pioqk5q",
              "to": "o9owpg5",
              "as": "arr"
            },
            "o9owpg5": {
              "from": "o9owpg5",
              "to": "y2eutqi",
              "as": "value"
            },
            "hkaby14": {
              "from": "hkaby14",
              "to": "u9t3cmw",
              "as": "fftSize"
            },
            "0wjbxex": {
              "from": "0wjbxex",
              "to": "hkaby14",
              "as": "false"
            },
            "iinolva": {
              "from": "iinolva",
              "to": "hkaby14",
              "as": "pred"
            },
            "bpdeixu": {
              "from": "bpdeixu",
              "to": "hkaby14",
              "as": "true"
            },
            "u9t3cmw": {
              "from": "u9t3cmw",
              "to": "v7zp3ck",
              "as": "initial"
            },
            "q72zw9n": {
              "from": "q72zw9n",
              "to": "6g2x5co",
              "as": "audio"
            },
            "m7aljc9": {
              "from": "m7aljc9",
              "to": "6g2x5co",
              "as": "waveform"
            },
            "yhuwqe9": {
              "from": "yhuwqe9",
              "to": "6g2x5co",
              "as": "fft"
            },
            "iqxfxoq": {
              "from": "iqxfxoq",
              "to": "6g2x5co",
              "as": "loudness"
            },
            "6g2x5co": {
              "from": "6g2x5co",
              "to": "t4klpg0",
              "as": "args"
            },
            "j5hnwiu": {
              "from": "j5hnwiu",
              "to": "xgav7gf",
              "as": "arg4"
            },
            "yleo130": {
              "from": "yleo130",
              "to": "j5hnwiu",
              "as": "pred"
            },
            "u781r0g": {
              "from": "u781r0g",
              "to": "6isum4q",
              "as": "publish"
            }
          }
        },
        "@math.noise": {
          "edges": {
            "18ft0o0": {
              "as": "random",
              "from": "18ft0o0",
              "to": "gna5hrg"
            },
            "1es7qrh": {
              "as": "array",
              "from": "1es7qrh",
              "to": "caxm792"
            },
            "2838i98": {
              "as": "lib",
              "from": "2838i98",
              "to": "qljoa2f"
            },
            "2zfxujb": {
              "as": "dim",
              "from": "2zfxujb",
              "to": "dl8tqbw"
            },
            "3fqdnh3": {
              "as": "dims",
              "from": "3fqdnh3",
              "to": "1es7qrh"
            },
            "4qnsrir": {
              "as": "simplexNoise",
              "from": "4qnsrir",
              "to": "2838i98"
            },
            "5p3hf1e": {
              "as": "false",
              "from": "5p3hf1e",
              "to": "d1mxhrc"
            },
            "5suk5mt": {
              "as": "_random",
              "from": "5suk5mt",
              "to": "l4denbs"
            },
            "76mvyzz": {
              "as": "noiseFn",
              "from": "76mvyzz",
              "to": "gna5hrg"
            },
            "9dwbuh4": {
              "as": "fn",
              "from": "9dwbuh4",
              "to": "caxm792"
            },
            "c14vq1u": {
              "as": "self",
              "from": "c14vq1u",
              "to": "i4vkq75"
            },
            "caxm792": {
              "as": "true",
              "from": "caxm792",
              "to": "d1mxhrc"
            },
            "d1mxhrc": {
              "as": "value",
              "from": "d1mxhrc",
              "to": "qljoa2f"
            },
            "dl8tqbw": {
              "as": "_noiseFn",
              "from": "dl8tqbw",
              "to": "l4denbs"
            },
            "gna5hrg": {
              "as": "fn",
              "from": "gna5hrg",
              "to": "9dwbuh4"
            },
            "i4vkq75": {
              "as": "seed",
              "from": "i4vkq75",
              "to": "5suk5mt"
            },
            "iodmksr": {
              "as": "random",
              "from": "iodmksr",
              "to": "5p3hf1e"
            },
            "k4il51d": {
              "as": "rand",
              "from": "k4il51d",
              "to": "zzpqc3t"
            },
            "l4denbs": {
              "as": "args",
              "from": "l4denbs",
              "to": "qljoa2f"
            },
            "nzzp1an": {
              "as": "rand",
              "from": "nzzp1an",
              "to": "qm6xfhw"
            },
            "q6kbpnl": {
              "as": "pred",
              "from": "q6kbpnl",
              "to": "d1mxhrc"
            },
            "qm6xfhw": {
              "as": "seed",
              "from": "qm6xfhw",
              "to": "iodmksr"
            },
            "rcjsw21": {
              "as": "noiseFn",
              "from": "rcjsw21",
              "to": "5p3hf1e"
            },
            "un9yhxm": {
              "as": "sn",
              "from": "un9yhxm",
              "to": "dl8tqbw"
            },
            "zxk2uuu": {
              "as": "value",
              "from": "zxk2uuu",
              "to": "4qnsrir"
            },
            "zzpqc3t": {
              "as": "seed",
              "from": "zzpqc3t",
              "to": "18ft0o0"
            }
          },
          "id": "@math.noise",
          "name": "@math.noise",
          "nodes": {
            "18ft0o0": {
              "id": "18ft0o0",
              "ref": "@math.random"
            },
            "1es7qrh": {
              "id": "1es7qrh",
              "ref": "@js.script",
              "value": "return new Array(dims).fill(0)"
            },
            "2838i98": {
              "id": "2838i98"
            },
            "2zfxujb": {
              "id": "2zfxujb",
              "ref": "arg",
              "value": "dimensionsIn"
            },
            "3fqdnh3": {
              "id": "3fqdnh3",
              "ref": "arg",
              "value": "dimensionsOut"
            },
            "4qnsrir": {
              "id": "4qnsrir",
              "ref": "@memory.cache"
            },
            "5p3hf1e": {
              "id": "5p3hf1e",
              "ref": "@js.script",
              "value": "return noiseFn(random)"
            },
            "5suk5mt": {
              "id": "5suk5mt",
              "ref": "@math.random"
            },
            "76mvyzz": {
              "id": "76mvyzz",
              "ref": "arg",
              "value": "_noiseFn"
            },
            "9dwbuh4": {
              "id": "9dwbuh4",
              "ref": "@flow.runnable"
            },
            "c14vq1u": {
              "id": "c14vq1u",
              "ref": "arg",
              "value": "seed"
            },
            "caxm792": {
              "id": "caxm792",
              "ref": "@data.map"
            },
            "d1mxhrc": {
              "id": "d1mxhrc",
              "ref": "@flow.if"
            },
            "dl8tqbw": {
              "id": "dl8tqbw",
              "ref": "@js.script",
              "value": "return dim === 2 ? sn.createNoise2D : dim === 3 ? sn.createNoise3D : sn.createNoise4D"
            },
            "gna5hrg": {
              "id": "gna5hrg",
              "ref": "@js.script",
              "value": "return noiseFn(random)"
            },
            "i4vkq75": {
              "id": "i4vkq75",
              "ref": "@js.script",
              "value": 'return !isNaN(self) ? self : typeof self === "function" ? self() : 108'
            },
            "iodmksr": {
              "id": "iodmksr",
              "ref": "@math.random"
            },
            "k4il51d": {
              "id": "k4il51d",
              "ref": "arg",
              "value": "_random"
            },
            "l4denbs": {
              "id": "l4denbs"
            },
            "nzzp1an": {
              "id": "nzzp1an",
              "ref": "arg",
              "value": "_random"
            },
            "q6kbpnl": {
              "id": "q6kbpnl",
              "ref": "arg",
              "value": "dimensionsOut"
            },
            "qljoa2f": {
              "id": "qljoa2f",
              "name": "@math.noise",
              "ref": "return"
            },
            "qm6xfhw": {
              "id": "qm6xfhw",
              "ref": "@js.script",
              "value": "return rand() * Number.MAX_SAFE_INTEGER"
            },
            "rcjsw21": {
              "id": "rcjsw21",
              "ref": "arg",
              "value": "_noiseFn"
            },
            "un9yhxm": {
              "id": "un9yhxm",
              "ref": "arg",
              "value": "_lib.simplexNoise"
            },
            "zxk2uuu": {
              "id": "zxk2uuu",
              "ref": "@js.import_module",
              "value": "https://cdn.skypack.dev/simplex-noise"
            },
            "zzpqc3t": {
              "id": "zzpqc3t",
              "ref": "@js.script",
              "value": "return rand() * Number.MAX_SAFE_INTEGER"
            }
          },
          "out": "qljoa2f"
        },
        "@math.curlnoise": {
          "edges": {
            "0f3yvkt": {
              "as": "dimensionsOut",
              "from": "0f3yvkt",
              "to": "dy65zb2"
            },
            "0wye9gb": {
              "as": "z",
              "from": "0wye9gb",
              "to": "xrxh9ci"
            },
            "1dfm7ji": {
              "as": "elscale",
              "from": "1dfm7ji",
              "to": "v3ucnvc"
            },
            "1qvyjit": {
              "as": "value",
              "from": "1qvyjit",
              "to": "sal16lj"
            },
            "3w2mjzs": {
              "as": "args",
              "from": "3w2mjzs",
              "to": "r4iac0v"
            },
            "4rfdldl": {
              "as": "otherwise",
              "from": "4rfdldl",
              "to": "bp1jp8w"
            },
            "4y0zvwy": {
              "as": "runnable",
              "from": "4y0zvwy",
              "to": "xbort73"
            },
            "5iuypo6": {
              "as": "elementScale",
              "from": "5iuypo6",
              "to": "args"
            },
            "7ddyvg5": {
              "as": "y",
              "from": "7ddyvg5",
              "to": "v3ucnvc"
            },
            "7pazm63": {
              "as": "value",
              "from": "7pazm63",
              "to": "h5rpf0o"
            },
            "9z5zasc": {
              "as": "x",
              "from": "9z5zasc",
              "to": "v3ucnvc"
            },
            "args": {
              "as": "args",
              "from": "args",
              "to": "out"
            },
            "bp1jp8w": {
              "as": "seed",
              "from": "bp1jp8w",
              "to": "dy65zb2"
            },
            "coz46jt": {
              "as": "dimensionsIn",
              "from": "coz46jt",
              "to": "dy65zb2"
            },
            "cy3xmxj": {
              "as": "_dimY",
              "from": "cy3xmxj",
              "to": "3w2mjzs"
            },
            "dy65zb2": {
              "as": "_noise",
              "from": "dy65zb2",
              "to": "3w2mjzs"
            },
            "gw4y5bs": {
              "as": "y",
              "from": "gw4y5bs",
              "to": "xrxh9ci"
            },
            "h5rpf0o": {
              "as": "_dimX",
              "from": "h5rpf0o",
              "to": "3w2mjzs"
            },
            "kf6fscw": {
              "as": "x",
              "from": "kf6fscw",
              "to": "xrxh9ci"
            },
            "nk91iof": {
              "as": "time",
              "from": "nk91iof",
              "to": "xrxh9ci"
            },
            "prsoiok": {
              "as": "noise",
              "from": "prsoiok",
              "to": "v3ucnvc"
            },
            "r4iac0v": {
              "as": "value",
              "from": "r4iac0v",
              "to": "out"
            },
            "ra9d520": {
              "as": "w",
              "from": "ra9d520",
              "to": "v3ucnvc"
            },
            "sal16lj": {
              "as": "_dimZ",
              "from": "sal16lj",
              "to": "3w2mjzs"
            },
            "tk5fa45": {
              "as": "dimZ",
              "from": "tk5fa45",
              "to": "v3ucnvc"
            },
            "tuw52lr": {
              "as": "dimY",
              "from": "tuw52lr",
              "to": "v3ucnvc"
            },
            "v3ucnvc": {
              "as": "fn",
              "from": "v3ucnvc",
              "to": "4y0zvwy"
            },
            "vktr3na": {
              "as": "z",
              "from": "vktr3na",
              "to": "v3ucnvc"
            },
            "wim2g5q": {
              "as": "dimX",
              "from": "wim2g5q",
              "to": "v3ucnvc"
            },
            "xbort73": {
              "as": "value",
              "from": "xbort73",
              "to": "r4iac0v"
            },
            "xrxh9ci": {
              "as": "parameters",
              "from": "xrxh9ci",
              "to": "4y0zvwy"
            },
            "ywvf7t4": {
              "as": "value",
              "from": "ywvf7t4",
              "to": "cy3xmxj"
            },
            "zaqgks3": {
              "as": "value",
              "from": "zaqgks3",
              "to": "bp1jp8w"
            },
            "zlojnd4": {
              "as": "elementScale",
              "from": "zlojnd4",
              "to": "xrxh9ci"
            }
          },
          "id": "@math.curlnoise",
          "nodes": {
            "0f3yvkt": {
              "id": "0f3yvkt",
              "value": "3"
            },
            "0wye9gb": {
              "id": "0wye9gb"
            },
            "1dfm7ji": {
              "id": "1dfm7ji",
              "ref": "arg",
              "value": "elementScale"
            },
            "1qvyjit": {
              "id": "1qvyjit",
              "value": "0"
            },
            "3w2mjzs": {
              "id": "3w2mjzs"
            },
            "4rfdldl": {
              "id": "4rfdldl",
              "value": "4"
            },
            "4y0zvwy": {
              "id": "4y0zvwy",
              "ref": "@flow.runnable"
            },
            "5iuypo6": {
              "id": "5iuypo6",
              "value": "1"
            },
            "7ddyvg5": {
              "id": "7ddyvg5",
              "ref": "arg",
              "value": "y"
            },
            "7pazm63": {
              "id": "7pazm63",
              "value": "0"
            },
            "9z5zasc": {
              "id": "9z5zasc",
              "ref": "arg",
              "value": "x"
            },
            "args": {
              "id": "args"
            },
            "bp1jp8w": {
              "id": "bp1jp8w",
              "ref": "@flow.default"
            },
            "coz46jt": {
              "id": "coz46jt",
              "value": "4"
            },
            "cy3xmxj": {
              "id": "cy3xmxj",
              "ref": "@memory.cache"
            },
            "dy65zb2": {
              "id": "dy65zb2",
              "ref": "@math.noise"
            },
            "gw4y5bs": {
              "id": "gw4y5bs"
            },
            "h5rpf0o": {
              "id": "h5rpf0o",
              "ref": "@memory.cache"
            },
            "jnnnm7v": {
              "id": "jnnnm7v",
              "value": "0"
            },
            "kf6fscw": {
              "id": "kf6fscw"
            },
            "nk91iof": {
              "id": "nk91iof"
            },
            "out": {
              "id": "out",
              "name": "@math.curlnoise",
              "ref": "return"
            },
            "prsoiok": {
              "id": "prsoiok",
              "ref": "arg",
              "value": "_noise"
            },
            "r4iac0v": {
              "id": "r4iac0v",
              "ref": "return"
            },
            "ra9d520": {
              "id": "ra9d520",
              "ref": "arg",
              "value": "time"
            },
            "sal16lj": {
              "id": "sal16lj",
              "ref": "@memory.cache"
            },
            "tk5fa45": {
              "id": "tk5fa45",
              "ref": "arg",
              "value": "_dimZ"
            },
            "tuw52lr": {
              "id": "tuw52lr",
              "ref": "arg",
              "value": "_dimY"
            },
            "v3ucnvc": {
              "id": "v3ucnvc",
              "ref": "@js.script",
              "value": "const delta = 0.0001;\nelscale = Math.max(elscale ?? 1, 0.001);\n\nconst sample3D = (x, y, z, w) => noise.map(nfn => nfn(x / elscale, y / elscale, z / elscale, w))\n\nconst slope = (dim) => {\n  if(dim === 0) {\n    dimX = 1;\n    dimY = 0;\n    dimZ = 0;\n  }\n  \n  if(dim === 1) {\n    dimX = 0;\n    dimY = 1;\n    dimZ = 0;\n  }\n  \n  if(dim === 2) {\n    dimX = 0;\n    dimY = 0;\n    dimZ = 1;\n  }\n  \n  const n1 = sample3D(x - delta * dimX, y - delta * dimY, z - delta * dimZ, w);\n  const n2 = sample3D(x + delta * dimX, y + delta * dimY, z + delta * dimZ, w);\n\n  return [n1[0] - n2[0], n1[1] - n2[1], n1[2] - n2[2]]\n}\n\nconst dx = slope(0);\nconst dy = slope(1);\nconst dz = slope(2);\n\nconst grad = [slope(noise, 0), slope(noise, 1), slope(noise, 2)]\n\nconst curl = [(dy[2] - dz[1]) / (2 * delta), (dz[0] - dx[2]) / (2 * delta), (dx[1] - dy[0]) / (2 * delta)]\n\nconst sum = Math.sqrt(curl[0] * curl[0] + curl[1] * curl[1] + curl[2] * curl[2]);\nreturn curl.map(cv => cv / sum)"
            },
            "vktr3na": {
              "id": "vktr3na",
              "ref": "arg",
              "value": "z"
            },
            "wim2g5q": {
              "id": "wim2g5q",
              "ref": "arg",
              "value": "_dimX"
            },
            "xbort73": {
              "id": "xbort73",
              "ref": "@js.create_fn"
            },
            "xrxh9ci": {
              "id": "xrxh9ci"
            },
            "ywvf7t4": {
              "id": "ywvf7t4",
              "value": "0"
            },
            "zaqgks3": {
              "id": "zaqgks3",
              "ref": "arg",
              "value": "seed"
            },
            "zlojnd4": {
              "id": "zlojnd4"
            }
          },
          "out": "out"
        },
        "@browser.writeClipboard": {
          "edges": {
            "output_val": {
              "as": "value",
              "from": "output_val",
              "to": "out"
            },
            "u9vcri1": {
              "as": "text",
              "from": "u9vcri1",
              "to": "output_val"
            }
          },
          "id": "@browser.writeClipboard",
          "nodes": {
            "out": {
              "id": "out",
              "name": "@browser.writeClipboard",
              "ref": "return"
            },
            "output_val": {
              "id": "output_val",
              "ref": "@js.script",
              "value": 'navigator.clipboard.writeText(typeof text === "string" ? text : JSON.stringify(text));\nreturn text;'
            },
            "u9vcri1": {
              "id": "u9vcri1",
              "ref": "arg",
              "value": "text"
            }
          },
          "out": "out"
        }
      },
      "edges": {}
    };
    Object.values(generic.nodes).map((graph) => {
      if (graph.nodes && Array.isArray(graph.nodes)) {
        graph.nodes = Object.fromEntries(graph.nodes.map((g) => [g.id, g]));
        graph.edges = Object.fromEntries(graph.edges.map((e) => [e.from, e]));
      }
    });
    generic_default = generic;
  }
});

// src/externs.ts
var init_externs = __esm({
  "src/externs.ts"() {
    init_util();
    init_nodysseus();
    init_types();
  }
});

// node_modules/uuid/dist/esm-browser/rng.js
function rng() {
  if (!getRandomValues) {
    getRandomValues = typeof crypto !== "undefined" && crypto.getRandomValues && crypto.getRandomValues.bind(crypto);
    if (!getRandomValues) {
      throw new Error("crypto.getRandomValues() not supported. See https://github.com/uuidjs/uuid#getrandomvalues-not-supported");
    }
  }
  return getRandomValues(rnds8);
}
var getRandomValues, rnds8;
var init_rng = __esm({
  "node_modules/uuid/dist/esm-browser/rng.js"() {
    rnds8 = new Uint8Array(16);
  }
});

// node_modules/uuid/dist/esm-browser/stringify.js
function unsafeStringify(arr, offset = 0) {
  return (byteToHex[arr[offset + 0]] + byteToHex[arr[offset + 1]] + byteToHex[arr[offset + 2]] + byteToHex[arr[offset + 3]] + "-" + byteToHex[arr[offset + 4]] + byteToHex[arr[offset + 5]] + "-" + byteToHex[arr[offset + 6]] + byteToHex[arr[offset + 7]] + "-" + byteToHex[arr[offset + 8]] + byteToHex[arr[offset + 9]] + "-" + byteToHex[arr[offset + 10]] + byteToHex[arr[offset + 11]] + byteToHex[arr[offset + 12]] + byteToHex[arr[offset + 13]] + byteToHex[arr[offset + 14]] + byteToHex[arr[offset + 15]]).toLowerCase();
}
var byteToHex;
var init_stringify = __esm({
  "node_modules/uuid/dist/esm-browser/stringify.js"() {
    byteToHex = [];
    for (let i = 0; i < 256; ++i) {
      byteToHex.push((i + 256).toString(16).slice(1));
    }
  }
});

// node_modules/uuid/dist/esm-browser/native.js
var randomUUID, native_default;
var init_native = __esm({
  "node_modules/uuid/dist/esm-browser/native.js"() {
    randomUUID = typeof crypto !== "undefined" && crypto.randomUUID && crypto.randomUUID.bind(crypto);
    native_default = {
      randomUUID
    };
  }
});

// node_modules/uuid/dist/esm-browser/v4.js
function v4(options, buf, offset) {
  if (native_default.randomUUID && !buf && !options) {
    return native_default.randomUUID();
  }
  options = options || {};
  const rnds = options.random || (options.rng || rng)();
  rnds[6] = rnds[6] & 15 | 64;
  rnds[8] = rnds[8] & 63 | 128;
  if (buf) {
    offset = offset || 0;
    for (let i = 0; i < 16; ++i) {
      buf[offset + i] = rnds[i];
    }
    return buf;
  }
  return unsafeStringify(rnds);
}
var v4_default;
var init_v4 = __esm({
  "node_modules/uuid/dist/esm-browser/v4.js"() {
    init_native();
    init_rng();
    init_stringify();
    v4_default = v4;
  }
});

// node_modules/uuid/dist/esm-browser/index.js
var init_esm_browser = __esm({
  "node_modules/uuid/dist/esm-browser/index.js"() {
    init_v4();
  }
});

// src/events.ts
var init_events = __esm({
  "src/events.ts"() {
    init_types();
    init_nodysseus();
    init_util();
  }
});

// src/nodysseus.ts
var generic_nodes, mapStore;
var init_nodysseus = __esm({
  "src/nodysseus.ts"() {
    init_util();
    init_types();
    init_util();
    init_generic();
    init_externs();
    init_events();
    generic_nodes = generic_default.nodes;
    mapStore = () => {
      const map = /* @__PURE__ */ new Map();
      return {
        get: (id) => map.get(id),
        set: (id, data) => map.set(id, data),
        delete: (id) => map.delete(id),
        clear: () => map.clear(),
        keys: () => [...map.keys()]
      };
    };
  }
});

// node_modules/@automerge/automerge/dist/mjs/uuid.js
function defaultFactory() {
  return v4_default().replace(/-/g, "");
}
var factory, uuid;
var init_uuid = __esm({
  "node_modules/@automerge/automerge/dist/mjs/uuid.js"() {
    init_esm_browser();
    factory = defaultFactory;
    uuid = () => {
      return factory();
    };
    uuid.setFactory = (newFactory) => {
      factory = newFactory;
    };
    uuid.reset = () => {
      factory = defaultFactory;
    };
  }
});

// node_modules/@automerge/automerge/dist/mjs/constants.js
var STATE, TRACE, OBJECT_ID, IS_PROXY, UINT, INT, F64, COUNTER, TEXT;
var init_constants = __esm({
  "node_modules/@automerge/automerge/dist/mjs/constants.js"() {
    STATE = Symbol.for("_am_meta");
    TRACE = Symbol.for("_am_trace");
    OBJECT_ID = Symbol.for("_am_objectId");
    IS_PROXY = Symbol.for("_am_isProxy");
    UINT = Symbol.for("_am_uint");
    INT = Symbol.for("_am_int");
    F64 = Symbol.for("_am_f64");
    COUNTER = Symbol.for("_am_counter");
    TEXT = Symbol.for("_am_text");
  }
});

// node_modules/@automerge/automerge/dist/mjs/text.js
var Text;
var init_text = __esm({
  "node_modules/@automerge/automerge/dist/mjs/text.js"() {
    init_constants();
    Text = class {
      constructor(text) {
        if (typeof text === "string") {
          this.elems = [...text];
        } else if (Array.isArray(text)) {
          this.elems = text;
        } else if (text === void 0) {
          this.elems = [];
        } else {
          throw new TypeError(`Unsupported initial value for Text: ${text}`);
        }
        Reflect.defineProperty(this, TEXT, { value: true });
      }
      get length() {
        return this.elems.length;
      }
      //eslint-disable-next-line @typescript-eslint/no-explicit-any
      get(index) {
        return this.elems[index];
      }
      /**
       * Iterates over the text elements character by character, including any
       * inline objects.
       */
      [Symbol.iterator]() {
        const elems = this.elems;
        let index = -1;
        return {
          next() {
            index += 1;
            if (index < elems.length) {
              return { done: false, value: elems[index] };
            } else {
              return { done: true };
            }
          }
        };
      }
      /**
       * Returns the content of the Text object as a simple string, ignoring any
       * non-character elements.
       */
      toString() {
        if (!this.str) {
          this.str = "";
          for (const elem of this.elems) {
            if (typeof elem === "string")
              this.str += elem;
            else
              this.str += "\uFFFC";
          }
        }
        return this.str;
      }
      /**
       * Returns the content of the Text object as a sequence of strings,
       * interleaved with non-character elements.
       *
       * For example, the value `['a', 'b', {x: 3}, 'c', 'd']` has spans:
       * `=> ['ab', {x: 3}, 'cd']`
       */
      toSpans() {
        if (!this.spans) {
          this.spans = [];
          let chars = "";
          for (const elem of this.elems) {
            if (typeof elem === "string") {
              chars += elem;
            } else {
              if (chars.length > 0) {
                this.spans.push(chars);
                chars = "";
              }
              this.spans.push(elem);
            }
          }
          if (chars.length > 0) {
            this.spans.push(chars);
          }
        }
        return this.spans;
      }
      /**
       * Returns the content of the Text object as a simple string, so that the
       * JSON serialization of an Automerge document represents text nicely.
       */
      toJSON() {
        return this.toString();
      }
      /**
       * Updates the list item at position `index` to a new value `value`.
       */
      set(index, value) {
        if (this[STATE]) {
          throw new RangeError("object cannot be modified outside of a change block");
        }
        this.elems[index] = value;
      }
      /**
       * Inserts new list items `values` starting at position `index`.
       */
      insertAt(index, ...values) {
        if (this[STATE]) {
          throw new RangeError("object cannot be modified outside of a change block");
        }
        this.elems.splice(index, 0, ...values);
      }
      /**
       * Deletes `numDelete` list items starting at position `index`.
       * if `numDelete` is not given, one item is deleted.
       */
      deleteAt(index, numDelete = 1) {
        if (this[STATE]) {
          throw new RangeError("object cannot be modified outside of a change block");
        }
        this.elems.splice(index, numDelete);
      }
      map(callback) {
        this.elems.map(callback);
      }
      lastIndexOf(searchElement, fromIndex) {
        this.elems.lastIndexOf(searchElement, fromIndex);
      }
      concat(other) {
        return new Text(this.elems.concat(other.elems));
      }
      every(test) {
        return this.elems.every(test);
      }
      filter(test) {
        return new Text(this.elems.filter(test));
      }
      find(test) {
        return this.elems.find(test);
      }
      findIndex(test) {
        return this.elems.findIndex(test);
      }
      forEach(f) {
        this.elems.forEach(f);
      }
      includes(elem) {
        return this.elems.includes(elem);
      }
      indexOf(elem) {
        return this.elems.indexOf(elem);
      }
      join(sep) {
        return this.elems.join(sep);
      }
      reduce(f) {
        this.elems.reduce(f);
      }
      reduceRight(f) {
        this.elems.reduceRight(f);
      }
      slice(start, end) {
        new Text(this.elems.slice(start, end));
      }
      some(test) {
        return this.elems.some(test);
      }
      toLocaleString() {
        this.toString();
      }
    };
  }
});

// node_modules/@automerge/automerge/dist/mjs/counter.js
function getWriteableCounter(value, context, path, objectId, key) {
  return new WriteableCounter(value, context, path, objectId, key);
}
var Counter, WriteableCounter;
var init_counter = __esm({
  "node_modules/@automerge/automerge/dist/mjs/counter.js"() {
    init_constants();
    Counter = class {
      constructor(value) {
        this.value = value || 0;
        Reflect.defineProperty(this, COUNTER, { value: true });
      }
      /**
       * A peculiar JavaScript language feature from its early days: if the object
       * `x` has a `valueOf()` method that returns a number, you can use numerical
       * operators on the object `x` directly, such as `x + 1` or `x < 4`.
       * This method is also called when coercing a value to a string by
       * concatenating it with another string, as in `x + ''`.
       * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/valueOf
       */
      valueOf() {
        return this.value;
      }
      /**
       * Returns the counter value as a decimal string. If `x` is a counter object,
       * this method is called e.g. when you do `['value: ', x].join('')` or when
       * you use string interpolation: `value: ${x}`.
       */
      toString() {
        return this.valueOf().toString();
      }
      /**
       * Returns the counter value, so that a JSON serialization of an Automerge
       * document represents the counter simply as an integer.
       */
      toJSON() {
        return this.value;
      }
    };
    WriteableCounter = class extends Counter {
      constructor(value, context, path, objectId, key) {
        super(value);
        this.context = context;
        this.path = path;
        this.objectId = objectId;
        this.key = key;
      }
      /**
       * Increases the value of the counter by `delta`. If `delta` is not given,
       * increases the value of the counter by 1.
       */
      increment(delta) {
        delta = typeof delta === "number" ? delta : 1;
        this.context.increment(this.objectId, this.key, delta);
        this.value += delta;
        return this.value;
      }
      /**
       * Decreases the value of the counter by `delta`. If `delta` is not given,
       * decreases the value of the counter by 1.
       */
      decrement(delta) {
        return this.increment(typeof delta === "number" ? -delta : -1);
      }
    };
  }
});

// node_modules/@automerge/automerge/dist/mjs/raw_string.js
var RawString;
var init_raw_string = __esm({
  "node_modules/@automerge/automerge/dist/mjs/raw_string.js"() {
    RawString = class {
      constructor(val) {
        this.val = val;
      }
    };
  }
});

// node_modules/@automerge/automerge/dist/mjs/proxies.js
function parseListIndex(key) {
  if (typeof key === "string" && /^[0-9]+$/.test(key))
    key = parseInt(key, 10);
  if (typeof key !== "number") {
    return key;
  }
  if (key < 0 || isNaN(key) || key === Infinity || key === -Infinity) {
    throw new RangeError("A list index must be positive, but you passed " + key);
  }
  return key;
}
function valueAt(target, prop) {
  const { context, objectId, path, readonly, heads, textV2 } = target;
  const value = context.getWithType(objectId, prop, heads);
  if (value === null) {
    return;
  }
  const datatype = value[0];
  const val = value[1];
  switch (datatype) {
    case void 0:
      return;
    case "map":
      return mapProxy(context, val, textV2, [...path, prop], readonly, heads);
    case "list":
      return listProxy(context, val, textV2, [...path, prop], readonly, heads);
    case "text":
      if (textV2) {
        return context.text(val, heads);
      } else {
        return textProxy(context, val, [...path, prop], readonly, heads);
      }
    case "str":
      return val;
    case "uint":
      return val;
    case "int":
      return val;
    case "f64":
      return val;
    case "boolean":
      return val;
    case "null":
      return null;
    case "bytes":
      return val;
    case "timestamp":
      return val;
    case "counter": {
      if (readonly) {
        return new Counter(val);
      } else {
        const counter = getWriteableCounter(val, context, path, objectId, prop);
        return counter;
      }
    }
    default:
      throw RangeError(`datatype ${datatype} unimplemented`);
  }
}
function import_value(value, textV2) {
  switch (typeof value) {
    case "object":
      if (value == null) {
        return [null, "null"];
      } else if (value[UINT]) {
        return [value.value, "uint"];
      } else if (value[INT]) {
        return [value.value, "int"];
      } else if (value[F64]) {
        return [value.value, "f64"];
      } else if (value[COUNTER]) {
        return [value.value, "counter"];
      } else if (value instanceof Date) {
        return [value.getTime(), "timestamp"];
      } else if (value instanceof RawString) {
        return [value.val, "str"];
      } else if (value instanceof Text) {
        return [value, "text"];
      } else if (value instanceof Uint8Array) {
        return [value, "bytes"];
      } else if (value instanceof Array) {
        return [value, "list"];
      } else if (Object.getPrototypeOf(value) === Object.getPrototypeOf({})) {
        return [value, "map"];
      } else if (value[OBJECT_ID]) {
        throw new RangeError("Cannot create a reference to an existing document object");
      } else {
        throw new RangeError(`Cannot assign unknown object: ${value}`);
      }
    case "boolean":
      return [value, "boolean"];
    case "number":
      if (Number.isInteger(value)) {
        return [value, "int"];
      } else {
        return [value, "f64"];
      }
    case "string":
      if (textV2) {
        return [value, "text"];
      } else {
        return [value, "str"];
      }
    default:
      throw new RangeError(`Unsupported type of value: ${typeof value}`);
  }
}
function mapProxy(context, objectId, textV2, path, readonly, heads) {
  const target = {
    context,
    objectId,
    path: path || [],
    readonly: !!readonly,
    frozen: false,
    heads,
    cache: {},
    textV2
  };
  const proxied = {};
  Object.assign(proxied, target);
  const result = new Proxy(proxied, MapHandler);
  return result;
}
function listProxy(context, objectId, textV2, path, readonly, heads) {
  const target = {
    context,
    objectId,
    path: path || [],
    readonly: !!readonly,
    frozen: false,
    heads,
    cache: {},
    textV2
  };
  const proxied = [];
  Object.assign(proxied, target);
  return new Proxy(proxied, ListHandler);
}
function textProxy(context, objectId, path, readonly, heads) {
  const target = {
    context,
    objectId,
    path: path || [],
    readonly: !!readonly,
    frozen: false,
    heads,
    cache: {},
    textV2: false
  };
  const proxied = {};
  Object.assign(proxied, target);
  return new Proxy(proxied, TextHandler);
}
function rootProxy(context, textV2, readonly) {
  return mapProxy(context, "_root", textV2, [], !!readonly);
}
function listMethods(target) {
  const { context, objectId, path, readonly, frozen, heads, textV2 } = target;
  const methods = {
    deleteAt(index, numDelete) {
      if (typeof numDelete === "number") {
        context.splice(objectId, index, numDelete);
      } else {
        context.delete(objectId, index);
      }
      return this;
    },
    fill(val, start, end) {
      const [value, datatype] = import_value(val, textV2);
      const length = context.length(objectId);
      start = parseListIndex(start || 0);
      end = parseListIndex(end || length);
      for (let i = start; i < Math.min(end, length); i++) {
        if (datatype === "list" || datatype === "map") {
          context.putObject(objectId, i, value);
        } else if (datatype === "text") {
          if (textV2) {
            assertString(value);
            context.putObject(objectId, i, value);
          } else {
            assertText(value);
            const text = context.putObject(objectId, i, "");
            const proxyText = textProxy(context, text, [...path, i], readonly);
            for (let i2 = 0; i2 < value.length; i2++) {
              proxyText[i2] = value.get(i2);
            }
          }
        } else {
          context.put(objectId, i, value, datatype);
        }
      }
      return this;
    },
    indexOf(o, start = 0) {
      const length = context.length(objectId);
      for (let i = start; i < length; i++) {
        const value = context.getWithType(objectId, i, heads);
        if (value && (value[1] === o[OBJECT_ID] || value[1] === o)) {
          return i;
        }
      }
      return -1;
    },
    insertAt(index, ...values) {
      this.splice(index, 0, ...values);
      return this;
    },
    pop() {
      const length = context.length(objectId);
      if (length == 0) {
        return void 0;
      }
      const last = valueAt(target, length - 1);
      context.delete(objectId, length - 1);
      return last;
    },
    push(...values) {
      const len = context.length(objectId);
      this.splice(len, 0, ...values);
      return context.length(objectId);
    },
    shift() {
      if (context.length(objectId) == 0)
        return;
      const first = valueAt(target, 0);
      context.delete(objectId, 0);
      return first;
    },
    splice(index, del, ...vals) {
      index = parseListIndex(index);
      del = parseListIndex(del);
      for (const val of vals) {
        if (val && val[OBJECT_ID]) {
          throw new RangeError("Cannot create a reference to an existing document object");
        }
      }
      if (frozen) {
        throw new RangeError("Attempting to use an outdated Automerge document");
      }
      if (readonly) {
        throw new RangeError("Sequence object cannot be modified outside of a change block");
      }
      const result = [];
      for (let i = 0; i < del; i++) {
        const value = valueAt(target, index);
        if (value !== void 0) {
          result.push(value);
        }
        context.delete(objectId, index);
      }
      const values = vals.map((val) => import_value(val, textV2));
      for (const [value, datatype] of values) {
        switch (datatype) {
          case "list": {
            const list = context.insertObject(objectId, index, []);
            const proxyList = listProxy(context, list, textV2, [...path, index], readonly);
            proxyList.splice(0, 0, ...value);
            break;
          }
          case "text": {
            if (textV2) {
              assertString(value);
              context.insertObject(objectId, index, value);
            } else {
              const text = context.insertObject(objectId, index, "");
              const proxyText = textProxy(context, text, [...path, index], readonly);
              proxyText.splice(0, 0, ...value);
            }
            break;
          }
          case "map": {
            const map = context.insertObject(objectId, index, {});
            const proxyMap = mapProxy(context, map, textV2, [...path, index], readonly);
            for (const key in value) {
              proxyMap[key] = value[key];
            }
            break;
          }
          default:
            context.insert(objectId, index, value, datatype);
        }
        index += 1;
      }
      return result;
    },
    unshift(...values) {
      this.splice(0, 0, ...values);
      return context.length(objectId);
    },
    entries() {
      const i = 0;
      const iterator = {
        next: () => {
          const value = valueAt(target, i);
          if (value === void 0) {
            return { value: void 0, done: true };
          } else {
            return { value: [i, value], done: false };
          }
        }
      };
      return iterator;
    },
    keys() {
      let i = 0;
      const len = context.length(objectId, heads);
      const iterator = {
        next: () => {
          let value = void 0;
          if (i < len) {
            value = i;
            i++;
          }
          return { value, done: true };
        }
      };
      return iterator;
    },
    values() {
      const i = 0;
      const iterator = {
        next: () => {
          const value = valueAt(target, i);
          if (value === void 0) {
            return { value: void 0, done: true };
          } else {
            return { value, done: false };
          }
        }
      };
      return iterator;
    },
    toArray() {
      const list = [];
      let value;
      do {
        value = valueAt(target, list.length);
        if (value !== void 0) {
          list.push(value);
        }
      } while (value !== void 0);
      return list;
    },
    map(f) {
      return this.toArray().map(f);
    },
    toString() {
      return this.toArray().toString();
    },
    toLocaleString() {
      return this.toArray().toLocaleString();
    },
    forEach(f) {
      return this.toArray().forEach(f);
    },
    // todo: real concat function is different
    concat(other) {
      return this.toArray().concat(other);
    },
    every(f) {
      return this.toArray().every(f);
    },
    filter(f) {
      return this.toArray().filter(f);
    },
    find(f) {
      let index = 0;
      for (const v of this) {
        if (f(v, index)) {
          return v;
        }
        index += 1;
      }
    },
    findIndex(f) {
      let index = 0;
      for (const v of this) {
        if (f(v, index)) {
          return index;
        }
        index += 1;
      }
      return -1;
    },
    includes(elem) {
      return this.find((e) => e === elem) !== void 0;
    },
    join(sep) {
      return this.toArray().join(sep);
    },
    reduce(f, initialValue) {
      return this.toArray().reduce(f, initialValue);
    },
    reduceRight(f, initialValue) {
      return this.toArray().reduceRight(f, initialValue);
    },
    lastIndexOf(search, fromIndex = Infinity) {
      return this.toArray().lastIndexOf(search, fromIndex);
    },
    slice(index, num) {
      return this.toArray().slice(index, num);
    },
    some(f) {
      let index = 0;
      for (const v of this) {
        if (f(v, index)) {
          return true;
        }
        index += 1;
      }
      return false;
    },
    [Symbol.iterator]: function* () {
      let i = 0;
      let value = valueAt(target, i);
      while (value !== void 0) {
        yield value;
        i += 1;
        value = valueAt(target, i);
      }
    }
  };
  return methods;
}
function textMethods(target) {
  const { context, objectId, heads } = target;
  const methods = {
    set(index, value) {
      return this[index] = value;
    },
    get(index) {
      return this[index];
    },
    toString() {
      return context.text(objectId, heads).replace(/￼/g, "");
    },
    toSpans() {
      const spans = [];
      let chars = "";
      const length = context.length(objectId);
      for (let i = 0; i < length; i++) {
        const value = this[i];
        if (typeof value === "string") {
          chars += value;
        } else {
          if (chars.length > 0) {
            spans.push(chars);
            chars = "";
          }
          spans.push(value);
        }
      }
      if (chars.length > 0) {
        spans.push(chars);
      }
      return spans;
    },
    toJSON() {
      return this.toString();
    },
    indexOf(o, start = 0) {
      const text = context.text(objectId);
      return text.indexOf(o, start);
    }
  };
  return methods;
}
function assertText(value) {
  if (!(value instanceof Text)) {
    throw new Error("value was not a Text instance");
  }
}
function assertString(value) {
  if (typeof value !== "string") {
    throw new Error("value was not a string");
  }
}
var MapHandler, ListHandler, TextHandler;
var init_proxies = __esm({
  "node_modules/@automerge/automerge/dist/mjs/proxies.js"() {
    init_text();
    init_counter();
    init_constants();
    init_raw_string();
    MapHandler = {
      get(target, key) {
        const { context, objectId, cache } = target;
        if (key === Symbol.toStringTag) {
          return target[Symbol.toStringTag];
        }
        if (key === OBJECT_ID)
          return objectId;
        if (key === IS_PROXY)
          return true;
        if (key === TRACE)
          return target.trace;
        if (key === STATE)
          return { handle: context };
        if (!cache[key]) {
          cache[key] = valueAt(target, key);
        }
        return cache[key];
      },
      set(target, key, val) {
        const { context, objectId, path, readonly, frozen, textV2 } = target;
        target.cache = {};
        if (val && val[OBJECT_ID]) {
          throw new RangeError("Cannot create a reference to an existing document object");
        }
        if (key === TRACE) {
          target.trace = val;
          return true;
        }
        const [value, datatype] = import_value(val, textV2);
        if (frozen) {
          throw new RangeError("Attempting to use an outdated Automerge document");
        }
        if (readonly) {
          throw new RangeError(`Object property "${key}" cannot be modified`);
        }
        switch (datatype) {
          case "list": {
            const list = context.putObject(objectId, key, []);
            const proxyList = listProxy(context, list, textV2, [...path, key], readonly);
            for (let i = 0; i < value.length; i++) {
              proxyList[i] = value[i];
            }
            break;
          }
          case "text": {
            if (textV2) {
              assertString(value);
              context.putObject(objectId, key, value);
            } else {
              assertText(value);
              const text = context.putObject(objectId, key, "");
              const proxyText = textProxy(context, text, [...path, key], readonly);
              for (let i = 0; i < value.length; i++) {
                proxyText[i] = value.get(i);
              }
            }
            break;
          }
          case "map": {
            const map = context.putObject(objectId, key, {});
            const proxyMap = mapProxy(context, map, textV2, [...path, key], readonly);
            for (const key2 in value) {
              proxyMap[key2] = value[key2];
            }
            break;
          }
          default:
            context.put(objectId, key, value, datatype);
        }
        return true;
      },
      deleteProperty(target, key) {
        const { context, objectId, readonly } = target;
        target.cache = {};
        if (readonly) {
          throw new RangeError(`Object property "${key}" cannot be modified`);
        }
        context.delete(objectId, key);
        return true;
      },
      has(target, key) {
        const value = this.get(target, key);
        return value !== void 0;
      },
      getOwnPropertyDescriptor(target, key) {
        const value = this.get(target, key);
        if (typeof value !== "undefined") {
          return {
            configurable: true,
            enumerable: true,
            value
          };
        }
      },
      ownKeys(target) {
        const { context, objectId, heads } = target;
        const keys = context.keys(objectId, heads);
        return [...new Set(keys)];
      }
    };
    ListHandler = {
      get(target, index) {
        const { context, objectId, heads } = target;
        index = parseListIndex(index);
        if (index === Symbol.hasInstance) {
          return (instance2) => {
            return Array.isArray(instance2);
          };
        }
        if (index === Symbol.toStringTag) {
          return target[Symbol.toStringTag];
        }
        if (index === OBJECT_ID)
          return objectId;
        if (index === IS_PROXY)
          return true;
        if (index === TRACE)
          return target.trace;
        if (index === STATE)
          return { handle: context };
        if (index === "length")
          return context.length(objectId, heads);
        if (typeof index === "number") {
          return valueAt(target, index);
        } else {
          return listMethods(target)[index];
        }
      },
      set(target, index, val) {
        const { context, objectId, path, readonly, frozen, textV2 } = target;
        index = parseListIndex(index);
        if (val && val[OBJECT_ID]) {
          throw new RangeError("Cannot create a reference to an existing document object");
        }
        if (index === TRACE) {
          target.trace = val;
          return true;
        }
        if (typeof index == "string") {
          throw new RangeError("list index must be a number");
        }
        const [value, datatype] = import_value(val, textV2);
        if (frozen) {
          throw new RangeError("Attempting to use an outdated Automerge document");
        }
        if (readonly) {
          throw new RangeError(`Object property "${index}" cannot be modified`);
        }
        switch (datatype) {
          case "list": {
            let list;
            if (index >= context.length(objectId)) {
              list = context.insertObject(objectId, index, []);
            } else {
              list = context.putObject(objectId, index, []);
            }
            const proxyList = listProxy(context, list, textV2, [...path, index], readonly);
            proxyList.splice(0, 0, ...value);
            break;
          }
          case "text": {
            if (textV2) {
              assertString(value);
              if (index >= context.length(objectId)) {
                context.insertObject(objectId, index, value);
              } else {
                context.putObject(objectId, index, value);
              }
            } else {
              let text;
              assertText(value);
              if (index >= context.length(objectId)) {
                text = context.insertObject(objectId, index, "");
              } else {
                text = context.putObject(objectId, index, "");
              }
              const proxyText = textProxy(context, text, [...path, index], readonly);
              proxyText.splice(0, 0, ...value);
            }
            break;
          }
          case "map": {
            let map;
            if (index >= context.length(objectId)) {
              map = context.insertObject(objectId, index, {});
            } else {
              map = context.putObject(objectId, index, {});
            }
            const proxyMap = mapProxy(context, map, textV2, [...path, index], readonly);
            for (const key in value) {
              proxyMap[key] = value[key];
            }
            break;
          }
          default:
            if (index >= context.length(objectId)) {
              context.insert(objectId, index, value, datatype);
            } else {
              context.put(objectId, index, value, datatype);
            }
        }
        return true;
      },
      deleteProperty(target, index) {
        const { context, objectId } = target;
        index = parseListIndex(index);
        const elem = context.get(objectId, index);
        if (elem != null && elem[0] == "counter") {
          throw new TypeError("Unsupported operation: deleting a counter from a list");
        }
        context.delete(objectId, index);
        return true;
      },
      has(target, index) {
        const { context, objectId, heads } = target;
        index = parseListIndex(index);
        if (typeof index === "number") {
          return index < context.length(objectId, heads);
        }
        return index === "length";
      },
      getOwnPropertyDescriptor(target, index) {
        const { context, objectId, heads } = target;
        if (index === "length")
          return { writable: true, value: context.length(objectId, heads) };
        if (index === OBJECT_ID)
          return { configurable: false, enumerable: false, value: objectId };
        index = parseListIndex(index);
        const value = valueAt(target, index);
        return { configurable: true, enumerable: true, value };
      },
      getPrototypeOf(target) {
        return Object.getPrototypeOf(target);
      },
      ownKeys() {
        const keys = [];
        keys.push("length");
        return keys;
      }
    };
    TextHandler = Object.assign({}, ListHandler, {
      get(target, index) {
        const { context, objectId, heads } = target;
        index = parseListIndex(index);
        if (index === Symbol.hasInstance) {
          return (instance2) => {
            return Array.isArray(instance2);
          };
        }
        if (index === Symbol.toStringTag) {
          return target[Symbol.toStringTag];
        }
        if (index === OBJECT_ID)
          return objectId;
        if (index === IS_PROXY)
          return true;
        if (index === TRACE)
          return target.trace;
        if (index === STATE)
          return { handle: context };
        if (index === "length")
          return context.length(objectId, heads);
        if (typeof index === "number") {
          return valueAt(target, index);
        } else {
          return textMethods(target)[index] || listMethods(target)[index];
        }
      },
      getPrototypeOf() {
        return Object.getPrototypeOf(new Text());
      }
    });
  }
});

// node_modules/@automerge/automerge/dist/mjs/numbers.js
var init_numbers = __esm({
  "node_modules/@automerge/automerge/dist/mjs/numbers.js"() {
    init_constants();
  }
});

// node_modules/@automerge/automerge/dist/mjs/types.js
var init_types2 = __esm({
  "node_modules/@automerge/automerge/dist/mjs/types.js"() {
    init_text();
    init_counter();
    init_numbers();
  }
});

// node_modules/@automerge/automerge/dist/mjs/low_level.js
function UseApi(api) {
  for (const k in api) {
    ;
    ApiHandler[k] = api[k];
  }
}
var ApiHandler;
var init_low_level = __esm({
  "node_modules/@automerge/automerge/dist/mjs/low_level.js"() {
    ApiHandler = {
      create(textV2, actor) {
        throw new RangeError("Automerge.use() not called");
      },
      load(data, textV2, actor) {
        throw new RangeError("Automerge.use() not called (load)");
      },
      encodeChange(change2) {
        throw new RangeError("Automerge.use() not called (encodeChange)");
      },
      decodeChange(change2) {
        throw new RangeError("Automerge.use() not called (decodeChange)");
      },
      initSyncState() {
        throw new RangeError("Automerge.use() not called (initSyncState)");
      },
      encodeSyncMessage(message) {
        throw new RangeError("Automerge.use() not called (encodeSyncMessage)");
      },
      decodeSyncMessage(msg) {
        throw new RangeError("Automerge.use() not called (decodeSyncMessage)");
      },
      encodeSyncState(state) {
        throw new RangeError("Automerge.use() not called (encodeSyncState)");
      },
      decodeSyncState(data) {
        throw new RangeError("Automerge.use() not called (decodeSyncState)");
      },
      exportSyncState(state) {
        throw new RangeError("Automerge.use() not called (exportSyncState)");
      },
      importSyncState(state) {
        throw new RangeError("Automerge.use() not called (importSyncState)");
      }
    };
  }
});

// node_modules/@automerge/automerge/dist/mjs/internal_state.js
function _state(doc, checkroot = true) {
  if (typeof doc !== "object") {
    throw new RangeError("must be the document root");
  }
  const state = Reflect.get(doc, STATE);
  if (state === void 0 || state == null || checkroot && _obj(doc) !== "_root") {
    throw new RangeError("must be the document root");
  }
  return state;
}
function _obj(doc) {
  if (!(typeof doc === "object") || doc === null) {
    return null;
  }
  return Reflect.get(doc, OBJECT_ID);
}
function _is_proxy(doc) {
  return !!Reflect.get(doc, IS_PROXY);
}
var init_internal_state = __esm({
  "node_modules/@automerge/automerge/dist/mjs/internal_state.js"() {
    init_constants();
  }
});

// node_modules/@automerge/automerge/dist/mjs/conflicts.js
var init_conflicts = __esm({
  "node_modules/@automerge/automerge/dist/mjs/conflicts.js"() {
    init_types2();
    init_text();
    init_proxies();
  }
});

// wasm-deferred:C:\Users\ulyss\Development\nodysseus\node_modules\@automerge\automerge-wasm\bundler\automerge_wasm_bg.wasm
var automerge_wasm_bg_default;
var init_automerge_wasm_bg = __esm({
  "wasm-deferred:C:\\Users\\ulyss\\Development\\nodysseus\\node_modules\\@automerge\\automerge-wasm\\bundler\\automerge_wasm_bg.wasm"() {
    automerge_wasm_bg_default = "./automerge_wasm_bg-XSP6PAF5.wasm";
  }
});

// node_modules/@automerge/automerge-wasm/bundler/automerge_wasm_bg.js
function __wbg_set_wasm(val) {
  wasm = val;
}
function getObject(idx) {
  return heap[idx];
}
function addHeapObject(obj) {
  if (heap_next === heap.length)
    heap.push(heap.length + 1);
  const idx = heap_next;
  heap_next = heap[idx];
  heap[idx] = obj;
  return idx;
}
function dropObject(idx) {
  if (idx < 132)
    return;
  heap[idx] = heap_next;
  heap_next = idx;
}
function takeObject(idx) {
  const ret = getObject(idx);
  dropObject(idx);
  return ret;
}
function getUint8Memory0() {
  if (cachedUint8Memory0 === null || cachedUint8Memory0.byteLength === 0) {
    cachedUint8Memory0 = new Uint8Array(wasm.memory.buffer);
  }
  return cachedUint8Memory0;
}
function getStringFromWasm0(ptr, len) {
  return cachedTextDecoder.decode(getUint8Memory0().subarray(ptr, ptr + len));
}
function passStringToWasm0(arg, malloc, realloc) {
  if (realloc === void 0) {
    const buf = cachedTextEncoder.encode(arg);
    const ptr2 = malloc(buf.length);
    getUint8Memory0().subarray(ptr2, ptr2 + buf.length).set(buf);
    WASM_VECTOR_LEN = buf.length;
    return ptr2;
  }
  let len = arg.length;
  let ptr = malloc(len);
  const mem = getUint8Memory0();
  let offset = 0;
  for (; offset < len; offset++) {
    const code = arg.charCodeAt(offset);
    if (code > 127)
      break;
    mem[ptr + offset] = code;
  }
  if (offset !== len) {
    if (offset !== 0) {
      arg = arg.slice(offset);
    }
    ptr = realloc(ptr, len, len = offset + arg.length * 3);
    const view2 = getUint8Memory0().subarray(ptr + offset, ptr + len);
    const ret = encodeString(arg, view2);
    offset += ret.written;
  }
  WASM_VECTOR_LEN = offset;
  return ptr;
}
function isLikeNone(x) {
  return x === void 0 || x === null;
}
function getInt32Memory0() {
  if (cachedInt32Memory0 === null || cachedInt32Memory0.byteLength === 0) {
    cachedInt32Memory0 = new Int32Array(wasm.memory.buffer);
  }
  return cachedInt32Memory0;
}
function getFloat64Memory0() {
  if (cachedFloat64Memory0 === null || cachedFloat64Memory0.byteLength === 0) {
    cachedFloat64Memory0 = new Float64Array(wasm.memory.buffer);
  }
  return cachedFloat64Memory0;
}
function debugString(val) {
  const type = typeof val;
  if (type == "number" || type == "boolean" || val == null) {
    return `${val}`;
  }
  if (type == "string") {
    return `"${val}"`;
  }
  if (type == "symbol") {
    const description = val.description;
    if (description == null) {
      return "Symbol";
    } else {
      return `Symbol(${description})`;
    }
  }
  if (type == "function") {
    const name = val.name;
    if (typeof name == "string" && name.length > 0) {
      return `Function(${name})`;
    } else {
      return "Function";
    }
  }
  if (Array.isArray(val)) {
    const length = val.length;
    let debug = "[";
    if (length > 0) {
      debug += debugString(val[0]);
    }
    for (let i = 1; i < length; i++) {
      debug += ", " + debugString(val[i]);
    }
    debug += "]";
    return debug;
  }
  const builtInMatches = /\[object ([^\]]+)\]/.exec(toString.call(val));
  let className;
  if (builtInMatches.length > 1) {
    className = builtInMatches[1];
  } else {
    return toString.call(val);
  }
  if (className == "Object") {
    try {
      return "Object(" + JSON.stringify(val) + ")";
    } catch (_) {
      return "Object";
    }
  }
  if (val instanceof Error) {
    return `${val.name}: ${val.message}
${val.stack}`;
  }
  return className;
}
function _assertClass(instance2, klass) {
  if (!(instance2 instanceof klass)) {
    throw new Error(`expected instance of ${klass.name}`);
  }
  return instance2.ptr;
}
function create(text_v2, actor) {
  try {
    const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
    var ptr0 = isLikeNone(actor) ? 0 : passStringToWasm0(actor, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    var len0 = WASM_VECTOR_LEN;
    wasm.create(retptr, text_v2, ptr0, len0);
    var r0 = getInt32Memory0()[retptr / 4 + 0];
    var r1 = getInt32Memory0()[retptr / 4 + 1];
    var r2 = getInt32Memory0()[retptr / 4 + 2];
    if (r2) {
      throw takeObject(r1);
    }
    return Automerge.__wrap(r0);
  } finally {
    wasm.__wbindgen_add_to_stack_pointer(16);
  }
}
function load(data, text_v2, actor) {
  try {
    const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
    var ptr0 = isLikeNone(actor) ? 0 : passStringToWasm0(actor, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    var len0 = WASM_VECTOR_LEN;
    wasm.load(retptr, addHeapObject(data), text_v2, ptr0, len0);
    var r0 = getInt32Memory0()[retptr / 4 + 0];
    var r1 = getInt32Memory0()[retptr / 4 + 1];
    var r2 = getInt32Memory0()[retptr / 4 + 2];
    if (r2) {
      throw takeObject(r1);
    }
    return Automerge.__wrap(r0);
  } finally {
    wasm.__wbindgen_add_to_stack_pointer(16);
  }
}
function encodeChange(change2) {
  try {
    const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
    wasm.encodeChange(retptr, addHeapObject(change2));
    var r0 = getInt32Memory0()[retptr / 4 + 0];
    var r1 = getInt32Memory0()[retptr / 4 + 1];
    var r2 = getInt32Memory0()[retptr / 4 + 2];
    if (r2) {
      throw takeObject(r1);
    }
    return takeObject(r0);
  } finally {
    wasm.__wbindgen_add_to_stack_pointer(16);
  }
}
function decodeChange(change2) {
  try {
    const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
    wasm.decodeChange(retptr, addHeapObject(change2));
    var r0 = getInt32Memory0()[retptr / 4 + 0];
    var r1 = getInt32Memory0()[retptr / 4 + 1];
    var r2 = getInt32Memory0()[retptr / 4 + 2];
    if (r2) {
      throw takeObject(r1);
    }
    return takeObject(r0);
  } finally {
    wasm.__wbindgen_add_to_stack_pointer(16);
  }
}
function initSyncState() {
  const ret = wasm.initSyncState();
  return SyncState.__wrap(ret);
}
function importSyncState(state) {
  try {
    const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
    wasm.importSyncState(retptr, addHeapObject(state));
    var r0 = getInt32Memory0()[retptr / 4 + 0];
    var r1 = getInt32Memory0()[retptr / 4 + 1];
    var r2 = getInt32Memory0()[retptr / 4 + 2];
    if (r2) {
      throw takeObject(r1);
    }
    return SyncState.__wrap(r0);
  } finally {
    wasm.__wbindgen_add_to_stack_pointer(16);
  }
}
function exportSyncState(state) {
  _assertClass(state, SyncState);
  const ret = wasm.exportSyncState(state.ptr);
  return takeObject(ret);
}
function encodeSyncMessage(message) {
  try {
    const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
    wasm.encodeSyncMessage(retptr, addHeapObject(message));
    var r0 = getInt32Memory0()[retptr / 4 + 0];
    var r1 = getInt32Memory0()[retptr / 4 + 1];
    var r2 = getInt32Memory0()[retptr / 4 + 2];
    if (r2) {
      throw takeObject(r1);
    }
    return takeObject(r0);
  } finally {
    wasm.__wbindgen_add_to_stack_pointer(16);
  }
}
function decodeSyncMessage(msg) {
  try {
    const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
    wasm.decodeSyncMessage(retptr, addHeapObject(msg));
    var r0 = getInt32Memory0()[retptr / 4 + 0];
    var r1 = getInt32Memory0()[retptr / 4 + 1];
    var r2 = getInt32Memory0()[retptr / 4 + 2];
    if (r2) {
      throw takeObject(r1);
    }
    return takeObject(r0);
  } finally {
    wasm.__wbindgen_add_to_stack_pointer(16);
  }
}
function encodeSyncState(state) {
  _assertClass(state, SyncState);
  const ret = wasm.encodeSyncState(state.ptr);
  return takeObject(ret);
}
function decodeSyncState(data) {
  try {
    const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
    wasm.decodeSyncState(retptr, addHeapObject(data));
    var r0 = getInt32Memory0()[retptr / 4 + 0];
    var r1 = getInt32Memory0()[retptr / 4 + 1];
    var r2 = getInt32Memory0()[retptr / 4 + 2];
    if (r2) {
      throw takeObject(r1);
    }
    return SyncState.__wrap(r0);
  } finally {
    wasm.__wbindgen_add_to_stack_pointer(16);
  }
}
function handleError(f, args) {
  try {
    return f.apply(this, args);
  } catch (e) {
    wasm.__wbindgen_exn_store(addHeapObject(e));
  }
}
function getArrayU8FromWasm0(ptr, len) {
  return getUint8Memory0().subarray(ptr / 1, ptr / 1 + len);
}
function __wbindgen_object_clone_ref(arg0) {
  const ret = getObject(arg0);
  return addHeapObject(ret);
}
function __wbindgen_object_drop_ref(arg0) {
  takeObject(arg0);
}
function __wbindgen_string_new(arg0, arg1) {
  const ret = getStringFromWasm0(arg0, arg1);
  return addHeapObject(ret);
}
function __wbindgen_is_undefined(arg0) {
  const ret = getObject(arg0) === void 0;
  return ret;
}
function __wbindgen_string_get(arg0, arg1) {
  const obj = getObject(arg1);
  const ret = typeof obj === "string" ? obj : void 0;
  var ptr0 = isLikeNone(ret) ? 0 : passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
  var len0 = WASM_VECTOR_LEN;
  getInt32Memory0()[arg0 / 4 + 1] = len0;
  getInt32Memory0()[arg0 / 4 + 0] = ptr0;
}
function __wbindgen_number_new(arg0) {
  const ret = arg0;
  return addHeapObject(ret);
}
function __wbindgen_is_string(arg0) {
  const ret = typeof getObject(arg0) === "string";
  return ret;
}
function __wbindgen_is_function(arg0) {
  const ret = typeof getObject(arg0) === "function";
  return ret;
}
function __wbindgen_number_get(arg0, arg1) {
  const obj = getObject(arg1);
  const ret = typeof obj === "number" ? obj : void 0;
  getFloat64Memory0()[arg0 / 8 + 1] = isLikeNone(ret) ? 0 : ret;
  getInt32Memory0()[arg0 / 4 + 0] = !isLikeNone(ret);
}
function __wbindgen_is_null(arg0) {
  const ret = getObject(arg0) === null;
  return ret;
}
function __wbindgen_boolean_get(arg0) {
  const v = getObject(arg0);
  const ret = typeof v === "boolean" ? v ? 1 : 0 : 2;
  return ret;
}
function __wbindgen_json_serialize(arg0, arg1) {
  const obj = getObject(arg1);
  const ret = JSON.stringify(obj === void 0 ? null : obj);
  const ptr0 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
  const len0 = WASM_VECTOR_LEN;
  getInt32Memory0()[arg0 / 4 + 1] = len0;
  getInt32Memory0()[arg0 / 4 + 0] = ptr0;
}
function __wbindgen_error_new(arg0, arg1) {
  const ret = new Error(getStringFromWasm0(arg0, arg1));
  return addHeapObject(ret);
}
function __wbg_new_abda76e883ba8a5f() {
  const ret = new Error();
  return addHeapObject(ret);
}
function __wbg_stack_658279fe44541cf6(arg0, arg1) {
  const ret = getObject(arg1).stack;
  const ptr0 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
  const len0 = WASM_VECTOR_LEN;
  getInt32Memory0()[arg0 / 4 + 1] = len0;
  getInt32Memory0()[arg0 / 4 + 0] = ptr0;
}
function __wbg_error_f851667af71bcfc6(arg0, arg1) {
  try {
    console.error(getStringFromWasm0(arg0, arg1));
  } finally {
    wasm.__wbindgen_free(arg0, arg1);
  }
}
function __wbindgen_bigint_from_i64(arg0) {
  const ret = arg0;
  return addHeapObject(ret);
}
function __wbindgen_bigint_from_u64(arg0) {
  const ret = BigInt.asUintN(64, arg0);
  return addHeapObject(ret);
}
function __wbindgen_is_object(arg0) {
  const val = getObject(arg0);
  const ret = typeof val === "object" && val !== null;
  return ret;
}
function __wbindgen_jsval_loose_eq(arg0, arg1) {
  const ret = getObject(arg0) == getObject(arg1);
  return ret;
}
function __wbg_String_91fba7ded13ba54c(arg0, arg1) {
  const ret = String(getObject(arg1));
  const ptr0 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
  const len0 = WASM_VECTOR_LEN;
  getInt32Memory0()[arg0 / 4 + 1] = len0;
  getInt32Memory0()[arg0 / 4 + 0] = ptr0;
}
function __wbg_set_20cbc34131e76824(arg0, arg1, arg2) {
  getObject(arg0)[takeObject(arg1)] = takeObject(arg2);
}
function __wbg_randomFillSync_6894564c2c334c42() {
  return handleError(function(arg0, arg1, arg2) {
    getObject(arg0).randomFillSync(getArrayU8FromWasm0(arg1, arg2));
  }, arguments);
}
function __wbg_getRandomValues_805f1c3d65988a5a() {
  return handleError(function(arg0, arg1) {
    getObject(arg0).getRandomValues(getObject(arg1));
  }, arguments);
}
function __wbg_crypto_e1d53a1d73fb10b8(arg0) {
  const ret = getObject(arg0).crypto;
  return addHeapObject(ret);
}
function __wbg_process_038c26bf42b093f8(arg0) {
  const ret = getObject(arg0).process;
  return addHeapObject(ret);
}
function __wbg_versions_ab37218d2f0b24a8(arg0) {
  const ret = getObject(arg0).versions;
  return addHeapObject(ret);
}
function __wbg_node_080f4b19d15bc1fe(arg0) {
  const ret = getObject(arg0).node;
  return addHeapObject(ret);
}
function __wbg_msCrypto_6e7d3e1f92610cbb(arg0) {
  const ret = getObject(arg0).msCrypto;
  return addHeapObject(ret);
}
function __wbg_require_78a3dcfbdba9cbce() {
  return handleError(function() {
    const ret = module.require;
    return addHeapObject(ret);
  }, arguments);
}
function __wbg_log_7bb108d119bafbc1(arg0) {
  console.log(getObject(arg0));
}
function __wbg_log_d047cf0648d2678e(arg0, arg1) {
  console.log(getObject(arg0), getObject(arg1));
}
function __wbg_get_27fe3dac1c4d0224(arg0, arg1) {
  const ret = getObject(arg0)[arg1 >>> 0];
  return addHeapObject(ret);
}
function __wbg_length_e498fbc24f9c1d4f(arg0) {
  const ret = getObject(arg0).length;
  return ret;
}
function __wbg_new_b525de17f44a8943() {
  const ret = new Array();
  return addHeapObject(ret);
}
function __wbg_newnoargs_2b8b6bd7753c76ba(arg0, arg1) {
  const ret = new Function(getStringFromWasm0(arg0, arg1));
  return addHeapObject(ret);
}
function __wbg_next_b7d530c04fd8b217(arg0) {
  const ret = getObject(arg0).next;
  return addHeapObject(ret);
}
function __wbg_next_88560ec06a094dea() {
  return handleError(function(arg0) {
    const ret = getObject(arg0).next();
    return addHeapObject(ret);
  }, arguments);
}
function __wbg_done_1ebec03bbd919843(arg0) {
  const ret = getObject(arg0).done;
  return ret;
}
function __wbg_value_6ac8da5cc5b3efda(arg0) {
  const ret = getObject(arg0).value;
  return addHeapObject(ret);
}
function __wbg_iterator_55f114446221aa5a() {
  const ret = Symbol.iterator;
  return addHeapObject(ret);
}
function __wbg_get_baf4855f9a986186() {
  return handleError(function(arg0, arg1) {
    const ret = Reflect.get(getObject(arg0), getObject(arg1));
    return addHeapObject(ret);
  }, arguments);
}
function __wbg_call_95d1ea488d03e4e8() {
  return handleError(function(arg0, arg1) {
    const ret = getObject(arg0).call(getObject(arg1));
    return addHeapObject(ret);
  }, arguments);
}
function __wbg_new_f9876326328f45ed() {
  const ret = new Object();
  return addHeapObject(ret);
}
function __wbg_length_ea0846e494e3b16e(arg0) {
  const ret = getObject(arg0).length;
  return ret;
}
function __wbg_self_e7c1f827057f6584() {
  return handleError(function() {
    const ret = self.self;
    return addHeapObject(ret);
  }, arguments);
}
function __wbg_window_a09ec664e14b1b81() {
  return handleError(function() {
    const ret = window.window;
    return addHeapObject(ret);
  }, arguments);
}
function __wbg_globalThis_87cbb8506fecf3a9() {
  return handleError(function() {
    const ret = globalThis.globalThis;
    return addHeapObject(ret);
  }, arguments);
}
function __wbg_global_c85a9259e621f3db() {
  return handleError(function() {
    const ret = global.global;
    return addHeapObject(ret);
  }, arguments);
}
function __wbg_set_17224bc548dd1d7b(arg0, arg1, arg2) {
  getObject(arg0)[arg1 >>> 0] = takeObject(arg2);
}
function __wbg_from_67ca20fa722467e6(arg0) {
  const ret = Array.from(getObject(arg0));
  return addHeapObject(ret);
}
function __wbg_isArray_39d28997bf6b96b4(arg0) {
  const ret = Array.isArray(getObject(arg0));
  return ret;
}
function __wbg_push_49c286f04dd3bf59(arg0, arg1) {
  const ret = getObject(arg0).push(getObject(arg1));
  return ret;
}
function __wbg_unshift_06a94bcbcb492eb3(arg0, arg1) {
  const ret = getObject(arg0).unshift(getObject(arg1));
  return ret;
}
function __wbg_instanceof_ArrayBuffer_a69f02ee4c4f5065(arg0) {
  let result;
  try {
    result = getObject(arg0) instanceof ArrayBuffer;
  } catch {
    result = false;
  }
  const ret = result;
  return ret;
}
function __wbg_new_15d3966e9981a196(arg0, arg1) {
  const ret = new Error(getStringFromWasm0(arg0, arg1));
  return addHeapObject(ret);
}
function __wbg_call_9495de66fdbe016b() {
  return handleError(function(arg0, arg1, arg2) {
    const ret = getObject(arg0).call(getObject(arg1), getObject(arg2));
    return addHeapObject(ret);
  }, arguments);
}
function __wbg_call_99043a1e2a9e5916() {
  return handleError(function(arg0, arg1, arg2, arg3, arg4) {
    const ret = getObject(arg0).call(getObject(arg1), getObject(arg2), getObject(arg3), getObject(arg4));
    return addHeapObject(ret);
  }, arguments);
}
function __wbg_instanceof_Date_e353425d719aa266(arg0) {
  let result;
  try {
    result = getObject(arg0) instanceof Date;
  } catch {
    result = false;
  }
  const ret = result;
  return ret;
}
function __wbg_getTime_7c59072d1651a3cf(arg0) {
  const ret = getObject(arg0).getTime();
  return ret;
}
function __wbg_new_f127e324c1313064(arg0) {
  const ret = new Date(getObject(arg0));
  return addHeapObject(ret);
}
function __wbg_instanceof_Object_f5a826c4da0d4a94(arg0) {
  let result;
  try {
    result = getObject(arg0) instanceof Object;
  } catch {
    result = false;
  }
  const ret = result;
  return ret;
}
function __wbg_assign_b0b6530984f36574(arg0, arg1) {
  const ret = Object.assign(getObject(arg0), getObject(arg1));
  return addHeapObject(ret);
}
function __wbg_defineProperty_4926f24c724d5310(arg0, arg1, arg2) {
  const ret = Object.defineProperty(getObject(arg0), getObject(arg1), getObject(arg2));
  return addHeapObject(ret);
}
function __wbg_entries_4e1315b774245952(arg0) {
  const ret = Object.entries(getObject(arg0));
  return addHeapObject(ret);
}
function __wbg_freeze_4dcdbf0b5d9b50f4(arg0) {
  const ret = Object.freeze(getObject(arg0));
  return addHeapObject(ret);
}
function __wbg_keys_60443f4f867207f9(arg0) {
  const ret = Object.keys(getObject(arg0));
  return addHeapObject(ret);
}
function __wbg_values_7444c4c2ccefdc9b(arg0) {
  const ret = Object.values(getObject(arg0));
  return addHeapObject(ret);
}
function __wbg_concat_040af6c9ba38dd98(arg0, arg1) {
  const ret = getObject(arg0).concat(getObject(arg1));
  return addHeapObject(ret);
}
function __wbg_slice_47202b1d012cdc55(arg0, arg1, arg2) {
  const ret = getObject(arg0).slice(arg1 >>> 0, arg2 >>> 0);
  return addHeapObject(ret);
}
function __wbg_for_9a885d0d6d415e40(arg0, arg1) {
  const ret = Symbol.for(getStringFromWasm0(arg0, arg1));
  return addHeapObject(ret);
}
function __wbg_toString_7a3e0cd68ea2a337(arg0) {
  const ret = getObject(arg0).toString();
  return addHeapObject(ret);
}
function __wbg_buffer_cf65c07de34b9a08(arg0) {
  const ret = getObject(arg0).buffer;
  return addHeapObject(ret);
}
function __wbg_newwithbyteoffsetandlength_9fb2f11355ecadf5(arg0, arg1, arg2) {
  const ret = new Uint8Array(getObject(arg0), arg1 >>> 0, arg2 >>> 0);
  return addHeapObject(ret);
}
function __wbg_new_537b7341ce90bb31(arg0) {
  const ret = new Uint8Array(getObject(arg0));
  return addHeapObject(ret);
}
function __wbg_set_17499e8aa4003ebd(arg0, arg1, arg2) {
  getObject(arg0).set(getObject(arg1), arg2 >>> 0);
}
function __wbg_length_27a2afe8ab42b09f(arg0) {
  const ret = getObject(arg0).length;
  return ret;
}
function __wbg_instanceof_Uint8Array_01cebe79ca606cca(arg0) {
  let result;
  try {
    result = getObject(arg0) instanceof Uint8Array;
  } catch {
    result = false;
  }
  const ret = result;
  return ret;
}
function __wbg_newwithlength_b56c882b57805732(arg0) {
  const ret = new Uint8Array(arg0 >>> 0);
  return addHeapObject(ret);
}
function __wbg_subarray_7526649b91a252a6(arg0, arg1, arg2) {
  const ret = getObject(arg0).subarray(arg1 >>> 0, arg2 >>> 0);
  return addHeapObject(ret);
}
function __wbg_apply_5435e78b95a524a6() {
  return handleError(function(arg0, arg1, arg2) {
    const ret = Reflect.apply(getObject(arg0), getObject(arg1), getObject(arg2));
    return addHeapObject(ret);
  }, arguments);
}
function __wbg_deleteProperty_31090878b92a7c0e() {
  return handleError(function(arg0, arg1) {
    const ret = Reflect.deleteProperty(getObject(arg0), getObject(arg1));
    return ret;
  }, arguments);
}
function __wbg_ownKeys_9efe69be404540aa() {
  return handleError(function(arg0) {
    const ret = Reflect.ownKeys(getObject(arg0));
    return addHeapObject(ret);
  }, arguments);
}
function __wbg_set_6aa458a4ebdb65cb() {
  return handleError(function(arg0, arg1, arg2) {
    const ret = Reflect.set(getObject(arg0), getObject(arg1), getObject(arg2));
    return ret;
  }, arguments);
}
function __wbindgen_debug_string(arg0, arg1) {
  const ret = debugString(getObject(arg1));
  const ptr0 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
  const len0 = WASM_VECTOR_LEN;
  getInt32Memory0()[arg0 / 4 + 1] = len0;
  getInt32Memory0()[arg0 / 4 + 0] = ptr0;
}
function __wbindgen_throw(arg0, arg1) {
  throw new Error(getStringFromWasm0(arg0, arg1));
}
function __wbindgen_memory() {
  const ret = wasm.memory;
  return addHeapObject(ret);
}
var wasm, heap, heap_next, lTextDecoder, cachedTextDecoder, cachedUint8Memory0, WASM_VECTOR_LEN, lTextEncoder, cachedTextEncoder, encodeString, cachedInt32Memory0, cachedFloat64Memory0, TextRepresentation, AutomergeFinalization, Automerge, SyncStateFinalization, SyncState;
var init_automerge_wasm_bg2 = __esm({
  "node_modules/@automerge/automerge-wasm/bundler/automerge_wasm_bg.js"() {
    heap = new Array(128).fill(void 0);
    heap.push(void 0, null, true, false);
    heap_next = heap.length;
    lTextDecoder = typeof TextDecoder === "undefined" ? (0, module.require)("util").TextDecoder : TextDecoder;
    cachedTextDecoder = new lTextDecoder("utf-8", { ignoreBOM: true, fatal: true });
    cachedTextDecoder.decode();
    cachedUint8Memory0 = null;
    WASM_VECTOR_LEN = 0;
    lTextEncoder = typeof TextEncoder === "undefined" ? (0, module.require)("util").TextEncoder : TextEncoder;
    cachedTextEncoder = new lTextEncoder("utf-8");
    encodeString = typeof cachedTextEncoder.encodeInto === "function" ? function(arg, view2) {
      return cachedTextEncoder.encodeInto(arg, view2);
    } : function(arg, view2) {
      const buf = cachedTextEncoder.encode(arg);
      view2.set(buf);
      return {
        read: arg.length,
        written: buf.length
      };
    };
    cachedInt32Memory0 = null;
    cachedFloat64Memory0 = null;
    TextRepresentation = Object.freeze({
      /**
      * As an array of characters and objects
      */
      Array: 0,
      "0": "Array",
      /**
      * As a single JS string
      */
      String: 1,
      "1": "String"
    });
    AutomergeFinalization = new FinalizationRegistry((ptr) => wasm.__wbg_automerge_free(ptr));
    Automerge = class {
      static __wrap(ptr) {
        const obj = Object.create(Automerge.prototype);
        obj.ptr = ptr;
        AutomergeFinalization.register(obj, obj.ptr, obj);
        return obj;
      }
      __destroy_into_raw() {
        const ptr = this.ptr;
        this.ptr = 0;
        AutomergeFinalization.unregister(this);
        return ptr;
      }
      free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_automerge_free(ptr);
      }
      /**
      * @param {string | undefined} actor
      * @param {number} text_rep
      * @returns {Automerge}
      */
      static new(actor, text_rep) {
        try {
          const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
          var ptr0 = isLikeNone(actor) ? 0 : passStringToWasm0(actor, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
          var len0 = WASM_VECTOR_LEN;
          wasm.automerge_new(retptr, ptr0, len0, text_rep);
          var r0 = getInt32Memory0()[retptr / 4 + 0];
          var r1 = getInt32Memory0()[retptr / 4 + 1];
          var r2 = getInt32Memory0()[retptr / 4 + 2];
          if (r2) {
            throw takeObject(r1);
          }
          return Automerge.__wrap(r0);
        } finally {
          wasm.__wbindgen_add_to_stack_pointer(16);
        }
      }
      /**
      * @param {string | undefined} actor
      * @returns {Automerge}
      */
      clone(actor) {
        try {
          const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
          var ptr0 = isLikeNone(actor) ? 0 : passStringToWasm0(actor, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
          var len0 = WASM_VECTOR_LEN;
          wasm.automerge_clone(retptr, this.ptr, ptr0, len0);
          var r0 = getInt32Memory0()[retptr / 4 + 0];
          var r1 = getInt32Memory0()[retptr / 4 + 1];
          var r2 = getInt32Memory0()[retptr / 4 + 2];
          if (r2) {
            throw takeObject(r1);
          }
          return Automerge.__wrap(r0);
        } finally {
          wasm.__wbindgen_add_to_stack_pointer(16);
        }
      }
      /**
      * @param {string | undefined} actor
      * @param {any} heads
      * @returns {Automerge}
      */
      fork(actor, heads) {
        try {
          const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
          var ptr0 = isLikeNone(actor) ? 0 : passStringToWasm0(actor, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
          var len0 = WASM_VECTOR_LEN;
          wasm.automerge_fork(retptr, this.ptr, ptr0, len0, addHeapObject(heads));
          var r0 = getInt32Memory0()[retptr / 4 + 0];
          var r1 = getInt32Memory0()[retptr / 4 + 1];
          var r2 = getInt32Memory0()[retptr / 4 + 2];
          if (r2) {
            throw takeObject(r1);
          }
          return Automerge.__wrap(r0);
        } finally {
          wasm.__wbindgen_add_to_stack_pointer(16);
        }
      }
      /**
      * @returns {any}
      */
      pendingOps() {
        const ret = wasm.automerge_pendingOps(this.ptr);
        return takeObject(ret);
      }
      /**
      * @param {string | undefined} message
      * @param {number | undefined} time
      * @returns {any}
      */
      commit(message, time) {
        var ptr0 = isLikeNone(message) ? 0 : passStringToWasm0(message, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        var len0 = WASM_VECTOR_LEN;
        const ret = wasm.automerge_commit(this.ptr, ptr0, len0, !isLikeNone(time), isLikeNone(time) ? 0 : time);
        return takeObject(ret);
      }
      /**
      * @param {Automerge} other
      * @returns {Array<any>}
      */
      merge(other) {
        try {
          const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
          _assertClass(other, Automerge);
          wasm.automerge_merge(retptr, this.ptr, other.ptr);
          var r0 = getInt32Memory0()[retptr / 4 + 0];
          var r1 = getInt32Memory0()[retptr / 4 + 1];
          var r2 = getInt32Memory0()[retptr / 4 + 2];
          if (r2) {
            throw takeObject(r1);
          }
          return takeObject(r0);
        } finally {
          wasm.__wbindgen_add_to_stack_pointer(16);
        }
      }
      /**
      * @returns {number}
      */
      rollback() {
        const ret = wasm.automerge_rollback(this.ptr);
        return ret;
      }
      /**
      * @param {any} obj
      * @param {Array<any> | undefined} heads
      * @returns {Array<any>}
      */
      keys(obj, heads) {
        try {
          const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
          wasm.automerge_keys(retptr, this.ptr, addHeapObject(obj), isLikeNone(heads) ? 0 : addHeapObject(heads));
          var r0 = getInt32Memory0()[retptr / 4 + 0];
          var r1 = getInt32Memory0()[retptr / 4 + 1];
          var r2 = getInt32Memory0()[retptr / 4 + 2];
          if (r2) {
            throw takeObject(r1);
          }
          return takeObject(r0);
        } finally {
          wasm.__wbindgen_add_to_stack_pointer(16);
        }
      }
      /**
      * @param {any} obj
      * @param {Array<any> | undefined} heads
      * @returns {string}
      */
      text(obj, heads) {
        try {
          const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
          wasm.automerge_text(retptr, this.ptr, addHeapObject(obj), isLikeNone(heads) ? 0 : addHeapObject(heads));
          var r0 = getInt32Memory0()[retptr / 4 + 0];
          var r1 = getInt32Memory0()[retptr / 4 + 1];
          var r2 = getInt32Memory0()[retptr / 4 + 2];
          var r3 = getInt32Memory0()[retptr / 4 + 3];
          var ptr0 = r0;
          var len0 = r1;
          if (r3) {
            ptr0 = 0;
            len0 = 0;
            throw takeObject(r2);
          }
          return getStringFromWasm0(ptr0, len0);
        } finally {
          wasm.__wbindgen_add_to_stack_pointer(16);
          wasm.__wbindgen_free(ptr0, len0);
        }
      }
      /**
      * @param {any} obj
      * @param {number} start
      * @param {number} delete_count
      * @param {any} text
      */
      splice(obj, start, delete_count, text) {
        try {
          const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
          wasm.automerge_splice(retptr, this.ptr, addHeapObject(obj), start, delete_count, addHeapObject(text));
          var r0 = getInt32Memory0()[retptr / 4 + 0];
          var r1 = getInt32Memory0()[retptr / 4 + 1];
          if (r1) {
            throw takeObject(r0);
          }
        } finally {
          wasm.__wbindgen_add_to_stack_pointer(16);
        }
      }
      /**
      * @param {any} obj
      * @param {any} value
      * @param {any} datatype
      */
      push(obj, value, datatype) {
        try {
          const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
          wasm.automerge_push(retptr, this.ptr, addHeapObject(obj), addHeapObject(value), addHeapObject(datatype));
          var r0 = getInt32Memory0()[retptr / 4 + 0];
          var r1 = getInt32Memory0()[retptr / 4 + 1];
          if (r1) {
            throw takeObject(r0);
          }
        } finally {
          wasm.__wbindgen_add_to_stack_pointer(16);
        }
      }
      /**
      * @param {any} obj
      * @param {any} value
      * @returns {string | undefined}
      */
      pushObject(obj, value) {
        try {
          const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
          wasm.automerge_pushObject(retptr, this.ptr, addHeapObject(obj), addHeapObject(value));
          var r0 = getInt32Memory0()[retptr / 4 + 0];
          var r1 = getInt32Memory0()[retptr / 4 + 1];
          var r2 = getInt32Memory0()[retptr / 4 + 2];
          var r3 = getInt32Memory0()[retptr / 4 + 3];
          if (r3) {
            throw takeObject(r2);
          }
          let v0;
          if (r0 !== 0) {
            v0 = getStringFromWasm0(r0, r1).slice();
            wasm.__wbindgen_free(r0, r1 * 1);
          }
          return v0;
        } finally {
          wasm.__wbindgen_add_to_stack_pointer(16);
        }
      }
      /**
      * @param {any} obj
      * @param {number} index
      * @param {any} value
      * @param {any} datatype
      */
      insert(obj, index, value, datatype) {
        try {
          const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
          wasm.automerge_insert(retptr, this.ptr, addHeapObject(obj), index, addHeapObject(value), addHeapObject(datatype));
          var r0 = getInt32Memory0()[retptr / 4 + 0];
          var r1 = getInt32Memory0()[retptr / 4 + 1];
          if (r1) {
            throw takeObject(r0);
          }
        } finally {
          wasm.__wbindgen_add_to_stack_pointer(16);
        }
      }
      /**
      * @param {any} obj
      * @param {number} index
      * @param {any} value
      * @returns {string | undefined}
      */
      insertObject(obj, index, value) {
        try {
          const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
          wasm.automerge_insertObject(retptr, this.ptr, addHeapObject(obj), index, addHeapObject(value));
          var r0 = getInt32Memory0()[retptr / 4 + 0];
          var r1 = getInt32Memory0()[retptr / 4 + 1];
          var r2 = getInt32Memory0()[retptr / 4 + 2];
          var r3 = getInt32Memory0()[retptr / 4 + 3];
          if (r3) {
            throw takeObject(r2);
          }
          let v0;
          if (r0 !== 0) {
            v0 = getStringFromWasm0(r0, r1).slice();
            wasm.__wbindgen_free(r0, r1 * 1);
          }
          return v0;
        } finally {
          wasm.__wbindgen_add_to_stack_pointer(16);
        }
      }
      /**
      * @param {any} obj
      * @param {any} prop
      * @param {any} value
      * @param {any} datatype
      */
      put(obj, prop, value, datatype) {
        try {
          const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
          wasm.automerge_put(retptr, this.ptr, addHeapObject(obj), addHeapObject(prop), addHeapObject(value), addHeapObject(datatype));
          var r0 = getInt32Memory0()[retptr / 4 + 0];
          var r1 = getInt32Memory0()[retptr / 4 + 1];
          if (r1) {
            throw takeObject(r0);
          }
        } finally {
          wasm.__wbindgen_add_to_stack_pointer(16);
        }
      }
      /**
      * @param {any} obj
      * @param {any} prop
      * @param {any} value
      * @returns {any}
      */
      putObject(obj, prop, value) {
        try {
          const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
          wasm.automerge_putObject(retptr, this.ptr, addHeapObject(obj), addHeapObject(prop), addHeapObject(value));
          var r0 = getInt32Memory0()[retptr / 4 + 0];
          var r1 = getInt32Memory0()[retptr / 4 + 1];
          var r2 = getInt32Memory0()[retptr / 4 + 2];
          if (r2) {
            throw takeObject(r1);
          }
          return takeObject(r0);
        } finally {
          wasm.__wbindgen_add_to_stack_pointer(16);
        }
      }
      /**
      * @param {any} obj
      * @param {any} prop
      * @param {any} value
      */
      increment(obj, prop, value) {
        try {
          const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
          wasm.automerge_increment(retptr, this.ptr, addHeapObject(obj), addHeapObject(prop), addHeapObject(value));
          var r0 = getInt32Memory0()[retptr / 4 + 0];
          var r1 = getInt32Memory0()[retptr / 4 + 1];
          if (r1) {
            throw takeObject(r0);
          }
        } finally {
          wasm.__wbindgen_add_to_stack_pointer(16);
        }
      }
      /**
      * @param {any} obj
      * @param {any} prop
      * @param {Array<any> | undefined} heads
      * @returns {any}
      */
      get(obj, prop, heads) {
        try {
          const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
          wasm.automerge_get(retptr, this.ptr, addHeapObject(obj), addHeapObject(prop), isLikeNone(heads) ? 0 : addHeapObject(heads));
          var r0 = getInt32Memory0()[retptr / 4 + 0];
          var r1 = getInt32Memory0()[retptr / 4 + 1];
          var r2 = getInt32Memory0()[retptr / 4 + 2];
          if (r2) {
            throw takeObject(r1);
          }
          return takeObject(r0);
        } finally {
          wasm.__wbindgen_add_to_stack_pointer(16);
        }
      }
      /**
      * @param {any} obj
      * @param {any} prop
      * @param {Array<any> | undefined} heads
      * @returns {any}
      */
      getWithType(obj, prop, heads) {
        try {
          const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
          wasm.automerge_getWithType(retptr, this.ptr, addHeapObject(obj), addHeapObject(prop), isLikeNone(heads) ? 0 : addHeapObject(heads));
          var r0 = getInt32Memory0()[retptr / 4 + 0];
          var r1 = getInt32Memory0()[retptr / 4 + 1];
          var r2 = getInt32Memory0()[retptr / 4 + 2];
          if (r2) {
            throw takeObject(r1);
          }
          return takeObject(r0);
        } finally {
          wasm.__wbindgen_add_to_stack_pointer(16);
        }
      }
      /**
      * @param {any} obj
      * @param {any} arg
      * @param {Array<any> | undefined} heads
      * @returns {Array<any>}
      */
      getAll(obj, arg, heads) {
        try {
          const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
          wasm.automerge_getAll(retptr, this.ptr, addHeapObject(obj), addHeapObject(arg), isLikeNone(heads) ? 0 : addHeapObject(heads));
          var r0 = getInt32Memory0()[retptr / 4 + 0];
          var r1 = getInt32Memory0()[retptr / 4 + 1];
          var r2 = getInt32Memory0()[retptr / 4 + 2];
          if (r2) {
            throw takeObject(r1);
          }
          return takeObject(r0);
        } finally {
          wasm.__wbindgen_add_to_stack_pointer(16);
        }
      }
      /**
      * @param {any} enable
      * @returns {any}
      */
      enableFreeze(enable) {
        try {
          const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
          wasm.automerge_enableFreeze(retptr, this.ptr, addHeapObject(enable));
          var r0 = getInt32Memory0()[retptr / 4 + 0];
          var r1 = getInt32Memory0()[retptr / 4 + 1];
          var r2 = getInt32Memory0()[retptr / 4 + 2];
          if (r2) {
            throw takeObject(r1);
          }
          return takeObject(r0);
        } finally {
          wasm.__wbindgen_add_to_stack_pointer(16);
        }
      }
      /**
      * @param {any} enable
      * @returns {any}
      */
      enablePatches(enable) {
        try {
          const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
          wasm.automerge_enablePatches(retptr, this.ptr, addHeapObject(enable));
          var r0 = getInt32Memory0()[retptr / 4 + 0];
          var r1 = getInt32Memory0()[retptr / 4 + 1];
          var r2 = getInt32Memory0()[retptr / 4 + 2];
          if (r2) {
            throw takeObject(r1);
          }
          return takeObject(r0);
        } finally {
          wasm.__wbindgen_add_to_stack_pointer(16);
        }
      }
      /**
      * @param {any} datatype
      * @param {any} _function
      */
      registerDatatype(datatype, _function) {
        try {
          const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
          wasm.automerge_registerDatatype(retptr, this.ptr, addHeapObject(datatype), addHeapObject(_function));
          var r0 = getInt32Memory0()[retptr / 4 + 0];
          var r1 = getInt32Memory0()[retptr / 4 + 1];
          if (r1) {
            throw takeObject(r0);
          }
        } finally {
          wasm.__wbindgen_add_to_stack_pointer(16);
        }
      }
      /**
      * @param {any} object
      * @param {any} meta
      * @param {any} callback
      * @returns {any}
      */
      applyPatches(object, meta, callback) {
        try {
          const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
          wasm.automerge_applyPatches(retptr, this.ptr, addHeapObject(object), addHeapObject(meta), addHeapObject(callback));
          var r0 = getInt32Memory0()[retptr / 4 + 0];
          var r1 = getInt32Memory0()[retptr / 4 + 1];
          var r2 = getInt32Memory0()[retptr / 4 + 2];
          if (r2) {
            throw takeObject(r1);
          }
          return takeObject(r0);
        } finally {
          wasm.__wbindgen_add_to_stack_pointer(16);
        }
      }
      /**
      * @returns {Array<any>}
      */
      popPatches() {
        try {
          const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
          wasm.automerge_popPatches(retptr, this.ptr);
          var r0 = getInt32Memory0()[retptr / 4 + 0];
          var r1 = getInt32Memory0()[retptr / 4 + 1];
          var r2 = getInt32Memory0()[retptr / 4 + 2];
          if (r2) {
            throw takeObject(r1);
          }
          return takeObject(r0);
        } finally {
          wasm.__wbindgen_add_to_stack_pointer(16);
        }
      }
      /**
      * @param {any} obj
      * @param {Array<any> | undefined} heads
      * @returns {number}
      */
      length(obj, heads) {
        try {
          const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
          wasm.automerge_length(retptr, this.ptr, addHeapObject(obj), isLikeNone(heads) ? 0 : addHeapObject(heads));
          var r0 = getFloat64Memory0()[retptr / 8 + 0];
          var r2 = getInt32Memory0()[retptr / 4 + 2];
          var r3 = getInt32Memory0()[retptr / 4 + 3];
          if (r3) {
            throw takeObject(r2);
          }
          return r0;
        } finally {
          wasm.__wbindgen_add_to_stack_pointer(16);
        }
      }
      /**
      * @param {any} obj
      * @param {any} prop
      */
      delete(obj, prop) {
        try {
          const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
          wasm.automerge_delete(retptr, this.ptr, addHeapObject(obj), addHeapObject(prop));
          var r0 = getInt32Memory0()[retptr / 4 + 0];
          var r1 = getInt32Memory0()[retptr / 4 + 1];
          if (r1) {
            throw takeObject(r0);
          }
        } finally {
          wasm.__wbindgen_add_to_stack_pointer(16);
        }
      }
      /**
      * @returns {Uint8Array}
      */
      save() {
        const ret = wasm.automerge_save(this.ptr);
        return takeObject(ret);
      }
      /**
      * @returns {Uint8Array}
      */
      saveIncremental() {
        const ret = wasm.automerge_saveIncremental(this.ptr);
        return takeObject(ret);
      }
      /**
      * @param {Uint8Array} data
      * @returns {number}
      */
      loadIncremental(data) {
        try {
          const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
          wasm.automerge_loadIncremental(retptr, this.ptr, addHeapObject(data));
          var r0 = getFloat64Memory0()[retptr / 8 + 0];
          var r2 = getInt32Memory0()[retptr / 4 + 2];
          var r3 = getInt32Memory0()[retptr / 4 + 3];
          if (r3) {
            throw takeObject(r2);
          }
          return r0;
        } finally {
          wasm.__wbindgen_add_to_stack_pointer(16);
        }
      }
      /**
      * @param {any} changes
      */
      applyChanges(changes) {
        try {
          const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
          wasm.automerge_applyChanges(retptr, this.ptr, addHeapObject(changes));
          var r0 = getInt32Memory0()[retptr / 4 + 0];
          var r1 = getInt32Memory0()[retptr / 4 + 1];
          if (r1) {
            throw takeObject(r0);
          }
        } finally {
          wasm.__wbindgen_add_to_stack_pointer(16);
        }
      }
      /**
      * @param {any} have_deps
      * @returns {Array<any>}
      */
      getChanges(have_deps) {
        try {
          const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
          wasm.automerge_getChanges(retptr, this.ptr, addHeapObject(have_deps));
          var r0 = getInt32Memory0()[retptr / 4 + 0];
          var r1 = getInt32Memory0()[retptr / 4 + 1];
          var r2 = getInt32Memory0()[retptr / 4 + 2];
          if (r2) {
            throw takeObject(r1);
          }
          return takeObject(r0);
        } finally {
          wasm.__wbindgen_add_to_stack_pointer(16);
        }
      }
      /**
      * @param {any} hash
      * @returns {any}
      */
      getChangeByHash(hash) {
        try {
          const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
          wasm.automerge_getChangeByHash(retptr, this.ptr, addHeapObject(hash));
          var r0 = getInt32Memory0()[retptr / 4 + 0];
          var r1 = getInt32Memory0()[retptr / 4 + 1];
          var r2 = getInt32Memory0()[retptr / 4 + 2];
          if (r2) {
            throw takeObject(r1);
          }
          return takeObject(r0);
        } finally {
          wasm.__wbindgen_add_to_stack_pointer(16);
        }
      }
      /**
      * @param {Automerge} other
      * @returns {Array<any>}
      */
      getChangesAdded(other) {
        _assertClass(other, Automerge);
        const ret = wasm.automerge_getChangesAdded(this.ptr, other.ptr);
        return takeObject(ret);
      }
      /**
      * @returns {Array<any>}
      */
      getHeads() {
        const ret = wasm.automerge_getHeads(this.ptr);
        return takeObject(ret);
      }
      /**
      * @returns {string}
      */
      getActorId() {
        try {
          const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
          wasm.automerge_getActorId(retptr, this.ptr);
          var r0 = getInt32Memory0()[retptr / 4 + 0];
          var r1 = getInt32Memory0()[retptr / 4 + 1];
          return getStringFromWasm0(r0, r1);
        } finally {
          wasm.__wbindgen_add_to_stack_pointer(16);
          wasm.__wbindgen_free(r0, r1);
        }
      }
      /**
      * @returns {any}
      */
      getLastLocalChange() {
        const ret = wasm.automerge_getLastLocalChange(this.ptr);
        return takeObject(ret);
      }
      /**
      */
      dump() {
        wasm.automerge_dump(this.ptr);
      }
      /**
      * @param {Array<any> | undefined} heads
      * @returns {Array<any>}
      */
      getMissingDeps(heads) {
        try {
          const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
          wasm.automerge_getMissingDeps(retptr, this.ptr, isLikeNone(heads) ? 0 : addHeapObject(heads));
          var r0 = getInt32Memory0()[retptr / 4 + 0];
          var r1 = getInt32Memory0()[retptr / 4 + 1];
          var r2 = getInt32Memory0()[retptr / 4 + 2];
          if (r2) {
            throw takeObject(r1);
          }
          return takeObject(r0);
        } finally {
          wasm.__wbindgen_add_to_stack_pointer(16);
        }
      }
      /**
      * @param {SyncState} state
      * @param {Uint8Array} message
      */
      receiveSyncMessage(state, message) {
        try {
          const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
          _assertClass(state, SyncState);
          wasm.automerge_receiveSyncMessage(retptr, this.ptr, state.ptr, addHeapObject(message));
          var r0 = getInt32Memory0()[retptr / 4 + 0];
          var r1 = getInt32Memory0()[retptr / 4 + 1];
          if (r1) {
            throw takeObject(r0);
          }
        } finally {
          wasm.__wbindgen_add_to_stack_pointer(16);
        }
      }
      /**
      * @param {SyncState} state
      * @returns {any}
      */
      generateSyncMessage(state) {
        _assertClass(state, SyncState);
        const ret = wasm.automerge_generateSyncMessage(this.ptr, state.ptr);
        return takeObject(ret);
      }
      /**
      * @param {any} meta
      * @returns {any}
      */
      toJS(meta) {
        try {
          const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
          wasm.automerge_toJS(retptr, this.ptr, addHeapObject(meta));
          var r0 = getInt32Memory0()[retptr / 4 + 0];
          var r1 = getInt32Memory0()[retptr / 4 + 1];
          var r2 = getInt32Memory0()[retptr / 4 + 2];
          if (r2) {
            throw takeObject(r1);
          }
          return takeObject(r0);
        } finally {
          wasm.__wbindgen_add_to_stack_pointer(16);
        }
      }
      /**
      * @param {any} obj
      * @param {Array<any> | undefined} heads
      * @param {any} meta
      * @returns {any}
      */
      materialize(obj, heads, meta) {
        try {
          const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
          wasm.automerge_materialize(retptr, this.ptr, addHeapObject(obj), isLikeNone(heads) ? 0 : addHeapObject(heads), addHeapObject(meta));
          var r0 = getInt32Memory0()[retptr / 4 + 0];
          var r1 = getInt32Memory0()[retptr / 4 + 1];
          var r2 = getInt32Memory0()[retptr / 4 + 2];
          if (r2) {
            throw takeObject(r1);
          }
          return takeObject(r0);
        } finally {
          wasm.__wbindgen_add_to_stack_pointer(16);
        }
      }
      /**
      * @param {string | undefined} message
      * @param {number | undefined} time
      * @returns {any}
      */
      emptyChange(message, time) {
        var ptr0 = isLikeNone(message) ? 0 : passStringToWasm0(message, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        var len0 = WASM_VECTOR_LEN;
        const ret = wasm.automerge_emptyChange(this.ptr, ptr0, len0, !isLikeNone(time), isLikeNone(time) ? 0 : time);
        return takeObject(ret);
      }
    };
    SyncStateFinalization = new FinalizationRegistry((ptr) => wasm.__wbg_syncstate_free(ptr));
    SyncState = class {
      static __wrap(ptr) {
        const obj = Object.create(SyncState.prototype);
        obj.ptr = ptr;
        SyncStateFinalization.register(obj, obj.ptr, obj);
        return obj;
      }
      __destroy_into_raw() {
        const ptr = this.ptr;
        this.ptr = 0;
        SyncStateFinalization.unregister(this);
        return ptr;
      }
      free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_syncstate_free(ptr);
      }
      /**
      * @returns {any}
      */
      get sharedHeads() {
        const ret = wasm.syncstate_sharedHeads(this.ptr);
        return takeObject(ret);
      }
      /**
      * @returns {any}
      */
      get lastSentHeads() {
        const ret = wasm.syncstate_lastSentHeads(this.ptr);
        return takeObject(ret);
      }
      /**
      * @param {any} heads
      */
      set lastSentHeads(heads) {
        try {
          const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
          wasm.syncstate_set_lastSentHeads(retptr, this.ptr, addHeapObject(heads));
          var r0 = getInt32Memory0()[retptr / 4 + 0];
          var r1 = getInt32Memory0()[retptr / 4 + 1];
          if (r1) {
            throw takeObject(r0);
          }
        } finally {
          wasm.__wbindgen_add_to_stack_pointer(16);
        }
      }
      /**
      * @param {any} hashes
      */
      set sentHashes(hashes) {
        try {
          const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
          wasm.syncstate_set_sentHashes(retptr, this.ptr, addHeapObject(hashes));
          var r0 = getInt32Memory0()[retptr / 4 + 0];
          var r1 = getInt32Memory0()[retptr / 4 + 1];
          if (r1) {
            throw takeObject(r0);
          }
        } finally {
          wasm.__wbindgen_add_to_stack_pointer(16);
        }
      }
      /**
      * @returns {SyncState}
      */
      clone() {
        const ret = wasm.syncstate_clone(this.ptr);
        return SyncState.__wrap(ret);
      }
    };
  }
});

// wasm-module:C:\Users\ulyss\Development\nodysseus\node_modules\@automerge\automerge-wasm\bundler\automerge_wasm_bg.wasm
var automerge_wasm_bg_exports = {};
__export(automerge_wasm_bg_exports, {
  __wbg_automerge_free: () => __wbg_automerge_free,
  __wbg_syncstate_free: () => __wbg_syncstate_free,
  __wbindgen_add_to_stack_pointer: () => __wbindgen_add_to_stack_pointer,
  __wbindgen_exn_store: () => __wbindgen_exn_store,
  __wbindgen_free: () => __wbindgen_free,
  __wbindgen_malloc: () => __wbindgen_malloc,
  __wbindgen_realloc: () => __wbindgen_realloc,
  automerge_applyChanges: () => automerge_applyChanges,
  automerge_applyPatches: () => automerge_applyPatches,
  automerge_clone: () => automerge_clone,
  automerge_commit: () => automerge_commit,
  automerge_delete: () => automerge_delete,
  automerge_dump: () => automerge_dump,
  automerge_emptyChange: () => automerge_emptyChange,
  automerge_enableFreeze: () => automerge_enableFreeze,
  automerge_enablePatches: () => automerge_enablePatches,
  automerge_fork: () => automerge_fork,
  automerge_generateSyncMessage: () => automerge_generateSyncMessage,
  automerge_get: () => automerge_get,
  automerge_getActorId: () => automerge_getActorId,
  automerge_getAll: () => automerge_getAll,
  automerge_getChangeByHash: () => automerge_getChangeByHash,
  automerge_getChanges: () => automerge_getChanges,
  automerge_getChangesAdded: () => automerge_getChangesAdded,
  automerge_getHeads: () => automerge_getHeads,
  automerge_getLastLocalChange: () => automerge_getLastLocalChange,
  automerge_getMissingDeps: () => automerge_getMissingDeps,
  automerge_getWithType: () => automerge_getWithType,
  automerge_increment: () => automerge_increment,
  automerge_insert: () => automerge_insert,
  automerge_insertObject: () => automerge_insertObject,
  automerge_keys: () => automerge_keys,
  automerge_length: () => automerge_length,
  automerge_loadIncremental: () => automerge_loadIncremental,
  automerge_materialize: () => automerge_materialize,
  automerge_merge: () => automerge_merge,
  automerge_new: () => automerge_new,
  automerge_pendingOps: () => automerge_pendingOps,
  automerge_popPatches: () => automerge_popPatches,
  automerge_push: () => automerge_push,
  automerge_pushObject: () => automerge_pushObject,
  automerge_put: () => automerge_put,
  automerge_putObject: () => automerge_putObject,
  automerge_receiveSyncMessage: () => automerge_receiveSyncMessage,
  automerge_registerDatatype: () => automerge_registerDatatype,
  automerge_rollback: () => automerge_rollback,
  automerge_save: () => automerge_save,
  automerge_saveIncremental: () => automerge_saveIncremental,
  automerge_splice: () => automerge_splice,
  automerge_text: () => automerge_text,
  automerge_toJS: () => automerge_toJS,
  create: () => create2,
  decodeChange: () => decodeChange2,
  decodeSyncMessage: () => decodeSyncMessage2,
  decodeSyncState: () => decodeSyncState2,
  encodeChange: () => encodeChange2,
  encodeSyncMessage: () => encodeSyncMessage2,
  encodeSyncState: () => encodeSyncState2,
  exportSyncState: () => exportSyncState2,
  importSyncState: () => importSyncState2,
  initSyncState: () => initSyncState2,
  instance: () => instance,
  load: () => load2,
  memory: () => memory,
  module: () => module2,
  syncstate_clone: () => syncstate_clone,
  syncstate_lastSentHeads: () => syncstate_lastSentHeads,
  syncstate_set_lastSentHeads: () => syncstate_set_lastSentHeads,
  syncstate_set_sentHashes: () => syncstate_set_sentHashes,
  syncstate_sharedHeads: () => syncstate_sharedHeads
});
async function loadWasm(module3, imports2) {
  if (typeof module3 === "string") {
    const moduleRequest = await fetch(module3);
    if (typeof WebAssembly.instantiateStreaming === "function") {
      try {
        return await WebAssembly.instantiateStreaming(moduleRequest, imports2);
      } catch (e) {
        if (moduleRequest.headers.get("Content-Type") != "application/wasm") {
          console.warn(e);
        } else {
          throw e;
        }
      }
    }
    module3 = await moduleRequest.arrayBuffer();
  }
  return await WebAssembly.instantiate(module3, imports2);
}
var imports, instance, module2, memory, __wbg_automerge_free, automerge_new, automerge_clone, automerge_fork, automerge_pendingOps, automerge_commit, automerge_merge, automerge_rollback, automerge_keys, automerge_text, automerge_splice, automerge_push, automerge_pushObject, automerge_insert, automerge_insertObject, automerge_put, automerge_putObject, automerge_increment, automerge_get, automerge_getWithType, automerge_getAll, automerge_enableFreeze, automerge_enablePatches, automerge_registerDatatype, automerge_applyPatches, automerge_popPatches, automerge_length, automerge_delete, automerge_save, automerge_saveIncremental, automerge_loadIncremental, automerge_applyChanges, automerge_getChanges, automerge_getChangeByHash, automerge_getChangesAdded, automerge_getHeads, automerge_getActorId, automerge_getLastLocalChange, automerge_dump, automerge_getMissingDeps, automerge_receiveSyncMessage, automerge_generateSyncMessage, automerge_toJS, automerge_materialize, automerge_emptyChange, create2, load2, encodeChange2, decodeChange2, initSyncState2, importSyncState2, exportSyncState2, encodeSyncMessage2, decodeSyncMessage2, encodeSyncState2, decodeSyncState2, __wbg_syncstate_free, syncstate_sharedHeads, syncstate_lastSentHeads, syncstate_set_lastSentHeads, syncstate_set_sentHashes, syncstate_clone, __wbindgen_malloc, __wbindgen_realloc, __wbindgen_add_to_stack_pointer, __wbindgen_free, __wbindgen_exn_store;
var init_automerge_wasm_bg3 = __esm({
  async "wasm-module:C:\\Users\\ulyss\\Development\\nodysseus\\node_modules\\@automerge\\automerge-wasm\\bundler\\automerge_wasm_bg.wasm"() {
    init_automerge_wasm_bg();
    init_automerge_wasm_bg2();
    imports = {
      ["./automerge_wasm_bg.js"]: {
        __wbindgen_object_clone_ref,
        __wbindgen_object_drop_ref,
        __wbindgen_string_new,
        __wbindgen_is_undefined,
        __wbindgen_string_get,
        __wbindgen_number_new,
        __wbindgen_is_string,
        __wbindgen_is_function,
        __wbindgen_number_get,
        __wbindgen_is_null,
        __wbindgen_boolean_get,
        __wbindgen_json_serialize,
        __wbindgen_error_new,
        __wbg_new_abda76e883ba8a5f,
        __wbg_stack_658279fe44541cf6,
        __wbg_error_f851667af71bcfc6,
        __wbindgen_bigint_from_i64,
        __wbindgen_bigint_from_u64,
        __wbindgen_is_object,
        __wbindgen_jsval_loose_eq,
        __wbg_String_91fba7ded13ba54c,
        __wbg_set_20cbc34131e76824,
        __wbg_randomFillSync_6894564c2c334c42,
        __wbg_getRandomValues_805f1c3d65988a5a,
        __wbg_crypto_e1d53a1d73fb10b8,
        __wbg_process_038c26bf42b093f8,
        __wbg_versions_ab37218d2f0b24a8,
        __wbg_node_080f4b19d15bc1fe,
        __wbg_msCrypto_6e7d3e1f92610cbb,
        __wbg_require_78a3dcfbdba9cbce,
        __wbg_log_7bb108d119bafbc1,
        __wbg_log_d047cf0648d2678e,
        __wbg_get_27fe3dac1c4d0224,
        __wbg_length_e498fbc24f9c1d4f,
        __wbg_new_b525de17f44a8943,
        __wbg_newnoargs_2b8b6bd7753c76ba,
        __wbg_next_b7d530c04fd8b217,
        __wbg_next_88560ec06a094dea,
        __wbg_done_1ebec03bbd919843,
        __wbg_value_6ac8da5cc5b3efda,
        __wbg_iterator_55f114446221aa5a,
        __wbg_get_baf4855f9a986186,
        __wbg_call_95d1ea488d03e4e8,
        __wbg_new_f9876326328f45ed,
        __wbg_length_ea0846e494e3b16e,
        __wbg_self_e7c1f827057f6584,
        __wbg_window_a09ec664e14b1b81,
        __wbg_globalThis_87cbb8506fecf3a9,
        __wbg_global_c85a9259e621f3db,
        __wbg_set_17224bc548dd1d7b,
        __wbg_from_67ca20fa722467e6,
        __wbg_isArray_39d28997bf6b96b4,
        __wbg_push_49c286f04dd3bf59,
        __wbg_unshift_06a94bcbcb492eb3,
        __wbg_instanceof_ArrayBuffer_a69f02ee4c4f5065,
        __wbg_new_15d3966e9981a196,
        __wbg_call_9495de66fdbe016b,
        __wbg_call_99043a1e2a9e5916,
        __wbg_instanceof_Date_e353425d719aa266,
        __wbg_getTime_7c59072d1651a3cf,
        __wbg_new_f127e324c1313064,
        __wbg_instanceof_Object_f5a826c4da0d4a94,
        __wbg_assign_b0b6530984f36574,
        __wbg_defineProperty_4926f24c724d5310,
        __wbg_entries_4e1315b774245952,
        __wbg_freeze_4dcdbf0b5d9b50f4,
        __wbg_keys_60443f4f867207f9,
        __wbg_values_7444c4c2ccefdc9b,
        __wbg_concat_040af6c9ba38dd98,
        __wbg_slice_47202b1d012cdc55,
        __wbg_for_9a885d0d6d415e40,
        __wbg_toString_7a3e0cd68ea2a337,
        __wbg_buffer_cf65c07de34b9a08,
        __wbg_newwithbyteoffsetandlength_9fb2f11355ecadf5,
        __wbg_new_537b7341ce90bb31,
        __wbg_set_17499e8aa4003ebd,
        __wbg_length_27a2afe8ab42b09f,
        __wbg_instanceof_Uint8Array_01cebe79ca606cca,
        __wbg_newwithlength_b56c882b57805732,
        __wbg_subarray_7526649b91a252a6,
        __wbg_apply_5435e78b95a524a6,
        __wbg_deleteProperty_31090878b92a7c0e,
        __wbg_ownKeys_9efe69be404540aa,
        __wbg_set_6aa458a4ebdb65cb,
        __wbindgen_debug_string,
        __wbindgen_throw,
        __wbindgen_memory
      }
    };
    ({ instance, module: module2 } = await loadWasm(automerge_wasm_bg_default, imports));
    memory = instance.exports.memory;
    __wbg_automerge_free = instance.exports.__wbg_automerge_free;
    automerge_new = instance.exports.automerge_new;
    automerge_clone = instance.exports.automerge_clone;
    automerge_fork = instance.exports.automerge_fork;
    automerge_pendingOps = instance.exports.automerge_pendingOps;
    automerge_commit = instance.exports.automerge_commit;
    automerge_merge = instance.exports.automerge_merge;
    automerge_rollback = instance.exports.automerge_rollback;
    automerge_keys = instance.exports.automerge_keys;
    automerge_text = instance.exports.automerge_text;
    automerge_splice = instance.exports.automerge_splice;
    automerge_push = instance.exports.automerge_push;
    automerge_pushObject = instance.exports.automerge_pushObject;
    automerge_insert = instance.exports.automerge_insert;
    automerge_insertObject = instance.exports.automerge_insertObject;
    automerge_put = instance.exports.automerge_put;
    automerge_putObject = instance.exports.automerge_putObject;
    automerge_increment = instance.exports.automerge_increment;
    automerge_get = instance.exports.automerge_get;
    automerge_getWithType = instance.exports.automerge_getWithType;
    automerge_getAll = instance.exports.automerge_getAll;
    automerge_enableFreeze = instance.exports.automerge_enableFreeze;
    automerge_enablePatches = instance.exports.automerge_enablePatches;
    automerge_registerDatatype = instance.exports.automerge_registerDatatype;
    automerge_applyPatches = instance.exports.automerge_applyPatches;
    automerge_popPatches = instance.exports.automerge_popPatches;
    automerge_length = instance.exports.automerge_length;
    automerge_delete = instance.exports.automerge_delete;
    automerge_save = instance.exports.automerge_save;
    automerge_saveIncremental = instance.exports.automerge_saveIncremental;
    automerge_loadIncremental = instance.exports.automerge_loadIncremental;
    automerge_applyChanges = instance.exports.automerge_applyChanges;
    automerge_getChanges = instance.exports.automerge_getChanges;
    automerge_getChangeByHash = instance.exports.automerge_getChangeByHash;
    automerge_getChangesAdded = instance.exports.automerge_getChangesAdded;
    automerge_getHeads = instance.exports.automerge_getHeads;
    automerge_getActorId = instance.exports.automerge_getActorId;
    automerge_getLastLocalChange = instance.exports.automerge_getLastLocalChange;
    automerge_dump = instance.exports.automerge_dump;
    automerge_getMissingDeps = instance.exports.automerge_getMissingDeps;
    automerge_receiveSyncMessage = instance.exports.automerge_receiveSyncMessage;
    automerge_generateSyncMessage = instance.exports.automerge_generateSyncMessage;
    automerge_toJS = instance.exports.automerge_toJS;
    automerge_materialize = instance.exports.automerge_materialize;
    automerge_emptyChange = instance.exports.automerge_emptyChange;
    create2 = instance.exports.create;
    load2 = instance.exports.load;
    encodeChange2 = instance.exports.encodeChange;
    decodeChange2 = instance.exports.decodeChange;
    initSyncState2 = instance.exports.initSyncState;
    importSyncState2 = instance.exports.importSyncState;
    exportSyncState2 = instance.exports.exportSyncState;
    encodeSyncMessage2 = instance.exports.encodeSyncMessage;
    decodeSyncMessage2 = instance.exports.decodeSyncMessage;
    encodeSyncState2 = instance.exports.encodeSyncState;
    decodeSyncState2 = instance.exports.decodeSyncState;
    __wbg_syncstate_free = instance.exports.__wbg_syncstate_free;
    syncstate_sharedHeads = instance.exports.syncstate_sharedHeads;
    syncstate_lastSentHeads = instance.exports.syncstate_lastSentHeads;
    syncstate_set_lastSentHeads = instance.exports.syncstate_set_lastSentHeads;
    syncstate_set_sentHashes = instance.exports.syncstate_set_sentHashes;
    syncstate_clone = instance.exports.syncstate_clone;
    __wbindgen_malloc = instance.exports.__wbindgen_malloc;
    __wbindgen_realloc = instance.exports.__wbindgen_realloc;
    __wbindgen_add_to_stack_pointer = instance.exports.__wbindgen_add_to_stack_pointer;
    __wbindgen_free = instance.exports.__wbindgen_free;
    __wbindgen_exn_store = instance.exports.__wbindgen_exn_store;
  }
});

// node_modules/@automerge/automerge-wasm/bundler/automerge_wasm.js
var automerge_wasm_exports = {};
__export(automerge_wasm_exports, {
  Automerge: () => Automerge,
  SyncState: () => SyncState,
  TextRepresentation: () => TextRepresentation,
  __wbg_String_91fba7ded13ba54c: () => __wbg_String_91fba7ded13ba54c,
  __wbg_apply_5435e78b95a524a6: () => __wbg_apply_5435e78b95a524a6,
  __wbg_assign_b0b6530984f36574: () => __wbg_assign_b0b6530984f36574,
  __wbg_buffer_cf65c07de34b9a08: () => __wbg_buffer_cf65c07de34b9a08,
  __wbg_call_9495de66fdbe016b: () => __wbg_call_9495de66fdbe016b,
  __wbg_call_95d1ea488d03e4e8: () => __wbg_call_95d1ea488d03e4e8,
  __wbg_call_99043a1e2a9e5916: () => __wbg_call_99043a1e2a9e5916,
  __wbg_concat_040af6c9ba38dd98: () => __wbg_concat_040af6c9ba38dd98,
  __wbg_crypto_e1d53a1d73fb10b8: () => __wbg_crypto_e1d53a1d73fb10b8,
  __wbg_defineProperty_4926f24c724d5310: () => __wbg_defineProperty_4926f24c724d5310,
  __wbg_deleteProperty_31090878b92a7c0e: () => __wbg_deleteProperty_31090878b92a7c0e,
  __wbg_done_1ebec03bbd919843: () => __wbg_done_1ebec03bbd919843,
  __wbg_entries_4e1315b774245952: () => __wbg_entries_4e1315b774245952,
  __wbg_error_f851667af71bcfc6: () => __wbg_error_f851667af71bcfc6,
  __wbg_for_9a885d0d6d415e40: () => __wbg_for_9a885d0d6d415e40,
  __wbg_freeze_4dcdbf0b5d9b50f4: () => __wbg_freeze_4dcdbf0b5d9b50f4,
  __wbg_from_67ca20fa722467e6: () => __wbg_from_67ca20fa722467e6,
  __wbg_getRandomValues_805f1c3d65988a5a: () => __wbg_getRandomValues_805f1c3d65988a5a,
  __wbg_getTime_7c59072d1651a3cf: () => __wbg_getTime_7c59072d1651a3cf,
  __wbg_get_27fe3dac1c4d0224: () => __wbg_get_27fe3dac1c4d0224,
  __wbg_get_baf4855f9a986186: () => __wbg_get_baf4855f9a986186,
  __wbg_globalThis_87cbb8506fecf3a9: () => __wbg_globalThis_87cbb8506fecf3a9,
  __wbg_global_c85a9259e621f3db: () => __wbg_global_c85a9259e621f3db,
  __wbg_instanceof_ArrayBuffer_a69f02ee4c4f5065: () => __wbg_instanceof_ArrayBuffer_a69f02ee4c4f5065,
  __wbg_instanceof_Date_e353425d719aa266: () => __wbg_instanceof_Date_e353425d719aa266,
  __wbg_instanceof_Object_f5a826c4da0d4a94: () => __wbg_instanceof_Object_f5a826c4da0d4a94,
  __wbg_instanceof_Uint8Array_01cebe79ca606cca: () => __wbg_instanceof_Uint8Array_01cebe79ca606cca,
  __wbg_isArray_39d28997bf6b96b4: () => __wbg_isArray_39d28997bf6b96b4,
  __wbg_iterator_55f114446221aa5a: () => __wbg_iterator_55f114446221aa5a,
  __wbg_keys_60443f4f867207f9: () => __wbg_keys_60443f4f867207f9,
  __wbg_length_27a2afe8ab42b09f: () => __wbg_length_27a2afe8ab42b09f,
  __wbg_length_e498fbc24f9c1d4f: () => __wbg_length_e498fbc24f9c1d4f,
  __wbg_length_ea0846e494e3b16e: () => __wbg_length_ea0846e494e3b16e,
  __wbg_log_7bb108d119bafbc1: () => __wbg_log_7bb108d119bafbc1,
  __wbg_log_d047cf0648d2678e: () => __wbg_log_d047cf0648d2678e,
  __wbg_msCrypto_6e7d3e1f92610cbb: () => __wbg_msCrypto_6e7d3e1f92610cbb,
  __wbg_new_15d3966e9981a196: () => __wbg_new_15d3966e9981a196,
  __wbg_new_537b7341ce90bb31: () => __wbg_new_537b7341ce90bb31,
  __wbg_new_abda76e883ba8a5f: () => __wbg_new_abda76e883ba8a5f,
  __wbg_new_b525de17f44a8943: () => __wbg_new_b525de17f44a8943,
  __wbg_new_f127e324c1313064: () => __wbg_new_f127e324c1313064,
  __wbg_new_f9876326328f45ed: () => __wbg_new_f9876326328f45ed,
  __wbg_newnoargs_2b8b6bd7753c76ba: () => __wbg_newnoargs_2b8b6bd7753c76ba,
  __wbg_newwithbyteoffsetandlength_9fb2f11355ecadf5: () => __wbg_newwithbyteoffsetandlength_9fb2f11355ecadf5,
  __wbg_newwithlength_b56c882b57805732: () => __wbg_newwithlength_b56c882b57805732,
  __wbg_next_88560ec06a094dea: () => __wbg_next_88560ec06a094dea,
  __wbg_next_b7d530c04fd8b217: () => __wbg_next_b7d530c04fd8b217,
  __wbg_node_080f4b19d15bc1fe: () => __wbg_node_080f4b19d15bc1fe,
  __wbg_ownKeys_9efe69be404540aa: () => __wbg_ownKeys_9efe69be404540aa,
  __wbg_process_038c26bf42b093f8: () => __wbg_process_038c26bf42b093f8,
  __wbg_push_49c286f04dd3bf59: () => __wbg_push_49c286f04dd3bf59,
  __wbg_randomFillSync_6894564c2c334c42: () => __wbg_randomFillSync_6894564c2c334c42,
  __wbg_require_78a3dcfbdba9cbce: () => __wbg_require_78a3dcfbdba9cbce,
  __wbg_self_e7c1f827057f6584: () => __wbg_self_e7c1f827057f6584,
  __wbg_set_17224bc548dd1d7b: () => __wbg_set_17224bc548dd1d7b,
  __wbg_set_17499e8aa4003ebd: () => __wbg_set_17499e8aa4003ebd,
  __wbg_set_20cbc34131e76824: () => __wbg_set_20cbc34131e76824,
  __wbg_set_6aa458a4ebdb65cb: () => __wbg_set_6aa458a4ebdb65cb,
  __wbg_set_wasm: () => __wbg_set_wasm,
  __wbg_slice_47202b1d012cdc55: () => __wbg_slice_47202b1d012cdc55,
  __wbg_stack_658279fe44541cf6: () => __wbg_stack_658279fe44541cf6,
  __wbg_subarray_7526649b91a252a6: () => __wbg_subarray_7526649b91a252a6,
  __wbg_toString_7a3e0cd68ea2a337: () => __wbg_toString_7a3e0cd68ea2a337,
  __wbg_unshift_06a94bcbcb492eb3: () => __wbg_unshift_06a94bcbcb492eb3,
  __wbg_value_6ac8da5cc5b3efda: () => __wbg_value_6ac8da5cc5b3efda,
  __wbg_values_7444c4c2ccefdc9b: () => __wbg_values_7444c4c2ccefdc9b,
  __wbg_versions_ab37218d2f0b24a8: () => __wbg_versions_ab37218d2f0b24a8,
  __wbg_window_a09ec664e14b1b81: () => __wbg_window_a09ec664e14b1b81,
  __wbindgen_bigint_from_i64: () => __wbindgen_bigint_from_i64,
  __wbindgen_bigint_from_u64: () => __wbindgen_bigint_from_u64,
  __wbindgen_boolean_get: () => __wbindgen_boolean_get,
  __wbindgen_debug_string: () => __wbindgen_debug_string,
  __wbindgen_error_new: () => __wbindgen_error_new,
  __wbindgen_is_function: () => __wbindgen_is_function,
  __wbindgen_is_null: () => __wbindgen_is_null,
  __wbindgen_is_object: () => __wbindgen_is_object,
  __wbindgen_is_string: () => __wbindgen_is_string,
  __wbindgen_is_undefined: () => __wbindgen_is_undefined,
  __wbindgen_json_serialize: () => __wbindgen_json_serialize,
  __wbindgen_jsval_loose_eq: () => __wbindgen_jsval_loose_eq,
  __wbindgen_memory: () => __wbindgen_memory,
  __wbindgen_number_get: () => __wbindgen_number_get,
  __wbindgen_number_new: () => __wbindgen_number_new,
  __wbindgen_object_clone_ref: () => __wbindgen_object_clone_ref,
  __wbindgen_object_drop_ref: () => __wbindgen_object_drop_ref,
  __wbindgen_string_get: () => __wbindgen_string_get,
  __wbindgen_string_new: () => __wbindgen_string_new,
  __wbindgen_throw: () => __wbindgen_throw,
  create: () => create,
  decodeChange: () => decodeChange,
  decodeSyncMessage: () => decodeSyncMessage,
  decodeSyncState: () => decodeSyncState,
  encodeChange: () => encodeChange,
  encodeSyncMessage: () => encodeSyncMessage,
  encodeSyncState: () => encodeSyncState,
  exportSyncState: () => exportSyncState,
  importSyncState: () => importSyncState,
  initSyncState: () => initSyncState,
  load: () => load
});
var init_automerge_wasm = __esm({
  async "node_modules/@automerge/automerge-wasm/bundler/automerge_wasm.js"() {
    await init_automerge_wasm_bg3();
    init_automerge_wasm_bg2();
    init_automerge_wasm_bg2();
    __wbg_set_wasm(automerge_wasm_bg_exports);
  }
});

// node_modules/@automerge/automerge/dist/mjs/stable.js
function use(api) {
  UseApi(api);
}
function importOpts(_actor) {
  if (typeof _actor === "object") {
    return _actor;
  } else {
    return { actor: _actor };
  }
}
function init(_opts) {
  const opts = importOpts(_opts);
  const freeze = !!opts.freeze;
  const patchCallback = opts.patchCallback;
  const handle = ApiHandler.create(opts.enableTextV2 || false, opts.actor);
  handle.enablePatches(true);
  handle.enableFreeze(!!opts.freeze);
  handle.registerDatatype("counter", (n) => new Counter(n));
  const textV2 = opts.enableTextV2 || false;
  if (textV2) {
    handle.registerDatatype("str", (n) => new RawString(n));
  } else {
    handle.registerDatatype("text", (n) => new Text(n));
  }
  const doc = handle.materialize("/", void 0, {
    handle,
    heads: void 0,
    freeze,
    patchCallback,
    textV2
  });
  return doc;
}
function change(doc, options, callback) {
  if (typeof options === "function") {
    return _change(doc, {}, options);
  } else if (typeof callback === "function") {
    if (typeof options === "string") {
      options = { message: options };
    }
    return _change(doc, options, callback);
  } else {
    throw RangeError("Invalid args for change");
  }
}
function progressDocument(doc, heads, callback) {
  if (heads == null) {
    return doc;
  }
  const state = _state(doc);
  const nextState = Object.assign(Object.assign({}, state), { heads: void 0 });
  const nextDoc = state.handle.applyPatches(doc, nextState, callback);
  state.heads = heads;
  return nextDoc;
}
function _change(doc, options, callback) {
  if (typeof callback !== "function") {
    throw new RangeError("invalid change function");
  }
  const state = _state(doc);
  if (doc === void 0 || state === void 0) {
    throw new RangeError("must be the document root");
  }
  if (state.heads) {
    throw new RangeError("Attempting to change an outdated document.  Use Automerge.clone() if you wish to make a writable copy.");
  }
  if (_is_proxy(doc)) {
    throw new RangeError("Calls to Automerge.change cannot be nested");
  }
  const heads = state.handle.getHeads();
  try {
    state.heads = heads;
    const root = rootProxy(state.handle, state.textV2);
    callback(root);
    if (state.handle.pendingOps() === 0) {
      state.heads = void 0;
      return doc;
    } else {
      state.handle.commit(options.message, options.time);
      return progressDocument(doc, heads, options.patchCallback || state.patchCallback);
    }
  } catch (e) {
    state.heads = void 0;
    state.handle.rollback();
    throw e;
  }
}
function load3(data, _opts) {
  const opts = importOpts(_opts);
  const actor = opts.actor;
  const patchCallback = opts.patchCallback;
  const handle = ApiHandler.load(data, opts.enableTextV2 || false, actor);
  handle.enablePatches(true);
  handle.enableFreeze(!!opts.freeze);
  handle.registerDatatype("counter", (n) => new Counter(n));
  const textV2 = opts.enableTextV2 || false;
  if (textV2) {
    handle.registerDatatype("str", (n) => new RawString(n));
  } else {
    handle.registerDatatype("text", (n) => new Text(n));
  }
  const doc = handle.materialize("/", void 0, {
    handle,
    heads: void 0,
    patchCallback,
    textV2
  });
  return doc;
}
function save(doc) {
  return _state(doc).handle.save();
}
function applyChanges(doc, changes, opts) {
  const state = _state(doc);
  if (!opts) {
    opts = {};
  }
  if (state.heads) {
    throw new RangeError("Attempting to change an outdated document.  Use Automerge.clone() if you wish to make a writable copy.");
  }
  if (_is_proxy(doc)) {
    throw new RangeError("Calls to Automerge.change cannot be nested");
  }
  const heads = state.handle.getHeads();
  state.handle.applyChanges(changes);
  state.heads = heads;
  return [
    progressDocument(doc, heads, opts.patchCallback || state.patchCallback)
  ];
}
function generateSyncMessage(doc, inState) {
  const state = _state(doc);
  const syncState = ApiHandler.importSyncState(inState);
  const message = state.handle.generateSyncMessage(syncState);
  const outState = ApiHandler.exportSyncState(syncState);
  return [outState, message];
}
function receiveSyncMessage(doc, inState, message, opts) {
  const syncState = ApiHandler.importSyncState(inState);
  if (!opts) {
    opts = {};
  }
  const state = _state(doc);
  if (state.heads) {
    throw new RangeError("Attempting to change an outdated document.  Use Automerge.clone() if you wish to make a writable copy.");
  }
  if (_is_proxy(doc)) {
    throw new RangeError("Calls to Automerge.change cannot be nested");
  }
  const heads = state.handle.getHeads();
  state.handle.receiveSyncMessage(syncState, message);
  const outSyncState = ApiHandler.exportSyncState(syncState);
  return [
    progressDocument(doc, heads, opts.patchCallback || state.patchCallback),
    outSyncState,
    null
  ];
}
function initSyncState3() {
  return ApiHandler.exportSyncState(ApiHandler.initSyncState());
}
var SyncStateSymbol;
var init_stable = __esm({
  async "node_modules/@automerge/automerge/dist/mjs/stable.js"() {
    init_uuid();
    init_proxies();
    init_constants();
    init_types2();
    init_types2();
    init_text();
    init_text();
    init_low_level();
    init_raw_string();
    init_internal_state();
    init_conflicts();
    await init_automerge_wasm();
    SyncStateSymbol = Symbol("_syncstate");
    use(automerge_wasm_exports);
  }
});

// node_modules/@automerge/automerge/dist/mjs/unstable_types.js
var init_unstable_types = __esm({
  "node_modules/@automerge/automerge/dist/mjs/unstable_types.js"() {
    init_types2();
    init_raw_string();
  }
});

// node_modules/@automerge/automerge/dist/mjs/unstable.js
var init_unstable = __esm({
  async "node_modules/@automerge/automerge/dist/mjs/unstable.js"() {
    init_unstable_types();
    init_conflicts();
    await init_stable();
    await init_stable();
    init_raw_string();
    init_internal_state();
  }
});

// node_modules/@automerge/automerge/dist/mjs/index.js
var init_mjs = __esm({
  async "node_modules/@automerge/automerge/dist/mjs/index.js"() {
    init_stable();
    await init_unstable();
  }
});

// public/categoryChanges.json
var categoryChanges_default;
var init_categoryChanges = __esm({
  "public/categoryChanges.json"() {
    categoryChanges_default = {
      simple: "templates",
      log: "debug",
      expect: "debug",
      math: "math",
      fetch: "network",
      stringify: "data",
      parse: "data",
      call: "js",
      add: "math",
      mult: "math",
      divide: "math",
      negate: "math",
      and: "math",
      typeof: "js",
      new: "js",
      addEventListeners: "js",
      ancestors: "graph",
      append: "data",
      concat: "data",
      default: "flow",
      switch: "flow",
      compare: "data",
      if: "flow",
      svg_text: "html",
      fold: "data",
      runnable: "flow",
      ap: "flow",
      script: "js",
      array: "data",
      create_fn: "js",
      merge_objects: "data",
      merge_objects_mutable: "data",
      get: "data",
      set: "data",
      set_mutable: "data",
      modify: "data",
      delete: "data",
      tapbutton: "html",
      graphchangecache: "memory",
      cache: "memory",
      isunchanged: "data",
      ischanged: "data",
      refval: "memory",
      state: "memory",
      publish_event: "event",
      event_publisher_onchange: "event",
      input_value: "debug",
      reduce: "data",
      map: "data",
      import_json: "nodysseus",
      object_entries: "data",
      css_styles: "html",
      css_anim: "html",
      input: "html",
      html_text: "html",
      html_element: "html",
      icon: "html",
      not: "data",
      canvas_behind_editor: "html",
      import_module: "js",
      import: "nodysseus",
      offscreenCanvas: "html",
      deleteRef: "nodysseus",
      changed: "data",
      webgl: "graphics",
      load_shader: "graphics",
      subscribe_many: "event",
      slider: "html",
      export: "nodysseus",
      assetmanager: "memory",
      fit: "math",
      switch_inputs: "flow",
      store_file: "memory",
      filter: "data",
      noise: "math",
      curlnoise: "math"
    };
  }
});

// src/editor/initgraph.ts
var initgraph;
var init_initgraph = __esm({
  "src/editor/initgraph.ts"() {
    initgraph = Uint8Array.from([133, 111, 74, 131, 54, 87, 190, 254, 1, 187, 4, 0, 16, 236, 109, 90, 193, 174, 20, 73, 246, 136, 123, 41, 179, 150, 54, 134, 188, 1, 1, 0, 0, 0, 8, 1, 8, 2, 38, 21, 185, 1, 52, 1, 66, 37, 86, 50, 87, 208, 1, 112, 2, 0, 4, 16, 0, 0, 1, 16, 0, 0, 4, 127, 4, 3, 5, 127, 4, 3, 9, 127, 4, 3, 13, 127, 4, 3, 17, 0, 1, 125, 21, 22, 21, 3, 24, 127, 21, 2, 28, 127, 21, 2, 31, 127, 21, 3, 34, 91, 2, 105, 100, 3, 111, 117, 116, 8, 99, 97, 116, 101, 103, 111, 114, 121, 5, 101, 100, 103, 101, 115, 7, 113, 103, 98, 105, 110, 109, 50, 4, 102, 114, 111, 109, 2, 116, 111, 2, 97, 115, 7, 56, 100, 121, 53, 55, 51, 101, 4, 102, 114, 111, 109, 2, 116, 111, 2, 97, 115, 10, 111, 117, 116, 112, 117, 116, 95, 118, 97, 108, 4, 102, 114, 111, 109, 2, 116, 111, 2, 97, 115, 4, 97, 114, 103, 115, 4, 102, 114, 111, 109, 2, 116, 111, 2, 97, 115, 5, 110, 111, 100, 101, 115, 4, 97, 114, 103, 115, 2, 105, 100, 7, 113, 103, 98, 105, 110, 109, 50, 2, 105, 100, 5, 118, 97, 108, 117, 101, 3, 114, 101, 102, 7, 56, 100, 121, 53, 55, 51, 101, 2, 105, 100, 3, 114, 101, 102, 10, 111, 117, 116, 112, 117, 116, 95, 118, 97, 108, 2, 105, 100, 5, 118, 97, 108, 117, 101, 3, 111, 117, 116, 2, 105, 100, 3, 114, 101, 102, 4, 110, 97, 109, 101, 37, 3, 1, 2, 0, 3, 1, 127, 0, 3, 1, 127, 0, 3, 1, 127, 0, 3, 1, 2, 0, 126, 1, 0, 3, 1, 127, 0, 2, 1, 127, 0, 2, 1, 127, 0, 3, 1, 125, 150, 2, 54, 150, 1, 2, 0, 2, 118, 115, 134, 1, 0, 118, 54, 118, 0, 166, 1, 54, 86, 0, 70, 54, 70, 2, 0, 113, 70, 0, 118, 214, 1, 246, 1, 0, 118, 166, 2, 0, 166, 1, 182, 1, 0, 54, 102, 150, 2, 64, 116, 101, 109, 112, 108, 97, 116, 101, 115, 46, 115, 105, 109, 112, 108, 101, 111, 117, 116, 116, 101, 109, 112, 108, 97, 116, 101, 115, 113, 103, 98, 105, 110, 109, 50, 56, 100, 121, 53, 55, 51, 101, 99, 104, 105, 108, 100, 114, 101, 110, 56, 100, 121, 53, 55, 51, 101, 111, 117, 116, 100, 105, 115, 112, 108, 97, 121, 111, 117, 116, 112, 117, 116, 95, 118, 97, 108, 111, 117, 116, 118, 97, 108, 117, 101, 97, 114, 103, 115, 111, 117, 116, 97, 114, 103, 115, 97, 114, 103, 115, 113, 103, 98, 105, 110, 109, 50, 72, 101, 108, 108, 111, 44, 32, 119, 111, 114, 108, 100, 33, 64, 104, 116, 109, 108, 46, 104, 116, 109, 108, 95, 116, 101, 120, 116, 56, 100, 121, 53, 55, 51, 101, 64, 104, 116, 109, 108, 46, 104, 116, 109, 108, 95, 101, 108, 101, 109, 101, 110, 116, 111, 117, 116, 112, 117, 116, 95, 118, 97, 108, 115, 111, 109, 101, 32, 111, 117, 116, 112, 117, 116, 111, 117, 116, 114, 101, 116, 117, 114, 110, 64, 116, 101, 109, 112, 108, 97, 116, 101, 115, 46, 115, 105, 109, 112, 108, 101, 37, 0]);
  }
});

// src/editor/store.ts
var store_exports = {};
__export(store_exports, {
  automergeRefStore: () => automergeRefStore,
  openNodysseusDB: () => openNodysseusDB,
  sharedWorkerRefStore: () => sharedWorkerRefStore,
  webClientStore: () => webClientStore
});
var generic_nodes2, generic_node_ids, migrateCategories, automergeRefStore, sharedWorkerRefStore, openNodysseusDB, webClientStore;
var init_store = __esm({
  async "src/editor/store.ts"() {
    init_build();
    init_generic();
    init_nodysseus();
    init_types();
    init_util();
    await init_mjs();
    init_esm_browser();
    init_categoryChanges();
    init_initgraph();
    generic_nodes2 = generic_default.nodes;
    generic_node_ids = new Set(Object.keys(generic_nodes2));
    migrateCategories = (doc) => {
      if (!doc.nodes)
        return;
      Object.entries(doc.nodes).forEach(([k, n]) => {
        if (isNodeRef(doc.nodes[k]) && categoryChanges_default[doc.nodes[k].ref]) {
          const ref = doc.nodes[k].ref;
          doc.nodes[k].ref = `@${categoryChanges_default[ref]}.${ref}`;
        }
      });
    };
    automergeRefStore = async ({ nodysseusidb, persist = false }) => {
      const refsmap = /* @__PURE__ */ new Map();
      const structuredCloneMap = /* @__PURE__ */ new Map();
      const refsset = new Set(await nodysseusidb.getAllKeys("refs").then((ks) => ks.map((k) => k.toString())));
      const syncedSet = /* @__PURE__ */ new Set();
      const createDoc = () => applyChanges(init(), [initgraph])[0];
      const updatePeers = (id, target) => {
        if (id === "custom_editor")
          return;
        syncedSet.add(id);
        if (updatePeersDebounces[id])
          clearTimeout(updatePeersDebounces[id]);
        updatePeersDebounces[id] = setTimeout(() => {
          wrapPromise(refsmap.get(id)).then((current) => {
            updatePeersDebounces[id] = false;
            (target ? [[target, syncStates[target]]] : Object.entries(syncStates)).forEach(([peer, syncState]) => {
              const [nextSyncState, syncMessage] = generateSyncMessage(
                current,
                syncState[id] || initSyncState3()
              );
              syncStates[peer] = { ...syncStates[peer], [id]: nextSyncState };
              if (syncMessage) {
                if (syncStates[peer]._syncType === "broadcast") {
                  syncBroadcast.postMessage({ type: "syncgraph", id, peerId, target: peer, syncMessage });
                } else if (syncStates[peer]._syncType === "ws") {
                }
              }
            });
          });
        }, 100);
      };
      const graphNodePatchCallback = (patches, before, after) => {
        const changedNodes = /* @__PURE__ */ new Set();
        patches.forEach((patch) => patch.path[0] === "nodes" && changedNodes.add(patch.path[1]));
        if (changedNodes.size > 0) {
          requestAnimationFrame(() => {
          });
        }
      };
      const getDoc = (id) => refsmap.has(id) ? refsmap.get(id) : refsset.has(id) ? nodysseusidb.get("refs", id).then((persisted) => {
        let doc = load3(persisted);
        doc = change(doc, migrateCategories);
        refsmap.set(id, doc);
        let scd = structuredClone(doc);
        structuredCloneMap.set(id, scd);
        const filteredGraph = ancestor_graph(doc.out, doc);
        if (!(filteredGraph.nodes.length === scd.nodes.length && Object.keys(filteredGraph.edges).length === Object.keys(scd.edges).length)) {
          doc = change(doc, { patchCallback: graphNodePatchCallback }, setFromGraph(filteredGraph));
          persist && nodysseusidb.put("refs", save(doc), id);
          refsmap.set(id, doc);
          scd = structuredClone(doc);
          structuredCloneMap.set(id, scd);
        }
        return refsmap.get(id);
      }) : void 0;
      const changeDoc = (id, fn, changedNodes = []) => {
        if (generic_node_ids.has(id)) {
          return;
        }
        return wrapPromise(getDoc(id)).then((graph) => {
          let doc = change(graph ?? createDoc(), { patchCallback: graphNodePatchCallback }, fn);
          if (!doc.edges_in) {
            doc = change(doc, { patchCallback: graphNodePatchCallback }, (d) => {
              d.edges_in = {};
              Object.values(d.edges).forEach((edge) => {
                if (d.edges_in[edge.to]) {
                  d.edges_in[edge.to][edge.from] = { ...edge };
                } else {
                  d.edges_in[edge.to] = { [edge.from]: { ...edge } };
                }
              });
            });
          }
          persist && nodysseusidb.put("refs", save(doc), id);
          refsmap.set(id, doc);
          refsset.add(id);
          const scd = structuredClone(doc);
          structuredCloneMap.set(id, scd);
          return scd;
        }).value;
      };
      const removeNodeFn = (node) => (doc) => {
        const nodeid = typeof node === "string" ? node : node.id;
        delete doc.nodes[nodeid];
        delete doc.edges[nodeid];
        if (doc.edges_in) {
          Object.values(doc.edges_in).forEach((ein) => {
            if (ein[nodeid]) {
              delete ein[nodeid];
            }
          });
        }
      };
      const removeEdgeFn = (edge) => (g) => {
        delete g.edges[edge.from];
        delete g.edges_in[edge.to][edge.from];
      };
      const setFromGraph = (graph) => (doc) => {
        Object.entries(doc).forEach((e) => !Object.hasOwn(graph, e[0]) && delete doc[e[0]]);
        Object.entries(structuredClone(graph)).forEach((e) => {
          if (graph[e[0]] === void 0) {
            delete doc[e[0]];
          } else if (e[1] !== void 0) {
            if (e[0] === "nodes" && Array.isArray(e[1])) {
              doc[e[0]] = Object.fromEntries(e[1].map((n) => [n.id, n]));
            } else if (e[0] === "edges" && Array.isArray(e[1])) {
              doc[e[0]] = Object.fromEntries(e[1].map((e2) => [e2.from, e2]));
            } else {
              doc[e[0]] = e[1];
            }
          }
        });
      };
      const refs = {
        get: (id) => generic_nodes2[id] ?? (structuredCloneMap.has(id) ? structuredCloneMap.get(id) : wrapPromise(getDoc(id)).then((d) => {
          const scd = structuredClone(d);
          structuredCloneMap.set(id, scd);
          return scd;
        }).value),
        set: (id, graph) => {
        },
        //changeDoc(id, setFromGraph(graph)),
        delete: (id) => {
          refsmap.delete(id);
          refsset.delete(id);
          structuredCloneMap.delete(id);
          return nodysseusidb.delete("refs", id);
        },
        clear: () => {
          throw new Error("not implemented");
        },
        keys: () => {
          return [...refsset.keys(), ...generic_node_ids];
        },
        undo: () => {
          throw new Error("not implemented");
        },
        redo: () => {
          throw new Error("not implemented");
        },
        add_node: (id, node) => {
        },
        // changeDoc(id, doc => {
        //   // TODO: try to fix by making the values texts instead of just strings
        //   if(doc.nodes[node.id]) {
        //     Object.keys(node).concat(Object.keys(doc.nodes[node.id]))
        //       .forEach(k => { 
        //         if(doc.nodes[node.id][k] !== node[k]) {
        //           if(node[k] === undefined) {
        //             delete doc.nodes[node.id][k]
        //           } else {
        //             doc.nodes[node.id][k] = node[k];
        //           }
        //         }
        //       })
        //   } else {
        //     Object.entries(node).forEach(kv => kv[1] === undefined && delete node[kv[0]])
        //     doc.nodes[node.id] = node;
        //   }
        // }, [node.id]),
        add_nodes_edges: (id, nodes, edges, remove_edges, remove_nodes) => {
        },
        // changeDoc(id, graph => {
        //   remove_nodes?.forEach(node => removeNodeFn(node)(graph));
        //   remove_edges?.forEach(edge => removeEdgeFn(edge)(graph));
        //
        //   
        //   nodes.forEach(node => {
        //     Object.entries(node).forEach(kv => kv[1] === undefined && delete node[kv[0]])
        //     graph.nodes[node.id] = node
        //   })
        //
        //   edges.forEach(edge => {
        //     graph.edges[edge.from] = edge;
        //     if(graph.edges_in[edge.to] ) {
        //       graph.edges_in[edge.to][edge.from] = {...edge};
        //     } else {
        //       graph.edges_in[edge.to] = {[edge.from]: {...edge}}
        //     }
        //   })
        //
        // }, nodes.map(n => n.id)),
        remove_node: (id, node) => {
        },
        // changeDoc(id, removeNodeFn(node), [node.id]),
        add_edge: (id, edge) => {
        },
        // changeDoc(id, g => {
        // g.edges[edge.from] = edge; 
        // if(!g.edges_in) {
        //   g.edges_in = {};
        //   Object.values(g.edges).forEach((edge: Edge) => {
        //     if(g.edges_in[edge.to] ) {
        //       g.edges_in[edge.to][edge.from] = {...edge};
        //     } else {
        //       g.edges_in[edge.to] = {[edge.from]: {...edge}}
        //     }
        //   }) 
        // }
        // if(g.edges_in[edge.to] === undefined) g.edges_in[edge.to] = {};
        // g.edges_in[edge.to][edge.from] = edge;
        // }),
        remove_edge: (id, edge) => {
        }
        // changeDoc(id, removeEdgeFn(edge))
      };
      const syncMessageTypes = {
        0: "syncstart",
        1: "syncgraph"
      };
      const syncMessageTypesRev = {
        syncstart: 0,
        syncgraph: 1
      };
      const syncBroadcast = new BroadcastChannel("refssync");
      const syncStates = {};
      const peerId = v4_default();
      syncBroadcast.postMessage({ type: "syncstart", peerId });
      syncBroadcast.addEventListener("message", (v) => {
        const data = v.data;
        if (data.type === "syncstart" && syncStates[data.peerId]?._syncType !== "broadcast" && data.peerId !== peerId) {
          syncStates[data.peerId] = { _syncType: "broadcast" };
          !data.target && syncBroadcast.postMessage({ type: "syncstart", peerId, target: data.peerId });
          for (const graphId of syncedSet.values()) {
            updatePeers(graphId, data.peerId);
          }
        } else if (data.type === "syncgraph" && data.target === peerId) {
          wrapPromise(getDoc(data.id)).then((currentDoc) => {
            const id = data.id;
            currentDoc = currentDoc ?? createDoc();
            const [nextDoc, nextSyncState, patch] = receiveSyncMessage(
              currentDoc,
              syncStates[data.peerId]?.[id] || initSyncState3(),
              data.syncMessage,
              {
                patchCallback: graphNodePatchCallback
              }
            );
            persist && nodysseusidb.put("refs", save(nextDoc), id);
            refsset.add(id);
            refsmap.set(id, nextDoc);
            structuredCloneMap.set(id, structuredClone(nextDoc));
            syncStates[data.peerId] = { ...syncStates[data.peerId], [id]: nextSyncState };
            updatePeers(id);
          });
        }
      });
      let syncWS;
      setTimeout(() => {
      }, 100);
      let updatePeersDebounces = {};
      return refs;
    };
    sharedWorkerRefStore = async () => {
      const inflightRequests = /* @__PURE__ */ new Map();
      const sharedWorker = new SharedWorker("../sharedWorker.js?3", { type: "module" });
      let connectres;
      const connectPromise = new Promise((res, rej) => connectres = res);
      sharedWorker.port.onmessageerror = (e) => console.error("shared worker error", e);
      sharedWorker.onerror = (e) => console.error("shared worker error", e);
      sharedWorker.port.addEventListener("message", (e) => (console.log("received", e.data), e).data.kind === "connect" ? connectres() : inflightRequests.get(e.data.id)(e.data));
      sharedWorker.port.start();
      await connectPromise;
      const messagePromise = (request) => {
        const message = { id: performance.now().toFixed(), ...request };
        console.log("posting", message);
        sharedWorker.port.postMessage(message);
        return new Promise((res, rej) => {
          inflightRequests.set(message.id, (e) => res(e));
        });
      };
      const contextGraphCache = /* @__PURE__ */ new Map();
      return {
        get: (graphid) => generic_nodes2[graphid] ?? contextGraphCache.get(graphid) ?? messagePromise({ kind: "get", graphid }).then((e) => e.graph).then((graph) => (contextGraphCache.set(graphid, graph), graph)),
        set: (k, g) => {
          throw new Error("not implemented");
        },
        delete: (k) => {
          throw new Error("not implemented");
        },
        clear: () => {
          throw new Error("not implemented");
        },
        keys: () => messagePromise({ kind: "keys" }).then((e) => e.keys),
        add_edge: () => {
          throw new Error("not implemented");
        },
        remove_edge: () => {
          throw new Error("not implemented");
        },
        add_node: () => {
          throw new Error("not implemented");
        },
        remove_node: () => {
          throw new Error("not implemented");
        },
        add_nodes_edges: () => {
          throw new Error("not implemented");
        }
      };
    };
    openNodysseusDB = () => openDB("nodysseus", 4, {
      upgrade(db, oldVersion, newVersion) {
        if (oldVersion < 2) {
          db.createObjectStore("assets");
        }
        if (oldVersion < 3) {
          db.createObjectStore("persist");
        }
        if (oldVersion < 4) {
          db.createObjectStore("refs");
        }
      }
    });
    webClientStore = async (refStore) => {
      const nodysseusidb = await openNodysseusDB();
      return {
        refs: await (refStore ? refStore(nodysseusidb) : sharedWorkerRefStore()),
        parents: mapStore(),
        state: mapStore(),
        fns: mapStore(),
        assets: {
          get: (id) => nodysseusidb.get("assets", id),
          set: (id, blob) => nodysseusidb.put("assets", blob, id),
          delete: (id) => nodysseusidb.delete("assets", id),
          clear: () => nodysseusidb.clear("assets"),
          keys: () => nodysseusidb.getAllKeys("assets").then((ks) => ks.map((k) => k.toString()))
        },
        persist: {
          get: (id) => nodysseusidb.get("persist", id),
          set: (id, str) => nodysseusidb.put("persist", str, id),
          delete: (id) => nodysseusidb.delete("persist", id),
          clear: () => nodysseusidb.clear("persist"),
          keys: () => nodysseusidb.getAllKeys("persist").then((ks) => ks.map((k) => k.toString()))
        }
      };
    };
  }
});

// src/sharedWorker.js
init_util();
var store;
var initQueue = [];
var processMessage = (port, m) => {
  console.log("processing", m);
  if (m.kind === "get") {
    wrapPromise(store.refs.get(m.graphid)).then((graph) => port.postMessage({ kind: "get", id: m.id, graph }));
  } else if (m.kind === "keys") {
    wrapPromise(store.refs.keys()).then((keys) => port.postMessage({ kind: "keys", id: m.id, keys }));
  }
};
self.onerror = (e) => console.error("sharedworker error", e);
self.onconnect = (e) => {
  console.log("connect!", e);
  const port = e.ports[0];
  port.addEventListener("message", (e2) => {
    console.log("shared worker message", e2.data);
    if (store) {
      processMessage(port, e2.data);
    } else {
      initQueue.push([port, e2.data]);
    }
  });
  port.start();
  port.postMessage({ kind: "connect" });
};
init_store().then(() => store_exports).then(({ automergeRefStore: automergeRefStore2, webClientStore: webClientStore2 }) => {
  webClientStore2((nodysseusidb) => automergeRefStore2({ nodysseusidb, persist: true })).then((resStore) => {
    console.log("got store", resStore);
    store = resStore;
    initQueue.forEach((e) => processMessage(...e));
  });
});
//# sourceMappingURL=sharedWorker.js.map
