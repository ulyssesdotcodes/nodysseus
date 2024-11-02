import {
  ancestor_graph,
  ispromise,
  isWrappedPromise,
  wrapPromise,
  wrapPromiseAll,
  base_graph,
  base_node,
  compareObjects,
  descendantGraph,
  handleError,
  NodysseusError,
  create_randid
} from "./util.js";
import {
  isNodeGraph,
  Graph,
  NodysseusNode,
  NodysseusStore,
  Store,
  RefNode,
  Edge,
  Lib,
  Env,
  isEnv,
  Args,
  isArgs,
  ResolvedArgs,
  RunOptions,
  TypedArg,
  Extern,
  ValueNode,
  isLib,
  isGraph,
  MemoryState,
  MemoryReference,
  isMemory,
  NodeMetadata,
  ApFunction,
} from "./types.js";
import { combineEnv, newLib, newEnv, mergeLib } from "./util.js";
import generic from "./generic.js";
import * as externs from "./externs.js";
import { initListeners } from "./events.js";
import { objectRefStore } from "./store.js";
import { parser } from "@lezer/javascript";
import { json } from "@codemirror/lang-json";

const generic_nodes = generic.nodes;

export const mapStore = <T>(): Store<T> => {
  const map = new Map<string, T>();

  return {
    get: (id) => map.get(id),
    set: (id, data: T) => (map.set(id, data), data),
    delete: (id) => map.delete(id),
    clear: () => map.clear(),
    keys: () => [...map.keys()],
  };
};

let nodysseus: NodysseusStore;

const resfetch =
  typeof fetch !== "undefined"
    ? fetch
    : (urlstr, params?) =>
        import("node:https").then(
          (https) =>
            new Promise<string | Response>((resolve) => {
              const url = new URL(urlstr);
              const req = https.request(
                {
                  hostname: url.hostname,
                  port: url.port,
                  path: url.pathname + url.search,
                  headers: params.headers,
                  method: params.method.toUpperCase(),
                },
                async (response) => {
                  const buffer = [];
                  for await (const chunk of response) {
                    buffer.push(chunk);
                  }
                  const data = Buffer.concat(buffer).toString();
                  resolve(data);
                },
              );
              if (params.body) {
                req.write(params.body);
              }
              req.end();
            }),
        );

export const nodysseus_get = (
  obj: Record<string, any> | Args | Env,
  propsArg: string,
  lib: Lib,
  defaultValue = undefined,
  props: Array<string> = [],
  options: RunOptions = {},
) => {
  const objArg = obj;
  obj = isEnv(obj) ? obj.data : obj;
  if (!obj) {
    return defaultValue;
  }
  const naive = isArgs(obj) ? obj.get(propsArg) : obj[propsArg];
  if (naive !== undefined) {
    return naive;
  }

  let prop;
  if (props.length === 0) {
    if (typeof propsArg == "string") {
      if (propsArg.includes(".")) {
        props = propsArg.split(".");
      } else {
        props.push(propsArg);
      }
    }
    if (typeof propsArg == "symbol" || typeof propsArg === "number") {
      props.push(propsArg);
    }
  }

  if (!Array.isArray(props)) {
    throw new Error("props arg must be an array, a string or a symbol");
  }

  while (props.length) {
    if (obj && ispromise(obj)) {
      return obj.then((r) =>
        props.length > 0
          ? nodysseus_get(r, propsArg, lib, defaultValue, props)
          : r,
      );
    }

    prop = props[0];
    if (
      obj === undefined ||
      typeof obj !== "object" ||
      !(isArgs(obj)
        ? obj.has(prop)
        : obj[prop] !== undefined ||
          (obj.hasOwnProperty && Object.hasOwn(obj, prop)))
    ) {
      return isEnv(objArg)
        ? nodysseus_get(objArg.env, propsArg, lib, defaultValue, props)
        : defaultValue;
    }

    props.shift();

    obj = isArgs(obj) ? obj.get(prop) : obj[prop];

    if (obj && ispromise(obj)) {
      return obj.then((r) =>
        props.length > 0
          ? nodysseus_get(r, propsArg, lib, defaultValue, props)
          : r,
      );
    }
  }
  return obj;
};

function compare(value1, value2) {
  if (value1 === value2) {
    return true;
  }
  /* eslint-disable no-self-compare */
  // if both values are NaNs return true
  if (value1 !== value1 && value2 !== value2) {
    return true;
  }
  if (!!value1 !== !!value2) {
    return false;
  }
  if (typeof value1 !== typeof value2) {
    return false;
  }
  if (typeof value1 === "function" || typeof value2 === "function") {
    // no way to know if context of the functions has changed
    return false;
  }
  if (Array.isArray(value1)) {
    return compareArrays(value1, value2);
  }
  if (typeof value1 === "object" && typeof value2 === "object") {
    if (
      value1.fn &&
      value1.fn === value2.fn &&
      compare(value1.graph, value2.graph) &&
      compare(value1.args, value2.args)
    ) {
      return true;
    }
    if (value1 instanceof Map && value2 instanceof Map) {
      return compareArrays([...value1.entries()], [...value2.entries()]);
    }
    if (value1 instanceof Set && value2 instanceof Set) {
      return compareArrays(Array.from(value1), Array.from(value2));
    }

    return compareObjects(value1, value2);
  }

  return compareNativeSubrefs(value1, value2);
}

