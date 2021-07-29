import { json, jsonParseLinter, jsonLanguage } from "@codemirror/lang-json";
import { javascript, javascriptLanguage } from "@codemirror/lang-javascript";
import { keymap, highlightSpecialChars, drawSelection, highlightActiveLine, EditorView } from "@codemirror/view";
import { EditorState, StateEffect, Compartment } from "@codemirror/state";
import { history, historyKeymap } from "@codemirror/history";
import { foldGutter, foldKeymap } from "@codemirror/fold";
import { indentOnInput } from "@codemirror/language";
import { lineNumbers, highlightActiveLineGutter } from "@codemirror/gutter";
import { cursorLineBoundaryBackward, standardKeymap } from "@codemirror/commands";
import { bracketMatching } from "@codemirror/matchbrackets";
import { closeBrackets, closeBracketsKeymap } from "@codemirror/closebrackets";
import { searchKeymap, highlightSelectionMatches } from "@codemirror/search";
import { autocompletion, completionKeymap } from "@codemirror/autocomplete";
import { commentKeymap } from "@codemirror/comment";
import { rectangularSelection } from "@codemirror/rectangular-selection";
import { defaultHighlightStyle } from "@codemirror/highlight";
import { lintKeymap, linter } from "@codemirror/lint";
import { language } from "@codemirror/language";


import _, { merge } from "lodash";
import { h, app, text, memo } from "hyperapp"
import { forceSimulation, forceManyBody, forceCenter, forceLink, forceRadial, forceX, forceY, forceCollide } from "d3-force";

// import DEFAULT_GRAPH from "./default.nodysseus.json"
import DEFAULT_GRAPH from "./flatten.json"
import { A } from "@svgdotjs/svg.js";

const cm = {
    javascript,
    json,
    searchKeymap,
    keymap,
    highlightSpecialChars,
    drawSelection,
    highlightActiveLine,
    EditorState,
    EditorView,
    StateEffect,
    jsonParseLinter,
    history,
    historyKeymap,
    foldGutter,
    foldKeymap,
    indentOnInput,
    lineNumbers,
    highlightActiveLineGutter,
    standardKeymap,
    bracketMatching,
    closeBrackets,
    closeBracketsKeymap,
    searchKeymap,
    highlightSelectionMatches,
    autocompletion,
    completionKeymap,
    commentKeymap,
    rectangularSelection,
    defaultHighlightStyle,
    lintKeymap,
    linter
};

// helpers

const reduce = (fn, acc, it) => {
    for (const n of it) {
        acc = fn(acc, n);
    }

    return acc;
}

const map = function*(it, fn) {
    for (const n of it) {
        yield fn(n);
    }
}

const filter = function*(it, fn) {
    for (const n of it) {
        if (fn(n)) {
            yield n;
        }
    }
}

// in place `over` of an array index
const overIdx = (i, def) => fn => arr => (arr[i] = fn(arr[i] ?? def), arr);
const overKey = (k, def) => fn => om =>
    om instanceof Map ?
    om.set(k, fn(om.get(k) ?? def)) :
    overIdx(k, def)(fn)(om);
const overPath = (p, def) => fn => om =>
    overKey(p[0], def)(p.length === 1 ?
        fn :
        overPath(p.slice(1), def)(fn)
    )(om)

const nestedPropertyIterator = (val, prop) => ({
    level: val,
    [Symbol.iterator]: function() {
        return {
            next: () => ({ done: this.level.hasOwnProperty(prop), value: (this.level = this.level[prop], this.level) })
        }
    }
})

const addUnique = (array, set, id) => data => {
    if(!set.has(id ? id(data) : data.id)) {
        array.push(data);
        set.add(id ? id(data) : data.id);
    }
}

const edgeId = e => `${e.from}##${e.to}`;

window.AsyncFunction = Object.getPrototypeOf(async function() {}).constructor;

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

    try {
        JSON.parse(tr.newDoc.toString());
    } catch (err) {
        docIsJSON = false;
    }

    let stateIsJSON = tr.startState.facet(language) == jsonLanguage;
    if (docIsJSON == stateIsJSON) return null
    return {
        effects: languageConf.reconfigure(docIsJSON ? [cm.linter(cm.jsonParseLinter()), json()] : javascript())
    }
})

