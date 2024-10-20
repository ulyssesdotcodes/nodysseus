// export class DependencyTreeNode<T, R extends Record<string, unknown>> {
//
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

import {
  Edge,
  GenericHTMLElement,
  Graph,
  Lib,
  NodysseusNode,
  NodysseusStore,
  RefNode,
  ValueNode,
  isGraph,
  isNodeRef,
  isNodeGraph,
  isNodeValue,
} from "../types.js";
import {
  compare,
  initStore,
  node_extern,
  node_value,
  nolib,
  nolibLib,
} from "../nodysseus.js";
import * as externs from "../externs.js";
import { v4 as uuid } from "uuid";
import {
  NodysseusError,
  ancestor_graph,
  appendGraphId,
  compareObjects,
  descendantGraph,
  isWrappedPromise,
  ispromise,
  mergeLib,
  newEnv,
  newLib,
  nodeEdgesIn,
  parseArg,
  wrapPromise,
  wrapPromiseAll,
  wrapPromiseReduce,
} from "../util.js";
import get from "just-safe-get";
import generic from "../generic.js";
import { create_fn } from "src/externs.js";
import { json } from "@codemirror/lang-json";

type RUnknown = Record<string, unknown>;

const NAME_FIELD = new Set(["name"]);

const logAfterLoad = (...logs) =>
  performance.now() > 5000 && console.log(performance.now(), ...logs);

export function compareObjectsNeq(value1, value2) {
  const keys1 = Object.keys(value1);
  const keys2 = Object.keys(value2);

  if (keys1.length !== keys2.length) {
    return true;
  }

  for (const key of keys1) {
    if (value1[key] === value2[key]) {
      continue;
    }

    return true;
  }

  return false;
}

// export type IndependentNode<T> = BaseNode<T> & {
//   fn: () => T,
// };
//

const mapEntries = <
  T extends Record<string, unknown>,
  S extends Record<string, unknown>,
>(
  v: T,
  f: (e: [string, T["string"]]) => S[keyof S],
): S =>
  Object.fromEntries(
    Object.entries(v)
      .filter((e) => e[1])
      .map((e: [string, unknown]) => [e[0], f(e as [string, T["string"]])]),
  ) as S;

const outputs = ["display", "metadata", "value"] as const;
type Output = (typeof outputs)[number];
type NodeKind = "const" | "map" | "var" | "bind";
type Nothing = { __kind: "nothing" };
export const isNothing = (a: any): a is Nothing =>
  a && (a as Nothing).__kind === "nothing";
export const isNothingOrUndefined = (a: any): a is Nothing =>
  a === undefined || (a as Nothing).__kind === "nothing";
const nothingOf = (): Nothing => ({ __kind: "nothing" });
const nothingValue: Nothing = { __kind: "nothing" };
const chainNothing = <T, S>(a: Nothing | T, fn: (a: T) => S): Nothing | S =>
  isNothing(a) ? a : fn(a);

const clientId = uuid();

export class State<T> {
  constructor(private value: T | Nothing = nothingValue) {}
  write(value: T | Nothing) {
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
};

export const isWatchNode = <T>(a: any): a is AnyNode<T> =>
  a?.__kind === "watch";

export type AnyNode<T> = Node<NodeKind, T>;
export type UnwrapNode<T> = T extends AnyNode<infer I> ? I : never;
type AnyNodeMap<S extends Record<string, unknown>> = {
  [k in keyof S]: AnyNode<S[k]>;
};

export type Node<K extends NodeKind, T = unknown> = {
  __kind: K;
  id: string;
  value: State<T>;
};

export type ConstNode<T> = Node<"const", T>;

const isConstNode = <T>(a: AnyNode<T>): a is ConstNode<T> =>
  (a as ConstNode<T>)?.__kind === "const";

export type VarNode<T> = AnyNode<T> & {
  __kind: "var";
  set: (value: T) => void;
  compare: (a: T, b: T) => boolean;
};

const isVarNode = <T>(a: AnyNode<T>): a is VarNode<T> =>
  (a as VarNode<T>)?.__kind === "var";

export type MapNode<T, S extends Record<string, unknown>> = Node<"map", T> & {
  fn: State<(s: S) => T>;
  cachedInputs: State<S>;
  isStale: (p: S, n: S) => boolean;
  inputs: Record<string, string>;
  isDirty: State<boolean>;
};
const isMapNode = <T, S extends Record<string, unknown>>(
  a: AnyNode<T>,
): a is MapNode<T, S> => (a as MapNode<T, S>)?.__kind === "map";

export type BindNode<T, S extends Record<string, unknown>> =
  T extends AnyNode<unknown>
    ? Node<"bind", T> & {
        isStale: (p: S, n: S) => boolean;
        fn: (s: S) => T;
        inputs: { [k in keyof S]: string };
        cachedInputs: State<S>;
        isDirty: State<boolean>;
      }
    : never;

const isBindNode = <T, S extends Record<string, unknown>>(
  a: AnyNode<T>,
): a is BindNode<T, S> => a?.__kind === "bind";

const isNode = <T>(a: any): a is AnyNode<T> =>
  a?.__kind === "bind" ||
  a?.__kind === "var" ||
  a?.__kind === "const" ||
  a?.__kind === "map";

class Scope {
  private nodes: Map<
    string,
    Node<NodeKind> | NodeOutputs<unknown, unknown, unknown>
  > = new Map();
  constructor() {}
  add(node: Node<NodeKind>) {
    this.nodes.set(node.id, node);
  }
  get<T>(id: string) {
    return this.nodes.get(id) as AnyNode<T>;
  }
  has(id: string) {
    return this.nodes.has(id);
  }
  count() {
    return this.nodes.size;
  }
  findKeys(id: string) {
    return [...this.nodes.keys()].filter((k) => k.startsWith(id));
  }
  removeAll(id: string) {
    for (const k of this.nodes.keys()) {
      if (
        k &&
        k.startsWith(id) &&
        k !== id + "-graphnode" &&
        k !== id + "-boundNode"
      ) {
        this.nodes.delete(k);
      }
    }
  }
}

export const constNode = <T>(a: T, id?: string): ConstNode<T> => ({
  __kind: "const",
  id: id ?? uuid(),
  value: new State(a),
});

export const varNode = <T>(
  set: (value: T) => void,
  compare: (a: T, b: T) => boolean = (a, b) => a === b,
  id?: string,
): VarNode<T> => ({
  __kind: "var",
  id: id ?? uuid(),
  value: new State(),
  set,
  compare,
});

export const mapNode = <T, S extends Record<string, unknown>>(
  inputs: { [k in keyof S]: AnyNode<S[k]> },
  fn: (s: S) => T,
  isStale: (previous: S, next: S) => boolean,
  id?: string,
): MapNode<T, S> => ({
  __kind: "map",
  id: id ?? uuid(),
  value: new State(),
  fn: new State(fn),
  cachedInputs: new State(),
  isStale,
  inputs: mapEntries(inputs, (e) => e[1].id),
  isDirty: new State(false),
});

export const bindNode = <
  R,
  T extends AnyNode<R> | AnyNode<R>,
  S extends Record<string, unknown>,
>(
  inputs: { [k in keyof S]: AnyNode<S[k]> },
  fn: (inputs: S) => T | PromiseLike<T>,
  isStale = (p, n) => true,
  id?: string,
): BindNode<T, S> =>
  ({
    __kind: "bind",
    id: id ?? uuid(),
    value: new State(),
    fn,
    cachedInputs: new State(),
    inputs: mapEntries(inputs, (e) => e[1].id),
    isStale,
    isDirty: new State(false),
  }) as BindNode<T, S>;

export const handleError = (e: Error, nodeGraphId: string) => {
  console.error(e);
  const error = new NodysseusError(nodeGraphId, e);
  nolib.no.runtime.publish("grapherror", error, nolibLib);
};

type NodeOutputs<T, D, M> = AnyNode<{
  value: AnyNode<T>;
  display: AnyNode<D>;
  metadata: AnyNode<M>;
}> & {
  graphId: string;
  nodeId: string;
};

export type NodeOutputsU = NodeOutputs<unknown, unknown, unknown>;
export type NodeType<N> = N extends AnyNode<infer T> ? T : never;

const isNodeOutputs = (
  value: NodeOutputsU | AnyNode<unknown>,
): value is NodeOutputsU =>
  isNode(value) &&
  !!(value as NodeOutputsU).nodeId &&
  !!(value as NodeOutputsU).graphId;

export class NodysseusRuntime {
  public scope: Scope;
  private _outputReturns: Map<string, string> = new Map();
  private watches: Map<string, Array<(a: unknown) => void>> = new Map();
  private outputs: Map<string, Set<string>> = new Map();
  private inputs: Map<string, Set<string>> = new Map();
  private rerun: Map<string, number> = new Map();
  private lib: Record<string, any> = { runtime: this };
  private eventQueue: Array<Function> = [];
  private running: Map<string, number> = new Map();
  private torun: Set<string> = new Set();
  private dirtying = 0;

  // id is used so addListener works for multiple runtimes
  constructor(
    private id,
    public store: NodysseusStore,
    lib?: Lib,
    private event = "graphchange",
  ) {
    this.scope = new Scope();
    Object.entries(lib.data).forEach((e) => {
      if (e[0] !== "runtime") {
        this.lib[e[0]] = e[1];
      }
    });
  }

  //////////
  // ported from nodysseus.runtime
  ////

  public refs() {
    return this.store.refs.keys();
  }

