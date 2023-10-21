
// export class DependencyTreeNode<T, R extends Record<string, unknown>> {
//   private cachedValue;
//   private isInvalid = true;
//   constructor(private fn: (args: R) => T, private inputs: {[k in keyof R]: DependencyTreeNode<R[k], R extends Record<string, unknown>>}){
//   }
//   value() {
//     if(this.firstRun) {
//       this.cachedValue = this.fn(Object.fromEntries(Object.entries(node.inputs).map(e => [e[0], run(e[1])])));
//       this.isInvalid = false;
//     }
//     this.firstRun = false;
//   }
// }

import { ConstRunnable, Edge, Graph, NodysseusNode, NodysseusStore, Runnable, isGraph, isNodeRef, isNodeValue, isValue } from "../types.js";
import { node_extern, node_value, nolib, nolibLib, run_extern } from "../nodysseus.js";
import { v4 as uuid } from "uuid";
import { newEnv, parseArg, wrapPromise } from "../util.js";
import get from "just-safe-get";

type RUnknown = Record<string, unknown>;

export function compareObjectsNeq(value1, value2) {
  const keys1 = Object.keys(value1)
  const keys2 = Object.keys(value2)

  if (keys1.length !== keys2.length) {
    return true
  }

  for (const key of keys1) {
    if (value1[key] === value2[key]) {
      continue
    }

    return true
  }

  return false
}

// export type IndependentNode<T> = BaseNode<T> & {
//   fn: () => T,
// };
//

const mapEntries = <T extends Record<string, unknown>, S extends Record<string, unknown>>(v: T, f: (e: [string, T["string"]]) => S[keyof S]): S =>
  Object.fromEntries(Object.entries(v).map((e: [string, unknown]) => [e[0], f(e as [string, T["string"]])])) as S;

type NodeKind = "const" | "map" | "io" | "bind";
type Nothing = {__kind: "nothing"}
const isNothing = (a: any): a is Nothing => a && (a as Nothing).__kind === "nothing";
const nothingOf = (): Nothing => ({__kind: "nothing"})
const nothingValue: Nothing = {__kind: "nothing"};
const chainNothing = <T, S>(a: Nothing | T, fn: (a: T) => S): Nothing | S => isNothing(a) ? a : fn(a);


export class State<T> {
  constructor(private value: T | Nothing = nothingValue){}
  write(value: T | Nothing){
    this.value = value;
  }
  read() {
    return this.value;
  }
}

export type WatchNode<T = unknown> = {
  id: string;
  watch: AsyncIterator<T>;
  graphNode?: NodysseusNode;
}

export type VarNode<T> = WatchNode<T> & {
  set: (t: T) => void;
}

export type AnyNode<T> = Node<NodeKind, T>;

export type Node<K extends NodeKind, T = unknown> = {
  /**
    * @param invalidate - call to invalidate this node in the dependency tree
    * @returns a cleanup function
    */
  __kind: K
  id: string;
  value: State<T>;
}

export type ConstNode<T> = Node<"const", T>;

const isConstNode = <T>(a: AnyNode<T>): a is ConstNode<T> => (a as ConstNode<T>)?.__kind === "const";

export type MapNode<T, S extends Record<string, unknown>> = Node<"map", T> & {
  fn: State<(s: S) => T>;
  cachedInputs: State<S>;
  isStale: (p: S, n: S) => boolean,
  inputs: Record<string, string>;
}
const isMapNode = <T ,S extends Record<string, unknown>>(a: AnyNode<T>): a is MapNode<T, S> => (a as MapNode<T, S>)?.__kind === "map";

export type IONode<T> = Node<"io", T> & {
  fn: State<() => T>;
}

const isIONode = <T>(a: AnyNode<T>): a is IONode<T> => a?.__kind === "io";

export type BindNode<T, S extends Record<string, unknown>> = T extends AnyNode<unknown> ? Node<"bind", T> & {
  isStale: (p: S, n: S) => boolean,
  fn: (s: S) => T;
  inputs: {[k in keyof S]: string};
  cachedInputs: State<S>;
} : never;

