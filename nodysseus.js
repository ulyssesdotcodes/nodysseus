import DEFAULT_GRAPH from "./pull.json"
import get from "just-safe-get";
import set from "just-safe-set";
import { diff } from "just-diff";
import diffApply from "just-diff-apply";
import { h, app, text, memo } from "hyperapp"
import { forceSimulation, forceManyBody, forceCenter, forceLink, forceRadial, forceX, forceY, forceCollide } from "d3-force";
import Fuse from "fuse.js";

function compare(value1, value2) {
    if (value1 === value2) {
        return true;
    }
    /* eslint-disable no-self-compare */
    // if both values are NaNs return true
    if (value1 !== value1 && value2 !== value2) {
        return true;
    }
    if (value1?._Proxy && value2?._Proxy) {
        return value1._nodeid === value2._nodeid;
    }
    if ({}.toString.call(value1) != {}.toString.call(value2)) {
        return false;
    }
    if (value1 !== Object(value1)) {
        // non equal primitives
        return false;
    }
    if (!value1) {
        return false;
    }
    if (Array.isArray(value1)) {
        return compareArrays(value1, value2);
    }
    if ({}.toString.call(value1) == '[object Set]') {
        return compareArrays(Array.from(value1), Array.from(value2));
    }
    if ({}.toString.call(value1) == '[object Map]') {
        return compareArrays([...value1.entries()], [...value2.entries()]);
    }
    if ({}.toString.call(value1) == '[object Object]') {
        return compareObjects(value1, value2);
    } else {
        return compareNativeSubtypes(value1, value2);
    }
}

function compareNativeSubtypes(value1, value2) {
    // e.g. Function, RegExp, Date
    return value1.toString() === value2.toString();
}

function compareArrays(value1, value2) {
    var len = value1.length;
    if (len != value2.length) {
        return false;
    }
    var alike = true;
    for (var i = 0; i < len; i++) {
        if (!compare(value1[i], value2[i])) {
            alike = false;
            break;
        }
    }
    return alike;
}

function compareObjects(value1, value2) {
    var keys1 = Object.keys(value1);
    var keys2 = Object.keys(value2);
    var len = keys1.length;
    if (len != keys2.length) {
        return false;
    }
    if (value1._needsresolve || value2._needsresolve) {
        return false;
    }
    for (var i = 0; i < len; i++) {
        var key1 = keys1[i];
        // var key2 = keys2[i];
        if (value1[key1] !== value2[key1]) {
            return false;
        }
        // if (!(compare(value1[key1], value2[key1]))) {
        //     return false;
        // }
    }
    return true;
}

const hashcode = function(str, seed = 0) {
    let h1 = 0xdeadbeef ^ seed, h2 = 0x41c6ce57 ^ seed;
    let i = str.length, ch;
    while(i > 0){
        i--;
        ch = str.charCodeAt(i);
        h1 = Math.imul(h1 ^ ch, 2654435761);
        h2 = Math.imul(h2 ^ ch, 1597334677);
    }
    h1 = Math.imul(h1 ^ (h1>>>16), 2246822507) ^ Math.imul(h2 ^ (h2>>>13), 3266489909);
    h2 = Math.imul(h2 ^ (h2>>>16), 2246822507) ^ Math.imul(h1 ^ (h1>>>13), 3266489909);
    return 4294967296 * (2097151 & h2) + (h1>>>0);
};

const createProxy = (run_with_val, input, graph_input_value) => { 
    let res;
    let resolved = false;
    return new Proxy({}, {
    get: (_, prop) => {
        if (prop === "_Proxy") {
            return true;
        } else if (prop === "_nodeid") {
            return input.from;
        }

        if (!resolved) {
            res = run_with_val(input.from)(graph_input_value);
            resolved = true;
        }

        if (prop === "_value") {
            return res
        } else {
            if(typeof res[prop] === 'function'){
                return res[prop].bind(res);
            } else {
                return res[prop];
            }
        }
    },
    ownKeys: (_) => {
        if (!resolved) {
            res = run_with_val(input.from)(graph_input_value);
            resolved = true;
        }

        return Reflect.ownKeys(res);
    },
    getOwnPropertyDescriptor: (_, prop) => {
        if (!resolved) {
            res = run_with_val(input.from)(graph_input_value);
            resolved = true;
        }

        return Reflect.getOwnPropertyDescriptor(res, prop);
    }
})
}

