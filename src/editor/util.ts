import { render, createElement } from "preact";
import { signal } from "@preact/signals";

import * as ha from "hyperapp";
import justGet from "just-safe-get";
import justSet from "just-safe-set";
import {
  initStore,
  nodysseus_get,
  nolib,
  NodysseusError,
  nolibLib,
} from "../nodysseus.js";
import {
  Args,
  compareNodes,
  Edge,
  ExportedGraph,
  FullyTypedArg,
  Graph,
  isArgs,
  isExportedGraph,
  isNodeGraph,
  isNodeRef,
  isTypedArg,
  NodeArg,
  NodeMetadata,
  NodysseusNode,
  RefNode,
  TypedArg,
} from "../types.js";
import {
  base_node,
  base_graph,
  ispromise,
  wrapPromise,
  expand_node,
  contract_node,
  ancestor_graph,
  create_randid,
  compareObjects,
  newLib,
  bfs,
  mergeLib,
  wrapPromiseAll,
} from "../util.js";
import panzoom, * as pz from "panzoom";
import {
  forceSimulation,
  forceManyBody,
  forceCenter,
  forceLink,
  forceRadial,
  forceX,
  forceY,
  forceCollide,
} from "d3-force";
import {
  d3Link,
  d3Node,
  d3NodeNode,
  HyperappState,
  isd3NodeNode,
  Levels,
  NodysseusSimulation,
  Property,
  Vector2,
} from "./types.js";
import {
  UpdateGraphDisplay,
  UpdateSimulation,
  d3subscription,
  updateSimulationNodes,
  getNodes,
  getLinks,
} from "./components/graphDisplay.js";
import { parser } from "@lezer/javascript";
import { v4 as uuid } from "uuid";
import { runh } from "./hyperapp.js";
import domTypes from "../html-dom-types.json" assert { type: "json" };
import {
  Compartment,
  EditorSelection,
  StateEffectType,
  StateField,
} from "@codemirror/state";
import { json, jsonParseLinter } from "@codemirror/lang-json";
import { javascript } from "@codemirror/lang-javascript";
import { linter, lintGutter } from "@codemirror/lint";
import { EditorView } from "@codemirror/view";
import { StateEffect } from "@codemirror/state";
import {
  foldAll,
  unfoldCode,
  toggleFold,
  foldCode,
  foldInside,
  foldable,
  foldEffect,
  foldState,
  codeFolding,
} from "@codemirror/language";
import {
  NodysseusRuntime,
  VarNode,
  AnyNode,
  isNothing,
  NodeOutputsU,
  UnwrapNode,
} from "src/dependency-tree/dependency-tree.js";
import { pick, remap } from "./fp-util.js";
import * as acorn from "acorn";
import jsx from "acorn-jsx";
import { Node as ESTreeNode } from "estree";
import { visit } from "ast-types";
import { JSXIdentifierKind } from "ast-types/gen/kinds.js";
import { markdown } from "@codemirror/lang-markdown";

const JsxParser = acorn.Parser.extend(jsx());

function maybeEnable(state, other) {
  return state.field(foldState, false)
    ? other
    : other.concat(StateEffect.appendConfig.of(codeFolding()));
}

const customFoldAll = (view) => {
  let { state } = view,
    effects = [];
  for (let pos = 2; pos < state.doc.length; ) {
    const line = view.lineBlockAt(pos),
      range = foldable(state, line.from, line.to);
    if (range) effects.push(foldEffect.of(range));
    pos = (range ? view.lineBlockAt(range.to) : line).to + 1;
  }
  if (effects.length)
    view.dispatch({ effects: maybeEnable(view.state, effects) });
  return !!effects.length;
};

export const pzobj: {
  instance: false | pz.PanZoom;
  lastpanzoom: false | number;
  animationframe: false | number;
  centered:
    | false
    | { nodeId: string; position: Vector2; initialOffset: Vector2 };
  effect: (dispatch, payload) => void;
  getTransform: () => pz.Transform;
  init: (dispatch, sub_payload) => () => void;
} = {
  centered: false,
  instance: false,
  lastpanzoom: false,
  animationframe: false,
  effect: function (
    dispatch,
    payload: Pick<
      HyperappState,
      "node_el_width" | "dimensions" | "html_id" | "simulation" | "nodeOffset"
    > & { node_id: string; prevent_dispatch?: boolean },
  ) {
    requestAnimationFrame(() => {
      if (!hlib.panzoom.instance || !payload.node_id) {
        pzobj.centered = false;
        return;
      }

      pzobj.lastpanzoom = performance.now();
      const nodes = getNodes(payload.simulation);
      const viewbox = findViewBox(
        nodes,
        getLinks(payload.simulation),
        payload.node_id,
        payload.node_el_width,
        payload.html_id,
        payload.dimensions,
      );
      const x = payload.dimensions.x * 0.5 - viewbox.center.x;
      const y = payload.dimensions.y * 0.5 - viewbox.center.y;
      const scale = hlib.panzoom.instance.getTransform().scale;
      hlib.panzoom.instance.moveTo(
        x - (payload.simulation?.selectedOffset?.x ?? 0) * scale,
        y - (payload?.simulation?.selectedOffset?.y ?? 0) * scale,
      );
      hlib.panzoom.instance.zoomTo(x, y, 1 / scale);

      pzobj.centered = {
        nodeId: payload.node_id,
        position: { x, y },
        initialOffset: payload?.simulation?.selectedOffset ?? { x: 0, y: 0 },
      };

      if (!payload.prevent_dispatch) {
        if (pzobj.animationframe) {
          cancelAnimationFrame(pzobj.animationframe);
        }
        pzobj.animationframe = requestAnimationFrame(() => {
          pzobj.animationframe = false;
          dispatch((s, p) => [
            { ...s, show_all: false },
            [
              () =>
                requestAnimationFrame(() =>
                  nolib.no.runtime.publish(
                    "show_all",
                    { data: false },
                    nolibLib,
                  ),
                ),
            ],
          ]);
        });
      }
    });
  },
  getTransform: function () {
    const ret = (hlib?.panzoom?.instance as pz.PanZoom)?.getTransform?.();

    return ret;
  },
  init: function (dispatch, sub_payload) {
    hlib.panzoom.lastpanzoom = 0;
    const init = requestAnimationFrame(() => {
      hlib.panzoom.instance = panzoom(document.getElementById(sub_payload.id), {
        filterKey: () => true,
        smoothScroll: false,
        onTouch: (e) => {
          if (
            (e.target as HTMLElement).id.endsWith("-editor") &&
            hlib.panzoom.lastpanzoom &&
            performance.now() - hlib.panzoom.lastpanzoom > 100
          ) {
            dispatch(sub_payload.action, {
              event: "panstart",
              transform: (hlib.panzoom.instance as pz.PanZoom).getTransform(),
              noautozoom: true,
            });
          }
          return true;
        },
        beforeWheel: (e) => {
          if (
            (e.target as HTMLElement).id.endsWith("-editor") &&
            hlib.panzoom.lastpanzoom &&
            performance.now() - hlib.panzoom.lastpanzoom > 100
          ) {
            dispatch(sub_payload.action, {
              event: "panstart",
              transform: (hlib.panzoom.instance as pz.PanZoom).getTransform(),
              noautozoom: true,
            });
          }
          return false;
        },
        beforeMouseDown: (e) => {
          const should_zoom = e.buttons == 4 || e.altKey;
          if (
            !should_zoom &&
            (e.target as HTMLElement).id.endsWith("-editor")
          ) {
            dispatch(sub_payload.action, {
              event: "panstart",
              transform: (hlib.panzoom.instance as pz.PanZoom).getTransform(),
              noautozoom: true,
            });
          }
          return should_zoom;
        },
      });
      let currentEvent: false | { offset: { x: number; y: number } } = false;
      (
        document.getElementById(sub_payload.id) as unknown as SVGElement
      ).ownerSVGElement.addEventListener("pointermove", (e) => {
        if (e.buttons == 4 || e.altKey) {
          if (!currentEvent) {
            currentEvent = {
              offset: {
                x: e.offsetX,
                y: e.offsetY,
              },
            };
          }
          const movementSign =
            Math.abs(e.movementX) > Math.abs(e.movementY)
              ? e.movementX
              : -e.movementY;
          const scaleMultiplier = 1 + movementSign * 0.01;
          (hlib.panzoom.instance as pz.PanZoom).zoomTo(
            currentEvent.offset.x,
            currentEvent.offset.y,
            scaleMultiplier,
          );
        } else {
          currentEvent = false;
        }
      });
      (
        document.getElementById(sub_payload.id) as unknown as SVGElement
      ).ownerSVGElement.addEventListener("pointerup", (e) => {
        currentEvent = false;
      });
      hlib.panzoom.instance.moveTo(
        window.innerWidth * 0,
        window.innerHeight * 0.5,
      );
      hlib.panzoom.instance.on("transform", (e) => {
        document
          .getElementById("node-editor-editor")
          .style.setProperty(
            "--zoom-scale",
            (hlib.panzoom.instance as pz.PanZoom)
              .getTransform()
              .scale.toString(),
          );
      });
    });
    return () => {
      cancelAnimationFrame(init);
      (hlib.panzoom.instance as pz.PanZoom)?.dispose();
    };
  },
};