function compareNativeSubrefs(value1, value2) {
  // e.g. Function, RegExp, Date
  return value1.toString() === value2.toString();
}

function compareArrays(value1, value2) {
  const len = value1.length;
  if (len != value2.length) {
    return false;
  }
  let alike = true;
  for (let i = 0; i < len; i++) {
    if (!compare(value1[i], value2[i])) {
      alike = false;
      break;
    }
  }
  return alike;
}

const hashcode = function (str, seed = 0) {
  let h1 = 0xdeadbeef ^ seed,
    h2 = 0x41c6ce57 ^ seed;
  let i = str.length,
    ch;
  while (i > 0) {
    i--;
    ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 =
    Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^
    Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 =
    Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^
    Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return 4294967296 * (2097151 & h2) + (h1 >>> 0);
};

export const node_value = (node: ValueNode | RefNode) =>
  externs.parseValue(node.value);

export const run_extern = (
  extern: ApFunction,
  data: Args,
  lib: Lib,
  options: RunOptions,
  node?: NodysseusNode,
) => {
  let argColonIdx;
  let argspromise = false;
  const isArgsArray = Array.isArray(extern.args);
  const externArgs: Array<[string, TypedArg]> = isArgsArray
    ? extern.args.map((a) => {
        argColonIdx = a.indexOf(":");
        return [argColonIdx >= 0 ? a.substring(0, argColonIdx) : a, "any"];
      })
    : Object.entries(extern.args);
  const args = externArgs.map(([arg]) => {
    let newval;
    if (arg === "_node") {
      newval = node;
    } else if (arg === "_node_args") {
      newval = extern.rawArgs
        ? data
        : [...data.keys()]
            .filter((k) => !k.startsWith("_"))
            .map((k) => data.get(k));
    } else if (arg == "_lib") {
      newval = lib;
    } else if (arg == "_runoptions") {
      newval = options;
    } else if (arg == "__graphid") {
      newval = (data.get("__graphid") as { value: string }).value;
    } else {
      const dataval = data.get(arg);
      newval = dataval;
    }

    argspromise ||= ispromise(newval);
    return newval;
  });

  argspromise ||= ispromise(args);

  if (argspromise && !extern.promiseArgs) {
    return Promise.all(args).then((as) => {
      const res = (typeof extern === "function" ? extern : extern.fn)(
        ...(isArgsArray
          ? as
          : [Object.fromEntries(externArgs.map((a, idx) => [a[0], as[idx]]))]),
      );
      return res;
    });
  } else if (!ispromise(args)) {
    const resArgs = args;
    const res = (typeof extern === "function" ? extern : extern.fn)(
      ...(isArgsArray
        ? resArgs
        : [
            Object.fromEntries(
              externArgs.map((a, idx) => [a[0], resArgs[idx]]),
            ),
          ]),
    );
    return res;
  }
};

export const node_extern = (
  node: RefNode,
  data: Args,
  lib: Lib,
  options: RunOptions,
) => {
  const libExternFn =
    node.value.startsWith("extern.") && node.value.substring(7);
  return run_extern(
    libExternFn
      ? lib.data.extern[libExternFn]
      : nodysseus_get(lib.data, node.value, lib),
    data,
    lib,
    options,
    node,
  );
};

const initStore = (store: NodysseusStore | undefined = undefined) => {
  if (store !== undefined) {
    nodysseus = store;
  }

  if (!nolib.no.runtime) {
    nolib.no.runtime = nolib.no.runtimefn();
  }
};

const runtimefn = () => {
  Object.values(generic_nodes).forEach((graph) => {
    if (isNodeGraph(graph)) {
      graph.edges_in = Object.values(graph.edges).reduce(
        (acc, edge) => ({
          ...acc,
          [edge.to]: { ...(acc[edge.to] ?? {}), [edge.from]: edge },
        }),
        {},
      );
    }
  });

  const {
    publish,
    addListener,
    removeListener,
    pauseGraphListeners,
    togglePause,
    isGraphidListened,
    isListened,
  } = initListeners();

  const change_graph = (
    graph: Graph | string,
    lib: Lib | Record<string, any>,
    changedNodes: Array<string> = [],
    broadcast = false,
    source?,
  ): Graph | Promise<Graph> =>
    wrapPromise(get_parentest(graph)).then((parent) => {
      if (parent) {
        return (lib.data ?? lib).no.runtime.change_graph(parent, lib, [
          (typeof graph === "string" ? graph : graph.id).substring(
            parent.id.length + 1,
          ),
        ]);
      } else {
        return wrapPromise(
          typeof graph === "string" ? get_ref(graph) : graph,
        ).then((graph) => {
          const changedNodesSet = new Set();
          while (changedNodes.length > 0) {
            const node = changedNodes.pop();
            if (!changedNodesSet.has(node)) {
              changedNodesSet.add(node);
              Object.keys(descendantGraph(node, graph, (node) => node)).forEach(
                (n) => changedNodes.push(n),
              );
            }
          }
          publish(
            "graphchange",
            { graph, dirtyNodes: [...changedNodesSet.keys()], source },
            isLib(lib) ? lib : newLib(lib),
            {},
            broadcast,
          );
          publish(
            "graphupdate",
            { graph, dirtyNodes: [...changedNodesSet.keys()], source },
            isLib(lib) ? lib : newLib(lib),
            {},
            broadcast,
          );
          return graph;
        }).value;
      }
    }).value;

  const updatepublish = {};
  const update_args = (id, args, lib: Lib) => {
    let prevargs = nodysseus.state.get(id);
    const graphid = id.includes("#") ? id.split("#")[0] : id;

    if (prevargs === undefined) {
      prevargs = {};
      nodysseus.state.set(id, prevargs);
    }

    if (!compareObjects(args, prevargs, true)) {
      Object.assign(prevargs, args);
      return wrapPromise(get_parentest(graphid))
        .then((parent) => get_graph(parent ?? graphid))
        .then((updatedgraph) => {
          if (
            updatedgraph &&
            !ispromise(updatedgraph) &&
            (!updatepublish[updatedgraph.id] ||
              updatepublish[updatedgraph.id] + 16 < performance.now())
          ) {
            // TODO: fix the use of / here
            let node_id = graphid.split(updatedgraph.id)[1].substring(1);
            node_id =
              node_id.indexOf("/") > 0
                ? node_id.substring(0, node_id.indexOf("/"))
                : node_id;

            publish(
              "graphupdate",
              {
                graph: updatedgraph,
                dirtyNodes:
                  node_id &&
                  Object.keys(
                    descendantGraph(node_id, updatedgraph, (node) => node),
                  ),
              },
              lib,
            );
          }
          return args;
        }).value;
    }

    return args;
  };

  const get_ref = (id, otherwise?) => {
    return wrapPromise(generic_nodes[id] ?? nodysseus.refs.get(id)).then(
      (graph) => {
        if(graph) return graph;

        const newGraph = otherwise && {
          ...otherwise,
          id,
          nodes: {
            ...otherwise.nodes,
            [otherwise.out ?? "out"]: {
              ...otherwise.nodes[otherwise.out ?? "out"],
              name: id,
            },
          },
          // edges: {
          //   ...otherwise.edges
          // },
          // edges_in: undefined
        }

        return otherwise && nodysseus.refs.set(id, newGraph)

        // TODO: make creating a graph create new ids

        const nodeIdMap = new Map();
        const nodes = Object.values(newGraph.nodes) as NodysseusNode[];
        for(let node of nodes) {
          if(node.id === "out") {
            nodeIdMap.set("out", "out")
            continue;
          }
          const oldId = node.id;
          delete newGraph.nodes[oldId];
          node.id = create_randid(newGraph);
          newGraph.nodes[node.id] = node;
          nodeIdMap.set(oldId, node.id)
        }

        newGraph.edges = Object.fromEntries((Object.values(newGraph.edges) as Edge[])
          .map(e => [nodeIdMap.get(e.from), {...e, to: nodeIdMap.get(e.to ), from: nodeIdMap.get(e.from)}]));
        console.log(newGraph)

        return (
          (otherwise &&
            nodysseus.refs.set(id, newGraph))
        );
      },
    ).value;
  };
  const add_ref = (graph: NodysseusNode) => {
    return (Array.isArray(graph) ? graph : [graph]).map((graph) => {
      if (generic_nodes[graph.id] === undefined) {
        nodysseus.refs.set(graph.id, graph);
        return graph;
      }
    })[0];
  };
  const remove_ref = (id) =>
    wrapPromise(nodysseus.refs.keys()).then((keys) => {
      if (keys.includes(id)) {
        return nodysseus.refs.delete(id);
      } else {
        return Promise.all(
          keys
            .filter((k) => k.startsWith(`@${id}`))
            .map((k) => nodysseus.refs.delete(k)),
        );
      }
    }).value;

  const get_node = (graph: Graph, id: string) => graph.nodes[id];
  const get_edge = (graph, from) =>
    wrapPromise(get_graph(graph)).then((g) => g?.edges[from]).value;
  const get_edges_in = (graph: Graph, id) =>
    Object.hasOwn(graph.edges_in, id) ? Object.values(graph.edges_in[id]) : [];
  // wrapPromise(get_graph(graph))
  //   .then(g => {
  //     if(g.edges_in === undefined) {
  //       return Object.values(g.edges).filter(e => e.to === id);
  //     }
  //
  //     const idEdgesIn = g.edges_in?.[id];
  //     if(idEdgesIn !== undefined) {
  //       return Object.values(idEdgesIn)
  //     }
  //     return []
  //   }).value
  const get_edge_out = get_edge;

  const get_args = (graph) =>
    nodysseus.state.get(typeof graph === "string" ? graph : graph.id) ?? {};
  const get_graph = (
    graph: string | Graph,
  ): Graph | Promise<Graph> | undefined =>
    wrapPromise(
      nodysseus.refs.get(typeof graph === "string" ? graph : graph.id),
    ).then((g: NodysseusNode) => {
      return isNodeGraph(g)
        ? g
        : typeof graph !== "string" && isNodeGraph(graph)
          ? graph
          : undefined;
    }).value;
  const get_parent = (graph) => {
    return nodysseus.parents.get(
      typeof graph === "string" ? graph : graph && graph.id,
    );
  };
  const getGraphIdRef = (graphid) => {
    return wrapPromise(nodysseus.parents.get(graphid)).then(
      (res) => res?.nodeRef,
    ).value;
  };
  const get_parentest = (graph) => {
    return wrapPromise(
      nodysseus.parents.get(typeof graph === "string" ? graph : graph.id),
    ).then(
      (parent) => parent && parent.parentest && get_graph(parent.parentest),
    ).value;
  };
  const get_path = (graph, path) => {
    graph = get_graph(graph);
    const pathSplit = path.split(".");
    let node = graph.out || "out";
    while (pathSplit.length > 0 && node) {
      const pathval = pathSplit.shift();
      const edge = get_edges_in(graph, node).find((e) => e.as === pathval);
      node = edge ? edge.from : undefined;
    }
    return node;
  };

  return {
    get_ref,
    add_ref,
    add_refs: (gs) => gs.forEach((g) => nodysseus.refs.set(g.id, g)),
    addRefsFromUrl: (url: string) => nodysseus.refs.addFromUrl(url),
    remove_ref,
    get_node,
    get_edge,
    get_edges_in,
    get_edge_out,
    get_parent,
    get_parentest,
    getGraphIdRef,
    get_fn: (id, name, orderedargs, script): Function => {
      const fnid = id;
      return wrapPromise(nodysseus.fns.get(fnid + orderedargs)).then((fn) => {
        if (!fn || fn.script !== script) {
          fn = Object.assign(fn ?? {}, {
            script,
            fn: new Function(
              `return function _${name.replace(
                /(\s|\/)/g,
                "_",
              )}(_lib, _node, _graph_input_value${orderedargs}){${script}}`,
            )(),
            // ` this comment is here because my syntax highlighter is not well
          });

          nodysseus.fns.set(fnid + orderedargs, fn);
        }

        return fn.fn;
      }).value;
    },
    graphExport: (graphid): Array<Graph> | Promise<Array<Graph>> =>
      Object.keys(generic.nodes).includes(graphid)
        ? ([] as Array<Graph>)
        : wrapPromise(get_graph(graphid)).then(
            (graph) =>
              wrapPromiseAll(Object.values(graph.nodes).map((node) => [])).then<
                Graph[]
              >((nodeGraphs) => nodeGraphs.flat().concat([graph])).value,
          ).value,
    change_graph,
    update_graph: (graphid, lib: Lib) =>
      publish("graphupdate", { graph: graphid }, lib),
    update_args,
    clearState: () => nodysseus.state.clear(),
    delete_cache: () => {
      publish("cachedelete", {}, newLib(nolib));
    },
    clearListeners: () => {
      publish("listenersclear", {}, newLib(nolib));
    },
    get_graph,
    get_args,
    get_path,
    add_asset: (id, b) => nolib.no.runtime.store.assets.set(id, b),
    get_asset: (id) => id && nolib.no.runtime.store.assets.get(id),
    list_assets: () => nolib.no.runtime.store.assets.keys(),
    remove_asset: (id) => nolib.no.runtime.store.assets.delete(id),
    refs: () => nodysseus.refs.keys(),
    ref_graphs: async () => {
      const keys = await nodysseus.refs.keys();
      return keys;
    },
    updateGraph: async ({
      graph,
      addedNodes = [],
      addedEdges = [],
      removedNodes = [],
      removedEdges = [],
      lib,
    }: {
      graph: string | Graph;
      addedEdges?: Array<Edge>;
      removedEdges?: Array<{ [k in Exclude<keyof Edge, "as">]: Edge[k] }>;
      addedNodes?: Array<NodysseusNode>;
      removedNodes?: Array<NodysseusNode>;
      lib: Lib;
      dryRun?: boolean;
    }): Promise<Graph> => {
      const graphId = typeof graph === "string" ? graph : graph.id;
      await Promise.resolve(
        nodysseus.refs.add_nodes_edges({
          graphId,
          addedNodes,
          addedEdges,
          removedEdges,
          removedNodes,
        }),
      );
      // if(Array.isArray(remove)) {
      //   await Promise.all(remove.map(e => nodysseus.refs.remove_edge(graphId, e)))
      // } else if (typeof remove === "object") {
      //   await Promise.resolve(nodysseus.refs.remove_edge(graphId, remove))
      // }
      // if(Array.isArray(add)) {
      //   await Promise.all(add.map(e => nodysseus.refs.add_edge(graphId, e)))
      // } else if (typeof add === "object") {
      //   await Promise.resolve(nodysseus.refs.add_edge(graphId, add))
      // }
      return change_graph(
        nodysseus.refs.get(graphId) as Graph,
        lib,
        addedEdges.map((e) => e.to).concat(addedNodes.map((n) => n.id)),
      );
    },
    add_node: (graph: Graph, node: NodysseusNode, lib: Lib) => {
      if (!(node && typeof node === "object" && node.id)) {
        throw new Error(`Invalid node: ${JSON.stringify(node)}`);
      }

      // graph = get_graph(graph);

      // const new_graph = {
      //   ...graph,
      //   nodes: {...graph.nodes, [node.id]: node},
      // };

      // n.b. commented out because it blasts update_args which is not desirable
      // delete_cache(graph)
      const graphId = typeof graph === "string" ? graph : graph.id;
      nodysseus.refs.add_node(graphId, node);
      change_graph(nodysseus.refs.get(graphId) as Graph, lib, [node.id]);
    },
    add_nodes_edges: (
      graph,
      nodes: NodysseusNode[],
      edges: Edge[],
      remove_edges: Edge[],
      remove_nodes: NodysseusNode[],
      lib: Lib,
    ) => {
      const graphId = typeof graph === "string" ? graph : graph.id;
      nodysseus.refs.add_nodes_edges({
        graphId,
        addedNodes: nodes,
        addedEdges: edges,
        removedEdges: remove_edges,
        removedNodes: remove_nodes,
      });
      change_graph(
        nodysseus.refs.get(graphId) as Graph,
        lib,
        nodes
          .concat(remove_nodes)
          .map((n) => n.id)
          .concat(edges.concat(remove_edges).flatMap((e) => [e.to, e.from])),
      );
    },
    delete_node: (graph: Graph, id, lib: Lib, changeEdges = true) => {
      wrapPromise(get_graph(graph)).then((graph) => {
        const graphId = typeof graph === "string" ? graph : graph.id;

        const parent_edge = lib.data.no.runtime.get_edge_out(graph, id);
        const child_edges = lib.data.no.runtime.get_edges_in(graph, id);

        const current_child_edges = lib.data.no.runtime.get_edges_in(
          graph,
          parent_edge.to,
        );
        const new_child_edges = child_edges.map((e, i) => ({
          ...e,
          to: parent_edge.to,
          as:
            i === 0
              ? parent_edge.as
              : !e.as
                ? e.as
                : current_child_edges.find(
                      (ce) => ce.as === e.as && ce.from !== id,
                    )
                  ? e.as + "1"
                  : e.as,
        }));

        if (changeEdges === undefined) {
          nodysseus.refs.remove_node(graphId, id);
        } else {
          nodysseus.refs.add_nodes_edges({
            graphId,
            addedEdges: new_child_edges,
            removedEdges: child_edges,
            removedNodes: [graph.nodes[id]],
          });
          change_graph(
            nodysseus.refs.get(graphId) as Graph,
            lib,
            current_child_edges
              .concat(new_child_edges)
              .flatMap((e) => [e.to, e.from]),
          );
        }
      });
    },
    addListener,
    addListener_extern: {
      args: ["event", "listener_id", "fn"],
      addListener,
    },
    removeListener,
    pauseGraphListeners,
    isGraphidListened,
    isListened,
    togglePause,
    publish,
    set_parent: (graph, parent, nodeRef?: string) => {
      const graphid = graph;
      const parentid = parent;
      return wrapPromise(nodysseus.parents.get(parentid)).then(
        (parent_parent) => {
          const parentest =
            (parent_parent ? parent_parent.parentest : false) || parentid;
          const new_parent = {
            id: graphid,
            parent: parentid,
            parentest,
            nodeRef,
          };
          nodysseus.parents.set(graphid, new_parent);
        },
      ).value;
    },
    undo: (id: string) => nodysseus.refs.undo && nodysseus.refs.undo(id),
    redo: (id: string) => nodysseus.refs.redo && nodysseus.refs.redo(id),
    store: nodysseus,
    ancestor_graph,
  } as const;
};

type Runtime = ReturnType<typeof runtimefn>;

const nolib: Record<string, any> & {
  no: { runtime: Runtime } & Record<string, any>;
} = {
  no: {
    base_graph,
    base_node,
    nodysseus_get,
    ispromise,
    NodysseusError,
    runtime: undefined,
    wrapPromise,
    runtimefn,
    isMemory,
  },
  extern: {
    // runGraph: F<A> => A
    create_fn: {
      args: ["function", "_lib"],
      fn: externs.create_fn,
    },
    parseValue: {
      args: ["value"],
      fn: externs.parseValue,
    },
    workerRunnable: {
      args: ["graph"],
      fn: () => {},
    },
    expect: {
      args: ["a", "b", "__graph_value"],
      fn: externs.expect,
    },
    entries: {
      args: ["object"],
      fn: (obj) => {
        return Object.entries(obj);
      },
    },
    fromEntries: {
      args: ["entries"],
      fn: (entries) => {
        return Object.fromEntries(entries);
      },
    },
    cache: {
      args: ["value", "recache"],
      fn: () => {},
    },
    persistState: {
      args: ["kvs"],
      fn: (kvs) =>
        kvs &&
        typeof kvs === "object" &&
        wrapPromiseAll(
          Object.entries(kvs).map((kv) => nodysseus.persist.set(...kv)),
        ).value,
    },
    memoryUnwrap: {
      args: ["value: default"],
      fn: externs.memoryUnwrap,
    },
    runNode: {
      args: ["node"],
      fn: () => {},
    },
    nodeDisplay: {
      args: ["__graph_value"],
      fn: () => {},
    },
    compare: {
      args: ["_node_args"],
      fn: (args) => compare(args[0], args[1]),
    },
    eq: {
      args: ["_node_args"],
      fn: (args: Array<any>) => args.every((v) => v === args[0]),
    },
    get: {
      outputs: {
        metadata: true,
      },
      args: {
        target: { type: "any", default: true },
        path: "any",
        def: "any",
        __graph_value: "system",
        _lib: "system",
        _output: "system",
      },
      fn: ({ target, path, def, __graph_value, _lib, _output }) => {
        const getPrototypeNames = (obj) =>
          obj && typeof obj === "object" && Object.getPrototypeOf(obj)
            ? Object.getOwnPropertyNames(obj).concat(
                getPrototypeNames(Object.getPrototypeOf(obj)),
              )
            : [];
        if (_output === "metadata") {
          return {
            values: getPrototypeNames(target),
          };
        }
        const _path = __graph_value || path;
        return _path
          ? _lib.data.no.nodysseus_get(
              typeof _path === "string" && _path.startsWith("lib")
                ? _lib.data
                : target,
              typeof _path === "string" && _path.startsWith("lib")
                ? _path.substring(3)
                : _path,
              _lib,
              def,
            )
          : target;
      },
    },
    set: {
      args: ["target: default", "path", "value", "__graph_value"],
      fn: (target, path, value, nodevalue) => {
        const ispromise = <T>(a: any): a is Promise<T> =>
          a && typeof a.then === "function" && !isWrappedPromise(a);
        const keys = (nodevalue || path).split(".");
        const check = (o, v, k) =>
          k.length === 1
            ? { ...o, [k[0]]: v }
            : o && typeof o === "object" && Object.hasOwn(o, k[0])
              ? {
                  ...o,
                  [k[0]]: check(o[k[0]], v, k.slice(1)),
                }
              : o;
        const ret =
          (value !== undefined && ispromise(value)) || ispromise(target)
            ? Promise.all([
                Promise.resolve(value),
                Promise.resolve(target),
              ]).then((vt) => vt[1] !== undefined && check(vt[1], vt[0], keys))
            : check(target, value, keys);
        return ret;
      },
    },
    set_mutable: {
      args: ["target: default", "path", "value", "__graph_value", "_lib"],
      fn: (target, path, value, nodevalue, _lib) => {
        function set(obj, propsArg, value) {
          let props;
          if (Array.isArray(propsArg)) {
            props = propsArg.slice(0);
          }
          if (typeof propsArg == "string") {
            props = propsArg.split(".");
          }
          if (typeof propsArg == "symbol") {
            props = [propsArg];
          }
          if (!Array.isArray(props)) {
            throw new Error("props arg must be an array, a string or a symbol");
          }
          const lastProp = props.pop();
          if (!lastProp) {
            return false;
          }
          let thisProp;
          while ((thisProp = props.shift())) {
            if (typeof obj[thisProp] == "undefined") {
              obj[thisProp] = {};
            }
            obj = obj[thisProp];
            if (!obj || typeof obj != "object") {
              return false;
            }
          }
          obj[lastProp] = value;
          return true;
        }
        if (target && (nodevalue || path)) {
          set(
            target,
            nodevalue || path,
            (_lib.data ?? _lib).no.isMemory(value)
              ? externs.memoryUnwrap(value)
              : value,
          );
        }
        return target;
      },
    },
    liftarraypromise: {
      args: ["array"],
      resolve: true,
      fn: (array) => {
        const isarraypromise = array.reduce(
          (acc, v) => acc || ispromise(v),
          false,
        );
        return isarraypromise ? Promise.all(array) : array;
      },
    },
    new_array: {
      args: ["_node_args", "__graph_value"],
      fn: (args, nodevalue) =>
        nodevalue
          ? nodevalue.split(/,\s+/)
          : wrapPromiseAll(
              Object.entries(args)
                .sort((akv, bkv) => akv[0].localeCompare(bkv[0]))
                .map((kv: [string, any]) => wrapPromise(kv[1])),
            ).then((r) => r.map((rv) => rv)).value,
    },
    fetch: {
      resolve: true,
      args: ["__graph_value", "url", "params"],
      fn: (nodevalue, url, params) => resfetch(url || nodevalue, params),
    },
    import_module: {
      args: ["url", "__graph_value", "_lib"],
      fn: (url, graphvalue) => {
        const urlval = url || graphvalue;
        if (!urlval) return;
        const stateid = `__jsimport:${urlval}`;
        const existing = nodysseus.state.get(stateid);
        if (existing) return existing;
        const promise = import(urlval)
          .then((jsmodule) => jsmodule.default ?? jsmodule)
          .then(
            (jsmodule) => (nodysseus.state.set(stateid, jsmodule), jsmodule),
          );
        nodysseus.state.set(stateid, promise);
        return promise;
      },
    },
    call: {
      resolve: true,
      outputs: {
        metadata: true,
      },
      args: {
        __graph_value: "system",
        self: { type: "any", default: true },
        fn: "value",
        args: "@data.array",
        _lib: "lib",
        _output: "system",
      },
      fn: ({ __graph_value, self, fn, args, _lib, _output }) => {
        const getPrototypeChainMethods = (obj) =>
          obj && typeof obj === "object" && Object.getPrototypeOf(obj)
            ? Object.getOwnPropertyNames(obj)
                .filter(
                  (n) =>
                    typeof Object.getOwnPropertyDescriptor(obj, n).value ===
                    "function",
                )
                .concat(getPrototypeChainMethods(Object.getPrototypeOf(obj)))
            : [];
        const nodevalue = __graph_value;
        const runfn = (args) => {
          if (typeof self === "function") {
            return Array.isArray(args)
              ? self(
                  ...args
                    .reverse()
                    .reduce(
                      (acc, v) => [
                        !acc[0] && v !== undefined,
                        acc[0] || v !== undefined ? acc[1].concat(v) : acc[1],
                      ],
                      [false, []],
                    )[1]
                    .reverse(),
                )
              : self(args === undefined ? [] : args);
          } else {
            const ng_fn = (_lib.data ?? _lib).no.nodysseus_get(
              self ?? _lib.data ?? _lib,
              fn || nodevalue,
              _lib.data ?? _lib,
            );
            const ng_self = (fn || nodevalue)?.includes(".")
              ? (_lib.data ?? _lib).no.nodysseus_get(
                  self,
                  (fn || nodevalue).substring(
                    0,
                    (fn || nodevalue).lastIndexOf("."),
                  ),
                  _lib.data ?? _lib,
                )
              : self;
            if (_output === "metadata") {
              const parameters =
                typeof ng_fn === "function"
                  ? (_lib.data ?? _lib).extern.functionParameters.fn(ng_fn)
                  : [];
              return {
                values:
                  self && typeof self === "object"
                    ? getPrototypeChainMethods(self)
                    : [],
                parameters,
              };
            }
            const fnargs = Array.isArray(args)
              ? (args || [])
                  .reverse()
                  .reduce(
                    (acc, v) => [
                      !acc[0] && v !== undefined,
                      acc[0] || v !== undefined ? acc[1].concat(v) : acc[1],
                    ],
                    [false, []],
                  )[1]
                  .reverse()
              : args === undefined
                ? []
                : [args];
            const ret = (_lib.data ?? _lib).no.ispromise(ng_fn)
              ? ng_fn.then((f: any) => f.apply(fnargs))
              : typeof ng_fn === "function"
                ? ng_fn.apply(ng_self, fnargs)
                : ng_self;
            return ret;
          }
        };

        return (_lib.data ?? _lib).no.ispromise(args)
          ? args.then(runfn)
          : runfn(args);
      },
    },
    merge_objects_mutable: {
      args: ["target: default", "_node_args", "_lib", "_runoptions"],
      fn: (target, args, lib, options) => {
        const seen = new Set();
        const merge = (target = {}, value) => {
          if (seen.has(value)) return target;
          seen.add(value);
          Object.entries(value)
            .filter((kv) => !kv[0].startsWith("_"))
            .map((kv) =>
              isArgs(kv[1]) ? [kv[0], Object.fromEntries(kv[1].entries())] : kv,
            )
            .forEach(([k, v]: [string, unknown]) => {
              if (
                typeof v === "object" &&
                !Array.isArray(v) &&
                !ArrayBuffer.isView(v) &&
                v !== null &&
                typeof target[k] === "object" &&
                target[k] !== null
              ) {
                merge(target[k], v);
              } else {
                target[k] = v;
              }
            });
        };

        return wrapPromiseAll(
          Object.keys(args)
            .filter((k) => k !== "target" && !k.startsWith("_"))
            .map((k) => [k, args[k]]),
        )
          .then(
            (inputs) =>
              wrapPromiseAll(
                inputs.map((kv) => [kv[0], kv[1]]).map((kv) => [kv[0], kv[1]]),
              ).then((kvs) =>
                Object.fromEntries(
                  kvs
                    .filter((kv) => kv[1] !== undefined)
                    .map((kv) => [kv[0], kv[1]]),
                ),
              ).value,
          )
          .then((resolved) => {
            Object.values(resolved).forEach((v) => merge(target, v));
            return target;
          }).value;
      },
    },
    merge_objects: {
      args: ["_node_args"],
      resolve: false,
      fn: (args) => nolib.extern.merge_objects_mutable.fn({}, args),
    },
    delete: {
      args: ["target", "path"],
      resolve: false,
      fn: (target, path) => {
        while (target) {
          target = target._value;
        }
        const newval = Object.assign({}, target);
        delete newval[path];
        return newval;
      },
    },
    now: {
      args: ["scale"],
      fn: externs.now,
    },
    not: {
      args: ["value"],
      fn: (value) => !value,
    },
    math: {
      args: ["__graph_value", "_node_args"],
      resolve: true,
      fn: (graph_value, args) =>
        Math[graph_value](
          ...Object.entries(args)
            .filter((kv) => kv[0] !== "__graph_value")
            .sort((a, b) => a[0].localeCompare(b[0]))
            .map((kv) => externs.memoryUnwrap(kv[1])),
        ),
    },
    add: {
      args: ["_node_args"],
      resolve: true,
      fn: (args) => Object.values(args).reduce((acc : number, v : number) => acc + v, 0),
    },
    and: {
      args: ["_node_args"],
      resolve: true,
      fn: (args) => Object.values(args).reduce((acc, v) => acc && !!v, true),
    },
    or: {
      args: ["_node_args"],
      resolve: true,
      fn: (args) => Object.values(args).reduce((acc, v) => acc || !!v, false),
    },
    mult: {
      args: ["_node_args"],
      resolve: true,
      //TODO: change this back to wrapPromiseAll version
      fn: (args) =>
        Object.entries(args).reduce(
          (acc, e) => acc * (typeof e[1] === "number" ? e[1] : 1),
          1,
        ),
    },
    negate: {
      args: ["value"],
      resolve: true,
      fn: (value) => -value,
    },
    divide: {
      args: ["_node_args"],
      resolve: true,
      fn: (args) =>
        Object.values(args).reduce(
          (acc: any, v: any) => acc / externs.memoryUnwrap(v),
          1,
        ),
    },
    mod: {
      args: ["__graph_value", "value"],
      resolve: true,
      fn: (graph_value, value) => {
        value = externs.memoryUnwrap(value);
        return ((value % graph_value) + value) % graph_value;
      },
    },
    convertAngle: {
      args: ["degrees", "radians"],
      fn: (degrees, radians) => {
        if (degrees && radians) {
          throw new Error("Got both degrees and radians!");
        }

        return degrees ? (degrees * Math.PI) / 180 : (radians * 180) / Math.PI;
      },
    },
    random: {
      args: ["seed"],
      fn:
        (seed = 128) =>
        () => {
          let t = (seed += 0x6d2b79f5);
          t = Math.imul(t ^ (t >>> 15), t | 1);
          t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
          return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
        },
    },
    stringify: {
      args: ["object: default", "spacer"],
      resolve: true,
      fn: (obj, spacer) => JSON.stringify(obj, (key, value) => value, spacer),
    },
    parse: {
      args: ["string"],
      resolve: true,
      fn: (args) => JSON.parse(args),
    },
    typeof: {
      args: ["value"],
      fn: (value) => typeof value,
    },
    construct: {
      args: {
        args: "@data.array",
        name: "any",
        __graph_value: "system",
        _lib: "system",
      },
      fn: ({ args, name, __graph_value, _lib }) => {
        const fn = nodysseus_get(
          _lib.data,
          name || __graph_value,
          _lib,
          typeof window !== "undefined"
            ? window[__graph_value]
            : self[__graph_value],
        );
        return (
          fn &&
          typeof fn === "function" &&
          new (Function.prototype.bind.apply(fn, [
            null,
            ...(args === undefined ? [] : Array.isArray(args) ? args : [args]),
          ]))()
        );
      },
    },
    data: {
      args: ["_node_args"],
      fn: (node_args) => node_args,
    },
    graphState: {
      args: ["graphid"],
      fn: (graphid: string) =>
        wrapPromise(nodysseus.persist.keys()).then(
          (keys) =>
            wrapPromiseAll(
              keys
                .filter((k) => k.startsWith(graphid))
                .map((k) => nodysseus.persist.get(k).then((v) => [k, v])),
            ).then((kvs) => Object.fromEntries(kvs)).value,
        ).value,
    },
    functionParameters: {
      args: ["fn"],
      fn: (fn) => {
        if (!fn) return [];
        const fnstring = fn.toString();
        // hacky: return the first set of parameters we find
        let foundParams = false,
          pastParams = false;
        const args = [];
        parser.parse(fnstring).iterate({
          enter: (syntaxNode) => {
            if (
              !pastParams &&
              syntaxNode.matchContext(["ParamList"]) &&
              syntaxNode.name === "VariableDefinition" &&
              !syntaxNode.matchContext(["Arrow"])
            ) {
              foundParams = true;
              args.push(fnstring.substring(syntaxNode.from, syntaxNode.to));
            } else if (
              !pastParams &&
              foundParams &&
              !syntaxNode.matchContext(["ParamList"])
            ) {
              pastParams = true;
            }
          },
        });
        return args;
      },
    },
  } as Record<string, Extern>,
  // THREE
};

const nolibLib = newLib(nolib);

export {
  nolib,
  nolibLib,
  initStore,
  compare,
  hashcode,
  ispromise,
  NodysseusError,
  resfetch,
};
