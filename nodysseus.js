import DEFAULT_GRAPH from "./pull.json"
import _ from "lodash";
import { h, app, text, memo } from "hyperapp"
import { forceSimulation, forceManyBody, forceCenter, forceLink, forceRadial, forceX, forceY, forceCollide } from "d3-force";
import { selectSyntaxLeft } from "@codemirror/commands";
import * as THREE from 'three';
import Fuse from "fuse.js";

const executeGraph = ({state, graph, out}) => {
    let state_hash = "";
    let active_nodes_hash = "";

    let state_length = 0;
    let active_nodes_length = 0;

    const active_nodes = new Map([[ "out", Object.assign({}, graph.nodes.find(n => n.id === out), {
        inputs: graph.edges.filter(e => e.to === out),
        _nodeflag: true
    })]]);


    const node_map = graph.node_map ?? new Map(graph.nodes.map(n => [n.id, n]));
    graph.node_map = node_map;

    while(!state.has(out)) {

        if(state_length === state.size && active_nodes_length === active_nodes.size) {
            throw new Error("stuck");
        }

        state_length = state.size;
        active_nodes_length = active_nodes.size;


        let input;
        let node;

        for(node of active_nodes.values()) {
            let run = true;
            let has_inputs = true;

            let inputs = node.inputs;

            // edge types
            //   ref gets the node id
            //   concat puts all the data as the "as" attribute
            //   inputs defines the expected inputs
            //   data (default)

            for(let i = 0; i < node.inputs.length; i++) {
                input = node.inputs[i];

                if (input.type === "inputs") {
                    has_inputs = state.has(input.from);
                    if(has_inputs) {
                        const def_inputs = state.get(input.from);
                        inputs = node.inputs.filter(node_input => def_inputs.includes(node_input.as));
                    } else {
                        inputs = [input];
                    }
                }
            }

            for(let i = 0; i < inputs.length; i++) {
                input = inputs[i];
                if(input?.type !== "ref" && !state.has(input.from)){
                    if(!active_nodes.has(input.from)) {
                        const input_node = node_map.get(input.from);

                        if(input_node === undefined) {
                            throw new Error(`Can't find input ${input.from} for node ${node.id}`);
                        }

                        active_nodes.set(input.from, Object.assign({}, input_node, {
                            inputs: graph.edges.filter(e => e.to === input.from),
                            _nodeflag: true
                        }));
                    }

                    run = false;
                }
            }


            if(node.type && !state.has(node.type)) {
                if(!active_nodes.has(node.type)) {
                    active_nodes.set(node.type, Object.assign({}, node_map.get(node.type), {
                        inputs: graph.edges.filter(e => e.to === node.type),
                        _nodetypeflag: true,
                        _nodeflag: true
                    }))
                }

                run = false;
            }

            if (run) {
                let datas = [{}];
                if (node.value !== undefined) {
                    state.set(node.id, [node.value].flat());
                    active_nodes.delete(node.id);
                } else {
                    inputs.sort((a, b) =>
                        a.as && !b.as
                        ? 1
                        : !a.as && b.as
                        ? -1
                        : a.order !== undefined && b.order !== undefined
                        ? a.order - b.order 
                        : a.order !== undefined
                        ? a.order
                        : b.order !== undefined
                        ? b.order
                        : a.type === undefined && b.type === undefined
                        ? state.get(a.from).length - state.get(b.from).length // order the ones with less up front
                        : 0
                    );


                    let input;
                    for(let i = 0; i < inputs.length; i++) {
                        input = inputs[i];
                        if(datas.length === 0) {
                            break;
                        } else if(input?.type === "concat") {
                            if(state.get(input.from).length > 0 || datas[0][input.as] === undefined) {
                                datas.forEach(d => Object.assign(d, {[input.as]: state.get(input.from)}))
                            }
                        } else if (input?.type === "ref") {
                            datas.forEach(d => Object.assign(d, {[input.as]: input.from}))
                        } else if (state.get(input.from).length > 1 && datas.length > 1) {
                            state.get(input.from).forEach((d, i) =>{
                                datas[i] = Object.assign(datas.length > i ? datas[i] : {}, input.as ? {[input.as]: d} : d);
                            });
                        } else if (state.get(input.from).length > 0) {
                            const new_datas = []
                            const state_datas = state.get(input.from);
                            for(let i = 0; i < datas.length; i++) {
                                for(let j = 0; j < state_datas.length; j++) {
                                    new_datas.push(input.as 
                                        ? Object.assign({}, datas[i], {[input.as]: state_datas[j]})
                                        : Object.assign({}, datas[i], state_datas[j]));
                                }
                            }

                            datas = new_datas;
                        }
                    }

                    const node_type = node.type 
                        ? Object.assign({}, state.get(node.type)[0], node, {_nodetypeflag: false})
                        : node;

                    if(node._nodetypeflag) {
                        state.set(node.id, node.nodes ? [{nodes: node.nodes, edges: node.edges}] : [{args: node.args, script: node.script, value: node.value}])
                        active_nodes.delete(node.id);
                    } else if (node_type.nodes && node_type.edges){
                        state.set(node.id + "/in", datas);
                        active_nodes.set(node.id, {
                            id: node.id, 
                            args: ["value"],
                            inputs:[{from: `${node.id}/out`, to: node.id, as: 'value'}], 
                            _nodeflag: true, 
                            script: "return value"
                        })

                        if(!node_map.has(`${node.id}/out`)) {
                            for(const child of node_type.nodes){
                                const new_node = Object.assign({}, child);
                                new_node.id = `${node.id}/${child.id}`;
                                graph.nodes.push(new_node)
                                node_map.set(new_node.id, new_node);
                            }

                            for(let i = 0; i < node_type.edges.length; i++){
                                const new_edge = Object.assign({}, node_type.edges[i]);
                                new_edge.from =  `${node.id}/${new_edge.from}`;
                                new_edge.to =  `${node.id}/${new_edge.to}`;
                                graph.edges.push(new_edge);
                            }
                        }
                    } else if(node_type.script) {
                        const fn = new Function(
                            'lib', 
                            'node', 
                            ...node_type.args, 
                            node_type.script
                            );
                        const state_datas = []
                        const args = [lib, node];
                        let fn_args = [];
                        for(let i = 0; i < datas.length; i++) {
                            fn_args = args.slice();
                            node_type.args.forEach(arg => {
                                fn_args.push(datas[i][arg]);
                            });

                            const results = fn.apply(null, fn_args);
                            Array.isArray(results) ? results.forEach(res => state_datas.push(res)) : state_datas.push(results);
                        }
                        state.set(node.id, state_datas);
                        active_nodes.delete(node.id);
                    } else {
                        state.set(node.id, datas);
                        active_nodes.delete(node.id);
                    }
                }
            }
        }
    }

    return state.get(out);
};