const resolve = (o) => {
    if (o?._Proxy) {
        return resolve(o._value)
    } else if (Array.isArray(o)) {
        const new_arr = o.map(v => resolve(v));
        const same = o.reduce((acc, ov, i) => acc && ov === new_arr[i], true);
        return same ? o : new_arr;
    } else if (typeof o === 'object' && o) {
        const entries = Object.entries(o);
        const new_obj_entries = entries.map(([k, v]) => [k, resolve(v)]);
        const same = entries.reduce((acc, [k, v], i) => acc && v === new_obj_entries[i][1], true);
        return same ? o : Object.fromEntries(new_obj_entries);

    } else {
        return o;
    }
}

const keywords = new Set(["break", "case", "catch", "continue", "debugger", "default", "delete", "do", "else", "finally", "for", "function", "if", "in", "instanceof", "new", "return", "switch", "this", "throw", "try", "typeof", "var", "void", "while", "with"])

const executeGraph = ({ cache, state, graph, cache_id, node_cache }) => {
    let usecache = true;

    if (!cache.has(cache_id)) {
        cache.set(cache_id, new Map([["__handles", 1]]));
    } else {
        cache.get(cache_id).set("__handles", cache.get(cache_id).get("__handles") + 1);
    }

    if (!graph.nodes) {
        throw new Error(`Graph has no nodes! in: ${graph.in} out: ${graph.out}`)
    }

    const node_map = graph.node_map ?? new Map(graph.nodes.map(n => [n.id, n]));
    graph.node_map = node_map;

    const in_edge_map = graph.in_edge_map ?? new Map(graph.nodes.map(n => [n.id, graph.edges.filter(e => e.to === n.id)]));
    graph.in_edge_map = in_edge_map;

    const run_with_val = (node_id) => (graph_input_value) => {

        let node = Object.assign({}, node_map.get(node_id), { inputs: in_edge_map.get(node_id) });

        if (node.type === "arg" && (!node.inputs || node.inputs.length === 0)) {
            node.inputs.push({ from: "_graph_input_value", to: node.id });
        }

        if (node.value && !node.script && !node.type) {
            return node.value;
        }

        let node_type;
        let node_from_cache = false;
        let cached_node = node.script ? node_cache.get(hashcode(node.id + node.script.substring(node.script.length * 0.5 - 16, node.script.length * 0.5 + 16))) : false

        if (cached_node) {
            node_from_cache = true;
            node = cached_node;
        }

        const type = node.type?.node_type ?? typeof node.type === 'string' ? node.type : undefined;
        if (!node_from_cache && type) {
            const node_map_type = node_map.get(type);
            if (node_map_type) {
                node_type = Object.assign({}, node_map_type, node)
                node_type.args = (node.args ?? []).concat(node_map_type.args);
                node_type._nodetypeflag = !!node._nodetypeflag;
            } else {
                throw new Error(`Unable to find type ${type} for node ${node.name ?? node.id}`)
            }
        } else {
            node_type = node;
        }

        const tryrun = (input) => {
            if (input.type === "ref") {
                return input.from;
            } else if (input.from === "_graph_input_value" || input.from === graph.in) {
                return graph_input_value;
            } else if (input.type === "resolve") {
                if(!node_map.has(input.from)) {
                    throw new Error(`Input not found ${input.from} for node ${node_id}`)
                }

                return resolve(run_with_val(input.from)(graph_input_value));
            } else if (!input.as || node_type.script) {
                if(!node_map.has(input.from)) {
                    throw new Error(`Input not found ${input.from} for node ${node_id}`)
                }

                let res = run_with_val(input.from)(graph_input_value);

                if (res?._Proxy) {
                    return res._value;
                }

                return res;
            } else {
                return createProxy(run_with_val, input, graph_input_value);
            }
        }

        const input_data_map = new Map(node.inputs.map(i => [i.from, tryrun(i)]));
        const inputs = node.inputs;
        const data = {};
        let input;

        // grab inputs from state
        for (let i = 0; i < inputs.length; i++) {
            input = inputs[i];

            if (input.type === "ref") {
                if (!input.as) {
                    throw new Error("references have to be named: " + node.id);
                }
                data[input.as] = input.from;
            } else {
                let state_data = input_data_map.get(input.from);

                if (input.as) {
                    data[input.as] = state_data;
                } else if (state_data !== undefined) {
                    Object.assign(data, state_data)//, {_needsresolve: !!data._needsresolve || !!state_data._needsresolve});
                }
            }
        }

        if (node_type.nodes) {

            const inid = `${node.id}/${node_type.in ?? 'in'}`;
            let hit = false;
            if (!node_map.has(`${node.id}/${node_type.out ?? 'out'}`)) {
                for (let i = 0; i < node_type.edges.length; i++) {
                    const new_edge = Object.assign({}, node_type.edges[i]);
                    new_edge.from = `${node.id}/${new_edge.from}`;
                    new_edge.to = `${node.id}/${new_edge.to}`;
                    graph.edges.push(new_edge);
                    in_edge_map.set(new_edge.to, (in_edge_map.get(new_edge.to) ?? []).concat([new_edge]))
                }

                for (const child of node_type.nodes) {
                    const new_node = Object.assign({}, child);
                    new_node.id = `${node.id}/${child.id}`;
                    graph.nodes.push(new_node)
                    node_map.set(new_node.id, new_node);
                    const has_inputs = in_edge_map.has(new_node.id);
                    if (new_node.id === `${node.id}/${node_type.in ?? 'in'}`) {
                        graph.edges = graph.edges.map(e => ({ ...e, to: e.to === node.id ? `${node.id}/${node_type.in ?? 'in'}` : e.to }));
                        in_edge_map.set(new_node.id, graph.edges.filter(e => e.to === `${node.id}/${node_type.in ?? 'in'}`))
                    } else if (!has_inputs
                        && (
                            new_node.type === "arg"
                        )) {
                        const new_edge = { from: `${node.id}/${node_type.in ?? 'in'}`, to: new_node.id };
                        in_edge_map.set(new_node.id, [new_edge])
                        graph.edges.push(new_edge);
                    } else if (!has_inputs) {
                        in_edge_map.set(new_node.id, []);
                        new_node.inputs = [];
                    }
                }
            }

            if (node_map.has(`${node.id}/${node_type.in ?? 'in'}`)) {
                node_map.get(`${node.id}/${node_type.in ?? 'in'}`).value =
                    typeof graph_input_value === 'object' && !Array.isArray(graph_input_value) ? Object.assign({}, graph_input_value, data) : data;
            }

            if (usecache && cache.get(cache_id).has(inid)) {
                const val = cache.get(cache_id).get(inid);
                hit = compare(val[1], data);
                hit = hit && compare(val[2], graph_input_value);
                if (hit) {
                    return val[0];
                }
            }

            const res = run_with_val(`${node.id}/${node_type.out ?? 'out'}`)(graph_input_value)
            cache.get(cache_id).set(inid, [res, data, graph_input_value]);
            return res;
        } else if (node_type.script) {
            const args = new Map([['lib', lib],
            ['node', node],
            node_type.script.includes('node_inputs') && ['node_inputs', data]
            ].filter(v => v))
            inputs.forEach(input => {
                if (input.as && !keywords.has(input.as) && args.has(input.as)) {
                    args.set(input.as, data[input.as]);
                }
            });

            if (node_type.args) {
                node_type.args.forEach(arg => {
                    if (!keywords.has(arg) && arg !== 'node_inputs') {
                        // while (data[arg]?._Proxy) {
                        //     data[arg] = data[arg]._value;
                        // }
                        args.set(arg, data[arg]);
                    }
                })
            }

            if (usecache && cache.get(cache_id).has(node.id)) {
                const val = cache.get(cache_id).get(node.id);
                let hit = usecache && compare(data, val[1]);
                hit = hit && compare(graph_input_value, val[2]);
                if (hit) {
                    // console.log(input_results);
                    // console.log("hit");
                    return val[0]
                }
            }


            try {
                const passed_inputs = (inputs ?? []).map(i => i.as).filter(i => i && !args.has(i));
                const fn = node_type.fn ?? new Function(`return function _${(node.name ?? node.id).replace(/(\s|\/)/g, '_')}(${[...args.keys()].concat(passed_inputs).join(',')}){${node_type.script}}`)();

                if(typeof fn !== 'function') {
                    debugger;
                }

                if(!node_type.fn) {
                    node_cache.set(hashcode(node.id + node_type.script.substring(node_type.script.length * 0.5 - 16, node_type.script.length * 0.5 + 16)), node_type);
                }

                node_type.fn = fn;

                const results = fn.apply(null, [...args.values()].concat(passed_inputs.map(i => data[i])));

                // Array.isArray(results) ? results.forEach(res => state_datas.push(res)) : state_datas.push(results);
                // state.set(node.id, results);
                // don't cache things without arguments
                if (node_type.args?.length > 0) {
                    cache.get(cache_id).set(node.id, [results, data, graph_input_value]);
                }


                return results;
                // active_nodes.delete(node.id);
            } catch (e) {
                console.log(`error in node`);
                console.error(e);
                console.dir(node_type);
                console.log(state);
                throw new AggregateError([Error(`Error in node ${node_type.name ?? node_type.id}`)].concat(e instanceof AggregateError ? e.errors : [e]));
            }
        }

        return data;
    }

    return run_with_val;
}