const isBindNode = <T, S extends Record<string, unknown>>(a: AnyNode<T>): a is BindNode<T, S> => a?.__kind === "bind";

class Scope {
  private nodes: Record<string, Node<NodeKind>> = {};
  constructor(){}
  add(node: Node<NodeKind>) {
    this.nodes[node.id] = node;
  }
  get(id: string){
    return this.nodes[id];
  }
}

export const constNode = <T>(a: T): ConstNode<T> => ({
  __kind: "const",
  id: uuid(),
  value: new State(a),
})

export const ioNode = <T>(fn: () => T): IONode<T> => ({
  __kind: "io",
  id: uuid(),
  value: new State(),
  fn: new State(fn),
})

export const mapNode = <T, S extends Record<string ,unknown>>(inputs: {[k in keyof S]: WatchNode<S[k]>}, fn: (s: S) => T, isStale: (previous: S, next: S) => boolean): MapNode<T, S> => ({
  __kind: "map",
  id: uuid(),
  value: new State(),
  fn: new State(fn),
  cachedInputs: new State(),
  isStale,
  inputs: mapEntries(inputs, e => e[1].id)
});

export const bindNode = <R, T extends AnyNode<R>, S extends Record<string, unknown>>(inputs: {[k in keyof S]: WatchNode<S[k]>}, fn: (inputs: S) => T, isStale = compareObjectsNeq): BindNode<T, S> => ({
  __kind: "bind",
  id: uuid(),
  value: new State(),
  fn,
  cachedInputs: new State(),
  inputs: mapEntries(inputs, e => e[1].id),
  isStale
}) as BindNode<T, S>;


export class NodysseusRuntime {
  private scope: Scope;
  private watches: Record<string, Array<(a: unknown) => void>> = {};

  constructor(private store: NodysseusStore){
    this.scope = new Scope();
  }

  private createWatch<T>(nodeId: string){
    return {
      next: () => new Promise<IteratorResult<T>>((res) => {
        if(!Object.hasOwn(this.watches, nodeId)) this.watches[nodeId] = [];
        const watchfn = (a: T) => {
          this.watches[nodeId].splice(this.watches[nodeId].indexOf(watchfn), 1);
          res({value: a});
        }
        this.watches[nodeId].push(watchfn);
      })
    }
  }

  constNode<T>(v: T): WatchNode<T> {
    const node = constNode(v);
    this.scope.add(node);
    return {
      id: node.id,
      watch: this.createWatch(node.id)
    };
  }

  ioNode<T>(fn: () => T): WatchNode<T>{
    const node = ioNode(fn);
    this.scope.add(node);
    return {
      id: node.id,
      watch: this.createWatch(node.id)
    };
  }

  mapNode<T, S extends Record<string, unknown>>(inputs: {[k in keyof S]: WatchNode<S[k]>}, fn: (s: S) => T, isStale: (previous: S, next: S) => boolean = compareObjectsNeq): WatchNode<T>{
    const node = mapNode(inputs, fn, isStale);
    this.scope.add(node);
    return {
      id: node.id,
      watch: this.createWatch(node.id)
    };
  }

  /**
    * Bind a function that creates a node to inputs. Inspired by monadic bind.
    */

  bindNode<R, T extends AnyNode<R>, S extends Record<string, unknown>>(inputs: {[k in keyof S]: WatchNode<S[k]>}, fn: (s: S) => T, isStale?: (previous: S, next: S) => boolean){
    const node = bindNode<R, T, S>(inputs, fn, isStale);
    this.scope.add(node);
    return {
      id: node.id,
      watch: this.createWatch(node.id)
    }
  }

