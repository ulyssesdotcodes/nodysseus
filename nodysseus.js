import { json, jsonParseLinter, jsonLanguage } from "@codemirror/lang-json";
import { javascript, javascriptLanguage } from "@codemirror/lang-javascript";
import {keymap, highlightSpecialChars, drawSelection, highlightActiveLine, EditorView} from "@codemirror/view";
import {EditorState, StateEffect, Compartment} from "@codemirror/state";
import {history, historyKeymap} from "@codemirror/history";
import {foldGutter, foldKeymap} from "@codemirror/fold";
import {indentOnInput} from "@codemirror/language";
import {lineNumbers, highlightActiveLineGutter} from "@codemirror/gutter";
import {cursorLineBoundaryBackward, standardKeymap} from "@codemirror/commands";
import {bracketMatching} from "@codemirror/matchbrackets";
import {closeBrackets, closeBracketsKeymap} from "@codemirror/closebrackets";
import {searchKeymap, highlightSelectionMatches} from "@codemirror/search";
import {autocompletion, completionKeymap} from "@codemirror/autocomplete";
import {commentKeymap} from "@codemirror/comment";
import {rectangularSelection} from "@codemirror/rectangular-selection";
import {defaultHighlightStyle} from "@codemirror/highlight";
import {lintKeymap, linter} from "@codemirror/lint";
import {language} from "@codemirror/language";


import _, { merge } from "lodash";
import { h, app, text, memo } from "hyperapp"
import { forceSimulation, forceManyBody,forceCenter, forceLink, forceRadial, forceY, forceCollide } from "d3-force";

// import DEFAULT_GRAPH from "./default.nodysseus.json"
import DEFAULT_GRAPH from "./flatten.json"
import { A } from "@svgdotjs/svg.js";

const cm = {javascript, json, searchKeymap, keymap, highlightSpecialChars, 
	drawSelection, highlightActiveLine, EditorState, EditorView, StateEffect, jsonParseLinter,
	history, historyKeymap, foldGutter, foldKeymap, indentOnInput, lineNumbers, highlightActiveLineGutter,
	standardKeymap, bracketMatching, closeBrackets, closeBracketsKeymap, searchKeymap, highlightSelectionMatches,
	autocompletion, completionKeymap, commentKeymap, rectangularSelection, defaultHighlightStyle, lintKeymap, linter
};

// helpers

const queue = (init) => ({
	arr: Array.isArray(init) ? init : [init],
	push: function(v){ this.arr.unshift(v) },
	[Symbol.iterator]: function(){
		return {
			next: () => ({ done: this.arr.length === 0, value: this.arr.length === 0 ? undefined : this.arr.pop() })
		}
	}
})

const reduce = (fn, acc, it) => {
	for(const n of it) {
		acc = fn(acc, n);
	}

	return acc;
}

const map = function* (it, fn) {
	for(const n of it) {
		yield fn(n);
	}
}

const filter = function* (it, fn) {
	for(const n of it) {
		if(fn(n)){
			yield n;
		}
	}
}

// in place `over` of an array index
const overIdx = (i, def) => fn => arr => (arr[i] = fn(arr[i] ?? def), arr);
const overKey = (k, def) => fn => om => 
	om instanceof Map 
	? om.set(k, fn(om.get(k) ?? def))
	: overIdx(k, def)(fn)(om);
const overPath = (p, def) => fn => om =>
	overKey(p[0], def)(p.length === 1 
		? fn 
		: overPath(p.slice(1), def)(fn)
	)(om)

const nestedPropertyIterator = (val, prop) => ({
	level: val,
	[Symbol.iterator]: function(){
		return {
			next: () => ({ done: this.level.hasOwnProperty(prop), value: (this.level = this.level[prop], this.level) })
		}
	}
})

window.AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;

class CopaneError extends Error {
	constructor(tag, message) {
		super(`${tag}: ${message}`);
	}
}

const rethrow = (tag) => (error) => {
	if (error instanceof CopaneError) {
		throw error;
	} else {
		throw new CopaneError(tag, error.message);
	}
}

const editorEl = document.getElementById("text_editor");
const graphEl = document.getElementById("node_editor");

const languageConf = new Compartment();