const test_graph = {
    "in": "/in",
    "out": "/out",
    "nodes": [
        {
            "id": "/out",
            "args": ["value"],
            "script": "return value;"
        },
        { "id": "/in" }
    ],
    "edges": [
        { "from": "/in", "to": "/out" }
    ]
}

//////////
// TODO: convert these to nodes

const calculateLevels = (graph, selected, fixed_vertices) => {
    const find_childest = n => {
        const e = graph.edges.find(e => e.from === n);
        if (e) {
            return find_childest(e.to);
        } else {
            return n;
        }
    }
    selected = selected[0];
    const top = find_childest(selected);

    const levels = new Map();
    bfs(graph, levels)(top, 0);

    const parents = new Map(graph.nodes.map(n => [n.id, graph.edges.filter(e => e.to === n.id).map(e => e.from)]));
    const children = new Map(graph.nodes.map(n => [n.id, graph.edges.filter(e => e.from === n.id).map(e => e.to)]));
    const siblings = new Map(graph.nodes.map(n => [n.id, [...(new Set(/*parents.get(n.id)?.flatMap(p => children.get(p)?.filter(c => c !== n.id) ?? []).concat(*/children.get(n.id)?.flatMap(c => parents.get(c) ?? []) ?? [])).values()/*)*/]]))
    const distance_from_selected = new Map();

    const connected_vertices = new Map(); //new Map(!fixed_vertices ? [] : fixed_vertices.nodes.flatMap(v => (v.nodes ?? []).map(n => [n, v.nodes])));

    const calculate_selected_graph = (s, i, c) => {
        const id = c || children.get(s)?.length > 0 ? (s + "_" + (c ?? children.get(s)[0])) : s;
        if (distance_from_selected.get(id) <= i) {
            return;
        }

        distance_from_selected.set(id, i);
        parents.get(s)?.forEach(p => { calculate_selected_graph(p, i + 1, s); });
        children.get(s)?.forEach(c => { calculate_selected_graph(c, i + 1); });
    }

    calculate_selected_graph(selected, 0);

    return {
        level_by_node: levels,
        parents,
        children,
        siblings,
        distance_from_selected,
        min: Math.min(...levels.values()),
        max: Math.max(...levels.values()),
        nodes_by_level: [...levels.entries()].reduce((acc, [n, l]) => (acc[l] ? acc[l].push(n) : acc[l] = [n], acc), {}),
        connected_vertices
    }
}

