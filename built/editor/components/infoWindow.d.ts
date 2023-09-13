import * as ha from "hyperapp";
import { Edge, Graph, NodeArg, NodeMetadata } from "src/types.js";
import { NodysseusError } from "../../nodysseus.js";
import { d3Link, d3NodeNode, HyperappState, Vector2 } from "../types.js";
export declare const info_display: (html_id: any) => ha.Dispatch<any>;
export declare const infoInput: ({ label, property, value, onchange, oninput, onkeydown, options, inputs, disabled, icon }: {
    label: string;
    property: string;
    value: string;
    inputs: Record<string, string>;
    disabled?: boolean;
    options?: (string | {
        value: string;
        category?: string;
    })[];
    icon?: string;
    onchange?: ha.Action<HyperappState, {
        value: string;
    }>;
    oninput?: ha.Action<HyperappState, Event>;
    onkeydown?: ha.Action<HyperappState, Event>;
}) => ha.ElementVNode<unknown>;
export declare const infoWindow: ({ node, hidden, edges_in, link_out, editingGraph, editingGraphId, randid, ref_graphs, html_id, copied_graph, inputs, graph_out, editing, error, refGraphs, metadata, initialLayout, nodeArgs, nodeEdgeLabels }: {
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
}) => ha.ElementVNode<any>;