  /**
    * Uses bindNode to create a switch statement based on a key node
    */
  switchNode<T, S extends Record<string, T>>(key: WatchNode<string>, inputs: {[k in keyof S]: WatchNode<T>}){
    const keyOptions: Record<string, WatchNode<AnyNode<T>>> = mapEntries(inputs, e => this.constNode(this.scope.get(e[1].id)) as WatchNode<AnyNode<T>>);
    const binding: WatchNode<AnyNode<T>> = this.bindNode({key, ...keyOptions} as { key: WatchNode<string> } & {[k in keyof S]: WatchNode<AnyNode<T>> }, (args) => args[args.key] as AnyNode<T>) as WatchNode<AnyNode<T>>;
    return this.mapNode({bound: binding}, ({bound}) => this.runNode(bound), (p, n) => true)
  }

  varNode<T>(initial?: T) {
    let value: T = initial;
    const node = this.ioNode(() => value);
    return {
      ...node,
      set: (newValue: T) => value = newValue
    }
  }

  add(nodes: Node<any, any> | Array<Node<any, any>>) {
    (Array.isArray(nodes) ? nodes : [nodes]).forEach(n => this.scope.add(n))
  }

  public fromNode<T, S extends Record<string, unknown>>(graph: Graph, nodeId: string, closure?: VarNode<S>): WatchNode<T> | Promise<WatchNode<T>> {
    closure = closure ?? this.varNode<S>({} as S);
    return wrapPromise(typeof graph === "string" ? this.store.refs.get(graph) : graph).then(graph => this.fromNodeInternal<T, S>(graph, nodeId, closure)).value;
  }

