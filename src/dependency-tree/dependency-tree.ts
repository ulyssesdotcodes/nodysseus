
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

import { ConstRunnable, Edge, Graph, NodysseusNode, NodysseusStore, RefNode, Runnable, isGraph, isNodeRef, isNodeValue, isValue } from "../types.js";
import { initStore, node_extern, node_value, nolib, nolibLib, run_extern } from "../nodysseus.js";
import { v4 as uuid } from "uuid";
import { appendGraphId, newEnv, parseArg, wrapPromise } from "../util.js";
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
  __kind: "watch";
  id: string;
  watch: AsyncIterator<T>;
  graphNode?: NodysseusNode;
}

const isAnyNode = <T>(a: any): a is AnyNode<T> => a?.__kind === "watch";

export type VarNode<T> = AnyNode<T | Nothing> & {
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
  private nodes: Map<string, Node<NodeKind>> = new Map();
  constructor(){}
  add(node: Node<NodeKind>) {
    this.nodes.set(node.id, node);
  }
  get(id: string){
    return this.nodes.get(id);
  }
  count() {
    return this.nodes.size;
  }
}

export const constNode = <T>(a: T, id?: string): ConstNode<T> => ({
  __kind: "const",
  id: id ?? uuid(),
  value: new State(a),
})

export const ioNode = <T>(fn: () => T, id?: string): IONode<T> => ({
  __kind: "io",
  id: id ?? uuid(),
  value: new State(),
  fn: new State(fn),
})

export const mapNode = <T, S extends Record<string ,unknown>>(inputs: {[k in keyof S]: AnyNode<S[k]>}, fn: (s: S) => T, isStale: (previous: S, next: S) => boolean, id?: string): MapNode<T, S> => ({
  __kind: "map",
  id: id ?? uuid(),
  value: new State(),
  fn: new State(fn),
  cachedInputs: new State(),
  isStale,
  inputs: mapEntries(inputs, e => e[1].id)
});

