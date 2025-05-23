import { nolib, NodysseusError, nolibLib } from "../nodysseus.js";

import * as ha from "hyperapp";
import Fuse from "fuse.js";
import { create_randid, wrapPromise, base_graph } from "../util.js";
import {
  Edge,
  Graph,
  isNodeGraph,
  isNodeRef,
  isNodeValue,
  NodysseusNode,
} from "../types.js";
import {
  calculateLevels,
  ChangeEditingGraphId,
  Copy,
  CustomDOMEvent,
  DeleteNode,
  ExpandContract,
  FocusEffect,
  graph_subscription,
  hlib,
  hlibLib,
  isNodysseusError,
  keydownSubscription,
  listen,
  Paste,
  pzobj,
  refresh_graph_display,
  result_subscription,
  SaveGraph,
  SelectNode,
  select_node_subscription,
  embeddedHTMLView,
  infoWindowSubscription,
  UpdateNodeMetadata,
  UpdateResultDisplay,
  CreateNode,
} from "./util.js";
import { info_display, infoWindow } from "./components/infoWindow.js";
import { init_code_editor } from "./components/codeEditor.js";
import { d3NodeNode, HyperappState, Levels } from "./types.js";
import { initPort, sharedWorkerRefStore, webClientStore } from "./store.js";
import {
  d3subscription,
  getLinks,
  getNodes,
  insert_node_el,
  link_el,
  node_el,
  UpdateSimulation,
} from "./components/graphDisplay.js";
import Autocomplete from "./autocomplete.js";
import { automergeRefStore } from "./automergeStore.js";
import helloWorld from "../initgraph.json" with {type : "json"};
import { run_h } from "./hyperapp.js";
import { urlRefStore } from "src/store.js";

customElements.define("autocomplete-list", Autocomplete);

const SimulationToHyperapp = (state, payload) => [
  {
    ...state,
    levels: calculateLevels(
      payload.nodes,
      payload.links,
      state.editingGraph,
      state.selected
    ),
    nodes: payload.nodes,
    links: payload.links,
    randid: create_randid(state.editingGraph),
  },
  [
    CustomDOMEvent,
    {
      html_id: state.html_id,
      event: "updategraph",
      detail: { graph: state.editingGraph },
    },
  ],
];

const Search = (state, { payload, nodes }) => {
  if (payload.key === "Escape") {
    return [
      { ...state, search: false, search_index: 0 },
      [() => (payload.target.value = "")],
    ];
  }

  const direction = payload.key === "Enter" ? (payload.shiftKey ? -1 : 1) : 0;
  // @ts-expect-error fuze issues
  const search_results = new Fuse<NodysseusNode>(
    nodes.map((n) =>
      Object.assign(
        {},
        n,
        nolib.no.runtime.get_node(state.editingGraph, n.node_id),
        nolib.no.runtime.get_edge_out(state.editingGraph, n.node_id)
      )
    ),
    { keys: ["name", "ref", "value", "as", "id"] }
  ).search(payload.target.value);
  const search_index =
    search_results.length > 0
      ? (search_results.length + (state.search_index ?? 0) + direction) %
        search_results.length
      : 0;

  return [
    {
      ...state,
      search: payload.target.value,
      search_index,
      searchResults: search_results.map((r) => r.item.id),
    },
    search_results.length > 0 && [
      (dispatch) =>
        requestAnimationFrame(() =>
          dispatch(SelectNode, {
            node_id: search_results[search_index].item.id,
          })
        ),
    ],
  ];
};

const search_el = ({ search }) =>
  ha.h("div", { id: "search" }, [
    typeof search === "string" &&
      ha.h(
        "input",
        {
          type: "text",
          onkeydown: (state: any, payload) => [
            Search,
            { payload, nodes: getNodes(state.simulation) },
          ],
          onblur: (state: HyperappState, payload: FocusEvent) => ({
            ...state,
            searchFocused: false,
            search: (payload.target as HTMLInputElement).value || false,
          }),
          onfocus: (state: HyperappState, _payload) => ({
            ...state,
            searchFocused: true,
          }),
        },
        []
      ),
    typeof search !== "string" &&
      ha.h(
        "span",
        {
          class: "material-symbols-outlined graph-action",
          onclick: (s: any) => [
            { ...s, search: "" },
            [FocusEffect, { selector: "#search input" }],
          ],
        },
        [ha.text("search")]
      ),
  ]);