const bfs = (graph, visited) => (id, level) => {
    if (visited.has(id) && visited.get(id) >= level) {
        return;
    }

    visited.set(id, level);

    const next = bfs(graph, visited);

    for (const e of graph.edges) {
        if (e.to === id) {
            next(e.from, level + 1);
        }
    }
}

let simulation;

const d3simulation = () => {
    if (!simulation) {
        simulation =
            lib.d3.forceSimulation()
                .force('charge', lib.d3.forceManyBody().strength(-64).distanceMax(256).distanceMin(128))
                .force('collide', lib.d3.forceCollide(64))
                .force('links', lib.d3
                    .forceLink([])
                    .distance(128)
                    .strength(l => l.strength)
                    .id(n => n.node_child_id))
                .force('link_direction', lib.d3.forceY().strength(.05))
                .force('center', lib.d3.forceCenter())
                // .force('fuse_links', lib.d3.forceLink([]).distance(128).strength(.1).id(n => n.node_child_id))
                // .force('link_siblings', lib.d3.forceX().strength(1))
                // .force('selected', lib.d3.forceRadial(0, window.innerWidth * 0.5, window.innerHeight * 0.5).strength(2))
                // .velocityDecay(0.6)
                .alphaMin(.125);
    }

    return simulation;
}

const updateSimulationNodes = (data) => {
    const selected = data.selected[0];
    const levels = data.levels ?? calculateLevels(data.display_graph, data.display_graph.out);
    const selected_level = levels.level_by_node.get(selected);

    if (typeof (data.links?.[0]?.source) === "string") {
        if (
            data.simulation.nodes()?.length !== data.nodes.length ||
            data.simulation.force('links')?.links().length !== data.links.length) {
            data.simulation.alpha(0.4);
        }

        data.simulation.nodes(data.nodes);
        data.simulation.force('links').links(data.links);
        // data.simulation.force('fuse_links').links(data.fuse_links);
        // console.log(data.simulation);
    }

    const sibling_x = new Map();
    const selected_x = ((levels.nodes_by_level[selected_level].findIndex(l => l === selected) + 1)
        / (levels.nodes_by_level[selected_level].length + 1));


    // data.nodes.forEach(n => {
    //     sibling_x.set(n.node_id, 
    //         (data.show_all ? 0.5 
    //             :levels.level_by_node.has(n.node_id)
    //         ?  (((levels.nodes_by_level[levels.level_by_node.get(n.node_id)].findIndex(l => l === n.node_id) + 1) 
    //             / (levels.nodes_by_level[levels.level_by_node.get(n.node_id)].length + 1)) - selected_x) 
    //             / (Math.min(3, levels.distance_from_selected.get(n.node_id)) * 0.25 + 1) + 0.5
    //         : .75)
    //             * window.innerWidth
    //     );
    // })

    // data.simulation.force('link_siblings').x((n) => sibling_x.get(n.node_id));

    // data.simulation.force('charge')
    //     // .strength(n => data.show_all ? -128 : levels.distance_from_selected.has(n.node_id) ? -64 : -8)
    //     .strength(n => -128);

    // data.simulation.force('link_direction')
    //     .y((n) => window.innerHeight * (
    //         data.show_all ? 0.5 
    //         : selected === n.node_id
    //         ? 0.5 
    //         : levels.level_by_node.has(n.node_id) && selected_level !== undefined
    //         ?  .5 + (selected_level === levels.level_by_node.get(n.node_id) 
    //             ? 0 
    //             : 0.25 * ((1 - Math.pow(0.5, Math.abs(selected_level - levels.level_by_node.get(n.node_id))))/(1 - 0.5)) // sum geometric series
    //             ) * Math.sign(selected_level - levels.level_by_node.get(n.node_id))
    //         : .9
    //     ));
    data.simulation.force('link_direction')
        .y(n =>
            (((levels.parents.get(n.node_id)?.length > 0 ? 1 : 0)
                + (levels.children.get(n.node_id)?.length > 0 ? -1 : 0)
                + (levels.children.get(n.node_id)?.length > 0 && n.node_child_id !== n.node_id + "_" + levels.children.get(n.node_id)[0] ? -1 : 0))
                * 8 + .5) * window.innerHeight)
        .strength(n => (!!levels.parents.get(n.node_id)?.length === !levels.children.get(n.node_id)?.length)
            || levels.children.get(n.node_id)?.length > 0 && n.node_child_id !== n.node_id + "_" + levels.children.get(n.node_id)[0] ? .025 : 0);


    data.simulation.force('collide').radius(64);
    // data.simulation.force('center').strength(n => (levels.parents.get(n.node_id)?.length ?? 0) * 0.25 + (levels.children.get(n.node_id)?.length ?? 0) * 0.25)

    // console.log(data.links)

}

