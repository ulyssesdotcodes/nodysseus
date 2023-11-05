
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

import { ConstRunnable, Edge, Graph, Lib, NodysseusNode, NodysseusStore, NonErrorResult, RefNode, Result, Runnable, isGraph, isNodeRef, isNodeValue, isValue } from "../types.js";
import { compare, initStore, node_extern, node_value, nolib, nolibLib, run_extern } from "../nodysseus.js";
import { v4 as uuid } from "uuid";
import { NodysseusError, appendGraphId, compareObjects, ispromise, mergeLib, newEnv, parseArg, wrapPromise, wrapPromiseAll } from "../util.js";
import get from "just-safe-get";
import generic from "../generic.js";

type RUnknown = Record<string, unknown>;

const NAME_FIELD = new Set(["name"]);

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
  Object.fromEntries(Object.entries(v).filter(e => e[1]).map((e: [string, unknown]) => [e[0], f(e as [string, T["string"]])])) as S;

const outputs = ["display", "metadata", "value"] as const;
type Output = typeof outputs[number];
type NodeKind = "const" | "map" | "var" | "bind";
type Nothing = {__kind: "nothing"}
const isNothing = (a: any): a is Nothing => a && (a as Nothing).__kind === "nothing";
const isNothingOrUndefined = (a: any): a is Nothing => a === undefined || (a as Nothing).__kind === "nothing";
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
export type UnwrapNode<T> = T extends AnyNode<infer I> ? I : never;
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
  get<T>(id: string){
    return this.nodes.get(id) as AnyNode<T>;
  }
  has(id: string){
    return this.nodes.has(id);
  }
  count() {
    return this.nodes.size;
  }
  findKeys(id: string) {
    return [...this.nodes.keys()].filter(k => k.startsWith(id));
  }
  removeAll(id: string) {
    for(const k of this.nodes.keys()) {
      if(k.startsWith(id) && k !== id + "-graphnode" && k !== id + "-boundNode") {
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
  isDirty: new State(false),
});

export const bindNode = <R, T extends AnyNode<R> | AnyNode<R>, S extends Record<string, unknown>>(inputs: {[k in keyof S]: AnyNode<S[k]>}, fn: (inputs: S) => T | PromiseLike<T>, isStale = (p, n) => true, id?: string): BindNode<T, S> => ({
  __kind: "bind",
  id: id ?? uuid(),
  value: new State(),
  fn,
  cachedInputs: new State(),
  inputs: mapEntries(inputs, e => e[1].id),
  isStale,
  isDirty: new State(false),
}) as BindNode<T, S>;

export const handleError = (e: Error, nodeGraphId: string) => {
  console.error(e);
  const error = new NodysseusError(nodeGraphId, e);
  nolib.no.runtime.publish("grapherror", error, nolibLib)
}

type NodeOutputs<T, D, M> = AnyNode<{
  value: AnyNode<T>,
  display: AnyNode<D>,
  metadata: AnyNode<M>
}>

export class NodysseusRuntime {
  private scope: Scope;
  private _outputReturns: Map<string, string> = new Map();
  private watches: Map<string, Array<(a: unknown) => void>> = new Map();
  private outputs: Map<string, Set<string>> = new Map();
  private inputs: Map<string, Set<string>> = new Map();
  private rerun: Map<string, number> = new Map();
  private lib: Record<string, any> = {runtime: this};
  private eventQueue: Array<Function> = [];
  private running: Map<string, number> = new Map();
  private dirtying: Set<string> = new Set();

  constructor(public store: NodysseusStore, lib?: Lib){
    this.scope = new Scope();
    Object.entries(lib.data).forEach(e => {
      if(e[0] !== "runtime") {
        this.lib[e[0]] = e[1];
      }
    })
  }

  //////////
  // ported from nodysseus.runtime
  ////
  
  public refs() {
    return this.store.refs.keys()
  }

  public graphExport(graphid) {
    return Object.keys(generic.nodes).includes(graphid) ? [] as Array<Graph>
      : wrapPromise(this.store.refs.get(graphid))
        .then(graph => 
          wrapPromiseAll(Object.values(graph.nodes).map(node => isNodeRef(node) ? this.graphExport(node.ref) : []))
            .then<Graph[]>(nodeGraphs => nodeGraphs.flat().concat([graph]))
        ).value
  }

  nodeCount(){
    this.scope.count();
  }

  public createWatch<T>(node: AnyNode<T>, _output: "value" | "display"): AsyncIterable<T>{
    return {
      [Symbol.asyncIterator]: () => ({
        next: () => new Promise<IteratorResult<T>>((res) => {
          const watch = (a: T) => {
            this.watches.get(node.id).splice(this.watches.get(node.id).indexOf(watch), 1);
            res({value: a});
          };
          this.addWatchFn(node, watch);
        })
      })
    }
  }

  public clearWatch(node, watch) {
    if(this.watches.has(node.id) && this.watches.get(node.id).includes(watch)) {
      this.watches.get(node.id).splice(this.watches.get(node.id).indexOf(watch), 1);
    }
  }

  public addWatchFn<T>(node: AnyNode<T>, watch: (output: T) => void){
    if(!this.watches.has(node.id)) this.watches.set(node.id, []);
    this.watches.get(node.id).push(watch);
    this.checkWatch(node.id);
  }

  private resetOutputs(id: string, inputs?: Array<AnyNode<unknown>> | Record<string, AnyNode<unknown>>) {
    if(!this.outputs.has(id)) this.outputs.set(id, new Set());
    if(!this.inputs.has(id)) this.inputs.set(id, new Set());

    // this.outputs.get(id).clear();
    if(inputs) {
      let k;
      for(k in inputs) {
        if(inputs[k]) {
          this.outputs.get(inputs[k].id).add(id)
          this.inputs.get(id).add(inputs[k].id);
        }
      }
    }

    this.dirty(id);
  }

  private checkWatch(id: string) {
    const node = this.scope.get(id);

    const runIfClean = () => {
      if(!this.running.has(id)) {
        for(const output of outputs) {
          this.watches.get(id)?.forEach(fn => {
            fn(this.runNode(this.scope.get(id), output));
          });
        }
        this.rerun.delete(id);
      } else {
        this.rerun.set(id, requestAnimationFrame(runIfClean))
      }
    }

    if(this.watches.has(id) && !this.rerun.has(id) && isMapNode(node) && node.isDirty.read() && !this.running.has(id))  {
      this.rerun.set(id, requestIdleCallback(runIfClean))
    }
  }

  private checkWatches() {
    for(const id of this.watches.keys()) {
      this.checkWatch(id);
    }
  }

  private dirty(id: string) {
    const node = this.scope.get(id);
    if(isMapNode(node) || isBindNode(node)) {
      if(node.isDirty.read() && !this.running.has(id)) {
        return;
      }
      node.isDirty.write(true);
    }
    let nid;
    const nodeOuts = this.outputs.get(id);
    for(nid of nodeOuts) {
      this.dirty(nid);
    }
    this.checkWatch(id);
  }

  constNode<T>(v: T, id?: string, useExisting: boolean = true): AnyNode<T> {
    const node = constNode(v, id);
    this.scope.add(node);
    this.resetOutputs(node.id)
    this.dirty(node.id)
    return node;
  }

  varNode<T>(initial?: T, compare?: (a: T, b: T) => boolean, id?: string, useExisting: boolean = true, log = false): VarNode<T> {
    if(useExisting && id && this.scope.has(id)) return this.scope.get(id) as VarNode<T>;
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
    // this.dirty(node.id)
    return node;
  }

  mapNode<T, S extends Record<string, unknown>>(inputs: {[k in keyof S]: AnyNode<S[k]>}, fn: (s: S) => T, isStale: (previous: S, next: S) => boolean = () => true, id?: string, useExisting: boolean = true): AnyNode<T>{
    if(useExisting && id && this.scope.has(id)) return this.scope.get(id);
    const node = mapNode(inputs, fn, isStale, id);
    this.scope.add(node);
    this.resetOutputs(node.id, inputs)
    this.dirty(node.id)
    return node;
  }

  /**
    * Bind a function that creates a node to inputs. Inspired by monadic bind.
    */

  bindNode<R, T extends AnyNode<R>, S extends Record<string, unknown>>(
    inputs: {[k in keyof S]: AnyNode<S[k]>}, 
    fn: (s: S) => T | PromiseLike<T>, 
    isStale?: (previous: S, next: S) => boolean, 
    id?: string,
    useExisting: boolean = true,
  ): AnyNode<T>{
    if(useExisting && id && this.scope.has(id)) return this.scope.get(id);
    const currentBind = this.scope.get(id) as AnyNode<T>;
    if(id && isBindNode(currentBind) && compareObjects(currentBind.inputs, inputs)) {
      return currentBind;
    }
    const node = bindNode<R, T, S>(inputs, args => {
      const current = node.value.read();
      return wrapPromiseAll([fn(args), current])
        .then(([outNode, current]) => {
          if(current !== outNode && outNode) {
            // check for id equivalence, otherwise setting this.outputs is irrelevant
            if(current.id !== outNode.id) {
              // if(current && !isNothing(current))  this.outputs.get(node.id).forEach(oid => this.outputs.get(current.id).delete(oid))
              // if(current && !isNothing(current)) this.outputs.get(node.id).delete(current.id)
              this.outputs.get(node.id).forEach(oid => this.outputs.get(outNode.id).add(oid));
              // this.outputs.get(node.id).add(outNode.id)
            }

            if(current && !isNothing(current) && (current.__kind !== outNode.__kind || current.id !== outNode.id || !compare(current.value.read(), outNode.value.read()) || ((isMapNode(current) || isBindNode(current)) && current.isDirty.read()))) {
              if(isMapNode(outNode) || isBindNode(outNode)) {
                outNode.isDirty.write(false);
              }
                this.dirty(outNode.id)
            }
          }
          return outNode
        }).value as T | PromiseLike<T>
      }, isStale, id);
    this.scope.add(node);
    this.resetOutputs(node.id, inputs)
    this.dirty(node.id);
    return node
  }

  /**
    * Uses bindNode to create a switch statement based on a key node
    */
  switchNode<T, S extends Record<string, T>>(key: AnyNode<string>, inputs: {[k in keyof S]: AnyNode<T>}, id?: string, useExisting: boolean = true){
    // TODO: Make sure that bound is binding the output correctly to the bind node not to the "map" node
    const keyOptions: Record<string, AnyNode<AnyNode<T>>> = mapEntries(inputs, e => this.constNode(e[1], id && `${id}-${e[0]}-const`, false) as AnyNode<AnyNode<T>>);
    const binding: AnyNode<AnyNode<T>> = this.bindNode(
      {key, ...keyOptions} as { key: AnyNode<string> } & {[k in keyof S]: AnyNode<AnyNode<T>> }, 
      (args) => args[args.key] as AnyNode<T>, 
      (p, n) => p.key !== n.key || p[p.key] !== n[n.key], 
      id && `${id}-bind`
    , useExisting) as AnyNode<AnyNode<T>>;
    return this.mapNode({bound: binding}, ({bound}) => {
      const res = !isNothing(bound) && this.runNode(this.scope.get(bound.id));
      return res && !isNothing(res) ? res : undefined;
    }, undefined, id, useExisting)
  }

  private accessor<T, S extends Record<string, unknown>>(map: AnyNode<AnyNodeMap<S>>, key: string, id: string, useExisting: boolean): AnyNode<T>{
    return this.mapNode({bound: this.bindNode({map: this.mapNode({map}, ({map}) => map, undefined, id + key + "-bindmap", useExisting)}, ({map}) => map[key], undefined, id + key + "-bind", useExisting)}, ({bound}) => this.runNode(bound), undefined, id + key + "-map", useExisting) as AnyNode<T>;
  }

  private removeKey<T, S extends Record<string, unknown>>(map: AnyNode<AnyNodeMap<S>>, key: string, id: string): AnyNode<AnyNodeMap<S>> {
    return this.mapNode({map}, ({map}) => ({...map, [key]: undefined}), undefined, id);
  }

  private runNodeNode<T>(node: AnyNode<AnyNode<T>>, nodeGraphId: string, useExisting = true): AnyNode<T> {
    return this.mapNode({bound: node}, ({bound}) => this.runNode(bound) as T, undefined, nodeGraphId, useExisting);
  }

  // private runOutput<T, D, M, O extends Output>(outputNode: NodeOutputs<T, D, M>, output: O, nodeGraphId): NodeOutputs<T, D, M>[O] {
  //   return this.mapNode({bound: this.bindNode({value: outputNode[output] as NodeOutputs<T, D, M>[O]}, ({value}) => value, undefined, nodeGraphId + "-bound")}, ({bound}) => this.runNode(bound as UnwrapNode<NodeOutputs<T, D, M>>), undefined, nodeGraphId) as UnwrapNode<UnwrapNode<NodeOutputs<T, D, M>>>;
  // }

  public fromNode<T, D, M, S extends Record<string, unknown>>(graph: Graph | string, nodeId: string, closure?: AnyNodeMap<S>): NodeOutputs<T, D, M> | Promise<NodeOutputs<T, D, M>> {
    closure = closure ?? ({} as AnyNodeMap<S>);
    return wrapPromise(typeof graph === "string" ? this.store.refs.get(graph) : graph).then(graph =>
      this.fromNodeInternal<T, D, M, S>(graph, nodeId, graph.id, closure && this.constNode(closure, appendGraphId(graph.id, nodeId) + "-outerargs"), true)
    ).value;
  }

  private calcNode<T, S extends Record<string, unknown>>(graph: Graph, node: NodysseusNode, graphId: string, nodeGraphId: string, closure: AnyNode<AnyNodeMap<S>>, edgesIn: Edge[], useExisting: boolean, extraNodeGraphId: Output = "value") {
    const calculateInputs = () => Object.fromEntries(edgesIn.map(e => [e.as, this.valueMap(this.fromNodeInternal(graph, e.from, graphId, closure, useExisting), nodeGraphId + `-valmapinput${e.as}`, useExisting)])) as AnyNodeMap<S>;
    if(isNothing(node)) {
      return this.constNode(undefined, nodeGraphId, false);
    } else if(isNodeRef(node)) {
      return this.dereference(graph, node, edgesIn, graphId, nodeGraphId, closure, calculateInputs, extraNodeGraphId, useExisting);
    } else if(isNodeValue(node)) {
      return this.constNode(node_value(node), nodeGraphId, false);
    } else {
      const outNode = this.mapNode(calculateInputs(), args => args, undefined, nodeGraphId, useExisting)
      return outNode
    }
  }

  private valueMap<T>(outputNode: NodeOutputs<T, unknown, unknown>, nodeGraphId, useExisting): AnyNode<T> {
    return this.accessor(outputNode, "value", nodeGraphId, useExisting);
    // return outputNode["value"];
    // this.mapNode({bound: this.bindNode({value: outputNode.value}, ({value}) => value, undefined, nodeGraphId + "-bound")}, ({bound}) => this.runNode(bound) as T, undefined, nodeGraphId);
  }

  private checkEvents() {
    if(this.running.size === 0 && this.eventQueue.length > 0) {
      this.eventQueue.shift()?.()
      this.checkEvents();
    }
  }

  private mergeClosure<S extends RUnknown>(closure: AnyNode<AnyNodeMap<RUnknown>>, args:  AnyNode<RUnknown>, id: string, useExisting = true): AnyNode<AnyNodeMap<S>> {
    return this.mapNode({
            closure,
            args
          }, ({args, closure}) => wrapPromise(args).then(argsres => ({
            ...closure,
            ...mapEntries(argsres, e => this.constNode(e[1], `${id}-${e[0]}-arg`, false) as AnyNode<S[keyof S]>), 
          } as AnyNodeMap<S>)).value, undefined, id + "-returnchained", useExisting)
  }

  private dereference<T, S extends Record<string, unknown>>(graph: Graph, node: RefNode, edgesIn: Edge[], graphId: string, nodeGraphId: string, closure: AnyNode<AnyNodeMap<S>>, calculateInputs: () => AnyNodeMap<S>, extraNodeGraphId: Output = "value", useExisting: boolean = true, refNode = node): AnyNode<T> | PromiseLike<AnyNode<T>> {
    return wrapPromise(this.store.refs.get(refNode.ref) as Graph)
      .then((nodeRef): AnyNode<T> => {
        if(refNode.ref === "@js.script") {
          let scriptFn;
          try{
            scriptFn = new Function("_lib", "_node", "_node_args", ...edgesIn.map(e => e.as), refNode.value) as (...args: any[]) => any;
          } catch(e) {
            handleError(e, nodeGraphId);
            scriptFn = () => {};
          }

          return this.mapNode({...calculateInputs()}, (args) => {
            if(extraNodeGraphId === "metadata"){
              return {dataLabel: "script", codeEditor: {language: "javascript", editorText: node.value}};
            }
            try {
              return scriptFn(this.lib, node, args, ...Object.values(args))
            } catch(e) {
              handleError(e, nodeGraphId)
            }
          }, undefined, nodeGraphId, useExisting)
        } else if (refNode.ref === "return") {
          const argsEdge = edgesIn.find(e => e.as === "args");
          const chainedscope: AnyNode<AnyNodeMap<S>> = argsEdge 
            ? this.mergeClosure(
              closure, 
              this.valueMap(this.fromNodeInternal(graph, argsEdge.from, graphId, closure, useExisting), nodeGraphId + "-argsvalmap", useExisting), 
              nodeGraphId + "-returnchained"
            , useExisting) : closure;

          const inputs = Object.fromEntries(
            edgesIn
              .filter(e => e.as !== "args" && e.as !== "subscribe")
              .map(e => [e.as, this.valueMap(this.fromNodeInternal(graph, e.from, graphId, chainedscope, useExisting), nodeGraphId + `-argsvalmap-${e.as}`, useExisting)])
          )

          const subscribechainedscope: AnyNode<AnyNodeMap<S>> = argsEdge 
            ? this.mergeClosure(
              closure, 
              this.valueMap(this.fromNodeInternal(graph, argsEdge.from, graphId, closure, useExisting), nodeGraphId + "-subargsvalmap", useExisting), 
              nodeGraphId + "-subscribereturnchained", useExisting
            ) : closure;
          const subscribeEdge = edgesIn.find(e => e.as === "subscribe");
          const subscribe = subscribeEdge && this.valueMap(this.fromNodeInternal(graph, subscribeEdge.from, graphId, subscribechainedscope, useExisting), nodeGraphId + "-subvalmap", useExisting);

          const resultNode = inputs[extraNodeGraphId] ?? (extraNodeGraphId === "value" && inputs["display"]);

          const output = this.mapNode({
              result: inputs["dependencies"] ? undefined : resultNode,
              dependencies: inputs["dependencies"],
              subscribe
            }, ({subscribe: subscriptions, dependencies}) => {
              const result = resultNode && this.runNode(resultNode);
                subscriptions && Object.entries(subscriptions)
                  .forEach(kv => kv[1] &&
                    nolib.no.runtime.addListener(kv[0], nodeGraphId, payload => {
                    if(this.running.size > 0) this.eventQueue.push(() => kv[1](payload))
                    else kv[1](payload)
                  }, false, graphId, true, nolibLib))
                return result
            }, ({dependencies: previous}, {dependencies: next}) => (isNothingOrUndefined(previous) && isNothingOrUndefined(next)) || !compareObjects(previous, next), nodeGraphId + extraNodeGraphId, useExisting) as AnyNode<T>;

          const libNode = edgesIn.find(e => e.as === "lib") && (this.scope.get(nodeGraphId + "-libnode") ?? this.mapNode({
                lib: this.valueMap(this.fromNodeInternal(graph, edgesIn.find(e => e.as === "lib").from, graphId, closure, useExisting), nodeGraphId + "-libvalmap", useExisting)
              }, ({lib}) => Object.assign(this.lib, lib), () => false, nodeGraphId + "-libnode", useExisting))

          return wrapPromise(this.scope.get(nodeGraphId + "-libvalmap")?.value.read() ??
            edgesIn.find(e => e.as === "lib") ? this.runNode(libNode) : undefined).then(() => output).value
        } else if (refNode.ref === "extern") {
          if(refNode.value === "extern.switch") {
            const inputEdge = edgesIn.find(e => e.as === "input");
            return inputEdge ? this.switchNode(
              this.valueMap(this.fromNodeInternal(graph, inputEdge.from, graphId, closure, useExisting), nodeGraphId + "-predvalmap", useExisting), 
              Object.fromEntries(
                edgesIn.filter(e => e.as !== "input")
                  .map(e => [e.as, this.valueMap(this.fromNodeInternal(graph, e.from, graphId, closure, useExisting), nodeGraphId + `-valmap${e.as}`, useExisting)], useExisting)
              ), nodeGraphId, useExisting) as AnyNode<T> : this.constNode(undefined, nodeGraphId + extraNodeGraphId, false);
          } else if(refNode.value === "extern.runnable") {
            const fnArgs = this.varNode<Record<string, unknown>>({}, undefined, nodeGraphId + "-fnargs", useExisting)
            const chainedClosure = this.mergeClosure(closure, fnArgs, nodeGraphId + "-runnablechained", useExisting);

            const parametersEdge = edgesIn.find(e => e.as === "parameters");
            const parameters = parametersEdge && this.valueMap(this.fromNodeInternal(graph, parametersEdge.from, graphId, closure, useExisting), nodeGraphId + "-parametersvalmap", useExisting);

            const fnNode = this.valueMap(this.fromNodeInternal(graph, edgesIn.find(e => e.as === "fn").from, graphId, chainedClosure, useExisting), nodeGraphId + "-fnnodevalmap", useExisting)
// , fnNode: this.bindNode({}, () => fnNode, undefined, nodeGraphId + "-fnnodebind") 
            return this.mapNode({ parameters}, ({parameters }) => ((args) => {
              if(parameters) {
                const keys = new Set(Object.keys(parameters));
                (this.scope.get(fnArgs.id) as typeof fnArgs).set(Object.fromEntries(Object.entries(args).filter(e => keys.has(e[0]))));
              } else {
                (this.scope.get(fnArgs.id) as typeof fnArgs).set({})
              }
              return this.runNode(fnNode);
            }) as T, undefined, nodeGraphId, useExisting);
          } else if(refNode.value === "extern.map") {
            return this.mapNode(calculateInputs() as {fn: AnyNode<(mapArgs: {element: unknown, index: number}) => unknown>, array: AnyNode<Array<unknown>>}, ({fn, array}) => wrapPromiseAll(array.map((element, index) => fn({element, index}))), undefined, nodeGraphId, useExisting) as AnyNode<T>
          } else if(refNode.value === "extern.fold") {
            return this.mapNode(
              calculateInputs() as { 
                fn: AnyNode<(mapArgs: {previousValue: T, currentValue: unknown, index: number}) => T>, 
                object: AnyNode<Array<unknown>>, 
                initial: AnyNode<T>
              }, ({fn, object, initial}) => 
              object === undefined ? object :
                Array.isArray(object) ? object : 
                Object.entries(object).reduce<T>(
                  (previousValue, currentValue, index) => 
                    fn({previousValue, currentValue, index}), initial), undefined, nodeGraphId, useExisting) as AnyNode<T>
          } else if(refNode.value === "extern.ap") {
            const fn: AnyNode<Array<(mapArgs: Record<string, unknown>) => T>> = this.valueMap(this.fromNodeInternal(graph, edgesIn.find(e => e.as === "fn").from, graphId, closure, useExisting), nodeGraphId + "-fnvalmap", useExisting)
            const runEdge = edgesIn.find(e => e.as === "run")
            const run: AnyNode<boolean> = runEdge && this.valueMap(this.fromNodeInternal(graph, runEdge.from, graphId, closure, useExisting), nodeGraphId + "-runvalmap", useExisting);
            const apArgs = this.varNode<Record<string, unknown>>({}, undefined, nodeGraphId + "-apapargs", useExisting)
            const chainedClosure = this.mergeClosure(closure, apArgs, nodeGraphId + "-apchained", useExisting)
            const argsEdge = edgesIn.find(e => e.as === "args")?.from;
            const argsNode = argsEdge ? this.mapNode({
              argsNode: this.valueMap(this.fromNodeInternal(graph, argsEdge, graphId, chainedClosure, useExisting), nodeGraphId + "-argsvalmap", useExisting) as AnyNode<Record<string, unknown>>
            }, ({argsNode}) => argsNode, undefined, nodeGraphId + "-apargs", useExisting) : closure;

            return this.mapNode({fn, run, argsNode: this.bindNode({}, () => argsNode, undefined, nodeGraphId + "-argsnodebind", useExisting)}, ({fn, run, argsNode}) => {
              if(run) {
                return wrapPromise(this.runNode(argsNode)).then(args => (Array.isArray(fn) ? fn : [fn]).filter(f => typeof f === "function").map(ffn => ffn(args))).then(results => Array.isArray(fn) ? results : results[0]).value;
              } else {
                return (args) => {
                  const runtimeApArgs = this.scope.get(apArgs.id) as VarNode<any>;
                  runtimeApArgs.set(args);
                  return wrapPromise(this.runNode(argsNode) as Record<string, unknown>)
                    .then(args => (Array.isArray(fn) ? fn : [fn]).filter(f => typeof f === "function").map(ffn => ffn(args)))
                    .then(results => Array.isArray(fn) ? results : results[0]).value;
                }
              }
            }, undefined, nodeGraphId, useExisting) as AnyNode<T>;
          } else if (refNode.value === "extern.reference" || refNode.value === "extern.state") {
            const initialNode = edgesIn.find(e => e.as === "initial" || e.as === "value")?.from 
              ? this.valueMap(this.fromNodeInternal(graph, edgesIn.find(e => e.as === "initial" || e.as === "value").from, graphId, closure, useExisting), nodeGraphId + "-initialvalmap", useExisting)
              : this.constNode(undefined, nodeGraphId + "-refconst");
            const persistEdge = edgesIn.find(e => e.as === "persist");
            const persistNode = persistEdge && this.valueMap(this.fromNodeInternal(graph, persistEdge.from, graphId, closure, useExisting), nodeGraphId + "valmappublish", useExisting);
            const setNode = this.varNode<T>(undefined, undefined, nodeGraphId + "-refset", true);
            const scope = this.scope;

            return this.mapNode({
              initialNode,
              persistNode
            }, ({initialNode: initial, persistNode: persist}) =>  
             wrapPromise((persist && this.store.persist.get(nodeGraphId)) || initial).then(initial => {
              if(initial) {
                scope.get(nodeGraphId + "-refset").value.write(initial);
              }
              return extraNodeGraphId === "display" 
                  ? {dom_type: "div", props: {}, children: [{dom_type: "text_value", text: JSON.stringify(setNode.value.read() && setNode.value.read())}]} 
                  : {
                    get value(){
                      return (scope.get(nodeGraphId + "-refset") as VarNode<T>);
                    },
                    set: (t: {value: T} | T) => {
                      if((t as {value:T})?.value !== undefined || t !== undefined) {
                        const value :T  = typeof t === "object" && Object.hasOwn(t, "value") ? (t as {value: T}).value  : t as T;
                        (scope.get(nodeGraphId + "-refset") as VarNode<T>).set(value)
                        if(persist) {
                          this.store.persist.set(nodeGraphId, value);
                        }
                        return value;
                      }

                      return scope.get(nodeGraphId + "-refset").value.read();
                    }
                  }
            }).value, () => false, nodeGraphId + extraNodeGraphId, useExisting) as AnyNode<T>
          } else if(refNode.value === "extern.readReference" || refNode.value === "extern.memoryUnwrap") {
            return this.mapNode({ref: this.bindNode({reference: calculateInputs()["reference"]}, ({reference}) => (reference as {value: AnyNode<T>})?.value, undefined, nodeGraphId + "-bindreadref", useExisting)}, ({ref}) => this.runNode(ref) as T, undefined, nodeGraphId, useExisting);
          } else if(refNode.value === "extern.cache") {
            const value = edgesIn.find(e => e.as === "value")?.from 
              ? this.valueMap(this.fromNodeInternal(graph, edgesIn.find(e => e.as === "value").from, graphId, closure, useExisting), nodeGraphId + "-valvalmap", useExisting)
              : this.constNode(undefined, nodeGraphId + "-stateconst", false);

            const recache = edgesIn.find(e => e.as === "recache")?.from 
              ? this.valueMap(this.fromNodeInternal(graph, edgesIn.find(e => e.as === "recache").from, graphId, closure, useExisting), nodeGraphId + "-recachevalmap", useExisting)
              : this.constNode<false>(false, nodeGraphId + "-stateconst", useExisting);

            const outNode = this.mapNode({
              recache, 
              value: this.bindNode({value}, () => value, undefined, nodeGraphId + "-value", useExisting)
            }, ({value}) => wrapPromise(this.runNode(value)).value, ({recache: r1, value: previous}, {recache, value: next}) => !!recache || isNothing(outNode.value.read()) || outNode.value.read() === undefined, nodeGraphId + extraNodeGraphId)
            return outNode;
          } else if (refNode.value === "extern.frame") {
            const varNode: VarNode<T> = this.varNode(1 as T, undefined, nodeGraphId, useExisting)
            const update = () => {
              varNode.set((varNode.value.read() as number) + 1 as T);
              if(this.scope.get(nodeGraphId) === varNode) {
                requestAnimationFrame(update);
              }
            }
            requestAnimationFrame(update);
            return varNode;
          } else if (refNode.value === "extern.runNode") {
            const nodeNode = this.valueMap(this.fromNodeInternal(graph, edgesIn.find(e => e.as === "node").from, graphId, closure, useExisting), nodeGraphId + "-nodenode", useExisting) as AnyNode<AnyNode<T>>;
            return this.runNodeNode(nodeNode, nodeGraphId)
          } else {
            const inputs = calculateInputs()
            const systemValues: Array<[string, Result]> = ([
              ["__graphid", nolib.no.of(nodeGraphId)], 
              ["__graph_value", nolib.no.of(node.value)],
            ] as Array<[string, Result] | false>).filter((e): e is [string, Result] => e !== false);
            return this.mapNode(
              {...inputs}, 
              (nodeArgs) => wrapPromise(node_extern(
                refNode, 
                new Map(Object.entries(nodeArgs).map(e => [e[0], nolib.no.of(e[1])]).concat(systemValues) as Array<[string, Result]>), 
                newEnv(new Map()), nolibLib, {}
              )).then(r => (r as NonErrorResult).value).value,
              undefined,
              nodeGraphId
            , useExisting)
          }
        } else if(refNode.ref === "arg") {
          const argname = parseArg(refNode.value).name;
          const isAccessor = argname.includes(".");
          const argsdata = this.mapNode({bound: this.bindNode({closure}, ({closure: innerClosure}: {closure: AnyNodeMap<S>}) => 
                                        this.mapNode(innerClosure, (innerClosure) => innerClosure as S[keyof S], undefined, nodeGraphId + "-allargsmap", useExisting), undefined, nodeGraphId + "-allargs", useExisting)}, ({bound}) => this.runNode(bound), undefined, nodeGraphId + "-outerbind", useExisting);
          const libNode = this.constNode(this.lib, nodeGraphId + "-lib", true);
          const graphIdNode = this.constNode(node.value, `${nodeGraphId}-internalnodegraphid`, false)
          const mnode = this.mapNode({bound: this.bindNode(
            {closure},
            ({closure: innerClosure}): AnyNode<unknown> => {
              if(argname === "_argsdata") {
                // Object.values(closure).map(argnode => argnode && this.outputs.get(argnode.id).add(mnode.id))
              }

              return argname === "_argsdata"
                ? argsdata
                : argname === "_args"
                ? closure
                : argname.startsWith("_lib")
                ? libNode
                : argname === "__graphid"
                ? graphIdNode
                : isAccessor
                ? innerClosure[argname.substring(0, argname.indexOf("."))]
                : innerClosure[argname];
            },
            undefined,
            nodeGraphId + "-bind"
          , useExisting)}, ({bound}) => {
            return wrapPromise(this.runNode(bound)).then(res => {
            return (res !== undefined && !isNothing(res) ? isAccessor ? get(res, argname.substring(argname.indexOf(".") + 1)) : res : undefined) as T
          }).value}, undefined, nodeGraphId, useExisting);

          return mnode;
        } else if(isGraph(nodeRef)) { 

          const inputs = calculateInputs();
          const innerGraphNode = 
            this.accessor(this.fromNodeInternal(
              nodeRef, 
              nodeRef.out ?? "out", 
              nodeGraphId + nodeRef.id,
              this.constNode({
                ...inputs, 
                __graph_value: this.constNode(node.value, `${nodeGraphId}-internalnodegraphvalue`, false)
              }, nodeGraphId + "-args", false), false), extraNodeGraphId, nodeGraphId + "-innergraphnodeval", useExisting);


          return this.mapNode({
          bound: this.bindNode({}, () => innerGraphNode, undefined, nodeGraphId + extraNodeGraphId + "-graphoutbind", useExisting)
          }, ({bound}) => this.runNode(bound) as T,
            undefined, nodeGraphId + extraNodeGraphId, useExisting)
        } else {
          return this.dereference(graph, node, edgesIn, graphId, nodeGraphId, closure, calculateInputs, extraNodeGraphId, useExisting, nodeRef) as AnyNode<T>
        }
      }).value
  }


  private fromNodeInternal<T, D, M, S extends Record<string, unknown>>(graph: Graph, nodeId: string, graphId: string, closure?: AnyNode<AnyNodeMap<S>>, useExisting: boolean = true): NodeOutputs<T, D, M> {
    const node = graph.nodes[nodeId];
    const nodeGraphId =  appendGraphId(graphId, nodeId)
    if(useExisting && this.scope.has(nodeGraphId + "-boundNode")) return this.scope.get(nodeGraphId + "-boundNode");
    const staticGraphId = graph.id;

    const graphNodeNode: VarNode<{node: NodysseusNode, edgesIn: Array<Edge>, graph: Graph}> = 
      this.varNode({
        graph,
        node: graph.nodes[node.id], 
        edgesIn: graph.edges_in?.[node.id] 
          ? Object.values(graph.edges_in?.[node.id]) 
          : Object.values(graph.edges).filter((e: Edge) => e.to === node.id)
      }, (
        {node: nodeA, edgesIn: edgesInA, graph: graphA}, 
        {node: nodeB, edgesIn: edgesInB, graph: graphB}) => {
      if(!nodeB || !nodeA || !compareObjects(nodeA, nodeB, false, NAME_FIELD) || edgesInA.length !== edgesInB.length) return false; 
      const sortedEdgesA = edgesInA.sort((a, b) => a.as.localeCompare(b.as));
      const sortedEdgesB = edgesInB.sort((a, b) => a.as.localeCompare(b.as));
      return sortedEdgesA.every((e, i) => compareObjects(e, sortedEdgesB[i]))
    }, nodeGraphId + "-graphnode", true);

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

    return this.mapNode({graphNodeNode}, ({graphNodeNode}) => {
      if(this.scope.has(nodeGraphId + "value")) {
        this.scope.removeAll(nodeGraphId);
      }
      return wrapPromise(this.calcNode(graphNodeNode.graph, graphNodeNode.node, graphId, nodeGraphId, closure, graphNodeNode.edgesIn, false))
        .then(value => wrapPromiseAll([
          this.calcNode(graphNodeNode.graph, graphNodeNode.node, graphId, nodeGraphId, closure, graphNodeNode.edgesIn, true, "display"),
          this.calcNode(
            graphNodeNode.graph, 
            graphNodeNode.node, 
            graphId, 
            nodeGraphId, 
            closure, 
            graphNodeNode.edgesIn, 
            true,
            "metadata"
          )
        ]).then(([display, metadata]) => ({
          value,
          display,
          metadata
        })).value).value
    }, undefined, nodeGraphId + "-boundNode");
  } 

  private runNode<T>(innode: AnyNode<T> | Nothing, _output?: "display" | "value" | "metadata"): T | PromiseLike<T> | Nothing{
    if(isNothing(innode)) return innode;
    const node: AnyNode<T> = this.scope.get(innode.id)! as AnyNode<T>;

    const current = node.value?.read();
    let result;
    if(node && !isNothing(node) && (
      isVarNode(node) || isConstNode(node) 
      || (!(node as MapNode<T, Record<string, unknown>> | BindNode<T, Record<string, unknown>>).isDirty.read()))) {
      result = node.value.read();
    } else if (isMapNode(node)) {
      if(!this.running.has(node.id)) this.running.set(node.id, 0);
      this.running.set(node.id, this.running.get(node.id) + 1);
      const prev = node.cachedInputs.read();

      const getPromises = () => {
        const updatedNode = this.scope.get(node.id) as MapNode<T, any>;

        const inputPromises = [];

        for(const key in updatedNode.inputs) {
          const inputNode = this.scope.get(updatedNode.inputs[key]);
          const res = this.runNode(inputNode);
          if(inputNode) {
            inputPromises.push(wrapPromise(res).then(input => [key, input]))
          }
        }

        return wrapPromiseAll(inputPromises)
          .then(ips => !this.scope.get(node.id) || compareObjects(updatedNode.inputs, (this.scope.get(node.id) as MapNode<T, any>).inputs) ? ips : getPromises()).value
      }


      return wrapPromise(getPromises(), e => {console.error(e); return {};})
        .then(allPromises => wrapPromiseAll(allPromises, e => (console.error(e), {})))
        .then(inputs => {
        const next = Object.fromEntries(inputs);
        const updatedNode = this.scope.get(node.id) as MapNode<T, any>;
        if(!updatedNode) {
          return;
        }

        if(isNothing(updatedNode.value.read()) || isNothing(prev) || updatedNode.isStale(prev, next)) {
          const res = chainNothing(node.fn, fn => chainNothing(fn.read(), ffn => ffn(next)));
          updatedNode.value.write(res);
            updatedNode.isDirty.write(false);
          updatedNode.cachedInputs.write(next);
          return wrapPromise(res).then(r => {
            updatedNode.value.write(r as T);
            updatedNode.isDirty.write(false);

            if(this.watches.has(node.id) && current !== result) {
              this.watches.get(node.id).forEach(fn => wrapPromise(r).then(fn));
            }
            if(this.running.get(node.id) === 1) {
              this.running.delete(node.id)
              this.checkEvents()
            }
            else this.running.set(node.id, this.running.get(node.id) - 1);
            return r;
          }).value;
        }

        result = updatedNode.value.read();

        if(this.watches.has(node.id) && current !== result) {
          this.watches.get(node.id).forEach(fn => wrapPromise(result).then(fn));
        }

            if(this.running.get(node.id) === 1) {
              updatedNode.isDirty.write(false);
              this.running.delete(node.id)
              this.checkEvents()
            }
            else this.running.set(node.id, this.running.get(node.id) - 1);
        return result
        }).value
    } else if (isBindNode(node)) {
      if(!this.running.has(node.id)) this.running.set(node.id, 0);
      this.running.set(node.id, this.running.get(node.id) + 1);
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
      return wrapPromise(getPromises(), e => console.error(e)).then(promises => wrapPromiseAll(promises)).then(inputs => {
        const updatedNode = this.scope.get(node.id) as BindNode<T, any>;
        const next = Object.fromEntries(inputs);

        if(isNothing(updatedNode.value.read()) || isNothing(prev) || updatedNode.isStale(prev, next)) {
          updatedNode.value.write(wrapPromise(chainNothing(updatedNode.fn, fn => fn(next)) ?? nothingValue).value)
          updatedNode.isDirty.write(false);
          const res = updatedNode.value.read();
          return wrapPromise(res).then(result => {
              updatedNode.value.write(result);
              updatedNode.isDirty.write(false);

        if(this.watches.has(node.id) && current !== result) {
          this.watches.get(node.id).forEach(fn => wrapPromise(result).then(fn));
        }

              const boundNode: Nothing | T = updatedNode.value.read();
              if(!isNothing(boundNode)) this.scope.add(boundNode as AnyNode<unknown>);
              updatedNode.cachedInputs.write(next);

            if(this.running.get(node.id) === 1) {
              this.running.delete(node.id)
              this.checkEvents()
            }
            else this.running.set(node.id, this.running.get(node.id) - 1);
              return boundNode;
          }).value
        }

        if(this.watches.has(node.id) && current !== result) {
          this.watches.get(node.id).forEach(fn => wrapPromise(result).then(fn));
        }

        const boundNode: Nothing | T = updatedNode.value.read();
        // if(!isNothing(boundNode)) this.scope.add(boundNode as AnyNode<unknown>);
        if(this.running.get(node.id) === 1) {
          updatedNode.isDirty.write(false);
          this.running.delete(node.id)
          this.checkEvents()
        }
        else this.running.set(node.id, this.running.get(node.id) - 1);
        return boundNode;
      }).value;
    }


    if(this.watches.has(node.id) && current !== result) {
      this.watches.get(node.id).forEach(fn => wrapPromise(result).then(fn));
    }

    return result;
  }

  public runGraphNode<T>(graph: Graph, node: string): T | Promise<T> {
    const current = this.scope.get(`${appendGraphId(graph.id, node)}-boundNode`) as AnyNode<T>;
    if(current) return this.runNode<T>(current) as T;
    return wrapPromise(this.fromNode(graph, node)).then(nodeNode => this.runNode(nodeNode)).value as Promise<T>;
  }

  public run<T>(node: AnyNode<T> | Promise<AnyNode<T>> | string, _output?: "display" | "value" | "metadata"): T | Promise<T> {
    return wrapPromise(node).then(node => {
      const nodeid = (typeof node === "string" ? node : node.id);
      const resolvedNode = this.scope.get(nodeid);
      const res = resolvedNode && this.runNode(resolvedNode)

      return res && !isNothing(res) && wrapPromise(res).value;
    }).value as T | Promise<T>
  }
}
