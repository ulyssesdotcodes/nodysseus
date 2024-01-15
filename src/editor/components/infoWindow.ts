import { render, createElement } from "preact";
import { signal } from "@preact/signals";
import * as ha from "hyperapp";
import {
  Edge,
  Graph,
  isNodeGraph,
  isNodeRef,
  NodeArg,
  NodeMetadata,
  NodysseusNode,
  RefNode,
  ValueNode,
} from "src/types.js";
import { create_randid, wrapPromise } from "src/util.js";
import { isNonNullChain } from "typescript";
import generic from "../../generic.js";
import { NodysseusError, nolib } from "../../nodysseus.js";
import {
  d3Link,
  d3Node,
  d3NodeNode,
  HyperappState,
  Vector2,
} from "../types.js";
import {
  ChangeEditingGraphId,
  Copy,
  CreateNode,
  CreateRef,
  DeleteNode,
  ExpandContract,
  hlib,
  HTMLComponent,
  HTMLView,
  node_args,
  Paste,
  SaveGraph,
  SelectNode,
  UpdateEdge,
  UpdateNode,
  UpdateNodeEffect,
} from "../util.js";
import { embeddedHTMLView } from "../util.js";

export const info_display = (html_id) =>
  embeddedHTMLView(html_id + "-info-display");

export const infoInput = ({
  label,
  property,
  value,
  onchange,
  oninput,
  onkeydown,
  options,
  inputs,
  disabled,
  icon,
}: {
  label: string;
  property: string;
  value: string;
  inputs: Record<string, string>;
  disabled?: boolean;
  options?: Array<string | { value: string; category?: string }>;
  icon?: string;
  onchange?: ha.Action<HyperappState, { value: string }>;
  oninput?: ha.Action<HyperappState, Event>;
  onkeydown?: ha.Action<HyperappState, Event>;
}) =>
  ha.h(
    "div",
    {
      class: "value-input",
    },
    [
      icon &&
        ha.h("span", { class: "material-symbols-outlined" }, [ha.text(icon)]),
      ha.h("label", { for: `edit-text-${property}` }, [ha.text(label)]),
      ha.h(
        "autocomplete-list",
        {
          class: property,
          id: `edit-text-${property}`,
          key: `edit-text-${property}`,
          name: `edit-text-${property}`,
          value: inputs[`edit-text-${property}`] ?? value ?? "",
          disabled,
          onselect: (state: HyperappState, payload: CustomEvent) => [
            {
              ...state,
              inputs: Object.assign(state.inputs, {
                [`edit-text-${property}`]: undefined,
              }),
            },
            (dispatch) => dispatch(onchange, { value: payload.detail }),
          ],
          oninput: (s: any, e) => [
            {
              ...s,
              inputs: Object.assign(s.inputs, {
                [`edit-text-${property}`]: (e.target as HTMLInputElement).value,
              }),
            },
          ],
          onblur: (state: HyperappState, event) => [
            { ...state, focused: false },
          ],
        },
        options &&
          options.length > 0 &&
          options
            .filter((o) => o)
            .map((o) =>
              ha.h(
                "option",
                {
                  class: "autocomplete-item",
                  value: typeof o === "string" ? o : o.value,
                  "data-category":
                    typeof o === "string" ? undefined : o.category,
                },
                ha.text(typeof o === "string" ? o : o.value),
              ),
            ),
      ),
    ],
  );