const autoLanguage = EditorState.transactionExtender.of(tr => {
  if (!tr.docChanged) return null
  let docIsJSON = true;

	try{
		JSON.parse(tr.newDoc.toString());
	} catch (err){
		docIsJSON = false;
	}

  let stateIsJSON = tr.startState.facet(language) == jsonLanguage;
  if (docIsJSON == stateIsJSON) return null
  return {
    effects: languageConf.reconfigure(docIsJSON ? [cm.linter(cm.jsonParseLinter()), json()] : javascript())
  }
})

const editorState  = cm.EditorState.create({
	extensions: [
		languageConf.of([cm.linter(cm.jsonParseLinter()), json()]),
		autoLanguage,
		cm.lineNumbers(),
		cm.highlightActiveLineGutter(),
		cm.highlightSpecialChars(),
		cm.history(),
		cm.foldGutter(),
		cm.drawSelection(),
		cm.EditorState.allowMultipleSelections.of(true),
		cm.indentOnInput(),
		cm.defaultHighlightStyle.fallback,
		cm.bracketMatching(),
		cm.closeBrackets(),
		cm.autocompletion(),
		cm.rectangularSelection(),
		cm.highlightActiveLine(),
		cm.highlightSelectionMatches(),
		cm.keymap.of([
			...cm.closeBracketsKeymap,
			...cm.standardKeymap,
			...cm.searchKeymap,
			...cm.historyKeymap,
			...cm.foldKeymap,
			...cm.commentKeymap,
			...cm.completionKeymap,
			...cm.lintKeymap
		])
	]
});
			

const editorView = new cm.EditorView({ 
	state: editorState, 
	parent: editorEl
});

const compileNode = (node) => node.script ? new Function('lib', node.script)(lib) : args => Object.assign({}, args.data, lib._.omit(node, 'id', 'fn'));

// Note: heavy use of comma operator https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Comma_Operator
const unpackTypes = (node_types, node) => {
	let ty = typeof node === 'string' ? node : node.type;
	const result = typeof node === 'string' ? {} : Object.assign({}, node)
	while(node_types[ty]) {
		Object.assign(result, node_types[ty]);
		ty = node_types[ty].type;
	}
	return result;
}

const compileNodes = (node_types, nodes) => Object.fromEntries(
	Object.entries(nodes ?? {})
		.map(kv => overIdx(1)(n => Object.assign({node_types, id: kv[0]}, unpackTypes(node_types, n), typeof n === 'string' ? {} : n))(kv))
		.map(kv => kv[1].fn ? kv : overIdx(1)(compile)(kv))
);

// mutable for performance
const createEdgeFns = (edges, from, fns) => {
	if(!edges){ return []}

	const edge_arr = [];
	for(const e of edges){
		if(e.from === from) {
			edge_arr.push(e.fn ? e : Object.assign({}, e, {fn: fns[e.to]}))
		}
	}

	return edge_arr;
}


const hFn = ({data}) => ({
	value: {
		el: lib.ha.h(
		data.dom_type, // change to input
		data.attrs ?? {}, 
		data.children instanceof Map
			?  [...lib.iter.map(
				input.children.values(), 
				v => v ? v : undefined)]
			: data.children
			? data.children
			: [])
	},
	delete:	["attrs", "children", "dom_type"]
});

// this is a context
const execute = args => {
	const {id, state, data} = args;
	const self = data?.graph?.nodes?.find(v => v.id === id);

	if(!self) {
		console.log(args);
		debugger;
		throw new Error("No graph or can't find node");
	}

	const node_state = state.get(id) ?? state.set(id, new Map()).get(id);

	// store and merge args across calls
	const merged_data = node_state.set('data',
		node_state.has('data')
			? Object.assign({}, node_state.get('data'), data)
			: Object.assign({}, self, data)
	).get('data');

	// call the function with node_state
	try {
		if(node_state.get('self') !== self){
			self.fn = compileNode(self);
			node_state.set('self', self);
		}

		const result = self.fn(Object.assign({}, args, {state: node_state, data: merged_data }));
		runNextNodes(Object.assign({}, args), result);
	} catch(e) {
		console.log(`error running ${id}`);
		console.log(self);
		console.log(args);
		console.error(e);
	}
}