  public graphExport(graphid) {
    return graphid === "arg" || Object.keys(generic.nodes).includes(graphid)
      ? ([] as Array<Graph>)
      : wrapPromise(this.store.refs.get(graphid)).then((graph) =>
          wrapPromiseAll(
            Object.values(graph.nodes).map((node) =>
              isNodeRef(node) ? this.graphExport(node.ref) : [],
            ),
          ).then<Graph[]>((nodeGraphs) => nodeGraphs.flat().concat([graph])),
        ).value;
  }

  nodeCount() {
    this.scope.count();
  }

  public createWatch<T>(node: AnyNode<T>): AsyncIterable<T> {
    return {
      [Symbol.asyncIterator]: () => ({
        next: () =>
          new Promise<IteratorResult<T>>((res) => {
            const watch = (a: T) => {
              this.watches
                .get(node.id)
                .splice(this.watches.get(node.id).indexOf(watch), 1);
              res({ value: a });
            };
            this.addWatchFn(node, watch);
          }),
      }),
    };
  }

  public clearWatch(node, watch) {
    if (
      this.watches.has(node.id) &&
      this.watches.get(node.id).includes(watch)
    ) {
      this.watches
        .get(node.id)
        .splice(this.watches.get(node.id).indexOf(watch), 1);
    }
  }

  private addWatchFn<T>(node: AnyNode<T>, watch: (output: T) => void) {
    if (!this.watches.has(node.id)) this.watches.set(node.id, []);
    this.watches.get(node.id).push(watch);
    this.checkWatch(node.id);
  }

  private resetOutputs(
    id: string,
    inputs?: Array<AnyNode<unknown>> | Record<string, AnyNode<unknown>>,
  ) {
    if (!this.outputs.has(id)) this.outputs.set(id, new Set());
    if (!this.inputs.has(id)) this.inputs.set(id, new Set());

    let changed = false;

    // this.outputs.get(id).clear();
    if (inputs) {
      let k;
      for (k in inputs) {
        if (inputs[k] && this.outputs.has(inputs[k].id)) {
          if (!this.outputs.get(inputs[k].id).has(id)) {
            changed = true;
            this.outputs.get(inputs[k].id).add(id);
          }
          if (!this.inputs.get(id).has(inputs[k].id)) {
            changed = true;
            this.inputs.get(id).add(inputs[k].id);
          }
        }
      }
    }

    if (changed) {
      this.dirty(id);
    }
  }

  private checkWatch(id: string) {
    const node = this.scope.get(id);

    const runIfClean = () => {
      if (!this.running.has(id)) {
        for (const output of outputs) {
          this.watches.get(id)?.forEach((fn) => {
            fn(this.runNode(this.scope.get(id), output));
          });
        }
        this.rerun.delete(id);
      }
    };

    if (
      this.watches.has(id) &&
      !this.rerun.has(id) &&
      isMapNode(node) &&
      node.isDirty.read() &&
      !this.running.has(id)
    ) {
      new Promise(() => runIfClean());
    }
  }

  private checkWatches() {
    for (const id of this.watches.keys()) {
      this.checkWatch(id);
    }
  }

  private dirty(id: string, breakOnNode?: string) {
    this.dirtying += 1;
    // logAfterLoad("dirty", id);
    const node = this.scope.get(id);
    if (isMapNode(node) || isBindNode(node)) {
      if (node.isDirty.read()) {
        this.dirtying -= 1;
        return;
      }
      node.isDirty.write(true);
    }
    if (id === breakOnNode) {
      this.dirtying -= 1;
      return;
    }
    let nid;
    const nodeOuts = this.outputs.get(id);
    for (nid of nodeOuts) {
      this.dirty(nid, breakOnNode);
    }
    this.dirtying -= 1;
    if (this.dirtying === 0) {
      [...this.torun].map((id) => this.checkWatch(id));
      this.torun.clear();
    } else {
      this.torun.add(id);
    }
  }

  constNode<T>(v: T, id?: string, useExisting: boolean = true): AnyNode<T> {
    const node =
      useExisting && this.scope.has(id)
        ? (this.scope.get(id) as AnyNode<T>)
        : constNode(v, id);
    this.scope.add(node);
    this.resetOutputs(node.id);
    this.dirty(node.id);
    return node;
  }

  varNode<T>(
    initial?: T,
    compare?: (a: T, b: T) => boolean,
    id?: string,
    useExisting: boolean = true,
    dirty = true,
  ): VarNode<T> {
    if (useExisting && id && this.scope.has(id)) {
      const node = this.scope.get(id) as VarNode<T>;
      node.set(initial);
      return node;
    }
    const node = varNode(
      (newValue: T) => {
        const currentValue = node.value.read();
        if (isNothing(currentValue) || !node.compare(currentValue, newValue)) {
          node.value.write(newValue);
          if (dirty) {
            this.dirty(node.id);
          }
        }
      },
      compare,
      id,
    );
    this.scope.add(node);
    this.resetOutputs(node.id);
    if (initial !== undefined) node.set(initial);
    this.dirty(node.id);
    return node;
  }

  mapNode<T, S extends Record<string, unknown>>(
    inputs: { [k in keyof S]: AnyNode<S[k]> },
    fn: (s: S) => T,
    isStale: (previous: S, next: S) => boolean = () => true,
    id?: string,
    useExisting: boolean = true,
  ): AnyNode<T> {
    if (useExisting && id && this.scope.has(id)) return this.scope.get(id);
    const node = mapNode(inputs, fn, isStale, id);
    this.scope.add(node);
    this.resetOutputs(node.id, inputs);
    this.dirty(node.id);
    return node;
  }

  /**
   * Bind a function that creates a node to inputs. Inspired by monadic bind.
   */

  bindNode<R, T extends AnyNode<R>, S extends Record<string, unknown>>(
    inputs: { [k in keyof S]: AnyNode<S[k]> },
    fn: (s: S) => T | PromiseLike<T>,
    isStale?: (previous: S, next: S) => boolean,
    id?: string,
    useExisting: boolean = true,
  ): AnyNode<T> {
    if (useExisting && id && this.scope.has(id)) return this.scope.get(id);
    const currentBind = this.scope.get(id) as AnyNode<T>;
    if (useExisting && currentBind) {
      return currentBind;
    }
    const node = bindNode<R, T, S>(
      inputs,
      (args) => {
        const current = node.value.read();
        return wrapPromiseAll([fn(args), current]).then(
          ([outNode, current]) => {
            if (current !== outNode && outNode) {
              // check for id equivalence, otherwise setting this.outputs is irrelevant
              if (current.id !== outNode.id) {
                // if(current && !isNothing(current))  this.outputs.get(node.id).forEach(oid => this.outputs.get(current.id).delete(oid))
                // if(current && !isNothing(current)) this.outputs.get(node.id).delete(current.id)
                this.outputs
                  .get(node.id)
                  .forEach((oid) => this.outputs.get(outNode.id).add(oid));
                // this.outputs.get(node.id).add(outNode.id)
              }

              if (
                current &&
                !isNothing(current) &&
                (current.__kind !== outNode.__kind ||
                  current.id !== outNode.id ||
                  !compare(current.value.read(), outNode.value.read()) ||
                  ((isMapNode(current) || isBindNode(current)) &&
                    current.isDirty.read()))
              ) {
                if (isMapNode(outNode) || isBindNode(outNode)) {
                  outNode.isDirty.write(false);
                }
                this.dirty(outNode.id);
              }
            }
            return outNode;
          },
        ).value as T | PromiseLike<T>;
      },
      isStale,
      id,
    );
    this.scope.add(node);
    this.resetOutputs(node.id, inputs);
    this.dirty(node.id);
    return node;
  }

  /**
   * Uses bindNode to create a switch statement based on a key node
   */
  switchNode<T, S extends Record<string, T>>(
    key: AnyNode<string>,
    inputs: { [k in keyof S]: AnyNode<T> },
    id?: string,
    useExisting: boolean = true,
  ) {
    // TODO: Make sure that bound is binding the output correctly to the bind node not to the "map" node
    const keyOptions: Record<string, AnyNode<AnyNode<T>>> = mapEntries(
      inputs,
      (e) =>
        this.constNode(e[1], id && `${id}-${e[0]}-const`, false) as AnyNode<
          AnyNode<T>
        >,
    );
    const binding: AnyNode<AnyNode<T>> = this.bindNode(
      { key, ...keyOptions } as { key: AnyNode<string> } & {
        [k in keyof S]: AnyNode<AnyNode<T>>;
      },
      (args) => args[args.key] as AnyNode<T>,
      (p, n) => p.key !== n.key || p[p.key] !== n[n.key],
      id && `${id}-bind`,
      useExisting,
    ) as AnyNode<AnyNode<T>>;
    return this.mapNode(
      { bound: binding },
      ({ bound }) => {
        const res = !isNothing(bound) && this.runNode(bound);
        return res !== undefined && !isNothing(res) ? res : undefined;
      },
      undefined,
      id,
      useExisting,
    );
  }

  public accessorMap<T, S extends Record<string, unknown>>(
    map: AnyNode<S> | NodeOutputsU,
    key: string,
    id: string,
    useExisting: boolean,
    isNodeRun: boolean = false,
  ): AnyNode<T> {
    return this.mapNode(
      {map},
      ({map}) => map[key],
      undefined,
      id + key + "-map",
      useExisting,
    ) as AnyNode<T>;
  }