const editorState = cm.EditorState.create({
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

const compileNode = (node) => node.script ? new Function('lib', node.script)(lib) : args => Object.assign({}, args.data, Object.assign({}, node, { fn: undefined, id: undefined }));

// Note: heavy use of comma operator https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Comma_Operator
const unpackTypes = (node_types, node) => {
    let ty = typeof node === 'string' ? node : node.type;
    const result = typeof node === 'string' ? {} : Object.assign({}, node)
    while (ty && node_types[ty]) {
        Object.assign(result, node_types[ty]);
        ty = node_types[ty].type;
    }
    return result;
}

const hFn = ({ data }) => ({
    value: {
        el: lib.ha.h(
            data.dom_type, // change to input
            data.attrs ?? {},
            data.children instanceof Map ? [...lib.iter.map(
                data.children.values(),
                v => v ? v : undefined)] :
            Array.isArray(data.children) ?
            data.children :
            data.children ? [data.children] : [])
    },
    delete: ["attrs", "children", "dom_type"]
});

// this is a context
const execute = args => {
    const { id, state, data } = args;
    const self = data?.[0]?.graph?.nodes?.find(v => v.id === id);

    if (!self) {
        console.log(args);
        debugger;
        throw new Error("No graph or can't find node");
    }

    const node_state = state.get(id) ?? state.set(id, new Map()).get(id);

    const incoming_edges = data[0].graph.edges.filter(e => e.to === id);

    // store and merge args across calls
    const mergeable_self = Object.assign({}, self);
    delete mergeable_self['merge_data'];
    delete mergeable_self['required_data'];

    const merged_datas = lib._.zipWith(data, node_state.get('data') ?? [], (d, sd) =>
        self.merge_data ?? incoming_edges.length > 1 ?
        sd ?
        Object.assign({}, sd, d, mergeable_self) :
        Object.assign({}, d, mergeable_self) :
        Object.assign({}, d, mergeable_self)
    );

    node_state.set('data', merged_datas);

    if (node_state.get('self') !== self) {
        self.fn = compileNode(self);
        node_state.set('self', self);
    }

    // call the function with node_state
    try {
        let result;

        if (self.run_over_all) {
            result = self.fn(Object.assign({}, args, { state: node_state, data: merged_datas }));
        } else {
            result = merged_datas.map(merged_data => {
                if (self.required_data && !lib._.every(self.required_data, p => lib._.has(merged_data, p))) {
                    return;
                }

                return self.fn(Object.assign({}, args, { state: node_state, data: merged_data }));
            })
        }

        runNextNodes(Object.assign({}, args), result);
    } catch (e) {
        console.log(`error running ${id}`);
        console.log(self);
        console.log(args);
        console.error(e);
        debugger;
    }
}

const verify = ({ data }) => {
    const node_map = new Map(data.graph.nodes.map(n => [n.id, n]));
    data.graph.edges.forEach(e => {
        if (!(node_map.has(e.from) && node_map.has(e.to))) {
            throw new Error(`invalid edge ${JSON.stringify(e)}`)
        }
    })

    return data;
}

const fnDef = ({ id, data, state }) => {
    if(
        state.has('reference_edges') 
        && state.has('reference_nodes')
        && state.has('fnDef_edges')
        && state.has('fnDef_nodes')
    ) {
        const ref_nodes_set = new Set();
        const reference_nodes = [];
        const addNode = addUnique(reference_nodes, ref_nodes_set);

        state.get('reference_nodes').forEach(addNode);
        data.reference_nodes.forEach(addNode);
        state.set('reference_nodes', reference_nodes);

        const ref_edges_set = new Set();
        const reference_edges = [];
        const addEdge = addUnique(reference_edges, ref_edges_set, edgeId);

        state.get('reference_edges').forEach(addEdge);
        data.reference_edges.forEach(addEdge);
        state.set('reference_edges', reference_edges);

        const graph_edges_set = new Set();
        const graph_edges = [];
        const addGraphEdge = addUnique(graph_edges, graph_edges_set, edgeId);

        state.get('fnDef_edges').forEach(addGraphEdge)
        data.graph.edges.forEach(addGraphEdge);

        const graph_nodes_set = new Set();
        const graph_nodes = [];
        const addGraphNode = addUnique(graph_nodes, graph_nodes_set);

        state.get('fnDef_nodes').forEach(addGraphNode)
        data.graph.nodes.forEach(addGraphNode);

        return {
            graph:{
                nodes: graph_nodes,
                edges: graph_edges
            },
            reference_nodes,
            reference_edges
        }
    }


    const next_edges = data.graph.edges.filter(e => e.from === id);
    const next_node_ids = new Set();
    next_edges.forEach(e => next_node_ids.add(e.to));
    const next_nodes = Object.fromEntries(next_edges.map(e => [e.to, data.graph.nodes.find(gn => gn.id === e.to)]))


    const next_ref_nodes = next_edges.map(e => next_nodes[e.to].type === "fn_return" && !data.fn_level  ?
        next_nodes[e.to] :
        Object.assign({}, next_nodes[e.to], { id: `${e.to}#ref_fnDef` })
    );

    const reference_nodes_set = new Set();
    const reference_nodes = [];
    const addRefNode = addUnique(reference_nodes, reference_nodes_set);

    next_ref_nodes.forEach(addRefNode);
    if (data.reference_nodes){
        data.reference_nodes.forEach(addRefNode);
    }

    state.set('reference_nodes', reference_nodes);

    const next_ref_edges = next_edges.map(e => ({
        from: data.reference_edges ? `${id}#ref_fnDef` : "in",
        to: `${e.to}#ref_fnDef`,
        as: e.as
    }));

    const reference_edges_set = new Set();
    const reference_edges = [];
    const addRefEdge = addUnique(reference_edges, reference_edges_set, edgeId);

    next_ref_edges.forEach(addRefEdge);
    if (data.reference_edges) {
        data.reference_edges.forEach(addRefEdge);
    }

    state.set('reference_edges', reference_edges);


    const fnDef_nodes = (!!data.fn_level
        ?  next_edges
        : next_edges.filter(e => next_nodes[e.to].type !== "fn_return"))
        .map(e => ({
            id: e.to,
            fn_level: (data.fn_level ?? 0) + (
                next_nodes[e.to].type === "fn_def" ? 1 
                : next_nodes[e.to].type === "fn_return" ? -1 : 0),
            script: "return lib.no.fnDef"
        }));
    state.set('fnDef_nodes', fnDef_nodes);

    // get rid of "as"
    const fnDef_edges = next_edges.map(e => ({ from: e.from, to: e.to }));
    state.set('fnDef_edges', fnDef_edges);

    const graph_seen_nodes = new Set();
    const graph_nodes = [];
    const addGraphNode = addUnique(graph_nodes, graph_seen_nodes);

    fnDef_nodes.forEach(addGraphNode);
    data.graph.nodes.forEach(addGraphNode);

    const graph_edges_set = new Set();
    const graph_edges = new Array();
    const addGraphEdge = addUnique(graph_edges, graph_edges_set, edgeId);

    fnDef_edges.forEach(addGraphEdge)
    data.graph.edges.forEach(addGraphEdge);

    return {
        graph: {
            nodes: graph_nodes,
            edges: graph_edges
        },
        reference_nodes,
        reference_edges
    }
}

const fnReturn = ({ id, data, lib, state }) => {
    const fnOut = {
        id: `${id}#ref_fnDef`,
        script: "return ({data}) => data.fn_result.fn_value = data.return_value"
    };

    // needed because of the way fnDef outputs values
    state.set('reference_nodes', data.reference_nodes);
    state.set('reference_edges', data.reference_edges);

    return {
        value: (...args) => {
            const fn_result = {};
            const graph_nodes_set = new Set();
            const graph_nodes = [fnOut];

            const addNode = addUnique(graph_nodes, graph_nodes_set);

            data.graph.nodes.forEach(addNode);
            state.get('reference_nodes').forEach(addNode);

            runNextNodes({
                id: "in",
                data: [{
                    graph: {
                        nodes: graph_nodes,
                        edges: state.get('reference_edges')
                    },
                    fn_args: args,
                    fn_result
                }],
                lib,
                state: new Map()
            }, [lib._.pick(data, data.inherited_data ?? [])]);

            return fn_result.fn_value;
        }
    }
}

const concatValues = ({ data, state }) => {
    const new_aggregate = state.set('aggregate', (
        data.aggregate ?? (state.has('aggregate') ? state.get('aggregate') : [])
    ).concat([data.concat_value])).get('aggregate');

    if (!data.length || data.length <= new_aggregate.length) {
        return { value: new_aggregate, delete: ["concat_value", "length"] };
    }
}

const runNextNodes = (args, returned_results) => {

    const stored_data = Object.assign({}, (args.state.get(args.id) ?? new Map()).get('data'));
    const results = returned_results
        .filter(r => r !== undefined)
        .map((result, i) => ({
            previous_data: Object.assign({}, args.data[i]),
            stored_data: stored_data[i],
            raw: !(
                result !== undefined &&
                typeof result === "object" &&
                result.hasOwnProperty('value')
            ),
            value: !(
                result !== undefined &&
                typeof result === "object" &&
                result.hasOwnProperty('value')
            ) ? result : result.value,
            delete: result.delete
        }))
        .filter(r => r.value !== undefined);

    results.forEach(result => {
        if (!result.raw && result.hasOwnProperty('delete')) {
            // lib._.omit is super slow so we do it this way
            result.delete?.forEach(p => {
                delete result.value[p];
                delete result.previous_data[p];
                delete result.stored_data[p];
            })
        }

        // get rid of this by default
        delete result.value["id"];
    });

    if (results.length === 0) {
        return;
    }


    (results[0].value.graph ?? args.data[0].graph).edges
        .filter(e => e.from === args.id)
        .forEach(e => execute({
            id: e.to,
            data: results.map(({ previous_data, value }) => e.as 
                ? lib._.set(Object.assign({}, previous_data), e.as, value) 
                : typeof value === 'object' && !Array.isArray(value) 
                ? Object.assign({}, previous_data, value) 
                : new Error(`Returned an unwrapped array in ${args.id}`)),
            state: args.state,
            lib: args.lib
        }));
}

const map_path_fn = ({ lib, data }) => data.target && data.target_path && data.map_fn ? ({
    value: lib._.update(
        data.target,
        data.target_path,
        a => lib._.map(a, data.map_fn)
    ),
    delete: ['target_path', 'map_fn']
}) : undefined;

const flatten_node = (graph, levels = -1) => {
    if (graph.nodes === undefined || levels === 0) {
        return graph;
    }

    // needs to not prefix base node because then flatten node can't run  next
    const prefix = graph.id ? `${graph.id}/` : '';

    return graph.nodes
        .map(n => Object.assign({}, n, { id: `${prefix}${n.id}` }))
        .map(g => flatten_node(g, levels - 1))
        .reduce((acc, n) => Object.assign({}, acc, {
            flat_nodes: acc.flat_nodes.concat(n.flat_nodes?.flat() ?? []),
            flat_edges: acc.flat_edges.map(e => n.flat_nodes ?
                e.to === n.id ?
                Object.assign(e, { to: `${e.to}/in` }) :
                e.from === n.id ?
                Object.assign(e, { from: `${e.from}/out` }) :
                e :
                e).flat().concat(n.flat_edges).filter(e => e !== undefined)
        }), Object.assign({}, graph, {
            flat_nodes: graph.nodes
                .map(n => Object.assign({}, n, { id: `${prefix}${n.id}` })),
            flat_edges: graph.edges
                .map(e => ({ from: `${prefix}${e.from}`, to: `${prefix}${e.to}`, as: e.as }))
        }));
}

const flatten = ({ data }) => {
    const flattened = flatten_node(data.graph)

    return { graph: { nodes: flattened.flat_nodes, edges: flattened.flat_edges } };
}

const d3simulation = ({ data }) => {
    const bfs = (level) => (edge) => [
        [edge.to, level]
    ].concat(data.display_graph.edges.filter(e => e.from === edge.to).map(bfs(level + 1)).flat());

    const levels = calculate_levels(data.display_graph);

    const simulation =
        lib.d3.forceSimulation(
            data.display_graph.nodes
            .map((n, index) => ({
                node_id: n.id,
                x: window.innerWidth * (Math.random() * .5 + .25),
                y: n.id === "in" ? 64 : window.innerHeight * (Math.random() * .5 + .25),
                fy: n.id === "in" ? 64 : undefined,
                index
            })))
        .force('charge', lib.d3.forceManyBody().strength(-50).distanceMax(128))
        // .force('center', lib.d3
        // 	.forceCenter(window.innerWidth * 0.5, window.innerHeight * 0.5)
        // 	.strength(.01))
        .force('links', lib.d3
            .forceLink(data.display_graph.edges.filter(e => e.to !== "log" && e.to !=="debug").map((e, index) => ({ source: e.from, target: e.to, index })))
            .distance(64)
            .strength(0.1)
            .id(n => n.node_id))
        .force('link_direction', lib.d3
            .forceY()
            .y((n) => window.innerHeight * (0.075 + 0.85 * (levels.levels.get(n.node_id) ?? 0) / (levels.max - levels.min)) +
                (levels.levels.has(n.node_id) && levels.levels.get(n.node_id) !== undefined ?
                    64 * levels.nodes_by_level[levels.levels.get(n.node_id)].indexOf(n.node_id) - (levels.nodes_by_level[levels.levels.get(n.node_id)].length - 1) * 64 * 0.5 :
                    0))
            .strength(1))
        .force('link_siblings', lib.d3
            .forceX()
            .x((n) => window.innerWidth * 0.5 + (window.innerWidth * Math.random() * 0.05) +
                (levels.levels.has(n.node_id) && levels.levels.get(n.node_id) !== undefined ?
                    (256 * levels.nodes_by_level[levels.levels.get(n.node_id)].indexOf(n.node_id) - levels.nodes_by_level[levels.levels.get(n.node_id)].length * 256 * 0.5) :
                    window.innerWidth * 0.25))
            .strength(1))
            .alphaMin(.2);


        // .force('x', lib.d3.forceX(window.innerWidth * 0.5))
        // .force('y', lib.d3.forceY(64).strength(n => n.id === "in" ? 1 : 0))
        // .force('y', lib.d3.forceY(window.innerHeight).strength(n => n.id === "in" ? 0 : 0.02))
        // .force('collide', lib.d3.forceCollide(32));
        // .alphaMin(.001); // changes how long the simulation will run. dfault is 0.001 

    return simulation;
}

const node_click = ({ data }) => {
    if (data.node_id.endsWith('in') || data.node_id.endsWith('out')) {
        return lib.no.contract_node({ data });
    } else {
        return lib.no.expand_node({ data })
    }
}

const contract_node = ({ data }) => {
    const node_id = data.payload.node_id.endsWith('in') ?
        data.payload.node_id.substring(0, data.payload.node_id.length - 3) :
        data.payload.node_id.substring(0, data.payload.node_id.length - 4);

    const new_display_graph = {
        nodes: data.display_graph.nodes
            .filter(n => !n.id.startsWith(node_id))
            .concat([{
                id: node_id,
                nodes: data.display_graph.nodes
                    .filter(n => n.id.startsWith(node_id))
                    .map(n => ({...n, id: n.id.substring(node_id.length + 1)})),
                edges: data.display_graph.edges
                    .filter(e => e.from.startsWith(node_id) && e.to.startsWith(node_id))
                    .map(e =>({
                        as: e.as,
                        from: e.from.substring(node_id.length + 1),
                        to: e.to.substring(node_id.length + 1),
                    }))
            }]),
        edges: data.display_graph.edges
            .map(e => ({
                from: e.from === `${node_id}/out` ? node_id : e.from,
                to: e.to === `${node_id}/in` ? node_id : e.to
            }))
            .filter(e => !(e.from.startsWith(`${node_id}/`) || e.to.startsWith(`${node_id}/`)))
    };

    const levels = calculate_levels(new_display_graph);

    const new_nodes = data.nodes
        .filter(n => !n.node_id.startsWith(node_id))
        .concat([{
            node_id,
            x: data.payload.x,
            y: data.payload.y,
            index: data.nodes.length - 1
        }])

    const new_links = new_display_graph.edges.filter(e => e.to !== "log" && e.to !=="debug").map(e => ({source: e.from, target: e.to}));

    return {
        ...data,
        nodes: new_nodes,
        links: new_links,
        display_graph: new_display_graph,
        levels
    }
}

const update_simulation_nodes = ({data}) => {
    const levels = data.levels;

    data.simulation.nodes(data.nodes);

    data.simulation.force('links').links(data.links);
    data.simulation.force('link_direction')
        .y((n) => window.innerHeight * (0.075 + 0.85 * (levels.levels.get(n.node_id) ?? 0) / (levels.max - levels.min)) +
            (levels.levels.has(n.node_id) && levels.levels.get(n.node_id) !== undefined ?
                64 * levels.nodes_by_level[levels.levels.get(n.node_id)].indexOf(n.node_id) - (levels.nodes_by_level[levels.levels.get(n.node_id)].length - 1) * 64 * 0.5 :
                0));

    data.simulation.force('link_siblings')
        .x((n) => window.innerWidth * 0.5 + (window.innerWidth * Math.random() * 0.05) +
            (levels.levels.has(n.node_id) && levels.levels.get(n.node_id) !== undefined ?
                (256 * levels.nodes_by_level[levels.levels.get(n.node_id)].indexOf(n.node_id) - levels.nodes_by_level[levels.levels.get(n.node_id)].length * 256 * 0.5) :
                window.innerWidth * 0.25));

    data.simulation
        // .force(`parent_${data.node_id}`, lib.d3.forceRadial(0, data.x, data.y).strength(n => n.parent === data.node_id ? 0.2 : 0))
        // .force(`not_parent_${data.node_id}`, lib.d3.forceRadial(512, data.x, data.y).strength(n => n.parent === data.node_id ? 0 : 0.2))
        // .force(`center`, null)
        // .velocityDecay(.2)
        .alpha(0.4).restart();
}


const bfs = (graph, level) => (edge) => [
    [edge.to, level]
].concat(graph.edges.filter(e => e.from === edge.to).map(bfs(graph, level + 1)).flat());

const calculate_levels = graph => {
    const levels = graph.edges.filter(e => e.from === 'in').map(bfs(graph, 1)).flat()
        .reduce(
            (acc, v) => acc.set(v[0], Math.max(v[1], acc.get(v[0]) ?? 0)),
            new Map()
        ).set('in', 0);

    return {
        levels,
        min: Math.min(...levels.values()),
        max: Math.max(...levels.values()),
        nodes_by_level: [...levels.entries()].reduce((acc, [n, l]) => (acc[l] ? acc[l].push(n) : acc[l] = [n], acc), {})
    }
}


const expand_node = ({ data }) => {
    const node = data.display_graph.nodes.find(n => n.id === data.node_id)

    if (!node.nodes) {
        console.log('no nodes?');
        return;
    }

    const flattened = lib.no.flatten_node(node, 1);

    const new_display_graph = {
        nodes: data.display_graph.nodes
            .filter(n => n.node_id !== data.node_id)
            .concat(flattened.flat_nodes),
        edges: data.display_graph.edges
            .map(e => ({
                from: e.from === data.node_id ? `${data.node_id}/out` : e.from,
                to: e.to === data.node_id ? `${data.node_id}/in` : e.to
            }))
            .concat(flattened.flat_edges)
    };

    const levels = calculate_levels(new_display_graph);

    // TODO: remove duplicate code with d3simulation above
    const new_nodes = data.nodes.filter(n => n.node_id !== data.node_id)
        .concat(flattened.flat_nodes.map((n, i) => ({
            node_id: n.id,
            x: data.x + (Math.random() - 0.5) * 64,
            y: data.y + (Math.random() - 0.5) * 64,
            index: i + data.nodes.length - 1
        })))

    const new_links = new_display_graph.edges.filter(e => e.to !== "log" && e.to !=="debug").map(e => ({ source: e.from, target: e.to }));

    return {
        ...data,
        display_graph: new_display_graph,
        levels,
        nodes: new_nodes,
        links: new_links
    }
}

const debug = () => {
    debugger;
}

const lib = {
    cm,
    _,
    ha: { h, app, text, memo },
    iter: { reduce, map },
    no: { map_path_fn, flatten, unpackTypes, hFn, fnDef, fnReturn, concatValues, verify, d3simulation, debug, flatten_node, expand_node, node_click, contract_node, update_simulation_nodes },
    d3: { forceSimulation, forceManyBody, forceCenter, forceLink, forceRadial, forceY, forceCollide, forceX },
    util: { overIdx, overKey, overPath }
};

execute({ id: "in", state: new Map(), lib, data: [{ graph: DEFAULT_GRAPH }] });