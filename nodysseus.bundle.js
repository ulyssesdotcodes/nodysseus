(function () {
    'use strict';

    var id$1 = "nodysseus_hyperapp";
    var out = "out";
    var nodes$1 = [
    	{
    		id: "in"
    	},
    	{
    		id: "arrays"
    	},
    	{
    		id: "utility"
    	},
    	{
    		id: "flow"
    	},
    	{
    		id: "html"
    	},
    	{
    		id: "object"
    	},
    	{
    		id: "custom"
    	},
    	{
    		id: "state"
    	},
    	{
    		id: "JSON"
    	},
    	{
    		id: "log",
    		args: [
    			"value"
    		],
    		nodes: [
    			{
    				id: "in"
    			},
    			{
    				id: "value",
    				ref: "arg",
    				value: "value"
    			},
    			{
    				id: "out",
    				args: [
    				],
    				script: "console.log(_node.name ?? _node.id); console.log(value); return value"
    			}
    		],
    		edges: [
    			{
    				from: "in",
    				to: "out",
    				as: "input"
    			},
    			{
    				from: "value",
    				to: "out",
    				as: "value"
    			}
    		]
    	},
    	{
    		id: "fetch",
    		name: "fetch",
    		extern: "utility.fetch"
    	},
    	{
    		id: "call",
    		name: "call",
    		extern: "utility.call"
    	},
    	{
    		id: "stringify",
    		name: "stringify",
    		extern: "JSON.stringify"
    	},
    	{
    		id: "parse",
    		name: "parse",
    		extern: "JSON.parse"
    	},
    	{
    		id: "add",
    		extern: "utility.add"
    	},
    	{
    		id: "mult",
    		extern: "utility.mult"
    	},
    	{
    		id: "divide",
    		extern: "utility.divide"
    	},
    	{
    		id: "negate",
    		extern: "utility.negate"
    	},
    	{
    		id: "wrap_array",
    		args: [
    			"value"
    		],
    		script: "return [value]"
    	},
    	{
    		id: "graph_to_sim_fn",
    		out: "action",
    		nodes: [
    			{
    				id: "state",
    				ref: "arg",
    				value: 0
    			},
    			{
    				id: "payload",
    				ref: "arg",
    				value: 1
    			},
    			{
    				id: "action",
    				script: "return _lib.scripts.graphToSimulationNodes(state, payload)"
    			}
    		],
    		edges: [
    			{
    				from: "state",
    				to: "action",
    				as: "state"
    			},
    			{
    				from: "payload",
    				to: "action",
    				as: "payload"
    			}
    		]
    	},
    	{
    		id: "sim_to_hyperapp_action",
    		out: "action",
    		nodes: [
    			{
    				id: "state",
    				ref: "arg",
    				value: 0
    			},
    			{
    				id: "old_nodes",
    				ref: "arg",
    				value: "0.nodes"
    			},
    			{
    				id: "old_links",
    				ref: "arg",
    				value: "0.links"
    			},
    			{
    				id: "new_nodes",
    				ref: "arg",
    				value: "1.nodes"
    			},
    			{
    				id: "new_links",
    				ref: "arg",
    				value: "1.links"
    			},
    			{
    				id: "selected",
    				ref: "arg",
    				value: "0.selected"
    			},
    			{
    				id: "display_graph",
    				ref: "arg",
    				value: "0.display_graph"
    			},
    			{
    				id: "payload",
    				ref: "arg",
    				value: 1
    			},
    			{
    				id: "calculate_levels",
    				script: "return _lib.scripts.calculateLevels(nodes, links, display_graph, selected)"
    			},
    			{
    				id: "with_levels",
    				script: "return {...state, levels}"
    			},
    			{
    				id: "graph_topology_change",
    				script: "return true"
    			},
    			{
    				id: "if_levels",
    				ref: "if"
    			},
    			{
    				id: "panzoom_selected_effector",
    				ref: "arg",
    				value: "0.panzoom_selected_effect"
    			},
    			{
    				id: "action",
    				script: "return [{...state, nodes: new_nodes, links: new_links, randid: Math.random().toString(36).substring(2, 9)}, panzoom_selected_effect && false && [panzoom_selected_effect, {...state, selected: state.selected[0], nodes: new_nodes, links: new_links}], [state.update_hyperapp]]"
    			}
    		],
    		edges: [
    			{
    				from: "old_nodes",
    				to: "graph_topology_change",
    				as: "old_nodes"
    			},
    			{
    				from: "new_nodes",
    				to: "graph_topology_change",
    				as: "new_nodes"
    			},
    			{
    				from: "new_links",
    				to: "graph_topology_change",
    				as: "new_links"
    			},
    			{
    				from: "old_links",
    				to: "graph_topology_change",
    				as: "old_links"
    			},
    			{
    				from: "new_nodes",
    				to: "calculate_levels",
    				as: "nodes"
    			},
    			{
    				from: "new_links",
    				to: "calculate_levels",
    				as: "links"
    			},
    			{
    				from: "selected",
    				to: "calculate_levels",
    				as: "selected"
    			},
    			{
    				from: "display_graph",
    				to: "calculate_levels",
    				as: "display_graph"
    			},
    			{
    				from: "calculate_levels",
    				to: "with_levels",
    				as: "levels"
    			},
    			{
    				from: "state",
    				to: "with_levels",
    				as: "state"
    			},
    			{
    				from: "graph_topology_change",
    				to: "if_levels",
    				as: "pred"
    			},
    			{
    				from: "with_levels",
    				to: "if_levels",
    				as: "true"
    			},
    			{
    				from: "state",
    				to: "if_levels",
    				as: "false"
    			},
    			{
    				from: "new_nodes",
    				to: "action",
    				as: "new_nodes"
    			},
    			{
    				from: "new_links",
    				to: "action",
    				as: "new_links"
    			},
    			{
    				from: "if_levels",
    				to: "action",
    				as: "state"
    			},
    			{
    				from: "panzoom_selected_effector",
    				to: "action",
    				as: "panzoom_selected_effect"
    			}
    		]
    	},
    	{
    		id: "hyperapp_app",
    		nodes: [
    			{
    				id: "in"
    			},
    			{
    				id: "init",
    				ref: "arg",
    				value: "init"
    			},
    			{
    				id: "view",
    				ref: "arg",
    				value: "view"
    			},
    			{
    				id: "html_id",
    				ref: "arg",
    				value: "html_id"
    			},
    			{
    				id: "static",
    				ref: "arg",
    				value: "static"
    			},
    			{
    				id: "display_graph",
    				ref: "arg",
    				value: "display_graph"
    			},
    			{
    				id: "update_hyperapp",
    				ref: "arg",
    				value: "update_hyperapp"
    			},
    			{
    				id: "update_sim",
    				ref: "arg",
    				value: "update_sim"
    			},
    			{
    				id: "sim_to_hyperapp_action",
    				ref: "arg",
    				value: "sim_to_hyperapp_action"
    			},
    			{
    				id: "render_graph_effect",
    				ref: "arg",
    				value: "render_graph_effect"
    			},
    			{
    				id: "onkey_fn",
    				ref: "arg",
    				value: "onkey_fn"
    			},
    			{
    				id: "out",
    				args: [
    					"init",
    					"view"
    				],
    				script: "return {dispatch: _lib.ha.app({dispatch: _lib.no.middleware, init: () => [init, static && [update_sim, {...init, action: sim_to_hyperapp_action}], [update_hyperapp], [() => _lib.no.runtime.add_graph(init.display_graph)]], view: s => {if(s instanceof Map){ throw new Error('stop') } return view(s).el}, node: document.getElementById(html_id), subscriptions: s => [!static && [_lib.scripts.d3subscription, {action: sim_to_hyperapp_action, update: update_sim}], !static && [_lib.scripts.graph_subscription, {graph: s.display_graph}], !static && [_lib.scripts.result_subscription, {graph: s.display_graph}], !s.popover_graph && [_lib.scripts.keydownSubscription, {action: onkey_fn}], _lib.scripts.listen('resize', (s, _) => [{...s, dimensions: {x: document.getElementById(html_id).clientWidth, y: document.getElementById(html_id).clientHeight}}, [update_sim, s]]), !!document.getElementById( `${html_id}-editor-panzoom`) && [_lib.pz.panzoom, {id: `${html_id}-editor-panzoom`, action: (s, p) => [{...s, show_all: p.event !== 'effect_transform', svg_offset: p.transform}]}]]})}"
    			}
    		],
    		edges: [
    			{
    				from: "view",
    				to: "out",
    				as: "view"
    			},
    			{
    				from: "html_id",
    				to: "out",
    				as: "html_id"
    			},
    			{
    				from: "display_graph",
    				to: "out",
    				as: "display_graph"
    			},
    			{
    				from: "static",
    				to: "out",
    				as: "static"
    			},
    			{
    				from: "update_sim",
    				to: "out",
    				as: "update_sim"
    			},
    			{
    				from: "update_hyperapp",
    				to: "out",
    				as: "update_hyperapp"
    			},
    			{
    				from: "sim_to_hyperapp_action",
    				to: "out",
    				as: "sim_to_hyperapp_action"
    			},
    			{
    				from: "onkey_fn",
    				to: "out",
    				as: "onkey_fn"
    			},
    			{
    				from: "render_graph_effect",
    				to: "out",
    				as: "render_graph_effect"
    			},
    			{
    				from: "init",
    				to: "out",
    				as: "init"
    			}
    		]
    	},
    	{
    		id: "children_els",
    		nodes: [
    			{
    				id: "in"
    			},
    			{
    				id: "out",
    				args: [
    					"children"
    				],
    				script: "return [children.map(c => c.el)]"
    			}
    		],
    		edges: [
    			{
    				from: "in",
    				to: "out"
    			}
    		]
    	},
    	{
    		id: "append",
    		type: "(array: A[], item: A) => A[]",
    		nodes: [
    			{
    				id: "in"
    			},
    			{
    				id: "array",
    				ref: "arg",
    				value: "array"
    			},
    			{
    				id: "item",
    				ref: "arg",
    				value: "item"
    			},
    			{
    				id: "out",
    				script: "return array.concat(Array.isArray(item) ? item : [item])"
    			}
    		],
    		edges: [
    			{
    				from: "in",
    				to: "out",
    				as: "_",
    				type: "ref"
    			},
    			{
    				from: "array",
    				to: "out",
    				as: "array"
    			},
    			{
    				from: "item",
    				to: "out",
    				as: "item"
    			}
    		]
    	},
    	{
    		id: "concat",
    		type: "(array: A[], items: A[]) => A[]",
    		nodes: [
    			{
    				id: "in"
    			},
    			{
    				id: "array",
    				ref: "arg",
    				value: "array"
    			},
    			{
    				id: "items",
    				ref: "arg",
    				value: "items"
    			},
    			{
    				id: "out",
    				args: [
    					"item",
    					"array"
    				],
    				script: "return (array ?? []).concat(items ?? [])"
    			}
    		],
    		edges: [
    			{
    				from: "in",
    				to: "out",
    				as: "args"
    			},
    			{
    				from: "array",
    				to: "out",
    				as: "array"
    			},
    			{
    				from: "items",
    				to: "out",
    				as: "items"
    			}
    		]
    	},
    	{
    		id: "filter",
    		name: "filter",
    		"in": "74n1jfm",
    		out: "lahq5z4",
    		nodes: [
    			{
    				id: "lahq5z4",
    				args: [
    				],
    				name: "filter/out",
    				script: "const filter_fn = _lib.no.executeGraphNode({graph: _graph})(typeof fn === 'string' ? fn : fn.fn); return arr.filter(element => filter_fn(Object.assign(fn.args ?? {}, {element})))"
    			},
    			{
    				id: "pfoypo5",
    				args: [
    				],
    				ref: "arg",
    				value: "key"
    			},
    			{
    				id: "zinx621",
    				args: [
    				],
    				ref: "arg",
    				value: "value"
    			},
    			{
    				id: "x2sz5kb",
    				args: [
    				],
    				ref: "arg",
    				value: "arr"
    			},
    			{
    				id: "fn",
    				ref: "arg",
    				value: "fn"
    			},
    			{
    				id: "74n1jfm",
    				args: [
    				],
    				name: "filter/in"
    			}
    		],
    		edges: [
    			{
    				from: "pfoypo5",
    				to: "lahq5z4",
    				as: "key"
    			},
    			{
    				from: "zinx621",
    				to: "lahq5z4",
    				as: "value"
    			},
    			{
    				from: "x2sz5kb",
    				to: "lahq5z4",
    				as: "arr"
    			},
    			{
    				from: "74n1jfm",
    				to: "lahq5z4",
    				as: "input"
    			},
    			{
    				from: "fn",
    				to: "lahq5z4",
    				as: "fn"
    			}
    		]
    	},
    	{
    		id: "filter_eq",
    		name: "filter_eq",
    		"in": "74n1jfm",
    		out: "lahq5z4",
    		nodes: [
    			{
    				id: "lahq5z4",
    				args: [
    				],
    				name: "filter/out",
    				script: "return arr.filter(v => v[key] === value)"
    			},
    			{
    				id: "pfoypo5",
    				args: [
    				],
    				ref: "arg",
    				value: "key"
    			},
    			{
    				id: "zinx621",
    				args: [
    				],
    				ref: "arg",
    				value: "value"
    			},
    			{
    				id: "x2sz5kb",
    				args: [
    				],
    				ref: "arg",
    				value: "arr"
    			},
    			{
    				id: "74n1jfm",
    				args: [
    				],
    				name: "filter/in"
    			}
    		],
    		edges: [
    			{
    				from: "pfoypo5",
    				to: "lahq5z4",
    				as: "key"
    			},
    			{
    				from: "zinx621",
    				to: "lahq5z4",
    				as: "value"
    			},
    			{
    				from: "x2sz5kb",
    				to: "lahq5z4",
    				as: "arr"
    			},
    			{
    				from: "74n1jfm",
    				to: "lahq5z4",
    				as: "input"
    			}
    		]
    	},
    	{
    		id: "default",
    		nodes: [
    			{
    				id: "in"
    			},
    			{
    				id: "value",
    				ref: "arg",
    				value: "value"
    			},
    			{
    				id: "otherwise",
    				ref: "arg",
    				value: "otherwise"
    			},
    			{
    				id: "data"
    			},
    			{
    				id: "out",
    				script: "return value ?? data['otherwise']"
    			}
    		],
    		edges: [
    			{
    				from: "in",
    				to: "out",
    				as: "_args",
    				type: "ref"
    			},
    			{
    				from: "value",
    				to: "out",
    				as: "value"
    			},
    			{
    				from: "otherwise",
    				to: "data",
    				as: "otherwise"
    			},
    			{
    				from: "data",
    				to: "out",
    				as: "data"
    			}
    		]
    	},
    	{
    		id: "switch",
    		args: [
    			"data",
    			"input"
    		],
    		nodes: [
    			{
    				id: "in"
    			},
    			{
    				id: "out",
    				args: [
    					"data",
    					"input"
    				],
    				script: "return data[input] ?? otherwise;"
    			},
    			{
    				id: "input",
    				ref: "arg",
    				value: "input"
    			},
    			{
    				id: "otherwise",
    				ref: "arg",
    				value: "otherwise"
    			}
    		],
    		edges: [
    			{
    				from: "in",
    				to: "out",
    				as: "data"
    			},
    			{
    				from: "input",
    				to: "out",
    				as: "input"
    			},
    			{
    				from: "otherwise",
    				to: "out",
    				as: "otherwise"
    			}
    		]
    	},
    	{
    		id: "if",
    		nodes: [
    			{
    				id: "in"
    			},
    			{
    				id: "pred",
    				ref: "arg",
    				value: "pred"
    			},
    			{
    				id: "true",
    				ref: "arg",
    				value: "true"
    			},
    			{
    				id: "false",
    				ref: "arg",
    				value: "false"
    			},
    			{
    				id: "data"
    			},
    			{
    				id: "out",
    				script: "return !!pred ? data.true_val : data.false_val"
    			}
    		],
    		edges: [
    			{
    				from: "in",
    				to: "out",
    				as: "data"
    			},
    			{
    				from: "true",
    				to: "data",
    				as: "true_val"
    			},
    			{
    				from: "false",
    				to: "data",
    				as: "false_val"
    			},
    			{
    				from: "data",
    				to: "out",
    				as: "data"
    			},
    			{
    				from: "pred",
    				to: "out",
    				as: "pred"
    			}
    		]
    	},
    	{
    		id: "find_node",
    		script: "const nid = typeof node_id === 'string' ? node_id : node_id[0]; return nodes.find(n => n.id === nid || n.node_id === nid)"
    	},
    	{
    		id: "svg_text",
    		out: "out",
    		nodes: [
    			{
    				id: "in"
    			},
    			{
    				id: "dom_type",
    				value: "text"
    			},
    			{
    				id: "text",
    				ref: "arg",
    				value: "text"
    			},
    			{
    				id: "props",
    				ref: "arg",
    				value: "props"
    			},
    			{
    				id: "text_el",
    				ref: "html_text"
    			},
    			{
    				id: "children",
    				script: "return [text]"
    			},
    			{
    				id: "div",
    				value: "div"
    			},
    			{
    				id: "out",
    				ref: "html_element"
    			}
    		],
    		edges: [
    			{
    				from: "dom_type",
    				to: "out",
    				as: "dom_type"
    			},
    			{
    				from: "text",
    				to: "text_el",
    				as: "text"
    			},
    			{
    				from: "text_el",
    				to: "children",
    				as: "text"
    			},
    			{
    				from: "props",
    				to: "out",
    				as: "props"
    			},
    			{
    				from: "children",
    				to: "out",
    				as: "children"
    			}
    		]
    	},
    	{
    		id: "runnable",
    		out: "out",
    		nodes: [
    			{
    				id: "fn",
    				ref: "arg",
    				value: "fn"
    			},
    			{
    				id: "value_args",
    				ref: "arg",
    				value: "args"
    			},
    			{
    				id: "context_args",
    				ref: "arg",
    				value: "_args"
    			},
    			{
    				id: "fn_path",
    				value: "fn"
    			},
    			{
    				id: "args_path",
    				value: "args"
    			},
    			{
    				id: "prune_vals",
    				value: {
    					args: false
    				}
    			},
    			{
    				id: "delete_fn",
    				ref: "delete"
    			},
    			{
    				id: "delete_args",
    				ref: "delete"
    			},
    			{
    				id: "args",
    				ref: "merge_objects"
    			},
    			{
    				id: "out",
    				script: "const parent_id = _node.id.substring(0, _node.id.lastIndexOf('/')); const input = _lib.no.runtime.get_edges_in(_graph, parent_id).find(i => i.as === 'fn'); return input ? {fn: input.from, graph: _graph, args: args ?? {}} : false"
    			}
    		],
    		edges: [
    			{
    				from: "context_args",
    				to: "delete_fn",
    				as: "target"
    			},
    			{
    				from: "fn_path",
    				to: "delete_fn",
    				as: "path"
    			},
    			{
    				from: "delete_fn",
    				to: "delete_args",
    				as: "target"
    			},
    			{
    				from: "args_path",
    				to: "delete_args",
    				as: "path"
    			},
    			{
    				from: "delete_args",
    				to: "args",
    				as: "o0"
    			},
    			{
    				from: "prune_vals",
    				to: "args",
    				as: "o1"
    			},
    			{
    				from: "value_args",
    				to: "args",
    				as: "o2"
    			},
    			{
    				from: "args",
    				to: "out",
    				as: "args",
    				type: "resolve"
    			},
    			{
    				from: "fn",
    				to: "out",
    				as: "fn",
    				type: "ref"
    			}
    		]
    	},
    	{
    		id: "dispatch_runnable",
    		nodes: [
    			{
    				id: "dispatch",
    				ref: "arg",
    				value: "dispatch",
    				type: "internal"
    			},
    			{
    				id: "fn",
    				ref: "arg",
    				value: "fn"
    			},
    			{
    				id: "run",
    				ref: "run"
    			},
    			{
    				id: "args",
    				ref: "arg",
    				value: "_args"
    			},
    			{
    				id: "out",
    				script: "dispatch({...fn, args: {...args, ...fn.args}})"
    			}
    		],
    		edges: [
    			{
    				from: "fn",
    				to: "run",
    				as: "runnable"
    			},
    			{
    				from: "fn",
    				to: "out",
    				as: "fn"
    			},
    			{
    				from: "run",
    				to: "_out",
    				as: "res"
    			},
    			{
    				from: "dispatch",
    				to: "out",
    				as: "dispatch"
    			},
    			{
    				from: "args",
    				to: "out",
    				as: "args"
    			}
    		]
    	},
    	{
    		id: "execute_graph",
    		nodes: [
    			{
    				id: "in"
    			},
    			{
    				id: "fn",
    				ref: "arg",
    				value: "fn"
    			},
    			{
    				id: "fn_graph",
    				ref: "arg",
    				value: "fn_graph"
    			},
    			{
    				id: "args",
    				ref: "arg",
    				value: "_args"
    			},
    			{
    				id: "filter_args",
    				script: "const ret = {...args}; delete ret.fn; delete ret.graph;"
    			},
    			{
    				id: "out",
    				script: "const res_graph = fn_graph ?? _graph; return (...inner_args) => {return _lib.no.executeGraphNode({graph: {...res_graph, nodes: [...res_graph.nodes], edges: [...res_graph.edges]}})(fn)(Object.keys(args).length > 0 ? Object.assign(args, inner_args.length === 1 ? inner_args[0] : inner_args) : inner_args.length === 1 ? inner_args[0] : inner_args);}"
    			}
    		],
    		edges: [
    			{
    				from: "in",
    				to: "out",
    				as: "args"
    			},
    			{
    				from: "fn",
    				to: "out",
    				as: "fn"
    			},
    			{
    				from: "fn_graph",
    				to: "out",
    				as: "fn_graph"
    			}
    		]
    	},
    	{
    		id: "apply",
    		script: "return _lib.no.executeGraphNode({graph: fn.graph ?? _graph})(fn.fn ?? fn)(args);"
    	},
    	{
    		id: "apply_graph",
    		script: "return _lib.no.executeGraphNode({graph})(fn)(args);"
    	},
    	{
    		id: "partial",
    		nodes: [
    			{
    				id: "in"
    			},
    			{
    				id: "input_value",
    				ref: "arg",
    				value: "_args"
    			},
    			{
    				id: "fn",
    				ref: "arg",
    				value: "fn"
    			},
    			{
    				id: "args",
    				ref: "arg",
    				value: "args"
    			},
    			{
    				id: "out",
    				script: "return _lib.no.executeGraphNode({graph: _graph})(fn)(Object.assign({}, _args, args))"
    			}
    		],
    		edges: [
    			{
    				from: "in",
    				to: "out",
    				as: "args",
    				type: "ref"
    			},
    			{
    				from: "fn",
    				to: "out",
    				as: "fn"
    			},
    			{
    				from: "args",
    				to: "out",
    				as: "args"
    			},
    			{
    				from: "input_value",
    				to: "out",
    				as: "_args"
    			}
    		]
    	},
    	{
    		id: "partial_graph",
    		script: "return _lib.no.executeGraphNode({graph})(fn)(Object.assign({}, _args, args))"
    	},
    	{
    		id: "resolve",
    		args: [
    			"data"
    		],
    		nodes: [
    			{
    				id: "in"
    			},
    			{
    				id: "keys",
    				args: [
    					"data"
    				],
    				script: "return [...data.keys()]"
    			},
    			{
    				id: "collate"
    			},
    			{
    				id: "out",
    				args: [
    					"data"
    				],
    				script: "return data"
    			}
    		],
    		edges: [
    			{
    				from: "in",
    				to: "keys"
    			},
    			{
    				from: "keys",
    				to: "collate",
    				as: "input"
    			},
    			{
    				from: "in",
    				to: "collate"
    			},
    			{
    				from: "collate",
    				to: "out",
    				as: "data"
    			}
    		]
    	},
    	{
    		id: "array",
    		name: "array",
    		extern: "utility.new_array"
    	},
    	{
    		id: "wrap_effect_fn",
    		args: [
    			"fn"
    		],
    		nodes: [
    			{
    				id: "in"
    			},
    			{
    				id: "fn",
    				ref: "arg",
    				value: "fn"
    			},
    			{
    				id: "payload",
    				ref: "arg",
    				value: "payload"
    			},
    			{
    				id: "out",
    				args: [
    					"fn"
    				],
    				script: "return (_, payload) => fn(payload)"
    			}
    		],
    		edges: [
    			{
    				from: "in",
    				to: "out",
    				as: "arg0"
    			},
    			{
    				from: "payload",
    				to: "out",
    				as: "payload"
    			},
    			{
    				from: "fn",
    				to: "out",
    				as: "fn"
    			}
    		]
    	},
    	{
    		id: "merge_objects",
    		extern: "utility.merge_objects"
    	},
    	{
    		id: "get",
    		args: [
    			"target",
    			"path"
    		],
    		nodes: [
    			{
    				id: "in"
    			},
    			{
    				id: "target",
    				ref: "arg",
    				value: "target"
    			},
    			{
    				id: "path",
    				ref: "arg",
    				value: "path"
    			},
    			{
    				id: "def",
    				ref: "arg",
    				value: "def"
    			},
    			{
    				id: "out",
    				extern: "just.get"
    			}
    		],
    		edges: [
    			{
    				from: "in",
    				to: "out",
    				as: "input"
    			},
    			{
    				from: "def",
    				to: "out",
    				as: "def"
    			},
    			{
    				from: "path",
    				to: "out",
    				as: "path"
    			},
    			{
    				from: "target",
    				to: "out",
    				as: "target"
    			}
    		]
    	},
    	{
    		id: "arg",
    		extern: "utility.arg"
    	},
    	{
    		id: "set-mutable",
    		args: [
    			"target",
    			"path",
    			"value"
    		],
    		script: "return _lib.just.set(target, path, value)"
    	},
    	{
    		id: "set",
    		type: "(target: any, value: any, path: string) => any",
    		script: "const keys = path.split('.'); const check = (o, v, k) => k.length === 1 ? {...o, [k[0]]: v, _needsresolve: true} : o.hasOwnProperty(k[0]) ? {...o, [k[0]]: check(o[k[0]], v, k.slice(1)), _needsresolve: true} : o; return check(target, value, keys)"
    	},
    	{
    		id: "delete",
    		out: "out",
    		nodes: [
    			{
    				id: "in"
    			},
    			{
    				id: "target",
    				ref: "arg",
    				value: "target"
    			},
    			{
    				id: "path",
    				ref: "arg",
    				value: "path"
    			},
    			{
    				id: "out",
    				script: "const new_val = Object.assign({}, target); delete new_val[path]; return new_val"
    			}
    		],
    		edges: [
    			{
    				from: "in",
    				to: "out",
    				as: "args"
    			},
    			{
    				from: "target",
    				to: "out",
    				as: "target"
    			},
    			{
    				from: "path",
    				to: "out",
    				as: "path"
    			}
    		]
    	},
    	{
    		id: "event_publisher",
    		out: "update",
    		nodes: [
    			{
    				id: "name",
    				ref: "arg",
    				value: "name"
    			},
    			{
    				id: "value",
    				ref: "arg",
    				value: "value"
    			},
    			{
    				id: "update",
    				extern: "no.runtime.publish"
    			}
    		],
    		edges: [
    			{
    				from: "name",
    				to: "update",
    				as: "event"
    			},
    			{
    				from: "value",
    				to: "update",
    				as: "data"
    			}
    		]
    	},
    	{
    		id: "event_subscriber",
    		out: "out",
    		nodes: [
    			{
    				id: "name",
    				ref: "arg",
    				value: "name"
    			},
    			{
    				id: "add_listener",
    				script: "const parent = _lib.no.runtime.get_node(_graph, _node.id.substring(0, _node.id.lastIndexOf('/'))); _lib.no.runtime.add_listener(_graph, event, parent.id, (graph, ev) => _lib.no.runtime.add_node(_graph, {...parent , value: ev}), true)"
    			},
    			{
    				id: "out",
    				script: "return _lib.no.runtime.get_node(_graph, _node.id.substring(0, _node.id.lastIndexOf('/'))).value;"
    			}
    		],
    		edges: [
    			{
    				from: "name",
    				to: "add_listener",
    				as: "event"
    			},
    			{
    				from: "add_listener",
    				to: "out",
    				as: "listener"
    			}
    		]
    	},
    	{
    		id: "fuse vertices",
    		name: "fuse vertices",
    		"in": "g8mx5sn1u",
    		out: "vnw7d8iaw",
    		args: [
    			"graph"
    		],
    		nodes: [
    			{
    				id: "vnw7d8iaw",
    				name: "fuse vertices",
    				ref: "switch",
    				args: [
    					"fuse",
    					"graph"
    				]
    			},
    			{
    				id: "6uzm3ifn3",
    				args: [
    					"graph"
    				],
    				script: "return graph.edges.length > 0 ? \"fuse\" : \"graph\""
    			},
    			{
    				id: "p229wzcj5",
    				ref: "fuse vertices"
    			},
    			{
    				id: "idjoql4db"
    			},
    			{
    				id: "wfld638dn",
    				args: [
    					"remaining_edges"
    				],
    				script: "return [remaining_edges.map(e => ({...e, to: e.to === chosen_edge.to || e.to === chosen_edge.from ? new_id : e.to, from: e.from === chosen_edge.from || e.from === chosen_edge.to ? new_id : e.from}))]"
    			},
    			{
    				id: "ungdjbio6",
    				args: [
    					"graph",
    					"chosen_edge"
    				],
    				script: "const remaining = graph.nodes\n.filter(n => n.id !== chosen_edge.to && n.id !== chosen_edge.from);\n\nconst from = [...(graph.nodes\n.find(n => n.id === chosen_edge.to).nodes ?? [chosen_edge.to])]\n\nconst to = [...(graph.nodes.find(n => n.id === chosen_edge.from).nodes ?? [chosen_edge.from])];\n\nreturn [remaining\n.concat([{\nid: new_id, \nnodes: [...(new Set(from.concat(to))).keys()],\n}])\n\n];"
    			},
    			{
    				id: "mh8lknkfv",
    				args: [
    					"graph"
    				],
    				script: "return [graph.edges.slice(1)]"
    			},
    			{
    				id: "h8bhlzbph",
    				args: [
    					"chosen_edge"
    				],
    				script: "return chosen_edge.to + \"_\" + chosen_edge.from;",
    				name: "new_id"
    			},
    			{
    				id: "1m739wxv9",
    				args: [
    					"graph"
    				],
    				script: "return graph.edges[0]",
    				name: "edge"
    			},
    			{
    				id: "nznzj5bfn",
    				name: "get graph",
    				ref: "get"
    			},
    			{
    				id: "g8mx5sn1u",
    				name: "fuse vertices/in"
    			},
    			{
    				id: "tta1nggm4",
    				value: "graph"
    			}
    		],
    		edges: [
    			{
    				from: "6uzm3ifn3",
    				to: "vnw7d8iaw",
    				as: "input"
    			},
    			{
    				from: "p229wzcj5",
    				to: "vnw7d8iaw",
    				as: "fuse"
    			},
    			{
    				from: "idjoql4db",
    				to: "p229wzcj5",
    				as: "graph"
    			},
    			{
    				from: "wfld638dn",
    				to: "idjoql4db",
    				as: "edges"
    			},
    			{
    				from: "ungdjbio6",
    				to: "idjoql4db",
    				as: "nodes"
    			},
    			{
    				from: "mh8lknkfv",
    				to: "wfld638dn",
    				as: "remaining_edges"
    			},
    			{
    				from: "h8bhlzbph",
    				to: "wfld638dn",
    				as: "new_id"
    			},
    			{
    				from: "1m739wxv9",
    				to: "wfld638dn",
    				as: "chosen_edge"
    			},
    			{
    				from: "h8bhlzbph",
    				to: "ungdjbio6",
    				as: "new_id"
    			},
    			{
    				from: "1m739wxv9",
    				to: "ungdjbio6",
    				as: "chosen_edge"
    			},
    			{
    				from: "nznzj5bfn",
    				to: "vnw7d8iaw",
    				as: "graph"
    			},
    			{
    				from: "nznzj5bfn",
    				to: "6uzm3ifn3",
    				as: "graph"
    			},
    			{
    				from: "nznzj5bfn",
    				to: "ungdjbio6",
    				as: "graph"
    			},
    			{
    				from: "nznzj5bfn",
    				to: "mh8lknkfv",
    				as: "graph"
    			},
    			{
    				from: "1m739wxv9",
    				to: "h8bhlzbph",
    				as: "chosen_edge"
    			},
    			{
    				from: "nznzj5bfn",
    				to: "1m739wxv9",
    				as: "graph"
    			},
    			{
    				from: "g8mx5sn1u",
    				to: "nznzj5bfn",
    				as: "target"
    			},
    			{
    				from: "tta1nggm4",
    				to: "nznzj5bfn",
    				as: "path"
    			}
    		]
    	},
    	{
    		id: "remove pendant",
    		name: "remove pendant",
    		"in": "jhykipayt",
    		out: "ay4hfrqw1",
    		nodes: [
    			{
    				id: "ay4hfrqw1",
    				args: [
    				],
    				name: "remove pendant",
    				ref: "switch"
    			},
    			{
    				id: "r5lka2sj5",
    				args: [
    				],
    				script: "return pendants.length > 0 ? [\"remove\"] : [\"graph\"]"
    			},
    			{
    				id: "7elx5ekij",
    				args: [
    				],
    				ref: "remove pendant"
    			},
    			{
    				id: "cz08pewa3",
    				args: [
    				]
    			},
    			{
    				id: "7n24u6kpt",
    				args: [
    					"nodes"
    				],
    				script: "return [nodes.filter(n => !pendant_edges.includes(n.id))]",
    				name: "filter out pendants"
    			},
    			{
    				id: "cuiccwvbv",
    				args: [
    				],
    				script: "return [edges.filter(e => !pendant_edges.includes(e.to) && !pendant_edges.includes(e.from))]",
    				name: "filter penant"
    			},
    			{
    				id: "lgzenfpvl",
    				args: [
    				],
    				script: "let accfrom = edges.flatMap(e => [e.from]).reduce((acc, v) => { acc[v] = (acc[v] ?? 0) + 1; return acc}, {});\nlet accto = edges.flatMap(e => [e.to]).reduce((acc, v) => { acc[v] = (acc[v] ?? 0) + 1; return acc}, {});\n\nreturn nodes.map(n => n.id).filter(n => (!isNaN(accfrom[n]) && accfrom[n] <= 1) && !accto[n] );",
    				name: "pendant edges"
    			},
    			{
    				id: "7g81ijcqb",
    				name: "nodes",
    				"in": "in",
    				out: "7g81ijcqb",
    				nodes: [
    					{
    						id: "7g81ijcqb",
    						args: [
    						],
    						ref: "get",
    						name: "nodes"
    					},
    					{
    						id: "2yshp7jvu",
    						args: [
    						],
    						value: "nodes"
    					},
    					{
    						id: "in"
    					}
    				],
    				edges: [
    					{
    						from: "2yshp7jvu",
    						to: "7g81ijcqb",
    						as: "path"
    					},
    					{
    						from: "in",
    						to: "7g81ijcqb"
    					}
    				]
    			},
    			{
    				id: "zkg9zpu3e",
    				name: "edges",
    				"in": "in",
    				out: "zkg9zpu3e",
    				nodes: [
    					{
    						id: "zkg9zpu3e",
    						args: [
    						],
    						ref: "get",
    						name: "edges"
    					},
    					{
    						id: "g18jj6zvq",
    						args: [
    						],
    						value: "edges"
    					},
    					{
    						id: "in"
    					}
    				],
    				edges: [
    					{
    						from: "g18jj6zvq",
    						to: "zkg9zpu3e",
    						as: "path"
    					},
    					{
    						from: "in",
    						to: "zkg9zpu3e"
    					}
    				]
    			},
    			{
    				id: "bp1cy89hk",
    				args: [
    				],
    				ref: "get",
    				name: "graph"
    			},
    			{
    				id: "jhykipayt",
    				args: [
    				],
    				name: "remove pendant/in"
    			},
    			{
    				id: "iqkdwjpuz",
    				args: [
    				],
    				value: "graph"
    			}
    		],
    		edges: [
    			{
    				from: "r5lka2sj5",
    				to: "ay4hfrqw1",
    				as: "input"
    			},
    			{
    				from: "7elx5ekij",
    				to: "ay4hfrqw1",
    				as: "remove"
    			},
    			{
    				from: "cz08pewa3",
    				to: "7elx5ekij",
    				as: "graph"
    			},
    			{
    				from: "7n24u6kpt",
    				to: "cz08pewa3",
    				as: "nodes"
    			},
    			{
    				from: "cuiccwvbv",
    				to: "cz08pewa3",
    				as: "edges"
    			},
    			{
    				from: "lgzenfpvl",
    				to: "r5lka2sj5",
    				as: "pendants"
    			},
    			{
    				from: "lgzenfpvl",
    				to: "cz08pewa3",
    				as: "pendants"
    			},
    			{
    				from: "7g81ijcqb",
    				to: "7n24u6kpt",
    				as: "nodes"
    			},
    			{
    				from: "lgzenfpvl",
    				to: "7n24u6kpt",
    				as: "pendant_edges"
    			},
    			{
    				from: "zkg9zpu3e",
    				to: "7n24u6kpt",
    				as: "edges"
    			},
    			{
    				from: "lgzenfpvl",
    				to: "cuiccwvbv",
    				as: "pendant_edges"
    			},
    			{
    				from: "zkg9zpu3e",
    				to: "cuiccwvbv",
    				as: "edges"
    			},
    			{
    				from: "zkg9zpu3e",
    				to: "lgzenfpvl",
    				as: "edges"
    			},
    			{
    				from: "7g81ijcqb",
    				to: "lgzenfpvl",
    				as: "nodes"
    			},
    			{
    				from: "bp1cy89hk",
    				to: "ay4hfrqw1",
    				as: "graph"
    			},
    			{
    				from: "bp1cy89hk",
    				to: "cz08pewa3"
    			},
    			{
    				from: "bp1cy89hk",
    				to: "7g81ijcqb",
    				as: "target"
    			},
    			{
    				from: "bp1cy89hk",
    				to: "zkg9zpu3e",
    				as: "target"
    			},
    			{
    				from: "jhykipayt",
    				to: "bp1cy89hk",
    				as: "target"
    			},
    			{
    				from: "iqkdwjpuz",
    				to: "bp1cy89hk",
    				as: "path"
    			}
    		]
    	},
    	{
    		id: "hyperapp_action",
    		script: "return {fn, graph: _graph}"
    	},
    	{
    		id: "hyperapp_state_action",
    		script: "return {fn, graph: _graph, stateonly: true}"
    	},
    	{
    		id: "hyperapp_action_effect",
    		description: "Creates an effect that dispatches the passed-in fn",
    		script: "const action = typeof fn === 'string' ? {fn, graph: _graph} : (typeof fn === 'function' || (typeof fn === 'object' && fn.hasOwnProperty('fn'))) ? fn : undefined; return (dispatch, payload) => dispatch(action, payload)"
    	},
    	{
    		id: "hyperapp_action_effect_debounced",
    		description: "Creates an effect that dispatches the passed-in fn",
    		script: "const action = typeof fn === 'string' ? {fn, graph: _graph} : (typeof fn === 'function' || (typeof fn === 'object' && fn.hasOwnProperty('fn'))) ? fn : undefined; return (dispatch, payload) => requestAnimationFrame(() => dispatch(action, payload))"
    	},
    	{
    		id: "run",
    		out: "out",
    		nodes: [
    			{
    				id: "runnable",
    				ref: "arg",
    				value: "runnable"
    			},
    			{
    				id: "args",
    				ref: "arg",
    				value: "_args"
    			},
    			{
    				id: "out",
    				script: "return _lib.no.runGraph(runnable.graph, runnable.fn, Object.assign({}, args, {runnable: undefined}, runnable.args))"
    			}
    		],
    		edges: [
    			{
    				from: "args",
    				to: "out",
    				as: "args",
    				type: "resolve"
    			},
    			{
    				from: "runnable",
    				to: "out",
    				as: "runnable"
    			}
    		]
    	},
    	{
    		id: "create_fn",
    		out: "out",
    		nodes: [
    			{
    				id: "runnable",
    				ref: "arg",
    				value: "runnable"
    			},
    			{
    				id: "args",
    				ref: "arg",
    				value: "_args"
    			},
    			{
    				id: "out",
    				script: "return (fnargs) => _lib.no.runGraph(runnable.graph, runnable.fn, Object.assign({}, args, {runnable: undefined}, runnable.args, typeof fnargs === 'object' ? fnargs : {}))"
    			}
    		],
    		edges: [
    			{
    				from: "args",
    				to: "out",
    				as: "args",
    				type: "resolve"
    			},
    			{
    				from: "runnable",
    				to: "out",
    				as: "runnable"
    			}
    		]
    	},
    	{
    		id: "runnable_hyperapp_effect",
    		out: "out",
    		nodes: [
    			{
    				id: "fn",
    				ref: "arg",
    				value: "fn"
    			},
    			{
    				id: "out",
    				script: "return (dispatch, payload) => {const wrapped_dispatch = (a, p) => Promise.resolve(p).then(resp => Promise.resolve(a).then(aresp => [aresp, resp])).then(([a, p]) => dispatch(a, p)).catch(e => dispatch(s => [{...s, error: e}])); wrapped_dispatch(state => {Promise.resolve(state).then(s => _lib.no.runGraph(fn.graph, fn.fn, {state: s, ...payload, ...fn.args, dispatch: wrapped_dispatch})); return state.error ? {...state, error: false} : state;})}"
    			}
    		],
    		edges: [
    			{
    				from: "fn",
    				to: "out",
    				as: "fn"
    			}
    		]
    	},
    	{
    		id: "run_display_graph_effect",
    		out: "out",
    		nodes: [
    			{
    				id: "state",
    				ref: "arg",
    				value: "state"
    			},
    			{
    				id: "display_graph",
    				ref: "arg",
    				value: "state.display_graph"
    			},
    			{
    				id: "payload",
    				ref: "arg",
    				value: "payload"
    			},
    			{
    				id: "dispatch",
    				ref: "arg",
    				value: "dispatch"
    			},
    			{
    				id: "display_graph_runnable",
    				script: "return {fn: 'main/out', graph: {...display_graph, nodes: [...display_graph.nodes], edges: [...display_graph.edges]}, args: {state, graph: state.display_graph, payload: {event: payload}}}"
    			},
    			{
    				id: "result_runnable",
    				script: "try { const res = _lib.no.runGraph(runnable); dispatch(s => s.error ? {...s, error: false} : s); return res; } catch(e) { dispatch(s => ({...s, error: e}));}"
    			},
    			{
    				id: "run_result",
    				ref: "runnable_hyperapp_effect"
    			},
    			{
    				id: "out",
    				script: "return (dispatch, payload) => {try { const res = _lib.no.runGraph(runnable); Promise.resolve(res).then(r => dispatch(s => r.result_display ? {...s, result_display: r.result_display, error: false} : s.error ? {...s, error: false} : s)); } catch(e) { dispatch(s => ({...s, error: e}));}}"
    			},
    			{
    				id: "_out",
    				script: "return (dispatch, payload) => {const wrapped_dispatch = (a, p) => Promise.resolve(p).then(resp => Promise.resolve(a).then(aresp => [aresp, resp])).then(([a, p]) => dispatch(a, p)).catch(e => dispatch(s => [{...s, error: e}])); wrapped_dispatch(state => {new Promise((resolve, reject) => resolve(_lib.no.runGraph({...runnable, args: {...runnable.args, dispatch: wrapped_dispatch}}))).then(res => _lib.no.runGraph(res)).catch(e => dispatch(s => [{...s, error: e}])); return state.error ? {...state, error: false} : state;})}"
    			}
    		],
    		edges: [
    			{
    				from: "state",
    				to: "result",
    				as: "state"
    			},
    			{
    				from: "payload",
    				to: "result",
    				as: "payload"
    			},
    			{
    				from: "dispatch",
    				to: "result",
    				as: "dispatch"
    			},
    			{
    				from: "display_graph",
    				to: "result",
    				as: "fn_graph"
    			},
    			{
    				from: "result",
    				to: "_out",
    				as: "fn",
    				type: "ref"
    			},
    			{
    				from: "result",
    				to: "_run_result",
    				as: "fn"
    			},
    			{
    				from: "display_graph",
    				to: "display_graph_runnable",
    				as: "display_graph"
    			},
    			{
    				from: "dispatch",
    				to: "display_graph_runnable",
    				as: "dispatch"
    			},
    			{
    				from: "payload",
    				to: "display_graph_runnable",
    				as: "payload"
    			},
    			{
    				from: "state",
    				to: "display_graph_runnable",
    				as: "state"
    			},
    			{
    				from: "display_graph_runnable",
    				to: "result_runnable",
    				as: "runnable"
    			},
    			{
    				from: "dispatch",
    				to: "result_runnable",
    				as: "dispatch"
    			},
    			{
    				from: "result_runnable",
    				to: "result_wrapper",
    				as: "fn"
    			},
    			{
    				from: "result_runnable",
    				to: "run_result",
    				as: "fn"
    			},
    			{
    				from: "display_graph_runnable",
    				to: "out",
    				as: "runnable"
    			}
    		]
    	},
    	{
    		id: "update_graph_display",
    		"in": "in",
    		out: "out",
    		nodes: [
    			{
    				id: "in"
    			},
    			{
    				id: "state",
    				ref: "arg",
    				value: "state"
    			},
    			{
    				id: "payload",
    				ref: "arg",
    				value: "payload"
    			},
    			{
    				id: "update_sim_effect",
    				ref: "arg",
    				value: "state.update_sim_effect"
    			},
    			{
    				id: "show_result",
    				ref: "arg",
    				value: "state.show_result"
    			},
    			{
    				id: "state_result",
    				ref: "arg",
    				value: "state.result"
    			},
    			{
    				id: "error_nodes",
    				ref: "arg",
    				value: "state.error_nodes"
    			},
    			{
    				id: "update_arg",
    				ref: "arg",
    				value: "state.update"
    			},
    			{
    				id: "nodes",
    				ref: "arg",
    				value: "state.nodes"
    			},
    			{
    				id: "links",
    				ref: "arg",
    				value: "state.links"
    			},
    			{
    				id: "selected",
    				ref: "arg",
    				value: "state.selected"
    			},
    			{
    				id: "readonly",
    				ref: "arg",
    				value: "state.readonly"
    			},
    			{
    				id: "html_id",
    				ref: "arg",
    				value: "state.html_id"
    			},
    			{
    				id: "norun",
    				ref: "arg",
    				value: "state.norun"
    			},
    			{
    				id: "show_args_effector",
    				ref: "show_args_effect"
    			},
    			{
    				id: "show_args_effect",
    				ref: "array"
    			},
    			{
    				id: "should_show_args",
    				ref: "switch"
    			},
    			{
    				id: "dispatch_custom_event_effect",
    				ref: "dispatch_custom_event_effect"
    			},
    			{
    				id: "in_effects",
    				ref: "arg",
    				value: "effects"
    			},
    			{
    				id: "new_effects",
    				ref: "array"
    			},
    			{
    				id: "effects",
    				ref: "concat"
    			},
    			{
    				id: "display_graph",
    				ref: "arg",
    				value: "state.display_graph"
    			},
    			{
    				id: "calculate_levels",
    				script: "return _lib.scripts.calculateLevels(nodes, links, display_graph, selected)"
    			},
    			{
    				id: "reduce_graph",
    				ref: "fuse vertices"
    			},
    			{
    				id: "levels",
    				ref: "switch",
    				args: [
    					"levels"
    				]
    			},
    			{
    				id: "levels_inputs",
    				args: [
    					"selected"
    				],
    				script: "return ['levels']"
    			},
    			{
    				id: "set_levels",
    				args: [
    					"state",
    					"levels"
    				],
    				script: "return {...state, levels: levels ?? state.levels}"
    			},
    			{
    				id: "graph_sim",
    				script: "return undefined;"
    			},
    			{
    				id: "new_state_cases",
    				script: "return [graph_sim && 'graph_sim', 'state']"
    			},
    			{
    				id: "new_state",
    				script: "return Object.assign({}, state, {nodes: graph_sim?.nodes ?? state.nodes, links: graph_sim?.links ?? state.links, levels: graph_sim?.levels ?? state.levels});"
    			},
    			{
    				id: "update",
    				script: "return update || !!display_graph || !!selected"
    			},
    			{
    				id: "run",
    				ref: "run_display_graph_effect"
    			},
    			{
    				id: "run_wrapper"
    			},
    			{
    				id: "out",
    				script: "return {state, effects: [!readonly && (!!update || !!update_graph_sim) && [update_sim_effect, state], !readonly && [dispatch_custom_event_effect, {html_id, event: 'updategraph', detail: {graph: state.display_graph}}], ...(effects?.filter(e => e?.[0]) ?? [])]}"
    			}
    		],
    		edges: [
    			{
    				from: "update_arg",
    				to: "update",
    				as: "update"
    			},
    			{
    				from: "state",
    				to: "set_levels",
    				as: "state"
    			},
    			{
    				from: "in",
    				to: "levels_inputs"
    			},
    			{
    				from: "in",
    				to: "graph"
    			},
    			{
    				from: "display_graph",
    				to: "reduce_graph",
    				as: "graph"
    			},
    			{
    				from: "payload",
    				to: "run",
    				as: "payload"
    			},
    			{
    				from: "display_graph",
    				to: "run",
    				as: "display_graph"
    			},
    			{
    				from: "html_id",
    				to: "run",
    				as: "html_id"
    			},
    			{
    				from: "nodes",
    				to: "calculate_levels",
    				as: "nodes"
    			},
    			{
    				from: "links",
    				to: "calculate_levels",
    				as: "links"
    			},
    			{
    				from: "selected",
    				to: "calculate_levels",
    				as: "selected"
    			},
    			{
    				from: "display_graph",
    				to: "calculate_levels",
    				as: "display_graph"
    			},
    			{
    				from: "calculate_levels",
    				to: "levels",
    				as: "levels"
    			},
    			{
    				from: "levels",
    				to: "set_levels",
    				as: "levels"
    			},
    			{
    				from: "set_levels",
    				to: "new_state",
    				as: "state"
    			},
    			{
    				from: "levels_inputs",
    				to: "levels",
    				as: "input"
    			},
    			{
    				from: "graph_sim",
    				to: "new_state",
    				as: "graph_sim"
    			},
    			{
    				from: "error_nodes",
    				to: "run",
    				as: "error_nodes"
    			},
    			{
    				from: "state_result",
    				to: "run",
    				as: "prev_result"
    			},
    			{
    				from: "run",
    				to: "result",
    				as: "run"
    			},
    			{
    				from: "norun",
    				to: "out",
    				as: "norun"
    			},
    			{
    				from: "show_result",
    				to: "out",
    				as: "show_result"
    			},
    			{
    				from: "run",
    				to: "run_wrapper",
    				as: "run"
    			},
    			{
    				from: "run_wrapper",
    				to: "out",
    				as: "run"
    			},
    			{
    				from: "readonly",
    				to: "out",
    				as: "readonly"
    			},
    			{
    				from: "selected",
    				to: "update",
    				as: "selected"
    			},
    			{
    				from: "display_graph",
    				to: "update",
    				as: "display_graph"
    			},
    			{
    				from: "update",
    				to: "out",
    				as: "update"
    			},
    			{
    				from: "readonly",
    				to: "should_show_args",
    				as: "input"
    			},
    			{
    				from: "show_args_effector",
    				to: "show_args_effect",
    				as: "a0"
    			},
    			{
    				from: "show_args_effect",
    				to: "should_show_args",
    				as: "false"
    			},
    			{
    				from: "should_show_args",
    				to: "new_effects",
    				as: "a0"
    			},
    			{
    				from: "new_effects",
    				to: "effects",
    				as: "array"
    			},
    			{
    				from: "in_effects",
    				to: "effects",
    				as: "items"
    			},
    			{
    				from: "payload",
    				to: "out",
    				as: "payload"
    			},
    			{
    				from: "html_id",
    				to: "out",
    				as: "html_id"
    			},
    			{
    				from: "display_graph",
    				to: "out",
    				as: "display_graph"
    			},
    			{
    				from: "effects",
    				to: "out",
    				as: "effects",
    				type: "resolve"
    			},
    			{
    				from: "dispatch_custom_event_effect",
    				to: "out",
    				as: "dispatch_custom_event_effect"
    			},
    			{
    				from: "update_sim_effect",
    				to: "out",
    				as: "update_sim_effect"
    			},
    			{
    				from: "new_state",
    				to: "out",
    				as: "state"
    			}
    		]
    	},
    	{
    		id: "reduce",
    		name: "reduce",
    		"in": "m3b5wg3",
    		out: "tgurdpo",
    		nodes: [
    			{
    				id: "tgurdpo",
    				ref: "call",
    				name: "out"
    			},
    			{
    				id: "m3b5wg3",
    				name: "in"
    			},
    			{
    				id: "rielyq8",
    				value: "reduce",
    				name: "rielyq8"
    			},
    			{
    				ref: "arg",
    				id: "1rre4bx",
    				value: "array",
    				name: "1rre4bx"
    			},
    			{
    				ref: "arg",
    				id: "6g75abk",
    				value: "fn",
    				name: "6g75abk"
    			},
    			{
    				id: "w0zzawl",
    				ref: "array",
    				name: "w0zzawl"
    			},
    			{
    				id: "args",
    				ref: "arg",
    				value: "_args"
    			},
    			{
    				id: "pdljod1",
    				name: "pdljod1",
    				script: "return (previous, current, index, array) => _lib.no.runGraph(fn?.graph ?? _graph, fn?.fn ?? fn, Object.assign({}, args, {previous, current, index, array}));"
    			},
    			{
    				id: "2lvs5dj",
    				script: "return _graph",
    				name: "2lvs5dj"
    			}
    		],
    		edges: [
    			{
    				from: "m3b5wg3",
    				to: "tgurdpo",
    				as: "args",
    				type: "ref"
    			},
    			{
    				from: "rielyq8",
    				to: "tgurdpo",
    				as: "fn"
    			},
    			{
    				from: "1rre4bx",
    				to: "tgurdpo",
    				as: "self"
    			},
    			{
    				from: "w0zzawl",
    				to: "tgurdpo",
    				as: "args",
    				type: "resolve"
    			},
    			{
    				from: "pdljod1",
    				to: "w0zzawl",
    				as: "a0"
    			},
    			{
    				from: "2lvs5dj",
    				to: "pdljod1",
    				as: "graph"
    			},
    			{
    				from: "args",
    				to: "pdljod1",
    				as: "args"
    			},
    			{
    				from: "6g75abk",
    				to: "pdljod1",
    				as: "fn"
    			}
    		]
    	},
    	{
    		id: "map",
    		name: "map",
    		"in": "m3b5wg3",
    		out: "tgurdpo",
    		nodes: [
    			{
    				id: "tgurdpo",
    				ref: "call",
    				name: "out"
    			},
    			{
    				id: "m3b5wg3",
    				name: "in"
    			},
    			{
    				id: "rielyq8",
    				value: "map",
    				name: "rielyq8"
    			},
    			{
    				ref: "arg",
    				id: "1rre4bx",
    				value: "array",
    				name: "1rre4bx"
    			},
    			{
    				ref: "arg",
    				id: "6g75abk",
    				value: "fn",
    				name: "6g75abk"
    			},
    			{
    				id: "w0zzawl",
    				ref: "array",
    				name: "w0zzawl"
    			},
    			{
    				id: "args",
    				ref: "arg",
    				value: "args"
    			},
    			{
    				id: "pdljod1",
    				name: "pdljod1",
    				script: "return (element, index, array) => _lib.no.runGraph(fn?.graph ?? _graph, fn?.fn ?? fn, Object.assign({}, fn.args, args, {element, index, array}));"
    			},
    			{
    				id: "2lvs5dj",
    				script: "return _graph",
    				name: "2lvs5dj"
    			}
    		],
    		edges: [
    			{
    				from: "m3b5wg3",
    				to: "tgurdpo",
    				as: "args",
    				type: "ref"
    			},
    			{
    				from: "rielyq8",
    				to: "tgurdpo",
    				as: "fn"
    			},
    			{
    				from: "1rre4bx",
    				to: "tgurdpo",
    				as: "self"
    			},
    			{
    				from: "w0zzawl",
    				to: "tgurdpo",
    				as: "args",
    				type: "resolve"
    			},
    			{
    				from: "pdljod1",
    				to: "w0zzawl",
    				as: "a0"
    			},
    			{
    				from: "2lvs5dj",
    				to: "pdljod1",
    				as: "graph"
    			},
    			{
    				from: "args",
    				to: "pdljod1",
    				as: "args"
    			},
    			{
    				from: "6g75abk",
    				to: "pdljod1",
    				as: "fn"
    			}
    		]
    	},
    	{
    		id: "toggle",
    		name: "toggle",
    		"in": "itrzmbe",
    		out: "nn4twx9",
    		nodes: [
    			{
    				id: "nn4twx9",
    				ref: "html_element",
    				inputs: [
    					{
    						from: "lvzwtzi",
    						to: "nn4twx9",
    						as: "children"
    					},
    					{
    						from: "t6q6rvf",
    						to: "nn4twx9",
    						as: "props"
    					},
    					{
    						from: "tchu5kq",
    						to: "nn4twx9",
    						as: "dom_type"
    					}
    				],
    				name: "out"
    			},
    			{
    				id: "lvzwtzi",
    				ref: "array"
    			},
    			{
    				id: "t6q6rvf"
    			},
    			{
    				id: "tchu5kq",
    				value: "button"
    			},
    			{
    				id: "583nwco",
    				name: "in"
    			},
    			{
    				id: "itrzmbe",
    				name: "in"
    			},
    			{
    				id: "vmehp75/h4hkmke",
    				ref: "html_text",
    				name: "button_text"
    			},
    			{
    				id: "punpbfw",
    				ref: "execute_graph",
    				name: "onclick_fn"
    			},
    			{
    				id: "2aqvso8",
    				ref: "arg",
    				value: "value"
    			},
    			{
    				id: "teuf938",
    				ref: "arg",
    				value: "value"
    			},
    			{
    				id: "1067z1h",
    				ref: "array"
    			},
    			{
    				id: "b8q8y2q",
    				ref: "array"
    			},
    			{
    				id: "pprukwn",
    				ref: "set"
    			},
    			{
    				id: "zu0hb6e",
    				ref: "arg",
    				value: "0.update_hyperapp"
    			},
    			{
    				id: "eo8hxkq",
    				script: "return !toggle;"
    			},
    			{
    				id: "s6847dx",
    				ref: "arg",
    				value: "0"
    			},
    			{
    				id: "5g3gdi1",
    				script: "return 'result.' + value;"
    			},
    			{
    				id: "flcuh31",
    				ref: "get"
    			},
    			{
    				id: "0eoq13n",
    				ref: "arg",
    				value: "value"
    			},
    			{
    				id: "ysqu0jj",
    				ref: "arg",
    				value: "0.result"
    			},
    			{
    				id: "8ji5lb6",
    				ref: "arg",
    				value: "value"
    			}
    		],
    		edges: [
    			{
    				from: "lvzwtzi",
    				to: "nn4twx9",
    				as: "children"
    			},
    			{
    				from: "t6q6rvf",
    				to: "nn4twx9",
    				as: "props"
    			},
    			{
    				from: "tchu5kq",
    				to: "nn4twx9",
    				as: "dom_type"
    			},
    			{
    				from: "583nwco",
    				to: "nn4twx9",
    				as: "arg3"
    			},
    			{
    				from: "itrzmbe",
    				to: "nn4twx9",
    				as: "arg4"
    			},
    			{
    				to: "lvzwtzi",
    				from: "vmehp75/h4hkmke",
    				as: "arg1"
    			},
    			{
    				from: "punpbfw",
    				to: "t6q6rvf",
    				as: "onclick"
    			},
    			{
    				from: "2aqvso8",
    				to: "vmehp75/h4hkmke",
    				as: "text"
    			},
    			{
    				from: "teuf938",
    				to: "punpbfw",
    				as: "value"
    			},
    			{
    				from: "1067z1h",
    				to: "punpbfw",
    				as: "fn",
    				type: "ref"
    			},
    			{
    				from: "b8q8y2q",
    				to: "1067z1h",
    				as: "arg1"
    			},
    			{
    				from: "pprukwn",
    				to: "1067z1h",
    				as: "arg0"
    			},
    			{
    				from: "zu0hb6e",
    				to: "b8q8y2q",
    				as: "update_hyperapp"
    			},
    			{
    				from: "eo8hxkq",
    				to: "pprukwn",
    				as: "value"
    			},
    			{
    				from: "s6847dx",
    				to: "pprukwn",
    				as: "target"
    			},
    			{
    				from: "5g3gdi1",
    				to: "pprukwn",
    				as: "path"
    			},
    			{
    				from: "flcuh31",
    				to: "eo8hxkq",
    				as: "toggle"
    			},
    			{
    				from: "0eoq13n",
    				to: "5g3gdi1",
    				as: "value"
    			},
    			{
    				from: "ysqu0jj",
    				to: "flcuh31",
    				as: "target"
    			},
    			{
    				from: "8ji5lb6",
    				to: "flcuh31",
    				as: "path"
    			}
    		]
    	},
    	{
    		id: "sequence",
    		name: "sequence",
    		out: "out",
    		nodes: [
    			{
    				id: "in"
    			},
    			{
    				id: "args",
    				ref: "arg",
    				value: "_args"
    			},
    			{
    				id: "runnable_args",
    				ref: "arg",
    				value: "_args"
    			},
    			{
    				id: "value_args",
    				ref: "arg",
    				value: "args"
    			},
    			{
    				id: "context_args",
    				ref: "arg",
    				value: "_args"
    			},
    			{
    				id: "merged_args",
    				ref: "merge_objects"
    			},
    			{
    				id: "args_path",
    				value: "args"
    			},
    			{
    				id: "seq_runnable_args",
    				ref: "delete"
    			},
    			{
    				name: "in",
    				id: "in"
    			},
    			{
    				id: "runnables_promise",
    				script: "return Promise.all(promises);"
    			},
    			{
    				id: "map_runnables",
    				ref: "map"
    			},
    			{
    				id: "runnables",
    				script: "const runnables = Object.entries(inputs).filter(e => e[0] !== 'args').map(e => [e[0], e[1] && e[1]._Proxy ? e[1]._value : e[1]]).filter(r => r[1] && r[1].hasOwnProperty('fn') && r[1].hasOwnProperty('graph')); const filtered_args = Object.fromEntries(Object.entries(args).filter(a => !runnables.find(r => r[0] === a[0]))); return runnables.map(r => r[1]).map(r => ({...r, args: {...r.args, ...filtered_args}}))"
    			},
    			{
    				id: "element",
    				ref: "arg",
    				value: "element",
    				type: "internal"
    			},
    			{
    				id: "map_fn",
    				script: "return new Promise((resolve, reject) => resolve(_lib.no.runGraph(runnable.graph, runnable.fn, runnable.args)));"
    			},
    			{
    				id: "map_fn_runnable",
    				ref: "runnable"
    			},
    			{
    				name: "seq_runnable",
    				id: "out",
    				ref: "runnable"
    			}
    		],
    		edges: [
    			{
    				from: "in",
    				to: "runnables",
    				as: "inputs"
    			},
    			{
    				from: "args",
    				to: "runnables",
    				as: "args"
    			},
    			{
    				from: "element",
    				to: "map_fn",
    				as: "runnable"
    			},
    			{
    				from: "map_fn",
    				to: "map_fn_runnable",
    				as: "fn"
    			},
    			{
    				from: "runnable_args",
    				to: "map_runnables",
    				as: "args"
    			},
    			{
    				from: "runnables",
    				to: "map_runnables",
    				as: "array"
    			},
    			{
    				from: "map_fn_runnable",
    				to: "map_runnables",
    				as: "fn"
    			},
    			{
    				from: "map_runnables",
    				to: "runnables_promise",
    				as: "promises"
    			},
    			{
    				from: "runnables_promise",
    				to: "out",
    				as: "fn"
    			},
    			{
    				from: "context_args",
    				to: "merged_args",
    				as: "a0"
    			},
    			{
    				from: "value_args",
    				to: "merged_args",
    				as: "a1"
    			},
    			{
    				from: "merged_args",
    				to: "seq_runnable_args",
    				as: "target"
    			},
    			{
    				from: "args_path",
    				to: "seq_runnable_args",
    				as: "path"
    			},
    			{
    				from: "seq_runnable_args",
    				to: "out",
    				as: "args"
    			}
    		]
    	},
    	{
    		id: "import_json",
    		name: "import_json",
    		"in": "j5hwdot",
    		out: "06osgt6",
    		nodes: [
    			{
    				id: "06osgt6",
    				ref: "initial_state_runnable",
    				name: "out"
    			},
    			{
    				id: "lx2r71d",
    				ref: "runnable"
    			},
    			{
    				id: "j5hwdot",
    				name: "in"
    			},
    			{
    				id: "upzmz7i",
    				script: "return 'imports.' + name"
    			},
    			{
    				id: "hfgitu2",
    				ref: "run"
    			},
    			{
    				id: "i68oe5k"
    			},
    			{
    				id: "qomntld",
    				ref: "arg",
    				value: "name"
    			},
    			{
    				id: "hgo86cn",
    				ref: "runnable"
    			},
    			{
    				id: "7m3jfmy",
    				ref: "arg",
    				value: "name"
    			},
    			{
    				id: "z9zvilt",
    				ref: "arg",
    				value: "url"
    			},
    			{
    				id: "f89a5u2"
    			},
    			{
    				id: "1v653xe",
    				ref: "get"
    			},
    			{
    				id: "my879k4",
    				ref: "call"
    			},
    			{
    				id: "gfpdf11",
    				ref: "arg",
    				value: "name"
    			},
    			{
    				id: "23kbk1n",
    				ref: "run"
    			},
    			{
    				id: "71ppowa",
    				script: "return \"1\";"
    			},
    			{
    				id: "mzijca2",
    				ref: "fetch"
    			},
    			{
    				id: "vdfrqzc",
    				value: "json"
    			},
    			{
    				id: "83xy8y2",
    				ref: "sequence"
    			},
    			{
    				id: "5hat6g2",
    				ref: "arg",
    				value: "url"
    			},
    			{
    				id: "olx0rqo",
    				ref: "runnable"
    			},
    			{
    				id: "9swjqs2",
    				ref: "runnable"
    			},
    			{
    				id: "cbahtxj"
    			},
    			{
    				id: "jpuj66z",
    				ref: "dispatch_runnable"
    			},
    			{
    				id: "rfmgm5u",
    				ref: "arg",
    				value: "imported_graph",
    				type: "internal"
    			},
    			{
    				id: "jrt3ao3",
    				ref: "arg",
    				value: "name",
    				type: "internal"
    			},
    			{
    				id: "830e6rx",
    				ref: "arg",
    				value: "imported_graph",
    				type: "internal"
    			},
    			{
    				id: "4qd7fl3",
    				ref: "runnable"
    			},
    			{
    				id: "sae69iz"
    			},
    			{
    				id: "j6g4jd4"
    			},
    			{
    				id: "um99k99",
    				ref: "arg",
    				value: "imported_graph",
    				type: "internal"
    			},
    			{
    				id: "z2ccs2u",
    				ref: "arg",
    				value: "name"
    			},
    			{
    				id: "xl0tqsd",
    				ref: "set"
    			},
    			{
    				id: "sajmrbs",
    				value: "display_graph"
    			},
    			{
    				id: "i50d0rl",
    				ref: "set"
    			},
    			{
    				id: "59iaxzp",
    				ref: "arg",
    				value: "state",
    				type: "internal"
    			},
    			{
    				id: "pfe7svb",
    				ref: "arg",
    				value: "state.display_graph",
    				type: "internal"
    			},
    			{
    				id: "dsqrh2d",
    				value: "nodes"
    			},
    			{
    				id: "9zfxac6",
    				ref: "append"
    			},
    			{
    				id: "2zvxan2",
    				ref: "map"
    			},
    			{
    				id: "hrzgjqm",
    				script: "return nodes.filter(n => !n.id.startsWith(imported_id)).concat([{id: imported_id}]);"
    			},
    			{
    				id: "a8x8a5c",
    				ref: "arg",
    				value: "payload.imported_graph.nodes",
    				type: "internal"
    			},
    			{
    				id: "d4yl375",
    				ref: "runnable"
    			},
    			{
    				id: "2f1lyvz",
    				ref: "arg",
    				value: "state.display_graph.nodes",
    				type: "internal"
    			},
    			{
    				id: "oco33oy",
    				ref: "arg",
    				value: "payload.name",
    				type: "internal"
    			},
    			{
    				id: "55qulh4",
    				ref: "set"
    			},
    			{
    				id: "4az2m7o"
    			},
    			{
    				id: "ugtx81k",
    				ref: "arg",
    				value: "element",
    				type: "internal"
    			},
    			{
    				id: "2eq7kuu",
    				value: "id"
    			},
    			{
    				id: "2tekj7w",
    				script: "return imported_id + '.' + node_id;"
    			},
    			{
    				id: "2xt8tpx",
    				ref: "arg",
    				value: "payload.name",
    				type: "internal"
    			},
    			{
    				id: "og27c4d",
    				ref: "arg",
    				value: "imported_id",
    				type: "internal"
    			},
    			{
    				id: "aodmtk1",
    				ref: "arg",
    				value: "element.id",
    				type: "internal"
    			}
    		],
    		edges: [
    			{
    				from: "lx2r71d",
    				to: "06osgt6",
    				as: "fn"
    			},
    			{
    				from: "j5hwdot",
    				to: "06osgt6",
    				as: "_"
    			},
    			{
    				from: "upzmz7i",
    				to: "06osgt6",
    				as: "value"
    			},
    			{
    				from: "hfgitu2",
    				to: "lx2r71d",
    				as: "fn"
    			},
    			{
    				from: "i68oe5k",
    				to: "lx2r71d",
    				as: "args"
    			},
    			{
    				from: "qomntld",
    				to: "upzmz7i",
    				as: "name"
    			},
    			{
    				from: "hgo86cn",
    				to: "hfgitu2",
    				as: "runnable"
    			},
    			{
    				from: "7m3jfmy",
    				to: "i68oe5k",
    				as: "name"
    			},
    			{
    				from: "z9zvilt",
    				to: "i68oe5k",
    				as: "url"
    			},
    			{
    				from: "f89a5u2",
    				to: "hgo86cn",
    				as: "args"
    			},
    			{
    				from: "1v653xe",
    				to: "hgo86cn",
    				as: "fn"
    			},
    			{
    				from: "my879k4",
    				to: "f89a5u2",
    				as: "imported_graph"
    			},
    			{
    				from: "gfpdf11",
    				to: "f89a5u2",
    				as: "name"
    			},
    			{
    				from: "23kbk1n",
    				to: "1v653xe",
    				as: "target"
    			},
    			{
    				from: "71ppowa",
    				to: "1v653xe",
    				as: "path"
    			},
    			{
    				from: "mzijca2",
    				to: "my879k4",
    				as: "self"
    			},
    			{
    				from: "vdfrqzc",
    				to: "my879k4",
    				as: "fn"
    			},
    			{
    				from: "83xy8y2",
    				to: "23kbk1n",
    				as: "runnable"
    			},
    			{
    				from: "5hat6g2",
    				to: "mzijca2",
    				as: "url"
    			},
    			{
    				from: "olx0rqo",
    				to: "83xy8y2",
    				as: "arg0"
    			},
    			{
    				from: "9swjqs2",
    				to: "83xy8y2",
    				as: "arg1"
    			},
    			{
    				from: "cbahtxj",
    				to: "83xy8y2",
    				as: "args"
    			},
    			{
    				from: "jpuj66z",
    				to: "olx0rqo",
    				as: "fn"
    			},
    			{
    				from: "rfmgm5u",
    				to: "9swjqs2",
    				as: "fn"
    			},
    			{
    				from: "jrt3ao3",
    				to: "cbahtxj",
    				as: "name"
    			},
    			{
    				from: "830e6rx",
    				to: "cbahtxj",
    				as: "imported_graph"
    			},
    			{
    				from: "4qd7fl3",
    				to: "jpuj66z",
    				as: "fn"
    			},
    			{
    				from: "sae69iz",
    				to: "4qd7fl3",
    				as: "args"
    			},
    			{
    				from: "j6g4jd4",
    				to: "4qd7fl3",
    				as: "fn"
    			},
    			{
    				from: "um99k99",
    				to: "sae69iz",
    				as: "imported_graph"
    			},
    			{
    				from: "z2ccs2u",
    				to: "sae69iz",
    				as: "name"
    			},
    			{
    				from: "xl0tqsd",
    				to: "j6g4jd4",
    				as: "state"
    			},
    			{
    				from: "sajmrbs",
    				to: "xl0tqsd",
    				as: "path"
    			},
    			{
    				from: "i50d0rl",
    				to: "xl0tqsd",
    				as: "value"
    			},
    			{
    				from: "59iaxzp",
    				to: "xl0tqsd",
    				as: "target"
    			},
    			{
    				from: "pfe7svb",
    				to: "i50d0rl",
    				as: "target"
    			},
    			{
    				from: "dsqrh2d",
    				to: "i50d0rl",
    				as: "path"
    			},
    			{
    				from: "9zfxac6",
    				to: "i50d0rl",
    				as: "value"
    			},
    			{
    				from: "2zvxan2",
    				to: "9zfxac6",
    				as: "item"
    			},
    			{
    				from: "hrzgjqm",
    				to: "9zfxac6",
    				as: "array"
    			},
    			{
    				from: "a8x8a5c",
    				to: "2zvxan2",
    				as: "array"
    			},
    			{
    				from: "d4yl375",
    				to: "2zvxan2",
    				as: "fn"
    			},
    			{
    				from: "2f1lyvz",
    				to: "hrzgjqm",
    				as: "nodes"
    			},
    			{
    				from: "oco33oy",
    				to: "hrzgjqm",
    				as: "imported_id"
    			},
    			{
    				from: "55qulh4",
    				to: "d4yl375",
    				as: "fn"
    			},
    			{
    				from: "4az2m7o",
    				to: "d4yl375",
    				as: "args"
    			},
    			{
    				from: "ugtx81k",
    				to: "55qulh4",
    				as: "target"
    			},
    			{
    				from: "2eq7kuu",
    				to: "55qulh4",
    				as: "path"
    			},
    			{
    				from: "2tekj7w",
    				to: "55qulh4",
    				as: "value"
    			},
    			{
    				from: "2xt8tpx",
    				to: "4az2m7o",
    				as: "imported_id"
    			},
    			{
    				from: "og27c4d",
    				to: "2tekj7w",
    				as: "imported_id"
    			},
    			{
    				from: "aodmtk1",
    				to: "2tekj7w",
    				as: "node_id"
    			}
    		]
    	},
    	{
    		id: "initial_state_runnable",
    		name: "initial_state_runnable",
    		"in": "0tsqw11",
    		out: "pd64cr8",
    		nodes: [
    			{
    				name: "out",
    				id: "pd64cr8",
    				ref: "default"
    			},
    			{
    				id: "usd4433",
    				name: "modify_state_runnable",
    				ref: "modify_state_runnable"
    			},
    			{
    				id: "0tsqw11",
    				name: "in"
    			},
    			{
    				id: "6rdgk5r",
    				ref: "get"
    			},
    			{
    				id: "4g0xgt3",
    				value: "value",
    				ref: "arg"
    			},
    			{
    				id: "itmdest",
    				value: "fn",
    				ref: "arg"
    			},
    			{
    				id: "s5ns82c",
    				ref: "arg",
    				value: "state"
    			},
    			{
    				id: "eb0nj9q",
    				ref: "arg",
    				value: "value"
    			}
    		],
    		edges: [
    			{
    				from: "usd4433",
    				to: "pd64cr8",
    				as: "otherwise"
    			},
    			{
    				from: "0tsqw11",
    				to: "pd64cr8",
    				as: "_"
    			},
    			{
    				from: "6rdgk5r",
    				to: "pd64cr8",
    				as: "value"
    			},
    			{
    				from: "4g0xgt3",
    				to: "usd4433",
    				as: "value"
    			},
    			{
    				from: "itmdest",
    				to: "usd4433",
    				as: "fn"
    			},
    			{
    				from: "s5ns82c",
    				to: "6rdgk5r",
    				as: "target"
    			},
    			{
    				from: "eb0nj9q",
    				to: "6rdgk5r",
    				as: "path"
    			}
    		]
    	},
    	{
    		id: "modify_state_runnable",
    		name: "modify_state_runnable",
    		"in": "0tke7mk",
    		out: "4k16rxs",
    		nodes: [
    			{
    				id: "4k16rxs",
    				ref: "runnable",
    				name: "out"
    			},
    			{
    				id: "17hgmhe",
    				ref: "dispatch_runnable"
    			},
    			{
    				id: "0tke7mk",
    				name: "in"
    			},
    			{
    				id: "qsm5fqf"
    			},
    			{
    				id: "6i1lek8",
    				ref: "runnable"
    			},
    			{
    				id: "ecixhbu",
    				ref: "arg",
    				value: "value"
    			},
    			{
    				id: "3d6xwzp",
    				ref: "arg",
    				value: "fn"
    			},
    			{
    				id: "ysv47a4",
    				ref: "arg",
    				value: "state"
    			},
    			{
    				id: "yl8sikb"
    			},
    			{
    				id: "4hrg1ky"
    			},
    			{
    				id: "ywscm67",
    				ref: "set"
    			},
    			{
    				id: "hsgqfec",
    				ref: "arg",
    				value: "value"
    			},
    			{
    				id: "a5z6wdp",
    				ref: "run"
    			},
    			{
    				id: "vjtdfop",
    				ref: "arg",
    				value: "payload.value"
    			},
    			{
    				id: "hej7g0o",
    				ref: "arg",
    				value: "payload.state_value"
    			},
    			{
    				id: "bohly2o",
    				ref: "arg",
    				value: "state"
    			},
    			{
    				id: "y65mfa8",
    				ref: "set"
    			},
    			{
    				id: "tmsibf6",
    				ref: "merge_objects"
    			},
    			{
    				id: "dkoqs5x",
    				value: "args"
    			},
    			{
    				id: "zmexk3x",
    				ref: "arg",
    				value: "fn"
    			},
    			{
    				id: "nl97w9x"
    			},
    			{
    				id: "oz8h5rr",
    				ref: "arg",
    				value: "fn.args"
    			},
    			{
    				id: "5g3mq34",
    				ref: "arg",
    				value: "dispatch"
    			},
    			{
    				id: "jdxnymc",
    				ref: "arg",
    				value: "payload"
    			},
    			{
    				id: "69fs5ao",
    				ref: "get"
    			},
    			{
    				id: "lsjg9ew",
    				ref: "arg",
    				value: "state"
    			},
    			{
    				id: "vc4ejyt",
    				ref: "arg",
    				value: "state"
    			},
    			{
    				id: "n3riawv",
    				ref: "arg",
    				value: "value"
    			}
    		],
    		edges: [
    			{
    				from: "17hgmhe",
    				to: "4k16rxs",
    				as: "fn"
    			},
    			{
    				from: "0tke7mk",
    				to: "4k16rxs",
    				as: "arg0"
    			},
    			{
    				from: "qsm5fqf",
    				to: "4k16rxs",
    				as: "args"
    			},
    			{
    				from: "6i1lek8",
    				to: "17hgmhe",
    				as: "fn"
    			},
    			{
    				from: "ecixhbu",
    				to: "qsm5fqf",
    				as: "value"
    			},
    			{
    				from: "3d6xwzp",
    				to: "qsm5fqf",
    				as: "fn"
    			},
    			{
    				from: "ysv47a4",
    				to: "qsm5fqf",
    				as: "state"
    			},
    			{
    				from: "yl8sikb",
    				to: "6i1lek8",
    				as: "fn"
    			},
    			{
    				from: "4hrg1ky",
    				to: "6i1lek8",
    				as: "args"
    			},
    			{
    				from: "ywscm67",
    				to: "yl8sikb",
    				as: "state"
    			},
    			{
    				from: "hsgqfec",
    				to: "4hrg1ky",
    				as: "value"
    			},
    			{
    				from: "a5z6wdp",
    				to: "4hrg1ky",
    				as: "state_value"
    			},
    			{
    				from: "vjtdfop",
    				to: "ywscm67",
    				as: "path"
    			},
    			{
    				from: "hej7g0o",
    				to: "ywscm67",
    				as: "value"
    			},
    			{
    				from: "bohly2o",
    				to: "ywscm67",
    				as: "target"
    			},
    			{
    				from: "y65mfa8",
    				to: "a5z6wdp",
    				as: "runnable"
    			},
    			{
    				from: "tmsibf6",
    				to: "y65mfa8",
    				as: "value"
    			},
    			{
    				from: "dkoqs5x",
    				to: "y65mfa8",
    				as: "path"
    			},
    			{
    				from: "zmexk3x",
    				to: "y65mfa8",
    				as: "target"
    			},
    			{
    				from: "nl97w9x",
    				to: "tmsibf6",
    				as: "arg0"
    			},
    			{
    				from: "oz8h5rr",
    				to: "tmsibf6",
    				as: "arg1"
    			},
    			{
    				from: "5g3mq34",
    				to: "nl97w9x",
    				as: "dispatch"
    			},
    			{
    				from: "jdxnymc",
    				to: "nl97w9x",
    				as: "payload"
    			},
    			{
    				from: "69fs5ao",
    				to: "nl97w9x",
    				as: "state_value"
    			},
    			{
    				from: "lsjg9ew",
    				to: "nl97w9x",
    				as: "state"
    			},
    			{
    				from: "vc4ejyt",
    				to: "69fs5ao",
    				as: "target"
    			},
    			{
    				from: "n3riawv",
    				to: "69fs5ao",
    				as: "path"
    			}
    		]
    	},
    	{
    		id: "object_entries",
    		name: "object_entries",
    		"in": "tkd4tqn",
    		out: "j8c79uf",
    		nodes: [
    			{
    				name: "out",
    				id: "j8c79uf",
    				ref: "filter"
    			},
    			{
    				id: "tkd4tqn",
    				name: "in"
    			},
    			{
    				id: "hfexsuu",
    				script: "return !key?.startsWith('_');"
    			},
    			{
    				id: "bgi2g37",
    				script: "return Object.entries(obj)"
    			},
    			{
    				id: "7gqcw0o",
    				ref: "arg",
    				value: "0.0"
    			},
    			{
    				id: "kpakw50",
    				ref: "arg",
    				value: "object"
    			}
    		],
    		edges: [
    			{
    				from: "tkd4tqn",
    				to: "j8c79uf",
    				as: "arr"
    			},
    			{
    				from: "hfexsuu",
    				to: "j8c79uf",
    				as: "fn",
    				type: "ref"
    			},
    			{
    				from: "bgi2g37",
    				to: "j8c79uf",
    				as: "arr"
    			},
    			{
    				from: "7gqcw0o",
    				to: "hfexsuu",
    				as: "key"
    			},
    			{
    				from: "kpakw50",
    				to: "bgi2g37",
    				as: "obj"
    			}
    		]
    	},
    	{
    		id: "css_styles",
    		name: "css_styles",
    		"in": "xw3pmx7",
    		out: "5yxmxua",
    		nodes: [
    			{
    				id: "5yxmxua",
    				ref: "html_element",
    				name: "out"
    			},
    			{
    				id: "vgv61zj",
    				ref: "html_text"
    			},
    			{
    				id: "jstjx7g"
    			},
    			{
    				id: "h40e3j9",
    				value: "style"
    			},
    			{
    				id: "xw3pmx7",
    				name: "in"
    			},
    			{
    				id: "jlgp7uy",
    				ref: "call"
    			},
    			{
    				id: "o1j78dd",
    				value: "result-view"
    			},
    			{
    				id: "ij4z84e",
    				ref: "map"
    			},
    			{
    				id: "q3pwj9j",
    				value: "join"
    			},
    			{
    				id: "d6h3gdw",
    				ref: "array"
    			},
    			{
    				id: "j8c79uf",
    				name: "object_entries",
    				ref: "object_entries"
    			},
    			{
    				id: "aelf1a7",
    				script: "return key + '{' + value + '}'"
    			},
    			{
    				id: "z63iaay",
    				script: "return \"\\n\";"
    			},
    			{
    				id: "vwsgweb",
    				ref: "default"
    			},
    			{
    				id: "5eqf77t",
    				value: "element.0",
    				ref: "arg"
    			},
    			{
    				id: "1hpnid4",
    				ref: "call"
    			},
    			{
    				id: "mkwx4yx"
    			},
    			{
    				id: "fzr4mkv",
    				ref: "arg",
    				value: "css_object"
    			},
    			{
    				id: "bbbp82v",
    				ref: "map"
    			},
    			{
    				id: "cp66ig5",
    				value: "join"
    			},
    			{
    				id: "uwq9u81",
    				ref: "array"
    			},
    			{
    				id: "i1ifamx",
    				ref: "object_entries"
    			},
    			{
    				id: "0d4yh8u",
    				script: "return key + ': ' + value + \";\";"
    			},
    			{
    				id: "gth1wc2",
    				script: "return \"\\n\";"
    			},
    			{
    				id: "y25dg2n",
    				value: "element.1",
    				ref: "arg"
    			},
    			{
    				id: "h13a9fd",
    				ref: "arg",
    				value: "element.0"
    			},
    			{
    				id: "h7me3v8",
    				ref: "arg",
    				value: "element.1"
    			}
    		],
    		edges: [
    			{
    				from: "vgv61zj",
    				to: "5yxmxua",
    				as: "children"
    			},
    			{
    				from: "jstjx7g",
    				to: "5yxmxua",
    				as: "props"
    			},
    			{
    				from: "h40e3j9",
    				to: "5yxmxua",
    				as: "dom_type"
    			},
    			{
    				from: "xw3pmx7",
    				to: "5yxmxua",
    				as: "arg3"
    			},
    			{
    				from: "jlgp7uy",
    				to: "vgv61zj",
    				as: "text"
    			},
    			{
    				from: "o1j78dd",
    				to: "jstjx7g",
    				as: "key"
    			},
    			{
    				from: "ij4z84e",
    				to: "jlgp7uy",
    				as: "self"
    			},
    			{
    				from: "q3pwj9j",
    				to: "jlgp7uy",
    				as: "fn"
    			},
    			{
    				from: "d6h3gdw",
    				to: "jlgp7uy",
    				as: "args"
    			},
    			{
    				from: "j8c79uf",
    				to: "ij4z84e",
    				as: "array"
    			},
    			{
    				from: "aelf1a7",
    				to: "ij4z84e",
    				as: "fn",
    				type: "ref"
    			},
    			{
    				from: "z63iaay",
    				to: "d6h3gdw",
    				as: "arg0"
    			},
    			{
    				from: "vwsgweb",
    				to: "j8c79uf",
    				as: "object"
    			},
    			{
    				from: "5eqf77t",
    				to: "aelf1a7",
    				as: "key"
    			},
    			{
    				from: "1hpnid4",
    				to: "aelf1a7",
    				as: "value"
    			},
    			{
    				from: "mkwx4yx",
    				to: "vwsgweb",
    				as: "otherwise"
    			},
    			{
    				from: "fzr4mkv",
    				to: "vwsgweb",
    				as: "value"
    			},
    			{
    				from: "bbbp82v",
    				to: "1hpnid4",
    				as: "self"
    			},
    			{
    				from: "cp66ig5",
    				to: "1hpnid4",
    				as: "fn"
    			},
    			{
    				from: "uwq9u81",
    				to: "1hpnid4",
    				as: "args"
    			},
    			{
    				from: "i1ifamx",
    				to: "bbbp82v",
    				as: "array"
    			},
    			{
    				from: "0d4yh8u",
    				to: "bbbp82v",
    				as: "fn",
    				type: "ref"
    			},
    			{
    				from: "gth1wc2",
    				to: "uwq9u81",
    				as: "arg0"
    			},
    			{
    				from: "y25dg2n",
    				to: "i1ifamx",
    				as: "object"
    			},
    			{
    				from: "h13a9fd",
    				to: "0d4yh8u",
    				as: "key"
    			},
    			{
    				from: "h7me3v8",
    				to: "0d4yh8u",
    				as: "value"
    			}
    		]
    	},
    	{
    		id: "set_display",
    		name: "set_display",
    		description: "Use like an html_element to add html to the page.",
    		"in": "fkp4pck/wb73q0h",
    		out: "a59hci8",
    		nodes: [
    			{
    				name: "out",
    				id: "a59hci8",
    				ref: "sequence"
    			},
    			{
    				id: "da71z9c/2435ihf/jd1mc84",
    				name: "modify_state_runnable",
    				ref: "modify_state_runnable"
    			},
    			{
    				id: "fkp4pck/wb73q0h",
    				name: "in"
    			},
    			{
    				id: "da71z9c/2435ihf/jd1mc84/a59hci8/da71z9c/2435ihf/y4qbl8k",
    				value: "result_display"
    			},
    			{
    				id: "da71z9c/2435ihf/jd1mc84/a59hci8/da71z9c/2435ihf/lol0vdh",
    				ref: "runnable"
    			},
    			{
    				id: "da71z9c/2435ihf/jd1mc84/a59hci8/da71z9c/2435ihf/w8vpdfx",
    				ref: "html_element"
    			},
    			{
    				id: "da71z9c/2435ihf/jd1mc84/a59hci8/da71z9c/2435ihf/vofecaa",
    				ref: "arg",
    				value: "props"
    			},
    			{
    				id: "da71z9c/2435ihf/jd1mc84/a59hci8/da71z9c/2435ihf/j8qudts",
    				ref: "arg",
    				value: "children"
    			},
    			{
    				id: "da71z9c/2435ihf/jd1mc84/a59hci8/da71z9c/2435ihf/iead5y3",
    				ref: "arg",
    				value: "dom_type"
    			}
    		],
    		edges: [
    			{
    				from: "da71z9c/2435ihf/jd1mc84",
    				to: "a59hci8",
    				as: "arg0"
    			},
    			{
    				to: "a59hci8",
    				from: "fkp4pck/wb73q0h",
    				as: "arg1"
    			},
    			{
    				from: "da71z9c/2435ihf/jd1mc84/a59hci8/da71z9c/2435ihf/y4qbl8k",
    				to: "da71z9c/2435ihf/jd1mc84",
    				as: "value"
    			},
    			{
    				from: "da71z9c/2435ihf/jd1mc84/a59hci8/da71z9c/2435ihf/lol0vdh",
    				to: "da71z9c/2435ihf/jd1mc84",
    				as: "fn"
    			},
    			{
    				from: "da71z9c/2435ihf/jd1mc84/a59hci8/da71z9c/2435ihf/w8vpdfx",
    				to: "da71z9c/2435ihf/jd1mc84/a59hci8/da71z9c/2435ihf/lol0vdh",
    				as: "fn"
    			},
    			{
    				from: "da71z9c/2435ihf/jd1mc84/a59hci8/da71z9c/2435ihf/vofecaa",
    				to: "da71z9c/2435ihf/jd1mc84/a59hci8/da71z9c/2435ihf/w8vpdfx",
    				as: "props"
    			},
    			{
    				from: "da71z9c/2435ihf/jd1mc84/a59hci8/da71z9c/2435ihf/j8qudts",
    				to: "da71z9c/2435ihf/jd1mc84/a59hci8/da71z9c/2435ihf/w8vpdfx",
    				as: "children"
    			},
    			{
    				from: "da71z9c/2435ihf/jd1mc84/a59hci8/da71z9c/2435ihf/iead5y3",
    				to: "da71z9c/2435ihf/jd1mc84/a59hci8/da71z9c/2435ihf/w8vpdfx",
    				as: "dom_type"
    			}
    		]
    	},
    	{
    		id: "input",
    		name: "input",
    		"in": "7rhq0q5",
    		out: "nn4twx9",
    		nodes: [
    			{
    				id: "nn4twx9",
    				ref: "html_element",
    				inputs: [
    					{
    						from: "bw4iez5/gvkhkfw",
    						to: "bw4iez5/nn4twx9",
    						as: "children"
    					},
    					{
    						from: "bw4iez5/7rhq0q5",
    						to: "bw4iez5/nn4twx9",
    						as: "props"
    					}
    				],
    				name: "out"
    			},
    			{
    				id: "gvkhkfw",
    				ref: "array"
    			},
    			{
    				id: "7rhq0q5",
    				name: "in"
    			},
    			{
    				id: "4972gx3",
    				ref: "html_element"
    			},
    			{
    				id: "1ldhfah",
    				ref: "html_element",
    				name: "label"
    			},
    			{
    				id: "ee5i5r2",
    				value: "input"
    			},
    			{
    				id: "ro8n2gc",
    				ref: "merge_objects"
    			},
    			{
    				id: "wet0jdv",
    				ref: "array"
    			},
    			{
    				id: "gcuxiw9"
    			},
    			{
    				id: "875c1wk",
    				value: "label"
    			},
    			{
    				id: "t6q6rvf"
    			},
    			{
    				id: "rjwtb3c",
    				ref: "default"
    			},
    			{
    				id: "utkc9o6",
    				ref: "html_text"
    			},
    			{
    				id: "jxl9r29",
    				script: "return \"input-\" + value;"
    			},
    			{
    				id: "2zxw9oo",
    				ref: "execute_graph",
    				name: "stop_propagation"
    			},
    			{
    				id: "i7y9dyy",
    				script: "return (state, payload) => [{...state, [value]: payload.target.value}, onchange_fn && [_ => dispatch(onchange_fn)]]"
    			},
    			{
    				id: "vks4vul",
    				ref: "arg",
    				value: "props"
    			},
    			{
    				id: "ddfgy2s"
    			},
    			{
    				id: "trd8ptp",
    				ref: "arg",
    				value: "value"
    			},
    			{
    				id: "zfrrk0z",
    				ref: "arg",
    				value: "value"
    			},
    			{
    				id: "qseh2tb",
    				ref: "array"
    			},
    			{
    				id: "b0j8nyq",
    				ref: "arg",
    				value: "dispatch"
    			},
    			{
    				id: "eotod0l",
    				ref: "sequence"
    			},
    			{
    				id: "qxwvdfe",
    				ref: "arg",
    				value: "value"
    			},
    			{
    				id: "0dnqo5l",
    				ref: "arg",
    				value: "onchange_fn"
    			},
    			{
    				id: "1wps21n",
    				name: "stop propagation effect",
    				out: "hj2cig0",
    				nodes: [
    					{
    						id: "hj2cig0",
    						ref: "array",
    						name: "stop propagation effect"
    					},
    					{
    						id: "1pvaim9",
    						ref: "execute_graph"
    					},
    					{
    						id: "0o86xp3",
    						ref: "arg",
    						value: "1"
    					},
    					{
    						id: "d60jwms",
    						script: "payload.stopPropagation();"
    					},
    					{
    						id: "xgbubrq",
    						ref: "arg",
    						value: "1"
    					}
    				],
    				edges: [
    					{
    						from: "1pvaim9",
    						to: "hj2cig0",
    						as: "a0"
    					},
    					{
    						from: "0o86xp3",
    						to: "hj2cig0",
    						as: "a1"
    					},
    					{
    						from: "d60jwms",
    						to: "1pvaim9",
    						as: "fn",
    						type: "ref"
    					},
    					{
    						from: "xgbubrq",
    						to: "d60jwms",
    						as: "payload"
    					}
    				]
    			},
    			{
    				id: "y5q7mbn",
    				ref: "arg",
    				value: "0"
    			},
    			{
    				id: "qjc0zt6",
    				ref: "modify_state_runnable"
    			},
    			{
    				id: "widk6u6",
    				ref: "runnable"
    			},
    			{
    				id: "506ntvb",
    				ref: "arg",
    				value: "value"
    			},
    			{
    				id: "4ck1vaf",
    				ref: "arg",
    				value: "payload.target.value"
    			}
    		],
    		edges: [
    			{
    				from: "gvkhkfw",
    				to: "nn4twx9",
    				as: "children"
    			},
    			{
    				from: "7rhq0q5",
    				to: "nn4twx9",
    				as: "_"
    			},
    			{
    				from: "4972gx3",
    				to: "gvkhkfw",
    				as: "arg1"
    			},
    			{
    				from: "1ldhfah",
    				to: "gvkhkfw",
    				as: "arg0"
    			},
    			{
    				from: "ee5i5r2",
    				to: "4972gx3",
    				as: "dom_type"
    			},
    			{
    				from: "ro8n2gc",
    				to: "4972gx3",
    				as: "props"
    			},
    			{
    				from: "wet0jdv",
    				to: "1ldhfah",
    				as: "children"
    			},
    			{
    				from: "gcuxiw9",
    				to: "1ldhfah",
    				as: "props"
    			},
    			{
    				from: "875c1wk",
    				to: "1ldhfah",
    				as: "dom_type"
    			},
    			{
    				from: "t6q6rvf",
    				to: "ro8n2gc",
    				as: "arg0"
    			},
    			{
    				from: "rjwtb3c",
    				to: "ro8n2gc",
    				as: "props"
    			},
    			{
    				from: "utkc9o6",
    				to: "wet0jdv",
    				as: "arg0"
    			},
    			{
    				from: "jxl9r29",
    				to: "gcuxiw9",
    				as: "for"
    			},
    			{
    				from: "2zxw9oo",
    				to: "t6q6rvf",
    				as: "onkeydown"
    			},
    			{
    				from: "i7y9dyy",
    				to: "t6q6rvf",
    				as: "onchange"
    			},
    			{
    				from: "vks4vul",
    				to: "rjwtb3c",
    				as: "value"
    			},
    			{
    				from: "ddfgy2s",
    				to: "rjwtb3c",
    				as: "otherwise"
    			},
    			{
    				from: "trd8ptp",
    				to: "utkc9o6",
    				as: "text"
    			},
    			{
    				from: "zfrrk0z",
    				to: "jxl9r29",
    				as: "value"
    			},
    			{
    				to: "2zxw9oo",
    				from: "qseh2tb",
    				as: "fn",
    				type: "ref"
    			},
    			{
    				from: "b0j8nyq",
    				to: "i7y9dyy",
    				as: "dispatch"
    			},
    			{
    				from: "eotod0l",
    				to: "i7y9dyy",
    				as: "seq"
    			},
    			{
    				from: "qxwvdfe",
    				to: "i7y9dyy",
    				as: "value"
    			},
    			{
    				from: "0dnqo5l",
    				to: "i7y9dyy",
    				as: "onchange_fn"
    			},
    			{
    				from: "1wps21n",
    				to: "qseh2tb",
    				as: "a1"
    			},
    			{
    				from: "y5q7mbn",
    				to: "qseh2tb",
    				as: "a0"
    			},
    			{
    				from: "qjc0zt6",
    				to: "eotod0l",
    				as: "arg"
    			},
    			{
    				from: "widk6u6",
    				to: "qjc0zt6",
    				as: "fn"
    			},
    			{
    				from: "506ntvb",
    				to: "qjc0zt6",
    				as: "value"
    			},
    			{
    				from: "4ck1vaf",
    				to: "widk6u6",
    				as: "fn"
    			}
    		]
    	},
    	{
    		id: "html_text",
    		description: "Some HTML plaintext. Usually used as a child of html_element.",
    		out: "out",
    		nodes: [
    			{
    				id: "in"
    			},
    			{
    				id: "text",
    				ref: "arg",
    				value: "text"
    			},
    			{
    				id: "text_value",
    				value: "text_value"
    			},
    			{
    				id: "out"
    			}
    		],
    		edges: [
    			{
    				from: "in",
    				to: "out",
    				as: "_",
    				type: "ref"
    			},
    			{
    				from: "text_value",
    				to: "out",
    				as: "dom_type"
    			},
    			{
    				from: "text",
    				to: "out",
    				as: "text"
    			}
    		]
    	},
    	{
    		id: "html_element",
    		description: "An HTML Element. `children` is an array of html_element or html_text, `props` are the attributes for the html element as an object.",
    		nodes: [
    			{
    				id: "in"
    			},
    			{
    				id: "children",
    				ref: "arg",
    				value: "children"
    			},
    			{
    				id: "props",
    				ref: "arg",
    				value: "props"
    			},
    			{
    				id: "dom_type",
    				ref: "arg",
    				value: "dom_type"
    			},
    			{
    				id: "div",
    				value: "div"
    			},
    			{
    				id: "fill_children",
    				script: "return children === undefined ? [] : children.length !== undefined ? children.filter(c => !!c).map(c => c.el ?? c) : [children.el ?? children]"
    			},
    			{
    				id: "fill_props",
    				script: "return props ?? {}"
    			},
    			{
    				id: "dom_type_def",
    				ref: "default"
    			},
    			{
    				id: "out",
    				script: "if(!(typeof dom_type === 'string' && Array.isArray(children))){ throw new Error('invalid element');} children.filter(c => c).forEach(c => {if(typeof c.dom_type !== 'string'){throw new Error ('invalid child element');}}); return {el: {dom_type, props, children}}"
    			}
    		],
    		edges: [
    			{
    				from: "children",
    				to: "fill_children",
    				as: "children"
    			},
    			{
    				from: "props",
    				to: "fill_props",
    				as: "props",
    				type: "resolve"
    			},
    			{
    				from: "fill_children",
    				to: "out",
    				as: "children",
    				type: "resolve"
    			},
    			{
    				from: "fill_props",
    				to: "out",
    				as: "props"
    			},
    			{
    				from: "dom_type",
    				to: "dom_type_def",
    				as: "value"
    			},
    			{
    				from: "div",
    				to: "dom_type_def",
    				as: "otherwise"
    			},
    			{
    				from: "dom_type_def",
    				to: "out",
    				as: "dom_type"
    			},
    			{
    				from: "in",
    				to: "out",
    				as: "args",
    				type: "ref"
    			}
    		]
    	},
    	{
    		id: "icon",
    		name: "icon",
    		out: "c2sko9c",
    		nodes: [
    			{
    				id: "c2sko9c",
    				ref: "html_element",
    				name: "ionicon"
    			},
    			{
    				id: "2lr3ihi",
    				value: "ion-icon"
    			},
    			{
    				id: "empty_obj",
    				value: {
    				}
    			},
    			{
    				id: "props",
    				ref: "arg",
    				value: "props"
    			},
    			{
    				id: "defined_props",
    				ref: "if"
    			},
    			{
    				id: "name_path",
    				value: "name"
    			},
    			{
    				id: "a0jb5es",
    				ref: "set"
    			},
    			{
    				id: "s5x2r1f",
    				ref: "arg",
    				value: "icon"
    			}
    		],
    		edges: [
    			{
    				from: "2lr3ihi",
    				to: "c2sko9c",
    				as: "dom_type"
    			},
    			{
    				from: "props",
    				to: "defined_props",
    				as: "true"
    			},
    			{
    				from: "props",
    				to: "defined_props",
    				as: "pred"
    			},
    			{
    				from: "empty_obj",
    				to: "defined_props",
    				as: "false"
    			},
    			{
    				from: "defined_props",
    				to: "a0jb5es",
    				as: "target"
    			},
    			{
    				from: "name_path",
    				to: "a0jb5es",
    				as: "path"
    			},
    			{
    				from: "a0jb5es",
    				to: "c2sko9c",
    				as: "props"
    			},
    			{
    				from: "s5x2r1f",
    				to: "a0jb5es",
    				as: "value"
    			}
    		]
    	},
    	{
    		id: "add_circle_icon",
    		out: "out",
    		nodes: [
    			{
    				id: "in_props",
    				ref: "arg",
    				value: "props"
    			},
    			{
    				id: "viewbox_props",
    				value: {
    					viewBox: "0 0 512 512"
    				}
    			},
    			{
    				id: "props",
    				ref: "merge_objects"
    			},
    			{
    				id: "svg",
    				value: "svg"
    			},
    			{
    				id: "path",
    				value: "path"
    			},
    			{
    				id: "add_props",
    				value: {
    					d: "M256 176v160M336 256H176",
    					"class": "add"
    				}
    			},
    			{
    				id: "add",
    				ref: "html_element"
    			},
    			{
    				id: "circle_props",
    				value: {
    					d: "M448 256c0-106-86-192-192-192S64 150 64 256s86 192 192 192 192-86 192-192z",
    					"class": "circle"
    				}
    			},
    			{
    				id: "circle",
    				ref: "html_element"
    			},
    			{
    				id: "children",
    				ref: "array"
    			},
    			{
    				id: "out",
    				ref: "html_element"
    			}
    		],
    		edges: [
    			{
    				from: "add_props",
    				to: "add",
    				as: "props"
    			},
    			{
    				from: "circle_props",
    				to: "circle",
    				as: "props"
    			},
    			{
    				from: "add",
    				to: "children",
    				as: "a1"
    			},
    			{
    				from: "circle",
    				to: "children",
    				as: "a0"
    			},
    			{
    				from: "path",
    				to: "add",
    				as: "dom_type"
    			},
    			{
    				from: "path",
    				to: "circle",
    				as: "dom_type"
    			},
    			{
    				from: "svg",
    				to: "out",
    				as: "dom_type"
    			},
    			{
    				from: "children",
    				to: "out",
    				as: "children"
    			},
    			{
    				from: "in_props",
    				to: "props",
    				as: "o1"
    			},
    			{
    				from: "viewbox_props",
    				to: "props",
    				as: "o2"
    			},
    			{
    				from: "props",
    				to: "out",
    				as: "props"
    			}
    		]
    	},
    	{
    		id: "run_h",
    		"in": "in",
    		out: "out",
    		nodes: [
    			{
    				id: "in"
    			},
    			{
    				id: "dom_type",
    				ref: "arg",
    				value: "dom_type"
    			},
    			{
    				id: "props",
    				ref: "arg",
    				value: "props"
    			},
    			{
    				id: "children",
    				ref: "arg",
    				value: "children"
    			},
    			{
    				id: "graph",
    				ref: "arg",
    				value: "graph"
    			},
    			{
    				id: "text",
    				ref: "arg",
    				value: "text"
    			},
    			{
    				id: "mapped_children",
    				script: "let run_graph = {...graph, in: 'run_h/in', out: 'run_h'}; const fn = _lib.no.executeGraphValue({graph: run_graph}); return (children?.filter(c => !!c) ?? []).map(c => ({...c, graph: run_graph})).map(fn).filter(c => c).map(c => c.el ?? c);"
    			},
    			{
    				id: "out_h",
    				extern: "ha.h"
    			},
    			{
    				id: "out_text",
    				extern: "ha.text"
    			},
    			{
    				id: "els"
    			},
    			{
    				id: "out_input",
    				args: [
    					"dom_type"
    				],
    				script: "return dom_type === 'text_value' ? 'h_text' : 'h'"
    			},
    			{
    				id: "out_el",
    				ref: "switch"
    			},
    			{
    				id: "out"
    			}
    		],
    		edges: [
    			{
    				from: "in",
    				to: "out",
    				as: "_",
    				type: "ref"
    			},
    			{
    				from: "dom_type",
    				to: "out_input",
    				as: "dom_type"
    			},
    			{
    				from: "dom_type",
    				to: "out_h",
    				as: "dom_type"
    			},
    			{
    				from: "children",
    				to: "mapped_children",
    				as: "children"
    			},
    			{
    				from: "mapped_children",
    				to: "out_h",
    				as: "children"
    			},
    			{
    				from: "props",
    				to: "out_h",
    				as: "props"
    			},
    			{
    				from: "graph",
    				to: "mapped_children",
    				as: "graph"
    			},
    			{
    				from: "text",
    				to: "out_text",
    				as: "text",
    				type: "resolve"
    			},
    			{
    				from: "out_text",
    				to: "out_el",
    				as: "h_text"
    			},
    			{
    				from: "out_h",
    				to: "out_el",
    				as: "h"
    			},
    			{
    				from: "out_input",
    				to: "out_el",
    				as: "input"
    			},
    			{
    				from: "out_el",
    				to: "out",
    				as: "el",
    				type: "resolve"
    			}
    		]
    	},
    	{
    		id: "expand_contract",
    		nodes: [
    			{
    				id: "in"
    			},
    			{
    				id: "node_id",
    				ref: "arg",
    				value: "node_id"
    			},
    			{
    				id: "display_graph",
    				ref: "arg",
    				value: "display_graph"
    			},
    			{
    				id: "display_graph_out",
    				ref: "arg",
    				value: "display_graph_out"
    			},
    			{
    				id: "selected_node",
    				script: "return display_graph.nodes.find(n => n.id === selected)"
    			},
    			{
    				id: "expand_contract_result_inputs",
    				script: "return expandable ? 'expand' : contractable ? 'contract' : undefined"
    			},
    			{
    				id: "selected",
    				script: "return [contract] ?? [expand]"
    			},
    			{
    				id: "expand_contract_result",
    				ref: "switch"
    			},
    			{
    				id: "get_name",
    				script: "return node.name"
    			},
    			{
    				id: "expandable_id",
    				script: "return node.id ? node.id + '/' + out : undefined"
    			},
    			{
    				id: "contractable_id",
    				script: "node_id = name ?? node_id; return !node_id ? undefined : node_id.endsWith('/out') ? node_id.substring(0, node_id.lastIndexOf('/')) : node_id.lastIndexOf('/') >= 0 ? node_id.substring(0, node_id.lastIndexOf('/')) : node_id"
    			},
    			{
    				id: "expand",
    				script: "return display_graph && node_id ? _lib.scripts.expand_node({display_graph, node_id}) : []"
    			},
    			{
    				id: "contract",
    				script: "return display_graph && node_id ? _lib.scripts.contract_node({display_graph, node_id, name, node_name}) : []"
    			},
    			{
    				id: "has_nodes",
    				script: "return !!display_graph.nodes.find(n => n.id === node_id).nodes"
    			},
    			{
    				id: "is_contractable",
    				script: "return !has_nodes"
    			},
    			{
    				id: "out",
    				ref: "default"
    			}
    		],
    		edges: [
    			{
    				from: "in",
    				to: "out",
    				as: "args",
    				type: "ref"
    			},
    			{
    				from: "node_id",
    				to: "selected_node",
    				as: "selected"
    			},
    			{
    				from: "display_graph",
    				to: "selected_node",
    				as: "display_graph"
    			},
    			{
    				from: "display_graph",
    				to: "has_nodes",
    				as: "display_graph"
    			},
    			{
    				from: "node_id",
    				to: "has_nodes",
    				as: "node_id"
    			},
    			{
    				from: "display_graph",
    				to: "contract",
    				as: "display_graph"
    			},
    			{
    				from: "node_id",
    				to: "contract",
    				as: "node_id"
    			},
    			{
    				from: "node_id",
    				to: "expand",
    				as: "node_id"
    			},
    			{
    				from: "display_graph",
    				to: "expand",
    				as: "display_graph"
    			},
    			{
    				from: "has_nodes",
    				to: "is_contractable",
    				as: "has_nodes"
    			},
    			{
    				from: "selected_node",
    				to: "get_name",
    				as: "node"
    			},
    			{
    				from: "selected_node",
    				to: "expandable_id",
    				as: "node"
    			},
    			{
    				from: "display_graph_out",
    				to: "expandable_id",
    				as: "out"
    			},
    			{
    				from: "selected_node",
    				to: "contract",
    				as: "node"
    			},
    			{
    				from: "get_name",
    				to: "contract",
    				as: "node_name"
    			},
    			{
    				from: "contractable_id",
    				to: "contract",
    				as: "name"
    			},
    			{
    				from: "get_name",
    				to: "is_contractable",
    				as: "name"
    			},
    			{
    				from: "node_id",
    				to: "contractable_id",
    				as: "node_id"
    			},
    			{
    				from: "get_name",
    				to: "contractable_id",
    				as: "name"
    			},
    			{
    				from: "contractable_id",
    				to: "selected",
    				as: "contract"
    			},
    			{
    				from: "expandable_id",
    				to: "selected",
    				as: "expand"
    			},
    			{
    				from: "has_nodes",
    				to: "expand_contract_result_inputs",
    				as: "expandable"
    			},
    			{
    				from: "is_contractable",
    				to: "expand_contract_result_inputs",
    				as: "contractable"
    			},
    			{
    				from: "expand_contract_result_inputs",
    				to: "selected",
    				as: "input"
    			},
    			{
    				from: "expand_contract_result_inputs",
    				to: "expand_contract_result",
    				as: "input"
    			},
    			{
    				from: "selected",
    				to: "expand_contract_result",
    				as: "selected"
    			},
    			{
    				from: "expand",
    				to: "expand_contract_result",
    				as: "expand"
    			},
    			{
    				from: "contract",
    				to: "expand_contract_result",
    				as: "contract"
    			},
    			{
    				from: "expand_contract_result",
    				to: "out",
    				as: "value"
    			},
    			{
    				from: "in",
    				to: "out",
    				as: "otherwise"
    			}
    		]
    	},
    	{
    		id: "default_node_display",
    		name: "default_node_display",
    		"in": "6pqqchhnk",
    		out: "tsxlng4gd",
    		nodes: [
    			{
    				id: "tsxlng4gd",
    				ref: "html_element",
    				name: "default_node_display"
    			},
    			{
    				id: "osgrk7ddu",
    				args: [
    				],
    				ref: "html_text"
    			},
    			{
    				id: "hghirvcml",
    				args: [
    				],
    				value: "pre"
    			},
    			{
    				id: "ha6b5qttf",
    				args: [
    					"data"
    				],
    				script: "return JSON.stringify({node: data.node, result: data.result}, null, 2)"
    			},
    			{
    				id: "6pqqchhnk",
    				name: "default_node_display/in"
    			}
    		],
    		edges: [
    			{
    				from: "osgrk7ddu",
    				to: "tsxlng4gd",
    				as: "children"
    			},
    			{
    				from: "hghirvcml",
    				to: "tsxlng4gd",
    				as: "dom_type"
    			},
    			{
    				from: "ha6b5qttf",
    				to: "osgrk7ddu",
    				as: "text"
    			},
    			{
    				from: "6pqqchhnk",
    				to: "ha6b5qttf",
    				as: "data"
    			}
    		]
    	},
    	{
    		id: "graph_display",
    		name: "graph_display",
    		"in": "in",
    		out: "out",
    		nodes: [
    			{
    				id: "out",
    				ref: "html_element",
    				name: "graph_display"
    			},
    			{
    				id: "ml655hs73",
    				args: [
    				],
    				value: "pre"
    			},
    			{
    				id: "thsez3hy1",
    				args: [
    				],
    				ref: "html_text"
    			},
    			{
    				id: "stringify",
    				args: [
    					"data"
    				],
    				script: "return JSON.stringify({...data.node, nodes: data.node.nodes.length, edges:data.node.edges.length, result: data.result}, null, 2)"
    			},
    			{
    				id: "in"
    			}
    		],
    		edges: [
    			{
    				from: "ml655hs73",
    				to: "out",
    				as: "dom_type"
    			},
    			{
    				from: "thsez3hy1",
    				to: "out",
    				as: "children"
    			},
    			{
    				from: "stringify",
    				to: "thsez3hy1",
    				as: "text"
    			},
    			{
    				from: "in",
    				to: "stringify",
    				as: "data"
    			},
    			{
    				from: "in",
    				to: "stringify",
    				as: "data"
    			}
    		]
    	},
    	{
    		id: "number_display",
    		name: "number_display",
    		"in": "6pqqchhnk",
    		out: "tsxlng4gd",
    		nodes: [
    			{
    				id: "tsxlng4gd",
    				args: [
    				],
    				ref: "html_element",
    				name: "number_display"
    			},
    			{
    				id: "hghirvcml",
    				args: [
    				],
    				value: "input"
    			},
    			{
    				id: "cd571vftv"
    			},
    			{
    				id: "h5xzkeoql",
    				args: [
    				],
    				value: {
    					ref: "number"
    				}
    			},
    			{
    				id: "ltncqmqe9",
    				args: [
    				],
    				ref: "get"
    			},
    			{
    				id: "9kkegcpi2",
    				args: [
    				],
    				ref: "execute_graph"
    			},
    			{
    				id: "e96vv0gpq",
    				args: [
    				],
    				value: "node.value"
    			},
    			{
    				id: "tw41k3wzg",
    				args: [
    				],
    				ref: "get"
    			},
    			{
    				id: "u9feks2l9",
    				args: [
    				],
    				ref: "update_graph_display"
    			},
    			{
    				id: "6pqqchhnk",
    				args: [
    				],
    				name: "number_display/in"
    			},
    			{
    				id: "yxaspmy5c",
    				args: [
    				],
    				value: "graph"
    			},
    			{
    				id: "rhzddw3c6",
    				args: [
    				],
    				ref: "set"
    			},
    			{
    				id: "8jmaa71ct",
    				args: [
    				],
    				script: "return arg0 !== arg1;"
    			},
    			{
    				id: "w5lqhh9qr",
    				args: [
    				],
    				value: "value"
    			},
    			{
    				id: "es0e6as0j",
    				args: [
    				],
    				ref: "get",
    				name: "get target value"
    			},
    			{
    				id: "vnta2m4py",
    				args: [
    				],
    				ref: "get"
    			},
    			{
    				id: "gh99zvhy2",
    				args: [
    				],
    				value: "1.target.valueAsNumber",
    				name: "target valueasnum"
    			},
    			{
    				id: "88f3s3qrq",
    				args: [
    				],
    				value: "value"
    			},
    			{
    				id: "fxbdw1jrr",
    				args: [
    				],
    				ref: "selected_node"
    			},
    			{
    				id: "pkih97fsa",
    				args: [
    				],
    				ref: "get",
    				name: "state"
    			},
    			{
    				id: "mbbx3d26q",
    				args: [
    				]
    			},
    			{
    				id: "vbwsmt7jt",
    				args: [
    				],
    				value: 0
    			}
    		],
    		edges: [
    			{
    				from: "hghirvcml",
    				to: "tsxlng4gd",
    				as: "dom_type"
    			},
    			{
    				from: "cd571vftv",
    				to: "tsxlng4gd",
    				as: "props"
    			},
    			{
    				from: "h5xzkeoql",
    				to: "cd571vftv"
    			},
    			{
    				from: "ltncqmqe9",
    				to: "cd571vftv",
    				as: "value"
    			},
    			{
    				from: "9kkegcpi2",
    				to: "cd571vftv",
    				as: "oninput"
    			},
    			{
    				from: "e96vv0gpq",
    				to: "ltncqmqe9",
    				as: "path"
    			},
    			{
    				from: "tw41k3wzg",
    				to: "9kkegcpi2",
    				as: "graph"
    			},
    			{
    				from: "u9feks2l9",
    				to: "9kkegcpi2",
    				as: "fn",
    				type: "ref"
    			},
    			{
    				from: "6pqqchhnk",
    				to: "ltncqmqe9",
    				as: "target"
    			},
    			{
    				from: "6pqqchhnk",
    				to: "tw41k3wzg",
    				as: "target"
    			},
    			{
    				from: "yxaspmy5c",
    				to: "tw41k3wzg",
    				as: "path"
    			},
    			{
    				from: "rhzddw3c6",
    				to: "u9feks2l9",
    				as: "node"
    			},
    			{
    				from: "8jmaa71ct",
    				to: "u9feks2l9",
    				as: "update_graph_display"
    			},
    			{
    				from: "w5lqhh9qr",
    				to: "rhzddw3c6",
    				as: "path"
    			},
    			{
    				from: "es0e6as0j",
    				to: "rhzddw3c6",
    				as: "value"
    			},
    			{
    				from: "vnta2m4py",
    				to: "8jmaa71ct",
    				as: "arg0"
    			},
    			{
    				from: "es0e6as0j",
    				to: "8jmaa71ct",
    				as: "arg1"
    			},
    			{
    				from: "gh99zvhy2",
    				to: "es0e6as0j",
    				as: "path"
    			},
    			{
    				from: "88f3s3qrq",
    				to: "vnta2m4py",
    				as: "path"
    			},
    			{
    				from: "fxbdw1jrr",
    				to: "rhzddw3c6",
    				as: "target"
    			},
    			{
    				from: "fxbdw1jrr",
    				to: "vnta2m4py",
    				as: "target"
    			},
    			{
    				from: "mbbx3d26q",
    				to: "pkih97fsa",
    				as: "target"
    			},
    			{
    				from: "mbbx3d26q",
    				to: "9kkegcpi2",
    				as: "in_node",
    				type: "ref"
    			},
    			{
    				from: "mbbx3d26q",
    				to: "es0e6as0j",
    				as: "target"
    			},
    			{
    				from: "pkih97fsa",
    				to: "u9feks2l9"
    			},
    			{
    				from: "pkih97fsa",
    				to: "fxbdw1jrr"
    			},
    			{
    				from: "vbwsmt7jt",
    				to: "pkih97fsa",
    				as: "path"
    			}
    		]
    	},
    	{
    		id: "default_error_display",
    		"in": "in",
    		out: "out",
    		nodes: [
    			{
    				id: "in"
    			},
    			{
    				id: "stringify",
    				args: [
    					"data"
    				],
    				script: "const e = data.error; return JSON.stringify({error: e instanceof AggregateError ? e.errors.map(e => e.toString()).join(\" \") : e.toString(), data}, null, 2)"
    			},
    			{
    				id: "text",
    				ref: "html_text"
    			},
    			{
    				id: "out_dom_type",
    				value: "pre"
    			},
    			{
    				id: "out",
    				ref: "html_element"
    			}
    		],
    		edges: [
    			{
    				from: "in",
    				to: "stringify",
    				as: "data"
    			},
    			{
    				from: "stringify",
    				to: "text",
    				as: "text"
    			},
    			{
    				from: "text",
    				to: "out",
    				as: "children",
    				type: "resolve"
    			},
    			{
    				from: "out_dom_type",
    				to: "out",
    				as: "dom_type"
    			}
    		]
    	},
    	{
    		id: "not",
    		args: [
    			"target"
    		],
    		script: "return !target"
    	},
    	{
    		id: "data",
    		value: "data"
    	},
    	{
    		id: "graph",
    		value: "graph"
    	},
    	{
    		id: "display_graph",
    		value: "display_graph"
    	},
    	{
    		id: "nodes",
    		value: "nodes"
    	},
    	{
    		id: "readonly",
    		ref: "arg",
    		value: "readonly"
    	},
    	{
    		id: "norun",
    		ref: "arg",
    		value: "norun"
    	},
    	{
    		id: "hash",
    		ref: "arg",
    		value: "hash"
    	},
    	{
    		id: "static",
    		ref: "arg",
    		value: "static"
    	},
    	{
    		id: "hide_types",
    		ref: "arg",
    		value: "hide_types"
    	},
    	{
    		id: "graph_nodes",
    		value: [
    			[
    				"graph",
    				"nodes"
    			]
    		]
    	},
    	{
    		id: "initial_state",
    		value: {
    			nodes: [
    			],
    			links: [
    			],
    			editing: false,
    			search: false,
    			show_all: false,
    			show_result: false,
    			node_el_width: 256,
    			args_display: false,
    			imports: {
    			},
    			history: [
    			],
    			redo_history: [
    			]
    		}
    	},
    	{
    		id: "dimensions",
    		ref: "arg",
    		value: "dimensions"
    	},
    	{
    		id: "error_nodes",
    		script: "return new Map()"
    	},
    	{
    		id: "hyperapp_init_state"
    	},
    	{
    		id: "calculate_levels",
    		script: "return _lib.scripts.calculateLevels([], [], display_graph, selected)"
    	},
    	{
    		id: "get_graph",
    		ref: "arg",
    		value: "graph"
    	},
    	{
    		id: "get_display_graph",
    		ref: "arg",
    		value: "display_graph"
    	},
    	{
    		id: "display_graph_out",
    		ref: "arg",
    		value: "display_graph.out"
    	},
    	{
    		id: "init_selected",
    		ref: "array"
    	},
    	{
    		id: "hyperapp_view",
    		ref: "execute_graph"
    	},
    	{
    		id: "update_hyperapp",
    		ref: "update_graph_display"
    	},
    	{
    		id: "update_hyperapp_action",
    		ref: "hyperapp_action"
    	},
    	{
    		id: "update_hyperapp_effect",
    		ref: "hyperapp_action_effect"
    	},
    	{
    		id: "html_id",
    		ref: "arg",
    		value: "html_id"
    	},
    	{
    		id: "examples",
    		ref: "arg",
    		value: "examples"
    	},
    	{
    		id: "initialize_hyperapp_app",
    		ref: "hyperapp_app"
    	},
    	{
    		id: "out"
    	},
    	{
    		id: "nodes",
    		ref: "arg",
    		value: "nodes"
    	},
    	{
    		id: "links",
    		ref: "arg",
    		value: "links"
    	},
    	{
    		id: "graph_to_simulation",
    		args: [
    			"nodes",
    			"links",
    			"display_graph",
    			"selected",
    			"levels"
    		],
    		ref: "graph_to_sim_fn",
    		_script: "return _lib.scripts.graphToSimulationNodes({display_graph, nodes, links, selected, levels})"
    	},
    	{
    		id: "sim_to_hyperapp",
    		ref: "sim_to_hyperapp_action"
    	},
    	{
    		id: "sim_to_hyperapp_fn",
    		ref: "execute_graph"
    	},
    	{
    		id: "graph_to_sim_action",
    		ref: "execute_graph"
    	},
    	{
    		id: "update_nodes_in"
    	},
    	{
    		id: "onkey_fn",
    		ref: "hyperapp_action"
    	},
    	{
    		id: "eq",
    		script: "return a === b;"
    	},
    	{
    		id: "neq",
    		script: "return a !== b;"
    	},
    	{
    		id: "clear_popover_graph",
    		out: "out",
    		nodes: [
    			{
    				id: "in"
    			},
    			{
    				id: "state",
    				ref: "arg",
    				value: "state"
    			},
    			{
    				id: "popover_path",
    				value: "popover_graph"
    			},
    			{
    				id: "false",
    				value: false
    			},
    			{
    				id: "clear_popover",
    				ref: "set"
    			},
    			{
    				id: "new_state"
    			},
    			{
    				id: "popover_dispatch",
    				ref: "arg",
    				value: "state.popover_dispatch"
    			},
    			{
    				id: "clear_popover_hyperapp_effect",
    				script: "return [[(dispatch, payload) => { payload.dispatch(s => undefined); dispatch(s => ({...s, popover_dispatch: undefined}))}, {dispatch: popover_dispatch}]]"
    			},
    			{
    				id: "out",
    				ref: "hyperapp_action_effect"
    			}
    		],
    		edges: [
    			{
    				from: "in",
    				to: "new_state",
    				as: "args"
    			},
    			{
    				from: "state",
    				to: "clear_popover",
    				as: "target"
    			},
    			{
    				from: "state",
    				to: "clear_popover_hyperapp_effect",
    				as: "state"
    			},
    			{
    				from: "popover_path",
    				to: "clear_popover",
    				as: "path"
    			},
    			{
    				from: "false",
    				to: "clear_popover",
    				as: "value"
    			},
    			{
    				from: "clear_popover",
    				to: "new_state",
    				as: "state"
    			},
    			{
    				from: "popover_dispatch",
    				to: "clear_popover_hyperapp_effect",
    				as: "popover_dispatch"
    			},
    			{
    				from: "clear_popover_hyperapp_effect",
    				to: "new_state",
    				as: "effects"
    			},
    			{
    				from: "new_state",
    				to: "out",
    				as: "fn",
    				type: "ref"
    			}
    		]
    	},
    	{
    		id: "show_popover_graph",
    		out: "out",
    		nodes: [
    			{
    				id: "in"
    			},
    			{
    				id: "state",
    				ref: "arg",
    				value: "state"
    			},
    			{
    				id: "popover_graph_path",
    				value: "popover_graph"
    			},
    			{
    				id: "graph",
    				ref: "arg",
    				value: "state.graph"
    			},
    			{
    				id: "selected",
    				ref: "arg",
    				value: "state.selected.0"
    			},
    			{
    				id: "html_id",
    				ref: "arg",
    				value: "state.html_id"
    			},
    			{
    				id: "dimensions",
    				ref: "arg",
    				value: "state.dimensions"
    			},
    			{
    				id: "popover_dispatch",
    				ref: "arg",
    				value: "state.popover_dispatch"
    			},
    			{
    				id: "set_popover_graph",
    				ref: "set"
    			},
    			{
    				id: "popover_graph_value",
    				ref: "arg",
    				value: "payload.popover_graph"
    			},
    			{
    				id: "render_popover_graph_effector",
    				ref: "render_popover_graph_effect"
    			},
    			{
    				id: "render_popover_graph_effect_payload"
    			},
    			{
    				id: "render_popover_graph_effect",
    				ref: "array"
    			},
    			{
    				id: "effects",
    				ref: "array"
    			},
    			{
    				id: "new_state"
    			},
    			{
    				id: "out",
    				ref: "hyperapp_action_effect"
    			}
    		],
    		edges: [
    			{
    				from: "in",
    				to: "out",
    				as: "args"
    			},
    			{
    				from: "state",
    				to: "set_popover_graph",
    				as: "target"
    			},
    			{
    				from: "popover_graph_value",
    				to: "set_popover_graph",
    				as: "value"
    			},
    			{
    				from: "popover_graph_path",
    				to: "set_popover_graph",
    				as: "path"
    			},
    			{
    				from: "set_popover_graph",
    				to: "new_state",
    				as: "state"
    			},
    			{
    				from: "popover_graph_value",
    				to: "render_popover_graph_effect_payload",
    				as: "display_graph"
    			},
    			{
    				from: "graph",
    				to: "render_popover_graph_effect_payload",
    				as: "graph"
    			},
    			{
    				from: "html_id",
    				to: "render_popover_graph_effect_payload",
    				as: "html_id"
    			},
    			{
    				from: "dimensions",
    				to: "render_popover_graph_effect_payload",
    				as: "dimensions"
    			},
    			{
    				from: "popover_dispatch",
    				to: "render_popover_graph_effect_payload",
    				as: "popover_dispatch"
    			},
    			{
    				from: "render_popover_graph_effect_payload",
    				to: "render_popover_graph_effect",
    				as: "arg1"
    			},
    			{
    				from: "render_popover_graph_effector",
    				to: "render_popover_graph_effect",
    				as: "arg0"
    			},
    			{
    				from: "render_popover_graph_effect",
    				to: "effects",
    				as: "arg0"
    			},
    			{
    				from: "effects",
    				to: "new_state",
    				as: "effects"
    			},
    			{
    				from: "new_state",
    				to: "out",
    				as: "fn",
    				type: "ref"
    			}
    		]
    	},
    	{
    		id: "expand_contract_effect",
    		out: "out",
    		nodes: [
    			{
    				id: "in"
    			},
    			{
    				id: "state",
    				ref: "arg",
    				value: "state"
    			},
    			{
    				id: "display_graph_path",
    				value: "display_graph"
    			},
    			{
    				id: "selected_path",
    				value: "selected"
    			},
    			{
    				id: "node_id",
    				ref: "arg",
    				value: "payload.id"
    			},
    			{
    				id: "display_graph",
    				ref: "arg",
    				value: "state.display_graph"
    			},
    			{
    				id: "expand_contract",
    				ref: "expand_contract"
    			},
    			{
    				id: "expand_contract_display_graph",
    				ref: "get"
    			},
    			{
    				id: "expand_contract_selected",
    				ref: "get"
    			},
    			{
    				id: "set_display_graph",
    				ref: "set"
    			},
    			{
    				id: "set_selected",
    				ref: "set"
    			},
    			{
    				id: "update_sim_effector",
    				ref: "arg",
    				value: "state.update_sim_effect"
    			},
    			{
    				id: "update_sim_effect",
    				ref: "array"
    			},
    			{
    				id: "update_display_graph",
    				script: "return [() => _lib.no.runtime.update_graph(display_graph)]"
    			},
    			{
    				id: "effects",
    				ref: "array"
    			},
    			{
    				id: "return_value"
    			},
    			{
    				id: "out",
    				ref: "hyperapp_action_effect"
    			}
    		],
    		edges: [
    			{
    				from: "in",
    				to: "out",
    				as: "args"
    			},
    			{
    				from: "state",
    				to: "set_display_graph",
    				as: "target"
    			},
    			{
    				from: "node_id",
    				to: "expand_contract",
    				as: "node_id"
    			},
    			{
    				from: "display_graph",
    				to: "expand_contract",
    				as: "display_graph"
    			},
    			{
    				from: "expand_contract",
    				to: "expand_contract_display_graph",
    				as: "target"
    			},
    			{
    				from: "display_graph_path",
    				to: "expand_contract_display_graph",
    				as: "path"
    			},
    			{
    				from: "expand_contract",
    				to: "expand_contract_selected",
    				as: "target"
    			},
    			{
    				from: "selected_path",
    				to: "expand_contract_selected",
    				as: "path"
    			},
    			{
    				from: "expand_contract_selected",
    				to: "set_selected",
    				as: "value"
    			},
    			{
    				from: "selected_path",
    				to: "set_selected",
    				as: "path"
    			},
    			{
    				from: "state",
    				to: "set_selected",
    				as: "target"
    			},
    			{
    				from: "update_sim_effector",
    				to: "update_sim_effect",
    				as: "a0"
    			},
    			{
    				from: "set_selected",
    				to: "update_sim_effect",
    				as: "a1"
    			},
    			{
    				from: "update_sim_effect",
    				to: "effects",
    				as: "a1"
    			},
    			{
    				from: "expand_contract_display_graph",
    				to: "update_display_graph",
    				as: "display_graph"
    			},
    			{
    				from: "update_display_graph",
    				to: "effects",
    				as: "a0"
    			},
    			{
    				from: "set_selected",
    				to: "return_value",
    				as: "state"
    			},
    			{
    				from: "effects",
    				to: "return_value",
    				as: "effects"
    			},
    			{
    				from: "return_value",
    				to: "out",
    				as: "fn",
    				type: "ref"
    			}
    		]
    	},
    	{
    		id: "delete_node_action",
    		out: "out",
    		nodes: [
    			{
    				id: "in"
    			},
    			{
    				id: "state",
    				ref: "arg",
    				value: "state"
    			},
    			{
    				id: "nodes",
    				ref: "arg",
    				value: "state.display_graph.nodes"
    			},
    			{
    				id: "edges",
    				ref: "arg",
    				value: "state.display_graph.edges"
    			},
    			{
    				id: "update_sim_effect",
    				ref: "arg",
    				value: "state.update_sim_effect"
    			},
    			{
    				id: "display_graph_out",
    				ref: "arg",
    				value: "state.display_graph.out"
    			},
    			{
    				id: "display_graph",
    				ref: "arg",
    				value: "state.display_graph"
    			},
    			{
    				id: "history",
    				ref: "arg",
    				value: "state.history"
    			},
    			{
    				id: "edges_path",
    				value: "display_graph.edges"
    			},
    			{
    				id: "nodes_path",
    				value: "display_graph.nodes"
    			},
    			{
    				id: "selected_path",
    				value: "selected"
    			},
    			{
    				id: "history_path",
    				value: "history"
    			},
    			{
    				id: "payload",
    				ref: "arg",
    				value: "payload"
    			},
    			{
    				id: "node_id",
    				ref: "arg",
    				value: "payload.id"
    			},
    			{
    				id: "edge",
    				ref: "arg",
    				value: "edge"
    			},
    			{
    				id: "node",
    				ref: "find_node"
    			},
    			{
    				id: "new_nodes",
    				script: "return nodes.filter(n => n.id !== node_id)"
    			},
    			{
    				id: "parent_edge",
    				script: "return edges.find(e => e.from === node_id)"
    			},
    			{
    				id: "replaced_edges",
    				script: "return edges.filter(e => e.to === node_id)"
    			},
    			{
    				id: "new_edges",
    				script: "return edges.filter(e => e !== parent_edge).map(e => e.to === node_id ? {...e, ...parent_edge, from: e.from} : e)"
    			},
    			{
    				id: "new_selected",
    				script: "return [edges.find(e => e.from === node_id)?.to ?? out]"
    			},
    			{
    				id: "history_item",
    				script: "return {action: 'delete_node', node, edges, parent_edge, runnable: {fn: 'delete_node_action', graph: _graph, args: payload}}"
    			},
    			{
    				id: "new_history",
    				ref: "append"
    			},
    			{
    				id: "set_selected",
    				ref: "set"
    			},
    			{
    				id: "set_nodes",
    				ref: "set"
    			},
    			{
    				id: "set_edges",
    				ref: "set"
    			},
    			{
    				id: "set_history",
    				ref: "set"
    			},
    			{
    				id: "out"
    			},
    			{
    				id: "effects",
    				script: "return [[() => _lib.no.runtime.delete_node(display_graph, id)], [update_sim_effect, new_state.state]]"
    			},
    			{
    				id: "out",
    				ref: "hyperapp_action_effect"
    			}
    		],
    		edges: [
    			{
    				from: "state",
    				to: "set_edges",
    				as: "target"
    			},
    			{
    				from: "node_id",
    				to: "new_nodes",
    				as: "node_id"
    			},
    			{
    				from: "nodes",
    				to: "new_nodes",
    				as: "nodes"
    			},
    			{
    				from: "node_id",
    				to: "node",
    				as: "node_id"
    			},
    			{
    				from: "nodes",
    				to: "node",
    				as: "nodes"
    			},
    			{
    				from: "new_nodes",
    				to: "set_nodes",
    				as: "value"
    			},
    			{
    				from: "nodes_path",
    				to: "set_nodes",
    				as: "path"
    			},
    			{
    				from: "state",
    				to: "set_selected",
    				as: "target"
    			},
    			{
    				from: "edges",
    				to: "new_edges",
    				as: "edges"
    			},
    			{
    				from: "node_id",
    				to: "new_edges",
    				as: "node_id"
    			},
    			{
    				from: "parent_edge",
    				to: "new_edges",
    				as: "parent_edge"
    			},
    			{
    				from: "edge",
    				to: "new_edges",
    				as: "edge"
    			},
    			{
    				from: "new_edges",
    				to: "set_edges",
    				as: "value"
    			},
    			{
    				from: "edges_path",
    				to: "set_edges",
    				as: "path"
    			},
    			{
    				from: "in",
    				to: "out",
    				as: "args"
    			},
    			{
    				from: "set_edges",
    				to: "set_nodes",
    				as: "target"
    			},
    			{
    				from: "edges",
    				to: "new_selected",
    				as: "edges"
    			},
    			{
    				from: "node_id",
    				to: "new_selected",
    				as: "node_id"
    			},
    			{
    				from: "display_graph_out",
    				to: "new_selected",
    				as: "out"
    			},
    			{
    				from: "new_selected",
    				to: "set_selected",
    				as: "value"
    			},
    			{
    				from: "selected_path",
    				to: "set_selected",
    				as: "path"
    			},
    			{
    				from: "set_selected",
    				to: "set_history",
    				as: "target"
    			},
    			{
    				from: "payload",
    				to: "history_item",
    				as: "payload"
    			},
    			{
    				from: "node",
    				to: "history_item",
    				as: "node"
    			},
    			{
    				from: "edges",
    				to: "replaced_edges",
    				as: "edges"
    			},
    			{
    				from: "node_id",
    				to: "replaced_edges",
    				as: "node_id"
    			},
    			{
    				from: "replaced_edges",
    				to: "history_item",
    				as: "edges"
    			},
    			{
    				from: "node_id",
    				to: "parent_edge",
    				as: "node_id"
    			},
    			{
    				from: "edges",
    				to: "parent_edge",
    				as: "edges"
    			},
    			{
    				from: "parent_edge",
    				to: "history_item",
    				as: "parent_edge"
    			},
    			{
    				from: "history",
    				to: "new_history",
    				as: "array"
    			},
    			{
    				from: "history_item",
    				to: "new_history",
    				as: "item"
    			},
    			{
    				from: "new_history",
    				to: "set_history",
    				as: "value"
    			},
    			{
    				from: "history_path",
    				to: "set_history",
    				as: "path"
    			},
    			{
    				from: "set_history",
    				to: "out",
    				as: "state"
    			},
    			{
    				from: "set_history",
    				to: "effects",
    				as: "new_state"
    			},
    			{
    				from: "update_sim_effect",
    				to: "effects",
    				as: "update_sim_effect"
    			},
    			{
    				from: "node_id",
    				to: "effects",
    				as: "id"
    			},
    			{
    				from: "display_graph",
    				to: "effects",
    				as: "display_graph"
    			},
    			{
    				from: "effects",
    				to: "out",
    				as: "effects"
    			}
    		]
    	},
    	{
    		id: "delete_node",
    		out: "out",
    		nodes: [
    			{
    				id: "delete_node",
    				ref: "delete_node_action"
    			},
    			{
    				id: "out",
    				ref: "hyperapp_action_effect"
    			}
    		],
    		edges: [
    			{
    				from: "delete_node",
    				to: "out",
    				as: "fn",
    				type: "ref"
    			}
    		]
    	},
    	{
    		id: "next_edge",
    		out: "new_edge",
    		nodes: [
    			{
    				id: "in"
    			},
    			{
    				id: "payload_edge",
    				ref: "arg",
    				value: "edge"
    			},
    			{
    				id: "nodes",
    				ref: "arg",
    				value: "graph.nodes"
    			},
    			{
    				id: "edges",
    				ref: "arg",
    				value: "graph.edges"
    			},
    			{
    				id: "new_edge",
    				script: "return {...payload_edge, as: payload_edge.as ?? next_arg ??  (`arg${(siblings.map(s => s.as).filter(a => a.startsWith('arg')).sort().map(s => parseInt(s.substring(3))).filter(i => !isNaN(i)).reverse()[0] ?? -1) + 1}`)}"
    			},
    			{
    				id: "child_node",
    				script: "return nodes.find(n => n.id === edge.to)"
    			},
    			{
    				id: "siblings",
    				script: "return edges.filter(e => e.to === new_edge.to)"
    			},
    			{
    				id: "node_args",
    				ref: "node_args"
    			},
    			{
    				id: "next_arg",
    				script: "return args?.filter(a => !(a === '_node_inputs' || a === '_lib' || a === '_node' || a === '_args') && !siblings.find(e => e.as === a))[0]"
    			}
    		],
    		edges: [
    			{
    				from: "in",
    				to: "out",
    				as: "args"
    			},
    			{
    				from: "edges",
    				to: "new_edges",
    				as: "array"
    			},
    			{
    				from: "edges",
    				to: "siblings",
    				as: "edges"
    			},
    			{
    				from: "payload_edge",
    				to: "siblings",
    				as: "new_edge"
    			},
    			{
    				from: "payload_edge",
    				to: "new_edge",
    				as: "payload_edge"
    			},
    			{
    				from: "siblings",
    				to: "new_edge",
    				as: "siblings"
    			},
    			{
    				from: "nodes",
    				to: "child_node",
    				as: "nodes"
    			},
    			{
    				from: "payload_edge",
    				to: "child_node",
    				as: "edge"
    			},
    			{
    				from: "nodes",
    				to: "node_args",
    				as: "nodes"
    			},
    			{
    				from: "child_node",
    				to: "node_args",
    				as: "node"
    			},
    			{
    				from: "siblings",
    				to: "next_arg",
    				as: "siblings"
    			},
    			{
    				from: "node_args",
    				to: "next_arg",
    				as: "args"
    			},
    			{
    				from: "next_arg",
    				to: "new_edge",
    				as: "next_arg"
    			},
    			{
    				from: "siblings",
    				to: "new_edge",
    				as: "sibling_count"
    			}
    		]
    	},
    	{
    		id: "add_edge",
    		out: "out",
    		nodes: [
    			{
    				id: "in"
    			},
    			{
    				id: "display_graph",
    				ref: "state.display_graph"
    			},
    			{
    				id: "next_edge",
    				ref: "next_edge"
    			},
    			{
    				id: "edges_path",
    				value: "display_graph.edges"
    			},
    			{
    				id: "new_edges",
    				ref: "append"
    			},
    			{
    				id: "set_new_edges",
    				ref: "set"
    			},
    			{
    				id: "effects",
    				script: "return [[update_sim_effect, new_state]]"
    			},
    			{
    				id: "new_state"
    			},
    			{
    				id: "out",
    				ref: "hyperapp_action_effect"
    			}
    		],
    		edges: [
    			{
    				from: "in",
    				to: "out",
    				as: "_"
    			},
    			{
    				from: "display_graph",
    				to: "next_edge",
    				as: "graph"
    			},
    			{
    				from: "next_edge",
    				to: "new_edges",
    				as: "item"
    			},
    			{
    				from: "state",
    				to: "set_new_edges",
    				as: "target"
    			},
    			{
    				from: "edges_path",
    				to: "set_new_edges",
    				as: "path"
    			},
    			{
    				from: "new_edges",
    				to: "set_new_edges",
    				as: "value"
    			},
    			{
    				from: "update_sim_effect",
    				to: "effects",
    				as: "update_sim_effect"
    			},
    			{
    				from: "set_new_edges",
    				to: "effects",
    				as: "new_state"
    			},
    			{
    				from: "set_new_edges",
    				to: "new_state",
    				as: "state"
    			},
    			{
    				from: "effects",
    				to: "new_state",
    				as: "effects"
    			},
    			{
    				from: "new_state",
    				to: "out",
    				as: "fn",
    				type: "ref"
    			}
    		]
    	},
    	{
    		id: "save_effect",
    		script: "return (dispatch, payload) => { const graph_list = JSON.parse(localStorage.getItem('graph_list'))?.filter(l => l !== payload.display_graph.id) ?? []; graph_list.unshift(payload.display_graph.id); localStorage.setItem('graph_list', JSON.stringify(graph_list)); const graphstr = JSON.stringify({...payload.display_graph, node_map: undefined, in_edge_map: undefined}); localStorage.setItem(payload.display_graph.id, graphstr); window.location.hash = '#' + payload.display_graph.id; }"
    	},
    	{
    		id: "export_effect",
    		script: "return (dispatch, payload) => { const str = `data:text/json;charset=utf-8,${encodeURIComponent(payload.data)}`; const a = document.createElement('a'); a.setAttribute('href', str); a.setAttribute('download', payload.id + '.' + payload.ext); a.click(); a.remove();}"
    	},
    	{
    		id: "graph_list_effect",
    		script: "return (dispatch, payload)"
    	},
    	{
    		id: "new_graph_effect",
    		script: "return (dispatch, payload) => { localStorage.removeItem('display_graph'); window.location.reload(); }"
    	},
    	{
    		id: "focus_effect",
    		script: "return (dispatch, payload) => requestAnimationFrame(() => document.querySelector(payload.selector)?.focus())"
    	},
    	{
    		id: "blur_effect",
    		script: "return (dispatch, payload) => requestAnimationFrame(() => document.querySelector(payload.selector)?.blur())"
    	},
    	{
    		id: "open_graph_effect",
    		nodes: [
    			{
    				id: "in"
    			},
    			{
    				id: "new_graph",
    				ref: "arg",
    				value: "payload.graph"
    			},
    			{
    				id: "state",
    				ref: "arg",
    				value: "state"
    			},
    			{
    				id: "update_sim_effector",
    				ref: "arg",
    				value: "state.update_sim_effect"
    			},
    			{
    				id: "display_graph_path",
    				value: "display_graph"
    			},
    			{
    				id: "set_display_graph",
    				ref: "set"
    			},
    			{
    				id: "update_sim_effect",
    				ref: "array"
    			},
    			{
    				id: "effects",
    				ref: "array"
    			},
    			{
    				id: "result"
    			},
    			{
    				id: "out",
    				ref: "hyperapp_action_effect"
    			}
    		],
    		edges: [
    			{
    				from: "in",
    				to: "out",
    				as: "args",
    				type: "ref"
    			},
    			{
    				from: "state",
    				to: "set_display_graph",
    				as: "target"
    			},
    			{
    				from: "display_graph_path",
    				to: "set_display_graph",
    				as: "path"
    			},
    			{
    				from: "new_graph",
    				to: "set_display_graph",
    				as: "value"
    			},
    			{
    				from: "set_display_graph",
    				to: "result",
    				as: "state"
    			},
    			{
    				from: "update_sim_effector",
    				to: "update_sim_effect",
    				as: "a0"
    			},
    			{
    				from: "update_sim_effect",
    				to: "effects",
    				as: "a0"
    			},
    			{
    				from: "effects",
    				to: "result",
    				as: "effects"
    			},
    			{
    				from: "result",
    				to: "out",
    				as: "fn",
    				type: "ref"
    			}
    		]
    	},
    	{
    		id: "open_saved_graph_effect",
    		nodes: [
    			{
    				id: "in"
    			},
    			{
    				id: "new_graph_id",
    				ref: "arg",
    				value: "payload.id"
    			},
    			{
    				id: "new_graph",
    				script: "return JSON.parse(localStorage.getItem(id))"
    			},
    			{
    				id: "state",
    				ref: "arg",
    				value: "state"
    			},
    			{
    				id: "open_graph_effector",
    				ref: "open_graph_effect"
    			},
    			{
    				id: "open_graph_payload"
    			},
    			{
    				id: "open_graph_effect",
    				ref: "array"
    			},
    			{
    				id: "effects",
    				ref: "array"
    			},
    			{
    				id: "result"
    			},
    			{
    				id: "out",
    				ref: "hyperapp_action_effect"
    			}
    		],
    		edges: [
    			{
    				from: "in",
    				to: "out",
    				as: "args",
    				type: "ref"
    			},
    			{
    				from: "new_graph_id",
    				to: "new_graph",
    				as: "id"
    			},
    			{
    				from: "new_graph",
    				to: "open_graph_payload",
    				as: "graph"
    			},
    			{
    				from: "open_graph_effector",
    				to: "open_graph_effect",
    				as: "a0"
    			},
    			{
    				from: "open_graph_payload",
    				to: "open_graph_effect",
    				as: "a1"
    			},
    			{
    				from: "open_graph_effect",
    				to: "effects",
    				as: "a0"
    			},
    			{
    				from: "state",
    				to: "result",
    				as: "state"
    			},
    			{
    				from: "effects",
    				to: "result",
    				as: "effects"
    			},
    			{
    				from: "result",
    				to: "out",
    				as: "fn",
    				type: "ref"
    			}
    		]
    	},
    	{
    		id: "update_node_fn",
    		out: "out",
    		nodes: [
    			{
    				id: "in"
    			},
    			{
    				id: "state",
    				ref: "arg",
    				value: "state"
    			},
    			{
    				id: "nodes",
    				ref: "arg",
    				value: "state.display_graph.nodes"
    			},
    			{
    				id: "edges",
    				ref: "arg",
    				value: "state.display_graph.edges"
    			},
    			{
    				id: "history",
    				ref: "arg",
    				value: "state.history"
    			},
    			{
    				id: "display_graph",
    				ref: "arg",
    				value: "state.display_graph"
    			},
    			{
    				id: "update_hyperapp",
    				ref: "arg",
    				value: "state.update_hyperapp"
    			},
    			{
    				id: "update_hyperapp_effect",
    				ref: "array"
    			},
    			{
    				id: "new_display_graph_values"
    			},
    			{
    				id: "new_display_graph",
    				ref: "merge_objects"
    			},
    			{
    				id: "payload",
    				ref: "arg",
    				value: "payload"
    			},
    			{
    				id: "node_id",
    				ref: "arg",
    				value: "payload.id"
    			},
    			{
    				id: "node_properties",
    				ref: "arg",
    				value: "payload.properties"
    			},
    			{
    				id: "prev_node",
    				ref: "find_node"
    			},
    			{
    				id: "new_node",
    				ref: "merge_objects"
    			},
    			{
    				id: "replace_node",
    				script: "return nodes.map(n => n.id === new_node.id ? new_node : n)"
    			},
    			{
    				id: "node_args",
    				ref: "node_args"
    			},
    			{
    				id: "arg_value",
    				script: "return node.ref === 'arg' ? node.value.substring(node.value.lastIndexOf('.') + 1) : undefined"
    			},
    			{
    				id: "replace_edges",
    				script: "const parents = edges.filter(e => e.to === node_id).map(e => e.as); const needed_args = !update.hasOwnProperty('ref') ? [] : node_args.filter(a => !parents.includes(a) && a !== '_node_inputs' && a !== '_graph' && a !== '_lib' && a !== '_args'); return edges.map(e => e.from === node_id && arg_value && (e.as.startsWith('arg') || e.as === prev_node?.value) ? {...e, as: arg_value} : e.to === node_id && !node_args.includes(e.as) && needed_args?.length > 0 ? {...e, as: needed_args.shift()} : e)"
    			},
    			{
    				id: "history_item",
    				script: "return {action: 'update_node', node, update, parent_edge: edges.find(e => e.from === node.id), child_edges: edges.filter(e => e.to === node.id), runnable: {fn: 'update_node_fn', graph: _graph, args: payload}}"
    			},
    			{
    				id: "new_history",
    				ref: "append"
    			},
    			{
    				id: "display_graph_nodes_path",
    				value: "display_graph.nodes"
    			},
    			{
    				id: "history_path",
    				value: "history"
    			},
    			{
    				id: "set_history",
    				ref: "set"
    			},
    			{
    				id: "add_node_effect",
    				script: "return [() => _lib.no.runtime.update_graph(display_graph)]"
    			},
    			{
    				id: "effects",
    				ref: "array"
    			},
    			{
    				id: "out"
    			}
    		],
    		edges: [
    			{
    				from: "in",
    				to: "out",
    				as: "args"
    			},
    			{
    				from: "nodes",
    				to: "replace_node",
    				as: "nodes"
    			},
    			{
    				from: "nodes",
    				to: "prev_node",
    				as: "nodes"
    			},
    			{
    				from: "edges",
    				to: "replace_edges",
    				as: "edges"
    			},
    			{
    				from: "node_properties",
    				to: "replace_edges",
    				as: "update"
    			},
    			{
    				from: "node_id",
    				to: "prev_node",
    				as: "node_id"
    			},
    			{
    				from: "node_properties",
    				to: "new_node",
    				as: "o1"
    			},
    			{
    				from: "prev_node",
    				to: "new_node",
    				as: "o0"
    			},
    			{
    				from: "new_node",
    				to: "replace_node",
    				as: "new_node"
    			},
    			{
    				from: "state",
    				to: "set_display_graph_nodes",
    				as: "target"
    			},
    			{
    				from: "display_graph_nodes_path",
    				to: "set_display_graph_nodes",
    				as: "path"
    			},
    			{
    				from: "replace_node",
    				to: "new_display_graph_values",
    				as: "nodes"
    			},
    			{
    				from: "nodes",
    				to: "node_args",
    				as: "nodes"
    			},
    			{
    				from: "new_node",
    				to: "node_args",
    				as: "node"
    			},
    			{
    				from: "new_node",
    				to: "arg_value",
    				as: "node"
    			},
    			{
    				from: "node_id",
    				to: "arg_value",
    				as: "node_id"
    			},
    			{
    				from: "prev_node",
    				to: "replace_edges",
    				as: "prev_node"
    			},
    			{
    				from: "arg_value",
    				to: "replace_edges",
    				as: "arg_value"
    			},
    			{
    				from: "node_args",
    				to: "replace_edges",
    				as: "node_args"
    			},
    			{
    				from: "node_id",
    				to: "replace_edges",
    				as: "node_id"
    			},
    			{
    				from: "replace_edges",
    				to: "new_display_graph_values",
    				as: "edges"
    			},
    			{
    				from: "new_display_graph_values",
    				to: "new_display_graph",
    				as: "o1"
    			},
    			{
    				from: "display_graph",
    				to: "new_display_graph",
    				as: "o0"
    			},
    			{
    				from: "display_graph_edges_path",
    				to: "set_display_graph_edges",
    				as: "path"
    			},
    			{
    				from: "state",
    				to: "set_history",
    				as: "target"
    			},
    			{
    				from: "payload",
    				to: "history_item",
    				as: "payload"
    			},
    			{
    				from: "edges",
    				to: "history_item",
    				as: "edges"
    			},
    			{
    				from: "node_properties",
    				to: "history_item",
    				as: "update"
    			},
    			{
    				from: "prev_node",
    				to: "history_item",
    				as: "node"
    			},
    			{
    				from: "history_path",
    				to: "set_history",
    				as: "path"
    			},
    			{
    				from: "history",
    				to: "new_history",
    				as: "array"
    			},
    			{
    				from: "history_item",
    				to: "new_history",
    				as: "item"
    			},
    			{
    				from: "new_history",
    				to: "set_history",
    				as: "value"
    			},
    			{
    				from: "set_history",
    				to: "out",
    				as: "state"
    			},
    			{
    				from: "update_hyperapp",
    				to: "update_hyperapp_effect",
    				as: "a0"
    			},
    			{
    				from: "update_hyperapp_effect",
    				to: "effects",
    				as: "a1"
    			},
    			{
    				from: "new_display_graph",
    				to: "add_node_effect",
    				as: "display_graph"
    			},
    			{
    				from: "add_node_effect",
    				to: "effects",
    				as: "a0"
    			},
    			{
    				from: "effects",
    				to: "out",
    				as: "effects"
    			}
    		]
    	},
    	{
    		id: "update_node_action",
    		out: "out",
    		nodes: [
    			{
    				id: "in"
    			},
    			{
    				id: "update_node_fn",
    				ref: "update_node_fn"
    			},
    			{
    				id: "out",
    				ref: "hyperapp_action"
    			}
    		],
    		edges: [
    			{
    				from: "in",
    				to: "out",
    				as: "args"
    			},
    			{
    				from: "update_node_fn",
    				to: "out",
    				as: "fn",
    				type: "ref"
    			}
    		]
    	},
    	{
    		id: "update_node",
    		out: "out",
    		nodes: [
    			{
    				id: "in"
    			},
    			{
    				id: "update_node_fn",
    				ref: "update_node_fn"
    			},
    			{
    				id: "out",
    				ref: "hyperapp_action_effect"
    			}
    		],
    		edges: [
    			{
    				from: "in",
    				to: "out",
    				as: "args"
    			},
    			{
    				from: "update_node_fn",
    				to: "out",
    				as: "fn",
    				type: "ref"
    			}
    		]
    	},
    	{
    		id: "update_edge_fn",
    		out: "out",
    		nodes: [
    			{
    				id: "in"
    			},
    			{
    				id: "state",
    				ref: "arg",
    				value: "state"
    			},
    			{
    				id: "edges",
    				ref: "arg",
    				value: "state.display_graph.edges"
    			},
    			{
    				id: "history",
    				ref: "arg",
    				value: "state.history"
    			},
    			{
    				id: "display_graph",
    				ref: "arg",
    				value: "state.display_graph"
    			},
    			{
    				id: "display_graph_edges_path",
    				value: "display_graph.edges"
    			},
    			{
    				id: "payload",
    				ref: "arg",
    				value: "payload"
    			},
    			{
    				id: "edge",
    				ref: "arg",
    				value: "payload.id"
    			},
    			{
    				id: "properties",
    				ref: "arg",
    				value: "payload.properties"
    			},
    			{
    				id: "history_path",
    				value: "history"
    			},
    			{
    				id: "display_graph_edges_path",
    				value: "display_graph.edges"
    			},
    			{
    				id: "prev_edge",
    				script: "return edges.find(e => e.to === edge.to && e.from === edge.from)"
    			},
    			{
    				id: "new_edge",
    				ref: "merge_objects"
    			},
    			{
    				id: "replace_edge",
    				script: "return edges.map(e => e.from === edge.from && e.to === edge.to ? Object.assign({}, e, Object.fromEntries(Object.entries(update).map(e => [e[0], e[1] === '' ? undefined : e[1]]))) : e)"
    			},
    			{
    				id: "history_item",
    				script: "return {action: 'update_edge', edge, update, runnable: {fn: 'update_edge_fn', graph: _graph, args: payload}}"
    			},
    			{
    				id: "new_history",
    				ref: "append"
    			},
    			{
    				id: "set_history",
    				ref: "set"
    			},
    			{
    				id: "set_display_graph_edges",
    				ref: "set"
    			},
    			{
    				id: "update_hyperapp",
    				ref: "arg",
    				value: "state.update_hyperapp"
    			},
    			{
    				id: "update_hyperapp_effect",
    				ref: "array"
    			},
    			{
    				id: "edit_edge_effect",
    				script: "return [() => _lib.no.runtime.edit_edge(display_graph, edge)]"
    			},
    			{
    				id: "effects",
    				ref: "array"
    			},
    			{
    				id: "out"
    			}
    		],
    		edges: [
    			{
    				from: "in",
    				to: "out",
    				as: "args"
    			},
    			{
    				from: "edges",
    				to: "replace_edge",
    				as: "edges"
    			},
    			{
    				from: "edge",
    				to: "replace_edge",
    				as: "edge"
    			},
    			{
    				from: "properties",
    				to: "replace_edge",
    				as: "update"
    			},
    			{
    				from: "state",
    				to: "set_display_graph_edges",
    				as: "target"
    			},
    			{
    				from: "display_graph_edges_path",
    				to: "set_display_graph_edges",
    				as: "path"
    			},
    			{
    				from: "replace_edge",
    				to: "set_display_graph_edges",
    				as: "value"
    			},
    			{
    				from: "edge",
    				to: "prev_edge",
    				as: "edge"
    			},
    			{
    				from: "edges",
    				to: "prev_edge",
    				as: "edges"
    			},
    			{
    				from: "prev_edge",
    				to: "history_item",
    				as: "edge"
    			},
    			{
    				from: "properties",
    				to: "history_item",
    				as: "update"
    			},
    			{
    				from: "payload",
    				to: "history_item",
    				as: "payload"
    			},
    			{
    				from: "history_item",
    				to: "new_history",
    				as: "item"
    			},
    			{
    				from: "history",
    				to: "new_history",
    				as: "array"
    			},
    			{
    				from: "state",
    				to: "set_history",
    				as: "target"
    			},
    			{
    				from: "history_path",
    				to: "set_history",
    				as: "path"
    			},
    			{
    				from: "new_history",
    				to: "set_history",
    				as: "value"
    			},
    			{
    				from: "set_history",
    				to: "out",
    				as: "state"
    			},
    			{
    				from: "update_hyperapp",
    				to: "update_hyperapp_effect",
    				as: "a0"
    			},
    			{
    				from: "prev_edge",
    				to: "new_edge",
    				as: "o0"
    			},
    			{
    				from: "properties",
    				to: "new_edge",
    				as: "o1"
    			},
    			{
    				from: "new_edge",
    				to: "edit_edge_effect",
    				as: "edge"
    			},
    			{
    				from: "display_graph",
    				to: "edit_edge_effect",
    				as: "display_graph"
    			},
    			{
    				from: "update_hyperapp_effect",
    				to: "effects",
    				as: "a0"
    			},
    			{
    				from: "edit_edge_effect",
    				to: "effects",
    				as: "a1"
    			},
    			{
    				from: "effects",
    				to: "out",
    				as: "effects"
    			}
    		]
    	},
    	{
    		id: "update_edge_action",
    		nodes: [
    			{
    				id: "update_edge_fn",
    				ref: "update_edge_fn"
    			},
    			{
    				id: "out",
    				ref: "hyperapp_action"
    			}
    		],
    		edges: [
    			{
    				from: "update_edge_fn",
    				to: "out",
    				as: "fn",
    				type: "ref"
    			}
    		]
    	},
    	{
    		id: "update_edge",
    		out: "out",
    		nodes: [
    			{
    				id: "in"
    			},
    			{
    				id: "update_edge_action",
    				ref: "update_edge_fn"
    			},
    			{
    				id: "out",
    				ref: "hyperapp_action_effect"
    			}
    		],
    		edges: [
    			{
    				from: "in",
    				to: "out",
    				as: "args"
    			},
    			{
    				from: "update_edge_action",
    				to: "out",
    				as: "fn"
    			}
    		]
    	},
    	{
    		id: "copy_effect",
    		out: "out",
    		nodes: [
    			{
    				id: "in"
    			},
    			{
    				id: "state",
    				ref: "arg",
    				value: "state"
    			},
    			{
    				id: "nodes",
    				ref: "arg",
    				value: "state.display_graph.nodes"
    			},
    			{
    				id: "clipboard_path",
    				value: "clipboard"
    			},
    			{
    				id: "node_id",
    				ref: "arg",
    				value: "payload.id"
    			},
    			{
    				id: "node",
    				ref: "find_node"
    			},
    			{
    				id: "set_clipboard",
    				ref: "set"
    			},
    			{
    				id: "effects",
    				ref: "array"
    			},
    			{
    				id: "result"
    			},
    			{
    				id: "out",
    				ref: "hyperapp_action_effect"
    			}
    		],
    		edges: [
    			{
    				from: "in",
    				to: "out",
    				as: "args"
    			},
    			{
    				from: "state",
    				to: "set_clipboard",
    				as: "target"
    			},
    			{
    				from: "clipboard_path",
    				to: "set_clipboard",
    				as: "path"
    			},
    			{
    				from: "node_id",
    				to: "node",
    				as: "node_id"
    			},
    			{
    				from: "nodes",
    				to: "node",
    				as: "nodes"
    			},
    			{
    				from: "node",
    				to: "set_clipboard",
    				as: "value"
    			},
    			{
    				from: "set_clipboard",
    				to: "result",
    				as: "state"
    			},
    			{
    				from: "result",
    				to: "out",
    				as: "fn",
    				type: "ref"
    			}
    		]
    	},
    	{
    		id: "change_display_graph_id",
    		out: "out",
    		nodes: [
    			{
    				id: "in"
    			},
    			{
    				id: "state",
    				ref: "arg",
    				value: "state"
    			},
    			{
    				id: "id_path",
    				value: "display_graph.id"
    			},
    			{
    				id: "id",
    				ref: "arg",
    				value: "payload.properties.id"
    			},
    			{
    				id: "set_display_graph_id",
    				ref: "set"
    			},
    			{
    				id: "effects",
    				ref: "array"
    			},
    			{
    				id: "result"
    			},
    			{
    				id: "out",
    				ref: "hyperapp_action"
    			}
    		],
    		edges: [
    			{
    				from: "in",
    				to: "out",
    				as: "args"
    			},
    			{
    				from: "state",
    				to: "set_display_graph_id",
    				as: "target"
    			},
    			{
    				from: "id_path",
    				to: "set_display_graph_id",
    				as: "path"
    			},
    			{
    				from: "id",
    				to: "set_display_graph_id",
    				as: "value"
    			},
    			{
    				from: "set_display_graph_id",
    				to: "result",
    				as: "state"
    			},
    			{
    				from: "effects",
    				to: "result",
    				as: "effects"
    			},
    			{
    				from: "result",
    				to: "out",
    				as: "fn",
    				type: "ref"
    			}
    		]
    	},
    	{
    		id: "paste_node_effect",
    		out: "out",
    		nodes: [
    			{
    				id: "in"
    			},
    			{
    				id: "state",
    				ref: "arg",
    				value: "state"
    			},
    			{
    				id: "nodes",
    				ref: "arg",
    				value: "state.display_graph.nodes"
    			},
    			{
    				id: "edges",
    				ref: "arg",
    				value: "state.display_graph.edges"
    			},
    			{
    				id: "randid",
    				ref: "arg",
    				value: "payload.randid"
    			},
    			{
    				id: "selected",
    				ref: "arg",
    				value: "payload.node_id"
    			},
    			{
    				id: "node",
    				ref: "arg",
    				value: "state.clipboard"
    			},
    			{
    				id: "id_path",
    				value: "id"
    			},
    			{
    				id: "clipboard_path",
    				value: "clipboard"
    			},
    			{
    				id: "delete_clipboard",
    				ref: "delete"
    			},
    			{
    				id: "add_node_effector",
    				ref: "add_node"
    			},
    			{
    				id: "new_node",
    				ref: "set"
    			},
    			{
    				id: "select",
    				value: "true"
    			},
    			{
    				id: "add_node_payload"
    			},
    			{
    				id: "add_node_effect",
    				ref: "array"
    			},
    			{
    				id: "add_edge_effector",
    				ref: "add_edge"
    			},
    			{
    				id: "add_edge_payload"
    			},
    			{
    				id: "add_edge_effect",
    				ref: "array"
    			},
    			{
    				id: "update_hyperapp",
    				ref: "arg",
    				value: "state.update_hyperapp"
    			},
    			{
    				id: "update_hyperapp_effect",
    				ref: "array"
    			},
    			{
    				id: "effects",
    				ref: "array"
    			},
    			{
    				id: "result"
    			},
    			{
    				id: "out",
    				ref: "hyperapp_action_effect"
    			}
    		],
    		edges: [
    			{
    				from: "in",
    				to: "out",
    				as: "args"
    			},
    			{
    				from: "state",
    				to: "delete_clipboard",
    				as: "target"
    			},
    			{
    				from: "id_path",
    				to: "new_node",
    				as: "path"
    			},
    			{
    				from: "randid",
    				to: "new_node",
    				as: "value"
    			},
    			{
    				from: "node",
    				to: "new_node",
    				as: "target"
    			},
    			{
    				from: "new_node",
    				to: "add_node_payload",
    				as: "node"
    			},
    			{
    				from: "select",
    				to: "add_node_payload",
    				as: "select"
    			},
    			{
    				from: "clipboard_path",
    				to: "delete_clipboard",
    				as: "path"
    			},
    			{
    				from: "delete_clipboard",
    				to: "result",
    				as: "state"
    			},
    			{
    				from: "add_node_effector",
    				to: "add_node_effect",
    				as: "a0"
    			},
    			{
    				from: "add_node_payload",
    				to: "add_node_effect",
    				as: "a1"
    			},
    			{
    				from: "add_node_effect",
    				to: "effects",
    				as: "a0"
    			},
    			{
    				from: "randid",
    				to: "add_edge_payload",
    				as: "from"
    			},
    			{
    				from: "selected",
    				to: "add_edge_payload",
    				as: "to"
    			},
    			{
    				from: "add_edge_effector",
    				to: "add_edge_effect",
    				as: "a0"
    			},
    			{
    				from: "add_edge_payload",
    				to: "add_edge_effect",
    				as: "a1"
    			},
    			{
    				from: "add_edge_effect",
    				to: "effects",
    				as: "a1"
    			},
    			{
    				from: "update_hyperapp",
    				to: "update_hyperapp_effect",
    				as: "a0"
    			},
    			{
    				from: "update_hyperapp_effect",
    				to: "effects",
    				as: "a2"
    			},
    			{
    				from: "effects",
    				to: "result",
    				as: "effects"
    			},
    			{
    				from: "result",
    				to: "out",
    				as: "fn",
    				type: "ref"
    			}
    		]
    	},
    	{
    		id: "show_edit_text",
    		nodes: [
    			{
    				id: "in"
    			},
    			{
    				id: "state",
    				ref: "arg",
    				value: "state"
    			},
    			{
    				id: "display_graph",
    				ref: "arg",
    				value: "state.display_graph"
    			},
    			{
    				id: "dimensions",
    				ref: "arg",
    				value: "state.dimensions"
    			},
    			{
    				id: "html_id",
    				ref: "arg",
    				value: "state.html_id"
    			},
    			{
    				id: "node_el_width",
    				ref: "arg",
    				value: "state.node_el_width"
    			},
    			{
    				id: "oneditconfirm",
    				ref: "arg",
    				value: "payload.oneditconfirm"
    			},
    			{
    				id: "oneditmore",
    				ref: "arg",
    				value: "payload.oneditmore"
    			},
    			{
    				id: "id",
    				ref: "arg",
    				value: "payload.id"
    			},
    			{
    				id: "current_value",
    				ref: "arg",
    				value: "payload.value"
    			},
    			{
    				id: "property",
    				ref: "arg",
    				value: "payload.property"
    			},
    			{
    				id: "arg_position",
    				ref: "arg",
    				value: "payload.position"
    			},
    			{
    				id: "more_action",
    				ref: "arg",
    				value: "payload.more_action"
    			},
    			{
    				id: "editing_path",
    				value: "editing"
    			},
    			{
    				id: "edit_value_path",
    				value: "edit_value"
    			},
    			{
    				id: "edit_id_path",
    				value: "edit_id"
    			},
    			{
    				id: "edit_onconfirm_path",
    				value: "oneditconfirm"
    			},
    			{
    				id: "edit_onmore_path",
    				value: "oneditmore"
    			},
    			{
    				id: "edit_position_path",
    				value: "edit_position"
    			},
    			{
    				id: "default_position",
    				script: "return {x: dimensions.x * 0.5, y: dimensions.y * 0.5}"
    			},
    			{
    				id: "arg_position_offset",
    				script: "return position && {x: position.x + node_el_width * 0.25, y: position.y + 32}"
    			},
    			{
    				id: "position",
    				ref: "default"
    			},
    			{
    				id: "set_editing",
    				ref: "set"
    			},
    			{
    				id: "set_edit_value",
    				ref: "set"
    			},
    			{
    				id: "set_edit_onconfirm",
    				ref: "set"
    			},
    			{
    				id: "set_edit_onmore",
    				ref: "set"
    			},
    			{
    				id: "set_edit_id",
    				ref: "set"
    			},
    			{
    				id: "set_edit_position",
    				ref: "set"
    			},
    			{
    				id: "focus_props",
    				script: "return {'selector': `#${html_id}-edit-value .${editing}`, focus: true}"
    			},
    			{
    				id: "focus_effector",
    				ref: "focus_effect"
    			},
    			{
    				id: "focus_effect",
    				ref: "array"
    			},
    			{
    				id: "effects",
    				ref: "array"
    			},
    			{
    				id: "result"
    			},
    			{
    				id: "out",
    				ref: "hyperapp_action_effect"
    			}
    		],
    		edges: [
    			{
    				from: "in",
    				to: "out",
    				as: "args"
    			},
    			{
    				from: "editing_path",
    				to: "set_editing",
    				as: "path"
    			},
    			{
    				from: "property",
    				to: "set_editing",
    				as: "value"
    			},
    			{
    				from: "state",
    				to: "set_editing",
    				as: "target"
    			},
    			{
    				from: "display_graph",
    				to: "selected_node",
    				as: "display_graph"
    			},
    			{
    				from: "property",
    				to: "current_node_value",
    				as: "path"
    			},
    			{
    				from: "selected_node",
    				to: "current_node_value",
    				as: "target"
    			},
    			{
    				from: "set_editing",
    				to: "set_edit_value",
    				as: "target"
    			},
    			{
    				from: "edit_value_path",
    				to: "set_edit_value",
    				as: "path"
    			},
    			{
    				from: "current_value",
    				to: "set_edit_value",
    				as: "value"
    			},
    			{
    				from: "set_edit_value",
    				to: "set_edit_onconfirm",
    				as: "target"
    			},
    			{
    				from: "edit_onconfirm_path",
    				to: "set_edit_onconfirm",
    				as: "path"
    			},
    			{
    				from: "oneditconfirm",
    				to: "set_edit_onconfirm",
    				as: "value"
    			},
    			{
    				from: "set_edit_onconfirm",
    				to: "set_edit_onmore",
    				as: "target"
    			},
    			{
    				from: "edit_onmore_path",
    				to: "set_edit_onmore",
    				as: "path"
    			},
    			{
    				from: "oneditmore",
    				to: "set_edit_onmore",
    				as: "value"
    			},
    			{
    				from: "set_edit_onmore",
    				to: "set_edit_id",
    				as: "target"
    			},
    			{
    				from: "edit_id_path",
    				to: "set_edit_id",
    				as: "path"
    			},
    			{
    				from: "id",
    				to: "set_edit_id",
    				as: "value"
    			},
    			{
    				from: "node_el_width",
    				to: "arg_position_offset",
    				as: "node_el_width"
    			},
    			{
    				from: "arg_position",
    				to: "arg_position_offset",
    				as: "position"
    			},
    			{
    				from: "arg_position_offset",
    				to: "position",
    				as: "value"
    			},
    			{
    				from: "dimensions",
    				to: "default_position",
    				as: "dimensions"
    			},
    			{
    				from: "default_position",
    				to: "position",
    				as: "otherwise"
    			},
    			{
    				from: "position",
    				to: "set_edit_position",
    				as: "value"
    			},
    			{
    				from: "edit_position_path",
    				to: "set_edit_position",
    				as: "path"
    			},
    			{
    				from: "set_edit_id",
    				to: "set_edit_position",
    				as: "target"
    			},
    			{
    				from: "focus_effector",
    				to: "focus_effect",
    				as: "a0"
    			},
    			{
    				from: "html_id",
    				to: "focus_props",
    				as: "html_id"
    			},
    			{
    				from: "property",
    				to: "focus_props",
    				as: "editing"
    			},
    			{
    				from: "focus_props",
    				to: "focus_effect",
    				as: "a1"
    			},
    			{
    				from: "focus_effect",
    				to: "effects",
    				as: "a0"
    			},
    			{
    				from: "set_edit_position",
    				to: "result",
    				as: "state"
    			},
    			{
    				from: "effects",
    				to: "result",
    				as: "effects"
    			},
    			{
    				from: "result",
    				to: "out",
    				as: "fn",
    				type: "ref"
    			}
    		]
    	},
    	{
    		id: "node_args",
    		out: "out",
    		nodes: [
    			{
    				id: "node",
    				ref: "arg",
    				value: "node"
    			},
    			{
    				id: "nodes",
    				ref: "arg",
    				value: "nodes"
    			},
    			{
    				id: "ref_path",
    				value: "ref"
    			},
    			{
    				id: "ref",
    				ref: "get"
    			},
    			{
    				id: "ref_node",
    				script: "return nodes.find(n => n.id === selected)"
    			},
    			{
    				id: "source_node",
    				ref: "if"
    			},
    			{
    				id: "nodes_path",
    				value: "nodes"
    			},
    			{
    				id: "node_nodes",
    				ref: "get"
    			},
    			{
    				id: "node_arg_nodes",
    				script: "return nodes?.filter(n => n.ref ==='arg' && n.type !== 'internal')"
    			},
    			{
    				id: "should_show",
    				ref: "get"
    			},
    			{
    				id: "nested_node_args",
    				script: "return [...(new Set(nodes.map(n => n.value).filter(a => !a.includes('.'))))]"
    			},
    			{
    				id: "extern_node_args",
    				script: "return _lib.just.get.fn(_lib, node.extern).args"
    			},
    			{
    				id: "node_args_input",
    				script: "return node.id === 'arg' ? undefined : node.extern ? 'extern' : node.nodes ?  'nested' : 'none'"
    			},
    			{
    				id: "node_args",
    				ref: "switch"
    			},
    			{
    				id: "empty",
    				value: [
    				]
    			},
    			{
    				id: "out",
    				ref: "default"
    			}
    		],
    		edges: [
    			{
    				from: "ref_path",
    				to: "ref",
    				as: "path"
    			},
    			{
    				from: "ref",
    				to: "source_node",
    				as: "pred"
    			},
    			{
    				from: "ref_node",
    				to: "source_node",
    				as: "true"
    			},
    			{
    				from: "node",
    				to: "source_node",
    				as: "false"
    			},
    			{
    				from: "node",
    				to: "ref",
    				as: "target"
    			},
    			{
    				from: "node",
    				to: "ref_node",
    				as: "node"
    			},
    			{
    				from: "nodes",
    				to: "ref_node",
    				as: "nodes"
    			},
    			{
    				from: "ref",
    				to: "ref_node",
    				as: "selected"
    			},
    			{
    				from: "source_node",
    				to: "node_nodes",
    				as: "target"
    			},
    			{
    				from: "nodes_path",
    				to: "node_nodes",
    				as: "path"
    			},
    			{
    				from: "node_nodes",
    				to: "node_arg_nodes",
    				as: "nodes"
    			},
    			{
    				from: "node_arg_nodes",
    				to: "nested_node_args",
    				as: "nodes"
    			},
    			{
    				from: "nested_node_args",
    				to: "node_args",
    				as: "nested"
    			},
    			{
    				from: "source_node",
    				to: "extern_node_args",
    				as: "node"
    			},
    			{
    				from: "extern_node_args",
    				to: "node_args",
    				as: "extern"
    			},
    			{
    				from: "nodes",
    				to: "node_args_input",
    				as: "nodes"
    			},
    			{
    				from: "source_node",
    				to: "node_args_input",
    				as: "node"
    			},
    			{
    				from: "node",
    				to: "node_args_input",
    				as: "ng"
    			},
    			{
    				from: "node_args_input",
    				to: "node_args",
    				as: "input"
    			},
    			{
    				from: "empty",
    				to: "out",
    				as: "otherwise"
    			},
    			{
    				from: "node_args",
    				to: "out",
    				as: "value"
    			}
    		]
    	},
    	{
    		id: "node_description",
    		out: "out",
    		nodes: [
    			{
    				id: "node_id",
    				ref: "arg",
    				value: "node_id"
    			},
    			{
    				id: "nodes",
    				ref: "arg",
    				value: "nodes"
    			},
    			{
    				id: "node",
    				script: "return nodes.find(n => n.id === node_id)"
    			},
    			{
    				id: "ref_path",
    				value: "ref"
    			},
    			{
    				id: "ref",
    				ref: "get"
    			},
    			{
    				id: "ref_node",
    				script: "return nodes.find(n => n.id === selected)"
    			},
    			{
    				id: "source_node",
    				ref: "if"
    			},
    			{
    				id: "description_path",
    				value: "description"
    			},
    			{
    				id: "node_description",
    				ref: "get"
    			},
    			{
    				id: "empty_text",
    				value: ""
    			},
    			{
    				id: "out",
    				ref: "default"
    			}
    		],
    		edges: [
    			{
    				from: "node_id",
    				to: "node",
    				as: "node_id"
    			},
    			{
    				from: "nodes",
    				to: "node",
    				as: "nodes"
    			},
    			{
    				from: "ref_path",
    				to: "ref",
    				as: "path"
    			},
    			{
    				from: "ref",
    				to: "source_node",
    				as: "pred"
    			},
    			{
    				from: "ref_node",
    				to: "source_node",
    				as: "true"
    			},
    			{
    				from: "node",
    				to: "source_node",
    				as: "false"
    			},
    			{
    				from: "node",
    				to: "ref",
    				as: "target"
    			},
    			{
    				from: "node",
    				to: "ref_node",
    				as: "node"
    			},
    			{
    				from: "nodes",
    				to: "ref_node",
    				as: "nodes"
    			},
    			{
    				from: "ref",
    				to: "ref_node",
    				as: "selected"
    			},
    			{
    				from: "source_node",
    				to: "node_description",
    				as: "target"
    			},
    			{
    				from: "description_path",
    				to: "node_description",
    				as: "path"
    			},
    			{
    				from: "node_description",
    				to: "out",
    				as: "value"
    			},
    			{
    				from: "empty_text",
    				to: "out",
    				as: "otherwise"
    			}
    		]
    	},
    	{
    		id: "show_args_effect",
    		nodes: [
    			{
    				id: "in"
    			},
    			{
    				id: "display_graph_nodes",
    				ref: "arg",
    				value: "state.display_graph.nodes"
    			},
    			{
    				id: "display_graph_edges",
    				ref: "arg",
    				value: "state.display_graph.edges"
    			},
    			{
    				id: "nodes",
    				ref: "arg",
    				value: "state.nodes"
    			},
    			{
    				id: "selected",
    				ref: "arg",
    				value: "state.selected.0"
    			},
    			{
    				id: "dimensions",
    				ref: "arg",
    				value: "state.dimensions"
    			},
    			{
    				id: "state",
    				ref: "arg",
    				value: "state"
    			},
    			{
    				id: "svg_offset",
    				ref: "arg",
    				value: "state.svg_offset"
    			},
    			{
    				id: "x_path",
    				value: "x"
    			},
    			{
    				id: "y_path",
    				value: "y"
    			},
    			{
    				id: "length_path",
    				value: "length"
    			},
    			{
    				id: "node_args_arr",
    				ref: "node_args"
    			},
    			{
    				id: "create_input",
    				script: "return `arg${(siblings.map(s => s.as).filter(a => a.startsWith('arg')).sort().map(s => parseInt(s.substring(3))).filter(i => !isNaN(i)).reverse()[0] ?? -1) + 1}`"
    			},
    			{
    				id: "clickable_args",
    				ref: "append"
    			},
    			{
    				id: "node_args_text",
    				value: "inputs: "
    			},
    			{
    				id: "node_args_count",
    				ref: "get"
    			},
    			{
    				id: "node_description",
    				ref: "node_description"
    			},
    			{
    				id: "info_display_path",
    				value: "args_display"
    			},
    			{
    				id: "selected_node",
    				script: "return nodes.find(n => n.id === selected)"
    			},
    			{
    				id: "selected_inputs",
    				script: "return edges.filter(e => e.to === selected)"
    			},
    			{
    				id: "selected_el_node",
    				script: "return nodes.find(n => n.node_id === selected)"
    			},
    			{
    				id: "x",
    				ref: "get"
    			},
    			{
    				id: "y",
    				ref: "get"
    			},
    			{
    				id: "arg_el",
    				out: "out",
    				nodes: [
    					{
    						id: "in"
    					},
    					{
    						id: "selected",
    						ref: "arg",
    						value: "state.selected.0"
    					},
    					{
    						id: "randid",
    						ref: "arg",
    						value: "state.randid"
    					},
    					{
    						id: "child_as",
    						ref: "arg",
    						value: "payload.text"
    					},
    					{
    						id: "text",
    						ref: "arg",
    						value: "element"
    					},
    					{
    						id: "inputs",
    						ref: "arg",
    						value: "inputs"
    					},
    					{
    						id: "add_node",
    						ref: "add_node_action"
    					},
    					{
    						id: "add_node_action",
    						ref: "runnable"
    					},
    					{
    						id: "new_node"
    					},
    					{
    						id: "payload"
    					},
    					{
    						id: "create_node"
    					},
    					{
    						id: "clickable_action_args"
    					},
    					{
    						id: "clickable_action",
    						ref: "runnable"
    					},
    					{
    						id: "action",
    						ref: "if"
    					},
    					{
    						id: "text_html",
    						ref: "html_text"
    					},
    					{
    						id: "clickable",
    						script: "return !(text === '_args' || text === '_node_inputs' || text === '_node' || text === '_graph') && !inputs.find(e => e.as === text)"
    					},
    					{
    						id: "class"
    					},
    					{
    						id: "props"
    					},
    					{
    						id: "dom_type",
    						value: "span"
    					},
    					{
    						id: "out",
    						ref: "html_element"
    					}
    				],
    				edges: [
    					{
    						from: "in",
    						to: "out",
    						as: "_"
    					},
    					{
    						from: "selected",
    						to: "payload",
    						as: "child"
    					},
    					{
    						from: "randid",
    						to: "new_node",
    						as: "id"
    					},
    					{
    						from: "new_node",
    						to: "payload",
    						as: "node"
    					},
    					{
    						from: "child_as",
    						to: "payload",
    						as: "child_as"
    					},
    					{
    						from: "add_node",
    						to: "add_node_action",
    						as: "fn"
    					},
    					{
    						from: "add_node_action",
    						to: "create_node",
    						as: "action"
    					},
    					{
    						from: "payload",
    						to: "create_node",
    						as: "payload"
    					},
    					{
    						from: "text",
    						to: "clickable_action_args",
    						as: "text"
    					},
    					{
    						from: "clickable_action_args",
    						to: "clickable_action",
    						as: "args"
    					},
    					{
    						from: "create_node",
    						to: "clickable_action",
    						as: "fn"
    					},
    					{
    						from: "clickable",
    						to: "action",
    						as: "pred"
    					},
    					{
    						from: "clickable_action",
    						to: "action",
    						as: "true"
    					},
    					{
    						from: "action",
    						to: "props",
    						as: "onclick"
    					},
    					{
    						from: "inputs",
    						to: "clickable",
    						as: "inputs"
    					},
    					{
    						from: "text",
    						to: "clickable",
    						as: "text"
    					},
    					{
    						from: "clickable",
    						to: "class",
    						as: "clickable"
    					},
    					{
    						from: "class",
    						to: "props",
    						as: "class"
    					},
    					{
    						from: "props",
    						to: "out",
    						as: "props"
    					},
    					{
    						from: "text",
    						to: "text_html",
    						as: "text"
    					},
    					{
    						from: "text_html",
    						to: "out",
    						as: "children"
    					},
    					{
    						from: "dom_type",
    						to: "out",
    						as: "dom_type"
    					}
    				]
    			},
    			{
    				id: "arg_el_runnable_args"
    			},
    			{
    				id: "arg_el_runnable",
    				ref: "runnable"
    			},
    			{
    				id: "args_links",
    				ref: "map"
    			},
    			{
    				id: "args_h_text",
    				ref: "html_text"
    			},
    			{
    				id: "args_h_text_array",
    				ref: "array"
    			},
    			{
    				id: "args_h_children",
    				ref: "append"
    			},
    			{
    				id: "args_h",
    				ref: "html_element"
    			},
    			{
    				id: "args_h_props",
    				value: {
    					"class": "args"
    				}
    			},
    			{
    				id: "args_h_out",
    				ref: "default"
    			},
    			{
    				id: "description_h_text",
    				ref: "html_text"
    			},
    			{
    				id: "description_h",
    				ref: "html_element"
    			},
    			{
    				id: "description_h_out",
    				ref: "if"
    			},
    			{
    				id: "info_h_children",
    				ref: "array"
    			},
    			{
    				id: "info_h_dom_type",
    				value: "div"
    			},
    			{
    				id: "info_h_props",
    				script: "return {class: {'node-info': true}, style: {left: `${Math.min(x * (svg_offset?.scale ?? 1) + (svg_offset?.x ?? 0) - 64, dimensions.x - 256)}px`, top: `${y * (svg_offset?.scale ?? 1) + (svg_offset?.y ?? 0) + 32}px`}}"
    			},
    			{
    				id: "info_h",
    				ref: "html_element"
    			},
    			{
    				id: "info_pred",
    				script: "return true"
    			},
    			{
    				id: "info_out",
    				ref: "if"
    			},
    			{
    				id: "set_info_display",
    				ref: "set"
    			},
    			{
    				id: "result"
    			},
    			{
    				id: "out",
    				ref: "hyperapp_action_effect_debounced"
    			}
    		],
    		edges: [
    			{
    				from: "in",
    				to: "out",
    				as: "args",
    				type: "ref"
    			},
    			{
    				from: "display_graph_nodes",
    				to: "selected_node",
    				as: "nodes"
    			},
    			{
    				from: "selected",
    				to: "selected_node",
    				as: "selected"
    			},
    			{
    				from: "display_graph_nodes",
    				to: "node_args_arr",
    				as: "nodes"
    			},
    			{
    				from: "selected_node",
    				to: "node_args_arr",
    				as: "node"
    			},
    			{
    				from: "node_args_text",
    				to: "args_h_text",
    				as: "text"
    			},
    			{
    				from: "args_h_text",
    				to: "args_h_text_array",
    				as: "a0"
    			},
    			{
    				from: "node_args_arr",
    				to: "node_args_count",
    				as: "target"
    			},
    			{
    				from: "length_path",
    				to: "node_args_count",
    				as: "path"
    			},
    			{
    				from: "selected",
    				to: "selected_inputs",
    				as: "selected"
    			},
    			{
    				from: "display_graph_edges",
    				to: "selected_inputs",
    				as: "edges"
    			},
    			{
    				from: "selected_inputs",
    				to: "arg_el_runnable_args",
    				as: "inputs"
    			},
    			{
    				from: "arg_el_runnable_args",
    				to: "arg_el_runnable",
    				as: "args"
    			},
    			{
    				from: "arg_el",
    				to: "arg_el_runnable",
    				as: "fn"
    			},
    			{
    				from: "arg_el_runnable",
    				to: "args_links",
    				as: "fn",
    				type: "resolve"
    			},
    			{
    				from: "selected_inputs",
    				to: "create_input",
    				as: "siblings"
    			},
    			{
    				from: "create_input",
    				to: "clickable_args",
    				as: "item"
    			},
    			{
    				from: "node_args_arr",
    				to: "clickable_args",
    				as: "array"
    			},
    			{
    				from: "clickable_args",
    				to: "args_links",
    				as: "array"
    			},
    			{
    				from: "args_links",
    				to: "args_h_children",
    				as: "item"
    			},
    			{
    				from: "args_h_text_array",
    				to: "args_h_children",
    				as: "array"
    			},
    			{
    				from: "args_h_children",
    				to: "args_h",
    				as: "children"
    			},
    			{
    				from: "args_h_props",
    				to: "args_h",
    				as: "props"
    			},
    			{
    				from: "args_h",
    				to: "args_h_out",
    				as: "value"
    			},
    			{
    				from: "selected",
    				to: "node_description",
    				as: "node_id"
    			},
    			{
    				from: "display_graph_nodes",
    				to: "node_description",
    				as: "nodes"
    			},
    			{
    				from: "node_description",
    				to: "description_h_text",
    				as: "text"
    			},
    			{
    				from: "description_h_text",
    				to: "description_h",
    				as: "children"
    			},
    			{
    				from: "description_h",
    				to: "description_h_out",
    				as: "true"
    			},
    			{
    				from: "node_description",
    				to: "description_h_out",
    				as: "pred"
    			},
    			{
    				from: "nodes",
    				to: "selected_el_node",
    				as: "nodes"
    			},
    			{
    				from: "selected",
    				to: "selected_el_node",
    				as: "selected"
    			},
    			{
    				from: "selected_el_node",
    				to: "x",
    				as: "target"
    			},
    			{
    				from: "x_path",
    				to: "x",
    				as: "path"
    			},
    			{
    				from: "selected_el_node",
    				to: "y",
    				as: "target"
    			},
    			{
    				from: "y_path",
    				to: "y",
    				as: "path"
    			},
    			{
    				from: "dimensions",
    				to: "info_h_props",
    				as: "dimensions"
    			},
    			{
    				from: "x",
    				to: "info_h_props",
    				as: "x"
    			},
    			{
    				from: "y",
    				to: "info_h_props",
    				as: "y"
    			},
    			{
    				from: "svg_offset",
    				to: "info_h_props",
    				as: "svg_offset"
    			},
    			{
    				from: "info_h_props",
    				to: "info_h",
    				as: "props"
    			},
    			{
    				from: "args_h_out",
    				to: "info_h_children",
    				as: "a0"
    			},
    			{
    				from: "description_h_out",
    				to: "info_h_children",
    				as: "a1"
    			},
    			{
    				from: "info_h_children",
    				to: "info_h",
    				as: "children"
    			},
    			{
    				from: "info_h",
    				to: "info_out",
    				as: "true"
    			},
    			{
    				from: "node_args_count",
    				to: "info_pred",
    				as: "args_count"
    			},
    			{
    				from: "node_description",
    				to: "info_pred",
    				as: "description"
    			},
    			{
    				from: "info_pred",
    				to: "info_out",
    				as: "pred"
    			},
    			{
    				from: "state",
    				to: "set_info_display",
    				as: "target"
    			},
    			{
    				from: "info_display_path",
    				to: "set_info_display",
    				as: "path"
    			},
    			{
    				from: "info_out",
    				to: "set_info_display",
    				as: "value"
    			},
    			{
    				from: "set_info_display",
    				to: "result",
    				as: "state"
    			},
    			{
    				from: "result",
    				to: "out",
    				as: "fn",
    				type: "ref"
    			}
    		]
    	},
    	{
    		id: "confirm_edit_text",
    		nodes: [
    			{
    				id: "in"
    			},
    			{
    				id: "state",
    				ref: "arg",
    				value: "state"
    			},
    			{
    				id: "property",
    				ref: "arg",
    				value: "state.editing"
    			},
    			{
    				id: "payload_value_raw",
    				ref: "arg",
    				value: "state.edit_value"
    			},
    			{
    				id: "payload_value",
    				script: "return value === '' ? undefined : value"
    			},
    			{
    				id: "id",
    				ref: "arg",
    				value: "state.edit_id"
    			},
    			{
    				id: "edit_id_path",
    				ref: "arg",
    				value: "edit_id"
    			},
    			{
    				id: "on_change",
    				ref: "arg",
    				value: "state.oneditconfirm"
    			},
    			{
    				id: "html_id",
    				ref: "arg",
    				value: "state.html_id"
    			},
    			{
    				id: "false",
    				value: false
    			},
    			{
    				id: "empty_string",
    				value: ""
    			},
    			{
    				id: "editing_path",
    				value: "editing"
    			},
    			{
    				id: "edit_value_path",
    				value: "edit_value"
    			},
    			{
    				id: "set_editing",
    				ref: "set"
    			},
    			{
    				id: "set_edit_value",
    				ref: "set"
    			},
    			{
    				id: "set_edit_id",
    				ref: "delete"
    			},
    			{
    				id: "change_effector",
    				ref: "hyperapp_action_effect"
    			},
    			{
    				id: "change_effect_payload"
    			},
    			{
    				id: "change_effect",
    				ref: "array"
    			},
    			{
    				id: "blur_payload",
    				script: "return {selector: `#${html_id}-edit-value textarea`}"
    			},
    			{
    				id: "blur_effector",
    				ref: "blur_effect"
    			},
    			{
    				id: "blur_effect",
    				ref: "array"
    			},
    			{
    				id: "empty",
    				value: {
    				}
    			},
    			{
    				id: "new_node_props",
    				ref: "set"
    			},
    			{
    				id: "effects",
    				ref: "array"
    			},
    			{
    				id: "result"
    			},
    			{
    				id: "noop"
    			},
    			{
    				id: "out_result",
    				ref: "if"
    			},
    			{
    				id: "out",
    				ref: "hyperapp_action_effect"
    			}
    		],
    		edges: [
    			{
    				from: "in",
    				to: "out",
    				as: "args"
    			},
    			{
    				from: "editing_path",
    				to: "set_editing",
    				as: "path"
    			},
    			{
    				from: "false",
    				to: "set_editing",
    				as: "value"
    			},
    			{
    				from: "state",
    				to: "set_editing",
    				as: "target"
    			},
    			{
    				from: "empty_string",
    				to: "set_edit_value",
    				as: "value"
    			},
    			{
    				from: "set_editing",
    				to: "set_edit_value",
    				as: "target"
    			},
    			{
    				from: "edit_value_path",
    				to: "set_edit_value",
    				as: "path"
    			},
    			{
    				from: "empty",
    				to: "new_node_props",
    				as: "target"
    			},
    			{
    				from: "property",
    				to: "new_node_props",
    				as: "path"
    			},
    			{
    				from: "payload_value_raw",
    				to: "payload_value",
    				as: "value"
    			},
    			{
    				from: "payload_value",
    				to: "new_node_props",
    				as: "value"
    			},
    			{
    				from: "set_edit_value",
    				to: "set_edit_id",
    				as: "target"
    			},
    			{
    				from: "edit_id_path",
    				to: "set_edit_id",
    				as: "path"
    			},
    			{
    				from: "set_edit_id",
    				to: "result",
    				as: "state"
    			},
    			{
    				from: "new_node_props",
    				to: "change_effect_payload",
    				as: "properties"
    			},
    			{
    				from: "id",
    				to: "change_effect_payload",
    				as: "id"
    			},
    			{
    				from: "on_change",
    				to: "change_effector",
    				as: "fn"
    			},
    			{
    				from: "change_effector",
    				to: "change_effect",
    				as: "a0"
    			},
    			{
    				from: "change_effect_payload",
    				to: "change_effect",
    				as: "a1"
    			},
    			{
    				from: "change_effect",
    				to: "effects",
    				as: "a0"
    			},
    			{
    				from: "html_id",
    				to: "blur_payload",
    				as: "html_id"
    			},
    			{
    				from: "blur_payload",
    				to: "blur_effect",
    				as: "a1"
    			},
    			{
    				from: "blur_effector",
    				to: "blur_effect",
    				as: "a0"
    			},
    			{
    				from: "blur_effect",
    				to: "effects",
    				as: "a1"
    			},
    			{
    				from: "effects",
    				to: "result",
    				as: "effects"
    			},
    			{
    				from: "state",
    				to: "noop",
    				as: "state"
    			},
    			{
    				from: "noop",
    				to: "out_result",
    				as: "false"
    			},
    			{
    				from: "result",
    				to: "out_result",
    				as: "true"
    			},
    			{
    				from: "property",
    				to: "out_result",
    				as: "pred"
    			},
    			{
    				from: "result",
    				to: "out",
    				as: "fn",
    				type: "ref"
    			}
    		]
    	},
    	{
    		id: "open_reference_popover",
    		out: "out",
    		nodes: [
    			{
    				id: "in"
    			},
    			{
    				id: "state",
    				ref: "arg",
    				value: "state"
    			},
    			{
    				id: "nodes",
    				ref: "arg",
    				value: "state.display_graph.nodes"
    			},
    			{
    				id: "edges",
    				ref: "arg",
    				value: "state.display_graph.edges"
    			},
    			{
    				id: "levels",
    				ref: "arg",
    				value: "state.levels"
    			},
    			{
    				id: "node_id",
    				ref: "arg",
    				value: "payload.id"
    			},
    			{
    				id: "set_popover_graph_path",
    				value: "popover_graph"
    			},
    			{
    				id: "update_node",
    				ref: "update_node"
    			},
    			{
    				id: "clear_popover",
    				ref: "clear_popover_graph"
    			},
    			{
    				id: "valid_nodes",
    				script: "return nodes.filter(n => !n.ref && !levels.level_by_node.has(n.id))"
    			},
    			{
    				id: "popover_graph_nodes",
    				script: "return nodes.map(n => ({id: `reference-popover${n.id}`, name: n.name ?? n.id, value: n.hasOwnProperty('script') || n.hasOwnProperty('nodes') || n.hasOwnProperty('extern') ? [[update_node, {id: node_id, properties: {ref: n.id}}], [clear_popover]] : []})).concat([{id: 'out', name: 'reference nodes', value: [[clear_popover]]}])"
    			},
    			{
    				id: "popover_graph_edges",
    				script: "return edges.filter(e => !!nodes.find(n => e.to === n.id)).map(e => ({from: `reference-popover${e.from}`, to:  `reference-popover${e.to}`})).concat(nodes.filter(n => edges.filter(e => e.from === n.id).length === 0).map(n => ({from: `reference-popover${n.id}`, to: 'out'})))"
    			},
    			{
    				id: "popover_graph_out",
    				value: "out"
    			},
    			{
    				id: "popover_graph_value"
    			},
    			{
    				id: "show_popover_graph_payload"
    			},
    			{
    				id: "show_popover_graph",
    				ref: "show_popover_graph"
    			},
    			{
    				id: "show_popover_graph_effect",
    				ref: "array"
    			},
    			{
    				id: "set_popover_graph",
    				ref: "set"
    			},
    			{
    				id: "effects",
    				ref: "array"
    			},
    			{
    				id: "result"
    			},
    			{
    				id: "out",
    				ref: "hyperapp_action_effect"
    			}
    		],
    		edges: [
    			{
    				from: "in",
    				to: "out",
    				as: "args"
    			},
    			{
    				from: "nodes",
    				to: "valid_nodes",
    				as: "nodes"
    			},
    			{
    				from: "edges",
    				to: "popover_graph_edges",
    				as: "edges"
    			},
    			{
    				from: "levels",
    				to: "valid_nodes",
    				as: "levels"
    			},
    			{
    				from: "levels",
    				to: "popover_graph_edges",
    				as: "levels"
    			},
    			{
    				from: "node_id",
    				to: "popover_graph_nodes",
    				as: "node_id"
    			},
    			{
    				from: "clear_popover",
    				to: "popover_graph_nodes",
    				as: "clear_popover"
    			},
    			{
    				from: "update_node",
    				to: "popover_graph_nodes",
    				as: "update_node"
    			},
    			{
    				from: "valid_nodes",
    				to: "popover_graph_nodes",
    				as: "nodes"
    			},
    			{
    				from: "popover_graph_nodes",
    				to: "popover_graph_value",
    				as: "nodes"
    			},
    			{
    				from: "valid_nodes",
    				to: "popover_graph_edges",
    				as: "nodes"
    			},
    			{
    				from: "popover_graph_edges",
    				to: "popover_graph_value",
    				as: "edges"
    			},
    			{
    				from: "popover_graph_out",
    				to: "popover_graph_value",
    				as: "out"
    			},
    			{
    				from: "popover_graph_value",
    				to: "set_popover_graph",
    				as: "value"
    			},
    			{
    				from: "set_popover_graph_path",
    				to: "set_popover_graph",
    				as: "path"
    			},
    			{
    				from: "state",
    				to: "set_popover_graph",
    				as: "target"
    			},
    			{
    				from: "show_popover_graph",
    				to: "show_popover_graph_effect",
    				as: "a0"
    			},
    			{
    				from: "popover_graph_value",
    				to: "show_popover_graph_payload",
    				as: "popover_graph"
    			},
    			{
    				from: "show_popover_graph_payload",
    				to: "show_popover_graph_effect",
    				as: "a1"
    			},
    			{
    				from: "show_popover_graph_effect",
    				to: "effects",
    				as: "a0"
    			},
    			{
    				from: "effects",
    				to: "result",
    				as: "effects"
    			},
    			{
    				from: "state",
    				to: "result",
    				as: "state"
    			},
    			{
    				from: "result",
    				to: "out",
    				as: "fn",
    				type: "ref"
    			}
    		]
    	},
    	{
    		id: "insert_node",
    		out: "out",
    		nodes: [
    			{
    				id: "in"
    			},
    			{
    				id: "state",
    				ref: "arg",
    				value: "state"
    			},
    			{
    				id: "display_graph",
    				ref: "arg",
    				value: "state.display_graph"
    			},
    			{
    				id: "edge",
    				ref: "arg",
    				value: "payload.edge"
    			},
    			{
    				id: "edge_to",
    				ref: "arg",
    				value: "payload.edge.to"
    			},
    			{
    				id: "edge_as",
    				ref: "arg",
    				value: "payload.edge.as"
    			},
    			{
    				id: "edge_from",
    				ref: "arg",
    				value: "payload.edge.from"
    			},
    			{
    				id: "id",
    				ref: "arg",
    				value: "payload.node.id"
    			},
    			{
    				id: "name",
    				ref: "arg",
    				value: "payload.node.name"
    			},
    			{
    				id: "in_node",
    				ref: "arg",
    				value: "payload.in_node"
    			},
    			{
    				id: "edges",
    				ref: "arg",
    				value: "state.display_graph.edges"
    			},
    			{
    				id: "nodes",
    				ref: "arg",
    				value: "state.display_graph.nodes"
    			},
    			{
    				id: "display_graph_path",
    				value: "display_graph"
    			},
    			{
    				id: "from_path",
    				value: "from"
    			},
    			{
    				id: "selected_path",
    				value: "selected"
    			},
    			{
    				id: "select",
    				script: "return !in_node"
    			},
    			{
    				id: "edges_path",
    				value: "edges"
    			},
    			{
    				id: "arg0",
    				value: "arg0"
    			},
    			{
    				id: "new_in_edge"
    			},
    			{
    				id: "new_out_edge",
    				ref: "set"
    			},
    			{
    				id: "set_edges",
    				ref: "set"
    			},
    			{
    				id: "add_node_effector",
    				ref: "add_node"
    			},
    			{
    				id: "new_node"
    			},
    			{
    				id: "next_edge",
    				ref: "next_edge"
    			},
    			{
    				id: "new_nodes",
    				ref: "append"
    			},
    			{
    				id: "remove_edge",
    				ref: "remove_edge"
    			},
    			{
    				id: "add_node",
    				ref: "create_or_update_node"
    			},
    			{
    				id: "add_out_edge",
    				ref: "create_or_update_edge"
    			},
    			{
    				id: "add_in_edge",
    				ref: "create_or_update_edge"
    			},
    			{
    				id: "new_display_graph_values"
    			},
    			{
    				id: "new_display_graph",
    				ref: "merge_objects"
    			},
    			{
    				id: "add_node_payload"
    			},
    			{
    				id: "selected_array",
    				ref: "array"
    			},
    			{
    				id: "set_selected",
    				ref: "set"
    			},
    			{
    				id: "set_display_graph",
    				ref: "set"
    			},
    			{
    				id: "update_graph_effect",
    				script: "console.info(display_graph); return [() => _lib.no.runtime.update_graph(display_graph)]"
    			},
    			{
    				id: "effects",
    				ref: "array"
    			},
    			{
    				id: "result"
    			},
    			{
    				id: "out",
    				ref: "hyperapp_action_effect"
    			}
    		],
    		edges: [
    			{
    				from: "in",
    				to: "out",
    				as: "args",
    				type: "ref"
    			},
    			{
    				from: "state",
    				to: "set_selected",
    				as: "target"
    			},
    			{
    				from: "id",
    				to: "selected_array",
    				as: "value"
    			},
    			{
    				from: "selected_array",
    				to: "set_selected",
    				as: "value"
    			},
    			{
    				from: "selected_path",
    				to: "set_selected",
    				as: "path"
    			},
    			{
    				from: "set_selected",
    				to: "set_display_graph",
    				as: "target"
    			},
    			{
    				from: "add_in_edge",
    				to: "set_display_graph",
    				as: "value"
    			},
    			{
    				from: "display_graph_path",
    				to: "set_display_graph",
    				as: "path"
    			},
    			{
    				from: "set_display_graph",
    				to: "result",
    				as: "state"
    			},
    			{
    				from: "id",
    				to: "new_node",
    				as: "id"
    			},
    			{
    				from: "name",
    				to: "new_node",
    				as: "name"
    			},
    			{
    				from: "edge_to",
    				to: "add_node_payload",
    				as: "child"
    			},
    			{
    				from: "edge_as",
    				to: "add_node_payload",
    				as: "child_as"
    			},
    			{
    				from: "new_node",
    				to: "add_node_payload",
    				as: "node"
    			},
    			{
    				from: "display_graph",
    				to: "remove_edge",
    				as: "graph"
    			},
    			{
    				from: "edge",
    				to: "remove_edge",
    				as: "edge"
    			},
    			{
    				from: "remove_edge",
    				to: "add_node",
    				as: "graph"
    			},
    			{
    				from: "new_node",
    				to: "add_node",
    				as: "node"
    			},
    			{
    				from: "edge",
    				to: "new_out_edge",
    				as: "target"
    			},
    			{
    				from: "from_path",
    				to: "new_out_edge",
    				as: "path"
    			},
    			{
    				from: "id",
    				to: "new_out_edge",
    				as: "value"
    			},
    			{
    				from: "add_node",
    				to: "add_out_edge",
    				as: "graph"
    			},
    			{
    				from: "new_out_edge",
    				to: "add_out_edge",
    				as: "edge"
    			},
    			{
    				from: "add_out_edge",
    				to: "next_edge",
    				as: "graph"
    			},
    			{
    				from: "id",
    				to: "new_in_edge",
    				as: "to"
    			},
    			{
    				from: "edge_from",
    				to: "new_in_edge",
    				as: "from"
    			},
    			{
    				from: "arg0",
    				to: "new_in_edge",
    				as: "as"
    			},
    			{
    				from: "add_out_edge",
    				to: "add_in_edge",
    				as: "graph"
    			},
    			{
    				from: "new_in_edge",
    				to: "add_in_edge",
    				as: "edge"
    			},
    			{
    				from: "add_in_edge",
    				to: "update_graph_effect",
    				as: "display_graph"
    			},
    			{
    				from: "update_graph_effect",
    				to: "effects",
    				as: "a1"
    			},
    			{
    				from: "effects",
    				to: "result",
    				as: "effects"
    			},
    			{
    				from: "result",
    				to: "out",
    				as: "fn",
    				type: "ref"
    			}
    		]
    	},
    	{
    		id: "create_reference_effect",
    		out: "out",
    		nodes: [
    			{
    				id: "in"
    			},
    			{
    				id: "id",
    				ref: "arg",
    				value: "payload.id"
    			},
    			{
    				id: "state",
    				ref: "arg",
    				value: "state"
    			},
    			{
    				id: "nodes",
    				ref: "arg",
    				value: "state.display_graph.nodes"
    			},
    			{
    				id: "edges",
    				ref: "arg",
    				value: "state.display_graph.edges"
    			},
    			{
    				id: "nodes_path",
    				value: "display_graph.nodes"
    			},
    			{
    				id: "edges_path",
    				value: "display_graph.edges"
    			},
    			{
    				id: "node",
    				script: "return nodes.find(n => n.id === id)"
    			},
    			{
    				id: "ref",
    				script: "return node.name ?? (node.id + 'reference')"
    			},
    			{
    				id: "new_nodes",
    				script: "return nodes.filter(n => n.id !== ref).flatMap(n => n.id === id ? [{id: n.id, name: n.name, ref}, {...n, id: ref, name: n.name ?? ref}] : n)"
    			},
    			{
    				id: "set_nodes",
    				ref: "set"
    			},
    			{
    				id: "new_edges",
    				script: "return edges.concat([{from: ref, to: 'custom'}])"
    			},
    			{
    				id: "set_edges",
    				ref: "set"
    			},
    			{
    				id: "result"
    			},
    			{
    				id: "out",
    				ref: "hyperapp_action_effect"
    			}
    		],
    		edges: [
    			{
    				from: "in",
    				to: "out",
    				as: "args",
    				type: "ref"
    			},
    			{
    				from: "id",
    				to: "new_nodes",
    				as: "id"
    			},
    			{
    				from: "id",
    				to: "node",
    				as: "id"
    			},
    			{
    				from: "nodes",
    				to: "node",
    				as: "nodes"
    			},
    			{
    				from: "node",
    				to: "ref",
    				as: "node"
    			},
    			{
    				from: "ref",
    				to: "new_nodes",
    				as: "ref"
    			},
    			{
    				from: "nodes",
    				to: "new_nodes",
    				as: "nodes"
    			},
    			{
    				from: "nodes_path",
    				to: "set_nodes",
    				as: "path"
    			},
    			{
    				from: "new_nodes",
    				to: "set_nodes",
    				as: "value"
    			},
    			{
    				from: "state",
    				to: "set_nodes",
    				as: "target"
    			},
    			{
    				from: "ref",
    				to: "new_edges",
    				as: "ref"
    			},
    			{
    				from: "edges",
    				to: "new_edges",
    				as: "edges"
    			},
    			{
    				from: "new_edges",
    				to: "set_edges",
    				as: "value"
    			},
    			{
    				from: "edges_path",
    				to: "set_edges",
    				as: "path"
    			},
    			{
    				from: "set_nodes",
    				to: "set_edges",
    				as: "target"
    			},
    			{
    				from: "set_edges",
    				to: "result",
    				as: "state"
    			},
    			{
    				from: "result",
    				to: "out",
    				as: "fn",
    				type: "ref"
    			}
    		]
    	},
    	{
    		id: "redo_action",
    		out: "out",
    		nodes: [
    			{
    				id: "in"
    			},
    			{
    				id: "redo_history",
    				ref: "arg",
    				value: "state.redo_history"
    			},
    			{
    				id: "state",
    				ref: "arg",
    				value: "state"
    			},
    			{
    				id: "update",
    				ref: "arg",
    				value: "state.update_sim_effect"
    			},
    			{
    				id: "state_path",
    				value: "state"
    			},
    			{
    				id: "effects_path",
    				value: "effects"
    			},
    			{
    				id: "new_history",
    				ref: "append"
    			},
    			{
    				id: "new_redo_history",
    				script: "return redo_history.slice(0, -1)"
    			},
    			{
    				id: "last_change",
    				script: "return redo_history[redo_history.length - 1]"
    			},
    			{
    				id: "last_change_action",
    				script: "return {...last_change.runnable, args: {payload: last_change.runnable.args, state}}"
    			},
    			{
    				id: "redo",
    				ref: "run"
    			},
    			{
    				id: "redo_state",
    				ref: "get"
    			},
    			{
    				id: "history_obj"
    			},
    			{
    				id: "new_state",
    				ref: "merge_objects"
    			},
    			{
    				id: "result",
    				ref: "if"
    			},
    			{
    				id: "update_effect",
    				ref: "array"
    			},
    			{
    				id: "onchange_effects",
    				script: "return (redo.effects ?? []).concat([update])"
    			},
    			{
    				id: "noop_effects",
    				ref: "array"
    			},
    			{
    				id: "effects",
    				ref: "if"
    			},
    			{
    				id: "out"
    			}
    		],
    		edges: [
    			{
    				from: "in",
    				to: "out",
    				as: "_",
    				type: "ref"
    			},
    			{
    				from: "state",
    				to: "last_change_action",
    				as: "state"
    			},
    			{
    				from: "redo_history",
    				to: "last_change",
    				as: "redo_history"
    			},
    			{
    				from: "last_change",
    				to: "last_change_action",
    				as: "last_change"
    			},
    			{
    				from: "last_change_action",
    				to: "redo",
    				as: "runnable"
    			},
    			{
    				from: "state_path",
    				to: "redo_state",
    				as: "path"
    			},
    			{
    				from: "redo",
    				to: "redo_state",
    				as: "target"
    			},
    			{
    				from: "redo_state",
    				to: "new_state",
    				as: "a0"
    			},
    			{
    				from: "redo_history",
    				to: "new_redo_history",
    				as: "redo_history"
    			},
    			{
    				from: "new_redo_history",
    				to: "history_obj",
    				as: "redo_history"
    			},
    			{
    				from: "history_obj",
    				to: "new_state",
    				as: "a1"
    			},
    			{
    				from: "new_state",
    				to: "result",
    				as: "true"
    			},
    			{
    				from: "state",
    				to: "result",
    				as: "false"
    			},
    			{
    				from: "last_change",
    				to: "result",
    				as: "pred"
    			},
    			{
    				from: "result",
    				to: "out",
    				as: "state"
    			},
    			{
    				from: "update",
    				to: "update_effect",
    				as: "a0"
    			},
    			{
    				from: "update_effect",
    				to: "onchange_effects",
    				as: "update"
    			},
    			{
    				from: "effects_path",
    				to: "redo_effects",
    				as: "path"
    			},
    			{
    				from: "redo",
    				to: "onchange_effects",
    				as: "redo"
    			},
    			{
    				from: "onchange_effects",
    				to: "effects",
    				as: "true"
    			},
    			{
    				from: "noop_effects",
    				to: "effects",
    				as: "false"
    			},
    			{
    				from: "last_change",
    				to: "effects",
    				as: "pred"
    			},
    			{
    				from: "effects",
    				to: "out",
    				as: "effects"
    			}
    		]
    	},
    	{
    		id: "undo_action",
    		out: "out",
    		nodes: [
    			{
    				id: "in"
    			},
    			{
    				id: "state",
    				ref: "arg",
    				value: "state"
    			},
    			{
    				id: "history",
    				ref: "arg",
    				value: "state.history"
    			},
    			{
    				id: "redo_history",
    				ref: "arg",
    				value: "state.redo_history"
    			},
    			{
    				id: "update",
    				ref: "arg",
    				value: "state.update_sim_effect"
    			},
    			{
    				id: "last_change",
    				script: "return history[history.length - 1]"
    			},
    			{
    				id: "new_history",
    				script: "return history.slice(0, -1)"
    			},
    			{
    				id: "new_redo_history",
    				ref: "append"
    			},
    			{
    				id: "last_change_action",
    				script: "return change?.action"
    			},
    			{
    				id: "undo_add_node",
    				script: "return {...state, selected: [change.child], display_graph: {...state.display_graph, nodes: state.display_graph.nodes.filter(n => n.id !== change.node.id), edges: state.display_graph.edges.filter(e => e.from !== change.node.id)}}"
    			},
    			{
    				id: "undo_delete_node",
    				script: "return {...state, selected: [change.node.id], display_graph: {...state.display_graph, nodes: state.display_graph.nodes.concat([change.node]), edges: state.display_graph.edges.filter(e => !change.edges.find(c => c.from === e.from)).concat(change.edges).concat([change.parent_edge])}}"
    			},
    			{
    				id: "undo_update_node",
    				script: "return {...state, selected: [change.node.id], display_graph: {...state.display_graph, nodes: state.display_graph.nodes.filter(n => n.id !== change.node.id).concat([change.node]), edges: state.display_graph.edges.filter(e => !((change.parent_edge.to === e.to && change.parent_edge.from === e.from) || change.child_edges.find(c => c.from === e.from))).concat(change.child_edges).concat([change.parent_edge])}}"
    			},
    			{
    				id: "undo_update_edge",
    				script: "return {...state, display_graph: {...state.display_graph, edges: state.display_graph.edges.filter(e => !(e.to === change.edge.to && e.from === change.edge.from)).concat([change.edge])}}"
    			},
    			{
    				id: "history_obj"
    			},
    			{
    				id: "action_state",
    				ref: "switch"
    			},
    			{
    				id: "new_state",
    				ref: "merge_objects"
    			},
    			{
    				id: "update_effect",
    				ref: "array"
    			},
    			{
    				id: "onchange_effects",
    				ref: "array"
    			},
    			{
    				id: "effects",
    				ref: "if"
    			},
    			{
    				id: "action",
    				ref: "if"
    			},
    			{
    				id: "out"
    			}
    		],
    		edges: [
    			{
    				from: "in",
    				to: "out",
    				as: "_",
    				type: "ref"
    			},
    			{
    				from: "history",
    				to: "last_change",
    				as: "history"
    			},
    			{
    				from: "state",
    				to: "undo_add_node",
    				as: "state"
    			},
    			{
    				from: "last_change",
    				to: "undo_add_node",
    				as: "change"
    			},
    			{
    				from: "undo_add_node",
    				to: "action_state",
    				as: "add_node"
    			},
    			{
    				from: "state",
    				to: "undo_delete_node",
    				as: "state"
    			},
    			{
    				from: "last_change",
    				to: "undo_delete_node",
    				as: "change"
    			},
    			{
    				from: "undo_delete_node",
    				to: "action_state",
    				as: "delete_node"
    			},
    			{
    				from: "state",
    				to: "undo_update_node",
    				as: "state"
    			},
    			{
    				from: "last_change",
    				to: "undo_update_node",
    				as: "change"
    			},
    			{
    				from: "undo_update_node",
    				to: "action_state",
    				as: "update_node"
    			},
    			{
    				from: "state",
    				to: "undo_update_edge",
    				as: "state"
    			},
    			{
    				from: "last_change",
    				to: "undo_update_edge",
    				as: "change"
    			},
    			{
    				from: "undo_update_edge",
    				to: "action_state",
    				as: "update_edge"
    			},
    			{
    				from: "last_change",
    				to: "last_change_action",
    				as: "change"
    			},
    			{
    				from: "last_change_action",
    				to: "action_state",
    				as: "input"
    			},
    			{
    				from: "action_state",
    				to: "new_state",
    				as: "a0"
    			},
    			{
    				from: "history",
    				to: "new_history",
    				as: "history"
    			},
    			{
    				from: "new_history",
    				to: "history_obj",
    				as: "history"
    			},
    			{
    				from: "redo_history",
    				to: "new_redo_history",
    				as: "array"
    			},
    			{
    				from: "last_change",
    				to: "new_redo_history",
    				as: "item"
    			},
    			{
    				from: "new_redo_history",
    				to: "history_obj",
    				as: "redo_history"
    			},
    			{
    				from: "history_obj",
    				to: "new_state",
    				as: "a1"
    			},
    			{
    				from: "last_change_action",
    				to: "action",
    				as: "pred"
    			},
    			{
    				from: "new_state",
    				to: "action",
    				as: "true"
    			},
    			{
    				from: "state",
    				to: "action",
    				as: "false"
    			},
    			{
    				from: "action",
    				to: "out",
    				as: "state"
    			},
    			{
    				from: "update",
    				to: "update_effect",
    				as: "a0"
    			},
    			{
    				from: "update_effect",
    				to: "onchange_effects",
    				as: "a0"
    			},
    			{
    				from: "last_change_action",
    				to: "effects",
    				as: "pred"
    			},
    			{
    				from: "onchange_effects",
    				to: "effects",
    				as: "true"
    			},
    			{
    				from: "effects",
    				to: "out",
    				as: "effects"
    			}
    		]
    	},
    	{
    		id: "create_or_update_node",
    		out: "new_graph",
    		nodes: [
    			{
    				id: "id",
    				ref: "arg",
    				value: "node.id"
    			},
    			{
    				id: "arg_node",
    				ref: "arg",
    				value: "node"
    			},
    			{
    				id: "graph",
    				ref: "arg",
    				value: "graph"
    			},
    			{
    				id: "nodes",
    				ref: "arg",
    				value: "graph.nodes"
    			},
    			{
    				id: "old_node",
    				ref: "find_node"
    			},
    			{
    				id: "node",
    				ref: "merge_objects"
    			},
    			{
    				id: "nodes_path",
    				value: "nodes"
    			},
    			{
    				id: "filtered_nodes",
    				script: "return nodes.filter(n => n.id !== node_id)"
    			},
    			{
    				id: "new_nodes",
    				ref: "append"
    			},
    			{
    				id: "new_graph",
    				ref: "set"
    			}
    		],
    		edges: [
    			{
    				from: "id",
    				to: "old_node",
    				as: "node_id"
    			},
    			{
    				from: "nodes",
    				to: "old_node",
    				as: "nodes"
    			},
    			{
    				from: "old_node",
    				to: "node",
    				as: "o0"
    			},
    			{
    				from: "arg_node",
    				to: "node",
    				as: "o1"
    			},
    			{
    				from: "node",
    				to: "new_nodes",
    				as: "item",
    				type: "resolve"
    			},
    			{
    				from: "id",
    				to: "filtered_nodes",
    				as: "node_id"
    			},
    			{
    				from: "nodes",
    				to: "filtered_nodes",
    				as: "nodes"
    			},
    			{
    				from: "filtered_nodes",
    				to: "new_nodes",
    				as: "array"
    			},
    			{
    				from: "new_nodes",
    				to: "new_graph",
    				as: "value"
    			},
    			{
    				from: "nodes_path",
    				to: "new_graph",
    				as: "path"
    			},
    			{
    				from: "graph",
    				to: "new_graph",
    				as: "target"
    			}
    		]
    	},
    	{
    		id: "create_or_update_edge",
    		out: "new_graph",
    		nodes: [
    			{
    				id: "arg_edge",
    				ref: "arg",
    				value: "edge"
    			},
    			{
    				id: "graph",
    				ref: "arg",
    				value: "graph"
    			},
    			{
    				id: "edges",
    				ref: "arg",
    				value: "graph.edges"
    			},
    			{
    				id: "old_edge",
    				script: "return edges.find(e => e.to === edge.to && e.from === edge.from)"
    			},
    			{
    				id: "new_edge",
    				ref: "merge_objects"
    			},
    			{
    				id: "edges_path",
    				value: "edges"
    			},
    			{
    				id: "filtered_edges",
    				script: "return edges.filter(e => !(e.to === edge.to && e.from === edge.from))"
    			},
    			{
    				id: "new_edges",
    				ref: "append"
    			},
    			{
    				id: "new_graph",
    				ref: "set"
    			}
    		],
    		edges: [
    			{
    				from: "arg_edge",
    				to: "old_edge",
    				as: "edge"
    			},
    			{
    				from: "edges",
    				to: "old_edge",
    				as: "edges"
    			},
    			{
    				from: "old_edge",
    				to: "new_edge",
    				as: "o0"
    			},
    			{
    				from: "arg_edge",
    				to: "new_edge",
    				as: "o1"
    			},
    			{
    				from: "new_edge",
    				to: "new_edges",
    				as: "item",
    				type: "resolve"
    			},
    			{
    				from: "arg_edge",
    				to: "filtered_edges",
    				as: "edge"
    			},
    			{
    				from: "edges",
    				to: "filtered_edges",
    				as: "edges"
    			},
    			{
    				from: "filtered_edges",
    				to: "new_edges",
    				as: "array"
    			},
    			{
    				from: "new_edges",
    				to: "new_graph",
    				as: "value"
    			},
    			{
    				from: "edges_path",
    				to: "new_graph",
    				as: "path"
    			},
    			{
    				from: "graph",
    				to: "new_graph",
    				as: "target"
    			}
    		]
    	},
    	{
    		id: "remove_edge",
    		out: "new_graph",
    		nodes: [
    			{
    				id: "arg_edge",
    				ref: "arg",
    				value: "edge"
    			},
    			{
    				id: "graph",
    				ref: "arg",
    				value: "graph"
    			},
    			{
    				id: "edges",
    				ref: "arg",
    				value: "graph.edges"
    			},
    			{
    				id: "edges_path",
    				value: "edges"
    			},
    			{
    				id: "filtered_edges",
    				script: "return edges.filter(e => !(e.to === edge.to && e.from === edge.from))"
    			},
    			{
    				id: "new_graph",
    				ref: "set"
    			}
    		],
    		edges: [
    			{
    				from: "arg_edge",
    				to: "filtered_edges",
    				as: "edge"
    			},
    			{
    				from: "edges",
    				to: "filtered_edges",
    				as: "edges"
    			},
    			{
    				from: "filtered_edges",
    				to: "new_graph",
    				as: "value"
    			},
    			{
    				from: "edges_path",
    				to: "new_graph",
    				as: "path"
    			},
    			{
    				from: "graph",
    				to: "new_graph",
    				as: "target"
    			}
    		]
    	},
    	{
    		id: "add_node_action",
    		out: "out",
    		nodes: [
    			{
    				id: "in"
    			},
    			{
    				id: "id",
    				ref: "arg",
    				value: "payload.node.id"
    			},
    			{
    				id: "payload",
    				ref: "arg",
    				value: "payload"
    			},
    			{
    				id: "node",
    				ref: "arg",
    				value: "payload.node"
    			},
    			{
    				id: "select",
    				ref: "arg",
    				value: "payload.select"
    			},
    			{
    				id: "child",
    				ref: "arg",
    				value: "payload.child"
    			},
    			{
    				id: "child_as",
    				ref: "arg",
    				value: "payload.child_as"
    			},
    			{
    				id: "history",
    				ref: "arg",
    				value: "state.history"
    			},
    			{
    				id: "selected",
    				ref: "arg",
    				value: "state.selected"
    			},
    			{
    				id: "state",
    				ref: "arg",
    				value: "state"
    			},
    			{
    				id: "display_graph",
    				ref: "arg",
    				value: "state.display_graph"
    			},
    			{
    				id: "history_path",
    				value: "history"
    			},
    			{
    				id: "display_graph_path",
    				value: "display_graph"
    			},
    			{
    				id: "id_array",
    				ref: "array"
    			},
    			{
    				id: "update_sim_effect",
    				ref: "arg",
    				value: "state.update_sim_effect"
    			},
    			{
    				id: "nodes",
    				ref: "arg",
    				value: "state.display_graph.nodes"
    			},
    			{
    				id: "history_item",
    				script: "return {action: 'add_node', node, child, runnable: {fn: 'add_node_action', graph: _graph, args: payload}}"
    			},
    			{
    				id: "new_history",
    				ref: "append"
    			},
    			{
    				id: "new_edge",
    				script: "return {from: id, to: child, as: child_as}"
    			},
    			{
    				id: "next_edge",
    				ref: "next_edge"
    			},
    			{
    				id: "add_node",
    				ref: "create_or_update_node"
    			},
    			{
    				id: "add_edge",
    				ref: "create_or_update_edge"
    			},
    			{
    				id: "effects",
    				script: "return [[() => _lib.no.runtime.update_graph(display_graph)], [update_sim_effect]]"
    			},
    			{
    				id: "set_display_graph",
    				ref: "set"
    			},
    			{
    				id: "nodes_path",
    				value: "display_graph.nodes"
    			},
    			{
    				id: "selected_path",
    				value: "selected"
    			},
    			{
    				id: "new_node"
    			},
    			{
    				id: "new_nodes",
    				ref: "append"
    			},
    			{
    				id: "add_edge_effector",
    				ref: "add_edge"
    			},
    			{
    				id: "set_new_nodes",
    				ref: "set"
    			},
    			{
    				id: "new_selected",
    				ref: "if"
    			},
    			{
    				id: "set_selected",
    				ref: "set"
    			},
    			{
    				id: "set_history",
    				ref: "set"
    			},
    			{
    				id: "out"
    			}
    		],
    		edges: [
    			{
    				from: "in",
    				to: "out",
    				as: "args"
    			},
    			{
    				from: "node",
    				to: "new_node"
    			},
    			{
    				from: "node",
    				to: "history_item",
    				as: "node"
    			},
    			{
    				from: "payload",
    				to: "history_item",
    				as: "payload"
    			},
    			{
    				from: "child",
    				to: "history_item",
    				as: "child"
    			},
    			{
    				from: "child_as",
    				to: "history_item",
    				as: "child_as"
    			},
    			{
    				from: "history_item",
    				to: "new_history",
    				as: "item"
    			},
    			{
    				from: "history",
    				to: "new_history",
    				as: "array"
    			},
    			{
    				from: "id",
    				to: "id_array",
    				as: "arg0"
    			},
    			{
    				from: "nodes",
    				to: "new_nodes",
    				as: "array"
    			},
    			{
    				from: "new_node",
    				to: "new_nodes",
    				as: "item"
    			},
    			{
    				from: "state",
    				to: "set_new_nodes",
    				as: "target"
    			},
    			{
    				from: "nodes_path",
    				to: "set_new_nodes",
    				as: "path"
    			},
    			{
    				from: "new_nodes",
    				to: "set_new_nodes",
    				as: "value"
    			},
    			{
    				from: "id",
    				to: "new_edge",
    				as: "id"
    			},
    			{
    				from: "child",
    				to: "new_edge",
    				as: "child"
    			},
    			{
    				from: "child_as",
    				to: "new_edge",
    				as: "child_as"
    			},
    			{
    				from: "display_graph",
    				to: "add_node",
    				as: "graph"
    			},
    			{
    				from: "new_node",
    				to: "add_node",
    				as: "node"
    			},
    			{
    				from: "add_node",
    				to: "add_edge",
    				as: "graph"
    			},
    			{
    				from: "add_node",
    				to: "next_edge",
    				as: "graph"
    			},
    			{
    				from: "new_edge",
    				to: "next_edge",
    				as: "edge"
    			},
    			{
    				from: "next_edge",
    				to: "add_edge",
    				as: "edge"
    			},
    			{
    				from: "add_edge",
    				to: "effects",
    				as: "display_graph"
    			},
    			{
    				from: "update_sim_effect",
    				to: "effects",
    				as: "update_sim_effect"
    			},
    			{
    				from: "state",
    				to: "set_display_graph",
    				as: "target"
    			},
    			{
    				from: "display_graph_path",
    				to: "set_display_graph",
    				as: "path"
    			},
    			{
    				from: "add_node",
    				to: "set_display_graph",
    				as: "value"
    			},
    			{
    				from: "set_display_graph",
    				to: "set_selected",
    				as: "target"
    			},
    			{
    				from: "selected_path",
    				to: "set_selected",
    				as: "path"
    			},
    			{
    				from: "set_selected",
    				to: "set_history",
    				as: "target"
    			},
    			{
    				from: "history_path",
    				to: "set_history",
    				as: "path"
    			},
    			{
    				from: "new_history",
    				to: "set_history",
    				as: "value"
    			},
    			{
    				from: "id_array",
    				to: "new_selected",
    				as: "true"
    			},
    			{
    				from: "selected",
    				to: "new_selected",
    				as: "false"
    			},
    			{
    				from: "select",
    				to: "new_selected",
    				as: "pred"
    			},
    			{
    				from: "new_selected",
    				to: "set_selected",
    				as: "value"
    			},
    			{
    				from: "set_selected",
    				to: "effects",
    				as: "new_state"
    			},
    			{
    				from: "set_history",
    				to: "out",
    				as: "state"
    			},
    			{
    				from: "effects",
    				to: "out",
    				as: "effects"
    			}
    		]
    	},
    	{
    		id: "add_node",
    		out: "out",
    		nodes: [
    			{
    				id: "in"
    			},
    			{
    				id: "add_node_fn",
    				ref: "add_node_action"
    			},
    			{
    				id: "out",
    				ref: "hyperapp_action_effect"
    			}
    		],
    		edges: [
    			{
    				from: "in",
    				to: "out"
    			},
    			{
    				from: "add_node_fn",
    				to: "out",
    				as: "fn",
    				type: "ref"
    			}
    		]
    	},
    	{
    		id: "keybindings",
    		out: "out",
    		nodes: [
    			{
    				id: "editing"
    			},
    			{
    				id: "searching"
    			},
    			{
    				id: "graph"
    			},
    			{
    				id: "j",
    				value: "down"
    			},
    			{
    				id: "k",
    				value: "up"
    			},
    			{
    				value: "right",
    				id: "arrowright"
    			},
    			{
    				value: "left",
    				id: "arrowleft"
    			},
    			{
    				id: "arrowdown",
    				value: "down"
    			},
    			{
    				id: "arrowup",
    				value: "up"
    			},
    			{
    				value: "left",
    				id: "h"
    			},
    			{
    				value: "right",
    				id: "l"
    			},
    			{
    				value: "edit_value",
    				id: "v"
    			},
    			{
    				value: "edit_name",
    				id: "n"
    			},
    			{
    				value: "edit_ref",
    				id: "r"
    			},
    			{
    				value: "edit_script",
    				id: "s"
    			},
    			{
    				value: "edit_edge",
    				id: "e"
    			},
    			{
    				value: "node_menu",
    				id: "node_menu"
    			},
    			{
    				value: "create_input",
    				id: "create_input"
    			},
    			{
    				value: "delete",
    				id: "delete"
    			},
    			{
    				value: "find",
    				id: "find"
    			},
    			{
    				value: "esc_editing",
    				id: "esc_editing"
    			},
    			{
    				value: "clear_popover",
    				id: "esc"
    			},
    			{
    				value: "copy",
    				id: "y"
    			},
    			{
    				value: "copy",
    				id: "ctrl_c"
    			},
    			{
    				value: "paste",
    				id: "p"
    			},
    			{
    				value: "paste",
    				id: "ctrl_v"
    			},
    			{
    				value: "add_node",
    				id: "o"
    			},
    			{
    				value: "add_arg_node",
    				id: "a"
    			},
    			{
    				value: "delete_node",
    				id: "x"
    			},
    			{
    				value: "expand_contract",
    				id: "shift_enter"
    			},
    			{
    				value: "save",
    				id: "ctrl_s"
    			},
    			{
    				value: "undo",
    				id: "ctrl_z"
    			},
    			{
    				value: "redo",
    				id: "ctrl_y"
    			},
    			{
    				value: "select",
    				id: "enter"
    			},
    			{
    				value: "show_keybindings",
    				id: "?"
    			},
    			{
    				value: "find",
    				id: "f"
    			},
    			{
    				value: "cancel_search",
    				id: "esc_search"
    			},
    			{
    				id: "out"
    			}
    		],
    		edges: [
    			{
    				from: "editing",
    				to: "out",
    				as: "editing"
    			},
    			{
    				from: "searching",
    				to: "out",
    				as: "searching"
    			},
    			{
    				from: "graph",
    				to: "out",
    				as: "graph"
    			},
    			{
    				from: "arrowdown",
    				to: "graph",
    				as: "arrowdown"
    			},
    			{
    				from: "arrowup",
    				to: "graph",
    				as: "arrowup"
    			},
    			{
    				from: "arrowleft",
    				to: "graph",
    				as: "arrowleft"
    			},
    			{
    				from: "arrowright",
    				to: "graph",
    				as: "arrowright"
    			},
    			{
    				from: "j",
    				to: "graph",
    				as: "j"
    			},
    			{
    				from: "k",
    				to: "graph",
    				as: "k"
    			},
    			{
    				from: "h",
    				to: "graph",
    				as: "h"
    			},
    			{
    				from: "l",
    				to: "graph",
    				as: "l"
    			},
    			{
    				from: "v",
    				to: "graph",
    				as: "v"
    			},
    			{
    				from: "n",
    				to: "graph",
    				as: "n"
    			},
    			{
    				from: "s",
    				to: "graph",
    				as: "s"
    			},
    			{
    				from: "r",
    				to: "graph",
    				as: "r"
    			},
    			{
    				from: "o",
    				to: "graph",
    				as: "o"
    			},
    			{
    				from: "y",
    				to: "graph",
    				as: "y"
    			},
    			{
    				from: "p",
    				to: "graph",
    				as: "p"
    			},
    			{
    				from: "x",
    				to: "graph",
    				as: "x"
    			},
    			{
    				from: "a",
    				to: "graph",
    				as: "a"
    			},
    			{
    				from: "f",
    				to: "graph",
    				as: "f"
    			},
    			{
    				from: "e",
    				to: "graph",
    				as: "e"
    			},
    			{
    				from: "enter",
    				to: "graph",
    				as: "enter"
    			},
    			{
    				from: "ctrl_c",
    				to: "graph",
    				as: "ctrl_c"
    			},
    			{
    				from: "ctrl_v",
    				to: "graph",
    				as: "ctrl_v"
    			},
    			{
    				from: "ctrl_s",
    				to: "graph",
    				as: "ctrl_s"
    			},
    			{
    				from: "ctrl_z",
    				to: "graph",
    				as: "ctrl_z"
    			},
    			{
    				from: "ctrl_y",
    				to: "graph",
    				as: "ctrl_y"
    			},
    			{
    				from: "shift_enter",
    				to: "graph",
    				as: "shift_enter"
    			},
    			{
    				from: "esc_search",
    				to: "searching",
    				as: "escape"
    			}
    		]
    	},
    	{
    		id: "onkey_fn_body",
    		out: "out",
    		nodes: [
    			{
    				id: "in"
    			},
    			{
    				id: "key_event",
    				ref: "arg",
    				value: "payload"
    			},
    			{
    				id: "state",
    				ref: "arg",
    				value: "state"
    			},
    			{
    				id: "static",
    				ref: "arg",
    				value: "state.static"
    			},
    			{
    				id: "randid",
    				ref: "arg",
    				value: "state.randid"
    			},
    			{
    				id: "arg_levels",
    				ref: "arg",
    				value: "state.levels"
    			},
    			{
    				id: "dimensions",
    				ref: "arg",
    				value: "state.dimensions"
    			},
    			{
    				id: "html_id",
    				ref: "arg",
    				value: "state.html_id"
    			},
    			{
    				id: "arg_display_graph",
    				ref: "arg",
    				value: "state.display_graph"
    			},
    			{
    				id: "arg_display_graph_nodes",
    				ref: "arg",
    				value: "state.display_graph.nodes"
    			},
    			{
    				id: "display_graph_out",
    				ref: "arg",
    				value: "state.display_graph.out"
    			},
    			{
    				id: "nodes",
    				ref: "arg",
    				value: "state.nodes"
    			},
    			{
    				id: "edges",
    				ref: "arg",
    				value: "state.display_graph.edges"
    			},
    			{
    				id: "links",
    				ref: "arg",
    				value: "state.links"
    			},
    			{
    				id: "editing",
    				ref: "arg",
    				value: "state.editing"
    			},
    			{
    				id: "search",
    				ref: "arg",
    				value: "state.search"
    			},
    			{
    				id: "selected",
    				ref: "arg",
    				value: "state.selected.0"
    			},
    			{
    				id: "arg_selected_edge",
    				ref: "arg",
    				value: "state.selected_edge"
    			},
    			{
    				id: "add_node_effect",
    				ref: "add_node"
    			},
    			{
    				id: "add_edge_effect",
    				ref: "add_edge"
    			},
    			{
    				id: "delete_node_effect",
    				ref: "delete_node"
    			},
    			{
    				id: "save_effect",
    				ref: "save_effect"
    			},
    			{
    				id: "show_edit_text",
    				ref: "show_edit_text"
    			},
    			{
    				id: "update_node",
    				ref: "update_node_action"
    			},
    			{
    				id: "open_reference_popover",
    				ref: "open_reference_popover"
    			},
    			{
    				id: "confirm_edit_text",
    				ref: "confirm_edit_text"
    			},
    			{
    				id: "onselectnode_effect",
    				ref: "onselectnode_effect"
    			},
    			{
    				id: "update_edge",
    				ref: "update_edge_action"
    			},
    			{
    				id: "onselectnode_action",
    				ref: "onselectnode_action"
    			},
    			{
    				id: "search_effect",
    				ref: "search_effect"
    			},
    			{
    				id: "focus_effect",
    				ref: "focus_effect"
    			},
    			{
    				id: "blur_effect",
    				ref: "blur_effect"
    			},
    			{
    				id: "stop_propagation",
    				ref: "stop_propagation_effect"
    			},
    			{
    				id: "copy_effect",
    				ref: "copy_effect"
    			},
    			{
    				id: "paste_effect",
    				ref: "paste_node_effect"
    			},
    			{
    				id: "expand_contract_effect",
    				ref: "expand_contract_effect"
    			},
    			{
    				id: "run_display_graph_effector",
    				ref: "run_display_graph_effect"
    			},
    			{
    				id: "run_display_graph_effect",
    				ref: "array"
    			},
    			{
    				id: "keybindings",
    				ref: "keybindings"
    			},
    			{
    				id: "mode",
    				script: "return editing !== false ? 'editing' : search !== false ? 'searching' : 'graph'"
    			},
    			{
    				id: "mode_keybindings",
    				ref: "get"
    			},
    			{
    				id: "key_action_effect",
    				ref: "get"
    			},
    			{
    				id: "effects_map",
    				ref: "switch"
    			},
    			{
    				id: "actions_map",
    				ref: "switch"
    			},
    			{
    				id: "key",
    				script: "return ev.key?.toLowerCase()"
    			},
    			{
    				id: "key_inputs",
    				script: "return (ev.ctrlKey ? 'ctrl_' : '') + (ev.shiftKey ? 'shift_' : '') + ev.key.toLowerCase()"
    			},
    			{
    				id: "selected_node",
    				ref: "find_node"
    			},
    			{
    				id: "edge_out",
    				script: "return edges.find(e => e.from === node_id)"
    			},
    			{
    				id: "el_node",
    				script: "return nodes.find(n => n.node_id === node_id)"
    			},
    			{
    				id: "save",
    				script: "return [[save_effect, {display_graph}]]"
    			},
    			{
    				id: "undo",
    				ref: "undo_action"
    			},
    			{
    				id: "redo",
    				ref: "redo_action"
    			},
    			{
    				id: "down",
    				script: "const next_node_edge = display_graph.edges.find(e => e.from === selected); return next_node_edge ? {state: {...state, selected: [next_node_edge.to]}, effects: [[stop_propagation, event], [state.panzoom_selected_effect, {...state, selected: [next_node_edge.to]}], [state.update_hyperapp]]} : {state, effects: [[stop_propagation, event]]}"
    			},
    			{
    				id: "up",
    				script: "const next_edges = display_graph.edges.filter(e => e.to === selected); const next_node_edge = next_edges[Math.ceil(next_edges.length / 2) - 1]; return next_node_edge ? {state: {...state, selected: [next_node_edge.from]}, effects: [[stop_propagation, event], [state.panzoom_selected_effect, {...state, selected: [next_node_edge.from]}], [state.update_hyperapp]]} : {state, effects: [[stop_propagation, event]]}"
    			},
    			{
    				id: "left",
    				script: "const current_node = nodes.find(n => n.node_id === selected); const siblings = levels.siblings.get(selected); const next_node = static ? nodes.find(n => n.node_id === siblings[(siblings.findIndex(s => s === selected) - 1 + siblings.length) % siblings.length]): siblings.reduce((dist, sibling) => { const sibling_node = nodes.find(n => n.node_id === sibling); if(!sibling_node){ return dist } const xdist = Math.abs(sibling_node.x - current_node.x); dist = (sibling_node.x < current_node.x) && xdist < dist[0] ? [xdist, sibling_node] : dist; return dist }, [dimensions.x])[1]; return next_node ? {state: {...state, selected: [next_node.node_id]}, effects: [[stop_propagation, event], [state.panzoom_selected_effect, {...state, selected: next_node.node_id}], [state.update_hyperapp]]} : {state, effects: [[stop_propagation, event]]}"
    			},
    			{
    				id: "left_edge",
    				script: "const link = links.find(l => l.source.node_child_id === selected_edge.from + '_' + selected_edge.to); return links.filter(l => l.target.node_id === link.target.node_id).reduce(([current, dist], l) => l.source.x < link.source.x && Math.abs(l.source.x - link.source.x) < dist ? [{from: l.source.node_id, to: l.target.node_id} , Math.abs(l.source.x - link.source.x)] : [current, dist], [selected_edge, 10000])[0]"
    			},
    			{
    				id: "right",
    				script: "const current_node = nodes.find(n => n.node_id === selected); const siblings = levels.siblings.get(selected); const next_node = static ? nodes.find(n => n.node_id === siblings[(siblings.findIndex(s => s === selected) + 1) % siblings.length]) : siblings.reduce((dist, sibling) => { const sibling_node = nodes.find(n => n.node_id === sibling); if(!sibling_node){ return dist } const xdist = Math.abs(sibling_node.x - current_node.x); dist = sibling_node.x > current_node.x && xdist < dist[0] ? [xdist, sibling_node] : dist; return dist }, [dimensions.x])[1]; return next_node ? {state: {...state, selected: [next_node.node_id]}, effects: [[stop_propagation, event], [state.panzoom_selected_effect, {...state, selected: next_node.node_id}], [state.update_hyperapp]]} : {state, effects: [[stop_propagation, event]]}"
    			},
    			{
    				id: "right_edge",
    				script: "const link = links.find(l => l.source.node_child_id === selected_edge.from + '_' + selected_edge.to); return links.filter(l => l.target.node_id === link.target.node_id).reduce(([current, dist], l) => l.source.x > link.source.x && Math.abs(l.source.x - link.source.x) < dist ? [{from: l.source.node_id, to: l.target.node_id} , Math.abs(l.source.x - link.source.x)] : [current, dist], [{to: link.target.node_id, from: link.source.node_id}, 10000])[0]"
    			},
    			{
    				id: "edit_value",
    				script: "return [[show_edit_text, {id, property:'value', oneditconfirm: update_node, value: selected_node.value, position: {x: node.x, y: node.y}}]]"
    			},
    			{
    				id: "edit_name",
    				script: "return [[show_edit_text, {id, property:'name', oneditconfirm: update_node, value: selected_node.name, position: {x: node.x, y: node.y}}]]"
    			},
    			{
    				id: "edit_ref",
    				script: "return [[show_edit_text, {id, property: 'ref', oneditconfirm: update_node, value: selected_node.ref, position: {x: node.x, y: node.y}}]]"
    			},
    			{
    				id: "edit_script",
    				script: "return [[show_edit_text, {id, property:'script', oneditconfirm: update_node, value: selected_node.script, position: {x: node.x, y: node.y}}]]"
    			},
    			{
    				id: "edit_edge",
    				script: "return [[show_edit_text, {id: edge, property: 'as', oneditconfirm: update_edge, value: edge.as, position: {x: node.x, y: node.y}}]]"
    			},
    			{
    				id: "select",
    				script: "return [[onselectnode, {node_id, event}]]"
    			},
    			{
    				id: "add_node",
    				script: "return [[add_node, {node: {id: randid}, select: true, child: selected}]]"
    			},
    			{
    				id: "delete_node",
    				script: "return [[delete_node, {id: selected}]]"
    			},
    			{
    				id: "copy",
    				script: "return [[copy_effect, {id}]]"
    			},
    			{
    				id: "paste",
    				script: "return [[paste_effect, {node_id: id, randid}]]"
    			},
    			{
    				id: "expand_contract",
    				script: "return [[expand_contract, {id}]]"
    			},
    			{
    				id: "add_arg_node",
    				script: "return [[add_node, {node: {id: randid, ref: 'arg'}, select: true, child: selected}], [show_edit_text, {id: randid, property:'value', oneditconfirm: update_node, value: ''}]]"
    			},
    			{
    				id: "find",
    				args: [
    				],
    				script: "return [[search, {search: ''}], [focus, {selector: `#${html_id}-search-input`}]]"
    			},
    			{
    				id: "cancel_search",
    				script: "return [[search, {search: false}], [blur, {selector: `#${html_id}-search-input`}]]"
    			},
    			{
    				id: "e",
    				script: "return selected_edge ? null : display_graph.edges.find(e => e.to === selected);"
    			},
    			{
    				id: "esc_editing",
    				script: "return [[confirm_edit_text]]"
    			},
    			{
    				id: "esc",
    				script: "return [[onselectnode, {node_id, event}]]"
    			},
    			{
    				id: "panzoom_selected_id",
    				script: "return selected"
    			},
    			{
    				id: "panzoom_selected_effector",
    				ref: "arg",
    				value: "state.panzoom_selected_effect"
    			},
    			{
    				id: "panzoom_selected_effect",
    				ref: "array"
    			},
    			{
    				id: "panzoom_selected_effect_arr",
    				ref: "array"
    			},
    			{
    				id: "panzoom_selected_payload"
    			},
    			{
    				id: "set_clipboard",
    				script: "state.clipboard = clipboard ? clipboard : state.clipboard; return state"
    			},
    			{
    				id: "graph_effects",
    				ref: "switch"
    			},
    			{
    				id: "update_effects_input",
    				script: "return typeof search === 'string' ? 'search' : 'graph'"
    			},
    			{
    				id: "update_effects",
    				ref: "switch"
    			},
    			{
    				id: "editing_effects",
    				ref: "switch"
    			},
    			{
    				id: "effects",
    				ref: "switch"
    			},
    			{
    				id: "update_graph_sim",
    				script: "return (!state.editing && state.search === false && (key === 'enter' || key.toLowerCase() === 'o' || key === 'x' || (key === 't' && shiftKey) || (!!pending_edges.edge_to && !!pending_edges.edge_from))) || key === 'escape' || selected"
    			},
    			{
    				id: "graph_state"
    			},
    			{
    				id: "search_state"
    			},
    			{
    				id: "update_state",
    				ref: "switch"
    			},
    			{
    				id: "no_update"
    			},
    			{
    				id: "update",
    				ref: "update_graph_display"
    			},
    			{
    				id: "update_effector",
    				ref: "hyperapp_action_effect"
    			},
    			{
    				id: "update_effect",
    				ref: "array"
    			},
    			{
    				id: "default_fx",
    				ref: "array"
    			},
    			{
    				id: "default_out"
    			},
    			{
    				id: "out_effects"
    			},
    			{
    				id: "out_action_effect",
    				ref: "default"
    			},
    			{
    				id: "out_pred",
    				script: "return action || effect"
    			},
    			{
    				id: "out",
    				ref: "if"
    			}
    		],
    		edges: [
    			{
    				from: "randid",
    				to: "add_node",
    				as: "randid"
    			},
    			{
    				from: "selected",
    				to: "add_node",
    				as: "selected"
    			},
    			{
    				from: "add_edge_effect",
    				to: "add_node",
    				as: "add_edge"
    			},
    			{
    				from: "add_node_effect",
    				to: "add_node",
    				as: "add_node"
    			},
    			{
    				from: "selected",
    				to: "copy",
    				as: "id"
    			},
    			{
    				from: "copy_effect",
    				to: "copy",
    				as: "copy_effect"
    			},
    			{
    				from: "selected",
    				to: "paste",
    				as: "id"
    			},
    			{
    				from: "randid",
    				to: "paste",
    				as: "randid"
    			},
    			{
    				from: "paste_effect",
    				to: "paste",
    				as: "paste_effect"
    			},
    			{
    				from: "selected",
    				to: "expand_contract",
    				as: "id"
    			},
    			{
    				from: "expand_contract_effect",
    				to: "expand_contract",
    				as: "expand_contract"
    			},
    			{
    				from: "randid",
    				to: "add_arg_node",
    				as: "randid"
    			},
    			{
    				from: "selected",
    				to: "add_arg_node",
    				as: "selected"
    			},
    			{
    				from: "add_edge_effect",
    				to: "add_arg_node",
    				as: "add_edge"
    			},
    			{
    				from: "add_node_effect",
    				to: "add_arg_node",
    				as: "add_node"
    			},
    			{
    				from: "show_edit_text",
    				to: "add_arg_node",
    				as: "show_edit_text"
    			},
    			{
    				from: "update_node",
    				to: "add_arg_node",
    				as: "update_node"
    			},
    			{
    				from: "edit_value",
    				to: "effects_map",
    				as: "edit_value"
    			},
    			{
    				from: "edit_name",
    				to: "effects_map",
    				as: "edit_name"
    			},
    			{
    				from: "edit_ref",
    				to: "effects_map",
    				as: "edit_ref"
    			},
    			{
    				from: "edit_script",
    				to: "effects_map",
    				as: "edit_script"
    			},
    			{
    				from: "edit_edge",
    				to: "effects_map",
    				as: "edit_edge"
    			},
    			{
    				from: "add_node",
    				to: "effects_map",
    				as: "add_node"
    			},
    			{
    				from: "add_arg_node",
    				to: "effects_map",
    				as: "add_arg_node"
    			},
    			{
    				from: "delete_node",
    				to: "effects_map",
    				as: "delete_node"
    			},
    			{
    				from: "copy",
    				to: "effects_map",
    				as: "copy"
    			},
    			{
    				from: "paste",
    				to: "effects_map",
    				as: "paste"
    			},
    			{
    				from: "expand_contract",
    				to: "effects_map",
    				as: "expand_contract"
    			},
    			{
    				from: "save",
    				to: "effects_map",
    				as: "save"
    			},
    			{
    				from: "cancel_search",
    				to: "effects_map",
    				as: "cancel_search"
    			},
    			{
    				from: "find",
    				to: "effects_map",
    				as: "find"
    			},
    			{
    				from: "select",
    				to: "effects_map",
    				as: "select"
    			},
    			{
    				from: "undo",
    				to: "actions_map",
    				as: "undo"
    			},
    			{
    				from: "redo",
    				to: "actions_map",
    				as: "redo"
    			},
    			{
    				from: "down",
    				to: "actions_map",
    				as: "down"
    			},
    			{
    				from: "up",
    				to: "actions_map",
    				as: "up"
    			},
    			{
    				from: "left",
    				to: "actions_map",
    				as: "left"
    			},
    			{
    				from: "right",
    				to: "actions_map",
    				as: "right"
    			},
    			{
    				from: "editing",
    				to: "mode",
    				as: "editing"
    			},
    			{
    				from: "search",
    				to: "mode",
    				as: "search"
    			},
    			{
    				from: "keybindings",
    				to: "mode_keybindings",
    				as: "target"
    			},
    			{
    				from: "mode",
    				to: "mode_keybindings",
    				as: "path"
    			},
    			{
    				from: "mode_keybindings",
    				to: "key_action_effect",
    				as: "target"
    			},
    			{
    				from: "key_inputs",
    				to: "key_action_effect",
    				as: "path"
    			},
    			{
    				from: "key_action_effect",
    				to: "effects_map",
    				as: "input"
    			},
    			{
    				from: "effects_map",
    				to: "out_effects",
    				as: "effects"
    			},
    			{
    				from: "state",
    				to: "out_effects",
    				as: "state"
    			},
    			{
    				from: "out_effects",
    				to: "out_action_effect",
    				as: "otherwise"
    			},
    			{
    				from: "key_action_effect",
    				to: "actions_map",
    				as: "input"
    			},
    			{
    				from: "actions_map",
    				to: "out_action_effect",
    				as: "value"
    			},
    			{
    				from: "out_action_effect",
    				to: "out",
    				as: "true"
    			},
    			{
    				from: "state",
    				to: "default_out",
    				as: "state"
    			},
    			{
    				from: "actions_map",
    				to: "out_pred",
    				as: "action"
    			},
    			{
    				from: "effects_map",
    				to: "out_pred",
    				as: "effect"
    			},
    			{
    				from: "run_display_graph_effector",
    				to: "run_display_graph_effect",
    				as: "a0"
    			},
    			{
    				from: "key_event",
    				to: "run_display_graph_effect",
    				as: "a1"
    			},
    			{
    				from: "run_display_graph_effect",
    				to: "_default_fx",
    				as: "a0"
    			},
    			{
    				from: "update",
    				to: "update_effector",
    				as: "fn",
    				type: "ref"
    			},
    			{
    				from: "update_effector",
    				to: "update_effect",
    				as: "a0"
    			},
    			{
    				from: "key_event",
    				to: "update_effect",
    				as: "a1"
    			},
    			{
    				from: "update_effect",
    				to: "default_fx",
    				as: "a0"
    			},
    			{
    				from: "default_fx",
    				to: "default_out",
    				as: "effects"
    			},
    			{
    				from: "out_pred",
    				to: "out",
    				as: "pred"
    			},
    			{
    				from: "default_out",
    				to: "out",
    				as: "false"
    			},
    			{
    				from: "state",
    				to: "key_inputs",
    				as: "state"
    			},
    			{
    				from: "key_event",
    				to: "key",
    				as: "ev"
    			},
    			{
    				from: "state",
    				to: "key_inputs",
    				as: "state"
    			},
    			{
    				from: "key_event",
    				to: "key_inputs",
    				as: "ev"
    			},
    			{
    				from: "arg_display_graph_nodes",
    				to: "selected_node",
    				as: "nodes"
    			},
    			{
    				from: "selected",
    				to: "selected_node",
    				as: "node_id"
    			},
    			{
    				from: "nodes",
    				to: "el_node",
    				as: "nodes"
    			},
    			{
    				from: "selected",
    				to: "el_node",
    				as: "node_id"
    			},
    			{
    				from: "edges",
    				to: "edge_out",
    				as: "edges"
    			},
    			{
    				from: "selected",
    				to: "edge_out",
    				as: "node_id"
    			},
    			{
    				from: "key_event",
    				to: "run"
    			},
    			{
    				from: "key_inputs",
    				to: "graph_effects",
    				as: "input"
    			},
    			{
    				from: "key_inputs",
    				to: "editing_effects",
    				as: "input"
    			},
    			{
    				from: "state",
    				to: "calculate_levels",
    				as: "state"
    			},
    			{
    				from: "selected",
    				to: "calculate_levels",
    				as: "selected"
    			},
    			{
    				from: "display_graph",
    				to: "calculate_levels",
    				as: "display_graph"
    			},
    			{
    				from: "key_inputs",
    				to: "edit_value",
    				as: "input"
    			},
    			{
    				from: "key_inputs",
    				to: "display_graph",
    				as: "input"
    			},
    			{
    				from: "key_inputs",
    				to: "clipboard",
    				as: "input"
    			},
    			{
    				from: "key_inputs",
    				to: "show_all",
    				as: "input"
    			},
    			{
    				from: "key_inputs",
    				to: "show_result",
    				as: "input"
    			},
    			{
    				from: "arg_display_graph",
    				to: "save",
    				as: "display_graph"
    			},
    			{
    				from: "save_effect",
    				to: "save",
    				as: "save_effect"
    			},
    			{
    				from: "onselectnode_action",
    				to: "up",
    				as: "onselectnode"
    			},
    			{
    				from: "state",
    				to: "up",
    				as: "state"
    			},
    			{
    				from: "selected",
    				to: "up",
    				as: "selected"
    			},
    			{
    				from: "arg_display_graph",
    				to: "up",
    				as: "display_graph"
    			},
    			{
    				from: "key_event",
    				to: "up",
    				as: "event"
    			},
    			{
    				from: "stop_propagation",
    				to: "up",
    				as: "stop_propagation"
    			},
    			{
    				from: "key_event",
    				to: "down",
    				as: "event"
    			},
    			{
    				from: "stop_propagation",
    				to: "down",
    				as: "stop_propagation"
    			},
    			{
    				from: "onselectnode_action",
    				to: "down",
    				as: "onselectnode"
    			},
    			{
    				from: "state",
    				to: "down",
    				as: "state"
    			},
    			{
    				from: "selected",
    				to: "down",
    				as: "selected"
    			},
    			{
    				from: "arg_display_graph",
    				to: "down",
    				as: "display_graph"
    			},
    			{
    				from: "show_edit_text",
    				to: "edit_value",
    				as: "show_edit_text"
    			},
    			{
    				from: "update_node",
    				to: "edit_value",
    				as: "update_node"
    			},
    			{
    				from: "el_node",
    				to: "edit_value",
    				as: "node"
    			},
    			{
    				from: "selected_node",
    				to: "edit_value",
    				as: "selected_node"
    			},
    			{
    				from: "selected",
    				to: "edit_value",
    				as: "id"
    			},
    			{
    				from: "edit_value",
    				to: "graph_effects",
    				as: "edit_value"
    			},
    			{
    				from: "selected_node",
    				to: "edit_name",
    				as: "selected_node"
    			},
    			{
    				from: "show_edit_text",
    				to: "edit_name",
    				as: "show_edit_text"
    			},
    			{
    				from: "update_node",
    				to: "edit_name",
    				as: "update_node"
    			},
    			{
    				from: "el_node",
    				to: "edit_name",
    				as: "node"
    			},
    			{
    				from: "selected",
    				to: "edit_name",
    				as: "id"
    			},
    			{
    				from: "edit_name",
    				to: "graph_effects",
    				as: "edit_name"
    			},
    			{
    				from: "el_node",
    				to: "edit_ref",
    				as: "node"
    			},
    			{
    				from: "selected_node",
    				to: "edit_ref",
    				as: "selected_node"
    			},
    			{
    				from: "show_edit_text",
    				to: "edit_ref",
    				as: "show_edit_text"
    			},
    			{
    				from: "update_node",
    				to: "edit_ref",
    				as: "update_node"
    			},
    			{
    				from: "selected",
    				to: "edit_ref",
    				as: "id"
    			},
    			{
    				from: "el_node",
    				to: "edit_script",
    				as: "node"
    			},
    			{
    				from: "show_edit_text",
    				to: "edit_script",
    				as: "show_edit_text"
    			},
    			{
    				from: "update_node",
    				to: "edit_script",
    				as: "update_node"
    			},
    			{
    				from: "selected_node",
    				to: "edit_script",
    				as: "selected_node"
    			},
    			{
    				from: "selected",
    				to: "edit_script",
    				as: "id"
    			},
    			{
    				from: "el_node",
    				to: "edit_edge",
    				as: "node"
    			},
    			{
    				from: "edge_out",
    				to: "edit_edge",
    				as: "edge"
    			},
    			{
    				from: "show_edit_text",
    				to: "edit_edge",
    				as: "show_edit_text"
    			},
    			{
    				from: "update_edge",
    				to: "edit_edge",
    				as: "update_edge"
    			},
    			{
    				from: "el_node",
    				to: "edit_edge",
    				as: "node"
    			},
    			{
    				from: "edit_ref",
    				to: "graph_effects",
    				as: "edit_ref"
    			},
    			{
    				from: "show_edit_text",
    				to: "s",
    				as: "show_edit_text"
    			},
    			{
    				from: "update_node",
    				to: "s",
    				as: "update_node"
    			},
    			{
    				from: "el_node",
    				to: "s",
    				as: "node"
    			},
    			{
    				from: "selected_node",
    				to: "s",
    				as: "selected_node"
    			},
    			{
    				from: "s",
    				to: "graph_effects",
    				as: "s"
    			},
    			{
    				from: "selected",
    				to: "select",
    				as: "node_id"
    			},
    			{
    				from: "onselectnode_effect",
    				to: "select",
    				as: "onselectnode"
    			},
    			{
    				from: "key_event",
    				to: "select",
    				as: "event"
    			},
    			{
    				from: "key_event",
    				to: "t"
    			},
    			{
    				from: "state",
    				to: "t"
    			},
    			{
    				from: "key_event",
    				to: "shift_t"
    			},
    			{
    				from: "state",
    				to: "shift_t"
    			},
    			{
    				from: "html_id",
    				to: "s",
    				as: "html_id"
    			},
    			{
    				from: "html_id",
    				to: "f",
    				as: "html_id"
    			},
    			{
    				from: "focus_effect",
    				to: "f",
    				as: "focus_effect"
    			},
    			{
    				from: "html_id",
    				to: "a",
    				as: "html_id"
    			},
    			{
    				from: "html_id",
    				to: "t",
    				as: "html_id"
    			},
    			{
    				from: "html_id",
    				to: "set_selected",
    				as: "html_id"
    			},
    			{
    				from: "html_id",
    				to: "esc_search",
    				as: "html_id"
    			},
    			{
    				from: "key_event",
    				to: "s"
    			},
    			{
    				from: "state",
    				to: "s"
    			},
    			{
    				from: "state",
    				to: "p"
    			},
    			{
    				from: "state",
    				to: "q"
    			},
    			{
    				from: "key_event",
    				to: "n"
    			},
    			{
    				from: "state",
    				to: "n"
    			},
    			{
    				from: "key_event",
    				to: "a"
    			},
    			{
    				from: "state",
    				to: "a"
    			},
    			{
    				from: "selected",
    				to: "delete_node",
    				as: "selected"
    			},
    			{
    				from: "delete_node_effect",
    				to: "delete_node",
    				as: "delete_node"
    			},
    			{
    				from: "randid",
    				to: "o",
    				as: "randid"
    			},
    			{
    				from: "selected",
    				to: "o",
    				as: "selected"
    			},
    			{
    				from: "add_edge_effect",
    				to: "o",
    				as: "add_edge"
    			},
    			{
    				from: "state",
    				to: "i",
    				as: "state"
    			},
    			{
    				from: "state",
    				to: "e"
    			},
    			{
    				from: "selected_node",
    				to: "y",
    				as: "node"
    			},
    			{
    				from: "key_event",
    				to: "left",
    				as: "event"
    			},
    			{
    				from: "dimensions",
    				to: "left",
    				as: "dimensions"
    			},
    			{
    				from: "links",
    				to: "left",
    				as: "links"
    			},
    			{
    				from: "arg_levels",
    				to: "left",
    				as: "levels"
    			},
    			{
    				from: "selected",
    				to: "left",
    				as: "selected"
    			},
    			{
    				from: "arg_selected_edge",
    				to: "left",
    				as: "selected_edge"
    			},
    			{
    				from: "arg_display_graph",
    				to: "left",
    				as: "display_graph"
    			},
    			{
    				from: "nodes",
    				to: "left",
    				as: "nodes"
    			},
    			{
    				from: "onselectnode_action",
    				to: "left",
    				as: "onselectnode"
    			},
    			{
    				from: "state",
    				to: "left",
    				as: "state"
    			},
    			{
    				from: "static",
    				to: "left",
    				as: "static"
    			},
    			{
    				from: "stop_propagation",
    				to: "left",
    				as: "stop_propagation"
    			},
    			{
    				from: "static",
    				to: "right",
    				as: "static"
    			},
    			{
    				from: "stop_propagation",
    				to: "right",
    				as: "stop_propagation"
    			},
    			{
    				from: "key_event",
    				to: "right",
    				as: "event"
    			},
    			{
    				from: "dimensions",
    				to: "right",
    				as: "dimensions"
    			},
    			{
    				from: "nodes",
    				to: "right",
    				as: "nodes"
    			},
    			{
    				from: "links",
    				to: "right",
    				as: "links"
    			},
    			{
    				from: "arg_levels",
    				to: "right",
    				as: "levels"
    			},
    			{
    				from: "selected",
    				to: "right",
    				as: "selected"
    			},
    			{
    				from: "arg_selected_edge",
    				to: "right",
    				as: "selected_edge"
    			},
    			{
    				from: "arg_display_graph",
    				to: "right",
    				as: "display_graph"
    			},
    			{
    				from: "onselectnode_action",
    				to: "right",
    				as: "onselectnode"
    			},
    			{
    				from: "state",
    				to: "right",
    				as: "state"
    			},
    			{
    				from: "static",
    				to: "right_edge",
    				as: "static"
    			},
    			{
    				from: "dimensions",
    				to: "right_edge",
    				as: "dimensions"
    			},
    			{
    				from: "nodes",
    				to: "right_edge",
    				as: "nodes"
    			},
    			{
    				from: "links",
    				to: "right_edge",
    				as: "links"
    			},
    			{
    				from: "arg_levels",
    				to: "right_edge",
    				as: "levels"
    			},
    			{
    				from: "selected",
    				to: "right_edge",
    				as: "selected"
    			},
    			{
    				from: "arg_selected_edge",
    				to: "right_edge",
    				as: "selected_edge"
    			},
    			{
    				from: "arg_display_graph",
    				to: "right_edge",
    				as: "display_graph"
    			},
    			{
    				from: "right_edge",
    				to: "selected_edge",
    				as: "arrowright"
    			},
    			{
    				from: "right_edge",
    				to: "selected_edge",
    				as: "l"
    			},
    			{
    				from: "selected_edge",
    				to: "set_selected_edge",
    				as: "selected_edge"
    			},
    			{
    				from: "state",
    				to: "pending_edges",
    				as: "state"
    			},
    			{
    				from: "key_event",
    				to: "pending_edges"
    			},
    			{
    				from: "pending_edges",
    				to: "make_edge",
    				as: "pending_edges"
    			},
    			{
    				from: "pending_edges",
    				to: "set_pending_edges",
    				as: "pending_edges"
    			},
    			{
    				from: "state",
    				to: "make_edge",
    				as: "state"
    			},
    			{
    				from: "q",
    				to: "show_all",
    				as: "q"
    			},
    			{
    				from: "i",
    				to: "show_result",
    				as: "i"
    			},
    			{
    				from: "confirm_edit_text",
    				to: "esc_editing",
    				as: "confirm_edit_text"
    			},
    			{
    				from: "esc_editing",
    				to: "editing_effects",
    				as: "escape"
    			},
    			{
    				from: "html_id",
    				to: "cancel_search",
    				as: "html_id"
    			},
    			{
    				from: "search_effect",
    				to: "cancel_search",
    				as: "search"
    			},
    			{
    				from: "blur_effect",
    				to: "cancel_search",
    				as: "blur"
    			},
    			{
    				from: "html_id",
    				to: "find",
    				as: "html_id"
    			},
    			{
    				from: "focus_effect",
    				to: "find",
    				as: "focus"
    			},
    			{
    				from: "search_effect",
    				to: "find",
    				as: "search"
    			}
    		]
    	},
    	{
    		id: "simulation",
    		ref: "arg",
    		value: "simulation"
    	},
    	{
    		id: "arg_nodes",
    		ref: "arg",
    		value: "nodes"
    	},
    	{
    		id: "arg_links",
    		ref: "arg",
    		value: "links"
    	},
    	{
    		id: "arg_selected",
    		ref: "arg",
    		value: "selected"
    	},
    	{
    		id: "arg_levels",
    		ref: "arg",
    		value: "levels"
    	},
    	{
    		id: "update_sim_effect",
    		script: "return (dispatch, payload) => payload ? !(payload.simulation || payload.static) ? undefined : _lib.scripts.updateSimulationNodes(dispatch, payload) : dispatch(state => [state, [() => !(state.simulation || state.static) ? undefined : _lib.scripts.updateSimulationNodes(dispatch, state)]])"
    	},
    	{
    		id: "update_sim_in"
    	},
    	{
    		id: "update_sim_fn",
    		ref: "execute_graph"
    	},
    	{
    		id: "_update_sim_effect",
    		ref: "wrap_effect_fn"
    	},
    	{
    		id: "stop_propagation_effect",
    		script: "return (_, payload) => {payload.stopPropagation(); payload.preventDefault();}"
    	},
    	{
    		id: "dispatch_custom_event_effect",
    		script: "return (_, payload) => document.getElementById(`${payload.html_id}`).dispatchEvent(new CustomEvent(payload.event, {detail: payload.detail}))"
    	},
    	{
    		id: "search_effect",
    		out: "out",
    		nodes: [
    			{
    				id: "in"
    			},
    			{
    				id: "search",
    				ref: "arg",
    				value: "payload.search"
    			},
    			{
    				id: "state",
    				ref: "arg",
    				value: "state"
    			},
    			{
    				id: "search_path",
    				value: "search"
    			},
    			{
    				id: "set_search",
    				ref: "set"
    			},
    			{
    				id: "result"
    			},
    			{
    				id: "out",
    				ref: "hyperapp_action_effect"
    			}
    		],
    		edges: [
    			{
    				from: "in",
    				to: "out",
    				as: "args",
    				type: "ref"
    			},
    			{
    				from: "state",
    				to: "set_search",
    				as: "target"
    			},
    			{
    				from: "search_path",
    				to: "set_search",
    				as: "path"
    			},
    			{
    				from: "search",
    				to: "set_search",
    				as: "value"
    			},
    			{
    				from: "set_search",
    				to: "result",
    				as: "state"
    			},
    			{
    				from: "result",
    				to: "out",
    				as: "fn",
    				type: "ref"
    			}
    		]
    	},
    	{
    		id: "create_object_graph",
    		out: "out",
    		nodes: [
    			{
    				id: "in"
    			},
    			{
    				id: "in_obj",
    				ref: "arg",
    				value: "obj"
    			},
    			{
    				id: "name",
    				ref: "arg",
    				value: "name"
    			},
    			{
    				id: "map_obj",
    				script: "return _lib.no.objToGraph(obj)"
    			},
    			{
    				id: "out_node_id",
    				script: "return Object.keys(obj)[0]"
    			},
    			{
    				id: "out"
    			}
    		],
    		edges: [
    			{
    				from: "in_obj",
    				to: "map_obj",
    				as: "obj"
    			},
    			{
    				from: "in_obj",
    				to: "out_node_id",
    				as: "obj"
    			},
    			{
    				from: "name",
    				to: "out_node",
    				as: "name"
    			},
    			{
    				from: "map_obj",
    				to: "out"
    			},
    			{
    				from: "in",
    				to: "out",
    				as: "args",
    				type: "ref"
    			},
    			{
    				from: "out_node_id",
    				to: "out",
    				as: "out"
    			}
    		]
    	},
    	{
    		id: "create_popover_graph",
    		out: "out",
    		nodes: [
    			{
    				id: "in"
    			},
    			{
    				id: "in_nodes",
    				ref: "arg",
    				value: "nodes"
    			},
    			{
    				id: "name",
    				ref: "arg",
    				value: "name"
    			},
    			{
    				id: "clear_popover",
    				ref: "clear_popover_graph"
    			},
    			{
    				id: "out_node",
    				script: "return {'id': 'out', name, value: [[clear_popover]]}"
    			},
    			{
    				id: "out_node_id",
    				value: "out"
    			},
    			{
    				id: "edges",
    				script: "return nodes.map(n => ({from: n.id, to: 'out', _needsresolve: true}))"
    			},
    			{
    				id: "nodes",
    				ref: "append"
    			},
    			{
    				id: "out"
    			}
    		],
    		edges: [
    			{
    				from: "clear_popover",
    				to: "out_node",
    				as: "clear_popover"
    			},
    			{
    				from: "name",
    				to: "out_node",
    				as: "name"
    			},
    			{
    				from: "out_node",
    				to: "nodes",
    				as: "item"
    			},
    			{
    				from: "in_nodes",
    				to: "nodes",
    				as: "array"
    			},
    			{
    				from: "in_nodes",
    				to: "edges",
    				as: "nodes"
    			},
    			{
    				from: "in",
    				to: "out",
    				as: "args",
    				type: "ref"
    			},
    			{
    				from: "nodes",
    				to: "out",
    				as: "nodes"
    			},
    			{
    				from: "edges",
    				to: "out",
    				as: "edges"
    			},
    			{
    				from: "out_node_id",
    				to: "out",
    				as: "out"
    			}
    		]
    	},
    	{
    		id: "graph_ui_action",
    		nodes: [
    			{
    				id: "in"
    			},
    			{
    				id: "payload",
    				ref: "arg",
    				value: "payload"
    			},
    			{
    				id: "state",
    				ref: "arg",
    				value: "state"
    			},
    			{
    				id: "name",
    				ref: "arg",
    				value: "state.display_graph.id"
    			},
    			{
    				id: "display_graph",
    				ref: "arg",
    				value: "state.display_graph"
    			},
    			{
    				id: "readonly",
    				ref: "arg",
    				value: "state.readonly"
    			},
    			{
    				id: "html_id",
    				ref: "arg",
    				value: "state.html_id"
    			},
    			{
    				id: "examples",
    				ref: "arg",
    				value: "state.examples"
    			},
    			{
    				id: "event_name",
    				value: "graphclick"
    			},
    			{
    				id: "id_path",
    				value: "id"
    			},
    			{
    				id: "clear_popover",
    				ref: "clear_popover_graph"
    			},
    			{
    				id: "clear_popover_effect",
    				ref: "array"
    			},
    			{
    				id: "save_effector",
    				ref: "save_effect"
    			},
    			{
    				id: "save_payload"
    			},
    			{
    				id: "save_effect",
    				ref: "array"
    			},
    			{
    				id: "save_node_effects",
    				ref: "array"
    			},
    			{
    				id: "save_name",
    				value: "save"
    			},
    			{
    				id: "save_id",
    				value: "save"
    			},
    			{
    				id: "save_node"
    			},
    			{
    				id: "export_effector",
    				ref: "export_effect"
    			},
    			{
    				id: "export_json_payload"
    			},
    			{
    				id: "export_json_ext",
    				value: "json"
    			},
    			{
    				id: "export_json_effect",
    				ref: "array"
    			},
    			{
    				id: "export_json_node_effects",
    				ref: "array"
    			},
    			{
    				id: "export_json_node_name",
    				value: "json"
    			},
    			{
    				id: "export_json_node_id",
    				value: "export_json"
    			},
    			{
    				id: "export_json_data",
    				script: "return JSON.stringify(display_graph)"
    			},
    			{
    				id: "export_js_payload"
    			},
    			{
    				id: "export_js_ext",
    				value: "js"
    			},
    			{
    				id: "export_js_effect",
    				ref: "array"
    			},
    			{
    				id: "export_js_node_effects",
    				ref: "array"
    			},
    			{
    				id: "export_js_node_name",
    				value: "js"
    			},
    			{
    				id: "export_js_node_id",
    				value: "export_js"
    			},
    			{
    				id: "export_js_data",
    				script: "return `let graph = ${JSON.stringify(display_graph)}; import('nodysseus.bundle.js').then(({runGraph}) => runGraph(graph, 'main/out', {}))`"
    			},
    			{
    				id: "export_json_name",
    				value: "export"
    			},
    			{
    				id: "export_json_id",
    				value: "export"
    			},
    			{
    				id: "export_js_name",
    				value: "export"
    			},
    			{
    				id: "export_js_id",
    				value: "export"
    			},
    			{
    				id: "export_json_node"
    			},
    			{
    				id: "export_js_node"
    			},
    			{
    				id: "export_node"
    			},
    			{
    				id: "new_graph_effector",
    				ref: "new_graph_effect"
    			},
    			{
    				id: "new_graph_effect",
    				ref: "array"
    			},
    			{
    				id: "new_graph_name",
    				value: "new_graph"
    			},
    			{
    				id: "new_graph_id",
    				value: "new_graph"
    			},
    			{
    				id: "new_graph_node_effects",
    				ref: "array"
    			},
    			{
    				id: "new_graph_node"
    			},
    			{
    				id: "popover_graph_actions",
    				ref: "array"
    			},
    			{
    				id: "empty",
    				value: {
    				}
    			},
    			{
    				id: "popover_graph_obj_actions",
    				ref: "array"
    			},
    			{
    				id: "popover_graph_obj"
    			},
    			{
    				id: "popover_graph_parent_obj",
    				ref: "set"
    			},
    			{
    				id: "popover_graph",
    				ref: "create_object_graph"
    			},
    			{
    				id: "show_popover_effector",
    				ref: "show_popover_graph"
    			},
    			{
    				id: "show_popover_effect",
    				ref: "array"
    			},
    			{
    				id: "show_popover_payload"
    			},
    			{
    				id: "display_graph_path",
    				value: "display_graph"
    			},
    			{
    				id: "change_display_graph_id",
    				ref: "change_display_graph_id"
    			},
    			{
    				id: "change_display_graph_id_node_name",
    				value: "change id"
    			},
    			{
    				id: "change_display_graph_id_node_id",
    				value: "change_display_graph_id_node"
    			},
    			{
    				id: "change_display_graph_id_node_value",
    				ref: "array"
    			},
    			{
    				id: "change_display_graph_id_node"
    			},
    			{
    				id: "show_edit_text_effector",
    				ref: "show_edit_text"
    			},
    			{
    				id: "show_edit_text_payload"
    			},
    			{
    				id: "show_edit_text_effect",
    				ref: "array"
    			},
    			{
    				id: "open_graph",
    				ref: "open_saved_graph_effect"
    			},
    			{
    				id: "open_obj",
    				script: "return Object.fromEntries(JSON.parse(localStorage.getItem('graph_list') ?? '[]').map(g => [g, [clear_popover, [open_graph, {id: g}]]]))"
    			},
    			{
    				id: "open_example_graph",
    				ref: "open_graph_effect"
    			},
    			{
    				id: "examples_obj",
    				script: "return Object.fromEntries(examples.map(e => ['example-' + e.id, [clear_popover, [open_graph, {graph: e}]]]))"
    			},
    			{
    				id: "stop_propagation_effector",
    				ref: "stop_propagation_effect"
    			},
    			{
    				id: "stop_propagation_effect",
    				ref: "array"
    			},
    			{
    				id: "dispatch_on_graph_click_effector",
    				ref: "dispatch_custom_event_effect"
    			},
    			{
    				id: "dispatch_on_graph_click_payload"
    			},
    			{
    				id: "dispatch_on_graph_click_effect",
    				ref: "array"
    			},
    			{
    				id: "edit_effects",
    				ref: "array"
    			},
    			{
    				id: "readonly_effects",
    				ref: "array"
    			},
    			{
    				id: "effects",
    				ref: "if"
    			},
    			{
    				id: "result"
    			},
    			{
    				id: "out",
    				ref: "hyperapp_action"
    			}
    		],
    		edges: [
    			{
    				from: "in",
    				to: "out",
    				as: "args"
    			},
    			{
    				from: "payload",
    				to: "stop_propagation_effect",
    				as: "a1"
    			},
    			{
    				from: "display_graph",
    				to: "save_payload",
    				as: "display_graph"
    			},
    			{
    				from: "clear_popover",
    				to: "clear_popover_effect",
    				as: "a0"
    			},
    			{
    				from: "clear_popover_effect",
    				to: "save_node_effects",
    				as: "a1"
    			},
    			{
    				from: "save_effector",
    				to: "save_effect",
    				as: "a0"
    			},
    			{
    				from: "save_payload",
    				to: "save_effect",
    				as: "a1"
    			},
    			{
    				from: "save_effect",
    				to: "save_node_effects",
    				as: "a0"
    			},
    			{
    				from: "save_effector",
    				to: "save_effect",
    				as: "a0"
    			},
    			{
    				from: "save_payload",
    				to: "save_effect",
    				as: "a1"
    			},
    			{
    				from: "save_effect",
    				to: "save_node_effects",
    				as: "a0"
    			},
    			{
    				from: "save_node_effects",
    				to: "popover_graph_obj",
    				as: "save"
    			},
    			{
    				from: "save_name",
    				to: "save_node",
    				as: "name"
    			},
    			{
    				from: "save_id",
    				to: "save_node",
    				as: "id"
    			},
    			{
    				from: "save_node",
    				to: "popover_graph_actions",
    				as: "a"
    			},
    			{
    				from: "clear_popover_effect",
    				to: "export_node_effects",
    				as: "a1"
    			},
    			{
    				from: "display_graph",
    				to: "export_json_data",
    				as: "display_graph"
    			},
    			{
    				from: "display_graph",
    				to: "export_js_data",
    				as: "display_graph"
    			},
    			{
    				from: "export_effector",
    				to: "export_json_effect",
    				as: "a0"
    			},
    			{
    				from: "export_effector",
    				to: "export_js_effect",
    				as: "a0"
    			},
    			{
    				from: "export_json_payload",
    				to: "export_json_effect",
    				as: "a1"
    			},
    			{
    				from: "export_js_payload",
    				to: "export_js_effect",
    				as: "a1"
    			},
    			{
    				from: "export_json_effect",
    				to: "export_json_node_effects",
    				as: "a0"
    			},
    			{
    				from: "export_js_effect",
    				to: "export_js_node_effects",
    				as: "a0"
    			},
    			{
    				from: "clear_popover_effect",
    				to: "export_json_node_effects",
    				as: "a1"
    			},
    			{
    				from: "clear_popover_effect",
    				to: "export_js_node_effects",
    				as: "a1"
    			},
    			{
    				from: "export_json_node_effects",
    				to: "export_json_node",
    				as: "_value"
    			},
    			{
    				from: "export_js_node_effects",
    				to: "export_js_node",
    				as: "_value"
    			},
    			{
    				from: "export_json_node",
    				to: "export_node",
    				as: "json"
    			},
    			{
    				from: "export_js_node",
    				to: "export_node",
    				as: "js"
    			},
    			{
    				from: "export_node",
    				to: "popover_graph_obj",
    				as: "export"
    			},
    			{
    				from: "export_json_data",
    				to: "export_json_payload",
    				as: "data"
    			},
    			{
    				from: "export_json_ext",
    				to: "export_json_payload",
    				as: "ext"
    			},
    			{
    				from: "name",
    				to: "export_json_payload",
    				as: "id"
    			},
    			{
    				from: "name",
    				to: "export_js_payload",
    				as: "id"
    			},
    			{
    				from: "export_js_data",
    				to: "export_js_payload",
    				as: "data"
    			},
    			{
    				from: "export_js_ext",
    				to: "export_js_payload",
    				as: "ext"
    			},
    			{
    				from: "export_node",
    				to: "popover_graph_actions",
    				as: "c"
    			},
    			{
    				from: "new_graph_effector",
    				to: "new_graph_effect",
    				as: "a0"
    			},
    			{
    				from: "new_graph_effect",
    				to: "new_graph_node_effects",
    				as: "a0"
    			},
    			{
    				from: "new_graph_node_effects",
    				to: "popover_graph_obj",
    				as: "new"
    			},
    			{
    				from: "new_graph_name",
    				to: "new_graph_node",
    				as: "name"
    			},
    			{
    				from: "new_graph_id",
    				to: "new_graph_node",
    				as: "id"
    			},
    			{
    				from: "new_graph_node",
    				to: "popover_graph_actions",
    				as: "b"
    			},
    			{
    				from: "change_display_graph_id_effector",
    				to: "change_display_graph_id_effect",
    				as: "a0"
    			},
    			{
    				from: "change_display_graph_id",
    				to: "show_edit_text_payload",
    				as: "oneditconfirm"
    			},
    			{
    				from: "display_graph_path",
    				to: "show_edit_text_payload",
    				as: "id"
    			},
    			{
    				from: "name",
    				to: "show_edit_text_payload",
    				as: "value"
    			},
    			{
    				from: "id_path",
    				to: "show_edit_text_payload",
    				as: "property"
    			},
    			{
    				from: "show_edit_text_effector",
    				to: "show_edit_text_effect",
    				as: "a0"
    			},
    			{
    				from: "show_edit_text_payload",
    				to: "show_edit_text_effect",
    				as: "a1"
    			},
    			{
    				from: "show_edit_text_effect",
    				to: "change_display_graph_id_node_value",
    				as: "a"
    			},
    			{
    				from: "clear_popover_effect",
    				to: "change_display_graph_id_node_value",
    				as: "b"
    			},
    			{
    				from: "change_display_graph_id_node_value",
    				to: "popover_graph_obj",
    				as: "change_name"
    			},
    			{
    				from: "change_display_graph_id_node_id",
    				to: "change_display_graph_id_node",
    				as: "id"
    			},
    			{
    				from: "change_display_graph_id_node_name",
    				to: "change_display_graph_id_node",
    				as: "name"
    			},
    			{
    				from: "change_display_graph_id_node",
    				to: "popover_graph_actions",
    				as: "d"
    			},
    			{
    				from: "clear_popover_effect",
    				to: "open_obj",
    				as: "clear_popover"
    			},
    			{
    				from: "open_graph",
    				to: "open_obj",
    				as: "open_graph"
    			},
    			{
    				from: "open_obj",
    				to: "popover_graph_obj",
    				as: "open"
    			},
    			{
    				from: "examples",
    				to: "examples_obj",
    				as: "examples"
    			},
    			{
    				from: "clear_popover_effect",
    				to: "examples_obj",
    				as: "clear_popover"
    			},
    			{
    				from: "open_example_graph",
    				to: "examples_obj",
    				as: "open_graph"
    			},
    			{
    				from: "examples_obj",
    				to: "popover_graph_obj",
    				as: "examples"
    			},
    			{
    				from: "clear_popover_effect",
    				to: "popover_graph_obj_actions",
    				as: "a0"
    			},
    			{
    				from: "popover_graph_obj_actions",
    				to: "popover_graph_obj",
    				as: "_value"
    			},
    			{
    				from: "name",
    				to: "popover_graph",
    				as: "name"
    			},
    			{
    				from: "empty",
    				to: "popover_graph_parent_obj",
    				as: "target"
    			},
    			{
    				from: "name",
    				to: "popover_graph_parent_obj",
    				as: "path"
    			},
    			{
    				from: "popover_graph_obj",
    				to: "popover_graph_parent_obj",
    				as: "value"
    			},
    			{
    				from: "popover_graph_parent_obj",
    				to: "popover_graph",
    				as: "obj",
    				type: "resolve"
    			},
    			{
    				from: "popover_graph",
    				to: "show_popover_payload",
    				as: "popover_graph"
    			},
    			{
    				from: "show_popover_effector",
    				to: "show_popover_effect",
    				as: "a0"
    			},
    			{
    				from: "show_popover_payload",
    				to: "show_popover_effect",
    				as: "a1"
    			},
    			{
    				from: "stop_propagation_effector",
    				to: "stop_propagation_effect",
    				as: "a0"
    			},
    			{
    				from: "payload",
    				to: "stop_propagation_effect",
    				as: "a1"
    			},
    			{
    				from: "stop_propagation_effect",
    				to: "edit_effects",
    				as: "a1"
    			},
    			{
    				from: "html_id",
    				to: "dispatch_on_graph_click_payload",
    				as: "html_id"
    			},
    			{
    				from: "event_name",
    				to: "dispatch_on_graph_click_payload",
    				as: "event"
    			},
    			{
    				from: "dispatch_on_graph_click_effector",
    				to: "dispatch_on_graph_click_effect",
    				as: "a0"
    			},
    			{
    				from: "dispatch_on_graph_click_payload",
    				to: "dispatch_on_graph_click_effect",
    				as: "a1"
    			},
    			{
    				from: "dispatch_on_graph_click_effect",
    				to: "readonly_effects",
    				as: "a0"
    			},
    			{
    				from: "show_popover_effect",
    				to: "edit_effects",
    				as: "a0"
    			},
    			{
    				from: "edit_effects",
    				to: "effects",
    				as: "false"
    			},
    			{
    				from: "readonly_effects",
    				to: "effects",
    				as: "true"
    			},
    			{
    				from: "readonly",
    				to: "effects",
    				as: "pred"
    			},
    			{
    				from: "effects",
    				to: "result",
    				as: "effects"
    			},
    			{
    				from: "state",
    				to: "result",
    				as: "state"
    			},
    			{
    				from: "result",
    				to: "out",
    				as: "fn",
    				type: "ref"
    			}
    		]
    	},
    	{
    		id: "onclick_graph_action",
    		nodes: [
    			{
    				id: "state",
    				ref: "arg",
    				value: "state"
    			},
    			{
    				id: "false",
    				value: false
    			},
    			{
    				id: "search_payload"
    			},
    			{
    				id: "search_effect",
    				ref: "search_effect"
    			},
    			{
    				id: "clear_search",
    				ref: "array"
    			},
    			{
    				id: "effects",
    				ref: "array"
    			},
    			{
    				id: "result"
    			},
    			{
    				id: "out",
    				ref: "hyperapp_action"
    			}
    		],
    		edges: [
    			{
    				from: "false",
    				to: "search_payload",
    				as: "search"
    			},
    			{
    				from: "search_payload",
    				to: "clear_search",
    				as: "a1"
    			},
    			{
    				from: "search_effect",
    				to: "clear_search",
    				as: "a0"
    			},
    			{
    				from: "clear_search",
    				to: "effects",
    				as: "a0"
    			},
    			{
    				from: "effects",
    				to: "result",
    				as: "effects"
    			},
    			{
    				from: "state",
    				to: "result",
    				as: "state"
    			},
    			{
    				from: "result",
    				to: "out",
    				as: "fn",
    				type: "ref"
    			}
    		]
    	},
    	{
    		id: "onselectnode",
    		nodes: [
    			{
    				id: "in"
    			},
    			{
    				id: "state",
    				ref: "arg",
    				value: "state"
    			},
    			{
    				id: "html_id",
    				ref: "arg",
    				value: "state.html_id"
    			},
    			{
    				id: "event",
    				ref: "arg",
    				value: "payload.event"
    			},
    			{
    				id: "node_id",
    				ref: "arg",
    				value: "payload.node_id"
    			},
    			{
    				id: "arg_selected",
    				ref: "arg",
    				value: "state.selected"
    			},
    			{
    				id: "readonly",
    				ref: "arg",
    				value: "state.readonly"
    			},
    			{
    				id: "arg_display_graph",
    				ref: "arg",
    				value: "state.display_graph"
    			},
    			{
    				id: "display_graph_nodes",
    				ref: "arg",
    				value: "state.display_graph.nodes"
    			},
    			{
    				id: "node_el_width",
    				ref: "arg",
    				value: "state.node_el_width"
    			},
    			{
    				id: "dimensions",
    				ref: "arg",
    				value: "state.dimensions"
    			},
    			{
    				id: "nodes",
    				ref: "arg",
    				value: "state.nodes"
    			},
    			{
    				id: "links",
    				ref: "arg",
    				value: "state.links"
    			},
    			{
    				id: "wrapped_node_id",
    				ref: "wrap_array"
    			},
    			{
    				id: "get_selected_node",
    				script: "return Object.assign({}, nodes.find(n => n.node_id === node_id), display_graph.nodes.find(n => n.id === node_id))"
    			},
    			{
    				id: "show_all_path",
    				value: "show_all"
    			},
    			{
    				id: "set_selected",
    				args: [
    					"selected",
    					"state"
    				],
    				script: "return {...state, selected: [node_id]}"
    			},
    			{
    				id: "display_graph_inputs",
    				script: "return event.ty === 'down' && node.node_id === selected[0] ? 'expand_contract' : undefined"
    			},
    			{
    				id: "display_graph",
    				ref: "switch"
    			},
    			{
    				id: "set_display_graph",
    				args: [
    					"display_graph",
    					"state"
    				],
    				script: "state.display_graph = display_graph ?? state.display_graph; return state"
    			},
    			{
    				id: "false",
    				value: false
    			},
    			{
    				id: "should_show_popover",
    				script: "return !readonly && node_id === selected[0]"
    			},
    			{
    				id: "randid",
    				ref: "arg",
    				value: "state.randid"
    			},
    			{
    				id: "add_node_effect",
    				ref: "add_node"
    			},
    			{
    				id: "add_edge_effect",
    				ref: "add_edge"
    			},
    			{
    				id: "paste_node_effect",
    				ref: "paste_node_effect"
    			},
    			{
    				id: "copy_effect",
    				ref: "copy_effect"
    			},
    			{
    				id: "delete_node_effect",
    				ref: "delete_node"
    			},
    			{
    				id: "expand_contract_effect",
    				ref: "expand_contract_effect"
    			},
    			{
    				id: "open_reference_popover",
    				ref: "open_reference_popover"
    			},
    			{
    				id: "show_edit_text",
    				ref: "show_edit_text"
    			},
    			{
    				id: "clear_popover",
    				ref: "clear_popover_graph"
    			},
    			{
    				id: "update_node",
    				ref: "update_node_action"
    			},
    			{
    				id: "update_node_effect",
    				ref: "update_node"
    			},
    			{
    				id: "create_reference_effect",
    				ref: "create_reference_effect"
    			},
    			{
    				id: "popover_graph_obj",
    				script: "return {[selected.node_id]: {_value: [[clear_popover]], inputs: {create_input: [[add_node, {node: {id: randid}, select: true, child: selected.node_id}], [clear_popover]], arg: [[add_node, {node: {id: randid, ref: 'arg'}, select: true, child: selected.node_id}], [show_edit_text, {id: randid, property:'value', oneditconfirm: update_node, value: ''}], [clear_popover]]}, structure: {delete: [[delete_node, {id: selected.node_id}], [clear_popover]], expand_contract: [[expand_contract, {id: selected.node_id}], [clear_popover]]}, change: {name: [[show_edit_text, {id: selected.node_id, property:'name', position: {x: selected.x, y: selected.y}, oneditconfirm: update_node, value: selected.name}], [clear_popover]], value: [[show_edit_text, {id: selected.node_id, property:'value', position: {x: selected.x, y: selected.y}, oneditconfirm: update_node, value: selected.value}], [clear_popover]], script: [[show_edit_text, {id: selected.node_id, property:'script', position: {x: selected.x, y: selected.y}, oneditconfirm: update_node, value: selected.script}], [clear_popover]]}, clipboard: {copy: [[copy_effect, {id: selected.node_id}], [clear_popover]], paste: [[paste_node_effect, {randid, node_id: selected.node_id}], [clear_popover]]}, reference: {create: [[create_reference_effect, {id: selected.node_id}], [clear_popover]], clear: [[update_node_effect, {id: selected.node_id, properties: {ref: undefined}}], [clear_popover]], copy: [[update_node_effect, {id: selected.node_id, properties: {...nodes.find(n => n.id === selected.ref), id: selected.node_id, ref: undefined}}], [clear_popover]], change: [[show_edit_text, {id: selected.node_id, property: 'ref', position: {x: selected.x, y: selected.y}, oneditconfirm: update_node, value: selected.ref}], [clear_popover]]}}}"
    			},
    			{
    				id: "popover_graph_value",
    				ref: "create_object_graph"
    			},
    			{
    				id: "dispatch_custom_event_effect",
    				script: "return [(_, payload) => document.getElementById(`${html_id}`).dispatchEvent(new CustomEvent(`selectnode`, {detail: {node: node_id}}))]"
    			},
    			{
    				id: "show_popover_payload"
    			},
    			{
    				id: "show_popover_effector",
    				ref: "show_popover_graph"
    			},
    			{
    				id: "show_popover_effect",
    				ref: "array"
    			},
    			{
    				id: "stop_propagation_effector",
    				ref: "stop_propagation_effect"
    			},
    			{
    				id: "payload",
    				ref: "arg",
    				value: "payload"
    			},
    			{
    				id: "stop_propagation_effect",
    				ref: "array"
    			},
    			{
    				id: "panzoom_selected_effector",
    				ref: "arg",
    				value: "state.panzoom_selected_effect"
    			},
    			{
    				id: "panzoom_selected_effect",
    				ref: "array"
    			},
    			{
    				id: "panzoom_selected_payload"
    			},
    			{
    				id: "clear_search_payload",
    				value: {
    					search: false
    				}
    			},
    			{
    				id: "search_effect",
    				ref: "search_effect"
    			},
    			{
    				id: "clear_search",
    				ref: "array"
    			},
    			{
    				id: "if_show_popover",
    				ref: "if"
    			},
    			{
    				id: "effects",
    				ref: "array"
    			},
    			{
    				id: "out",
    				ref: "update_graph_display"
    			}
    		],
    		edges: [
    			{
    				from: "in",
    				to: "out",
    				as: "args"
    			},
    			{
    				from: "node_id",
    				to: "selected_inputs",
    				as: "node_id"
    			},
    			{
    				from: "node_id",
    				to: "get_selected_node",
    				as: "node_id"
    			},
    			{
    				from: "arg_display_graph",
    				to: "get_selected_node",
    				as: "display_graph"
    			},
    			{
    				from: "nodes",
    				to: "get_selected_node",
    				as: "nodes"
    			},
    			{
    				from: "get_selected_node",
    				to: "selected_inputs",
    				as: "node"
    			},
    			{
    				from: "event",
    				to: "selected_inputs",
    				as: "event"
    			},
    			{
    				from: "node_id",
    				to: "wrapped_node_id",
    				as: "value"
    			},
    			{
    				from: "wrapped_node_id",
    				to: "selected",
    				as: "node_id"
    			},
    			{
    				from: "state",
    				to: "set_selected",
    				as: "state"
    			},
    			{
    				from: "node_id",
    				to: "set_selected",
    				as: "node_id"
    			},
    			{
    				from: "html_id",
    				to: "set_selected",
    				as: "html_id"
    			},
    			{
    				from: "set_selected",
    				to: "set_display_graph",
    				as: "state"
    			},
    			{
    				from: "display_graph",
    				to: "set_display_graph",
    				as: "display_graph"
    			},
    			{
    				from: "get_selected_node",
    				to: "display_graph_inputs",
    				as: "node"
    			},
    			{
    				from: "state",
    				to: "display_graph_inputs"
    			},
    			{
    				from: "event",
    				to: "display_graph_inputs",
    				as: "event"
    			},
    			{
    				from: "display_graph_inputs",
    				to: "display_graph",
    				as: "input"
    			},
    			{
    				from: "state",
    				to: "expand_contract"
    			},
    			{
    				from: "node_id",
    				to: "expand_contract",
    				as: "node_id"
    			},
    			{
    				from: "event",
    				to: "out",
    				as: "payload"
    			},
    			{
    				from: "show_popover_effector",
    				to: "show_popover_effect",
    				as: "arg0"
    			},
    			{
    				from: "event",
    				to: "stop_propagation_effect",
    				as: "a1"
    			},
    			{
    				from: "stop_propagation_effector",
    				to: "stop_propagation_effect",
    				as: "a0"
    			},
    			{
    				from: "randid",
    				to: "popover_graph_obj",
    				as: "randid"
    			},
    			{
    				from: "display_graph_nodes",
    				to: "popover_graph_obj",
    				as: "nodes"
    			},
    			{
    				from: "get_selected_node",
    				to: "popover_graph_obj",
    				as: "selected"
    			},
    			{
    				from: "add_node_effect",
    				to: "popover_graph_obj",
    				as: "add_node"
    			},
    			{
    				from: "add_edge_effect",
    				to: "popover_graph_obj",
    				as: "add_edge"
    			},
    			{
    				from: "delete_node_effect",
    				to: "popover_graph_obj",
    				as: "delete_node"
    			},
    			{
    				from: "expand_contract_effect",
    				to: "popover_graph_obj",
    				as: "expand_contract"
    			},
    			{
    				from: "open_reference_popover",
    				to: "popover_graph_obj",
    				as: "open_reference_popover"
    			},
    			{
    				from: "show_edit_text",
    				to: "popover_graph_obj",
    				as: "show_edit_text"
    			},
    			{
    				from: "clear_popover",
    				to: "popover_graph_obj",
    				as: "clear_popover"
    			},
    			{
    				from: "update_node",
    				to: "popover_graph_obj",
    				as: "update_node"
    			},
    			{
    				from: "update_node_effect",
    				to: "popover_graph_obj",
    				as: "update_node_effect"
    			},
    			{
    				from: "copy_effect",
    				to: "popover_graph_obj",
    				as: "copy_effect"
    			},
    			{
    				from: "paste_node_effect",
    				to: "popover_graph_obj",
    				as: "paste_node_effect"
    			},
    			{
    				from: "create_reference_effect",
    				to: "popover_graph_obj",
    				as: "create_reference_effect"
    			},
    			{
    				from: "popover_graph_obj",
    				to: "popover_graph_value",
    				as: "obj"
    			},
    			{
    				from: "popover_graph_value",
    				to: "show_popover_payload",
    				as: "popover_graph"
    			},
    			{
    				from: "show_popover_payload",
    				to: "show_popover_effect",
    				as: "arg1"
    			},
    			{
    				from: "show_popover_effect",
    				to: "if_show_popover",
    				as: "true"
    			},
    			{
    				from: "false",
    				to: "if_show_popover",
    				as: "false"
    			},
    			{
    				from: "node_id",
    				to: "should_show_popover",
    				as: "node_id"
    			},
    			{
    				from: "readonly",
    				to: "should_show_popover",
    				as: "readonly"
    			},
    			{
    				from: "arg_selected",
    				to: "should_show_popover",
    				as: "selected"
    			},
    			{
    				from: "should_show_popover",
    				to: "if_show_popover",
    				as: "pred"
    			},
    			{
    				from: "arg_selected",
    				to: "dispatch_custom_event_effect",
    				as: "selected"
    			},
    			{
    				from: "html_id",
    				to: "dispatch_custom_event_effect",
    				as: "html_id"
    			},
    			{
    				from: "node_id",
    				to: "dispatch_custom_event_effect",
    				as: "node_id"
    			},
    			{
    				from: "if_show_popover",
    				to: "effects",
    				as: "a1"
    			},
    			{
    				from: "stop_propagation_effect",
    				to: "effects",
    				as: "a0"
    			},
    			{
    				from: "dispatch_custom_event_effect",
    				to: "effects",
    				as: "a2"
    			},
    			{
    				from: "node_id",
    				to: "panzoom_selected_payload",
    				as: "selected"
    			},
    			{
    				from: "html_id",
    				to: "panzoom_selected_payload",
    				as: "html_id"
    			},
    			{
    				from: "dimensions",
    				to: "panzoom_selected_payload",
    				as: "dimensions"
    			},
    			{
    				from: "node_el_width",
    				to: "panzoom_selected_payload",
    				as: "node_el_width"
    			},
    			{
    				from: "links",
    				to: "panzoom_selected_payload",
    				as: "links"
    			},
    			{
    				from: "nodes",
    				to: "panzoom_selected_payload",
    				as: "nodes"
    			},
    			{
    				from: "panzoom_selected_payload",
    				to: "panzoom_selected_effect",
    				as: "a1"
    			},
    			{
    				from: "panzoom_selected_effector",
    				to: "panzoom_selected_effect",
    				as: "a0"
    			},
    			{
    				from: "panzoom_selected_effect",
    				to: "effects",
    				as: "a3"
    			},
    			{
    				from: "search_effect",
    				to: "clear_search",
    				as: "a0"
    			},
    			{
    				from: "clear_search_payload",
    				to: "clear_search",
    				as: "a1"
    			},
    			{
    				from: "clear_search",
    				to: "effects",
    				as: "a4"
    			},
    			{
    				from: "effects",
    				to: "out",
    				as: "effects",
    				type: "resolve"
    			},
    			{
    				from: "set_selected",
    				to: "out",
    				as: "state"
    			}
    		]
    	},
    	{
    		id: "onselectnode_effect",
    		nodes: [
    			{
    				id: "in"
    			},
    			{
    				id: "onselectnode",
    				ref: "onselectnode"
    			},
    			{
    				id: "out",
    				ref: "hyperapp_action_effect"
    			}
    		],
    		edges: [
    			{
    				from: "in",
    				to: "out",
    				type: "ref",
    				as: "args"
    			},
    			{
    				from: "onselectnode",
    				to: "out",
    				as: "fn",
    				type: "ref"
    			}
    		]
    	},
    	{
    		id: "onselectnode_action",
    		nodes: [
    			{
    				id: "in"
    			},
    			{
    				id: "onselectnode",
    				ref: "onselectnode"
    			},
    			{
    				id: "out",
    				ref: "hyperapp_action"
    			}
    		],
    		edges: [
    			{
    				from: "in",
    				to: "out",
    				type: "ref",
    				as: "args"
    			},
    			{
    				from: "onselectnode",
    				to: "out",
    				as: "fn",
    				type: "ref"
    			}
    		]
    	},
    	{
    		id: "open_edge_popover",
    		nodes: [
    			{
    				id: "state",
    				ref: "arg",
    				value: "state"
    			},
    			{
    				id: "edge",
    				ref: "arg",
    				value: "state.edit_id"
    			},
    			{
    				id: "edge_as",
    				ref: "arg",
    				value: "state.edit_id.as"
    			},
    			{
    				id: "state",
    				ref: "arg",
    				value: "state"
    			},
    			{
    				id: "readonly",
    				ref: "arg",
    				value: "state.readonly"
    			},
    			{
    				id: "randid",
    				ref: "arg",
    				value: "state.randid"
    			},
    			{
    				id: "display_graph_nodes",
    				ref: "arg",
    				value: "state.display_graph.nodes"
    			},
    			{
    				id: "links",
    				ref: "arg",
    				value: "state.links"
    			},
    			{
    				id: "event",
    				ref: "arg",
    				value: "payload.event"
    			},
    			{
    				id: "as_path",
    				value: "as"
    			},
    			{
    				id: "clear_popover",
    				ref: "clear_popover_graph"
    			},
    			{
    				id: "clear_popover_type",
    				ref: "clear_popover_graph"
    			},
    			{
    				id: "update_edge",
    				ref: "update_edge"
    			},
    			{
    				id: "update_edge_action",
    				ref: "update_edge_action"
    			},
    			{
    				id: "show_edit_text",
    				ref: "show_edit_text"
    			},
    			{
    				id: "insert_node",
    				ref: "insert_node"
    			},
    			{
    				id: "update_sim",
    				ref: "arg",
    				value: "update_sim_effect"
    			},
    			{
    				id: "type_popover_actions",
    				script: "return {change_type: {_value: [[clear_popover]], ref: [[update_edge, {id: edge, properties: {type: 'ref'}}], [clear_popover]], none: [[update_edge, {id: edge, properties: {type: undefined}}], [clear_popover]], resolve: [[update_edge, {id: edge, properties: {type: 'resolve'}}], [clear_popover]]}}"
    			},
    			{
    				id: "type_popover",
    				ref: "create_object_graph"
    			},
    			{
    				id: "type_popover_name",
    				value: "change_type"
    			},
    			{
    				id: "to_name",
    				script: "return nodes.find(n => n.id === edge.to).name"
    			},
    			{
    				id: "popover_graph_actions",
    				script: "return {edit_edge: {_value: [[clear_popover]], 'change_type': [[show_popover_graph, {popover_graph: type_popover}]],'change_as': [[show_edit_text, {id: edge, property: 'as', value: edge.as, oneditconfirm: update_edge}], [clear_popover]], 'insert': {node: [[insert_node, {node: {id: randid}, edge, in_node: false}], [clear_popover]], in_node: [[insert_node, {node: {id:  randid, name: (to_name ?? edge.to) + '/in'}, edge, in_node: true}], [clear_popover]]}}}"
    			},
    			{
    				id: "popover_graph_name",
    				value: "change edge"
    			},
    			{
    				id: "popover_graph",
    				ref: "create_object_graph"
    			},
    			{
    				id: "show_popover_graph_payload"
    			},
    			{
    				id: "show_popover_graph_effector",
    				ref: "show_popover_graph"
    			},
    			{
    				id: "show_popover_graph",
    				ref: "array"
    			},
    			{
    				id: "effects",
    				ref: "array"
    			},
    			{
    				id: "result"
    			},
    			{
    				id: "out",
    				ref: "hyperapp_action"
    			}
    		],
    		edges: [
    			{
    				from: "type_popover_actions",
    				to: "type_popover",
    				as: "obj"
    			},
    			{
    				from: "type_popover_name",
    				to: "type_popover",
    				as: "name"
    			},
    			{
    				from: "edge",
    				to: "type_popover_actions",
    				as: "edge"
    			},
    			{
    				from: "clear_popover_type",
    				to: "type_popover_actions",
    				as: "clear_popover"
    			},
    			{
    				from: "update_edge",
    				to: "type_popover_actions",
    				as: "update_edge"
    			},
    			{
    				from: "update_edge_action",
    				to: "popover_graph_actions",
    				as: "update_edge"
    			},
    			{
    				from: "type_popover",
    				to: "popover_graph_actions",
    				as: "type_popover"
    			},
    			{
    				from: "edge",
    				to: "clear_popover",
    				as: "edge"
    			},
    			{
    				from: "edge",
    				to: "to_name",
    				as: "edge"
    			},
    			{
    				from: "display_graph_nodes",
    				to: "to_name",
    				as: "nodes"
    			},
    			{
    				from: "to_name",
    				to: "popover_graph_actions",
    				as: "to_name"
    			},
    			{
    				from: "clear_popover",
    				to: "popover_graph_actions",
    				as: "clear_popover"
    			},
    			{
    				from: "insert_node",
    				to: "popover_graph_actions",
    				as: "insert_node"
    			},
    			{
    				from: "edge",
    				to: "popover_graph_actions",
    				as: "edge"
    			},
    			{
    				from: "randid",
    				to: "popover_graph_actions",
    				as: "randid"
    			},
    			{
    				from: "show_edit_text",
    				to: "popover_graph_actions",
    				as: "show_edit_text"
    			},
    			{
    				from: "update_sim",
    				to: "popover_graph_actions",
    				as: "update_sim"
    			},
    			{
    				from: "show_popover_graph_effector",
    				to: "popover_graph_actions",
    				as: "show_popover_graph"
    			},
    			{
    				from: "popover_graph_actions",
    				to: "popover_graph",
    				as: "obj"
    			},
    			{
    				from: "popover_graph_name",
    				to: "popover_graph",
    				as: "name"
    			},
    			{
    				from: "popover_graph",
    				to: "show_popover_graph_payload",
    				as: "popover_graph"
    			},
    			{
    				from: "show_popover_graph_effector",
    				to: "show_popover_graph",
    				as: "a0"
    			},
    			{
    				from: "show_popover_graph_payload",
    				to: "show_popover_graph",
    				as: "a1"
    			},
    			{
    				from: "show_popover_graph",
    				to: "effects",
    				as: "a0"
    			},
    			{
    				from: "effects",
    				to: "result",
    				as: "effects"
    			},
    			{
    				from: "state",
    				to: "result",
    				as: "state"
    			},
    			{
    				from: "result",
    				to: "out",
    				as: "fn",
    				type: "ref"
    			}
    		]
    	},
    	{
    		id: "onclick_edge",
    		out: "out",
    		nodes: [
    			{
    				id: "in"
    			},
    			{
    				id: "edge",
    				ref: "arg",
    				value: "payload.edge"
    			},
    			{
    				id: "edge_as",
    				ref: "arg",
    				value: "payload.edge.as"
    			},
    			{
    				id: "state",
    				ref: "arg",
    				value: "state"
    			},
    			{
    				id: "readonly",
    				ref: "arg",
    				value: "state.readonly"
    			},
    			{
    				id: "randid",
    				ref: "arg",
    				value: "state.randid"
    			},
    			{
    				id: "display_graph_nodes",
    				ref: "arg",
    				value: "state.display_graph.nodes"
    			},
    			{
    				id: "links",
    				ref: "arg",
    				value: "state.links"
    			},
    			{
    				id: "event",
    				ref: "arg",
    				value: "payload.event"
    			},
    			{
    				id: "as_path",
    				value: "as"
    			},
    			{
    				id: "update_edge",
    				ref: "update_edge"
    			},
    			{
    				id: "update_edge_action",
    				ref: "update_edge_action"
    			},
    			{
    				id: "show_edit_text",
    				ref: "show_edit_text"
    			},
    			{
    				id: "edit_text_position",
    				script: "return links.filter(l => l.source.node_id === edge.from && l.target.node_id === edge.to).map(l => ({x: (l.source.x + l.target.x) * 0.5, y: (l.source.y + l.target.y) * 0.5}))[0]"
    			},
    			{
    				id: "open_edge_popover",
    				ref: "open_edge_popover"
    			},
    			{
    				id: "edit_edge_as_payload"
    			},
    			{
    				id: "edit_edge_as",
    				ref: "array"
    			},
    			{
    				id: "stop_propagation_effector",
    				ref: "stop_propagation_effect"
    			},
    			{
    				id: "stop_propagation",
    				ref: "array"
    			},
    			{
    				id: "editable_effects",
    				ref: "array"
    			},
    			{
    				id: "readonly_effects",
    				ref: "array"
    			},
    			{
    				id: "effects",
    				ref: "if"
    			},
    			{
    				id: "result"
    			},
    			{
    				id: "out",
    				ref: "hyperapp_action"
    			}
    		],
    		edges: [
    			{
    				from: "in",
    				to: "out",
    				as: "args"
    			},
    			{
    				from: "edge",
    				to: "edit_text_position",
    				as: "edge"
    			},
    			{
    				from: "links",
    				to: "edit_text_position",
    				as: "links"
    			},
    			{
    				from: "edit_text_position",
    				to: "edit_edge_as_payload",
    				as: "position"
    			},
    			{
    				from: "as_path",
    				to: "edit_edge_as_payload",
    				as: "property"
    			},
    			{
    				from: "update_edge_action",
    				to: "edit_edge_as_payload",
    				as: "oneditconfirm"
    			},
    			{
    				from: "edge",
    				to: "edit_edge_as_payload",
    				as: "id"
    			},
    			{
    				from: "edge_as",
    				to: "edit_edge_as_payload",
    				as: "value"
    			},
    			{
    				from: "open_edge_popover",
    				to: "edit_edge_as_payload",
    				as: "oneditmore"
    			},
    			{
    				from: "edit_edge_as_payload",
    				to: "edit_edge_as",
    				as: "a1"
    			},
    			{
    				from: "show_edit_text",
    				to: "edit_edge_as",
    				as: "a0"
    			},
    			{
    				from: "edit_edge_as",
    				to: "editable_effects",
    				as: "a0"
    			},
    			{
    				from: "event",
    				to: "stop_propagation_payload",
    				as: "event"
    			},
    			{
    				from: "stop_propagation_effector",
    				to: "stop_propagation",
    				as: "a0"
    			},
    			{
    				from: "event",
    				to: "stop_propagation",
    				as: "a1"
    			},
    			{
    				from: "stop_propagation",
    				to: "editable_effects",
    				as: "a1"
    			},
    			{
    				from: "editable_effects",
    				to: "effects",
    				as: "false"
    			},
    			{
    				from: "readonly_effects",
    				to: "effects",
    				as: "true"
    			},
    			{
    				from: "readonly",
    				to: "effects",
    				as: "pred"
    			},
    			{
    				from: "state",
    				to: "result",
    				as: "state"
    			},
    			{
    				from: "effects",
    				to: "result",
    				as: "effects"
    			},
    			{
    				from: "result",
    				to: "out",
    				as: "fn",
    				type: "ref"
    			}
    		]
    	},
    	{
    		id: "editor_dom_type",
    		value: "div"
    	},
    	{
    		id: "editor_props",
    		value: {
    			key: "editor"
    		}
    	},
    	{
    		id: "popover_dimensions",
    		value: {
    			x: 400,
    			y: 800
    		}
    	},
    	{
    		id: "html_id",
    		ref: "arg",
    		value: "html_id"
    	},
    	{
    		id: "render_popover_graph_effect",
    		script: "return (dispatch, payload) => requestAnimationFrame(() => {payload = _lib.no.resolve(payload); if(payload.popover_dispatch) { payload.popover_dispatch(s => [{...s, display_graph: payload.display_graph, selected: [payload.display_graph.out]}, [s.update_sim_effect, {...s, display_graph: payload.display_graph}], [s.update_hyperapp] ]) } else { const popover_dispatch = _lib.no.executeGraphNode({graph: payload.graph})('initialize_hyperapp_app')({graph: payload.graph, display_graph: payload.display_graph, html_id: `${payload.html_id}-popover`, dimensions: payload.dimensions, readonly: true, hide_types: true, static: true, hash: ''}).dispatch; dispatch(s => ({...s, popover_dispatch}));}})"
    	},
    	{
    		id: "handle_popover_event",
    		out: "out",
    		nodes: [
    			{
    				id: "in"
    			},
    			{
    				id: "state",
    				ref: "arg",
    				value: "state"
    			},
    			{
    				id: "randid",
    				ref: "arg",
    				value: "state.randid"
    			},
    			{
    				id: "selected",
    				ref: "arg",
    				value: "state.selected"
    			},
    			{
    				id: "popover_graph",
    				ref: "arg",
    				value: "state.popover_graph"
    			},
    			{
    				id: "payload",
    				ref: "arg",
    				value: "payload"
    			},
    			{
    				id: "clear_popover_effect",
    				ref: "clear_popover_graph"
    			},
    			{
    				id: "effects",
    				script: "return popover_graph.nodes.find(n => n.id === payload.detail.node).value"
    			},
    			{
    				id: "new_state"
    			},
    			{
    				id: "out",
    				ref: "hyperapp_action"
    			}
    		],
    		edges: [
    			{
    				from: "in",
    				to: "new_state",
    				as: "args"
    			},
    			{
    				from: "state",
    				to: "new_state",
    				as: "state"
    			},
    			{
    				from: "selected",
    				to: "effects",
    				as: "selected"
    			},
    			{
    				from: "popover_graph",
    				to: "effects",
    				as: "popover_graph"
    			},
    			{
    				from: "clear_popover_effect",
    				to: "effects",
    				as: "clear_popover"
    			},
    			{
    				from: "randid",
    				to: "effects",
    				as: "randid"
    			},
    			{
    				from: "payload",
    				to: "effects",
    				as: "payload"
    			},
    			{
    				from: "effects",
    				to: "new_state",
    				as: "effects"
    			},
    			{
    				from: "new_state",
    				to: "out",
    				as: "fn",
    				type: "ref"
    			}
    		]
    	},
    	{
    		id: "editor",
    		out: "out",
    		nodes: [
    			{
    				id: "in"
    			},
    			{
    				id: "wrapper",
    				ref: "run_h"
    			},
    			{
    				id: "graph",
    				ref: "arg",
    				value: "graph"
    			},
    			{
    				id: "display_graph",
    				ref: "arg",
    				value: "display_graph"
    			},
    			{
    				id: "show_result",
    				ref: "arg",
    				value: "show_result"
    			},
    			{
    				id: "show_all",
    				ref: "arg",
    				value: "show_all"
    			},
    			{
    				id: "html_id",
    				ref: "arg",
    				value: "html_id"
    			},
    			{
    				id: "result_display",
    				ref: "arg",
    				value: "result_display"
    			},
    			{
    				id: "editing",
    				ref: "arg",
    				value: "editing"
    			},
    			{
    				id: "args_display",
    				ref: "arg",
    				value: "args_display"
    			},
    			{
    				id: "update_sim",
    				ref: "arg",
    				value: "update_sim"
    			},
    			{
    				id: "popover_graph",
    				ref: "arg",
    				value: "popover_graph"
    			},
    			{
    				id: "readonly",
    				ref: "arg",
    				value: "readonly"
    			},
    			{
    				id: "error",
    				ref: "arg",
    				value: "error"
    			},
    			{
    				id: "search",
    				ref: "arg",
    				value: "search"
    			},
    			{
    				id: "result_wrapper",
    				ref: "run_h"
    			},
    			{
    				id: "wrapper_dom_type",
    				value: "div"
    			},
    			{
    				id: "wrapper_props",
    				value: {
    				}
    			},
    			{
    				id: "wrapper_children",
    				script: "return [styles.el, node_editor.el, !readonly && editing !== false && edit_text.el, !readonly && popover_graph && popover_graph_h.el.el, !!result_display && result_display.el, !editing && !show_all && args_display && args_display.el, !!error && error_display.el, menu.el].filter(e => e)"
    			},
    			{
    				id: "styles",
    				nodes: [
    					{
    						id: "in"
    					},
    					{
    						id: "style_content",
    						value: "#node-editor { position: relative; width: 100%; height: 100vh; color: white; font-family: consolas; overflow: hidden; } #node-editor-editor.hash-view { background-color: unset; } svg { user-select: none; } .graph-ui { display: flex; position: absolute; right: 100px; top: 100px; flex-direction: row; gap: 8px; } .graph-ui ion-icon { cursor: pointer; width: 1.5em; height: 1.5em; color: #ccc; } .graph-ui ion-icon:hover { color: #fff; } .edit-value { position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: #00000011; } .edit-value .more { cursor: pointer; } .edit-value .centering { position: absolute; width: 32vw; display: flex; flex-direction: column; } .edit-value.none { left: -1000%; } .edit-value textarea { width: 32vw; font-size: (1em + 1vh); outline: none; resize: none; } .edit-value label { font-size: calc(1em + 2vh) } .edit-value textarea { height: 64em; } .edit-value.ref input { position:relative; left: 0; } .edit-value .input { width: 256px; } .search-input.hidden { left: -1000px; } #arrow polyline { stroke: #fff; stroke-width: 2; fill: none } .node { cursor: pointer; } .node.hover { opacity: 1 !important; } .node .fill { opacity: 0; } .node .shape { animation_: 2s blink infinite; fill: #66ccff; } .node.hover .shape { stroke-width: 2; stroke: #3fc } .node.selected .shape { fill: #fcc; } .node .shape.script { transform-box: fill-box; transform-origin: 50% 50%; transform: rotate(45deg); fill: none; stroke-width: 2px; stroke: #66ccff; } .node.selected .shape.script { stroke: #fcc; } .node .shape.none { stroke-width: 2px; stroke: #66ccff; } .node .shape.error { fill: #FF0000 !important; } .node.selected .shape.none { stroke: #fcc; } .node-info { position: absolute; top: 0; left: 0; z-index: 10; border: 1px solid white; background: black; padding: .4em; max-width: 256px; color: white; display: flex; gap: .4em; flex-direction: column; } .node-info .args { display: flex; gap: 8px; flex-wrap: wrap; } .node-info .args span.clickable { cursor: pointer; text-decoration: underline dotted;  } /* result props */ .result { position: fixed; bottom: 100px; left: 100px; max-width: 33%; } .result.error { color: red; } text { user-select: none; fill: white; } .link.selected { stroke: red; } .link { stroke: #ccc; } svg.edge-info.selected rect { fill: red; } .insert-node, #dummy-add-node { cursor: pointer; stroke: #fff; stroke-width: 32; stroke-opacity: 1; } .insert-node .circle, #dummy-add-node .circle { fill-opacity: 0.5; } .node text { filter: url(#flood-background) } .node text .primary { font-weight: bold; } .node text .secondary { font-style: italic; } .node.selected text .secondary:hover { text-decoration: dashed underline; } .show-key { position: fixed; right: 100px; top: 100px; font-size: 2em;; font-family: consolas; } .edge-info { filter: url(\"#flood-background\"); padding: 4px; cursor: pointer; } .edge-info.selected { filter: url(\"#selected-flood-background\"); } .error.main { position: absolute; top: 0; left: 0; width: 25vw; color: red; padding: 1em; height: 8em; z-index: 100; } /* popover */ #node-editor-popover { position: fixed; width: 100vw; height: 100vh; z-index: 100; top: 0; left: 0; background: #000000EE; } .popover { position: absolute; z-index: 100; background: #000000EE; }"
    					},
    					{
    						id: "style_h_text",
    						ref: "html_text"
    					},
    					{
    						id: "style_dom_type",
    						value: "style"
    					},
    					{
    						id: "out",
    						ref: "html_element"
    					}
    				],
    				edges: [
    					{
    						from: "in",
    						to: "out",
    						as: "args",
    						type: "ref"
    					},
    					{
    						from: "style_h_text",
    						to: "out",
    						as: "children"
    					},
    					{
    						from: "style_content",
    						to: "style_h_text",
    						as: "text"
    					},
    					{
    						from: "style_dom_type",
    						to: "out",
    						as: "dom_type"
    					}
    				]
    			},
    			{
    				id: "edit_text",
    				nodes: [
    					{
    						id: "in"
    					},
    					{
    						id: "html_id",
    						ref: "arg",
    						value: "html_id"
    					},
    					{
    						id: "display_graph_nodes",
    						ref: "arg",
    						value: "display_graph.nodes"
    					},
    					{
    						id: "nodes",
    						ref: "arg",
    						value: "nodes"
    					},
    					{
    						id: "selected",
    						ref: "arg",
    						value: "selected.0"
    					},
    					{
    						id: "dimensions",
    						ref: "arg",
    						value: "dimensions"
    					},
    					{
    						id: "display_graph",
    						ref: "arg",
    						value: "display_graph"
    					},
    					{
    						id: "selected_edge",
    						ref: "arg",
    						value: "selected_edge"
    					},
    					{
    						id: "editing",
    						ref: "arg",
    						value: "editing"
    					},
    					{
    						id: "levels",
    						ref: "arg",
    						value: "levels"
    					},
    					{
    						id: "edit_value",
    						ref: "arg",
    						value: "edit_value"
    					},
    					{
    						id: "on_editmore_action",
    						ref: "arg",
    						value: "oneditmore"
    					},
    					{
    						id: "selected_node",
    						script: "return nodes.find(n => n.node_id === selected)"
    					},
    					{
    						id: "ref_nodes",
    						script: "return nodes.filter(n => !(n.ref || levels.level_by_node.has(n.id)) && (n.script || n.nodes))"
    					},
    					{
    						id: "edit_text",
    						ref: "html_element"
    					},
    					{
    						id: "edit_text_dom_type",
    						value: "div"
    					},
    					{
    						id: "edit_text_label_wrapper_children",
    						ref: "array"
    					},
    					{
    						id: "edit_text_label_wrapper",
    						ref: "html_element"
    					},
    					{
    						id: "edit_text_input",
    						ref: "html_element"
    					},
    					{
    						id: "edit_text_textarea",
    						ref: "html_element"
    					},
    					{
    						id: "confirm_edit_text",
    						ref: "confirm_edit_text"
    					},
    					{
    						id: "edit_position",
    						ref: "arg",
    						value: "edit_position"
    					},
    					{
    						id: "svg_offset",
    						ref: "arg",
    						value: "svg_offset"
    					},
    					{
    						id: "edit_html_position",
    						script: "return {x: Math.min(dimensions.x - 256 * 1.25, (position?.x ?? 0) * (svg_offset?.scale ?? 1) + (svg_offset?.x ?? 0)), y: Math.min(dimensions.y - 64, (position?.y ?? 0) * (svg_offset?.scale ?? 1) + (svg_offset?.y ?? 0))}"
    					},
    					{
    						id: "edit_text_base_props",
    						script: "return {id: `${html_id}-edit-value`, class: {'edit-value': true, [editing]: true}, onclick: (s, payload) => (payload.preventDefault(), payload.stopPropagation(), [s, [confirm_edit_text, payload]])}"
    					},
    					{
    						id: "edit_text_props"
    					},
    					{
    						id: "edit_text_edit_box",
    						ref: "switch"
    					},
    					{
    						id: "centering_wrapper_children",
    						script: "return [label.el, edit_box?.el, editing === 'ref' ? ref_description?.el : false, editing === 'ref' ? ref_datalist.el : false]"
    					},
    					{
    						id: "edit_text_textarea_dom_type",
    						args: [
    							"editing"
    						],
    						script: "return 'textarea'"
    					},
    					{
    						id: "edit_text_textarea_props",
    						script: "const start_value = edit_value ?? (!editing ? '' : (selected_edge ? display_graph.edges.find(e => e.from === selected_edge.from && e.to === selected_edge.to) : display_graph.nodes.find(n => n.id === selected))[editing]); return {id: `${html_id}-textarea`, class: {textarea: true, [editing]: true}, onclick: (s, payload) => (payload.stopPropagation(), s), value: typeof(start_value) === 'string' ? start_value : JSON.stringify(start_value), oninput: (s, payload) => ({...s, edit_value: payload.target.value}), onfocus: (s, payload) => [s, [() => payload.target.setSelectionRange(0, payload.target.value.length)]] }"
    					},
    					{
    						id: "edit_text_input_dom_type",
    						args: [
    							"editing"
    						],
    						script: "return 'input'"
    					},
    					{
    						id: "edit_text_input_props",
    						script: "const start_value = edit_value ?? (!editing ? '' : (selected_edge ? display_graph.edges.find(e => e.from === selected_edge.from && e.to === selected_edge.to) : display_graph.nodes.find(n => n.id === selected))[editing]); return Object.assign({id: `${html_id}-edit-text`, class: {input: true, [editing]: true}, value: typeof(start_value) === 'string' ? start_value : JSON.stringify(start_value), onclick: (s, payload) => (payload.stopPropagation(), s), onkeydown: (s, payload) => [s, (payload.key === 'Enter' ? (payload.stopPropagation(), [confirm_edit_text, payload]): false)], oninput: (s, payload) => ({...s, edit_value: payload.target.value}), onfocus: (s, payload) => [s, [() => payload.target.setSelectionRange(0, payload.target.value.length)]]}, editing === 'ref' ? {list: 'node-options', type: 'text'} : {})"
    					},
    					{
    						id: "edit_text_label",
    						ref: "html_element"
    					},
    					{
    						id: "edit_text_label_dom_type",
    						value: "label"
    					},
    					{
    						id: "edit_text_label_props",
    						script: "return {for: `${html_id}-edit-text`}"
    					},
    					{
    						id: "edit_text_label_text",
    						ref: "html_text"
    					},
    					{
    						id: "edit_text_more_props",
    						script: "return {onclick: on_editmore_action, class: {more: true, hydrated: true, md: true}}"
    					},
    					{
    						id: "edit_text_more_icon",
    						value: "ellipsis-vertical-outline"
    					},
    					{
    						id: "edit_text_more",
    						ref: "icon"
    					},
    					{
    						id: "editing_path",
    						value: "editing"
    					},
    					{
    						id: "editing",
    						ref: "arg",
    						value: "editing"
    					},
    					{
    						id: "ref_description",
    						out: "out",
    						nodes: [
    							{
    								id: "node_id",
    								ref: "arg",
    								value: "node_id"
    							},
    							{
    								id: "nodes",
    								ref: "arg",
    								value: "nodes"
    							},
    							{
    								id: "node_description",
    								ref: "node_description"
    							},
    							{
    								id: "description_text",
    								ref: "html_text"
    							},
    							{
    								id: "out",
    								ref: "html_element"
    							}
    						],
    						edges: [
    							{
    								from: "node_id",
    								to: "node_description",
    								as: "node_id"
    							},
    							{
    								from: "nodes",
    								to: "node_description",
    								as: "nodes"
    							},
    							{
    								from: "node_description",
    								to: "description_text",
    								as: "text"
    							},
    							{
    								from: "description_text",
    								to: "out",
    								as: "children"
    							}
    						]
    					},
    					{
    						id: "ref_datalist",
    						name: "ref_datalist",
    						out: "xtr0qj6",
    						nodes: [
    							{
    								id: "xtr0qj6",
    								ref: "html_element",
    								name: "ref_datalist"
    							},
    							{
    								id: "0msbgbm",
    								ref: "map"
    							},
    							{
    								id: "buav28h",
    								value: "datalist"
    							},
    							{
    								id: "ql1hqrf"
    							},
    							{
    								id: "jppiihp/jppiihp",
    								ref: "html_element"
    							},
    							{
    								id: "h2altl0",
    								ref: "arg",
    								value: "ref_nodes"
    							},
    							{
    								id: "jgaye79",
    								value: "node-options"
    							},
    							{
    								id: "tk685lj"
    							},
    							{
    								id: "2xycz42",
    								value: "option"
    							},
    							{
    								id: "8v5dk5c",
    								ref: "html_text"
    							},
    							{
    								id: "jppiihp/ci554ww",
    								ref: "arg",
    								value: "element.id"
    							},
    							{
    								id: "n5dpir5",
    								ref: "default"
    							},
    							{
    								id: "9q28w9y",
    								ref: "arg",
    								value: "element.name"
    							},
    							{
    								id: "6s0wcu9",
    								ref: "arg",
    								value: "element.id"
    							}
    						],
    						edges: [
    							{
    								from: "0msbgbm",
    								to: "xtr0qj6",
    								as: "children"
    							},
    							{
    								from: "buav28h",
    								to: "xtr0qj6",
    								as: "dom_type"
    							},
    							{
    								from: "ql1hqrf",
    								to: "xtr0qj6",
    								as: "props"
    							},
    							{
    								from: "jppiihp/jppiihp",
    								to: "0msbgbm",
    								as: "fn",
    								type: "ref"
    							},
    							{
    								from: "h2altl0",
    								to: "0msbgbm",
    								as: "array"
    							},
    							{
    								from: "jgaye79",
    								to: "ql1hqrf",
    								as: "id"
    							},
    							{
    								from: "tk685lj",
    								to: "jppiihp/jppiihp",
    								as: "props"
    							},
    							{
    								from: "2xycz42",
    								to: "jppiihp/jppiihp",
    								as: "dom_type"
    							},
    							{
    								from: "8v5dk5c",
    								to: "jppiihp/jppiihp",
    								as: "children"
    							},
    							{
    								from: "jppiihp/ci554ww",
    								to: "tk685lj",
    								as: "value"
    							},
    							{
    								from: "n5dpir5",
    								to: "8v5dk5c",
    								as: "text"
    							},
    							{
    								from: "9q28w9y",
    								to: "n5dpir5",
    								as: "value"
    							},
    							{
    								from: "6s0wcu9",
    								to: "n5dpir5",
    								as: "otherwise"
    							}
    						]
    					},
    					{
    						id: "get_nodes",
    						ref: "arg",
    						value: "display_graph.nodes"
    					},
    					{
    						id: "get_id",
    						script: "return node.id"
    					},
    					{
    						id: "centering_wrapper_dom_type",
    						value: "div"
    					},
    					{
    						id: "centering_wrapper_props",
    						script: "return {class: {centering: true}, style: {left: `${position.x}px`, top: `${position.y}px`} }"
    					},
    					{
    						id: "centering_wrapper",
    						ref: "html_element"
    					},
    					{
    						id: "edit_text_children",
    						ref: "array"
    					},
    					{
    						id: "edit_text_el_wrapper",
    						script: "return et.el"
    					},
    					{
    						id: "out"
    					}
    				],
    				edges: [
    					{
    						from: "selected",
    						to: "edit_text_textarea_props",
    						as: "selected"
    					},
    					{
    						from: "selected_edge",
    						to: "edit_text_textarea_props",
    						as: "selected_edge"
    					},
    					{
    						from: "display_graph",
    						to: "edit_text_textarea_props",
    						as: "display_graph"
    					},
    					{
    						from: "edit_value",
    						to: "edit_text_textarea_props",
    						as: "edit_value"
    					},
    					{
    						from: "editing",
    						to: "edit_text_textarea_props",
    						as: "editing"
    					},
    					{
    						from: "selected",
    						to: "edit_text_textarea_props",
    						as: "selected"
    					},
    					{
    						from: "selected_edge",
    						to: "edit_text_input_props",
    						as: "selected_edge"
    					},
    					{
    						from: "display_graph",
    						to: "edit_text_input_props",
    						as: "display_graph"
    					},
    					{
    						from: "edit_value",
    						to: "edit_text_input_props",
    						as: "edit_value"
    					},
    					{
    						from: "editing",
    						to: "edit_text_input_props",
    						as: "editing"
    					},
    					{
    						from: "selected",
    						to: "edit_text_input_props",
    						as: "selected"
    					},
    					{
    						from: "selected",
    						to: "selected_node",
    						as: "selected"
    					},
    					{
    						from: "nodes",
    						to: "selected_node",
    						as: "nodes"
    					},
    					{
    						from: "selected_node",
    						to: "centering_wrapper_props",
    						as: "node"
    					},
    					{
    						from: "edit_text",
    						to: "edit_text_el_wrapper",
    						as: "et"
    					},
    					{
    						from: "editing",
    						to: "edit_text_edit_box",
    						as: "input"
    					},
    					{
    						from: "editing",
    						to: "centering_wrapper_children",
    						as: "editing"
    					},
    					{
    						from: "edit_text_el_wrapper",
    						to: "out",
    						as: "el"
    					},
    					{
    						from: "edit_text_dom_type",
    						to: "edit_text",
    						as: "dom_type"
    					},
    					{
    						from: "html_id",
    						to: "edit_text_base_props",
    						as: "html_id"
    					},
    					{
    						from: "edit_text_base_props",
    						to: "edit_text_props"
    					},
    					{
    						from: "edit_text_props",
    						to: "edit_text",
    						as: "props"
    					},
    					{
    						from: "centering_wrapper",
    						to: "edit_text",
    						as: "children"
    					},
    					{
    						from: "dimensions",
    						to: "edit_html_position",
    						as: "dimensions"
    					},
    					{
    						from: "edit_position",
    						to: "edit_html_position",
    						as: "position"
    					},
    					{
    						from: "svg_offset",
    						to: "edit_html_position",
    						as: "svg_offset"
    					},
    					{
    						from: "edit_html_position",
    						to: "centering_wrapper_props",
    						as: "position"
    					},
    					{
    						from: "html_id",
    						to: "edit_text_input_props",
    						as: "html_id"
    					},
    					{
    						from: "confirm_edit_text",
    						to: "edit_text_input_props",
    						as: "confirm_edit_text"
    					},
    					{
    						from: "edit_text_input_props",
    						to: "edit_text_input",
    						as: "props"
    					},
    					{
    						from: "edit_text_input_dom_type",
    						to: "edit_text_input",
    						as: "dom_type"
    					},
    					{
    						from: "edit_text_input",
    						to: "edit_text_edit_box",
    						as: "otherwise"
    					},
    					{
    						from: "edit_text_textarea",
    						to: "edit_text_edit_box",
    						as: "script"
    					},
    					{
    						from: "edit_text_edit_box",
    						to: "centering_wrapper_children",
    						as: "edit_box"
    					},
    					{
    						from: "levels",
    						to: "ref_nodes",
    						as: "levels"
    					},
    					{
    						from: "nodes",
    						to: "ref_nodes",
    						as: "nodes"
    					},
    					{
    						from: "display_graph_nodes",
    						to: "ref_nodes",
    						as: "nodes"
    					},
    					{
    						from: "ref_nodes",
    						to: "ref_datalist",
    						as: "ref_nodes"
    					},
    					{
    						from: "ref_datalist",
    						to: "centering_wrapper_children",
    						as: "ref_datalist"
    					},
    					{
    						from: "edit_value",
    						to: "ref_description",
    						as: "node_id"
    					},
    					{
    						from: "display_graph_nodes",
    						to: "ref_description",
    						as: "nodes"
    					},
    					{
    						from: "ref_description",
    						to: "centering_wrapper_children",
    						as: "ref_description"
    					},
    					{
    						from: "html_id",
    						to: "edit_text_textarea_props",
    						as: "html_id"
    					},
    					{
    						from: "edit_text_textarea_props",
    						to: "edit_text_textarea",
    						as: "props"
    					},
    					{
    						from: "edit_text_textarea_dom_type",
    						to: "edit_text_textarea",
    						as: "dom_type"
    					},
    					{
    						from: "html_id",
    						to: "edit_text_label_props",
    						as: "html_id"
    					},
    					{
    						from: "edit_text_more",
    						to: "edit_text_label_wrapper_children",
    						as: "a1"
    					},
    					{
    						from: "edit_text_label",
    						to: "edit_text_label_wrapper_children",
    						as: "a0"
    					},
    					{
    						from: "edit_text_label_wrapper_children",
    						to: "edit_text_label_wrapper",
    						as: "children"
    					},
    					{
    						from: "edit_text_label_wrapper",
    						to: "centering_wrapper_children",
    						as: "label"
    					},
    					{
    						from: "edit_text_label_props",
    						to: "edit_text_label",
    						as: "props"
    					},
    					{
    						from: "edit_text_label_dom_type",
    						to: "edit_text_label",
    						as: "dom_type"
    					},
    					{
    						from: "edit_text_label_text",
    						to: "edit_text_label",
    						as: "children"
    					},
    					{
    						from: "on_editmore_action",
    						to: "edit_text_more_props",
    						as: "on_editmore_action"
    					},
    					{
    						from: "edit_text_more_props",
    						to: "edit_text_more",
    						as: "props"
    					},
    					{
    						from: "edit_text_more_icon",
    						to: "edit_text_more",
    						as: "icon"
    					},
    					{
    						from: "in",
    						to: "get_nodes"
    					},
    					{
    						from: "get_nodes",
    						to: "get_id",
    						as: "node"
    					},
    					{
    						from: "get_id",
    						to: "id_text",
    						as: "text"
    					},
    					{
    						from: "editing",
    						to: "edit_text_label_text",
    						as: "text"
    					},
    					{
    						from: "editing",
    						to: "edit_text_base_props",
    						as: "editing"
    					},
    					{
    						from: "confirm_edit_text",
    						to: "edit_text_base_props",
    						as: "confirm_edit_text"
    					},
    					{
    						from: "centering_wrapper_dom_type",
    						to: "centering_wrapper",
    						as: "dom_type"
    					},
    					{
    						from: "centering_wrapper_props",
    						to: "centering_wrapper",
    						as: "props"
    					},
    					{
    						from: "centering_wrapper_children",
    						to: "centering_wrapper",
    						as: "children"
    					},
    					{
    						from: "centering_wrapper",
    						to: "edit_text_children",
    						as: "a0"
    					},
    					{
    						from: "edit_text_children",
    						to: "edit_text",
    						as: "children"
    					}
    				]
    			},
    			{
    				id: "popover_graph_h",
    				nodes: [
    					{
    						id: "html_id",
    						ref: "arg",
    						value: "html_id"
    					},
    					{
    						id: "update_sim",
    						ref: "arg",
    						value: "update_sim"
    					},
    					{
    						id: "randid",
    						ref: "arg",
    						value: "randid"
    					},
    					{
    						id: "handle_popover_event",
    						ref: "handle_popover_event"
    					},
    					{
    						id: "clear_popover",
    						ref: "clear_popover_graph"
    					},
    					{
    						id: "props",
    						script: "return {id: `${html_id}-popover`, class: {popover: true}, key:  `${html_id}-popover`, onselectnode: handle_popover_event, ongraphclick: (s, p) => [s]}"
    					},
    					{
    						id: "dom_type",
    						value: "div"
    					},
    					{
    						id: "out",
    						ref: "html_element"
    					}
    				],
    				edges: [
    					{
    						from: "update_sim",
    						to: "props",
    						as: "update_sim"
    					},
    					{
    						from: "handle_popover_event",
    						to: "props",
    						as: "handle_popover_event"
    					},
    					{
    						from: "clear_popover",
    						to: "props",
    						as: "clear_popover"
    					},
    					{
    						from: "props",
    						to: "out",
    						as: "props"
    					},
    					{
    						from: "html_id",
    						to: "props",
    						as: "html_id"
    					},
    					{
    						from: "dom_type",
    						to: "out",
    						as: "dom_type"
    					}
    				]
    			},
    			{
    				id: "popover_graph_h_wrapper"
    			},
    			{
    				id: "result",
    				nodes: [
    					{
    						id: "in"
    					},
    					{
    						id: "error",
    						ref: "arg",
    						value: "error"
    					},
    					{
    						id: "html_id",
    						ref: "arg",
    						value: "html_id"
    					},
    					{
    						id: "get_node",
    						script: "return display_graph.nodes.find(n => n.id === selected[0])"
    					},
    					{
    						id: "get_type",
    						script: "return ref?.display_type ? ref.display_type : typeof value !== 'undefined' && typeof value !== 'object' ? typeof value : ref ? (ref.node_type ?? ref) : nodes ? 'graph' : script ? 'script' : 'object'"
    					},
    					{
    						id: "result",
    						ref: "arg",
    						value: "result"
    					},
    					{
    						id: "display_graph",
    						ref: "arg",
    						value: "display_graph"
    					},
    					{
    						id: "container_dom_type",
    						value: "div"
    					},
    					{
    						id: "container_props",
    						args: [
    							"error"
    						],
    						script: "return {class: {error: error ? 'error' : '', result: true}, id: `${html_id}-result`}"
    					},
    					{
    						id: "container_children_inputs",
    						script: "return error? ['error_display'] : ['display']"
    					},
    					{
    						id: "container_children",
    						ref: "switch"
    					},
    					{
    						id: "container",
    						ref: "html_element"
    					},
    					{
    						id: "text_value",
    						args: [
    							"result",
    							"error"
    						],
    						script: "return error ?? result ?? ''"
    					},
    					{
    						id: "out"
    					}
    				],
    				edges: [
    					{
    						from: "in",
    						to: "container_props"
    					},
    					{
    						from: "in",
    						to: "get_node"
    					},
    					{
    						from: "in",
    						to: "get_node_display"
    					},
    					{
    						from: "in",
    						to: "get_error_display"
    					},
    					{
    						from: "in",
    						to: "run_error_display"
    					},
    					{
    						from: "error",
    						to: "container_children_inputs",
    						as: "error"
    					},
    					{
    						from: "get_node",
    						to: "get_type"
    					},
    					{
    						from: "get_type",
    						to: "get_node_display",
    						as: "type"
    					},
    					{
    						from: "get_type",
    						to: "get_error_display",
    						as: "type"
    					},
    					{
    						from: "get_node",
    						to: "run_node_display",
    						as: "node"
    					},
    					{
    						from: "get_node",
    						to: "run_error_display",
    						as: "node"
    					},
    					{
    						from: "get_node_display",
    						to: "run_node_display",
    						as: "display"
    					},
    					{
    						from: "display_graph",
    						to: "run_node_display",
    						as: "display_graph"
    					},
    					{
    						from: "result",
    						to: "run_node_display",
    						as: "result"
    					},
    					{
    						from: "get_error_display",
    						to: "run_error_display",
    						as: "error_display"
    					},
    					{
    						from: "container_children_inputs",
    						to: "container_children",
    						as: "input"
    					},
    					{
    						from: "run_node_display",
    						to: "container_children",
    						as: "display"
    					},
    					{
    						from: "run_error_display",
    						to: "container_children",
    						as: "error_display"
    					},
    					{
    						from: "run_node_display",
    						to: "run_error_display"
    					},
    					{
    						from: "container_props",
    						to: "container",
    						as: "props"
    					},
    					{
    						from: "container_children",
    						to: "container",
    						as: "children"
    					},
    					{
    						from: "container_dom_type",
    						to: "container",
    						as: "dom_type"
    					},
    					{
    						from: "container",
    						to: "out"
    					}
    				]
    			},
    			{
    				id: "menu",
    				nodes: [
    					{
    						id: "readonly",
    						ref: "arg",
    						value: "readonly"
    					},
    					{
    						id: "false",
    						value: false
    					},
    					{
    						id: "search_input",
    						nodes: [
    							{
    								id: "in"
    							},
    							{
    								id: "search",
    								ref: "arg",
    								value: "search"
    							},
    							{
    								id: "is_searching",
    								script: "return typeof search === 'string'"
    							},
    							{
    								id: "search_input_dom_type",
    								value: "input"
    							},
    							{
    								id: "nodes",
    								ref: "arg",
    								value: "nodes"
    							},
    							{
    								id: "html_id",
    								ref: "arg",
    								value: "html_id"
    							},
    							{
    								id: "display_graph",
    								ref: "arg",
    								value: "display_graph"
    							},
    							{
    								id: "search_input_props",
    								script: "return {id: `${html_id}-search-input`, key: `${html_id}-search-input`, class: 'search-input', type: 'text', onkeydown: (s, payload) => { if(payload.key === 'Enter'){ const direction = payload.shiftKey ? -1 : 1; const idx = (s.search_results.length + s.search_index + direction) % s.search_results.length; return [{...s, selected: s.search_results.slice(idx, idx + 1), search_index: idx}, [s.panzoom_selected_effect, {...s, selected: s.search_results[idx]}], [s.update_hyperapp]] } else { return s;} }, oninput: (s, payload) => {const search_results = new _lib.Fuse(nodes.map(n => Object.assign({}, n, display_graph.nodes.find(d => d.id === n.node_id))), {keys: ['name', 'node_id', 'ref', 'value']}).search(payload.target.value).map(r => r.item.node_id); return [{...s, search: payload.target.value, selected: search_results.length > 0 ? search_results.slice(0, 1) : s.selected, search_results, search_index: 0}, search_results.length > 0 && [s.panzoom_selected_effect, {...s, selected: search_results[0]}], [s.update_hyperapp]]}}"
    							},
    							{
    								id: "search_field",
    								ref: "html_element"
    							},
    							{
    								id: "search_effect",
    								ref: "search_effect"
    							},
    							{
    								id: "focus_effect",
    								ref: "focus_effect"
    							},
    							{
    								id: "search_icon_props",
    								script: "return {id: `${html_id}-search-input`, key: `${html_id}-search-input-icon`, class: 'search-input search-input-icon', onclick: s => [s, [search, {search: ''}], [focus, {selector: `#${html_id}-search-input`}]]}"
    							},
    							{
    								id: "search_icon_dom_type",
    								value: "div"
    							},
    							{
    								id: "search_icon_name",
    								value: "search"
    							},
    							{
    								id: "search_icon",
    								ref: "icon"
    							},
    							{
    								id: "out",
    								ref: "if"
    							}
    						],
    						edges: [
    							{
    								from: "html_id",
    								to: "search_input_props",
    								as: "html_id"
    							},
    							{
    								from: "nodes",
    								to: "search_input_props",
    								as: "nodes"
    							},
    							{
    								from: "display_graph",
    								to: "search_input_props",
    								as: "display_graph"
    							},
    							{
    								from: "search",
    								to: "is_searching",
    								as: "search"
    							},
    							{
    								from: "search_input_dom_type",
    								to: "search_field",
    								as: "dom_type"
    							},
    							{
    								from: "search_input_props",
    								to: "search_field",
    								as: "props"
    							},
    							{
    								from: "html_id",
    								to: "search_icon_props",
    								as: "html_id"
    							},
    							{
    								from: "search_effect",
    								to: "search_icon_props",
    								as: "search"
    							},
    							{
    								from: "focus_effect",
    								to: "search_icon_props",
    								as: "focus"
    							},
    							{
    								from: "search_icon_props",
    								to: "search_icon",
    								as: "props"
    							},
    							{
    								from: "search_icon_dom_type",
    								to: "search_icon",
    								as: "dom_type"
    							},
    							{
    								from: "search_icon_name",
    								to: "search_icon",
    								as: "icon"
    							},
    							{
    								from: "search_icon",
    								to: "out",
    								as: "false"
    							},
    							{
    								from: "search_field",
    								to: "out",
    								as: "true"
    							},
    							{
    								from: "is_searching",
    								to: "out",
    								as: "pred"
    							}
    						]
    					},
    					{
    						id: "close",
    						nodes: [
    							{
    								id: "icon",
    								value: "close"
    							},
    							{
    								id: "dispatch_custom_event_effect",
    								ref: "dispatch_custom_event_effect"
    							},
    							{
    								id: "props",
    								script: "return {onclick: (s, p) => (p.stopPropagation(), [s, [dispatch_custom, {event: 'selectnode', detail: {node: s.display_graph.out}, html_id: s.html_id}]])}"
    							},
    							{
    								id: "out",
    								ref: "icon"
    							}
    						],
    						edges: [
    							{
    								from: "dispatch_custom_event_effect",
    								to: "props",
    								as: "dispatch_custom"
    							},
    							{
    								from: "props",
    								to: "out",
    								as: "props"
    							},
    							{
    								from: "icon",
    								to: "out",
    								as: "icon"
    							}
    						]
    					},
    					{
    						id: "close_readonly",
    						ref: "if"
    					},
    					{
    						id: "more",
    						nodes: [
    							{
    								id: "icon",
    								value: "ellipsis-vertical-outline"
    							},
    							{
    								id: "onclick",
    								ref: "graph_ui_action"
    							},
    							{
    								id: "props",
    								script: "return {onclick}"
    							},
    							{
    								id: "out",
    								ref: "icon"
    							}
    						],
    						edges: [
    							{
    								from: "props",
    								to: "out",
    								as: "props"
    							},
    							{
    								from: "icon",
    								to: "out",
    								as: "icon"
    							},
    							{
    								from: "onclick",
    								to: "props",
    								as: "onclick"
    							}
    						]
    					},
    					{
    						id: "more_readonly",
    						ref: "if"
    					},
    					{
    						id: "dom_type",
    						value: "div"
    					},
    					{
    						id: "children",
    						ref: "array"
    					},
    					{
    						id: "html_id",
    						ref: "arg",
    						value: "html_id"
    					},
    					{
    						id: "props",
    						script: "return {class: {'graph-ui': true}, key: `${html_id}-graph-ui`}"
    					},
    					{
    						id: "out",
    						ref: "html_element"
    					}
    				],
    				edges: [
    					{
    						from: "more",
    						to: "more_readonly",
    						as: "false"
    					},
    					{
    						from: "false",
    						to: "more_readonly",
    						as: "true"
    					},
    					{
    						from: "readonly",
    						to: "more_readonly",
    						as: "pred"
    					},
    					{
    						from: "more_readonly",
    						to: "children",
    						as: "a1"
    					},
    					{
    						from: "search_input",
    						to: "children",
    						as: "a0"
    					},
    					{
    						from: "readonly",
    						to: "close_readonly",
    						as: "pred"
    					},
    					{
    						from: "close",
    						to: "close_readonly",
    						as: "true"
    					},
    					{
    						from: "false",
    						to: "close_readonly",
    						as: "false"
    					},
    					{
    						from: "close_readonly",
    						to: "children",
    						as: "a2",
    						type: "resolve"
    					},
    					{
    						from: "html_id",
    						to: "props",
    						as: "html_id"
    					},
    					{
    						from: "children",
    						to: "out",
    						as: "children"
    					},
    					{
    						from: "props",
    						to: "out",
    						as: "props"
    					},
    					{
    						from: "dom_type",
    						to: "out",
    						as: "dom_type"
    					}
    				]
    			},
    			{
    				id: "node_editor",
    				nodes: [
    					{
    						id: "in"
    					},
    					{
    						id: "out",
    						ref: "html_element"
    					},
    					{
    						id: "panzoom_box_dom_type",
    						value: "g"
    					},
    					{
    						id: "panzoom_box_props",
    						script: "return {id: `${html_id}-editor-panzoom`}"
    					},
    					{
    						id: "panzoom_box",
    						ref: "html_element"
    					},
    					{
    						id: "panzoom_box_arr",
    						ref: "array"
    					},
    					{
    						id: "html_id",
    						ref: "arg",
    						value: "html_id"
    					},
    					{
    						id: "hover",
    						ref: "arg",
    						value: "hover"
    					},
    					{
    						id: "randid",
    						ref: "arg",
    						value: "randid"
    					},
    					{
    						id: "node_el_width",
    						ref: "arg",
    						value: "node_el_width"
    					},
    					{
    						id: "display_graph",
    						ref: "arg",
    						value: "display_graph"
    					},
    					{
    						id: "readonly",
    						ref: "arg",
    						value: "readonly"
    					},
    					{
    						id: "hash",
    						ref: "arg",
    						value: "hash"
    					},
    					{
    						id: "show_all",
    						ref: "arg",
    						value: "show_all"
    					},
    					{
    						id: "error",
    						ref: "arg",
    						value: "error"
    					},
    					{
    						id: "hide_types",
    						ref: "arg",
    						value: "hide_types"
    					},
    					{
    						id: "links",
    						ref: "arg",
    						value: "links"
    					},
    					{
    						id: "get_levels",
    						ref: "arg",
    						value: "levels"
    					},
    					{
    						id: "nodes",
    						ref: "arg",
    						value: "nodes"
    					},
    					{
    						id: "dg_nodes",
    						ref: "arg",
    						value: "display_graph.nodes"
    					},
    					{
    						id: "dg_selected",
    						ref: "find_node"
    					},
    					{
    						id: "get_nodes",
    						script: "return nodes?.map(n => ({...n, x: (n.x - node_el_width * 0.5)})) ?? []"
    					},
    					{
    						id: "get_links",
    						script: "return links?.map(l => (Object.assign({}, l, {source: Object.assign({}, l.source, {x: (l.source.x - node_el_width * 0.5)}), target: Object.assign({}, l.target, {x: (l.target.x - node_el_width * 0.5)})}))) ?? []"
    					},
    					{
    						id: "get_selected",
    						ref: "arg",
    						value: "selected"
    					},
    					{
    						id: "get_graph",
    						ref: "arg",
    						value: "graph"
    					},
    					{
    						id: "get_selected_node",
    						ref: "find_node"
    					},
    					{
    						id: "get_selected_edge",
    						ref: "arg",
    						value: "selected_edge"
    					},
    					{
    						id: "dimensions",
    						ref: "arg",
    						value: "dimensions"
    					},
    					{
    						id: "onclick_graph",
    						ref: "onclick_graph_action"
    					},
    					{
    						id: "node_editor_props",
    						script: "return {id: `${html_id}-editor`, class: {[`hash-${hash.substring(1)}`]: hash.length > 0},width: dimensions.x, height: dimensions.y, onclick: onclick_graph, ontouchstart: onclick_graph}"
    					},
    					{
    						id: "node_editor_dom_type",
    						value: "svg"
    					},
    					{
    						id: "node_editor_children",
    						script: "return [defs.el].concat(nodes?.map(c => c.el) ?? []).concat(links?.flatMap(l => l.map(lc => lc.el)) ?? [])"
    					},
    					{
    						id: "node_args",
    						ref: "node_args"
    					},
    					{
    						id: "dummy_nodes",
    						script: "return !selected_node ? [] : [{node_id: selected_node.node_id + a, node_child_id: selected_node.node_id + a, dummy: true, name: a, x: selected_node.x - 128, y: selected_node.y + 32 * i}))"
    					},
    					{
    						id: "dummy_links",
    						script: "return !selected_node ? [] : nodes.map(n => ({edge: {from: n.id, to: selected_node.node_id, as: n.name}, source: n, target: selected_node}))"
    					},
    					{
    						id: "dummy_node_el",
    						nodes: [
    							{
    								id: "randid",
    								ref: "arg",
    								value: "randid"
    							},
    							{
    								id: "selected",
    								ref: "arg",
    								value: "selected_node.node_id"
    							},
    							{
    								id: "selected_node",
    								ref: "arg",
    								value: "selected_node"
    							},
    							{
    								id: "add_node",
    								ref: "add_node"
    							},
    							{
    								id: "base_props",
    								value: {
    									href: "svg/add-circle-outline.svg#icon",
    									width: "32px",
    									height: "32px",
    									id: "dummy-add-node"
    								}
    							},
    							{
    								id: "onclick_props",
    								script: "return {onclick: (s, p) => [s, [add_node, {node: {id: randid}, child}]], ontouchstart: (s, p) => [s, [add_node, {node: {id: randid}, child}]]}"
    							},
    							{
    								id: "position",
    								script: "return {x: (node?.x ?? 0) - 64, y: (node?.y ?? 0) - 64}"
    							},
    							{
    								id: "props",
    								ref: "merge_objects"
    							},
    							{
    								id: "out",
    								ref: "add_circle_icon"
    							}
    						],
    						edges: [
    							{
    								from: "selected",
    								to: "onclick_props",
    								as: "child"
    							},
    							{
    								from: "randid",
    								to: "onclick_props",
    								as: "randid"
    							},
    							{
    								from: "add_node",
    								to: "onclick_props",
    								as: "add_node"
    							},
    							{
    								from: "base_props",
    								to: "props",
    								as: "a0"
    							},
    							{
    								from: "onclick_props",
    								to: "props",
    								as: "a1"
    							},
    							{
    								from: "selected_node",
    								to: "position",
    								as: "node"
    							},
    							{
    								from: "position",
    								to: "_props",
    								as: "a2"
    							},
    							{
    								from: "props",
    								to: "out",
    								as: "props"
    							}
    						]
    					},
    					{
    						id: "dummy_node_els",
    						script: "const fn = _lib.no.executeGraphNode({graph: _graph})(node_layout_map); return nodes.map(n => fn({node: n, selected, selected_distance: 0}))"
    					},
    					{
    						id: "dummy_link_els",
    						script: "const fn = _lib.no.executeGraphNode({graph: _graph})(link_layout_map); return links.map(l => fn({link: Object.assign(l, {edge: l.edge}), selected_distance: 0}))"
    					},
    					{
    						id: "node_layout",
    						script: "const error_nodes = error instanceof AggregateError ? error.errors.map(e => e instanceof _lib.no.NodysseusError ? e.node_id : false).filter(n => n) : error instanceof _lib.no.NodysseusError ? [error.node_id] : []; const fn = _lib.no.executeGraphNode({graph: {..._graph}})(node_layout_map); return nodes.sort((a, b) => levels.distance_from_selected.get(b.node_child_id) - levels.distance_from_selected.get(a.node_child_id)).map(n => fn(Object.assign({node: Object.assign({}, n, display_graph.nodes.find(dgn => dgn.id === n.node_id)), hide_types, show_all, selected_distance: levels.distance_from_selected.get(n.node_child_id), level: levels.level_by_node.get(n.node_id), node_error: !error_nodes ? false : error_nodes.filter(k => k.startsWith(n.node_id)).length > 0}, _node_inputs)))"
    					},
    					{
    						id: "node_layout_map",
    						nodes: [
    							{
    								id: "in"
    							},
    							{
    								id: "get_node",
    								ref: "arg",
    								value: "node"
    							},
    							{
    								id: "hover",
    								ref: "arg",
    								value: "hover"
    							},
    							{
    								id: "selected_edge",
    								ref: "arg",
    								value: "selected_edge"
    							},
    							{
    								id: "html_id",
    								ref: "arg",
    								value: "html_id"
    							},
    							{
    								id: "show_all",
    								ref: "arg",
    								value: "show_all"
    							},
    							{
    								id: "selected",
    								ref: "arg",
    								value: "selected"
    							},
    							{
    								id: "node_el_width",
    								ref: "arg",
    								value: "node_el_width"
    							},
    							{
    								id: "is_selected",
    								script: "return node.node_id === selected[0]"
    							},
    							{
    								id: "selected_distance",
    								ref: "arg",
    								value: "selected_distance"
    							},
    							{
    								id: "level",
    								ref: "arg",
    								value: "level"
    							},
    							{
    								id: "hide_types",
    								ref: "arg",
    								value: "hide_types"
    							},
    							{
    								id: "error",
    								ref: "arg",
    								value: "node_error"
    							},
    							{
    								id: "out",
    								ref: "html_element"
    							},
    							{
    								id: "parent",
    								ref: "html_element"
    							},
    							{
    								id: "parent_dom_type",
    								value: "svg"
    							},
    							{
    								id: "onclick_node",
    								ref: "onselectnode_action"
    							},
    							{
    								id: "parent_attrs",
    								script: "return ({onclick: (_, payload) => [onclick, {event: payload, node_id: node.node_id}],  onmouseover: (state, payload) => [{...state, hover: node.node_id}], onmouseout: (state, payload) => [{...state, hover: undefined}],  ontouchstart: (_, payload) => [onclick, {event: payload, node_id: node.node_id}], width: '256', height: '64', key: html_id + '-' + node.node_child_id, id: html_id + '-' + node.node_child_id, class: {node: true,  selected: selected[0] === node.node_id, hover: hover === node.node_id }, opacity: selected_edge?.from === node.node_id || show_all ? 1 : selected_distance !== undefined ? Math.max(0.05, 1 - (selected_distance * selected_distance) / 6) : 0.1})"
    							},
    							{
    								id: "children",
    								nodes: [
    									{
    										id: "in"
    									},
    									{
    										id: "selected_distance",
    										ref: "arg",
    										value: "selected_distance"
    									},
    									{
    										id: "node",
    										ref: "arg",
    										value: "node"
    									},
    									{
    										id: "node_node",
    										ref: "arg",
    										value: "node.node"
    									},
    									{
    										id: "error",
    										ref: "arg",
    										value: "node_error"
    									},
    									{
    										id: "node_shape_attrs",
    										script: "const r = 24; return node.script ? {class:{shape: true, script: true, error}, width: r, height: r, x: 10, y: 10} : node.ref && node.ref !== 'arg' ? {class: {shape: true, ref: true, error}, width: r, height: r, x: 10, y: 10} : node.nodes ? {class: {shape: true, graph: true, error}, r: r * 0.5, cx: r * 0.5 + 4, cy: r * 0.5 + 4}  : node.value !== undefined ? {class: {shape: true, value: true, error}, points: `4,${4 + r} ${4 + r},${4 + r} ${4 + r * 0.5},4`} : {class: {shape: true, none: true, error}, r: r * 0.5 , cx: r * 0.5 + 4, cy: r * 0.5 + 4}"
    									},
    									{
    										id: "default_color",
    										value: "blue"
    									},
    									{
    										id: "empty_array",
    										value: [
    										]
    									},
    									{
    										id: "node_shape_dom_type",
    										script: "return node.script ? 'rect' : node.ref && node.ref !== 'arg' ? 'rect' : node.value !== undefined ? 'polygon' : 'circle'"
    									},
    									{
    										id: "node_shape",
    										ref: "html_element"
    									},
    									{
    										id: "text",
    										nodes: [
    											{
    												id: "in"
    											},
    											{
    												id: "out"
    											},
    											{
    												id: "node_id",
    												value: "node_id"
    											},
    											{
    												id: "node_ref",
    												value: "ref"
    											},
    											{
    												id: "node_name",
    												value: "name"
    											},
    											{
    												id: "node_value",
    												value: "value"
    											},
    											{
    												id: "id_path"
    											},
    											{
    												id: "get_id",
    												ref: "get"
    											},
    											{
    												id: "get_name",
    												ref: "get"
    											},
    											{
    												id: "arg_node",
    												ref: "arg",
    												value: "node"
    											},
    											{
    												id: "payload_node",
    												ref: "arg",
    												value: "payload.node"
    											},
    											{
    												id: "node",
    												ref: "default"
    											},
    											{
    												id: "event",
    												ref: "arg",
    												value: "payload.event"
    											},
    											{
    												id: "hide_types",
    												ref: "arg",
    												value: "hide_types"
    											},
    											{
    												id: "update_node",
    												ref: "update_node_action"
    											},
    											{
    												id: "show_edit_text",
    												ref: "show_edit_text"
    											},
    											{
    												id: "stop_propagation_effector",
    												ref: "stop_propagation_effect"
    											},
    											{
    												id: "stop_propagation_payload"
    											},
    											{
    												id: "stop_propagation_effect",
    												ref: "array"
    											},
    											{
    												id: "get_value",
    												script: "return target.value !== undefined ? (typeof target.value === 'object' ? JSON.stringify(target.value) : target.value.toString()) : def"
    											},
    											{
    												id: "get_ref",
    												script: "return (target.ref ? target.ref : target.value !== undefined ? 'value' : target.script ? 'script' : target.nodes ? `graph (${target.nested_node_count}, ${target.nested_edge_count})` : 'object')"
    											},
    											{
    												id: "selected_distance",
    												ref: "arg",
    												value: "selected_distance"
    											},
    											{
    												id: "shorten",
    												args: [
    													"text"
    												],
    												script: "return text.substring(text.lastIndexOf('/') + 1)"
    											},
    											{
    												id: "node_primary_text_attrs",
    												value: {
    													"class": "primary",
    													dy: ".6em",
    													x: "48"
    												}
    											},
    											{
    												id: "tspan_dom_type",
    												value: "tspan"
    											},
    											{
    												id: "display_name_input",
    												script: "return n.name ? 'name' : n.value !== undefined ? 'value' : 'id'"
    											},
    											{
    												id: "display_name",
    												ref: "switch"
    											},
    											{
    												id: "node_primary_text_text",
    												ref: "html_text"
    											},
    											{
    												id: "node_primary_text",
    												ref: "html_element"
    											},
    											{
    												id: "node_secondary_text_base_props",
    												value: {
    													"class": "secondary",
    													dy: "1.2em",
    													x: "48"
    												}
    											},
    											{
    												id: "state",
    												ref: "arg",
    												value: "state"
    											},
    											{
    												id: "state_nodes",
    												ref: "arg",
    												value: "state.display_graph.nodes"
    											},
    											{
    												id: "arg_nodes",
    												ref: "arg",
    												value: "nodes"
    											},
    											{
    												id: "nodes",
    												ref: "default"
    											},
    											{
    												id: "dg_nodes",
    												ref: "default"
    											},
    											{
    												id: "state_selected",
    												ref: "arg",
    												value: "state.selected.0"
    											},
    											{
    												id: "arg_selected",
    												ref: "arg",
    												value: "selected"
    											},
    											{
    												id: "selected",
    												ref: "default"
    											},
    											{
    												id: "is_selected",
    												ref: "eq"
    											},
    											{
    												id: "selected_node",
    												ref: "find_node"
    											},
    											{
    												id: "selected_dg_node",
    												ref: "find_node"
    											},
    											{
    												id: "selected_node_id",
    												ref: "get"
    											},
    											{
    												id: "node_secondary_text_onclick_show_edit_text_payload"
    											},
    											{
    												id: "node_secondary_text_onclick_show_edit_text",
    												ref: "array"
    											},
    											{
    												id: "node_secondary_text_onclick_effects",
    												ref: "array"
    											},
    											{
    												id: "node_secondary_text_onclick"
    											},
    											{
    												id: "node_secondary_text_onclick_runnable",
    												ref: "runnable"
    											},
    											{
    												id: "node_selected_secondary_text_onclick_runnable",
    												ref: "if"
    											},
    											{
    												id: "node_secondary_text_onclick_props"
    											},
    											{
    												id: "node_secondary_text_props",
    												ref: "merge_objects"
    											},
    											{
    												id: "node_secondary_text_text",
    												ref: "html_text"
    											},
    											{
    												id: "node_secondary_text",
    												ref: "html_element"
    											},
    											{
    												id: "node_text_dom_type",
    												value: "text"
    											},
    											{
    												id: "node_text",
    												ref: "html_element"
    											},
    											{
    												id: "script",
    												value: "script"
    											},
    											{
    												id: "node_text_props",
    												args: [
    													"selected_distance"
    												],
    												script: "return { x: 48, y: 12 }"
    											},
    											{
    												id: "node_text_children",
    												args: [
    													"primary",
    													"secondary"
    												],
    												script: "return [primary.el, !hide_types && secondary.el]"
    											},
    											{
    												id: "text",
    												value: "text"
    											}
    										],
    										edges: [
    											{
    												from: "node",
    												to: "get_id",
    												as: "target"
    											},
    											{
    												from: "node_id",
    												to: "get_id",
    												as: "path"
    											},
    											{
    												from: "state_nodes",
    												to: "nodes",
    												as: "otherwise"
    											},
    											{
    												from: "arg_nodes",
    												to: "nodes",
    												as: "value"
    											},
    											{
    												from: "get_id",
    												to: "selected_node",
    												as: "node_id"
    											},
    											{
    												from: "nodes",
    												to: "selected_node",
    												as: "nodes"
    											},
    											{
    												from: "arg_node",
    												to: "node",
    												as: "value"
    											},
    											{
    												from: "payload_node",
    												to: "node",
    												as: "otherwise"
    											},
    											{
    												from: "state_selected",
    												to: "selected",
    												as: "otherwise"
    											},
    											{
    												from: "arg_selected",
    												to: "selected",
    												as: "value"
    											},
    											{
    												from: "get_id",
    												to: "is_selected",
    												as: "a"
    											},
    											{
    												from: "selected",
    												to: "is_selected",
    												as: "b"
    											},
    											{
    												from: "node",
    												to: "get_ref",
    												as: "target"
    											},
    											{
    												from: "node",
    												to: "get_value",
    												as: "target"
    											},
    											{
    												from: "node",
    												to: "get_name",
    												as: "target"
    											},
    											{
    												from: "get_id",
    												to: "display_name",
    												as: "id"
    											},
    											{
    												from: "get_value",
    												to: "display_name",
    												as: "value"
    											},
    											{
    												from: "node_ref",
    												to: "get_ref",
    												as: "path"
    											},
    											{
    												from: "node_name",
    												to: "get_name",
    												as: "path"
    											},
    											{
    												from: "script",
    												to: "get_ref",
    												as: "default_value"
    											},
    											{
    												from: "get_name",
    												to: "display_name",
    												as: "name"
    											},
    											{
    												from: "node",
    												to: "display_name_input",
    												as: "n"
    											},
    											{
    												from: "display_name_input",
    												to: "display_name",
    												as: "input"
    											},
    											{
    												from: "stop_propagation_effector",
    												to: "stop_propagation_effect",
    												as: "a0"
    											},
    											{
    												from: "event",
    												to: "stop_propagation_effect",
    												as: "a1"
    											},
    											{
    												from: "display_name",
    												to: "node_primary_text_text",
    												as: "text"
    											},
    											{
    												from: "get_ref",
    												to: "node_secondary_text_text",
    												as: "text"
    											},
    											{
    												from: "node_text_props",
    												to: "node_text",
    												as: "props"
    											},
    											{
    												from: "node_primary_text_text",
    												to: "node_primary_text",
    												as: "children"
    											},
    											{
    												from: "node_primary_text_attrs",
    												to: "node_primary_text",
    												as: "props"
    											},
    											{
    												from: "node_primary_text",
    												to: "node_text_children",
    												as: "primary"
    											},
    											{
    												from: "hide_types",
    												to: "node_text_children",
    												as: "hide_types"
    											},
    											{
    												from: "node_secondary_text_text",
    												to: "node_secondary_text",
    												as: "children"
    											},
    											{
    												from: "node_secondary_text_base_props",
    												to: "node_secondary_text_props",
    												as: "a0"
    											},
    											{
    												from: "node_secondary_text_onclick_props",
    												to: "node_secondary_text_props",
    												as: "a1"
    											},
    											{
    												from: "node",
    												to: "node_secondary_text_onclick_runnable",
    												as: "node"
    											},
    											{
    												from: "node_secondary_text_onclick_runnable",
    												to: "node_selected_secondary_text_onclick_runnable",
    												as: "true"
    											},
    											{
    												from: "arg_selected",
    												to: "node_selected_secondary_text_onclick_runnable",
    												as: "pred"
    											},
    											{
    												from: "node_selected_secondary_text_onclick_runnable",
    												to: "node_secondary_text_onclick_props",
    												as: "onclick"
    											},
    											{
    												from: "node_selected_secondary_text_onclick_runnable",
    												to: "node_secondary_text_onclick_props",
    												as: "ontouchstart"
    											},
    											{
    												from: "node_secondary_text_onclick",
    												to: "node_secondary_text_onclick_runnable",
    												as: "fn"
    											},
    											{
    												from: "show_edit_text",
    												to: "node_secondary_text_onclick_show_edit_text",
    												as: "a0"
    											},
    											{
    												from: "update_node",
    												to: "node_secondary_text_onclick_show_edit_text_payload",
    												as: "oneditconfirm"
    											},
    											{
    												from: "node",
    												to: "node_secondary_text_onclick_show_edit_text_payload",
    												as: "position"
    											},
    											{
    												from: "get_id",
    												to: "node_secondary_text_onclick_show_edit_text_payload",
    												as: "id"
    											},
    											{
    												from: "get_ref",
    												to: "node_secondary_text_onclick_show_edit_text_payload",
    												as: "value"
    											},
    											{
    												from: "node_ref",
    												to: "node_secondary_text_onclick_show_edit_text_payload",
    												as: "property"
    											},
    											{
    												from: "node",
    												to: "node_secondary_text_onclick_show_edit_text_payload",
    												as: "node"
    											},
    											{
    												from: "node_secondary_text_onclick_show_edit_text_payload",
    												to: "node_secondary_text_onclick_show_edit_text",
    												as: "a1"
    											},
    											{
    												from: "stop_propagation_effect",
    												to: "node_secondary_text_onclick_effects",
    												as: "a1"
    											},
    											{
    												from: "node_secondary_text_onclick_show_edit_text",
    												to: "node_secondary_text_onclick_effects",
    												as: "a0"
    											},
    											{
    												from: "node_secondary_text_onclick_effects",
    												to: "node_secondary_text_onclick",
    												as: "effects"
    											},
    											{
    												from: "state",
    												to: "node_secondary_text_onclick",
    												as: "state"
    											},
    											{
    												from: "node_secondary_text_props",
    												to: "node_secondary_text",
    												as: "props"
    											},
    											{
    												from: "tspan_dom_type",
    												to: "node_primary_text",
    												as: "dom_type"
    											},
    											{
    												from: "node_secondary_text",
    												to: "node_text_children",
    												as: "secondary"
    											},
    											{
    												from: "tspan_dom_type",
    												to: "node_secondary_text",
    												as: "dom_type"
    											},
    											{
    												from: "node_text_children",
    												to: "node_text",
    												as: "children"
    											},
    											{
    												from: "node_text_dom_type",
    												to: "node_text",
    												as: "dom_type"
    											},
    											{
    												from: "node_text",
    												to: "out"
    											}
    										]
    									},
    									{
    										id: "fill_rect",
    										script: "return {dom_type: 'rect', props:{class:{fill: true}, width: '48', 'height': '48'}, children: []}"
    									},
    									{
    										id: "order",
    										args: [
    											"shape",
    											"text"
    										],
    										script: "return [shape.el, text.el, rect]"
    									},
    									{
    										id: "out"
    									}
    								],
    								edges: [
    									{
    										from: "in",
    										to: "out",
    										as: "_"
    									},
    									{
    										from: "node",
    										to: "node_shape_attrs",
    										as: "node"
    									},
    									{
    										from: "selected_distance",
    										to: "node_shape_attrs",
    										as: "selected_distance"
    									},
    									{
    										from: "error",
    										to: "node_shape_attrs",
    										as: "error"
    									},
    									{
    										from: "default_color",
    										to: "node_shape_attrs",
    										as: "color"
    									},
    									{
    										from: "empty_array",
    										to: "node_shape",
    										as: "children"
    									},
    									{
    										from: "node",
    										to: "node_shape_dom_type",
    										as: "node"
    									},
    									{
    										from: "node_shape_dom_type",
    										to: "node_shape",
    										as: "dom_type"
    									},
    									{
    										from: "node_node",
    										to: "text"
    									},
    									{
    										from: "node_shape_attrs",
    										to: "node_shape",
    										as: "props"
    									},
    									{
    										from: "node_shape",
    										to: "order",
    										as: "shape"
    									},
    									{
    										from: "text",
    										to: "order",
    										as: "text"
    									},
    									{
    										from: "fill_rect",
    										to: "order",
    										as: "rect"
    									},
    									{
    										from: "order",
    										to: "out",
    										as: "children"
    									}
    								]
    							}
    						],
    						edges: [
    							{
    								from: "selected",
    								to: "is_selected",
    								as: "selected"
    							},
    							{
    								from: "selected",
    								to: "parent_attrs",
    								as: "selected"
    							},
    							{
    								from: "selected_edge",
    								to: "parent_attrs",
    								as: "selected_edge"
    							},
    							{
    								from: "hover",
    								to: "parent_attrs",
    								as: "hover"
    							},
    							{
    								from: "get_node",
    								to: "get_ref"
    							},
    							{
    								from: "get_node",
    								to: "is_selected",
    								as: "node"
    							},
    							{
    								from: "is_selected",
    								to: "children",
    								as: "selected"
    							},
    							{
    								from: "children",
    								to: "out"
    							},
    							{
    								from: "show_all",
    								to: "parent_attrs",
    								as: "show_all"
    							},
    							{
    								from: "html_id",
    								to: "parent_attrs",
    								as: "html_id"
    							},
    							{
    								from: "selected_distance",
    								to: "parent_attrs",
    								as: "selected_distance"
    							},
    							{
    								from: "selected_distance",
    								to: "children",
    								as: "selected_distance"
    							},
    							{
    								from: "onclick_node",
    								to: "parent_attrs",
    								as: "onclick"
    							},
    							{
    								from: "parent_attrs",
    								to: "out",
    								as: "props"
    							},
    							{
    								from: "parent_dom_type",
    								to: "out",
    								as: "dom_type"
    							},
    							{
    								from: "get_node",
    								to: "parent_attrs",
    								as: "node"
    							}
    						]
    					},
    					{
    						id: "link_layout",
    						script: "const fn = _lib.no.executeGraphNode({graph: _graph})(link_layout_map); return links.map(link => fn(Object.assign({readonly, show_all, randid, link: Object.assign({edge: display_graph.edges.find(e => link.source.node_id === e.from && link.target.node_id === e.to)}, link), selected_distance: levels.distance_from_selected.get(link.target.node_child_id) !== undefined ? Math.min(levels.distance_from_selected.get(link.target.node_child_id), levels.distance_from_selected.get(link.source.node_child_id)) : undefined, sibling_index_normalized: (levels.siblings.get(link.source.node_id).findIndex(n => n === link.source.node_id) + 1) / (levels.siblings.get(link.source.node_id).length + 1)}, _node_inputs)))"
    					},
    					{
    						id: "link_layout_map",
    						nodes: [
    							{
    								id: "in"
    							},
    							{
    								id: "get_link",
    								ref: "arg",
    								value: "link"
    							},
    							{
    								id: "get_selected_edge",
    								ref: "arg",
    								value: "selected_edge"
    							},
    							{
    								id: "source",
    								ref: "arg",
    								value: "link.source"
    							},
    							{
    								id: "target",
    								ref: "arg",
    								value: "link.target"
    							},
    							{
    								id: "selected_distance",
    								ref: "arg",
    								value: "selected_distance"
    							},
    							{
    								id: "sibling_index_normalized",
    								ref: "arg",
    								value: "sibling_index_normalized"
    							},
    							{
    								id: "show_all",
    								ref: "arg",
    								value: "show_all"
    							},
    							{
    								id: "edge",
    								ref: "arg",
    								value: "link.edge"
    							},
    							{
    								id: "edge_info_el",
    								ref: "html_element"
    							},
    							{
    								id: "edge_info_el_children",
    								script: "return [rect.el, edge_as.el, edge_type.el]"
    							},
    							{
    								id: "edge_info_dom_type",
    								value: "svg"
    							},
    							{
    								id: "onclick_edge",
    								ref: "onclick_edge"
    							},
    							{
    								id: "edge_info_props",
    								script: "return ({id: `edge-info-${source.node_child_id}`, key: `edge-info-${source.node_child_id}`, z: selected_edge && source.node_id === selected_edge.from && target.node_id === selected_edge.to ? 100 : 200, opacity: show_all ? 1 : selected_distance !== undefined ? Math.max(0.05, 1 - selected_distance * selected_distance / 2) : 0.1, class: {'edge-info': true, selected: selected_edge && (source.node_id === selected_edge.from + '_' + selected_edge.to || (source.node_id === selected_edge.from && target.node_id === selected_edge.to))}, onclick: (state, payload) => [onclick_edge, {event: payload, edge}], ontouchstart: (state, payload) => [onclick_edge, {event: payload, edge}]})"
    							},
    							{
    								id: "edge_info_line_position",
    								value: 0.5,
    								min: 0,
    								max: 1,
    								step: 0.01
    							},
    							{
    								id: "edge_info_type_props",
    								value: {
    									"font-size": 14,
    									y: 32
    								}
    							},
    							{
    								id: "edge_info_type_el",
    								ref: "svg_text"
    							},
    							{
    								id: "edge_info_type_text",
    								script: "return edge?.type ?? ''"
    							},
    							{
    								id: "edge_info_as_props",
    								value: {
    									"font-size": 14,
    									y: 16
    								}
    							},
    							{
    								id: "edge_info_as_el",
    								ref: "svg_text"
    							},
    							{
    								id: "readonly",
    								ref: "arg",
    								value: "readonly"
    							},
    							{
    								id: "edge_info_as_text",
    								script: "return edge?.as ?? (readonly ? '' : '*')"
    							},
    							{
    								id: "edge_info_rect_dom_type",
    								value: "rect"
    							},
    							{
    								id: "edge_info_rect",
    								ref: "html_element"
    							},
    							{
    								id: "lerp_length",
    								value: 24
    							},
    							{
    								id: "line_lerp",
    								script: "const length_x = Math.abs(source.x - target.x); const length_y = Math.abs(source.y - target.y); const length = Math.sqrt(length_x * length_x + length_y * length_y); return {selected_distance, selected_edge, source: {...source, x: source.x + (target.x - source.x) * lerp_length / length, y: source.y + (target.y - source.y) * lerp_length / length}, target: {...target, x: source.x + (target.x - source.x) * (1 - (lerp_length / length)), y: source.y + (target.y - source.y) * (1 - (lerp_length / length))}}"
    							},
    							{
    								id: "line_props",
    								script: "return ({id: `link-${source.node_child_id}`, key: `link-${source.node_child_id}`, onclick: (state, payload) => [onclick_edge, {event: payload, edge}], class: `link ${selected_edge && (source.node_id === selected_edge.from + '_' + selected_edge.to || (source.node_id === selected_edge.from && target.node_id === selected_edge.to)) ? 'selected' : 'unselected'}`, 'marker-end': 'url(#arrow)', opacity: show_all ? 1 : selected_distance !== undefined ? Math.max(0.05, 1 - selected_distance * selected_distance / 2) : 0.1})"
    							},
    							{
    								id: "line_dom_type",
    								value: "line"
    							},
    							{
    								id: "empty_array",
    								value: [
    								]
    							},
    							{
    								id: "line",
    								ref: "html_element"
    							},
    							{
    								id: "insert_node_el",
    								out: "el",
    								nodes: [
    									{
    										id: "link",
    										ref: "arg",
    										value: "link"
    									},
    									{
    										id: "randid",
    										ref: "arg",
    										value: "randid"
    									},
    									{
    										id: "base_props",
    										value: {
    											href: "svg/add-circle-outline.svg#icon",
    											width: "32px",
    											height: "32px",
    											"class": "insert-node"
    										}
    									},
    									{
    										id: "position",
    										script: "return {x: (link.source.x + link.target.x) * 0.5 - 16, y: (link.source.y + link.target.y) * 0.5 - 16, id: `insert-${link.source.node_child_id}`, key: `insert-${link.source.node_child_id}`}"
    									},
    									{
    										id: "insert_node",
    										ref: "insert_node"
    									},
    									{
    										id: "onclick_props",
    										script: "return {onclick: (s, p) => [s, [insert_node, {edge: link.edge, node: {id: randid}}]], ontouchstart: (s, p) => [s, [insert_node, {edge: link.edge, node: {id: randid}}]]}"
    									},
    									{
    										id: "props",
    										ref: "merge_objects"
    									},
    									{
    										id: "el",
    										ref: "add_circle_icon"
    									}
    								],
    								edges: [
    									{
    										from: "randid",
    										to: "onclick_props",
    										as: "randid"
    									},
    									{
    										from: "link",
    										to: "onclick_props",
    										as: "link"
    									},
    									{
    										from: "insert_node",
    										to: "onclick_props",
    										as: "insert_node"
    									},
    									{
    										from: "link",
    										to: "position",
    										as: "link"
    									},
    									{
    										from: "base_props",
    										to: "props",
    										as: "o0"
    									},
    									{
    										from: "position",
    										to: "props",
    										as: "o1"
    									},
    									{
    										from: "onclick_props",
    										to: "props",
    										as: "o2"
    									},
    									{
    										from: "props",
    										to: "el",
    										as: "props"
    									}
    								]
    							},
    							{
    								id: "out",
    								args: [
    									"line",
    									"edge_info"
    								],
    								script: "return [line, edge_info, !readonly && selected_distance < 1 && insert_node]"
    							}
    						],
    						edges: [
    							{
    								from: "in",
    								to: "line_props"
    							},
    							{
    								from: "get_link",
    								to: "line_lerp"
    							},
    							{
    								from: "show_all",
    								to: "line_props",
    								as: "show_all"
    							},
    							{
    								from: "get_selected_edge",
    								to: "line_props",
    								as: "selected_edge"
    							},
    							{
    								from: "get_selected_edge",
    								to: "line_lerp",
    								as: "selected_edge"
    							},
    							{
    								from: "get_selected_edge",
    								to: "edge_info_props",
    								as: "selected_edge"
    							},
    							{
    								from: "selected_distance",
    								to: "edge_info_props",
    								as: "selected_distance"
    							},
    							{
    								from: "sibling_index_normalized",
    								to: "edge_info_props",
    								as: "sibling_index_normalized"
    							},
    							{
    								from: "show_all",
    								to: "edge_info_props",
    								as: "show_all"
    							},
    							{
    								from: "onclick_edge",
    								to: "edge_info_props",
    								as: "onclick_edge"
    							},
    							{
    								from: "edge",
    								to: "line_props",
    								as: "edge"
    							},
    							{
    								from: "onclick_edge",
    								to: "line_props",
    								as: "onclick_edge"
    							},
    							{
    								from: "selected_distance",
    								to: "line_props",
    								as: "selected_distance"
    							},
    							{
    								from: "source",
    								to: "line_lerp",
    								as: "source"
    							},
    							{
    								from: "target",
    								to: "line_lerp",
    								as: "target"
    							},
    							{
    								from: "source",
    								to: "line_props",
    								as: "source"
    							},
    							{
    								from: "target",
    								to: "line_props",
    								as: "target"
    							},
    							{
    								from: "source",
    								to: "edge_info_props",
    								as: "source"
    							},
    							{
    								from: "target",
    								to: "edge_info_props",
    								as: "target"
    							},
    							{
    								from: "selected_distance",
    								to: "line_lerp",
    								as: "selected_distance"
    							},
    							{
    								from: "line_lerp",
    								to: "line_props"
    							},
    							{
    								from: "lerp_length",
    								to: "line_lerp",
    								as: "lerp_length"
    							},
    							{
    								from: "get_link",
    								to: "edge_info_props"
    							},
    							{
    								from: "edge",
    								to: "edge_info_props",
    								as: "edge"
    							},
    							{
    								from: "readonly",
    								to: "edge_info_props",
    								as: "readonly"
    							},
    							{
    								from: "edge",
    								to: "edge_info_as_text",
    								as: "edge"
    							},
    							{
    								from: "edge_info_dom_type",
    								to: "edge_info_el",
    								as: "dom_type"
    							},
    							{
    								from: "edge_info_props",
    								to: "edge_info_el",
    								as: "props"
    							},
    							{
    								from: "edge_info_line_position",
    								to: "edge_info_props",
    								as: "line_position"
    							},
    							{
    								from: "edge_info_rect",
    								to: "edge_info_el_children",
    								as: "rect"
    							},
    							{
    								from: "edge_info_rect_dom_type",
    								to: "edge_info_rect",
    								as: "dom_type"
    							},
    							{
    								from: "edge_info_el_children",
    								to: "edge_info_el",
    								as: "children"
    							},
    							{
    								from: "edge_info_el",
    								to: "out",
    								as: "edge_info"
    							},
    							{
    								from: "edge_info_type_props",
    								to: "edge_info_type_el",
    								as: "props"
    							},
    							{
    								from: "edge",
    								to: "edge_info_type_text",
    								as: "edge"
    							},
    							{
    								from: "edge_info_type_text",
    								to: "edge_info_type_el",
    								as: "text"
    							},
    							{
    								from: "edge_info_type_el",
    								to: "edge_info_el_children",
    								as: "edge_type",
    								type: "resolve"
    							},
    							{
    								from: "edge_info_as_props",
    								to: "edge_info_as_el",
    								as: "props"
    							},
    							{
    								from: "readonly",
    								to: "edge_info_as_text",
    								as: "readonly"
    							},
    							{
    								from: "edge_info_as_text",
    								to: "edge_info_as_el",
    								as: "text"
    							},
    							{
    								from: "edge_info_as_el",
    								to: "edge_info_el_children",
    								as: "edge_as",
    								type: "resolve"
    							},
    							{
    								from: "line_props",
    								to: "line",
    								as: "props"
    							},
    							{
    								from: "line_dom_type",
    								to: "line",
    								as: "dom_type"
    							},
    							{
    								from: "empty_array",
    								to: "line",
    								as: "children"
    							},
    							{
    								from: "empty_array",
    								to: "line",
    								as: "children"
    							},
    							{
    								from: "line",
    								to: "out",
    								as: "line"
    							},
    							{
    								from: "selected_distance",
    								to: "out",
    								as: "selected_distance"
    							},
    							{
    								from: "readonly",
    								to: "out",
    								as: "readonly"
    							},
    							{
    								from: "insert_node_el",
    								to: "out",
    								as: "insert_node"
    							}
    						]
    					},
    					{
    						id: "line_end",
    						ref: "html_element"
    					},
    					{
    						id: "line_end_props",
    						value: {
    							id: "arrow",
    							refX: 8,
    							refY: 4,
    							markerWidth: 8,
    							markerHeight: 8,
    							markerUnits: "userSpaceOnUse",
    							orient: "auto"
    						}
    					},
    					{
    						id: "line_end_children",
    						args: [
    							"children"
    						],
    						script: "return [children.el]"
    					},
    					{
    						id: "arrow_path",
    						ref: "html_element"
    					},
    					{
    						id: "arrow_path_props",
    						value: {
    							points: "1 1, 8 4, 1 8"
    						}
    					},
    					{
    						id: "arrow_path_dom_type",
    						value: "polyline"
    					},
    					{
    						id: "fill_filter_flood_dom_type",
    						value: "feFlood"
    					},
    					{
    						id: "fill_filter_flood_props",
    						value: {
    							"flood-color": "#000a"
    						}
    					},
    					{
    						id: "fill_filter_flood",
    						ref: "html_element"
    					},
    					{
    						id: "fill_filter_props",
    						value: {
    							id: "flood-background",
    							width: 1.2,
    							height: 1.1,
    							x: -0.1,
    							y: -0.05
    						}
    					},
    					{
    						id: "fill_filter_flood_selected_dom_type",
    						value: "feFlood"
    					},
    					{
    						id: "fill_filter_flood_selected_props",
    						value: {
    							"flood-color": "red"
    						}
    					},
    					{
    						id: "fill_filter_flood_selected",
    						ref: "html_element"
    					},
    					{
    						id: "fill_filter_selected_props",
    						value: {
    							id: "selected-flood-background",
    							width: 1.2,
    							height: 1.5,
    							x: -0.1,
    							y: -0.25
    						}
    					},
    					{
    						id: "fill_filter_composite_props",
    						value: {
    							"in": "SourceGraphic"
    						}
    					},
    					{
    						id: "fill_filter_composite_dom_type",
    						value: "feComposite"
    					},
    					{
    						id: "fill_filter_composite",
    						ref: "html_element"
    					},
    					{
    						id: "fill_filter_children",
    						script: "return [flood.el, comp.el]"
    					},
    					{
    						id: "fill_filter_selected_children",
    						script: "return [flood.el, comp.el]"
    					},
    					{
    						id: "fill_filter_dom_type",
    						value: "filter"
    					},
    					{
    						id: "fill_filter",
    						ref: "html_element"
    					},
    					{
    						id: "fill_filter_selected",
    						ref: "html_element"
    					},
    					{
    						id: "marker",
    						value: "marker"
    					},
    					{
    						id: "defs_children",
    						args: [
    							"arrow",
    							"bg_color",
    							"bg_color_selected"
    						],
    						script: "return [bg_color.el, bg_color_selected.el, arrow.el]"
    					},
    					{
    						id: "defs",
    						ref: "html_element"
    					},
    					{
    						id: "defs_dom_type",
    						value: "defs"
    					},
    					{
    						id: "defs_props",
    						value: {
    						}
    					},
    					{
    						id: "link_selected_distance",
    						args: [
    							"link"
    						],
    						script: "return !link ? [] : link.selected_distance ? link.selected_distance : 10"
    					},
    					{
    						id: "filter_links",
    						ref: "filter_eq"
    					}
    				],
    				edges: [
    					{
    						from: "nodes",
    						to: "get_nodes",
    						as: "nodes"
    					},
    					{
    						from: "get_selected",
    						to: "get_links",
    						as: "selected"
    					},
    					{
    						from: "links",
    						to: "get_links",
    						as: "links"
    					},
    					{
    						from: "node_el_width",
    						to: "get_nodes",
    						as: "node_el_width"
    					},
    					{
    						from: "html_id",
    						to: "node_layout",
    						as: "html_id"
    					},
    					{
    						from: "hover",
    						to: "node_layout",
    						as: "hover"
    					},
    					{
    						from: "error",
    						to: "node_layout",
    						as: "error"
    					},
    					{
    						from: "display_graph",
    						to: "node_layout",
    						as: "display_graph"
    					},
    					{
    						from: "node_el_width",
    						to: "node_layout",
    						as: "node_el_width"
    					},
    					{
    						from: "get_nodes",
    						to: "node_layout",
    						as: "nodes"
    					},
    					{
    						from: "node_el_width",
    						to: "get_links",
    						as: "node_el_width"
    					},
    					{
    						from: "get_links",
    						to: "duplicate_nodes",
    						as: "links"
    					},
    					{
    						from: "get_levels",
    						to: "duplicate_nodes",
    						as: "levels"
    					},
    					{
    						from: "get_levels",
    						to: "node_layout",
    						as: "levels"
    					},
    					{
    						from: "get_graph",
    						to: "node_layout",
    						as: "graph"
    					},
    					{
    						from: "show_all",
    						to: "link_layout",
    						as: "show_all"
    					},
    					{
    						from: "randid",
    						to: "link_layout",
    						as: "randid"
    					},
    					{
    						from: "readonly",
    						to: "link_layout",
    						as: "readonly"
    					},
    					{
    						from: "show_all",
    						to: "node_layout",
    						as: "show_all"
    					},
    					{
    						from: "hide_types",
    						to: "node_layout",
    						as: "hide_types"
    					},
    					{
    						from: "display_graph",
    						to: "link_layout",
    						as: "display_graph"
    					},
    					{
    						from: "get_graph",
    						to: "link_layout",
    						as: "graph"
    					},
    					{
    						from: "get_selected",
    						to: "node_layout",
    						as: "selected"
    					},
    					{
    						from: "get_links",
    						to: "link_selected_distance",
    						as: "link"
    					},
    					{
    						from: "get_selected_edge",
    						to: "filter_links",
    						as: "selected_edge"
    					},
    					{
    						from: "get_selected_edge",
    						to: "node_layout",
    						as: "selected_edge"
    					},
    					{
    						from: "get_selected_edge",
    						to: "link_layout",
    						as: "selected_edge"
    					},
    					{
    						from: "link_selected_distance",
    						to: "filter_links",
    						as: "keep"
    					},
    					{
    						from: "get_links",
    						to: "filter_links"
    					},
    					{
    						from: "get_links",
    						to: "link_layout",
    						as: "links"
    					},
    					{
    						from: "get_levels",
    						to: "link_layout",
    						as: "levels"
    					},
    					{
    						from: "link_layout_map",
    						to: "link_layout",
    						as: "link_layout_map",
    						type: "ref"
    					},
    					{
    						from: "in",
    						to: "node_editor_props"
    					},
    					{
    						from: "html_id",
    						to: "node_editor_props",
    						as: "html_id"
    					},
    					{
    						from: "readonly",
    						to: "node_editor_props",
    						as: "readonly"
    					},
    					{
    						from: "hash",
    						to: "node_editor_props",
    						as: "hash"
    					},
    					{
    						from: "html_id",
    						to: "panzoom_box_props",
    						as: "html_id"
    					},
    					{
    						from: "get_selected",
    						to: "get_selected_node",
    						as: "node_id"
    					},
    					{
    						from: "node_el_width",
    						to: "node_editor_props",
    						as: "node_el_width"
    					},
    					{
    						from: "dimensions",
    						to: "node_editor_props",
    						as: "dimensions"
    					},
    					{
    						from: "get_nodes",
    						to: "get_selected_node",
    						as: "nodes"
    					},
    					{
    						from: "get_selected_node",
    						to: "node_editor_props",
    						as: "selected"
    					},
    					{
    						from: "onclick_graph",
    						to: "node_editor_props",
    						as: "onclick_graph"
    					},
    					{
    						from: "node_editor_props",
    						to: "out",
    						as: "props"
    					},
    					{
    						from: "node_editor_dom_type",
    						to: "out",
    						as: "dom_type"
    					},
    					{
    						from: "node_layout_map",
    						to: "node_layout",
    						as: "node_layout_map",
    						type: "ref"
    					},
    					{
    						from: "node_layout",
    						to: "node_editor_children",
    						as: "nodes"
    					},
    					{
    						from: "get_selected",
    						to: "dg_selected",
    						as: "node_id"
    					},
    					{
    						from: "dg_nodes",
    						to: "dg_selected",
    						as: "nodes"
    					},
    					{
    						from: "dg_selected",
    						to: "node_args",
    						as: "node"
    					},
    					{
    						from: "dg_nodes",
    						to: "node_args",
    						as: "nodes"
    					},
    					{
    						from: "get_selected_node",
    						to: "dummy_nodes",
    						as: "selected_node"
    					},
    					{
    						from: "node_args",
    						to: "dummy_nodes",
    						as: "args"
    					},
    					{
    						from: "get_selected",
    						to: "dummy_node_els",
    						as: "selected"
    					},
    					{
    						from: "dummy_nodes",
    						to: "dummy_node_els",
    						as: "nodes"
    					},
    					{
    						from: "dummy_nodes",
    						to: "dummy_links",
    						as: "nodes"
    					},
    					{
    						from: "get_selected_node",
    						to: "dummy_links",
    						as: "selected_node"
    					},
    					{
    						from: "node_args",
    						to: "dummy_links",
    						as: "args"
    					},
    					{
    						from: "dummy_links",
    						to: "dummy_link_els",
    						as: "links"
    					},
    					{
    						from: "node_layout_map",
    						to: "dummy_node_els",
    						as: "node_layout_map",
    						type: "ref"
    					},
    					{
    						from: "dummy_node_els",
    						to: "_node_editor_children",
    						as: "dummy_nodes"
    					},
    					{
    						from: "link_layout_map",
    						to: "dummy_link_els",
    						as: "link_layout_map",
    						type: "ref"
    					},
    					{
    						from: "dummy_link_els",
    						to: "_node_editor_children",
    						as: "dummy_links"
    					},
    					{
    						from: "get_selected_node",
    						to: "dummy_node_el",
    						as: "selected_node"
    					},
    					{
    						from: "dummy_node_el",
    						to: "node_editor_children",
    						as: "dummy_node"
    					},
    					{
    						from: "get_nodes",
    						to: "node_editor_children_inputs",
    						as: "nodes"
    					},
    					{
    						from: "link_layout",
    						to: "node_editor_children",
    						as: "links"
    					},
    					{
    						from: "get_links",
    						to: "node_editor_children_inputs",
    						as: "links"
    					},
    					{
    						from: "defs",
    						to: "node_editor_children",
    						as: "defs"
    					},
    					{
    						from: "marker",
    						to: "line_end",
    						as: "dom_type"
    					},
    					{
    						from: "arrow_path_props",
    						to: "arrow_path",
    						as: "props"
    					},
    					{
    						from: "arrow_path_dom_type",
    						to: "arrow_path",
    						as: "dom_type"
    					},
    					{
    						from: "arrow_path",
    						to: "line_end",
    						as: "children"
    					},
    					{
    						from: "line_end_props",
    						to: "line_end",
    						as: "props"
    					},
    					{
    						from: "line_end",
    						to: "defs_children",
    						as: "arrow"
    					},
    					{
    						from: "fill_filter_flood_props",
    						to: "fill_filter_flood",
    						as: "props"
    					},
    					{
    						from: "fill_filter_flood_dom_type",
    						to: "fill_filter_flood",
    						as: "dom_type"
    					},
    					{
    						from: "fill_filter_flood",
    						to: "fill_filter_children",
    						as: "flood"
    					},
    					{
    						from: "fill_filter_flood_selected_props",
    						to: "fill_filter_flood_selected",
    						as: "props"
    					},
    					{
    						from: "fill_filter_flood_selected_dom_type",
    						to: "fill_filter_flood_selected",
    						as: "dom_type"
    					},
    					{
    						from: "fill_filter_flood_selected",
    						to: "fill_filter_selected_children",
    						as: "flood"
    					},
    					{
    						from: "fill_filter_composite_props",
    						to: "fill_filter_composite",
    						as: "props"
    					},
    					{
    						from: "fill_filter_composite_dom_type",
    						to: "fill_filter_composite",
    						as: "dom_type"
    					},
    					{
    						from: "fill_filter_composite",
    						to: "fill_filter_children",
    						as: "comp"
    					},
    					{
    						from: "fill_filter_children",
    						to: "fill_filter",
    						as: "children"
    					},
    					{
    						from: "fill_filter_props",
    						to: "fill_filter",
    						as: "props"
    					},
    					{
    						from: "fill_filter_composite",
    						to: "fill_filter_selected_children",
    						as: "comp"
    					},
    					{
    						from: "fill_filter_selected_children",
    						to: "fill_filter_selected",
    						as: "children"
    					},
    					{
    						from: "fill_filter_selected_props",
    						to: "fill_filter_selected",
    						as: "props"
    					},
    					{
    						from: "fill_filter_dom_type",
    						to: "fill_filter",
    						as: "dom_type"
    					},
    					{
    						from: "fill_filter_dom_type",
    						to: "fill_filter_selected",
    						as: "dom_type"
    					},
    					{
    						from: "fill_filter",
    						to: "defs_children",
    						as: "bg_color"
    					},
    					{
    						from: "fill_filter_selected",
    						to: "defs_children",
    						as: "bg_color_selected"
    					},
    					{
    						from: "defs_dom_type",
    						to: "defs",
    						as: "dom_type"
    					},
    					{
    						from: "defs_props",
    						to: "defs",
    						as: "props"
    					},
    					{
    						from: "defs_children",
    						to: "defs",
    						as: "children"
    					},
    					{
    						from: "node_editor_children",
    						to: "panzoom_box",
    						as: "children"
    					},
    					{
    						from: "panzoom_box_dom_type",
    						to: "panzoom_box",
    						as: "dom_type"
    					},
    					{
    						from: "panzoom_box_props",
    						to: "panzoom_box",
    						as: "props"
    					},
    					{
    						from: "panzoom_box",
    						to: "out",
    						as: "children"
    					},
    					{
    						from: "panzoom_box_arr",
    						to: "node_editor",
    						as: "children"
    					}
    				]
    			},
    			{
    				id: "error_display",
    				script: "return {el: {dom_type: 'div', props: {class:{error: true, main: true}, key: `${html_id}-error_display`}, children: [{dom_type: 'text_value', text: error instanceof AggregateError ? error.errors.map(e => e.toString()).join(\" \") : error?.toString()}]}}"
    			},
    			{
    				id: "noop",
    				script: "return {el: _lib.ha.h.fn('div', {key: 'loading'}, _lib.ha.text.fn('loading...'))}"
    			},
    			{
    				id: "out_input",
    				script: "return display_graph && graph ? 'hel' : 'noop'"
    			},
    			{
    				id: "out",
    				ref: "switch"
    			}
    		],
    		edges: [
    			{
    				from: "graph",
    				to: "wrapper",
    				as: "graph"
    			},
    			{
    				from: "graph",
    				to: "out_input",
    				as: "graph"
    			},
    			{
    				from: "display_graph",
    				to: "out_input",
    				as: "display_graph"
    			},
    			{
    				from: "error",
    				to: "error_display",
    				as: "error"
    			},
    			{
    				from: "html_id",
    				to: "error_display",
    				as: "html_id"
    			},
    			{
    				from: "error",
    				to: "wrapper_children",
    				as: "error"
    			},
    			{
    				from: "search",
    				to: "wrapper_children",
    				as: "search"
    			},
    			{
    				from: "error_display",
    				to: "wrapper_children",
    				as: "error_display"
    			},
    			{
    				from: "readonly",
    				to: "wrapper_children",
    				as: "readonly"
    			},
    			{
    				from: "show_result",
    				to: "wrapper_children",
    				as: "show_result"
    			},
    			{
    				from: "editing",
    				to: "wrapper_children",
    				as: "editing"
    			},
    			{
    				from: "popover_graph",
    				to: "wrapper_children",
    				as: "popover_graph"
    			},
    			{
    				from: "args_display",
    				to: "wrapper_children",
    				as: "args_display"
    			},
    			{
    				from: "readonly",
    				to: "node_editor",
    				as: "readonly"
    			},
    			{
    				from: "graph",
    				to: "node_editor",
    				as: "graph"
    			},
    			{
    				from: "node_editor",
    				to: "wrapper_children",
    				as: "node_editor"
    			},
    			{
    				from: "edit_text",
    				to: "wrapper_children",
    				as: "edit_text"
    			},
    			{
    				from: "menu",
    				to: "wrapper_children",
    				as: "menu"
    			},
    			{
    				from: "result_display",
    				to: "result_wrapper",
    				as: "run"
    			},
    			{
    				from: "result_display",
    				to: "wrapper_children",
    				as: "result_display"
    			},
    			{
    				from: "show_all",
    				to: "wrapper_children",
    				as: "show_all"
    			},
    			{
    				from: "styles",
    				to: "wrapper_children",
    				as: "styles"
    			},
    			{
    				from: "popover_graph_h",
    				to: "popover_graph_h_wrapper",
    				as: "el"
    			},
    			{
    				from: "popover_graph_h_wrapper",
    				to: "wrapper_children",
    				as: "popover_graph_h"
    			},
    			{
    				from: "wrapper_children",
    				to: "wrapper",
    				as: "children",
    				type: "resolve"
    			},
    			{
    				from: "wrapper_dom_type",
    				to: "wrapper",
    				as: "dom_type"
    			},
    			{
    				from: "wrapper_props",
    				to: "wrapper",
    				as: "props",
    				type: "resolve"
    			},
    			{
    				from: "out_input",
    				to: "out",
    				as: "input"
    			},
    			{
    				from: "noop",
    				to: "out",
    				as: "noop",
    				type: "resolve"
    			},
    			{
    				from: "wrapper",
    				to: "out",
    				as: "hel"
    			}
    		]
    	}
    ];
    var edges = [
    	{
    		from: "editor",
    		to: "hyperapp_view",
    		type: "ref",
    		as: "fn"
    	},
    	{
    		from: "get_graph",
    		to: "update_sim_fn",
    		as: "graph"
    	},
    	{
    		from: "error_nodes",
    		to: "hyperapp_init_state",
    		as: "error_nodes"
    	},
    	{
    		from: "static",
    		to: "hyperapp_init_state",
    		as: "static"
    	},
    	{
    		from: "readonly",
    		to: "hyperapp_init_state",
    		as: "readonly"
    	},
    	{
    		from: "norun",
    		to: "hyperapp_init_state",
    		as: "norun"
    	},
    	{
    		from: "hash",
    		to: "hyperapp_init_state",
    		as: "hash"
    	},
    	{
    		from: "hide_types",
    		to: "hyperapp_init_state",
    		as: "hide_types"
    	},
    	{
    		from: "dimensions",
    		to: "hyperapp_init_state",
    		as: "dimensions"
    	},
    	{
    		from: "html_id",
    		to: "hyperapp_init_state",
    		as: "html_id"
    	},
    	{
    		from: "examples",
    		to: "hyperapp_init_state",
    		as: "examples"
    	},
    	{
    		from: "display_graph_out",
    		to: "init_selected",
    		as: "a0"
    	},
    	{
    		from: "init_selected",
    		to: "hyperapp_init_state",
    		as: "selected"
    	},
    	{
    		from: "update_sim_effect",
    		to: "hyperapp_init_state",
    		as: "update_sim_effect"
    	},
    	{
    		from: "sim_to_hyperapp_fn",
    		to: "hyperapp_init_state",
    		as: "sim_to_hyperapp"
    	},
    	{
    		from: "get_graph",
    		to: "onkey_fn",
    		as: "graph"
    	},
    	{
    		from: "onkey_fn",
    		to: "initialize_hyperapp_app",
    		as: "onkey_fn"
    	},
    	{
    		from: "onkey_fn_body",
    		to: "onkey_fn",
    		as: "fn",
    		type: "ref"
    	},
    	{
    		from: "html_id",
    		to: "render_graph_effect",
    		as: "html_id"
    	},
    	{
    		from: "update_sim_effect",
    		to: "render_graph_effect",
    		as: "update_sim"
    	},
    	{
    		from: "popover_dimensions",
    		to: "render_graph_effect",
    		as: "dimensions"
    	},
    	{
    		from: "get_graph",
    		to: "render_graph_effect",
    		as: "graph"
    	},
    	{
    		from: "html_id",
    		to: "initialize_hyperapp_app",
    		as: "html_id"
    	},
    	{
    		from: "render_graph_effect",
    		to: "_initialize_hyperapp_app",
    		as: "render_graph_effect"
    	},
    	{
    		from: "hyperapp_view",
    		to: "initialize_hyperapp_app",
    		as: "view"
    	},
    	{
    		from: "update_hyperapp",
    		to: "update_hyperapp_action",
    		as: "fn",
    		type: "ref"
    	},
    	{
    		from: "update_hyperapp_action",
    		to: "update_hyperapp_effect",
    		as: "fn"
    	},
    	{
    		from: "update_hyperapp_effect",
    		to: "initialize_hyperapp_app",
    		as: "update_hyperapp"
    	},
    	{
    		from: "update_hyperapp_effect",
    		to: "hyperapp_init_state",
    		as: "update_hyperapp"
    	},
    	{
    		from: "hyperapp_init_state",
    		to: "initialize_hyperapp_app",
    		as: "init"
    	},
    	{
    		from: "get_graph",
    		to: "hyperapp_view",
    		as: "graph"
    	},
    	{
    		from: "get_graph",
    		to: "hyperapp_init_state",
    		as: "graph"
    	},
    	{
    		from: "get_graph",
    		to: "update_nodes",
    		as: "graph"
    	},
    	{
    		from: "get_display_graph",
    		to: "update_nodes",
    		as: "display_graph"
    	},
    	{
    		from: "get_display_graph",
    		to: "hyperapp_init_state",
    		as: "display_graph"
    	},
    	{
    		from: "display_graph_out",
    		to: "calculate_levels",
    		as: "selected"
    	},
    	{
    		from: "get_display_graph",
    		to: "calculate_levels",
    		as: "display_graph"
    	},
    	{
    		from: "calculate_levels",
    		to: "hyperapp_init_state",
    		as: "levels"
    	},
    	{
    		from: "initial_state",
    		to: "hyperapp_init_state"
    	},
    	{
    		from: "nodes",
    		to: "graph_to_simulation",
    		as: "nodes"
    	},
    	{
    		from: "links",
    		to: "graph_to_simulation",
    		as: "links"
    	},
    	{
    		from: "graph_to_simulation",
    		to: "graph_to_sim_action",
    		as: "fn",
    		type: "ref"
    	},
    	{
    		from: "sim_to_hyperapp",
    		to: "sim_to_hyperapp_fn",
    		as: "fn",
    		type: "ref"
    	},
    	{
    		from: "sim_to_hyperapp_fn",
    		to: "initialize_hyperapp_app",
    		as: "sim_to_hyperapp_action"
    	},
    	{
    		from: "graph_to_sim_action",
    		to: "initialize_hyperapp_app",
    		as: "graph_to_sim_action"
    	},
    	{
    		from: "update_sim_in",
    		to: "update_sim_fn",
    		as: "in_node",
    		type: "ref"
    	},
    	{
    		from: "update_sim_fn",
    		to: "update_sim_effect",
    		as: "fn"
    	},
    	{
    		from: "update_sim_effect",
    		to: "editor",
    		as: "update_sim"
    	},
    	{
    		from: "update_sim_effect",
    		to: "initialize_hyperapp_app",
    		as: "update_sim"
    	},
    	{
    		from: "initialize_hyperapp_app",
    		to: "out",
    		type: "resolve"
    	},
    	{
    		from: "get",
    		to: "object"
    	},
    	{
    		from: "set",
    		to: "object"
    	},
    	{
    		from: "delete",
    		to: "object"
    	},
    	{
    		from: "switch",
    		to: "flow"
    	},
    	{
    		from: "if",
    		to: "flow"
    	},
    	{
    		from: "html_element",
    		to: "html"
    	},
    	{
    		from: "toggle",
    		to: "html"
    	},
    	{
    		from: "input",
    		to: "html"
    	},
    	{
    		from: "css_styles",
    		to: "html"
    	},
    	{
    		from: "modify_state_runnable",
    		to: "state"
    	},
    	{
    		from: "set_display",
    		to: "state"
    	},
    	{
    		from: "array",
    		to: "arrays"
    	},
    	{
    		from: "filter",
    		to: "arrays"
    	},
    	{
    		from: "append",
    		to: "arrays"
    	},
    	{
    		from: "map",
    		to: "arrays"
    	},
    	{
    		from: "log",
    		to: "utility"
    	},
    	{
    		from: "execute_graph",
    		to: "utility"
    	},
    	{
    		from: "arg",
    		to: "utility"
    	},
    	{
    		from: "partial",
    		to: "utility"
    	},
    	{
    		from: "apply",
    		to: "utility"
    	},
    	{
    		from: "fetch",
    		to: "utility"
    	},
    	{
    		from: "merge_objects",
    		to: "utility"
    	},
    	{
    		from: "sequence",
    		to: "utility"
    	},
    	{
    		from: "runnable",
    		to: "utility"
    	},
    	{
    		from: "object_entries",
    		to: "utility"
    	},
    	{
    		from: "add",
    		to: "math"
    	},
    	{
    		from: "divide",
    		to: "math"
    	},
    	{
    		from: "negate",
    		to: "math"
    	},
    	{
    		from: "mult",
    		to: "math"
    	},
    	{
    		from: "stringify",
    		to: "JSON"
    	}
    ];
    var DEFAULT_GRAPH = {
    	id: id$1,
    	out: out,
    	nodes: nodes$1,
    	edges: edges
    };

    var examples = [
    	{
    		out: "main/out",
    		id: "simple",
    		nodes: [
    			{
    				id: "state_path",
    				ref: "arg",
    				value: "state"
    			},
    			{
    				id: "args"
    			},
    			{
    				id: "state_log",
    				ref: "log"
    			},
    			{
    				id: "log_state",
    				ref: "runnable"
    			},
    			{
    				id: "main/out"
    			}
    		],
    		edges: [
    			{
    				from: "args",
    				to: "main/out",
    				as: "args"
    			},
    			{
    				from: "state_path",
    				to: "state_log",
    				as: "value"
    			},
    			{
    				from: "state_log",
    				to: "log_state",
    				as: "fn"
    			},
    			{
    				from: "log_state",
    				to: "main/out",
    				as: "arg0"
    			}
    		]
    	},
    	{
    		"in": "main/in",
    		out: "main/out",
    		id: "hyperapp_state",
    		nodes: [
    			{
    				id: "main/out",
    				script: "console.log(\"state\")\nconsole.log(state);\nconsole.log(\"prev\")\nconsole.log(prev);\nreturn {state, display};"
    			},
    			{
    				id: "main/in"
    			},
    			{
    				id: "63tva08",
    				ref: "html_element",
    				name: "main display"
    			},
    			{
    				id: "l6vdvtn",
    				ref: "new_array",
    				name: "display elements"
    			},
    			{
    				id: "q23fegi",
    				value: "div"
    			},
    			{
    				id: "l6mvkla",
    				name: "props"
    			},
    			{
    				id: "o1wn5x1",
    				name: "class"
    			},
    			{
    				id: "zz730do",
    				value: "true"
    			},
    			{
    				id: "c2sko9c",
    				name: "hello world text",
    				out: "c2sko9c",
    				nodes: [
    					{
    						id: "c2sko9c",
    						ref: "html_element",
    						name: "hello world text"
    					},
    					{
    						id: "2lr3ihi",
    						value: "Hello, world!"
    					}
    				],
    				edges: [
    					{
    						from: "2lr3ihi",
    						to: "c2sko9c",
    						as: "text"
    					}
    				]
    			},
    			{
    				id: "ukbdszl",
    				ref: "html_element",
    				name: "display text"
    			},
    			{
    				id: "un5cq1q",
    				value: "div"
    			},
    			{
    				id: "0alhppw",
    				ref: "new_array",
    				name: "run count display"
    			},
    			{
    				id: "g82nw07",
    				ref: "html_element"
    			},
    			{
    				id: "pgygs2p/pgygs2p",
    				ref: "html_element",
    				name: "styles/out"
    			},
    			{
    				id: "pgygs2p/vdyskp6",
    				value: "style",
    				name: ""
    			},
    			{
    				id: "pgygs2p/1tf3vvf",
    				ref: "new_array",
    				name: "styles/1tf3vvf"
    			},
    			{
    				id: "pgygs2p/6yewnx1",
    				ref: "html_element",
    				name: "styles/6yewnx1"
    			},
    			{
    				id: "pgygs2p/02951w8",
    				value: ".result { position: absolute; bottom: 0; left: 0; font-size: 4em}\n.run-count { font-size: .5em; color: green}",
    				name: "css styles"
    			},
    			{
    				id: "tznmg79",
    				ref: "set",
    				name: "new state"
    			},
    			{
    				ref: "arg",
    				id: "lptd9k3",
    				value: "state"
    			},
    			{
    				id: "4ilqcxt",
    				value: "runcount"
    			},
    			{
    				ref: "arg",
    				id: "xev2phu",
    				value: "state"
    			},
    			{
    				ref: "arg",
    				id: "00ahbis",
    				value: "state.runcount"
    			},
    			{
    				id: "gbh28eu",
    				script: "return (isNaN(runcount) ? 0 : runcount) + 1",
    				name: "add 1"
    			},
    			{
    				ref: "arg",
    				id: "wegu4xm",
    				value: "state.runcount"
    			},
    			{
    				id: "wh4juqx",
    				ref: "html_element"
    			},
    			{
    				id: "edqfgkn",
    				value: "run count: "
    			},
    			{
    				id: "2t4s9uj",
    				name: "run count props"
    			},
    			{
    				id: "j630j9a",
    				value: "run-count"
    			}
    		],
    		edges: [
    			{
    				from: "main/in",
    				to: "main/out",
    				as: "args",
    				type: "ref"
    			},
    			{
    				from: "63tva08",
    				to: "main/out",
    				as: "display"
    			},
    			{
    				from: "l6vdvtn",
    				to: "63tva08",
    				as: "children"
    			},
    			{
    				from: "q23fegi",
    				to: "63tva08",
    				as: "dom_type"
    			},
    			{
    				from: "c2sko9c",
    				to: "l6vdvtn",
    				as: "arg1"
    			},
    			{
    				from: "pgygs2p/pgygs2p",
    				to: "l6vdvtn",
    				as: "arg0"
    			},
    			{
    				from: "l6mvkla",
    				to: "63tva08",
    				as: "props"
    			},
    			{
    				from: "o1wn5x1",
    				to: "l6mvkla",
    				as: "class"
    			},
    			{
    				from: "zz730do",
    				to: "o1wn5x1",
    				as: "result"
    			},
    			{
    				from: "ukbdszl",
    				to: "l6vdvtn",
    				as: "arg2"
    			},
    			{
    				from: "un5cq1q",
    				to: "ukbdszl",
    				as: "dom_type"
    			},
    			{
    				from: "0alhppw",
    				to: "ukbdszl",
    				as: "children"
    			},
    			{
    				from: "g82nw07",
    				to: "0alhppw",
    				as: "arg1"
    			},
    			{
    				from: "pgygs2p/vdyskp6",
    				to: "pgygs2p/pgygs2p",
    				as: "dom_type"
    			},
    			{
    				from: "pgygs2p/1tf3vvf",
    				to: "pgygs2p/pgygs2p",
    				as: "children"
    			},
    			{
    				from: "pgygs2p/6yewnx1",
    				to: "pgygs2p/1tf3vvf",
    				as: "arg0"
    			},
    			{
    				from: "pgygs2p/02951w8",
    				to: "pgygs2p/6yewnx1",
    				as: "text"
    			},
    			{
    				from: "tznmg79",
    				to: "main/out",
    				as: "state"
    			},
    			{
    				from: "lptd9k3",
    				to: "tznmg79",
    				as: "target"
    			},
    			{
    				from: "4ilqcxt",
    				to: "tznmg79",
    				as: "path"
    			},
    			{
    				from: "xev2phu",
    				to: "main/out",
    				as: "prev"
    			},
    			{
    				from: "00ahbis",
    				to: "g82nw07",
    				as: "text"
    			},
    			{
    				from: "gbh28eu",
    				to: "tznmg79",
    				as: "value"
    			},
    			{
    				from: "wegu4xm",
    				to: "gbh28eu",
    				as: "runcount"
    			},
    			{
    				from: "wh4juqx",
    				to: "0alhppw",
    				as: "arg0"
    			},
    			{
    				from: "edqfgkn",
    				to: "wh4juqx",
    				as: "text"
    			},
    			{
    				from: "2t4s9uj",
    				to: "ukbdszl",
    				as: "props"
    			},
    			{
    				from: "j630j9a",
    				to: "2t4s9uj",
    				as: "class"
    			}
    		]
    	},
    	{
    		edges: [
    			{
    				from: "main/in",
    				to: "main/out",
    				as: "args",
    				type: "ref"
    			},
    			{
    				from: "63tva08",
    				to: "main/out",
    				as: "display"
    			},
    			{
    				from: "l6vdvtn",
    				to: "63tva08",
    				as: "children"
    			},
    			{
    				from: "q23fegi",
    				to: "63tva08",
    				as: "dom_type"
    			},
    			{
    				from: "c2sko9c",
    				to: "l6vdvtn",
    				as: "arg1"
    			},
    			{
    				from: "pgygs2p/pgygs2p",
    				to: "l6vdvtn",
    				as: "arg0"
    			},
    			{
    				from: "l6mvkla",
    				to: "63tva08",
    				as: "props"
    			},
    			{
    				from: "o1wn5x1",
    				to: "l6mvkla",
    				as: "class"
    			},
    			{
    				from: "zz730do",
    				to: "o1wn5x1",
    				as: "result"
    			},
    			{
    				from: "pgygs2p/vdyskp6",
    				to: "pgygs2p/pgygs2p",
    				as: "dom_type"
    			},
    			{
    				from: "pgygs2p/1tf3vvf",
    				to: "pgygs2p/pgygs2p",
    				as: "children"
    			},
    			{
    				from: "pgygs2p/6yewnx1",
    				to: "pgygs2p/1tf3vvf",
    				as: "arg0"
    			},
    			{
    				from: "pgygs2p/02951w8",
    				to: "pgygs2p/6yewnx1",
    				as: "text"
    			},
    			{
    				from: "get",
    				to: "object"
    			},
    			{
    				from: "set",
    				to: "object"
    			},
    			{
    				from: "delete",
    				to: "object"
    			},
    			{
    				from: "switch",
    				to: "flow"
    			},
    			{
    				from: "if",
    				to: "flow"
    			},
    			{
    				from: "html_element",
    				to: "hyperapp"
    			},
    			{
    				from: "html_element",
    				to: "hyperapp"
    			},
    			{
    				from: "new_array",
    				to: "array"
    			},
    			{
    				from: "filter",
    				to: "array"
    			},
    			{
    				from: "log",
    				to: "utility"
    			},
    			{
    				from: "execute_graph",
    				to: "utility"
    			},
    			{
    				from: "arg",
    				to: "utility"
    			},
    			{
    				from: "partial",
    				to: "utility"
    			},
    			{
    				from: "apply",
    				to: "utility"
    			},
    			{
    				from: "fetch",
    				to: "utility"
    			}
    		],
    		nodes: [
    			{
    				id: "main/out",
    				args: [
    					"value"
    				]
    			},
    			{
    				id: "main/in"
    			},
    			{
    				id: "63tva08",
    				ref: "html_element",
    				name: "main display"
    			},
    			{
    				id: "l6vdvtn",
    				ref: "new_array",
    				name: "display elements"
    			},
    			{
    				id: "q23fegi",
    				value: "div"
    			},
    			{
    				id: "l6mvkla",
    				name: "props"
    			},
    			{
    				id: "o1wn5x1",
    				name: "class"
    			},
    			{
    				id: "zz730do",
    				value: "true"
    			},
    			{
    				id: "c2sko9c",
    				name: "hello world text",
    				out: "c2sko9c",
    				nodes: [
    					{
    						id: "c2sko9c",
    						ref: "html_element",
    						name: "hello world text"
    					},
    					{
    						id: "2lr3ihi",
    						value: "Hello, world!"
    					}
    				],
    				edges: [
    					{
    						from: "2lr3ihi",
    						to: "c2sko9c",
    						as: "text"
    					}
    				]
    			},
    			{
    				id: "pgygs2p/pgygs2p",
    				ref: "html_element",
    				name: "styles/out"
    			},
    			{
    				id: "pgygs2p/vdyskp6",
    				value: "style",
    				name: ""
    			},
    			{
    				id: "pgygs2p/1tf3vvf",
    				ref: "new_array",
    				name: "styles/1tf3vvf"
    			},
    			{
    				id: "pgygs2p/6yewnx1",
    				ref: "html_element",
    				name: "styles/6yewnx1"
    			},
    			{
    				id: "pgygs2p/02951w8",
    				value: ".result { position: absolute; bottom: 0; left: 0; font-size: 4em}\n.run-count { font-size: .5em; color: green}",
    				name: "css styles"
    			},
    			{
    				id: "array"
    			},
    			{
    				id: "utility"
    			},
    			{
    				id: "flow"
    			},
    			{
    				id: "hyperapp"
    			},
    			{
    				id: "object"
    			},
    			{
    				id: "log",
    				args: [
    					"value"
    				],
    				nodes: [
    					{
    						id: "in"
    					},
    					{
    						id: "value",
    						ref: "arg",
    						value: "value"
    					},
    					{
    						id: "out",
    						args: [
    						],
    						script: "console.log(_node.id); console.log(value); return value"
    					}
    				],
    				edges: [
    					{
    						from: "in",
    						to: "out",
    						as: "input"
    					},
    					{
    						from: "value",
    						to: "out",
    						as: "value"
    					}
    				]
    			},
    			{
    				id: "fetch",
    				name: "fetch",
    				extern: "utility.fetch"
    			},
    			{
    				id: "filter",
    				name: "filter",
    				"in": "74n1jfm",
    				out: "lahq5z4",
    				nodes: [
    					{
    						id: "lahq5z4",
    						args: [
    						],
    						name: "filter/out",
    						script: "const filter_fn = _lib.no.executeGraphNode({graph: _graph})(fn); return arr.filter(filter_fn)"
    					},
    					{
    						id: "pfoypo5",
    						args: [
    						],
    						ref: "arg",
    						value: "key"
    					},
    					{
    						id: "zinx621",
    						args: [
    						],
    						ref: "arg",
    						value: "value"
    					},
    					{
    						id: "x2sz5kb",
    						args: [
    						],
    						ref: "arg",
    						value: "arr"
    					},
    					{
    						id: "fn",
    						ref: "arg",
    						value: "fn"
    					},
    					{
    						id: "74n1jfm",
    						args: [
    						],
    						name: "filter/in"
    					}
    				],
    				edges: [
    					{
    						from: "pfoypo5",
    						to: "lahq5z4",
    						as: "key"
    					},
    					{
    						from: "zinx621",
    						to: "lahq5z4",
    						as: "value"
    					},
    					{
    						from: "x2sz5kb",
    						to: "lahq5z4",
    						as: "arr"
    					},
    					{
    						from: "74n1jfm",
    						to: "lahq5z4",
    						as: "input"
    					},
    					{
    						from: "fn",
    						to: "lahq5z4",
    						as: "fn"
    					}
    				]
    			},
    			{
    				id: "switch",
    				args: [
    					"data",
    					"input"
    				],
    				nodes: [
    					{
    						id: "in"
    					},
    					{
    						id: "out",
    						args: [
    							"data",
    							"input"
    						],
    						script: "return data[input];"
    					},
    					{
    						id: "input",
    						ref: "arg",
    						value: "input"
    					}
    				],
    				edges: [
    					{
    						from: "in",
    						to: "out",
    						as: "data"
    					},
    					{
    						from: "input",
    						to: "out",
    						as: "input"
    					}
    				]
    			},
    			{
    				id: "if",
    				nodes: [
    					{
    						id: "in"
    					},
    					{
    						id: "pred",
    						ref: "arg",
    						value: "pred"
    					},
    					{
    						id: "out",
    						script: "return pred ? data['true'] : data['false']"
    					}
    				],
    				edges: [
    					{
    						from: "in",
    						to: "out",
    						as: "data"
    					},
    					{
    						from: "pred",
    						to: "out",
    						as: "pred"
    					}
    				]
    			},
    			{
    				id: "execute_graph",
    				nodes: [
    					{
    						id: "in"
    					},
    					{
    						id: "fn",
    						ref: "arg",
    						value: "fn"
    					},
    					{
    						id: "graph",
    						ref: "arg",
    						value: "graph"
    					},
    					{
    						id: "out",
    						script: "return (...args) => {res = _lib.no.executeGraphNode({graph})(fn)(args.length === 1 ? args[0] : args); return res;}"
    					}
    				],
    				edges: [
    					{
    						from: "in",
    						to: "out",
    						as: "args"
    					},
    					{
    						from: "fn",
    						to: "out",
    						as: "fn"
    					},
    					{
    						from: "graph",
    						to: "out",
    						as: "graph"
    					}
    				]
    			},
    			{
    				id: "apply",
    				script: "return _lib.no.executeGraphNode({graph: _graph})(fn)(args);"
    			},
    			{
    				id: "partial",
    				nodes: [
    					{
    						id: "in"
    					},
    					{
    						id: "input_value",
    						ref: "arg",
    						value: "_args"
    					},
    					{
    						id: "fn",
    						ref: "arg",
    						value: "fn"
    					},
    					{
    						id: "args",
    						ref: "arg",
    						value: "args"
    					},
    					{
    						id: "out",
    						script: "return _lib.no.executeGraphNode({graph: _graph})(fn)(Object.assign({}, _args, args))"
    					}
    				],
    				edges: [
    					{
    						from: "in",
    						to: "out",
    						as: "args",
    						type: "ref"
    					},
    					{
    						from: "fn",
    						to: "out",
    						as: "fn"
    					},
    					{
    						from: "args",
    						to: "out",
    						as: "args"
    					},
    					{
    						from: "input_value",
    						to: "out",
    						as: "_args"
    					}
    				]
    			},
    			{
    				id: "new_array",
    				name: "new_array",
    				extern: "utility.new_array"
    			},
    			{
    				id: "get",
    				args: [
    					"target",
    					"path"
    				],
    				nodes: [
    					{
    						id: "in"
    					},
    					{
    						id: "def",
    						ref: "arg",
    						value: "def"
    					},
    					{
    						id: "target",
    						ref: "arg",
    						value: "target"
    					},
    					{
    						id: "path",
    						ref: "arg",
    						value: "path"
    					},
    					{
    						id: "fill_default",
    						args: [
    							"input"
    						],
    						script: "return input?.default ??  null"
    					},
    					{
    						id: "get_args",
    						ref: "new_array"
    					},
    					{
    						id: "out",
    						extern: "just.get"
    					}
    				],
    				edges: [
    					{
    						from: "in",
    						to: "out",
    						as: "input"
    					},
    					{
    						from: "def",
    						to: "out",
    						as: "def"
    					},
    					{
    						from: "path",
    						to: "out",
    						as: "path"
    					},
    					{
    						from: "target",
    						to: "out",
    						as: "target"
    					},
    					{
    						from: "get_args",
    						to: "_out",
    						as: "args"
    					}
    				]
    			},
    			{
    				id: "arg",
    				args: [
    					"node_inputs"
    				],
    				extern: "utility.arg"
    			},
    			{
    				id: "set",
    				type: "(target: any, value: any, path: string) => any",
    				script: "const keys = path.split('.'); const check = (o, v, k) => k.length === 1 ? {...o, [k[0]]: v, _needsresolve: true} : o.hasOwnProperty(k[0]) ? {...o, [k[0]]: check(o[k[0]], v, k.slice(1)), _needsresolve: true} : o; return check(target, value, keys)"
    			},
    			{
    				id: "delete",
    				out: "out",
    				nodes: [
    					{
    						id: "in"
    					},
    					{
    						id: "target",
    						ref: "arg",
    						value: "target"
    					},
    					{
    						id: "path",
    						ref: "arg",
    						value: "path"
    					},
    					{
    						id: "out",
    						script: "const new_val = Object.assign({}, target); delete target[path]; return new_val"
    					}
    				],
    				edges: [
    					{
    						from: "in",
    						to: "out",
    						as: "args"
    					},
    					{
    						from: "target",
    						to: "out",
    						as: "target"
    					},
    					{
    						from: "path",
    						to: "out",
    						as: "path"
    					}
    				]
    			},
    			{
    				id: "html_element",
    				args: [
    					"children",
    					"props",
    					"dom_type"
    				],
    				nodes: [
    					{
    						id: "in"
    					},
    					{
    						id: "fill_children",
    						args: [
    							"children"
    						],
    						script: "return children === undefined ? [] : children.length !== undefined ? children.filter(c => !!c).map(c => c.el ?? c) : [children.el ?? children]"
    					},
    					{
    						id: "fill_props",
    						args: [
    							"input"
    						],
    						script: "return input.props ?? {}"
    					},
    					{
    						id: "dom_type",
    						ref: "arg",
    						value: "dom_type"
    					},
    					{
    						id: "out",
    						script: "(children ?? []).forEach(c => {if(!((c.hasOwnProperty('dom_type') && c.hasOwnProperty('props')) || c.hasOwnProperty('text'))){throw new Error('invalid child element');}}); return {el: {dom_type, props, children}}"
    					},
    					{
    						id: "_out"
    					}
    				],
    				edges: [
    					{
    						from: "in",
    						to: "fill_children"
    					},
    					{
    						from: "in",
    						to: "dom_type"
    					},
    					{
    						from: "in",
    						to: "fill_props",
    						as: "input"
    					},
    					{
    						from: "fill_children",
    						to: "out",
    						as: "children",
    						order: 1
    					},
    					{
    						from: "fill_props",
    						to: "out",
    						as: "props",
    						type: "resolve"
    					},
    					{
    						from: "dom_type",
    						to: "out",
    						as: "dom_type"
    					}
    				]
    			},
    			{
    				id: "html_element",
    				nodes: [
    					{
    						id: "in"
    					},
    					{
    						id: "text",
    						ref: "arg",
    						value: "text"
    					},
    					{
    						id: "dom_type",
    						value: "text_value"
    					},
    					{
    						id: "el"
    					},
    					{
    						id: "out",
    						args: [
    							"text"
    						]
    					}
    				],
    				edges: [
    					{
    						from: "in",
    						to: "out",
    						as: "input"
    					},
    					{
    						from: "dom_type",
    						to: "el",
    						as: "dom_type"
    					},
    					{
    						from: "text",
    						to: "el",
    						as: "text"
    					},
    					{
    						from: "el",
    						to: "out",
    						as: "el",
    						type: "resolve"
    					}
    				]
    			}
    		],
    		id: "simple_html_hyperapp",
    		out: "main/out",
    		"in": "main/in"
    	},
    	{
    		"in": "main/in",
    		out: "main/out",
    		id: "promises",
    		nodes: [
    			{
    				id: "main/out",
    				args: [
    					"value"
    				]
    			},
    			{
    				id: "main/in"
    			},
    			{
    				id: "63tva08",
    				ref: "html_element",
    				name: "main display"
    			},
    			{
    				id: "q23fegi",
    				value: "div"
    			},
    			{
    				id: "l6mvkla",
    				name: "props"
    			},
    			{
    				id: "o1wn5x1",
    				name: "class"
    			},
    			{
    				id: "zz730do",
    				value: "true"
    			},
    			{
    				ref: "arg",
    				id: "xev2phu",
    				value: "state"
    			},
    			{
    				id: "el0app0",
    				name: "state"
    			},
    			{
    				id: "2gcjbds",
    				ref: "get"
    			},
    			{
    				id: "f6js4lo",
    				script: "return res.then(r => r.json())"
    			},
    			{
    				id: "91dm5vd",
    				value: "data.0.content"
    			},
    			{
    				id: "m9yeyqc",
    				ref: "fetch"
    			},
    			{
    				id: "fphsciu",
    				value: "https://fakerapi.it/api/v1/texts"
    			},
    			{
    				id: "0iscsvl",
    				ref: "switch",
    				name: "fetch if needed"
    			},
    			{
    				id: "gcg2ctk",
    				script: "return runcount === undefined ? 'fetch' : 'state'"
    			},
    			{
    				ref: "arg",
    				id: "sgnxbrn",
    				value: "state.runcount"
    			},
    			{
    				ref: "arg",
    				id: "b77sv21",
    				value: "state.runcount"
    			},
    			{
    				id: "array"
    			},
    			{
    				id: "utility"
    			},
    			{
    				id: "flow"
    			},
    			{
    				id: "hyperapp"
    			},
    			{
    				id: "object"
    			},
    			{
    				id: "log",
    				args: [
    					"value"
    				],
    				nodes: [
    					{
    						id: "in"
    					},
    					{
    						id: "value",
    						ref: "arg",
    						value: "value"
    					},
    					{
    						id: "out",
    						args: [
    						],
    						script: "console.log(_node.id); console.log(value); return value"
    					}
    				],
    				edges: [
    					{
    						from: "in",
    						to: "out",
    						as: "input"
    					},
    					{
    						from: "value",
    						to: "out",
    						as: "value"
    					}
    				]
    			},
    			{
    				id: "fetch",
    				name: "fetch",
    				extern: "utility.fetch"
    			},
    			{
    				id: "filter",
    				name: "filter",
    				"in": "74n1jfm",
    				out: "lahq5z4",
    				nodes: [
    					{
    						id: "lahq5z4",
    						args: [
    						],
    						name: "filter/out",
    						script: "const filter_fn = _lib.no.executeGraphNode({graph: _graph})(fn); return arr.filter(filter_fn)"
    					},
    					{
    						id: "pfoypo5",
    						args: [
    						],
    						ref: "arg",
    						value: "key"
    					},
    					{
    						id: "zinx621",
    						args: [
    						],
    						ref: "arg",
    						value: "value"
    					},
    					{
    						id: "x2sz5kb",
    						args: [
    						],
    						ref: "arg",
    						value: "arr"
    					},
    					{
    						id: "fn",
    						ref: "arg",
    						value: "fn"
    					},
    					{
    						id: "74n1jfm",
    						args: [
    						],
    						name: "filter/in"
    					}
    				],
    				edges: [
    					{
    						from: "pfoypo5",
    						to: "lahq5z4",
    						as: "key"
    					},
    					{
    						from: "zinx621",
    						to: "lahq5z4",
    						as: "value"
    					},
    					{
    						from: "x2sz5kb",
    						to: "lahq5z4",
    						as: "arr"
    					},
    					{
    						from: "74n1jfm",
    						to: "lahq5z4",
    						as: "input"
    					},
    					{
    						from: "fn",
    						to: "lahq5z4",
    						as: "fn"
    					}
    				]
    			},
    			{
    				id: "switch",
    				args: [
    					"data",
    					"input"
    				],
    				nodes: [
    					{
    						id: "in"
    					},
    					{
    						id: "out",
    						args: [
    							"data",
    							"input"
    						],
    						script: "return data[input];"
    					},
    					{
    						id: "input",
    						ref: "arg",
    						value: "input"
    					}
    				],
    				edges: [
    					{
    						from: "in",
    						to: "out",
    						as: "data"
    					},
    					{
    						from: "input",
    						to: "out",
    						as: "input"
    					}
    				]
    			},
    			{
    				id: "if",
    				nodes: [
    					{
    						id: "in"
    					},
    					{
    						id: "pred",
    						ref: "arg",
    						value: "pred"
    					},
    					{
    						id: "out",
    						script: "return pred ? data['true'] : data['false']"
    					}
    				],
    				edges: [
    					{
    						from: "in",
    						to: "out",
    						as: "data"
    					},
    					{
    						from: "pred",
    						to: "out",
    						as: "pred"
    					}
    				]
    			},
    			{
    				id: "execute_graph",
    				nodes: [
    					{
    						id: "in"
    					},
    					{
    						id: "fn",
    						ref: "arg",
    						value: "fn"
    					},
    					{
    						id: "graph",
    						ref: "arg",
    						value: "graph"
    					},
    					{
    						id: "out",
    						script: "return (...args) => {res = _lib.no.executeGraphNode({graph})(fn)(args.length === 1 ? args[0] : args); return res;}"
    					}
    				],
    				edges: [
    					{
    						from: "in",
    						to: "out",
    						as: "args"
    					},
    					{
    						from: "fn",
    						to: "out",
    						as: "fn"
    					},
    					{
    						from: "graph",
    						to: "out",
    						as: "graph"
    					}
    				]
    			},
    			{
    				id: "apply",
    				script: "return _lib.no.executeGraphNode({graph: _graph})(fn)(args);"
    			},
    			{
    				id: "partial",
    				nodes: [
    					{
    						id: "in"
    					},
    					{
    						id: "input_value",
    						ref: "arg",
    						value: "_args"
    					},
    					{
    						id: "fn",
    						ref: "arg",
    						value: "fn"
    					},
    					{
    						id: "args",
    						ref: "arg",
    						value: "args"
    					},
    					{
    						id: "out",
    						script: "return _lib.no.executeGraphNode({graph: _graph})(fn)(Object.assign({}, _args, args))"
    					}
    				],
    				edges: [
    					{
    						from: "in",
    						to: "out",
    						as: "args",
    						type: "ref"
    					},
    					{
    						from: "fn",
    						to: "out",
    						as: "fn"
    					},
    					{
    						from: "args",
    						to: "out",
    						as: "args"
    					},
    					{
    						from: "input_value",
    						to: "out",
    						as: "_args"
    					}
    				]
    			},
    			{
    				id: "new_array",
    				name: "new_array",
    				extern: "utility.new_array"
    			},
    			{
    				id: "get",
    				args: [
    					"target",
    					"path"
    				],
    				nodes: [
    					{
    						id: "in"
    					},
    					{
    						id: "def",
    						ref: "arg",
    						value: "def"
    					},
    					{
    						id: "target",
    						ref: "arg",
    						value: "target"
    					},
    					{
    						id: "path",
    						ref: "arg",
    						value: "path"
    					},
    					{
    						id: "fill_default",
    						args: [
    							"input"
    						],
    						script: "return input?.default ??  null"
    					},
    					{
    						id: "get_args",
    						ref: "new_array"
    					},
    					{
    						id: "out",
    						extern: "just.get"
    					}
    				],
    				edges: [
    					{
    						from: "in",
    						to: "out",
    						as: "input"
    					},
    					{
    						from: "def",
    						to: "out",
    						as: "def"
    					},
    					{
    						from: "path",
    						to: "out",
    						as: "path"
    					},
    					{
    						from: "target",
    						to: "out",
    						as: "target"
    					},
    					{
    						from: "get_args",
    						to: "_out",
    						as: "args"
    					}
    				]
    			},
    			{
    				id: "arg",
    				args: [
    					"node_inputs"
    				],
    				extern: "utility.arg"
    			},
    			{
    				id: "set",
    				type: "(target: any, value: any, path: string) => any",
    				script: "const keys = path.split('.'); const check = (o, v, k) => k.length === 1 ? {...o, [k[0]]: v, _needsresolve: true} : o.hasOwnProperty(k[0]) ? {...o, [k[0]]: check(o[k[0]], v, k.slice(1)), _needsresolve: true} : o; return check(target, value, keys)"
    			},
    			{
    				id: "delete",
    				out: "out",
    				nodes: [
    					{
    						id: "in"
    					},
    					{
    						id: "target",
    						ref: "arg",
    						value: "target"
    					},
    					{
    						id: "path",
    						ref: "arg",
    						value: "path"
    					},
    					{
    						id: "out",
    						script: "const new_val = Object.assign({}, target); delete target[path]; return new_val"
    					}
    				],
    				edges: [
    					{
    						from: "in",
    						to: "out",
    						as: "args"
    					},
    					{
    						from: "target",
    						to: "out",
    						as: "target"
    					},
    					{
    						from: "path",
    						to: "out",
    						as: "path"
    					}
    				]
    			},
    			{
    				id: "html_element",
    				args: [
    					"children",
    					"props",
    					"dom_type"
    				],
    				nodes: [
    					{
    						id: "in"
    					},
    					{
    						id: "fill_children",
    						args: [
    							"children"
    						],
    						script: "return children === undefined ? [] : children.length !== undefined ? children.filter(c => !!c).map(c => c.el ?? c) : [children.el ?? children]"
    					},
    					{
    						id: "fill_props",
    						args: [
    							"input"
    						],
    						script: "return input.props ?? {}"
    					},
    					{
    						id: "dom_type",
    						ref: "arg",
    						value: "dom_type"
    					},
    					{
    						id: "out",
    						script: "(children ?? []).forEach(c => {if(!((c.hasOwnProperty('dom_type') && c.hasOwnProperty('props')) || c.hasOwnProperty('text'))){throw new Error('invalid child element');}}); return {el: {dom_type, props, children}}"
    					},
    					{
    						id: "_out"
    					}
    				],
    				edges: [
    					{
    						from: "in",
    						to: "fill_children"
    					},
    					{
    						from: "in",
    						to: "dom_type"
    					},
    					{
    						from: "in",
    						to: "fill_props",
    						as: "input"
    					},
    					{
    						from: "fill_children",
    						to: "out",
    						as: "children",
    						order: 1
    					},
    					{
    						from: "fill_props",
    						to: "out",
    						as: "props",
    						type: "resolve"
    					},
    					{
    						from: "dom_type",
    						to: "out",
    						as: "dom_type"
    					}
    				]
    			},
    			{
    				id: "html_element",
    				nodes: [
    					{
    						id: "in"
    					},
    					{
    						id: "text",
    						ref: "arg",
    						value: "text"
    					},
    					{
    						id: "dom_type",
    						value: "text_value"
    					},
    					{
    						id: "el"
    					},
    					{
    						id: "out",
    						args: [
    							"text"
    						]
    					}
    				],
    				edges: [
    					{
    						from: "in",
    						to: "out",
    						as: "input"
    					},
    					{
    						from: "dom_type",
    						to: "el",
    						as: "dom_type"
    					},
    					{
    						from: "text",
    						to: "el",
    						as: "text"
    					},
    					{
    						from: "el",
    						to: "out",
    						as: "el",
    						type: "resolve"
    					}
    				]
    			},
    			{
    				id: "l6vdvtn",
    				name: "display elements",
    				out: "l6vdvtn",
    				nodes: [
    					{
    						id: "l6vdvtn",
    						ref: "new_array",
    						name: "display elements"
    					},
    					{
    						id: "c2sko9c",
    						name: "hello world text",
    						out: "c2sko9c",
    						nodes: [
    							{
    								id: "c2sko9c",
    								ref: "html_element",
    								name: "hello world text"
    							},
    							{
    								id: "2lr3ihi",
    								value: "Hello, world!"
    							}
    						],
    						edges: [
    							{
    								from: "2lr3ihi",
    								to: "c2sko9c",
    								as: "text"
    							}
    						]
    					},
    					{
    						id: "pgygs2p/pgygs2p",
    						ref: "html_element",
    						name: "styles/out"
    					},
    					{
    						id: "ukbdszl",
    						ref: "html_element",
    						name: "display text"
    					},
    					{
    						id: "pgygs2p/vdyskp6",
    						value: "style",
    						name: ""
    					},
    					{
    						id: "pgygs2p/1tf3vvf",
    						ref: "new_array",
    						name: "styles/1tf3vvf"
    					},
    					{
    						id: "un5cq1q",
    						value: "div"
    					},
    					{
    						id: "0alhppw",
    						ref: "new_array",
    						name: "run count display"
    					},
    					{
    						id: "2t4s9uj",
    						name: "run count props"
    					},
    					{
    						id: "pgygs2p/6yewnx1",
    						ref: "html_element",
    						name: "styles/6yewnx1"
    					},
    					{
    						id: "g82nw07",
    						ref: "html_element"
    					},
    					{
    						id: "wh4juqx",
    						ref: "html_element"
    					},
    					{
    						id: "j630j9a",
    						value: "run-count"
    					},
    					{
    						id: "pgygs2p/02951w8",
    						value: ".result { position: absolute; bottom: 0; left: 0; font-size: 4em}\n.run-count { font-size: .5em; color: green}",
    						name: "css styles"
    					},
    					{
    						id: "gzr41q3",
    						ref: "log"
    					},
    					{
    						id: "edqfgkn",
    						value: "run count: "
    					},
    					{
    						ref: "arg",
    						id: "00ahbis",
    						value: "state.runcount"
    					}
    				],
    				edges: [
    					{
    						from: "c2sko9c",
    						to: "l6vdvtn",
    						as: "arg1"
    					},
    					{
    						from: "pgygs2p/pgygs2p",
    						to: "l6vdvtn",
    						as: "arg0"
    					},
    					{
    						from: "ukbdszl",
    						to: "l6vdvtn",
    						as: "arg2"
    					},
    					{
    						from: "pgygs2p/vdyskp6",
    						to: "pgygs2p/pgygs2p",
    						as: "dom_type"
    					},
    					{
    						from: "pgygs2p/1tf3vvf",
    						to: "pgygs2p/pgygs2p",
    						as: "children"
    					},
    					{
    						from: "un5cq1q",
    						to: "ukbdszl",
    						as: "dom_type"
    					},
    					{
    						from: "0alhppw",
    						to: "ukbdszl",
    						as: "children"
    					},
    					{
    						from: "2t4s9uj",
    						to: "ukbdszl",
    						as: "props"
    					},
    					{
    						from: "pgygs2p/6yewnx1",
    						to: "pgygs2p/1tf3vvf",
    						as: "arg0"
    					},
    					{
    						from: "g82nw07",
    						to: "0alhppw",
    						as: "arg1"
    					},
    					{
    						from: "wh4juqx",
    						to: "0alhppw",
    						as: "arg0"
    					},
    					{
    						from: "j630j9a",
    						to: "2t4s9uj",
    						as: "class"
    					},
    					{
    						from: "pgygs2p/02951w8",
    						to: "pgygs2p/6yewnx1",
    						as: "text"
    					},
    					{
    						from: "gzr41q3",
    						to: "g82nw07",
    						as: "text"
    					},
    					{
    						from: "edqfgkn",
    						to: "wh4juqx",
    						as: "text"
    					},
    					{
    						from: "00ahbis",
    						to: "gzr41q3",
    						as: "value"
    					}
    				]
    			}
    		],
    		edges: [
    			{
    				from: "main/in",
    				to: "main/out",
    				as: "args",
    				type: "ref"
    			},
    			{
    				from: "63tva08",
    				to: "main/out",
    				as: "display"
    			},
    			{
    				from: "l6vdvtn",
    				to: "63tva08",
    				as: "children"
    			},
    			{
    				from: "q23fegi",
    				to: "63tva08",
    				as: "dom_type"
    			},
    			{
    				from: "l6mvkla",
    				to: "63tva08",
    				as: "props"
    			},
    			{
    				from: "o1wn5x1",
    				to: "l6mvkla",
    				as: "class"
    			},
    			{
    				from: "zz730do",
    				to: "o1wn5x1",
    				as: "result"
    			},
    			{
    				from: "xev2phu",
    				to: "main/out",
    				as: "prev"
    			},
    			{
    				from: "el0app0",
    				to: "main/out",
    				as: "state"
    			},
    			{
    				from: "91dm5vd",
    				to: "2gcjbds",
    				as: "path"
    			},
    			{
    				from: "m9yeyqc",
    				to: "f6js4lo",
    				as: "res"
    			},
    			{
    				from: "fphsciu",
    				to: "m9yeyqc",
    				as: "url"
    			},
    			{
    				from: "f6js4lo",
    				to: "2gcjbds",
    				as: "target"
    			},
    			{
    				from: "2gcjbds",
    				to: "0iscsvl",
    				as: "fetch"
    			},
    			{
    				from: "0iscsvl",
    				to: "el0app0",
    				as: "runcount"
    			},
    			{
    				from: "gcg2ctk",
    				to: "0iscsvl",
    				as: "input"
    			},
    			{
    				from: "sgnxbrn",
    				to: "gcg2ctk",
    				as: "runcount"
    			},
    			{
    				from: "b77sv21",
    				to: "0iscsvl",
    				as: "state"
    			},
    			{
    				from: "get",
    				to: "object"
    			},
    			{
    				from: "set",
    				to: "object"
    			},
    			{
    				from: "delete",
    				to: "object"
    			},
    			{
    				from: "switch",
    				to: "flow"
    			},
    			{
    				from: "if",
    				to: "flow"
    			},
    			{
    				from: "html_element",
    				to: "hyperapp"
    			},
    			{
    				from: "html_element",
    				to: "hyperapp"
    			},
    			{
    				from: "new_array",
    				to: "array"
    			},
    			{
    				from: "filter",
    				to: "array"
    			},
    			{
    				from: "log",
    				to: "utility"
    			},
    			{
    				from: "execute_graph",
    				to: "utility"
    			},
    			{
    				from: "arg",
    				to: "utility"
    			},
    			{
    				from: "partial",
    				to: "utility"
    			},
    			{
    				from: "apply",
    				to: "utility"
    			},
    			{
    				from: "fetch",
    				to: "utility"
    			}
    		]
    	}
    ];

    var objectSafeGet = get$2;

    /*
      const obj = {a: {aa: {aaa: 2}}, b: 4};

      get(obj, 'a.aa.aaa'); // 2
      get(obj, ['a', 'aa', 'aaa']); // 2

      get(obj, 'b.bb.bbb'); // undefined
      get(obj, ['b', 'bb', 'bbb']); // undefined

      get(obj.a, 'aa.aaa'); // 2
      get(obj.a, ['aa', 'aaa']); // 2

      get(obj.b, 'bb.bbb'); // undefined
      get(obj.b, ['bb', 'bbb']); // undefined

      get(obj.b, 'bb.bbb', 42); // 42
      get(obj.b, ['bb', 'bbb'], 42); // 42

      get(null, 'a'); // undefined
      get(undefined, ['a']); // undefined

      get(null, 'a', 42); // 42
      get(undefined, ['a'], 42); // 42

      const obj = {a: {}};
      const sym = Symbol();
      obj.a[sym] = 4;
      get(obj.a, sym); // 4
    */

    function get$2(obj, propsArg, defaultValue) {
      if (!obj) {
        return defaultValue;
      }
      var props, prop;
      if (Array.isArray(propsArg)) {
        props = propsArg.slice(0);
      }
      if (typeof propsArg == 'string') {
        props = propsArg.split('.');
      }
      if (typeof propsArg == 'symbol') {
        props = [propsArg];
      }
      if (!Array.isArray(props)) {
        throw new Error('props arg must be an array, a string or a symbol');
      }
      while (props.length) {
        prop = props.shift();
        if (!obj) {
          return defaultValue;
        }
        obj = obj[prop];
        if (obj === undefined) {
          return defaultValue;
        }
      }
      return obj;
    }

    var objectSafeSet = set$1;

    /*
      var obj1 = {};
      set(obj1, 'a.aa.aaa', 4); // true
      obj1; // {a: {aa: {aaa: 4}}}

      var obj2 = {};
      set(obj2, ['a', 'aa', 'aaa'], 4); // true
      obj2; // {a: {aa: {aaa: 4}}}

      var obj3 = {a: {aa: {aaa: 2}}};
      set(obj3, 'a.aa.aaa', 3); // true
      obj3; // {a: {aa: {aaa: 3}}}

      // don't clobber existing
      var obj4 = {a: {aa: {aaa: 2}}};
      set(obj4, 'a.aa', {bbb: 7}); // false

      const obj5 = {a: {}};
      const sym = Symbol();
      set(obj5.a, sym, 7); // true
      obj5; // {a: {Symbol(): 7}}
    */

    function set$1(obj, propsArg, value) {
      var props, lastProp;
      if (Array.isArray(propsArg)) {
        props = propsArg.slice(0);
      }
      if (typeof propsArg == 'string') {
        props = propsArg.split('.');
      }
      if (typeof propsArg == 'symbol') {
        props = [propsArg];
      }
      if (!Array.isArray(props)) {
        throw new Error('props arg must be an array, a string or a symbol');
      }
      lastProp = props.pop();
      if (!lastProp) {
        return false;
      }
      prototypeCheck$1(lastProp);
      var thisProp;
      while ((thisProp = props.shift())) {
        prototypeCheck$1(thisProp);
        if (typeof obj[thisProp] == 'undefined') {
          obj[thisProp] = {};
        }
        obj = obj[thisProp];
        if (!obj || typeof obj != 'object') {
          return false;
        }
      }
      obj[lastProp] = value;
      return true;
    }

    function prototypeCheck$1(prop) {
      // coercion is intentional to catch prop values like `['__proto__']`
      if (prop == '__proto__' || prop == 'constructor' || prop == 'prototype') {
        throw new Error('setting of prototype values not supported');
      }
    }

    /*
      const obj1 = {a: 4, b: 5};
      const obj2 = {a: 3, b: 5};
      const obj3 = {a: 4, c: 5};

      diff(obj1, obj2);
      [
        { "op": "replace", "path": ['a'], "value": 3 }
      ]

      diff(obj2, obj3);
      [
        { "op": "remove", "path": ['b'] },
        { "op": "replace", "path": ['a'], "value": 4 }
        { "op": "add", "path": ['c'], "value": 5 }
      ]

      // using converter to generate jsPatch standard paths
      // see http://jsonpatch.com
      import {diff, jsonPatchPathConverter} from 'just-diff'
      diff(obj1, obj2, jsonPatchPathConverter);
      [
        { "op": "replace", "path": '/a', "value": 3 }
      ]

      diff(obj2, obj3, jsonPatchPathConverter);
      [
        { "op": "remove", "path": '/b' },
        { "op": "replace", "path": '/a', "value": 4 }
        { "op": "add", "path": '/c', "value": 5 }
      ]

      // arrays
      const obj4 = {a: 4, b: [1, 2, 3]};
      const obj5 = {a: 3, b: [1, 2, 4]};
      const obj6 = {a: 3, b: [1, 2, 4, 5]};

      diff(obj4, obj5);
      [
        { "op": "replace", "path": ['a'], "value": 3 }
        { "op": "replace", "path": ['b', 2], "value": 4 }
      ]

      diff(obj5, obj6);
      [
        { "op": "add", "path": ['b', 3], "value": 5 }
      ]

      // nested paths
      const obj7 = {a: 4, b: {c: 3}};
      const obj8 = {a: 4, b: {c: 4}};
      const obj9 = {a: 5, b: {d: 4}};

      diff(obj7, obj8);
      [
        { "op": "replace", "path": ['b', 'c'], "value": 4 }
      ]

      diff(obj8, obj9);
      [
        { "op": "replace", "path": ['a'], "value": 5 }
        { "op": "remove", "path": ['b', 'c']}
        { "op": "add", "path": ['b', 'd'], "value": 4 }
      ]
    */

    function diff(obj1, obj2, pathConverter) {
      if (!obj1 || typeof obj1 != 'object' || !obj2 || typeof obj2 != 'object') {
        throw new Error('both arguments must be objects or arrays');
      }

      pathConverter ||
        (pathConverter = function(arr) {
          return arr;
        });

      function getDiff(obj1, obj2, basePath, diffs) {
        var obj1Keys = Object.keys(obj1);
        var obj1KeysLength = obj1Keys.length;
        var obj2Keys = Object.keys(obj2);
        var obj2KeysLength = obj2Keys.length;
        var path;

        for (var i = 0; i < obj1KeysLength; i++) {
          var key = Array.isArray(obj1) ? Number(obj1Keys[i]) : obj1Keys[i];
          if (!(key in obj2)) {
            path = basePath.concat(key);
            diffs.remove.push({
              op: 'remove',
              path: pathConverter(path),
            });
          }
        }

        for (var i = 0; i < obj2KeysLength; i++) {
          var key = Array.isArray(obj2) ? Number(obj2Keys[i]) : obj2Keys[i];
          var obj1AtKey = obj1[key];
          var obj2AtKey = obj2[key];
          if (!(key in obj1)) {
            path = basePath.concat(key);
            var obj2Value = obj2[key];
            diffs.add.push({
              op: 'add',
              path: pathConverter(path),
              value: obj2Value,
            });
          } else if (obj1AtKey !== obj2AtKey) {
            if (
              Object(obj1AtKey) !== obj1AtKey ||
              Object(obj2AtKey) !== obj2AtKey
            ) {
              path = pushReplace(path, basePath, key, diffs, pathConverter, obj2);
            } else {
              if (
                !Object.keys(obj1AtKey).length &&
                !Object.keys(obj2AtKey).length &&
                String(obj1AtKey) != String(obj2AtKey)
              ) {
                path = pushReplace(path, basePath, key, diffs, pathConverter, obj2);
              } else {
                getDiff(obj1[key], obj2[key], basePath.concat(key), diffs);
              }
            }
          }
        }

        return diffs.remove.reverse().concat(diffs.replace).concat(diffs.add);
      }
      return getDiff(obj1, obj2, [], {remove: [], replace: [], add: []});
    }

    function pushReplace(path, basePath, key, diffs, pathConverter, obj2) {
      path = basePath.concat(key);
      diffs.replace.push({
        op: 'replace',
        path: pathConverter(path),
        value: obj2[key],
      });
      return path;
    }

    /*
      const obj1 = {a: 3, b: 5};
      diffApply(obj1,
        [
          { "op": "remove", "path": ['b'] },
          { "op": "replace", "path": ['a'], "value": 4 },
          { "op": "add", "path": ['c'], "value": 5 }
        ]
      );
      obj1; // {a: 4, c: 5}

      // using converter to apply jsPatch standard paths
      // see http://jsonpatch.com
      import {diff, jsonPatchPathConverter} from 'just-diff'
      const obj2 = {a: 3, b: 5};
      diffApply(obj2, [
        { "op": "remove", "path": '/b' },
        { "op": "replace", "path": '/a', "value": 4 }
        { "op": "add", "path": '/c', "value": 5 }
      ], jsonPatchPathConverter);
      obj2; // {a: 4, c: 5}

      // arrays
      const obj3 = {a: 4, b: [1, 2, 3]};
      diffApply(obj3, [
        { "op": "replace", "path": ['a'], "value": 3 }
        { "op": "replace", "path": ['b', 2], "value": 4 }
        { "op": "add", "path": ['b', 3], "value": 9 }
      ]);
      obj3; // {a: 3, b: [1, 2, 4, 9]}

      // nested paths
      const obj4 = {a: 4, b: {c: 3}};
      diffApply(obj4, [
        { "op": "replace", "path": ['a'], "value": 5 }
        { "op": "remove", "path": ['b', 'c']}
        { "op": "add", "path": ['b', 'd'], "value": 4 }
      ]);
      obj4; // {a: 5, b: {d: 4}}
    */

    var REMOVE = 'remove';
    var REPLACE = 'replace';
    var ADD = 'add';

    function diffApply(obj, diff, pathConverter) {
      if (!obj || typeof obj != 'object') {
        throw new Error('base object must be an object or an array');
      }

      if (!Array.isArray(diff)) {
        throw new Error('diff must be an array');
      }

      var diffLength = diff.length;
      for (var i = 0; i < diffLength; i++) {
        var thisDiff = diff[i];
        var subObject = obj;
        var thisOp = thisDiff.op;
        var thisPath = thisDiff.path;
        if (pathConverter) {
          thisPath = pathConverter(thisPath);
          if (!Array.isArray(thisPath)) {
            throw new Error('pathConverter must return an array');
          }
        } else {
          if (!Array.isArray(thisPath)) {
            throw new Error('diff path must be an array, consider supplying a path converter');
          }
        }
        var pathCopy = thisPath.slice();
        var lastProp = pathCopy.pop();
        prototypeCheck(lastProp);
        if (lastProp == null) {
          return false;
        }
        var thisProp;
        while (((thisProp = pathCopy.shift())) != null) {
          prototypeCheck(thisProp);
          if (!(thisProp in subObject)) {
            subObject[thisProp] = {};
          }
          subObject = subObject[thisProp];
        }
        if (thisOp === REMOVE || thisOp === REPLACE) {
          if (!subObject.hasOwnProperty(lastProp)) {
            throw new Error(['expected to find property', thisDiff.path, 'in object', obj].join(' '));
          }
        }
        if (thisOp === REMOVE) {
          Array.isArray(subObject) ? subObject.splice(lastProp, 1) : delete subObject[lastProp];
        }
        if (thisOp === REPLACE || thisOp === ADD) {
          subObject[lastProp] = thisDiff.value;
        }
      }
      return subObject;
    }

    function prototypeCheck(prop) {
      // coercion is intentional to catch prop values like `['__proto__']`
      if (prop == '__proto__' || prop == 'constructor' || prop == 'prototype') {
        throw new Error('setting of prototype values not supported');
      }
    }

    var SSR_NODE = 1;
    var TEXT_NODE = 3;
    var EMPTY_OBJ = {};
    var EMPTY_ARR = [];
    var SVG_NS = "http://www.w3.org/2000/svg";

    var id = (a) => a;
    var map = EMPTY_ARR.map;
    var isArray$1 = Array.isArray;
    var enqueue =
      typeof requestAnimationFrame !== "undefined"
        ? requestAnimationFrame
        : setTimeout;

    var createClass = (obj) => {
      var out = "";

      if (typeof obj === "string") return obj

      if (isArray$1(obj)) {
        for (var k = 0, tmp; k < obj.length; k++) {
          if ((tmp = createClass(obj[k]))) {
            out += (out && " ") + tmp;
          }
        }
      } else {
        for (var k in obj) {
          if (obj[k]) out += (out && " ") + k;
        }
      }

      return out
    };

    var shouldRestart = (a, b) => {
      for (var k in { ...a, ...b }) {
        if (typeof (isArray$1(a[k]) ? a[k][0] : a[k]) === "function") {
          b[k] = a[k];
        } else if (a[k] !== b[k]) return true
      }
    };

    var patchSubs = (oldSubs, newSubs = EMPTY_ARR, dispatch) => {
      for (
        var subs = [], i = 0, oldSub, newSub;
        i < oldSubs.length || i < newSubs.length;
        i++
      ) {
        oldSub = oldSubs[i];
        newSub = newSubs[i];

        subs.push(
          newSub && newSub !== true
            ? !oldSub ||
              newSub[0] !== oldSub[0] ||
              shouldRestart(newSub[1], oldSub[1])
              ? [
                  newSub[0],
                  newSub[1],
                  (oldSub && oldSub[2](), newSub[0](dispatch, newSub[1])),
                ]
              : oldSub
            : oldSub && oldSub[2]()
        );
      }
      return subs
    };

    var getKey = (vdom) => (vdom == null ? vdom : vdom.key);

    var patchProperty = (node, key, oldValue, newValue, listener, isSvg) => {
      if (key === "key") ; else if (key === "style") {
        for (var k in { ...oldValue, ...newValue }) {
          oldValue = newValue == null || newValue[k] == null ? "" : newValue[k];
          if (k[0] === "-") {
            node[key].setProperty(k, oldValue);
          } else {
            node[key][k] = oldValue;
          }
        }
      } else if (key[0] === "o" && key[1] === "n") {
        if (
          !((node.events || (node.events = {}))[(key = key.slice(2))] = newValue)
        ) {
          node.removeEventListener(key, listener);
        } else if (!oldValue) {
          node.addEventListener(key, listener);
        }
      } else if (!isSvg && key !== "list" && key !== "form" && key in node) {
        node[key] = newValue == null ? "" : newValue;
      } else if (
        newValue == null ||
        newValue === false ||
        (key === "class" && !(newValue = createClass(newValue)))
      ) {
        node.removeAttribute(key);
      } else {
        node.setAttribute(key, newValue);
      }
    };

    var createNode = (vdom, listener, isSvg) => {
      var props = vdom.props;
      var node =
        vdom.type === TEXT_NODE
          ? document.createTextNode(vdom.tag)
          : (isSvg = isSvg || vdom.tag === "svg")
          ? document.createElementNS(SVG_NS, vdom.tag, props.is && props)
          : document.createElement(vdom.tag, props.is && props);

      for (var k in props) {
        patchProperty(node, k, null, props[k], listener, isSvg);
      }

      for (var i = 0; i < vdom.children.length; i++) {
        node.appendChild(
          createNode(
            (vdom.children[i] = maybeVNode(vdom.children[i])),
            listener,
            isSvg
          )
        );
      }

      return (vdom.node = node)
    };

    var patch = (parent, node, oldVNode, newVNode, listener, isSvg) => {
      if (oldVNode === newVNode) ; else if (
        oldVNode != null &&
        oldVNode.type === TEXT_NODE &&
        newVNode.type === TEXT_NODE
      ) {
        if (oldVNode.tag !== newVNode.tag) node.nodeValue = newVNode.tag;
      } else if (oldVNode == null || oldVNode.tag !== newVNode.tag) {
        node = parent.insertBefore(
          createNode((newVNode = maybeVNode(newVNode)), listener, isSvg),
          node
        );
        if (oldVNode != null) {
          parent.removeChild(oldVNode.node);
        }
      } else {
        var tmpVKid;
        var oldVKid;

        var oldKey;
        var newKey;

        var oldProps = oldVNode.props;
        var newProps = newVNode.props;

        var oldVKids = oldVNode.children;
        var newVKids = newVNode.children;

        var oldHead = 0;
        var newHead = 0;
        var oldTail = oldVKids.length - 1;
        var newTail = newVKids.length - 1;

        isSvg = isSvg || newVNode.tag === "svg";

        for (var i in { ...oldProps, ...newProps }) {
          if (
            (i === "value" || i === "selected" || i === "checked"
              ? node[i]
              : oldProps[i]) !== newProps[i]
          ) {
            patchProperty(node, i, oldProps[i], newProps[i], listener, isSvg);
          }
        }

        while (newHead <= newTail && oldHead <= oldTail) {
          if (
            (oldKey = getKey(oldVKids[oldHead])) == null ||
            oldKey !== getKey(newVKids[newHead])
          ) {
            break
          }

          patch(
            node,
            oldVKids[oldHead].node,
            oldVKids[oldHead],
            (newVKids[newHead] = maybeVNode(
              newVKids[newHead++],
              oldVKids[oldHead++]
            )),
            listener,
            isSvg
          );
        }

        while (newHead <= newTail && oldHead <= oldTail) {
          if (
            (oldKey = getKey(oldVKids[oldTail])) == null ||
            oldKey !== getKey(newVKids[newTail])
          ) {
            break
          }

          patch(
            node,
            oldVKids[oldTail].node,
            oldVKids[oldTail],
            (newVKids[newTail] = maybeVNode(
              newVKids[newTail--],
              oldVKids[oldTail--]
            )),
            listener,
            isSvg
          );
        }

        if (oldHead > oldTail) {
          while (newHead <= newTail) {
            node.insertBefore(
              createNode(
                (newVKids[newHead] = maybeVNode(newVKids[newHead++])),
                listener,
                isSvg
              ),
              (oldVKid = oldVKids[oldHead]) && oldVKid.node
            );
          }
        } else if (newHead > newTail) {
          while (oldHead <= oldTail) {
            node.removeChild(oldVKids[oldHead++].node);
          }
        } else {
          for (var keyed = {}, newKeyed = {}, i = oldHead; i <= oldTail; i++) {
            if ((oldKey = oldVKids[i].key) != null) {
              keyed[oldKey] = oldVKids[i];
            }
          }

          while (newHead <= newTail) {
            oldKey = getKey((oldVKid = oldVKids[oldHead]));
            newKey = getKey(
              (newVKids[newHead] = maybeVNode(newVKids[newHead], oldVKid))
            );

            if (
              newKeyed[oldKey] ||
              (newKey != null && newKey === getKey(oldVKids[oldHead + 1]))
            ) {
              if (oldKey == null) {
                node.removeChild(oldVKid.node);
              }
              oldHead++;
              continue
            }

            if (newKey == null || oldVNode.type === SSR_NODE) {
              if (oldKey == null) {
                patch(
                  node,
                  oldVKid && oldVKid.node,
                  oldVKid,
                  newVKids[newHead],
                  listener,
                  isSvg
                );
                newHead++;
              }
              oldHead++;
            } else {
              if (oldKey === newKey) {
                patch(
                  node,
                  oldVKid.node,
                  oldVKid,
                  newVKids[newHead],
                  listener,
                  isSvg
                );
                newKeyed[newKey] = true;
                oldHead++;
              } else {
                if ((tmpVKid = keyed[newKey]) != null) {
                  patch(
                    node,
                    node.insertBefore(tmpVKid.node, oldVKid && oldVKid.node),
                    tmpVKid,
                    newVKids[newHead],
                    listener,
                    isSvg
                  );
                  newKeyed[newKey] = true;
                } else {
                  patch(
                    node,
                    oldVKid && oldVKid.node,
                    null,
                    newVKids[newHead],
                    listener,
                    isSvg
                  );
                }
              }
              newHead++;
            }
          }

          while (oldHead <= oldTail) {
            if (getKey((oldVKid = oldVKids[oldHead++])) == null) {
              node.removeChild(oldVKid.node);
            }
          }

          for (var i in keyed) {
            if (newKeyed[i] == null) {
              node.removeChild(keyed[i].node);
            }
          }
        }
      }

      return (newVNode.node = node)
    };

    var propsChanged = (a, b) => {
      for (var k in a) if (a[k] !== b[k]) return true
      for (var k in b) if (a[k] !== b[k]) return true
    };

    var maybeVNode = (newVNode, oldVNode) =>
      newVNode !== true && newVNode !== false && newVNode
        ? typeof newVNode.tag === "function"
          ? ((!oldVNode ||
              oldVNode.memo == null ||
              propsChanged(oldVNode.memo, newVNode.memo)) &&
              ((oldVNode = newVNode.tag(newVNode.memo)).memo = newVNode.memo),
            oldVNode)
          : newVNode
        : text("");

    var recycleNode = (node) =>
      node.nodeType === TEXT_NODE
        ? text(node.nodeValue, node)
        : createVNode(
            node.nodeName.toLowerCase(),
            EMPTY_OBJ,
            map.call(node.childNodes, recycleNode),
            SSR_NODE,
            node
          );

    var createVNode = (tag, props, children, type, node) => ({
      tag,
      props,
      key: props.key,
      children,
      type,
      node,
    });

    var memo = (tag, memo) => ({ tag, memo });

    var text = (value, node) =>
      createVNode(value, EMPTY_OBJ, EMPTY_ARR, TEXT_NODE, node);

    var h = (tag, props, children = EMPTY_ARR) =>
      createVNode(tag, props, isArray$1(children) ? children : [children]);

    var app = ({
      node,
      view,
      subscriptions,
      dispatch = id,
      init = EMPTY_OBJ,
    }) => {
      var vdom = node && recycleNode(node);
      var subs = [];
      var state;
      var busy;

      var update = (newState) => {
        if (state !== newState) {
          if ((state = newState) == null) dispatch = subscriptions = render = id;
          if (subscriptions) subs = patchSubs(subs, subscriptions(state), dispatch);
          if (view && !busy) enqueue(render, (busy = true));
        }
      };

      var render = () =>
        (node = patch(
          node.parentNode,
          node,
          vdom,
          (vdom = view(state)),
          listener,
          (busy = false)
        ));

      var listener = function (event) {
        dispatch(this.events[event.type], event);
      };

      return (
        (dispatch = dispatch((action, props) =>
          typeof action === "function"
            ? dispatch(action(state, props))
            : isArray$1(action)
            ? typeof action[0] === "function"
              ? dispatch(action[0], action[1])
              : action
                  .slice(1)
                  .map(
                    (fx) => fx && fx !== true && (fx[0] || fx)(dispatch, fx[1]),
                    update(action[0])
                  )
            : update(action)
        ))(init),
        dispatch
      )
    };

    function forceCenter(x, y) {
      var nodes, strength = 1;

      if (x == null) x = 0;
      if (y == null) y = 0;

      function force() {
        var i,
            n = nodes.length,
            node,
            sx = 0,
            sy = 0;

        for (i = 0; i < n; ++i) {
          node = nodes[i], sx += node.x, sy += node.y;
        }

        for (sx = (sx / n - x) * strength, sy = (sy / n - y) * strength, i = 0; i < n; ++i) {
          node = nodes[i], node.x -= sx, node.y -= sy;
        }
      }

      force.initialize = function(_) {
        nodes = _;
      };

      force.x = function(_) {
        return arguments.length ? (x = +_, force) : x;
      };

      force.y = function(_) {
        return arguments.length ? (y = +_, force) : y;
      };

      force.strength = function(_) {
        return arguments.length ? (strength = +_, force) : strength;
      };

      return force;
    }

    function tree_add(d) {
      const x = +this._x.call(null, d),
          y = +this._y.call(null, d);
      return add(this.cover(x, y), x, y, d);
    }

    function add(tree, x, y, d) {
      if (isNaN(x) || isNaN(y)) return tree; // ignore invalid points

      var parent,
          node = tree._root,
          leaf = {data: d},
          x0 = tree._x0,
          y0 = tree._y0,
          x1 = tree._x1,
          y1 = tree._y1,
          xm,
          ym,
          xp,
          yp,
          right,
          bottom,
          i,
          j;

      // If the tree is empty, initialize the root as a leaf.
      if (!node) return tree._root = leaf, tree;

      // Find the existing leaf for the new point, or add it.
      while (node.length) {
        if (right = x >= (xm = (x0 + x1) / 2)) x0 = xm; else x1 = xm;
        if (bottom = y >= (ym = (y0 + y1) / 2)) y0 = ym; else y1 = ym;
        if (parent = node, !(node = node[i = bottom << 1 | right])) return parent[i] = leaf, tree;
      }

      // Is the new point is exactly coincident with the existing point?
      xp = +tree._x.call(null, node.data);
      yp = +tree._y.call(null, node.data);
      if (x === xp && y === yp) return leaf.next = node, parent ? parent[i] = leaf : tree._root = leaf, tree;

      // Otherwise, split the leaf node until the old and new point are separated.
      do {
        parent = parent ? parent[i] = new Array(4) : tree._root = new Array(4);
        if (right = x >= (xm = (x0 + x1) / 2)) x0 = xm; else x1 = xm;
        if (bottom = y >= (ym = (y0 + y1) / 2)) y0 = ym; else y1 = ym;
      } while ((i = bottom << 1 | right) === (j = (yp >= ym) << 1 | (xp >= xm)));
      return parent[j] = node, parent[i] = leaf, tree;
    }

    function addAll(data) {
      var d, i, n = data.length,
          x,
          y,
          xz = new Array(n),
          yz = new Array(n),
          x0 = Infinity,
          y0 = Infinity,
          x1 = -Infinity,
          y1 = -Infinity;

      // Compute the points and their extent.
      for (i = 0; i < n; ++i) {
        if (isNaN(x = +this._x.call(null, d = data[i])) || isNaN(y = +this._y.call(null, d))) continue;
        xz[i] = x;
        yz[i] = y;
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        if (y > y1) y1 = y;
      }

      // If there were no (valid) points, abort.
      if (x0 > x1 || y0 > y1) return this;

      // Expand the tree to cover the new points.
      this.cover(x0, y0).cover(x1, y1);

      // Add the new points.
      for (i = 0; i < n; ++i) {
        add(this, xz[i], yz[i], data[i]);
      }

      return this;
    }

    function tree_cover(x, y) {
      if (isNaN(x = +x) || isNaN(y = +y)) return this; // ignore invalid points

      var x0 = this._x0,
          y0 = this._y0,
          x1 = this._x1,
          y1 = this._y1;

      // If the quadtree has no extent, initialize them.
      // Integer extent are necessary so that if we later double the extent,
      // the existing quadrant boundaries don’t change due to floating point error!
      if (isNaN(x0)) {
        x1 = (x0 = Math.floor(x)) + 1;
        y1 = (y0 = Math.floor(y)) + 1;
      }

      // Otherwise, double repeatedly to cover.
      else {
        var z = x1 - x0 || 1,
            node = this._root,
            parent,
            i;

        while (x0 > x || x >= x1 || y0 > y || y >= y1) {
          i = (y < y0) << 1 | (x < x0);
          parent = new Array(4), parent[i] = node, node = parent, z *= 2;
          switch (i) {
            case 0: x1 = x0 + z, y1 = y0 + z; break;
            case 1: x0 = x1 - z, y1 = y0 + z; break;
            case 2: x1 = x0 + z, y0 = y1 - z; break;
            case 3: x0 = x1 - z, y0 = y1 - z; break;
          }
        }

        if (this._root && this._root.length) this._root = node;
      }

      this._x0 = x0;
      this._y0 = y0;
      this._x1 = x1;
      this._y1 = y1;
      return this;
    }

    function tree_data() {
      var data = [];
      this.visit(function(node) {
        if (!node.length) do data.push(node.data); while (node = node.next)
      });
      return data;
    }

    function tree_extent(_) {
      return arguments.length
          ? this.cover(+_[0][0], +_[0][1]).cover(+_[1][0], +_[1][1])
          : isNaN(this._x0) ? undefined : [[this._x0, this._y0], [this._x1, this._y1]];
    }

    function Quad(node, x0, y0, x1, y1) {
      this.node = node;
      this.x0 = x0;
      this.y0 = y0;
      this.x1 = x1;
      this.y1 = y1;
    }

    function tree_find(x, y, radius) {
      var data,
          x0 = this._x0,
          y0 = this._y0,
          x1,
          y1,
          x2,
          y2,
          x3 = this._x1,
          y3 = this._y1,
          quads = [],
          node = this._root,
          q,
          i;

      if (node) quads.push(new Quad(node, x0, y0, x3, y3));
      if (radius == null) radius = Infinity;
      else {
        x0 = x - radius, y0 = y - radius;
        x3 = x + radius, y3 = y + radius;
        radius *= radius;
      }

      while (q = quads.pop()) {

        // Stop searching if this quadrant can’t contain a closer node.
        if (!(node = q.node)
            || (x1 = q.x0) > x3
            || (y1 = q.y0) > y3
            || (x2 = q.x1) < x0
            || (y2 = q.y1) < y0) continue;

        // Bisect the current quadrant.
        if (node.length) {
          var xm = (x1 + x2) / 2,
              ym = (y1 + y2) / 2;

          quads.push(
            new Quad(node[3], xm, ym, x2, y2),
            new Quad(node[2], x1, ym, xm, y2),
            new Quad(node[1], xm, y1, x2, ym),
            new Quad(node[0], x1, y1, xm, ym)
          );

          // Visit the closest quadrant first.
          if (i = (y >= ym) << 1 | (x >= xm)) {
            q = quads[quads.length - 1];
            quads[quads.length - 1] = quads[quads.length - 1 - i];
            quads[quads.length - 1 - i] = q;
          }
        }

        // Visit this point. (Visiting coincident points isn’t necessary!)
        else {
          var dx = x - +this._x.call(null, node.data),
              dy = y - +this._y.call(null, node.data),
              d2 = dx * dx + dy * dy;
          if (d2 < radius) {
            var d = Math.sqrt(radius = d2);
            x0 = x - d, y0 = y - d;
            x3 = x + d, y3 = y + d;
            data = node.data;
          }
        }
      }

      return data;
    }

    function tree_remove(d) {
      if (isNaN(x = +this._x.call(null, d)) || isNaN(y = +this._y.call(null, d))) return this; // ignore invalid points

      var parent,
          node = this._root,
          retainer,
          previous,
          next,
          x0 = this._x0,
          y0 = this._y0,
          x1 = this._x1,
          y1 = this._y1,
          x,
          y,
          xm,
          ym,
          right,
          bottom,
          i,
          j;

      // If the tree is empty, initialize the root as a leaf.
      if (!node) return this;

      // Find the leaf node for the point.
      // While descending, also retain the deepest parent with a non-removed sibling.
      if (node.length) while (true) {
        if (right = x >= (xm = (x0 + x1) / 2)) x0 = xm; else x1 = xm;
        if (bottom = y >= (ym = (y0 + y1) / 2)) y0 = ym; else y1 = ym;
        if (!(parent = node, node = node[i = bottom << 1 | right])) return this;
        if (!node.length) break;
        if (parent[(i + 1) & 3] || parent[(i + 2) & 3] || parent[(i + 3) & 3]) retainer = parent, j = i;
      }

      // Find the point to remove.
      while (node.data !== d) if (!(previous = node, node = node.next)) return this;
      if (next = node.next) delete node.next;

      // If there are multiple coincident points, remove just the point.
      if (previous) return (next ? previous.next = next : delete previous.next), this;

      // If this is the root point, remove it.
      if (!parent) return this._root = next, this;

      // Remove this leaf.
      next ? parent[i] = next : delete parent[i];

      // If the parent now contains exactly one leaf, collapse superfluous parents.
      if ((node = parent[0] || parent[1] || parent[2] || parent[3])
          && node === (parent[3] || parent[2] || parent[1] || parent[0])
          && !node.length) {
        if (retainer) retainer[j] = node;
        else this._root = node;
      }

      return this;
    }

    function removeAll(data) {
      for (var i = 0, n = data.length; i < n; ++i) this.remove(data[i]);
      return this;
    }

    function tree_root() {
      return this._root;
    }

    function tree_size() {
      var size = 0;
      this.visit(function(node) {
        if (!node.length) do ++size; while (node = node.next)
      });
      return size;
    }

    function tree_visit(callback) {
      var quads = [], q, node = this._root, child, x0, y0, x1, y1;
      if (node) quads.push(new Quad(node, this._x0, this._y0, this._x1, this._y1));
      while (q = quads.pop()) {
        if (!callback(node = q.node, x0 = q.x0, y0 = q.y0, x1 = q.x1, y1 = q.y1) && node.length) {
          var xm = (x0 + x1) / 2, ym = (y0 + y1) / 2;
          if (child = node[3]) quads.push(new Quad(child, xm, ym, x1, y1));
          if (child = node[2]) quads.push(new Quad(child, x0, ym, xm, y1));
          if (child = node[1]) quads.push(new Quad(child, xm, y0, x1, ym));
          if (child = node[0]) quads.push(new Quad(child, x0, y0, xm, ym));
        }
      }
      return this;
    }

    function tree_visitAfter(callback) {
      var quads = [], next = [], q;
      if (this._root) quads.push(new Quad(this._root, this._x0, this._y0, this._x1, this._y1));
      while (q = quads.pop()) {
        var node = q.node;
        if (node.length) {
          var child, x0 = q.x0, y0 = q.y0, x1 = q.x1, y1 = q.y1, xm = (x0 + x1) / 2, ym = (y0 + y1) / 2;
          if (child = node[0]) quads.push(new Quad(child, x0, y0, xm, ym));
          if (child = node[1]) quads.push(new Quad(child, xm, y0, x1, ym));
          if (child = node[2]) quads.push(new Quad(child, x0, ym, xm, y1));
          if (child = node[3]) quads.push(new Quad(child, xm, ym, x1, y1));
        }
        next.push(q);
      }
      while (q = next.pop()) {
        callback(q.node, q.x0, q.y0, q.x1, q.y1);
      }
      return this;
    }

    function defaultX(d) {
      return d[0];
    }

    function tree_x(_) {
      return arguments.length ? (this._x = _, this) : this._x;
    }

    function defaultY(d) {
      return d[1];
    }

    function tree_y(_) {
      return arguments.length ? (this._y = _, this) : this._y;
    }

    function quadtree(nodes, x, y) {
      var tree = new Quadtree(x == null ? defaultX : x, y == null ? defaultY : y, NaN, NaN, NaN, NaN);
      return nodes == null ? tree : tree.addAll(nodes);
    }

    function Quadtree(x, y, x0, y0, x1, y1) {
      this._x = x;
      this._y = y;
      this._x0 = x0;
      this._y0 = y0;
      this._x1 = x1;
      this._y1 = y1;
      this._root = undefined;
    }

    function leaf_copy(leaf) {
      var copy = {data: leaf.data}, next = copy;
      while (leaf = leaf.next) next = next.next = {data: leaf.data};
      return copy;
    }

    var treeProto = quadtree.prototype = Quadtree.prototype;

    treeProto.copy = function() {
      var copy = new Quadtree(this._x, this._y, this._x0, this._y0, this._x1, this._y1),
          node = this._root,
          nodes,
          child;

      if (!node) return copy;

      if (!node.length) return copy._root = leaf_copy(node), copy;

      nodes = [{source: node, target: copy._root = new Array(4)}];
      while (node = nodes.pop()) {
        for (var i = 0; i < 4; ++i) {
          if (child = node.source[i]) {
            if (child.length) nodes.push({source: child, target: node.target[i] = new Array(4)});
            else node.target[i] = leaf_copy(child);
          }
        }
      }

      return copy;
    };

    treeProto.add = tree_add;
    treeProto.addAll = addAll;
    treeProto.cover = tree_cover;
    treeProto.data = tree_data;
    treeProto.extent = tree_extent;
    treeProto.find = tree_find;
    treeProto.remove = tree_remove;
    treeProto.removeAll = removeAll;
    treeProto.root = tree_root;
    treeProto.size = tree_size;
    treeProto.visit = tree_visit;
    treeProto.visitAfter = tree_visitAfter;
    treeProto.x = tree_x;
    treeProto.y = tree_y;

    function constant(x) {
      return function() {
        return x;
      };
    }

    function jiggle(random) {
      return (random() - 0.5) * 1e-6;
    }

    function x$1(d) {
      return d.x + d.vx;
    }

    function y$1(d) {
      return d.y + d.vy;
    }

    function forceCollide(radius) {
      var nodes,
          radii,
          random,
          strength = 1,
          iterations = 1;

      if (typeof radius !== "function") radius = constant(radius == null ? 1 : +radius);

      function force() {
        var i, n = nodes.length,
            tree,
            node,
            xi,
            yi,
            ri,
            ri2;

        for (var k = 0; k < iterations; ++k) {
          tree = quadtree(nodes, x$1, y$1).visitAfter(prepare);
          for (i = 0; i < n; ++i) {
            node = nodes[i];
            ri = radii[node.index], ri2 = ri * ri;
            xi = node.x + node.vx;
            yi = node.y + node.vy;
            tree.visit(apply);
          }
        }

        function apply(quad, x0, y0, x1, y1) {
          var data = quad.data, rj = quad.r, r = ri + rj;
          if (data) {
            if (data.index > node.index) {
              var x = xi - data.x - data.vx,
                  y = yi - data.y - data.vy,
                  l = x * x + y * y;
              if (l < r * r) {
                if (x === 0) x = jiggle(random), l += x * x;
                if (y === 0) y = jiggle(random), l += y * y;
                l = (r - (l = Math.sqrt(l))) / l * strength;
                node.vx += (x *= l) * (r = (rj *= rj) / (ri2 + rj));
                node.vy += (y *= l) * r;
                data.vx -= x * (r = 1 - r);
                data.vy -= y * r;
              }
            }
            return;
          }
          return x0 > xi + r || x1 < xi - r || y0 > yi + r || y1 < yi - r;
        }
      }

      function prepare(quad) {
        if (quad.data) return quad.r = radii[quad.data.index];
        for (var i = quad.r = 0; i < 4; ++i) {
          if (quad[i] && quad[i].r > quad.r) {
            quad.r = quad[i].r;
          }
        }
      }

      function initialize() {
        if (!nodes) return;
        var i, n = nodes.length, node;
        radii = new Array(n);
        for (i = 0; i < n; ++i) node = nodes[i], radii[node.index] = +radius(node, i, nodes);
      }

      force.initialize = function(_nodes, _random) {
        nodes = _nodes;
        random = _random;
        initialize();
      };

      force.iterations = function(_) {
        return arguments.length ? (iterations = +_, force) : iterations;
      };

      force.strength = function(_) {
        return arguments.length ? (strength = +_, force) : strength;
      };

      force.radius = function(_) {
        return arguments.length ? (radius = typeof _ === "function" ? _ : constant(+_), initialize(), force) : radius;
      };

      return force;
    }

    function index(d) {
      return d.index;
    }

    function find(nodeById, nodeId) {
      var node = nodeById.get(nodeId);
      if (!node) throw new Error("node not found: " + nodeId);
      return node;
    }

    function forceLink(links) {
      var id = index,
          strength = defaultStrength,
          strengths,
          distance = constant(30),
          distances,
          nodes,
          count,
          bias,
          random,
          iterations = 1;

      if (links == null) links = [];

      function defaultStrength(link) {
        return 1 / Math.min(count[link.source.index], count[link.target.index]);
      }

      function force(alpha) {
        for (var k = 0, n = links.length; k < iterations; ++k) {
          for (var i = 0, link, source, target, x, y, l, b; i < n; ++i) {
            link = links[i], source = link.source, target = link.target;
            x = target.x + target.vx - source.x - source.vx || jiggle(random);
            y = target.y + target.vy - source.y - source.vy || jiggle(random);
            l = Math.sqrt(x * x + y * y);
            l = (l - distances[i]) / l * alpha * strengths[i];
            x *= l, y *= l;
            target.vx -= x * (b = bias[i]);
            target.vy -= y * b;
            source.vx += x * (b = 1 - b);
            source.vy += y * b;
          }
        }
      }

      function initialize() {
        if (!nodes) return;

        var i,
            n = nodes.length,
            m = links.length,
            nodeById = new Map(nodes.map((d, i) => [id(d, i, nodes), d])),
            link;

        for (i = 0, count = new Array(n); i < m; ++i) {
          link = links[i], link.index = i;
          if (typeof link.source !== "object") link.source = find(nodeById, link.source);
          if (typeof link.target !== "object") link.target = find(nodeById, link.target);
          count[link.source.index] = (count[link.source.index] || 0) + 1;
          count[link.target.index] = (count[link.target.index] || 0) + 1;
        }

        for (i = 0, bias = new Array(m); i < m; ++i) {
          link = links[i], bias[i] = count[link.source.index] / (count[link.source.index] + count[link.target.index]);
        }

        strengths = new Array(m), initializeStrength();
        distances = new Array(m), initializeDistance();
      }

      function initializeStrength() {
        if (!nodes) return;

        for (var i = 0, n = links.length; i < n; ++i) {
          strengths[i] = +strength(links[i], i, links);
        }
      }

      function initializeDistance() {
        if (!nodes) return;

        for (var i = 0, n = links.length; i < n; ++i) {
          distances[i] = +distance(links[i], i, links);
        }
      }

      force.initialize = function(_nodes, _random) {
        nodes = _nodes;
        random = _random;
        initialize();
      };

      force.links = function(_) {
        return arguments.length ? (links = _, initialize(), force) : links;
      };

      force.id = function(_) {
        return arguments.length ? (id = _, force) : id;
      };

      force.iterations = function(_) {
        return arguments.length ? (iterations = +_, force) : iterations;
      };

      force.strength = function(_) {
        return arguments.length ? (strength = typeof _ === "function" ? _ : constant(+_), initializeStrength(), force) : strength;
      };

      force.distance = function(_) {
        return arguments.length ? (distance = typeof _ === "function" ? _ : constant(+_), initializeDistance(), force) : distance;
      };

      return force;
    }

    var noop$3 = {value: () => {}};

    function dispatch() {
      for (var i = 0, n = arguments.length, _ = {}, t; i < n; ++i) {
        if (!(t = arguments[i] + "") || (t in _) || /[\s.]/.test(t)) throw new Error("illegal type: " + t);
        _[t] = [];
      }
      return new Dispatch(_);
    }

    function Dispatch(_) {
      this._ = _;
    }

    function parseTypenames(typenames, types) {
      return typenames.trim().split(/^|\s+/).map(function(t) {
        var name = "", i = t.indexOf(".");
        if (i >= 0) name = t.slice(i + 1), t = t.slice(0, i);
        if (t && !types.hasOwnProperty(t)) throw new Error("unknown type: " + t);
        return {type: t, name: name};
      });
    }

    Dispatch.prototype = dispatch.prototype = {
      constructor: Dispatch,
      on: function(typename, callback) {
        var _ = this._,
            T = parseTypenames(typename + "", _),
            t,
            i = -1,
            n = T.length;

        // If no callback was specified, return the callback of the given type and name.
        if (arguments.length < 2) {
          while (++i < n) if ((t = (typename = T[i]).type) && (t = get$1(_[t], typename.name))) return t;
          return;
        }

        // If a type was specified, set the callback for the given type and name.
        // Otherwise, if a null callback was specified, remove callbacks of the given name.
        if (callback != null && typeof callback !== "function") throw new Error("invalid callback: " + callback);
        while (++i < n) {
          if (t = (typename = T[i]).type) _[t] = set(_[t], typename.name, callback);
          else if (callback == null) for (t in _) _[t] = set(_[t], typename.name, null);
        }

        return this;
      },
      copy: function() {
        var copy = {}, _ = this._;
        for (var t in _) copy[t] = _[t].slice();
        return new Dispatch(copy);
      },
      call: function(type, that) {
        if ((n = arguments.length - 2) > 0) for (var args = new Array(n), i = 0, n, t; i < n; ++i) args[i] = arguments[i + 2];
        if (!this._.hasOwnProperty(type)) throw new Error("unknown type: " + type);
        for (t = this._[type], i = 0, n = t.length; i < n; ++i) t[i].value.apply(that, args);
      },
      apply: function(type, that, args) {
        if (!this._.hasOwnProperty(type)) throw new Error("unknown type: " + type);
        for (var t = this._[type], i = 0, n = t.length; i < n; ++i) t[i].value.apply(that, args);
      }
    };

    function get$1(type, name) {
      for (var i = 0, n = type.length, c; i < n; ++i) {
        if ((c = type[i]).name === name) {
          return c.value;
        }
      }
    }

    function set(type, name, callback) {
      for (var i = 0, n = type.length; i < n; ++i) {
        if (type[i].name === name) {
          type[i] = noop$3, type = type.slice(0, i).concat(type.slice(i + 1));
          break;
        }
      }
      if (callback != null) type.push({name: name, value: callback});
      return type;
    }

    var frame = 0, // is an animation frame pending?
        timeout = 0, // is a timeout pending?
        interval = 0, // are any timers active?
        pokeDelay = 1000, // how frequently we check for clock skew
        taskHead,
        taskTail,
        clockLast = 0,
        clockNow = 0,
        clockSkew = 0,
        clock = typeof performance === "object" && performance.now ? performance : Date,
        setFrame = typeof window === "object" && window.requestAnimationFrame ? window.requestAnimationFrame.bind(window) : function(f) { setTimeout(f, 17); };

    function now() {
      return clockNow || (setFrame(clearNow), clockNow = clock.now() + clockSkew);
    }

    function clearNow() {
      clockNow = 0;
    }

    function Timer() {
      this._call =
      this._time =
      this._next = null;
    }

    Timer.prototype = timer.prototype = {
      constructor: Timer,
      restart: function(callback, delay, time) {
        if (typeof callback !== "function") throw new TypeError("callback is not a function");
        time = (time == null ? now() : +time) + (delay == null ? 0 : +delay);
        if (!this._next && taskTail !== this) {
          if (taskTail) taskTail._next = this;
          else taskHead = this;
          taskTail = this;
        }
        this._call = callback;
        this._time = time;
        sleep();
      },
      stop: function() {
        if (this._call) {
          this._call = null;
          this._time = Infinity;
          sleep();
        }
      }
    };

    function timer(callback, delay, time) {
      var t = new Timer;
      t.restart(callback, delay, time);
      return t;
    }

    function timerFlush() {
      now(); // Get the current time, if not already set.
      ++frame; // Pretend we’ve set an alarm, if we haven’t already.
      var t = taskHead, e;
      while (t) {
        if ((e = clockNow - t._time) >= 0) t._call.call(undefined, e);
        t = t._next;
      }
      --frame;
    }

    function wake() {
      clockNow = (clockLast = clock.now()) + clockSkew;
      frame = timeout = 0;
      try {
        timerFlush();
      } finally {
        frame = 0;
        nap();
        clockNow = 0;
      }
    }

    function poke() {
      var now = clock.now(), delay = now - clockLast;
      if (delay > pokeDelay) clockSkew -= delay, clockLast = now;
    }

    function nap() {
      var t0, t1 = taskHead, t2, time = Infinity;
      while (t1) {
        if (t1._call) {
          if (time > t1._time) time = t1._time;
          t0 = t1, t1 = t1._next;
        } else {
          t2 = t1._next, t1._next = null;
          t1 = t0 ? t0._next = t2 : taskHead = t2;
        }
      }
      taskTail = t0;
      sleep(time);
    }

    function sleep(time) {
      if (frame) return; // Soonest alarm already set, or will be.
      if (timeout) timeout = clearTimeout(timeout);
      var delay = time - clockNow; // Strictly less than if we recomputed clockNow.
      if (delay > 24) {
        if (time < Infinity) timeout = setTimeout(wake, time - clock.now() - clockSkew);
        if (interval) interval = clearInterval(interval);
      } else {
        if (!interval) clockLast = clock.now(), interval = setInterval(poke, pokeDelay);
        frame = 1, setFrame(wake);
      }
    }

    // https://en.wikipedia.org/wiki/Linear_congruential_generator#Parameters_in_common_use
    const a = 1664525;
    const c = 1013904223;
    const m = 4294967296; // 2^32

    function lcg() {
      let s = 1;
      return () => (s = (a * s + c) % m) / m;
    }

    function x(d) {
      return d.x;
    }

    function y(d) {
      return d.y;
    }

    var initialRadius = 10,
        initialAngle = Math.PI * (3 - Math.sqrt(5));

    function forceSimulation(nodes) {
      var simulation,
          alpha = 1,
          alphaMin = 0.001,
          alphaDecay = 1 - Math.pow(alphaMin, 1 / 300),
          alphaTarget = 0,
          velocityDecay = 0.6,
          forces = new Map(),
          stepper = timer(step),
          event = dispatch("tick", "end"),
          random = lcg();

      if (nodes == null) nodes = [];

      function step() {
        tick();
        event.call("tick", simulation);
        if (alpha < alphaMin) {
          stepper.stop();
          event.call("end", simulation);
        }
      }

      function tick(iterations) {
        var i, n = nodes.length, node;

        if (iterations === undefined) iterations = 1;

        for (var k = 0; k < iterations; ++k) {
          alpha += (alphaTarget - alpha) * alphaDecay;

          forces.forEach(function(force) {
            force(alpha);
          });

          for (i = 0; i < n; ++i) {
            node = nodes[i];
            if (node.fx == null) node.x += node.vx *= velocityDecay;
            else node.x = node.fx, node.vx = 0;
            if (node.fy == null) node.y += node.vy *= velocityDecay;
            else node.y = node.fy, node.vy = 0;
          }
        }

        return simulation;
      }

      function initializeNodes() {
        for (var i = 0, n = nodes.length, node; i < n; ++i) {
          node = nodes[i], node.index = i;
          if (node.fx != null) node.x = node.fx;
          if (node.fy != null) node.y = node.fy;
          if (isNaN(node.x) || isNaN(node.y)) {
            var radius = initialRadius * Math.sqrt(0.5 + i), angle = i * initialAngle;
            node.x = radius * Math.cos(angle);
            node.y = radius * Math.sin(angle);
          }
          if (isNaN(node.vx) || isNaN(node.vy)) {
            node.vx = node.vy = 0;
          }
        }
      }

      function initializeForce(force) {
        if (force.initialize) force.initialize(nodes, random);
        return force;
      }

      initializeNodes();

      return simulation = {
        tick: tick,

        restart: function() {
          return stepper.restart(step), simulation;
        },

        stop: function() {
          return stepper.stop(), simulation;
        },

        nodes: function(_) {
          return arguments.length ? (nodes = _, initializeNodes(), forces.forEach(initializeForce), simulation) : nodes;
        },

        alpha: function(_) {
          return arguments.length ? (alpha = +_, simulation) : alpha;
        },

        alphaMin: function(_) {
          return arguments.length ? (alphaMin = +_, simulation) : alphaMin;
        },

        alphaDecay: function(_) {
          return arguments.length ? (alphaDecay = +_, simulation) : +alphaDecay;
        },

        alphaTarget: function(_) {
          return arguments.length ? (alphaTarget = +_, simulation) : alphaTarget;
        },

        velocityDecay: function(_) {
          return arguments.length ? (velocityDecay = 1 - _, simulation) : 1 - velocityDecay;
        },

        randomSource: function(_) {
          return arguments.length ? (random = _, forces.forEach(initializeForce), simulation) : random;
        },

        force: function(name, _) {
          return arguments.length > 1 ? ((_ == null ? forces.delete(name) : forces.set(name, initializeForce(_))), simulation) : forces.get(name);
        },

        find: function(x, y, radius) {
          var i = 0,
              n = nodes.length,
              dx,
              dy,
              d2,
              node,
              closest;

          if (radius == null) radius = Infinity;
          else radius *= radius;

          for (i = 0; i < n; ++i) {
            node = nodes[i];
            dx = x - node.x;
            dy = y - node.y;
            d2 = dx * dx + dy * dy;
            if (d2 < radius) closest = node, radius = d2;
          }

          return closest;
        },

        on: function(name, _) {
          return arguments.length > 1 ? (event.on(name, _), simulation) : event.on(name);
        }
      };
    }

    function forceManyBody() {
      var nodes,
          node,
          random,
          alpha,
          strength = constant(-30),
          strengths,
          distanceMin2 = 1,
          distanceMax2 = Infinity,
          theta2 = 0.81;

      function force(_) {
        var i, n = nodes.length, tree = quadtree(nodes, x, y).visitAfter(accumulate);
        for (alpha = _, i = 0; i < n; ++i) node = nodes[i], tree.visit(apply);
      }

      function initialize() {
        if (!nodes) return;
        var i, n = nodes.length, node;
        strengths = new Array(n);
        for (i = 0; i < n; ++i) node = nodes[i], strengths[node.index] = +strength(node, i, nodes);
      }

      function accumulate(quad) {
        var strength = 0, q, c, weight = 0, x, y, i;

        // For internal nodes, accumulate forces from child quadrants.
        if (quad.length) {
          for (x = y = i = 0; i < 4; ++i) {
            if ((q = quad[i]) && (c = Math.abs(q.value))) {
              strength += q.value, weight += c, x += c * q.x, y += c * q.y;
            }
          }
          quad.x = x / weight;
          quad.y = y / weight;
        }

        // For leaf nodes, accumulate forces from coincident quadrants.
        else {
          q = quad;
          q.x = q.data.x;
          q.y = q.data.y;
          do strength += strengths[q.data.index];
          while (q = q.next);
        }

        quad.value = strength;
      }

      function apply(quad, x1, _, x2) {
        if (!quad.value) return true;

        var x = quad.x - node.x,
            y = quad.y - node.y,
            w = x2 - x1,
            l = x * x + y * y;

        // Apply the Barnes-Hut approximation if possible.
        // Limit forces for very close nodes; randomize direction if coincident.
        if (w * w / theta2 < l) {
          if (l < distanceMax2) {
            if (x === 0) x = jiggle(random), l += x * x;
            if (y === 0) y = jiggle(random), l += y * y;
            if (l < distanceMin2) l = Math.sqrt(distanceMin2 * l);
            node.vx += x * quad.value * alpha / l;
            node.vy += y * quad.value * alpha / l;
          }
          return true;
        }

        // Otherwise, process points directly.
        else if (quad.length || l >= distanceMax2) return;

        // Limit forces for very close nodes; randomize direction if coincident.
        if (quad.data !== node || quad.next) {
          if (x === 0) x = jiggle(random), l += x * x;
          if (y === 0) y = jiggle(random), l += y * y;
          if (l < distanceMin2) l = Math.sqrt(distanceMin2 * l);
        }

        do if (quad.data !== node) {
          w = strengths[quad.data.index] * alpha / l;
          node.vx += x * w;
          node.vy += y * w;
        } while (quad = quad.next);
      }

      force.initialize = function(_nodes, _random) {
        nodes = _nodes;
        random = _random;
        initialize();
      };

      force.strength = function(_) {
        return arguments.length ? (strength = typeof _ === "function" ? _ : constant(+_), initialize(), force) : strength;
      };

      force.distanceMin = function(_) {
        return arguments.length ? (distanceMin2 = _ * _, force) : Math.sqrt(distanceMin2);
      };

      force.distanceMax = function(_) {
        return arguments.length ? (distanceMax2 = _ * _, force) : Math.sqrt(distanceMax2);
      };

      force.theta = function(_) {
        return arguments.length ? (theta2 = _ * _, force) : Math.sqrt(theta2);
      };

      return force;
    }

    function forceRadial(radius, x, y) {
      var nodes,
          strength = constant(0.1),
          strengths,
          radiuses;

      if (typeof radius !== "function") radius = constant(+radius);
      if (x == null) x = 0;
      if (y == null) y = 0;

      function force(alpha) {
        for (var i = 0, n = nodes.length; i < n; ++i) {
          var node = nodes[i],
              dx = node.x - x || 1e-6,
              dy = node.y - y || 1e-6,
              r = Math.sqrt(dx * dx + dy * dy),
              k = (radiuses[i] - r) * strengths[i] * alpha / r;
          node.vx += dx * k;
          node.vy += dy * k;
        }
      }

      function initialize() {
        if (!nodes) return;
        var i, n = nodes.length;
        strengths = new Array(n);
        radiuses = new Array(n);
        for (i = 0; i < n; ++i) {
          radiuses[i] = +radius(nodes[i], i, nodes);
          strengths[i] = isNaN(radiuses[i]) ? 0 : +strength(nodes[i], i, nodes);
        }
      }

      force.initialize = function(_) {
        nodes = _, initialize();
      };

      force.strength = function(_) {
        return arguments.length ? (strength = typeof _ === "function" ? _ : constant(+_), initialize(), force) : strength;
      };

      force.radius = function(_) {
        return arguments.length ? (radius = typeof _ === "function" ? _ : constant(+_), initialize(), force) : radius;
      };

      force.x = function(_) {
        return arguments.length ? (x = +_, force) : x;
      };

      force.y = function(_) {
        return arguments.length ? (y = +_, force) : y;
      };

      return force;
    }

    function forceX(x) {
      var strength = constant(0.1),
          nodes,
          strengths,
          xz;

      if (typeof x !== "function") x = constant(x == null ? 0 : +x);

      function force(alpha) {
        for (var i = 0, n = nodes.length, node; i < n; ++i) {
          node = nodes[i], node.vx += (xz[i] - node.x) * strengths[i] * alpha;
        }
      }

      function initialize() {
        if (!nodes) return;
        var i, n = nodes.length;
        strengths = new Array(n);
        xz = new Array(n);
        for (i = 0; i < n; ++i) {
          strengths[i] = isNaN(xz[i] = +x(nodes[i], i, nodes)) ? 0 : +strength(nodes[i], i, nodes);
        }
      }

      force.initialize = function(_) {
        nodes = _;
        initialize();
      };

      force.strength = function(_) {
        return arguments.length ? (strength = typeof _ === "function" ? _ : constant(+_), initialize(), force) : strength;
      };

      force.x = function(_) {
        return arguments.length ? (x = typeof _ === "function" ? _ : constant(+_), initialize(), force) : x;
      };

      return force;
    }

    function forceY(y) {
      var strength = constant(0.1),
          nodes,
          strengths,
          yz;

      if (typeof y !== "function") y = constant(y == null ? 0 : +y);

      function force(alpha) {
        for (var i = 0, n = nodes.length, node; i < n; ++i) {
          node = nodes[i], node.vy += (yz[i] - node.y) * strengths[i] * alpha;
        }
      }

      function initialize() {
        if (!nodes) return;
        var i, n = nodes.length;
        strengths = new Array(n);
        yz = new Array(n);
        for (i = 0; i < n; ++i) {
          strengths[i] = isNaN(yz[i] = +y(nodes[i], i, nodes)) ? 0 : +strength(nodes[i], i, nodes);
        }
      }

      force.initialize = function(_) {
        nodes = _;
        initialize();
      };

      force.strength = function(_) {
        return arguments.length ? (strength = typeof _ === "function" ? _ : constant(+_), initialize(), force) : strength;
      };

      force.y = function(_) {
        return arguments.length ? (y = typeof _ === "function" ? _ : constant(+_), initialize(), force) : y;
      };

      return force;
    }

    /**
     * Fuse.js v6.5.3 - Lightweight fuzzy-search (http://fusejs.io)
     *
     * Copyright (c) 2021 Kiro Risk (http://kiro.me)
     * All Rights Reserved. Apache Software License 2.0
     *
     * http://www.apache.org/licenses/LICENSE-2.0
     */

    function isArray(value) {
      return !Array.isArray
        ? getTag(value) === '[object Array]'
        : Array.isArray(value)
    }

    // Adapted from: https://github.com/lodash/lodash/blob/master/.internal/baseToString.js
    const INFINITY = 1 / 0;
    function baseToString(value) {
      // Exit early for strings to avoid a performance hit in some environments.
      if (typeof value == 'string') {
        return value
      }
      let result = value + '';
      return result == '0' && 1 / value == -INFINITY ? '-0' : result
    }

    function toString(value) {
      return value == null ? '' : baseToString(value)
    }

    function isString(value) {
      return typeof value === 'string'
    }

    function isNumber$1(value) {
      return typeof value === 'number'
    }

    // Adapted from: https://github.com/lodash/lodash/blob/master/isBoolean.js
    function isBoolean(value) {
      return (
        value === true ||
        value === false ||
        (isObjectLike(value) && getTag(value) == '[object Boolean]')
      )
    }

    function isObject(value) {
      return typeof value === 'object'
    }

    // Checks if `value` is object-like.
    function isObjectLike(value) {
      return isObject(value) && value !== null
    }

    function isDefined(value) {
      return value !== undefined && value !== null
    }

    function isBlank(value) {
      return !value.trim().length
    }

    // Gets the `toStringTag` of `value`.
    // Adapted from: https://github.com/lodash/lodash/blob/master/.internal/getTag.js
    function getTag(value) {
      return value == null
        ? value === undefined
          ? '[object Undefined]'
          : '[object Null]'
        : Object.prototype.toString.call(value)
    }

    const EXTENDED_SEARCH_UNAVAILABLE = 'Extended search is not available';

    const INCORRECT_INDEX_TYPE = "Incorrect 'index' type";

    const LOGICAL_SEARCH_INVALID_QUERY_FOR_KEY = (key) =>
      `Invalid value for key ${key}`;

    const PATTERN_LENGTH_TOO_LARGE = (max) =>
      `Pattern length exceeds max of ${max}.`;

    const MISSING_KEY_PROPERTY = (name) => `Missing ${name} property in key`;

    const INVALID_KEY_WEIGHT_VALUE = (key) =>
      `Property 'weight' in key '${key}' must be a positive integer`;

    const hasOwn = Object.prototype.hasOwnProperty;

    class KeyStore {
      constructor(keys) {
        this._keys = [];
        this._keyMap = {};

        let totalWeight = 0;

        keys.forEach((key) => {
          let obj = createKey(key);

          totalWeight += obj.weight;

          this._keys.push(obj);
          this._keyMap[obj.id] = obj;

          totalWeight += obj.weight;
        });

        // Normalize weights so that their sum is equal to 1
        this._keys.forEach((key) => {
          key.weight /= totalWeight;
        });
      }
      get(keyId) {
        return this._keyMap[keyId]
      }
      keys() {
        return this._keys
      }
      toJSON() {
        return JSON.stringify(this._keys)
      }
    }

    function createKey(key) {
      let path = null;
      let id = null;
      let src = null;
      let weight = 1;

      if (isString(key) || isArray(key)) {
        src = key;
        path = createKeyPath(key);
        id = createKeyId(key);
      } else {
        if (!hasOwn.call(key, 'name')) {
          throw new Error(MISSING_KEY_PROPERTY('name'))
        }

        const name = key.name;
        src = name;

        if (hasOwn.call(key, 'weight')) {
          weight = key.weight;

          if (weight <= 0) {
            throw new Error(INVALID_KEY_WEIGHT_VALUE(name))
          }
        }

        path = createKeyPath(name);
        id = createKeyId(name);
      }

      return { path, id, weight, src }
    }

    function createKeyPath(key) {
      return isArray(key) ? key : key.split('.')
    }

    function createKeyId(key) {
      return isArray(key) ? key.join('.') : key
    }

    function get(obj, path) {
      let list = [];
      let arr = false;

      const deepGet = (obj, path, index) => {
        if (!isDefined(obj)) {
          return
        }
        if (!path[index]) {
          // If there's no path left, we've arrived at the object we care about.
          list.push(obj);
        } else {
          let key = path[index];

          const value = obj[key];

          if (!isDefined(value)) {
            return
          }

          // If we're at the last value in the path, and if it's a string/number/bool,
          // add it to the list
          if (
            index === path.length - 1 &&
            (isString(value) || isNumber$1(value) || isBoolean(value))
          ) {
            list.push(toString(value));
          } else if (isArray(value)) {
            arr = true;
            // Search each item in the array.
            for (let i = 0, len = value.length; i < len; i += 1) {
              deepGet(value[i], path, index + 1);
            }
          } else if (path.length) {
            // An object. Recurse further.
            deepGet(value, path, index + 1);
          }
        }
      };

      // Backwards compatibility (since path used to be a string)
      deepGet(obj, isString(path) ? path.split('.') : path, 0);

      return arr ? list : list[0]
    }

    const MatchOptions = {
      // Whether the matches should be included in the result set. When `true`, each record in the result
      // set will include the indices of the matched characters.
      // These can consequently be used for highlighting purposes.
      includeMatches: false,
      // When `true`, the matching function will continue to the end of a search pattern even if
      // a perfect match has already been located in the string.
      findAllMatches: false,
      // Minimum number of characters that must be matched before a result is considered a match
      minMatchCharLength: 1
    };

    const BasicOptions = {
      // When `true`, the algorithm continues searching to the end of the input even if a perfect
      // match is found before the end of the same input.
      isCaseSensitive: false,
      // When true, the matching function will continue to the end of a search pattern even if
      includeScore: false,
      // List of properties that will be searched. This also supports nested properties.
      keys: [],
      // Whether to sort the result list, by score
      shouldSort: true,
      // Default sort function: sort by ascending score, ascending index
      sortFn: (a, b) =>
        a.score === b.score ? (a.idx < b.idx ? -1 : 1) : a.score < b.score ? -1 : 1
    };

    const FuzzyOptions = {
      // Approximately where in the text is the pattern expected to be found?
      location: 0,
      // At what point does the match algorithm give up. A threshold of '0.0' requires a perfect match
      // (of both letters and location), a threshold of '1.0' would match anything.
      threshold: 0.6,
      // Determines how close the match must be to the fuzzy location (specified above).
      // An exact letter match which is 'distance' characters away from the fuzzy location
      // would score as a complete mismatch. A distance of '0' requires the match be at
      // the exact location specified, a threshold of '1000' would require a perfect match
      // to be within 800 characters of the fuzzy location to be found using a 0.8 threshold.
      distance: 100
    };

    const AdvancedOptions = {
      // When `true`, it enables the use of unix-like search commands
      useExtendedSearch: false,
      // The get function to use when fetching an object's properties.
      // The default will search nested paths *ie foo.bar.baz*
      getFn: get,
      // When `true`, search will ignore `location` and `distance`, so it won't matter
      // where in the string the pattern appears.
      // More info: https://fusejs.io/concepts/scoring-theory.html#fuzziness-score
      ignoreLocation: false,
      // When `true`, the calculation for the relevance score (used for sorting) will
      // ignore the field-length norm.
      // More info: https://fusejs.io/concepts/scoring-theory.html#field-length-norm
      ignoreFieldNorm: false,
      // The weight to determine how much field length norm effects scoring.
      fieldNormWeight: 1
    };

    var Config = {
      ...BasicOptions,
      ...MatchOptions,
      ...FuzzyOptions,
      ...AdvancedOptions
    };

    const SPACE = /[^ ]+/g;

    // Field-length norm: the shorter the field, the higher the weight.
    // Set to 3 decimals to reduce index size.
    function norm(weight = 1, mantissa = 3) {
      const cache = new Map();
      const m = Math.pow(10, mantissa);

      return {
        get(value) {
          const numTokens = value.match(SPACE).length;

          if (cache.has(numTokens)) {
            return cache.get(numTokens)
          }

          // Default function is 1/sqrt(x), weight makes that variable
          const norm = 1 / Math.pow(numTokens, 0.5 * weight);

          // In place of `toFixed(mantissa)`, for faster computation
          const n = parseFloat(Math.round(norm * m) / m);

          cache.set(numTokens, n);

          return n
        },
        clear() {
          cache.clear();
        }
      }
    }

    class FuseIndex {
      constructor({
        getFn = Config.getFn,
        fieldNormWeight = Config.fieldNormWeight
      } = {}) {
        this.norm = norm(fieldNormWeight, 3);
        this.getFn = getFn;
        this.isCreated = false;

        this.setIndexRecords();
      }
      setSources(docs = []) {
        this.docs = docs;
      }
      setIndexRecords(records = []) {
        this.records = records;
      }
      setKeys(keys = []) {
        this.keys = keys;
        this._keysMap = {};
        keys.forEach((key, idx) => {
          this._keysMap[key.id] = idx;
        });
      }
      create() {
        if (this.isCreated || !this.docs.length) {
          return
        }

        this.isCreated = true;

        // List is Array<String>
        if (isString(this.docs[0])) {
          this.docs.forEach((doc, docIndex) => {
            this._addString(doc, docIndex);
          });
        } else {
          // List is Array<Object>
          this.docs.forEach((doc, docIndex) => {
            this._addObject(doc, docIndex);
          });
        }

        this.norm.clear();
      }
      // Adds a doc to the end of the index
      add(doc) {
        const idx = this.size();

        if (isString(doc)) {
          this._addString(doc, idx);
        } else {
          this._addObject(doc, idx);
        }
      }
      // Removes the doc at the specified index of the index
      removeAt(idx) {
        this.records.splice(idx, 1);

        // Change ref index of every subsquent doc
        for (let i = idx, len = this.size(); i < len; i += 1) {
          this.records[i].i -= 1;
        }
      }
      getValueForItemAtKeyId(item, keyId) {
        return item[this._keysMap[keyId]]
      }
      size() {
        return this.records.length
      }
      _addString(doc, docIndex) {
        if (!isDefined(doc) || isBlank(doc)) {
          return
        }

        let record = {
          v: doc,
          i: docIndex,
          n: this.norm.get(doc)
        };

        this.records.push(record);
      }
      _addObject(doc, docIndex) {
        let record = { i: docIndex, $: {} };

        // Iterate over every key (i.e, path), and fetch the value at that key
        this.keys.forEach((key, keyIndex) => {
          // console.log(key)
          let value = this.getFn(doc, key.path);

          if (!isDefined(value)) {
            return
          }

          if (isArray(value)) {
            let subRecords = [];
            const stack = [{ nestedArrIndex: -1, value }];

            while (stack.length) {
              const { nestedArrIndex, value } = stack.pop();

              if (!isDefined(value)) {
                continue
              }

              if (isString(value) && !isBlank(value)) {
                let subRecord = {
                  v: value,
                  i: nestedArrIndex,
                  n: this.norm.get(value)
                };

                subRecords.push(subRecord);
              } else if (isArray(value)) {
                value.forEach((item, k) => {
                  stack.push({
                    nestedArrIndex: k,
                    value: item
                  });
                });
              } else ;
            }
            record.$[keyIndex] = subRecords;
          } else if (!isBlank(value)) {
            let subRecord = {
              v: value,
              n: this.norm.get(value)
            };

            record.$[keyIndex] = subRecord;
          }
        });

        this.records.push(record);
      }
      toJSON() {
        return {
          keys: this.keys,
          records: this.records
        }
      }
    }

    function createIndex(
      keys,
      docs,
      { getFn = Config.getFn, fieldNormWeight = Config.fieldNormWeight } = {}
    ) {
      const myIndex = new FuseIndex({ getFn, fieldNormWeight });
      myIndex.setKeys(keys.map(createKey));
      myIndex.setSources(docs);
      myIndex.create();
      return myIndex
    }

    function parseIndex(
      data,
      { getFn = Config.getFn, fieldNormWeight = Config.fieldNormWeight } = {}
    ) {
      const { keys, records } = data;
      const myIndex = new FuseIndex({ getFn, fieldNormWeight });
      myIndex.setKeys(keys);
      myIndex.setIndexRecords(records);
      return myIndex
    }

    function computeScore$1(
      pattern,
      {
        errors = 0,
        currentLocation = 0,
        expectedLocation = 0,
        distance = Config.distance,
        ignoreLocation = Config.ignoreLocation
      } = {}
    ) {
      const accuracy = errors / pattern.length;

      if (ignoreLocation) {
        return accuracy
      }

      const proximity = Math.abs(expectedLocation - currentLocation);

      if (!distance) {
        // Dodge divide by zero error.
        return proximity ? 1.0 : accuracy
      }

      return accuracy + proximity / distance
    }

    function convertMaskToIndices(
      matchmask = [],
      minMatchCharLength = Config.minMatchCharLength
    ) {
      let indices = [];
      let start = -1;
      let end = -1;
      let i = 0;

      for (let len = matchmask.length; i < len; i += 1) {
        let match = matchmask[i];
        if (match && start === -1) {
          start = i;
        } else if (!match && start !== -1) {
          end = i - 1;
          if (end - start + 1 >= minMatchCharLength) {
            indices.push([start, end]);
          }
          start = -1;
        }
      }

      // (i-1 - start) + 1 => i - start
      if (matchmask[i - 1] && i - start >= minMatchCharLength) {
        indices.push([start, i - 1]);
      }

      return indices
    }

    // Machine word size
    const MAX_BITS = 32;

    function search(
      text,
      pattern,
      patternAlphabet,
      {
        location = Config.location,
        distance = Config.distance,
        threshold = Config.threshold,
        findAllMatches = Config.findAllMatches,
        minMatchCharLength = Config.minMatchCharLength,
        includeMatches = Config.includeMatches,
        ignoreLocation = Config.ignoreLocation
      } = {}
    ) {
      if (pattern.length > MAX_BITS) {
        throw new Error(PATTERN_LENGTH_TOO_LARGE(MAX_BITS))
      }

      const patternLen = pattern.length;
      // Set starting location at beginning text and initialize the alphabet.
      const textLen = text.length;
      // Handle the case when location > text.length
      const expectedLocation = Math.max(0, Math.min(location, textLen));
      // Highest score beyond which we give up.
      let currentThreshold = threshold;
      // Is there a nearby exact match? (speedup)
      let bestLocation = expectedLocation;

      // Performance: only computer matches when the minMatchCharLength > 1
      // OR if `includeMatches` is true.
      const computeMatches = minMatchCharLength > 1 || includeMatches;
      // A mask of the matches, used for building the indices
      const matchMask = computeMatches ? Array(textLen) : [];

      let index;

      // Get all exact matches, here for speed up
      while ((index = text.indexOf(pattern, bestLocation)) > -1) {
        let score = computeScore$1(pattern, {
          currentLocation: index,
          expectedLocation,
          distance,
          ignoreLocation
        });

        currentThreshold = Math.min(score, currentThreshold);
        bestLocation = index + patternLen;

        if (computeMatches) {
          let i = 0;
          while (i < patternLen) {
            matchMask[index + i] = 1;
            i += 1;
          }
        }
      }

      // Reset the best location
      bestLocation = -1;

      let lastBitArr = [];
      let finalScore = 1;
      let binMax = patternLen + textLen;

      const mask = 1 << (patternLen - 1);

      for (let i = 0; i < patternLen; i += 1) {
        // Scan for the best match; each iteration allows for one more error.
        // Run a binary search to determine how far from the match location we can stray
        // at this error level.
        let binMin = 0;
        let binMid = binMax;

        while (binMin < binMid) {
          const score = computeScore$1(pattern, {
            errors: i,
            currentLocation: expectedLocation + binMid,
            expectedLocation,
            distance,
            ignoreLocation
          });

          if (score <= currentThreshold) {
            binMin = binMid;
          } else {
            binMax = binMid;
          }

          binMid = Math.floor((binMax - binMin) / 2 + binMin);
        }

        // Use the result from this iteration as the maximum for the next.
        binMax = binMid;

        let start = Math.max(1, expectedLocation - binMid + 1);
        let finish = findAllMatches
          ? textLen
          : Math.min(expectedLocation + binMid, textLen) + patternLen;

        // Initialize the bit array
        let bitArr = Array(finish + 2);

        bitArr[finish + 1] = (1 << i) - 1;

        for (let j = finish; j >= start; j -= 1) {
          let currentLocation = j - 1;
          let charMatch = patternAlphabet[text.charAt(currentLocation)];

          if (computeMatches) {
            // Speed up: quick bool to int conversion (i.e, `charMatch ? 1 : 0`)
            matchMask[currentLocation] = +!!charMatch;
          }

          // First pass: exact match
          bitArr[j] = ((bitArr[j + 1] << 1) | 1) & charMatch;

          // Subsequent passes: fuzzy match
          if (i) {
            bitArr[j] |=
              ((lastBitArr[j + 1] | lastBitArr[j]) << 1) | 1 | lastBitArr[j + 1];
          }

          if (bitArr[j] & mask) {
            finalScore = computeScore$1(pattern, {
              errors: i,
              currentLocation,
              expectedLocation,
              distance,
              ignoreLocation
            });

            // This match will almost certainly be better than any existing match.
            // But check anyway.
            if (finalScore <= currentThreshold) {
              // Indeed it is
              currentThreshold = finalScore;
              bestLocation = currentLocation;

              // Already passed `loc`, downhill from here on in.
              if (bestLocation <= expectedLocation) {
                break
              }

              // When passing `bestLocation`, don't exceed our current distance from `expectedLocation`.
              start = Math.max(1, 2 * expectedLocation - bestLocation);
            }
          }
        }

        // No hope for a (better) match at greater error levels.
        const score = computeScore$1(pattern, {
          errors: i + 1,
          currentLocation: expectedLocation,
          expectedLocation,
          distance,
          ignoreLocation
        });

        if (score > currentThreshold) {
          break
        }

        lastBitArr = bitArr;
      }

      const result = {
        isMatch: bestLocation >= 0,
        // Count exact matches (those with a score of 0) to be "almost" exact
        score: Math.max(0.001, finalScore)
      };

      if (computeMatches) {
        const indices = convertMaskToIndices(matchMask, minMatchCharLength);
        if (!indices.length) {
          result.isMatch = false;
        } else if (includeMatches) {
          result.indices = indices;
        }
      }

      return result
    }

    function createPatternAlphabet(pattern) {
      let mask = {};

      for (let i = 0, len = pattern.length; i < len; i += 1) {
        const char = pattern.charAt(i);
        mask[char] = (mask[char] || 0) | (1 << (len - i - 1));
      }

      return mask
    }

    class BitapSearch {
      constructor(
        pattern,
        {
          location = Config.location,
          threshold = Config.threshold,
          distance = Config.distance,
          includeMatches = Config.includeMatches,
          findAllMatches = Config.findAllMatches,
          minMatchCharLength = Config.minMatchCharLength,
          isCaseSensitive = Config.isCaseSensitive,
          ignoreLocation = Config.ignoreLocation
        } = {}
      ) {
        this.options = {
          location,
          threshold,
          distance,
          includeMatches,
          findAllMatches,
          minMatchCharLength,
          isCaseSensitive,
          ignoreLocation
        };

        this.pattern = isCaseSensitive ? pattern : pattern.toLowerCase();

        this.chunks = [];

        if (!this.pattern.length) {
          return
        }

        const addChunk = (pattern, startIndex) => {
          this.chunks.push({
            pattern,
            alphabet: createPatternAlphabet(pattern),
            startIndex
          });
        };

        const len = this.pattern.length;

        if (len > MAX_BITS) {
          let i = 0;
          const remainder = len % MAX_BITS;
          const end = len - remainder;

          while (i < end) {
            addChunk(this.pattern.substr(i, MAX_BITS), i);
            i += MAX_BITS;
          }

          if (remainder) {
            const startIndex = len - MAX_BITS;
            addChunk(this.pattern.substr(startIndex), startIndex);
          }
        } else {
          addChunk(this.pattern, 0);
        }
      }

      searchIn(text) {
        const { isCaseSensitive, includeMatches } = this.options;

        if (!isCaseSensitive) {
          text = text.toLowerCase();
        }

        // Exact match
        if (this.pattern === text) {
          let result = {
            isMatch: true,
            score: 0
          };

          if (includeMatches) {
            result.indices = [[0, text.length - 1]];
          }

          return result
        }

        // Otherwise, use Bitap algorithm
        const {
          location,
          distance,
          threshold,
          findAllMatches,
          minMatchCharLength,
          ignoreLocation
        } = this.options;

        let allIndices = [];
        let totalScore = 0;
        let hasMatches = false;

        this.chunks.forEach(({ pattern, alphabet, startIndex }) => {
          const { isMatch, score, indices } = search(text, pattern, alphabet, {
            location: location + startIndex,
            distance,
            threshold,
            findAllMatches,
            minMatchCharLength,
            includeMatches,
            ignoreLocation
          });

          if (isMatch) {
            hasMatches = true;
          }

          totalScore += score;

          if (isMatch && indices) {
            allIndices = [...allIndices, ...indices];
          }
        });

        let result = {
          isMatch: hasMatches,
          score: hasMatches ? totalScore / this.chunks.length : 1
        };

        if (hasMatches && includeMatches) {
          result.indices = allIndices;
        }

        return result
      }
    }

    class BaseMatch {
      constructor(pattern) {
        this.pattern = pattern;
      }
      static isMultiMatch(pattern) {
        return getMatch(pattern, this.multiRegex)
      }
      static isSingleMatch(pattern) {
        return getMatch(pattern, this.singleRegex)
      }
      search(/*text*/) {}
    }

    function getMatch(pattern, exp) {
      const matches = pattern.match(exp);
      return matches ? matches[1] : null
    }

    // Token: 'file

    class ExactMatch extends BaseMatch {
      constructor(pattern) {
        super(pattern);
      }
      static get type() {
        return 'exact'
      }
      static get multiRegex() {
        return /^="(.*)"$/
      }
      static get singleRegex() {
        return /^=(.*)$/
      }
      search(text) {
        const isMatch = text === this.pattern;

        return {
          isMatch,
          score: isMatch ? 0 : 1,
          indices: [0, this.pattern.length - 1]
        }
      }
    }

    // Token: !fire

    class InverseExactMatch extends BaseMatch {
      constructor(pattern) {
        super(pattern);
      }
      static get type() {
        return 'inverse-exact'
      }
      static get multiRegex() {
        return /^!"(.*)"$/
      }
      static get singleRegex() {
        return /^!(.*)$/
      }
      search(text) {
        const index = text.indexOf(this.pattern);
        const isMatch = index === -1;

        return {
          isMatch,
          score: isMatch ? 0 : 1,
          indices: [0, text.length - 1]
        }
      }
    }

    // Token: ^file

    class PrefixExactMatch extends BaseMatch {
      constructor(pattern) {
        super(pattern);
      }
      static get type() {
        return 'prefix-exact'
      }
      static get multiRegex() {
        return /^\^"(.*)"$/
      }
      static get singleRegex() {
        return /^\^(.*)$/
      }
      search(text) {
        const isMatch = text.startsWith(this.pattern);

        return {
          isMatch,
          score: isMatch ? 0 : 1,
          indices: [0, this.pattern.length - 1]
        }
      }
    }

    // Token: !^fire

    class InversePrefixExactMatch extends BaseMatch {
      constructor(pattern) {
        super(pattern);
      }
      static get type() {
        return 'inverse-prefix-exact'
      }
      static get multiRegex() {
        return /^!\^"(.*)"$/
      }
      static get singleRegex() {
        return /^!\^(.*)$/
      }
      search(text) {
        const isMatch = !text.startsWith(this.pattern);

        return {
          isMatch,
          score: isMatch ? 0 : 1,
          indices: [0, text.length - 1]
        }
      }
    }

    // Token: .file$

    class SuffixExactMatch extends BaseMatch {
      constructor(pattern) {
        super(pattern);
      }
      static get type() {
        return 'suffix-exact'
      }
      static get multiRegex() {
        return /^"(.*)"\$$/
      }
      static get singleRegex() {
        return /^(.*)\$$/
      }
      search(text) {
        const isMatch = text.endsWith(this.pattern);

        return {
          isMatch,
          score: isMatch ? 0 : 1,
          indices: [text.length - this.pattern.length, text.length - 1]
        }
      }
    }

    // Token: !.file$

    class InverseSuffixExactMatch extends BaseMatch {
      constructor(pattern) {
        super(pattern);
      }
      static get type() {
        return 'inverse-suffix-exact'
      }
      static get multiRegex() {
        return /^!"(.*)"\$$/
      }
      static get singleRegex() {
        return /^!(.*)\$$/
      }
      search(text) {
        const isMatch = !text.endsWith(this.pattern);
        return {
          isMatch,
          score: isMatch ? 0 : 1,
          indices: [0, text.length - 1]
        }
      }
    }

    class FuzzyMatch extends BaseMatch {
      constructor(
        pattern,
        {
          location = Config.location,
          threshold = Config.threshold,
          distance = Config.distance,
          includeMatches = Config.includeMatches,
          findAllMatches = Config.findAllMatches,
          minMatchCharLength = Config.minMatchCharLength,
          isCaseSensitive = Config.isCaseSensitive,
          ignoreLocation = Config.ignoreLocation
        } = {}
      ) {
        super(pattern);
        this._bitapSearch = new BitapSearch(pattern, {
          location,
          threshold,
          distance,
          includeMatches,
          findAllMatches,
          minMatchCharLength,
          isCaseSensitive,
          ignoreLocation
        });
      }
      static get type() {
        return 'fuzzy'
      }
      static get multiRegex() {
        return /^"(.*)"$/
      }
      static get singleRegex() {
        return /^(.*)$/
      }
      search(text) {
        return this._bitapSearch.searchIn(text)
      }
    }

    // Token: 'file

    class IncludeMatch extends BaseMatch {
      constructor(pattern) {
        super(pattern);
      }
      static get type() {
        return 'include'
      }
      static get multiRegex() {
        return /^'"(.*)"$/
      }
      static get singleRegex() {
        return /^'(.*)$/
      }
      search(text) {
        let location = 0;
        let index;

        const indices = [];
        const patternLen = this.pattern.length;

        // Get all exact matches
        while ((index = text.indexOf(this.pattern, location)) > -1) {
          location = index + patternLen;
          indices.push([index, location - 1]);
        }

        const isMatch = !!indices.length;

        return {
          isMatch,
          score: isMatch ? 0 : 1,
          indices
        }
      }
    }

    // ❗Order is important. DO NOT CHANGE.
    const searchers = [
      ExactMatch,
      IncludeMatch,
      PrefixExactMatch,
      InversePrefixExactMatch,
      InverseSuffixExactMatch,
      SuffixExactMatch,
      InverseExactMatch,
      FuzzyMatch
    ];

    const searchersLen = searchers.length;

    // Regex to split by spaces, but keep anything in quotes together
    const SPACE_RE = / +(?=([^\"]*\"[^\"]*\")*[^\"]*$)/;
    const OR_TOKEN = '|';

    // Return a 2D array representation of the query, for simpler parsing.
    // Example:
    // "^core go$ | rb$ | py$ xy$" => [["^core", "go$"], ["rb$"], ["py$", "xy$"]]
    function parseQuery(pattern, options = {}) {
      return pattern.split(OR_TOKEN).map((item) => {
        let query = item
          .trim()
          .split(SPACE_RE)
          .filter((item) => item && !!item.trim());

        let results = [];
        for (let i = 0, len = query.length; i < len; i += 1) {
          const queryItem = query[i];

          // 1. Handle multiple query match (i.e, once that are quoted, like `"hello world"`)
          let found = false;
          let idx = -1;
          while (!found && ++idx < searchersLen) {
            const searcher = searchers[idx];
            let token = searcher.isMultiMatch(queryItem);
            if (token) {
              results.push(new searcher(token, options));
              found = true;
            }
          }

          if (found) {
            continue
          }

          // 2. Handle single query matches (i.e, once that are *not* quoted)
          idx = -1;
          while (++idx < searchersLen) {
            const searcher = searchers[idx];
            let token = searcher.isSingleMatch(queryItem);
            if (token) {
              results.push(new searcher(token, options));
              break
            }
          }
        }

        return results
      })
    }

    // These extended matchers can return an array of matches, as opposed
    // to a singl match
    const MultiMatchSet = new Set([FuzzyMatch.type, IncludeMatch.type]);

    /**
     * Command-like searching
     * ======================
     *
     * Given multiple search terms delimited by spaces.e.g. `^jscript .python$ ruby !java`,
     * search in a given text.
     *
     * Search syntax:
     *
     * | Token       | Match type                 | Description                            |
     * | ----------- | -------------------------- | -------------------------------------- |
     * | `jscript`   | fuzzy-match                | Items that fuzzy match `jscript`       |
     * | `=scheme`   | exact-match                | Items that are `scheme`                |
     * | `'python`   | include-match              | Items that include `python`            |
     * | `!ruby`     | inverse-exact-match        | Items that do not include `ruby`       |
     * | `^java`     | prefix-exact-match         | Items that start with `java`           |
     * | `!^earlang` | inverse-prefix-exact-match | Items that do not start with `earlang` |
     * | `.js$`      | suffix-exact-match         | Items that end with `.js`              |
     * | `!.go$`     | inverse-suffix-exact-match | Items that do not end with `.go`       |
     *
     * A single pipe character acts as an OR operator. For example, the following
     * query matches entries that start with `core` and end with either`go`, `rb`,
     * or`py`.
     *
     * ```
     * ^core go$ | rb$ | py$
     * ```
     */
    class ExtendedSearch {
      constructor(
        pattern,
        {
          isCaseSensitive = Config.isCaseSensitive,
          includeMatches = Config.includeMatches,
          minMatchCharLength = Config.minMatchCharLength,
          ignoreLocation = Config.ignoreLocation,
          findAllMatches = Config.findAllMatches,
          location = Config.location,
          threshold = Config.threshold,
          distance = Config.distance
        } = {}
      ) {
        this.query = null;
        this.options = {
          isCaseSensitive,
          includeMatches,
          minMatchCharLength,
          findAllMatches,
          ignoreLocation,
          location,
          threshold,
          distance
        };

        this.pattern = isCaseSensitive ? pattern : pattern.toLowerCase();
        this.query = parseQuery(this.pattern, this.options);
      }

      static condition(_, options) {
        return options.useExtendedSearch
      }

      searchIn(text) {
        const query = this.query;

        if (!query) {
          return {
            isMatch: false,
            score: 1
          }
        }

        const { includeMatches, isCaseSensitive } = this.options;

        text = isCaseSensitive ? text : text.toLowerCase();

        let numMatches = 0;
        let allIndices = [];
        let totalScore = 0;

        // ORs
        for (let i = 0, qLen = query.length; i < qLen; i += 1) {
          const searchers = query[i];

          // Reset indices
          allIndices.length = 0;
          numMatches = 0;

          // ANDs
          for (let j = 0, pLen = searchers.length; j < pLen; j += 1) {
            const searcher = searchers[j];
            const { isMatch, indices, score } = searcher.search(text);

            if (isMatch) {
              numMatches += 1;
              totalScore += score;
              if (includeMatches) {
                const type = searcher.constructor.type;
                if (MultiMatchSet.has(type)) {
                  allIndices = [...allIndices, ...indices];
                } else {
                  allIndices.push(indices);
                }
              }
            } else {
              totalScore = 0;
              numMatches = 0;
              allIndices.length = 0;
              break
            }
          }

          // OR condition, so if TRUE, return
          if (numMatches) {
            let result = {
              isMatch: true,
              score: totalScore / numMatches
            };

            if (includeMatches) {
              result.indices = allIndices;
            }

            return result
          }
        }

        // Nothing was matched
        return {
          isMatch: false,
          score: 1
        }
      }
    }

    const registeredSearchers = [];

    function register(...args) {
      registeredSearchers.push(...args);
    }

    function createSearcher(pattern, options) {
      for (let i = 0, len = registeredSearchers.length; i < len; i += 1) {
        let searcherClass = registeredSearchers[i];
        if (searcherClass.condition(pattern, options)) {
          return new searcherClass(pattern, options)
        }
      }

      return new BitapSearch(pattern, options)
    }

    const LogicalOperator = {
      AND: '$and',
      OR: '$or'
    };

    const KeyType = {
      PATH: '$path',
      PATTERN: '$val'
    };

    const isExpression = (query) =>
      !!(query[LogicalOperator.AND] || query[LogicalOperator.OR]);

    const isPath = (query) => !!query[KeyType.PATH];

    const isLeaf = (query) =>
      !isArray(query) && isObject(query) && !isExpression(query);

    const convertToExplicit = (query) => ({
      [LogicalOperator.AND]: Object.keys(query).map((key) => ({
        [key]: query[key]
      }))
    });

    // When `auto` is `true`, the parse function will infer and initialize and add
    // the appropriate `Searcher` instance
    function parse(query, options, { auto = true } = {}) {
      const next = (query) => {
        let keys = Object.keys(query);

        const isQueryPath = isPath(query);

        if (!isQueryPath && keys.length > 1 && !isExpression(query)) {
          return next(convertToExplicit(query))
        }

        if (isLeaf(query)) {
          const key = isQueryPath ? query[KeyType.PATH] : keys[0];

          const pattern = isQueryPath ? query[KeyType.PATTERN] : query[key];

          if (!isString(pattern)) {
            throw new Error(LOGICAL_SEARCH_INVALID_QUERY_FOR_KEY(key))
          }

          const obj = {
            keyId: createKeyId(key),
            pattern
          };

          if (auto) {
            obj.searcher = createSearcher(pattern, options);
          }

          return obj
        }

        let node = {
          children: [],
          operator: keys[0]
        };

        keys.forEach((key) => {
          const value = query[key];

          if (isArray(value)) {
            value.forEach((item) => {
              node.children.push(next(item));
            });
          }
        });

        return node
      };

      if (!isExpression(query)) {
        query = convertToExplicit(query);
      }

      return next(query)
    }

    // Practical scoring function
    function computeScore(
      results,
      { ignoreFieldNorm = Config.ignoreFieldNorm }
    ) {
      results.forEach((result) => {
        let totalScore = 1;

        result.matches.forEach(({ key, norm, score }) => {
          const weight = key ? key.weight : null;

          totalScore *= Math.pow(
            score === 0 && weight ? Number.EPSILON : score,
            (weight || 1) * (ignoreFieldNorm ? 1 : norm)
          );
        });

        result.score = totalScore;
      });
    }

    function transformMatches(result, data) {
      const matches = result.matches;
      data.matches = [];

      if (!isDefined(matches)) {
        return
      }

      matches.forEach((match) => {
        if (!isDefined(match.indices) || !match.indices.length) {
          return
        }

        const { indices, value } = match;

        let obj = {
          indices,
          value
        };

        if (match.key) {
          obj.key = match.key.src;
        }

        if (match.idx > -1) {
          obj.refIndex = match.idx;
        }

        data.matches.push(obj);
      });
    }

    function transformScore(result, data) {
      data.score = result.score;
    }

    function format(
      results,
      docs,
      {
        includeMatches = Config.includeMatches,
        includeScore = Config.includeScore
      } = {}
    ) {
      const transformers = [];

      if (includeMatches) transformers.push(transformMatches);
      if (includeScore) transformers.push(transformScore);

      return results.map((result) => {
        const { idx } = result;

        const data = {
          item: docs[idx],
          refIndex: idx
        };

        if (transformers.length) {
          transformers.forEach((transformer) => {
            transformer(result, data);
          });
        }

        return data
      })
    }

    class Fuse {
      constructor(docs, options = {}, index) {
        this.options = { ...Config, ...options };

        if (
          this.options.useExtendedSearch &&
          !true
        ) {
          throw new Error(EXTENDED_SEARCH_UNAVAILABLE)
        }

        this._keyStore = new KeyStore(this.options.keys);

        this.setCollection(docs, index);
      }

      setCollection(docs, index) {
        this._docs = docs;

        if (index && !(index instanceof FuseIndex)) {
          throw new Error(INCORRECT_INDEX_TYPE)
        }

        this._myIndex =
          index ||
          createIndex(this.options.keys, this._docs, {
            getFn: this.options.getFn,
            fieldNormWeight: this.options.fieldNormWeight
          });
      }

      add(doc) {
        if (!isDefined(doc)) {
          return
        }

        this._docs.push(doc);
        this._myIndex.add(doc);
      }

      remove(predicate = (/* doc, idx */) => false) {
        const results = [];

        for (let i = 0, len = this._docs.length; i < len; i += 1) {
          const doc = this._docs[i];
          if (predicate(doc, i)) {
            this.removeAt(i);
            i -= 1;
            len -= 1;

            results.push(doc);
          }
        }

        return results
      }

      removeAt(idx) {
        this._docs.splice(idx, 1);
        this._myIndex.removeAt(idx);
      }

      getIndex() {
        return this._myIndex
      }

      search(query, { limit = -1 } = {}) {
        const {
          includeMatches,
          includeScore,
          shouldSort,
          sortFn,
          ignoreFieldNorm
        } = this.options;

        let results = isString(query)
          ? isString(this._docs[0])
            ? this._searchStringList(query)
            : this._searchObjectList(query)
          : this._searchLogical(query);

        computeScore(results, { ignoreFieldNorm });

        if (shouldSort) {
          results.sort(sortFn);
        }

        if (isNumber$1(limit) && limit > -1) {
          results = results.slice(0, limit);
        }

        return format(results, this._docs, {
          includeMatches,
          includeScore
        })
      }

      _searchStringList(query) {
        const searcher = createSearcher(query, this.options);
        const { records } = this._myIndex;
        const results = [];

        // Iterate over every string in the index
        records.forEach(({ v: text, i: idx, n: norm }) => {
          if (!isDefined(text)) {
            return
          }

          const { isMatch, score, indices } = searcher.searchIn(text);

          if (isMatch) {
            results.push({
              item: text,
              idx,
              matches: [{ score, value: text, norm, indices }]
            });
          }
        });

        return results
      }

      _searchLogical(query) {

        const expression = parse(query, this.options);

        const evaluate = (node, item, idx) => {
          if (!node.children) {
            const { keyId, searcher } = node;

            const matches = this._findMatches({
              key: this._keyStore.get(keyId),
              value: this._myIndex.getValueForItemAtKeyId(item, keyId),
              searcher
            });

            if (matches && matches.length) {
              return [
                {
                  idx,
                  item,
                  matches
                }
              ]
            }

            return []
          }

          const res = [];
          for (let i = 0, len = node.children.length; i < len; i += 1) {
            const child = node.children[i];
            const result = evaluate(child, item, idx);
            if (result.length) {
              res.push(...result);
            } else if (node.operator === LogicalOperator.AND) {
              return []
            }
          }
          return res
        };

        const records = this._myIndex.records;
        const resultMap = {};
        const results = [];

        records.forEach(({ $: item, i: idx }) => {
          if (isDefined(item)) {
            let expResults = evaluate(expression, item, idx);

            if (expResults.length) {
              // Dedupe when adding
              if (!resultMap[idx]) {
                resultMap[idx] = { idx, item, matches: [] };
                results.push(resultMap[idx]);
              }
              expResults.forEach(({ matches }) => {
                resultMap[idx].matches.push(...matches);
              });
            }
          }
        });

        return results
      }

      _searchObjectList(query) {
        const searcher = createSearcher(query, this.options);
        const { keys, records } = this._myIndex;
        const results = [];

        // List is Array<Object>
        records.forEach(({ $: item, i: idx }) => {
          if (!isDefined(item)) {
            return
          }

          let matches = [];

          // Iterate over every key (i.e, path), and fetch the value at that key
          keys.forEach((key, keyIndex) => {
            matches.push(
              ...this._findMatches({
                key,
                value: item[keyIndex],
                searcher
              })
            );
          });

          if (matches.length) {
            results.push({
              idx,
              item,
              matches
            });
          }
        });

        return results
      }
      _findMatches({ key, value, searcher }) {
        if (!isDefined(value)) {
          return []
        }

        let matches = [];

        if (isArray(value)) {
          value.forEach(({ v: text, i: idx, n: norm }) => {
            if (!isDefined(text)) {
              return
            }

            const { isMatch, score, indices } = searcher.searchIn(text);

            if (isMatch) {
              matches.push({
                score,
                key,
                value: text,
                idx,
                norm,
                indices
              });
            }
          });
        } else {
          const { v: text, n: norm } = value;

          const { isMatch, score, indices } = searcher.searchIn(text);

          if (isMatch) {
            matches.push({ score, key, value: text, norm, indices });
          }
        }

        return matches
      }
    }

    Fuse.version = '6.5.3';
    Fuse.createIndex = createIndex;
    Fuse.parseIndex = parseIndex;
    Fuse.config = Config;

    {
      Fuse.parseQuery = parse;
    }

    {
      register(ExtendedSearch);
    }

    var wheel$1 = {exports: {}};

    /**
     * This module used to unify mouse wheel behavior between different browsers in 2014
     * Now it's just a wrapper around addEventListener('wheel');
     *
     * Usage:
     *  var addWheelListener = require('wheel').addWheelListener;
     *  var removeWheelListener = require('wheel').removeWheelListener;
     *  addWheelListener(domElement, function (e) {
     *    // mouse wheel event
     *  });
     *  removeWheelListener(domElement, function);
     */

    wheel$1.exports = addWheelListener;

    // But also expose "advanced" api with unsubscribe:
    wheel$1.exports.addWheelListener = addWheelListener;
    wheel$1.exports.removeWheelListener = removeWheelListener;


    function addWheelListener(element, listener, useCapture) {
      element.addEventListener('wheel', listener, useCapture);
    }

    function removeWheelListener( element, listener, useCapture ) {
      element.removeEventListener('wheel', listener, useCapture);
    }

    var amator = {exports: {}};

    /**
     * https://github.com/gre/bezier-easing
     * BezierEasing - use bezier curve for transition easing function
     * by Gaëtan Renaudeau 2014 - 2015 – MIT License
     */

    // These values are established by empiricism with tests (tradeoff: performance VS precision)
    var NEWTON_ITERATIONS = 4;
    var NEWTON_MIN_SLOPE = 0.001;
    var SUBDIVISION_PRECISION = 0.0000001;
    var SUBDIVISION_MAX_ITERATIONS = 10;

    var kSplineTableSize = 11;
    var kSampleStepSize = 1.0 / (kSplineTableSize - 1.0);

    var float32ArraySupported = typeof Float32Array === 'function';

    function A (aA1, aA2) { return 1.0 - 3.0 * aA2 + 3.0 * aA1; }
    function B (aA1, aA2) { return 3.0 * aA2 - 6.0 * aA1; }
    function C (aA1)      { return 3.0 * aA1; }

    // Returns x(t) given t, x1, and x2, or y(t) given t, y1, and y2.
    function calcBezier (aT, aA1, aA2) { return ((A(aA1, aA2) * aT + B(aA1, aA2)) * aT + C(aA1)) * aT; }

    // Returns dx/dt given t, x1, and x2, or dy/dt given t, y1, and y2.
    function getSlope (aT, aA1, aA2) { return 3.0 * A(aA1, aA2) * aT * aT + 2.0 * B(aA1, aA2) * aT + C(aA1); }

    function binarySubdivide (aX, aA, aB, mX1, mX2) {
      var currentX, currentT, i = 0;
      do {
        currentT = aA + (aB - aA) / 2.0;
        currentX = calcBezier(currentT, mX1, mX2) - aX;
        if (currentX > 0.0) {
          aB = currentT;
        } else {
          aA = currentT;
        }
      } while (Math.abs(currentX) > SUBDIVISION_PRECISION && ++i < SUBDIVISION_MAX_ITERATIONS);
      return currentT;
    }

    function newtonRaphsonIterate (aX, aGuessT, mX1, mX2) {
     for (var i = 0; i < NEWTON_ITERATIONS; ++i) {
       var currentSlope = getSlope(aGuessT, mX1, mX2);
       if (currentSlope === 0.0) {
         return aGuessT;
       }
       var currentX = calcBezier(aGuessT, mX1, mX2) - aX;
       aGuessT -= currentX / currentSlope;
     }
     return aGuessT;
    }

    function LinearEasing (x) {
      return x;
    }

    var src = function bezier (mX1, mY1, mX2, mY2) {
      if (!(0 <= mX1 && mX1 <= 1 && 0 <= mX2 && mX2 <= 1)) {
        throw new Error('bezier x values must be in [0, 1] range');
      }

      if (mX1 === mY1 && mX2 === mY2) {
        return LinearEasing;
      }

      // Precompute samples table
      var sampleValues = float32ArraySupported ? new Float32Array(kSplineTableSize) : new Array(kSplineTableSize);
      for (var i = 0; i < kSplineTableSize; ++i) {
        sampleValues[i] = calcBezier(i * kSampleStepSize, mX1, mX2);
      }

      function getTForX (aX) {
        var intervalStart = 0.0;
        var currentSample = 1;
        var lastSample = kSplineTableSize - 1;

        for (; currentSample !== lastSample && sampleValues[currentSample] <= aX; ++currentSample) {
          intervalStart += kSampleStepSize;
        }
        --currentSample;

        // Interpolate to provide an initial guess for t
        var dist = (aX - sampleValues[currentSample]) / (sampleValues[currentSample + 1] - sampleValues[currentSample]);
        var guessForT = intervalStart + dist * kSampleStepSize;

        var initialSlope = getSlope(guessForT, mX1, mX2);
        if (initialSlope >= NEWTON_MIN_SLOPE) {
          return newtonRaphsonIterate(aX, guessForT, mX1, mX2);
        } else if (initialSlope === 0.0) {
          return guessForT;
        } else {
          return binarySubdivide(aX, intervalStart, intervalStart + kSampleStepSize, mX1, mX2);
        }
      }

      return function BezierEasing (x) {
        // Because JavaScript number are imprecise, we should guarantee the extremes are right.
        if (x === 0) {
          return 0;
        }
        if (x === 1) {
          return 1;
        }
        return calcBezier(getTForX(x), mY1, mY2);
      };
    };

    var BezierEasing = src;

    // Predefined set of animations. Similar to CSS easing functions
    var animations = {
      ease:  BezierEasing(0.25, 0.1, 0.25, 1),
      easeIn: BezierEasing(0.42, 0, 1, 1),
      easeOut: BezierEasing(0, 0, 0.58, 1),
      easeInOut: BezierEasing(0.42, 0, 0.58, 1),
      linear: BezierEasing(0, 0, 1, 1)
    };


    amator.exports = animate$1;
    amator.exports.makeAggregateRaf = makeAggregateRaf;
    amator.exports.sharedScheduler = makeAggregateRaf();


    function animate$1(source, target, options) {
      var start = Object.create(null);
      var diff = Object.create(null);
      options = options || {};
      // We let clients specify their own easing function
      var easing = (typeof options.easing === 'function') ? options.easing : animations[options.easing];

      // if nothing is specified, default to ease (similar to CSS animations)
      if (!easing) {
        if (options.easing) {
          console.warn('Unknown easing function in amator: ' + options.easing);
        }
        easing = animations.ease;
      }

      var step = typeof options.step === 'function' ? options.step : noop$2;
      var done = typeof options.done === 'function' ? options.done : noop$2;

      var scheduler = getScheduler(options.scheduler);

      var keys = Object.keys(target);
      keys.forEach(function(key) {
        start[key] = source[key];
        diff[key] = target[key] - source[key];
      });

      var durationInMs = typeof options.duration === 'number' ? options.duration : 400;
      var durationInFrames = Math.max(1, durationInMs * 0.06); // 0.06 because 60 frames pers 1,000 ms
      var previousAnimationId;
      var frame = 0;

      previousAnimationId = scheduler.next(loop);

      return {
        cancel: cancel
      }

      function cancel() {
        scheduler.cancel(previousAnimationId);
        previousAnimationId = 0;
      }

      function loop() {
        var t = easing(frame/durationInFrames);
        frame += 1;
        setValues(t);
        if (frame <= durationInFrames) {
          previousAnimationId = scheduler.next(loop);
          step(source);
        } else {
          previousAnimationId = 0;
          setTimeout(function() { done(source); }, 0);
        }
      }

      function setValues(t) {
        keys.forEach(function(key) {
          source[key] = diff[key] * t + start[key];
        });
      }
    }

    function noop$2() { }

    function getScheduler(scheduler) {
      if (!scheduler) {
        var canRaf = typeof window !== 'undefined' && window.requestAnimationFrame;
        return canRaf ? rafScheduler() : timeoutScheduler()
      }
      if (typeof scheduler.next !== 'function') throw new Error('Scheduler is supposed to have next(cb) function')
      if (typeof scheduler.cancel !== 'function') throw new Error('Scheduler is supposed to have cancel(handle) function')

      return scheduler
    }

    function rafScheduler() {
      return {
        next: window.requestAnimationFrame.bind(window),
        cancel: window.cancelAnimationFrame.bind(window)
      }
    }

    function timeoutScheduler() {
      return {
        next: function(cb) {
          return setTimeout(cb, 1000/60)
        },
        cancel: function (id) {
          return clearTimeout(id)
        }
      }
    }

    function makeAggregateRaf() {
      var frontBuffer = new Set();
      var backBuffer = new Set();
      var frameToken = 0;

      return {
        next: next,
        cancel: next,
        clearAll: clearAll
      }

      function clearAll() {
        frontBuffer.clear();
        backBuffer.clear();
        cancelAnimationFrame(frameToken);
        frameToken = 0;
      }

      function next(callback) {
        backBuffer.add(callback);
        renderNextFrame();
      }

      function renderNextFrame() {
        if (!frameToken) frameToken = requestAnimationFrame(renderFrame);
      }

      function renderFrame() {
        frameToken = 0;

        var t = backBuffer;
        backBuffer = frontBuffer;
        frontBuffer = t;

        frontBuffer.forEach(function(callback) {
          callback();
        });
        frontBuffer.clear();
      }
    }

    var ngraph_events = function eventify(subject) {
      validateSubject(subject);

      var eventsStorage = createEventsStorage(subject);
      subject.on = eventsStorage.on;
      subject.off = eventsStorage.off;
      subject.fire = eventsStorage.fire;
      return subject;
    };

    function createEventsStorage(subject) {
      // Store all event listeners to this hash. Key is event name, value is array
      // of callback records.
      //
      // A callback record consists of callback function and its optional context:
      // { 'eventName' => [{callback: function, ctx: object}] }
      var registeredEvents = Object.create(null);

      return {
        on: function (eventName, callback, ctx) {
          if (typeof callback !== 'function') {
            throw new Error('callback is expected to be a function');
          }
          var handlers = registeredEvents[eventName];
          if (!handlers) {
            handlers = registeredEvents[eventName] = [];
          }
          handlers.push({callback: callback, ctx: ctx});

          return subject;
        },

        off: function (eventName, callback) {
          var wantToRemoveAll = (typeof eventName === 'undefined');
          if (wantToRemoveAll) {
            // Killing old events storage should be enough in this case:
            registeredEvents = Object.create(null);
            return subject;
          }

          if (registeredEvents[eventName]) {
            var deleteAllCallbacksForEvent = (typeof callback !== 'function');
            if (deleteAllCallbacksForEvent) {
              delete registeredEvents[eventName];
            } else {
              var callbacks = registeredEvents[eventName];
              for (var i = 0; i < callbacks.length; ++i) {
                if (callbacks[i].callback === callback) {
                  callbacks.splice(i, 1);
                }
              }
            }
          }

          return subject;
        },

        fire: function (eventName) {
          var callbacks = registeredEvents[eventName];
          if (!callbacks) {
            return subject;
          }

          var fireArguments;
          if (arguments.length > 1) {
            fireArguments = Array.prototype.splice.call(arguments, 1);
          }
          for(var i = 0; i < callbacks.length; ++i) {
            var callbackInfo = callbacks[i];
            callbackInfo.callback.apply(callbackInfo.ctx, fireArguments);
          }

          return subject;
        }
      };
    }

    function validateSubject(subject) {
      if (!subject) {
        throw new Error('Eventify cannot use falsy object as events subject');
      }
      var reservedWords = ['on', 'fire', 'off'];
      for (var i = 0; i < reservedWords.length; ++i) {
        if (subject.hasOwnProperty(reservedWords[i])) {
          throw new Error("Subject cannot be eventified, since it already has property '" + reservedWords[i] + "'");
        }
      }
    }

    /**
     * Allows smooth kinetic scrolling of the surface
     */

    var kinetic_1 = kinetic$1;

    function kinetic$1(getPoint, scroll, settings) {
      if (typeof settings !== 'object') {
        // setting could come as boolean, we should ignore it, and use an object.
        settings = {};
      }

      var minVelocity = typeof settings.minVelocity === 'number' ? settings.minVelocity : 5;
      var amplitude = typeof settings.amplitude === 'number' ? settings.amplitude : 0.25;
      var cancelAnimationFrame = typeof settings.cancelAnimationFrame === 'function' ? settings.cancelAnimationFrame : getCancelAnimationFrame();
      var requestAnimationFrame = typeof settings.requestAnimationFrame === 'function' ? settings.requestAnimationFrame : getRequestAnimationFrame();

      var lastPoint;
      var timestamp;
      var timeConstant = 342;

      var ticker;
      var vx, targetX, ax;
      var vy, targetY, ay;

      var raf;

      return {
        start: start,
        stop: stop,
        cancel: dispose
      };

      function dispose() {
        cancelAnimationFrame(ticker);
        cancelAnimationFrame(raf);
      }

      function start() {
        lastPoint = getPoint();

        ax = ay = vx = vy = 0;
        timestamp = new Date();

        cancelAnimationFrame(ticker);
        cancelAnimationFrame(raf);

        // we start polling the point position to accumulate velocity
        // Once we stop(), we will use accumulated velocity to keep scrolling
        // an object.
        ticker = requestAnimationFrame(track);
      }

      function track() {
        var now = Date.now();
        var elapsed = now - timestamp;
        timestamp = now;

        var currentPoint = getPoint();

        var dx = currentPoint.x - lastPoint.x;
        var dy = currentPoint.y - lastPoint.y;

        lastPoint = currentPoint;

        var dt = 1000 / (1 + elapsed);

        // moving average
        vx = 0.8 * dx * dt + 0.2 * vx;
        vy = 0.8 * dy * dt + 0.2 * vy;

        ticker = requestAnimationFrame(track);
      }

      function stop() {
        cancelAnimationFrame(ticker);
        cancelAnimationFrame(raf);

        var currentPoint = getPoint();

        targetX = currentPoint.x;
        targetY = currentPoint.y;
        timestamp = Date.now();

        if (vx < -minVelocity || vx > minVelocity) {
          ax = amplitude * vx;
          targetX += ax;
        }

        if (vy < -minVelocity || vy > minVelocity) {
          ay = amplitude * vy;
          targetY += ay;
        }

        raf = requestAnimationFrame(autoScroll);
      }

      function autoScroll() {
        var elapsed = Date.now() - timestamp;

        var moving = false;
        var dx = 0;
        var dy = 0;

        if (ax) {
          dx = -ax * Math.exp(-elapsed / timeConstant);

          if (dx > 0.5 || dx < -0.5) moving = true;
          else dx = ax = 0;
        }

        if (ay) {
          dy = -ay * Math.exp(-elapsed / timeConstant);

          if (dy > 0.5 || dy < -0.5) moving = true;
          else dy = ay = 0;
        }

        if (moving) {
          scroll(targetX + dx, targetY + dy);
          raf = requestAnimationFrame(autoScroll);
        }
      }
    }

    function getCancelAnimationFrame() {
      if (typeof cancelAnimationFrame === 'function') return cancelAnimationFrame;
      return clearTimeout;
    }

    function getRequestAnimationFrame() {
      if (typeof requestAnimationFrame === 'function') return requestAnimationFrame;

      return function (handler) {
        return setTimeout(handler, 16);
      };
    }

    /**
     * Disallows selecting text.
     */

    var createTextSelectionInterceptor_1 = createTextSelectionInterceptor$1;

    function createTextSelectionInterceptor$1(useFake) {
      if (useFake) {
        return {
          capture: noop$1,
          release: noop$1
        };
      }

      var dragObject;
      var prevSelectStart;
      var prevDragStart;
      var wasCaptured = false;

      return {
        capture: capture,
        release: release
      };

      function capture(domObject) {
        wasCaptured = true;
        prevSelectStart = window.document.onselectstart;
        prevDragStart = window.document.ondragstart;

        window.document.onselectstart = disabled;

        dragObject = domObject;
        dragObject.ondragstart = disabled;
      }

      function release() {
        if (!wasCaptured) return;
        
        wasCaptured = false;
        window.document.onselectstart = prevSelectStart;
        if (dragObject) dragObject.ondragstart = prevDragStart;
      }
    }

    function disabled(e) {
      e.stopPropagation();
      return false;
    }

    function noop$1() {}

    var transform = Transform$1;

    function Transform$1() {
      this.x = 0;
      this.y = 0;
      this.scale = 1;
    }

    var svgController = {exports: {}};

    svgController.exports = makeSvgController$1;
    svgController.exports.canAttach = isSVGElement;

    function makeSvgController$1(svgElement, options) {
      if (!isSVGElement(svgElement)) {
        throw new Error('svg element is required for svg.panzoom to work');
      }

      var owner = svgElement.ownerSVGElement;
      if (!owner) {
        throw new Error(
          'Do not apply panzoom to the root <svg> element. ' +
          'Use its child instead (e.g. <g></g>). ' +
          'As of March 2016 only FireFox supported transform on the root element');
      }

      if (!options.disableKeyboardInteraction) {
        owner.setAttribute('tabindex', 0);
      }

      var api = {
        getBBox: getBBox,
        getScreenCTM: getScreenCTM,
        getOwner: getOwner,
        applyTransform: applyTransform,
        initTransform: initTransform
      };
      
      return api;

      function getOwner() {
        return owner;
      }

      function getBBox() {
        var bbox =  svgElement.getBBox();
        return {
          left: bbox.x,
          top: bbox.y,
          width: bbox.width,
          height: bbox.height,
        };
      }

      function getScreenCTM() {
        var ctm = owner.getCTM();
        if (!ctm) {
          // This is likely firefox: https://bugzilla.mozilla.org/show_bug.cgi?id=873106
          // The code below is not entirely correct, but still better than nothing
          return owner.getScreenCTM();
        }
        return ctm;
      }

      function initTransform(transform) {
        var screenCTM = svgElement.getCTM();

        // The above line returns null on Firefox
        if (screenCTM === null) {
          screenCTM = document.createElementNS("http://www.w3.org/2000/svg", "svg").createSVGMatrix();
        }

        transform.x = screenCTM.e;
        transform.y = screenCTM.f;
        transform.scale = screenCTM.a;
        owner.removeAttributeNS(null, 'viewBox');
      }

      function applyTransform(transform) {
        svgElement.setAttribute('transform', 'matrix(' +
          transform.scale + ' 0 0 ' +
          transform.scale + ' ' +
          transform.x + ' ' + transform.y + ')');
      }
    }

    function isSVGElement(element) {
      return element && element.ownerSVGElement && element.getCTM;
    }

    var domController = {exports: {}};

    domController.exports = makeDomController$1;

    domController.exports.canAttach = isDomElement;

    function makeDomController$1(domElement, options) {
      var elementValid = isDomElement(domElement); 
      if (!elementValid) {
        throw new Error('panzoom requires DOM element to be attached to the DOM tree');
      }

      var owner = domElement.parentElement;
      domElement.scrollTop = 0;
      
      if (!options.disableKeyboardInteraction) {
        owner.setAttribute('tabindex', 0);
      }

      var api = {
        getBBox: getBBox,
        getOwner: getOwner,
        applyTransform: applyTransform,
      };
      
      return api;

      function getOwner() {
        return owner;
      }

      function getBBox() {
        // TODO: We should probably cache this?
        return  {
          left: 0,
          top: 0,
          width: domElement.clientWidth,
          height: domElement.clientHeight
        };
      }

      function applyTransform(transform) {
        // TODO: Should we cache this?
        domElement.style.transformOrigin = '0 0 0';
        domElement.style.transform = 'matrix(' +
          transform.scale + ', 0, 0, ' +
          transform.scale + ', ' +
          transform.x + ', ' + transform.y + ')';
      }
    }

    function isDomElement(element) {
      return element && element.parentElement && element.style;
    }

    /**
     * Allows to drag and zoom svg elements
     */
    var wheel = wheel$1.exports;
    var animate = amator.exports;
    var eventify = ngraph_events;
    var kinetic = kinetic_1;
    var createTextSelectionInterceptor = createTextSelectionInterceptor_1;
    var domTextSelectionInterceptor = createTextSelectionInterceptor();
    var fakeTextSelectorInterceptor = createTextSelectionInterceptor(true);
    var Transform = transform;
    var makeSvgController = svgController.exports;
    var makeDomController = domController.exports;

    var defaultZoomSpeed = 1;
    var defaultDoubleTapZoomSpeed = 1.75;
    var doubleTapSpeedInMS = 300;

    var panzoom = createPanZoom;

    /**
     * Creates a new instance of panzoom, so that an object can be panned and zoomed
     *
     * @param {DOMElement} domElement where panzoom should be attached.
     * @param {Object} options that configure behavior.
     */
    function createPanZoom(domElement, options) {
      options = options || {};

      var panController = options.controller;

      if (!panController) {
        if (makeSvgController.canAttach(domElement)) {
          panController = makeSvgController(domElement, options);
        } else if (makeDomController.canAttach(domElement)) {
          panController = makeDomController(domElement, options);
        }
      }

      if (!panController) {
        throw new Error(
          'Cannot create panzoom for the current type of dom element'
        );
      }
      var owner = panController.getOwner();
      // just to avoid GC pressure, every time we do intermediate transform
      // we return this object. For internal use only. Never give it back to the consumer of this library
      var storedCTMResult = { x: 0, y: 0 };

      var isDirty = false;
      var transform = new Transform();

      if (panController.initTransform) {
        panController.initTransform(transform);
      }

      var filterKey = typeof options.filterKey === 'function' ? options.filterKey : noop;
      // TODO: likely need to unite pinchSpeed with zoomSpeed
      var pinchSpeed = typeof options.pinchSpeed === 'number' ? options.pinchSpeed : 1;
      var bounds = options.bounds;
      var maxZoom = typeof options.maxZoom === 'number' ? options.maxZoom : Number.POSITIVE_INFINITY;
      var minZoom = typeof options.minZoom === 'number' ? options.minZoom : 0;

      var boundsPadding = typeof options.boundsPadding === 'number' ? options.boundsPadding : 0.05;
      var zoomDoubleClickSpeed = typeof options.zoomDoubleClickSpeed === 'number' ? options.zoomDoubleClickSpeed : defaultDoubleTapZoomSpeed;
      var beforeWheel = options.beforeWheel || noop;
      var beforeMouseDown = options.beforeMouseDown || noop;
      var speed = typeof options.zoomSpeed === 'number' ? options.zoomSpeed : defaultZoomSpeed;
      var transformOrigin = parseTransformOrigin(options.transformOrigin);
      var textSelection = options.enableTextSelection ? fakeTextSelectorInterceptor : domTextSelectionInterceptor;

      validateBounds(bounds);

      if (options.autocenter) {
        autocenter();
      }

      var frameAnimation;
      var lastTouchEndTime = 0;
      var lastSingleFingerOffset;
      var touchInProgress = false;

      // We only need to fire panstart when actual move happens
      var panstartFired = false;

      // cache mouse coordinates here
      var mouseX;
      var mouseY;

      var pinchZoomLength;

      var smoothScroll;
      if ('smoothScroll' in options && !options.smoothScroll) {
        // If user explicitly asked us not to use smooth scrolling, we obey
        smoothScroll = rigidScroll();
      } else {
        // otherwise we use forward smoothScroll settings to kinetic API
        // which makes scroll smoothing.
        smoothScroll = kinetic(getPoint, scroll, options.smoothScroll);
      }

      var moveByAnimation;
      var zoomToAnimation;

      var multiTouch;
      var paused = false;

      listenForEvents();

      var api = {
        dispose: dispose,
        moveBy: internalMoveBy,
        moveTo: moveTo,
        smoothMoveTo: smoothMoveTo, 
        centerOn: centerOn,
        zoomTo: publicZoomTo,
        zoomAbs: zoomAbs,
        smoothZoom: smoothZoom,
        smoothZoomAbs: smoothZoomAbs,
        showRectangle: showRectangle,

        pause: pause,
        resume: resume,
        isPaused: isPaused,

        getTransform: getTransformModel,

        getMinZoom: getMinZoom,
        setMinZoom: setMinZoom,

        getMaxZoom: getMaxZoom,
        setMaxZoom: setMaxZoom,

        getTransformOrigin: getTransformOrigin,
        setTransformOrigin: setTransformOrigin,

        getZoomSpeed: getZoomSpeed,
        setZoomSpeed: setZoomSpeed
      };

      eventify(api);
      
      var initialX = typeof options.initialX === 'number' ? options.initialX : transform.x;
      var initialY = typeof options.initialY === 'number' ? options.initialY : transform.y;
      var initialZoom = typeof options.initialZoom === 'number' ? options.initialZoom : transform.scale;

      if(initialX != transform.x || initialY != transform.y || initialZoom != transform.scale){
        zoomAbs(initialX, initialY, initialZoom);
      }

      return api;

      function pause() {
        releaseEvents();
        paused = true;
      }

      function resume() {
        if (paused) {
          listenForEvents();
          paused = false;
        }
      }

      function isPaused() {
        return paused;
      }

      function showRectangle(rect) {
        // TODO: this duplicates autocenter. I think autocenter should go.
        var clientRect = owner.getBoundingClientRect();
        var size = transformToScreen(clientRect.width, clientRect.height);

        var rectWidth = rect.right - rect.left;
        var rectHeight = rect.bottom - rect.top;
        if (!Number.isFinite(rectWidth) || !Number.isFinite(rectHeight)) {
          throw new Error('Invalid rectangle');
        }

        var dw = size.x / rectWidth;
        var dh = size.y / rectHeight;
        var scale = Math.min(dw, dh);
        transform.x = -(rect.left + rectWidth / 2) * scale + size.x / 2;
        transform.y = -(rect.top + rectHeight / 2) * scale + size.y / 2;
        transform.scale = scale;
      }

      function transformToScreen(x, y) {
        if (panController.getScreenCTM) {
          var parentCTM = panController.getScreenCTM();
          var parentScaleX = parentCTM.a;
          var parentScaleY = parentCTM.d;
          var parentOffsetX = parentCTM.e;
          var parentOffsetY = parentCTM.f;
          storedCTMResult.x = x * parentScaleX - parentOffsetX;
          storedCTMResult.y = y * parentScaleY - parentOffsetY;
        } else {
          storedCTMResult.x = x;
          storedCTMResult.y = y;
        }

        return storedCTMResult;
      }

      function autocenter() {
        var w; // width of the parent
        var h; // height of the parent
        var left = 0;
        var top = 0;
        var sceneBoundingBox = getBoundingBox();
        if (sceneBoundingBox) {
          // If we have bounding box - use it.
          left = sceneBoundingBox.left;
          top = sceneBoundingBox.top;
          w = sceneBoundingBox.right - sceneBoundingBox.left;
          h = sceneBoundingBox.bottom - sceneBoundingBox.top;
        } else {
          // otherwise just use whatever space we have
          var ownerRect = owner.getBoundingClientRect();
          w = ownerRect.width;
          h = ownerRect.height;
        }
        var bbox = panController.getBBox();
        if (bbox.width === 0 || bbox.height === 0) {
          // we probably do not have any elements in the SVG
          // just bail out;
          return;
        }
        var dh = h / bbox.height;
        var dw = w / bbox.width;
        var scale = Math.min(dw, dh);
        transform.x = -(bbox.left + bbox.width / 2) * scale + w / 2 + left;
        transform.y = -(bbox.top + bbox.height / 2) * scale + h / 2 + top;
        transform.scale = scale;
      }

      function getTransformModel() {
        // TODO: should this be read only?
        return transform;
      }

      function getMinZoom() {
        return minZoom;
      }

      function setMinZoom(newMinZoom) {
        minZoom = newMinZoom;
      }

      function getMaxZoom() {
        return maxZoom;
      }

      function setMaxZoom(newMaxZoom) {
        maxZoom = newMaxZoom;
      }

      function getTransformOrigin() {
        return transformOrigin;
      }

      function setTransformOrigin(newTransformOrigin) {
        transformOrigin = parseTransformOrigin(newTransformOrigin);
      }

      function getZoomSpeed() {
        return speed;
      }

      function setZoomSpeed(newSpeed) {
        if (!Number.isFinite(newSpeed)) {
          throw new Error('Zoom speed should be a number');
        }
        speed = newSpeed;
      }

      function getPoint() {
        return {
          x: transform.x,
          y: transform.y
        };
      }

      function moveTo(x, y) {
        transform.x = x;
        transform.y = y;

        keepTransformInsideBounds();

        triggerEvent('pan');
        makeDirty();
      }

      function moveBy(dx, dy) {
        moveTo(transform.x + dx, transform.y + dy);
      }

      function keepTransformInsideBounds() {
        var boundingBox = getBoundingBox();
        if (!boundingBox) return;

        var adjusted = false;
        var clientRect = getClientRect();

        var diff = boundingBox.left - clientRect.right;
        if (diff > 0) {
          transform.x += diff;
          adjusted = true;
        }
        // check the other side:
        diff = boundingBox.right - clientRect.left;
        if (diff < 0) {
          transform.x += diff;
          adjusted = true;
        }

        // y axis:
        diff = boundingBox.top - clientRect.bottom;
        if (diff > 0) {
          // we adjust transform, so that it matches exactly our bounding box:
          // transform.y = boundingBox.top - (boundingBox.height + boundingBox.y) * transform.scale =>
          // transform.y = boundingBox.top - (clientRect.bottom - transform.y) =>
          // transform.y = diff + transform.y =>
          transform.y += diff;
          adjusted = true;
        }

        diff = boundingBox.bottom - clientRect.top;
        if (diff < 0) {
          transform.y += diff;
          adjusted = true;
        }
        return adjusted;
      }

      /**
       * Returns bounding box that should be used to restrict scene movement.
       */
      function getBoundingBox() {
        if (!bounds) return; // client does not want to restrict movement

        if (typeof bounds === 'boolean') {
          // for boolean type we use parent container bounds
          var ownerRect = owner.getBoundingClientRect();
          var sceneWidth = ownerRect.width;
          var sceneHeight = ownerRect.height;

          return {
            left: sceneWidth * boundsPadding,
            top: sceneHeight * boundsPadding,
            right: sceneWidth * (1 - boundsPadding),
            bottom: sceneHeight * (1 - boundsPadding)
          };
        }

        return bounds;
      }

      function getClientRect() {
        var bbox = panController.getBBox();
        var leftTop = client(bbox.left, bbox.top);

        return {
          left: leftTop.x,
          top: leftTop.y,
          right: bbox.width * transform.scale + leftTop.x,
          bottom: bbox.height * transform.scale + leftTop.y
        };
      }

      function client(x, y) {
        return {
          x: x * transform.scale + transform.x,
          y: y * transform.scale + transform.y
        };
      }

      function makeDirty() {
        isDirty = true;
        frameAnimation = window.requestAnimationFrame(frame);
      }

      function zoomByRatio(clientX, clientY, ratio) {
        if (isNaN$1(clientX) || isNaN$1(clientY) || isNaN$1(ratio)) {
          throw new Error('zoom requires valid numbers');
        }

        var newScale = transform.scale * ratio;

        if (newScale < minZoom) {
          if (transform.scale === minZoom) return;

          ratio = minZoom / transform.scale;
        }
        if (newScale > maxZoom) {
          if (transform.scale === maxZoom) return;

          ratio = maxZoom / transform.scale;
        }

        var size = transformToScreen(clientX, clientY);

        transform.x = size.x - ratio * (size.x - transform.x);
        transform.y = size.y - ratio * (size.y - transform.y);

        // TODO: https://github.com/anvaka/panzoom/issues/112
        if (bounds && boundsPadding === 1 && minZoom === 1) {
          transform.scale *= ratio;
          keepTransformInsideBounds();
        } else {
          var transformAdjusted = keepTransformInsideBounds();
          if (!transformAdjusted) transform.scale *= ratio;
        }

        triggerEvent('zoom');

        makeDirty();
      }

      function zoomAbs(clientX, clientY, zoomLevel) {
        var ratio = zoomLevel / transform.scale;
        zoomByRatio(clientX, clientY, ratio);
      }

      function centerOn(ui) {
        var parent = ui.ownerSVGElement;
        if (!parent)
          throw new Error('ui element is required to be within the scene');

        // TODO: should i use controller's screen CTM?
        var clientRect = ui.getBoundingClientRect();
        var cx = clientRect.left + clientRect.width / 2;
        var cy = clientRect.top + clientRect.height / 2;

        var container = parent.getBoundingClientRect();
        var dx = container.width / 2 - cx;
        var dy = container.height / 2 - cy;

        internalMoveBy(dx, dy, true);
      }

      function smoothMoveTo(x, y){
        internalMoveBy(x - transform.x, y - transform.y, true);
      }

      function internalMoveBy(dx, dy, smooth) {
        if (!smooth) {
          return moveBy(dx, dy);
        }

        if (moveByAnimation) moveByAnimation.cancel();

        var from = { x: 0, y: 0 };
        var to = { x: dx, y: dy };
        var lastX = 0;
        var lastY = 0;

        moveByAnimation = animate(from, to, {
          step: function (v) {
            moveBy(v.x - lastX, v.y - lastY);

            lastX = v.x;
            lastY = v.y;
          }
        });
      }

      function scroll(x, y) {
        cancelZoomAnimation();
        moveTo(x, y);
      }

      function dispose() {
        releaseEvents();
      }

      function listenForEvents() {
        owner.addEventListener('mousedown', onMouseDown, { passive: false });
        owner.addEventListener('dblclick', onDoubleClick, { passive: false });
        owner.addEventListener('touchstart', onTouch, { passive: false });
        owner.addEventListener('keydown', onKeyDown, { passive: false });

        // Need to listen on the owner container, so that we are not limited
        // by the size of the scrollable domElement
        wheel.addWheelListener(owner, onMouseWheel, { passive: false });

        makeDirty();
      }

      function releaseEvents() {
        wheel.removeWheelListener(owner, onMouseWheel);
        owner.removeEventListener('mousedown', onMouseDown);
        owner.removeEventListener('keydown', onKeyDown);
        owner.removeEventListener('dblclick', onDoubleClick);
        owner.removeEventListener('touchstart', onTouch);

        if (frameAnimation) {
          window.cancelAnimationFrame(frameAnimation);
          frameAnimation = 0;
        }

        smoothScroll.cancel();

        releaseDocumentMouse();
        releaseTouches();
        textSelection.release();

        triggerPanEnd();
      }

      function frame() {
        if (isDirty) applyTransform();
      }

      function applyTransform() {
        isDirty = false;

        // TODO: Should I allow to cancel this?
        panController.applyTransform(transform);

        triggerEvent('transform');
        frameAnimation = 0;
      }

      function onKeyDown(e) {
        var x = 0,
          y = 0,
          z = 0;
        if (e.keyCode === 38) {
          y = 1; // up
        } else if (e.keyCode === 40) {
          y = -1; // down
        } else if (e.keyCode === 37) {
          x = 1; // left
        } else if (e.keyCode === 39) {
          x = -1; // right
        } else if (e.keyCode === 189 || e.keyCode === 109) {
          // DASH or SUBTRACT
          z = 1; // `-` -  zoom out
        } else if (e.keyCode === 187 || e.keyCode === 107) {
          // EQUAL SIGN or ADD
          z = -1; // `=` - zoom in (equal sign on US layout is under `+`)
        }

        if (filterKey(e, x, y, z)) {
          // They don't want us to handle the key: https://github.com/anvaka/panzoom/issues/45
          return;
        }

        if (x || y) {
          e.preventDefault();
          e.stopPropagation();

          var clientRect = owner.getBoundingClientRect();
          // movement speed should be the same in both X and Y direction:
          var offset = Math.min(clientRect.width, clientRect.height);
          var moveSpeedRatio = 0.05;
          var dx = offset * moveSpeedRatio * x;
          var dy = offset * moveSpeedRatio * y;

          // TODO: currently we do not animate this. It could be better to have animation
          internalMoveBy(dx, dy);
        }

        if (z) {
          var scaleMultiplier = getScaleMultiplier(z * 100);
          var offset = transformOrigin ? getTransformOriginOffset() : midPoint();
          publicZoomTo(offset.x, offset.y, scaleMultiplier);
        }
      }

      function midPoint() {
        var ownerRect = owner.getBoundingClientRect();
        return {
          x: ownerRect.width / 2,
          y: ownerRect.height / 2
        };
      }

      function onTouch(e) {
        // let the override the touch behavior
        beforeTouch(e);

        if (e.touches.length === 1) {
          return handleSingleFingerTouch(e, e.touches[0]);
        } else if (e.touches.length === 2) {
          // handleTouchMove() will care about pinch zoom.
          pinchZoomLength = getPinchZoomLength(e.touches[0], e.touches[1]);
          multiTouch = true;
          startTouchListenerIfNeeded();
        }
      }

      function beforeTouch(e) {
        // TODO: Need to unify this filtering names. E.g. use `beforeTouch`
        if (options.onTouch && !options.onTouch(e)) {
          // if they return `false` from onTouch, we don't want to stop
          // events propagation. Fixes https://github.com/anvaka/panzoom/issues/12
          return;
        }

        e.stopPropagation();
        e.preventDefault();
      }

      function beforeDoubleClick(e) {
        // TODO: Need to unify this filtering names. E.g. use `beforeDoubleClick``
        if (options.onDoubleClick && !options.onDoubleClick(e)) {
          // if they return `false` from onTouch, we don't want to stop
          // events propagation. Fixes https://github.com/anvaka/panzoom/issues/46
          return;
        }

        e.preventDefault();
        e.stopPropagation();
      }

      function handleSingleFingerTouch(e) {
        var touch = e.touches[0];
        var offset = getOffsetXY(touch);
        lastSingleFingerOffset = offset;
        var point = transformToScreen(offset.x, offset.y);
        mouseX = point.x;
        mouseY = point.y;

        smoothScroll.cancel();
        startTouchListenerIfNeeded();
      }

      function startTouchListenerIfNeeded() {
        if (touchInProgress) {
          // no need to do anything, as we already listen to events;
          return;
        }

        touchInProgress = true;
        document.addEventListener('touchmove', handleTouchMove);
        document.addEventListener('touchend', handleTouchEnd);
        document.addEventListener('touchcancel', handleTouchEnd);
      }

      function handleTouchMove(e) {
        if (e.touches.length === 1) {
          e.stopPropagation();
          var touch = e.touches[0];

          var offset = getOffsetXY(touch);
          var point = transformToScreen(offset.x, offset.y);

          var dx = point.x - mouseX;
          var dy = point.y - mouseY;

          if (dx !== 0 && dy !== 0) {
            triggerPanStart();
          }
          mouseX = point.x;
          mouseY = point.y;
          internalMoveBy(dx, dy);
        } else if (e.touches.length === 2) {
          // it's a zoom, let's find direction
          multiTouch = true;
          var t1 = e.touches[0];
          var t2 = e.touches[1];
          var currentPinchLength = getPinchZoomLength(t1, t2);

          // since the zoom speed is always based on distance from 1, we need to apply
          // pinch speed only on that distance from 1:
          var scaleMultiplier =
            1 + (currentPinchLength / pinchZoomLength - 1) * pinchSpeed;

          var firstTouchPoint = getOffsetXY(t1);
          var secondTouchPoint = getOffsetXY(t2);
          mouseX = (firstTouchPoint.x + secondTouchPoint.x) / 2;
          mouseY = (firstTouchPoint.y + secondTouchPoint.y) / 2;
          if (transformOrigin) {
            var offset = getTransformOriginOffset();
            mouseX = offset.x;
            mouseY = offset.y;
          }

          publicZoomTo(mouseX, mouseY, scaleMultiplier);

          pinchZoomLength = currentPinchLength;
          e.stopPropagation();
          e.preventDefault();
        }
      }

      function handleTouchEnd(e) {
        if (e.touches.length > 0) {
          var offset = getOffsetXY(e.touches[0]);
          var point = transformToScreen(offset.x, offset.y);
          mouseX = point.x;
          mouseY = point.y;
        } else {
          var now = new Date();
          if (now - lastTouchEndTime < doubleTapSpeedInMS) {
            if (transformOrigin) {
              var offset = getTransformOriginOffset();
              smoothZoom(offset.x, offset.y, zoomDoubleClickSpeed);
            } else {
              // We want untransformed x/y here.
              smoothZoom(lastSingleFingerOffset.x, lastSingleFingerOffset.y, zoomDoubleClickSpeed);
            }
          }

          lastTouchEndTime = now;

          triggerPanEnd();
          releaseTouches();
        }
      }

      function getPinchZoomLength(finger1, finger2) {
        var dx = finger1.clientX - finger2.clientX;
        var dy = finger1.clientY - finger2.clientY;
        return Math.sqrt(dx * dx + dy * dy);
      }

      function onDoubleClick(e) {
        beforeDoubleClick(e);
        var offset = getOffsetXY(e);
        if (transformOrigin) {
          // TODO: looks like this is duplicated in the file.
          // Need to refactor
          offset = getTransformOriginOffset();
        }
        smoothZoom(offset.x, offset.y, zoomDoubleClickSpeed);
      }

      function onMouseDown(e) {
        // if client does not want to handle this event - just ignore the call
        if (beforeMouseDown(e)) return;

        if (touchInProgress) {
          // modern browsers will fire mousedown for touch events too
          // we do not want this: touch is handled separately.
          e.stopPropagation();
          return false;
        }
        // for IE, left click == 1
        // for Firefox, left click == 0
        var isLeftButton =
          (e.button === 1 && window.event !== null) || e.button === 0;
        if (!isLeftButton) return;

        smoothScroll.cancel();

        var offset = getOffsetXY(e);
        var point = transformToScreen(offset.x, offset.y);
        mouseX = point.x;
        mouseY = point.y;

        // We need to listen on document itself, since mouse can go outside of the
        // window, and we will loose it
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
        textSelection.capture(e.target || e.srcElement);

        return false;
      }

      function onMouseMove(e) {
        // no need to worry about mouse events when touch is happening
        if (touchInProgress) return;

        triggerPanStart();

        var offset = getOffsetXY(e);
        var point = transformToScreen(offset.x, offset.y);
        var dx = point.x - mouseX;
        var dy = point.y - mouseY;

        mouseX = point.x;
        mouseY = point.y;

        internalMoveBy(dx, dy);
      }

      function onMouseUp() {
        textSelection.release();
        triggerPanEnd();
        releaseDocumentMouse();
      }

      function releaseDocumentMouse() {
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
        panstartFired = false;
      }

      function releaseTouches() {
        document.removeEventListener('touchmove', handleTouchMove);
        document.removeEventListener('touchend', handleTouchEnd);
        document.removeEventListener('touchcancel', handleTouchEnd);
        panstartFired = false;
        multiTouch = false;
        touchInProgress = false;
      }

      function onMouseWheel(e) {
        // if client does not want to handle this event - just ignore the call
        if (beforeWheel(e)) return;

        smoothScroll.cancel();

        var delta = e.deltaY;
        if (e.deltaMode > 0) delta *= 100;

        var scaleMultiplier = getScaleMultiplier(delta);

        if (scaleMultiplier !== 1) {
          var offset = transformOrigin
            ? getTransformOriginOffset()
            : getOffsetXY(e);
          publicZoomTo(offset.x, offset.y, scaleMultiplier);
          e.preventDefault();
        }
      }

      function getOffsetXY(e) {
        var offsetX, offsetY;
        // I tried using e.offsetX, but that gives wrong results for svg, when user clicks on a path.
        var ownerRect = owner.getBoundingClientRect();
        offsetX = e.clientX - ownerRect.left;
        offsetY = e.clientY - ownerRect.top;

        return { x: offsetX, y: offsetY };
      }

      function smoothZoom(clientX, clientY, scaleMultiplier) {
        var fromValue = transform.scale;
        var from = { scale: fromValue };
        var to = { scale: scaleMultiplier * fromValue };

        smoothScroll.cancel();
        cancelZoomAnimation();

        zoomToAnimation = animate(from, to, {
          step: function (v) {
            zoomAbs(clientX, clientY, v.scale);
          },
          done: triggerZoomEnd
        });
      }

      function smoothZoomAbs(clientX, clientY, toScaleValue) {
        var fromValue = transform.scale;
        var from = { scale: fromValue };
        var to = { scale: toScaleValue };

        smoothScroll.cancel();
        cancelZoomAnimation();

        zoomToAnimation = animate(from, to, {
          step: function (v) {
            zoomAbs(clientX, clientY, v.scale);
          }
        });
      }

      function getTransformOriginOffset() {
        var ownerRect = owner.getBoundingClientRect();
        return {
          x: ownerRect.width * transformOrigin.x,
          y: ownerRect.height * transformOrigin.y
        };
      }

      function publicZoomTo(clientX, clientY, scaleMultiplier) {
        smoothScroll.cancel();
        cancelZoomAnimation();
        return zoomByRatio(clientX, clientY, scaleMultiplier);
      }

      function cancelZoomAnimation() {
        if (zoomToAnimation) {
          zoomToAnimation.cancel();
          zoomToAnimation = null;
        }
      }

      function getScaleMultiplier(delta) {
        var sign = Math.sign(delta);
        var deltaAdjustedSpeed = Math.min(0.25, Math.abs(speed * delta / 128));
        return 1 - sign * deltaAdjustedSpeed;
      }

      function triggerPanStart() {
        if (!panstartFired) {
          triggerEvent('panstart');
          panstartFired = true;
          smoothScroll.start();
        }
      }

      function triggerPanEnd() {
        if (panstartFired) {
          // we should never run smooth scrolling if it was multiTouch (pinch zoom animation):
          if (!multiTouch) smoothScroll.stop();
          triggerEvent('panend');
        }
      }

      function triggerZoomEnd() {
        triggerEvent('zoomend');
      }

      function triggerEvent(name) {
        api.fire(name, api);
      }
    }

    function parseTransformOrigin(options) {
      if (!options) return;
      if (typeof options === 'object') {
        if (!isNumber(options.x) || !isNumber(options.y))
          failTransformOrigin(options);
        return options;
      }

      failTransformOrigin();
    }

    function failTransformOrigin(options) {
      console.error(options);
      throw new Error(
        [
          'Cannot parse transform origin.',
          'Some good examples:',
          '  "center center" can be achieved with {x: 0.5, y: 0.5}',
          '  "top center" can be achieved with {x: 0.5, y: 0}',
          '  "bottom right" can be achieved with {x: 1, y: 1}'
        ].join('\n')
      );
    }

    function noop() { }

    function validateBounds(bounds) {
      var boundsType = typeof bounds;
      if (boundsType === 'undefined' || boundsType === 'boolean') return; // this is okay
      // otherwise need to be more thorough:
      var validBounds =
        isNumber(bounds.left) &&
        isNumber(bounds.top) &&
        isNumber(bounds.bottom) &&
        isNumber(bounds.right);

      if (!validBounds)
        throw new Error(
          'Bounds object is not valid. It can be: ' +
          'undefined, boolean (true|false) or an object {left, top, right, bottom}'
        );
    }

    function isNumber(x) {
      return Number.isFinite(x);
    }

    // IE 11 does not support isNaN:
    function isNaN$1(value) {
      if (Number.isNaN) {
        return Number.isNaN(value);
      }

      return value !== value;
    }

    function rigidScroll() {
      return {
        start: noop,
        stop: noop,
        cancel: noop
      };
    }

    function autoRun() {
      if (typeof document === 'undefined') return;

      var scripts = document.getElementsByTagName('script');
      if (!scripts) return;
      var panzoomScript;

      for (var i = 0; i < scripts.length; ++i) {
        var x = scripts[i];
        if (x.src && x.src.match(/\bpanzoom(\.min)?\.js/)) {
          panzoomScript = x;
          break;
        }
      }

      if (!panzoomScript) return;

      var query = panzoomScript.getAttribute('query');
      if (!query) return;

      var globalName = panzoomScript.getAttribute('name') || 'pz';
      var started = Date.now();

      tryAttach();

      function tryAttach() {
        var el = document.querySelector(query);
        if (!el) {
          var now = Date.now();
          var elapsed = now - started;
          if (elapsed < 2000) {
            // Let's wait a bit
            setTimeout(tryAttach, 100);
            return;
          }
          // If we don't attach within 2 seconds to the target element, consider it a failure
          console.error('Cannot find the panzoom element', globalName);
          return;
        }
        var options = collectOptions(panzoomScript);
        console.log(options);
        window[globalName] = createPanZoom(el, options);
      }

      function collectOptions(script) {
        var attrs = script.attributes;
        var options = {};
        for (var j = 0; j < attrs.length; ++j) {
          var attr = attrs[j];
          var nameValue = getPanzoomAttributeNameValue(attr);
          if (nameValue) {
            options[nameValue.name] = nameValue.value;
          }
        }

        return options;
      }

      function getPanzoomAttributeNameValue(attr) {
        if (!attr.name) return;
        var isPanZoomAttribute =
          attr.name[0] === 'p' && attr.name[1] === 'z' && attr.name[2] === '-';

        if (!isPanZoomAttribute) return;

        var name = attr.name.substr(3);
        var value = JSON.parse(attr.value);
        return { name: name, value: value };
      }
    }

    autoRun();

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
        if(typeof value1 !== typeof value2) {
            return false;
        }
        // if (value1 !== Object(value1)) {
        //     // non equal primitives
        //     return false;
        // }
        // if (!value1) {
        //     return false;
        // }
        if (Array.isArray(value1)) {
            return compareArrays(value1, value2);
        }
        if(typeof value1 === 'object' && typeof value2 === 'object') {
            if ((value1 instanceof Map) && (value2 instanceof Map)) {
                return compareArrays([...value1.entries()], [...value2.entries()]);
            }
            if ((value1 instanceof Set) && (value2 instanceof Set)) {
                return compareArrays(Array.from(value1), Array.from(value2));
            }

            return compareObjects(value1, value2);
        }

        return compareNativeSubrefs(value1, value2);
    }

    function compareNativeSubrefs(value1, value2) {
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
            if (value1[key1] === value2[key1]) {
                continue;
            }

            // if(value1[key1]?._Proxy && value2[key1]?._Proxy 
            //     && value1[key1]._value === value2[key1]._value) {
            //     continue;
            // }

            return false;

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
        let res = Object.create(null);
        let resolved = false;
        return new Proxy(res, {
        get: (_, prop) => {
            if (prop === "_Proxy") {
                return true;
            } else if (prop === "_nodeid") {
                return input.from;
            } if (prop === 'toJSON') {
                return () => resolved ? res : {Proxy: input.from}
            }

            if (!resolved) {
                res = run_with_val(input.from)(graph_input_value);
                resolved = true;
            }


            if (prop === "_value") {
                return res
            } else if(!res) {
                return res;
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

            return typeof res === 'object' ? Reflect.ownKeys(res) : undefined;
        },
        getOwnPropertyDescriptor: (target, prop) => {
            if (!resolved) {
                res = run_with_val(input.from)(graph_input_value);
                resolved = true;
            }

            return typeof res === 'object' && !!res ? (Reflect.getOwnPropertyDescriptor(res, prop) || {value: objectSafeGet(target, prop)}) : undefined;
        }
    })
    };

    const resolve = (o) => {
        if (o?._Proxy) {
            return resolve(o._value)
        } else if (Array.isArray(o)) {
            const new_arr = [];
            let same = true;
            let i = o.length;
            while(i > 0) {
                i--;
                new_arr[i] = resolve(o[i]);
                same = same && o[i] === new_arr[i];
            }
            return same ? o : new_arr;
        } else if (typeof o === 'object' && !!o && o._needsresolve) {
            const entries = Object.entries(o);
            if(entries.length === 0) {
                return o;
            }

            let i = entries.length;
            let j = 0;
            let same = true;
            let new_obj_entries = [];
            let promise = false;
            while(i > 0) {
                i--;
                if(entries[i][0] !== '_needsresolve') {
                    new_obj_entries[j] = [entries[i][0], resolve(entries[i][1])];
                    same = same && entries[i][1] === new_obj_entries[j][1];
                    promise = promise || ispromise(new_obj_entries[j][1]);
                    j++;
                }
            }
            return same ? (delete o._needsresolve, o) : promise 
                ? Promise.all(new_obj_entries.map(kv => Promise.resolve(kv[1]).then(v => [kv[0], v])))
                    .then(kvs => Object.fromEntries(kvs)) 
                : Object.fromEntries(new_obj_entries);
        } else {
            return o;
        }
    };

    class NodysseusError extends Error {
        constructor(node_id, ...params) {
            super(...params);

            if (Error.captureStackTrace) {
                Error.captureStackTrace(this, NodysseusError);
            }

            this.node_id = node_id;
        }
    }

    const executeGraph = ({ cache, graph, cache_id}) => {
        let usecache = true;

        if (!cache.has(cache_id)) {
            cache.set(cache_id, new Map([["__handles", 1]]));
        } else {
            cache.get(cache_id).set("__handles", cache.get(cache_id).get("__handles") + 1);
        }

        if (!graph.nodes) {
            throw new Error(`Graph has no nodes! in: ${graph.in} out: ${graph.out}`)
        }

        if(graph._Proxy) {
            graph = graph._value;
        }

        const run_with_val = (node_id) => {
            return (graph_input_value) => {
                let is_node_cached = lib.no.runtime.is_cached(graph, node_id);
                let node = lib.no.runtime.get_node(graph, node_id);

                if(node === undefined) {
                    throw new Error(`Undefined node_id ${node_id}`)
                }

                const inputs = lib.no.runtime.get_edges_in(graph, node_id);

                if (node.ref === "arg" && (!inputs || inputs.length === 0)) {
                    return lib.utility.arg.fn(node, graph_input_value);
                }

                if (node.value !== undefined && !node.script && !node.ref) {
                    if(typeof node.value === 'string' && node.value.match(/[0-9]*/g)[0].length === node.value.length) {
                        const int = parseInt(node.value);
                        if(!isNaN(int)){
                            return int;
                        }
                    }

                    if(typeof node.value === 'string' && node.value.match(/[0-9.]*/g)[0].length === node.value.length) {
                        const float = parseFloat(node.value);
                        if(!isNaN(float)) {
                            return float;
                        }
                    }

                    if(typeof node.value !== 'string') {
                        return node.value;
                    }

                    
                    if(node.value.startsWith('{') || node.value.startsWith('[')) {
                        try {
                            return  JSON.parse(node.value.replaceAll("'", "\""));
                        } catch(e) { }
                    }

                    return node.value;
                }

                let node_ref;

                const ref = node.ref?.node_ref ?? typeof node.ref === 'string' ? node.ref : undefined;
                if (ref) {
                    node_ref = lib.no.runtime.get_node(graph, ref);
                    if(!node_ref) {
                        throw new Error(`Unable to find ref ${ref} for node ${node.name ?? node.id}`)
                    }
                } else {
                    node_ref = node;
                }

                let _needsresolve = false;

                const tryrun = (input) => {
                    if (input.type === "ref") {
                        return input.from;
                    } else if (input.from === "_graph_input_value" || input.from === graph.in) {
                        _needsresolve = _needsresolve || !!graph_input_value._needsresolve;
                        return graph_input_value;
                    } else if (input.type === "resolve") {
                        // if(!node_map.has(input.from)) {
                        //     throw new Error(`Input not found ${input.from} for node ${node_id}`)
                        // }

                        return resolve(run_with_val(input.from)(graph_input_value));
                    } else if (!input.as || node_ref.script) {
                        // if(!node_map.has(input.from)) {
                        //     throw new Error(`Input not found ${input.from} for node ${node_id}`)
                        // }

                        let res = run_with_val(input.from)(graph_input_value);

                        while (res?._Proxy) {
                            res = res._value;
                        }
                        
                        _needsresolve = _needsresolve || (!!res && typeof res === 'object' && !!res._needsresolve);

                        return res;
                    } else {
                        _needsresolve = true;
                        return createProxy(run_with_val, input, graph_input_value);
                    }
                };

                const input_data_map = new Map();
                let i = inputs.length;
                while(i > 0) {
                    i--;
                    input_data_map.set(inputs[i].from, tryrun(inputs[i]));
                }
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
                            Object.assign(data, state_data);//, {_needsresolve: !!data._needsresolve || !!state_data._needsresolve});
                        }
                    }
                }

                if (node_ref.nodes) {
                    const outid = `${node.id}/${node_ref.out ?? 'out'}`;
                    const combined_data_input = typeof graph_input_value === 'object' && !Array.isArray(graph_input_value) && data
                            ? Object.assign({}, graph_input_value, data) 
                            : inputs.length > 0 
                            ? data
                            : graph_input_value;

                    let hit = false;
                    if (!lib.no.runtime.get_node(graph, outid)) {
                        lib.no.runtime.expand_node(graph, node.id, node_ref);
                    }

                    if (is_node_cached && cache.get(cache_id).has(outid)) {
                        const val = cache.get(cache_id).get(outid);
                        hit = compare(val[1], combined_data_input);
                        if (hit) {
                            return val[0];
                        }
                    }

                    const res = run_with_val(outid)(combined_data_input);
                    if(typeof res === 'object' && !!res && !res._Proxy && !Array.isArray(res) && Object.keys(res).length > 0) {
                        if(_needsresolve || !!res._needsresolve) {
                            res._needsresolve = !!res._needsresolve || _needsresolve;
                        } else if(res.hasOwnProperty("_needsresolve")) {
                            delete res._needsresolve;
                        }
                    }
                    cache.get(cache_id).set(outid, [res, combined_data_input]);
                    return res;
                } else if (node_ref.script) {
                    const argset = new Set();
                    argset.add('_lib');
                    argset.add('_node');
                    argset.add('_node_inputs');
                    argset.add('_graph');
                    (inputs ?? []).map(i => i.as).forEach(i => i && argset.add(i));
                    let orderedargs = "";
                    const input_values = [];
                    for(let a of argset) {
                        input_values.push(
                            a === '_node' 
                            ? node 
                            : a === '_lib'
                            ? lib
                            : a === '_node_inputs'
                            ? data
                            : a === '_graph'
                            ? graph
                            : data[a]);
                        orderedargs += `${a},`;
                    }

                    if (is_node_cached && cache.get(cache_id).has(node.id)) {
                        const val = cache.get(cache_id).get(node.id);
                        let hit = compare(data, val[1]);
                        // hit = hit && compare(graph_input_value, val[2]);
                        if (hit) {
                            return val[0]
                        }
                    }


                    try {
                        const fn = lib.no.runtime.get_fn(graph, orderedargs, node_ref);

                        const is_iv_promised = input_values.reduce((acc, iv) => acc || ispromise(iv), false);
                        const results = is_iv_promised 
                            ? Promise.all(input_values.map(iv => Promise.resolve(iv))).then(iv => fn.apply(null, iv))
                            : fn.apply(null, input_values);

                        // don't cache things without arguments
                        // if (node_ref.args?.length > 0) {
                            cache.get(cache_id).set(node.id, [results, data]);
                        // }

                        if(typeof results === 'object' && !!results && !results._Proxy && !Array.isArray(results) && Object.keys(results).length > 0) {
                            if(_needsresolve || !!results._needsresolve) {
                                results._needsresolve = !!results._needsresolve || _needsresolve;
                            } else if(results.hasOwnProperty("_needsresolve")) {
                                delete results._needsresolve;
                            }
                        }

                        return results;
                    } catch (e) {
                        console.log(`error in node`);
                        console.error(e);
                        console.dir(node_ref);
                        console.log(data);
                        throw new AggregateError([
                            new NodysseusError(
                                node_id, 
                                e instanceof AggregateError ? "Error in node chain" : e
                            )]
                            .concat(e instanceof AggregateError ? e.errors : []));
                    }
                } else if(node_ref.extern) {
                    const extern = objectSafeGet(lib, node_ref.extern);
                    const args = extern.args.reduce((acc, arg) => {
                            if(arg === '_node'){
                                return [acc[0].concat([node]), acc[1]];
                            } else if (arg === '_node_inputs') {
                                return [acc[0].concat(extern.resolve ? resolve({...data, _needsresolve: true}) : data), acc[1]]
                            } else if (arg === '_graph') {
                                return [acc[0].concat(graph), acc[1]]
                            }
                            const value = extern.resolve === false ? data[arg] : resolve(data[arg]);
                            return [acc[0].concat([value]), ispromise(value) || acc[1]];
                        }, [[], false]);

                    try {
                        if (usecache && is_node_cached && cache.get(cache_id).has(node.id)) {
                            const val = cache.get(cache_id).get(node.id);
                            let hit = compare(args[0], val[1]);
                            // hit = hit && compare(graph_input_value, val[2]);
                            if (hit) {
                                return val[0]
                            }
                        }

                        if(args[1]) {
                            return Promise.all(args[0]).then(as => {
                                const res = extern.fn.apply(null, as);
                                cache.get(cache_id).set(node_id, [res, args[0]]);
                                return res;
                            })
                        } else {
                            const res = extern.fn.apply(null, args[0]);
                            cache.get(cache_id).set(node_id, [res, args[0]]);
                            return res;
                        }
                    } catch(e) {
                        throw new AggregateError([
                            new NodysseusError(
                                node_ref.id, 
                                e instanceof AggregateError ? "Error in node chain" : e
                            )]
                            .concat(e instanceof AggregateError ? e.errors : []));
                    }
                }

                if (is_node_cached && cache.get(cache_id).has(node.id)) {
                    const val = cache.get(cache_id).get(node.id);
                    let hit = compare(data, val[1]);
                    // hit = hit && compare(graph_input_value, val[2]);
                    if (hit) {
                        return val[0];
                    }
                }


                if(typeof data === 'object' && !!data && !data._Proxy && !Array.isArray(data) && Object.keys(data).length > 0) {
                    data._needsresolve = true;
                }

                const promised_data = Object.entries(data).reduce((acc, kv) => [acc[0].concat([kv]), acc[1] || (!!kv[1] && !kv[1]?._Proxy && ispromise(kv[1]))], [[], false]);
                
                if(promised_data[1]) {
                    return Promise.all(promised_data[0].map(kv => Promise.resolve(kv[1]).then(v => [kv[0], v])))
                        .then(Object.fromEntries)
                        .then(res => (cache.get(cache_id).set(node.id, [res, data]), res));
                }

                cache.get(cache_id).set(node.id, [data, data]);

                return data;
            }
        };

        return (node_id) => (graph_input_value) => resolve(run_with_val(node_id)(graph_input_value));
    };

    //////////
    // TODO: convert these to nodes

    const calculateLevels = (nodes, links, graph, selected) => {
        const find_childest = n => {
            const e = graph.edges.find(ed => ed.from === n);
            if (e) {
                return find_childest(e.to);
            } else {
                return n;
            }
        };
        selected = selected[0];
        const top = find_childest(selected);

        const levels = new Map();
        bfs(graph, (id, level) => levels.set(id, Math.min(levels.get(id) ?? Number.MAX_SAFE_INTEGER, level)))(top, 0);

        const parents = new Map(nodes.map(n => [n.node_id, links.filter(l => l.target.node_id === n.node_id).map(l => l.source.node_id)]));

        [...parents.values()].forEach(nps => {
            nps.sort((a, b) => parents.get(b).length - parents.get(a).length);
            for(let i = 0; i < nps.length * 0.5; i++) {
                if(i % 2 === 1) {
                    const tmp = nps[i];
                    const endidx = nps.length - 1 - Math.floor(i / 2);
                    nps[i] = nps[endidx];
                    nps[endidx] = tmp;
                }
            }
        });

        const children = new Map(nodes
            .map(n => [n.node_id, 
                links.filter(l => l.source.node_id === n.node_id)
                .map(l => l.target.node_id)
            ]));
        const siblings = new Map(nodes.map(n => [n.node_id, [...(new Set(children.get(n.node_id)?.flatMap(c => parents.get(c) ?? []) ?? [])).values()]]));
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
        };

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
    };

    const bfs = (graph, fn) => {
        const visited = new Set();
        const iter = (id, level) => {
            if (visited.has(id)) {
                return;
            }

            fn(id, level);

            visited.add(id);

            for (const e of graph.edges) {
                if (e.to === id) {
                    iter(e.from, level + 1);
                }
            }
        };

        return iter;
    };

    const updateSimulationNodes = (dispatch, data) => {
        if(data.static) {
            const top = data.display_graph.out;
            const levels = new Map();
            const nodes = new Map();
            bfs(data.display_graph, (id, level) => {
                levels.set(id, Math.min(levels.get(id) ?? Number.MAX_SAFE_INTEGER, level));
                nodes.set(id, data.display_graph.nodes.find(n => n.id === id));
            })(top, 0);

            const parents = new Map([...nodes.values()].map(n => {
                const nps = data.display_graph.edges.filter(e => e.to === n.id).map(e => e.from);
                return [ n.id, nps]
            }));

            [...parents.values()].forEach(nps => {
                nps.sort((a, b) => parents.get(b).length - parents.get(a).length);
                for(let i = 0; i < nps.length * 0.5; i++) {
                    if(i % 2 === 1) {
                        const tmp = nps[i];
                        const endidx = nps.length - 1 - Math.floor(i / 2);
                        nps[i] = nps[endidx];
                        nps[endidx] = tmp;
                    }
                }
            });

            const children = new Map([...nodes.values()]
                .map(n => [n.id, data.display_graph.edges
                .filter(e => e.from === n.id)
                .map(e => e.to)]
            ));

            [...levels.entries()].reduce((acc, [n, l]) => (acc[l] ? acc[l].push(n) : acc[l] = [n], acc), {});

            const node_el_width = 196;
            const node_positions = new Map();
            [...nodes.values()].forEach(n => {
                const child = children.get(n.id)?.length ? children.get(n.id)[0] : 0;
                const parents_count = Math.min(8, parents.get(n.id)?.length) ?? 0;
                const siblings = children.get(n.id)?.length ? parents.get(children.get(n.id)[0]) : [n.id];
                const sibling_count = Math.max(siblings.length, 4);
                const increment = Math.PI * 2 / (Math.max(1, sibling_count - 1) * (Math.pow(Math.PI, 2 * (levels.get(n.id) - 1)) + 1));
                const offset = child ? node_positions.get(child)[2] : 0;
                const theta = ((siblings.findIndex(l => l == n.id) - (siblings.length === 1 ? 0 : 0.5)) * increment) + offset;
                const dist = !child ? 0 : (node_el_width * 0.75
                    + node_positions.get(child)[3]
                    + node_el_width * 0.25 * parents_count
                );
                    //+ (child ? node_positions.get(child)[3] : 0);

                node_positions.set(n.id,
                    [
                        n,
                        n.id + (children.get(n.id)?.length ? '_' + children.get(n.id)[0] : ''),
                        theta,
                        dist
                    ]);
            });

            for(let np of node_positions.values()) {
                const theta = np[2];
                const dist = np[3];
                np[2] = -dist * Math.cos(theta);
                np[3] = -dist * Math.sin(theta);
            }

            const node_data = {
                nodes: [...node_positions.values()].map(([n, c, x, y]) => ({
                    node_id: n.id,
                    node_child_id: c,
                    nested_node_count: n.nodes?.length,
                    nested_edge_count: n.edges?.length,
                    x,
                    y
                })),
                links: data.display_graph.edges.filter(e => levels.has(e.to)).map(e => ({
                    source: {
                        node_child_id: node_positions.get(e.from)[1],
                        node_id: node_positions.get(e.from)[0].id,
                        x: Math.floor(node_positions.get(e.from)[2]),
                        y: Math.floor(node_positions.get(e.from)[3])
                    },
                    target: {
                        node_child_id: node_positions.get(e.to)[1],
                        node_id: node_positions.get(e.to)[0].id,
                        x: Math.floor(node_positions.get(e.to)[2]),
                        y: Math.floor(node_positions.get(e.to)[3])
                    },
                    sibling_index_normalized: 0
                }))
            };
            requestAnimationFrame(() => {
                dispatch(s => s ? [resolve(data.sim_to_hyperapp), node_data] : s);
                requestAnimationFrame(() => {
                    node_data.nodes.forEach(n => {
                        const el = document.getElementById(`${data.html_id}-${n.node_child_id}`);
                        if(el) {
                            const x = n.x - node_el_width * 0.5;
                            const y = n.y ;
                            el.setAttribute('x', Math.floor(x - 20));
                            el.setAttribute('y', Math.floor(y - 20));
                        }
                    });

                    node_data.links.forEach(l => {
                        const el = document.getElementById(`link-${l.source.node_child_id}`);
                        const info_el = document.getElementById(`edge-info-${l.source.node_child_id}`);
                        const insert_el = document.getElementById(`insert-${l.source.node_child_id}`);
                        if(el && info_el) {
                            const source = {x: l.source.x - node_el_width * 0.5, y: l.source.y};
                            const target = {x: l.target.x - node_el_width * 0.5, y: l.target.y};
                            const length_x = Math.abs(source.x - target.x); 
                            const length_y = Math.abs(source.y - target.y); 
                            const length = Math.sqrt(length_x * length_x + length_y * length_y); 
                            const lerp_length = 24;
                            // return {selected_distance, selected_edge, source: {...source, x: source.x + (target.x - source.x) * lerp_length / length, y: source.y + (target.y - source.y) * lerp_length / length}, target: {...target, x: source.x + (target.x - source.x) * (1 - (lerp_length / length)), y: source.y + (target.y - source.y) * (1 - (lerp_length / length))}}"
                            el.setAttribute('x1', Math.floor(Math.floor(source.x + (target.x - source.x) * lerp_length / length)));
                            el.setAttribute('y1', Math.floor(Math.floor(source.y + (target.y - source.y) * lerp_length / length)));
                            el.setAttribute('x2', Math.floor(Math.floor(source.x + (target.x - source.x) * (1 - lerp_length / length))));
                            el.setAttribute('y2', Math.floor(Math.floor(source.y + (target.y - source.y) * (1 - lerp_length / length))));

                            info_el.setAttribute('x', Math.floor((l.sibling_index_normalized * 0.2 + 0.2) * (target.x - source.x) + source.x) + 16);
                            info_el.setAttribute('y', Math.floor((l.sibling_index_normalized * 0.2 + 0.2) * (target.y - source.y) + source.y));

                            if(insert_el) {
                                insert_el.setAttribute('x', Math.floor(Math.floor((source.x + target.x) * 0.5)));
                                insert_el.setAttribute('y', Math.floor(Math.floor((source.y + target.y) * 0.5)));
                            }
                        }
                    });

                    dispatch(s => s?.panzoom_selected_effect ? [s, [s.panzoom_selected_effect, {...s, ...node_data, selected: s.selected[0]}]] : s);
                });
            });
            return;
        }

        const simulation_node_data = new Map();
        data.simulation.nodes().forEach(n => {
            simulation_node_data.set(n.node_child_id, n);
        });

        const start_sim_node_size = simulation_node_data.size;
        
        const simulation_link_data = new Map();
        data.simulation.force('links').links().forEach(l => {
            simulation_link_data.set(l.source.node_child_id, l);
        });

        const start_sim_link_size = simulation_link_data.size;

        const main_node_map = new Map();

        const node_map = new Map(data.display_graph.nodes.map(n => [n.id, n]));
        const children_map = new Map(data.display_graph.nodes.map(n => [n.id, 
            data.display_graph.edges
                .filter(e => e.from === n.id)
                .map(e => e.to)
        ]));

        const order = [];
        const queue = [data.display_graph.out];

        const parents_map = new Map(data.display_graph.nodes.map(n => [n.id, 
            data.display_graph.edges
                .filter(e => e.to === n.id)
                .map(e => e.from)
            ]));

        while(queue.length > 0) {
            const node = queue.shift();
            order.push(node);

            const children = children_map.get(node);
            const node_child_id = children.length > 0 ? node + "_" + children[0] : node;
            main_node_map.set(node, node_child_id);

            parents_map.get(node).forEach(p => {queue.push(p);});
        }


        for(let ps of parents_map.values()) {
            let i = 0;
            ps.sort((a, b) => parents_map.get(a).length === parents_map.get(b).length 
                ? (simulation_node_data.get(main_node_map.get(a))?.hash ?? hashcode(a)) - (simulation_node_data.get(main_node_map.get(b)) ?? hashcode(b))
                : ((i++ % 2) * 2 - 1) * (parents_map.get(b).length - parents_map.get(a).length));
        }
        //// pushes all root nodes, not just display_graph.out
        // data.display_graph.nodes.forEach(n => {
        //     const children = children_map.get(n.id);
        //     const node_child_id = children.length > 0 ? n.id + "_" + children[0] : n.id;
        //     main_node_map.set(n.id, node_child_id);

            // if(children_map.get(n.id).length === 0) {
            //     queue.push(n.id);
            // }
        // });
        

        const nodes = order.flatMap(nid => {
            let n = node_map.get(nid);
            const children = children_map.get(n.id);
            const node_child_id = main_node_map.get(n.id);

            const node_hash = simulation_node_data.get(node_child_id)?.hash ?? hashcode(nid);
            const randpos = {x: (((node_hash * 0.254) % 256.0) / 256.0), y: ((node_hash * 0.874) % 256.0) / 256.0};

            const addorundefined = (a, b) => {
                return a === undefined || b === undefined ? undefined : a + b
            };

            const calculated_nodes = children.length === 0 ? [{
                node_id: n.id,
                node_child_id: n.id,
                hash: simulation_node_data.get(node_child_id)?.hash ?? hashcode(n.id),
                nested_node_count: n.nodes?.length,
                nested_edge_count: n.edges?.length,
                x: Math.floor(simulation_node_data.get(node_child_id)?.x 
                    ?? simulation_node_data.get(main_node_map.get(parents_map.get(n.id)?.[0]))?.x
                    ?? Math.floor(window.innerWidth * (randpos.x * .5 + .25))),
                y: Math.floor(simulation_node_data.get(node_child_id)?.y 
                    ?? addorundefined(simulation_node_data.get(main_node_map.get(parents_map.get(n.id)?.[0]))?.y, 128)
                    ?? Math.floor(window.innerHeight * (randpos.y * .5 + .25)))
            }] : children.map((c, i) => ({
                node_id: n.id,
                node_child_id: n.id + "_" + c,
                hash: simulation_node_data.get(node_child_id)?.hash ?? hashcode(n.id),
                sibling_index_normalized: parents_map.get(c).findIndex(p => p === n.id) / parents_map.get(c).length,
                nested_node_count: n.nodes?.length,
                nested_edge_count: n.edges?.length,
                x: Math.floor(simulation_node_data.get(node_child_id)?.x 
                    ?? simulation_node_data.get(main_node_map.get(parents_map.get(n.id)?.[0]))?.x
                    ?? addorundefined(
                        simulation_node_data.get(main_node_map.get(children_map.get(n.id)?.[0]))?.x, 
                        (parents_map.get(children_map.get(n.id)?.[0])?.findIndex(v => v === n.id) - (parents_map.get(children_map.get(n.id)?.[0])?.length - 1) * 0.5) * 256
                    )
                    ?? Math.floor(window.innerWidth * (randpos.x * .5 + .25))),
                y: Math.floor(simulation_node_data.get(node_child_id)?.y 
                    ?? addorundefined(256, simulation_node_data.get(main_node_map.get(parents_map.get(n.id)?.[0]))?.y)
                    ?? addorundefined(
                        -(196 + 32 * (parents_map.get(n.id).length ?? 0)),
                        simulation_node_data.get(main_node_map.get(children_map.get(n.id)?.[0]))?.y
                    )
                    ?? Math.floor(window.innerHeight * (randpos.y * .5 + .25)))
            }));

            calculated_nodes.map(n => simulation_node_data.set(n.node_child_id, n));

            return calculated_nodes;
        });

        const links = data.display_graph.edges
            .filter(e => main_node_map.has(e.from) && main_node_map.has(e.to))
            .map(e => {
                if (!(main_node_map.has(e.from) && main_node_map.has(e.to))) {
                    // won't throw - just doesn't display non main-graph nodes
                    throw new Error(`edge node undefined ${main_node_map.has(e.from) ? '' : '>'}${e.from} ${main_node_map.has(e.to) ? '' : '>'}${e.to} `);
                }

                simulation_link_data.get(e.from + "_" + e.to);
                return {
                    source: e.from + "_" + e.to,
                    from: e.from,
                    to: e.to,
                    target: main_node_map.get(e.to),
                    sibling_index_normalized: simulation_node_data.get(e.from + "_" + e.to).sibling_index_normalized,
                    strength: 2 * (1.5 - Math.abs(simulation_node_data.get(e.from + "_" + e.to).sibling_index_normalized - 0.5)) / (1 + 2 * Math.min(4, (parents_map.get(main_node_map.get(e.from))?.length ?? 0))),
                    distance: 128 
                        + 16 * (Math.min(4, parents_map.get(main_node_map.get(e.to))?.length ?? 0)) 
                };
            }).filter(l => !!l);


        if (typeof (links?.[0]?.source) === "string") {
            if (
                simulation_node_data.size !== start_sim_node_size ||
                simulation_link_data.size !== start_sim_link_size || 
                data.simulation.nodes()?.length !== nodes.length ||
                data.simulation.force('links')?.links().length !== links.length) {
                data.simulation.alpha(0.4);
            }

            data.simulation.nodes(nodes);
            data.simulation.force('links').links(links);
            // data.simulation.force('fuse_links').links(data.fuse_links);
        }

        data.simulation.force('link_direction')
            .y(n =>
                (((parents_map.get(n.node_id)?.length > 0 ? 1 : 0)
                    + (children_map.get(n.node_id)?.length > 0 ? -1 : 0)
                    + (children_map.get(n.node_id)?.length > 0 && n.node_child_id !== n.node_id + "_" + children_map.get(n.node_id)[0] ? -1 : 0))
                    * 8 + .5) * window.innerHeight)
            .strength(n => (!!parents_map.get(n.node_id)?.length === !children_map.get(n.node_id)?.length)
                || children_map.get(n.node_id)?.length > 0 && n.node_child_id !== n.node_id + "_" + children_map.get(n.node_id)[0] ? .025 : 0);


        data.simulation.force('collide').radius(96);
        // data.simulation.force('center').strength(n => (levels.parents_map.get(n.node_id)?.length ?? 0) * 0.25 + (levels.children_map.get(n.node_id)?.length ?? 0) * 0.25)
    };

    const graphToSimulationNodes = (data, payload) => {

        return {
            ...data,
            nodes,
            links,
            fuse_links
        }
    };

    const listenToEvent = (dispatch, props) => {
        const listener = (event) => requestAnimationFrame(() => dispatch(props.action, event.detail));

        requestAnimationFrame(() => addEventListener(props.type, listener));
        return () => removeEventListener(props.type, listener);
    };

    const listen = (type, action) => [listenToEvent, {type, action}];

    const graph_subscription = (dispatch, props) => {
        const listener = (graph) => {
            requestAnimationFrame(() =>  {
                dispatch(s => [{...s, display_graph: graph}, [s.update_sim_effect]]);
            });
        };

        lib.no.runtime.add_listener(props.graph, 'graphchange', 'update_hyperapp', listener);
        return () => lib.no.runtime.remove_listener(props.graph, 'graphchange', 'update_hyperapp');
    };

    const result_subscription = (dispatch, props) => {
        const listener = (graph, result) =>
            requestAnimationFrame(() => 
                dispatch(s => Object.assign({}, s, {error: false}, result)));
        

        const error_listener = (graph, error) =>
            requestAnimationFrame(() => dispatch(s => Object.assign({}, s, {error, display_graph: graph})));

        lib.no.runtime.add_listener(props.graph, 'graphrun', 'update_hyperapp_result_display', listener);
        lib.no.runtime.add_listener(props.graph, 'grapherror', 'update_hyperapp_error', error_listener);

        return () => (
            lib.no.runtime.remove_listener(props.graph, 'graphrun', 'update_hyperapp_result_display', listener),
            lib.no.runtime.remove_listener(props.graph, 'grapherror', 'update_hyperapp_error', error_listener)
        );
    };

    // Creates the simulation, updates the node elements when the simulation changes, and runs an action when the nodes have settled.
    // This is probably doing too much.
    const d3subscription = (dispatch, props) => {
        const simulation = lib.d3.forceSimulation()
            .force('charge', lib.d3.forceManyBody().strength(-64).distanceMax(256).distanceMin(64).strength(0))
            .force('collide', lib.d3.forceCollide(64))
            .force('links', lib.d3
                .forceLink([])
                .distance(l => l.distance ?? 128)
                .strength(l => l.strength)
                .id(n => n.node_child_id))
            .force('link_direction', lib.d3.forceY().strength(.01))
            .force('center', lib.d3.forceCenter().strength(0.01))
            // .force('fuse_links', lib.d3.forceLink([]).distance(128).strength(.1).id(n => n.node_child_id))
            // .force('link_siblings', lib.d3.forceX().strength(1))
            // .force('selected', lib.d3.forceRadial(0, window.innerWidth * 0.5, window.innerHeight * 0.5).strength(2))
            .velocityDecay(0.7)
            .alphaMin(.25);

        const abort_signal = { stop: false };
        simulation.stop();
        let htmlid;
        let stopped = false;
        let selected;
        const node_el_width = 256;
        const tick = () => {
            if(simulation.nodes().length === 0) {
                dispatch(s => [(htmlid = s.html_id, {...s, simulation}), [props.update, s]]);
            }

            const data = {
                nodes: simulation.nodes().map(n => {
                    return ({ ...n, x: ( Math.floor(n.x)), y: Math.floor(n.y) })
                }),
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
                }))};


            if (simulation.alpha() > simulation.alphaMin()) {
                const ids = simulation.nodes().map(n => n.node_id).join(',');
                stopped = false;
                simulation.tick();
                dispatch([s => (selected = s.selected[0], s.nodes.map(n => n.node_id).join(',') !== ids ? [props.action, data] 
                        : s.panzoom_selected_effect ? [s, [s.panzoom_selected_effect, {...s, nodes: simulation.nodes().map(n => ({...n, x: n.x - 8, y: n.y})), links: simulation.force('links').links(), prevent_dispatch: true, selected: s.selected[0]}]] : s)]);
                const visible_node_set = new Set();

                simulation.nodes().map(n => {
                    const el = document.getElementById(`${htmlid}-${n.node_child_id}`);
                    if(el) {
                        const x = n.x - node_el_width * 0.5;
                        const y = n.y ;
                        el.setAttribute('x', Math.floor(x - 20));
                        el.setAttribute('y', Math.floor(y - 20));

                        if(n.node_id === selected) ;
                    }
                });


                simulation.force('links').links().map(l => {
                    const el = document.getElementById(`link-${l.source.node_child_id}`);
                    const info_el = document.getElementById(`edge-info-${l.source.node_child_id}`);
                    const insert_el = document.getElementById(`insert-${l.source.node_child_id}`);
                    if(el && info_el) {
                        const source = {x: l.source.x - node_el_width * 0.5, y: l.source.y};
                        const target = {x: l.target.x - node_el_width * 0.5, y: l.target.y};
                        const length_x = Math.abs(source.x - target.x); 
                        const length_y = Math.abs(source.y - target.y); 
                        const length = Math.sqrt(length_x * length_x + length_y * length_y); 
                        const lerp_length = 24;
                        // return {selected_distance, selected_edge, source: {...source, x: source.x + (target.x - source.x) * lerp_length / length, y: source.y + (target.y - source.y) * lerp_length / length}, target: {...target, x: source.x + (target.x - source.x) * (1 - (lerp_length / length)), y: source.y + (target.y - source.y) * (1 - (lerp_length / length))}}"
                        el.setAttribute('x1', Math.floor(Math.floor(source.x + (target.x - source.x) * lerp_length / length)));
                        el.setAttribute('y1', Math.floor(Math.floor(source.y + (target.y - source.y) * lerp_length / length)));
                        el.setAttribute('x2', Math.floor(Math.floor(source.x + (target.x - source.x) * (1 - lerp_length / length))));
                        el.setAttribute('y2', Math.floor(Math.floor(source.y + (target.y - source.y) * (1 - lerp_length / length))));

                        info_el.setAttribute('x', Math.floor((l.sibling_index_normalized * 0.2 + 0.2) * (target.x - source.x) + source.x) + 16);
                        info_el.setAttribute('y', Math.floor((l.sibling_index_normalized * 0.2 + 0.2) * (target.y - source.y) + source.y));

                        if(insert_el) {
                            insert_el.setAttribute('x', Math.floor((source.x + target.x) * 0.5 - 16));
                            insert_el.setAttribute('y', Math.floor((source.y + target.y) * 0.5 - 16));
                        }

                        if (l.source.node_id === selected) {
                            visible_node_set.add(l.target.node_id);
                        } else if (l.target.node_id === selected) {
                            visible_node_set.add(l.source.node_id);
                        }
                    }
                });

                // iterate again to get grandparents
                simulation.force('links').links().map(l => {
                    if(visible_node_set.has(l.target.node_id) && !visible_node_set.has(l.source.node_id)) {
                        ({x: l.source.x - node_el_width * 0.5, y: l.source.y});
                    }
                });
            } else if(!stopped) {
                stopped = true; 
                dispatch([props.action, data]);
                requestAnimationFrame(() => {
                    dispatch(s => s?.panzoom_selected_effect ? [s, [s.panzoom_selected_effect, {...s, selected: s.selected[0]}]] : s);
                });
            }

            if (!abort_signal.stop) {
                requestAnimationFrame(tick);
            }
        };

        requestAnimationFrame(tick);

        return () => { abort_signal.stop = true; }
    };

    const keydownSubscription = (dispatch, options) => {
        const handler = ev => {
            if (ev.key === "s" && ev.ctrlKey) {
                ev.preventDefault();
            } else if (!ev.key) {
                return;
            }

            requestAnimationFrame(() => dispatch(options.action, ev));
        };
        requestAnimationFrame(() => addEventListener('keydown', handler));
        return () => removeEventListener('keydown', handler);
    };

    const expand_node = (data) => {
        const node_id = data.node_id;
        const node = data.display_graph.nodes.find(n => n.id === node_id);

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

        return { display_graph: { ...data.display_graph, ...new_display_graph }, selected: [node_id + '/' + (node.out ?? 'out')] };
    };

    const contract_all = (graph) => {
        const node_ids = new Set(graph.nodes.map(n => n.id));
        let display_graph = graph;
        graph.nodes.forEach(g => {
            if (g.id.endsWith("/out") && !node_ids.has(g.id.substring(0, g.id.length - 4))) {
                display_graph = contract_node({ node_id: g.id, display_graph }, true);
            }
        });

        return display_graph;
    };

    const contract_node = (data, keep_expanded = false) => {
        const node = data.display_graph.nodes.find(n => n.id === data.node_id);
        if (!node.nodes) {
            const slash_index = data.node_id.lastIndexOf('/');
            const node_id = slash_index >= 0 ? data.node_id.substring(0, slash_index) : data.node_id;
            const name = data.name ?? node_id;

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
                            dangling.add(ie.to);
                        }
                    });
                }

                if (this_dangling === 0) {


                    in_edge.filter(ie => ie.from === e.from).forEach(ie => {
                        inside_edges.add(ie);
                    });
                    in_edge = in_edge.filter(ie => ie.from !== e.from);

                    const old_node = inside_nodes.find(i => e.from === i.id);
                    let inside_node = old_node ?? Object.assign({}, data.display_graph.nodes.find(p => p.id === e.from));

                    inside_node_map.set(inside_node.id, inside_node);
                    inside_edges.add(e);
                    if (!old_node) {
                        delete inside_node.inputs;
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

            let node_id_count = data.display_graph.nodes.filter(n => n.id === node_id).length;
            let final_node_id = node_id_count === 0 ? node_id : `${node_id}_${node_id_count}`;

            // if there's no in node, just return
            if (in_node_id && !in_node_id.endsWith('in')) {
                return {display_graph: data.display_graph, selected: [data.node_id]};
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
                });
            }

            const new_display_graph = {
                nodes: data.display_graph.nodes
                    .filter(n => n.id !== data.node_id)
                    .filter(n => keep_expanded || !inside_node_map.has(n.id))
                    .concat([{
                        id: final_node_id,
                        name: name === data.node_id ? data.node_name : name,
                        in: in_node_id?.startsWith(node_id + '/') ? in_node_id.substring(node_id.length + 1) : in_node_id,
                        out: out_node_id.startsWith(node_id + '/') ? out_node_id.substring(node_id.length + 1) : out_node_id,
                        nodes: inside_nodes.map(n => ({
                            ...n,
                            id: n.id.startsWith(node_id + "/") ? n.id.substring(node_id.length + 1) : n.id,
                            name: !n.name?.startsWith(name + "/") ? n.name : n.name.substring(name.length + 1)
                        })),
                        edges
                    }]),
                edges: data.display_graph.edges
                    .filter(e => keep_expanded || !(inside_node_map.has(e.from) && inside_node_map.has(e.to)))
                    .map(e =>
                        e.from === data.node_id ? { ...e, from: final_node_id }
                            : e.to === in_node?.id ? { ...e, to: final_node_id }
                                : inside_node_map.has(e.to)
                                    ? { ...e, to: final_node_id }
                                    : e
                    )
            };

            return { display_graph: { ...data.display_graph, ...new_display_graph }, selected: [final_node_id] };
        }
    };

    const flattenNode = (graph, levels = -1) => {
        if (graph.nodes === undefined || levels === 0) {
            return graph;
        }

        // needs to not prefix base node because then flatten node can't run  next
        const prefix = graph.id ? `${graph.id}/` : '';
        graph.id ? `${graph.name}/` : '';

        return graph.nodes
            .map(n => Object.assign({}, n, { id: `${prefix}${n.id}` }))
            .map(g => flattenNode(g, levels - 1))
            .reduce((acc, n) => Object.assign({}, acc, {
                flat_nodes: acc.flat_nodes.concat(n.flat_nodes?.flat() ?? []).map(fn => {
                    // adjust for easy graph renaming
                    if ((fn.id === prefix + (graph.out ?? "out")) && graph.name) {
                        fn.name = graph.name + "/out";
                    } else if (graph.in && (fn.id === prefix + (graph.in ?? "/in")) && graph.name) {
                        fn.name = graph.name + "/in";
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
    };

    const objToGraph = (obj, path) => Object.entries(obj)
        .filter(e => e[0] !== '_value')
        .map(e => [e[0], typeof e[1] === 'object' && !!e[1] && !Array.isArray(e[1])
                    ? Object.assign(e[1].hasOwnProperty('_value') ? {value: e[1]._value} : {}, objToGraph(e[1], path ? `${path}.${e[0]}` : e[0]))
                    : {value: e[1]}]
        ).reduce((acc, n) => ({
            nodes: acc.nodes.concat(n[1].nodes ?? [])
                .concat([Object.assign({id: path ? `${path}.${n[0]}` : n[0], name: n[0]}, 
                    n[1].hasOwnProperty('value') 
                        ? {value: n[1].value} 
                        : n[1].hasOwnProperty('_value') 
                        ? {value: n[1]._value} 
                        : {})]),
            edges: acc.edges.concat(n[1].edges ?? []).concat(path ? [{to: path, from: `${path}.${n[0]}`}] : [])
        })
        , {nodes: [], edges: []});

    const findViewBox = (nodes, links, selected, node_el_width, htmlid, dimensions) => {
        const visible_nodes = [];
        const visible_node_set = new Set();
        let selected_pos;
        links.forEach(l => {
            const el = document.getElementById(`link-${l.source.node_child_id}`);
            const info_el = document.getElementById(`edge-info-${l.source.node_child_id}`);
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
            const el = document.getElementById(`${htmlid}-${n.node_child_id}`);
            if(el) {
                const x = n.x - node_el_width * 0.5;
                const y = n.y ;

                if(n.node_id === selected) {
                    visible_nodes.push({x, y});
                    selected_pos = {x, y};
                }
            }
        });

        const nodes_box = visible_nodes.reduce((acc, n) => ({min: {x: Math.min(acc.min.x, n.x - 24), y: Math.min(acc.min.y, n.y - 24)}, max: {x: Math.max(acc.max.x, n.x + node_el_width * 0.5 - 24), y: Math.max(acc.max.y, n.y + 24)}}), {min: {x: selected_pos ? (selected_pos.x - 96) : dimensions.x , y: selected_pos ? (selected_pos.y - 256) : dimensions.y}, max: {x: selected_pos ? (selected_pos.x + 96) : -dimensions.x, y: selected_pos ? (selected_pos.y + 128) : -dimensions.y}});
        const nodes_box_center = {x: (nodes_box.max.x + nodes_box.min.x) * 0.5, y: (nodes_box.max.y + nodes_box.min.y) * 0.5}; 
        const nodes_box_dimensions = {x: Math.max(dimensions.x * 0.5, Math.min(dimensions.x, (nodes_box.max.x - nodes_box.min.x))), y: Math.max(dimensions.y * 0.5, Math.min(dimensions.y, (nodes_box.max.y - nodes_box.min.y)))};
        const center = !selected_pos ? nodes_box_center : {x: (selected_pos.x + nodes_box_center.x * 3) * 0.25, y: (selected_pos.y + nodes_box_center.y * 3) * 0.25};

        return {nodes_box_dimensions, center};
    };

    const middleware = dispatch => (ha_action, ha_payload) => {
        const is_action_array_payload = Array.isArray(ha_action) 
            && ha_action.length === 2
            && (typeof ha_action[0] === 'function' 
                    || (ha_action[0].hasOwnProperty('fn') 
                        && ha_action[0].hasOwnProperty('graph')));

        const is_action_obj_payload = typeof ha_action === 'object' 
            && ha_action.hasOwnProperty('fn') 
            && ha_action.hasOwnProperty('graph') 
            && ha_action.hasOwnProperty('args');
        const action = is_action_array_payload ? ha_action[0] : ha_action;
        const payload = is_action_array_payload ? ha_action[1] : is_action_obj_payload ? {...ha_action.args, event: ha_payload} : ha_payload;

        return typeof action === 'object' && action.hasOwnProperty('fn') && action.hasOwnProperty('graph')
            ? dispatch((state, payload) => {
                try {
                    const execute_graph_fn = lib.no.executeGraphNode({graph: action.graph})(action.fn);
                    Object.defineProperty(execute_graph_fn, 'name', {value: action.fn, writable: false});
                    const result = action.stateonly 
                        ? execute_graph_fn(state)
                        : execute_graph_fn({state, payload});

                    if(!result) {
                        return state;
                    }

                    const effects = (result.effects ?? []).filter(e => e).map(e => {
                        if(typeof e === 'object' 
                        && e.hasOwnProperty('fn') 
                        && e.hasOwnProperty('graph')) {
                            const effect_fn = lib.no.executeGraphNode({graph: e.graph})(e.fn);
                            Object.defineProperty(effect_fn, 'name', {value: e.fn, writable: false});
                            return effect_fn;
                        }
                        return e
                    });//.map(fx => ispromise(fx) ? fx.catch(e => dispatch(s => [{...s, error: e}])) : fx);

                    if (ispromise(result)) {
                        // TODO: handle promises properly
                        return state;
                    }

                    return result.hasOwnProperty("state")
                        ? effects.length > 0 ? [result.state, ...effects] : result.state
                        : result.hasOwnProperty("action") && result.hasOwnProperty("payload") 
                        ? [result.action, result.payload]
                        : state;
                } catch(e) {
                    return {...state, error: e}
                }
            }, payload)
            : dispatch(action, payload)
    };

    /////////////////////////////////

    const cache = new Map();

    const generic_nodes = new Set([
        "get",
        "set",
        "delete",
        "object",

        "switch",
        "if",
        "flow",

        "html",
        "html_element",
        "html_text",
        "toggle",
        "input",
        "css_styles",

        "array",
        "filter",
        "map",
        "append",

        "utility",
        "log",
        "execute_graph",
        "arg",
        "apply",
        "partial",
        "fetch",
        "call",
        "default",
        "merge_objects",
        "sequence",
        "runnable",
        "run",
        "dispatch_runnable",
        "object_entries",
        "import_json",
        "event_publisher",
        "event_subscriber",

        "math",
        "add",
        "divide",
        "mult",
        "negate",

        "JSON",
        "stringify",
        "parse",

        "state",
        "modify_state_runnable",
        "initial_state_runnable",
        "set_display",

        "custom"
    ]);

    const ispromise = a => a?._Proxy ? false : typeof a?.then === 'function';
    const getorset = (map, id, value_fn) => map.has(id) ? map.get(id) : (map.set(id, value_fn()), map.get(id));

    const lib = {
        just: { 
            get: {
                args: ['target', 'path', 'def'],
                fn: (target, path, def) => {
                    return objectSafeGet(target?._Proxy ? target._value : target, path?._Proxy ? path._value : path, def?._Proxy ? def._value : def);
                },
            },
            set: objectSafeSet, 
            diff,
            diffApply
        },
        ha: { h: {args: ['dom_type', 'props', 'children'], fn: h}, app, text: {args: ['text'], fn: text}, memo },
        no: {
            middleware,
            executeGraph: ({ state, graph, cache_id }) => executeGraph({ cache, state, graph, cache_id: cache_id ?? "main" })(graph.out)(state.get(graph.in)),
            executeGraphValue: ({ graph, cache_id }) => executeGraph({ cache, graph, cache_id: cache_id ?? "main" })(graph.out),
            executeGraphNode: ({ graph, cache_id }) => executeGraph({ cache, graph, cache_id: cache_id ?? "main" }),
            runGraph: (graph, node, args) => node !== undefined
                ? executeGraph({graph, cache, cache_id: "main"})(node)(args)
                : executeGraph({graph: graph.graph, cache, cache_id: "main"})(graph.fn)(graph.args),
            resolve,
            objToGraph,
            NodysseusError,
            runtime: (function(){
                const cache = new Map(); 
                const new_graph_cache = (graph) => () => ({
                    graph,
                    node_map: new Map(graph.nodes.map(n => [n.id, n])), 
                    in_edge_map: new Map(graph.nodes.map(n => [n.id, graph.edges.filter(e => e.to === n.id)])),
                    fn_cache: new Map(),
                    listeners: new Map()
                });
                const getorsetgraph = (graph, id, path, valfn) => getorset(getorset(cache, graph.id, new_graph_cache(graph))[path], id, valfn);
                const publish = (graph, event, data) => {
                    if(event === 'graphchange'){
                        cache.get(graph.id).graph = graph;
                    }
                    const listeners = getorsetgraph(graph, event, 'listeners', () => new Map());
                    for(let l of listeners.values()) {
                        if(typeof l === 'function') {
                            l(graph, data);
                        } else if(typeof fn === 'object' && fn.fn && fn.graph) {
                            lib.no.runGraph(fn.graph, fn.fn, Object.assign({}, fn.args ?? {}, {data}));
                        }
                    }

                };

                const rungraph = graph => {
                    cancelAnimationFrame(cache.get(graph.id).animrun);
                    cache.get(graph.id).animrun = requestAnimationFrame(() =>{
                        try {
                            const gcache = cache.get(graph.id);
                            const last_result = gcache.last_result;
                            const result = lib.no.runGraph(graph, graph.out ?? 'main/out', last_result ?? {});
                            Promise.resolve(result).then(res => {
                                gcache.last_result = res;
                                publish(graph, 'graphrun', res);
                            }).catch(e => publish(graph, 'grapherror', e));
                        } catch(e) {
                            publish(graph, 'grapherror', e);
                        }
                    });
                };

                const add_listener = (graph, event, listener_id, fn, remove) => {
                    if(remove) {
                        remove_listener(graph, event, listener_id);
                    }

                    const listeners = getorsetgraph(graph, event, 'listeners', () => new Map());
                    listeners.set(listener_id, fn);
                    
                    //TODO: rethink this maybe?
                    if(event !== 'graphchange') {
                        add_listener(graph, 'graphchange', 'rungraph', rungraph);
                    }
                };

                const remove_listener = (graph, event, listener_id) => {
                    const listeners = cache.get(graph.id).listeners;
                    for(let l of listeners.values()) {
                        l.delete(listener_id);
                    }
                    
                    //TODO: rethink this maybe?
                    if (listeners.size === 0) {
                        const graph_listeners = cache.get(graph.id).listeners;
                        graph_listeners.delete(event);
                        if (graph_listeners.size == 0 || 
                            (graph_listeners.size === 1 && graph_listeners.has('graphchange'))){
                            remove_listener(graph, 'graphchange', 'rungraph');
                        }
                    }
                };

                const update_graph = (graph) => {
                    graph = resolve(graph);
                    const new_cache = new_graph_cache(graph)();
                    cache.get(graph.id).node_map = new_cache.node_map;
                    cache.get(graph.id).in_edge_map = new_cache.in_edge_map;
                    publish(graph, 'graphchange');
                };

                const get_node = (graph, id) => getorsetgraph(resolve(graph), id, 'node_map', () => graph.nodes.find(n => n.id === id));
                const get_edges_in = (graph, id) => getorsetgraph(resolve(graph), id, 'in_edge_map', () => graph.edges.filter(e => e.to === id));

                return { 
                    add_graph: (graph) => {
                        const gcache = getorset(cache, graph.id, new_graph_cache(graph));
                        add_listener(graph, 'graphchange', 'update_gcache', g => gcache.graph = g);
                        publish(graph, 'graphchange');
                    },
                    is_cached: (graph, id) => getorset(cache, graph.id, new_graph_cache(graph)).node_map.has(id),
                    get_node,
                    get_edges_in,
                    get_fn: (graph, orderedargs, node_ref) => getorsetgraph(resolve(graph), orderedargs + node_ref.script, 'fn_cache', () => new Function(`return function _${(node_ref.name?.replace(/\W/g, "_") ?? node_ref.id).replace(/(\s|\/)/g, '_')}(${orderedargs}){${node_ref.script}}`)()),
                    update_graph,
                    edit_edge: (graph, edge, old_edge) => {
                        const gcache = getorset(cache, graph.id, new_graph_cache(resolve(graph)));
                        graph = gcache.graph;

                        gcache.in_edge_map.delete((old_edge ?? edge).to);
                        edge.as = edge.as ?? 'arg0';
                        // const next_edge = !edge.as 
                        //     ? lib.no.runGraph(cache.get('nodysseus_hyperapp').graph, 'next_edge', {edge, graph}) 
                        //     : edge;

                        const new_graph = {
                            ...graph,
                            edges: graph.edges.filter(e => !(e.to === (old_edge ?? edge).to && e.from === (old_edge ?? edge).from)).concat([edge])
                        };
                        publish(new_graph, 'graphchange');
                    },
                    add_node: (graph, node, edge) => {
                        console.log("adding");
                        // node = resolve(node);
                        // edge = resolve({...edge, _needsresolve: true});
                        const gcache = getorset(cache, graph.id, new_graph_cache(resolve(graph)));
                        graph = gcache.graph;
                        const graph_node = get_node(graph, node.id);


                        const old_edge_out = graph.edges.find(e => e.from === node.id);

                        gcache.node_map.delete(node.id);
                        gcache.in_edge_map.delete(node.id);
                        gcache.in_edge_map.delete(old_edge_out?.to);
                        gcache.fn_cache.delete(node.id);

                        if (graph_node?.nodes || graph_node?.ref && get_node(graph, graph_node.ref).nodes) {
                            for(let k of gcache.node_map.keys()) {
                                if(k.startsWith(node.id)) {
                                    gcache.node_map.delete(k);
                                }
                            }

                            for(let k of gcache.in_edge_map.keys()) {
                                if(k.startsWith(node.id)) {
                                    gcache.in_edge_map.delete(k);
                                }
                            }
                        }

                        const edge_out = edge ? lib.no.runGraph(cache.get('nodysseus_hyperapp').graph, 'next_edge', {edge, graph}) : undefined;

                        const edges_in = get_edges_in(graph, node.id);
                        if (edges_in && edges_in.length > 0) {
                            const needed_args = lib.no.runGraph(cache.get('nodysseus_hyperapp').graph, 'node_args', {node, nodes: graph.nodes});
                            console.log(needed_args);
                        }

                        const new_graph = {
                            ...graph, 
                            nodes: graph.nodes.filter(n => n.id !== node.id).concat([node]), 
                            edges: edge ? graph.edges.filter(e => !(e.from === edge_out.from && e.to === edge_out.to)).concat(edge_out) : graph.edges
                        };

                        publish(new_graph, 'graphchange');
                    },
                    delete_node: (graph, id) => {
                        const gcache = getorset(cache, graph.id, new_graph_cache(resolve(graph)));
                        graph = gcache.graph;

                        const parent_edge = graph.edges.find(e => e.from === id);
                        const child_edges = graph.edges.filter(e => e.to === id);

                        const current_child_edges = graph.edges.filter(e => e.to === parent_edge.to);
                        const new_child_edges = child_edges.map((e, i) => ({...e, to: parent_edge.to, as: i === 0 ? parent_edge.as : !e.as ? e.as : current_child_edges.find(ce => ce.as === e.as && ce.from !== id) ? e.as + '1' : e.as}));

                        const new_graph = {
                            ...graph,
                            nodes: graph.nodes.filter(n => n.id !== id),
                            edges: graph.edges.filter(e => e !== parent_edge && e.to !== id).concat(new_child_edges)
                        };

                        update_graph(new_graph);
                    },
                    add_listener,
                    add_listener_extern: {
                        args: ['graph', 'event', 'listener_id', 'fn'],
                        add_listener,
                    },
                    remove_listener,
                    publish: {
                        args: ['_graph', 'event', 'data'],
                        fn: publish
                    },
                    expand_node: (graph, id, node_ref) => {
                        // TODO: fix this mess
                        const gcache = getorset(cache, graph.id, new_graph_cache(graph));
                        graph = gcache.graph;
                        for (let i = 0; i < node_ref.edges.length; i++) {
                            const new_edge = Object.assign({}, node_ref.edges[i]);
                            new_edge.from = `${id}/${new_edge.from}`;
                            new_edge.to = `${id}/${new_edge.to}`;
                            // working_graph.edges.push(new_edge);
                            if(!gcache.in_edge_map.get(new_edge.to)?.find(e => e.from === new_edge.from && e.as === new_edge.as)) {
                                gcache.in_edge_map.set(new_edge.to, (gcache.in_edge_map.get(new_edge.to) ?? []).concat([new_edge]));
                            }
                            // in_edge_map.set(new_edge.to, (in_edge_map.get(new_edge.to) ?? []).concat([new_edge]))
                        }

                        for (const child of node_ref.nodes) {
                            const new_node = Object.assign({}, child);
                            new_node.id = `${id}/${child.id}`;
                            // working_graph.nodes.push(new_node)
                            if(!gcache.node_map.get(new_node.id)) {
                                gcache.node_map.set(new_node.id, new_node);
                            } 
                            // node_map.set(new_node.id, new_node);
                            const has_inputs = gcache.in_edge_map.has(new_node.id);
                            if (new_node.id === `${id}/${node_ref.in ?? 'in'}`) {
                                // in_edge_map.get(node.id).map(e => ({ ...e, to: `${node.id}/${node_ref.in ?? 'in'}` }))
                                //     .forEach(e => working_graph.edges.push(e));
                                if(!gcache.in_edge_map.has(new_node.id)) {
                                    const new_edges = [];
                                    gcache.in_edge_map.get(id).forEach(e => {
                                        new_edges.push({ ...e, to: `${id}/${node_ref.in ?? 'in'}`});
                                    });
                                    gcache.in_edge_map.set(new_node.id, new_edges);
                                }
                                // in_edge_map.set(new_node.id, working_graph.edges.filter(e => e.to === `${node.id}/${node_ref.in ?? 'in'}`))
                            } else if (!has_inputs) {
                                // in_edge_map.set(new_node.id, []);
                                gcache.in_edge_map.set(new_node.id, []);
                            }
                        }
                    }
                }
            })()
        },
        utility: {
            eq: ({a, b}) => a === b,
            arg: {
                args: ['_node', 'target'],
                resolve: false,
                fn: (node, target) => typeof node.value === 'string' 
                    ? node.value === '_args' 
                        ? target
                        : objectSafeGet(target, node.value) 
                    : node.value === '_graph'
                    ? graph
                    : node.value === '_node'
                    ? node
                    : node.value !== undefined && target !== undefined
                    ? target[node.value]
                    : undefined,
            },
            new_array: {
                args: ['_node_inputs'],
                resolve: false,
                fn: (args) => {
                    const arr = Object.keys(args)
                        .sort()
                        .reduce((acc, k) => [
                                acc[0].concat([args[k]]), 
                                acc[1] || ispromise(args[k])
                            ], [[], false]);
                    return arr[1] ? Promise.all(arr[0]) : arr[0];
                }
            },
            fetch: {
                args: ['url', 'params'],
                fn: fetch
            },
            call: {
                args: ['fn', 'args', 'self'],
                fn: (fn, args, self) => typeof self === 'function' ? self(...((args ?? []).reverse().reduce((acc, v) => [!acc[0] && v !== undefined, acc[0] || v !== undefined ? acc[1].concat([v]) : acc[1]], [false, []])[1].reverse())) : self[fn](...((args ?? []).reverse().reduce((acc, v) => [!acc[0] && v !== undefined, acc[0] || v !== undefined ? acc[1].concat([v]) : acc[1]], [false, []])[1].reverse()))
            },
            merge_objects: {
                args: ['_node_inputs'],
                resolve: false,
                fn: (args) => {
                    const keys = Object.keys(args).sort();
                    const promise = keys.reduce((acc, k) => acc || ispromise(args[k]), false);
                    return promise 
                        ? Promise.all(keys.map(k => Promise.resolve(args[k])))
                            .then(es => Object.assign({}, ...es.map(k => args[k]?._Proxy ? args[k]._value : args[k]).filter(a => a && typeof a === 'object'))) 
                        : Object.assign({}, ...keys.map(k => args[k]?._Proxy ? args[k]._value : args[k]).filter(a => a && typeof a === 'object'))
                        // Object.fromEntries(keys
                        //     .map(k => args[k]?._Proxy ? args[k]._value : args[k])
                        //     .flatMap(o => typeof o === 'object' && o ? Object.entries(o) : [])
                        // )
                }
            },
            add: {
                args: ["_node_inputs"],
                resolve: true,
                fn: (args) => Object.values(args).reduce((acc, v) => acc + v, 0)
            },
            mult: {
                args: ["_node_inputs"],
                resolve: true,
                fn: (args) => Object.values(args).reduce((acc, v) => acc * v, 1)
            },
            negate: {
                args: ["value"],
                resolve: true,
                fn: (value) => -value
            },
            divide: {
                args: ["_node_inputs"],
                resolve: true,
                fn: (args) => Object.values(args).reduce((acc, v) => acc / v, 1)
            }
        },
        JSON: {
            stringify: {
                args: ['object'],
                resolve: true,
                fn: (args) => JSON.stringify(args)
            },
            parse: {
                args: ['string'],
                resolve: true,
                fn: (args) => JSON.parse(args)
            }
        },
        scripts: { d3subscription, updateSimulationNodes, graphToSimulationNodes, expand_node, flattenNode, contract_node, keydownSubscription, calculateLevels, contract_all, listen, graph_subscription, result_subscription},
        d3: { forceSimulation, forceManyBody, forceCenter, forceLink, forceRadial, forceY, forceCollide, forceX },
        Fuse,
        pz: {
            panzoom: (dispatch, sub_payload) => {
                let instance;
                let lastpanzoom = 0;
                const panzoom_selected_effect = (dispatch, payload) => {
                    if(!instance || !payload.selected){ return; }
                    lastpanzoom = performance.now();
                    const viewbox = findViewBox(
                        payload.nodes, 
                        payload.links, 
                        typeof payload.selected === 'string' ? payload.selected : payload.selected[0], 
                        payload.node_el_width, 
                        payload.html_id,
                        payload.dimensions
                    );
                    const x = payload.dimensions.x * 0.5 - viewbox.center.x;
                    const y = payload.dimensions.y * 0.5 - viewbox.center.y;
                    const scale = instance.getTransform().scale;
                    instance.moveTo(x, y);
                    instance.zoomTo(x, y, 1 / scale);

                    if(!payload.prevent_dispatch) {
                        dispatch(sub_payload.action, {event: 'effect_transform', transform: instance.getTransform()});
                    }
                };

                let init = requestAnimationFrame(() => {
                    instance = panzoom(document.getElementById(sub_payload.id), {
                        // onTouch: e => false,
                        filterKey: e => true,
                        smoothScroll: false
                    });
                    instance.on('panstart', e => performance.now() - lastpanzoom > 100 ? dispatch(sub_payload.action, {event: 'panstart', transform: e.getTransform()}) : undefined);
                    instance.moveTo(window.innerWidth * 0, window.innerHeight * 0.5);
                });
                requestAnimationFrame(() => dispatch(s => [{...s, panzoom_selected_effect}]));
                return () => { cancelAnimationFrame(init); instance?.dispose(); }
            }
        }
        // THREE
    };

    const runGraph = lib.no.runGraph;

    const add_default_nodes_and_edges = g => ({
                ...g, 
                nodes: g.nodes
                    .filter(n => !generic_nodes.has(n.id))
                    .concat(DEFAULT_GRAPH.nodes.filter(n => generic_nodes.has(n.id))),
                edges: g.edges
                    .filter(e => !generic_nodes.has(e.from))
                    .concat(DEFAULT_GRAPH.edges.filter(e => generic_nodes.has(e.to))) 
    });

    const url_params = new URLSearchParams(document.location.search);

    const nodysseus = function(html_id, display_graph) {
        const dispatch = runGraph(DEFAULT_GRAPH, "initialize_hyperapp_app", { 
            graph: DEFAULT_GRAPH, 
            display_graph: add_default_nodes_and_edges(display_graph),
            hash: window.location.hash ?? "",
            url_params,
            html_id,
            dimensions: {
                x: document.getElementById(html_id).clientWidth,
                y: document.getElementById(html_id).clientHeight
            },
            examples: examples.map(add_default_nodes_and_edges),
            readonly: false, 
            norun: url_params.get("norun") !== null,
            hide_types: false,
            offset: {x: 0, y: 0}
        });

        return () => requestAnimationFrame(() => dispatch.dispatch(s => undefined));
    };

    if('serviceWorker' in navigator) {
        navigator.serviceWorker.register('./sw.js');
    }

    const graph_list = JSON.parse(localStorage.getItem("graph_list"));
    // const display_graph = {...DEFAULT_GRAPH, nodes: DEFAULT_GRAPH.nodes.map(n => ({...n})), edges: DEFAULT_GRAPH.edges.map(e => ({...e}))};
    const hash_graph = window.location.hash.substring(1);
    const stored = localStorage.getItem(hash_graph ?? graph_list?.[0]);
    const simple = examples.find(g => g.id === 'simple');
    // const original_graph = {...DEFAULT_GRAPH, nodes: [...DEFAULT_GRAPH.nodes].map(n => ({...n})), edges: [...DEFAULT_GRAPH.edges].map(e => ({...e}))};

    let stored_graph;
    try{ stored_graph = JSON.parse(stored); } catch(e){}

    Promise.resolve(stored_graph ?? (hash_graph ? fetch(`json/${hash_graph}.json`).then(r => r.status !== 200 ? simple : r.json()).catch(_ => simple) : simple))
        .then(init_display_graph => nodysseus('node-editor', init_display_graph));

})();
