
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

export type BindNode<T, S extends Record<string, unknown>> = T extends AnyNode<infer R> ? Node<"bind", T> & {
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
  private watches: Record<string, Array<(a: unknown) => void>>

  constructor(){
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
    return this.mapNode({bound: binding}, ({bound}) => this.runNode(bound))
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

  public fromNode<T, S extends Record<string, unknown>>(graph: Graph, nodeId: string, store: NodysseusStore, argsNode?: VarNode<S>): {args: VarNode<S>, result: WatchNode<T>} {
    argsNode = argsNode ?? this.varNode<S>({} as S);
    return {
      args: argsNode,
      result: this.fromNodeInternal<T, S>(graph, nodeId, store, argsNode).result
    };
  }

  fromNodeInternal<T, S extends Record<string, unknown>>(graph: Graph, nodeId: string, store: NodysseusStore, argsNode?: WatchNode<S>): {args: VarNode<S> | WatchNode<S>, result: WatchNode<T>} {
    const node = graph.nodes[nodeId];
    const edgesIn: Edge[] = graph.edges_in?.[nodeId] ? Object.values(graph.edges_in?.[nodeId]) : Object.values(graph.edges).filter((e: Edge) => e.to === nodeId);

    const calculateInputs = () => Object.fromEntries(edgesIn.map(e => [e.as, this.fromNodeInternal(graph, e.from, store, argsNode).result]));

    if(isNodeRef(node)) {
      if(node.ref === "@js.script") {
        const scriptFn = new Function(...edgesIn.map(e => e.as), node.value) as (...args: any[]) => any;
        return {
          args: argsNode,
          result: this.mapNode(calculateInputs(), (args) => scriptFn(...Object.values(args)))
        }
      } else if (node.ref === "return") {
        const argsEdge = edgesIn.find(e => e.as === "args");
        const chainedArgsNode = argsEdge ? this.mapNode({env:argsNode, args: this.fromNodeInternal<Record<string, unknown>, S>(graph, argsEdge.from, store, argsNode).result}, ({env, args}) => ({...env, ...args})) : argsNode;

        return {
          args: argsNode,
          result: this.mapNode(
            Object.fromEntries(
              edgesIn
                .filter(e => e.as !== "args")
                .map(e => [e.as, this.fromNodeInternal(graph, e.from, store, chainedArgsNode).result])
            ),
            args => args["value"] as T
          )
        }
      } else if (node.ref === "extern") {
        return {
          args: argsNode,
          result: this.mapNode(calculateInputs(), (nodeArgs) => node_extern(node, new Map(Object.entries(nodeArgs).map(e => [e[0], nolib.no.of(e[1])])), newEnv(new Map([["__graphid",nolib.no.of(node.id)]])), nolibLib, {}).value)
        }
      } else if(node.ref === "arg") {
        return {
          args: argsNode,
          result: this.mapNode({args: argsNode}, ({args}) => args[node.value] as T)
        }
      }
    } else if(isNodeValue(node)) {
      return {
        args: argsNode,
        result: this.constNode(node_value(node))
      }
    } else {
      return {
        args: argsNode,
        result: this.mapNode(calculateInputs(), args => args as T)
      }
    }

    console.log("hit no path for", node)
  } 

  private runNode<T>(node: AnyNode<T>, args?: RUnknown): T | Nothing{
    if(isConstNode(node)) {
      return node.value.read();
    } else if (isMapNode(node)) {
      const prev = node.cachedInputs.read();
      const next = mapEntries(node.inputs, e => this.runNode(this.scope.get(e[1])));
      if(isNothing(node.value.read()) || isNothing(prev) || node.isStale(prev, next)) {
        node.value.write(chainNothing(node.fn, fn => chainNothing(fn.read(), ffn => ffn(next))));
        node.cachedInputs.write(next);
      }

      return node.value.read();
    } else if(isIONode(node)) {
      node.value.write(chainNothing(node.fn.read(), fn => fn()));
      return node.value.read();
    } else if (isBindNode(node)) {
      const prev = node.cachedInputs.read();
      const next = mapEntries(node.inputs, e => this.runNode(this.scope.get(e[1])));
      if(isNothing(node.value.read()) || isNothing(prev) || node.isStale(prev, next)) {
        node.value.write(chainNothing(node.fn, fn => fn(next)));
        node.cachedInputs.write(next);
      }

      const boundNode: Nothing | T = node.value.read();
      if(!isNothing(boundNode)) this.scope.add(boundNode as AnyNode<unknown>);
      return boundNode;
    }
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
