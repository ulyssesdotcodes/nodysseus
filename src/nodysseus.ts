import set from "just-safe-set";
import loki from "lokijs";
import { ancestor_graph, ispromise, node_args } from "./util"
import { isNodeGraph, Graph, LokiT, Node, NodysseusStore, Store, Result, Runnable, isValue, isNodeRef, RefNode } from "./types"
import generic from "./generic.js";
import { create_fn, expect, now } from "./externs";

const Nodysseus = (): NodysseusStore => {
  const isBrowser = typeof window !== 'undefined';
  const persistdb = new loki("nodysseus_persist.db", {
    env: isBrowser ? "BROWSER" : "NODEJS",
    persistenceMethod: "memory",
  })
  const refsdb = persistdb.addCollection<LokiT<Node>>("refs", {unique: ["id"]});

  const db = new loki("nodysseus.db", {
    env: isBrowser ? "BROWSER" : "NODEJS",
    persistenceMethod: "memory",
  });


  const nodesdb = db.addCollection<LokiT<Node>>("nodes", { unique: ["id"] });
  const statedb = db.addCollection<LokiT<any>>("state", { unique: ["id"] });
  const fnsdb = db.addCollection<LokiT<{script: string, fn: Function}>>("fns", { unique: ["id"] });
  const parentsdb = db.addCollection<LokiT<{parent: string, parentest: string}>>("parents", { unique: ["id"] });

  return {
    refs: lokidbToStore(refsdb),
    parents: lokidbToStore(parentsdb),
    nodes: lokidbToStore(nodesdb),
    state: lokidbToStore(statedb),
    fns: lokidbToStore(fnsdb),
    assets: {
      get: id => { throw new Error("not implemented")},
      add: (id, value) => { throw new Error("not implemented")},
      remove: id => { throw new Error("not implemented")},
      removeAll: () => { throw new Error("not implemented")},
      all: () => {  throw new Error("not implemented")},
      addMany: bs => { throw new Error("not implemented")}
    }
  }
}

export const lokidbToStore = <T>(collection: loki.Collection<LokiT<T>>) => ({
  add: (id: string, data: T) => {
    const existing = collection.by("id", id);
    if (existing) {
      collection.update(Object.assign(existing, {data}));
    } else {
      collection.insert({ id,  data});
    }
  },
  get: (id: string) => collection.by("id", id)?.data,
  remove: (id: string) => {
    const existing = collection.by("id", id)
    if(existing){
      collection.remove(existing);
    }
  },
  removeAll: () => collection.clear(),
  all: () => collection.where(_ => true).map(v => v.data),
  addMany: gs => gs.map(([id, data]) => collection.insert({id, data}))
})

let nodysseus: NodysseusStore;

let resfetch = typeof fetch !== "undefined" ? fetch : 
    (urlstr, params) => import('node:https').then(https => new Promise((resolve, reject) => {
        const url = new URL(urlstr);
        const req = https.request({
            hostname: url.hostname,
            port: url.port,
            path: url.pathname + url.search,
            headers: params.headers,
            method: params.method.toUpperCase()
        }, async response => {
            const buffer = [];
            for await(const chunk of response) {
                buffer.push(chunk);
            }
            const data = Buffer.concat(buffer).toString();
            resolve(data);
        })
        if(params.body) {
            req.write(params.body)
        }
        req.end();
    }));

export const nodysseus_get = (obj, propsArg, lib, defaultValue=undefined) => {
    let objArg = obj;
    let level = 0;
  if (!obj) {
    return defaultValue;
  }
  const naive = obj[propsArg];
  if(naive) {
    return naive;
  }
  var props, prop;
  if (Array.isArray(propsArg)) {
    props = propsArg.slice(0);
  }
  if (typeof propsArg == 'string') {
    props = /\./.test(propsArg) ? propsArg.split('.') : [propsArg];
  }
  if (typeof propsArg == 'symbol' || typeof propsArg === 'number') {
    props = [propsArg];
  }
  if (!Array.isArray(props)) {
    throw new Error('props arg must be an array, a string or a symbol');
  }
  while (props.length) {
    if(obj) {
        const ran = run_runnable(obj, lib)
        if(ran?.__value) {
          obj = ran.__value;
          continue;
        }
    }

    if(obj && ispromise(obj)){
        return obj.then(r => props.length > 0 ? nodysseus_get(r, props.join('.'), lib, defaultValue) : r)
    }

    prop = props.length == 0 ? props[0] : props.shift();
    if((obj === undefined || typeof obj !== 'object' || (obj[prop] === undefined && !(obj.hasOwnProperty && obj.hasOwnProperty(prop))))){
        return objArg && objArg.__args ? nodysseus_get(objArg.__args, propsArg, lib, defaultValue) : defaultValue;
    }

    obj = obj[prop];

    if(obj && ispromise(obj)){
        return obj.then(r => props.length > 0 ? nodysseus_get(r, props.join('.'), lib, defaultValue) : r)
    }


    level += 1;
  }
  return obj;
}


function compare(value1, value2) {
    if (value1 === value2) {
        return true;
    }
    /* eslint-disable no-self-compare */
    // if both values are NaNs return true
    if (value1 !== value1 && value2 !== value2) {
        return true;
    }
    if(!!value1 !== !!value2){
        return false;
    }
    if (value1._Proxy || value2._Proxy) {
        return false;
    }
    if (typeof value1 !== typeof value2) {
        return false;
    }
    if(typeof value1 === 'function' || typeof value2 === 'function') {
        // no way to know if context of the functions has changed
        return false;
    }
    if (Array.isArray(value1)) {
        return compareArrays(value1, value2);
    }
    if (typeof value1 === 'object' && typeof value2 === 'object') {
        if(value1.fn && value1.fn === value2.fn 
            && compare(value1.graph, value2.graph)
            && compare(value1.args, value2.args)) {
            return true;
        }
        if ((value1 instanceof Map) && (value2 instanceof Map)) {
            return compareArrays([...value1.entries()], [...value2.entries()]);
        }
        if ((value1 instanceof Set) && (value2 instanceof Set)) {
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
    var len = value1.length;
    if (len != value2.length) {
        return false;
    }
    var alike = true;
    for (var i = 0; i < len; i++) {
        if (!compare(value1[i], value2[i])) {
            alike = false;
            break;
        }
    }
    return alike;
}

function compareObjects(value1, value2) {
    if (value1._needsresolve || value2._needsresolve) {
        return false;
    }

    const keys1 = Object.keys(value1);
    const keys2 = Object.keys(value2);

    if (keys1.length !== keys2.length) {
        return false;
    }

    for (let key of keys1) {
        if(key === "__args"){
            continue;
        }
        if (value1[key] === value2[key]) {
            continue;
        }

        return false
    }

    return true;
}

const hashcode = function (str, seed = 0) {
    let h1 = 0xdeadbeef ^ seed, h2 = 0x41c6ce57 ^ seed;
    let i = str.length, ch;
    while (i > 0) {
        i--;
        ch = str.charCodeAt(i);
        h1 = Math.imul(h1 ^ ch, 2654435761);
        h2 = Math.imul(h2 ^ ch, 1597334677);
    }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
    return 4294967296 * (2097151 & h2) + (h1 >>> 0);
};

const keywords = new Set(["break", "case", "catch", "continue", "debugger", "default", "delete", "do", "else", "finally", "for", "function", "if", "in", "instanceof", "new", "return", "switch", "this", "throw", "try", "typeof", "var", "void", "while", "with"])

class NodysseusError extends Error {
  node_id: string;
    constructor(node_id, ...params) {
        super(...params);

        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, NodysseusError);
        }

        this.node_id = node_id;
    }
}

