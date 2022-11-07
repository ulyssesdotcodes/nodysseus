
export const create_randid = () => Math.random().toString(36).substring(2, 9);
export const flattenNode = (graph, levels = -1) => {
    if (graph.nodes === undefined || levels === 0) {
        return graph;
    }

    // needs to not prefix base node because then flatten node can't run  next
    const prefix = graph.id ? `${graph.id}/` : '';
    const prefix_name = graph.id ? `${graph.name}/` : '';

    return graph.nodes
        .map(g => flattenNode(g, levels - 1))
        .reduce((acc, n) => Object.assign({}, acc, {
            flat_nodes: acc.flat_nodes.concat(n.flat_nodes ? n.flat_nodes.flat() : []).map(fn => {
                // adjust for easy graph renaming
                if ((fn.id === (graph.out || "out")) && graph.name) {
                    fn.name = graph.name;
                }
                return fn
            }),
            flat_edges: acc.flat_edges.map(e => n.flat_nodes ?
                e.to === n.id ?
                    Object.assign({}, e, { to: `${e.to}/${n.in || 'in'}` }) :
                    e.from === n.id ?
                        Object.assign({}, e, { from: `${e.from}/${n.out || 'out'}` }) :
                        e :
                e).flat().concat(n.flat_edges).filter(e => e !== undefined)
        }), Object.assign({}, graph, {
            flat_nodes: graph.nodes,
            flat_edges: graph.edges
        }));
}


export const expand_node = (data) => {
    const nolib = data.nolib;
    const node_id = data.node_id;
    const node = data.display_graph.nodes.find(n => n.id === node_id)

    if (!(node && node.nodes)) {
        console.log('no nodes?');
        return { display_graph: data.display_graph, selected: [data.node_id] };
    }

    const args_node = node.edges.find(e => e.to === node.out && e.as === "args")?.from;

    const flattened = flattenNode(node, 1);

    const new_id_map = flattened.flat_nodes.reduce((acc, n) => nolib.no.runtime.get_node(data.display_graph, n.id) ? (acc[n.id] = create_randid(), acc) : n, {})

    const new_display_graph = {
        nodes: data.display_graph.nodes
            .filter(n => n.id !== node_id)
            .concat(flattened.flat_nodes.map(n => new_id_map[n.id] ? Object.assign({}, n, new_id_map[n.id]) : n)),
        edges: data.display_graph.edges
            .map(e => ({
                ...e,
                from: new_id_map[e.from] ?? e.from,
                to: new_id_map[e.to] ?? e.to === node_id ? args_node : e.to
            }))
            .concat(flattened.flat_edges)
    };

    return { display_graph: { ...data.display_graph, ...new_display_graph }, selected: [new_id_map[node.out] ?? node.out ?? 'out'] };
}

export const contract_node = (data, keep_expanded = false) => {
    const nolib = data.nolib;
    const node = data.display_graph.nodes.find(n => n.id === data.node_id);
    const node_id = data.node_id;
    if (!node.nodes) {
        const inside_nodes = [Object.assign({}, node)];
        const inside_node_map = new Map();
        inside_node_map.set(inside_nodes[0].id, inside_nodes[0]);
        const inside_edges = new Set();

        const q = data.display_graph.edges.filter(e => e.to === inside_nodes[0].id);

        let in_edge = [];
        let args_edge;

        while (q.length > 0) {
            const e = q.shift();

            if(e.to === node.id && e.as === 'args') {
                args_edge = e;
            }

            in_edge.filter(ie => ie.from === e.from).forEach(ie => {
                inside_edges.add(ie)
            });
            in_edge = in_edge.filter(ie => ie.from !== e.from);

            const old_node = inside_nodes.find(i => e.from === i.id);
            let inside_node = old_node || Object.assign({}, data.display_graph.nodes.find(p => p.id === e.from));

            inside_node_map.set(inside_node.id, inside_node);
            inside_edges.add(e);
            if (!old_node) {
                delete inside_node.inputs;
                inside_nodes.push(inside_node);
            }

            if (!args_edge || e.from !== args_edge.from) {
                nolib.no.runtime.get_edges_in(data.display_graph, e.from).forEach(de => q.push(de));
            }
        }

        let in_node_id = args_edge ? args_edge.from : undefined;

        // just return the original graph if it's a single node 
        if (in_edge.find(ie => ie.to !== in_node_id) || inside_nodes.length < 2) {
            return { display_graph: data.display_graph, selected: [data.node_id] };
        }

        const out_node_id = data.node_id;

        const in_node = inside_node_map.get(in_node_id);

        let node_id_count = data.display_graph.nodes.filter(n => n.id === node_id).length;
        let final_node_id = node_id_count === 1 ? node_id : `${node_id}_${node_id_count}`

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
                    id: final_node_id,
                    name: node.name ?? node.value,
                    in: in_node_id && in_node_id.startsWith(node_id + '/') ? in_node_id.substring(node_id.length + 1) : in_node_id,
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
                    e.from === data.node_id ? { ...e, from: final_node_id }
                        : e.to === in_node && in_node.id ? { ...e, to: final_node_id }
                            : inside_node_map.has(e.to)
                                ? { ...e, to: final_node_id }
                                : e
                )
        };

        return { display_graph: { ...data.display_graph, ...new_display_graph }, selected: [final_node_id] };
    }
}


