import * as ha from "hyperapp";
import { Graph } from "../../types.js";
import { HyperappState, NodysseusSimulation, d3Link, d3NodeNode } from "../types.js";
export declare const UpdateSimulation: ha.Effecter<HyperappState, any>;
export declare const UpdateGraphDisplay: ha.Effecter<HyperappState, any>;
export declare const getLinks: (simulation: NodysseusSimulation) => Array<d3Link> | undefined;
export declare const getNodes: (simulation: NodysseusSimulation) => Array<d3NodeNode> | undefined;
export declare const updateSimulationNodes: ha.Effecter<HyperappState, {
    simulation?: NodysseusSimulation;
    editingGraph: Graph;
    clear_simulation_cache?: boolean;
}>;
export declare const d3subscription: (dispatch: ha.Dispatch<HyperappState>, props: any) => () => void;
export declare const node_el: ({ html_id, selected, error, selected_distance, node_id, node_ref, node_name, node_value, has_nodes, nested_edge_count, nested_node_count, node_parents, edgeName }: {
    html_id: any;
    selected: any;
    error: any;
    selected_distance: any;
    node_id: any;
    node_ref: any;
    node_name: any;
    node_value: any;
    has_nodes: any;
    nested_edge_count: any;
    nested_node_count: any;
    node_parents: any;
    edgeName: any;
}) => ha.ElementVNode<unknown>;
export declare const link_el: ({ link, selected_distance }: {
    link: any;
    selected_distance: any;
}) => ha.ElementVNode<unknown>;
export declare const insert_node_el: ({ link, randid, node_el_width, nodeOffset }: {
    link: any;
    randid: any;
    node_el_width: any;
    nodeOffset: any;
}) => ha.ElementVNode<unknown>;