  public accessor<T, S extends Record<string, unknown>>(
    map: AnyNode<AnyNodeMap<S>> | NodeOutputsU,
    key: string,
    id: string,
    useExisting: boolean,
    isNodeRun: boolean = false,
  ): AnyNode<T> {
    return this.mapNode(
      {
        bound: this.bindNode(
          {
            map: this.mapNode(
              { map },
              ({ map }) => map,
              undefined,
              id + key + "-bindmap",
              useExisting,
            ),
          },
          ({ map }) => map[key],
          undefined,
          id + key + "-bind",
          useExisting,
        ),
      },
      ({ bound }) => {
        // if(isNodeOutputs(map)) {
        //   nolib.no.runtime.publish("noderun", {graphId: map.graphId, nodeId: map.nodeId}, nolibLib)
        // }
        return this.runNode(bound);
      },
      undefined,
      id + key + "-map",
      useExisting,
    ) as AnyNode<T>;
  }

  private removeKey<T, S extends Record<string, unknown>>(
    map: AnyNode<AnyNodeMap<S>>,
    key: string,
    id: string,
  ): AnyNode<AnyNodeMap<S>> {
    return this.mapNode(
      { map },
      ({ map }) => ({ ...map, [key]: undefined }),
      undefined,
      id,
    );
  }

  public runNodeNode<T>(
    node: AnyNode<AnyNode<T>>,
    nodeGraphId: string,
    useExisting = true,
  ): AnyNode<T> {
    return this.mapNode(
      {
        bound: this.bindNode(
          { bound: node },
          ({ bound }) => bound,
          undefined,
          nodeGraphId + "-runNodeNodebind",
        ),
      },
      ({ bound }) => this.runNode(bound) as T,
      undefined,
      nodeGraphId,
      useExisting,
    );
  }

  // private runOutput<T, D, M, O extends Output>(outputNode: NodeOutputs<T, D, M>, output: O, nodeGraphId): NodeOutputs<T, D, M>[O] {
  //   return this.mapNode({bound: this.bindNode({value: outputNode[output] as NodeOutputs<T, D, M>[O]}, ({value}) => value, undefined, nodeGraphId + "-bound")}, ({bound}) => this.runNode(bound as UnwrapNode<NodeOutputs<T, D, M>>), undefined, nodeGraphId) as UnwrapNode<UnwrapNode<NodeOutputs<T, D, M>>>;
  // }

  public fromNode<T, D, M, S extends Record<string, unknown>>(
    graph: Graph | string,
    nodeId: string,
    closure?: AnyNodeMap<S>,
  ): NodeOutputs<T, D, M> | Promise<NodeOutputs<T, D, M>> {
    closure = closure ?? ({} as AnyNodeMap<S>);
    return wrapPromise(
      typeof graph === "string" ? this.store.refs.get(graph) : graph,
    ).then((graph) =>
      this.fromNodeInternal<T, D, M, S>(
        graph,
        nodeId,
        graph.id,
        closure &&
          this.constNode(
            closure,
            appendGraphId(graph.id, nodeId) + "-outerargs",
          ),
        true,
      ),
    ).value;
  }

  private calcNode<T, S extends Record<string, unknown>>(
    graph: Graph,
    node: NodysseusNode,
    graphId: string,
    nodeGraphId: string,
    closure: AnyNode<AnyNodeMap<S>>,
    edgesIn: Edge[],
    useExisting: boolean,
    extraNodeGraphId: Output = "value",
  ) {
    const calculateInputs = () =>
      Object.fromEntries(
        edgesIn.map((e) => [
          e.as,
          this.valueMap(
            this.fromNodeInternal(graph, e.from, graphId, closure, true),
            nodeGraphId + `-valmapinput${e.as}`,
            useExisting,
          ),
        ]),
      ) as AnyNodeMap<S>;
    if (isNothing(node)) {
      return this.constNode(undefined, nodeGraphId, false);
    } else if (isNodeRef(node)) {
      return this.dereference(
        graph,
        node,
        edgesIn,
        graphId,
        nodeGraphId,
        closure,
        calculateInputs,
        extraNodeGraphId,
        useExisting,
      );
    } else if (isNodeValue(node)) {
      // return this.mapNode({__graph_value: this.accessor(closure, "__parent_graph_value", appendGraphId(nodeGraphId, "-accessvalue"), useExisting)}, ({__graph_value}) => ( __graph_value && console.log("got value", __graph_value), externs).parseValue(__graph_value), undefined, nodeGraphId, useExisting)
      

      return this.constNode(node_value(node), nodeGraphId, false)
    } else if (isGraph(node)) {
      closure = this.mapNode(
        {closure},
        ({closure}) =>({
          ...closure,
          "__graph_value": closure["__parent_graph_value"],
        }), undefined, appendGraphId(nodeGraphId, "-closure-with-system-values-graph"))
      return this.accessor(
        this.fromNodeInternal(
          node,
          node.out ?? "out",
          nodeGraphId,
          this.mergeClosure(
            closure,
            this.constNode(
              calculateInputs(),
              nodeGraphId + "closure",
              useExisting,
            ),
            appendGraphId(nodeGraphId, node.id),
          ),
          useExisting,
        ),
        "value",
        nodeGraphId + "-accessor",
        useExisting,
      );
    } else {
      return this.mapNode(
        calculateInputs(),
        (args) => args,
        undefined,
        nodeGraphId,
        useExisting,
      );
    }
  }

  private valueMap<T>(
    outputNode: NodeOutputs<T, unknown, unknown>,
    nodeGraphId,
    useExisting,
  ): AnyNode<T> {
    // return this.mapNode({bound: this.bindNode({map: this.mapNode({map}, ({map}) => map, undefined, id + key + "-bindmap", useExisting)}, ({map}) => map[key], undefined, id + key + "-bind", useExisting)}, ({bound}) => {
    //   if((map as NodeOutputs<unknown, unknown, unknown>).graphId) {
    //     const nodeOutput = map as NodeOutputs<unknown, unknown, unknown>;
    //     nolib.no.runtime.publish("noderun", {graph: nodeOutput.graphId, node_id: nodeOutput.nodeId}, nolibLib)
    //   }
    //   return this.runNode(bound)
    // }, undefined, id + key + "-map", useExisting) as AnyNode<T>;
    return this.accessor(outputNode, "value", nodeGraphId, useExisting);
    // return outputNode["value"];
    // this.mapNode({bound: this.bindNode({value: outputNode.value}, ({value}) => value, undefined, nodeGraphId + "-bound")}, ({bound}) => this.runNode(bound) as T, undefined, nodeGraphId);
  }

  private checkEvents() {
    if (this.running.size === 0 && this.eventQueue.length > 0) {
      this.eventQueue.shift()?.();
      this.checkEvents();
    }
  }

  private mergeClosure<S extends RUnknown>(
    closure: AnyNode<AnyNodeMap<RUnknown>>,
    args: AnyNode<RUnknown>,
    id: string,
    useExisting = true,
  ): AnyNode<AnyNodeMap<S>> {
    return this.mapNode(
      {
        closure,
        args,
      },
      ({ args, closure }) =>
        wrapPromise(args).then(
          (argsres) =>
            ({
              ...closure,
              ...(argsres &&
                mapEntries(
                  argsres,
                  (e) =>
                    this.constNode(e[1], `${id}-${e[0]}-arg`, false) as AnyNode<
                      S[keyof S]
                    >,
                )),
            }) as AnyNodeMap<S>,
        ).value,
      undefined,
      id + "-returnchained",
      useExisting,
    );
  }

