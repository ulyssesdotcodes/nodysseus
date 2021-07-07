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
import { h, app, text, memo } from "hyperapp"

import DEFAULT_GRAPH from "./default.nodysseus.json"
import { times } from "lodash";

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

// in place `over` of an array index
const overIdx = i => fn => arr => (arr[i] = fn(arr[i]), arr);

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

const compile = (node) => node.script ? new Function('lib', 'self', node.script)(lib, node) : default_fn(lib, node);

// Note: heavy use of comma operator https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Comma_Operator
const unpackTypes = (node_types, node) => {
	let ty = node.type;
	const result = Object.assign({}, node);
	while(node_types[ty]) {
		Object.assign(result, node_types[ty], result);
		ty = node_types[ty].type;
	}
	return result;
}

const compileNodes = (node_types, nodes) => Object.fromEntries(
	Object.entries(nodes ?? {})
		.map(overIdx(1)(n => Object.assign({}, {node_types}, unpackTypes(node_types, n), n)))
		.map(overIdx(1)(compile))
);

const createEdgeFns = (edges, from, fns) => (edges ?? [])
	.filter(e => e.from === from)
	.map(edge => Object.assign({}, edge, {fn: fns[edge.to]}))

const default_fn = (lib, self) => {
	const node_fns = compileNodes(self.node_types, self.nodes);

	return (state, input) => { 
		const edge_queue = queue(createEdgeFns(self.edges, 'in', node_fns));

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
		}, {in: input}, edge_queue).out;
	}
} 

const aggregate_fn = (lib, self) => {
	const node_fns = lib.no.compileNodes(self.node_types, self.nodes); 
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

	return (state, input) => new Map([...map(output_order.entries(), ([k, run_edge]) => [k, run_edge.fn(state.has(k) ? state.get(k) : state.set(k, new Map()).get(k), input)])]);
}

const h_fn = (lib, self) => (state, input) => haState => (console.log(input), lib.ha.h(
		self.dom_type, // change to input
		input.attrs ? input.attrs(haState) : {}, 
		input.children 
			?  [...lib.iter.map(
				input.children.entries(), 
				([k, v]) => v(haState[k]))]
			: []));

// returns a state, input => output

const lib = { ha: { h, app, text, memo},  cm, iter: {reduce, map}, no: { compileNodes, default_fn, aggregate_fn, h_fn }, R };

// sort edges by distance from in
// const edges = [];
// R.reduce((acc, edge) => edge.from === 'in' ? 0 : , {}, edges);

// expecting null

compile(DEFAULT_GRAPH)(new Map(), DEFAULT_GRAPH);