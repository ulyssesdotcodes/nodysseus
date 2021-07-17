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


const hFn = ({data}) => lib.ha.h(
		data.dom_type, // change to input
		data.attrs ?? {}, 
		data.children instanceof Map
			?  [...lib.iter.map(
				input.children.values(), 
				v => v ? v : undefined)]
			: data.children
			? data.children
			: []);

// this is a context
const execute = args => {
	const {id, state, data} = args;
	const self = data?.graph?.nodes?.find(v => v.id === id);

	if(!self) {
		throw new Error("No graph or can't find node");
	}

	const node_state = state.get(id) ?? state.set(id, new Map()).get(id);

	// store and merge args across calls
	const merged_data = node_state.set('data',
		node_state.has('data')
			? Object.assign({}, node_state.get('data'), self, data)
			: Object.assign({}, self, data)
	).get('data');

	// call the function with node_state
	try {

		if(node_state.get('self') !== self){
			self.fn = compileNode(self);
			node_state.set('self', self);
		}

		const result = self.fn(Object.assign({}, args, {state: node_state, data: merged_data }));
		if(result === undefined) { return; }

		runNextNodes(Object.assign({}, args), result);
	} catch(e) {
		console.log(`error running ${id}`);
		console.log(self);
		console.log(args);
		console.error(e);
	}
}

const fnDef = ({id, data}) => {
	const next_edges = data.graph.edges.filter(e => e.from === id);
	const next_node_ids = new Set(next_edges.map(e => e.to));

	const new_graph = {
		edges: data.graph.edges,
		nodes: data.graph.nodes.map(n => {
			if(!next_node_ids.has(n.id) || n.type === "fn_return") {
				return n;
			}

			const removed_node = Object.assign({}, n, {id: `${n.id}#ref`});
			const new_next_node = { id: n.id, script: "return lib.no.fnDef"}

			return [removed_node, new_next_node]
		}).flat()
	}



	return Object.assign({}, data, {
		graph: new_graph,
		reference_graph: (data.reference_graph ?? [])
			.concat(next_edges.map(e => ({
				from: data.reference_graph ? `${id}#ref` : "in", 
				to: `${e.to}#ref`, 
				as: e.as 
			})))
	})
}

const fnReturn = ({id, data, lib}) => {
	const fnOut = {
		id: `${id}#ref`,
		script: "return ({data}) => data.fn_result.value = data"
	};

	return (args) => { 
		const fn_result = {};

		runNextNodes({
			id: "in", 
			data: {
				graph: {
					nodes: data.graph.nodes.concat([fnOut]),
					edges: data.reference_graph
				},
				fn_result
			},
			lib,
			state: new Map()
		}, args);

		return fn_result.value;
	}
}






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

const runNextNodes = (args, result) => Object.assign({}, 
	...(result.graph ?? args.data.graph).edges
	.filter(e => e.from === args.id)
	.map(e => execute(Object.assign({}, args, {
		id: e.to, 
		data: e.as 
			? lib._.set(Object.assign({}, args.data), e.as, result) 
			: Object.assign({}, args.data, result)
	})))
	.filter(v => v !== undefined));

const map_path = ({lib, data}) => data.target && data.target_path && data.map_fn ?
	lib._.update(
		data.target,
		data.target_path,
		a => lib._.map(a, data.map_fn)
	) : undefined;

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
		// {
		// 	nodes: prefixed_nodes
		// 		.concat(flattened.map(g => g.nodes).flat())
		// 		.filter(n => n !== undefined),
		// 	edges: graph.edges
		// 		.map(e => ({from: `${prefix}${e.from}`, to: `${prefix}${e.to}`, as: e.as}))
		// 		.map(e => {
		// 			if(nodes.find(n => n.id === e.from))
		// 		})
		// 		.concat(flattened.map(g => g.edges).flat())
		// 		.filter(e => e !== undefined)
		// }
	}

	return {graph: flatten_node(data.graph)};
}

const d3simulation = ({data}) => {
	const node_levels = [];

	const bfs = (level) => (edge) => 
		[[edge.to, level]].concat(input.edges.filter(e => e.from === edge.to).map(bfs(level + 1)).flat());

	const levels = Object.fromEntries(input.edges.filter(e => e.from === 'in').map(bfs(0)).flat());
	levels.min = Math.min(...Object.values(levels));
	levels.max = Math.max(...Object.values(levels));

	const simulation = 
		lib.d3.forceSimulation(
			data.graph.nodes
				.map(([k, n], index) => Object.assign({}, typeof n === 'string' ? {type: n} : n, {
					node_id: k,
					x: window.innerWidth * (Math.random() *.5 + .25), 
					y: window.innerHeight * (Math.random() * .5 + .25), 
					index
				})))
			.force('charge', lib.d3.forceManyBody().strength(-8))
			// .force('center', lib.d3
			// 	.forceCenter(window.innerWidth * 0.5, window.innerHeight * 0.5)
			// 	.strength(.01))
			.force('links', lib.d3
				.forceLink(input.edges.filter(e => e.from !== 'in' && e.to !== 'out')
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
	no: {map_path, flatten, unpackTypes, hFn, fnDef, fnReturn},
	d3: {forceSimulation, forceManyBody, forceCenter, forceLink, forceRadial, forceY, forceCollide},
	util: {overIdx, overKey, overPath}
};

execute({id: "in", state: new Map(), lib, data: { graph: DEFAULT_GRAPH }});