const node_value = (node) => {
    if (typeof node.value !== 'string') {
        return node.value;
    }

    if(node.value === "undefined") {
        return undefined;
    }

    if(typeof node.value === "string") {
        if (node.value.startsWith('"') && node.value.endsWith('"')) {
            return node.value.substring(1, node.value.length - 1)
        }

        if (node.value.startsWith('{') || node.value.startsWith('[')) {
            try {
                return JSON.parse(node.value.replaceAll("'", "\""));
            } catch (e) { }
        }

        if(node.value.match(/-?[0-9.]*/g)[0].length === node.value.length){
            const float = parseFloat(node.value);
            if (!isNaN(float)) {
                return float;
            }
        }

        if (node.value === 'false' || node.value === 'true') {
            return node.value === 'true';
        }

    }

    return node.value;
}

const mockcombined = (data, graph_input_value) => {
    data.__args = graph_input_value
    return data;
}

const node_nodes = (node, node_id, data, graph_input_value, lib) => {
    return run_graph(node, node_id, mockcombined(data, graph_input_value), lib)
}

const node_script = (node, nodeArgs, lib) => {
    let orderedargs = "";
    const data = {};
    let is_iv_promised = false;
    for(let i of Object.keys(nodeArgs)) {
        orderedargs += ", " + i;
        if(nodeArgs[i] !== undefined){
            const graphval = run_runnable(nodeArgs[i], lib);
            data[i] = graphval
            is_iv_promised ||= ispromise(graphval);
        }
    }

    const name = node.name ? node.name.replace(/\W/g, "_") : node.id;
    const fn = lib.no.runtime.get_fn(node.id, name, `_lib, _node, _graph_input_value${orderedargs}`, node.script ?? node.value);

    const result = is_iv_promised
        ? Promise.all(Object.keys(nodeArgs).map(iv => Promise.resolve(data[iv]))).then(ivs => lib.no.of(fn.apply(null, [lib, node, data, ...ivs.map(iv => iv?.__value)])))
        : lib.no.of(fn.apply(null, [lib, node, data, ...Object.values(data).map(d => (d as Result)?.__value)]));
    
    return result;
}

const node_extern = (node, data, graphArgs, lib) => {
    const extern = nodysseus_get(lib, node.value, lib);
    let argspromise = false;
    const args = typeof extern === 'function' ?  resolve_args(data, lib) :  extern.args.map(arg => {
        let newval;
        if (arg === '_node') {
            newval = node 
        } else if (arg === '_node_args') {
            newval = extern.rawArgs ? data : resolve_args(data, lib)
            newval = ispromise(newval) ? newval.then(v => v?.__value)  : extern.rawArgs ? newval : newval.__value
        } else if (arg == '_lib') {
            newval = lib;
        } else if (arg == '_graph_input_value') {
            newval = graphArgs;
        } else if (arg == '__graphid') {
            newval = nodysseus_get(graphArgs, "__graphid", lib);
        } else {
            newval = extern.rawArgs ? data[arg] : run_runnable(data[arg], lib)
            newval = ispromise(newval) ? newval.then(v => v?.__value) : newval && !extern.rawArgs ? newval.__value : newval;
        }

        argspromise ||= ispromise(newval);
        return newval;
    });

    argspromise ||= ispromise(args)

    if (argspromise) {
        return (Array.isArray(args) ? Promise.all(args) : args.then(v => v?.__value.args)).then(as => {
            const res = (typeof extern === 'function' ? extern :  extern.fn).apply(null, as);
            return extern.rawArgs ? res : lib.no.of(res);
        })
    } else {
        const res = (typeof extern === 'function' ? extern :  extern.fn).apply(null, Array.isArray(args) ? args : args?.__value.args);
        return extern.rawArgs ? res : lib.no.of(res);
    }
}

const resolve_args = (data, lib) => {
    let is_promise = false;
    const result = {}
    Object.entries(data).forEach(kv => {
      result[kv[0]] = run_runnable(kv[1], lib);
      is_promise = is_promise || !!kv[1] && ispromise(result[kv[0]]);
    })

    if (is_promise) {
        const promises = [];
        Object.entries(result).forEach(kv => {
            promises.push(Promise.resolve(kv[1]).then(pv => [kv[0], (pv as Result)?.__value]))
        })
        return Promise.all(promises).then(Object.fromEntries).then(v => lib.no.of(v));
    }

    return lib.no.of(Object.fromEntries(
        Object.entries(result)
            .filter(d => !d[0].startsWith("__")) // filter out private variables
            .map(e => [e[0], (e[1] as Result)?.__value])
    ));

}

const node_data = (nodeArgs, graphArgs, lib) => {
  return Object.keys(nodeArgs).length === 0 ? lib.no.of(undefined) : resolve_args(nodeArgs, lib);
}

// derives data from the args symbolic table
const create_data = (node_id, graph, inputs, graphArgs, lib) => {
    const data = {};
    let input;
    //TODO: remove
    const newgraphargs = graphArgs._output ? {...graphArgs, _output: undefined} : graphArgs;
    // delete newgraphargs._output

    // grab inputs from state
    for (let i = 0; i < inputs.length; i++) {
        input = inputs[i];

        const val = {graph, fn: input.from, args: newgraphargs, isArg: true, __isnodysseus: true, lib}
        // Check for duplicates
        if(data[input.as]) {
            const as_set = new Set()
            inputs.forEach(e => {
                if (as_set.has(e.as)) {
                    throw new NodysseusError(graph.id + "/" + node_id, `Multiple input edges have the same label "${e.as}"`)
                }
                as_set.add(e.as)
            })
        }
        data[input.as] = val;
    }

    return data;
}

const run_runnable = (runnable, lib) => 
    !runnable?.__isnodysseus
    ? runnable
    : runnable?.fn && runnable?.graph 
    ? run_graph(runnable.graph, runnable.fn, runnable.args ?? {}, lib)
    : runnable?.id
    ? run_node(runnable, {}, {}, lib)
    : runnable

