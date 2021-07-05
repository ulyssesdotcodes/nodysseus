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


import * as R from 'ramda';
import { h, app } from "hyperapp"

import DEFAULT_GRAPH from "./default.nodysseus.json"

const cm = {javascript, json, searchKeymap, keymap, highlightSpecialChars, 
	drawSelection, highlightActiveLine, EditorState, EditorView, StateEffect, jsonParseLinter,
	history, historyKeymap, foldGutter, foldKeymap, indentOnInput, lineNumbers, highlightActiveLineGutter,
	standardKeymap, bracketMatching, closeBrackets, closeBracketsKeymap, searchKeymap, highlightSelectionMatches,
	autocompletion, completionKeymap, commentKeymap, rectangularSelection, defaultHighlightStyle, lintKeymap, linter
};

// helpers
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

// HTML setup

const queue = () => ({
	list: [],
	callback: undefined,
	abortController: new AbortController(),
	pop() {
		if(this.list.length > 0) {
			return Promise.resolve(this.list.pop());
		}

		return new Promise((resolve, reject) => {
			this.abortController.signal.addEventListener('abort', reject);

			const current_cb = this.callback;
			this.callback = current_cb ? (v) => {resolve(v); current_cb(v) } : resolve;
		});
	},
	push(v, isArr){
		if(isArr) {
			if (this.callback) {
				const cb = this.callback;
				this.callback = undefined;
				cb(v.pop());
			}

			this.list.unshift(...v)
		} else {
			if(this.callback) {
				const cb = this.callback;
				this.callback = undefined;
				this.last = performance.now();
				cb(v);
			} else {
				this.list.unshift(v);
			}
		}

		this.last = performance.now();

		return this;
	}
});

const queueIterator = (queue) => ({[Symbol.asyncIterator](){
		return {
			queue,
			next(){
				return this.queue.pop().then(value => value?.done ? value : {done: this.queue.abortController.signal.aborted, value}).catch(err => console.error(err));
			}
		}
	}})

const lib = { h, app, cm, R, queue, queueIterator }

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

let log_node = "hyperapp";
let debug_node = "";


// if(!state.has('dispatch') && input.state && input.dom){ 
// 	state.set('dispatch', lib.app({ 
// 		init: input.state, 
// 		view: haState => {
// 			console.log('ugh'); 
// 			return input.view(haState).children[0]
// 		}, 
// 		node: input.dom 
// 	})); 
// } 

// return state.get('dispatch');

const runNode = (state, node, input) => node.script
		? (new AsyncFunction('lib', 'state', 'node', 'input', node.script)(lib, state, node, input)).catch(err => {
			console.log(`Error running ${node.id}`);
			console.log("state")
			console.dir(state);
			console.log("node")
			console.dir(node);
			console.log("input")
			console.dir(input);
			console.error(err);
			return input;
		})
		: runGraph(state, node, input);


const runGraph = async (state, graph, input) => ({
	outputs: {},
	state,
	queue: lib.queue().push({id: "in", node: lib.R.mergeRight(graph.node_types[graph.nodes.in.type], graph.nodes.in), input: {...input, ...graph}}),
	count: 0,
	async* [Symbol.asyncIterator](){
		const runOutput = (run_cmd, output) => {
			if(run_cmd.id === debug_node) {
				debugger;
			}

			if(run_cmd.id === log_node) {
				console.log(JSON.stringify(output));
			}

			this.outputs = lib.R.assoc(run_cmd.id, output, this.outputs);

			const next_edges = lib.R.compose(lib.R.filter(edge => edge.from === run_cmd.id))(graph.edges);
			const new_stack = lib.R.map(
				lib.R.compose(
					next_edge => ({
						id: next_edge.to, 
						node: lib.R.compose(
							lib.R.mergeRight(graph.nodes && graph.nodes[next_edge.to].type ? graph.node_types[graph.nodes[next_edge.to].type] : {}),
							lib.R.mergeDeepRight({
								node_types: graph.node_types
							}))(graph.nodes[next_edge.to])
						,
						input: lib.R.compose(
							lib.R.mergeLeft(next_edge.as ? lib.R.objOf(next_edge.as, output) : output),
							lib.R.reduce((acc, input_edge) => 
								lib.R.mergeLeft(
									input_edge.as 
									? lib.R.objOf(input_edge.as, this.outputs[input_edge.from]) 
									: this.outputs[input_edge.from],
									acc
								)
							, {}),
							lib.R.filter(edge => edge.to === next_edge.to && edge.from !== run_cmd.id)
						)(graph.edges)
					}),
					next_edge => Array.isArray(next_edge) ? {from: next_edge[0], to: next_edge[1]} : next_edge
				), next_edges);

			this.queue.push(new_stack, true);

			return output;
		}

		for await (const run_cmd of lib.queueIterator(this.queue)) {
			if(!run_cmd) {
				continue;
			}

			if(run_cmd.id === log_node) {
				console.log(run_cmd);
			}

			if(run_cmd.id === debug_node) {
				debugger;
			}

			if(!this.state.has(run_cmd.id)) {
				this.state.set(run_cmd.id, new Map());
			}

			const output_generator = await runNode(this.state.get(run_cmd.id), lib.R.mergeLeft({id: run_cmd.id}, run_cmd.node), run_cmd.input);
			if(output_generator && output_generator[Symbol.asyncIterator]) {
				// fork
				(async function(){
					for await (const output of output_generator) {
						if(output !== undefined && output !== null) {
							runOutput(run_cmd, output);
						}
					}
				})()
			} else if(output_generator !== undefined && output_generator !== null) {
				const value = runOutput(run_cmd, output_generator);
				// Special case "out" nodes
				if(run_cmd.node.type === "out") {
					yield value;
				}
			}
		}
	}
});

lib.runNode = runNode; lib.runGraph = runGraph;

const run = async (state, graph) => {
	const default_run = await runNode(state, graph, graph);
	let next_graph;
	for await(const value of default_run) {
		next_graph = value;
		if(next_graph) {
			default_run.queue.abortController.abort();
			break;
		}
	}

	run(state, next_graph);
};

run(new Map(), DEFAULT_GRAPH);