// Errors from the worker don't keep instanceof
export const isNodysseusError = (e: Error) =>
  e &&
  (e instanceof nolib.no.NodysseusError ||
    (e as NodysseusError).cause?.node_id);

export const update_graph_list = (graph_id) => {
  const graph_list =
    JSON.parse(localStorage.getItem("graph_list"))?.filter(
      (l) => l !== graph_id,
    ) ?? [];
  graph_list.unshift(graph_id);
  localStorage.setItem("graph_list", JSON.stringify(graph_list));
};

type NodePositionArgs = { position: Vector2; simulation: NodysseusSimulation };

// const x = payload.dimensions.x * 0.5 - viewbox.center.x - payload.nodeOffset.x;
export const setRootNodeXNodeY = ({
  position,
  simulation,
}: NodePositionArgs) => {
  if (pzobj.centered) {
    const rt = document.querySelector(":root") as HTMLElement;
    rt.style.setProperty(
      "--nodex",
      `${Math.round(
        position.x +
          pzobj.centered.position.x -
          pzobj.centered.initialOffset.x +
          simulation.selectedOffset.x,
      )}px`,
    );
    rt.style.setProperty(
      "--nodey",
      `${Math.round(
        position.y +
          pzobj.centered.position.y -
          pzobj.centered.initialOffset.y +
          simulation.selectedOffset.y +
          64,
      )}px`,
    );
  }
};

export const SetSelectedPositionStyleEffect = (
  _,
  payload: NodePositionArgs,
) => {
  requestAnimationFrame(() => setRootNodeXNodeY(payload));
};

export const ChangeEditingGraphId: ha.Effecter<
  HyperappState,
  { id: string; select_out: boolean; editingGraphId: string }
> = (dispatch, { id, select_out, editingGraphId }) => {
  requestAnimationFrame(() => {
    const graphPromise = wrapPromise(nolib.no.runtime.refs()).then((refs) =>
      nolib.no.runtime.get_ref(
        id,
        editingGraphId && nolib.no.runtime.get_ref(editingGraphId),
      ),
    );

    window.location.hash = "#" + id;
    document.title = "Nodysseus - " + id;
    graphPromise.then((graph) =>
      dispatch((state) => [
        { ...state, editingGraphId: id },
        [
          (dispatch) => {
            requestAnimationFrame(() => {
              update_graph_list(id);
              const new_graph =
                graph ??
                Object.assign({}, base_graph(state.editingGraph), { id });

              if (!new_graph.edges_in) {
                new_graph.edges_in = Object.values(new_graph.edges).reduce(
                  (acc: any, edge: Edge) => ({
                    ...acc,
                    [edge.to]: { ...(acc[edge.to] ?? {}), [edge.from]: edge },
                  }),
                  {},
                );
              }

              nolib.no.runtime.change_graph(new_graph, hlibLib);
              nolib.no.runtime.clearListeners();
              dispatch((s) => {
                const news = {
                  ...s,
                  editingGraph: new_graph,
                  selected: [new_graph.out],
                  editingGraphId: new_graph.id,
                  displayGraph: s.displayGraph ?? false,
                  displayGraphId: s.displayGraph ? s.displayGraph.id : false as string | false,
                };
                return [
                  news,
                  [UpdateSimulation, { ...news, clear_simulation_cache: true }],
                  select_out && [
                    () => {
                      setTimeout(() => {
                        dispatch(SelectNode, {
                          node_id: new_graph.out ?? "out",
                        });
                      }, 100);
                    },
                    {},
                  ],
                  !state.displayGraphId && [refresh_graph_display, { ...state, graph: new_graph }],
                ];
              });
            });
          },
          {},
        ],
      ]),
    );
  });
};

export const CreateNode: ha.Action<
  HyperappState,
  {
    node: NodysseusNode & { id?: string };
    child: string;
    child_as: string;
    parent?: Edge;
  }
> = (state, { node, child, child_as, parent }) => [
  state,
  (dispatch) => {
    if (!node.id) node.id = create_randid(state.editingGraph);
    nolib.no.runtime
      .updateGraph({
        graph: state.editingGraph,
        addedNodes: [node as NodysseusNode],
        addedEdges: parent
          ? [
              { from: node.id, to: child, as: parent.as },
              { from: parent.from, to: node.id, as: "arg0" },
            ]
          : [{ from: node.id, to: child, as: child_as }],
        removedEdges: parent ? [{ from: parent.from, to: child }] : [],
        lib: hlibLib,
      })
      .then(() =>
        requestAnimationFrame(() => dispatch(SelectNode, { node_id: node.id })),
      );
  },
];

export const DeleteNode = (state, { node_id }) => [
  state,
  [
    (dispatch, { node_id }) =>
      requestAnimationFrame(() => dispatch(SelectNode, { node_id })),
    { node_id: graphEdgeOut(state.editingGraph, node_id).to },
  ],
  [
    () =>
      requestAnimationFrame(() =>
        nolib.no.runtime.delete_node(state.editingGraph, node_id, hlibLib),
      ),
  ],
];

export const ExpandContract = (state, { node_id }) => {
  const node = state.editingGraph.nodes[node_id];
  const update = node.nodes
    ? expand_node({ nolib, node_id, editingGraph: state.editingGraph })
    : contract_node({ nolib, node_id, editingGraph: state.editingGraph });

  return [
    state,
    [
      (dispatch) => {
        requestAnimationFrame(() => {
          // Have to be the same time so the right node is selected
          dispatch(SelectNode, { node_id: update.selected[0] });
        });
      },
    ],
  ];
};

export const CreateRef = (state, { node }) => [
  state,
  [
    (dispatch) => {
      const graph = { ...base_graph(node), id: node.name, value: undefined };
      nolib.no.runtime.change_graph(base_graph(graph), hlibLib);
      save_graph(graph);
      nolib.no.runtime.add_node(
        state.editingGraph,
        {
          id: node.id,
          value: node.value,
          ref: node.name,
          name: undefined,
        },
        hlibLib,
      );
    },
  ],
];

export const Copy = (state, { cut, as }) => {
  const graph = ancestor_graph(state.selected[0], state.editingGraph, nolib);
  const copied = { graph, root: state.selected[0], as };
  navigator?.clipboard?.writeText(JSON.stringify(copied));
  if (cut) {
    nolib.no.runtime.add_nodes_edges(
      state.editingGraph,
      [],
      [],
      Object.values(copied.graph.edges),
      Object.values(graph.nodes),
      hlibLib,
    );
    const outEdge = state.editingGraph.edges[state.selected[0]];
    return [{ ...state, copied }, [selectNodeEffect, { node_id: outEdge.to }]];
  }
  return { ...state, copied };
};