  private dereference<T, S extends Record<string, unknown>>(
    graph: Graph,
    node: RefNode,
    edgesIn: Edge[],
    graphId: string,
    nodeGraphId: string,
    closure: AnyNode<AnyNodeMap<S>>,
    calculateInputs: () => AnyNodeMap<S>,
    extraNodeGraphId: Output = "value",
    useExisting: boolean = true,
    refNode = node,
  ): AnyNode<T> | PromiseLike<AnyNode<T>> {
    return wrapPromise(this.store.refs.get(refNode.ref) as Graph, (e) =>
      handleError(e, nodeGraphId),
    ).then((nodeRef): AnyNode<T> => {
      const outputNodeGraphId = appendGraphId(nodeGraphId, extraNodeGraphId);
      if (nodeRef === undefined) {
        throw new Error(`invalid node ref ${refNode.ref}`);
      }
      if (refNode.ref === "@js.script") {
        if (extraNodeGraphId === "metadata") {
          return this.constNode({
            dataLabel: "script",
            codeEditor: { language: "javascript", editorText: node.value },
          } as T, outputNodeGraphId, useExisting );
        } else if (extraNodeGraphId === "display") {
          return this.constNode({ dom_type: "text_value", text: "" } as T, outputNodeGraphId, useExisting);
        }

        let scriptFn;
        try {
          scriptFn = new Function(
            "_lib",
            "_node",
            "_node_args",
            "wrapPromise",
            ...edgesIn.map((e) => e.as),
            refNode.value,
          ) as (...args: any[]) => any;
        } catch (e) {
          handleError(e, nodeGraphId);
          if(this.scope.has(outputNodeGraphId)) return this.scope.get(outputNodeGraphId) as AnyNode<T>
          scriptFn = () => {};
        }

        return this.mapNode(
          calculateInputs(),
          (args) => {
            try {
              return scriptFn(
                this.lib,
                node,
                args,
                wrapPromise,
                ...Object.values(args),
              );
            } catch (e) {
              handleError(e, nodeGraphId);
            }
          },
          undefined,
          outputNodeGraphId,
          useExisting,
        );
      } else if (refNode.ref === "return") {
        if (
          extraNodeGraphId === "metadata" &&
          (node.id !== (graph.out ?? "out") ||
            nodeGraphId === appendGraphId(graph.id, node.id))
        ) {
          return this.constNode(
            {
              parameters: {
                value: {
                  type: "any",
                  default: true,
                },
                display: {
                  type: {
                    background: "@html.html_element",
                    resultPanel: "@html.html_element",
                  },
                },
                subscribe: "any",
                dependencies: "any",
                metadata: {
                  type: {
                    parameters: (graph: Graph, nodeId: string) => ({
                      type: Object.fromEntries(
                        Object.values(ancestor_graph(nodeId, graph).nodes)
                          .filter(
                            (n) =>
                              isNodeRef(n) &&
                              n.ref === "arg" &&
                              n.value &&
                              !n.value.startsWith("_"),
                          )
                          .map((n) => [
                            n.value.includes(".")
                              ? n.value.split(".")[0]
                              : n.value,
                            "any",
                          ]),
                      ),
                    }),
                    values: "any",
                    dataLabel: "any",
                    language: "any",
                  },
                },
                args: "any",
                lib: "any",
                _output: "string",
                _lib: "any",
                _runoptions: "any",
                __graphid: "string",
              },
            },
            nodeGraphId + extraNodeGraphId,
            useExisting,
          ) as AnyNode<T>;
        }

        if(!edgesIn.find(e => e.as === extraNodeGraphId || (extraNodeGraphId === "value" && e.as === "display"))) {
          return this.constNode(undefined, appendGraphId(nodeGraphId, extraNodeGraphId), useExisting)
        }

        const libNode =
          edgesIn.find((e) => e.as === "lib") &&
          (this.scope.get(nodeGraphId + "-libnode") ??
            this.mapNode(
              {
                lib: this.valueMap(
                  this.fromNodeInternal(
                    graph,
                    edgesIn.find((e) => e.as === "lib").from,
                    graphId,
                    this.constNode({}, nodeGraphId + "-libnodeclosure"),
                    useExisting,
                  ),
                  nodeGraphId + "-libvalmap",
                  useExisting,
                ),
              },
              ({ lib }) => Object.assign(this.lib, lib),
              () => false,
              nodeGraphId + "-libnode",
              useExisting,
            ));

        const argsEdge = edgesIn.find((e) => e.as === "args");
        const chainedscope: AnyNode<AnyNodeMap<S>> = argsEdge
          ? this.mergeClosure(
              closure,
              this.valueMap(
                this.fromNodeInternal(
                  graph,
                  argsEdge.from,
                  graphId,
                  closure,
                  useExisting,
                ),
                nodeGraphId + "-argsvalmap",
                useExisting,
              ),
              nodeGraphId + "-returnchained",
              useExisting,
            )
          : closure;

        const inputs = Object.fromEntries(
          edgesIn
            .filter(
              (e) =>
                e.as !== "args" &&
                e.as !== "subscribe" &&
                e.as !== "dependencies",
            )
            .map((e) => [
              e.as,
              this.valueMap(
                this.fromNodeInternal(
                  graph,
                  e.from,
                  graphId,
                  chainedscope,
                  true,
                ),
                nodeGraphId + `-inputsvalmap-${e.as}-${extraNodeGraphId}`,
                useExisting,
              ),
            ]),
        );

        const subscribechainedscope: AnyNode<AnyNodeMap<S>> = argsEdge
          ? this.mergeClosure(
              closure,
              this.valueMap(
                this.fromNodeInternal(
                  graph,
                  argsEdge.from,
                  graphId,
                  closure,
                  true,
                ),
                nodeGraphId + "-subargsvalmap",
                useExisting,
              ),
              nodeGraphId + "-subscribereturnchained",
              useExisting,
            )
          : closure;

        const subscribeEdge = edgesIn.find((e) => e.as === "subscribe");
        const subscribe =
          subscribeEdge &&
          this.valueMap(
            this.fromNodeInternal(
              graph,
              subscribeEdge.from,
              graphId,
              subscribechainedscope,
              useExisting,
            ),
            nodeGraphId + "-subvalmap",
            useExisting,
          );

        const resultNode =
          inputs[extraNodeGraphId] ??
          (extraNodeGraphId === "value" && inputs["display"]);

        const dependenciesEdge =
          resultNode &&
          edgesIn.find((e) => e.as === "dependencies");
        const dependencies =
          dependenciesEdge &&
            this.valueMap(
                this.fromNodeInternal(
                  graph,
                  dependenciesEdge.from,
                  graphId,
                  chainedscope,
                  true,
                ),
                nodeGraphId + `-depsval-${extraNodeGraphId}`,
                useExisting,
            );

        const output = dependencies
          ? (this.mapNode(
              {
                dependencies,
                subscribe,
                libNode,
              },
              ({ subscribe: subscriptions }) => {
                subscriptions &&
                  Object.entries(subscriptions).forEach(
                    (kv) =>
                      kv[1] &&
                      nolib.no.runtime.addListener(
                        kv[0],
                        this.id + nodeGraphId,
                        (payload) => {
                          if (this.running.size > 0)
                            this.eventQueue.push(() => kv[1](payload));
                          else kv[1](payload);
                        },
                        false,
                        graphId,
                        true,
                        nolibLib,
                      ),
                  );
                return resultNode && wrapPromise(this.runNode(resultNode)).value;
              },
              ({ dependencies: previous }, { dependencies: next }) =>
                (isNothingOrUndefined(previous) &&
                  isNothingOrUndefined(next)) ||
                  !compareObjects(previous, next),
              nodeGraphId + extraNodeGraphId,
              useExisting,
            ) as AnyNode<T>)
          : (this.mapNode(
              {
                result: resultNode,
                subscribe,
                libNode
              },
            ({ subscribe: subscriptions, result }) => {
              subscriptions &&
                  Object.entries(subscriptions).forEach(
                    (kv) =>
                      kv[1] &&
                      nolib.no.runtime.addListener(
                        kv[0],
                        this.id + nodeGraphId,
                        (payload) => {
                          if (this.running.size > 0)
                            this.eventQueue.push(() => kv[1](payload));
                          else kv[1](payload);
                        },
                        false,
                        graphId,
                        true,
                        nolibLib,
                      ),
                  );
                return result;
              },
              undefined,
              nodeGraphId + extraNodeGraphId,
              useExisting,
            ) as AnyNode<T>);

        return output;
        // return wrapPromise(
        //   this.scope.get(nodeGraphId + "-libvalmap")?.value.read() ??
        //     edgesIn.find((e) => e.as === "lib")
        //     ? this.runNode(libNode)
        //     : undefined,
        // ).then(() => output).value;
      } else if (refNode.ref === "extern") {
        if (refNode.value === "extern.switch") {
          const outputNodeGraphId = appendGraphId(nodeGraphId, graphId);

          if(extraNodeGraphId === "display") {
          return this.constNode({ dom_type: "text_value", text: "" } as T, outputNodeGraphId, useExisting);
          } else if (extraNodeGraphId === "metadata") {
            return this.constNode({ dom_type: "text_value", text: "" } as T, outputNodeGraphId, useExisting)
          }

          const inputEdge = edgesIn.find((e) => e.as === "input");
          return inputEdge
            ? (this.switchNode(
                this.valueMap(
                  this.fromNodeInternal(
                    graph,
                    inputEdge.from,
                    graphId,
                    closure,
                    useExisting,
                  ),
                  nodeGraphId + "-predvalmap",
                  useExisting,
                ),
                Object.fromEntries(
                  edgesIn
                    .filter((e) => e.as !== "input")
                    .map(
                      (e) => [
                        e.as,
                        this.valueMap(
                          this.fromNodeInternal(
                            graph,
                            e.from,
                            graphId,
                            closure,
                            useExisting,
                          ),
                          nodeGraphId + `-switchvalmap${e.as}`,
                          useExisting,
                        ),
                      ],
                      useExisting,
                    ),
                ),
                nodeGraphId,
                useExisting,
              ) as AnyNode<T>)
            : this.constNode(undefined, nodeGraphId, false);
        } else if (refNode.value === "extern.runnable") {
          if (extraNodeGraphId === "metadata") {
            return this.constNode(
              {
                parameters: {
                  fn: "any",
                  parameters: "any",
                },
              },
              nodeGraphId + extraNodeGraphId,
              useExisting,
            ) as AnyNode<T>;
          }
          const fnArgs = this.varNode<Record<string, unknown>>(
            {},
            undefined,
            nodeGraphId + "-fnargs",
            useExisting,
            false,
          );

          const chainedClosure = this.mergeClosure(
            closure,
            fnArgs,
            nodeGraphId + "-runnablechained",
            useExisting,
          );

          const parametersEdge = edgesIn.find((e) => e.as === "parameters");
          const parameters =
            parametersEdge &&
            this.valueMap(
              this.fromNodeInternal(
                graph,
                parametersEdge.from,
                graphId,
                closure,
                useExisting,
              ),
              nodeGraphId + "-parametersvalmap",
              useExisting,
            );

          const fnEdgeId = edgesIn.find((e) => e.as === "fn")?.from;
          const fnNode =
            fnEdgeId &&
            this.valueMap(
              this.fromNodeInternal(
                graph,
                fnEdgeId,
                graphId,
                chainedClosure,
                useExisting,
              ),
              nodeGraphId + "-fnnodevalmap",
              useExisting,
            );
          //
          return this.mapNode(
            {
              parameters,
              fnNode:
                fnNode &&
                this.bindNode(
                  {},
                  () => fnNode,
                  undefined,
                  nodeGraphId + "-fnNodebindnode",
                  useExisting,
                ),
            },
            ({ parameters, fnNode }) =>
              ((args) => {
                if (!fnNode) return;
                this.dirty(fnArgs.id, fnNode.id);
                if (parameters) {
                  const keys = new Set(Object.keys(parameters));
                  (this.scope.get(fnArgs.id) as typeof fnArgs).set(
                    Object.fromEntries(
                      Object.entries(args).filter((e) => keys.has(e[0])),
                    ),
                  );
                } else {
                  (this.scope.get(fnArgs.id) as typeof fnArgs).set({});
                }
                return this.runNode(fnNode);
              }) as T,
            undefined,
            nodeGraphId,
            useExisting,
          );
        } else if (refNode.value === "extern.map") {
          if (extraNodeGraphId === "metadata") {
            return this.constNode(
              {
                parameters: {
                  fn: "@flow.runnable",
                  array: "any: default",
                },
              },
              nodeGraphId + extraNodeGraphId,
              useExisting,
            ) as AnyNode<T>;
          }
          return this.mapNode(
            calculateInputs() as {
              fn: AnyNode<
                (mapArgs: { element: unknown; index: number }) => unknown
              >;
              array: AnyNode<Array<unknown>>;
            },
            ({ fn, array }) =>
              wrapPromiseAll(
                (ArrayBuffer.isView(array)
                  ? Array.from(array)
                  : Array.isArray(array)
                    ? array
                    : Object.entries(array)
                ).map((element, index) => fn({ element, index })),
              ),
            undefined,
            nodeGraphId,
            useExisting,
          ) as AnyNode<T>;
        } else if (refNode.value === "extern.fold") {
          return this.mapNode(
            calculateInputs() as {
              fn: AnyNode<
                (mapArgs: {
                  previousValue: T;
                  currentValue: unknown;
                  index: number;
                }) => T
              >;
              object: AnyNode<Array<unknown>>;
              initial: AnyNode<T>;
            },
            ({ fn, object, initial }) =>
              object === undefined
                ? object
                : wrapPromiseReduce(
                    initial,
                    Array.isArray(object) ? object : Object.entries(object),
                    fn,
                    0,
                  ),
            undefined,
            nodeGraphId,
            useExisting,
          ) as AnyNode<T>;
        } else if (refNode.value === "extern.ap") {
          if (extraNodeGraphId === "metadata") {
            return this.constNode(
              {
                parameters: {
                  fn: "any",
                  args: "any",
                  run: "any",
                  isScope: "any",
                },
              },
              nodeGraphId + extraNodeGraphId,
              useExisting,
            ) as AnyNode<T>;
          }
          const fnEdge = edgesIn.find((e) => e.as === "fn");
          if (!fnEdge) {
            return this.constNode(undefined, nodeGraphId, useExisting);
          }
          const fn: AnyNode<Array<(mapArgs: Record<string, unknown>) => T>> =
            this.valueMap(
              this.fromNodeInternal(
                graph,
                fnEdge.from,
                graphId,
                closure,
                useExisting,
              ),
              nodeGraphId + "-fnvalmap",
              useExisting,
            );
          const runEdge = edgesIn.find((e) => e.as === "run");
          const run: AnyNode<boolean> =
            runEdge &&
            this.valueMap(
              this.fromNodeInternal(
                graph,
                runEdge.from,
                graphId,
                closure,
                useExisting,
              ),
              nodeGraphId + "-runvalmap",
              useExisting,
            );
          const isScopeEdge = edgesIn.find((e) => e.as === "isScope");
          const isScope =
            isScopeEdge &&
            this.valueMap(
              this.fromNodeInternal(
                graph,
                isScopeEdge.from,
                graphId,
                closure,
                useExisting,
              ),
              nodeGraphId + "-isscopevalmap",
              useExisting,
            );
          const apArgs = this.varNode<Record<string, unknown>>(
            {},
            undefined,
            nodeGraphId + "-apapargs",
            useExisting,
          );
          const chainedClosure = this.mergeClosure(
            closure,
            apArgs,
            nodeGraphId + "-apchained",
            useExisting,
          );
          const argsEdge = edgesIn.find((e) => e.as === "args")?.from;
          const argsNode = argsEdge
            ? this.mapNode(
                {
                  argsNode: this.valueMap(
                    this.fromNodeInternal(
                      graph,
                      argsEdge,
                      graphId,
                      chainedClosure,
                      useExisting,
                    ),
                    nodeGraphId + "-argsvalmap",
                    useExisting,
                  ) as AnyNode<Record<string, unknown>>,
                },
                ({ argsNode }) => argsNode,
                undefined,
                nodeGraphId + "-apargs",
                useExisting,
              )
            : this.mapNode(
                { chainedClosure },
                ({ chainedClosure }) =>
                  Object.fromEntries(
                    Object.entries(chainedClosure).map((e) => [
                      e[0],
                      e[1].value.read(),
                    ]),
                  ),
                undefined,
                nodeGraphId + "-apargs",
                useExisting,
              );

          return this.mapNode(
            {
              fn,
              run,
              isScope,
              argsNode: this.bindNode(
                {},
                () => argsNode,
                undefined,
                nodeGraphId + "-argsnodebind",
                useExisting,
              ),
            },
            ({ fn, run, argsNode, isScope }) => {
              if (run) {
                return wrapPromise(this.runNode(argsNode))
                  .then((args) =>
                    (Array.isArray(fn) ? fn : [fn])
                      .filter((f) => typeof f === "function")
                      .map((ffn) => ffn(args)),
                  )
                  .then((results) => (Array.isArray(fn) ? results : results[0]))
                  .value;
              } else if (isScope) {
                return wrapPromise(this.runNode(argsNode)).then(
                  (scopeArgs) => (args) => {
                    const argsWithScopedArgs = { ...args, ...scopeArgs };
                    return wrapPromiseAll(
                      (Array.isArray(fn) ? fn : [fn])
                        .filter((f) => typeof f === "function")
                        .map((ffn) => ffn(argsWithScopedArgs)),
                    ).then((results) =>
                      Array.isArray(fn) ? results : results[0],
                    ).value;
                  },
                ).value;
              } else {
                return (args) => {
                  const runtimeApArgs = this.scope.get(
                    apArgs.id,
                  ) as VarNode<any>;
                  runtimeApArgs.set(args);
                  return wrapPromise(
                    this.runNode(argsNode) as Record<string, unknown>,
                  )
                    .then((args) =>
                      (Array.isArray(fn) ? fn : [fn])
                        .filter((f) => typeof f === "function")
                        .map((ffn) => ffn(args)),
                    )
                    .then((results) =>
                      Array.isArray(fn) ? results : results[0],
                    ).value;
                };
              }
            },
            undefined,
            nodeGraphId,
            useExisting,
          ) as AnyNode<T>;
        } else if (
          refNode.value === "extern.reference" ||
          refNode.value === "extern.state"
        ) {
          if (extraNodeGraphId === "metadata") {
            return this.constNode(
              {
                parameters: {
                  initial: "any",
                  persist: "any",
                  publish: "any",
                  listener: "any",
                  share: "any",
                },
              },
              nodeGraphId + extraNodeGraphId,
              useExisting,
            ) as AnyNode<T>;
          }
          const initialNode =
            edgesIn.find((e) => e.as === "initial" || e.as === "value")?.from &&
            this.valueMap(
              this.fromNodeInternal(
                graph,
                edgesIn.find((e) => e.as === "initial" || e.as === "value")
                  .from,
                graphId,
                closure,
                useExisting,
              ),
              nodeGraphId + "-initialvalmap",
              useExisting,
            );

          const persistEdge = edgesIn.find((e) => e.as === "persist");
          const persistNode =
            persistEdge &&
            this.valueMap(
              this.fromNodeInternal(
                graph,
                persistEdge.from,
                graphId,
                closure,
                useExisting,
              ),
              nodeGraphId + "valmappersist",
              useExisting,
            );
          const publishEdge = edgesIn.find((e) => e.as === "publish");
          const publishNode =
            publishEdge &&
            this.valueMap(
              this.fromNodeInternal(
                graph,
                publishEdge.from,
                graphId,
                closure,
                useExisting,
              ),
              nodeGraphId + "valmappublish",
              useExisting,
            );
          const listenerEdge = edgesIn.find((e) => e.as === "listener");
          const listenerNode =
            listenerEdge &&
            (this.valueMap(
              this.fromNodeInternal(
                graph,
                listenerEdge.from,
                graphId,
                closure,
                useExisting,
              ),
              nodeGraphId + "valmaplistener",
              useExisting,
            ) as AnyNode<Function>);

          const shareEdge = edgesIn.find((e) => e.as === "share");
          const shareNode =
            shareEdge &&
            this.valueMap(
              this.fromNodeInternal(
                graph,
                shareEdge.from,
                graphId,
                closure,
                useExisting,
              ),
              nodeGraphId + "valmapshare",
              useExisting,
            );

          this.varNode<T>(
            undefined,
            undefined,
            nodeGraphId + "-refset",
            true,
          );

          const scope = this.scope;

          return this.mapNode(
            {
              persistNode,
              publishNode,
              listenerNode,
              shareNode,
            },
            ({
              persistNode: persist,
              publishNode: publish,
              listenerNode: listener,
              shareNode: share,
            }) =>
              wrapPromise(persist && this.store.persist.get(nodeGraphId))
                .then(
                  (persisted) =>
                    persisted ??
                    wrapPromise(initialNode && this.runNode(initialNode)),
                )
                .then((initial) => {
                  const setNode = scope.get(nodeGraphId + "-refset");
                  const stateId = share ? "__shared_" + share : nodeGraphId;
                  if (
                    share &&
                    this.store.state.get(stateId)?.value !== undefined
                  ) {
                    setNode.value.write(this.store.state.get(stateId)?.value);
                  } else if (initial !== undefined) {
                    setNode.value.write(initial);
                    this.store.state.set(stateId, { value: initial });
                    if (listener) listener({ value: initial });
                  }

                  if (publish || share) {
                    nolib.no.runtime.addListener(
                      "argsupdate",
                      this.id + "-" + stateId,
                      ({ id, changes, source }) => {
                        if (publish && id === nodeGraphId) {
                          if (listener) listener({ value: changes.state });
                          if (
                            !(
                              source.type === "var" &&
                              source.clientId === clientId &&
                              source.id === this.id
                            )
                          ) {
                            (
                              scope.get(nodeGraphId + "-refset") as VarNode<T>
                            ).set(changes.state);
                            if (persist) {
                              this.store.persist.set(
                                nodeGraphId,
                                changes.state,
                              );
                            }
                          }
                        }
                        else if(share && id !== nodeGraphId) {
                          if (listener) listener({ value: changes.state });
                            (
                              scope.get(nodeGraphId + "-refset") as VarNode<T>
                            ).set(changes.state);
                            if (persist) {
                              this.store.persist.set(
                                nodeGraphId,
                                changes.state,
                              );
                            }
                        }
                      },
                    );
                  }
                  const runtime = this;
                  return extraNodeGraphId === "display"
                    ? {
                        dom_type: "div",
                        props: {},
                        children: [
                          {
                            dom_type: "text_value",
                            text: JSON.stringify(
                              setNode.value.read() && setNode.value.read(),
                            ),
                          },
                        ],
                      }
                    : {
                        __kind: "varNode",
                        id: nodeGraphId,
                        get value() {
                          if (
                            share &&
                            setNode.value.read() !==
                              runtime.store.state.get(stateId)?.value
                          ) {
                            setNode.value.write(
                              runtime.store.state.get(stateId)?.value,
                            );
                          }
                          return setNode as VarNode<T>;
                        },
                        set: (t: { value: T } | T) => {
                          if (
                            (t as { value: T })?.value !== undefined ||
                            t !== undefined
                          ) {
                            const setNode = scope.get(nodeGraphId + "-refset");
                            const value: T =
                              typeof t === "object" && Object.hasOwn(t, "value")
                                ? (t as { value: T }).value
                                : (t as T);
                            (setNode as VarNode<T>).set(value);
                            if (share) {
                              runtime.store.state.set(stateId, { value });
                            }
                            if (persist) {
                              runtime.store.persist.set(nodeGraphId, value);
                            }
                            if (publish) {
                              nolib.no.runtime.publish(
                                "argsupdate",
                                {
                                  id: nodeGraphId,
                                  changes: { state: value },
                                  mutate: false,
                                  source: {
                                    id: this.id,
                                    clientId,
                                    type: "var",
                                  },
                                },
                                nolibLib,
                                {},
                                true,
                              );
                            }
                            return value;
                          }

                          return scope
                            .get(nodeGraphId + "-refset")
                            .value.read();
                        },
                      };
                }).value,
            () => false,
            nodeGraphId + extraNodeGraphId,
            useExisting,
          ) as AnyNode<T>;
        } else if (
          refNode.value === "extern.readReference" ||
          refNode.value === "extern.memoryUnwrap"
        ) {
          if (extraNodeGraphId === "metadata") {
            return this.constNode(
              {
                parameters: {
                  reference: {
                    type: "arg",
                    default: true
                  },
                },
              },
              nodeGraphId + extraNodeGraphId,
              useExisting,
            ) as AnyNode<T>;
          }
          return this.mapNode(
            {
              ref: this.bindNode(
                { reference: calculateInputs()["reference"] },
                ({ reference }) => (reference as { value: AnyNode<T> })?.value,
                undefined,
                nodeGraphId + "-bindreadref",
                useExisting,
              ),
            },
            ({ ref }) => {
              const result = this.runNode(ref) as T;
              if ((result as Nothing)?.__kind === "nothing") return undefined;
              else return result;
            },
            undefined,
            nodeGraphId,
            useExisting,
          );
        } else if (refNode.value === "extern.cache") {
          const value = edgesIn.find((e) => e.as === "value")?.from
            ? this.valueMap(
                this.fromNodeInternal(
                  graph,
                  edgesIn.find((e) => e.as === "value").from,
                  graphId,
                  closure,
                  useExisting,
                ),
                nodeGraphId + "-valvalmap",
                useExisting,
              )
            : this.constNode(undefined, nodeGraphId + "-stateconst", false);

          const recache = edgesIn.find((e) => e.as === "recache")?.from
            ? this.valueMap(
                this.fromNodeInternal(
                  graph,
                  edgesIn.find((e) => e.as === "recache").from,
                  graphId,
                  closure,
                  useExisting,
                ),
                nodeGraphId + "-recachevalmap",
                useExisting,
              )
            : this.constNode<false>(
                false,
                nodeGraphId + "-stateconst",
                useExisting,
              );

          const outNode = this.mapNode(
            {
              recache,
              value: this.bindNode(
                { value },
                () => value,
                undefined,
                nodeGraphId + "-value",
                useExisting,
              ),
            },
            ({ value }) => wrapPromise(this.runNode(value)).value,
            ({ recache: r1, value: previous }, { recache, value: next }) =>
              !!recache ||
              isNothing(outNode.value.read()) ||
              outNode.value.read() === undefined,
            nodeGraphId + extraNodeGraphId,
          );
          return outNode;
        } else if (refNode.value === "extern.frame") {
          const varNode: VarNode<T> = this.varNode(
            1 as T,
            undefined,
            nodeGraphId,
            useExisting,
          );
          const update = () => {
            varNode.set(((varNode.value.read() as number) + 1) as T);
            if (this.scope.get(nodeGraphId) === varNode) {
              requestAnimationFrame(update);
            }
          };
          requestAnimationFrame(update);
          return varNode;
        } else if (refNode.value === "extern.time") {
          const varNode: VarNode<T> = this.varNode(
            1 as T,
            undefined,
            nodeGraphId,
            useExisting,
          );
          const update = (time) => {
            varNode.set((time * 0.001 * ((node.value as unknown as number) ?? 1)) as T);
            if (this.scope.get(nodeGraphId) === varNode) {
              requestAnimationFrame(update);
            }
          };
          requestAnimationFrame(update);
          return varNode;
        } else if (refNode.value === "extern.runNode") {
          const nodeNode = this.valueMap(
            this.fromNodeInternal(
              graph,
              edgesIn.find((e) => e.as === "node").from,
              graphId,
              closure,
              useExisting,
            ),
            nodeGraphId + "-nodenode",
            useExisting,
          ) as AnyNode<AnyNode<T>>;
          return this.runNodeNode(nodeNode, nodeGraphId, useExisting);
        } else if (refNode.value === "extern.nodeDisplay") {
          return wrapPromise(
            this.fromNodeInternal(graph, node.value, graphId, closure, true),
            (e) => {
              console.error("error in nodeDisplay", e);
              handleError(e, nodeGraphId);
            },
          ).then((targetNode) =>
            this.accessor(
              targetNode,
              "display",
              nodeGraphId + "-accessnodedisplay",
              useExisting,
            ),
          ).value as AnyNode<T>;
        } else if (refNode.value === "extern.workerRunnable") {
          return this.constNode(
            {
              graph: graph.id,
              fn: edgesIn.find((e) => e.as === "graph").from,
              nodeGraphId: appendGraphId(
                graph.id,
                edgesIn.find((e) => e.as === "graph").from,
              ),
            },
            nodeGraphId,
            useExisting,
          ) as AnyNode<T>;
        } else if (refNode.value === "extern.create_fn") {
          const idEdge = edgesIn.find(
            (e) => e.as === "function" || e.as === "runnable" || e.as === "fn",
          );
          const fnNode = this.fromNodeInternal(
            graph,
            idEdge.from,
            graphId,
            closure,
            useExisting,
          );
          return this.runNodeNode(
            this.bindNode(
              { closure, fn: fnNode },
              ({ closure, fn }) =>
                this.mapNode(
                  { ...closure },
                  (closure) =>
                    create_fn(
                      graph,
                      idEdge.from,
                      nodeGraphId,
                      closure,
                      this.lib,
                    ),
                  undefined,
                  appendGraphId(nodeGraphId, "-generatedFn"),
                  useExisting,
                ) as AnyNode<T>,
              undefined,
              appendGraphId(nodeGraphId, "-bindclosure"),
              useExisting,
            ),
            nodeGraphId,
            useExisting,
          ) as AnyNode<T>;
        } else if (refNode.value === "extern.html_element") {
          if (extraNodeGraphId === "metadata" && this.lib.domTypes) {
            const el = this.lib.domTypes[node.value ?? "div"];
            const defaultAttrs = this.lib.domTypes.defaults;
            return this.constNode<T>(
              {
                values: Object.keys(this.lib.domTypes).filter(
                  (k) => k !== "defaults",
                ),
                parameters: {
                  children: "@html.html_element",
                  props: {
                    type:
                      el?.attrs &&
                      Object.fromEntries(
                        el.attrs
                          .concat(defaultAttrs[el.spec])
                          .map((n) => (Array.isArray(n) ? n : [n, "any"]))
                          .concat([
                            [
                              "style",
                              {
                                type: Object.fromEntries(
                                  defaultAttrs["css"].map((a) =>
                                    Array.isArray(a) ? a : [a, "any"],
                                  ),
                                ),
                              },
                            ],
                          ])
                          .concat([
                            [
                              "onref",
                              {
                                type: "@flow.runnable",
                                runnableParameters: ["ref"],
                              },
                            ],
                          ]),
                      ),
                  },
                },
              } as T,
              nodeGraphId + extraNodeGraphId,
              useExisting,
            );
          }
          return this.mapNode(
            calculateInputs(),
            (el) => {
              const { dom_type, children, props, value } =
                el as unknown as GenericHTMLElement;
              return {
                dom_type: dom_type ?? node.value ?? "div",
                children: (Array.isArray(children) ? children : [children])
                  .filter((v) => v)
                  .map((child) =>
                    typeof child === "string"
                      ? { dom_type: "text_value", text: child }
                      : child,
                  ),
                props: props ?? {},
                value,
                ref:
                  typeof props?.onref === "function"
                    ? (ref) => props.onref({ ref })
                    : undefined,
              } as T;
            },
            undefined,
            nodeGraphId + extraNodeGraphId,
            useExisting,
          );
        } else {
          if (extraNodeGraphId === "metadata") {
            const libExternFn =
              refNode.value.startsWith("extern.") && refNode.value.substring(7);
            const extern = libExternFn
              ? this.lib.extern[libExternFn]
              : get(this.lib, refNode.value);
            return this.constNode(
              {
                parameters: Array.isArray(extern?.args)
                  ? Object.fromEntries(extern.args.map((v) => [v, "any"]))
                  : extern?.args,
              },
              nodeGraphId + extraNodeGraphId,
              useExisting,
            ) as AnyNode<T>;
          }
          const inputs = calculateInputs();
          const systemValues = this.accessor(closure, "__parent_graph_value", appendGraphId(nodeGraphId, "-extern-system-values"), useExisting);
          return this.mapNode(
            { ...inputs, systemValues },
            (nodeArgs) =>
              wrapPromise(
                node_extern(
                  refNode,
                  new Map(
                    Object.entries(nodeArgs)
                      .concat([["__graph_value", nodeArgs.systemValues ]])
                  ),
                  newLib(this.lib),
                  {},
                ),
              ).value,
            undefined,
            nodeGraphId + extraNodeGraphId,
            useExisting,
          );
        }
      } else if (refNode.ref === "arg") {
        const argname = refNode.value && parseArg(refNode.value).name;
        const isAccessor = argname?.includes(".");
        const libNode = this.constNode(this.lib, "runtime-lib", true);
        const graphIdNode = this.constNode(
          graphId,
          `${nodeGraphId}-internalnodegraphid`,
          false,
        );
        if (extraNodeGraphId === "metadata") {
          const keys = ["__graph_value"];
          const edgeChain = [];
          const walkEdges = (edges: Edge[], ty: any) => {
            return !ty || edges.length === 0 || ty.type === "@flow.runnable"
              ? ty
              : walkEdges(
                  edges.slice(1),
                  typeof ty.type === "object"
                    ? ty.type[edges[0].as]
                    : ty[edges[0].as],
                );
          };
          const descGraph = descendantGraph(node.id, graph, (nodeId, edge) => {
            edgeChain.push(edge);
            const outEdgeChain = [...edgeChain];
            outEdgeChain.reverse();
            const descNode = graph.nodes[nodeId];
            const dataNode =
              nodeId &&
              isNodeRef(descNode) &&
              descNode.ref === "return" &&
              edge.as !== "lib" &&
              edge.as !== "args"
                ? graph.nodes[
                    nodeEdgesIn(graph, nodeId).find((e) => e.as === "args")
                      ?.from
                  ]
                : nodeId &&
                    isNodeRef(descNode) &&
                    descNode.ref === "@flow.runnable"
                  ? graph.nodes[
                      nodeEdgesIn(graph, nodeId).find(
                        (e) => e.as === "parameters",
                      )?.from
                    ]
                  : false;

            if (dataNode) {
              if (
                (nodeEdgesIn(graph, nodeId) &&
                  !(isNodeRef(dataNode) && dataNode.value === undefined)) ||
                (isNodeRef(dataNode) &&
                  ((dataNode.ref === "extern" &&
                    dataNode.value === "extern.data") ||
                    dataNode.ref === "@data.object"))
              ) {
                nodeEdgesIn(graph, nodeId)
                  .map((e) => e.as)
                  .forEach((k) => keys.push(k));
              }
            }
            return outEdgeChain;
          });

          return this.mapNode(
            Object.fromEntries(
              Object.entries(descGraph)
                .filter((e) => e[1])
                .map((e) =>
                  // all descendants will have been created already
                  [
                    e[0],
                    this.accessor(
                      this.fromNode(graph, e[0]) as NodeOutputsU,
                      "metadata",
                      nodeGraphId + e[0] + "-metadata",
                      true,
                    ),
                  ],
                ),
            ),
            (metadatas) => {
              // have to reduce to get all the inedge stuff
              return {
                values: Object.entries(metadatas)
                  .map((metadataEntry) => {
                    const inEdge = descGraph[metadataEntry[0]][0];
                    const inEdgeType = walkEdges(
                      descGraph[metadataEntry[0]],
                      (metadataEntry[1] as any)?.parameters,
                    );
                    return (
                      (inEdgeType?.type === "@flow.runnable" &&
                        inEdgeType.runnableParameters) ||
                      []
                    );
                  })
                  .filter((v) => v)
                  .flat(),
              } as T;
            },
            undefined,
            nodeGraphId + extraNodeGraphId,
            useExisting,
          );
        }
        if (!argname) {
          return this.constNode(
            undefined,
            nodeGraphId + extraNodeGraphId,
            useExisting,
          );
        }
        let isargsdata  = false;

        const mnode = this.mapNode(
          {
            bound: this.bindNode(
              { closure },
              ({ closure: innerClosure }): AnyNode<unknown> => {
                if (!argname) return;
                if (argname === "_argsdata") {
                  // Object.values(argsdata).map(argnode => argnode && this.outputs.get(argnode.id).add(mnode.id))
        return this.mapNode(
          {
            bound: this.bindNode(
              { closure },
              ({ closure: innerClosure }: { closure: AnyNodeMap<S> }) => {
                const argsdataout = 
                this.mapNode(
                  Object.fromEntries(Object.entries(innerClosure).filter(kv => !kv[0].startsWith("_"))),
                  (innerInnerClosure) => innerInnerClosure as S[keyof S],
                  undefined,
                  nodeGraphId + "-argsdatamap",
                  useExisting,
                )
                return argsdataout
              },
              undefined,
              nodeGraphId + "-argsdata",
              useExisting,
            ),
          },
          ({ bound }) => this.runNode(bound),
          undefined,
          nodeGraphId + "-argsdataouterbind",
          useExisting,
        );
                }

                return argname === "_args"
                    ? closure
                    : argname.startsWith("_lib")
                      ? libNode
                      : argname === "__graphid"
                        ? graphIdNode
                        : isAccessor
                          ? innerClosure[
                              argname.substring(0, argname.indexOf("."))
                            ]
                          : innerClosure[argname];
              },
              undefined,
              nodeGraphId + "-bind",
              useExisting,
            ),
          },
          ({ bound }) => {
            return wrapPromise(this.runNode(bound)).then(
              (res) =>
                (res !== undefined && !isNothing(res)
                  ? isAccessor
                    ? get(res, argname.substring(argname.indexOf(".") + 1))
                    : res
                  : undefined) as T,
            ).value;
          },
          undefined,
          nodeGraphId,
          useExisting,
        );

        return mnode;
      } else if (isGraph(nodeRef)) {
        const inputs = calculateInputs();
        const innerGraphNode = this.accessor(
          this.fromNodeInternal(
            nodeRef,
            nodeRef.out ?? "out",
            nodeGraphId,
            this.constNode(
              {
                ...inputs,
                __graph_value: this.accessor(
                  closure,
                  "__parent_graph_value",
                  `${nodeGraphId}-internalnodegraphvalue`,
                  false,
                ),
              },
              nodeGraphId + "-args",
              false,
            ),
            false,
          ),
          extraNodeGraphId,
          nodeGraphId + "-innergraphnodeval",
          useExisting,
        );

        const res = this.mapNode(
          {
            bound: this.bindNode(
              {},
              () => innerGraphNode,
              undefined,
              nodeGraphId + extraNodeGraphId + "-graphoutbind",
              useExisting,
            ),
          },
          ({ bound }) => this.runNode(bound) as T,
          undefined,
          nodeGraphId + extraNodeGraphId,
          useExisting,
        );
        return res;
      } else {
        return this.dereference(
          graph,
          node,
          edgesIn,
          graphId,
          nodeGraphId,
          closure,
          calculateInputs,
          extraNodeGraphId,
          useExisting,
          nodeRef,
        ) as AnyNode<T>;
      }
    }).value;
  }