const test_graph = {"nodes":[{"id":"out","args":["value"]},{"id":"get_inputs","value":["target","path"]},{"id":"get_script","value":"return target[path]"},{"id":"lvfabiz9b","name":"css","args":["el","styles"],"script":"console.log(el); el.innerHTML = styles;"},{"id":"2jiztgmvr","name":"css_el","args":["get_el","create_el"],"type":"switch"},{"id":"vpq73g9qg","name":"get_el","script":"return document.querySelector('.css-styles')","args":[]},{"id":"zruw6k6l9","name":"el classname","args":["el"],"script":"el.className = \"css-styles\"; document.body.appendChild(el); return el;"},{"id":"x8tdpkazf","name":"css el inputs","script":"return document.querySelector(\".css-styles\") ? [\"get_el\"] : [\"create_el\"];","args":[]},{"id":"dfbmreaek","name":"create el","script":"return document.createElement(\"style\");","args":[]},{"id":"bacr589n7","name":"styles","script":"return rules.join(\"\\n\");","args":["rules"]},{"id":"filter","nodes":[{"id":"in"},{"id":"out","args":["keep","data"],"script":"return keep ? [data] : []"}],"edges":[{"from":"in","to":"out","order":1},{"from":"in","to":"out","as":"data","order":0}]},{"id":"delete","nodes":[{"id":"in"},{"id":"out","args":["data","path"],"script":"const new_data = Object.assign({}, data); delete new_data[path]; return new_data;"}],"edges":[{"from":"in","to":"out","order":1},{"from":"in","to":"out","as":"data","order":0}]},{"id":"default","nodes":[{"id":"in"},{"id":"out","args":["data","default_value"],"script":"return data.length > 0 ? data : default_value"}],"edges":[{"from":"in","to":"out"}]},{"id":"switch","nodes":[{"id":"in"},{"id":"out","args":["data","input"],"script":"return data[Object.getOwnPropertyNames(data)[0]];"}],"edges":[{"from":"in","to":"out","as":"data"}]},{"id":"trigger","nodes":[{"id":"in"},{"id":"trigger","args":["trigger"],"script":"return trigger ? ['in'] : []"},{"id":"out","args":["data"],"script":"return data?.data ?? []"}],"edges":[{"from":"in","to":"out","as":"data"},{"from":"in","to":"trigger"},{"from":"trigger","to":"out","type":"inputs"}]},{"id":"execute_graph","nodes":[{"id":"in","value":null},{"id":"out","args":["in_node","out_node","graph"],"script":"return (...args) => (lib.no.executeGraph({state: new Map([[in_node, args]]), graph, out: out_node }))"}],"edges":[{"from":"in","to":"out"}]},{"id":"get","nodes":[{"id":"in","value":null},{"id":"fill_default","args":["input"],"script":"return input.default ?? null"},{"id":"out","args":["target","path","def"],"script":"return [lib._.get(target, path) ?? def]"}],"edges":[{"from":"in","to":"out"},{"from":"in","to":"fill_default","as":"input"},{"from":"fill_default","to":"out","as":"def"}]},{"id":"1a2qt246c","name":"css obj"},{"id":"ie18qgd52","name":"entries","script":"return Object.entries(input)","args":["input"]},{"id":"2ll8r3sx5","name":"init","args":["entry"],"script":"return entry[0] + \"{\""},{"id":"mec78sn2n","name":"compile","args":["init","attrs","end"],"script":"return [init].concat(attrs).concat([end])"},{"id":"mrs40dwx8","name":"end","value":"}"},{"id":"h28e9j2fo","name":"attrs","args":["entry"],"script":"return [Object.entries(entry[1]).map(([k, v]) => `${k}: ${v};`)];"},{"id":"vr865hcv0","name":"body"},{"id":"kvq1q0k30","name":"light grey","value":"#fff"},{"id":"qpao2izqz","name":"circle"},{"id":"u7sy8fwro","name":"black","value":"black"},{"id":"56j09nio2","name":"stroke width","value":1},{"id":"1t96plqko","name":"text"},{"id":"p5b9np03o","name":"font family","value":"consolas"}],"edges":[{"from":"lvfabiz9b","to":"out"},{"from":"2jiztgmvr","to":"lvfabiz9b","as":"el"},{"from":"vpq73g9qg","to":"2jiztgmvr","as":"get_el"},{"from":"zruw6k6l9","to":"2jiztgmvr","as":"create_el"},{"from":"x8tdpkazf","to":"2jiztgmvr","type":"inputs"},{"from":"dfbmreaek","to":"zruw6k6l9","as":"el"},{"from":"bacr589n7","to":"lvfabiz9b","as":"styles"},{"from":"1a2qt246c","to":"ie18qgd52","as":"input"},{"from":"ie18qgd52","to":"2ll8r3sx5","as":"entry"},{"from":"2ll8r3sx5","to":"mec78sn2n","as":"init","name":"end"},{"from":"mrs40dwx8","to":"mec78sn2n","as":"end"},{"from":"mec78sn2n","to":"bacr589n7","type":"concat","as":"rules"},{"from":"h28e9j2fo","to":"mec78sn2n","as":"attrs"},{"from":"ie18qgd52","to":"h28e9j2fo","as":"entry"},{"from":"vr865hcv0","to":"1a2qt246c","as":"body","name":"light-grey","value":"#ccc"},{"from":"kvq1q0k30","to":"vr865hcv0","as":"background-color"},{"from":"qpao2izqz","to":"1a2qt246c","as":"circle"},{"from":"u7sy8fwro","to":"qpao2izqz","as":"stroke"},{"from":"56j09nio2","to":"qpao2izqz","as":"stroke-width"},{"from":"1t96plqko","to":"1a2qt246c","as":"text"},{"from":"p5b9np03o","to":"1t96plqko","as":"font-family"}]}