const verify = ({data}) => {
	const node_map = new Map(data.graph.nodes.map(n => [n.id, n]));
	data.graph.edges.forEach(e => {
		if(!(node_map.has(e.from) && node_map.has(e.to))) {
			throw new Error(`invalid edge ${JSON.stringify(e)}`)
		}
	})

	return data;
}

const fnDef = ({id, data, state}) => {
	const node_map = new Map(data.graph.nodes.map(n => [n.id, n]));
	const next_edges = data.graph.edges
		.filter(e => e.from === id);
	const next_node_ids = new Set(next_edges.map(e => e.to));

	const ref_nodes = next_edges.map(e => node_map.get(e.to).type === "fn_return" 
	 ? node_map.get(e.to)
	 :  Object.assign({}, node_map.get(e.to), {id: `${node_map.get(e.to).id}#ref_fnDef`})
	);

	const ref_edges = next_edges.map(e => ({
		from: data.reference_graph ? `${id}#ref_fnDef` : "in",
		to: `${e.to}#ref_fnDef`,
		as: e.as
	}));

	const fnDef_nodes = next_edges
		.filter(e => node_map.get(e.to).type !== "fn_return")
		.map(e => ({ 
			id: e.to, 
			script: "return lib.no.fnDef"
		}));

	// get rid of "as"
	const fn_def_edges = next_edges.map(e => ({to: e.to, from: e.from}));

	const acc_nodes = 
		[...(data.graph.nodes
			.filter(n => !next_node_ids.has(n.id))
			.concat(state.get('acc_nodes') ?? [], ref_nodes, fnDef_nodes)
			.reduce((m, n) => m.set(n.id, n), new Map())
			.values())];

	state.set('acc_nodes', acc_nodes);

	const acc_edges = 
	    [...(data.graph.edges
			.filter(e => !next_node_ids.has(e.to))
			.concat(state.get('acc_edges') ?? [], fn_def_edges)
			.reduce((m, e) => m.set(`${e.from}##${e.to}`, e), new Map())
			.values())];

	state.set('acc_edges', acc_edges);

	const reference_graph = 
		[...((data.reference_graph ?? [])
		.concat(state.get('reference_graph') ?? [], ref_edges)
		.reduce((m, e) => m.set(`${e.from}##${e.to}`, e), new Map())
		.values())];


	state.set('reference_graph', reference_graph);

	return {
		graph: {
			edges: acc_edges,
			nodes: acc_nodes
		},
		reference_graph
	}
}

const fnReturn = ({id, data, lib, state}) => {
	const fnOut = {
		id: `${id}#ref_fnDef`,
		script: "return ({data}) => data.fn_result.fn_value = data"
	};

	const reference_graph = 
		[...((data.reference_graph ?? [])
		.concat(state.get('reference_graph') ?? [])
		.reduce((m, e) => {
			const hash = `${e.from}##${e.to}`;
			if(!m.has(hash)) {
				m.set(hash, e)
			}
			return m;
		}, new Map())
		.values())];

	state.set('reference_graph', reference_graph);

	const graph_nodes = 
		[...(data.graph.nodes
		.concat(state.get('graph_nodes') ?? [])
		.reduce((m, n) => m.set(n.id, n), new Map())
		.values())]

	state.set('graph_nodes', graph_nodes)
	

	return (args) => { 
		const fn_result = {};

		runNextNodes({
			id: "in", 
			data: {
				graph: {
					nodes: state.get('graph_nodes').concat([fnOut]),
					edges: state.get('reference_graph')
				},
				fn_result
			},
			lib,
			state: new Map()
		}, args);

		return fn_result.fn_value;
	}
}

const concatValues = ({data, state}) => {
	const new_aggregate = state.set('aggregate', (
		data.aggregate ?? (state.has('aggregate') ? state.get('aggregate') : [])
		).concat([data.value])).get('aggregate');

	if (!data.length || data.length < new_aggregate.length) {
		return { value: new_aggregate, delete: ["value"] };
	}
}

const runNextNodes = (args, result) => {
	const raw_result = !(
		result !== undefined
		&& typeof result === "object" 
		&& result.hasOwnProperty('value') 
	);

	const result_value = raw_result ? result : result.value;

	if (result_value === undefined) {
		return;
	}

	const transferred_data = lib._.omit(args.data, 
		!raw_result && result.hasOwnProperty('delete') 
			? result.delete
			: []);

	(result.graph ?? args.data.graph).edges
		.filter(e => e.from === args.id)
		.forEach(e => execute(Object.assign({}, args, {
			id: e.to, 
			data: e.as 
				? lib._.set(transferred_data, e.as, result_value) 
				: Object.assign(transferred_data, result_value)
		})));
}

