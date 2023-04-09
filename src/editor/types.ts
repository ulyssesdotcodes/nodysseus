import { ForceLink, Simulation, SimulationLinkDatum, SimulationNodeDatum } from "d3-force";
import { NodysseusError } from "../nodysseus";
import {Graph, Edge, NodysseusNode} from "../types"

export type Vector2 = {x: number, y: number}

export type Property = 'ref' | 'value' | 'name' | 'edge';

export type HyperappState = {
  editingGraphId: string,
  editingGraph: Graph,
  displayGraphId: string | false,
  displayGraph: Graph | false,
  hash: string,
  url_params: URLSearchParams,
  html_id: string,
  dimensions: Vector2,
  readonly: boolean, 
  norun: boolean,
  hide_types: boolean,
  offset: Vector2
  nodes: Array<d3Node>,
  links: Array<d3Link>,
  focused: boolean,
  editing: boolean,
  search: boolean,
  show_all: boolean,
  show_result: boolean,
  node_el_width: number,
  args_display: boolean,
  selected: Array<string>,
  selected_edges_in: Array<Edge>,
  error: false | NodysseusError,
  levels: false | Levels,
  randid: string,
  inputs: Record<string, string>,
  copied?: {
    graph: Graph
  }
  simulation?: NodysseusSimulation,
  clear_simulation_cache?: boolean,
  info_display_dispatch?: Function,
  result_display_dispatch?: Function,
  custom_editor_display_dispatch?: Function,
  code_editor?: any,
  code_editor_nodeid?: any,
  custom_editor_result: {}
}

export type Levels = {
    level_by_node: Map<string, number>,
    parents: Map<string, string[]>,
    children: Map<string, string[]>,
    siblings: Map<string, string[]>,
    distance_from_selected: Map<string, number>,
    min: number,
    max: number,
    nodes_by_level: Record<number, string>
}

export type d3Node = SimulationNodeDatum & {
  node_id: string,
  nested_edge_count: number,
  nested_node_count: number,
  hash?: number,
  sibling_index_normalized?: number
} & NodysseusNode

export type d3Link = SimulationLinkDatum<d3Node> & {
  edge: Edge
}

export type NodysseusSimulation = Simulation<d3Node, d3Link>
export type NodysseusForceLink = ForceLink<d3Node, d3Link>