export const Paste = (state) => [
  { ...state },
  [
    (dispatch) => {
      navigator.clipboard.readText().then((clipboardContents) => {
        let copied;
        try {
          copied = JSON.parse(clipboardContents);
        } catch (e) {
          copied = state.copied;
        }
        const node_id_map = {};
        nolib.no.runtime.add_nodes_edges(
          state.editingGraph,
          Object.values(copied.graph.nodes as Array<NodysseusNode>).map(
            (n) => ({
              ...n,
              id:
                ((node_id_map[n.id] = create_randid(state.editingGraph)),
                node_id_map[n.id]),
            }),
          ),
          Object.values(copied.graph.edges as Array<Edge>)
            .map((e) => ({
              ...e,
              from: node_id_map[e.from],
              to: node_id_map[e.to],
            }))
            .concat([
              {
                from: node_id_map[copied.root],
                to: state.selected[0],
                as: copied.as,
              },
            ]),
          [],
          [],
          hlibLib,
        );
        // Object.values(state.copied.graph.nodes).forEach((n: NodysseusNode) => {
        //     const new_id = create_randid();
        //     node_id_map[n.id] = new_id;
        //     nolib.no.runtime.add_node(state.editingGraph, {...n, id: new_id}, hlib)
        // });
        // nolib.no.runtime.update_edges(
        //     state.editingGraph,
        //     Object.values(state.copied.graph.edges)
        //         .map((e: any) => ({...e, from: node_id_map[e.from], to: node_id_map[e.to]}))
        //         .concat([{from: node_id_map[state.copied.root], to: state.selected[0], as: state.copied.as}]),
        //   [],
        //   hlib
        //     );
        requestAnimationFrame(() =>
          dispatch(SelectNode, {
            node_id: node_id_map[state.copied.root],
            focus_property: "edge",
          }),
        );
      });
    },
  ],
];

export const selectNodeEffect: ha.Effecter<
  HyperappState,
  {
    node_id: string;
    focus_property?: Property;
    clearInitialLayout?: boolean;
  }
> = (dispatch, props) => dispatch([SelectNode, props]);

export const SelectNode: ha.Action<
  HyperappState,
  {
    node_id: string;
    focus_property?: Property;
    clearInitialLayout?: boolean;
  }
> = (state, { node_id, focus_property, clearInitialLayout }) =>
  state.editingGraph.nodes[node_id]
    ? [
        state.selected[0] === node_id
          ? clearInitialLayout && state.initialLayout
            ? { ...state, initialLayout: false }
            : state
          : {
              ...state,
              selected: [node_id],
              inputs: {},
              selected_edges_in: graphEdgesIn(state.editingGraph, node_id),
              noautozoom: false,
              initialLayout: state.initialLayout && !clearInitialLayout,
            },
        [pzobj.effect, { ...state, node_id: node_id }],
        [UpdateGraphDisplay, { ...state, selected: [node_id] }],
        [
          UpdateSelectedNodeMetadataEffect,
          remap(
            state,
            {
              editingGraph: "graph",
            },
            pick(
              state,
              [
                "code_editor",
                "code_editor_nodeid_field",
                "code_editor_nodeid",
                "codeEditorExtensions",
                "cachedMetadata",
              ],
              { id: node_id },
            ),
          ),
        ],
        focus_property && [
          FocusEffect,
          { selector: `.node-info .${focus_property}` },
        ],
        getNodes(state.simulation).find(
          (n) => isd3NodeNode(n) && n.node_id === node_id,
        ) && [
          SetSelectedPositionStyleEffect,
          {
            position: getNodes(state.simulation).find(
              (n) => isd3NodeNode(n) && n.node_id === node_id,
            ),
            nodeOffset: state.nodeOffset,
            dimensions: state.dimensions,
            svg_offset: pzobj.getTransform(),
            simulation: state.simulation,
          },
        ],
        node_id === state.editingGraph.out && [
          (dispatch) =>
            state.info_display_dispatch({
              el: {
                dom_type: "div",
                props: {},
                children: [
                  { dom_type: "text_value", text: "Most recent graphs" },
                  {
                    dom_type: "ul",
                    props: {},
                    children: localStorage.getItem("graph_list")
                      ? JSON.parse(localStorage.getItem("graph_list"))
                          .slice(0, 10)
                          .map((gid) => ({
                            dom_type: "li",
                            props: {},
                            children: [
                              {
                                dom_type: "a",
                                props: {
                                  href: "#" + gid,
                                  onclick: (s) => [
                                    s,
                                    [
                                      () =>
                                        dispatch((ms) => [
                                          ms,
                                          [
                                            ChangeEditingGraphId,
                                            {
                                              id: gid,
                                              editingGraphId:
                                                state.editingGraphId,
                                            },
                                          ],
                                        ]),
                                    ],
                                  ],
                                },
                                children: [
                                  { dom_type: "text_value", text: gid },
                                ],
                              },
                            ],
                          }))
                      : [],
                  },
                ],
              },
            }),
          {},
        ],
        // : [() => requestAnimationFrame(() => update_info_display({
        //   fn: node_id,
        //   graph: state.editingGraph,
        //   args: {},
        // }, state.info_display_dispatch, state.code_editor, state.code_editor_nodeid, state.selected[0] !== node_id, undefined, state.codeEditorExtensions)), {}],
        // [updateSelectedMetadata, {graph: state.editingGraph, nodeId: node_id}],
        state.selected[0] !== node_id && [
          () =>
            nolib.no.runtime.publish(
              "nodeselect",
              { data: { nodeId: node_id, graphId: state.editingGraphId } },
              nolibLib,
            ),
          {},
        ],
        [
          CalculateSelectedNodeArgsEffect,
          {
            graph: state.editingGraph,
            node_id,
            cachedMetadata: state.cachedMetadata,
          },
        ],
      ]
    : state;

export const CustomDOMEvent = (_, payload) =>
  document
    .getElementById(`${payload.html_id}`)
    ?.dispatchEvent(new CustomEvent(payload.event, { detail: payload.detail }));

export const FocusEffect: ha.Effecter<HyperappState, { selector: string }> = (
  _,
  { selector },
) => {
  setTimeout(() => {
    const el: HTMLInputElement = document.querySelector(selector);
    if (!el) {
      console.info(`couldn't find ${selector}`);
      return;
    }

    el.focus();
    el.select();
  }, 100);
};

export const SaveGraph = (dispatch, payload) =>
  save_graph(payload.editingGraph);

export const UpdateResultDisplay = (state, resel) => {
  return compareObjects(resel.el, state.el)
    ? state
    : {
        ...state,
        el: resel.el,
      };
};

export const UpdateNodeMetadata: ha.Effecter<
  HyperappState,
  { editingGraph: Graph; node: NodysseusNode }
> = (dispatch, { editingGraph, node }) =>
  wrapPromise(
    hlib.run(hlib.infoRuntime(), editingGraph, node.id, "metadata"),
  ).then((metadata) =>
    dispatch((s) => [
      {
        ...s,
        selectedMetadata: metadata,
        cachedMetadata: { ...s.cachedMetadata, [node.id]: metadata },
      },
      [
        CalculateSelectedNodeArgsEffect,
        {
          graph: editingGraph,
          node_id: node.id,
          cachedMetadata: { ...s.cachedMetadata, [node.id]: metadata },
        },
      ],
    ]),
  ).value;

export const UpdateNodeEffect: ha.Effecter<
  HyperappState,
  { editingGraph: Graph; node: NodysseusNode; norun: boolean }
> = (dispatch, { editingGraph, node, norun }) => {
  nolib.no.runtime
    .updateGraph({ graph: editingGraph, addedNodes: [node], lib: nolibLib })
    .then((graph) => {
      const edges_in = graphEdgesIn(graph, node.id);
      const metadata =
        !norun && hlib.run(hlib.runtime(), graph, node.id, "metadata");

      wrapPromise(node_args(nolib, graph, node.id)).then((nodeargs) => {
        if (edges_in.length === 1) {
          if (
            nodeargs.nodeArgs.filter(
              (na) => !na.additionalArg && !na.name.startsWith("_"),
            ).length === 1
          ) {
            const newAs = nodeargs.nodeArgs.find((a) => !a.additionalArg).name;
            if (newAs !== edges_in[0].as) {
              nolib.no.runtime.updateGraph({
                graph: editingGraph,
                addedEdges: [{ ...edges_in[0], as: newAs }],
                lib: hlibLib,
              });
            }
          } else if (nodeargs.nodeArgs.find((a) => a.default)) {
            const newAs = nodeargs.nodeArgs.find((a) => a.default).name;
            if (newAs) {
              nolib.no.runtime.updateGraph({
                graph: editingGraph,
                addedEdges: [{ ...edges_in[0], as: newAs }],
                lib: hlibLib,
              });
            }
          }
        }
      });

      dispatch((state) => [
        { ...state, selectedMetadata: metadata },
        state.selected[0] === node.id && [
          CalculateSelectedNodeArgsEffect,
          { graph, node_id: node.id, cachedMetadata: state.cachedMetadata },
        ],
        state.selected[0] === node.id && [
          UpdateSelectedNodeMetadataEffect,
          remap(
            state,
            {
              editingGraph: "graph",
            },
            pick(
              state,
              [
                "code_editor",
                "code_editor_nodeid_field",
                "code_editor_nodeid",
                "codeEditorExtensions",
                "cachedMetadata",
              ],
              { id: node.id },
            ),
          ),
        ],
      ]);
    });
};

