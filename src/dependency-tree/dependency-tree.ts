
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
import { initStore, node_extern, node_value, nolib, nolibLib, run_extern } from "../nodysseus.js";
import { v4 as uuid } from "uuid";
import { NodysseusError, appendGraphId, compareObjects, ispromise, mergeLib, newEnv, parseArg, wrapPromise, wrapPromiseAll } from "../util.js";
import get from "just-safe-get";
import generic from "src/generic.js";

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

type Output = "display" | "metadata" | "value";
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
  private watches: Record<string, Partial<Record<"display" | "value" | "metadata", Array<(a: unknown) => void>>>> = {};
  private outputs: Map<string, Set<string>> = new Map();
  private inputs: Map<string, Set<string>> = new Map();
  private rerun: Map<string, number> = new Map();
  private lib: Record<string, any> = {runtime: this};

  constructor(private store: NodysseusStore, lib?: Lib){
    this.scope = new Scope();
    Object.entries(lib.data).forEach(e => {
      this.lib[e[0]] = e[1];
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
          if(!Object.hasOwn(this.watches, node.id)) this.watches[node.id] = {}
          if(!Object.hasOwn(this.watches[node.id], _output)) this.watches[node.id][_output] = [];
          const watch = (a: T) => {
            this.watches[node.id][_output].splice(this.watches[node.id][_output].indexOf(watch), 1);
            res({value: a});
          }
          this.watches[node.id][_output].push(watch);
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
        if(inputs[k]) {
          this.outputs.get(inputs[k].id).add(id)
          this.inputs.get(id).add(inputs[k].id);
        }
      }
    }
  }

  private dirty(id: string) {
    const node = this.scope.get(id);
    if(isMapNode(node) || isBindNode(node)) {
      if(node.isDirty.read()) {
        return;
      }
      node.isDirty.write(true);
    }
    let nid;
    const nodeOuts = this.outputs.get(id);
    for(nid of nodeOuts) {
      this.dirty(nid);
    }
    if(this.watches[id] && !this.rerun.has(id)) this.rerun.set(id, requestAnimationFrame(() => {
      Object.entries(this.watches[id]).forEach(e => {
        this.runNode(this.scope.get(node.id), e[0] as "display" | "value" | "metadata");
      });
      this.rerun.delete(id);
    }))
  }

  constNode<T>(v: T, id?: string): AnyNode<T> {
    const node = constNode(v, id);
    this.scope.add(node);
    this.resetOutputs(node.id)
    return node;
  }

  varNode<T>(initial?: T, compare?: (a: T, b: T) => boolean, id?: string, log = false) {
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
    const node = bindNode<R, T, S>(inputs, args => {
      const current = node.value.read();
      return wrapPromiseAll([fn(args), current])
        .then(([outNode, current]) => {
          if(current !== outNode && outNode) {
            if(current && !isNothing(current))  this.outputs.get(node.id).forEach(oid => this.outputs.get(current.id).delete(oid))
            // if(current && !isNothing(current)) this.outputs.get(current.id)?.delete(node.id)
            this.outputs.get(node.id).forEach(oid => this.outputs.get(outNode.id).add(oid));
            // this.outputs.get(outNode.id).add(node.id)
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
      const res = !isNothing(bound) && this.runNode(this.scope.get(bound.id));
      return res && !isNothing(res) ? res : undefined;
    }, undefined, id)
  }

  private accessor<T, S extends Record<string, unknown>>(map: AnyNode<AnyNodeMap<S>>, key: string, id: string): AnyNode<T>{
    return this.mapNode({bound: this.bindNode({map: this.mapNode({map}, ({map}) => map, undefined, id + "-bindmap")}, ({map}) => map[key], undefined, id + "-bind")}, ({bound}) => this.runNode(bound), undefined, id + "-map") as AnyNode<T>;
  }

  private removeKey<T, S extends Record<string, unknown>>(map: AnyNode<AnyNodeMap<S>>, key: string, id: string): AnyNode<AnyNodeMap<S>> {
    return this.mapNode({map}, ({map}) => ({...map, [key]: undefined}), undefined, id);
  }

  public fromNode<T, S extends Record<string, unknown>>(graph: Graph, nodeId: string, closure?: AnyNodeMap<S>): AnyNode<(output: string) => T> | Promise<AnyNode<(output?: string) => T>> {
    closure = closure ?? ({} as AnyNodeMap<S>);
    return wrapPromise(typeof graph === "string" ? this.store.refs.get(graph) : graph).then(graph =>
      this.fromNodeInternal<T, S>(graph, nodeId, graph.id, closure && this.constNode(closure, appendGraphId(graph.id, nodeId) + "-outerargs"))
    ).value;
  }

  private calcNode<T, S extends Record<string, unknown>>(graph: Graph, node: NodysseusNode, graphId: string, nodeGraphId: string, closure: AnyNode<AnyNodeMap<S>>, edgesIn: Edge[], extraNodeGraphId: Output = "value") {
    const calculateInputs = () => Object.fromEntries(edgesIn.map(e => [e.as, this.valueMap(this.fromNodeInternal(graph, e.from, graphId, closure), nodeGraphId + `-valmapinput${e.as}`)])) as AnyNodeMap<S>;
    // this.scope.removeAll(nodeGraphId)
    if(isNothing(node)) {
      return this.constNode(undefined, nodeGraphId + extraNodeGraphId);
    } else if(isNodeRef(node)) {
      return this.dereference(graph, node, edgesIn, graphId, nodeGraphId, closure, calculateInputs, extraNodeGraphId);
    } else if(isNodeValue(node)) {
      return this.constNode(node_value(node), nodeGraphId + extraNodeGraphId);
    } else {
      const outNode = this.mapNode(calculateInputs(), args => args, undefined, nodeGraphId + extraNodeGraphId)
      return outNode
    }
  }

  private valueMap<T>(nodeFn: AnyNode<(output?: string) => T>, nodeGraphId) {
    return this.mapNode({nodeFn}, ({nodeFn}) => {
      const res = nodeFn();
      return res;
    }, undefined, nodeGraphId);
  }

  private dereference<T, S extends Record<string, unknown>>(graph: Graph, node: RefNode, edgesIn: Edge[], graphId: string, nodeGraphId: string, closure: AnyNode<AnyNodeMap<S>>, calculateInputs: () => AnyNodeMap<S>, extraNodeGraphId: Output = "value", refNode = node): AnyNode<T> | PromiseLike<AnyNode<T>> {
    return wrapPromise(this.store.refs.get(refNode.ref) as Graph)
      .then((nodeRef): AnyNode<T> => {
        if(refNode.ref === "@js.script") {
          let scriptFn;
          try{
            scriptFn = new Function("_lib", "_node", "_node_args", ...edgesIn.map(e => e.as), refNode.value) as (...args: any[]) => any;
          } catch(e) {
            console.error(e);
            const error = new NodysseusError(nodeGraphId, e);
            nolib.no.runtime.publish("grapherror", error, nolibLib)
            scriptFn = () => {};
          }

          return this.mapNode({...calculateInputs(), closure}, ({closure, ...args}) => {
            if(extraNodeGraphId === "metadata"){
              return {dataLabel: "script", codeEditor: {language: "javascript", editorText: node.value}};
            }
            try {
              return scriptFn(this.lib, node, args, ...Object.values(args))
            } catch(e) {
              console.error(e);
              const error = new NodysseusError(nodeGraphId, e);
              nolib.no.runtime.publish("grapherror", error, nolibLib)
            }
          }, undefined, nodeGraphId + extraNodeGraphId)
        } else if (refNode.ref === "return") {
          const argsEdge = edgesIn.find(e => e.as === "args");
          const chainedscope: AnyNode<AnyNodeMap<S>> = argsEdge ? this.mapNode({
            closure,
            args: this.fromNodeInternal<Record<string, unknown>, S>(graph, argsEdge.from, graphId, closure)
          }, ({args, closure}) => {
            return wrapPromise(args("value")).then(argsres => ({
            ...closure,
            ...mapEntries(argsres, e => this.constNode(e[1], `${nodeGraphId}-${e[0]}-arg`) as S[keyof S]), 
          })).value}, undefined, nodeGraphId + "-returnchained") as AnyNode<AnyNodeMap<S>> 
            : closure;

          const inputs = Object.fromEntries(
            edgesIn
              .filter(e => e.as !== "args")
              .map(e => [e.as, this.valueMap(this.fromNodeInternal(graph, e.from, graphId, chainedscope), nodeGraphId + `-argsvalmap-${e.as}`)])
          )

          const subscribeEdge = edgesIn.find(e => e.as === "subscribe");
          const subscribe = subscribeEdge && this.valueMap(this.fromNodeInternal(graph, subscribeEdge.from, graphId, chainedscope), nodeGraphId + "-subvalmap");

          return wrapPromise(edgesIn.find(e => e.as === "lib") ?
            this.runNode(
              this.mapNode({
                lib: this.valueMap(this.fromNodeInternal(graph, edgesIn.find(e => e.as === "lib").from, graphId, closure), nodeGraphId + "-libvalmap")
              }, ({lib}) => Object.assign(this.lib, lib))
            ) : undefined).then(() => {
              // this.mapNode({
              //   bound: this.bindNode(
              //     {closure},
              //     ({closure}) => closure?.["_output"],
              //     undefined,
              //     nodeGraphId + extraNodeGraphId + "-returnmap"
              //   ),
              //   subscribe
              // }, ({bound, subscribe: subscriptions}) => {
              //   subscriptions && Object.entries(subscriptions)
              //     .forEach(kv => kv[1] &&
              //       nolib.no.runtime.addListener(kv[0], nodeGraphId, kv[1], false, graphId, true, nolibLib))
              //
              //   console.log(extraNodeGraphId)
              //
              //
              //   const res = bound && this.runNode(bound);
              //   return res && typeof res === "string" ? res : "value"
              // }, undefined, nodeGraphId + extraNodeGraphId + "-bound_output"),

            return this.mapNode({result: inputs[extraNodeGraphId]}, ({result}) => result, undefined, nodeGraphId + extraNodeGraphId) as AnyNode<T>;
          }).value
        } else if (refNode.ref === "extern") {
          if(refNode.value === "extern.switch") {
            const predEdge = edgesIn.find(e => e.as === "input");
            return this.switchNode(
              this.valueMap(this.fromNodeInternal(graph, predEdge.from, graphId, closure), nodeGraphId + "-predvalmap"), 
              Object.fromEntries(
                edgesIn.filter(e => e.as !== "input")
                  .map(e => [e.as, this.valueMap(this.fromNodeInternal(graph, e.from, graphId, closure), nodeGraphId + `-valmap${e.as}`)])
              ), nodeGraphId + extraNodeGraphId) as AnyNode<T>;
          } else if(refNode.value === "extern.runnable") {
            const fnArgs = this.varNode<Record<string, unknown>>({}, undefined, nodeGraphId + "-fnargs")
            const chainedClosure = this.mapNode({fnArgs, closure}, ({fnArgs, closure}) => ({...closure, ...mapEntries(fnArgs, e => this.constNode(e[1], `${nodeGraphId}-${e[0]}-arg`) as S[keyof S])}), undefined, nodeGraphId + "-runnablechained") as AnyNode<AnyNodeMap<S>>;

            const parametersEdge = edgesIn.find(e => e.as === "parameters");
            const parameters = parametersEdge && this.valueMap(this.fromNodeInternal(graph, parametersEdge.from, graphId, closure), nodeGraphId + "-parametersvalmap");

            const fnNode = this.valueMap(this.fromNodeInternal(graph, edgesIn.find(e => e.as === "fn").from, graphId, chainedClosure), nodeGraphId + "-fnnodevalmap")
            return this.mapNode({ parameters }, ({parameters}) => ((args) => {
              if(parameters) {
                const keys = new Set(Object.keys(parameters));
                (this.scope.get(fnArgs.id) as typeof fnArgs).set(Object.fromEntries(Object.entries(args).filter(e => keys.has(e[0]))));
              } else {
                (this.scope.get(fnArgs.id) as typeof fnArgs).set({})
              }
              return this.runNode(fnNode);
            }) as T, undefined, nodeGraphId + extraNodeGraphId);
          } else if(refNode.value === "extern.map") {
            return this.mapNode(calculateInputs() as {fn: AnyNode<(mapArgs: {element: unknown, index: number}) => unknown>, array: AnyNode<Array<unknown>>}, ({fn, array}) => wrapPromiseAll(array.map((element, index) => fn({element, index}))), undefined, nodeGraphId + extraNodeGraphId) as AnyNode<T>
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
                    fn({previousValue, currentValue, index}), initial), undefined, nodeGraphId + extraNodeGraphId) as AnyNode<T>
          } else if(refNode.value === "extern.ap") {
            const fn: AnyNode<Array<(mapArgs: Record<string, unknown>) => T>> = this.valueMap(this.fromNodeInternal(graph, edgesIn.find(e => e.as === "fn").from, graphId, closure), nodeGraphId + "-fnvalmap")
            const runEdge = edgesIn.find(e => e.as === "run")
            const run: AnyNode<boolean> = runEdge && this.valueMap(this.fromNodeInternal(graph, runEdge.from, graphId, closure), nodeGraphId + "-runvalmap");
            const apArgs = this.varNode<Record<string, unknown>>({}, undefined, nodeGraphId + "-apapargs")
            const chainedClosure = this.mapNode({apArgs, closure}, ({apArgs, closure}) => ({...mapEntries(apArgs, e => this.constNode(e[1], `${nodeGraphId}-${e[0]}-arg`) as S[keyof S]), ...closure}), undefined, nodeGraphId + "-apchained") as AnyNode<AnyNodeMap<S>>;
            const argsEdge = edgesIn.find(e => e.as === "args")?.from;
            const argsNode = argsEdge ? this.mapNode({
              argsNode: this.valueMap(this.fromNodeInternal(graph, argsEdge, graphId, chainedClosure), nodeGraphId + "-argsvalmap") as AnyNode<Record<string, unknown>>
            }, ({argsNode}) => argsNode, undefined, nodeGraphId + "-apargs") : closure;

            return this.mapNode({fn, run}, ({fn, run}) => {
              if(run) {
                return wrapPromise(this.runNode(argsNode)).then(args => (Array.isArray(fn) ? fn : [fn]).filter(f => typeof f === "function").map(ffn => ffn(args))).then(results => Array.isArray(results) ? results : results[0]).value;
              } else {
                return (args) => {
                  const runtimeApArgs = this.scope.get(apArgs.id) as VarNode<any>;
                  runtimeApArgs.set(args);
                  return wrapPromise(this.runNode(argsNode) as Record<string, unknown>)
                    .then(args => (Array.isArray(fn) ? fn : [fn]).filter(f => typeof f === "function").map(ffn => ffn(args)))
                    .then(results => Array.isArray(results) ? results : results[0]).value;
                }
              }
            }, undefined, nodeGraphId + extraNodeGraphId) as AnyNode<T>;
          } else if (refNode.value === "extern.reference") {
            const initialNode = edgesIn.find(e => e.as === "initial")?.from 
              ? this.valueMap(this.fromNodeInternal(graph, edgesIn.find(e => e.as === "initial").from, graphId, closure), nodeGraphId + "-initialvalmap")
              : this.constNode(undefined, nodeGraphId + "-refconst");
            const setNode = this.varNode<T>(undefined, undefined, nodeGraphId + "-refset");

            return this.mapNode({initial: initialNode, set: setNode}, ({initial, set}) => 
                extraNodeGraphId === "display" 
                  ? {dom_type: "div", props: {}, children: [{dom_type: "text_value", text: JSON.stringify(set && !isNothing(set) ? set : initial)}]} 
                  : {
                    value: set && !isNothing(set) ? set : initial,
                    set: (t: {value: T}) => {
                      if(t?.value !== undefined) {
                        (this.scope.get(setNode.id) as typeof setNode).set(t?.value)
                      }
                    }
                  }, undefined, nodeGraphId + extraNodeGraphId) as AnyNode<T>
          } else if (refNode.value === "extern.state") {
            const valueNode = edgesIn.find(e => e.as === "value")?.from 
              ? this.valueMap(this.fromNodeInternal(graph, edgesIn.find(e => e.as === "value").from, graphId, closure), nodeGraphId + "-valmapinitial")
              : this.constNode(undefined, nodeGraphId + "-stateconst");
            const setNode = this.varNode<T>(undefined, undefined, nodeGraphId + "-stateset");
            const persistEdge = edgesIn.find(e => e.as === "persist");
            const persistNode = persistEdge && this.valueMap(this.fromNodeInternal(graph, persistEdge.from, graphId, closure), nodeGraphId + "valmappublish");

            return this.mapNode({
              initial: valueNode, 
              set: setNode,
              persist: persistNode
            }, ({initial, set, persist}) =>
              wrapPromise(set !== undefined && !isNothing(set) ? set : (persist && this.store.persist.get(nodeGraphId)) || initial).then(state => {

                return extraNodeGraphId === "display" 
                  ? {dom_type: "div", props: {}, children: [{dom_type: "text_value", text: JSON.stringify(set && !isNothing(set) ? set : initial)}]} 
                  : {
                    state,
                    set: (t: {value: T}) => {
                      (this.scope.get(setNode.id) as typeof setNode).set(t.value)
                      if(persist) {
                        this.store.persist.set(nodeGraphId, t.value);
                      }
                    }
                  }
              }).value, undefined, nodeGraphId + extraNodeGraphId) as AnyNode<T>
          } else if(refNode.value === "extern.cache") {
            const value = edgesIn.find(e => e.as === "value")?.from 
              ? this.fromNodeInternal(graph, edgesIn.find(e => e.as === "value").from, graphId, closure)
              : this.constNode(undefined, nodeGraphId + "-stateconst");

            const recache = edgesIn.find(e => e.as === "recache")?.from 
              ? this.fromNodeInternal(graph, edgesIn.find(e => e.as === "value").from, graphId, closure)
              : this.constNode<false>(false, nodeGraphId + "-stateconst");

            const outNode = this.mapNode({
              recache, 
              value: this.bindNode({}, () => value, undefined, nodeGraphId + "-value")
            }, ({value}) => wrapPromise(this.runNode(value)).then(v => v()).value, ({recache: r1}, {recache}) => !!(recache && recache()) || isNothing(outNode.value.read()) || outNode.value.read() === undefined, nodeGraphId + extraNodeGraphId)
            return outNode;
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
              nodeGraphId + extraNodeGraphId
            )
          }
        } else if(refNode.ref === "arg") {
          const argname = parseArg(refNode.value).name;
          const isAccessor = argname.includes(".");
          const allArgs = this.mapNode({bound: this.bindNode({closure}, ({closure: innerClosure}: {closure: AnyNodeMap<S>}) => 
                                        this.mapNode(innerClosure, (innerClosure) => innerClosure as S[keyof S], undefined, nodeGraphId + "-allargsmap"), undefined, nodeGraphId + "-allargs")}, ({bound}) => this.runNode(bound), undefined, nodeGraphId + "-outerbind");
          const libNode = this.constNode(this.lib, nodeGraphId + "-lib");
          const graphIdNode = this.constNode(node.value, `${nodeGraphId}-internalnodegraphid`)
          const mnode = this.mapNode({bound: this.bindNode(
            {closure},
            ({closure}): AnyNode<unknown> => {
              if(argname === "_argsdata") {
                // Object.values(closure).map(argnode => argnode && this.outputs.get(argnode.id).add(mnode.id))
              }

              return argname === "_argsdata"
                ? allArgs
                : argname.startsWith("_lib")
                ? libNode
                : argname === "__graphid"
                ? graphIdNode
                : isAccessor
                ? closure[argname.substring(0, argname.indexOf("."))]
                : closure[argname];
            },
            undefined,
            nodeGraphId + "-bind"
          )}, ({bound}) => {
            return wrapPromise(this.runNode(bound)).then(res => {
            return (res && !isNothing(res) ? isAccessor ? get(res, argname.substring(argname.indexOf(".") + 1)) : res : undefined) as T
          }).value}, undefined, nodeGraphId + extraNodeGraphId);

          return mnode;
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
          bound: this.bindNode({closure}, () => 
            this.fromNodeInternal(
              nodeRef, 
              nodeRef.out ?? "out", 
              nodeGraphId + nodeRef.id, 
              this.constNode({
                ...calculateInputs(), 
                __graph_value: this.constNode(node.value, `${nodeGraphId}-internalnodegraphvalue`)
              }, nodeGraphId + "-args"))
          , undefined, nodeGraphId + "-graphoutbind")
          }, ({bound}) => this.runNode(bound, extraNodeGraphId) as T,
            undefined, nodeGraphId + extraNodeGraphId)
            // this.mapNode({}, () => ({
            //   ...calculateInputs(),
            //   _output: undefined,
            //   __graph_value: this.constNode(node.value, `${nodeGraphId}-internalnodegraphid`)
            // }), undefined, nodeGraphId + "-mappedclosure"))
        } else {
          return this.dereference(graph, node, edgesIn, graphId, nodeGraphId, closure, calculateInputs, extraNodeGraphId, nodeRef) as AnyNode<T>
        }
      }).value
  }


  private fromNodeInternal<T, S extends Record<string, unknown>>(graph: Graph, nodeId: string, graphId: string, closure?: AnyNode<AnyNodeMap<S>>): AnyNode<(output?: string) => T> {
    const node = graph.nodes[nodeId];
    const nodeGraphId =  appendGraphId(graphId, nodeId)
    const staticGraphId = graph.id;
    const current = this.scope.get(nodeGraphId + "-boundgraph")
    if(current) {
      return current as AnyNode<(output: string) => T>;
    }

    const graphNodeNode: VarNode<{node: NodysseusNode, edgesIn: Array<Edge>, graph: Graph}> = this.varNode({
      graph,
      node: graph.nodes[node.id], 
      edgesIn: graph.edges_in?.[node.id] 
        ? Object.values(graph.edges_in?.[node.id]) 
        : Object.values(graph.edges).filter((e: Edge) => e.to === node.id)
    }, ({node: nodeA, edgesIn: edgesInA, graph: graphA}, {node: nodeB, edgesIn: edgesInB, graph: graphB}) => {
      if(!nodeB || !nodeA || !compareObjects(nodeA, nodeB, false, NAME_FIELD) || edgesInA.length !== edgesInB.length) return false; 
      const sortedEdgesA = edgesInA.sort((a, b) => a.as.localeCompare(b.as));
      const sortedEdgesB = edgesInB.sort((a, b) => a.as.localeCompare(b.as));
      return sortedEdgesA.every((e, i) => compareObjects(e, sortedEdgesB[i]))
    }, nodeGraphId + "-graphnode", true);
    const calcedNode: AnyNode<AnyNode<T>> = this.bindNode({graphNodeNode}, ({graphNodeNode}) => {
      const newNode = this.calcNode(graphNodeNode.graph, graphNodeNode.node, graphId, nodeGraphId, closure, graphNodeNode.edgesIn);
      return newNode;
    }, undefined, nodeGraphId + "-value-calcedNode");
    const calcedNodeDisplay: AnyNode<AnyNode<T>> = this.bindNode({graphNodeNode}, ({graphNodeNode}) => {
      const newNode = this.calcNode(graphNodeNode.graph, graphNodeNode.node, graphId, nodeGraphId, closure, graphNodeNode.edgesIn, "display");
      return newNode;
    }, undefined, nodeGraphId + "-display-calcedNode");
    const calcedNodeMetadata: AnyNode<AnyNode<T>> = this.bindNode({graphNodeNode}, ({graphNodeNode}) => {
      const newNode = this.calcNode(
        graphNodeNode.graph, 
        graphNodeNode.node, 
        graphId, 
        nodeGraphId, 
        closure, 
        graphNodeNode.edgesIn, 
        "metadata"
      );
      return newNode;
    }, undefined, nodeGraphId + "-metadata-calcedNode");
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

    const retNode = this.mapNode({
      boundValue: calcedNode,
      boundDisplay: calcedNodeDisplay,
      boundMetadata: calcedNodeMetadata,
    }, ({boundValue, boundDisplay, boundMetadata}) => (output) => {
      const res = this.runNode(output === "display" ? boundDisplay : output === "metadata" ? boundMetadata : boundValue) as T;
      return res;
    }, undefined, nodeGraphId + "-boundgraph");
    return retNode;
  } 

  private runNode<T>(innode: AnyNode<T> | Nothing, _output?: "display" | "value" | "metadata"): T | PromiseLike<T> | Nothing{
    if(isNothing(innode)) return innode;
    const node: AnyNode<T> = this.scope.get(innode.id)! as AnyNode<T>;
    if(node.id.startsWith("hydra_example/fxdvtj6")) {
      requestAnimationFrame(() => {
        const walk = (inputs) => {
          inputs.forEach(input => {
            const inpts = this.inputs.get(input);
            walk(inpts)
          })
        }
        const inpts = this.inputs.get(node.id)

        walk(inpts)
      })
    }
    const current = node.value?.read();
    let result;
    if(node && !isNothing(node) && (
      isVarNode(node) || isConstNode(node) 
      || (!(node as MapNode<T, Record<string, unknown>> | BindNode<T, Record<string, unknown>>).isDirty.read() && _output === undefined))) {
      result = node.value.read();
    } else if (isMapNode(node)) {
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


      return wrapPromise(getPromises()).then(allPromises => wrapPromiseAll(allPromises))
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
            updatedNode.value.write(r);
            updatedNode.isDirty.write(false);

            if(this.watches[node.id] && current !== result) {
              this.watches[node.id][_output]?.forEach(fn => wrapPromise((r as Function)(_output)).then(fn));
            }
            return _output ? r(_output) : r;
          }).value;
        }

        result = updatedNode.value.read();
        updatedNode.isDirty.write(false);

        if(this.watches[node.id] && current !== result) {
          this.watches[node.id][_output]?.forEach(fn => wrapPromise(result(_output)).then(fn));
        }

        return _output ? result(_output) : result;
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
      return wrapPromise(getPromises()).then(promises => wrapPromiseAll(promises)).then(inputs => {
        const updatedNode = this.scope.get(node.id) as BindNode<T, any>;
        updatedNode.isDirty.write(false);
        const next = Object.fromEntries(inputs);
        // TODO: Comment in
        // next["_output"] = _output;

        if(isNothing(updatedNode.value.read()) || isNothing(prev) || updatedNode.isStale(prev, next)) {
          updatedNode.value.write(wrapPromise(chainNothing(updatedNode.fn, fn => fn(next)) ?? nothingValue).value)
          updatedNode.isDirty.write(false);
          const res = updatedNode.value.read();
          return wrapPromise(res).then(result => {
              updatedNode.value.write(result);

              if(this.watches[node.id] && current !== result) {
                this.watches[node.id][_output]?.forEach(fn => wrapPromise((result as Function)(_output)).then(fn));
              }

              const boundNode: Nothing | T = updatedNode.value.read();
              if(!isNothing(boundNode)) this.scope.add(boundNode as AnyNode<unknown>);
              updatedNode.cachedInputs.write(next);

              return boundNode;
          }).value
        }

        updatedNode.isDirty.write(false);

        if(this.watches[node.id] && current !== result) {
          this.watches[node.id][_output]?.forEach(fn => wrapPromise((result as Function)(_output)).then(fn));
        }

        const boundNode: Nothing | T = updatedNode.value.read();
        if(!isNothing(boundNode)) this.scope.add(boundNode as AnyNode<unknown>);

        return boundNode;
      }).value;
    }


    if(this.watches[node.id] && current !== result) {
      this.watches[node.id][_output]?.forEach(fn => wrapPromise(result(_output)).then(fn));
    }

    return _output ? result(_output) : result;
  }

  public runGraphNode<T>(graph: Graph, node: string, _output?: "display" | "value" | "metadata") {
    const current = this.scope.get(appendGraphId(graph.id, node) + "-boundgraph");
    if(current) return this.runNode(current, _output);
    return wrapPromise(this.fromNode(graph, node)).then(nodeNode => this.runNode(nodeNode, _output)).value;
  }

  public run<T>(node: AnyNode<T> | string, _output?: "display" | "value" | "metadata") {
    const nodeid = (typeof node === "string" ? node : node.id);
    const resolvedNode = this.scope.get(nodeid) as AnyNode<(output: string) => T>;
    const res = resolvedNode && this.runNode(resolvedNode)

    return res && !isNothing(res) && wrapPromise(res).then(resp => {
      const ress = resp(_output);
      return ress
    }).value;
  }
}