// graph, node, symtable, parent symtable, lib
const run_node = (node, nodeArgs, graphArgs, lib) => {
    if (node.ref) {

        if (node.ref === "arg") {
            const resval = nolib.no.arg(node, graphArgs, lib, node.value);
            return resval && typeof resval === 'object' && Object.hasOwn(resval, "__value") ? resval : lib.no.of(resval);
        } else if (node.ref === "extern") {
            return node_extern(node, nodeArgs, graphArgs, lib)
        } else if (node.ref === "script") {
            return node_script(node, nodeArgs, lib)
        }

        let node_ref = lib.no.runtime.get_ref(node.ref);

        if (!node_ref) {
            throw new Error(`Unable to find ref ${node.ref} for node ${node.name || node.id}`)
        }

        const graphid = nodysseus_get(graphArgs, "__graphid", lib)?.__value;
        const newgraphid = (graphid ? graphid + "/" : "") + node.id
        const newGraphArgs = {_output: nodysseus_get(graphArgs, "_output", lib), __graphid: lib.no.of(newgraphid)};
        if(node_ref.nodes) {
            const current = lib.no.runtime.get_graph(newgraphid);
            lib.no.runtime.set_parent(newgraphid, graphid); // before so that change/update has the parent id
            if(current?.refid !== node_ref.id){
              lib.no.runtime.change_graph({...node_ref, id: newgraphid, refid: node_ref.id}, lib, false)
            } else {
              lib.no.runtime.update_graph(newgraphid)
            }
        }

        return run_node(node_ref, {...nodeArgs, __graph_value: lib.no.of(node.value)}, newGraphArgs, lib)
    } else if (node.nodes) {
        return node_nodes(node, node.out ?? "out", nodeArgs, graphArgs, lib)
    } else if (node.fn && node.graph) {
        const graphid = nodysseus_get(graphArgs, "__graphid", lib)?.__value;
        const nodegraphargs = node.args ?? {}
        nodegraphargs.__graphid = graphid ?? lib.no.of(node.graph.id);
        nodegraphargs._output = nodysseus_get(graphArgs, "_output", lib)
        lib = node.lib ? {...lib, ...node.lib} : lib;

        return node_nodes(node.graph, node.fn, nodeArgs, nodegraphargs, lib)
    } else if (node.script){
        return node_script(node, nodeArgs, lib)
    } else if(Object.hasOwn(node, "value")) {
        return lib.no.of(node_value(node));
    } else if (Object.hasOwn(node, "__value")){
        return node;
    } else {
        return node_data(nodeArgs, graphArgs, lib)
    }
}

// handles graph things like edges
const run_graph = (graph, node_id, graphArgs, lib) => {
    const node = lib.no.runtime.get_node(graph, node_id);

    try {
        const inputs = lib.no.runtime.get_edges_in(graph, node_id);


        lib.no.runtime.publish('noderun', {graph, node_id})

        const data = create_data(node_id, graph, inputs, graphArgs, lib);
        const res = run_node(node, data, graphArgs, lib);
        return res
    } catch (e) {
        console.log(`error in node`);
        if (e instanceof AggregateError) {
            e.errors.map(console.error)
        } else {
            console.error(e);
        }
        if(e instanceof NodysseusError) {
            lib.no.runtime.publish("grapherror", e)
            return;
        }
        const parentest = lib.no.runtime.get_parentest(graph)
        let error_node = parentest ? graph : node;
        lib.no.runtime.publish("grapherror", new NodysseusError(
            graph.id + "/" + error_node.id, 
            e instanceof AggregateError ? "Error in node chain" : e
        ))
    }
}


const getmap = (map, id) => {
    return id ? map.get(id) : id;
}
const getorset = (map, id, value_fn=undefined) => {
    let val = map.get(id);
    if (val) {
        return val;
    } else {
        let val = value_fn();
        if (val !== undefined) {
            map.set(id, val);
        }
        return val
    }
}

const base_node = node => node.ref || node.extern ? ({id: node.id, value: node.value, name: node.name, ref: node.ref}) : base_graph(node);
const base_graph = graph => ({id: graph.id, value: graph.value, name: graph.name, nodes: graph.nodes, edges: graph.edges, out: graph.out})

const run = ({node, args, store}: {node: Runnable, args?: any, store?: NodysseusStore}) => {
  initStore(store);

  let lib = (isValue(node) ? nolib : node?.lib) ?? nolib
  if(isValue(node)) {
    return node.__value;
  }

  lib.no.runtime.update_graph(node.graph, lib);
  const res = run_node(node, Object.fromEntries(Object.entries(args ?? {}).map(e => [e[0], lib.no.of(e[1])])), node.args, lib);
  return ispromise(res) ? res.then(r => r?.__value) : res?.__value
}

const initStore = (store: NodysseusStore | undefined = undefined) => {
  if(store) {
    nodysseus = store;
  } else if(!nodysseus) {
    nodysseus = Nodysseus();
  }

  if(!nolib.no.runtime) {
    nolib.no.runtime = nolib.no.runtimefn()
  }
}

