    import { json, jsonParseLinter } from "@codemirror/lang-json";
    import { javascript } from "@codemirror/lang-javascript";
    import {keymap, highlightSpecialChars, drawSelection, highlightActiveLine, EditorView} from "@codemirror/view";
    import {EditorState, StateEffect} from "@codemirror/state";
    import {history, historyKeymap} from "@codemirror/history";
    import {foldGutter, foldKeymap} from "@codemirror/fold";
    import {indentOnInput} from "@codemirror/language";
    import {lineNumbers, highlightActiveLineGutter} from "@codemirror/gutter";
    import {standardKeymap} from "@codemirror/commands";
    import {bracketMatching} from "@codemirror/matchbrackets";
    import {closeBrackets, closeBracketsKeymap} from "@codemirror/closebrackets";
    import {searchKeymap, highlightSelectionMatches} from "@codemirror/search";
    import {autocompletion, completionKeymap} from "@codemirror/autocomplete";
    import {commentKeymap} from "@codemirror/comment";
    import {rectangularSelection} from "@codemirror/rectangular-selection";
    import {defaultHighlightStyle} from "@codemirror/highlight";
    import {lintKeymap, linter} from "@codemirror/lint";


    import { html } from 'htm/preact'
    import { render } from 'preact'
    import { SVG } from "@svgdotjs/svg.js";

    import clone from "just-clone";
    import { diff } from "just-diff";
    import { diffApply } from "just-diff-apply";
    import extend from "just-extend";
    import get from "just-safe-get";

		import DEFAULT_GRAPH from "./default.copane.json"

    const cm = {javascript, json, searchKeymap, keymap, highlightSpecialChars, 
      drawSelection, highlightActiveLine, EditorState, EditorView, StateEffect, jsonParseLinter,
      history, historyKeymap, foldGutter, foldKeymap, indentOnInput, lineNumbers, highlightActiveLineGutter,
      standardKeymap, bracketMatching, closeBrackets, closeBracketsKeymap, searchKeymap, highlightSelectionMatches,
      autocompletion, completionKeymap, commentKeymap, rectangularSelection, defaultHighlightStyle, lintKeymap, linter
    };

    // helpers
    window.AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;
    function isFunction(functionToCheck) {
      return functionToCheck && {}.toString.call(functionToCheck) === '[object Function]';
    }

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

    /////
    // This is a plugin that takes a graph and runs it in js. The logic should be in the nodes, but the scaffolding here should work like all plugins - handle errors, etc.
    /////

    // TODO: Names are unique, just use them for ids?

    const runScript = `
      const node = state.graph.nodes[name];
      const stack = state.graph.edges.filter(c => c[0] === name).map(c => c[1]); 

      state.temp.results.set(name, inputs[0]);

			const log_node = "key_trigger";

      while(stack.length > 0) { 
        const run = stack.pop(); 
        if(!state.graph.nodes.hasOwnProperty(run)) {
          throw new Error("Unknown node " + run)
        }
        const run_node = {...state.graph.nodes[run]};
        while(run_node.type && run_node.type !== 'script'){
          if(!state.graph.defaults.hasOwnProperty(run_node.type)) {
            throw new Error("Unknown node type " + run_node.type + " on node " + run);
          }
          run_node.nodes = {...state.graph.defaults[run_node.type].nodes, ...run_node.nodes};
          run_node.type = state.graph.defaults[run_node.type].type;
        }

        const inputs = state.graph.edges.filter(c => c[1] === run).map(c => state.temp.results.get(c[0])); 
				if(log_node === run){
					console.log("start " + run);
				}
        await Promise.resolve(run_node)
          .then(node => new AsyncFunction('state', 'name', 'inputs', run_node.nodes.script)(state, run, inputs))
          .then(result => {
            state.temp.errors.delete(run);
            if(result !== undefined) {  
              state.temp.results.set(run, result); 
              state.graph.edges.filter(c => c[0] === run).forEach(c => stack.unshift(c[1])); 
            }
						if(log_node === run){
							console.log("end " + run + " with ");
							console.log(result);
						}
          })
          .catch(err => { console.error(err); state.temp.errors.set(run, err); });
      }
    `;

    const mouseEventScript = `
      const trigger = state.graph.nodes[name].nodes.trigger;
      const run_node = {...state.graph.nodes[trigger]};
      while(run_node.type && run_node.type !== 'script'){
        run_node.nodes = {...state.graph.defaults[run_node.type].nodes, ...run_node.nodes};
        run_node.type = state.graph.defaults[run_node.type].type;
      }

      const mouseEvent = (ty) => (e) => {
        const mouse_event = {x: e.x, y: e.y, target: document.elementFromPoint(e.x, e.y).parentElement.id, buttons: e.buttons, button: e.button, ty };
        new AsyncFunction('state', 'name', 'inputs', run_node.nodes.script)(state, trigger, [mouse_event]);
      };

      document.getElementById('graph').onmousemove = mouseEvent('mousemove');
      document.getElementById('graph').onmousedown = mouseEvent('mousedown');
      document.getElementById('graph').onmouseup = mouseEvent('mouseup');
    `;

    const keyboardEventScript = `
      const trigger = state.graph.nodes[name].nodes.trigger;
      const run_node = {...state.graph.nodes[trigger]};
      while(run_node.type && run_node.type !== 'script'){
        run_node.nodes = {...state.graph.defaults[run_node.type].nodes, ...run_node.nodes};
        run_node.type = state.graph.defaults[run_node.type].type;
      }
      const isPrevented = (key_e) =>
        state.graph.nodes[name].nodes.prevent_default_keys && state.graph.nodes[name].nodes.prevent_default_keys.reduce(
          (acc, key) => acc || Object.keys(key).reduce((acc, k) => acc && key_e[k] === key[k] , true)
            , false);

      const keyboardEvent = (ty) => (e) => {
        const key_e = {event: ty, code: e.code, altKey: e.altKey, ctrlKey: e.ctrlKey, key: e.key, metaKey: e.metaKey};
        state.temp.errors.delete(trigger);
        if(isPrevented(key_e)) {
          e.preventDefault();
        }

        new AsyncFunction('state', 'name', 'inputs', run_node.nodes.script)(state, trigger, [key_e]);
      }

      const keyup = keyboardEvent('keyup');

      window.addEventListener('keydown', keyup);
    `

    const configEditorScript = `
      const trigger = state.graph.nodes[name].nodes.trigger;
      const run_node = {...state.graph.nodes[trigger]};
      while(run_node.type && run_node.type !== 'script'){
        run_node.nodes = {...state.graph.defaults[run_node.type].nodes, ...(run_node.nodes ?? [])};
        run_node.type = state.graph.defaults[run_node.type].type;
      }

      state.editor.dispatch({ 
        effects: state.lib.cm.StateEffect.appendConfig.of([
          state.lib.cm.EditorView.theme({'&': {width: '50vw', height: '95vh'}, '.cm-scroller': { overflow: 'auto' }}),
          state.lib.cm.EditorView.updateListener.of(
            update => {
              if(update.docChanged) {
                const updated_state = update.state.doc.toString();
                state.temp.errors.delete(trigger);
                new AsyncFunction('state', 'name', 'inputs', run_node.nodes.script)(state, trigger, [updated_state]);
              }
            }),
        ])
      }); 
    `

    // type Node = string | number | boolean | { type: string, nodes: {[key: string]: Node}, edges: [[string, string]]}

    // Plugins should have a default graph

		DEFAULT_GRAPH.defaults.run.nodes.script = `
      const node = state.graph.nodes[name];
      const stack = state.graph.edges.filter(c => c[0] === name).map(c => c[1]); 

      state.temp.results.set(name, input);

			const log_node = node.nodes?.log_node;

      while(stack.length > 0) { 
        const run = stack.pop(); 
        if(!state.graph.nodes.hasOwnProperty(run)) {
          throw new Error("Unknown node " + run)
        }
        const run_node = {...state.graph.nodes[run]};
        while(run_node.type && run_node.type !== 'script'){
          if(!state.graph.defaults.hasOwnProperty(run_node.type)) {
            throw new Error("Unknown node type " + run_node.type + " on node " + run);
          }
          run_node.nodes = {...state.graph.defaults[run_node.type].nodes, ...run_node.nodes};
          run_node.type = state.graph.defaults[run_node.type].type;
        }

        const input = Object.fromEntries(
					state.graph.edges
						.filter(c => c[1] === run)
						.map(c => [c[2] ?? c[0], state.temp.results.get(c[0])])
				);

				if(log_node === run){
					console.log("start " + run + " with input ");
					console.dir(input);
				}

        await Promise.resolve(run_node)
          .then(node => new AsyncFunction('state', 'name', 'input', node.nodes.script)(state, run, input))
          .then(result => {
            state.temp.errors.delete(run);
            if(result !== undefined) {  
              state.temp.results.set(run, result); 
              state.graph.edges.filter(c => c[0] === run).forEach(c => stack.unshift(c[1])); 
            }

						if(log_node === run){
							console.log("end" + run + " with ");
							console.dir(result);
						}

          })
          .catch(err => { console.log("error running" + run); console.error(err); state.temp.errors.set(run, err); });
      }
		`

    const graph = DEFAULT_GRAPH;


    // HTML setup

    const lib = { cm, html, render, SVG, diff, diffApply, extend, clone, get }

    const editorEl = document.getElementById("editor");
    const graphEl = document.getElementById("graph");

    const editorState  = cm.EditorState.create({
      doc: JSON.stringify(graph, null, 2),
      extensions: [
				cm.json(),
				cm.linter(cm.jsonParseLinter()),
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

    // Actual plugin

    // state is passed between nodes
    const state = {
      lib,
      el: {editor: editorEl, graph: graphEl },
      editor: editorView,
      graph,
      temp: { results: new Map(), errors: new Map() }
    };

    new AsyncFunction('state', 'name', 'input', DEFAULT_GRAPH.defaults[DEFAULT_GRAPH.nodes['onload'].type].nodes.script)(state, 'onload', DEFAULT_GRAPH)