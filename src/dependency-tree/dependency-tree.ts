
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
import { appendGraphId, compareObjects, ispromise, newEnv, parseArg, wrapPromise, wrapPromiseAll } from "../util.js";
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

type NodeKind = "const" | "map" | "var" | "bind";
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

export const isAnyNode = <T>(a: any): a is AnyNode<T> => a?.__kind === "watch";

export type AnyNode<T> = Node<NodeKind, T>;
type AnyNodeMap<S extends Record<string, unknown>> = {[k in keyof S]: AnyNode<S[k]>}

export type Node<K extends NodeKind, T = unknown> = {
  __kind: K
  id: string;
  value: State<T>;
}

export type ConstNode<T> = Node<"const", T>;

const isConstNode = <T>(a: AnyNode<T>): a is ConstNode<T> => (a as ConstNode<T>)?.__kind === "const";

export type VarNode<T> = AnyNode<T> & {
  __kind: "var";
  set: (value: T) => void;
  compare: (a: T, b: T) => boolean;
}

const isVarNode = <T>(a: AnyNode<T>): a is VarNode<T> => (a as VarNode<T>)?.__kind === "var";

export type MapNode<T, S extends Record<string, unknown>> = Node<"map", T> & {
  fn: State<(s: S) => T>;
  cachedInputs: State<S>;
  isStale: (p: S, n: S) => boolean,
  inputs: Record<string, string>;
  isDirty: State<boolean>;
}
const isMapNode = <T ,S extends Record<string, unknown>>(a: AnyNode<T>): a is MapNode<T, S> => (a as MapNode<T, S>)?.__kind === "map";

export type BindNode<T, S extends Record<string, unknown>> = T extends AnyNode<unknown> ? Node<"bind", T> & {
  isStale: (p: S, n: S) => boolean,
  fn: (s: S) => T;
  inputs: {[k in keyof S]: string};
  cachedInputs: State<S>;
  isDirty: State<boolean>;
} : never;

const isBindNode = <T, S extends Record<string, unknown>>(a: AnyNode<T>): a is BindNode<T, S> => a?.__kind === "bind";

const isNode = <T>(a: any): a is AnyNode<T> => (a?.__kind === "bind" || a?.__kind === "var" || a?.__kind === "const" || a?.__kind === "map");

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
  removeAll(id: string) {
    for(const k of this.nodes.keys()) {
      if(k.startsWith(id) && k !== id + "-graphnode" && k !== id + "-calcedNode" && k !== id + "-nodelistener" && k !== id + "-boundgraph") {
        this.nodes.delete(k);
      }
    }
  }
}

export const constNode = <T>(a: T, id?: string): ConstNode<T> => ({
  __kind: "const",
  id: id ?? uuid(),
  value: new State(a),
})

export const varNode = <T>(set: (value: T) => void, compare: (a:T, b: T) => boolean = (a, b) => a === b, id?: string): VarNode<T> => ({
  __kind: "var",
  id: id ?? uuid(),
  value: new State(),
  set,
  compare
})

export const mapNode = <T, S extends Record<string ,unknown>>(inputs: {[k in keyof S]: AnyNode<S[k]>}, fn: (s: S) => T, isStale: (previous: S, next: S) => boolean, id?: string): MapNode<T, S> => ({
  __kind: "map",
  id: id ?? uuid(),
  value: new State(),
  fn: new State(fn),
  cachedInputs: new State(),
  isStale,
  inputs: mapEntries(inputs, e => e[1].id),
  isDirty: new State(true),
});

export const bindNode = <R, T extends AnyNode<R> | AnyNode<R>, S extends Record<string, unknown>>(inputs: {[k in keyof S]: AnyNode<S[k]>}, fn: (inputs: S) => T | PromiseLike<T>, isStale = (p, n) => true, id?: string): BindNode<T, S> => ({
  __kind: "bind",
  id: id ?? uuid(),
  value: new State(),
  fn,
  cachedInputs: new State(),
  inputs: mapEntries(inputs, e => e[1].id),
  isStale,
  isDirty: new State(true),
}) as BindNode<T, S>;