const nolib = {
  no: {
    of: <T>(value): Result | Promise<Runnable> => ispromise(value) ? value.then(nolib.no.of) : value?.__value ? value : { id: "out", __value: value, __isnodysseus: true },
    arg: (node, target, lib, value) => {
      let valuetype, nodevalue;
      if(value.includes(": ")) {
        const typedvalue = value.split(": ");
        nodevalue = typedvalue[0];
        valuetype = typedvalue[1];
      } else {
        nodevalue = value;
      }
      const newtarget = () => {
        const newt = Object.assign({}, target);
        Object.keys(newt).forEach(k => k.startsWith("_") && delete newt[k])
        return newt;
      };

      const parenttarget = () => {
        const newt = Object.assign({}, target.__args);
        Object.keys(newt).forEach(k => k.startsWith("_") && delete newt[k])
        return newt;
      };

      const ret = nodevalue === undefined || target === undefined
        ? undefined
        : nodevalue === "_node"
        ? node
        : nodevalue.startsWith("_node.")
        ? nodysseus_get(node, nodevalue.substring("_node.".length), lib)
        : nodevalue.startsWith("_lib.")
        ? nodysseus_get(lib, nodevalue.substring("_lib.".length), lib)
        : nodevalue === "_args"
        ? newtarget()
        : nodevalue === "_args_resolved"
        ? lib.no.of(Object.fromEntries(Object.entries(newtarget()).map(([key, value]: [string, any]) => [key, value?.isArg && valuetype !== "raw" ? run_runnable(value, lib)?.__value : value])))
        : nodevalue === "__args"
        ? parenttarget()
          // lib.no.of(Object.fromEntries(Object.entries(parenttarget()).map(([key, value]: [string, any]) => [key, value?.isArg && valuetype !== "raw" ? run_runnable(value, lib)?.__value : value])))
        : nodysseus_get(
            node.type === "local" || node.type?.includes?.("local")
              ? newtarget()
              : node.type === "parent" || node.type?.includes?.("parent")
              ? target.__args
              : target,
            nodevalue,
            lib
          );

      // let retrun = run_runnable(ret, lib);
      // while(retrun?.isArg && valuetype !== "raw") {
      //   retrun = run_runnable(ret, lib)
      // }

      const retrun = ret?.isArg && valuetype !== "raw" ? run_runnable(ret, lib) : undefined;
      return ispromise(retrun) ? retrun.then(v => v?.__value) : retrun ? retrun.hasOwnProperty("__value") ? retrun?.__value : retrun : ret;
    },
    base_graph,
    base_node,
    NodysseusError,
    runtime: undefined,
    runtimefn: (function () {

      const new_graph_cache = (graph) => ({
        id: graph.id,
        graph,
        node_map: new Map(graph.nodes.map((n) => [n.id, n])),
        in_edge_map: new Map(
          graph.nodes.map((n) => [
            n.id,
            graph.edges.filter((e) => e.to === n.id),
          ])
        ),
        is_cached: new Set(),
      });
      const event_listeners = new Map();
      const event_listeners_by_graph = new Map();
      const event_data = new Map(); // TODO: get rid of this
      const getorsetgraph = (graph, id, path, valfn) =>
        getorset(get_cache(graph)[path], id, valfn);
      let animationframe;
      let animationerrors = [];
      const publish = (event, data, lib) => {
        const runpublish = (data) => {
          event_data.set(event, data);
          if (event === "graphchange") {
            if(!data) {
              return;
            }
            const gcache = get_cache(data.id);
            gcache.graph = data;
            getorset(event_listeners, event, () => new Map());
          }

          const listeners = getorset(event_listeners, event, () => new Map());
          for (let l of listeners.values()) {
            if (typeof l === "function") {
              l(data);
            } else if (typeof l === "object" && l.fn && l.graph) {
              run_graph(
                l.graph,
                l.fn,
                Object.assign({}, l.args || {}, { data }),
                l.lib ? {...lib, ...l.lib} : lib
              );
            }
          }

          if (
            event === "animationframe" &&
            listeners.size > 0 && // the 1 is for the animationerrors stuff below
            !animationframe &&
            animationerrors.length == 0
          ) {
            animationframe = requestAnimationFrame(() => {
              animationframe = false;
              publish("animationframe", {}, lib);
            });
          }
        };

        if (typeof data === "object" && ispromise(data)) {
          data.then(runpublish);
        } else {
          runpublish(data);
        }

        return data;
      };

      const add_listener = (
        event,
        listener_id,
        input_fn,
        remove = false,
        graph_id = false,
        prevent_initial_trigger = false,
        lib = nolib
      ) => {
        const listeners = getorset(event_listeners, event, () => new Map());
        const fn =
          typeof input_fn === "function"
            ? input_fn
            : (args) => {
                run_graph(input_fn.graph, input_fn.fn, {
                  ...args,
                  __args: input_fn.args,
                }, input_fn.lib ? {...lib, ...input_fn.lib} : lib);
              };
        if (!listeners.has(listener_id)) {
          if (!prevent_initial_trigger) {
            requestAnimationFrame(() => {
              if (event_data.has(event)) {
                fn(event_data.get(event));
              }
            });
          }

          if (graph_id) {
            const graph_id_listeners = getorset(
              event_listeners_by_graph,
              graph_id,
              () => new Map()
            );
            graph_id_listeners.set(event, listener_id);
          }
        }

        if (remove) {
          remove_listener(event, listener_id);
        }

        listeners.set(listener_id, fn);

        if (event === "animationframe") {
          requestAnimationFrame(() => publish(event, {}, lib));
        }

      };

      // Adding a listener to listen for errors during animationframe. If there are errors, don't keep running.
      add_listener('grapherror', "__animationerrors", e => animationerrors.push(e));
      add_listener('graphchange', "__animationerrors", e => animationerrors.splice(0, animationerrors.length));

      const remove_listener = (event, listener_id) => {
        if (event === "*") {
          [...event_listeners.values()].forEach((e) => e.delete(listener_id));
        } else {
          const listeners = getorset(event_listeners, event, () => new Map());
          listeners.delete(listener_id);
        }
      };

      const remove_graph_listeners = (graph_id) => {
        const graph_listeners = event_listeners_by_graph.get(graph_id);
        if (graph_listeners) {
          for (const evt of graph_listeners.entries()) {
            getorset(event_listeners, evt[0])?.delete(evt[1]);
          }
        }
      };

      const delete_cache = (graph) => {
        if (graph) {
          const graphid = typeof graph === "string" ? graph : graph.id;
          // const nested = parentdb.find({ parent_id: graphid });
          // nested.forEach((v) => nodysseus.nodes.remove(v.id));
          nodysseus.nodes.remove(graphid)
        } else {
          nodysseus.state.removeAll();
          event_data.clear();
        }
      };

      const change_graph = (graph, lib, addToStore = true) => {
        const new_cache = new_graph_cache(graph);
        const gcache = get_cache(graph.id);
        const old_graph = gcache && gcache.graph;

        const doc = get_cache(graph, new_cache);
        doc.graph = graph;
        doc.node_map = new_cache.node_map;
        doc.in_edge_map = new_cache.in_edge_map;
        doc.is_cached = new_cache.is_cached;
        if (lib) {
          doc.lib = lib;
        }

        if (old_graph) {
          for (const n of old_graph.nodes) {
            if (get_node(graph, n.id) !== n) {
              const nodegraphid = graph.id + "/" + n.id;
              delete_cache(nodegraphid);
            }
          }
        }

        const parent = get_parentest(graph);
        if (parent) {
          lib.no.runtime.update_graph(parent, lib);
        } else {
          if(!graph.__isnodysseus && addToStore) {
            nodysseus.refs.add(graph.id, graph)
          }
          publish("graphchange", graph, lib);
          publish("graphupdate", graph, lib);
        }
      };

      const update_args = (graph, args, lib) => {
        const graphid = typeof graph === "string" ? graph : graph.id;
        let prevargs = nodysseus.state.get(graphid);

        if (prevargs === undefined) {
          prevargs = {};
          nodysseus.state.add(graphid, prevargs);
        }

        if (!compare(prevargs, args)) {
          Object.assign(prevargs, args);
          const fullgraph = get_graph(graphid);
          publish("graphupdate", get_parentest(fullgraph) ?? fullgraph, lib);
        }
      };

      const get_ref = nodysseus.refs.get
      const add_ref = (graph: Node) => nodysseus.refs.add(graph.id, graph)
      const remove_ref = nodysseus.refs.remove
      // const add_asset = nodysseus.assets.add
      // const get_asset = nodysseus.assets.get

      // const remove_asset = nodysseus.assets.remove

      const get_node = (graph, id) =>
        getorsetgraph(graph, id, "node_map", () =>
          get_graph(graph).nodes.find((n) => n.id === id)
        );
      const get_edge = (graph, from) =>
        get_cache(graph).graph.edges.find((e) => e.from === from);
      const get_edges_in = (graph, id) =>
        getorsetgraph(graph, id, "in_edge_map", () =>
          graph.edges.filter((e) => e.to === id)
        );
      const get_edge_out = (graph, id) =>
        get_cache(graph).graph.edges.find((e) => e.from === id);
      const get_args = (graph) => nodysseus.state.get(typeof graph === "string" ? graph : graph.id) ?? {};
      const get_graph = (graph) => {
        const cached = get_cache(graph);
        return ispromise(cached) 
          ? cached.then(c => c.graph)
          : cached
          ? cached.graph
          : typeof graph !== "string"
          ? graph
          : undefined;
      };
      const get_parent = (graph) => {
        const parent = nodysseus.parents.get(
          typeof graph === "string" ? graph : graph.id
        );
        return parent ? get_graph(parent.parent) : undefined;
      };
      const get_parentest = (graph) => {
        const parent = nodysseus.parents.get(
          typeof graph === "string" ? graph : graph.id
        );
        return parent && parent.parentest && get_graph(parent.parentest);
      };
      const get_cache = (graph, newgraphcache=undefined) => {
        const graphid =
          typeof graph === "string"
            ? graph
            : typeof graph === "object"
            ? graph.id
            : undefined;
        
        const lokiret = nodysseus.nodes.get(graphid);

        if (!lokiret && typeof graph === "object") {
          const newcache = newgraphcache || new_graph_cache(graph);
          nodysseus.nodes.add(newcache.id, newcache);
          return newcache;
        }

        return lokiret;
      };
      const get_path = (graph, path) => {
        graph = get_graph(graph);
        let pathSplit = path.split(".");
        let node = graph.out || "out";
        while (pathSplit.length > 0 && node) {
          let pathval = pathSplit.shift();
          const edge = get_edges_in(graph, node).find((e) => e.as === pathval);
          node = edge ? edge.from : undefined;
        }
        return node;
      };

      nodysseus.refs.addMany((generic as Graph).nodes.map(n => [n.id, n]));

      if(nodysseus.refs.startListening) {
        nodysseus.refs.startListening()
      }

      return {
        run: run,
        is_cached: (graph, id) => get_cache(graph.id),
        set_cached: (graph, id) => get_cache(graph.id).is_cached.add(id),
        get_ref,
        add_ref,
        add_refs: (gs) => nodysseus.refs.addMany(gs.map(g => [g.id, g])),
        remove_ref,
        // get_asset,
        // add_asset,
        // remove_asset,
        get_node,
        get_edge,
        get_edges_in,
        get_edge_out,
        get_parent,
        get_parentest,
        get_fn: (id, name, orderedargs, script): Function => {
          const fnid = id;
          let fn = nodysseus.fns.get(fnid);
          if (!fn || fn.script !== script) {
            const update = !!fn;

            fn = Object.assign(fn ?? {}, {
              script,
              fn: new Function( `return function _${name.replace(
                  /(\s|\/)/g,
                  "_"
                )}(${orderedargs}){${script}}`
              )(),
              // ` this comment is here because my syntax highlighter is not well
            });

            nodysseus.fns.add(fnid, fn)
          }

          return fn.fn;
        },
        change_graph,
        update_graph: (graphid, lib) => publish('graphupdate', {graphid}, lib),
        update_args,
        delete_cache,
        get_graph,
        get_args,
        get_path,
        refs: () => nodysseus.refs.all().map(r => r.id),
        ref_graphs: () => nodysseus.refs.all().filter(v => isNodeGraph(v) && get_node(v, (v?.out ?? "out"))?.ref === "return").map(v => v.id),
        edit_edge: (graph, edge, old_edge, lib) => {
          const gcache = get_cache(graph);
          graph = gcache.graph;

          gcache.in_edge_map.delete((old_edge || edge).to);
          edge.as = edge.as || "arg0";

          const new_graph = {
            ...graph,
            edges: graph.edges
              .filter(
                (e) =>
                  !(
                    e.to === (old_edge || edge).to &&
                    e.from === (old_edge || edge).from
                  )
              )
              .concat([edge]),
          };

          change_graph(new_graph, lib);
        },
        update_edges: (graph, add, remove = [], lib, dryRun = false) => {
          const gcache = get_cache(graph);
          graph = gcache.graph;

          const new_graph = {
            ...graph,
            edges: graph.edges
              .filter(
                (e) => !remove.find((r) => r.from === e.from && r.to === e.to)
                  && !add.find((r) => r.from === e.from && r.to === e.to)
              )
              .concat(add),
          };

          if(!dryRun) {
            change_graph(new_graph, lib);
          } else {
            console.log(new_graph)
          }
        },
        add_node: (graph, node, lib) => {
          if (!(node && typeof node === "object" && node.id)) {
            throw new Error(`Invalid node: ${JSON.stringify(node)}`);
          }

          const gcache = get_cache(graph);
          graph = gcache.graph;

          const new_graph = {
            ...graph,
            nodes: graph.nodes.filter((n) => n.id !== node.id).concat([node]),
          };

          // n.b. commented out because it blasts update_args which is not desirable
          // delete_cache(graph)
          change_graph(new_graph, lib);
        },
        delete_node: (graph, id, lib) => {
          const gcache = get_cache(graph);
          graph = gcache.graph;

          const parent_edge = graph.edges.find((e) => e.from === id);
          const child_edges = graph.edges.filter((e) => e.to === id);

          const current_child_edges = graph.edges.filter(
            (e) => e.to === parent_edge.to
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
                    (ce) => ce.as === e.as && ce.from !== id
                  )
                ? e.as + "1"
                : e.as,
          }));

          const new_graph = {
            ...graph,
            nodes: graph.nodes.filter((n) => n.id !== id),
            edges: graph.edges
              .filter((e) => e !== parent_edge && e.to !== id)
              .concat(new_child_edges),
          };

          change_graph(new_graph, lib);
        },
        add_listener,
        add_listener_extern: {
          args: ["event", "listener_id", "fn"],
          add_listener,
        },
        remove_listener,
        remove_graph_listeners,
        publish: (event, data, lib) => publish(event, data, lib),
        set_parent: (graph, parent) => {
          const graphid = graph;
          const parentid = parent;
          const parent_parent = nodysseus.parents.get(parentid);
          const parentest =
            (parent_parent ? parent_parent.parentest : false) || parentid;
          const new_parent = {
            id: graphid,
            parent: parentid,
            parentest,
          };
          nodysseus.parents.add(graphid, new_parent)
        },
      };
    }),
  },
  extern: {
    // runGraph: F<A> => A
    ap: {
      rawArgs: true,
      args: ["fn", "args", "run", "_lib", "_graph_input_value"],
      fn: (fn, args, run, lib, graph_input_value) => {
        const runvalue = run_runnable(run, lib)?.__value;
        const execute = (fnr, rv, av) => {
          if(fnr === undefined) {
            return lib.no.of(undefined)
          }

          while(av?.fn && av?.graph) {
            // console.log('in while')
            // console.log(av)
            // console.log(fnv)
            // console.log(fn)
            av = run_runnable({...av, args: {...av.args, ...fn.args}}, fnv.__value.lib ? { ...lib, ...fnv.__value.lib} : lib)?.__value
            // console.log('end while avhttp://gitlab.etc.com/et-playground/ml-stylized-art/stable-diffusion-cli/-/merge_requests/3')
            // console.log(av)
          }
          let isArray = Array.isArray(fnr);
          if(!isArray) {
            fnr = [fnr]
          }

          fnr = fnr.filter(f => f);
          if(fnr.length === 0) {
            throw new Error("No functions to ap to")
          }

          const apfn = fnr => {
            let newfnargs: string[] = [];
            if(av) {
              const avkeys = Object.keys(av).filter(a => a !== '__isnodysseus' && a !== "__args");
              newfnargs = fnr.fnargs && fnr.fnargs.filter(a => !avkeys.find(i => i === a))
              // console.log('got args')
              // console.log(fnvr.fnargs)
              // console.log(newfnargs)
            }

            // console.log('in ap')
            // console.log(fnr.fnargs)
            // console.log(av);
            // console.log(args)
            // if(fnr.fnargs[0] === "event") {
              // debugger;
            // }

            const fnap = {
              ...fnr,
              fnargs: newfnargs,
              args: {
                // ...fn.args.__args,
                // ...fn.args,
                // ...fnr.args,
                // ...(fnr.fnargs ? Object.fromEntries(Object.entries(av ?? {}).filter(kv => !!fnr.fnargs.find(a => kv[0] === a))) : (av ?? {})),
                // __args: {...fnr.args.__args},
                // __graphid: nodysseus_get(fnr.args, "__graphid", lib),
                // ...fn.args,
                ...(!av ? fn.args : fnr.fnargs && av ? Object.fromEntries(fnr.fnargs.map(a => [a, av[a]])) : (av ?? {})),
                __args: {
                  ...fnr.args.__args,
                  // ...av,
                  // ...(av ?? {}),
                  // ...av,
                },
              },
            };

            // console.log('apping')
            // console.log(fnap)
            // console.log(fnv)
            // console.log(fnr)
            // console.log(fnr.fnargs)
            // console.log(av)

            return rv ? run_runnable(fnap, lib) : lib.no.of(fnap);
          }

          const res = fnr.map(apfn);

          return isArray ? res : res[0];
        }

        const execpromise = (fnrg, rvg, avg) => {
          const rv = run_runnable(rvg, lib);
          // console.log(avg)
          let av = avg //&& run_runnable({...avg, args:{...fn.args, ...avg.args}}, lib);
          if(ispromise(fnrg) || ispromise(rv) || ispromise(av)) {
            return Promise.all([fnrg, rv, av]).then(([fnr, rv, av]) => execute(fnr, rv?.__value, av?.__value))
          }

          return execute(fnrg, rv?.__value, av)
        }


        let fnv = run_runnable(fn, lib);

        if(fnv.__value === undefined) {
          throw new Error("ap needs a fn")
        }

        const fnvr = fnv.__value;

        // const newfnv = newfnargs ? {...fnv.__value, fnargs: newfnargs} : fnv.__value


        const graphid = nodysseus_get(fn.args, "__graphid", lib);
        // TODO: Fix for sequence. if __args arg0 is a sequence then that gets passed to the first sequence but the first sequence context including arg0 is then passed to the second sequence
        //
        // console.log("inap")
        // console.log(args)
        // args = lib.no.runtime.get_node(args.graph, args.fn)?.ref === "arg" ? run_runnable(args, lib) : args;
        // console.log(args);

        const argargs = !runvalue && args && ancestor_graph(args.fn, args.graph, lib).nodes.filter(isNodeRef).filter(n => n.ref === "arg").map(n => n.value?.includes(".") ? n.value.substring(0, n.value.indexOf(".")) : n.value)

        const ret = runvalue ? execpromise(fnv.__value, run, args)
          // : {...fn, args: {...fn.args, ...args}}
          : (delete args?.isArg, delete args?.args?._output, lib.no.of(run_runnable({
            "fn": "runout",
            "graph": {
              "id": `_run_${graphid.__value}_${Math.floor(performance.now() * 100)}`,
              "out": "runout",
              "nodes": [
                {"id": "fnarg", "value": fnv},
                {"id": "argsarg", "value": args},
                {"id": "args_runnable", "value": args },//&& lib.no.of({...args, fnargs: argargs ?? [], args: {__args: args.args}})},
                {"id": "args_runnable_ap", "ref": "ap"},
                {"id": "args_runnable_args", "value":"" },
                {"id": "runval", "value": "true"},
                {"id": "out", "ref": "ap"},
                {"id": "runout_args", "value": argargs && Object.fromEntries(argargs?.map(a => [a, undefined]))},
                {"id": "runout", "ref": "runnable"}
              ],
              "edges": [
                {"from": "fnarg", "to": "out", "as": "fn"},
                {"from": "runval", "to": "out", "as": "run"},
                {"from": "runval", "to": "args_runnable_ap", "as": "run"},
                {"from": "args_runnable", "to": "args_runnable_ap", "as": "fn"},
                // {"from": "argsarg", "to": "out", "as": "args"},
                // {"from": "argsarg", "to": "args_runnable", "as": "fn"},
                // {"from": "args_runnable_args", "to": "args_runnable", "as": "args"},
                args && {"from": "args_runnable", "to": "out", "as": "args"},
                argargs && {"from": "runout_args", "to": "runout", "as": "args"},
                {"from": "out", "to": "runout", "as": "fn"}
              ].filter(e => e)
            },
            "args": { fnr: fnv?.__value, argsr: args , __graphid: graphid },
            "fnargs": (argargs ?? fnvr.fnargs ?? []),
            "__isnodysseus": true,
          }, lib)))
        // if(!runvalue) {
        //   console.log(argargs)
        //   console.log(fnvr.fnargs)
        //   console.log(ret)
        // }

        return ret;
      }
    },
    create_fn: {
      args: ["runnable", "_lib"],
      fn: create_fn
    },
    switch: {
      rawArgs: true,
      args: ["input", "_node_args", "_lib"],
      fn: (input, args, lib) => {
        const inputval = run_runnable(input, lib);
        return ispromise(inputval) 
          ? inputval.then(ival => run_runnable(args[ival?.__value], lib)) 
          : run_runnable(args[inputval?.__value], lib);
      },
    },
    resolve: {
        rawArgs: false,
        args: ['object', '_lib'],
        fn: (object, lib) => {
            return Object.fromEntries(Object.entries(object).map(e => [e[0], run_runnable(e[1], lib)]));
        }
    },
    fold: {
      rawArgs: true,
      args: ["fn", "object", "initial", "_lib"],
      fn: (fn, object, initial, lib) => {
        const foldvalue = objectvalue => {
          if (objectvalue === undefined) return undefined;
          const fnrunnable = run_runnable(fn, lib).__value;


          const mapobjarr = (mapobj, mapfn, mapinit) =>
            Array.isArray(mapobj)
              ? mapobj.reduce(mapfn, mapinit)
              : Object.entries(mapobj).sort((a, b) => a[0].localeCompare(b[0])).reduce(mapfn, mapinit);

          initial = run_runnable(initial, lib)?.__value ?? (Array.isArray(objectvalue) ? [] : {});
          
          const ret = mapobjarr(
            objectvalue,
            (previousValue, currentValue) =>
              run_graph(
                fnrunnable.graph,
                fnrunnable.fn,
                {...fnrunnable.args, previousValue: lib.no.of(previousValue), currentValue: lib.no.of(currentValue) },
                fnrunnable.lib ? {...lib, ...fnrunnable.lib} : lib
              ).__value,
            initial
          );
          return lib.no.of(ret);
        }

        const objectvalue = run_runnable(object, lib);

        return ispromise(objectvalue) ? objectvalue.then(ov => foldvalue(ov.__value ?? ov)) : foldvalue(objectvalue.__value ?? objectvalue)
      },
    },
    _sequence: {
      args: ["_node_args", "_lib", "__graphid"],
      fn: (_args, lib, graphid) => {
        console.log(_args);
        // const fns = run_runnable({..._args, args: {graphid: graphid, ..._args.args}}, lib)
        // return nolib.extern.ap.fn(lib.no.of(Object.entries(fns).filter(kv => !kv[0].startsWith("_")).map(kv => kv[1])), undefined, false, lib, {})
        return lib.extern.ap.fn(lib.no.of(Object.values(_args)), undefined, lib.no.of(false), lib);
      }
    },
    runnable: {
      rawArgs: true,
      args: ["fn", "args", "_lib"],
      fn: (fn, args, lib) => {
        if(!fn) {
          return lib.no.of(undefined);
        }

        const argsval = args && run_runnable(args, lib).__value;
        delete fn.isArg;
        fn.fnargs = argsval ? Object.keys(argsval).map(k => k.includes(".") ? k.substring(0, k.indexOf('.')) : k) : [];
        fn.args = {...argsval, __args: fn.args};

        return lib.no.of(fn);
      },
    },
    expect: {
      args: ["a", "b", "__graph_value"],
      fn: expect
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
    return: {
      resolve: false,
      rawArgs: true,
      args: [
        "value",
        "display",
        "subscribe",
        "argslist",
        "args",
        "lib",
        "_node",
        "_graph",
        "_graph_input_value",
        "_lib",
      ],
      fn: (
        value,
        display,
        subscribe,
        argslist,
        argsfn,
        lib,
        _node,
        _graph,
        _args,
        _lib
      ) => {
        const output = _args["_output"]?.__value;
        const edgemap = { value, display, subscribe, argslist, lib };
        const runedge = output && output === display ? display : edgemap[output] ? output : "value";

        const return_result = (_lib, args) => {
          const runedgeresult = edgemap[runedge]
            ? run_graph(
                edgemap[runedge].graph,
                edgemap[runedge].fn,
                { ...args, ...edgemap[runedge].args, _output: _lib.no.of(runedge === "display" ? "display" : "value") },
                edgemap[runedge].lib ? {..._lib, ...edgemap[runedge].lib} : _lib
              )
            : {__value: undefined};

          if(runedge === "value" && !value && display) {
            runedgeresult.__value = run_graph(display.graph, display.fn, {...display.args, ...args}, display.lib ? {..._lib, ...display.lib} : _lib).__value?.value;
          }

          if (edgemap.subscribe) {
            const subscriptions = run_graph(
              edgemap.subscribe.graph, 
              edgemap.subscribe.fn,
              { ...args, ...edgemap.subscribe.args},
              edgemap.subscribe.lib ? {...edgemap.subscribe.lib, ..._lib} : _lib
            ).__value

            const graphid = nodysseus_get(subscribe.args, "__graphid", _lib).__value;
            const newgraphid = graphid + "/" + _node.id;

            Object.entries(subscriptions)
              .filter(kv => kv[1])
              .forEach(([k, v]) => 
                _lib.no.runtime.add_listener(k, 'subscribe-' + newgraphid, v, false, 
                  graphid, true, _lib));
          }

          return runedgeresult;
        }

        const libprom = lib && run_runnable(lib, _lib);
        if(ispromise(libprom)) {
          return libprom.then(libr => {
            _lib = {..._lib, ...(libr?.__value ?? {})}
            Promise.resolve(argsfn ? run_runnable({...argsfn, args: {...argsfn.args, _output: _lib.no.of("value")}}, _lib) : {})
              .then(args => return_result(_lib, args?.__value))
          })
        } else {
          _lib = libprom ? {..._lib, ...(libprom.__value ?? {})} : _lib;
          const argsprom = argsfn && run_runnable({...argsfn, args: {...argsfn.args, _output: _lib.no.of("value")}}, _lib)
          return ispromise(argsprom) ? argsprom.then(args => return_result(_lib, args?.__value)): return_result(_lib, argsprom?.__value)
        }
      },
    },
    compare,
    eq: ({ a, b }) => a === b,
    get: {
      args: ["_graph", "target", "path", "def", "graphval", "_lib"],
      fn: (graph, target, path, def, graph_value, lib) => {
        return nodysseus_get(
          target && target._Proxy ? target._value : target,
          path && path._Proxy ? path._value : graph_value || path,
          lib, 
          def && def._Proxy ? def._value : def
        );
      },
    },
    set: {
      args: ["target", "path", "value", "__graph_value", "_graph_input_value"],
      fn: (target, path, value, nodevalue, _args) => {
        const keys = (nodevalue || path).split(".");
        const check = (o, v, k) =>
          k.length === 1
            ? { ...o, [k[0]]: v }
            : o?.hasOwn?.(k[0])
            ? {
                ...o,
                [k[0]]: check(o[k[0]], v, k.slice(1)),
              }
            : o;
        const ret = (
          ((value !== undefined && ispromise(value)) || ispromise(target)
            ? Promise.all([
                Promise.resolve(value),
                Promise.resolve(target),
              ]).then((vt) => vt[1] !== undefined && check(vt[1], vt[0], keys))
            : check(target, value, keys))
        );
        return ret;
      },
    },
    set_mutable: {
      args: ["target", "path", "value", "__graph_value"],
      fn: (target, path, value, nodevalue) => {
        set(target, nodevalue || path, value);
        return target;
      },
    },
    liftarraypromise: {
      args: ["array"],
      resolve: true,
      fn: (array) => {
        const isarraypromise = array.reduce(
          (acc, v) => acc || ispromise(v),
          false
        );
        return isarraypromise ? Promise.all(array) : array;
      },
    },
    script: {
      args: ["_node", "_node_args", "_graph", "_lib", "_graph_input_value"],
      fn: (node, node_inputs, graph, _lib, _graph_input_value) =>
        node_script(
          node,
          node_inputs,
          _lib,
        ),
    },
    new_array: {
      args: ["_node_args", "__graph_value"],
      fn: (args, nodevalue) => {
        if (nodevalue) {
          return nodevalue.split(/,\s+/);
        }
        const argskeys = Object.keys(args);
        const arr =
          args && argskeys.length > 0
            ? argskeys
                .filter(k => !k.startsWith("__"))
                .sort()
                .reduce(
                  (acc, k) => [
                    acc[0].concat([args[k]]),
                    acc[1] || ispromise(args[k]),
                  ] as [Array<any>, boolean],
                  [[], false] as [Array<any>, boolean]
                )
            : JSON.parse("[" + nodevalue + "]");
        return arr[1] ? Promise.all(arr[0]) : arr[0];
      },
    },
    fetch: {
      resolve: true,
      args: ["__graph_value", "url", "params"],
      fn: (nodevalue, url, params) => resfetch(url || nodevalue, params),
    },
    import_module: {
      args: ["url", "__graph_value"],
      fn: (url, graphvalue) => (url || graphvalue) && import(url || graphvalue),
    },
    call: {
      resolve: true,
      args: ["__graph_value", "self", "fn", "args", "_graph_input_value", "_lib"],
      fn: (nodevalue, self, fn, args, _args, lib) => {
        const runfn = (args) => {
          if (typeof self === "function") {
            return Array.isArray(args)
              ? self(
                  ...args
                    .reverse()
                    .reduce(
                      (acc, v) => [
                        !acc[0] && v !== undefined,
                        acc[0] || v !== undefined
                          ? acc[1].concat([v._Proxy ? v._value : v])
                          : acc[1],
                      ],
                      [false, []]
                    )[1]
                    .reverse()
                )
              : self(args === undefined ? [] : args);
          } else {
            const ng_fn = nodysseus_get(self ?? _args, fn || nodevalue, lib);
            const fnargs = Array.isArray(args)
              ? (args || [])
                  .reverse()
                  .reduce(
                    (acc, v) => [
                      !acc[0] && v !== undefined,
                      acc[0] || v !== undefined
                        ? acc[1].concat([v._Proxy ? v._value : v])
                        : acc[1],
                    ],
                    [false, []]
                  )[1]
                  .reverse()
              : args === undefined
              ? []
              : [args];
            return lib.no.of(ispromise(ng_fn)
              ? ng_fn.then((f) => f.apply(fnargs))
              : ng_fn.apply(self, fnargs));
          }
        }

        return ispromise(args) ? args.then(runfn) : runfn(args);
      },
    },
    merge_objects_mutable: {
      args: ["target", "_node_args"],
      fn: (target, args) => {
        const keys = Object.keys(args).filter(k => k !== "target").sort();
        const resolved = {};
        keys.forEach(
          (k) => (resolved[k] = args[k]?.__value ? args[k].__value : args[k])
        );
        const promise = keys.reduce(
          (acc, k) => acc || ispromise(resolved[k]),
          false
        );
        return promise
          ? Promise.all(keys.map((k) => Promise.resolve(resolved[k]))).then(
              (es) =>
                Object.assign(
                  {},
                  ...es.filter((a) => a && typeof a === "object")
                )
            )
          : Object.assign(
              target,
              ...keys
                .map((k) =>
                  resolved[k] && resolved[k]?.__value
                    ? resolved[k].__value
                    : resolved[k]
                )
                .filter((a) => a && typeof a === "object")
            );
      }
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
        while (target && target._Proxy) {
          target = target._value;
        }
        const newval = Object.assign({}, target);
        delete newval[path];
        return newval;
      },
    },
    now: {
      args: ["scale"],
      fn: now
    },
    math: {
      args: ["__graph_value", "_node_args"],
      resolve: true,
      fn: (graph_value, args) => Math[graph_value](...Object.entries(args).sort((a, b) => a[0].localeCompare(b[0])).map(kv => kv[1]))
    },
    add: {
      args: ["_node_args"],
      resolve: true,
      fn: (args) =>
        Object.entries(args)
          .sort((a, b) => a[0].localeCompare(b[0]))
          .map(kv => kv[1])
          .reduce((acc, v) => (acc as any) + (v as any)),
    },
    and: {
      args: ["_node_args"],
      resolve: true,
      fn: (args) => Object.values(args).reduce((acc, v) => acc && !!v, true),
    },
    mult: {
      args: ["_node_args"],
      resolve: true,
      fn: (args) => Object.values(args).reduce((acc: any, v: any) => acc * v, 1),
    },
    negate: {
      args: ["value"],
      resolve: true,
      fn: (value) => -value,
    },
    divide: {
      args: ["_node_args"],
      resolve: true,
      fn: (args) => Object.values(args).reduce((acc: any, v: any) => acc / v, 1),
    },
    unwrap_proxy: {
      args: ["proxy"],
      resolve: false,
      fn: (proxy) => ({
        fn: proxy._value._nodeid,
        graph: proxy._value._graphid,
        args: proxy._value._graph_input_value,
      }),
    },
    modify: {
      args: ["target", "path", "fn", "_node", "_lib", "_graph_input_value"],
      resolve: false,
      fn: (target, path, fn, node, _lib, args) => {
        while (target?._Proxy) {
          target = target._value;
        }
        const keys = (node.value || path).split(".");
        const check = (o, fn, k) =>
          k.length === 1
            ? {
                ...o,
                [k[0]]: run_graph(fn.graph, fn.fn, {
                  ...args,
                  value: o[k[0]],
                }, _lib),
                _needsresolve: true,
              }
            : o?.hasOwn?.(k[0])
            ? {
                ...o,
                [k[0]]: check(o[k[0]], fn, k.slice(1)),
                _needsresolve: true,
              }
            : o;
        return check(target, fn, keys);
      },
    },
    properties: {
      getOwnEnumerables: function (obj) {
        return this._getPropertyNames(obj, true, false, this._enumerable);
        // Or could use for..in filtered with hasOwnProperty or just this: return Object.keys(obj);
      },
      getOwnNonenumerables: function (obj) {
        return this._getPropertyNames(obj, true, false, this._notEnumerable);
      },
      getOwnEnumerablesAndNonenumerables: function (obj) {
        return this._getPropertyNames(
          obj,
          true,
          false,
          this._enumerableAndNotEnumerable
        );
        // Or just use: return Object.getOwnPropertyNames(obj);
      },
      getPrototypeEnumerables: function (obj) {
        return this._getPropertyNames(obj, false, true, this._enumerable);
      },
      getPrototypeNonenumerables: function (obj) {
        return this._getPropertyNames(obj, false, true, this._notEnumerable);
      },
      getPrototypeEnumerablesAndNonenumerables: function (obj) {
        return this._getPropertyNames(
          obj,
          false,
          true,
          this._enumerableAndNotEnumerable
        );
      },
      getOwnAndPrototypeEnumerables: function (obj) {
        return this._getPropertyNames(obj, true, true, this._enumerable);
        // Or could use unfiltered for..in
      },
      getOwnAndPrototypeNonenumerables: function (obj) {
        return this._getPropertyNames(obj, true, true, this._notEnumerable);
      },
      getOwnAndPrototypeEnumerablesAndNonenumerables: function (
        obj,
        includeArgs
      ) {
        return this._getPropertyNames(
          obj,
          true,
          true,
          this._enumerableAndNotEnumerable,
          includeArgs
        );
      },
      // Private static property checker callbacks
      _enumerable: function (obj, prop) {
        return obj.propertyIsEnumerable(prop);
      },
      _notEnumerable: function (obj, prop) {
        return !obj.propertyIsEnumerable(prop);
      },
      _enumerableAndNotEnumerable: function (obj, prop) {
        return true;
      },
      // Inspired by http://stackoverflow.com/a/8024294/271577
      _getPropertyNames: function getAllPropertyNames(
        obj,
        iterateSelfBool,
        iteratePrototypeBool,
        includePropCb,
        includeArgs
      ) {
        var props = [];

        do {
          if (iterateSelfBool) {
            Object.getOwnPropertyNames(obj).forEach(function (prop) {
              if (props.indexOf(prop) === -1 && includePropCb(obj, prop)) {
                props.push(prop);
              }
            });
          }
          if (!iteratePrototypeBool) {
            break;
          }
          iterateSelfBool = true;
        } while ((obj = Object.getPrototypeOf(obj)));

        return props;
      },
    },
    stringify: {
      args: ["object", "spacer"],
      resolve: true,
      fn: (obj, spacer) =>
        JSON.stringify(
          obj,
          (key, value) => (value?._Proxy ? value._value : value),
          spacer
        ),
    },
    parse: {
      args: ["string"],
      resolve: true,
      fn: (args) => JSON.parse(args),
    },
    typeof: {
      args: ["value"],
      fn: (value) => typeof value
    },
    construct: {
      args: ["args", "__graph_value", "_lib"],
      fn: (args, nodevalue, _lib) => new (Function.prototype.bind.apply(
        nodysseus_get(_lib, nodevalue, _lib, window[nodevalue]), 
        [null, ...(args === undefined ? [] : Array.isArray(args) ? args : [args])])
      )
    },
    addEventListeners: {
      args: ["target", "_node_args", "_lib"],
      fn: (target, nodeargs, lib) => {
        Object.entries(nodeargs)
        .filter(kv => kv[0] !== "target")
        .forEach(([k, fn]: [string, Runnable]) => target[k] = event => fn && run({node: fn, args: {event}}))
        return target;
      }
    }
  },
  // THREE
};

const generic_nodes = new Set(generic.nodes.map(n => n.id));

const add_default_nodes_and_edges = g => ({
    ...g,
    nodes: g.nodes
        .filter(n => !generic_nodes.has(n.id))
        .concat(generic.nodes)
})

export { nolib, run, initStore, compare, hashcode, add_default_nodes_and_edges, ispromise, NodysseusError, base_graph, base_node, resfetch };