export const UpdateNode: ha.Action<
  HyperappState,
  { node: NodysseusNode; property: string; value: string; editingGraph: Graph }
> = (state, { node, property, value, editingGraph }) => [
  state,
  [
    UpdateNodeEffect,
    {
      editingGraph: editingGraph ?? state.editingGraph,
      norun: state.norun,
      node: Object.fromEntries(
        Object.entries(
          Object.assign(
            {},
            base_node(
              typeof node === "string"
                ? (editingGraph ?? state.editingGraph).nodes[node]
                : node
                  ? node
                  : state.editingGraph.nodes[state.selected[0]],
            ),
            { [property]: value === "" ? undefined : value },
          ),
        ).filter((kv) => kv[1] !== undefined),
      ),
    },
  ],
];

export const UpdateEdge: ha.Action<
  HyperappState,
  { edge: Edge; as: string }
> = (state, { edge, as }) => [
  state,
  [
    () => {
      nolib.no.runtime.updateGraph({
        graph: state.editingGraph,
        addedEdges: [{ ...edge, as }],
        removedEdges: [edge],
        lib: hlibLib,
      });
    },
    {},
  ],
];

export const keydownSubscription = (dispatch, options) => {
  const handler = (ev) => {
    if ((ev.key === "s" || ev.key === "o") && ev.ctrlKey) {
      ev.preventDefault();
    } else if (!ev.key) {
      return;
    }

    requestAnimationFrame(() => dispatch(options.action, ev));
  };
  requestAnimationFrame(() => addEventListener("keydown", handler));
  return () => removeEventListener("keydown", handler);
};

export const refresh_graph_display: ha.Effecter<HyperappState, any> = async (
  dispatch,
  {
    graph,
    graphChanged,
    norun,
    result_display_dispatch,
    result_background_display_dispatch,
    info_display_dispatch,
    code_editor,
    code_editor_nodeid,
  },
) => {
  selectedGraphOutputs(graph, (display) => {
    result_display_dispatch(UpdateResultDisplay, {
      el: display?.resultPanel
        ? display.resultPanel
        : display?.dom_type
          ? display
          : { dom_type: "div", props: {}, children: [] },
    });
    result_background_display_dispatch({
      el: display?.background
        ? display.background
        : { dom_type: "div", props: {}, children: [] },
    });
  });
};

export const result_subscription = (
  dispatch,
  { editingGraphId, displayGraphId, norun },
) => {
  let animrun: false | number = false;

  const error_listener = (error) =>
    requestAnimationFrame(() => {
      dispatch((s) =>
        Object.assign({}, s, {
          error: s.error
            ? [
                ...new Map(
                  s.error
                    .concat([error])
                    .map((e) => [
                      e.cause?.node_id
                        ? e.cause?.node_id?.split("/")[1]
                        : uuid(),
                      e,
                    ]),
                ).values(),
              ]
            : [error],
        }),
      );
    });

  nolib.no.runtime.addListener(
    "grapherror",
    "update_hyperapp_error",
    error_listener,
  );

  let info_display_dispatch,
    code_editor,
    code_editor_nodeid,
    result_display_dispatch,
    result_background_display_dispatch;

  const change_listener = ({ graph }) => {
    if (animrun) {
      cancelAnimationFrame(animrun);
    }

    if (
      info_display_dispatch &&
      code_editor &&
      code_editor_nodeid &&
      result_display_dispatch &&
      result_background_display_dispatch
    ) {
      // const runtime = hlib.runtime();
      // const argsNode = runtime.varNode({});
      // const runNode = runtime.fromNode(graph, graph.out ?? "out", argsNode);
      animrun = requestAnimationFrame(() => {
        if (graph?.id === (displayGraphId || editingGraphId)) {
          wrapPromise(
            nolib.no.runtime.get_ref(displayGraphId || editingGraphId),
          ).then((graph) => {
            dispatch((s) => ({
              ...s,
              editingGraph: graph,
              displayGraph: graph,
            }));
          });
          // let updateResult = () => {
          //   animrun = requestAnimationFrame(updateResult);
          //   // refresh_graph(dispatch, {graph, graphChanged: false, norun, info_display_dispatch, code_editor, code_editor_nodeid, result_background_display_dispatch, result_display_dispatch, argsNode, runNode})
          // }
          //
          // animrun = requestAnimationFrame(updateResult)
          // })
        }
      });
    } else {
      // TODO: hacky change this
      dispatch((s) => [
        s,
        () => {
          info_display_dispatch = s.info_display_dispatch;
          code_editor = s.code_editor;
          code_editor_nodeid = s.code_editor_nodeid;
          result_display_dispatch = s.result_display_dispatch;
          result_background_display_dispatch =
            s.result_background_display_dispatch;
        },
      ]);
    }
  };

  nolib.no.runtime.addListener(
    "graphupdate",
    "clear_hyperapp_error",
    change_listener,
  );
  const timeouts: Record<
    string,
    false | { id: ReturnType<typeof setTimeout>; timestamp: number }
  > = {};
  const animframes = {};

  const noderun_listener = (data) => {
    if (data.graphId === editingGraphId) {
      const nodeId = data.nodeId;
      const timeout = timeouts[nodeId];
      const nodeanimframe = animframes[nodeId];
      if (!timeout) {
        const el = document.querySelector(
          `#node-editor-${nodeId.replaceAll("/", "_")} .shape`,
        );
        el?.classList.add("flash");
      }

      if (!timeout || performance.now() - timeout.timestamp > 950) {
        if (timeout) {
          clearTimeout(timeout.id);
        }
        timeouts[nodeId] = {
          id: setTimeout(() => {
            const el = document.querySelector(
              `#node-editor-${nodeId.replaceAll("/", "_")} .shape`,
            );
            timeouts[nodeId] = false;
            el?.classList.remove("flash");
          }, 1000),
          timestamp: performance.now(),
        };
      }
    }
  };

  nolib.no.runtime.addListener(
    "noderun",
    "update_hyperapp_error",
    noderun_listener,
  );

  return () => (
    nolib.no.runtime.removeListener("graphupdate", "clear_hyperapp_error"),
    nolib.no.runtime.removeListener("grapherror", "update_hyperapp_error")
  );
};

export const graph_subscription = (
  dispatch: ha.Dispatch<HyperappState>,
  props,
) => {
  let animframe: false | number = false;
  const listener = ({ graph }) => {
    dispatch((s) => (s.error ? Object.assign({}, s, { error: false }) : s));
    wrapPromise(nolib.no.runtime.refs()).then((refGraphs) =>
      dispatch((s) =>
        s.refGraphs.length !== refGraphs.length ? { ...s, refGraphs } : s,
      ),
    );
    if (props.editingGraphId === graph.id) {
      if (animframe) {
        cancelAnimationFrame(animframe);
      }
      animframe = requestAnimationFrame(() => {
        animframe = false;
        dispatch((s: HyperappState) => [
          { ...s, editingGraph: graph },
          UpdateSimulation,
        ]);
      });
    } else {
      // Have to keep this so that other tabs updating graphs makes changes
      animframe = requestAnimationFrame(() => {
        animframe = false;
        dispatch((s: HyperappState) => [s, UpdateSimulation]);
      });
    }
  };

  nolib.no.runtime.addListener("graphchange", "update_hyperapp", listener);
  return () =>
    nolib.no.runtime.removeListener("graphchange", "update_hyperapp");
};