//////////
// TODO: convert these to nodes

const calculateLevels = (graph, out) => {
    const visited = new Set();

    const levels = new Map(bfs(graph, visited)(out, 0));

    return {
        level_by_node: levels,
        min: Math.min(...levels.values()),
        max: Math.max(...levels.values()),
        nodes_by_level: [...levels.entries()].reduce((acc, [n, l]) => (acc[l] ? acc[l].push(n) : acc[l] = [n], acc), {})
    }
}

const bfs = (graph, visited) => (id, level) => {
    const output = [[id, level]];
    visited.add(id);

    const next = bfs(graph, visited);

    for(const e of graph.edges) {
        if(e.to === id && !visited.has(e.from)) {
            const next_results = next(e.from, level + 1);
            for(const next_result of next_results) {
                output.push(next_result);
            }
        } else if(e.from === id && !visited.has(e.to)) {
            const next_results = next(e.to, level - 1);
            for(const next_result of next_results) {
                output.push(next_result);
            }
        }
    }

    return output;
}

const d3simulation = () => {
    const simulation =
        lib.d3.forceSimulation()
        .force('charge', lib.d3.forceManyBody().strength(-8).distanceMax(256))
        .force('collide', lib.d3.forceCollide(32))
        .force('links', lib.d3
            .forceLink([])
            .distance(64)
            .strength(0.1)
            .id(n => n.node_id))
        .force('link_direction', lib.d3.forceY().strength(1))
        .force('link_siblings', lib.d3.forceX().strength(1))
        .force('selected', lib.d3.forceRadial(0, window.innerWidth * 0.5, window.innerHeight * 0.5).strength(2))
        .velocityDecay(0.7)
        .alphaMin(.2);

    return { simulation };
}