export class NodysseusRuntime {
  private scope: Scope;
  private _outputReturns: Map<string, string> = new Map();
  private watches: Record<string, {_output: "value" | "display", fn: Array<(a: unknown) => void>}> = {};
  private outputs: Map<string, Set<string>> = new Map();
  private inputs: Map<string, Set<string>> = new Map();
  private rerun: Map<string, number> = new Map();

  constructor(private store: NodysseusStore){
    this.scope = new Scope();
  }

  nodeCount(){
    this.scope.count();
  }

  public createWatch<T>(node: AnyNode<T>, _output: "value" | "display"): AsyncIterable<T>{
    return {
      [Symbol.asyncIterator]: () => ({
        next: () => new Promise<IteratorResult<T>>((res) => {
          if(!Object.hasOwn(this.watches, node.id)) this.watches[node.id] = {_output, fn: []};
          const watch = (a: T) => {
            this.watches[node.id].fn.splice(this.watches[node.id].fn.indexOf(watch), 1);
            res({value: a});
          }
          this.watches[node.id].fn.push(watch);
        })
      })
    }
  }

  private resetOutputs(id: string, inputs?: Array<AnyNode<unknown>> | Record<string, AnyNode<unknown>>) {
    if(!this.outputs.has(id)) this.outputs.set(id, new Set());
    if(!this.inputs.has(id)) this.inputs.set(id, new Set());
    else this.dirty(id);
    // this.outputs.get(id).clear();
    if(inputs) {
      let k;
      for(k in inputs) {
        this.outputs.get(inputs[k].id).add(id)
        this.inputs.get(id).add(inputs[k].id);
      }
    }
  }

  private dirty(id: string) {
    const node = this.scope.get(id);
    if(isMapNode(node) || isBindNode(node)) {
      if(node.isDirty.read()) return;
      node.isDirty.write(true);
    }
    let nid;
    const nodeOuts = this.outputs.get(id);
    for(nid of nodeOuts) {
      this.dirty(nid);
    }
    if(this.watches[id] && !this.rerun.has(id)) this.rerun.set(id, requestAnimationFrame(() => {
      this.runNode(this.scope.get(node.id));
      this.rerun.delete(id);
    }))
  }

  constNode<T>(v: T, id?: string): AnyNode<T> {
    const node = constNode(v, id);
    this.scope.add(node);
    this.resetOutputs(node.id)
    return node;
  }

  varNode<T>(initial?: T, compare?: (a: T, b: T) => boolean, id?: string) {
    const node = varNode((newValue: T) => {
      const currentValue = node.value.read()
      if(isNothing(currentValue) || !node.compare(currentValue, newValue)) {
        node.value.write(newValue);
        this.dirty(node.id);
      }
    }, compare, id);
    this.scope.add(node);
    this.resetOutputs(node.id);
    if(initial !== undefined) node.set(initial);
    return node;
  }

  mapNode<T, S extends Record<string, unknown>>(inputs: {[k in keyof S]: AnyNode<S[k]>}, fn: (s: S) => T, isStale: (previous: S, next: S) => boolean = () => true, id?: string): AnyNode<T>{
    const node = mapNode(inputs, fn, isStale, id);
    this.scope.add(node);
    this.resetOutputs(node.id, inputs)
    return node;
  }

  /**
    * Bind a function that creates a node to inputs. Inspired by monadic bind.
    */

  bindNode<R, T extends AnyNode<R>, S extends Record<string, unknown>>(
    inputs: {[k in keyof S]: AnyNode<S[k]>}, 
    fn: (s: S) => T | PromiseLike<T>, 
    isStale?: (previous: S, next: S) => boolean, id?: string
  ): AnyNode<T>{
    // console.log("creating bind")
    const node = bindNode<R, T, S>(inputs, args => {
      const current = node.value.read();
      return wrapPromise(fn(args))
        .then(outNode => {
          if(isNothing(outNode)) {
            debugger;
          }
          if(current !== outNode && outNode) {
            this.outputs.get(node.id).forEach(oid => this.outputs.get(outNode.id).add(oid));
            this.dirty(outNode.id)
          }
          return outNode
        }).value as T | PromiseLike<T>
      }, isStale, id);
    this.scope.add(node);
    this.resetOutputs(node.id, inputs)
    return node
  }