  private fromNodeInternal<T, S extends Record<string, unknown>>(graph: Graph, nodeId: string, closure?: WatchNode<S>): WatchNode<T> {
    const node = graph.nodes[nodeId];
    const edgesIn: Edge[] = graph.edges_in?.[nodeId] ? Object.values(graph.edges_in?.[nodeId]) : Object.values(graph.edges).filter((e: Edge) => e.to === nodeId);

    const calculateInputs = () => Object.fromEntries(edgesIn.map(e => [e.as, this.fromNodeInternal(graph, e.from, closure)]));

    const dereference = (refNode) => {
      const nodeRef = this.store.refs.get(refNode.ref);
      if(refNode.ref === "@js.script") {
        const scriptFn = new Function(...edgesIn.map(e => e.as), refNode.value) as (...args: any[]) => any;
        return this.mapNode(calculateInputs(), (args) => scriptFn(...Object.values(args)))
      } else if (refNode.ref === "return") {
        const argsEdge = edgesIn.find(e => e.as === "args");
        const chainedscope = argsEdge ? this.mapNode({closure, args: this.fromNodeInternal<Record<string, unknown>, S>(graph, argsEdge.from, closure)}, ({closure, args}) => ({...closure, ...args})) : closure;

        return this.switchNode(
          this.mapNode(({closure}), ({closure}: {closure}) => closure?.["_output"] ?? "value"),
          Object.fromEntries(
            edgesIn
              .filter(e => e.as !== "args")
              .map(e => [e.as, this.fromNodeInternal(graph, e.from, chainedscope)])
              .concat([["closure", closure]])
          )
        )
      } else if (refNode.ref === "extern") {
        if(refNode.value === "extern.switch") {
          const predEdge = edgesIn.find(e => e.as === "input");
          return this.switchNode(
            this.fromNodeInternal(graph, predEdge.from, closure), 
            Object.fromEntries(
              edgesIn.filter(e => e.as !== "input")
                .map(e => [e.as, this.fromNodeInternal(graph, e.from, closure)])
            ));
        } else if(refNode.value === "extern.runnable") {
          const fnArgs = this.varNode<Record<string, unknown>>()
          const chainedClosure = this.mapNode({fnArgs, closure}, ({fnArgs, closure}) => ({...fnArgs, ...closure}));
          const fnNode = this.fromNodeInternal(graph, edgesIn.find(e => e.as === "fn").from, chainedClosure)
          return this.constNode((args) => {
            fnArgs.set(args);
            return this.run(fnNode);
          });
        } else if(refNode.value === "extern.map") {
          return this.mapNode(calculateInputs() as {fn: WatchNode<(mapArgs: {element: unknown, index: number}) => unknown>, array: WatchNode<Array<unknown>>}, ({fn, array}) => array.map((element, index) => fn({element, index})))
        } else if(refNode.value === "extern.fold") {
          return this.mapNode(calculateInputs() as {fn: WatchNode<(mapArgs: {previousValue: T, currentValue: unknown, index: number}) => T>, object: WatchNode<Array<unknown>>, initial: WatchNode<T>}, ({fn, object, initial}) => Array.isArray(object) ? object : Object.entries(object).reduce<T>((previousValue, currentValue, index) => fn({previousValue, currentValue, index}), initial))
        } else if(refNode.value === "extern.ap") {
          const fn: WatchNode<(mapArgs: Record<string, unknown>) => T> = this.fromNodeInternal(graph, edgesIn.find(e => e.as === "fn").from, closure)
          const run: WatchNode<boolean> = this.fromNodeInternal(graph, edgesIn.find(e => e.as === "fn").from, closure);
          const apArgs = this.varNode<Record<string, unknown>>()
          const chainedClosure = this.mapNode({apArgs, closure}, ({apArgs, closure}) => ({...apArgs, ...closure}));
          const args = this.mapNode({argsNode: this.fromNodeInternal(graph, edgesIn.find(e => e.as === "args").from, chainedClosure) as WatchNode<Record<string, unknown>>}, ({argsNode}) => argsNode);
          
          return this.mapNode({fn, run}, ({fn, run}) => {
            if(run) {
              return fn(this.run(args));
            } else {
              return (args) => {
                apArgs.set(args);
                return fn(this.run(args))
              }
            }
          });
        } else {
          const inputs = calculateInputs()
          return this.mapNode(
            inputs, 
            (nodeArgs) => node_extern(refNode, new Map(Object.entries(nodeArgs).map(e => [e[0], nolib.no.of(e[1])])), newEnv(new Map([["__graphid",nolib.no.of(refNode.id)]])), nolibLib, {}).value)
        }
      } else if(refNode.ref === "arg") {
        return this.mapNode({args: closure}, ({args}) => get(args, parseArg(refNode.value).name) as T | Runnable);
      } else if(isGraph(nodeRef)) { 
        return this.fromNodeInternal(nodeRef, nodeRef.out ?? "out", this.mapNode(calculateInputs(), args => ({...args, __graph_value: node.value})))
      } else {
        return dereference(nodeRef)
      }
    }

    if(isNodeRef(node)) {
      return {...dereference(node), graphNode: node};
    } else if(isNodeValue(node)) {
      return {...this.constNode(node_value(node)), graphNode: node}
    } else {
      return {...this.mapNode(calculateInputs(), args => args as T), graphNode: node};
    }
  } 

  private runNode<T>(node: AnyNode<T>, args?: RUnknown): T | Nothing{
    let result;
    if(isConstNode(node)) {
      result = node.value.read();
    } else if (isMapNode(node)) {
      const prev = node.cachedInputs.read();
      const next = mapEntries(node.inputs, e => this.runNode(this.scope.get(e[1])));
      if(isNothing(node.value.read()) || isNothing(prev) || node.isStale(prev, next)) {
        node.value.write(chainNothing(node.fn, fn => chainNothing(fn.read(), ffn => ffn(next))));
        node.cachedInputs.write(next);
      }

      result = node.value.read();
    } else if(isIONode(node)) {
      node.value.write(chainNothing(node.fn.read(), fn => fn()));
      result = node.value.read();
    } else if (isBindNode(node)) {
      const prev = node.cachedInputs.read();
      const next = mapEntries(node.inputs, e => this.runNode(this.scope.get(e[1])));
      if(isNothing(node.value.read()) || isNothing(prev) || node.isStale(prev, next)) {
        node.value.write(chainNothing(node.fn, fn => fn(next)) ?? nothingValue);
        node.cachedInputs.write(next);
      }

      const boundNode: Nothing | T = node.value.read();
      if(!isNothing(boundNode)) this.scope.add(boundNode as AnyNode<unknown>);
      result = boundNode;
    }

    if(this.watches[node.id]) {
      this.watches[node.id].forEach(w => w(result));
    }

    return result;
  }