const show_error = (e, showErrors) => {
  const errors = ha.h(
    "div",
    {
      class: "errors", style: {
        display: showErrors ? "block" : "none"
      }
    },
    (Array.isArray(e)
      ? [...new Set(e.map((se) => se).filter((em) => em))]
      : [e]
    ).flatMap((e: NodysseusError) =>
      [
        ha.h("pre",
          {},
          [

            ha.h("span",
              { class: "message" },
              [ha.text(`${e.message}\n\n`)],
            ),
            e.cause?.node_id &&
            ha.h("span",
              {
                class: "goto",
                onclick: [SelectNode, { node_id: e.cause.node_id.split("/")[1] }],
              },
              [ha.text(">>")],
            ),
          ].filter((c) => c))

      ].filter((c) => c)
    )
  );

  return ha.h("div", { class: "error-wrapper" }, [
    ha.h(
      "span",
      {
        class: "material-symbols-outlined",
        style: {
          position: "relative",
          zIndex: "12",
          cursor: "pointer",
          userSelect: "none",
          padding: "0.4em",
        },
        onclick: (s: HyperappState) => (
          console.log("clicked error"), [{ ...s, showErrors: !s.showErrors }]
        ),
      },
      [ha.text("error")]
    ),
    errors,
  ]);
};

const result_display = (html_id) => embeddedHTMLView(html_id + "-result");

const custom_editor_display = (html_id) =>
  ha.app({
    init: { el: { dom_type: "div", props: {}, children: [] } },
    node: document.getElementById(html_id + "-custom-editor-display"),
    view: (s) => {
      return run_h(s.el, ["@js.script"]);
    },
  });

const refresh_custom_editor = () =>
  wrapPromise(nolib.no.runtime.get_ref("custom_editor")).then((graph) => {
    if (graph) {
      // TODO: combine with update_info
      const graph = nolib.no.runtime.get_ref("custom_editor");
      wrapPromise(graph)
        .then((graph) => hlib.run(hlib.runtime(), graph, graph.out, "display"))
        .then(
          (result) =>
            result && custom_editor_display_dispatch(() => ({ el: result }))
        );
    } else {
      custom_editor_display_dispatch(() => ({
        el: { dom_type: "div", props: {}, children: [] },
      }));
    }
  }).value;

const defs = () =>
  ha.h("defs", {}, [
    ha.h(
      "filter",
      { id: "flood-background", width: 1.2, height: 1.1, x: 0, y: 0 },
      [
        ha.h("feFlood", { floodColor: "#000a" }),
        ha.h("feComposite", { in: "SourceGraphic", operator: "over" }),
      ]
    ),
    ha.h(
      "marker",
      {
        id: "arrow",
        refX: 8,
        refY: 4,
        markerWidth: 8,
        markerHeight: 8,
        markerUnits: "userSpaceOnUse",
        orient: "auto",
      },
      [ha.h("polyline", { points: "1 1, 8 4, 1 8" })]
    ),
  ]);

let result_display_dispatch;
let result_background_display_dispatch;
let info_display_dispatch;
let custom_editor_display_dispatch;
// let code_editor;
// let code_editor_nodeid;
// let code_editor_nodeid_field;

const mutationObserverSubscription = (dispatch, { selector }) => {
  const mutobs = new MutationObserver((obs) =>
    requestAnimationFrame(() =>
      obs.forEach((mutrec) =>
        mutrec.addedNodes.forEach((added) => {
          const publishel = (addedel) => {
            if (addedel instanceof HTMLElement) {
              if (addedel.id) {
                nolib.no.runtime.publish(
                  "domnodeadded",
                  { id: addedel.id },
                  nolibLib
                );
              }
              for (const child of addedel.children) {
                publishel(child);
              }
            }
          };

          publishel(added);
        })
      )
    )
  );
  const els = document.querySelectorAll(selector);
  els.forEach((el) => mutobs.observe(el, { childList: true, subtree: true }));
  return () => mutobs.disconnect();
};

const error_nodes = (error) =>
  error instanceof AggregateError ||
  Array.isArray(error) ||
  (error as AggregateError)?.errors
    ? (Array.isArray(error) ? error : error.errors)
        .map((e) => (isNodysseusError(e) ? e.cause.node_id : false))
        .filter((n) => n)
    : isNodysseusError(error)
    ? [error.cause.node_id]
    : [];

