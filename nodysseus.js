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

const default_fn = (lib, self) => {
	const node_fns = compileNodes(self.node_types, self.nodes);

	// expand default in => node => out if there's only one node
	if(Object.keys(self.nodes).length === 1 && (!self.edges	|| self.edges.length === 0)) {
		self.edges = [
			{"from": "in", "to": Object.keys(self.nodes)[0]}, 
			{"from": Object.keys(self.nodes)[0], "to": "out"}
		]
	}

	const startFns = createEdgeFns(self.edges, 'in', node_fns, 0);

	return (state, input) => { 
		const edge_queue = queue(lib._.cloneDeep(startFns));

		state.set('in', input);

		return reduce((outputs, run_edge) => {
			const next = Object.assign({}, outputs);

			if(run_edge.to === "out") {
				outputs['out'] = outputs[run_edge.from];
				return outputs;
			}

			try {
				const result = run_edge.fn(
					state.get(run_edge.to) ?? state.set(run_edge.to, new Map()).get(run_edge.to),
					run_edge.as ? Object.fromEntries([[run_edge.as, outputs[run_edge.from]]]) : outputs[run_edge.from]
				);

				next[run_edge.to] = result ?? next[run_edge.to];

				if(next[run_edge.to] !== undefined) {
					// side effect add to queue
					createEdgeFns(self.edges, run_edge.to, node_fns)
						.forEach(e => edge_queue.push(e))

					return next;
				}
			} catch(err) {
				console.log("error in " + run_edge.to);
				console.log(run_edge);
				console.log(outputs[run_edge.from]);
				console.log(state.get(run_edge.to));
				console.error(err);
			}

			// don't update if the new value is undefined
			return outputs;
		}, {in: Object.assign({}, input, {parent: self.id})}, edge_queue).out;
	}
} 

const aggregate_fn = (lib, self) => {
	const node_fns = lib.no.compileNodes(self.node_types, self.nodes); 

	if(!self.edges) {
		self.edges = Object.keys(self.nodes).reduce((arr, val) => 
			arr.concat([{
				from: arr[arr.length - 1]?.to ?? 'in',
				to: val
			}]), 
			[]
		);
	}

	const edge_queue = queue(createEdgeFns(self.edges, 'in', node_fns));
	const output_order = reduce((order, edge) => {
		const has_edge = order.has(edge.to);

		if (!has_edge) {
			createEdgeFns(self.edges, edge.to, node_fns)
				.forEach(e => edge_queue.push(e));
			return order.set(edge.to, edge);
		}

		return order
	}, new Map(), edge_queue);

	return (state, input) => {
		const result_map = map(
			output_order.entries(), 
			([k, run_edge]) => [
				k, 
				run_edge.fn(
					state.has(k) 
					? state.get(k) 
					: state.set(k, new Map()).get(k), 
					Object.assign({parent: self.id}, input)
				)
			])

		return new Map(filter(result_map, kv => kv[1] !== undefined))
	}
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

// returns a state, input => output


const d3simulation = (state, input) => {
	const node_levels = [];

	const bfs = (level) => (edge) => 
		[[edge.to, level]].concat(input.edges.filter(e => e.from === edge.to).map(bfs(level + 1)).flat());

	const levels = Object.fromEntries(input.edges.filter(e => e.from === 'in').map(bfs(0)).flat());
	levels.min = Math.min(...Object.values(levels));
	levels.max = Math.max(...Object.values(levels));

	console.log(levels);

	const simulation = 
		lib.d3.forceSimulation(
			Object.entries(input.nodes)
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

const apply_template = (lib, self) => (state, input) => { 
	if(input.target && input.source && self.template && lib._.has(input.source, self.source_path)){ 

		const source = lib._.get(input.source, self.source_path);

		return lib.util.overPath
			(self.path, {})
			(nodes => Object.fromEntries(
				(Array.isArray(source) ? [...Array(source.length).keys()] : Object.keys(source))
				.map(k => [k, self.template]))) 
			(input.target) 
	} 
}

const run_fn = (lib, self) => (state, input) => { 
	if(!input.fn || !input.data) { return; } 
	if(!lib._.isEqual(state.get('fn'), input.fn)) { 
		state.set('compiled_fn', (self.run_type === 'aggregate' ? lib.no.aggregate_fn : lib.no.default_fn)(lib, input.fn))
	} 

	state.set('fn', input.fn); return state.get('compiled_fn')(state, input.data); 
}

//compile(DEFAULT_GRAPH)(new Map(), DEFAULT_GRAPH);

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

		const path_return = runNextNodes(Object.assign({}, args), result);

		if(path_return.length > 0){
			return Object.assign({}, ...path_return);
		} else {
			return result;
		}

	} catch(e) {
		console.log(`error running ${id}`);
		console.log(args);
		console.error(e);
	}
}

const referenceExecute = (args) => input => 
	runNextNodes(lib._.set(Object.assign({}, args), 'id', args.data.fn_in), input);

const runNextNodes = (args, result) => Object.assign({}, ...args.data.graph.edges
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

		const prefix = graph.id ? `${graph.id}/` : '';

		const prefixed_nodes = graph.nodes.map(n => Object.assign({}, n, {id: `${prefix}${n.id}`}));

		const flattened = prefixed_nodes.map(flatten_node);

		return {
			nodes: prefixed_nodes.concat(flattened.map(g => g.nodes).flat()).filter(n => n !== undefined),
			edges: graph.edges.map(e => ({from: `${prefix}${e.from}`, to: `${prefix}${e.to}`, as: e.as})).concat(flattened.map(g => g.edges).flat()).filter(e => e !== undefined)
		}
	}

	return {graph: flatten_node(data.graph)};
}

const lib = { cm, _,
	ha: { h, app, text, memo},  
	iter: {reduce, map}, 
	no: {map_path, flatten, unpackTypes, referenceExecute, hFn},
	d3: {forceSimulation, forceManyBody, forceCenter, forceLink, forceRadial, forceY, forceCollide},
	util: {overIdx, overKey, overPath}
};

execute({id: "in", state: new Map(), lib, data: { graph: DEFAULT_GRAPH }});