  private fromNodeInternal<T, D, M, S extends Record<string, unknown>>(
    graph: Graph,
    nodeId: string,
    graphId: string,
    inputClosure?: AnyNode<AnyNodeMap<S>>,
    useExisting: boolean = true,
  ): NodeOutputs<T, D, M> {
    const node = graph.nodes[nodeId];
    const nodeGraphId = appendGraphId(graphId, nodeId);
    if (useExisting && this.scope.has(nodeGraphId + "-boundNode"))
      return this.scope.get(nodeGraphId + "-boundNode") as NodeOutputs<T, D, M>;
    const staticGraphId = graph.id;

    const compareGraphNodes = (
      { node: nodeA, edgesIn: edgesInA, graph: graphA },
      { node: nodeB, edgesIn: edgesInB, graph: graphB },
    ) => {
      if (
        !nodeB ||
        !nodeA ||
        !compareObjects(nodeA, nodeB, false, NAME_FIELD) ||
        edgesInA.length !== edgesInB.length
      )
        return false;
      const sortedEdgesA = edgesInA.sort((a, b) => a.as.localeCompare(b.as));
      const sortedEdgesB = edgesInB.sort((a, b) => a.as.localeCompare(b.as));
      return sortedEdgesA.every((e, i) => compareObjects(e, sortedEdgesB[i]));
    };

    const graphNodeNode: VarNode<{
      node: NodysseusNode;
      edgesIn: Array<Edge>;
      graph: Graph;
      previous?: NodysseusNode;
    }> = this.varNode(
      {
        graph,
        node: graph.nodes[node.id],
        edgesIn: nodeEdgesIn(graph, nodeId),
      },
      compareGraphNodes,
      nodeGraphId + "-graphnode",
      true,
    );

    nolib.no.runtime.addListener(
      this.event,
      this.id + nodeGraphId + "-nodelistener",
      ({ graph }) => {
        if (graph.id === staticGraphId) {
          const oldval = graphNodeNode.value.read();
          const newval: {
            graph: Graph;
            node: NodysseusNode;
            edgesIn: Array<Edge>;
            previous?: NodysseusNode;
          } = {
            graph,
            node: graph.nodes[node.id],
            edgesIn: graph.edges_in?.[node.id]
              ? Object.values(graph.edges_in?.[node.id])
              : Object.values<Edge>(graph.edges).filter(
                  (e: Edge) => e.to === node.id,
                ),
            previous: isNothing(oldval) ? undefined : oldval.node,
          };
          graphNodeNode.set(newval);
        }
      },
    );

    const nodeValue =
      this.mapNode({graphNodeNode}, ({graphNodeNode}) => (graphNodeNode).node.value
                   , undefined, appendGraphId(nodeGraphId, "-system-values"));

    const closure = this.mapNode({inputClosure}, ({inputClosure}) => ({...inputClosure, __parent_graph_value: nodeValue}), undefined, appendGraphId(nodeGraphId, "-closure-with-system"))

    const ret: NodeOutputs<T, D, M> = this.mapNode(
      { graphNodeNode },
      ({ graphNodeNode }) => {
        // if ref has changed, remove all current graph nodes
        if (
          graphNodeNode.previous &&
            isNodeRef(graphNodeNode.previous) &&
            isNodeRef(graphNodeNode.node) &&
            graphNodeNode.node.ref !== graphNodeNode.previous?.ref &&
            this.scope.has(nodeGraphId + "value")
        ) {
          this.scope.removeAll(nodeGraphId);
        }
        return wrapPromise(
          this.calcNode(
            graphNodeNode.graph,
            graphNodeNode.node,
            graphId,
            nodeGraphId,
            closure,
            graphNodeNode.edgesIn,
            false,
          ),
        ).then(
          (value) =>
            wrapPromiseAll([
              this.calcNode(
                graphNodeNode.graph,
                graphNodeNode.node,
                graphId,
                nodeGraphId,
                closure,
                graphNodeNode.edgesIn,
                true,
                "display",
              ),
              this.calcNode(
                graphNodeNode.graph,
                graphNodeNode.node,
                graphId,
                nodeGraphId,
                closure,
                graphNodeNode.edgesIn,
                true,
                "metadata",
              ),
            ]).then(([display, metadata]) => ({
              value,
              display,
              metadata,
            })).value,
        ).value;
      },
      ({ graphNodeNode: graphNodeA }, { graphNodeNode: graphNodeB }) =>
        !compareGraphNodes(graphNodeA, graphNodeB),
      nodeGraphId + "-boundNode",
    ) as NodeOutputs<T, D, M>;

    ret.graphId = staticGraphId;
    ret.nodeId = nodeId;

    return ret;
  }