export const select_node_subscription = (dispatch, props) => {
  const listener = (data) => {
    dispatch(SelectNode, {
      node_id: data.data.substring(data.data.indexOf("/") + 1),
    });
  };

  nolib.no.runtime.addListener("selectnode", "hyperapp", listener);
  return () => nolib.no.runtime.removeListener("selectnode", "hyperapp");
};

export const UpdateSelectedNodeMetadataEffect = (
  dispatch,
  {
    graph,
    id,
    cachedMetadata,
    code_editor,
    code_editor_nodeid_field,
    code_editor_nodeid,
    codeEditorExtensions,
  }: {
    graph: Graph;
    id: string;
    cachedMetadata: Record<string, NodeMetadata>;
    code_editor: EditorView;
    code_editor_nodeid: StateEffectType<string>;
    code_editor_nodeid_field: StateField<string>;
    codeEditorExtensions: Compartment;
  },
) => {
  wrapPromise(runtime.runGraphNode<UnwrapNode<NodeOutputsU>>(graph, id))
    .then((nodeOutputs) => runtime.run(nodeOutputs.metadata))
    .then((metadata) => {
      wrapPromiseAll([metadata]).then(([metadata]) => {
        cachedMetadata[graph.id + "/" + id] = metadata;
        dispatch((s) => [
          { ...s, selectedMetadata: metadata },
          [
            CalculateSelectedNodeArgsEffect,
            { graph, node_id: id, cachedMetadata },
          ],
        ]);

        requestAnimationFrame(() => {
          const node = graph.nodes[id];
          setCodeEditorText({
            codeEditor: code_editor,
            codeEditorNodeId: code_editor_nodeid,
            codeEditorNodeIdField: code_editor_nodeid_field,
            codeEditorExtensions,
            metadata,
            node,
          });
        });
      });
    });
};

export const setCodeEditorText = ({
  codeEditor,
  codeEditorNodeId,
  codeEditorNodeIdField,
  codeEditorExtensions,
  metadata,
  node,
}: {
  codeEditor: EditorView;
  codeEditorNodeId: StateEffectType<string>;
  codeEditorNodeIdField: StateField<string>;
  codeEditorExtensions?: Compartment;
  metadata: NodeMetadata;
  node: NodysseusNode;
}) => {
  if (codeEditor && isNodeRef(node) && metadata && metadata.codeEditor) {
    const jsonlang = json();
    requestAnimationFrame(() => {
      if (metadata?.codeEditor?.language === "json") {
        customFoldAll(codeEditor);
      }
    });
    const newText = metadata?.codeEditor?.editorText ?? node.value;
    codeEditor.dispatch({
      changes: codeEditor.state.field(codeEditorNodeIdField) !== node.id &&
        newText !== codeEditor.state.doc.toString() && {
          from: 0,
          to: codeEditor.state.doc.length,
          insert: newText,
        },
      effects: [
        codeEditorNodeId.of(node.id),
        codeEditorExtensions.reconfigure(
          [
            metadata?.codeEditor?.language === "json"
              ? [jsonlang, linter(jsonParseLinter()), lintGutter()]
              : metadata?.codeEditor?.language === "markdown"
                ? markdown()
                : javascript(),
            metadata?.codeEditor?.onChange &&
              EditorView.updateListener.of(
                (viewUpdate) =>
                  viewUpdate.docChanged &&
                  metadata.codeEditor.onChange({
                    editorText: viewUpdate.state.doc.toString(),
                  }),
              ),
          ]
            .filter((e) => e)
            .flat(),
        ),
      ].filter((e) => e),
    });
  }
};

export const watchNode = async <T>(
  runtime: NodysseusRuntime,
  node: AnyNode<T>,
  fn: (t: T) => void,
): Promise<void> => {
  for await (const result of runtime.createWatch(node)) {
    fn(result);
  }
};

export const selectedGraphOutputs = (
  graph: Graph,
  displayFn: (d: any) => void,
) => {
  watchNodeOutputs(hlib.runtime(), graph.id, graph.out ?? "out", "graphWatch", {
    display: displayFn,
    value: (value) => {},
  });
};

export const watchNodeOutputs = (
  runtime: NodysseusRuntime,
  graph: string,
  selected: string,
  watchId: string,
  fns: Partial<Record<"display" | "metadata" | "value", (v: any) => void>>,
) => {
  const nodeId = "selectedVarNode-" + watchId;
  if (!runtime.scope.has(`selectedVarNode-${nodeId}`)) {
    const selectedVarNode = runtime.varNode(
      { graph, id: selected },
      undefined,
      nodeId,
      true,
    );
    const selectedNode = runtime.runNodeNode(
      runtime.bindNode(
        { selectedVarNode },
        ({ selectedVarNode }) =>
          wrapPromise(
            runtime.fromNode(selectedVarNode.graph, selectedVarNode.id),
          ).then((node) => node).value,
        undefined,
        nodeId + "-bindGraphNode",
      ),
      nodeId + "-mapBoundGraphNode",
    );

    if (fns.display) {
      watchNode(
        runtime,
        runtime.accessor(
          selectedNode,
          "display",
          nodeId + "-displayOutput",
          true,
        ),
        fns.display,
      );
    }
    if (fns.metadata) {
      watchNode(
        runtime,
        runtime.accessor(
          selectedNode,
          "metadata",
          nodeId + "-metadataOutput",
          true,
        ),
        fns.metadata,
      );
    }
    if (fns.value) {
      watchNode(
        runtime,
        runtime.accessor(selectedNode, "value", nodeId + "-valueOutput", true),
        fns.value,
      );
    }
  } else {
    runtime.varNode({ graph, id: selected }, undefined, nodeId, true);
  }
};

export const infoWindowSubscription = (
  dispatch: ha.Dispatch<HyperappState>,
  {
    selected,
    graph,
    // selectedVarNode,
    info_display_dispatch,
    code_editor,
    code_editor_nodeid,
    code_editor_nodeid_field,
    codeEditorExtensions,
    cachedMetadata,
    norun,
  }: {
    selected: Array<string>;
    graph: string;
    // selectedVarNode: VarNode<{graph: string, id: string}> | undefined,
    info_display_dispatch: Function | undefined;
    code_editor: any;
    code_editor_nodeid: StateEffectType<string>;
    code_editor_nodeid_field: StateField<string>;
    codeEditorExtensions;
    cachedMetadata: Record<string, NodeMetadata>;
    norun: boolean;
  },
) => {
  if (info_display_dispatch) {
    watchNodeOutputs(hlib.infoRuntime(), graph, selected[0], "nodeWatch", {
      display: (display) =>
        info_display_dispatch({
          el: display?.dom_type
            ? display
            : display?.resultPanel?.dom_type
              ? display.resultPanel
              : {
                  dom_type: "div",
                  props: {},
                  children: [
                    {
                      dom_type: "text_value",
                      text:
                        typeof display === "number" ||
                        typeof display === "string"
                          ? display
                          : "",
                    },
                  ],
                },
        }),
    });
  }

  return () => {};
};

export const listen = (type, action): ha.Subscription<HyperappState, any> => [
  listenToEvent,
  { type, action },
];

export const listenToEvent = (dispatch, props): (() => void) => {
  const listener = (event) =>
    requestAnimationFrame(() => dispatch(props.action, event));

  requestAnimationFrame(() => addEventListener(props.type, listener));
  return () => removeEventListener(props.type, listener);
};