const updateSimulationNodes = (data) => {
    const levels = data.levels ?? calculateLevels(data.display_graph, data.display_graph_out);

    if(typeof(data.links?.[0]?.source) === "string") {
        data.simulation.nodes(data.nodes);
        data.simulation.force('links').links(data.links);
    }

    const parents = new Map(data.nodes.map(n => [n.node_id, data.display_graph.edges.filter(e => e.to === n.node_id).map(e => e.from)]));
    const children = new Map(data.nodes.map(n => [n.node_id, data.display_graph.edges.filter(e => e.from === n.node_id).map(e => e.to)]));
    const siblings = new Map(data.nodes.map(n => [n.node_id, [...(new Set(parents.get(n.node_id)?.flatMap(p => children.get(p).filter(c => c !== n.node_id) ?? []).concat(children.get(n.node_id).flatMap(c => parents.get(c) ?? []))).values())]]))
    const selected = data.selected[0];
    const selected_level = levels.level_by_node.get(selected);
    const selected_branch = new Set([selected]);
    const calculate_parent_branch = (s) => parents.get(s)?.forEach(p => { selected_branch.add(p), calculate_parent_branch(p) });
    calculate_parent_branch(selected);
    const calculate_child_branch = (s) => children.get(s)?.forEach(c => { selected_branch.add(c), calculate_child_branch(c) });
    calculate_child_branch(selected);

    // data.simulation.force('link_siblings')
    //     .x((n) => (parents.has(n.node_id) && parents.get(n.node_id).x ? parents.get(n.node_id).x : window.innerWidth * 0.5) +
    //         (levels.levels.has(n.node_id) && levels.levels.get(n.node_id) !== undefined ?
    //             (256 * levels.nodes_by_level[levels.levels.get(n.node_id)].indexOf(n.node_id) 
    //             - levels.nodes_by_level[levels.levels.get(n.node_id)].length * 256 * 0.5) :
    //             window.innerWidth * 0.25));

    const sibling_x = new Map();
    data.nodes.forEach(n => {
        if(selected_branch.has(n.node_id)) {
            sibling_x.set(n.node_id, window.innerWidth * 0.5
                    + (128 * levels.nodes_by_level[levels.level_by_node.get(n.node_id)].filter(s => selected_branch.has(s)).indexOf(n.node_id) 
                        - levels.nodes_by_level[levels.level_by_node.get(n.node_id)].filter(s => selected_branch.has(s)).length * 128 * 0.5))
        } else if(siblings.has(n.node_id) && siblings.get(n.node_id).find(s => selected_branch.has(s))) {
            sibling_x.set(n.node_id, ((siblings.get(n.node_id).indexOf(n.node_id) - siblings.get(n.node_id).findIndex(s => selected_branch.has(s))) * 0.25 + 0.5) * window.innerWidth)
        } else if(children.get(n.node_id).length === 0) {
            sibling_x.set(n.node_id, window.innerWidth * 0.75);
        }
    }); 


    while(sibling_x.size < data.nodes.length) {
        data.nodes.forEach(n => {
            if(!sibling_x.has(n.node_id) && sibling_x.has(children.get(n.node_id)[0])) {
                console.log(`finding for ${n.name}`)
                sibling_x.set(
                    n.node_id, 
                    sibling_x.get(children.get(n.node_id)[0]) + 
                        (siblings.has(n.node_id) && siblings.get(n.node_id).length > 1
                        ? ((siblings.get(n.node_id).indexOf(n.node_id) - Math.floor(siblings.get(n.node_id).length / 2)) / siblings.get(n.node_id).length) * 512
                        : 0)
                );
            }
        })
    }

    data.simulation.force('link_siblings').x((n) => sibling_x.get(n.node_id));

    data.simulation.force('charge')
        .strength(n => selected_branch.has(n.node_id) ? -1024 : -8)


    data.simulation.force('selected').radius(n => 
        n.node_id === selected
        ? 0 
        : parents.get(n.node_id)?.includes(selected) || children.get(n.node_id)?.includes(selected)
        ? window.innerHeight * 0.125
        : levels.level_by_node.has(n.node_id) 
        ? window.innerHeight * 0.125 * (1 + Math.abs(levels.level_by_node.get(n.node_id) - selected_level))
        : window.innerHeight * 0.4
    ).strength(n => n.node_id === selected ? 10 : 2);

    data.simulation.force('link_direction')
        .y((n) => window.innerHeight * (
            selected === n.node_id
            ? 0.5 
            : levels.level_by_node.has(n.node_id) && selected_level !== undefined
            ? .5 + .125 * (selected_level - levels.level_by_node.get(n.node_id))
            : .9
        ));


    data.simulation.force('collide').radius(n => n.node_id === selected ? 64 : 32);


    data.simulation
        // .force(`parent_${data.node_id}`, lib.d3.forceRadial(0, data.x, data.y).strength(n => n.parent === data.node_id ? 0.2 : 0))
        // .force(`not_parent_${data.node_id}`, lib.d3.forceRadial(512, data.x, data.y).strength(n => n.parent === data.node_id ? 0 : 0.2))
        // .force(`center`, null)
        // .velocityDecay(.2)
        .alpha(0.4);
}