  private runNode<T>(
    innode: AnyNode<T> | Nothing,
    _output?: "display" | "value" | "metadata",
  ): T | PromiseLike<T> | Nothing {
    if (isNothing(innode)) return innode;
    const node: AnyNode<T> = this.scope.get(innode.id)! as AnyNode<T>;

    const current = node.value?.read();
    let result;
    if (
      node &&
      !isNothing(node) &&
      (isVarNode(node) ||
        isConstNode(node) ||
        !(
          node as
            | MapNode<T, Record<string, unknown>>
            | BindNode<T, Record<string, unknown>>
        ).isDirty.read())
    ) {
      result = node.value.read();
    } else if (isMapNode(node) || isBindNode(node)) {
      if (!this.running.has(node.id)) this.running.set(node.id, 0);
      this.running.set(node.id, this.running.get(node.id) + 1);

      const prev = node.cachedInputs.read();

      const inputPromises = () => {
        const updatedNode = this.scope.get(node.id) as MapNode<T, any>;

        const _inputPromises = [];
        const output = {};

        // create keys array like this and use in object instead of kv pairs for performance
        const keys = Object.keys(updatedNode.inputs);

        for (const key of keys) {
          const inputNode = this.scope.get(updatedNode.inputs[key]);
          const res = this.runNode(inputNode);
          if (inputNode) {
            _inputPromises.push(wrapPromise(res).value);
          }
        }

        return wrapPromiseAll(_inputPromises).then((ips) =>
          ips.reduce((a, v, i) => ((a[keys[i]] = v), a), {}),
        ).value;
      };

      return (
        wrapPromise(
          inputPromises(),
          (e) => (console.error(e), Object.entries(node.cachedInputs.read())),
        )
          // .then(allPromises => wrapPromiseAll(allPromises, e => (console.error(e), Object.entries(node.cachedInputs.read()))))
          .then((next) => {
            if (
              !Object.values(node.inputs).every((id) => {
                const inputNode = this.scope.get(id);
                return !(
                  (isBindNode(inputNode) || isMapNode(inputNode)) &&
                  inputNode.isDirty.read()
                );
              })
            ) {
              const result = this.runNode(innode);
              if (this.running.get(node.id) === 1) {
                this.running.delete(node.id);
                this.checkEvents();
              } else this.running.set(node.id, this.running.get(node.id) - 1);
              return result;
            }

            const updatedNode = this.scope.get(node.id) as
              | MapNode<T, any>
              | BindNode<T, any>;
            if (!updatedNode) {
              if (this.running.has(node.id)) this.running.delete(node.id);
              this.checkEvents();
              return;
            }

            if (
              isNothing(updatedNode.value.read()) ||
              isNothing(prev) ||
              updatedNode.isStale(prev, next)
            ) {
              const res = isBindNode(node)
                ? chainNothing(updatedNode.fn, (fn) =>
                    (fn as (s: any) => T)(next),
                  ) ?? nothingValue
                : chainNothing(node.fn, (fn) =>
                    chainNothing(
                      typeof fn === "function" ? fn : fn.read(),
                      (ffn) => ffn(next),
                    ),
                  );
              updatedNode.value.write(res);
              updatedNode.cachedInputs.write(next);
              return wrapPromise(res).then((r) => {
                if (isBindNode(updatedNode) && !isNothing(res) && res)
                  this.scope.add(res as AnyNode<unknown>);

                updatedNode.value.write(r as T);
                updatedNode.isDirty.write(false);

                if (this.watches.has(node.id)) {
                  this.watches
                    .get(node.id)
                    .forEach((fn) => wrapPromise(r).then(fn));
                }
                if (this.running.get(node.id) === 1) {
                  this.running.delete(node.id);
                  this.checkEvents();
                } else this.running.set(node.id, this.running.get(node.id) - 1);
                return r;
              }).value;
            }

            result = updatedNode.value.read();
            return wrapPromise(result).then((result) => {
              updatedNode.isDirty.write(false);

              if (this.running.get(node.id) === 1) {
                this.running.delete(node.id);
                this.checkEvents();
              } else this.running.set(node.id, this.running.get(node.id) - 1);

              return result;
            }).value;
          }).value
      );
    }

    if (this.watches.has(node.id) && current !== result) {
      this.watches.get(node.id).forEach((fn) => wrapPromise(result).then(fn));
    }

    return result;
  }

  public runGraphNode<T>(graph: Graph | string, node: string): T | Promise<T> {
    const current = this.scope.get(
      `${appendGraphId(
        typeof graph === "string" ? graph : graph.id,
        node,
      )}-boundNode`,
    ) as AnyNode<T>;
    if (current) return this.runNode<T>(current) as T;
    return wrapPromise(this.fromNode(graph, node)).then((nodeNode) =>
      this.runNode(nodeNode),
    ).value as Promise<T>;
  }

  public run<T>(
    node: AnyNode<T> | Promise<AnyNode<T>> | string,
    _output?: "display" | "value" | "metadata",
  ): T | Promise<T> {
    return wrapPromise(node).then((node) => {
      const nodeid = typeof node === "string" ? node : node.id;
      const resolvedNode = this.scope.get(nodeid);
      const res = resolvedNode && this.runNode(resolvedNode);

      return res && !isNothing(res) && wrapPromise(res).value;
    }).value as T | Promise<T>;
  }
}