const graphToSimulationNodes = (data) => {
    const simulation_node_data = new Map();
    data.nodes.forEach(n => {
        simulation_node_data.set(n.node_child_id, n)
    });

    const main_node_map = new Map();

    const fuse_links = [];

    const nodes = data.display_graph.nodes.flatMap(n => {
        const children = data.levels.children.get(n.id);
        main_node_map.set(n.id, children.length > 0 ? n.id + "_" + children[0] : n.id);

        return children.length === 0 ? [{
            node_id: n.id,
            node_child_id: n.id,
            type: n.type,
            nodes: n.nodes,
            edges: n.edges,
            script: n.script,
            value: n.value,
            name: n.name,
            in: n.in,
            out: n.out,
            level: data.levels.level_by_node.get(n.id),
            selected_distance: data.levels.distance_from_selected.get(n.id),
            x: Math.floor(simulation_node_data.get(n.id)?.x ?? data.x ?? Math.floor(window.innerWidth * (Math.random() * .5 + .25))),
            y: Math.floor(simulation_node_data.get(n.id)?.y ?? data.y ?? Math.floor(window.innerHeight * (Math.random() * .5 + .25)))
        }] : children.map(c => ({
            node_id: n.id,
            node_child_id: n.id + "_" + c,
            type: n.type,
            nodes: n.nodes,
            edges: n.edges,
            script: n.script,
            value: n.value,
            name: n.name,
            in: n.in,
            out: n.out,
            level: data.levels.level_by_node.get(n.id),
            selected_distance: data.levels.distance_from_selected.get(n.id + "_" + c),
            x: Math.floor(simulation_node_data.get(n.id + "_" + c)?.x ?? data.x ?? Math.floor(window.innerWidth * (Math.random() * .5 + .25))),
            y: Math.floor(simulation_node_data.get(n.id + "_" + c)?.y ?? data.y ?? Math.floor(window.innerHeight * (Math.random() * .5 + .25)))
        }));
    })

    const links = data.display_graph.edges
        .filter(e => e.to !== "log" && e.to !== "debug")
        .map(e => {
            if (!(main_node_map.has(e.from) && main_node_map.has(e.to))) {
                throw new Error(`edge node undefined ${main_node_map.has(e.from) ? '' : '>'}${e.from} ${main_node_map.has(e.to) ? '' : '>'}${e.to} `);
            }
            return {
                source: e.from + "_" + e.to,
                target: main_node_map.get(e.to),
                as: e.as,
                type: e.type,
                strength: 4,
                selected_distance: data.levels.distance_from_selected.get(main_node_map.get(e.to)) !== undefined ? Math.min(data.levels.distance_from_selected.get(main_node_map.get(e.to)), data.levels.distance_from_selected.get(e.from + "_" + e.to)) : undefined,
                sibling_index_normalized: (data.levels.siblings.get(e.from).findIndex(n => n === e.from) + 1) / (data.levels.siblings.get(e.from).length + 1),
            }
        });

    return {
        nodes,
        links,
        fuse_links
    }
}