export const infoWindow = ({
  node,
  hidden,
  edges_in,
  link_out,
  editingGraph,
  editingGraphId,
  randid,
  ref_graphs,
  html_id,
  copied_graph,
  inputs,
  graph_out,
  editing,
  error,
  refGraphs,
  metadata,
  initialLayout,
  nodeArgs,
  nodeEdgeLabels,
}: {
  node: d3NodeNode;
  hidden: boolean;
  initialLayout: boolean;
  edges_in: Array<Edge>;
  link_out: Edge & d3Link;
  editingGraph: Graph;
  editingGraphId: string;
  randid: string;
  ref_graphs: Array<string>;
  html_id: string;
  copied_graph: Graph;
  inputs: Record<string, string>;
  graph_out: string;
  editing: boolean;
  error: false | NodysseusError;
  refGraphs: Array<string>;
  metadata: NodeMetadata;
  nodeArgs: Array<NodeArg>;
  nodeEdgeLabels: Array<string>;
  nodeOffset: Vector2;
}) => {
  //const s.editingGraph.id === s.editingGraphId && nolib.no.runtime.get_node(s.editingGraph, s.selected[0]) &&
  const node_ref =
    !hidden && node && isNodeRef(node)
      ? nolib.no.runtime.get_ref(node.ref)
      : node;
  const description = !hidden && node_ref?.description;
  const isOut = node.id === graph_out;

  return ha.h(
    "div",
    { id: "node-info-wrapper", class: { "initial-layout": initialLayout } },
    [
      ha.h("div", { class: "spacer inner" }, []),
      ha.h("div", { id: "node-info-inner-wrapper" }, [
        ha.h("div", { class: "spacer before" }, []),
        ha.h(
          "div",
          {
            class: {
              "node-info": true,
              hidden,
              editing,
              [isNodeRef(node) && node.ref.replace("@", "").replace(".", "-")]:
                isNodeRef(node),
            },
            onfocusin: (state: any) => [{ ...state, editing: true }],
            onblurout: (state: any) => [{ ...state, editing: false }],
          },
          [
            ha.h(
              "div",
              { class: "args" },
              nodeArgs
                .slice(0, 16)
                .map((n) =>
                  ha.h(
                    "span",
                    {
                      class: "clickable",
                      onclick: n.exists
                        ? [
                            SelectNode,
                            {
                              node_id: edges_in.find((l) => l.as === n.name)
                                ?.from,
                            },
                          ]
                        : [
                            CreateNode,
                            {
                              node: {
                                id: create_randid(editingGraph),
                                ref:
                                  n.type &&
                                  typeof n.type === "string" &&
                                  n.type !== "any"
                                    ? n.type
                                    : undefined,
                              },
                              child: node.id,
                              child_as: n.name,
                            },
                          ],
                    },
                    [ha.text(n.exists ? n.name : `+${n.name}`)],
                  ),
                )
                .concat(
                  nodeArgs.length > 10
                    ? [
                        ha.h(
                          "span",
                          {},
                          ha.text("..." + nodeArgs.length + " more"),
                        ),
                      ]
                    : [],
                ),
            ),
            ha.h("div", { class: "inputs" }, [
              ha.h("div", { class: "id-display" }, [
                ha.h("span", { class: "label" }, [ha.text("id")]),
                ha.h("span", { class: "id" }, [ha.text(node.id)]),
              ]),
              ha.memo(
                (node) =>
                  infoInput({
                    label: "graph",
                    value: (node as RefNode).ref,
                    property: "ref",
                    inputs,
                    icon: "arrow_circle_right",
                    options: refGraphs.map((r) =>
                      generic.nodes[r]
                        ? { value: r, category: generic.nodes[r].category }
                        : {
                            value: r,
                            category: r.startsWith("@")
                              ? r.substring(1, r.indexOf("."))
                              : "custom",
                          },
                    ),
                    onchange: (state, { value }) => [
                      UpdateNode,
                      { node, property: "ref", value },
                    ],
                    disabled: isOut,
                  }),
                node,
              ),
              ha.memo(
                (node) =>
                  infoInput({
                    label: metadata?.dataLabel ?? "data",
                    value: (node as ValueNode).value,
                    options: metadata?.values ?? [],
                    property: "value",
                    inputs,
                    icon: "data_object",
                    onchange: (state, { value }) => [
                      UpdateNode,
                      { node, property: "value", value: value },
                    ],
                  }),
                node,
              ),
              ha.memo(
                (node: d3NodeNode) =>
                  infoInput({
                    label:
                      isNodeRef(node) && node.ref === "return"
                        ? "name"
                        : "comment",
                    value: node.name,
                    property: "name",
                    inputs,
                    icon:
                      (isNodeRef(node) && node.ref === "return") ||
                      isNodeGraph(node)
                        ? "arrow_circle_left"
                        : "notes",
                    onchange: (state, { value }) =>
                      isOut
                        ? [
                            state,
                            [
                              ChangeEditingGraphId,
                              { id: value, select_out: true, editingGraphId },
                            ],
                          ]
                        : [UpdateNode, { node, property: "name", value }],
                    options: isOut
                      ? ref_graphs.filter((g) =>
                          generic.nodes[g]
                            ? generic.nodes[g].nodes?.[
                                generic.nodes[g].out ?? "out"
                              ]?.ref === "return"
                            : true,
                        )
                      : [],
                  }),
                node,
              ),
              link_out &&
                link_out.source &&
                ha.memo(
                  (link_out) =>
                    infoInput({
                      label: "edge",
                      value: link_out.as,
                      property: "edge",
                      inputs,
                      options: nodeEdgeLabels,
                      icon: "arrow_downward",
                      onchange: (state, { value }) => [
                        UpdateEdge,
                        {
                          edge: {
                            from: link_out.from,
                            to: link_out.to,
                            as: link_out.as,
                          },
                          as: value,
                        },
                      ],
                    }),
                  link_out,
                ),
            ]),
            ha.h(
              "div",
              {
                id: `${html_id}-code-editor`,
              },
              [],
            ),
            ha.h(
              "canvas",
              {
                id: `${html_id}-info-canvas`,
                class: "display-none",
                key: "node-editor-info-canvas",
              },
              [],
            ),
            ha.h("div", { id: `${html_id}-info-display` }),
            ha.h("div", { class: "buttons" }, [
              !isOut &&
                ((isNodeRef(node) && node.ref === "return") ||
                  isNodeGraph(node)) &&
                ha.h(
                  "div",
                  {
                    class: "action",
                    onclick: [ExpandContract, { node_id: node.node_id }],
                  },
                  [
                    ha.h(
                      "span",
                      { class: "material-symbols-outlined" },
                      ha.text(
                        isNodeGraph(node) ? "unfold_more" : "unfold_less",
                      ),
                    ),
                    ha.h(
                      "span",
                      {},
                      ha.text(isNodeGraph(node) ? "expand" : "collapse"),
                    ),
                  ],
                ),
              isNodeGraph(node) &&
                node.name !== "" &&
                ha.h(
                  "div",
                  { class: "action", onclick: [CreateRef, { node }] },
                  [
                    ha.h(
                      "span",
                      { class: "material-symbols-outlined" },
                      ha.text("arrow_circle_left"),
                    ),
                    ha.h("span", {}, ha.text("make ref")),
                  ],
                ),
              isNodeRef(node) &&
                (!generic.nodes[node.ref] ||
                  generic.nodes[node.ref].nodes?.[generic.nodes[node.ref].out]
                    ?.ref === "return") &&
                ha.h(
                  "div",
                  {
                    class: "action",
                    onclick: (state) => [
                      state,
                      [ChangeEditingGraphId, { id: node.ref, editingGraphId }],
                    ],
                    key: "open-ref-action",
                  },
                  [
                    ha.h(
                      "span",
                      { class: "material-symbols-outlined" },
                      ha.text("code"),
                    ),
                    ha.h("span", {}, ha.text("open")),
                  ],
                ),
              ha.h(
                "div",
                {
                  class: "action",
                  onclick: [Copy, { cut: false, as: link_out.as }],
                  key: "copy-action",
                },
                [
                  ha.h(
                    "span",
                    { class: "material-symbols-outlined" },
                    ha.text("content_copy"),
                  ),
                  ha.h("span", {}, ha.text("copy")),
                ],
              ),
              ha.h(
                "div",
                {
                  class: "action",
                  onclick: [Copy, { cut: true, as: link_out.as }],
                  key: "cut-action",
                },
                [
                  ha.h(
                    "span",
                    { class: "material-symbols-outlined" },
                    ha.text("content_cut"),
                  ),
                  ha.h("span", {}, ha.text("cut")),
                ],
              ),
              copied_graph &&
                ha.h(
                  "div",
                  {
                    class: "action",
                    onclick: [Paste, {}],
                    key: "paste-action",
                  },
                  [
                    ha.h(
                      "span",
                      { class: "material-symbols-outlined" },
                      ha.text("content_paste"),
                    ),
                    ha.h("span", {}, ha.text("paste")),
                  ],
                ),
              node.node_id == graph_out &&
                ha.h(
                  "div",
                  {
                    class: "action",
                    onclick: (state, payload) => [state, [SaveGraph, state]],
                  },
                  [
                    ha.h(
                      "span",
                      { class: "material-symbols-outlined" },
                      ha.text("save"),
                    ),
                    ha.h("span", {}, ha.text("save")),
                  ],
                ),
              node.node_id !== graph_out &&
                ha.h(
                  "div",
                  {
                    class: "action",
                    onclick: [
                      DeleteNode,
                      {
                        node_id: node.node_id,
                      },
                    ],
                  },
                  [
                    ha.h(
                      "span",
                      { class: "material-symbols-outlined" },
                      ha.text("delete"),
                    ),
                    ha.h("span", {}, ha.text("delete")),
                  ],
                ),
            ]),
          ],
        ),
        ha.h("div", { class: "spacer after" }, []),
      ]),
    ],
  );
};