export const findViewBox = (
  nodes: Array<d3NodeNode>,
  links: Array<d3Link>,
  selected: string,
  node_el_width: number,
  htmlid: string,
  dimensions: { x: number; y: number },
) => {
  const visible_nodes: Array<{ x: number; y: number }> = [];
  const visible_node_set = new Set();
  let selected_pos: Vector2;
  links.forEach((l) => {
    const el = document.getElementById(
      `link-${(l.source as d3NodeNode).node_id}`,
    );
    const info_el = document.getElementById(
      `edge-info-${(l.source as d3NodeNode).node_id}`,
    );
    if (el && info_el && l.source && l.target) {
      const source = {
        x: (l.source as d3Node).x - node_el_width * 0.5,
        y: (l.source as d3Node).y,
      };
      const target = {
        x: (l.target as d3Node).x - node_el_width * 0.5,
        y: (l.target as d3Node).y,
      };

      if ((l.source as d3NodeNode).node_id === selected) {
        visible_nodes.push({ x: target.x, y: target.y });
        visible_node_set.add((l.target as d3NodeNode).node_id);
      } else if ((l.target as d3NodeNode).node_id === selected) {
        visible_nodes.push({ x: source.x, y: source.y });
        visible_node_set.add((l.source as d3NodeNode).node_id);
      }
    }
  });

  links.forEach((l) => {
    if (
      visible_node_set.has((l.target as d3NodeNode).node_id) &&
      !visible_node_set.has((l.source as d3NodeNode).node_id)
    ) {
      const source = {
        x: (l.source as d3NodeNode).x - node_el_width * 0.5,
        y: (l.source as d3Node).y,
      };
      visible_nodes.push({ x: source.x, y: source.y });
    }
  });

  nodes.forEach((n) => {
    const el = document.getElementById(`${htmlid}-${n.node_id}`);
    if (el) {
      const x = n.x - node_el_width * 0.5;
      const y = n.y;

      if (n.node_id === selected) {
        visible_nodes.push({ x, y });
        selected_pos = { x, y };
      }
    }
  });

  const nodes_box = visible_nodes.reduce(
    (
      acc: { min: { x: number; y: number }; max: { x: number; y: number } },
      n,
    ) => ({
      min: {
        x: Math.min(acc.min.x, n.x - 24),
        y: Math.min(acc.min.y, n.y - 24),
      },
      max: {
        x: Math.max(acc.max.x, n.x + node_el_width * 0.5 - 24),
        y: Math.max(acc.max.y, n.y + 24),
      },
    }),
    {
      min: {
        x: selected_pos ? selected_pos.x - 96 : dimensions.x,
        y: selected_pos ? selected_pos.y - 256 : dimensions.y,
      },
      max: {
        x: selected_pos ? selected_pos.x + 96 : -dimensions.x,
        y: selected_pos ? selected_pos.y + 128 : -dimensions.y,
      },
    },
  );
  const nodes_box_center = {
    x: (nodes_box.max.x + nodes_box.min.x) * 0.5,
    y: (nodes_box.max.y + nodes_box.min.y) * 0.5,
  };
  const nodes_box_dimensions = {
    x: Math.max(
      dimensions.x * 0.5,
      Math.min(dimensions.x, nodes_box.max.x - nodes_box.min.x),
    ),
    y: Math.max(
      dimensions.y * 0.5,
      Math.min(dimensions.y, nodes_box.max.y - nodes_box.min.y),
    ),
  };
  const center = !selected_pos
    ? nodes_box_center
    : {
        x:
          (selected_pos.x +
            nodes_box_center.x * 3 +
            (nodes_box_center.x < selected_pos.x + node_el_width
              ? node_el_width * 2
              : 0)) *
          0.25,
        y:
          (selected_pos.y +
            nodes_box_center.y * 3 +
            Math.max(0, dimensions.y * 0.5 - node_el_width * 0)) *
          0.25,
      };

  return { nodes_box_dimensions, center };
};

export const calculateLevels = (
  nodes: Array<d3NodeNode>,
  links: Array<d3Link>,
  graph: Graph,
  selected: string,
): Levels => {
  const find_childest = (n) => {
    const e = graphEdgeOut(graph, n);
    if (e && !ispromise(e)) {
      return find_childest(e.to);
    } else {
      return n;
    }
  };
  selected = selected[0];
  const top = find_childest(selected);

  const levels = new Map();
  bfs(graph, (id, level) =>
    levels.set(id, Math.min(levels.get(id) || Number.MAX_SAFE_INTEGER, level)),
  )(top, 0);

  const parents = new Map(
    nodes.map((n) => [
      n.node_id,
      links
        .filter((l) =>
          typeof l.target == "object"
            ? (l.target as d3NodeNode).node_id === n.node_id
            : l.target === n.node_id,
        )
        .map((l) =>
          typeof l.source === "object"
            ? (l.source as d3NodeNode).node_id
            : String(l.source),
        ),
    ]),
  );

  [...parents.values()].forEach((nps) => {
    nps.sort((a, b) => parents.get(b).length - parents.get(a).length);
    for (let i = 0; i < nps.length * 0.5; i++) {
      if (i % 2 === 1) {
        const tmp = nps[i];
        const endidx = nps.length - 1 - Math.floor(i / 2);
        nps[i] = nps[endidx];
        nps[endidx] = tmp;
      }
    }
  });

  const children = new Map(
    nodes.map((n) => [
      n.node_id,
      links
        .filter(
          (l) =>
            (typeof l.source === "object"
              ? (l.source as d3NodeNode).node_id
              : l.source) === n.node_id,
        )
        .map((l) =>
          typeof l.target === "object"
            ? (l.target as d3NodeNode).node_id
            : String(l.target),
        ),
    ]),
  );
  const siblings = new Map(
    nodes.map((n) => [
      n.node_id,
      [
        ...new Set(
          children.has(n.node_id)
            ? children.get(n.node_id).flatMap((c) => parents.get(c) || [])
            : [],
        ).values(),
      ],
    ]),
  );
  const distance_from_selected = new Map();

  const calculate_selected_graph = (s, i) => {
    const id = s;
    if (distance_from_selected.get(id) <= i) {
      return;
    }

    distance_from_selected.set(id, i);
    if (parents.has(s)) {
      parents.get(s).forEach((p) => {
        calculate_selected_graph(p, i + 1);
      });
    }
    if (children.has(s)) {
      children.get(s).forEach((c) => {
        calculate_selected_graph(c, i + 1);
      });
    }
  };

  calculate_selected_graph(selected, 0);

  return {
    level_by_node: levels,
    parents,
    children,
    siblings,
    distance_from_selected,
    min: Math.min(...levels.values()),
    max: Math.max(...levels.values()),
    nodes_by_level: [...levels.entries()].reduce(
      (acc, [n, l]) => (acc[l] ? acc[l].push(n) : (acc[l] = [n]), acc),
      {},
    ),
  };
};

const parseTypedArg = (value: string): [string, TypedArg] => {
  const argColon =
    value.includes(":") &&
    [
      value.substring(0, value.indexOf(":")),
      value.substring(value.indexOf(":") + 1),
    ].map((v) => v.trim());
  const outName = (argColon[0] ?? value).includes(".")
    ? (argColon[0] ?? value).split(".")[0]
    : argColon[0] ?? value;
  if (!argColon) return [outName, "any"];
  if (argColon[1] === "internal")
    return [outName, { type: "any", local: true }];
  if (argColon[1] === "default")
    return [outName, { type: "any", default: true }];
  try {
    return [outName, JSON.parse(argColon[1])];
  } catch (e) {
    console.error("Error parsing arg type", e);
  }

  return [outName, "any"];
};

export const CalculateSelectedNodeArgsEffect: ha.Effecter<
  HyperappState,
  {
    graph: Graph;
    node_id: string;
    cachedMetadata: Record<string, NodeMetadata>;
  }
> = (dispatch, { graph, node_id, cachedMetadata }) =>
  wrapPromise(node_args(nolib, graph, node_id, cachedMetadata)).then(
    (nodeArgs) =>
      dispatch((s) => ({
        ...s,
        selectedNodeArgs: nodeArgs.nodeArgs,
        selectedNodeEdgeLabels: nodeArgs.nodeOutArgs?.map((a) => a.name) ?? [],
      })),
  ).value;

