
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

export const contextNode = (node: DependencyTreeNode<any, RUnknown>) => {
  const context = new NodysseusRuntime();
  context.add(node);
  return {run: () => context.run(node.id)};
}

export const fromNode = (graph: Graph, nodeId: string, store: NodysseusStore, env?: DependencyTreeNode<any, RUnknown>): DependencyTreeNode<any, RUnknown> => {
  const node = graph.nodes[nodeId];
  const edgesIn: Edge[] = graph.edges_in?.[nodeId] ? Object.values(graph.edges_in?.[nodeId]) : Object.values(graph.edges).filter((e: Edge) => e.to === nodeId);
  const returnEnv = isNodeRef(node) && node.ref === "return" && edgesIn.find(e => e.as === "args") && dependentNode(Object.assign({
    argsResult: fromNode(graph, edgesIn.find(e => e.as === "args").from, store),
  }, env ? {parentEnv: env} : {}), ({argsResult, parentEnv}) => ({...(parentEnv as any), ...argsResult})
  ) || env;


  const createFn = (fnNode) => {
    if(isNodeRef(fnNode)) {
      if(fnNode.ref === "@js.script"){
        const scriptFn = new Function(...edgesIn.map(e => e.as), node.value) as (...args: any[]) => any;
        return (args) => scriptFn(...Object.values(args));
      } else if (fnNode.ref === "return") {
        return (args) =>{ 
          console.log("running return", fnNode, args)
          return args[args["_output"] ?? "value"];
        }
      } else if (fnNode.ref === "arg") {
        return (args) => args["__env"][fnNode.value]
      } else if(fnNode.ref === "extern") {
        return (args) => {
          const nodeArgs = new Map(Object.entries(args ?? {}).map(e => [e[0], nolib.no.of(e[1])]));
          return node_extern(fnNode, nodeArgs, newEnv(new Map([["__graphid",nolib.no.of(node.id)]])), nolibLib, {}).value
        };
      } else {
        const nodeRef = store.refs.get(fnNode.ref);
        if(isGraph(nodeRef)) {
          // TODO: clean - this is messy
          let contextArgs = {}, invalidate;
          const argsEnv = addInvalidation(ioNode(() => contextArgs), inv => {
            invalidate = inv
          });
          const n = fromNode(nodeRef, nodeRef.out ?? "out", store, argsEnv);
          const ctxRuntime = contextNode(n);
          return (ctxArgs) => {
            console.log("running ctx", fnNode, n, ctxArgs)
            contextArgs = ctxArgs;
            invalidate && invalidate();
            const res = ctxRuntime.run()
            console.log("got res", res)
            return res;
          }
        } else {
          return createFn(nodeRef)
        }
      }
    } else if(isNodeValue(node)) {
      return () => node_value(node);
    } else {
      return (args) => args;
    }
  }
  
  let cachedFn;
  return {
    id: uuid(),
    invalidateOn: () => {},
    inputs: Object.fromEntries(edgesIn.map(e => [e.as, fromNode(graph, e.from, store, returnEnv)]).concat(isNodeRef(node) && node.ref === "arg" && env ? [["__env", env]] : [])),
    fn: (args) => {
      if(!cachedFn) {
        cachedFn = createFn(node)
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
      this.nodeCache[node.id] = {...node, inputs: Object.fromEntries(Object.entries(node.inputs).map(e => {
        return [e[0], e[1].id]
      }))};
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
      const nodeArgs = Object.fromEntries(Object.entries(this.nodeCache[nodeId].inputs).map(e => [e[0], this.run(e[1], args)])) as R
      this.valueCache[nodeId] = this.nodeCache[nodeId].fn(Object.assign({}, args ? {__env: args} : {}, nodeArgs));
      this.invalidCache[nodeId] = false;
    }
    return this.valueCache[nodeId] as T;
  }
}