const d3subscription = simulation => dispatch => {
    const abort_signal = { stop: false };
    simulation.stop();
    const tick = () => {
        if (simulation.alpha() > simulation.alphaMin()) {
            simulation.tick();
            dispatch(s => ({
                ...s,
                nodes: simulation.nodes().map(n => ({ ...n, x: Math.floor(n.x), y: Math.floor(n.y) })),
                links: simulation.force('links').links().map(l => ({
                    ...l,
                    as: l.as,
                    type: l.type,
                    source: ({
                        node_child_id: l.source.node_child_id,
                        node_id: l.source.node_id,
                        x: Math.floor(l.source.x),
                        y: Math.floor(l.source.y)
                    }),
                    target: ({
                        node_child_id: l.target.node_child_id,
                        node_id: l.target.node_id,
                        x: Math.floor(l.target.x),
                        y: Math.floor(l.target.y)
                    })
                })),
                fuse_links: [] /*simulation.force('fuse_links').links().map(l => ({
                    ...l,
                    source: ({
                        node_id: l.source.node_id, 
                        x: Math.floor(l.source.x), 
                        y: Math.floor(l.source.y)
                    }), 
                    target: ({
                        node_id: l.target.node_id, 
                        x: Math.floor(l.target.x), 
                        y: Math.floor(l.target.y)
                    })
                }))*/
            }));
        }

        if (!abort_signal.stop) {
            requestAnimationFrame(tick);
        }
    };

    requestAnimationFrame(tick);

    return () => { abort_signal.stop = true; }
}

const keydownSubscription = (dispatch, options) => {
    const handler = ev => {
        if (ev.key === "s" && ev.ctrlKey) {
            ev.preventDefault();
        } else if (!ev.key) {
            return;
        }

        requestAnimationFrame(() => dispatch((state, payload) => options.action(state, payload), { key: ev.key.toLowerCase(), code: ev.code, ctrlKey: ev.ctrlKey, shiftKey: ev.shiftKey, metaKey: ev.metaKey, target: ev.target }))
    };
    addEventListener('keydown', handler);
    return () => removeEventListener('keydown', handler);
}

const expand_node = (data) => {
    const node_id = data.node_id;
    const node = data.display_graph.nodes.find(n => n.id === node_id)

    if (!(node && node.nodes)) {
        console.log('no nodes?');
        return { display_graph: data.display_graph, selected: [data.node_id] };
    }

    const flattened = lib.scripts.flattenNode(node, 1);

    const new_display_graph = {
        nodes: data.display_graph.nodes
            .filter(n => n.id !== node_id)
            .concat(flattened.flat_nodes),
        edges: data.display_graph.edges
            .map(e => ({
                ...e,
                from: e.from === node_id ? node.id + "/" + (node.out ?? 'out') : e.from,
                to: e.to === node_id ? node.id + "/" + (node.in ?? 'in') : e.to
            }))
            .concat(flattened.flat_edges)
    };

    return { display_graph: { ...display_graph, ...new_display_graph }, selected: [node_id + '/' + (node.out ?? 'out')] };
}