const graphToSimulationNodes = (data) => {
    const simulation_node_data = new Map();
    data.nodes.forEach(n => {
        simulation_node_data.set(n.node_id, n)
    });

    const nodes = data.display_graph.nodes.map(n => {
        const current_data = simulation_node_data.get(n.id);
        return {
            node_id: n.id,
            type: n.type,
            nodes: n.nodes,
            edges: n.edges,
            script: n.script,
            value: n.value,
            name: n.name,
            x: current_data?.x ?? data.x ?? Math.floor(window.innerWidth * (Math.random() * .5 + .25)),
            y: current_data?.y ?? data.y ?? Math.floor(window.innerHeight * (Math.random() * .5 + .25))
        };
    })

    const links = data.display_graph.edges
        .filter(e => e.to !== "log" && e.to !=="debug")
        .map(e => ({source: e.from, target: e.to, as: e.as, type: e.type}));

    return {
        nodes,
        links
    }
}

const d3subscription = simulation => dispatch => { 
    const abort_signal = {stop: false};
    simulation.stop();
    const tick = () => {
        if(simulation.alpha() > simulation.alphaMin()) {
            simulation.tick();
            dispatch(s => ({ 
                ...s, 
                nodes: simulation.nodes().map(n => ({node_id: n.node_id, x: Math.floor(n.x), y: Math.floor(n.y), type: n.type, value: n.value, nodes: n.nodes, edges: n.edges, script: n.script, name: n.name})), 
                links: simulation.force('links').links().map(l => ({
                    as: l.as,
                    type: l.type,
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
                }))  
            }));
        }

        if(!abort_signal.stop) {
            requestAnimationFrame(tick);
        }
    };
    
    requestAnimationFrame(tick);

    return () => { abort_signal.stop = true; }
}