const map_path_fn = ({lib, data}) => data.target && data.target_path && data.map_fn ?
	lib._.update(
		data.target,
		data.target_path,
		a => lib._.map(a, data.map_fn)
	) : undefined;

const iterate = ({id, data}) => {
	const node_map = new Map(data.graph.nodes.map(n => [n.id, n]));
	const next_edges = data.graph.edges
		.filter(e => e.from === id);
	const next_node_ids = new Set(next_edges.map(e => e.to));

	const keep = ["graph", "target"].concat(next_edges.map(e => e.keep).flat())

	const get_input_nodes = data.target.map((d, i) => ({
		"id": `${id}#get_input#${i}`,
		"script": `return ({data}) => data.target[${i}]`
	}));

	const get_input_edges = data.target.map((d, i) => ({
		from: id,
		to: `${id}#get_input#${i}`
	}));

	const identity_node = {
		id: `${id}#identity`,
		"script": "return ({data}) => data"
	}

	const identity_edges = data.target.map((d, i) => ({
		from: `${id}#get_input#${i}`,
		to: `${id}#identity`
	}));

	return {
		graph: {
			edges: data.graph.edges.map(e => e.from === id 
				? Object.assign({}, e, { from: `${id}#identity` }) 
				: e).concat(get_input_edges, identity_edges),
			nodes: data.graph.nodes.concat(get_input_nodes, [identity_node])
		},
		target: data.target,
		length: data.target.length
	}
}

const flatten = ({data}) => {
	const flatten_node = (graph) => {
		if(graph.nodes === undefined) {
			return graph;
		} 

		// needs to not prefix base node because then flatten node can't run  next
		const prefix = graph.id ? `${graph.id}/` : '';

		return graph.nodes
			.map(n => Object.assign({}, n, {id: `${prefix}${n.id}`}))
			.map(flatten_node)
			.reduce((acc, n) => Object.assign({}, acc, {
				nodes: acc.nodes.concat(n.nodes?.flat() ?? []), 
				edges: acc.edges.map(e => n.nodes 
					? e.to === n.id 
						? Object.assign(e, { to: `${e.to}/in`})
						: e.from === n.id
						? Object.assign(e, {from: `${e.from}/out`})
						: e
					: e).flat().concat(n.edges).filter(e => e !== undefined)
			}), Object.assign({}, graph, {
				nodes: graph.nodes
					.map(n => Object.assign({}, n, {id: `${prefix}${n.id}`})),
				edges: graph.edges
					.map(e => ({from: `${prefix}${e.from}`, to: `${prefix}${e.to}`, as: e.as}))
			}));
	}

	return {graph: flatten_node(data.graph)};
}

const d3simulation = ({data}) => {
	const node_levels = [];

	const bfs = (level) => (edge) => 
		[[edge.to, level]].concat(data.graph.edges.filter(e => e.from === edge.to).map(bfs(level + 1)).flat());

	const levels = Object.fromEntries(data.graph.edges.filter(e => e.from === 'in').map(bfs(0)).flat());
	levels.min = Math.min(...Object.values(levels));
	levels.max = Math.max(...Object.values(levels));

	const simulation = 
		lib.d3.forceSimulation(
			data.graph.nodes
				.map((n, index) => Object.assign({}, typeof n === 'string' ? {type: n} : n, {
					node_id: n.id,
					x: window.innerWidth * (Math.random() *.5 + .25), 
					y: window.innerHeight * (Math.random() * .5 + .25), 
					index
				})))
			.force('charge', lib.d3.forceManyBody().strength(-8))
			// .force('center', lib.d3
			// 	.forceCenter(window.innerWidth * 0.5, window.innerHeight * 0.5)
			// 	.strength(.01))
			.force('links', lib.d3
				.forceLink(data.graph.edges.filter(e => e.from !== 'in' && e.to !== 'out')
					.map((e, index) => ({source: e.from, target: e.to, index})))
				.distance(128)
				.id(n => n.node_id))
			.force('link_direction', lib.d3
				.forceY()
				.y((n) => window.innerHeight * (0.15 + (Math.random() * 0.2) + 0.5 * (levels[n.node_id] ?? 0) / (levels.max - levels.min)))
				.strength(0.5))
			.force('collide', lib.d3.forceCollide(64));
//			.alphaMin(.1); // changes how long the simulation will run. dfault is 0.001 

	return simulation;
}