export const node_args = (
  nolib: Record<string, any>,
  graph: Graph,
  node_id: string,
  cachedMetadata: Record<string, NodeMetadata> = {},
):
  | { nodeArgs: Array<NodeArg>; nodeOutArgs?: Array<NodeArg> }
  | Promise<{ nodeArgs: Array<NodeArg>; nodeOutArgs?: Array<NodeArg> }> => {
  const node = nolib.no.runtime.get_node(graph, node_id);
  if (!node) {
    // between graph update and simulation update it's possible links are bad
    return Promise.resolve({ nodeArgs: [] });
  }
  const node_ref = node?.ref ? nolib.no.runtime.get_ref(node.ref) : node;
  const edges_in = graphEdgesIn(graph, node_id);
  const edge_out = graphEdgeOut(graph, node_id);
  if (ispromise(edges_in) || ispromise(edge_out)) {
    return Promise.resolve({ nodeArgs: [] });
  }
  const node_out = edge_out && nolib.no.runtime.get_node(graph, edge_out.to);
  return (
    wrapPromise(cachedMetadata[graph.id + "/" + node_id])
      // NOTE: there's a mutation of cachedMetadata here
      .then(
        (metadata) =>
          wrapPromise(
            edge_out && node_args(nolib, graph, edge_out.to, cachedMetadata),
          ).then((nodeOutNodeArgs) => {
            const nodeOutNodeArg = nodeOutNodeArgs?.nodeArgs.find(
              (a) => a.name === edge_out.as,
            );
            const node_out_args: Array<[string, string | FullyTypedArg]> =
              node_out?.ref === "@flow.runnable"
                ? Object.values(ancestor_graph(node_out.id, graph, nolib).nodes)
                    .filter(isNodeRef)
                    .filter((n) => n.ref === "arg")
                    .map((a) =>
                      a.value?.includes(".")
                        ? a.value?.substring(0, a.value?.indexOf("."))
                        : a.value,
                    )
                    .map((a) => [a, "any"])
                : nodeOutNodeArg?.type &&
                    typeof nodeOutNodeArg.type === "object"
                  ? Object.entries(nodeOutNodeArg.type).map<
                      [string, string | FullyTypedArg]
                    >((e) =>
                      typeof e[1] === "function"
                        ? [e[0], e[1](graph, edge_out.to)]
                        : (e as [string, string | FullyTypedArg]),
                    )
                  : undefined;

            // const argslist_path = node_ref?.nodes && nolib.no.runtime.get_path(node_ref, "argslist");

            const nextIndexedArg =
              "arg" +
              (
                edges_in
                  ?.filter(
                    (l) =>
                      l.as?.startsWith("arg") &&
                      new RegExp("[0-9]+").test(l.as.substring(3)),
                  )
                  .map((l) => parseInt(l.as.substring(3))) ?? []
              ).reduce((acc, i) => (acc > i ? acc : i + 1), 0);

            const externfn =
              (node.ref === "extern" &&
                nodysseus_get(nolib, node.value, newLib(nolib))) ||
              (node_ref?.ref === "extern" &&
                nodysseus_get(nolib, node_ref?.value, newLib(nolib)));
            const externArgs =
              externfn &&
              (Array.isArray(externfn.args)
                ? externfn.args.map((a) => {
                    const argColonIdx = a.indexOf(":");
                    return [
                      argColonIdx >= 0 ? a.substring(0, argColonIdx) : a,
                      "any",
                    ];
                  })
                : externfn?.args && typeof externfn.args === "object"
                  ? Object.entries(externfn.args)
                  : []);
            const baseargs: Array<[string, TypedArg]> = externfn
              ? externArgs
                ? externArgs
                : ["args"]
              : isNodeGraph(node_ref)
                ? Object.values(node_ref?.nodes)
                    .filter(isNodeRef)
                    .filter((n) => n.ref === "arg")
                    .map<[string, TypedArg]>((n) => parseTypedArg(n.value))
                    .filter((a) => typeof a[1] === "string" || !a[1].local) ??
                  []
                : [];

            const scriptVarNames =
              node.ref === "@js.script" && new Set<string>();
            if (node.ref === "@js.script" && typeof node.value === "string") {
              const scriptVarDecs =
                node.ref === "@js.script" && new Set<string>();
              parser.parse(node.value).iterate({
                enter: (syntaxNode) =>
                  syntaxNode.name === "VariableName" &&
                  !window[node.value.substring(syntaxNode.from, syntaxNode.to)]
                    && node.value.substring(syntaxNode.from, syntaxNode.from + 1) !== "_"
                    ? !!scriptVarNames.add(
                        node.value.substring(syntaxNode.from, syntaxNode.to),
                      )
                    : syntaxNode.name === "VariableDeclaration"
                      ? syntaxNode.node.getChild("VariableDefinition")
                          ? !!scriptVarDecs.add(
                              node.value.substring(
                                syntaxNode.node.getChild("VariableDefinition").from,
                                syntaxNode.node.getChild("VariableDefinition").to,
                              ),
                            )
                        : syntaxNode.node.getChild("ObjectPattern")?.getChild("PatternProperty")
                          ? syntaxNode.node.getChild("ObjectPattern")?.getChildren("PatternProperty").forEach(n => {
                            const nameNode = n.getChild("PropertyName");
                            scriptVarDecs.add(node.value.substring(nameNode.from, nameNode.to));
                        })
                          : undefined
                      : undefined,
              });
              scriptVarDecs.forEach((dec) => scriptVarNames.delete(dec));
            }

            if (metadata?.parameters) {
              Object.entries(metadata.parameters).forEach((pe) =>
                baseargs.push([pe[0], isTypedArg(pe[1]) ? pe[1] : "any"]),
              );
            }

            const typedArgsMap = new Map(
              edges_in
                ?.map<[string, TypedArg]>((e) => [
                  e.as,
                  {
                    type: "any",
                    additionalArg: !baseargs.map((a) => a[0]).includes(e.as),
                  },
                ])
                .concat(baseargs)
                .filter(
                  (a: [string, TypedArg]) =>
                    !a[0].includes(".") && !a[0].startsWith("_"),
                )
                .concat(
                  (externArgs &&
                    externArgs.map((a) => a[0]).includes("_node_args")) ||
                    baseargs.map((a) => a[0]).includes("_args") ||
                    (node.ref === undefined && !node.value)
                    ? [[nextIndexedArg, { type: "any", additionalArg: true }]]
                    : [],
                )
                .concat(node_out_args ? node_out_args : [])
                .concat(
                  scriptVarNames
                    ? [...scriptVarNames].map((n) => [n, "any"])
                    : [],
                ),
            );

            return {
              nodeArgs: [...typedArgsMap].map((a: [string, TypedArg]) => ({
                exists: !!edges_in?.find((e) => e.as === a[0]),
                name: a[0],
                ...(typeof a[1] === "object" ? a[1] : { type: a[1] }),
              })),
              nodeOutArgs: nodeOutNodeArgs?.nodeArgs,
            };
          }).value,
      ).value
  );
};

export const save_graph = (graph) => {
  graph = base_graph(graph);
  const graphstr = JSON.stringify(base_graph(graph));
  // localStorage.setItem(graph.id, graphstr);
  nolib.no.runtime.add_ref(graph);
};

// Graph helpers - these are here to operate on graph objects instead of nolib which uses the store

export const graphEdgeOut = (graph: Graph, node: string) => graph.edges[node];
export const graphEdgesIn = (graph: Graph, node: string) =>
  graph["edges_in"]
    ? Object.hasOwn(graph.edges_in, node)
      ? Object.values(graph.edges_in[node])
      : []
    : Object.values(graph.edges).filter((e) => e.to === node);

export const HTMLView = ({ stateSignal }) =>
  createElement(HTMLComponent, stateSignal.value);
export const HTMLComponent = ({
  dom_type,
  props,
  children,
  text,
  ref,
}: {
  dom_type: string;
  props: {};
  children: Array<any>;
  text?: string;
  ref?: (ref: { ref: HTMLElement }) => void;
}) => {
  return dom_type === "text_value"
    ? createElement("span", null, typeof text === "object" ? "" : text)
    : createElement(
        dom_type,
        Object.fromEntries(
          Object.entries(props ?? {})
            .map((e) =>
              typeof e[1] === "function"
                ? [e[0], (event) => (e[1] as Function)({ event })]
                : e,
            )
            .concat(ref ? ["ref", (val) => ref({ ref: val })] : []),
        ),
        children
          ?.map((c) => c.el ?? c)
          .filter((c) => !!c)
          .map((c) =>
            c.dom_type === "text_value"
              ? c.text
              : createElement(HTMLComponent, c),
          ) ?? [],
      );
};

