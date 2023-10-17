
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

import { ConstRunnable, Edge, Graph, NodysseusNode, NodysseusStore, Runnable, isGraph, isNodeRef, isNodeValue } from "../types.js";
import { node_extern, node_value, nolib, nolibLib, run_extern } from "../nodysseus.js";
import { v4 as uuid } from "uuid";
import { newEnv, wrapPromise } from "../util.js";
import { javascript } from "@codemirror/lang-javascript";

type RUnknown = Record<string, unknown>;

// export type IndependentNode<T> = BaseNode<T> & {
//   fn: () => T,
// };
//

const mapEntries = <T extends Record<string, unknown>, S extends Record<string, unknown>>(v: T, f: (e: [string, T["string"]]) => S[keyof S]): S =>
  Object.fromEntries(Object.entries(v).map((e: [string, unknown]) => [e[0], f(e as [string, T["string"]])])) as S;

type NodeKind = "const" | "map" | "io";
type Nothing = {__kind: "nothing"}
const isNothing = (a: any): a is Nothing => a && (a as Nothing).__kind === "nothing";
const nothingOf = (): Nothing => ({__kind: "nothing"})
const nothingValue: Nothing = {__kind: "nothing"};
const chainNothing = <T, S>(a: Nothing | T, fn: (a: T) => S): Nothing | S => isNothing(a) ? a : fn(a);


export class State<T> {
  constructor(private value: T | Nothing = nothingValue){};
  write(value: T | Nothing){
    this.value = value;
  }
  read() {
    return this.value;
  }
}

export interface Node<K extends NodeKind, T = unknown> {
  /**
    * @param invalidate - call to invalidate this node in the dependency tree
    * @returns a cleanup function
    */
  __kind: K
  id: string;
  value: State<T>;
}

export interface ConstNode<T> extends Node<"const", T> {
}

const isConstNode = <T>(a: Node<NodeKind, T>): a is ConstNode<T> => (a as ConstNode<T>)?.__kind === "const";

export interface MapNode<T, S extends Record<string, unknown>, R extends (s: S) => T> extends Node<"map", T> {
  fn: State<R>;
  inputs: Record<string, string>;
}
const isMapNode = <T ,S extends Record<string, unknown>, R extends (s: S) => T>(a: Node<NodeKind, T>): a is MapNode<T, S, R> => (a as MapNode<T, S, R>)?.__kind === "map";

export interface IONode<T, F extends () => T> extends Node<"io", T>{
  fn: State<F>;
}

const isIONode = <T, F extends () => T>(a: Node<NodeKind, T>): a is IONode<T, F> => a?.__kind === "io";

class Scope {
  private nodes: Record<string, Node<NodeKind>> = {};
  constructor(){};
  node(id: string){
    return this.nodes[id];
  }
}

const runNode = <K extends NodeKind, T>(scope: Scope, node: Node<K, T>): Nothing | T => {
  if(isConstNode(node)) {
    return node.value.read();
  } else if (isMapNode(node)) {
    if(isNothing(node.value.read())) {
      node.value.write(chainNothing(node.fn, fn => chainNothing(fn.read(), ffn => ffn(mapEntries(node.inputs, e => runNode(scope, scope.node(e[1])))))));
    }

    return node.value.read();
  } else if(isIONode(node)) {
    node.value.write(chainNothing(node.fn.read(), fn => fn()));
    return node.value.read();
  }
}


export const constNode = <T>(a: T): ConstNode<T> => ({
  __kind: "const",
  id: uuid(),
  value: new State(a),
  inputs: {}
})

export const ioNode = <T, F extends () => T>(fn: F): IONode<T, F> => ({
  __kind: "io",
  id: uuid(),
  value: new State(),
  fn: new State(fn),
  inputs
})


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
