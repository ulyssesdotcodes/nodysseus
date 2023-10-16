
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

import { ConstRunnable, Edge, Graph, NodysseusNode, NodysseusStore, Runnable, isNodeRef, isNodeValue } from "../types.js";
import { node_extern, node_value, nolib, nolibLib, run_extern } from "../nodysseus.js";
import { v4 as uuid } from "uuid";
import { newEnv, wrapPromise } from "../util.js";

type RUnknown = Record<string, unknown>;

// export type IndependentNode<T> = BaseNode<T> & {
//   fn: () => T,
// };

export type DependencyTreeNode<T, R extends RUnknown> = {
  /**
    * @param invalidate - call to invalidate this node in the dependency tree
    * @returns a cleanup function
    */
  id: string;
  fn: (args: R) => T,
  inputs: {[k in keyof R]: DependencyTreeNode<R[k], any>};
  invalidateOn: ((invalidate: () => void) => void | (() => void))
}

export type IndependentNode<T> = DependencyTreeNode<T, Record<string, never>>;

type RuntimeNode = {
  id: string;
  fn: (args: any) => any,
  inputs: {[k: string]: string};
  invalidateOn: ((invalidate: () => void) => void | (() => void))
}

// export type BaseNode<T> = {
//   invalidateOn: ((invalidate: () => void) => void | (() => void))
//   value?: T,
// };

// export type DependencyTreeNode<T, R extends {[k: string]: unknown}> = BaseNode<T> & (R extends {[k: string]: never} ?  IndependentNode<T> : DependentNode<T, R>)

export const staticNode = <T>(a: T): DependencyTreeNode<T, Record<string, never>> => ({
  id: uuid(),
  invalidateOn: () => {},
  fn: () => a,
  inputs: {}
});

export const ioNode = <T>(fn: () => T): DependencyTreeNode<T, Record<string, never>> => ({
  id: uuid(),
  invalidateOn: () => {},
  fn,
  inputs: {}
});

export const dependentNode = <T, R extends RUnknown>(nodes: {[k in keyof R]: DependencyTreeNode<R[k], any>}, fn: (args: R) => T): DependencyTreeNode<T, R> => ({
  id: uuid(),
  invalidateOn: () => {},
  fn,
  inputs: nodes
});

export const addInvalidation = <T, R extends RUnknown>(node: DependencyTreeNode<T, R>, invalidateOn: (invalidate: () => void) => void) => ({
  ...node,
  invalidateOn
});

export const contextNode = (node: DependencyTreeNode<any, RUnknown>, env?: DependencyTreeNode<any, RUnknown>): DependencyTreeNode<any, RUnknown> => {
  const context = new NodysseusRuntime();
  context.add(node);
  return {
    id: uuid(),
    invalidateOn: () => {},
    inputs: {env: env},
    fn: ({env}) => context.run(node.id, env as any)
  }
}

export const fromNode = (graph: Graph, nodeId: string, nodysseus: NodysseusStore, env?: DependencyTreeNode<any, RUnknown>): DependencyTreeNode<any, RUnknown> => {
  const node = graph.nodes[nodeId];
  const edgesIn: Edge[] = graph.edges_in?.[nodeId] ? Object.values(graph.edges_in?.[nodeId]) : Object.values(graph.edges).filter((e: Edge) => e.to === nodeId);
  const returnEnv = isNodeRef(node) && node.ref === "return" && edgesIn.find(e => e.as === "args") && dependentNode(Object.assign({
    argsResult: fromNode(graph, edgesIn.find(e => e.as === "args").from, nodysseus),
  }, env ? {parentEnv: env} : {}), ({argsResult, parentEnv}) => ({...(parentEnv as any), ...argsResult})
  )|| env;
  let cachedFn;
  return {
    id: uuid(),
    invalidateOn: () => {},
    inputs: Object.fromEntries(edgesIn.map(e => [e.as, fromNode(graph, e.from, nodysseus, returnEnv)]).concat(isNodeRef(node) && node.ref === "arg" ? [["__env", env]] : [])),
    fn: (args) => {
      if(!cachedFn) {
        if(isNodeRef(node)) {
          if(node.ref === "@js.script"){
            const scriptFn = new Function(...edgesIn.map(e => e.as), node.value) as (...args: any[]) => any;
            cachedFn = (args) => scriptFn(...Object.values(args));
          } else if (node.ref === "return") {
            cachedFn = (args) => args.value;
          } else if (node.ref === "arg") {
            cachedFn = (args) => (console.log(args), args)["__env"][node.value]
          } else if(node.ref === "extern") {
            cachedFn = (args) => {
              const nodeArgs = new Map(Object.entries(args ?? {}).map(e => [e[0], nolib.no.of(e[1])]));
              return node_extern(node, nodeArgs, newEnv(new Map()), nolibLib, {}).value
            };
          }
        } else if(isNodeValue(node)) {
          cachedFn = () => node_value(node);
        } else {
          cachedFn = (args) => args;
        }
      }
      return cachedFn && cachedFn(args)
    }
  }
}

// export const isDependentNode = <T, R extends {[k: string]: unknown}>(a: any): a is DependentNode<T, R>  => !!(a as DependentNode<T, R>).inputs
// export const isIndependentNode = <T>(a: any): a is IndependentNode<T>  => !(a as IndependentNode<T>).inputs

export class NodysseusRuntime {
  private nodeCache: Record<string, RuntimeNode> = {};
  private valueCache: RUnknown = {};
  private invalidCache: Record<string, boolean> = {};
  private outputsCache: Record<string, Record<string, DependencyTreeNode<unknown, RUnknown>>> = {};
  constructor(){}
  private invalidate(node: DependencyTreeNode<any, any>) {
    const isInvalid = this.invalidCache[node.id] === true;
    this.invalidCache[node.id] = true;
    if(this.outputsCache[node.id] && !isInvalid) Object.values(this.outputsCache[node.id]).forEach(n => this.invalidate(n));
  }
  add(nodes: DependencyTreeNode<any, any> | Array<DependencyTreeNode<any, any>>) {
    (Array.isArray(nodes) ? nodes : [nodes]).forEach(node => {
      this.nodeCache[node.id] = {...node, inputs: Object.fromEntries(Object.entries(node.inputs).map(e => [e[0], e[1].id]))};
      node.invalidateOn(() => this.invalidate(node));
      this.invalidate(node);
      Object.values(node.inputs).forEach(i => {
        if(!this.outputsCache[i.id]) {
          this.outputsCache[i.id] = {};
        }
        this.outputsCache[i.id][node.id] = node;
      });
      this.add(Object.values(node.inputs));
    });
  }
  run<T, R extends {[k: string]: unknown | never}>(nodeId: string, args?: RUnknown): T{
    if(this.invalidCache[nodeId]) {
      this.valueCache[nodeId] = this.nodeCache[nodeId].fn(Object.fromEntries(Object.entries(this.nodeCache[nodeId].inputs).map(e => [e[0], this.run(e[1], args)])) as R);
      this.invalidCache[nodeId] = false;
    }
    return this.valueCache[nodeId] as T;
  }
}