export const embeddedHTMLView = (htmlId) => {
  let displayState: {
    el: {
      dom_type: string;
      props: {};
      children: Array<any>;
      text?: string;
      lifecycle?: Record<string, Function>;
    };
  } = {
    el: {
      dom_type: "div",
      props: {},
      children: [{ dom_type: "text_value", text: "" }],
    },
  };
  const stateSignal = signal(displayState.el);
  const el = document.getElementById(htmlId);
  render(createElement(HTMLView, { stateSignal }), el);
  return (evt, payload) => {
    try {
      displayState =
        typeof evt === "function" ? evt(displayState, payload) : evt;
      stateSignal.value = displayState.el;
    } catch (e) {
      console.error("Error rendering result view", e);
    }
  };
};

let runtime: NodysseusRuntime, infoRuntime: NodysseusRuntime;

export const hlibLib = mergeLib(
  nolibLib,
  newLib({
    runtime: () => runtime,
    infoRuntime: () => infoRuntime,
    ha: {
      h: {
        args: ["dom_type", "props", "children", "memo"],
        fn: (dom_type, props, children, usememo) =>
          usememo
            ? ha.memo(runh, { d: dom_type, p: props, c: children })
            : runh({ d: dom_type, p: props, c: children }),
      },
      app: ha.app,
      text: { args: ["text"], fn: ha.text },
    },
    scripts: {
      d3subscription,
      updateSimulationNodes,
      keydownSubscription,
      calculateLevels,
      listen,
      graph_subscription,
      save_graph,
    },
    panzoom: pzobj,
    run: (targetRuntime, graph, fn, _output) => {
      if (!targetRuntime) {
        console.info("no runtime", graph, fn);
        return;
      }
      try {
        const result = wrapPromise(targetRuntime.runGraphNode(graph, fn)).then(
          (nodeOutput) => targetRuntime.runNode(nodeOutput[_output ?? "value"]),
        ).value;
        if (ispromise(result)) {
          return result.catch((e) => console.error(e));
        }

        return result;
      } catch (e) {
        console.error(e);
      }
    },
    initStore: (nodysseusStore, autorun) => {
      initStore(nodysseusStore);
      runtime = new NodysseusRuntime(
        "runtime",
        nodysseusStore,
        hlibLib,
        autorun ? "graphchange" : "graphchangeready",
      );
      infoRuntime = new NodysseusRuntime(
        "infoRuntime",
        nodysseusStore,
        hlibLib,
        "graphchange",
      );
    },
    d3: {
      forceSimulation,
      forceManyBody,
      forceCenter,
      forceLink,
      forceRadial,
      forceY,
      forceCollide,
      forceX,
    },
    worker: {
      current: undefined,
    },
    workerPostMessage: {
      args: ["runnable", "args"],
      fn: (
        runnable: { graph: string; fn: string; nodeGraphId: string },
        args: Record<string, any>,
      ) => {
        return wrapPromise(hlib.worker.current()).then((worker) => {
          const transferableObjects = [...Object.entries(args)].filter(
            (kv) => kv[1]?.isTransferable,
          );
          transferableObjects.forEach((e) => (args[e[0]] = e[1].value));
          return worker.postMessage(
            {
              graph: runnable.graph,
              fn: runnable.fn,
              nodeGraphId: runnable.nodeGraphId,
              env: {
                data: new Map(
                  Object.entries(args).map((e) => [
                    e[0],
                    e[1]?.__kind === "varNode"
                      ? { __kind: "varNode", id: e[1].id }
                      : e[1],
                  ]),
                ),
              },
            },
            transferableObjects.map((kv) => kv[1].value),
          );
        });
      },
    },
    domTypes,
    extern: {
      jsx: {
        outputs: {
          metadata: true,
        },
        args: ["jsx", "__graph_value", "_node_args", "_output"],
        fn: (
          jsx: string,
          graphvalue: string,
          _node_args: Record<string, unknown>,
          _output: string,
        ) => {
          const nodes = JsxParser.parse(jsx ?? graphvalue, {
            ecmaVersion: "latest",
          }) as ESTreeNode;

          const parameters = {};

          if (_output === "metadata") {
            visit(nodes, {
              visitJSXIdentifier(path) {
                if (!Object.hasOwn(domTypes, path.node.name)) {
                  parameters[path.node.name] = "@flow.runnable";
                }
                return false;
              },
              visitIdentifier(path) {
                parameters[path.node.name] = "any";
                return false;
              },
            });
            return {
              parameters,
              codeEditor: {
                language: "javascript",
                editorText: jsx ?? graphvalue,
              },
            };
          }

          const outputPath = [];
          const output = {};

          const runnableEls: Record<string, Function> = {};

          visit(nodes, {
            visitLiteral(path) {
              justSet(output, outputPath, path.node.value);
              outputPath.pop();
              return false;
            },
            visitJSXIdentifier(path) {
              if (
                path.name === "name" &&
                path.parentPath.parentPath.name === "attributes"
              ) {
                outputPath.push(path.node.name);
              }
              this.traverse(path);
            },
            visitIdentifier(path) {
              const argval = _node_args[path.node.name];
              const propsIdx = outputPath.lastIndexOf("props");
              const childrenIdx = outputPath.lastIndexOf("children");
              justSet(
                output,
                outputPath,
                !argval
                  ? argval
                  : Array.isArray(argval)
                    ? [...argval]
                    : typeof argval === "object"
                      ? { ...argval }
                      : childrenIdx > propsIdx
                        ? { dom_type: "text_value", text: `${argval}` }
                        : argval,
              );
              outputPath.pop();
              return false;
            },
            visitJSXExpressionContainer(path) {
              if (path.parentPath.name === "children") {
                if (path.name === 0) {
                  outputPath.push("children");
                }

                outputPath.push(path.name);
              }
              this.traverse(path);
              if (path.parentPath.name === "children") {
                // popped by the identifier
                if (path.name === path.parent.node.children.length - 1) {
                  outputPath.pop();
                }
              }
            },
            visitJSXOpeningElement(path) {
              outputPath.push("props"), this.traverse(path);
              outputPath.pop();
            },
            visitJSXAttribute(path) {
              this.traverse(path);
              if (path.node.name.name === "style") {
                const attrPath = outputPath.concat([path.node.name.name]);
                const styleString = justGet(output, attrPath);
                justSet(
                  output,
                  attrPath,
                  Object.fromEntries(
                    styleString
                      .split(";")
                      .map((v) => v.split(":").map((v) => v.trim())),
                  ),
                );
              }
            },
            visitJSXElement(path) {
              const node = path.node;
              if (path.parentPath.name === "children") {
                if (path.name === 0) {
                  outputPath.push("children");
                }

                outputPath.push(path.name);
              }

              const nodeName = (node.openingElement.name as JSXIdentifierKind)
                .name;

              justSet(output, outputPath, {});

              if (Object.hasOwn(_node_args, nodeName)) {
                runnableEls[outputPath.join(".")] = _node_args[
                  nodeName
                ] as Function;
              } else {
                justSet(output, outputPath.join(".") + ".dom_type", nodeName);
              }

              const outputNode = justGet(output, outputPath);
              outputNode.props = {};
              outputNode.children = [];
              this.traverse(path);
              if (path.parentPath.name === "children") {
                outputPath.pop();
                if (path.name === path.parent.node.children.length - 1) {
                  outputPath.pop();
                }
              }
            },
            visitJSXText(path) {
              if (path.parentPath.name === "children" && path.name === 0) {
                outputPath.push("children");
              }
              const node = path.node;
              justSet(output, outputPath.join(".") + `.${path.name}`, {
                dom_type: "text_value",
                text: node.raw,
              });
              if (path.parentPath.name === "children") {
                if (path.name === path.parent.node.children.length - 1) {
                  outputPath.pop();
                }
              }
              return false;
            },
          });

          return wrapPromiseAll(
            Object.entries(runnableEls).map((e) =>
              wrapPromise(e[1](justGet(output, e[0]).props)).then((el) =>
                el
                  ? justSet(output, e[0], el)
                  : justSet(output, e[0] + ".dom_type", "div"),
              ),
            ),
          ).then(() => output).value;
        },
      },
    },
  }),
);

export const hlib = hlibLib.data;