  /**
    * Uses bindNode to create a switch statement based on a key node
    */
  switchNode<T, S extends Record<string, T>>(key: AnyNode<string>, inputs: {[k in keyof S]: AnyNode<T>}, id?: string){
    // TODO: Make sure that bound is binding the output correctly to the bind node not to the "map" node
    const keyOptions: Record<string, AnyNode<AnyNode<T>>> = mapEntries(inputs, e => this.constNode(e[1], id && `${id}-${e[0]}-const`) as AnyNode<AnyNode<T>>);
    const binding: AnyNode<AnyNode<T>> = this.bindNode(
      {key, ...keyOptions} as { key: AnyNode<string> } & {[k in keyof S]: AnyNode<AnyNode<T>> }, 
      (args) => args[args.key] as AnyNode<T>, 
      (p, n) => p.key !== n.key || p[p.key] !== n[n.key], 
      id && `${id}-bind`
    ) as AnyNode<AnyNode<T>>;
    return this.mapNode({bound: binding}, ({bound}) => {
      const res = this.runNode(bound);
      return res && !isNothing(res) ? res : undefined;
    }, undefined, id)
  }

  public fromNode<T, S extends Record<string, unknown>>(graph: Graph, nodeId: string, closure?: AnyNodeMap<S>): AnyNode<T> | Promise<AnyNode<T>> {
    closure = closure ?? ({} as AnyNodeMap<S>);
    return wrapPromise(typeof graph === "string" ? this.store.refs.get(graph) : graph).then(graph =>
      this.fromNodeInternal<T, S>(graph, nodeId, graph.id, closure && this.constNode(closure))
    ).value;
  }

  private calcNode<T, S extends Record<string, unknown>>(graph: Graph, node: NodysseusNode, graphId: string, nodeGraphId: string, closure: AnyNode<AnyNodeMap<S>>, edgesIn: Edge[]) {
    const calculateInputs = () => Object.fromEntries(edgesIn.map(e => [e.as, this.fromNodeInternal(graph, e.from, graphId, closure)])) as AnyNodeMap<S>;
    // this.scope.removeAll(nodeGraphId)
    // console.log(this.scope.get(nodeGraphId))
    if(isNothing(node)) {
      return this.constNode(undefined, nodeGraphId);
    } else if(isNodeRef(node)) {
      return this.dereference(graph, node, edgesIn, graphId, nodeGraphId, closure, calculateInputs);
    } else if(isNodeValue(node)) {
      return this.constNode(node_value(node), nodeGraphId);
    } else {
      const outNode = this.mapNode(calculateInputs(), args => args, undefined, nodeGraphId)
      return outNode
    }
  }