// generated using markdown node and help.md
const helpmd = run_h({
  dom_type: "div",
  props: {
    innerHTML: `
<h2>Welcome to Nodysseus!</h2>
<p>To get started, checkout:</p>
<ul>
<li>youtube <a href="https://www.youtube.com/playlist?list=PLNf6veBQIZNohZk_htvTvPCB2UnEl3Tlh">tutorials</a> and <a href="https://www.youtube.com/playlist?list=PLNf6veBQIZNpd8Djjie5W2lo70BkLZotv">videos</a></li>
</ul>
<p>Examples for general editor functionality:</p>
<ul>
<li><p><a href="https://nodysseus.io/#@example.script">@example.script</a>: using javascript with the <code>@js.script</code> node</p>
</li>
<li><p><a href="https://nodysseus.io/#@example.debugInputValue">@example.debugInputValue</a>: debugging using the <code>@debug.inputValue</code> node</p>
</li>
<li><p><a href="https://nodysseus.io/#@example.htmlEvent">@example.htmlEvent</a>: responding to user input with html events</p>
</li>
<li><p><a href="https://nodysseus.io/#@example.referencePersist">@example.referencePersist</a>: storing and persisting values in variables using <code>@memory.reference</code></p>
</li>
<li><p><a href="https://nodysseus.io/#@example.switchInputs">@example.switchInputs</a>: switching inputs with a dropdown using the @flow.switchInputs node</p>
</li>
<li><p><a href="https://nodysseus.io/#@example.returnDependencies">@example.returnDependencies</a>: fine-grained control over whether a node reruns or keeps its value</p>
</li>
<li><p><a href="https://nodysseus.io/#@example.ramp">@example.ramp</a>: introduces a new node, @html.ramp, that remaps a 0 - 1 value to a custom range.</p>
</li>
<li><p><a href="https://nodysseus.io/#@example.nodeDisplay">@example.nodeDisplay</a>: using the display of a node in the graph&#39;s display</p>
</li>
</ul>
<p>Some three.js specific examples:</p>
<ul>
<li><p><a href="https://nodysseus.io/#@example.threejs">@example.threejs</a>: Basic scene to build on</p>
</li>
<li><p><a href="https://nodysseus.io/#@example.threejsDataAttributes">@example.threejsDataAttributes</a>: Converting from three.js geometry to an object with float arrays for easier manipulation of data.</p>
</li>
<li><p><a href="https://nodysseus.io/#@example.threejsLoader">@example.threejsLoader</a>: Loading geometry from a file and storing it in the browser.</p>
</li>
<li><p><a href="https://nodysseus.io/#@example.threejsWorker">@example.threejsWorker</a>: Using three.js from a web worker to keep the main thread free for interaction</p>
</li>
</ul>
<p>And some integrate third party libraries using ESM modules:</p>
<ul>
<li><p><a href="https://nodysseus.io/#@example.markdown">Markdown</a>: markdown using marked.js (this help was written using it then a @nodysseus.writeClipboard node)</p>
</li>
<li><p><a href="https://nodysseus.io/#@example.strudel">Strudel</a>: sounds and music with strudel</p>
</li>
</ul>
`,
  },
  children: [],
});

