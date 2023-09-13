import * as ha from "hyperapp";
import { Edge, Graph, NodeArg, NodeMetadata, NodysseusNode } from "../types.js";
import * as pz from "panzoom";
import { d3Link, d3NodeNode, HyperappState, Levels, NodysseusSimulation, Property, Vector2 } from "./types.js";
export declare const EXAMPLES: string[];
export declare const pzobj: {
    instance: false | pz.PanZoom;
    lastpanzoom: false | number;
    animationframe: false | number;
    centered: false | {
        nodeId: string;
        position: Vector2;
        initialOffset: Vector2;
    };
    effect: (dispatch: any, payload: any) => void;
    getTransform: () => pz.Transform;
    init: (dispatch: any, sub_payload: any) => (() => void);
};
export declare const isNodysseusError: (e: Error) => string | boolean;
export declare const update_info_display: ({ fn, graph, args }: {
    fn: any;
    graph: any;
    args: any;
}, info_display_dispatch: any, code_editor: any, code_editor_nodeid: any, graphChanged?: boolean) => void;
export declare const update_graph_list: (graph_id: any) => void;
type NodePositionArgs = {
    position: Vector2;
    simulation: NodysseusSimulation;
};
export declare const setRootNodeXNodeY: ({ position, simulation }: NodePositionArgs) => void;
export declare const SetSelectedPositionStyleEffect: (_: any, payload: NodePositionArgs) => void;
export declare const ChangeEditingGraphId: ha.Effecter<HyperappState, {
    id: string;
    select_out: boolean;
    editingGraphId: string;
}>;
export declare const CreateNode: ha.Action<HyperappState, {
    node: NodysseusNode & {
        id?: string;
    };
    child: string;
    child_as: string;
    parent?: Edge;
}>;
export declare const DeleteNode: (state: any, { node_id }: {
    node_id: any;
}) => any[];
export declare const ExpandContract: (state: any, { node_id }: {
    node_id: any;
}) => any[];
export declare const CreateRef: (state: any, { node }: {
    node: any;
}) => any[];
export declare const Copy: (state: any, { cut, as }: {
    cut: any;
    as: any;
}) => any;
export declare const Paste: (state: any) => any[];
export declare const SelectNode: ha.Action<HyperappState, {
    node_id: string;
    focus_property?: Property;
    clearInitialLayout?: boolean;
}>;
export declare const CustomDOMEvent: (_: any, payload: any) => boolean;
export declare const FocusEffect: ha.Effecter<HyperappState, {
    selector: string;
}>;
export declare const SaveGraph: (dispatch: any, payload: any) => void;
export declare const UpdateResultDisplay: (state: any, resel: any) => any;
export declare const UpdateNodeEffect: ha.Effecter<HyperappState, {
    editingGraph: Graph;
    node: NodysseusNode;
}>;
export declare const UpdateNode: ha.Action<HyperappState, {
    node: NodysseusNode;
    property: string;
    value: string;
    editingGraph: Graph;
}>;
export declare const UpdateEdge: ha.Action<HyperappState, {
    edge: Edge;
    as: string;
}>;
export declare const keydownSubscription: (dispatch: any, options: any) => () => void;
export declare const refresh_graph: (dispatch: any, { graph, graphChanged, norun, result_display_dispatch, info_display_dispatch, code_editor, code_editor_nodeid }: {
    graph: any;
    graphChanged: any;
    norun: any;
    result_display_dispatch: any;
    info_display_dispatch: any;
    code_editor: any;
    code_editor_nodeid: any;
}) => any;
export declare const result_subscription: (dispatch: any, { editingGraphId, displayGraphId, norun }: {
    editingGraphId: any;
    displayGraphId: any;
    norun: any;
}) => () => void;
export declare const graph_subscription: (dispatch: ha.Dispatch<HyperappState>, props: any) => () => void;
export declare const select_node_subscription: (dispatch: any, props: any) => () => void;
export declare const listen: (type: any, action: any) => ha.Subscription<HyperappState, any>;
export declare const listenToEvent: (dispatch: any, props: any) => (() => void);
export declare const run_h: ({ dom_type, props, children, text }: {
    dom_type: string;
    props: {};
    children: Array<any>;
    text?: string;
}, exclude_tags?: any[]) => any;
export declare const findViewBox: (nodes: Array<d3NodeNode>, links: Array<d3Link>, selected: string, node_el_width: number, htmlid: string, dimensions: {
    x: number;
    y: number;
}) => {
    nodes_box_dimensions: {
        x: number;
        y: number;
    };
    center: {
        x: number;
        y: number;
    };
};
export declare const calculateLevels: (nodes: Array<d3NodeNode>, links: Array<d3Link>, graph: Graph, selected: string) => Levels;
export declare const CalculateSelectedNodeArgsEffect: ha.Effecter<HyperappState, {
    graph: Graph;
    node_id: string;
}>;
export declare const node_args: (nolib: Record<string, any>, graph: Graph, node_id: string, cachedMetadata?: Record<string, NodeMetadata>) => {
    nodeArgs: Array<NodeArg>;
    nodeOutArgs?: Array<NodeArg>;
} | Promise<{
    nodeArgs: Array<NodeArg>;
    nodeOutArgs?: Array<NodeArg>;
}>;
export declare const save_graph: (graph: any) => void;
export declare const graphEdgeOut: (graph: Graph, node: string) => Edge;
export declare const graphEdgesIn: (graph: Graph, node: string) => Edge[];
export declare const hlibLib: import("../types.js").Lib;
export declare const hlib: Record<string, any>;
export {};