export const findViewBox = (nodes, links, selected, node_el_width, htmlid, dimensions) => {
    const visible_nodes = [];
    const visible_node_set = new Set();
    let selected_pos;
    links.forEach(l => {
        const el = document.getElementById(`link-${l.source.node_id}`);
        const info_el = document.getElementById(`edge-info-${l.source.node_id}`);
        if(el && info_el) {
            const source = {x: l.source.x - node_el_width * 0.5, y: l.source.y};
            const target = {x: l.target.x - node_el_width * 0.5, y: l.target.y};

            if (l.source.node_id === selected) {
                visible_nodes.push({x: target.x, y: target.y});
                visible_node_set.add(l.target.node_id);
            } else if (l.target.node_id === selected) {
                visible_nodes.push({x: source.x, y: source.y});
                visible_node_set.add(l.source.node_id);
            }
        }
    });

    links.forEach(l => {
        if(visible_node_set.has(l.target.node_id) && !visible_node_set.has(l.source.node_id)) {
            const source = {x: l.source.x - node_el_width * 0.5, y: l.source.y};
            visible_nodes.push({x: source.x, y: source.y});
        }
    });

    nodes.forEach(n => {
        const el = document.getElementById(`${htmlid}-${n.node_id}`);
        if(el) {
            const x = n.x - node_el_width * 0.5;
            const y = n.y ;

            if(n.node_id === selected) {
                visible_nodes.push({x, y})
                selected_pos = {x, y};
            }
        }
    });

    const nodes_box = visible_nodes.reduce((acc, n) => ({min: {x: Math.min(acc.min.x, n.x - 24), y: Math.min(acc.min.y, n.y - 24)}, max: {x: Math.max(acc.max.x, n.x + node_el_width * 0.5 - 24), y: Math.max(acc.max.y, n.y + 24)}}), {min: {x: selected_pos ? (selected_pos.x - 96) : dimensions.x , y: selected_pos ? (selected_pos.y - 256) : dimensions.y}, max: {x: selected_pos ? (selected_pos.x + 96) : -dimensions.x, y: selected_pos ? (selected_pos.y + 128) : -dimensions.y}})
    const nodes_box_center = {x: (nodes_box.max.x + nodes_box.min.x) * 0.5, y: (nodes_box.max.y + nodes_box.min.y) * 0.5}; 
    const nodes_box_dimensions = {x: Math.max(dimensions.x * 0.5, Math.min(dimensions.x, (nodes_box.max.x - nodes_box.min.x))), y: Math.max(dimensions.y * 0.5, Math.min(dimensions.y, (nodes_box.max.y - nodes_box.min.y)))}
    const center = !selected_pos ? nodes_box_center : {x: (selected_pos.x + nodes_box_center.x * 3) * 0.25, y: (selected_pos.y + nodes_box_center.y * 3) * 0.25}

    return {nodes_box_dimensions, center};
}

export const ancestor_graph = (nolib, node_id, from_graph) => {
    let edges_in;
    let queue = [node_id];
    const graph = {nodes: [], edges: []};
    while(queue.length > 0) {
        let node_id = queue.pop();
        graph.nodes.push({...nolib.no.runtime.get_node(from_graph, node_id)})
        edges_in = nolib.no.runtime.get_edges_in(from_graph, node_id);
        graph.edges = graph.edges.concat(edges_in);
        edges_in.forEach(e => queue.push(e.from));
    }
    return graph;
}

export const node_args = (nolib, ha, graph, node_id) => {
    const node = nolib.no.runtime.get_node(graph, node_id);
    if(!node) {
        // between graph update and simulation update it's possible links are bad
        return []
    }
    const node_ref = node?.ref ? nolib.no.runtime.get_ref(node.ref) : node;
    const edges_in = node_ref && nolib.no.runtime.get_edges_in(graph, node_id);

    const argslist_path = node_ref?.nodes && nolib.no.runtime.get_path(node_ref, "argslist");

    const nextIndexedArg = "arg" + ((
        edges_in?.filter(l => l.as?.startsWith("arg") && new RegExp("[0-9]+").test(l.as.substring(3)))
                .map(l => parseInt(l.as.substring(3))) ?? [])
            .reduce((acc, i) => acc > i ? acc : i + 1, 0))
    
    const externfn = node_ref?.ref === "extern" && nolib.extern.get.fn({}, nolib, node_ref?.value)
    const baseargs = !argslist_path && externfn
            ? externfn.args
              ? externfn.args
              : ['args']
            : node_ref?.nodes?.filter(n => 
                n.ref === "arg" 
                && n.type !== "internal" 
                && !n.value?.split(":")[1]?.toLowerCase()?.includes("internal")
                && !(Array.isArray(n.type) && n.type.includes("internal")))
                .map(n => n.value).filter(a => a) ?? []

    return [...new Set(argslist_path ? nolib.no.runGraph(node_ref, argslist_path) : baseargs
        .filter(a => !a.includes('.') && !a.startsWith("_"))
        .concat(edges_in?.map(e => e.as) ?? [])
        .concat(
            (externfn?.args?.includes("_node_args") || baseargs.includes("_args"))
            || (node.ref === undefined && !node.value)
            ? [nextIndexedArg]
            : []
        ))
    ]
}