const keydownSubscription = (dispatch, options) => { 
    const handler = ev => { 
        if(ev.key === "s" && ev.ctrlKey) {
            ev.preventDefault();
        }

        requestAnimationFrame(() => dispatch(options.action, {key: ev.key.toLowerCase(), code: ev.code, ctrlKey: ev.ctrlKey, shiftKey: ev.shiftKey, metaKey: ev.metaKey, target: ev.target}))
    };
    addEventListener('keydown', handler); 
    return () => removeEventListener('keydown', handler);
}

const expand_node = (data) => {
    const node_id = data.node_id;
    const node = data.display_graph.nodes.find(n => n.id === node_id)

    if (!(node && node.nodes)) {
        console.log('no nodes?');
        return data.display_graph;
    }

    const flattened = lib.scripts.flattenNode(node, 1);

    const new_display_graph = {
        nodes: data.display_graph.nodes
            .filter(n => n.id !== node_id)
            .concat(flattened.flat_nodes),
        edges: data.display_graph.edges
            .map(e => ({
                ...e,
                from: e.from === node_id ? `${node_id}/out` : e.from,
                to: e.to === node_id ? `${node_id}/in` : e.to
            }))
            .concat(flattened.flat_edges)
    };

    return new_display_graph;
}

const contract_node = (data) => {
    // if(data.node_id.endsWith('in') || data.node_id.endsWith('out')) {
    //     const node_id = data.node_id.endsWith('in') ?
    //         data.node_id.substring(0, data.node_id.length - 3) :
    //         data.node_id.substring(0, data.node_id.length - 4);


    //     const new_display_graph = {
    //         nodes: data.display_graph.nodes
    //             .filter(n => !n.id.startsWith(node_id))
    //             .concat([{
    //                 id: node_id,
    //                 nodes: data.display_graph.nodes
    //                     .filter(n => n.id.startsWith(node_id) && n.id.length > node_id.length + 1)
    //                     .map(n => ({...n, id: n.id.substring(node_id.length + 1)})),
    //                 edges: data.display_graph.edges
    //                     .filter(e => e.from.startsWith(node_id) && e.to.startsWith(node_id))
    //                     .map(e =>({
    //                         as: e.as,
    //                         from: e.from.substring(node_id.length + 1),
    //                         to: e.to.substring(node_id.length + 1),
    //                     }))
    //             }]),
    //         edges: data.display_graph.edges
    //             .map(e => ({
    //                 ...e,
    //                 from: e.from === `${node_id}/out` ? node_id : e.from,
    //                 to: e.to === `${node_id}/in` ? node_id : e.to
    //             }))
    //             .filter(e => !(e.from.startsWith(`${node_id}/`) || e.to.startsWith(`${node_id}/`)))
    //     };

    //     return new_display_graph;

    // } else if(data.name.endsWith("/out")) {
    if(data.node_id.endsWith('/out') || data.name.endsWith("/out")) {
        const node_id = data.node_id.endsWith('/out') ? data.node_id.substring(0, data.node_id.indexOf("/out")) : data.node_id;
        const name = data.node_id.endsWith('/out') ? node_id : data.name.substring(0, data.name.indexOf("/out"))

        const inside_nodes = [data.display_graph.nodes.find(n => n.id === data.node_id)];
        if(!inside_nodes[0].id.endsWith('/out')) {
            inside_nodes[0].id += "/out"
        }
        const inside_edges = [];

        const bfs_parents = n => data.display_graph.edges.filter(e => e.to === n).forEach(e => {
            const inside_node = data.display_graph.nodes.find(p => p.id === e.from);

            inside_edges.push(e);
            inside_nodes.push(inside_node);

            if(!(e.from === (node_id + "/in") || inside_node.name === (name + "/in"))) {
                bfs_parents(e.from);
            }
            if (inside_node.name === (name + "/in") && !inside_node.id.endsWith('/in')) {
                e.from = "in";
            }

            if(e.to === data.node_id) {
                e.to = 'out';
            }
        });

        bfs_parents(data.node_id);
        const in_node = inside_nodes.find(n => n.id === node_id + '/in' || n.name === name + "/in");
        const in_node_id = in_node.id;
        in_node.id = node_id + "/in";

        const new_display_graph = {
                nodes: data.display_graph.nodes
                    .filter(n => !inside_nodes.includes(n))
                    .concat([{
                        id: node_id,
                        nodes: inside_nodes.map(n => {
                            n.id = n.id.startsWith(node_id) ? n.id.substring(node_id.length + 1) : n.id;
                            return n;
                        }),
                        edges: inside_edges.map(e => ({...e, 
                            from: e.from.startsWith(node_id) ? e.from.substring(node_id.length + 1) : e.from, 
                            to: e.to.startsWith(node_id) ? e.to.substring(node_id.length + 1) : e.to
                        }))
                    }]),
                edges: data.display_graph.edges
                    .filter(e => !inside_edges.includes(e))
                    .map(e => 
                        e.from === data.node_id ? {...e, from: node_id} 
                        : e.to === in_node_id ? {...e, to: node_id} 
                        : e)
            };

        return new_display_graph;
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


/////////////////////////////////

const lib = {
    _,
    ha: { h, app, text, memo },
    no: {executeGraph},
    scripts: {d3simulation, d3subscription, updateSimulationNodes, graphToSimulationNodes, expand_node, flattenNode, contract_node, keydownSubscription, calculateLevels},
    d3: { forceSimulation, forceManyBody, forceCenter, forceLink, forceRadial, forceY, forceCollide, forceX },
    Fuse,
    THREE
};

const generic_nodes = new Set(["switch", "filter", "delete", "default", "trigger", "execute_graph", "get"])

const stored = localStorage.getItem("display_graph");
const display_graph = stored ? JSON.parse(stored) : test_graph;
const state = new Map([['in', [{graph: DEFAULT_GRAPH, display_graph: {nodes: display_graph.nodes.concat(DEFAULT_GRAPH.nodes.filter(n => generic_nodes.has(n.id) && display_graph.nodes.findIndex(dn => dn.id === n.id) === -1)), edges: display_graph.edges.concat([])}, display_graph_out: "out"}]]])

console.log(executeGraph({state, graph: DEFAULT_GRAPH, out: "hyperapp_app"})[0]);