  private dereference<T, S extends Record<string, unknown>>(graph: Graph, node: RefNode, edgesIn: Edge[], graphId: string, nodeGraphId: string, closure: AnyNode<AnyNodeMap<S>>, calculateInputs: () => AnyNodeMap<S>, refNode = node): AnyNode<T> | PromiseLike<AnyNode<T>> {
    return wrapPromise(this.store.refs.get(refNode.ref) as Graph)
      .then((nodeRef): AnyNode<T> => {
        if(refNode.ref === "@js.script") {
          const scriptFn = new Function(...edgesIn.map(e => e.as), refNode.value) as (...args: any[]) => any;
          return this.mapNode(calculateInputs(), (args) => scriptFn(...Object.values(args)), undefined, nodeGraphId)
        } else if (refNode.ref === "return") {
          const argsEdge = edgesIn.find(e => e.as === "args");
          const chainedscope: AnyNode<AnyNodeMap<S>> = argsEdge ? this.mapNode({
            closure,
            args: this.fromNodeInternal<Record<string, unknown>, S>(graph, argsEdge.from, graphId, closure)
          }, ({args, closure}) => ({
            ...closure,
            ...mapEntries(args, e => this.constNode(e[1], `${nodeGraphId}-${e[0]}-arg`) as S[keyof S]), 
          }), undefined, nodeGraphId + "-returnchained") as AnyNode<AnyNodeMap<S>> 
            : this.mapNode({closure}, ({closure}) => ({...closure, _output: undefined}), undefined, nodeGraphId + "-returnchained");

          const inputs = Object.fromEntries(
            edgesIn
              .filter(e => e.as !== "args")
              .map(e => [e.as, this.fromNodeInternal(graph, e.from, graphId, chainedscope)])
          )

          return this.switchNode(
            this.mapNode({bound: this.bindNode(
              {closure},
              ({closure}) => closure?.["_output"],
              undefined,
              nodeGraphId + "-returnmap"
            )}, ({bound}) => {
              if(this._outputReturns.has(nodeGraphId)){
                const _output = this._outputReturns.get(nodeGraphId);
                this._outputReturns.delete(nodeGraphId);
                return _output;
              }
              const res = bound && this.runNode(bound);
              return res && typeof res === "string" ? res : "value"
            }, undefined, nodeGraphId + "-bound_output"),
            inputs as AnyNodeMap<S>,
            nodeGraphId
          ) as AnyNode<T>
        } else if (refNode.ref === "extern") {
          if(refNode.value === "extern.switch") {
            const predEdge = edgesIn.find(e => e.as === "input");
            return this.switchNode(
              this.fromNodeInternal(graph, predEdge.from, graphId, closure), 
              Object.fromEntries(
                edgesIn.filter(e => e.as !== "input")
                  .map(e => [e.as, this.fromNodeInternal(graph, e.from, graphId, closure)])
              ), nodeGraphId) as AnyNode<T>;
          } else if(refNode.value === "extern.runnable") {
            const fnArgs = this.varNode<Record<string, unknown>>({}, undefined, nodeGraphId + "-fnargs")
            const chainedClosure = this.mapNode({fnArgs, closure}, ({fnArgs, closure}) => ({...mapEntries(fnArgs, e => this.constNode(e[1], `${nodeGraphId}-${e[0]}-arg`) as S[keyof S]), ...closure}), undefined, nodeGraphId + "-runnablechained") as AnyNode<AnyNodeMap<S>>;
            const fnNode = this.fromNodeInternal(graph, edgesIn.find(e => e.as === "fn").from, graphId, chainedClosure)
            return this.constNode(((args) => {
              fnArgs.set(args);
              return this.run(fnNode);
            }) as T, nodeGraphId + "-runnableconst");
          } else if(refNode.value === "extern.map") {
            return this.mapNode(calculateInputs() as {fn: AnyNode<(mapArgs: {element: unknown, index: number}) => unknown>, array: AnyNode<Array<unknown>>}, ({fn, array}) => array.map((element, index) => fn({element, index})), undefined, nodeGraphId) as AnyNode<T>
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
                    fn({previousValue, currentValue, index}), initial), undefined, nodeGraphId) as AnyNode<T>
          } else if(refNode.value === "extern.ap") {
            const fn: AnyNode<Array<(mapArgs: Record<string, unknown>) => T>> = this.fromNodeInternal(graph, edgesIn.find(e => e.as === "fn").from, graphId, closure)
            const run: AnyNode<boolean> = this.fromNodeInternal(graph, edgesIn.find(e => e.as === "fn").from, graphId, closure);
            const apArgs = this.varNode<Record<string, unknown>>({}, undefined, nodeGraphId + "-apapargs")
            const chainedClosure = this.mapNode({apArgs, closure}, ({apArgs, closure}) => ({...mapEntries(apArgs, e => this.constNode(e[1], `${nodeGraphId}-${e[0]}-arg`) as S[keyof S]), ...closure}), undefined, nodeGraphId + "-runnablechained") as AnyNode<AnyNodeMap<S>>;
            const argsEdge = edgesIn.find(e => e.as === "args")?.from;
            const args = argsEdge ? this.mapNode({
              argsNode: this.fromNodeInternal(graph, argsEdge, graphId, chainedClosure) as AnyNode<Record<string, unknown>>
            }, ({argsNode}) => argsNode, undefined, nodeGraphId + "-apargs") : closure;
            
            return this.mapNode({fn, run}, ({fn, run}) => {
              if(run) {
                return wrapPromise(this.run(args)).then(args => (Array.isArray(fn) ? fn : [fn]).filter(f => typeof f === "function").map(ffn => ffn(args))).then(results => Array.isArray(results) ? results : results[0]).value;
              } else {
                return (args) => {
                  apArgs.set(args);
                  return wrapPromise(this.run(apArgs) as Record<string, unknown>)
                    .then(args => (Array.isArray(fn) ? fn : [fn]).filter(f => typeof f === "function").map(ffn => ffn(args))).then(results => Array.isArray(results) ? results : results[0]).value;
                }
              }
            }, undefined, nodeGraphId) as AnyNode<T>;
          } else if (refNode.value === "extern.reference") {
            const initialNode = edgesIn.find(e => e.as === "initial")?.from 
              ? this.fromNodeInternal(graph, edgesIn.find(e => e.as === "initial").from, graphId, closure)
              : this.constNode(undefined, nodeGraphId + "-refconst");
            const setNode = this.varNode<T>(undefined, undefined, nodeGraphId + "-refset");

            return this.mapNode({initial: initialNode, set: setNode}, ({initial, set}) => ({
              value: set ?? initial,
              set: (t: T) => setNode.set(t)
            }), undefined, nodeGraphId) as AnyNode<T>
          } else if (refNode.value === "extern.state") {
            const valueNode = edgesIn.find(e => e.as === "value")?.from 
              ? this.fromNodeInternal(graph, edgesIn.find(e => e.as === "value").from, graphId, closure)
              : this.constNode(undefined, nodeGraphId + "-stateconst");
            const setNode = this.varNode<T>(undefined, undefined, nodeGraphId + "-stateset");

            return this.mapNode({initial: valueNode, set: setNode}, ({initial, set}) => ({
              value: set ?? initial,
              set: (t: T) => setNode.set(t)
            }), undefined, nodeGraphId) as AnyNode<T>
          } else if (refNode.value === "extern.frame") {
            const varNode: VarNode<T> = this.varNode(1 as T, undefined, nodeGraphId)
            const update = () => {
              varNode.set((varNode.value.read() as number) + 1 as T);
              if(this.scope.get(nodeGraphId) === varNode) {
                requestAnimationFrame(update);
              }
            }
            requestAnimationFrame(update);
            return varNode;
          } else {
            const inputs = calculateInputs()
            return this.mapNode(
              inputs, 
              (nodeArgs) => node_extern(
                refNode, 
                new Map(Object.entries(nodeArgs).map(e => [e[0], nolib.no.of(e[1])])), 
                newEnv(new Map([["__graphid", nolib.no.of(nodeGraphId)]])), nolibLib, {}
              ).value,
              undefined,
              nodeGraphId
            )
          }
        } else if(refNode.ref === "arg") {
          return this.mapNode({bound: this.bindNode(
            {closure},
            ({closure}) => {
              return closure[parseArg(refNode.value).name]
            },
            undefined,
            nodeGraphId + "-bind"
          )}, ({bound}) => {
            const res = this.runNode(bound);
            return (res && !isNothing(res) ? res : undefined) as T
          }, undefined, nodeGraphId);
          // this.switchNode(
          //   this.constNode(parseArg(refNode.value).name), 
          //   closure);
          //                        ({closure}) => {
          //   const ret = this.runNode(get(closure, parseArg(refNode.value).name))
          //   console.log("got arg", get(closure, parseArg(refNode.value).name), ret);
          //   return ret
          // }, undefined, nodeGraphId)  as AnyNode<T>;
        } else if(isGraph(nodeRef)) { 

          return this.mapNode({
          bound: this.bindNode({}, () => 
            this.fromNodeInternal(
              nodeRef, 
              nodeRef.out ?? "out", 
              nodeGraphId + nodeRef.id, 
              this.constNode({
                ...calculateInputs(), 
                _output: undefined,
                __graph_value: this.constNode(node.value, `${nodeGraphId}-internalnodegraphvalue`)
              }, nodeGraphId + "-args"))
          , undefined, nodeGraphId + "-graphoutbind")
          }, ({bound}) => this.runNode(bound) as T,
            undefined, nodeGraphId)
            // this.mapNode({}, () => ({
            //   ...calculateInputs(),
            //   _output: undefined,
            //   __graph_value: this.constNode(node.value, `${nodeGraphId}-internalnodegraphid`)
            // }), undefined, nodeGraphId + "-mappedclosure"))
        } else {
          return this.dereference(graph, node, edgesIn, graphId, nodeGraphId, closure, calculateInputs, nodeRef) as AnyNode<T>
        }
      }).value
  }


  private fromNodeInternal<T, S extends Record<string, unknown>>(graph: Graph, nodeId: string, graphId: string, closure?: AnyNode<AnyNodeMap<S>>): AnyNode<T> {
    const node = graph.nodes[nodeId];
    const nodeGraphId =  appendGraphId(graphId, nodeId)
    const staticGraphId = graph.id;
    const current = this.scope.get(nodeGraphId + "-boundgraph")
    if(current) return current as AnyNode<T>;

    const graphNodeNode: VarNode<{node: NodysseusNode, edgesIn: Array<Edge>, graph: Graph}> = this.varNode({
      graph,
      node: graph.nodes[node.id], 
      edgesIn: graph.edges_in?.[node.id] 
        ? Object.values(graph.edges_in?.[node.id]) 
        : Object.values(graph.edges).filter((e: Edge) => e.to === node.id)
    }, ({node: nodeA, edgesIn: edgesInA, graph: graphA}, {node: nodeB, edgesIn: edgesInB, graph: graphB}) => {
      if(!nodeB || !nodeA || !compareObjects(nodeA, nodeB) || edgesInA.length !== edgesInB.length) return false; 
      const sortedEdgesA = edgesInA.sort((a, b) => a.as.localeCompare(b.as));
      const sortedEdgesB = edgesInB.sort((a, b) => a.as.localeCompare(b.as));
      return sortedEdgesA.every((e, i) => compareObjects(e, sortedEdgesB[i]))
    }, nodeGraphId + "-graphnode");
    const calcedNode: AnyNode<AnyNode<T>> = this.bindNode({graphNodeNode}, ({graphNodeNode}) => {
      const newNode = this.calcNode(graphNodeNode.graph, graphNodeNode.node, graphId, nodeGraphId, closure, graphNodeNode.edgesIn);
      return newNode;
    }, undefined, nodeGraphId + "-calcedNode");
    // this.runNode(calcedNode);

    nolib.no.runtime.addListener("graphchange", nodeGraphId + "-nodelistener", ({graph}) => {
      if(graph.id === staticGraphId) {
        const newval: {graph: Graph, node: NodysseusNode, edgesIn: Array<Edge>} = {
          graph,
          node: graph.nodes[node.id],
          edgesIn: graph.edges_in?.[node.id] 
            ? Object.values(graph.edges_in?.[node.id]) 
            : Object.values<Edge>(graph.edges).filter((e: Edge) => e.to === node.id)
        }
        graphNodeNode.set(newval);
      }
    })

    return this.mapNode({
      bound: calcedNode
    }, ({bound}) => {
      const res = this.runNode(bound) as T;
      return res;
    }, undefined, nodeGraphId + "-boundgraph");
  } 

  private runNode<T>(node: AnyNode<T> | Nothing, _output?: "display" | "value"): T | PromiseLike<T> | Nothing{
    if(isNothing(node)) return node;
    const current = node.value?.read();
    let result;
    if(_output) {
      this._outputReturns.set(node.id.substring(0, node.id.lastIndexOf("-")), _output)
    }
    if(this.watches[node.id]) {
      this._outputReturns.set(node.id.substring(0, node.id.lastIndexOf("-")), this.watches[node.id]._output)
    }
    if(node && !isNothing(node) && (isVarNode(node) || isConstNode(node) || 
       !(node as MapNode<T, Record<string, unknown>> | BindNode<T, Record<string, unknown>>).isDirty.read())) {
      result = node.value.read();
    } else if (isMapNode(node)) {
      const prev = node.cachedInputs.read();

      const getPromises = () => {
        const updatedNode = this.scope.get(node.id) as MapNode<T, any>;

        const inputPromises = [];

        for(const key in updatedNode.inputs) {
          const inputNode = this.scope.get(updatedNode.inputs[key]);
          if(inputNode) {
            inputPromises.push(wrapPromise(this.runNode(inputNode)).then(input => [key, input]))
          }
        }

        return wrapPromiseAll(inputPromises)
          .then(ips => !this.scope.get(node.id) || compareObjects(updatedNode.inputs, (this.scope.get(node.id) as MapNode<T, any>).inputs) ? ips : getPromises()).value
      }


      return wrapPromise(getPromises()).then(allPromises => wrapPromiseAll(allPromises))
        .then(inputs => {
        const next = Object.fromEntries(inputs);
        const updatedNode = this.scope.get(node.id) as MapNode<T, any>;
        if(!updatedNode) {
          return;
        }
        // TODO: Comment in
        // next["_output"] = _output;
        if(_output === "display") {
          next["value"] = next["display"];
          const result = chainNothing(updatedNode.fn, fn => chainNothing(fn.read(), ffn => ffn(next)));
          if(this.watches[updatedNode.id]) {
            this.watches[updatedNode.id].fn.forEach(fn => fn(result));
          }
          updatedNode.isDirty.write(false);
          return result
        }

        if(isNothing(updatedNode.value.read()) || isNothing(prev) || updatedNode.isStale(prev, next)) {
          const result = chainNothing(node.fn, fn => chainNothing(fn.read(), ffn => ffn(next)));
          updatedNode.value.write(result);
          updatedNode.cachedInputs.write(next);
        }

        result = updatedNode.value.read();
        updatedNode.isDirty.write(false);

        if(this.watches[node.id] && current !== result) {
            this.watches[node.id].fn.forEach(fn => fn(result));
        }

        return result;
        }).value
    } else if (isBindNode(node)) {
      const current = node.value.read();
      const prev = node.cachedInputs.read();
      const getPromises = () => {
        const updatedNode = this.scope.get(node.id) as MapNode<T, any>;

        const inputPromises = [];

        for(const key in updatedNode.inputs) {
          const inputNode = this.scope.get(updatedNode.inputs[key]);
          if(inputNode) {
            inputPromises.push(wrapPromise(this.runNode(inputNode)).then(input => [key, input]))
          }
        }

        return wrapPromiseAll(inputPromises)
          .then(ips => compareObjects(updatedNode.inputs, (this.scope.get(node.id) as MapNode<T, any>).inputs) ? ips : getPromises()).value
      }
      return wrapPromiseAll(getPromises()).then(inputs => {
        const updatedNode = this.scope.get(node.id) as BindNode<T, any>;
        const next = Object.fromEntries(inputs);
        // TODO: Comment in
        // next["_output"] = _output;

        if(isNothing(updatedNode.value.read()) || isNothing(prev) || updatedNode.isStale(prev, next)) {
          return wrapPromise(chainNothing(updatedNode.fn, fn => fn(next)) ?? nothingValue)
            .then(n => {
              updatedNode.value.write(n);

              if(this.watches[node.id] && current !== result) {
                this.watches[node.id].fn.forEach(fn => fn(result));
              }

              updatedNode.isDirty.write(false);

              const boundNode: Nothing | T = updatedNode.value.read();
              if(!isNothing(boundNode)) this.scope.add(boundNode as AnyNode<unknown>);
              updatedNode.cachedInputs.write(next);

              return boundNode;
          }).value
        }

        updatedNode.isDirty.write(false);

        const boundNode: Nothing | T = updatedNode.value.read();
        if(!isNothing(boundNode)) this.scope.add(boundNode as AnyNode<unknown>);
        return boundNode;
      }).value;
    }


    if(this.watches[node.id] && current !== result) {
      this.watches[node.id].fn.forEach(fn => fn(result));
    }

    return result;
  }

  public run<T>(node: AnyNode<T>, _output?: "display" | "value") {
    return this.runNode(this.scope.get(node.id) as AnyNode<T>, _output)
  }
}