const contract_all = (graph) => {
    const node_ids = new Set(graph.nodes.map(n => n.id));
    let display_graph = graph;
    graph.nodes.forEach(g => {
        if (g.id.endsWith("/out") && !node_ids.has(g.id.substring(0, g.id.length - 4))) {
            display_graph = contract_node({ node_id: g.id, display_graph }, true);
        }
    })

    return display_graph;
}

const contract_node = (data, keep_expanded = false) => {
    const node = data.display_graph.nodes.find(n => n.id === data.node_id);
    if (!node.nodes) {
        const slash_index = data.node_id.lastIndexOf('/');
        const node_id = slash_index >= 0 ? data.node_id.substring(0, slash_index) : data.node_id;
        const name = data.name[0] ?? node_id;

        const inside_nodes = [Object.assign({}, node)];
        const inside_node_map = new Map();
        const dangling = new Set();
        inside_node_map.set(inside_nodes[0].id, inside_nodes[0]);
        const inside_edges = new Set();

        const q = data.display_graph.edges.filter(e => e.to === inside_nodes[0].id);

        let in_edge = [];

        while (q.length > 0) {
            const e = q.shift();
            dangling.delete(e.from);

            let this_dangling = 0;

            if (e.from !== data.node_id) {
                data.display_graph.edges.filter(ie => ie.from === e.from).forEach(ie => {
                    if (!inside_node_map.has(ie.to)) {
                        this_dangling += 1;
                        dangling.add(ie.to)
                    }
                });
            }

            if (this_dangling === 0) {


                in_edge.filter(ie => ie.from === e.from).forEach(ie => {
                    inside_edges.add(ie)
                });
                in_edge = in_edge.filter(ie => ie.from !== e.from);

                const old_node = inside_nodes.find(i => e.from === i.id);
                let inside_node = old_node ?? data.display_graph.nodes.find(p => p.id === e.from);

                if ((inside_node.name ?? inside_node.id)?.endsWith('/in') && !(inside_node.name ?? inside_node.id).endsWith(name + '/in')) {
                    in_edge.push(e);
                    continue;
                }

                inside_node_map.set(inside_node.id, inside_node);
                inside_edges.add(e);
                if (!old_node) {
                    inside_nodes.push(inside_node);
                }

                if (!inside_node.name?.endsWith(name + '/in')) {
                    data.display_graph.edges.filter(de => de.to === e.from).forEach(de => {
                        q.push(de);
                    });
                }

            } else {
                in_edge.push(e);
            }
        }

        let in_node_id = in_edge[0]?.to;

        if (in_edge.find(ie => ie.to !== in_node_id) || inside_nodes.length < 2) {
            return { display_graph: data.display_graph, selected: [data.node_id] };
        }

        const out_node = inside_nodes.find(n => n.id === data.node_id || n.name === name + "/out" || n.id === node_id + "/out");
        const out_node_id = out_node.id;

        const in_node = inside_node_map.get(in_node_id);

        // have to create a dummy in node if the in node does something
        if (in_node_id && !in_node_id.endsWith('in')) {
            in_node_id = node_id + "/in";
            inside_nodes.push({ id: in_node_id });
            inside_edges.add({ from: in_node_id, to: in_node.id });
        }

        if (!in_node_id) {
            in_node_id = inside_nodes.find(n => n.id === node_id + "/in" || n.name === name + "/in")?.id;
        }

        const edges = [];
        for (const e of inside_edges) {
            edges.push({
                ...e,
                from: e.from.startsWith(node_id + "/")
                    ? e.from.substring(node_id.length + 1)
                    : e.from,
                to: e.to.startsWith(node_id + "/")
                    ? e.to.substring(node_id.length + 1)
                    : e.to
            })
        }


        const new_display_graph = {
            nodes: data.display_graph.nodes
                .filter(n => n.id !== data.node_id)
                .filter(n => keep_expanded || !inside_node_map.has(n.id))
                .concat([{
                    id: node_id,
                    name,
                    in: in_node_id?.startsWith(node_id + '/') ? in_node_id.substring(node_id.length + 1) : in_node_id,
                    out: out_node_id.startsWith(node_id + '/') ? out_node_id.substring(node_id.length + 1) : out_node_id,
                    nodes: inside_nodes.map(n => ({
                        ...n,
                        id: n.id.startsWith(node_id + "/") ? n.id.substring(node_id.length + 1) : n.id
                    })),
                    edges
                }]),
            edges: data.display_graph.edges
                .filter(e => keep_expanded || !(inside_node_map.has(e.from) && inside_node_map.has(e.to)))
                .map(e =>
                    e.from === data.node_id ? { ...e, from: node_id }
                        : e.to === in_node?.id ? { ...e, to: node_id }
                            : inside_node_map.has(e.to)
                                ? { ...e, to: node_id }
                                : e
                )
        };

        return { display_graph: { ...display_graph, ...new_display_graph }, selected: [node_id] };
    }
}