const runapp = (init, _lib) => {
  // return () => requestAnimationFrame(() => dispatch.dispatch(s => undefined));
  return ha.app({
    init: [
      init,
      [
        (dispatch) =>
          requestAnimationFrame(() => {
            result_display_dispatch = result_display(init.html_id);
            result_background_display_dispatch = result_display(
              init.html_id + "-background"
            );
            info_display_dispatch = info_display(init.html_id);
            custom_editor_display_dispatch = custom_editor_display(
              init.html_id
            );
            dispatch((s) => [
              {
                ...s,
                result_display_dispatch,
                info_display_dispatch,
                custom_editor_display_dispatch,
                result_background_display_dispatch,
              },
              [
                () => {
                  requestAnimationFrame(() => {
                    refresh_custom_editor();
                    nolib.no.runtime.change_graph(
                      base_graph(init.editingGraph),
                      hlibLib
                    );
                  });
                },
              ],
              [
                refresh_graph_display,
                {
                  ...init,
                  graph: init.editingGraph,
                  result_display_dispatch,
                  result_background_display_dispatch,
                },
              ],
            ]);
          }),
      ],
      [
        (dispatch) =>
          wrapPromise(nolib.no.runtime.get_graph("custom_editor"))
            .then((graph) => graph && hlib.run(hlib.runtime(), graph, "out"))
            .then(
              (custom_editor_result) =>
                (console.log("custom_editor_result", custom_editor_result), custom_editor_result) &&
                dispatch((s) => ({ ...s, custom_editor_result }))
            ),
      ],
      [UpdateSimulation, { ...init, action: SimulationToHyperapp }],
      [
        (dispatch) =>
          requestAnimationFrame(() =>
            dispatch(SelectNode, { node_id: init.selected[0] })
          ),
      ],
      [init_code_editor, { html_id: init.html_id }],
      [
        (dispatch) =>
          wrapPromise(nolib.no.runtime.ref_graphs()).then((rgs) =>
            dispatch((s) => ({ ...s, refGraphs: rgs }))
          ),
      ],
    ],
    view: (s: HyperappState) =>
      ha.h("div", { id: s.html_id }, [
        ha.h("div", { id: `${init.html_id}-background-result` }),
        ha.h(
          "svg",
          {
            id: `${s.html_id}-editor`,
            width: s.dimensions.x,
            height: s.dimensions.y,
          },
          [
            ha.h(
              "g",
              { id: `${s.html_id}-editor-panzoom` },
              [ha.memo(defs, {})]
                .concat(
                  getLinks(s.simulation).map((link) =>
                    ha.memo(link_el, {
                      link: Object.assign(
                        {},
                        link,
                        s.editingGraph.edges[
                          (link.source as d3NodeNode).node_id
                        ]
                      ),
                      selected_distance:
                        s.show_all || !s.levels
                          ? 0
                          : s.levels.distance_from_selected.get(
                              (link.source as d3NodeNode).node_id
                            ) > 3
                          ? "far"
                          : s.levels.distance_from_selected.get(
                              (link.source as d3NodeNode).node_id
                            ),
                    })
                  ) ?? []
                )
                .concat(
                  getNodes(s.simulation).map((node) => {
                    const newnode = Object.assign(
                      {},
                      node,
                      s.editingGraph.nodes[node.node_id]
                    );
                    return ha.memo(node_el, {
                      html_id: s.html_id,
                      selected: s.selected[0] === node.node_id,
                      error: !!error_nodes(s.error).find(
                        (e) =>
                          e &&
                          e.startsWith(s.editingGraph.id + "/" + node.node_id)
                      ),
                      selected_distance:
                        s.show_all || !s.levels
                          ? 0
                          : s.levels.distance_from_selected.get(node.node_id) >
                            3
                          ? "far"
                          : s.levels.distance_from_selected.get(node.node_id),
                      node_id: node.node_id,
                      node_name: newnode.name,
                      node_ref: isNodeRef(newnode) ? newnode.ref : undefined,
                      node_value: isNodeValue(newnode)
                        ? newnode.value
                        : undefined,
                      has_nodes: isNodeGraph(newnode)
                        ? newnode.nodes
                        : undefined,
                      nested_edge_count: newnode.nested_edge_count,
                      nested_node_count: newnode.nested_node_count,
                      node_parents: !s.levels
                        ? []
                        : (s.levels as Levels).parents.get(node.node_id),
                      edgeName: s.editingGraph.edges[node.node_id]?.as,
                      isSearchResult: s.searchResults?.includes(node.node_id),
                    });
                  }) ?? []
                )
                .concat(
                  getLinks(s.simulation)
                    .filter(
                      (link) =>
                        (link.source as d3NodeNode).node_id == s.selected[0] ||
                        (link.target as d3NodeNode).node_id === s.selected[0]
                    )
                    .map((link) =>
                      insert_node_el({
                        link,
                        randid: s.randid,
                        node_el_width: s.node_el_width,
                        nodeOffset: s.nodeOffset,
                      })
                    )
                )
            ),
          ]
        ),
        ha.memo(infoWindow, {
          node: Object.assign(
            {},
            getNodes(s.simulation).find((n) => n.node_id === s.selected[0]),
            s.editingGraph.nodes[s.selected[0]]
          ),
          hidden: s.show_all,
          initialLayout: s.initialLayout,
          edges_in: s.selected_edges_in,
          link_out: Object.assign(
            {},
            getLinks(s.simulation).find(
              (l) => (l.source as d3NodeNode).node_id === s.selected[0]
            ),
            s.editingGraph.edges[s.selected[0]]
          ),
          editingGraph: s.editingGraph,
          editingGraphId: s.editingGraph.id,
          randid: s.randid,
          editing: s.editing,
          ref_graphs: s.refGraphs,
          html_id: s.html_id,
          copied_graph: s.copied?.graph,
          inputs: s.inputs,
          graph_out: s.editingGraph.out,
          error: s.error,
          refGraphs: s.refGraphs,
          metadata: s.selectedMetadata ?? s.cachedMetadata[s.selected[0]],
          nodeOffset: s.nodeOffset,
          nodeArgs: !s.show_all && s.selectedNodeArgs ? s.selectedNodeArgs : [],
          nodeEdgeLabels: s.selectedNodeEdgeLabels,
        }),
        ha.h("div", { id: `${init.html_id}-custom-editor-display` }),
        ha.h("div", { class: "top-bar" }, [
          ha.h(
            "div",
            { id: "node-editor-error" },
            s.error && show_error(s.error, s.showErrors)
          ),
          ha.h("div", { id: "graph-actions", class: "actions" }, [
            search_el({ search: s.search }),
            ha.h(
              "span",
              {
                class: "material-symbols-outlined graph-action",
                style: {
                  transformOrigin: "center",
                  transform: `rotate(${s.displayGraphId ? "0" : "45"}deg)`,
                },
                onclick: (s: HyperappState) => ({
                  ...s,
                  displayGraph: s.displayGraph ? false : s.editingGraph,
                  displayGraphId: s.displayGraphId ? false : s.editingGraphId,
                }),
              },
              [ha.text("push_pin")]
            ),
            ha.h(
              "span",
              {
                class: "material-symbols-outlined graph-action",
                onclick: (s: HyperappState) => [
                  { ...s, norun: !s.norun },
                  () => {
                    nolib.no.runtime.togglePause(!s.norun);
                  },
                  // s.norun && [refresh_graph, {
                  //   graph: s.displayGraph ?? s.editingGraph,
                  //   norun: !s.norun,
                  //   graphChanged: false,
                  //   result_display_dispatch: s.result_display_dispatch,
                  //   result_background_display_dispatch: s.result_background_display_dispatch,
                  //   info_display_dispatch: s.info_display_dispatch,
                  //   code_editor: s.code_editor,
                  //   code_editor_nodeid: s.code_editor_nodeid
                  // }],
                  () => {
                    const params = new URLSearchParams(location.search);
                    if (params.get("norun") === "true") {
                      params.delete("norun");
                    } else {
                      params.set("norun", "true");
                    }
                    location.search = params.toString();
                  },
                ],
              },
              [ha.text(s.norun ? "play_arrow" : "pause")]
            ),
            s.norun &&
              ha.h(
                "span",
                {
                  class: "material-symbols-outlined graph-action",
                  onclick: (s: HyperappState) => [
                    s,
                    () => {
                      nolib.no.runtime.publish(
                        "graphchangeready",
                        { graph: nolib.no.runtime.get_ref(s.editingGraphId) },
                        nolibLib
                      );
                      wrapPromise(
                        hlib.run(
                          hlib.runtime(),
                          s.editingGraph,
                          s.editingGraph.out ?? "out",
                          "display"
                        )
                      ).then((display) => {
                        display &&
                          (!display.background || display.resultPanel) &&
                          result_display_dispatch(UpdateResultDisplay, {
                            el: display?.resultPanel
                              ? display.resultPanel
                              : display?.dom_type
                              ? display
                              : {
                                  dom_type: "div",
                                  props: {},
                                  children: [],
                                },
                          });
                        display &&
                          display.background &&
                          result_background_display_dispatch({
                            el: display?.background
                              ? display.background
                              : { dom_type: "div", props: {}, children: [] },
                          });
                      });
                    },
                    [
                      UpdateNodeMetadata,
                      {
                        editingGraph: s.editingGraph,
                        node: s.editingGraph.nodes[s.selected[0]],
                      },
                    ],
                  ],
                },
                [ha.text("resume")]
              ),
            ha.h(
              "span",
              {
                class: "material-symbols-outlined graph-action",
                name: "sync-outline",
                onclick: (s: HyperappState) => [
                  s,
                  [
                    (dispatch) => {
                      nolib.no.runtime.delete_cache();
                      // nolib.no.runtime.clearListeners();
                      hlib.run(
                        hlib.runtime(),
                        s.editingGraph,
                        s.editingGraph.out ?? "out",
                        "value"
                      );
                      refresh_custom_editor();
                      requestAnimationFrame(() =>
                        dispatch((s) => [
                          s,
                          [
                            () => {
                              s.simulation.simulation.alpha(1);
                              s.simulation.simulation.nodes([]);
                            },
                            {},
                          ],
                          [UpdateSimulation, {}],
                        ])
                      );
                    },
                    {},
                  ],
                ],
              },
              [ha.text("refresh")]
            ),
            ha.h(
              "span",
              {
                class: "material-symbols-outlined graph-action",
                name: "undo",
                onclick: (s: HyperappState) => [
                  s,
                  () => {
                    nolib.no.runtime.undo(s.editingGraphId);
                  },
                ],
              },
              [ha.text("undo")]
            ),
            ha.h(
              "span",
              {
                class: "material-symbols-outlined graph-action",
                name: "redo",
                onclick: (s: HyperappState) => [
                  s,
                  () => {
                    nolib.no.runtime.redo(s.editingGraphId);
                  },
                ],
              },
              [ha.text("redo")]
            ),
            ha.h(
              "span",
              {
                class: "material-symbols-outlined graph-action",
                name: "help",
                onclick: (s: HyperappState) => ({ ...s, showHelp: true }),
              },
              [ha.text("question_mark")]
            ),
          ]),
        ]),
        ha.h("div", { id: `${init.html_id}-result` }),
        s.showHelp &&
          ha.h(
            "div",
            {
              class: "overlay",
              onclick: (s: HyperappState) => ({ ...s, showHelp: false }),
            },
            [
              ha.h(
                "div",
                {
                  id: "help-window",
                  onclick: (s: HyperappState, e) => (e.stopPropagation(), s),
                },
                [
                  ha.h(
                    "div",
                    { class: "help-actions actions" },
                    ha.h(
                      "span",
                      {
                        class: "material-symbols-outlined graph-action",
                        onclick: (s: HyperappState, _event) => ({
                          ...s,
                          showHelp: false,
                        }),
                      },
                      ha.text("close")
                    )
                  ),
                  helpmd,
                ]
              ),
            ]
          ),
      ]),
    node: document.getElementById(init.html_id),
    subscriptions: (s) => [
      document.getElementById(`${init.html_id}-result`) && [
        mutationObserverSubscription,
        {
          selector: `#${init.html_id}-result, #${init.html_id}-background-result`,
        },
      ],
      document.getElementById(`${init.html_id}-info-display`) && [
        mutationObserverSubscription,
        { selector: `#${init.html_id}-info-display` },
      ],
      [
        d3subscription,
        {
          action: SimulationToHyperapp,
          update: UpdateSimulation,
          htmlid: init.html_id,
        },
      ],
      [
        infoWindowSubscription,
        {
          selected: s.selected,
          selectedVarNode: s.selectedVarNode,
          graph: s.editingGraph.id,
          info_display_dispatch: s.info_display_dispatch,
          code_editor: s.code_editor,
          code_editor_nodeid: s.code_editor_nodeid,
          code_editor_nodeid_field: s.code_editor_nodeid_field,
          codeEditorExtensions: s.codeEditorExtensions,
          cachedMetadata: s.cachedMetadata,
          norun: s.norun,
        },
      ],
      [
        graph_subscription,
        { editingGraphId: s.editingGraphId, norun: s.norun },
      ],
      [select_node_subscription, {}],
      result_display_dispatch &&
        result_background_display_dispatch && [
          result_subscription,
          {
            editingGraphId: s.editingGraphId,
            displayGraphId: s.displayGraphId,
            norun: s.norun,
          },
        ],
      listen("hashchange", (state, evt) =>
        !evt.newURL.includes("#") ||
        state.editingGraphId ===
          evt.newURL.substring(evt.newURL.indexOf("#") + 1) ||
        evt.newURL.substring(evt.newURL.indexOf("#") + 1).length === 0
          ? state
          : [
              state,
              [
                ChangeEditingGraphId,
                {
                  id: evt.newURL.substring(evt.newURL.indexOf("#") + 1),
                  editingGraphId: state.editingGraphId,
                },
              ],
            ]
      ),
      [
        keydownSubscription,
        {
          action: (state: HyperappState, payload) => {
            if (
              document
                .getElementById("node-editor-result")
                .contains(payload.target)
            ) {
              return [state];
            }
            const mode =
              state.editing !== false
                ? "editing"
                : state.searchFocused
                ? "searching"
                : "graph";
            const key_input =
              (payload.ctrlKey ? "ctrl_" : "") +
              (payload.shiftKey ? "shift_" : "") +
              (payload.key === "?"
                ? "questionmark"
                : payload.key.toLowerCase());
            let action;
            const effects = [];
            const selected = state.selected[0];
            switch (`${mode}_${key_input}`) {
              case "editing_ctrl_o":
              case "searching_ctrl_o":
              case "graph_ctrl_o": {
                action = [
                  SelectNode,
                  { node_id: state.editingGraph.out, focus_property: "name" },
                ];
                payload.stopPropagation();
                payload.preventDefault();
                break;
              }
              case "graph_arrowup": {
                const parent_edges = nolib.no.runtime.get_edges_in(
                  state.editingGraph,
                  selected
                );
                const node_id =
                  parent_edges?.[Math.ceil(parent_edges.length / 2) - 1]?.from;
                action = node_id ? [SelectNode, { node_id }] : [state];
                break;
              }
              case "graph_arrowdown": {
                const child_edge = Object.values(state.editingGraph.edges).find(
                  (e) => e.from === selected
                );
                const node_id = child_edge?.to;
                action = node_id ? [SelectNode, { node_id }] : [state];
                break;
              }
              case "graph_arrowleft":
              case "graph_arrowright": {
                const dirmult = key_input === "arrowleft" ? 1 : -1;
                const current_node = getNodes(state.simulation).find(
                  (n) => n.node_id === selected
                );
                if (state.levels) {
                  const siblings = state.levels.siblings.get(selected);
                  const node_id = siblings.reduce(
                    (dist, sibling) => {
                      const sibling_node = getNodes(state.simulation).find(
                        (n) => n.node_id === sibling
                      );
                      if (!sibling_node) {
                        return dist;
                      }
                      const xdist = Math.abs(sibling_node.x - current_node.x);
                      dist =
                        dirmult * (sibling_node.x - current_node.x) < 0 &&
                        xdist < dist[0]
                          ? [xdist, sibling_node]
                          : dist;
                      return dist;
                    },
                    [state.dimensions.x, undefined] as [
                      number,
                      d3NodeNode | undefined
                    ]
                  )?.[1]?.node_id;
                  action = node_id ? [SelectNode, { node_id }] : [state];
                }
                break;
              }
              case "graph_ctrl_s": {
                effects.push([SaveGraph, state]);
                break;
              }
              case "graph_ctrl_c": {
                if (window.getSelection().isCollapsed) {
                  action = [
                    Copy,
                    {
                      as: nolib.no.runtime.get_edge_out(
                        state.editingGraph,
                        state.selected[0]
                      ).as,
                    },
                  ];
                }
                break;
              }
              case "graph_ctrl_x": {
                if (window.getSelection().isCollapsed) {
                  action = [
                    Copy,
                    {
                      cut: true,
                      as: nolib.no.runtime.get_edge_out(
                        state.editingGraph,
                        state.selected[0]
                      ).as,
                    },
                  ];
                }
                break;
              }
              case "graph_ctrl_v": {
                action = [Paste];
                break;
              }
              case "graph_f": {
                action = (s) => [
                  { ...s, search: "", searchFocused: true },
                  [FocusEffect, { selector: "#search input" }],
                ];
                break;
              }
              case "graph_shift_enter": {
                action = [ExpandContract, { node_id: state.selected[0] }];
                break;
              }
              case "graph_x": {
                action = [
                  DeleteNode,
                  {
                    node_id: state.selected[0],
                  },
                ];
                break;
              }
              case "graph_c": {
                action = [
                  SelectNode,
                  { node_id: state.selected[0], focus_property: "name" },
                ];
                break;
              }
              case "graph_d": {
                action = [
                  SelectNode,
                  { node_id: state.selected[0], focus_property: "value" },
                ];
                break;
              }
              case "graph_g": {
                action = [
                  SelectNode,
                  { node_id: state.selected[0], focus_property: "ref" },
                ];
                break;
              }
              case "graph_e": {
                action = [
                  SelectNode,
                  { node_id: state.selected[0], focus_property: "edge" },
                ];
                break;
              }
              case "graph_i": {
                //TODO: type out inputs
                break;
              }
              case "graph_o": {
                const link = getLinks(s.simulation).filter(
                  (link) =>
                    (link.source as d3NodeNode).node_id == s.selected[0] ||
                    (link.target as d3NodeNode).node_id === s.selected[0]
                )[0];
                action = link && [
                  CreateNode,
                  {
                    node: {},
                    child: (link.target as d3NodeNode).node_id,
                    parent: {
                      from: (link.source as d3NodeNode).node_id,
                      to: (link.target as d3NodeNode).node_id,
                      as: link.edge.as,
                    },
                  },
                ];
                break;
              }
              case "graph_esc": {
                action = [
                  (state) => [
                    {
                      ...state,
                      show_all: true,
                      focused: false,
                      editing: false,
                    },
                    [
                      () =>
                        requestAnimationFrame(() =>
                          nolib.no.runtime.publish(
                            "show_all",
                            { data: true },
                            hlibLib
                          )
                        ),
                    ],
                  ],
                ];
                break;
              }
              case "graph_ctrl_z": {
                const child_edge = Object.values(state.editingGraph.edges).find(
                  (e) => e.from === selected
                );
                const node_id = child_edge?.to;

                nolib.no.runtime.undo(state.editingGraphId);
                effects.push((dispatch) =>
                  requestAnimationFrame(() =>
                    dispatch((s) => {
                      return {
                        ...s,
                        selected: nolib.no.runtime.get_ref(state.editingGraphId)
                          .nodes[s.selected[0]]
                          ? s.selected
                          : [node_id],
                      };
                    })
                  )
                );
                break;
              }
              case "graph_ctrl_y": {
                const child_edge = Object.values(state.editingGraph.edges).find(
                  (e) => e.from === selected
                );
                const node_id = child_edge?.to;
                nolib.no.runtime.redo(state.editingGraphId);
                effects.push((dispatch) =>
                  requestAnimationFrame(() =>
                    dispatch((s) => {
                      return {
                        ...s,
                        selected: nolib.no.runtime.get_ref(state.editingGraphId)
                          .nodes[s.selected[0]]
                          ? s.selected
                          : [node_id],
                      };
                    })
                  )
                );
                break;
              }
              case "editing_ctrl_enter":
              case "graph_ctrl_enter": {
                action = (s) => {
                  nolib.no.runtime.publish(
                    "graphchangeready",
                    { graph: nolib.no.runtime.get_ref(s.editingGraphId) },
                    nolibLib
                  );
                  return s;
                };
                break;
              }
              case "editing_escape": {
                action = (s) => ({ ...s, editing: false });
                break;
              }
              default: {
                nolib.no.runtime.publish(
                  "keydown",
                  { data: key_input },
                  hlibLib
                );
              }
            }

            return action ? action : [state, ...effects];
          },
        },
      ],
      listen("resize", (s) => [
        {
          ...s,
          dimensions: {
            x: document.getElementById(init.html_id).clientWidth,
            y: document.getElementById(init.html_id).clientHeight,
          },
        },
        false && [
          () =>
            nolib.no.runtime.publish(
              "resize",
              {
                x: document.getElementById(init.html_id).clientWidth,
                y: document.getElementById(init.html_id).clientHeight,
              },
              hlibLib
            ),
        ],
      ]),
      !!document.getElementById(`${init.html_id}-editor-panzoom`) && [
        pzobj.init,
        {
          id: `${init.html_id}-editor-panzoom`,
          action: (s, p) => [
            {
              ...s,
              show_all: p.event !== "effect_transform",
              editing: p.event === "effect_transform" && s.editing,
              focused: p.event === "effect_transform" && s.focused,
              noautozoom: p.noautozoom && !s.stopped,
              initialLayout: false,
            },
            [
              () =>
                requestAnimationFrame(() =>
                  nolib.no.runtime.publish(
                    "show_all",
                    { data: p.event !== "effect_transform" },
                    hlibLib
                  )
                ),
            ],
          ],
        },
      ],
    ],
  });
};

