export default {
  "nodes": [
    {
      "id": "log",
      "nodes": [
        { "id": "in" },
        { "id": "value", "ref": "arg", "value": "value" },
        { "id": "tag", "ref": "arg", "value": "tag" },
        { "id": "out", "args": [], "script": "console.log(tag ?? _graph.value ?? _graph.name ?? _graph.id); console.log(value); return value" }
      ],
      "edges": [
        { "from": "in", "to": "out", "as": "input", "type":"ref"},
        { "from": "tag", "to": "out", "as": "tag"},
        { "from": "value", "to": "out", "as": "value" }
      ]
    },
    { "id": "fetch", "name": "fetch", "extern": "utility.fetch" },
    { "id": "call", "name": "call", "extern": "utility.call" },
    { "id": "stringify", "name": "stringify", "extern": "JSON.stringify" },
    { "id": "parse", "name": "parse", "extern": "JSON.parse" },
    { "id": "add", "extern": "utility.add" },
    { "id": "mult", "extern": "utility.mult" },
    { "id": "divide", "extern": "utility.divide" },
    { "id": "negate", "extern": "utility.negate" },
    {
      "id": "ancestors",
      "out": "out",
      "nodes": [
        { "id": "in" },
        { "id": "graph", "ref": "arg", "value": "graph" },
        { "id": "node", "ref": "arg", "value": "node" },
        {
          "id": "out",
          "script": "const parents = (id) => (graph ?? _graph).edges.filter(e => e.to === id).flatMap(e => parents(e.from)).concat([id]); return parents(node ?? graph.out ?? 'out')"
        }
      ],
      "edges": [
        { "from": "in", "to": "out", "as": "_", "type": "ref" },
        { "from": "graph", "to": "out", "as": "graph" },
        { "from": "node", "to": "out", "as": "node" }
      ]
    },
    {
      "id": "append",
      "type": "(array: A[], item: A) => A[]",
      "nodes": [
        { "id": "in" },
        { "id": "array", "ref": "arg", "value": "array" },
        { "id": "item", "ref": "arg", "value": "item" },
        { "id": "out", "script": "return array.concat(Array.isArray(item) ? item : [item])" }
      ],
      "edges": [
        { "from": "in", "to": "out", "as": "_", "type": "ref" },
        { "from": "array", "to": "out", "as": "array" },
        { "from": "item", "to": "out", "as": "item" }
      ]
    },
    {
      "id": "concat",
      "type": "(array: A[], items: A[]) => A[]",
      "nodes": [
        { "id": "in" },
        { "id": "array", "ref": "arg", "value": "array" },
        { "id": "items", "ref": "arg", "value": "items" },
        { "id": "out", "args": ["item", "array"], "script": "return (array ?? []).concat(items ?? [])" }
      ],
      "edges": [
        { "from": "in", "to": "out", "as": "args" },
        { "from": "array", "to": "out", "as": "array" },
        { "from": "items", "to": "out", "as": "items" }
      ]
    },
    {
      "id": "filter",
      "name": "filter",
      "in": "74n1jfm",
      "out": "lahq5z4",
      "description": "Filters an array using `fn: (element) => boolean`",
      "nodes": [
        {
          "id": "lahq5z4",
          "args": [],
          "name": "filter/out",
          "script": "const filter_fn = _lib.no.executeGraphNode({graph: fn.graph ?? _graph, lib: _lib})(typeof fn === 'string' ? fn : fn.fn); return arr.filter(element => filter_fn(Object.assign(fn.args ?? {}, {element})))"
        },
        { "id": "x2sz5kb", "args": [], "ref": "arg", "value": "array" },
        { "id": "fn", "ref": "arg", "value": "fn" },
        { "id": "74n1jfm", "args": [], "name": "filter/in" }
      ],
      "edges": [
        { "from": "x2sz5kb", "to": "lahq5z4", "as": "arr" },
        { "from": "fn", "to": "lahq5z4", "as": "fn" },
        { "from": "74n1jfm", "to": "lahq5z4", "as": "_", "type": "ref" }
      ]
    },
    {
      "id": "filter_eq",
      "name": "filter_eq",
      "in": "74n1jfm",
      "out": "lahq5z4",
      "nodes": [
        { "id": "lahq5z4", "args": [], "name": "filter/out", "script": "return arr.filter(v => v[key] === value)" },
        { "id": "pfoypo5", "args": [], "ref": "arg", "value": "key" },
        { "id": "zinx621", "args": [], "ref": "arg", "value": "value" },
        { "id": "x2sz5kb", "args": [], "ref": "arg", "value": "arr" },
        { "id": "74n1jfm", "args": [], "name": "filter/in" }
      ],
      "edges": [
        { "from": "pfoypo5", "to": "lahq5z4", "as": "key" },
        { "from": "zinx621", "to": "lahq5z4", "as": "value" },
        { "from": "x2sz5kb", "to": "lahq5z4", "as": "arr" },
        { "from": "74n1jfm", "to": "lahq5z4", "as": "input" }
      ]
    },
    {
      "id": "default",
      "nodes": [
        { "id": "in" },
        { "id": "value", "ref": "arg", "value": "value" },
        { "id": "otherwise", "ref": "arg", "value": "otherwise" },
        { "id": "data" },
        { "id": "out", "script": "return value ?? data['otherwise']" }
      ],
      "edges": [
        { "from": "in", "to": "out", "as": "_args", "type": "ref" },
        { "from": "value", "to": "out", "as": "value" },
        { "from": "otherwise", "to": "data", "as": "otherwise" },
        { "from": "data", "to": "out", "as": "data" }
      ]
    },
    {
      "id": "switch",
      "args": ["data", "input"],
      "nodes": [
        { "id": "in" },
        {"id": "args", "ref": "arg", "value": "_args"},
        { "id": "out",  "ref": "get"},
        { "id": "input", "ref": "arg", "value": "input" },
        { "id": "otherwise", "ref": "arg", "value": "otherwise" },
        {"id": "string_input",  "script": "return new String(input).toString()"}
      ],
      "edges": [
        { "from": "in", "to": "out", "as": "_", "type": "ref" },
        { "from": "args", "to": "out", "as": "target" },
        { "from": "input", "to": "string_input", "as": "input" },
        { "from": "string_input", "to": "out", "as": "path" },
        { "from": "otherwise", "to": "out", "as": "otherwise" }
      ]
    },
    {
      "id": "if_arg",
      "nodes": [
        {"id": "name", "ref": "arg", "value": "_graph.value"},
        {"id": "args", "ref": "arg", "value": "_args"},
        {"id": "true", "ref": "arg", "value": "true"},
        {"id": "get_name", "ref": "get"},
        {"id": "out", "ref": "if"}
      ],
      "edges": [
        {"from": "name", "to": "get_name", "as": "path"},
        {"from": "args", "to": "get_name", "as": "target"},
        {"from": "get_name", "to": "out", "as": "pred"}
      ]
    },
    {
      "id": "if",
      "nodes": [
        { "id": "in" },
        { "id": "pred", "ref": "arg", "value": "pred" },
        { "id": "true", "ref": "arg", "value": "true" },
        { "id": "false", "ref": "arg", "value": "false" },
        { "id": "data"},
        { "id": "out", "script": "return !!pred ? data.true_val : data.false_val" }
      ],
      "edges": [
        { "from": "in", "to": "out", "as": "_", "type":"ref" },
        { "from": "true", "to": "data", "as": "true_val" },
        { "from": "false", "to": "data", "as": "false_val" },
        { "from": "data", "to": "out", "as": "data" },
        { "from": "pred", "to": "out", "as": "pred" }
      ]
    },
    {
      "id": "find_node",
      "script": "if(!node_id){ return undefined } const nid = typeof node_id === 'string' ? node_id : node_id[0]; return nodes.find(n => n.id === nid || n.node_id === nid)"
    },
    {
      "id": "svg_text",
      "out": "out",
      "nodes": [
        { "id": "dom_type", "value": "text" },
        { "id": "text", "ref": "arg", "value": "text" },
        { "id": "props", "ref": "arg", "value": "props" },
        { "id": "text_el", "ref": "html_text" },
        { "id": "children", "script": "return [text]" },
        { "id": "out", "ref": "html_element" }
      ],
      "edges": [
        { "from": "dom_type", "to": "out", "as": "dom_type" },
        { "from": "text", "to": "text_el", "as": "text" },
        { "from": "text_el", "to": "children", "as": "text" },
        { "from": "props", "to": "out", "as": "props" },
        { "from": "children", "to": "out", "as": "children" }
      ]
    },
    {
      "id": "return",
      "out": "out",
      "nodes": [
        {"id": "node_args", "ref": "arg", "value": "_args"},
        {"id": "fn_args", "ref": "arg", "value": "_args"},
        {"id": "return", "ref": "arg", "value": "return"},
        {"id": "display", "ref": "arg", "value": "display"},
        {"id": "publish", "ref": "arg", "value": "publish"},
        {"id": "subscribe", "ref": "arg", "value": "subscribe"},
        {"id": "edge", "ref": "arg", "value": "edge"},
        {"id": "edge_as", "ref": "get", "value": "as"},
        {"id": "is_edge_for_node", "ref": "script", "value": "return edge && _graph.id.startsWith(edge.node_id)"},
        {"id": "default_edge", "ref": "if"},
        {"id": "return_str", "value": "return"},
        {"id": "args", "ref": "arg", "value": "args"},
        {"id": "is_parentest", "ref": "script", "value": "const parent = _lib.no.runtime.get_parent(_graph); return !_lib.no.runtime.get_parent(parent) || _graph.node_id !== parent.out"},
        {"id": "top_level_args", "ref": "if"},
        {"id": "merged_args", "ref": "merge_objects"},
        {"id": "fn_el_from", "ref": "arg", "value": "element.from"},
        {"id": "fn_el_as", "ref": "arg", "value": "element.as"},
        {"id": "fn", "script": "return {fn, graph: _lib.no.runtime.get_parent(_graph), args: {...(args ?? {}), edge: undefined, args: undefined}}"},
        {"id": "fn_run", "ref": "run"},
        {"id": "result_entry", "ref": "array"},
        {"id": "fn_runnable", "ref": "runnable"},
        {"id": "edges", "script": "return _lib.no.runtime.get_edges_in(_lib.no.runtime.get_parent(_graph), _graph.node_id).filter(e => e.as === edge || e.as === 'publish' || e.as === 'subscribe');"},
        {"id": "entries", "ref": "map"},
        {"id": "out", "script": "const res = Object.fromEntries(entries); Object.entries(res.publish ?? {}).forEach(([k, v]) => _lib.no.runtime.publish(k, {data: v})); _lib.no.runtime.remove_listener('*', 'subscribe-' + _graph.id); Object.entries(res.subscribe ?? {}).forEach(([k, v]) => { _lib.no.runtime.add_listener(k, 'subscribe-' + _graph.id, {...v, args: Object.assign({}, args, v.args, {result: edge === 'return' ? res[edge] : _lib.no.runtime.get_result(_graph.id)})}, false, _lib.no.runtime.get_parentest(_graph).id) }); return res[edge]"}
      ],
      "edges": [
        {"from": "fn_args", "to": "fn", "as": "args"},
        {"from": "fn_el_from", "to": "fn", "as": "fn"},
        {"from": "fn", "to": "fn_run", "as": "runnable"},
        {"from": "fn_run", "to": "result_entry", "as": "a1"},
        {"from": "fn_el_as", "to": "result_entry", "as": "a0"},
        {"from": "result_entry", "to": "fn_runnable", "as": "fn"},
        {"from": "result", "to": "fn_runnable", "as": "fn"},
        {"from": "fn_runnable", "to": "entries", "as": "fn"},
        {"from": "edges", "to": "entries", "as": "array"},
        {"from": "is_parentest", "to": "top_level_args", "as": "pred"},
        {"from": "args", "to": "top_level_args", "as": "true"},
        {"from": "top_level_args", "to": "merged_args", "as": "a0"},
        {"from": "node_args", "to": "merged_args", "as": "a1"},
        {"from": "merged_args", "to": "entries", "as": "args"},
        {"from": "node_args", "to": "edges", "as": "args"},
        {"from": "args", "to": "out", "as": "args"},
        {"from": "entries", "to": "out", "as": "entries"},
        {"from": "default_edge", "to": "out", "as": "edge"},
        {"from": "default_edge", "to": "edges", "as": "edge"},
        {"from": "return_str", "to": "default_edge", "as": "false"},
        {"from": "edge", "to": "edge_as", "as": "target"},
        {"from": "edge_as", "to": "default_edge", "as": "true"},
        {"from": "is_edge_for_node", "to": "default_edge", "as": "pred"},
        {"from": "edge", "to": "is_edge_for_node", "as": "edge"}
      ]
    },
    {
      "id": "runnable",
      "out": "out",
      "nodes": [
        { "id": "fn", "ref": "arg", "value": "fn" },
        { "id": "value_args", "ref": "arg", "value": "args" },
        { "id": "context_args", "ref": "arg", "value": "_args" },
        { "id": "fn_path", "value": "fn" },
        { "id": "args_path", "value": "args" },
        { "id": "graph_path", "value": "graph" },
        { "id": "prune_vals", "value": { "args": false } },
        { "id": "delete_fn", "ref": "delete" },
        { "id": "delete_args", "ref": "delete" },
        { "id": "delete_graph", "ref": "delete" },
        { "id": "args", "ref": "merge_objects" },
        { "id": "graph", "ref": "arg", "value": "graph"},
        {
          "id": "out",
          "script": "const parent_graph = _lib.no.runtime.get_parent(_graph); const input = _lib.no.runtime.get_edges_in(parent_graph, _graph.node_id).find(i => i.as === 'fn'); return input ? {fn: input.from, graph: graph?.id === parent_graph.id ? graph : parent_graph, args: args ?? {}} : false"
        }
      ],
      "edges": [
        { "from": "context_args", "to": "delete_fn", "as": "target" },
        { "from": "fn_path", "to": "delete_fn", "as": "path" },
        { "from": "delete_fn", "to": "delete_args", "as": "target" },
        { "from": "args_path", "to": "delete_args", "as": "path" },
        { "from": "delete_args", "to": "delete_graph", "as": "target" },
        { "from": "graph_path", "to": "delete_graph", "as": "path" },
        { "from": "delete_graph", "to": "args", "as": "o0" },
        { "from": "prune_vals", "to": "args", "as": "o1" },
        { "from": "value_args", "to": "args", "as": "o2" },
        { "from": "graph", "to": "out", "as": "graph" },
        { "from": "args", "to": "out", "as": "args", "type": "resolve" },
        { "from": "fn", "to": "out", "as": "fn", "type": "ref" }
      ]
    },
    {
      "id": "function", 
      "nodes": [
        {"id": "runnable", "ref": "arg", "value": "runnable"},
        {"id": "out", "script":"return (fnargs) => _lib.no.runGraph(runnable.graph, runnable.fn, {...runnable.args, fnargs}, _lib)"}
      ],
      "edges": [
        {"from": "runnable", "to": "out", "as": "runnable"}
      ]
    },
    {
      "id": "execute_graph",
      "nodes": [
        { "id": "in" },
        { "id": "args", "ref": "arg", "value": "_args" },
        { "id": "fn", "ref": "arg", "value": "fn" },
        { "id": "fn_graph", "ref": "arg", "value": "fn_graph" },
        {
          "id": "out",
          "script": "const res_graph = fn_graph ?? _graph; return (...inner_args) => {return _lib.no.executeGraphNode({graph: {...res_graph, nodes: [...res_graph.nodes], edges: [...res_graph.edges]}, lib: _lib})(fn)(Object.keys(args).length > 0 ? Object.assign(args, inner_args.length === 1 ? inner_args[0] : inner_args) : inner_args.length === 1 ? inner_args[0] : inner_args);}"
        }
      ],
      "edges": [
        { "from": "in", "to": "out", "as": "_", "type": "ref" },
        { "from": "args", "to": "out", "as": "args" },
        { "from": "fn", "to": "out", "as": "fn" },
        { "from": "fn_graph", "to": "out", "as": "fn_graph" }
      ]
    },
    {
      "id": "apply",
      "script": "return _lib.no.executeGraphNode({graph: fn.graph ?? _graph, lib: _lib})(fn.fn ?? fn)(args);"
    },
    { "id": "apply_graph", "script": "return _lib.no.executeGraphNode({graph, lib: _lib})(fn)(args);" },
    {
      "id": "partial",
      "nodes": [
        { "id": "in" },
        { "id": "input_value", "ref": "arg", "value": "_args" },
        { "id": "fn", "ref": "arg", "value": "fn" },
        { "id": "args", "ref": "arg", "value": "args" },
        {
          "id": "out",
          "script": "return _lib.no.executeGraphNode({graph: _graph, lib: _lib})(fn)(Object.assign({}, _args, args))"
        }
      ],
      "edges": [
        { "from": "in", "to": "out", "as": "args", "type": "ref" },
        { "from": "fn", "to": "out", "as": "fn" },
        { "from": "args", "to": "out", "as": "args" },
        { "from": "input_value", "to": "out", "as": "_args" }
      ]
    },
    {
      "id": "partial_graph",
      "script": "return _lib.no.executeGraphNode({graph, lib: _lib})(fn)(Object.assign({}, _args, args))"
    },
    {"id":"script", "extern": "utility.script"},
    {
      "id": "resolve",
      "out": "out",
      "nodes": [
        {"id": "args", "ref": "arg", "value": "_args"},
        { "id": "out", "script": "return Object.fromEntries(Object.entries(args).filter(a => a[0] !== '__args').map(a => [a[0], _lib.no.resolve(a[1])]))" }
      ],
      "edges": [
        { "from": "args", "to": "out", "as": "args" }
      ]
    },
    { "id": "array", "name": "array", "description": "Create an array from all the inputs in alphabetical order", "extern": "utility.new_array" },
    { "id": "merge_objects", "description": "Merge the keys of two objects, in descending alphabetical order priority (`Object.assign(...inputs)`).", "extern": "utility.merge_objects" },
    {
      "id": "get",
      "description": "Get the value at the path of object. Accepts a `.` separated path e.g. get(target, 'a.b.c') returns target.a.b.c",
      "nodes": [
        { "id": "in" },
        { "id": "target", "ref": "arg", "value": "target" },
        { "id": "path", "ref": "arg", "value": "path" },
        { "id": "otherwise", "ref": "arg", "value": "otherwise" },
        { "id": "out", "extern": "just.get" }
      ],
      "edges": [
        { "from": "in", "to": "out", "as": "input" },
        { "from": "otherwise", "to": "out", "as": "def" },
        { "from": "path", "to": "out", "as": "path" },
        { "from": "target", "to": "out", "as": "target" }
      ]
    },
    { "id": "arg", "description": "Get an input to the graph this is a part of.", "extern": "utility.arg" },
    {
      "id": "edge_in_argx",
      "script": "const parent = _lib.no.runtime.get_parent(_graph); return _lib.no.runtime.get_edges_in(parent, _graph.node_id).filter(e => e.as.startsWith('arg')).reduce((acc, e) => { acc[parseInt(e.as.substring(3))] = _lib.just.get.fn(_graph, _graph_input_value, e.as); return acc; }, []).map(a => a?._Proxy ? a._value : a);"
    },
    { "id": "set_mutable", "args": ["target", "path", "value"], "script": "_lib.just.set_mutable(target, path, value); return target" },
    {
      "id": "set",
      "description": "Set the property at `path` on target. Accepts a `.` separated path e.g. set(target, 'a.b', 'c') returns {...target, a: {...target.a, b: 'c'}}",
      "type": "(target: any, value: any, path: string) => any",
      "extern": "just.set"
    },
    {
      "id": "delete",
      "out": "out",
      "nodes": [
        { "id": "in" },
        { "id": "target", "ref": "arg", "value": "target" },
        { "id": "path", "ref": "arg", "value": "path" },
        { "id": "out", "script": "const new_val = Object.assign({}, target); delete new_val[path]; return new_val" }
      ],
      "edges": [
        { "from": "in", "to": "out", "as": "args" },
        { "from": "target", "to": "out", "as": "target" },
        { "from": "path", "to": "out", "as": "path" }
      ]
    },
    {
      "id": "cache",
      "nodes": [
        {"id": "in"},
        {"id": "value", "ref": "arg", "value": "value"},
        {"id": "recache", "ref": "arg", "value": "recache"},
        {"id": "cached", "ref": "arg", "value": "cached", "type": "internal"},
        {"id": "cache", "script": "if(value !== undefined){ _lib.no.runtime.update_args(_graph, {cached: _lib.no.resolve(value)});} return value;"},
        {"id": "cached_value", "ref": "default"},
        {"id": "out", "ref": "if"}
      ],
      "edges": [
        {"from": "in", "to": "out", "as": "_"},
        {"from": "value", "to": "cache", "as": "value"},
        {"from": "cache", "to": "cached_value", "as": "otherwise"},
        {"from": "cached", "to": "cached_value", "as": "value"},
        {"from": "cached_value", "to": "out", "as": "false"},
        {"from": "cache", "to": "out", "as": "true"},
        {"from": "recache", "to": "out", "as": "pred"}
      ]
    },
    {
      "id": "save_value",
      "out": "out",
      "nodes": [
        {"id": "value", "ref": "arg", "value": "value"},
        {"id": "graph_value", "ref": "script", "value": "return _graph.value"},
        {"id": "save", "ref": "script", "value": "if(!_lib.utility.compare(value, graph_value)){ _lib.no.runtime.add_node(_lib.no.runtime.get_parent(_graph), {id: _graph.node_id, ref: 'save_value', value});} return value;"},
        {"id": "out", "ref": "return"}
      ],
      "edges": [
        {"from": "value", "to": "save", "as": "value"},
        {"from": "graph_value", "to": "save", "as": "graph_value"},
        {"from": "save", "to": "out", "as": "return"}
      ]
    },
    {
      "id": "isunchanged",
      "nodes": [
        {"id": "in"},
        {"id": "value", "ref": "arg", "value": "value"},
        {"id": "fn", "ref": "arg", "value": "fn"},
        {"id": "cached", "ref": "arg", "value": "cached", "type": "internal"},
        {"id": "eq_default", "ref": "eq"},
        {"id": "eq_runnable", "ref": "runnable"},
        {"id": "fn_runnable", "ref": "default"},
        {"id": "eq_fn_runnable", "script": "return {...fn, args: {...(fn.args ?? {}), a, b}}"},
        {"id": "eq_fn", "ref": "run"},
        {"id": "cache", "script": "_lib.no.runtime.update_graph(_graph, {cached: value}); return eq;"},
        {"id": "out", "ref": "if"}
      ],
      "edges": [
        {"from": "in", "to": "out", "as": "_"},
        {"from": "eq_default", "to": "eq_runnable", "as": "fn"},
        {"from": "eq_runnable", "to": "fn_runnable", "as": "otherwise"},
        {"from": "fn", "to": "fn_runnable", "as": "value"},
        {"from": "fn_runnable", "to": "eq_fn_runnable", "as": "fn"},
        {"from": "value", "to": "eq_fn_runnable", "as": "a"},
        {"from": "cached", "to": "eq_fn_runnable", "as": "b"},
        {"from": "eq_fn_runnable", "to": "eq_fn", "as": "runnable"},
        {"from": "eq_fn", "to": "out", "as": "pred"},
        {"from": "eq_fn", "to": "out", "as": "true"},
        {"from": "value", "to": "cache", "as": "value"},
        {"from": "eq_fn", "to": "cache", "as": "eq"},
        {"from": "cache", "to": "out", "as": "false"}
      ]
    },
    {
      "id": "run_path",
      "out": "out",
      "nodes": [
        {"id": "path", "ref": "arg", "value": "path"},
        {"id": "args", "ref": "arg", "value": "_args", "type": "internal"},
        {"id": "runnable", "script": "const parent = _lib.no.runtime.get_parent(_graph); const node_id = _lib.no.runtime.get_path(parent, path); return {fn: node_id, graph: parent, args: {...args, edge: args.edge ? {...args.edge, node_id: parent.id + '/' + node_id} : undefined}}"},
        {"id": "out", "ref": "run"}
      ],
      "edges": [
        {"from": "path", "to": "runnable", "as": "path"},
        {"from": "args", "to": "runnable", "as": "args"},
        {"from": "runnable", "to": "out", "as": "runnable"}
      ]
    },
    {
      "id": "set_arg",
      "nodes": [
        {"id": "name", "ref": "arg", "value": "name"},
        {"id": "value", "ref": "arg", "value": "value"},
        {"id": "env", "ref": "arg", "value": "_args", "type": "internal"},
        {"id": "prev_value", "ref": "get"},
        {"id": "out", "script": "if(!_lib.utility.compare(env[name]._value, value)){ _lib.no.runtime.update_graph(_lib.no.runtime.get_parentest(_graph), {[name]: value});} return value;"}
      ],
      "edges": [
        {"from": "name", "to": "out", "as": "name"},
        {"from": "value", "to": "out", "as": "value"},
        {"from": "env", "to": "out", "as": "env"}
      ]
    },
    {
      "id": "event_publisher",
      "out": "update",
      "nodes": [
        { "id": "value", "ref": "arg", "value": "value" },
        { "id": "arg_name", "ref": "arg", "value": "name" },
        {"id": "graph_value", "ref": "arg", "value": "_graph.value"},
        {"id": "name", "ref": "default"},
        { "id": "update", "extern": "no.runtime.publish" }
      ],
      "edges": [
        {"from": "arg_name", "to": "name", "as": "value"},
        {"from": "graph_value", "to": "name", "as": "otherwise"},
        { "from": "name", "to": "update", "as": "event" },
        { "from": "value", "to": "update", "as": "data" }
      ]
    },
    {
      "id": "event_publisher_onchange",
      "out": "out",
      "nodes": [
        {"id": "value", "ref": "arg", "value": "value"},
        {"id": "value_eq_a", "ref": "arg", "value": "a"},
        {"id": "value_eq_b", "ref": "arg", "value": "b"},
        {"id": "value_eq_fn", "script": "return _lib.utility.compare(a, b)"},
        {"id": "value_eq", "ref": "runnable"},
        {"id": "value_unchanged", "ref": "isunchanged"},
        {"id": "publisher", "ref": "event_publisher"},
        {"id": "out", "ref": "if"}
      ],
      "edges": [
        {"from": "value", "to": "value_eq", "as": "value"},
        {"from": "value_eq_a", "to": "value_eq_fn", "as": "a"},
        {"from": "value_eq_b", "to": "value_eq_fn", "as": "b"},
        {"from": "value_eq_fn", "to": "value_eq", "as": "fn"},
        {"from": "value_eq", "to": "value_unchanged", "as": "fn"},
        {"from": "value_unchanged", "to": "out", "as": "pred"},
        {"from": "publisher", "to": "out", "as": "false"},
        {"from": "value", "to": "out", "as": "true"}
      ]
    },
    {
      "id": "input_value",
      "nodes": [
        { "id": "args" },
        { "id": "main/out", "name": "input_value", "ref": "return" },
        { "id": "cfuymky", "value": "{\"a\": 1, \"b\": {\"c\": 2, \"d\": 3}}" },
        { "id": "4d8qcss", "ref": "html_text" },
        { "id": "1znvqbi", "value": "value", "ref": "arg" },
        { "id": "qwz3ftj", "ref": "stringify" },
        { "id": "5a6pljw", "value": "pre", "ref": "html_element" },
        { "id": "17pcf8z", "value": "2" },
        { "id": "rpys4rr", "value": "value", "ref": "arg" }
      ],
      "edges": [
        { "from": "args", "to": "main/out", "as": "args" },
        { "from": "5a6pljw", "to": "main/out", "as": "display" },
        { "from": "cfuymky", "to": "args", "as": "value" },
        { "from": "4d8qcss", "to": "5a6pljw", "as": "children" },
        { "from": "1znvqbi", "to": "qwz3ftj", "as": "object" },
        { "from": "17pcf8z", "to": "qwz3ftj", "as": "spacer" },
        { "from": "qwz3ftj", "to": "4d8qcss", "as": "text" },
        { "from": "rpys4rr", "to": "main/out", "as": "return" }
      ],
      "out": "main/out"
    },
    {
      "id": "event_subscriber",
      "out": "out",
      "nodes": [
        { "id": "name", "ref": "arg", "value": "name" },
        { "id": "onevent", "ref": "arg", "value": "onevent" },
        { "id": "data", "ref": "arg", "value": "_data", "type": "internal" },
        {"id": "data_log", "ref": "log"},
        {
          "id": "add_listener",
          "script": "_lib.no.runtime.add_listener(event ?? _graph.value, 'evt-listener-' + _graph.id, (data) => { let update = true; if(onevent){ update = _lib.no.runGraph(onevent.graph, onevent.fn, {...onevent.args, data}); } if(update){ _lib.no.runtime.update_args(_graph, {_data: data.data}) } }, false);"
        },
        { "id": "out", "ref": "default"}
      ],
      "edges": [
        { "from": "name", "to": "add_listener", "as": "event" },
        { "from": "onevent", "to": "add_listener", "as": "onevent" },
        { "from": "add_listener", "to": "out", "as": "otherwise" },
        { "from": "data", "to": "out", "as": "value" },
      ]
    },
    { 
      "id": "events_broadcast_channel", 
      "out": "out",
      "nodes": [
        {"id": "arg_onmessage", "ref": "arg", "value": "onmessage"},
        {"id": "message_data", "ref": "arg", "value": "message.data.data"},
        {"id": "message_name", "ref": "arg", "value": "message.data.name"},
        {"id": "publish_event", "ref": "event_publisher"},
        {"id": "publish_event_runnable", "ref": "runnable"},
        {"id": "onmessageseq", "ref": "sequence"},
        {"id": "out", "script": "const bc = new BroadcastChannel('events'); bc.onmessage = e => { _lib.no.runGraph(onmessage.graph, onmessage.fn, {message: e}, _lib); }; return bc;"}
      ],
      "edges": [
        {"from": "message_data", "to": "publish_event", "as": "value"},
        {"from": "message_name", "to": "publish_event", "as": "name"},
        {"from": "publish_event", "to": "publish_event_runnable", "as": "fn"},
        {"from": "publish_event_runnable", "to": "onmessageseq", "as": "arg0"},
        {"from": "arg_onmessage", "to": "onmessageseq", "as": "arg1"},
        {"from": "onmessageseq", "to": "out", "as": "onmessage"}
      ]
    },
    {
      "id": "run",
      "out": "out",
      "nodes": [
        { "id": "runnable", "ref": "arg", "value": "runnable" },
        {
          "id": "out",
          "script": "return _lib.no.runGraph(runnable.graph, runnable.fn, runnable.args, _lib)"
        }
      ],
      "edges": [
        { "from": "runnable", "to": "out", "as": "runnable" }
      ]
    },
    {
      "id": "create_fn",
      "out": "out",
      "nodes": [
        { "id": "runnable", "ref": "arg", "value": "runnable" },
        { "id": "args", "ref": "arg", "value": "_args" },
        {
          "id": "out",
          "script": "return (fnargs) => _lib.no.runGraph(runnable.graph, runnable.fn, Object.assign({}, args, {runnable: undefined}, runnable.args, typeof fnargs === 'object' ? fnargs : {}), _lib)"
        }
      ],
      "edges": [
        { "from": "args", "to": "out", "as": "args", "type": "resolve" },
        { "from": "runnable", "to": "out", "as": "runnable" }
      ]
    },
    {
      "id": "reduce",
      "name": "reduce",
      "in": "m3b5wg3",
      "out": "tgurdpo",
      "nodes": [
        { "id": "tgurdpo", "ref": "call", "name": "out" },
        { "id": "m3b5wg3", "name": "in" },
        { "id": "rielyq8", "value": "reduce", "name": "rielyq8" },
        { "ref": "arg", "id": "1rre4bx", "value": "array", "name": "1rre4bx" },
        { "ref": "arg", "id": "6g75abk", "value": "fn", "name": "6g75abk" },
        { "id": "w0zzawl", "ref": "array", "name": "w0zzawl" },
        { "id": "args", "ref": "arg", "value": "_args" },
        {
          "id": "pdljod1",
          "name": "pdljod1",
          "script": "return (previous, current, index, array) => _lib.no.runGraph(fn?.graph ?? _graph, fn?.fn ?? fn, Object.assign({}, args, {previous, current, index, array}), _lib);"
        },
        { "id": "2lvs5dj", "script": "return _graph", "name": "2lvs5dj" }
      ],
      "edges": [
        { "from": "m3b5wg3", "to": "tgurdpo", "as": "args", "type": "ref" },
        { "from": "rielyq8", "to": "tgurdpo", "as": "fn" },
        { "from": "1rre4bx", "to": "tgurdpo", "as": "self" },
        { "from": "w0zzawl", "to": "tgurdpo", "as": "args", "type": "resolve" },
        { "from": "pdljod1", "to": "w0zzawl", "as": "a0" },
        { "from": "2lvs5dj", "to": "pdljod1", "as": "graph" },
        { "from": "args", "to": "pdljod1", "as": "args" },
        { "from": "6g75abk", "to": "pdljod1", "as": "fn" }
      ]
    },
    {
      "id": "map",
      "name": "map",
      "in": "m3b5wg3",
      "out": "handle_promise",
      "nodes": [
        { "id": "tgurdpo", "ref": "call", "name": "out" },
        { "id": "m3b5wg3", "name": "in" },
        { "id": "rielyq8", "value": "map", "name": "rielyq8" },
        { "ref": "arg", "id": "1rre4bx", "value": "array", "name": "1rre4bx" },
        { "ref": "arg", "id": "6g75abk", "value": "fn", "name": "6g75abk" },
        { "id": "w0zzawl", "ref": "array", "name": "w0zzawl" },
        { "id": "args", "ref": "arg", "value": "args" },
        {"id": "handle_promise", "script": "return _lib.utility.liftarraypromise(array);"},
        {
          "id": "pdljod1",
          "name": "pdljod1",
          "script": "return (element, index, array) => _lib.no.runGraph(fn?.graph ?? _graph, fn?.fn ?? fn, Object.assign({}, fn.args, args, {element, index, array}), _lib);"
        },
        { "id": "2lvs5dj", "script": "return _graph", "name": "2lvs5dj" }
      ],
      "edges": [
        { "from": "m3b5wg3", "to": "tgurdpo", "as": "args", "type": "ref" },
        { "from": "rielyq8", "to": "tgurdpo", "as": "fn" },
        { "from": "1rre4bx", "to": "tgurdpo", "as": "self" },
        { "from": "1rre4bx", "to": "pdljod1", "as": "arr" },
        { "from": "w0zzawl", "to": "tgurdpo", "as": "args", "type": "resolve" },
        { "from": "pdljod1", "to": "w0zzawl", "as": "a0", "type": "resolve" },
        { "from": "2lvs5dj", "to": "pdljod1", "as": "graph" },
        { "from": "args", "to": "pdljod1", "as": "args" },
        { "from": "6g75abk", "to": "pdljod1", "as": "fn" },
        {"from": "tgurdpo", "to": "handle_promise", "as": "array"}
      ]
    },
    {
      "id": "sequence",
      "name": "sequence",
      "out": "out",
      "nodes": [
        { "id": "in" },
        { "id": "args", "ref": "arg", "value": "_args" },
        { "id": "runnable_args", "ref": "arg", "value": "_args" },
        { "id": "value_args", "ref": "arg", "value": "args" },
        { "id": "context_args", "ref": "arg", "value": "_args" },
        { "id": "merged_args", "ref": "merge_objects" },
        { "id": "args_path", "value": "args" },
        { "id": "seq_runnable_args", "ref": "delete" },
        { "name": "in", "id": "in" },
        { "id": "runnables_promise", "script": "return Promise.all(promises);" },
        { "id": "map_runnables", "ref": "map" },
        {
          "id": "runnables",
          "script": "const runnables = Object.entries(inputs).filter(e => e[0] !== 'args').map(e => [e[0], e[1] && e[1]._Proxy ? e[1]._value : e[1]]).filter(r => r[1] && (!r[1]._Proxy || r[1]._value) && r[1].hasOwnProperty('fn') && r[1].hasOwnProperty('graph')); const filtered_args = Object.fromEntries(Object.entries(args).filter(a => !runnables.find(r => r[0] === a[0]))); return runnables.map(r => r[1]).map(r => ({...r, args: {...r.args, ...filtered_args}}))"
        },
        { "id": "element", "ref": "arg", "value": "element", "type": "internal" },
        {
          "id": "map_fn",
          "script": "return new Promise((resolve, reject) => resolve(_lib.no.runGraph(runnable.graph, runnable.fn, runnable.args, _lib)));"
        },
        { "id": "map_fn_runnable", "ref": "runnable" },
        { "name": "seq_runnable", "id": "out", "ref": "runnable" }
      ],
      "edges": [
        { "from": "in", "to": "runnables", "as": "inputs" },
        { "from": "args", "to": "runnables", "as": "args" },
        { "from": "element", "to": "map_fn", "as": "runnable" },
        { "from": "map_fn", "to": "map_fn_runnable", "as": "fn" },
        { "from": "runnable_args", "to": "map_runnables", "as": "args" },
        { "from": "runnables", "to": "map_runnables", "as": "array" },
        { "from": "map_fn_runnable", "to": "map_runnables", "as": "fn" },
        { "from": "map_runnables", "to": "runnables_promise", "as": "promises" },
        { "from": "runnables_promise", "to": "out", "as": "fn" },
        { "from": "context_args", "to": "merged_args", "as": "a0" },
        { "from": "value_args", "to": "merged_args", "as": "a1" },
        { "from": "merged_args", "to": "seq_runnable_args", "as": "target" },
        { "from": "args_path", "to": "seq_runnable_args", "as": "path" },
        { "from": "seq_runnable_args", "to": "out", "as": "args" }
      ]
    },
    {
      "id": "import_json",
      "name": "import_json",
      "in": "gsiimdp",
      "out": "lapeojg",
      "nodes": [
        {
          "id": "lapeojg",
          "script": "const new_nodes = import_graph.nodes.map(n => ({...n, id: name + '.' + n.id})); const parentest = _lib.no.runtime.get_parentest(_graph.id); \n\nconst new_graph = {\n...parentest,\nnodes: [...(new Map(parentest.nodes.concat(new_nodes).map(n => [n.id, n])).values())]\n}\n\n_lib.no.runtime.update_graph(new_graph); return name;",
          "name": "out"
        },
        { "id": "gsiimdp", "name": "in" },
        { "id": "3zfjt1h", "ref": "call" },
        { "id": "05eag47", "ref": "arg", "value": "name" },
        { "id": "2vtokcl", "script": "return fetch(url);" },
        { "id": "i9x02is", "value": "json" },
        { "id": "irr99xz", "ref": "arg", "value": "url" }
      ],
      "edges": [
        { "from": "gsiimdp", "to": "lapeojg", "as": "arg0" },
        { "as": "import_graph", "from": "3zfjt1h", "to": "lapeojg" },
        { "from": "05eag47", "to": "lapeojg", "as": "name" },
        { "as": "self", "from": "2vtokcl", "to": "3zfjt1h" },
        { "from": "i9x02is", "to": "3zfjt1h", "as": "fn" },
        { "from": "irr99xz", "to": "2vtokcl", "as": "url" }
      ]
    },
    {
      "id": "object_entries",
      "name": "object_entries",
      "in": "tkd4tqn",
      "out": "j8c79uf",
      "nodes": [
        { "name": "out", "id": "j8c79uf", "ref": "filter" },
        { "id": "tkd4tqn", "name": "in" },
        { "id": "hfexsuu", "script": "return !key?.startsWith('_');" },
        { "id": "runnable", "ref": "runnable" },
        { "id": "bgi2g37", "script": "return Object.entries(obj)" },
        { "id": "7gqcw0o", "ref": "arg", "value": "0.0" },
        { "id": "kpakw50", "ref": "arg", "value": "object" }
      ],
      "edges": [
        { "from": "tkd4tqn", "to": "j8c79uf", "as": "_", "type": "ref" },
        { "from": "hfexsuu", "to": "runnable", "as": "fn"},
        { "from": "runnable", "to": "j8c79uf", "as": "fn"},
        { "from": "bgi2g37", "to": "j8c79uf", "as": "array" },
        { "from": "7gqcw0o", "to": "hfexsuu", "as": "key" },
        { "from": "kpakw50", "to": "bgi2g37", "as": "obj" }
      ]
    },
    {
      "id": "css_anim",
      "name": "css_anim",
      "in": "cawqofn",
      "out": "spy9h48",
      "nodes": [
        {
          "name": "out",
          "id": "spy9h48",
          "script": "return Object.fromEntries((Array.isArray(arr[0]) ? arr[0] : arr).map((v, i, a) => [Math.floor((i / a.length)*100) + \"%\", v]))"
        },
        { "id": "cawqofn", "ref": "array", "name": "in" }
      ],
      "edges": [{ "as": "arr", "from": "cawqofn", "to": "spy9h48", "type": "resolve" }]
    },
    {
      "id": "css_styles",
      "name": "css_styles",
      "in": "xw3pmx7",
      "out": "5yxmxua",
      "nodes": [
        { "id": "5yxmxua", "ref": "html_element", "name": "out" },
        { "id": "vgv61zj", "ref": "html_text" },
        { "id": "jstjx7g" },
        { "id": "h40e3j9", "value": "style" },
        { "id": "xw3pmx7", "name": "in" },
        { "id": "jlgp7uy", "ref": "call", "name": "named_obj/out" },
        { "id": "o1j78dd", "value": "result-view" },
        { "id": "ij4z84e", "ref": "map" },
        { "id": "q3pwj9j", "value": "join" },
        { "id": "d6h3gdw", "ref": "array" },
        { "id": "j8c79uf", "name": "object_entries", "ref": "object_entries" },
        { "id": "n9g4wyq", "ref": "runnable" },
        { "id": "z63iaay", "script": "return \"\\n\";" },
        { "id": "vwsgweb", "ref": "default" },
        { "id": "aelf1a7", "script": "return key + '{' + value + '}'", "name": "out" },
        { "id": "mkwx4yx" },
        { "id": "fzr4mkv", "ref": "arg", "value": "css_object" },
        { "id": "5eqf77t", "value": "element.0", "ref": "arg" },
        { "id": "5pwetw5", "ref": "if" },
        { "id": "o5ojdyc", "script": "return key.startsWith(\"@keyframes\")" },
        { "id": "1hpnid4", "ref": "call" },
        { "id": "slj7ynn/jlgp7uy", "ref": "call", "name": "named_obj/out" },
        { "id": "ft1oksl", "ref": "arg", "value": "element.0" },
        { "id": "bbbp82v", "ref": "map" },
        { "id": "cp66ig5", "value": "join" },
        { "id": "uwq9u81", "ref": "array" },
        { "id": "slj7ynn/ij4z84e", "ref": "map" },
        { "id": "slj7ynn/q3pwj9j", "value": "join" },
        { "id": "slj7ynn/d6h3gdw", "ref": "array" },
        { "id": "i1ifamx", "ref": "object_entries" },
        { "id": "druspar", "ref": "runnable" },
        { "id": "gth1wc2", "script": "return \"\\n\";" },
        { "id": "slj7ynn/j8c79uf", "name": "object_entries", "ref": "object_entries" },
        { "id": "slj7ynn/n9g4wyq", "ref": "runnable" },
        { "id": "slj7ynn/z63iaay", "script": "return \"\\n\";" },
        { "id": "y25dg2n", "value": "element.1", "ref": "arg" },
        { "id": "0d4yh8u", "script": "return key + ': ' + value + \";\";" },
        { "id": "slj7ynn/vwsgweb", "ref": "default" },
        { "id": "slj7ynn/aelf1a7", "script": "return key + '{' + value + '}'", "name": "out" },
        { "id": "h13a9fd", "ref": "arg", "value": "element.0" },
        { "id": "h7me3v8", "ref": "arg", "value": "element.1" },
        { "id": "slj7ynn/mkwx4yx" },
        { "id": "slj7ynn/fzr4mkv", "ref": "arg", "value": "element.1" },
        { "id": "slj7ynn/5eqf77t", "value": "element.0", "ref": "arg" },
        { "id": "slj7ynn/1hpnid4", "ref": "call" },
        { "id": "slj7ynn/bbbp82v", "ref": "map" },
        { "id": "slj7ynn/cp66ig5", "value": "join" },
        { "id": "slj7ynn/uwq9u81", "ref": "array" },
        { "id": "slj7ynn/i1ifamx", "ref": "object_entries" },
        { "id": "slj7ynn/druspar", "ref": "runnable" },
        { "id": "slj7ynn/gth1wc2", "script": "return \"\\n\";" },
        { "id": "slj7ynn/y25dg2n", "value": "element.1", "ref": "arg" },
        { "id": "slj7ynn/0d4yh8u", "script": "return key + ': ' + value + \";\";" },
        { "id": "slj7ynn/h13a9fd", "ref": "arg", "value": "element.0" },
        { "id": "slj7ynn/h7me3v8", "ref": "arg", "value": "element.1" }
      ],
      "edges": [
        { "from": "vgv61zj", "to": "5yxmxua", "as": "children" },
        { "from": "jstjx7g", "to": "5yxmxua", "as": "props" },
        { "from": "h40e3j9", "to": "5yxmxua", "as": "dom_type" },
        { "from": "xw3pmx7", "to": "5yxmxua", "as": "arg3" },
        { "from": "jlgp7uy", "to": "vgv61zj", "as": "text" },
        { "from": "o1j78dd", "to": "jstjx7g", "as": "key" },
        { "from": "ij4z84e", "to": "jlgp7uy", "as": "self" },
        { "from": "q3pwj9j", "to": "jlgp7uy", "as": "fn" },
        { "from": "d6h3gdw", "to": "jlgp7uy", "as": "args" },
        { "from": "j8c79uf", "to": "ij4z84e", "as": "array" },
        { "as": "fn", "from": "n9g4wyq", "to": "ij4z84e" },
        { "from": "z63iaay", "to": "d6h3gdw", "as": "arg0" },
        { "from": "vwsgweb", "to": "j8c79uf", "as": "object" },
        { "as": "fn", "from": "aelf1a7", "to": "n9g4wyq" },
        { "from": "mkwx4yx", "to": "vwsgweb", "as": "otherwise" },
        { "from": "fzr4mkv", "to": "vwsgweb", "as": "value" },
        { "from": "5eqf77t", "to": "aelf1a7", "as": "key" },
        { "from": "5pwetw5", "to": "aelf1a7", "as": "value" },
        { "from": "o5ojdyc", "to": "5pwetw5", "as": "pred" },
        { "as": "false", "from": "1hpnid4", "to": "5pwetw5" },
        { "from": "slj7ynn/jlgp7uy", "to": "5pwetw5", "as": "true" },
        { "as": "key", "from": "ft1oksl", "to": "o5ojdyc" },
        { "from": "bbbp82v", "to": "1hpnid4", "as": "self" },
        { "from": "cp66ig5", "to": "1hpnid4", "as": "fn" },
        { "from": "uwq9u81", "to": "1hpnid4", "as": "args" },
        { "from": "slj7ynn/ij4z84e", "to": "slj7ynn/jlgp7uy", "as": "self" },
        { "from": "slj7ynn/q3pwj9j", "to": "slj7ynn/jlgp7uy", "as": "fn" },
        { "from": "slj7ynn/d6h3gdw", "to": "slj7ynn/jlgp7uy", "as": "args" },
        { "from": "i1ifamx", "to": "bbbp82v", "as": "array" },
        { "as": "fn", "from": "druspar", "to": "bbbp82v" },
        { "from": "gth1wc2", "to": "uwq9u81", "as": "arg0" },
        { "from": "slj7ynn/j8c79uf", "to": "slj7ynn/ij4z84e", "as": "array" },
        { "as": "fn", "from": "slj7ynn/n9g4wyq", "to": "slj7ynn/ij4z84e" },
        { "from": "slj7ynn/z63iaay", "to": "slj7ynn/d6h3gdw", "as": "arg0" },
        { "from": "y25dg2n", "to": "i1ifamx", "as": "object" },
        { "as": "fn", "from": "0d4yh8u", "to": "druspar" },
        { "from": "slj7ynn/vwsgweb", "to": "slj7ynn/j8c79uf", "as": "object" },
        { "as": "fn", "from": "slj7ynn/aelf1a7", "to": "slj7ynn/n9g4wyq" },
        { "from": "h13a9fd", "to": "0d4yh8u", "as": "key" },
        { "from": "h7me3v8", "to": "0d4yh8u", "as": "value" },
        { "from": "slj7ynn/mkwx4yx", "to": "slj7ynn/vwsgweb", "as": "otherwise" },
        { "from": "slj7ynn/fzr4mkv", "to": "slj7ynn/vwsgweb", "as": "value" },
        { "from": "slj7ynn/5eqf77t", "to": "slj7ynn/aelf1a7", "as": "key" },
        { "as": "value", "from": "slj7ynn/1hpnid4", "to": "slj7ynn/aelf1a7" },
        { "from": "slj7ynn/bbbp82v", "to": "slj7ynn/1hpnid4", "as": "self" },
        { "from": "slj7ynn/cp66ig5", "to": "slj7ynn/1hpnid4", "as": "fn" },
        { "from": "slj7ynn/uwq9u81", "to": "slj7ynn/1hpnid4", "as": "args" },
        { "from": "slj7ynn/i1ifamx", "to": "slj7ynn/bbbp82v", "as": "array" },
        { "as": "fn", "from": "slj7ynn/druspar", "to": "slj7ynn/bbbp82v" },
        { "from": "slj7ynn/gth1wc2", "to": "slj7ynn/uwq9u81", "as": "arg0" },
        { "from": "slj7ynn/y25dg2n", "to": "slj7ynn/i1ifamx", "as": "object" },
        { "as": "fn", "from": "slj7ynn/0d4yh8u", "to": "slj7ynn/druspar" },
        { "from": "slj7ynn/h13a9fd", "to": "slj7ynn/0d4yh8u", "as": "key" },
        { "from": "slj7ynn/h7me3v8", "to": "slj7ynn/0d4yh8u", "as": "value" }
      ]
    },
    {
      "edges": [
        { "from": "gvkhkfw", "to": "nn4twx9", "as": "children" },
        { "from": "7rhq0q5", "to": "nn4twx9", "as": "_" },
        { "from": "4972gx3", "to": "gvkhkfw", "as": "arg1" },
        { "from": "1ldhfah", "to": "gvkhkfw", "as": "arg0" },
        { "from": "ee5i5r2", "to": "4972gx3", "as": "dom_type" },
        { "from": "ro8n2gc", "to": "4972gx3", "as": "props" },
        { "from": "wet0jdv", "to": "1ldhfah", "as": "children" },
        { "from": "gcuxiw9", "to": "1ldhfah", "as": "props" },
        { "from": "875c1wk", "to": "1ldhfah", "as": "dom_type" },
        { "from": "t6q6rvf", "to": "ro8n2gc", "as": "arg0" },
        { "from": "rjwtb3c", "to": "ro8n2gc", "as": "props" },
        { "from": "utkc9o6", "to": "wet0jdv", "as": "arg0" },
        { "from": "jxl9r29", "to": "gcuxiw9", "as": "for" },
        { "from": "2zxw9oo", "to": "t6q6rvf", "as": "onkeydown" },
        { "from": "i7y9dyy", "to": "t6q6rvf", "as": "onchange" },
        { "from": "vks4vul", "to": "rjwtb3c", "as": "value" },
        { "from": "ddfgy2s", "to": "rjwtb3c", "as": "otherwise" },
        { "from": "trd8ptp", "to": "utkc9o6", "as": "text" },
        { "from": "zfrrk0z", "to": "jxl9r29", "as": "value" },
        { "to": "2zxw9oo", "from": "qseh2tb", "as": "fn", "type": "ref" },
        { "from": "b0j8nyq", "to": "i7y9dyy", "as": "dispatch" },
        { "from": "eotod0l", "to": "i7y9dyy", "as": "seq" },
        { "from": "qxwvdfe", "to": "i7y9dyy", "as": "value" },
        { "from": "0dnqo5l", "to": "i7y9dyy", "as": "onchange_fn" },
        { "from": "1wps21n", "to": "qseh2tb", "as": "a1" },
        { "from": "y5q7mbn", "to": "qseh2tb", "as": "a0" },
        { "from": "qjc0zt6", "to": "eotod0l", "as": "arg" },
        { "from": "widk6u6", "to": "qjc0zt6", "as": "fn" },
        { "from": "506ntvb", "to": "qjc0zt6", "as": "value" },
        { "from": "4ck1vaf", "to": "widk6u6", "as": "fn" }
      ],
      "nodes": [
        {
          "id": "nn4twx9",
          "ref": "html_element",
          "inputs": [
            { "from": "bw4iez5/gvkhkfw", "to": "bw4iez5/nn4twx9", "as": "children" },
            { "from": "bw4iez5/7rhq0q5", "to": "bw4iez5/nn4twx9", "as": "props" }
          ],
          "name": "out"
        },
        { "id": "gvkhkfw", "ref": "array" },
        { "id": "7rhq0q5", "name": "in" },
        { "id": "1ldhfah", "ref": "html_element", "name": "label" },
        { "id": "4972gx3", "ref": "html_element" },
        { "id": "wet0jdv", "ref": "array" },
        { "id": "gcuxiw9" },
        { "id": "875c1wk", "value": "label" },
        { "id": "ee5i5r2", "value": "input" },
        { "id": "ro8n2gc", "ref": "merge_objects" },
        { "id": "n1qcxu2", "value": "true" },
        { "id": "utkc9o6", "ref": "html_text" },
        { "id": "jxl9r29", "script": "return \"input-\" + name;" },
        { "id": "t6q6rvf" },
        { "id": "rjwtb3c", "ref": "default" },
        { "id": "varubwp" },
        { "id": "trd8ptp", "ref": "arg", "value": "name" },
        { "id": "zfrrk0z", "ref": "arg", "value": "name" },
        { "id": "2zxw9oo", "ref": "execute_graph", "name": "stop_propagation" },
        { "id": "sjw3rie", "ref": "default" },
        { "id": "vks4vul", "ref": "arg", "value": "props" },
        { "id": "ddfgy2s" },
        { "id": "671rzr9", "ref": "arg", "value": "name" },
        { "id": "ccir2fl", "ref": "arg", "value": "name" },
        { "id": "qseh2tb", "ref": "array" },
        { "id": "i7y9dyy", "ref": "runnable" },
        { "id": "fihihz0", "ref": "arg", "value": "oninput" },
        {
          "id": "1wps21n",
          "name": "stop propagation effect",
          "out": "hj2cig0",
          "nodes": [
            { "id": "hj2cig0", "ref": "array", "name": "stop propagation effect" },
            { "id": "1pvaim9", "ref": "execute_graph" },
            { "id": "0o86xp3", "ref": "arg", "value": "1" },
            { "id": "d60jwms", "script": "payload.stopPropagation();" },
            { "id": "xgbubrq", "ref": "arg", "value": "1" }
          ],
          "edges": [
            { "from": "1pvaim9", "to": "hj2cig0", "as": "a0" },
            { "from": "0o86xp3", "to": "hj2cig0", "as": "a1" },
            { "from": "d60jwms", "to": "1pvaim9", "as": "fn", "type": "ref" },
            { "from": "xgbubrq", "to": "d60jwms", "as": "payload" }
          ]
        },
        { "id": "y5q7mbn", "ref": "arg", "value": "0" },
        { "id": "y9bkhqc" },
        { "id": "6m6m1hq_1/ocuonub/qjc0zt6", "ref": "event_publisher" },
        { "id": "nb2sswc", "ref": "arg", "value": "name" },
        { "id": "6m6m1hq_1/ocuonub/506ntvb", "value": "payload.event.target.value", "ref": "arg" },
        { "id": "6m6m1hq_1/ocuonub/4ck1vaf", "ref": "arg", "value": "payload.name" }
      ],
      "out": "nn4twx9",
      "in": "7rhq0q5",
      "name": "input",
      "id": "input"
    },
    {
      "id": "html_text",
      "description": "Some HTML plaintext. Usually used as a child of html_element.",
      "out": "out",
      "nodes": [
        { "id": "in" },
        { "id": "arg_text", "ref": "arg", "value": "text" },
        { "id": "value_text", "ref": "arg", "value": "_graph.value" },
        {"id": "text", "ref": "default"},
        { "id": "text_value", "value": "text_value" },
        { "id": "out" }
      ],
      "edges": [
        { "from": "in", "to": "out", "as": "_", "type": "ref" },
        { "from": "text_value", "to": "out", "as": "dom_type" },
        { "from": "arg_text", "to": "text", "as": "value" },
        { "from": "value_text", "to": "text", "as": "otherwise" },
        { "from": "text", "to": "out", "as": "text" }
      ]
    },
    {
      "id": "html_element",
      "description": "An HTML Element. `children` is an array of html_element or html_text, `props` are the attributes for the html element as an object.",
      "nodes": [
        { "id": "in" },
        { "id": "children", "ref": "arg", "value": "children" },
        { "id": "props", "ref": "arg", "value": "props" },
        { "id": "dom_type", "ref": "arg", "value": "dom_type" },
        { "id": "memo", "ref": "arg", "value": "memo" },
        { "id": "element", "ref": "arg", "value": "element" },
        { "id": "div", "value": "div" },
        { "id": "dom_type_value", "ref": "if"},
        { "id": "graph_value", "ref": "script", "value": "return _graph.value"},
        {"id": "filter_children_fn", "script": "return element?._Proxy ? element._value : element"},
        {"id": "filter_children_fn_runnable", "ref": "runnable"},
        {"id": "fill_children_fn", "script": "return element.el ?? element"},
        {"id": "fill_children_fn_runnable", "ref": "runnable"},
        {"id": "filter_children", "ref": "filter"},
        {"id": "wrapped_children", "script": "return Array.isArray(children) ? children : [children]"},
        {
          "id": "fill_children",
          "ref": "map",
          "_script": "return children === undefined ? [] : children.length !== undefined ? children.map(c => _lib.no.resolve(c)).filter(c => !!c).map(c => c.el ?? c) : [children.el ?? children]"
        },
        { "id": "fill_props", "script": "return props ?? {}" },
        { "id": "dom_type_def", "ref": "default" },
        {
          "id": "out",
          "script": "dom_type = dom_type?._Proxy ? dom_type._value : dom_type; if(!(typeof dom_type === 'string' && Array.isArray(children))){ throw new Error('invalid element');} return {el: {dom_type, props, children, memo, _needsresolve: true}, _needsresolve: true}"
        }
      ],
      "edges": [
        { "from": "children", "to": "wrapped_children", "as": "children" },
        { "from": "wrapped_children", "to": "filter_children", "as": "array" },
        { "from": "props", "to": "fill_props", "as": "props", "type": "resolve" },
        { "from": "memo", "to": "out", "as": "memo"},
        {"from": "element", "to": "filter_children_fn", "as": "element"},
        {"from": "filter_children_fn", "to": "filter_children_fn_runnable", "as": "fn"},
        {"from": "filter_children_fn_runnable", "to": "filter_children", "as": "fn"},
        {"from": "element", "to": "fill_children_fn", "as": "element"},
        {"from": "fill_children_fn", "to": "fill_children_fn_runnable", "as": "fn"},
        {"from": "fill_children_fn_runnable", "to": "fill_children", "as": "fn"},
        { "from": "filter_children", "to": "fill_children", "as": "array"},
        { "from": "fill_children", "to": "out", "as": "children"},
        { "from": "fill_props", "to": "out", "as": "props" },
        { "from": "dom_type", "to": "dom_type_def", "as": "value" },
        { "from": "graph_value", "to": "dom_type_value", "as": "pred" },
        { "from": "div", "to": "dom_type_value", "as": "false" },
        { "from": "graph_value", "to": "dom_type_value", "as": "true" },
        { "from": "dom_type_value", "to": "dom_type_def", "as": "otherwise" },
        { "from": "dom_type_def", "to": "out", "as": "dom_type" },
        { "from": "in", "to": "out", "as": "args", "type": "ref" }
      ]
    },
    {
      "id": "icon",
      "name": "icon",
      "out": "c2sko9c",
      "nodes": [
        { "id": "c2sko9c", "ref": "html_element", "name": "ionicon" },
        { "id": "2lr3ihi", "value": "ion-icon" },
        { "id": "empty_obj", "value": {} },
        { "id": "props", "ref": "arg", "value": "props" },
        { "id": "defined_props", "ref": "if" },
        { "id": "name_path", "value": "name" },
        { "id": "a0jb5es", "ref": "set" },
        { "id": "s5x2r1f", "ref": "arg", "value": "icon" }
      ],
      "edges": [
        { "from": "2lr3ihi", "to": "c2sko9c", "as": "dom_type" },
        { "from": "props", "to": "defined_props", "as": "true" },
        { "from": "props", "to": "defined_props", "as": "pred" },
        { "from": "empty_obj", "to": "defined_props", "as": "false" },
        { "from": "defined_props", "to": "a0jb5es", "as": "target" },
        { "from": "name_path", "to": "a0jb5es", "as": "path" },
        { "from": "a0jb5es", "to": "c2sko9c", "as": "props" },
        { "from": "s5x2r1f", "to": "a0jb5es", "as": "value" }
      ]
    },
    { "id": "not", "args": ["target"], "script": "return !target" },
    {"id":"walk_graph","nodes":[{"id":"args"},{"id":"cfuymky","value":"testx"},{"id":"5a6pljw","ref":"html_element"},{"id":"main/out","name":"walk_graph","ref":"return"},{"id":"5xlxejq","ref":"html_text"},{"id":"8qkc61x","ref":"runnable"},{"id":"dv0p0id","value":"walker","ref":"log"},{"id":"dqs1arj","value":"graph","name":"","ref":"arg"},{"id":"pe7geox","value":"return _lib.no.runtime.get_edges_in(graph.graph, graph.node)","ref":"script"},{"id":"glnadhk","value":"return {node: _node.id, graph: _graph.id}","ref":"script"},{"id":"yophjcb","ref":"map"},{"id":"r3nrc31","ref":"runnable"},{"id":"nhqynsn","value":"element.from","ref":"arg"},{"id":"y4eppvf","value":"graph.graph","ref":"arg"},{"id":"lxjljmp","value":"node","ref":"arg"},{"id":"fo2ul3t","value":"fn","ref":"arg"},{"id":"x2ieyic","ref":"walk_graph"},{"id":"8kp4fri","value":"testz"},{"id":"b8n58i0","value":"testa"},{"id":"ik55pc7","value":"texty"},{"id":"1ecvy51","value":"return {node: _lib.no.runtime.get_node(graph, edge_from), graph}","ref":"script"},{"id":"27950jh"},{"id":"deh12wg","value":"edge","ref":"arg"},{"id":"sfwk3w6","value":"edge","ref":"log"},{"id":"uw2yljj","value":"node","ref":"log"},{"id":"dc70b7u","value":"element","ref":"arg"},{"id":"fhqwbjg","value":"_lib.no.runGraph(fn.graph, fn.fn, {node: node.node, edge}); return {graph: node.graph, node: node.node.id};","ref":"script"}],"edges":[{"from":"args","to":"main/out","as":"args"},{"from":"5a6pljw","to":"main/out","as":"display"},{"from":"cfuymky","to":"glnadhk","as":"arg0"},{"from":"8kp4fri","to":"glnadhk","as":"arg1"},{"from":"ik55pc7","to":"8kp4fri","as":"arg0"},{"from":"5xlxejq","to":"5a6pljw","as":"children"},{"from":"8qkc61x","to":"args","as":"fn"},{"from":"dv0p0id","to":"8qkc61x","as":"fn"},{"from":"glnadhk","to":"args","as":"graph"},{"from":"dqs1arj","to":"pe7geox","as":"graph"},{"from":"pe7geox","to":"yophjcb","as":"array"},{"from":"r3nrc31","to":"yophjcb","as":"fn"},{"from":"nhqynsn","to":"1ecvy51","as":"edge_from"},{"from":"y4eppvf","to":"1ecvy51","as":"graph"},{"from":"fo2ul3t","to":"fhqwbjg","as":"fn"},{"from":"1ecvy51","to":"fhqwbjg","as":"node"},{"from":"x2ieyic","to":"r3nrc31","as":"fn"},{"from":"fhqwbjg","to":"x2ieyic","as":"graph"},{"from":"yophjcb","to":"main/out","as":"return"},{"from":"27950jh","to":"dv0p0id","as":"value"},{"from":"sfwk3w6","to":"27950jh","as":"arg1"},{"from":"deh12wg","to":"sfwk3w6","as":"value"},{"from":"uw2yljj","to":"27950jh","as":"arg0"},{"from":"lxjljmp","to":"uw2yljj","as":"value"},{"from":"dc70b7u","to":"fhqwbjg","as":"edge"},{"from":"b8n58i0","to":"glnadhk","as":"arg22"}],"out":"main/out"},
    {
        "id": "canvas-behind-editor",
        "nodes": [
          {
            "id": "args"
          },
          {
            "id": "5a6pljw",
            "ref": "html_element"
          },
          {
            "id": "h2e7s9l",
            "value": "canvas"
          },
          {
            "id": "imr2dvi",
            "ref": "html_element"
          },
          {
            "id": "09epq8r",
            "ref": "array"
          },
          {
            "id": "af9fknz",
            "value": "canvas",
            "ref": "html_element"
          },
          {
            "id": "cilv4od"
          },
          {
            "id": "zvop9wi",
            "value": "canvas_id",
            "ref": "arg"
          },
          {
            "id": "zvop9wi_2",
            "value": "canvas_id",
            "ref": "arg"
          },
          {
            "id": "qe7qvud",
            "ref": "css_styles"
          },
          {
            "id": "45uuwjl"
          },
          {
            "id": "ejd0zjg"
          },
          {
            "id": "50811j9",
            "ref": "set"
          },
          {
            "id": "vmabx98",
            "value": "return `#${canvas_id}`",
            "ref": "script"
          },
          {
            "id": "ah2tu3m",
            "value": "canvas_id",
            "ref": "arg"
          },
          {
            "id": "cxwaij4"
          },
          {
            "id": "8cq1yfs",
            "value": "return window.innerWidth",
            "ref": "script"
          },
          {
            "id": "q96l549",
            "value": "return window.innerHeight",
            "ref": "script"
          },
          {
            "id": "icdi8jh",
            "value": "1"
          },
          {
            "id": "b6e9ux3",
            "value": "relative"
          },
          {
            "id": "zq4ni3x"
          },
          {
            "id": "uzulnsq",
            "value": "absolute"
          },
          {
            "id": "aoi9bi9",
            "value": "1"
          },
          {
            "id": "3ucsio2"
          },
          {
            "id": "jzduiha",
            "value": "32"
          },
          {
            "id": "kup95dw",
            "value": "64"
          },
          {
            "id": "75jvde6",
            "value": "fixed",
            "name": ""
          },
          {
            "id": "0uhor53",
            "value": "100%"
          },
          {
            "id": "ag93b9f",
            "value": "100%"
          },
          {
            "id": "zgmfuzy",
            "value": "0"
          },
          {
            "id": "dx3qg99",
            "value": "0",
            "name": ""
          },
          {
            "id": "main/out",
            "name": "export",
            "ref": "return"
          }
        ],
        "edges": [
          {
            "from": "args",
            "to": "main/out",
            "as": "args"
          },
          {
            "from": "imr2dvi",
            "to": "main/out",
            "as": "return"
          },
          {
            "from": "5a6pljw",
            "to": "main/out",
            "as": "display"
          },
          {
            "from": "h2e7s9l",
            "to": "args",
            "as": "canvas_id"
          },
          {
            "from": "09epq8r",
            "to": "imr2dvi",
            "as": "children"
          },
          {
            "from": "af9fknz",
            "to": "09epq8r",
            "as": "arg0"
          },
          {
            "from": "cilv4od",
            "to": "af9fknz",
            "as": "props"
          },
          {
            "from": "zvop9wi",
            "to": "cilv4od",
            "as": "id"
          },
          {
            "from": "zvop9wi_2",
            "to": "cilv4od",
            "as": "key"
          },
          {
            "from": "qe7qvud",
            "to": "09epq8r",
            "as": "arg1"
          },
          {
            "from": "50811j9",
            "to": "qe7qvud",
            "as": "css_object"
          },
          {
            "from": "45uuwjl",
            "to": "50811j9",
            "as": "target"
          },
          {
            "from": "vmabx98",
            "to": "50811j9",
            "as": "path"
          },
          {
            "from": "ah2tu3m",
            "to": "vmabx98",
            "as": "canvas_id"
          },
          {
            "from": "cxwaij4",
            "to": "50811j9",
            "as": "value"
          },
          {
            "from": "75jvde6",
            "to": "cxwaij4",
            "as": "position"
          },
          {
            "from": "8cq1yfs",
            "to": "cilv4od",
            "as": "width"
          },
          {
            "from": "q96l549",
            "to": "cilv4od",
            "as": "height"
          },
          {
            "from": "icdi8jh",
            "to": "cxwaij4",
            "as": "z-index"
          },
          {
            "from": "ejd0zjg",
            "to": "45uuwjl",
            "as": "#node-editor-editor"
          },
          {
            "from": "jzduiha",
            "to": "ejd0zjg",
            "as": "z-index"
          },
          {
            "from": "b6e9ux3",
            "to": "ejd0zjg",
            "as": "position"
          },
          {
            "from": "zq4ni3x",
            "to": "45uuwjl",
            "as": "#node-editor-result"
          },
          {
            "from": "uzulnsq",
            "to": "zq4ni3x",
            "as": "position"
          },
          {
            "from": "aoi9bi9",
            "to": "zq4ni3x",
            "as": "z-index"
          },
          {
            "from": "kup95dw",
            "to": "3ucsio2",
            "as": "z-index"
          },
          {
            "from": "3ucsio2",
            "to": "45uuwjl",
            "as": "#node-info-wrapper"
          },
          {
            "from": "0uhor53",
            "to": "cxwaij4",
            "as": "width"
          },
          {
            "from": "ag93b9f",
            "to": "cxwaij4",
            "as": "height"
          },
          {
            "from": "dx3qg99",
            "to": "cxwaij4",
            "as": "top"
          },
          {
            "from": "zgmfuzy",
            "to": "cxwaij4",
            "as": "left"
          }
        ],
        "out": "main/out",
      },
      {
    "id": "set_property",
    "nodes": [
      {
        "id": "args"
      },
      {
        "id": "mf6qadh",
        "value": "target",
        "ref": "arg"
      },
      {
        "id": "5a6pljw",
        "ref": "html_element"
      },
      {
        "id": "xmreb7u",
        "value": "result",
        "ref": "arg"
      },
      {
        "id": "ueijpjz",
        "value": "return import(\"https://unpkg.com/hydra-synth\")",
        "ref": "script"
      },
      {
        "id": "k3ktuq6",
        "ref": "cache"
      },
      {
        "id": "m6n51hz",
        "ref": "cache"
      },
      {
        "id": "n77uupb",
        "value": "return import(\"https://unpkg.com/three@latest/build/three.module.js\")",
        "ref": "script"
      },
      {
        "id": "imr2dvi",
        "value": "output",
        "ref": "log"
      },
      {
        "id": "7iawyvs",
        "ref": "map"
      },
      {
        "id": "j89dbbh",
        "ref": "runnable"
      },
      {
        "id": "b4scd6w",
        "value": "element.key",
        "ref": "arg"
      },
      {
        "id": "sfivh4x"
      },
      {
        "id": "bg17wom",
        "value": "element.key",
        "ref": "arg"
      },
      {
        "id": "zxz1gis",
        "ref": "html_text"
      },
      {
        "id": "3x804e3",
        "value": "option",
        "ref": "html_element"
      },
      {
        "id": "vnl7z87",
        "value": "return res && typeof res === 'object' ? Object.keys(res).filter(k => typeof res[k] !== 'function').map(key => ({key})) : [];",
        "ref": "script"
      },
      {
        "id": "7ed3f7y",
        "value": "target",
        "name": "",
        "ref": "arg"
      },
      {
        "id": "j0zzhc1",
        "ref": "set_mutable"
      },
      {
        "id": "94txz4w",
        "value": "property",
        "ref": "arg"
      },
      {
        "id": "v171kxm",
        "value": "value",
        "ref": "arg"
      },
      {
        "id": "ke2gd7r",
        "ref": "if"
      },
      {
        "id": "7fvvlnw",
        "value": "prop",
        "ref": "log"
      },
      {
        "id": "1xbcyyf",
        "value": "return{}",
        "ref": "script"
      },
      {
        "id": "t3ve35s",
        "value": "hi",
        "name": ""
      },
      {
        "id": "bnyrd44",
        "ref": "default"
      },
      {
        "id": "nzg5arg",
        "value": "return _graph?.value;",
        "ref": "script"
      },
      {
        "id": "v965sw7",
        "ref": "array"
      },
      {
        "id": "am447fy",
        "value": "input",
        "ref": "html_element"
      },
      {
        "id": "bvs9qz1",
        "value": "datalist",
        "ref": "html_element"
      },
      {
        "id": "5zclxv2"
      },
      {
        "id": "6s9b6g0",
        "value": "return _graph?.value;",
        "ref": "script"
      },
      {
        "id": "35nk2ya",
        "value": "const parent = _lib.no.runtime.get_parent(_graph); return parent ? _lib.no.runtime.add_node(parent, {id: _graph.node_id, ref: 'set_property', value: property}) : _lib.no.runtime.update_args(_graph, {property});",
        "ref": "script"
      },
      {
        "id": "or9k7xt",
        "ref": "runnable"
      },
      {
        "id": "fzeowyv",
        "value": "payload.event.target.value",
        "ref": "arg"
      },
      {
        "id": "exsgmpn"
      },
      {
        "id": "zujxtmx",
        "value": "return `${_graph.id}-selector`",
        "ref": "script"
      },
      {
        "id": "prhtthx",
        "value": "return `${_graph.id}-selector`",
        "ref": "script"
      },
      {
        "id": "ddgxhvl",
        "value": "return _graph?.value",
        "ref": "script"
      },
      {
        "id": "main/out",
        "name": "threejs",
        "ref": "return"
      }
    ],
    "edges": [
      {
        "from": "args",
        "to": "main/out",
        "as": "args"
      },
      {
        "from": "5a6pljw",
        "to": "main/out",
        "as": "display"
      },
      {
        "from": "imr2dvi",
        "to": "main/out",
        "as": "return"
      },
      {
        "from": "ueijpjz",
        "to": "k3ktuq6",
        "as": "value"
      },
      {
        "from": "k3ktuq6",
        "to": "args",
        "as": "hydra"
      },
      {
        "from": "n77uupb",
        "to": "m6n51hz",
        "as": "value"
      },
      {
        "from": "m6n51hz",
        "to": "args",
        "as": "THREE"
      },
      {
        "from": "7iawyvs",
        "to": "bvs9qz1",
        "as": "children"
      },
      {
        "from": "vnl7z87",
        "to": "7iawyvs",
        "as": "array"
      },
      {
        "from": "xmreb7u",
        "to": "vnl7z87",
        "as": "res"
      },
      {
        "from": "j89dbbh",
        "to": "7iawyvs",
        "as": "fn"
      },
      {
        "from": "3x804e3",
        "to": "j89dbbh",
        "as": "fn"
      },
      {
        "from": "sfivh4x",
        "to": "3x804e3",
        "as": "props"
      },
      {
        "from": "bg17wom",
        "to": "sfivh4x",
        "as": "value"
      },
      {
        "from": "zxz1gis",
        "to": "3x804e3",
        "as": "children"
      },
      {
        "from": "b4scd6w",
        "to": "zxz1gis",
        "as": "text"
      },
      {
        "from": "7ed3f7y",
        "to": "j0zzhc1",
        "as": "target"
      },
      {
        "from": "v171kxm",
        "to": "j0zzhc1",
        "as": "value"
      },
      {
        "from": "1xbcyyf",
        "to": "args",
        "as": "target"
      },
      {
        "from": "ke2gd7r",
        "to": "imr2dvi",
        "as": "value"
      },
      {
        "from": "j0zzhc1",
        "to": "ke2gd7r",
        "as": "true"
      },
      {
        "from": "mf6qadh",
        "to": "ke2gd7r",
        "as": "false"
      },
      {
        "from": "t3ve35s",
        "to": "args",
        "as": "value"
      },
      {
        "from": "7fvvlnw",
        "to": "ke2gd7r",
        "as": "pred"
      },
      {
        "from": "ddgxhvl",
        "to": "7fvvlnw",
        "as": "value"
      },
      {
        "from": "bnyrd44",
        "to": "j0zzhc1",
        "as": "path"
      },
      {
        "from": "nzg5arg",
        "to": "bnyrd44",
        "as": "value"
      },
      {
        "from": "94txz4w",
        "to": "bnyrd44",
        "as": "otherwise"
      },
      {
        "from": "v965sw7",
        "to": "5a6pljw",
        "as": "children"
      },
      {
        "from": "bvs9qz1",
        "to": "v965sw7",
        "as": "arg0"
      },
      {
        "from": "am447fy",
        "to": "v965sw7",
        "as": "arg1"
      },
      {
        "from": "5zclxv2",
        "to": "am447fy",
        "as": "props"
      },
      {
        "from": "6s9b6g0",
        "to": "5zclxv2",
        "as": "value"
      },
      {
        "from": "35nk2ya",
        "to": "or9k7xt",
        "as": "fn"
      },
      {
        "from": "or9k7xt",
        "to": "5zclxv2",
        "as": "onchange"
      },
      {
        "from": "fzeowyv",
        "to": "35nk2ya",
        "as": "property"
      },
      {
        "from": "exsgmpn",
        "to": "bvs9qz1",
        "as": "props"
      },
      {
        "from": "zujxtmx",
        "to": "exsgmpn",
        "as": "id"
      },
      {
        "from": "prhtthx",
        "to": "5zclxv2",
        "as": "list"
      }
    ],
  },
  {
    "id": "call_method",
    "out": "main/out",
    "nodes": [
      {
        "id": "xmreb7u",
        "value": "self",
        "ref": "arg"
      },
      {
        "id": "self_args",
        "ref": "arg",
        "value": "_args"
      },
      {
        "id": "def_self",
        "ref": "default"
      },
      {
        "id": "fn",
        "ref": "arg",
        "value": "fn"
      },
      {
        "id": "5a6pljw",
        "ref": "html_element"
      },
      {
        "id": "7iawyvs",
        "ref": "map"
      },
      {
        "id": "j89dbbh",
        "ref": "runnable"
      },
      {
        "id": "b4scd6w",
        "value": "element.key",
        "ref": "arg"
      },
      {
        "id": "sfivh4x"
      },
      {
        "id": "bg17wom",
        "value": "element.key",
        "ref": "arg"
      },
      {
        "id": "zxz1gis",
        "ref": "html_text"
      },
      {
        "id": "3x804e3",
        "value": "option",
        "ref": "html_element"
      },
      {
        "id": "94txz4w",
        "value": "property",
        "ref": "arg",
        "type": "internal"
      },
      {
        "id": "ke2gd7r",
        "ref": "if"
      },
      {
        "id": "t3ve35s",
        "value": "hi",
        "name": ""
      },
      {
        "id": "bnyrd44",
        "ref": "default"
      },
      {
        "id": "nzg5arg",
        "value": "return fn ?? _graph?.value;",
        "ref": "script"
      },
      {
        "id": "v965sw7",
        "ref": "array"
      },
      {
        "id": "am447fy",
        "value": "input",
        "ref": "html_element"
      },
      {
        "id": "bvs9qz1",
        "value": "datalist",
        "ref": "html_element"
      },
      {
        "id": "5zclxv2"
      },
      {
        "id": "6s9b6g0",
        "value": "return fn ?? _graph?.value;",
        "ref": "script"
      },
      {
        "id": "or9k7xt",
        "ref": "runnable"
      },
      {
        "id": "fzeowyv",
        "value": "payload.event.target.value",
        "ref": "arg"
      },
      {
        "id": "exsgmpn"
      },
      {
        "id": "zujxtmx",
        "value": "return `${_graph.id}-selector`",
        "ref": "script"
      },
      {
        "id": "prhtthx",
        "value": "return `${_graph.id}-selector`",
        "ref": "script"
      },
      {
        "id": "ddgxhvl",
        "value": "return fn ?? _graph?.value",
        "ref": "script"
      },
      {
        "id": "main/out",
        "name": "call_method",
        "ref": "return"
      },
      {
        "id": "j0zzhc1",
        "ref": "call"
      },
      {
        "id": "1xbcyyf",
        "value": "return {a: 'hi', b: () => console.log('test')}",
        "ref": "script"
      },
      {
        "id": "pjqedg3",
        "value": "fn_args",
        "ref": "arg"
      },
      {
        "id": "9vf40d3",
        "ref": "default"
      },
      {
        "id": "iqtiiiy",
        "ref": "edge_in_argx"
      },
      {
        "id": "mf6qadh",
        "value": "self",
        "ref": "arg"
      },
      {
        "id": "jyoexsb",
        "value": "fn",
        "ref": "arg"
      },
      {
        "id": "cac9u81",
        "value": "fn",
        "ref": "arg"
      },
      {
        "id": "k14owom",
        "value": "fn",
        "ref": "arg"
      },
      {
        "id": "vbtokuf",
        "ref": "default"
      },
      {
        "id": "e60u6s6",
        "value": "onchange",
        "ref": "arg"
      },
      {
        "id": "35nk2ya",
        "value": "const parent = _lib.no.runtime.get_parent(_graph); return parent ? _lib.no.runtime.add_node(parent, {id: _graph.node_id, ref: 'call_method', value: property}) : _lib.no.runtime.update_args(_graph, {property});",
        "ref": "script"
      },
      {
        "id": "xvxhk01",
        "value": "if(typeof res !== 'object'){ return []; } const keys = _lib.utility.properties.getOwnAndPrototypeEnumerablesAndNonenumerables(res, true); return keys.filter(k => !k.startsWith('_') && typeof res[k] === 'function').sort().map(key => ({key}));",
        "ref": "script"
      },
      {
        "id": "3w3cepy",
        "value": "self",
        "ref": "arg"
      }
    ],
    "edges": [
      {
        "from": "5a6pljw",
        "to": "main/out",
        "as": "display"
      },
      {
        "from": "7iawyvs",
        "to": "bvs9qz1",
        "as": "children"
      },
      {
        "from": "j89dbbh",
        "to": "7iawyvs",
        "as": "fn"
      },
      {
        "from": "3x804e3",
        "to": "j89dbbh",
        "as": "fn"
      },
      {
        "from": "sfivh4x",
        "to": "3x804e3",
        "as": "props"
      },
      {
        "from": "bg17wom",
        "to": "sfivh4x",
        "as": "value"
      },
      {
        "from": "zxz1gis",
        "to": "3x804e3",
        "as": "children"
      },
      {
        "from": "b4scd6w",
        "to": "zxz1gis",
        "as": "text"
      },
      {
        "from": "j0zzhc1",
        "to": "ke2gd7r",
        "as": "true"
      },
      {
        "from": "mf6qadh",
        "to": "ke2gd7r",
        "as": "false"
      },
      {
        "from": "t3ve35s",
        "to": "args",
        "as": "value"
      },
      {
        "from": "nzg5arg",
        "to": "bnyrd44",
        "as": "value"
      },
      {
        "from": "94txz4w",
        "to": "bnyrd44",
        "as": "otherwise"
      },
      {
        "from": "v965sw7",
        "to": "5a6pljw",
        "as": "children"
      },
      {
        "from": "bvs9qz1",
        "to": "v965sw7",
        "as": "arg0"
      },
      {
        "from": "am447fy",
        "to": "v965sw7",
        "as": "arg1"
      },
      {
        "from": "5zclxv2",
        "to": "am447fy",
        "as": "props"
      },
      {
        "from": "6s9b6g0",
        "to": "5zclxv2",
        "as": "value"
      },
      {
        "from": "35nk2ya",
        "to": "or9k7xt",
        "as": "fn"
      },
      {
        "from": "fzeowyv",
        "to": "35nk2ya",
        "as": "property"
      },
      {
        "from": "exsgmpn",
        "to": "bvs9qz1",
        "as": "props"
      },
      {
        "from": "zujxtmx",
        "to": "exsgmpn",
        "as": "id"
      },
      {
        "from": "prhtthx",
        "to": "5zclxv2",
        "as": "list"
      },
      {
        "from": "bnyrd44",
        "to": "j0zzhc1",
        "as": "fn"
      },
      {
        "from": "ddgxhvl",
        "to": "ke2gd7r",
        "as": "pred"
      },
      {
        "from": "ke2gd7r",
        "to": "main/out",
        "as": "return"
      },
      {
        "from": "9vf40d3",
        "to": "j0zzhc1",
        "as": "args"
      },
      {
        "from": "pjqedg3",
        "to": "9vf40d3",
        "as": "value"
      },
      {
        "from": "iqtiiiy",
        "to": "9vf40d3",
        "as": "otherwise"
      },
      {
        "from": "1xbcyyf",
        "to": "args",
        "as": "self"
      },
      {
        "from": "xmreb7u",
        "to": "def_self",
        "as": "value"
      },
      {
        "from": "self_args",
        "to": "def_self",
        "as": "otherwise"
      },
      {
        "from": "def_self",
        "to": "j0zzhc1",
        "as": "self"
      },
      {
        "from": "cac9u81",
        "to": "nzg5arg",
        "as": "fn"
      },
      {
        "from": "k14owom",
        "to": "ddgxhvl",
        "as": "fn"
      },
      {
        "from": "vbtokuf",
        "to": "5zclxv2",
        "as": "onchange"
      },
      {
        "from": "e60u6s6",
        "to": "vbtokuf",
        "as": "value"
      },
      {
        "from": "or9k7xt",
        "to": "vbtokuf",
        "as": "otherwise"
      },
      {
        "from": "jyoexsb",
        "to": "6s9b6g0",
        "as": "fn"
      },
      {
        "from": "def_self",
        "to": "7iawyvs",
        "as": "array"
      },
      {
        "from": "xvxhk01",
        "to": "7iawyvs",
        "as": "array"
      },
      {
        "from": "3w3cepy",
        "to": "xvxhk01",
        "as": "res"
      }
    ]}
,
  {
      "id": "import",
      "nodes": [
        {
          "id": "args"
        },
        {
          "id": "8dy573e",
          "ref": "html_element"
        },
        {
          "id": "main/out",
          "name": "import",
          "ref": "return"
        },
        {
          "id": "arcnyff",
          "ref": "array"
        },
        {
          "id": "qgbinm2",
          "value": "Upload a json file",
          "ref": "html_text"
        },
        {
          "id": "rtrp3nj",
          "value": "input",
          "ref": "html_element"
        },
        {
          "id": "vnibm4q"
        },
        {
          "id": "07fjn2b",
          "value": "file"
        },
        {
          "id": "rdt0k55",
          "value": ".json"
        },
        {
          "id": "jmqcpll",
          "ref": "runnable"
        },
        {
          "id": "o9ukwn8",
          "value": "payload.event.target.files.0",
          "ref": "arg"
        },
        {
          "id": "1672j69",
          "value": "text",
          "ref": "call"
        },
        {
          "id": "jvoijof",
          "ref": "parse"
        },
        {
          "id": "uymxrxe",
          "ref": "map"
        },
        {
          "id": "yu0e7mk",
          "ref": "runnable"
        },
        {
          "id": "3z8hhss",
          "value": "element",
          "ref": "arg"
        },
        {
          "id": "ij46kiv",
          "value": "return ({id: graph.id, value: graph.value, name: graph.name, nodes: graph.nodes, edges: graph.edges, out: graph.out})",
          "ref": "script"
        },
        {
          "id": "hcp6xds",
          "ref": "log"
        },
        {
          "id": "cixrltc",
          "value": "_lib.no.runtime.update_graph(graph); return graph;",
          "ref": "script"
        },
        {
          "id": "odeeqm8",
          "value": "return _lib;",
          "ref": "script"
        },
        {
          "id": "sl7qlmj",
          "value": "scripts.save_graph",
          "ref": "call"
        }
      ],
      "edges": [
        {
          "from": "8dy573e",
          "to": "main/out",
          "as": "display"
        },
        {
          "from": "args",
          "to": "main/out",
          "as": "args"
        },
        {
          "from": "arcnyff",
          "to": "8dy573e",
          "as": "children"
        },
        {
          "from": "qgbinm2",
          "to": "arcnyff",
          "as": "arg0"
        },
        {
          "from": "rtrp3nj",
          "to": "arcnyff",
          "as": "arg1"
        },
        {
          "from": "vnibm4q",
          "to": "rtrp3nj",
          "as": "props"
        },
        {
          "from": "07fjn2b",
          "to": "vnibm4q",
          "as": "type"
        },
        {
          "from": "rdt0k55",
          "to": "vnibm4q",
          "as": "accept"
        },
        {
          "from": "jmqcpll",
          "to": "vnibm4q",
          "as": "onchange"
        },
        {
          "from": "o9ukwn8",
          "to": "1672j69",
          "as": "self"
        },
        {
          "from": "1672j69",
          "to": "jvoijof",
          "as": "string"
        },
        {
          "from": "uymxrxe",
          "to": "jmqcpll",
          "as": "fn"
        },
        {
          "from": "jvoijof",
          "to": "uymxrxe",
          "as": "array"
        },
        {
          "from": "yu0e7mk",
          "to": "uymxrxe",
          "as": "fn"
        },
        {
          "from": "3z8hhss",
          "to": "ij46kiv",
          "as": "graph"
        },
        {
          "from": "ij46kiv",
          "to": "hcp6xds",
          "as": "value"
        },
        {
          "from": "hcp6xds",
          "to": "cixrltc",
          "as": "graph"
        },
        {
          "from": "sl7qlmj",
          "to": "yu0e7mk",
          "as": "fn"
        },
        {
          "from": "cixrltc",
          "to": "sl7qlmj",
          "as": "args"
        },
        {
          "from": "odeeqm8",
          "to": "sl7qlmj",
          "as": "self"
        }
      ],
    }
  ]
}