const flattenNode = (graph, levels = -1) => {
    if (graph.nodes === undefined || levels === 0) {
        return graph;
    }

    // needs to not prefix base node because then flatten node can't run  next
    const prefix = graph.id ? `${graph.id}/` : '';

    return graph.nodes
        .map(n => Object.assign({}, n, { id: `${prefix}${n.id}` }))
        .map(g => flattenNode(g, levels - 1))
        .reduce((acc, n) => Object.assign({}, acc, {
            flat_nodes: acc.flat_nodes.concat(n.flat_nodes?.flat() ?? []).map(fn => {
                // adjust for easy graph renaming
                if ((fn.id === prefix + (graph.out ?? "out")) && graph.name) {
                    fn.name = graph.name + "/out";
                } else if (graph.in && (fn.id === prefix + (graph.in ?? "/in")) && graph.name) {
                    fn.name = graph.name + "/in"
                }
                return fn
            }),
            flat_edges: acc.flat_edges.map(e => n.flat_nodes ?
                e.to === n.id ?
                    Object.assign({}, e, { to: `${e.to}/${n.in ?? 'in'}` }) :
                    e.from === n.id ?
                        Object.assign({}, e, { from: `${e.from}/${n.out ?? 'out'}` }) :
                        e :
                e).flat().concat(n.flat_edges).filter(e => e !== undefined)
        }), Object.assign({}, graph, {
            flat_nodes: graph.nodes
                .map(n => Object.assign({}, n, { id: `${prefix}${n.id}` })),
            flat_edges: graph.edges
                .map(e => ({ ...e, from: `${prefix}${e.from}`, to: `${prefix}${e.to}` }))
        }));
}


/////////////////////////////////

const cache = new Map();
const node_cache = new Map();

const lib = {
    just: { get, set, diff, diffApply },
    ha: { h, app, text, memo },
    no: {
        executeGraph: ({ state, graph, cache_id }) => executeGraph({ cache, state, graph, node_cache, cache_id: cache_id ?? "temp" })(graph.out)(state.get(graph.in)),
        executeGraphValue: ({ graph, cache_id }) => executeGraph({ cache, graph, node_cache, cache_id: cache_id ?? "temp" })(graph.out),
        executeGraphNode: ({ graph, cache_id }) => executeGraph({ cache, graph, node_cache, cache_id: cache_id ?? "temp" })
    },
    scripts: { d3simulation, d3subscription, updateSimulationNodes, graphToSimulationNodes, expand_node, flattenNode, contract_node, keydownSubscription, calculateLevels, contract_all },
    d3: { forceSimulation, forceManyBody, forceCenter, forceLink, forceRadial, forceY, forceCollide, forceX },
    Fuse,
    // THREE
};

const generic_nodes = new Set([
    "switch",
    "filter",
    "delete",
    "default",
    "trigger",
    "execute_graph",
    "get",
    "set",
    "default_node_display",
    "h",
    "h_text",
    "default_error_display",
    "graph_display",
    "number_display",
    "update_and_run",
    "selected_node",
    "array",
    "text",
    "text_display",
    "arg",
    "log"
]);

const stored = localStorage.getItem("display_graph");
// const display_graph = {...DEFAULT_GRAPH, nodes: DEFAULT_GRAPH.nodes.map(n => ({...n})), edges: DEFAULT_GRAPH.edges.map(e => ({...e}))};
const display_graph = stored ? JSON.parse(stored) : test_graph;
const original_graph = {...DEFAULT_GRAPH, nodes: [...DEFAULT_GRAPH.nodes], edges: [...DEFAULT_GRAPH.edges]};
const state = new Map([['in', { graph: DEFAULT_GRAPH, original_graph, display_graph: { ...display_graph, nodes: display_graph.nodes.concat(DEFAULT_GRAPH.nodes.filter(n => generic_nodes.has(n.id) && display_graph.nodes.findIndex(dn => dn.id === n.id) === -1)), edges: display_graph.edges.concat([]) } }]])


console.log(executeGraph({ cache, state, graph: DEFAULT_GRAPH, original_graph, out: "hyperapp_app", cache_id: "main", node_cache })(DEFAULT_GRAPH.out)(state.get("in")));