const editor = async function (html_id, editingGraphId, lib, inputNorun) {
  // Has to happen before runtime is started
  const url_params = new URLSearchParams(document.location.search);
  const norun = inputNorun || url_params.get("norun") !== null;
  // TODO: rewrite this shitty code that deals with shareworker not being defined
  let sharedWorker, nodysseusStore, ports, initQueue;

  const fallbackRefStore = urlRefStore(
    (typeof window !== "undefined" &&
      window.location.host === "nodysseus.io") ||
      (typeof self !== "undefined" && self.location.host === "nodysseus.io")
      ? "https://nodysseus.azurewebsites.net/api/graphs"
      : "http://localhost:7071"
  );
  if (typeof self.SharedWorker !== "undefined") {
    sharedWorker = new SharedWorker("./sharedWorker.js" + location.search, {
      type: "module",
    });
    nodysseusStore = await webClientStore(() =>
      sharedWorkerRefStore(sharedWorker.port, fallbackRefStore)
    );
  } else {
    ports = [];
    initQueue = [];
    nodysseusStore = await webClientStore((idb) =>
      automergeRefStore({
        nodysseusidb: idb,
        persist: true,
        run: (g, id) =>
          wrapPromise(hlib.runtime().runGraphNode(g, id)).then((outputs) =>
            hlib.runtime().run(outputs.value)
          ).value,
        graphChangeCallback: (graph, changedNodes) =>
          nolib.no.runtime.change_graph(graph, nolibLib, changedNodes, true),
        fallbackRefStore,
      })
    );
  }
  let worker: Worker, workerPromise;
  hlib.initStore(nodysseusStore, !norun);
  hlib.worker.current = () => {
    if (!worker) {
      const workerMessageChannel = new MessageChannel();
      if (sharedWorker) {
        sharedWorker.port.postMessage(
          { kind: "addPort", port: workerMessageChannel.port1 },
          [workerMessageChannel.port1]
        );
      } else {
        initPort(
          { value: nodysseusStore.refs, initQueue },
          ports,
          workerMessageChannel.port1
        );
      }
      worker = new Worker("./worker.js" + location.search, { type: "module" });
      workerPromise = new Promise((res, _rej) => {
        worker.addEventListener("message", (msg) => {
          if (msg.data.type === "started") {
            if (workerMessageChannel) {
              worker.postMessage(
                { kind: "connect", port: workerMessageChannel.port2 },
                [workerMessageChannel.port2]
              );
            }
            workerPromise = false;
            res(worker);
          }
        });
      });
    }

    if (workerPromise) {
      return workerPromise;
    }

    return worker;
  };

  const graph_list = JSON.parse(localStorage.getItem("graph_list")) ?? [];
  const hash_graph = window.location.hash.substring(1);
  editingGraphId =
    editingGraphId ??
    (hash_graph && hash_graph !== ""
      ? hash_graph
      : graph_list?.[0] ?? "helloWorld");
  const editingGraph: Graph =
    editingGraphId === "helloWorld"
      ? (((helloWorld as Graph).edges_in = Object.values(
          helloWorld.edges
        ).reduce(
          (acc: Record<string, Record<string, Edge>>, edge: Edge) => ({
            ...acc,
            [edge.to]: { ...(acc[edge.to] ?? {}), [edge.from]: edge },
          }),
          {}
        ) as Record<string, Record<string, Edge>>),
        await hlibLib.data.no.runtime.add_ref(helloWorld),
        helloWorld)
      : (await hlibLib.data.no.runtime.get_ref(editingGraphId)) ?? helloWorld;

  const init: HyperappState = {
    editingGraphId,
    editingGraph,
    displayGraph: false,
    displayGraphId: false,
    hash: window.location.hash ?? "",
    url_params,
    html_id,
    dimensions: {
      x: document.getElementById(html_id).clientWidth,
      y: document.getElementById(html_id).clientHeight,
    },
    readonly: false,
    norun,
    hide_types: false,
    offset: { x: 0, y: 0 },
    focused: false,
    editing: false,
    search: false,
    searchResults: [],
    searchFocused: false,
    show_all: true,
    show_result: false,
    node_el_width: 256,
    args_display: false,
    selected: [editingGraph.out ?? "out"],
    selected_edges_in: [],
    levels: false,
    error: false,
    showErrors: false,
    inputs: {},
    randid: create_randid(editingGraph),
    custom_editor_result: {},
    showHelp: false,
    refGraphs: [],
    stopped: false,
    noautozoom: false,
    nodeOffset: { x: 0, y: 0 },
    initialLayout: true,
    cachedMetadata: {},
  };

  runapp(init, lib);
};

export { editor };