const lib = { cm, _,
	ha: { h, app, text, memo},  
	iter: {reduce, map}, 
	no: {map_path_fn, flatten, unpackTypes, hFn, fnDef, fnReturn, concatValues, iterate, verify, d3simulation},
	d3: {forceSimulation, forceManyBody, forceCenter, forceLink, forceRadial, forceY, forceCollide},
	util: {overIdx, overKey, overPath}
};

execute({id: "in", state: new Map(), lib, data: { graph: DEFAULT_GRAPH }});

// const aggregateChain = ({id, data, lib}) => {
// 	const next_edges = data.graph.edges.filter(e => e.from === id);
// 	const next_node_ids = new Set(next_edges.map(e => e.to));
// 	const node_map = new Map(data.graph.nodes.map(n => [n.id, n]));

// 	const ref_nodes = next_edges.map(e => 
// 		node_map.get(e.to).type === "concat" 
// 		? node_map.get(e.to) 
// 		: Object.assign({}, 
// 			node_map.get(e.to), 
// 			{id: `${node_map.get(e.to).id}#ref`}
// 			));

// 	const ref_edges = next_edges.map(e => ({
// 		from: `${id}`,
// 		to: `${e.to}#ref`
// 	}))

// 	const concat_nodes = next_edges.map(e => ({
// 		id: `${node_map.get(e.to).id}`,
// 		script: "return lib.no.concatValues"
// 	}));

// 	const concat_edges = next_edges.map(e => Object.assign({}, e, ({ as: "value" })));

// 	const chain_nodes = next_edges.map(e => ({
// 		id: `${node_map.get(e.to).id}#chain`,
// 		script: "return lib.no.aggregateChain"
// 	}));

// 	const chain_edges = next_edges.map(e => ({
// 		from: `${id}#concat`,
// 		to: `${e.to}#chain`
// 	}))



// 	const new_graph = {
// 		edges: data.graph.edges
// 			.filter(e => !next_node_ids.has(e.to))
// 			.concat(ref_edges, chain_edges, concat_edges),
// 		nodes: data.graph.nodes
// 			.filter(n => !next_node_ids.has(n.id))
// 			.concat(ref_nodes, concat_nodes, chain_nodes)
// 	}

// 	return Object.assign({}, data, {
// 		graph: new_graph,
// 	});
// }






// 	const edge_replacements = args.data.graph.edges
// 		.filter(e => e.from === id)
// 		.filter(e => e.type === "end_fn")
// 		.map(e => {
// 			// new edge from in/last ref graph node to this node
// 			const new_graph_edge = {
// 				from: data[`referenceExecute#${id}`] ?? "in",
// 				to: `${e.to}#ref`,
// 				as: e.as
// 			}

// 			// next node seen will be a referenceExecute node with id e.to#ref

// 			const new_node = {
// 				id: `${e.to}`,
// 				script: "return lib.no.referenceExecute"
// 			}

// 			return {main_graph_edge, new_graph_edge, new_node};
// 		})
// 		.reduce((acc, v) => {
// 			acc.edges.push(v.new_graph_edge);
// 			acc.nodes.push(v.new_node);
// 			acc.main_graph_edges.push(v.main_graph_edge);
// 		}, {edges:[], nodes: [], main_graph_edges: []});

// 	const new_data = Object.assign({}, data, {
// 		graph: {
// 			edges: data.graph.edges.filter(e => e.from === id)
// 		}
// 	})


// 	// set the next ref to the current e.to
// 	new_data[`referenceExecute#${new_node.id}`] = e.to;

// 	const new_main_graph_edges = from_edges.map(e => {

// 	})


// 	if(data.reference_execute_start) {

// 	} else {
// 		new_data.reference_execute_start = id;
// 		const reference_graph = {
// 			nodes: data.graph,
// 			edges: []
// 		}

// 		lib._.set(new_data, ``, reference_graph);
// 	}


// 	runNextNodes
// }