export const bindNode = <R, T extends AnyNode<R> | AnyNode<R>, S extends Record<string, unknown>>(inputs: {[k in keyof S]: AnyNode<S[k]>}, fn: (inputs: S) => T, isStale = (p, n) => true, id?: string): BindNode<T, S> => ({
  __kind: "bind",
  id: id ?? uuid(),
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

  nodeCount(){
    this.scope.count();
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

  constNode<T>(v: T, id?: string): AnyNode<T> {
    const node = constNode(v, id);
    this.scope.add(node);
    return node;
  }

  ioNode<T>(fn: () => T, id?: string): AnyNode<T>{
    const node = ioNode(fn, id);
    this.scope.add(node);
    return node;
  }

  mapNode<T, S extends Record<string, unknown>>(inputs: {[k in keyof S]: AnyNode<S[k]>}, fn: (s: S) => T, isStale: (previous: S, next: S) => boolean = () => true, id?: string): AnyNode<T>{
    const node = mapNode(inputs, fn, isStale, id);
    this.scope.add(node);
    return node;
  }

  /**
    * Bind a function that creates a node to inputs. Inspired by monadic bind.
    */

  bindNode<R, T extends AnyNode<R>, S extends Record<string, unknown>>(inputs: {[k in keyof S]: AnyNode<S[k]>}, fn: (s: S) => T, isStale?: (previous: S, next: S) => boolean, id?: string): AnyNode<T>{
    const node = bindNode<R, T, S>(inputs, fn, isStale, id);
    this.scope.add(node);
    return node
  }

  /**
    * Uses bindNode to create a switch statement based on a key node
    */
  switchNode<T, S extends Record<string, T>>(key: AnyNode<string>, inputs: {[k in keyof S]: AnyNode<T>}, id?: string){
    const keyOptions: Record<string, AnyNode<AnyNode<T>>> = mapEntries(inputs, e => this.constNode(this.scope.get(e[1].id), id && `${id}-${e[0]}-const`) as AnyNode<AnyNode<T>>);
    const binding: AnyNode<AnyNode<T>> = this.bindNode({key, ...keyOptions} as { key: AnyNode<string> } & {[k in keyof S]: AnyNode<AnyNode<T>> }, (args) => args[args.key] as AnyNode<T>, undefined, id && `${id}-bind`) as AnyNode<AnyNode<T>>;
    return this.mapNode({bound: binding}, ({bound}) => this.runNode(bound), undefined, id)
  }

  varNode<T>(initial?: T, id?: string) {
    let value: T | Nothing = initial ?? nothingValue;
    const node = this.ioNode(() => value, id);
    this.scope.add(node)
    return {
      ...node,
      set: (newValue: T) => value = newValue
    }
  }

  public fromNode<T, S extends Record<string, unknown>>(graph: Graph, nodeId: string, closure?: VarNode<S>): AnyNode<T> | Promise<AnyNode<T>> {
    closure = closure ?? this.varNode<S>({} as S, graph.id + "-closure");
    return wrapPromise(typeof graph === "string" ? this.store.refs.get(graph) : graph).then(graph =>
      this.fromNodeInternal<T, S>(graph, nodeId, graph.id, closure)
    ).value;
  }

  private fromNodeInternal<T, S extends Record<string, unknown>>(graph: Graph, nodeId: string, graphId: string, closure?: AnyNode<S | Nothing>,): AnyNode<T> {
    const node = graph.nodes[nodeId];
    const nodeGraphId = appendGraphId(graphId, nodeId)
    const edgesIn: Edge[] = graph.edges_in?.[nodeId] ? Object.values(graph.edges_in?.[nodeId]) : Object.values(graph.edges).filter((e: Edge) => e.to === nodeId);

    const calculateInputs = () => Object.fromEntries(edgesIn.map(e => [e.as, this.fromNodeInternal(graph, e.from, graphId, closure)]));

    const dereference = (graph: Graph, refNode: RefNode): AnyNode<T> => {
      const nodeRef = this.store.refs.get(refNode.ref) as Graph;
      if(refNode.ref === "@js.script") {
        const scriptFn = new Function(...edgesIn.map(e => e.as), refNode.value) as (...args: any[]) => any;
        return this.mapNode(calculateInputs(), (args) => scriptFn(...Object.values(args)), undefined, nodeGraphId + "-script")
      } else if (refNode.ref === "return") {
        const argsEdge = edgesIn.find(e => e.as === "args");
        const chainedscope = argsEdge ? this.mapNode({
          closure, 
          args: this.fromNodeInternal<Record<string, unknown>, S>(graph, argsEdge.from, graphId, closure)
        }, ({closure, args}) => ({...closure, ...args}), undefined, nodeGraphId + "-returnchained") : closure;

        return this.switchNode(
          this.mapNode(({closure}), ({closure}) =>  closure?.["_output"] ?? "value", undefined, nodeGraphId + "-returnmap"),
          Object.fromEntries(
            edgesIn
              .filter(e => e.as !== "args")
              .map(e => [e.as, this.fromNodeInternal(graph, e.from, graphId, chainedscope)])
          ),
          nodeGraphId + "-returnswitch"
        ) as AnyNode<T>
      } else if (refNode.ref === "extern") {
        if(refNode.value === "extern.switch") {
          const predEdge = edgesIn.find(e => e.as === "input");
          return this.switchNode(
            this.fromNodeInternal(graph, predEdge.from, graphId, closure), 
            Object.fromEntries(
              edgesIn.filter(e => e.as !== "input")
                .map(e => [e.as, this.fromNodeInternal(graph, e.from, graphId, closure)])
            ), nodeGraphId + "-switchswitch") as AnyNode<T>;
        } else if(refNode.value === "extern.runnable") {
          const fnArgs = this.varNode<Record<string, unknown>>({}, nodeGraphId + "-fnargs")
          const chainedClosure = this.mapNode({fnArgs, closure}, ({fnArgs, closure}) => ({...fnArgs, ...closure}), undefined, nodeGraphId + "-runnablechained");
          const fnNode = this.fromNodeInternal(graph, edgesIn.find(e => e.as === "fn").from, graphId, chainedClosure)
          return this.constNode(((args) => {
            fnArgs.set(args);
            return this.run(fnNode);
          }) as T, nodeGraphId + "-runnableconst");
        } else if(refNode.value === "extern.map") {
          return this.mapNode(calculateInputs() as {fn: AnyNode<(mapArgs: {element: unknown, index: number}) => unknown>, array: AnyNode<Array<unknown>>}, ({fn, array}) => array.map((element, index) => fn({element, index})), undefined, nodeGraphId + "-map") as AnyNode<T>
        } else if(refNode.value === "extern.fold") {
          return this.mapNode(
            calculateInputs() as { 
              fn: AnyNode<(mapArgs: {previousValue: T, currentValue: unknown, index: number}) => T>, 
              object: AnyNode<Array<unknown>>, 
              initial: AnyNode<T>
            }, ({fn, object, initial}) => 
              Array.isArray(object) ? object : 
              Object.entries(object).reduce<T>(
                (previousValue, currentValue, index) => 
                  fn({previousValue, currentValue, index}), initial), undefined, nodeGraphId + "-fold") as AnyNode<T>
        } else if(refNode.value === "extern.ap") {
          const fn: AnyNode<(mapArgs: Record<string, unknown>) => T> = this.fromNodeInternal(graph, edgesIn.find(e => e.as === "fn").from, graphId, closure)
          const run: AnyNode<boolean> = this.fromNodeInternal(graph, edgesIn.find(e => e.as === "fn").from, graphId, closure);
          const apArgs = this.varNode<Record<string, unknown>>({}, nodeGraphId + "-apapargs")
          const chainedClosure = this.mapNode({apArgs, closure}, ({apArgs, closure}) => ({...apArgs, ...closure}), undefined, nodeGraphId + "-apchained");
          const args = this.mapNode({
            argsNode: this.fromNodeInternal(graph, edgesIn.find(e => e.as === "args").from, graphId, chainedClosure) as AnyNode<Record<string, unknown>>
          }, ({argsNode}) => argsNode, undefined, nodeGraphId + "-apargs");
          
          return this.mapNode({fn, run}, ({fn, run}) => {
            if(run) {
              return fn(this.run(args));
            } else {
              return (args) => {
                apArgs.set(args);
                return fn(this.run(args))
              }
            }
          }, undefined, nodeGraphId + "-apmap") as AnyNode<T>;
        } else if (refNode.value === "extern.reference") {
          const initialNode = edgesIn.find(e => e.as === "initial")?.from 
            ? this.fromNodeInternal(graph, edgesIn.find(e => e.as === "initial").from, graphId, closure)
            : this.constNode(undefined, nodeGraphId + "-refconst");
          const setNode = this.varNode<T>(undefined, nodeGraphId + "-refset");

          return this.mapNode({initial: initialNode, set: setNode}, ({initial, set}) => ({
            value: set ?? initial,
            set: (t: T) => setNode.set(t)
          }), undefined, nodeGraphId + "-map") as AnyNode<T>
        } else if (refNode.value === "extern.state") {
          const valueNode = edgesIn.find(e => e.as === "value")?.from 
            ? this.fromNodeInternal(graph, edgesIn.find(e => e.as === "value").from, graphId, closure)
            : this.constNode(undefined, nodeGraphId + "-stateconst");
          const setNode = this.varNode<T>(undefined, nodeGraphId + "-stateset");

          return this.mapNode({initial: valueNode, set: setNode}, ({initial, set}) => ({
            value: set ?? initial,
            set: (t: T) => setNode.set(t)
          }), undefined, nodeGraphId + "-statemap") as AnyNode<T>
        } else {
          const inputs = calculateInputs()
          return this.mapNode(
            inputs, 
            (nodeArgs) => node_extern(refNode, new Map(Object.entries(nodeArgs).map(e => [e[0], nolib.no.of(e[1])])), newEnv(new Map([["__graphid", nolib.no.of(nodeGraphId)]])), nolibLib, {}).value,
            undefined,
            nodeGraphId
          )
        }
      } else if(refNode.ref === "arg") {
        return this.mapNode({args: closure}, ({args}) => get(args, parseArg(refNode.value).name) as T | Runnable, undefined, nodeGraphId)  as AnyNode<T>;
      } else if(isGraph(nodeRef)) { 
        return this.fromNodeInternal(
          nodeRef, 
          nodeRef.out ?? "out", 
          nodeGraphId, 
          this.mapNode(calculateInputs(), args => ({...args, __graph_value: node.value}), undefined, nodeGraphId + "-map"))
      } else {
        return dereference(graph, nodeRef)
      }
    }

    const graphNodeNode = this.varNode(node, nodeGraphId + "-graphnode");
    let isStale = true;
    nolib.no.runtime.addListener("graphchange", node.id + "-nodelistener", ({graph}) => {
      isStale = true;
      graphNodeNode.set(graph.nodes[node.id])
    })
    return this.mapNode({bound: this.bindNode({graphNodeNode}, ({graphNodeNode: node}) => {
      isStale = false;
      if(isNothing(node)) {
        return this.constNode(undefined, nodeGraphId + "-mapped");
      } else if(isNodeRef(node)) {
        return dereference(graph, node);
      } else if(isNodeValue(node)) {
        return this.constNode(node_value(node), nodeGraphId + "-mapped");
      } else {
        return this.mapNode(calculateInputs(), args => args as T, undefined, nodeGraphId + "-mapped")
      }
    }, () => isStale, nodeGraphId + "-graphchange")}, ({bound}) => this.run(bound), undefined, nodeGraphId + "-boundgraph");
  } 

  private runNode<T>(node: AnyNode<T>): T | Nothing{
    let result;
    if(isConstNode(node)) {
      result = node.value.read();
    } else if (isMapNode(node)) {
      const prev = node.cachedInputs.read();
      const next = {};
      let key;
      for(key in node.inputs) {
        next[key] = this.runNode(this.scope.get(node.inputs[key]))
      }
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
      const next = {};
      let key;
      for(key in node.inputs) {
        next[key] = this.runNode(this.scope.get(node.inputs[key]))
      }
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

  public run<T>(node: AnyNode<T>) {
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