  public run<T>(node: WatchNode<T>, args?: RUnknown) {
    return this.runNode(this.scope.get(node.id) as AnyNode<T>)
  }
}


//
// export type IndependentNode<T> = DependencyTreeNode<T, Record<string, never>>;
//
// type RuntimeNode = {
//   id: string;
//   fn: (args: any) => any,
//   inputs: {[k: string]: string};
// }
//
// // export type BaseNode<T> = {
// //   invalidateOn: ((invalidate: () => void) => void | (() => void))
// //   value?: T,
// // };
//
// // export type DependencyTreeNode<T, R extends {[k: string]: unknown}> = BaseNode<T> & (R extends {[k: string]: never} ?  IndependentNode<T> : DependentNode<T, R>)
//
// export const staticNode = <T>(a: T): DependencyTreeNode<T, Record<string, never>> => ({
//   id: uuid(),
//   invalidateOn: () => {},
//   fn: () => a,
//   inputs: {}
// });
//
// export const ioNode = <T>(fn: () => T): DependencyTreeNode<T, Record<string, never>> => ({
//   id: uuid(),
//   invalidateOn: () => {},
//   fn,
//   inputs: {}
// });
//
// export const dependentNode = <T, R extends RUnknown>(nodes: {[k in keyof R]: DependencyTreeNode<R[k], any>}, fn: (args: R) => T): DependencyTreeNode<T, R> => ({
//   id: uuid(),
//   invalidateOn: () => {},
//   fn,
//   inputs: nodes
// });
//
// export const addInvalidation = <T, R extends RUnknown>(node: DependencyTreeNode<T, R>, invalidateOn: (invalidate: () => void) => void) => ({
//   ...node,
//   invalidateOn
// });
//
// export const contextNode = (node: DependencyTreeNode<any, RUnknown>) => {
//   const context = new NodysseusRuntime();
//   context.add(node);
//   return {run: () => context.run(node.id)};
// }
//
// export const fromNode = (graph: Graph, nodeId: string, store: NodysseusStore, env?: DependencyTreeNode<any, RUnknown>): DependencyTreeNode<any, RUnknown> => {
//   const node = graph.nodes[nodeId];
//   const edgesIn: Edge[] = graph.edges_in?.[nodeId] ? Object.values(graph.edges_in?.[nodeId]) : Object.values(graph.edges).filter((e: Edge) => e.to === nodeId);
//   const returnEnv = isNodeRef(node) && node.ref === "return" && edgesIn.find(e => e.as === "args") && dependentNode(Object.assign({
//     argsResult: fromNode(graph, edgesIn.find(e => e.as === "args").from, store),
//   }, env ? {parentEnv: env} : {}), ({argsResult, parentEnv}) => ({...(parentEnv as any), ...argsResult})
//   ) || env;
//
//
//   const createFn = (fnNode) => {
//     if(isNodeRef(fnNode)) {
//       if(fnNode.ref === "@js.script"){
//         const scriptFn = new Function(...edgesIn.map(e => e.as), node.value) as (...args: any[]) => any;
//         return (args) => scriptFn(...Object.values(args));
//       } else if (fnNode.ref === "return") {
//         return (args) =>{ 
//           console.log("running return", fnNode, args)
//           return args[args["_output"] ?? "value"];
//         }
//       } else if (fnNode.ref === "arg") {
//         return (args) => args["__env"][fnNode.value]
//       } else if(fnNode.ref === "extern") {
//         return (args) => {
//           const nodeArgs = new Map(Object.entries(args ?? {}).map(e => [e[0], nolib.no.of(e[1])]));
//           return node_extern(fnNode, nodeArgs, newEnv(new Map([["__graphid",nolib.no.of(node.id)]])), nolibLib, {}).value
//         };
//       } else {
//         const nodeRef = store.refs.get(fnNode.ref);
//         if(isGraph(nodeRef)) {
//           // TODO: clean - this is messy
//           let contextArgs = {}, invalidate;
//           const argsEnv = addInvalidation(ioNode(() => contextArgs), inv => {
//             invalidate = inv
//           });
//           const n = fromNode(nodeRef, nodeRef.out ?? "out", store, argsEnv);
//           const ctxRuntime = contextNode(n);
//           return (ctxArgs) => {
//             console.log("running ctx", fnNode, n, ctxArgs)
//             contextArgs = ctxArgs;
//             invalidate && invalidate();
//             const res = ctxRuntime.run()
//             console.log("got res", res)
//             return res;
//           }
//         } else {
//           return createFn(nodeRef)
//         }
//       }
//     } else if(isNodeValue(node)) {
//       return () => node_value(node);
//     } else {
//       return (args) => args;
//     }
//   }
//   
//   let cachedFn;
//   return {
//     id: uuid(),
//     invalidateOn: () => {},
//     inputs: Object.fromEntries(edgesIn.map(e => [e.as, fromNode(graph, e.from, store, returnEnv)]).concat(isNodeRef(node) && node.ref === "arg" && env ? [["__env", env]] : [])),
//     fn: (args) => {
//       if(!cachedFn) {
//         cachedFn = createFn(node)
//       }
//       return cachedFn && cachedFn(args)
//     }
//   }
// }
//
// // export const isDependentNode = <T, R extends {[k: string]: unknown}>(a: any): a is DependentNode<T, R>  => !!(a as DependentNode<T, R>).inputs
// // export const isIndependentNode = <T>(a: any): a is IndependentNode<T>  => !(a as IndependentNode<T>).inputs
//
// export class NodysseusRuntime {
//   private nodeCache: Record<string, RuntimeNode> = {};
//   private valueCache: RUnknown = {};
//   private invalidCache: Record<string, boolean> = {};
//   private outputsCache: Record<string, Record<string, DependencyTreeNode<unknown, RUnknown>>> = {};
//   constructor(){}
//   private invalidate(node: DependencyTreeNode<any, any>) {
//     const isInvalid = this.invalidCache[node.id] === true;
//     this.invalidCache[node.id] = true;
//     if(this.outputsCache[node.id] && !isInvalid) Object.values(this.outputsCache[node.id]).forEach(n => this.invalidate(n));
//   }
//   add(nodes: DependencyTreeNode<any, any> | Array<DependencyTreeNode<any, any>>) {
//     (Array.isArray(nodes) ? nodes : [nodes]).forEach(node => {
//       this.nodeCache[node.id] = {...node, inputs: Object.fromEntries(Object.entries(node.inputs).map(e => {
//         return [e[0], e[1].id]
//       }))};
//       node.invalidateOn(() => this.invalidate(node));
//       this.invalidate(node);
//       Object.values(node.inputs).forEach(i => {
//         if(!this.outputsCache[i.id]) {
//           this.outputsCache[i.id] = {};
//         }
//         this.outputsCache[i.id][node.id] = node;
//       });
//       this.add(Object.values(node.inputs));
//     });
//   }
//   run<T, R extends {[k: string]: unknown | never}>(nodeId: string, args?: RUnknown): T{
//     if(this.invalidCache[nodeId]) {
//       const nodeArgs = Object.fromEntries(Object.entries(this.nodeCache[nodeId].inputs).map(e => [e[0], this.run(e[1], args)])) as R
//       this.valueCache[nodeId] = this.nodeCache[nodeId].fn(Object.assign({}, args ? {__env: args} : {}, nodeArgs));
//       this.invalidCache[nodeId] = false;
//     }
//     return this.valueCache[nodeId] as T;
//   }
// }
