  export default {
    "nodes": [
      {
        "id": "log",
        "description": "Prints value to console.log",
        "out": "out",
        "nodes": [
          { "id": "in" },
          { "id": "value", "ref": "arg", "value": "value" },
          { "id": "tag", "ref": "arg", "value": "tag" },
          {"id": "graph_value", "ref": "arg", "value": "__graph_value"},
          { "id": "out", "args": [], "script": "tag && console.log(tag); graph_value && console.log(graph_value); console.log(value); return value" }
        ],
        "edges": [
          { "from": "in", "to": "out", "as": "input", "type":"ref"},
          { "from": "tag", "to": "out", "as": "tag"},
          { "from": "graph_value", "to": "out", "as": "graph_value"},
          { "from": "value", "to": "out", "as": "value" }
        ]
      },
      {"id": "math", "ref": "extern", "value": "extern.math"},
      { "id": "fetch", "name": "fetch", "description": "Uses the <a target='_blank' href='https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API'>Fetch API</a> to get data.", "ref": "extern", "value": "extern.fetch" },
      { "id": "call", "name": "call", "description": "Calls `self.fn` with `args`. If `self is not found, uses the node's context.", "ref": "extern", "value": "extern.call" },
      { "id": "stringify", "name": "stringify", "description": "<a target='_blank' href='https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify'>JSON.stringify</a> the `value` argument", "ref": "extern", "value": "extern.stringify" },
      { "id": "parse", "name": "parse", "description": "<a target='_blank' href='https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify'>JSON.parse</a> the `value` argument", "ref": "extern", "value": "extern.parse" },
      { "id": "add", "ref": "extern", "value": "extern.add", "description": "The javascript <a target='_blank' href='https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Addition'>+ operator</a>" },
      { "id": "mult", "ref": "extern", "value": "extern.mult", "description": "The javascript <a target='_blank' href='https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Multiplication'>* operator</a>" },
      { "id": "divide", "ref": "extern", "value": "extern.divide", "description": "The javascript <a target='_blank' href='https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Division'>/ operator</a>"  },
      { "id": "negate", "ref": "extern", "value": "extern.negate", "description": "The javascript <a target='_blank' href='https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Subtraction'>- operator</a>"  },
      { "id": "and", "ref": "extern", "value": "extern.and", "description": "The javascript <a target='_blank' href='https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Logical_AND'>&& operator</a>" },
      { "id": "liftarraypromise", "ref": "extern", "value": "extern.liftarraypromise", "description": "If an array contains a promise, wrap the whole array with `Promise.all`." },
      {"id": "typeof", "ref": "extern", "value": "extern.typeof", "description": "javascript typeof operator"},
      {"id": "new", "ref": "extern", "value": "extern.construct", "description": "javascript constructor"},
      {"id": "addEventListeners", "ref": "extern", "value": "extern.addEventListeners", "description": "add js event listeners to a target"},
      {
        "id": "ancestors",
        "out": "out",
        "description": "Gets the ancestors of the `node` in `graph`",
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
        "description": "Appends `item` to `array`. `item` can be a single item or an array.",
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
        "description": "Concats `items` to `array`.",
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
        "id": "filter_eq",
        "name": "filter_eq",
        "description": "Filters `array` for items where `item.key` === `value`",
        "out": "lahq5z4",
        "nodes": [
          { "id": "lahq5z4", "args": [], "name": "filter/out", "script": "return arr.filter(v => v[key] === value)" },
          { "id": "pfoypo5", "args": [], "ref": "arg", "value": "key" },
          { "id": "zinx621", "args": [], "ref": "arg", "value": "value" },
          { "id": "x2sz5kb", "args": [], "ref": "arg", "value": "array" },
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
        "out": "out",
        "description": "Returns `value` if it's defined, if not then returns `otherwise`",
        "nodes": [
          { "id": "value", "ref": "arg", "value": "value" },
          { "id": "graph_value", "ref": "arg", "value": "__graph_value" },
          { "id": "otherwise", "ref": "arg", "value": "otherwise" },
          { "id": "is_otherwise", "ref": "script", "value": "return otherwise !== undefined"},
          { "id": "if_otherwise", "ref": "if"},
          {"id": "is_value", "ref": "script", "value": "return value !== undefined"},
          { "id": "if_value", "ref": "if"},
          { "id": "out",  "ref": "return"}
        ],
        "edges": [
          { "from": "otherwise", "to": "if_otherwise", "as": "true" },
          { "from": "otherwise", "to": "is_otherwise", "as": "otherwise" },
          {"from": "is_otherwise", "to": "if_otherwise", "as": "pred"},
          { "from": "graph_value", "to": "if_otherwise", "as": "false" },
          { "from": "value", "to": "is_value", "as": "value" },
          { "from": "value", "to": "if_value", "as": "true" },
          {"from": "is_value", "to": "if_value", "as": "pred"},
          { "from": "otherwise", "to": "if_value", "as": "false" },
          { "from": "if_value", "to": "out", "as": "value" }
        ]
      },
      {
        "id": "if_arg",
        "description": "If this node's `value` exists in the node's context, return the value from the `true` branch",
        "nodes": [
          {"id": "name", "ref": "arg", "value": "__graph_value"},
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
        "out": "out",
        "description": "If `pred` exists in the node's context, return the value from the `true` branch. Otherwise, return the value from the `false` branch.",
        "nodes": [
          { "id": "pred", "ref": "arg", "value": "pred" },
          { "id": "true", "ref": "arg", "value": "true" },
          { "id": "false", "ref": "arg", "value": "false" },
          {"id": "predval", "ref": "script", "value": "return !!pred ? 'true_val' : 'false_val'"},
          { "id": "out", "ref": "extern", "value": "extern.switch"}
        ],
        "edges": [
          { "from": "true", "to": "out", "as": "true_val" },
          { "from": "false", "to": "out", "as": "false_val" },
          { "from": "pred", "to": "predval", "as": "pred" },
          { "from": "predval", "to": "out", "as": "input" }
        ]
      },
      {
        "id": "find_node",
        "description": "Find the node with id `node_id` in `nodes`.",
        "script": "if(!node_id){ return undefined } const nid = typeof node_id === 'string' ? node_id : node_id[0]; return nodes.find(n => n.id === nid || n.node_id === nid)"
      },
      {
        "id": "svg_text",
        "description": "Returns a hyperapp `svg` text element with `text` and `props`",
        "out": "out",
        "nodes": [
          { "id": "text", "ref": "arg", "value": "text" },
          { "id": "props", "ref": "arg", "value": "props" },
          { "id": "dom_type", "value": "text" },
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
        "id": "input_edge",
        "description": "Finds the input edge labeled with this node's `value`",
        "out": "out",
        "nodes": [
          {
            "id": "out", 
            "ref": "script", 
            "value": "const parent = _lib.no.runtime.get_parent(_graph); const super_parent = _lib.no.runtime.get_parent(parent); const edge = _lib.no.runtime.get_edges_in(super_parent, parent.node_id).find(e => e.as === __graph_value); return {...edge, graph: super_parent}"
          }
        ],
        "edges": [
        ]
      },
      {
        "id": "runnable_return",
        "description": "Combines `return` and `runnable` into one node.",
        "out": "out",
        "nodes": [
          {"id": "return", "ref": "arg", "value": "return"},
          {"id": "display", "ref": "arg", "value": "display"},
          {"id": "subscribe", "ref": "arg", "value": "subscribe"},
          {"id": "publish", "ref": "arg", "value": "publish"},
          {"id": "return_edge_input", "ref": "input_edge", "value": "return"},
          {"id": "return_edge_arg", "ref": "arg", "value": "return_edge", "type": ["local", "internal"]},
          {"id": "return_edge", "ref": "default"},
          {"id": "display_edge_input", "ref": "input_edge", "value": "display"},
          {"id": "display_edge_arg", "ref": "arg", "value": "display_edge", "type": ["local", "internal"]},
          {"id": "display_edge", "ref": "default"},
          {"id": "publish_edge_input", "ref": "input_edge", "value": "publish"},
          {"id": "publish_edge_arg", "ref": "arg", "value": "publish_edge", "type": ["local", "internal"]},
          {"id": "publish_edge", "ref": "default"},
          {"id": "subscribe_edge_input", "ref": "input_edge", "value": "subscribe"},
          {"id": "subscribe_edge_arg", "ref": "arg", "value": "subscribe_edge", "type": ["local", "internal"]},
          {"id": "subscribe_edge", "ref": "default"},
          {"id": "args", "ref": "arg", "value": "args"},
          {"id": "merge_args", "ref": "merge_objects"},
          {"id": "return_node", "ref": "return"},
          {"id": "out", "ref": "runnable"}
        ],
        "edges": [
          {"from": "return_edge_arg", "to": "return_edge", "as": "value"},
          {"from": "return_edge_input", "to": "return_edge", "as": "otherwise"},
          {"from": "display_edge_arg", "to": "display_edge", "as": "value"},
          {"from": "display_edge_input", "to": "display_edge", "as": "otherwise"},
          {"from": "publish_edge_arg", "to": "publish_edge", "as": "value"},
          {"from": "publish_edge_input", "to": "publish_edge", "as": "otherwise"},
          {"from": "subscribe_edge_arg", "to": "subscribe_edge", "as": "value"},
          {"from": "subscribe_edge_input", "to": "subscribe_edge", "as": "otherwise"},
          {"from": "return_edge", "to": "return_node", "as": "return_edge"},
          {"from": "display_edge", "to": "return_node", "as": "display_edge"},
          {"from": "subscribe_edge", "to": "return_node", "as": "subscribe_edge"},
          {"from": "publish_edge", "to": "return_node", "as": "publish_edge"},
          {"from": "args", "to": "return_node", "as": "args"},
          {"from": "return_node", "to": "out", "as": "fn"}
        ]
      },
      {
        "id": "return",
        "description": "Creates an inline graph with args, pub/sub, etc. See docs for more detail.",
        "ref": "extern",
        "value": "extern.return"
      },
      {
        "id": "fold",
        "ref": "extern",
        "value": "extern.fold"
      },
      {
        "id": "runnable",
        "ref": "extern",
        "value": "extern.runnable",
      },
      {
        "id": "ap",
        "ref": "extern",
        "value": "extern.ap",
      },
      {
        "id": "function", 
        "description": "Creates a function from the `fn` input.",
        "nodes": [
          {"id": "runnable", "ref": "arg", "value": "runnable"},
          {"id": "out", "script":"return (fnargs) => _lib.no.run(runnable.graph, runnable.fn, {...runnable.args, fnargs}, _lib)"}
        ],
        "edges": [
          {"from": "runnable", "to": "out", "as": "runnable"}
        ]
      },
      {"id": "script", "description": "Runs this as a javascript function. `return` is needed at the end of the script to return anything.", "ref": "extern", "value": "extern.script"},
      {"id": "extern", "description": "Uses a function from the nodysseus extern library directly"},
      {
        "id": "resolve",
        "description": "Resolves any `Proxy` inputs and returns an object.",
        "ref": "extern", "value": "extern.resolve"
      },
      { "id": "array", "name": "array", "description": "Create an array from all the inputs in alphabetical order", "ref": "extern", "value": "extern.new_array" },
      {"id": "create_fn", "ref": "extern", "value": "extern.create_fn"},
      { "id": "merge_objects", "description": "Merge the keys of two objects, in descending alphabetical order priority (`Object.assign(...inputs)`).", "ref": "extern", "value": "extern.merge_objects" },
      {
        "id": "get",
        "description": "Get the value at the path of object. Accepts a `.` separated path e.g. get(target, 'a.b.c') returns target.a.b.c",
        "out": "out",
        "nodes": [
          { "id": "target", "ref": "arg", "value": "target" },
          { "id": "path", "ref": "arg", "value": "path" },
          { "id": "graph_value", "ref": "arg", "value": "__graph_value" },
          { "id": "otherwise", "ref": "arg", "value": "otherwise" },
          { "id": "out", "ref": "extern", "value": "extern.get" }
        ],
        "edges": [
          { "from": "graph_value", "to": "out", "as": "graphval" },
          { "from": "otherwise", "to": "out", "as": "def" },
          { "from": "path", "to": "out", "as": "path" },
          { "from": "target", "to": "out", "as": "target" }
        ]
      },
      { "id": "arg", "description": "Get an input to the graph this is a part of.", "ref": "extern", "value": "extern.arg" },
      { 
        "id": "set_mutable", 
        "description": "Sets `target` value at `path` to `value` and returns the object.",
        "ref": "extern", "value": "extern.set_mutable",
        "_out": "out",
        "_nodes": [
          {"id": "path", "ref": "arg", "value": "path"},
          {"id": "target", "ref": "arg", "value": "target"},
          {"id": "value", "ref": "arg", "value": "value"},
          {"id": "out", "ref": "extern", "value": "extern.set_mutable"}
        ],
        "_edges": [
          {"from": "path", "to": "out", "as": "path"},
          {"from": "target", "to": "out", "as": "target"},
          {"from": "value", "to": "out", "as": "value"}
        ]
      },
      {
        "id": "set",
        "description": "Returns a new object with the property at `path` (or the node's value) on `target` set to `value`. Accepts a `.` separated path e.g. set(target, 'a.b', 'c') returns {...target, a: {...target.a, b: 'c'}}",
        "type": "(target: any, value: any, path: string) => any",
        "ref": "extern", "value": "extern.set"
      },
      {
        "id": "modify",
        "description": "Returns a new object with the property at `path` (or the node's value) on `target` modified with `fn`. Accepts a `.` separated path e.g. set(target, 'a.b', 'c') returns {...target, a: {...target.a, b: 'c'}}",
        "type": "(target: any, value: any, path: string) => any",
        "ref": "extern", "value": "extern.modify"
      },
      {
        "id": "delete",
        "description": "Deletes `target` property at `path`",
        "ref": "extern", "value": "extern.delete"
      },
{
    "id": "tapbutton",
    "nodes": [
      {
        "id": "args"
      },
      {
        "id": "8dy573e",
        "ref": "html_element"
      },
      {
        "id": "out",
        "name": "ontap",
        "ref": "return"
      },
      {
        "id": "qgbinm2",
        "value": "button",
        "ref": "html_element"
      },
      {
        "id": "9fogdzn",
        "value": "signal",
        "ref": "html_text"
      },
      {
        "id": "ehximpo"
      },
      {
        "id": "4stvov8",
        "ref": "ap"
      },
      {
        "id": "8ywgts7",
        "ref": "state"
      },
      {
        "id": "v089o3o",
        "value": "signal.set",
        "ref": "arg"
      },
      {
        "id": "k3rjgad"
      },
      {
        "id": "76he898",
        "value": "true"
      },
      {
        "id": "nhmeamz",
        "ref": "ap"
      },
      {
        "id": "7mj35x5"
      },
      {
        "id": "bim5wsv",
        "value": "signal.set",
        "ref": "arg"
      },
      {
        "id": "4mha35d",
        "value": "false"
      },
      {
        "id": "hbo5tmq",
        "ref": "array"
      },
      {
        "id": "lgx7u5i",
        "ref": "html_text"
      },
      {
        "id": "g19y12v",
        "value": "signal.state",
        "ref": "arg"
      },
      {
        "id": "9vqinsg"
      },
      {
        "id": "i38qweq",
        "value": "none"
      },
      {
        "id": "eemfhib",
        "value": "signal.state",
        "ref": "arg"
      },
      {
        "id": "n2a984s",
        "ref": "sequence"
      },
      {
        "id": "a14g4yc",
        "value": "ontap",
        "ref": "arg"
      }
    ],
    "edges": [
      {
        "from": "8dy573e",
        "to": "out",
        "as": "display"
      },
      {
        "from": "args",
        "to": "out",
        "as": "args"
      },
      {
        "from": "9fogdzn",
        "to": "qgbinm2",
        "as": "children"
      },
      {
        "from": "ehximpo",
        "to": "qgbinm2",
        "as": "props"
      },
      {
        "from": "8ywgts7",
        "to": "args",
        "as": "signal"
      },
      {
        "from": "v089o3o",
        "to": "4stvov8",
        "as": "fn"
      },
      {
        "from": "k3rjgad",
        "to": "4stvov8",
        "as": "args"
      },
      {
        "from": "76he898",
        "to": "k3rjgad",
        "as": "value"
      },
      {
        "from": "4stvov8",
        "to": "ehximpo",
        "as": "onpointerdown"
      },
      {
        "from": "bim5wsv",
        "to": "nhmeamz",
        "as": "fn"
      },
      {
        "from": "7mj35x5",
        "to": "nhmeamz",
        "as": "args"
      },
      {
        "from": "4mha35d",
        "to": "7mj35x5",
        "as": "value"
      },
      {
        "from": "hbo5tmq",
        "to": "8dy573e",
        "as": "children"
      },
      {
        "from": "qgbinm2",
        "to": "hbo5tmq",
        "as": "arg1"
      },
      {
        "from": "lgx7u5i",
        "to": "hbo5tmq",
        "as": "arg2"
      },
      {
        "from": "g19y12v",
        "to": "lgx7u5i",
        "as": "text"
      },
      {
        "from": "9vqinsg",
        "to": "ehximpo",
        "as": "style"
      },
      {
        "from": "i38qweq",
        "to": "9vqinsg",
        "as": "userSelect"
      },
      {
        "from": "eemfhib",
        "to": "8dy573e",
        "as": "value"
      },
      {
        "from": "n2a984s",
        "to": "ehximpo",
        "as": "onpointerup"
      },
      {
        "from": "nhmeamz",
        "to": "n2a984s",
        "as": "arg0"
      },
      {
        "from": "a14g4yc",
        "to": "n2a984s",
        "as": "arg1"
      }
    ],
    "out": "out"
  },
      {
        "id": "cache",
        "description": "Stores the first value that's `!== undefined` and returns that value whenever called. If used within a `map`, `filter`, or `reduce` node, each iteration's value will be cached separately.",
        "out": "out",
        "nodes": [
          {"id": "value", "ref": "arg", "value": "value"},
          {"id": "graphid", "ref": "arg", "value": "__graphid"},
          {"id": "recache", "ref": "arg", "value": "recache"},
          {"id": "cachevalue_state", "ref": "arg", "value": "cachevalue.state"},
          {"id": "pred_cache_state", "ref": "script", "value": "return (cachevaluestate === undefined || cachevaluestate === null) || (recache !== false && recache !== undefined && (typeof recache !== 'object' || Object.keys(recache).length > 0))"},
          {"id": "ap_cache_value", "ref": "arg", "value": "value"},
          {"id": "ap_cache_args"},
          {"id": "ap_cache_run", "value": "true"},
          {"id": "ap_cache_fn", "ref": "arg", "value": "cachevalue.set"},
          {"id": "cache", "ref": "ap"},
          {"id": "if_cache_state", "ref": "if"},
          {"id": "cache_state", "ref": "state"},
          {"id": "cache_return_args"},
          {"id": "cache_return", "ref": "return"},
          {"id": "recache_button_fn", "ref": "arg", "value": "cachevalue.set"},
          {"id": "recache_button_fn_args"},
          {"id": "recache_button_fn_value", "ref": "arg", "value": "value"},
          {"id": "recache_button_ap", "ref": "ap"},
          {"id": "recache_button", "ref": "tapbuttonlocal"},
          {"id": "out", "ref": "return"}
        ],
        "edges": [
          {"from": "ap_cache_value", "to": "ap_cache_args", "as": "value"},
          {"from": "ap_cache_args", "to": "cache", "as": "args"},
          {"from": "ap_cache_run", "to": "cache", "as": "run"},
          {"from": "ap_cache_fn", "to": "cache", "as": "fn"},
          {"from": "cachevalue_state", "to": "pred_cache_state", "as": "cachevaluestate"},
          {"from": "recache", "to": "pred_cache_state", "as": "recache"},
          {"from": "cachevalue_state", "to": "if_cache_state", "as": "false"},
          {"from": "cache", "to": "if_cache_state", "as": "true"},
          {"from": "pred_cache_state", "to": "if_cache_state", "as": "pred"},
          {"from": "if_cache_state", "to": "cache_return", "as": "value"},
          {"from": "cache_state", "to": "cache_return_args", "as": "cachevalue"},
          {"from": "cache_return_args", "to": "out", "as": "args"},
          {"from": "cache_return", "to": "out", "as": "value"},
          {"from": "recache_button_fn_value", "to": "recache_button_fn_args", "as": "value"},
          {"from": "recache_button_fn_args", "to": "recache_button_ap", "as": "args"},
          {"from": "recache_button_fn", "to": "recache_button_ap", "as": "fn"},
          {"from": "recache_button_ap", "to": "recache_button", "as": "ontap"},
          {"from": "recache_button", "to": "out", "as": "display"}
        ]
      },
      {
        "id": "isunchanged",
        "description": "Returns true if `value` is unchanged otherwise `false`.",
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
          {"id": "cache", "ref": "set_arg", "value": "cached"},
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
        "description": "Runs the node at `path` (or this node's value).Path is determined as a route from the output node of the graph",
        "out": "out",
        "nodes": [
          {"id": "path", "ref": "arg", "value": "path"},
          {"id": "value", "ref": "arg", "value": "__graph_value"},
          {"id": "path_value", "ref": "default"},
          {"id": "args", "ref": "arg", "value": "_args", "type": "internal"},
          {"id": "runnable", "script": "const parent = _lib.no.runtime.get_parent(_graph); const node_id = _lib.no.runtime.get_path(parent, path); return {fn: node_id, graph: parent, args: {...args, edge: args.edge ? {...args.edge, node_id: parent.id + '/' + node_id} : undefined}}"},
          {"id": "run_runnable", "ref": "run"},
          {"id": "out", "ref": "return"}
        ],
        "edges": [
          {"from": "path", "to": "path_value", "as": "value"},
          {"from": "value", "to": "path_value", "as": "otherwise"},
          {"from": "path_value", "to": "runnable", "as": "path"},
          {"from": "args", "to": "runnable", "as": "args"},
          {"from": "runnable", "to": "run_runnable", "as": "runnable"},
          {"from": "run_runnable", "to": "out", "as": "value"}
        ]
      },
      {
        "id": "get_arg",
        "description": "Gets the value at `path` (or this node's value) from the context. Similar to an arg node. Accepts a `.` separated path e.g. get(target, 'a.b.c') returns target.a.b.c",
        "nodes": [
          { "id": "target", "ref": "arg", "value": "target" },
          { "id": "path", "ref": "arg", "value": "path" },
          {"id": "value_path", "ref": "arg", "value": "__graph_value"},
          {"id": "def_path", "ref": "default"},
          {"id": "args", "ref": "arg", "value": "_args"},
          { "id": "key", "ref": "arg", "value": "key" },
          { "id": "key_def", "ref": "default", "value": "" },
          { "id": "key_path", "ref": "add"},
          { "id": "otherwise", "ref": "arg", "value": "otherwise" },
          { "id": "out", "ref": "extern", "value": "extern.get" }
        ],
        "edges": [
          { "from": "in", "to": "out", "as": "input" },
          { "from": "otherwise", "to": "out", "as": "def" },
          {"from": "value_path", "to": "def_path", "as": "value"},
          {"from": "path", "to": "def_path", "as": "otherwise"},
          {"from": "def_path", "to": "key_path", "as": "a1"},
          {"from": "key", "to": "key_def", "as": "value"},
          {"from": "key_def", "to": "key_path", "as": "a2"},
          {"from": "key_path", "to": "out", "as": "path"},
          { "from": "target", "to": "out", "as": "target" }
        ]
      },
      {
        "id": "state",
        "out": "out",
        "nodes": [
          {"id": "graphid", "ref": "arg", "value": "__graphid"},
          {"id": "path", "value": "state"},
          {"id": "state_val", "ref": "script", "value": "return _lib.no.runtime.get_args(graphid)[path];"},
          {"id": "value", "ref": "arg", "value": "value"},
          {"id": "set_state_val", "ref": "script", "value": "_lib.no.runtime.update_args(graphid, {[path]: value}); return value"},
          {"id": "set_state_val_runnable", "ref": "runnable"},
          {"id": "display_text", "ref": "html_text"},
          {"id": "display", "ref": "html_element"},
          {"id": "out_atom"},
          {"id": "out", "ref": "return"}
        ],
        "edges": [
          {"from": "graphid", "to": "state_val", "as": "graphid"},
          {"from": "path", "to": "state_val", "as": "path"},
          {"from": "graphid", "to": "set_state_val", "as": "graphid"},
          {"from": "value", "to": "set_state_val", "as": "value"},
          {"from": "path", "to": "set_state_val", "as": "path"},
          {"from": "set_state_val", "to": "set_state_val_runnable", "as": "fn"},
          {"from": "set_state_val_runnable", "to": "out_atom", "as": "set"},
          {"from": "state_val", "to": "out_atom", "as": "state"},
          {"from": "state_val", "to": "display_text", "as": "text"},
          {"from": "display_text", "to": "display", "as": "children"},
          {"from": "display", "to": "out", "as": "display"},
          {"from": "out_atom", "to": "out", "as": "value"}
        ]
      },
      {
        "id": "set_arg",
        "description": "Sets the value at `path` (or this node's value) on this graph's context. If used within a `map`, `filter`, or `reduce`, the arg will be separate for each loop. This behaviour can be changed by passing in a `key` separately.",
        "out": "out_ret",
        "nodes": [
          {"id": "value", "ref": "arg", "value": "value"},
          {"id": "path", "ref": "arg", "value": "path"},
          {"id": "graph", "ref": "arg", "value": "graph"},
          {"id": "args", "ref": "arg", "value": "_args"},
          {"id": "value_path", "ref": "arg", "value": "__graph_value"},
          {"id": "graphid", "ref": "arg", "value": "__graphid"},
          {"id": "def_path", "ref": "default"},
          {"id": "env", "ref": "script", "value": "return _lib.no.runtime.get_args(_lib.no.runtime.get_parent(graph ?? graphid))"},
          {"id": "prev_value", "ref": "get"},
          {"id": "set_val", "ref": "set"},
          {"id": "update_args", "ref": "script", "value": "_lib.no.runtime.update_args(_lib.no.runtime.get_parent(graph ?? graphid), success); return success;"},
          {"id": "on_false", "script": "return value;"},
          {"id": "on_true", "ref": "arg", "value": "value"},
          {"id": "out", "ref": "if"},
          {"id": "out_ret", "ref": "return"}
      ],
      "edges": [
        {"from": "value_path", "to": "def_path", "as": "value"},
        {"from": "path", "to": "def_path", "as": "otherwise"},
        {"from": "def_path", "to": "key_path", "as": "a1"},
        {"from": "def_path", "to": "update_args", "as": "path"},
        {"from": "key", "to": "key_def", "as": "value"},
        {"from": "key_def", "to": "key_path", "as": "a2"},
        {"from": "def_path", "to": "set_val", "as": "path"},
        {"from": "value", "to": "set_val", "as": "value", "type": "resolve"},
        {"from": "args", "to": "env", "as": "args"},
        {"from": "graph", "to": "env", "as": "graph"},
        {"from": "graphid", "to": "env", "as": "graphid"},
        {"from": "graphid", "to": "update_args", "as": "graphid"},
        {"from": "graph", "to": "update_args", "as": "graph"},
        {"from": "env", "to": "set_val", "as": "target"},
        {"from": "update_args", "to": "on_false", "as": "value"},
        {"from": "on_false", "to": "out", "as": "false"},
        {"from": "on_true", "to": "out", "as": "true"},
        {"from": "env", "to": "update_args", "as": "env"},
        {"from": "set_val", "to": "update_args", "as": "success"},
        {"from": "update_args", "to": "out", "as": "pred"},
        {"from": "out", "to": "out_ret", "as": "value"}
      ]
    },
    {
      "id": "set_arg_runnable",
      "description": "See set_arg",
      "out": "out",
      "nodes": [
        {"id": "sa_value", "ref": "arg", "value": "value"},
        {"id": "value_runnable", "ref": "arg", "value": "value_runnable"},
        {"id": "key", "ref": "arg", "value": "key"},
        {"id": "path", "ref": "arg", "value": "path"},
        {"id": "value_path", "ref": "arg", "value": "__graph_value"},
        {"id": "graph", "ref": "arg", "value": "_graph"},
        {"id": "input_args", "ref": "arg", "value": "_args"},
        {"id": "node_args", "ref": "arg", "value": "args"},
        {"id": "inner_value", "ref": "arg", "value": "value"},
        {"id": "_sa_value_args", "ref": "set", "value": "__args"},
        {"id": "sa_value_args", "ref": "script", "value": "return {...target, __args: value}"},
        {"id": "runnable_args"},
        {"id": "unwrap_sa_value", "ref": "extern", "value": "extern.unwrap_proxy"},
        {"id": "set_sa_value_args", "ref": "set", "value": "args"},
        {"id": "run_sa_value", "ref": "run"},
        {"id": "def_path", "ref": "default"},
        {"id": "log_def_path", "ref": "log", "value": "logdefpath"},
        {"id": "set", "ref": "set_arg"},
        {"id": "out", "ref": "runnable"}
      ],
      "edges": [
        {"from": "key", "to": "set", "as": "key"},
        {"from": "sa_value", "to": "unwrap_sa_value", "as": "proxy"},
        {"from": "node_args", "to": "sa_value_args", "as": "target"},
        {"from": "input_args", "to": "sa_value_args", "as": "value"},
        {"from": "value_runnable", "to": "set_sa_value_args", "as": "target"},
        {"from": "sa_value_args", "to": "set_sa_value_args", "as": "value"},
        {"from": "input_args", "to": "_set_sa_value_args", "as": "value"},
        {"from": "set_sa_value_args", "to": "run_sa_value", "as": "runnable"},
        {"from": "run_sa_value", "to": "set", "as": "value"},
        {"from": "value_path", "to": "def_path", "as": "value"},
        {"from": "path", "to": "def_path", "as": "otherwise"},
        {"from": "unwrap_sa_value", "to": "runnable_args", "as": "value_runnable"},
        {"from": "def_path", "to": "log_def_path", "as": "value"},
        {"from": "def_path", "to": "runnable_args", "as": "path"},
        {"from": "graph", "to": "runnable_args", "as": "graph"},
        {"from": "runnable_args", "to": "out", "as": "args"},
        {"from": "set", "to": "out", "as": "fn"}
      ]
    },
    {
      "id": "publish_event",
      "description": "Publishes a `name` (or this node's value) event with the data `value`.",
      "out": "out",
      "nodes": [
        { "id": "value", "ref": "arg", "value": "data" },
        { "id": "arg_name", "ref": "arg", "value": "name" },
        {"id": "graph_value", "ref": "arg", "value": "__graph_value"},
        { "id": "update_event", "ref": "arg", "value": "event_name" },
        { "id": "update_data", "ref": "arg", "value": "event_data" },
        {"id": "name", "ref": "default"},
        { "id": "update", "script": "return _lib.no.runtime.publish(event_name, {data: event_data})" },
        {"id": "ap_args"},
        {"id": "update_runnable", "ref": "runnable"},
        {"id": "out", "ref": "ap"}
      ],
      "edges": [
        {"from": "arg_name", "to": "name", "as": "value"},
        {"from": "graph_value", "to": "name", "as": "otherwise"},
        { "from": "name", "to": "ap_args", "as": "event_name" },
        { "from": "value", "to": "ap_args", "as": "event_data" },
        {"from": "update_event", "to": "update", "as": "event_name"},
        {"from": "update_data", "to": "update", "as": "event_data"},
        {"from": "update", "to": "update_runnable", "as": "fn"},
        {"from": "update_runnable", "to": "out", "as": "fn"},
        {"from": "ap_args", "to": "out", "as": "args"},
      ]
    },
    {
      "id": "event_publisher_onchange",
      "description": "Publishes a `name` (or this node's value) event with the data `value` when `value` changes.",
      "out": "out",
      "nodes": [
        {"id": "value", "ref": "arg", "value": "value"},
        {"id": "value_eq_a", "ref": "arg", "value": "a"},
        {"id": "value_eq_b", "ref": "arg", "value": "b"},
        {"id": "value_eq_fn", "script": "return _lib.compare(a, b)"},
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
      "description": "Displays the last `value` received. Will display \"undefined\" if this node has not been run.",
      "out": "out",
      "nodes": [
        { "id": "out", "name": "input_value", "ref": "return" },
        { "id": "cfuymky", "value": "{\"a\": 1, \"b\": {\"c\": 2, \"d\": 3}}" },
        { "id": "4d8qcss", "ref": "html_text" },
        { "id": "rpys4rr", "value": "value", "ref": "arg" },
        { "id": "1znvqbi", "value": "value", "ref": "arg" },
        { "id": "qwz3ftj", "ref": "script", "value": "return typeof object !== 'object' || Array.isArray(object) || Object.getPrototypeOf(object) === Object.prototype ? JSON.stringify(object) : Object.getPrototypeOf(object) ? Object.getPrototypeOf(object).constructor.name : `${object}`" },
        { "id": "5a6pljw", "value": "pre", "ref": "html_element" },
        { "id": "17pcf8z", "value": "2" },
      ],
      "edges": [
        { "from": "5a6pljw", "to": "out", "as": "display" },
        { "from": "cfuymky", "to": "args", "as": "value" },
        { "from": "4d8qcss", "to": "5a6pljw", "as": "children" },
        { "from": "1znvqbi", "to": "qwz3ftj", "as": "object" },
        { "from": "17pcf8z", "to": "qwz3ftj", "as": "spacer" },
        { "from": "qwz3ftj", "to": "4d8qcss", "as": "text" },
        { "from": "rpys4rr", "to": "out", "as": "value" }
      ],
    },
    {
      "id": "event_subscriber",
      "description": "Returns the last value of the `name` (or this node's value) event.",
      "out": "out",
      "nodes": [
        { "id": "name", "ref": "arg", "value": "name" },
        { "id": "onevent", "ref": "arg", "value": "onevent", "type": "local" },
        { "id": "data", "ref": "arg", "value": "_data", "type": "internal" },
        {"id": "data_log", "ref": "log"},
        {
          "id": "add_listener",
          "script": "_lib.no.runtime.add_listener(event ?? __graph_value, 'evt-listener-' + _graph.id, (data) => { let update = true; if(onevent){ update = _lib.no.run(onevent.graph, onevent.fn, {...onevent.args, data, prev}); } if(update){ _lib.no.runtime.update_args(_graph, {_data: data.data}) } }, false); return _lib.no.runtime.get_args(_graph)['_data'];"
        },
        { "id": "out", "ref": "default"}
      ],
      "edges": [
        { "from": "name", "to": "add_listener", "as": "event" },
        { "from": "onevent", "to": "add_listener", "as": "onevent" },
        { "from": "data", "to": "add_listener", "as": "prev" },
        { "from": "add_listener", "to": "out", "as": "otherwise" },
        { "from": "data", "to": "out", "as": "value" },
      ]
    },
    { 
      "id": "events_broadcast_channel", 
      "description": "Runs `runnable` when a message is received from the events <a target='_blank' href='https://developer.mozilla.org/en-US/docs/Web/API/BroadcastChannel'>broadcast channel</a>. Can be used to communicate between tabs or worker processes.",
      "out": "out",
      "nodes": [
        {"id": "arg_onmessage", "ref": "arg", "value": "onmessage"},
        {"id": "message_data", "ref": "arg", "value": "message.data.data"},
        {"id": "message_name", "ref": "arg", "value": "message.data.name"},
        {"id": "publish_event", "ref": "event_publisher"},
        {"id": "publish_event_runnable", "ref": "runnable"},
        {"id": "onmessageseq", "ref": "sequence"},
        {"id": "out", "script": "const bc = new BroadcastChannel('events'); bc.onmessage = e => { _lib.no.run(onmessage.graph, onmessage.fn, {message: e}, _lib); }; return bc;"}
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
      "description": "Runs `runnable` and returns the result.",
      "out": "out",
      "nodes": [
        { "id": "runnable", "ref": "arg", "value": "runnable" },
        {
          "id": "out",
          "script": "return _lib.no.run(runnable.graph, runnable.fn, runnable.args, _lib)"
        }
      ],
      "edges": [
        { "from": "runnable", "to": "out", "as": "runnable" }
      ]
    },
    {
      "id": "reduce",
      "description": "<a target='_blank' href='https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/reduce'>Aray.reduce</a> the `array` with `fn`. Arguments for `fn` are `previous`, `current`, `index`, `array`, and a unique per nested loop `key`.",
      "name": "reduce",
      "in": "m3b5wg3",
      "out": "tgurdpo",
      "nodes": [
        { "id": "tgurdpo", "ref": "call", "name": "out" },
        { "id": "key", "ref": "arg", "value": "key" },
        { "id": "rielyq8", "value": "reduce", "name": "rielyq8" },
        { "ref": "arg", "id": "1rre4bx", "value": "array", "name": "1rre4bx" },
        { "ref": "arg", "id": "6g75abk", "value": "fn", "name": "6g75abk" },
        { "id": "w0zzawl", "ref": "array", "name": "w0zzawl" },
        { "id": "args", "ref": "arg", "value": "args", "type": "local" },
        { "id": "initial", "ref": "arg", "value": "initial" },
        {
          "id": "pdljod1",
          "name": "pdljod1",
          "script": "return (previous, current, index, array) => _lib.no.run(fn?.graph ?? _graph, fn?.fn ?? fn, Object.assign({}, args ?? {}, fn.args ?? {}, {previous, current, index, array, key: outer_key ? `${index}_${outer_key}` : `${index}`}), _lib);"
        },
        { "id": "2lvs5dj", "script": "return _graph", "name": "2lvs5dj" }
      ],
      "edges": [
        { "from": "rielyq8", "to": "tgurdpo", "as": "fn" },
        { "from": "1rre4bx", "to": "tgurdpo", "as": "self" },
        { "from": "w0zzawl", "to": "tgurdpo", "as": "args", "type": "resolve" },
        { "from": "pdljod1", "to": "w0zzawl", "as": "a0" },
        { "from": "initial", "to": "w0zzawl", "as": "a1" },
        { "from": "2lvs5dj", "to": "pdljod1", "as": "graph" },
        { "from": "key", "to": "pdljod1", "as": "outer_key" },
        { "from": "args", "to": "pdljod1", "as": "args" },
        { "from": "6g75abk", "to": "pdljod1", "as": "fn" }
      ]
    },
    {
      "id": "map",
      "out": "out",
      "description": "<a target='_blank' href='https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/map'>Aray.map</a> the `array` with `fn`. Arguments for `fn` are `element`, `index`, `array`, and a unique per nested loop `key`.",
      "nodes": [
        {"id": "object", "ref": "arg", "value": "array"},
        {"id": "map_fn", "ref": "arg", "value": "fn"},
        {"id": "element", "ref": "arg", "value": "element"},
        {"id": "map_fn_args"},
        {"id": "run_map", "value": "true"},
        {"id": "map_element_fn", "ref": "extern", "value": "extern.ap"},
        {"id": "currentValue", "ref": "arg", "value": "currentValue"},
        {"id": "previousValue", "ref": "arg", "value": "previousValue"},
        {"id": "append", "ref": "script", "value": "arr.push(value); return arr;"},
        {"id": "append_runnable", "ref": "runnable"},
        {"id": "initial", "value": "[]"},
        {"id": "fold", "ref": "extern", "value": "extern.fold"},
        {"id": "out", "ref": "return"}
      ],
      "edges": [
        {"from": "currentValue", "to": "map_fn_args", "as": "element"},
        {"from": "map_fn_args", "to": "map_element_fn", "as": "args"},
        {"from": "map_fn", "to": "map_element_fn", "as": "fn"},
        {"from": "run_map", "to": "map_element_fn", "as": "run"},
        {"from": "map_element_fn", "to": "append", "as": "value"},
        {"from": "previousValue", "to": "append", "as": "arr"},
        {"from": "append", "to": "append_runnable", "as": "fn"},
        {"from": "append_runnable", "to": "fold", "as": "fn"},
        {"from": "object", "to": "fold", "as": "object"},
        {"from": "initial", "to": "fold", "as": "initial"},
        {"from": "fold", "to": "out", "as": "value"},
      ]
    },
    {
      "id": "filter",
      "description": "<a target='_blank' href='https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/filter'>Aray.filter</a> the `array` with `fn`. Arguments for `fn` are `element`, `index`, `array`, and a unique per nested loop `key`.",
      "out": "out",
      "nodes": [
        {"id": "object", "ref": "arg", "value": "array"},
        {"id": "pred_fn", "ref": "arg", "value": "fn"},
        {"id": "el_currentValue", "ref": "arg", "value": "currentValue"},
        {"id": "pred_fn_args"},
        {"id": "run_pred", "value": "true"},
        {"id": "pred_element_fn", "ref": "extern", "value": "extern.ap"},
        {"id": "currentValue", "ref": "arg", "value": "currentValue"},
        {"id": "previousValue", "ref": "arg", "value": "previousValue"},
        {"id": "pred_append", "ref": "script", "value": "if(pred === true){ arr.push(value); } return arr;"},
        {"id": "pred_append_fn", "ref": "runnable"},
        {"id": "initial", "value": "[]"},
        {"id": "fold", "ref": "extern", "value": "extern.fold"},
        {"id": "out", "ref": "return"}
      ],
      "edges": [
        {"from": "el_currentValue", "to": "pred_fn_args", "as": "element"},
        {"from": "pred_fn_args", "to": "pred_element_fn", "as": "args"},
        {"from": "pred_fn", "to": "pred_element_fn", "as": "fn"},
        {"from": "run_pred", "to": "pred_element_fn", "as": "run"},
        {"from": "currentValue", "to": "pred_append", "as": "value"},
        {"from": "previousValue", "to": "pred_append", "as": "arr"},
        {"from": "pred_element_fn", "to": "pred_append", "as": "pred"},
        {"from": "pred_append", "to": "pred_append_fn", "as": "fn"},
        {"from": "pred_append_fn", "to": "fold", "as": "fn"},
        {"from": "object", "to": "fold", "as": "object"},
        {"from": "initial", "to": "fold", "as": "initial"},
        {"from": "fold", "to": "out", "as": "value"},
      ]
    },
    {
      "id": "sequence",
      "description": "Create a new runnable that runs the input runnables in sequence.",
      "name": "sequence",
      "out": "out",
      "_ref": "extern",
      "_value": "sequence",
      "nodes": [
        { "id": "args", "ref": "arg", "value": "__args" },
        { "id": "seq_ap_args", "ref": "arg", "value": "_args" },
        {"id": "delete_args", "ref": "script", "value": "const ret = {...target}; delete ret.args; return ret;"},
        { "id": "seq_fold_currentValue", "ref": "arg", "value": "currentValue.1" },
        { "id": "seq_ap_run", "value": "true" },
        { "id": "seq_ap", "ref": "ap" },
        { "id": "seq_ap_runnable", "ref": "runnable" },
        { "id": "seq_fold", "ref": "fold"},
        { "id": "out", "ref": "runnable"}
      ],
      "edges": [
        { "from": "args", "to": "delete_args", "as": "target" },
        { "from": "args", "to": "_seq_fold", "as": "object" },
        { "from": "delete_args", "to": "seq_fold", "as": "object" },
        {"from": "seq_ap_run", "to": "seq_ap", "as": "run"},
        {"from": "seq_fold_currentValue", "to": "seq_ap", "as": "fn"},
        {"from": "seq_ap", "to": "seq_ap_runnable", "as": "fn"},
        {"from": "seq_ap_args", "to": "seq_ap", "as": "args"},
        {"from": "seq_ap_runnable", "to": "seq_fold", "as": "fn"},
        {"from": "seq_fold", "to": "out", "as": "fn"},
      ]
    },
    {
      "id": "import_json",
      "description": "Imports the node or nodes found at the `url`.",
      "name": "import_json",
      "out": "out",
      "nodes": [
        {
          "id": "lapeojg",
          "script": "console.log('importj son'); console.log(import_graph); import_graph.forEach(_lib.no.runtime.add_ref); _lib.no.runtime.change_graph(_lib.no.runtime.get_graph(graphid))",
          "name": "out"
        },
        { "id": "out", "ref": "return" },
        { "id": "3zfjt1h", "ref": "call" },
        { "id": "05eag47", "ref": "arg", "value": "name" },
        { "id": "graphid", "ref": "arg", "value": "__graphid" },
        { "id": "2vtokcl", "script": "return fetch(url);" },
        { "id": "i9x02is", "value": "json" },
        { "id": "irr99xz", "ref": "arg", "value": "url" }
      ],
      "edges": [
        { "as": "import_graph", "from": "3zfjt1h", "to": "lapeojg" },
        { "from": "graphid", "to": "lapeojg", "as": "graphid" },
        { "from": "05eag47", "to": "lapeojg", "as": "name" },
        { "from": "lapeojg", "to": "out", "as": "value" },
        { "as": "self", "from": "2vtokcl", "to": "3zfjt1h" },
        { "from": "i9x02is", "to": "3zfjt1h", "as": "fn" },
        { "from": "irr99xz", "to": "2vtokcl", "as": "url" }
      ]
    },
    {
      "id": "object_entries",
      "description": "Calls <a target='_blank' href='https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/entries'>Object.entries</a> on `object`.",
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
      "id": "css_styles",
      "description": "Creates a style element from `css_object`. Inputs to the object should be labeled with css selectors, and inputs to those objects with css properties.",
      "name": "css_styles",
      "in": "xw3pmx7",
      "out": "out",
      "nodes": [
        { "id": "out", "ref": "return", "name": "css_styles" },
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
        { "from": "5yxmxua", "to": "out", "as": "value" },
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
      "id": "css_anim",
      "description": "Creates a css animation string. For use with `css_styles`.",
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
        { "id": "2zxw9oo", "ref": "run", "name": "stop_propagation" },
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
            { "id": "1pvaim9", "ref": "run" },
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
        { "id": "6m6m1hq_1/ocuonub/506ntvb", "value": "event.target.value", "ref": "arg" },
        { "id": "6m6m1hq_1/ocuonub/4ck1vaf", "ref": "arg", "value": "name" }
      ],
      "out": "nn4twx9",
      "in": "7rhq0q5",
      "name": "input",
      "id": "input"
    },
    {
      "id": "html_text",
      "description": "Some HTML plaintext of `text` (or this node's value). Usually used as a child of html_element.",
      "out": "out",
      "nodes": [
        { "id": "arg_text", "ref": "arg", "value": "text" },
        { "id": "value_text", "ref": "arg", "value": "__graph_value" },
        {"id": "text", "ref": "default"},
        { "id": "text_value", "value": "text_value" },
        { "id": "out" }
      ],
      "edges": [
        { "from": "text_value", "to": "out", "as": "dom_type" },
        { "from": "arg_text", "to": "text", "as": "value" },
        { "from": "value_text", "to": "text", "as": "otherwise" },
        { "from": "text", "to": "out", "as": "text" },
      ]
    },
    {
        "id": "html_element",
        "out": "out_ret",
        "description": "An HTML Element. `children` is an array of html_element or html_text, `props` are the attributes for the html element as an object, `dom_type` (or this node's value) is the dom type, `memo` refers to <a target='_blank' href='https://github.com/jorgebucaran/hyperapp/blob/main/docs/api/memo.md'>hyperapp's memo</a>.",
        "nodes": [
          { "id": "children", "ref": "arg", "value": "children" },
          { "id": "props", "ref": "arg", "value": "props" },
          { "id": "dom_type", "ref": "arg", "value": "dom_type" },
          { "id": "memo", "ref": "arg", "value": "memo" },
          { "id": "value", "ref": "arg", "value": "value" },
          { "id": "element_dt", "ref": "arg", "value": "element.dom_type" },
          { "id": "element", "ref": "arg", "value": "element" },
          { "id": "element_tv", "ref": "arg", "value": "element.text_value" },
          { "id": "div", "value": "div" },
          { "id": "dom_type_value", "ref": "default"},
          { "id": "graph_value", "ref": "arg", "value": "__graph_value"},
          {"id": "filter_children_fn", "script": "return !!(element_dt || element_tv)"},
          {"id": "filter_children_fn_runnable", "ref": "runnable"},
          {"id": "fill_children_fn", "script": "return element?.el ?? typeof element === 'string' ? {dom_type: 'text_value', text: element} : element"},
          {"id": "fill_children_fn_runnable", "ref": "runnable"},
          {"id": "wrapped_children", "script": "return Array.isArray(children) ? children : [children]"},
          {"id": "filter_children", "ref": "filter"},
          {
            "id": "fill_children",
            "ref": "map",
          },
          { "id": "fill_props", "script": "return props ?? {}" },
          { "id": "dom_type_def", "ref": "default" },
          {
            "id": "out",
            "script": "if(!(typeof dom_type === 'string' && typeof children === 'object')){ throw new Error('invalid element');} return {dom_type, props, children: children, memo, value}"
          },
          {"id": "out_ret", "ref": "return"}
        ],
        "edges": [
          { "from": "children", "to": "wrapped_children", "as": "children" },
          { "from": "wrapped_children", "to": "fill_children", "as": "array" },
          { "from": "props", "to": "fill_props", "as": "props" },
          { "from": "memo", "to": "out", "as": "memo"},
          {"from": "element_dt", "to": "filter_children_fn", "as": "element_dt"},
          {"from": "element_tv", "to": "filter_children_fn", "as": "element_tv"},
          {"from": "filter_children_fn", "to": "filter_children_fn_runnable", "as": "fn"},
          {"from": "filter_children_fn_runnable", "to": "filter_children", "as": "fn"},
          {"from": "element", "to": "fill_children_fn", "as": "element"},
          {"from": "fill_children_fn", "to": "fill_children_fn_runnable", "as": "fn"},
          {"from": "fill_children_fn_runnable", "to": "fill_children", "as": "fn"},
          { "from": "fill_children", "to": "filter_children", "as": "array"},
          { "from": "filter_children", "to": "out", "as": "children"},
          { "from": "value", "to": "out", "as": "value"},
          { "from": "fill_props", "to": "out", "as": "props" },
          { "from": "dom_type", "to": "dom_type_def", "as": "value" },
          { "from": "div", "to": "dom_type_value", "as": "otherwise" },
          { "from": "graph_value", "to": "dom_type_value", "as": "value" },
          { "from": "dom_type_value", "to": "dom_type_def", "as": "otherwise" },
          { "from": "dom_type_def", "to": "out", "as": "dom_type" },
          {"from": "out", "to": "out_ret", "as": "value"}
        ]
    },
    {
      "id": "icon",
      "description": "A ionicon in hyperapp format.",
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
    { "id": "not", "script": "return !target" },
    {"id":"walk_graph","nodes":[{"id":"args"},{"id":"cfuymky","value":"testx"},{"id":"5a6pljw","ref":"html_element"},{"id":"out","name":"walk_graph","ref":"return"},{"id":"5xlxejq","ref":"html_text"},{"id":"8qkc61x","ref":"runnable"},{"id":"dv0p0id","value":"walker","ref":"log"},{"id":"dqs1arj","value":"graph","name":"","ref":"arg"},{"id":"pe7geox","value":"return _lib.no.runtime.get_edges_in(graph.graph, graph.node)","ref":"script"},{"id":"glnadhk","value":"return {node: _node.id, graph: _graph.id}","ref":"script"},{"id":"yophjcb","ref":"map"},{"id":"r3nrc31","ref":"runnable"},{"id":"nhqynsn","value":"element.from","ref":"arg"},{"id":"y4eppvf","value":"graph.graph","ref":"arg"},{"id":"lxjljmp","value":"node","ref":"arg"},{"id":"fo2ul3t","value":"fn","ref":"arg"},{"id":"x2ieyic","ref":"walk_graph"},{"id":"8kp4fri","value":"testz"},{"id":"b8n58i0","value":"testa"},{"id":"ik55pc7","value":"texty"},{"id":"1ecvy51","value":"return {node: _lib.no.runtime.get_node(graph, edge_from), graph}","ref":"script"},{"id":"27950jh"},{"id":"deh12wg","value":"edge","ref":"arg"},{"id":"sfwk3w6","value":"edge","ref":"log"},{"id":"uw2yljj","value":"node","ref":"log"},{"id":"dc70b7u","value":"element","ref":"arg"},{"id":"fhqwbjg","value":"_lib.no.run(fn.graph, fn.fn, {node: node.node, edge}); return {graph: node.graph, node: node.node.id};","ref":"script"}],"edges":[{"from":"args","to":"out","as":"args"},{"from":"5a6pljw","to":"out","as":"display"},{"from":"cfuymky","to":"glnadhk","as":"arg0"},{"from":"8kp4fri","to":"glnadhk","as":"arg1"},{"from":"ik55pc7","to":"8kp4fri","as":"arg0"},{"from":"5xlxejq","to":"5a6pljw","as":"children"},{"from":"8qkc61x","to":"args","as":"fn"},{"from":"dv0p0id","to":"8qkc61x","as":"fn"},{"from":"glnadhk","to":"args","as":"graph"},{"from":"dqs1arj","to":"pe7geox","as":"graph"},{"from":"pe7geox","to":"yophjcb","as":"array"},{"from":"r3nrc31","to":"yophjcb","as":"fn"},{"from":"nhqynsn","to":"1ecvy51","as":"edge_from"},{"from":"y4eppvf","to":"1ecvy51","as":"graph"},{"from":"fo2ul3t","to":"fhqwbjg","as":"fn"},{"from":"1ecvy51","to":"fhqwbjg","as":"node"},{"from":"x2ieyic","to":"r3nrc31","as":"fn"},{"from":"fhqwbjg","to":"x2ieyic","as":"graph"},{"from":"yophjcb","to":"out","as":"return"},{"from":"27950jh","to":"dv0p0id","as":"value"},{"from":"sfwk3w6","to":"27950jh","as":"arg1"},{"from":"deh12wg","to":"sfwk3w6","as":"value"},{"from":"uw2yljj","to":"27950jh","as":"arg0"},{"from":"lxjljmp","to":"uw2yljj","as":"value"},{"from":"dc70b7u","to":"fhqwbjg","as":"edge"},{"from":"b8n58i0","to":"glnadhk","as":"arg22"}],"out":"out"},
  {
    "id": "canvas_behind_editor",
    "description": "Creates a HTML canvas behind the node editor",
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
        "id": "out",
        "name": "canvas_behind_editor",
        "ref": "return"
      }
    ],
    "edges": [
      {
        "from": "args",
        "to": "out",
        "as": "args"
      },
      {
        "from": "imr2dvi",
        "to": "out",
        "as": "value"
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
    "out": "out"
  },
  {
    "id": "call_method",
    "description": "Calls the method corresponding to this node's value of `self`. It can be '.' separated path. If `self` is not set, the node's context will be used.",
    "out": "out",
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
      {"id": "graphvalue", "ref": "arg", "value": "__graph_value"},
      {"id": "graphvalue2", "ref": "arg", "value": "__graph_value"},
      {"id": "graphvalue3", "ref": "arg", "value": "__graph_value"},
      {
        "id": "nzg5arg",
        "value": "return fn ?? graphvalue;",
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
        "value": "return fn ?? graphvalue;",
        "ref": "script"
      },
      {
        "id": "or9k7xt",
        "ref": "runnable"
      },
      {
        "id": "fzeowyv",
        "value": "event.target.value",
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
        "value": "return fn ?? graphvalue",
        "ref": "script"
      },
      {
        "id": "out",
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
        "value": "[]"
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
        "value": "if(typeof res !== 'object'){ return []; } const keys = _lib.properties.getOwnAndPrototypeEnumerablesAndNonenumerables(res, true); return keys.filter(k => !k.startsWith('_') && typeof res[k] === 'function').sort().map(key => ({key}));",
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
        "to": "out",
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
        "to": "out",
        "as": "value"
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
        "from": "graphvalue",
        "to": "nzg5arg",
        "as": "graphvalue"
      },
      {
        "from": "k14owom",
        "to": "ddgxhvl",
        "as": "fn"
      },
      {
        "from": "graphvalue2",
        "to": "ddgxhvl",
        "as": "graphvalue"
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
        "from": "graphvalue3",
        "to": "6s9b6g0",
        "as": "graphvalue"
      },
      {
        "from": "jyoexsb",
        "to": "6s9b6g0",
        "as": "fn"
      },
      {
        "from": "xvxhk01",
        "to": "7iawyvs",
        "as": "array"
      },
      {
        "from": "def_self",
        "to": "xvxhk01",
        "as": "res"
      }
    ]}
,
  { "id": "import_module", "description": "Dynamically import an es6 module", "ref": "extern", "value": "extern.import_module"},
  {
      "id": "import",
      "description": "Imports the node or nodes from the provided json file",
      "out": "out",
      "nodes": [
        {
          "id": "args"
        },
        {
          "id": "8dy573e",
          "ref": "html_element"
        },
        {
          "id": "out",
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
          "value": "event.target.files.0",
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
          "value": "_lib.no.runtime.change_graph(graph); return graph;",
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
          "to": "out",
          "as": "display"
        },
        {
          "from": "args",
          "to": "out",
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
    },
{
    "id": "import_nodes",
    "description": "Imports the passed in `nodes`",
    "name": "import_nodes",
    "nodes": [
      {
        "id": "v10aosf",
        "name": "import_nodes",
        "ref": "return"
      },
      {
        "id": "uymxrxe",
        "ref": "map"
      },
      {
        "id": "mvg23pd"
      },
      {
        "id": "jvoijof",
        "ref": "parse"
      },
      {
        "id": "yu0e7mk",
        "ref": "runnable"
      },
      {
        "id": "ffu9m49",
        "value": "nodes",
        "ref": "arg"
      },
      {
        "id": "sl7qlmj",
        "value": "scripts.save_graph",
        "ref": "call"
      },
      {
        "id": "cixrltc",
        "value": "_lib.no.runtime.change_graph(graph); return graph;",
        "ref": "script"
      },
      {
        "id": "odeeqm8",
        "value": "return _lib;",
        "ref": "script"
      },
      {
        "id": "hcp6xds",
        "ref": "log"
      },
      {
        "id": "ij46kiv",
        "value": "return ({id: graph.id, value: graph.value, name: graph.name, nodes: graph.nodes, edges: graph.edges, out: graph.out})",
        "ref": "script"
      },
      {
        "id": "3z8hhss",
        "value": "element",
        "ref": "arg"
      }
    ],
    "edges": [
      {
        "from": "uymxrxe",
        "to": "v10aosf",
        "as": "value"
      },
      {
        "from": "mvg23pd",
        "to": "v10aosf",
        "as": "args"
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
        "from": "ffu9m49",
        "to": "jvoijof",
        "as": "string"
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
      },
      {
        "from": "hcp6xds",
        "to": "cixrltc",
        "as": "graph"
      },
      {
        "from": "ij46kiv",
        "to": "hcp6xds",
        "as": "value"
      },
      {
        "from": "3z8hhss",
        "to": "ij46kiv",
        "as": "graph"
      }
    ],
    "out": "v10aosf"
  },{
    "id": "offscreen-canvas",
    "description": "Creates an offscreen canvas for rendering WebGL content. Multiple canvases can be created to allow switching content on a canvas behind the node editor or the info popup canvas.",
    "name": "offscreen-canvas",
    "nodes": [
      {
        "id": "0g1zopd",
        "name": "create-offscreen-canvas",
        "ref": "return"
      },
      {
        "id": "ein7naf",
        "ref": "if"
      },
      {
        "id": "9p0focj"
      },
      {
        "id": "98f35dl",
        "value": "return !!window.OffscreenCanvas",
        "ref": "script"
      },
      {
        "id": "dzb8l3m",
        "value": "canvas",
        "ref": "html_element"
      },
      {
        "id": "c2vbqba"
      },
      {
        "id": "hdn9zr5",
        "value": "offscreen"
      },
      {
        "id": "o40rphy"
      },
      {
        "id": "p6vd4i7",
        "value": "canvas_id",
        "ref": "arg"
      },
      {
        "id": "lik4fr6",
        "value": "return window.innerWidth;",
        "ref": "script"
      },
      {
        "id": "5q5ltj4",
        "value": "return window.innerHeight",
        "ref": "script"
      },
      {
        "id": "w7dugd7",
        "value": "return window.innerWidth;",
        "ref": "script"
      },
      {
        "id": "1wirpfe",
        "value": "return window.innerHeight",
        "ref": "script"
      },
      {
        "id": "16rxy2o",
        "value": "hidden"
      }
    ],
    "edges": [
      {
        "from": "ein7naf",
        "to": "0g1zopd",
        "as": "value"
      },
      {
        "from": "9p0focj",
        "to": "0g1zopd",
        "as": "args"
      },
      {
        "from": "98f35dl",
        "to": "ein7naf",
        "as": "pred"
      },
      {
        "from": "dzb8l3m",
        "to": "ein7naf",
        "as": "false"
      },
      {
        "from": "c2vbqba",
        "to": "dzb8l3m",
        "as": "props"
      },
      {
        "from": "hdn9zr5",
        "to": "c2vbqba",
        "as": "key"
      },
      {
        "from": "o40rphy",
        "to": "c2vbqba",
        "as": "style"
      },
      {
        "from": "p6vd4i7",
        "to": "c2vbqba",
        "as": "id"
      },
      {
        "from": "lik4fr6",
        "to": "c2vbqba",
        "as": "width"
      },
      {
        "from": "5q5ltj4",
        "to": "c2vbqba",
        "as": "height"
      },
      {
        "from": "w7dugd7",
        "to": "o40rphy",
        "as": "width"
      },
      {
        "from": "1wirpfe",
        "to": "o40rphy",
        "as": "height"
      },
      {
        "from": "16rxy2o",
        "to": "o40rphy",
        "as": "visibility"
      }
    ],
    "out": "0g1zopd"
  },
{
    "id": "deleteref",
    "description": "Deletes the graph with the name provided in the text field.",
    "nodes": [
      {
        "id": "args"
      },
      {
        "id": "jklqh38",
        "ref": "html_element"
      },
      {
        "id": "6qkew20",
        "ref": "array"
      },
      {
        "id": "s901gau",
        "value": "button",
        "ref": "html_element"
      },
      {
        "id": "r29uz24"
      },
      {
        "id": "ry9drh5",
        "ref": "runnable"
      },
      {
        "id": "tad7830",
        "value": "test"
      },
      {
        "id": "riwuwbo",
        "value": "input",
        "ref": "html_element"
      },
      {
        "id": "59gcmwe"
      },
      {
        "id": "m9wjk35",
        "ref": "runnable_return"
      },
      {
        "id": "5rneqyp"
      },
      {
        "id": "mogbcfo",
        "ref": "runnable"
      },
      {
        "id": "hsmuv28",
        "value": "stopPropagation",
        "ref": "call"
      },
      {
        "id": "lfn812d",
        "value": "event",
        "ref": "arg"
      },
      {
        "id": "ryomnvu",
        "value": "event.target.value",
        "ref": "arg"
      },
      {
        "id": "5jnnwil",
        "value": "name",
        "ref": "event_subscriber"
      },
      {
        "id": "ouvvf06",
        "value": "delete",
        "ref": "html_text"
      },
      {
        "id": "qc52702",
        "value": "return _lib.no.runtime.refs().filter(r => r.startsWith(namespace + '.') || r === namespace)",
        "ref": "script"
      },
      {
        "id": "e4sglil",
        "value": "refs.forEach(r => localStorage.removeItem(r));",
        "ref": "script"
      },
      {
        "id": "out",
        "name": "deleteref",
        "ref": "return"
      }
    ],
    "edges": [
      {
        "from": "args",
        "to": "out",
        "as": "args"
      },
      {
        "from": "jklqh38",
        "to": "out",
        "as": "display"
      },
      {
        "from": "6qkew20",
        "to": "jklqh38",
        "as": "children"
      },
      {
        "from": "tad7830",
        "to": "args",
        "as": "namespace"
      },
      {
        "from": "ouvvf06",
        "to": "s901gau",
        "as": "children"
      },
      {
        "from": "r29uz24",
        "to": "s901gau",
        "as": "props"
      },
      {
        "from": "ry9drh5",
        "to": "r29uz24",
        "as": "onclick"
      },
      {
        "from": "riwuwbo",
        "to": "6qkew20",
        "as": "arg2"
      },
      {
        "from": "59gcmwe",
        "to": "riwuwbo",
        "as": "props"
      },
      {
        "from": "m9wjk35",
        "to": "59gcmwe",
        "as": "onchange"
      },
      {
        "from": "5rneqyp",
        "to": "m9wjk35",
        "as": "publish"
      },
      {
        "from": "ryomnvu",
        "to": "5rneqyp",
        "as": "name"
      },
      {
        "from": "mogbcfo",
        "to": "59gcmwe",
        "as": "onkeydown"
      },
      {
        "from": "hsmuv28",
        "to": "mogbcfo",
        "as": "fn"
      },
      {
        "from": "lfn812d",
        "to": "hsmuv28",
        "as": "self"
      },
      {
        "from": "e4sglil",
        "to": "ry9drh5",
        "as": "fn"
      },
      {
        "from": "5jnnwil",
        "to": "qc52702",
        "as": "namespace"
      },
      {
        "from": "s901gau",
        "to": "6qkew20",
        "as": "arg3"
      },
      {
        "from": "qc52702",
        "to": "e4sglil",
        "as": "refs"
      }
    ],
    "out": "out"
  },
  {
    "id": "changed",
    "description": "Returns true if `value` has changed",
    "name": "changed",
    "nodes": [
      {
        "id": "p8v5ed5",
        "name": "changed",
        "ref": "return"
      },
      {
        "id": "14mzqe3"
      },
      {
        "id": "vs4opfd",
        "ref": "return"
      },
      {
        "id": "3l4ufol"
      },
      {
        "id": "jlmvbt7",
        "value": "comparison",
        "ref": "get"
      },
      {
        "id": "izbtl3g",
        "value": "value",
        "ref": "arg"
      },
      {
        "id": "mm880mz",
        "ref": "cache"
      },
      {
        "id": "kw0x0bm",
        "value": "state.value",
        "ref": "set_mutable"
      },
      {
        "id": "qqzgl4i"
      },
      {
        "id": "f0ticbo"
      },
      {
        "id": "fvvux6n",
        "value": "value",
        "ref": "arg"
      },
      {
        "id": "2cvrnm9",
        "value": "initial",
        "ref": "arg"
      },
      {
        "id": "uqm4o4b",
        "value": "state",
        "ref": "arg"
      },
      {
        "id": "a59coum",
        "value": "return state != value;",
        "ref": "script"
      },
      {
        "id": "pt5nb1r",
        "value": "state.value",
        "ref": "arg"
      },
      {
        "id": "hkxrk6s",
        "value": "value",
        "ref": "arg"
      }
    ],
    "edges": [
      {
        "from": "14mzqe3",
        "to": "p8v5ed5",
        "as": "args"
      },
      {
        "from": "vs4opfd",
        "to": "p8v5ed5",
        "as": "value"
      },
      {
        "from": "3l4ufol",
        "to": "vs4opfd",
        "as": "args"
      },
      {
        "from": "jlmvbt7",
        "to": "vs4opfd",
        "as": "value"
      },
      {
        "from": "izbtl3g",
        "to": "3l4ufol",
        "as": "value"
      },
      {
        "from": "mm880mz",
        "to": "3l4ufol",
        "as": "state"
      },
      {
        "from": "kw0x0bm",
        "to": "jlmvbt7",
        "as": "target"
      },
      {
        "from": "qqzgl4i",
        "to": "mm880mz",
        "as": "value"
      },
      {
        "from": "f0ticbo",
        "to": "kw0x0bm",
        "as": "target"
      },
      {
        "from": "fvvux6n",
        "to": "kw0x0bm",
        "as": "value"
      },
      {
        "from": "2cvrnm9",
        "to": "qqzgl4i",
        "as": "value"
      },
      {
        "from": "uqm4o4b",
        "to": "f0ticbo",
        "as": "state"
      },
      {
        "from": "a59coum",
        "to": "f0ticbo",
        "as": "comparison"
      },
      {
        "from": "pt5nb1r",
        "to": "a59coum",
        "as": "state"
      },
      {
        "from": "hkxrk6s",
        "to": "a59coum",
        "as": "value"
      }
    ],
    "out": "p8v5ed5"
  },
{
    "id": "webgl",
    "description": "Creates a webgl program with vertex shader `vtx`, fragment shader `frg`, in gl context `gl`.",
    "nodes": [
      {
        "id": "j219svq"
      },
      {
        "id": "04xuprq"
      },
      {
        "id": "jidlrdv",
        "value": "return document.getElementById(\"node-editor-info-canvas\").getContext('webgl2')",
        "ref": "script"
      },
      {
        "id": "gkv4bqi",
        "ref": "cache"
      },
      {
        "id": "ea0tgct",
        "value": "vtx",
        "ref": "arg"
      },
      {
        "id": "rh45l5q",
        "value": "gl",
        "ref": "arg"
      },
      {
        "id": "hzz1ww4",
        "value": "return gl.VERTEX_SHADER;",
        "ref": "script"
      },
      {
        "id": "qjktjzv",
        "value": "gl",
        "ref": "arg"
      },
      {
        "id": "bu3m3jq",
        "ref": "load_shader"
      },
      {
        "id": "camgxqu",
        "ref": "load_shader"
      },
      {
        "id": "3j7l8wk",
        "value": "gl",
        "ref": "arg"
      },
      {
        "id": "wrpwzyg",
        "value": "gl",
        "ref": "arg"
      },
      {
        "id": "l41589j",
        "value": "frg",
        "ref": "arg"
      },
      {
        "id": "5luq4y5",
        "value": "return gl.FRAGMENT_SHADER;",
        "ref": "script"
      },
      {
        "id": "esayius",
        "value": "gl",
        "ref": "arg"
      },
      {
        "id": "2mgzzwp",
        "ref": "return"
      },
      {
        "id": "bkeent2",
        "value": "shaderProgram",
        "ref": "arg"
      },
      {
        "id": "qbj2tl2",
        "value": "gl",
        "ref": "arg"
      },
      {
        "id": "wyb1z00",
        "name": ""
      },
      {
        "id": "8njh1mx",
        "value": "gl",
        "ref": "arg"
      },
      {
        "id": "ca17ykm",
        "value": "gl",
        "ref": "arg"
      },
      {
        "id": "out",
        "name": "webgl",
        "ref": "return"
      },
      {
        "id": "ng2kjpd",
        "value": "buffer",
        "ref": "arg"
      },
      {
        "id": "7i0o3pn",
        "value": "return `#version 300 es\n\n    precision highp float;\n\n\n\n    out vec2 texCoord;\n\n    void main() {\n      float x = float((gl_VertexID & 1) << 2);\n      float y = float((gl_VertexID & 2) << 1);\n      texCoord.x = x * 0.5;\n      texCoord.y = y * 0.5;\n      gl_Position = vec4(x - 1.0, y - 1.0, 0, 1);\n    }\n  `;",
        "ref": "script"
      },
      {
        "id": "p2ibbe3",
        "value": "return {\n    program: shaderProgram,\n    attribLocations: {\n    },\n    uniformLocations: {\n      dataBuffer: gl.getUniformLocation(shaderProgram, 'uData')\n    },\n  };\n",
        "ref": "script"
      },
      {
        "id": "8dy573e/8dy573e",
        "out": "8dy573e/8dy573e",
        "nodes": [
          {
            "id": "8dy573e/8dy573e",
            "ref": "html_element"
          },
          {
            "id": "8dy573e/576gi1y",
            "ref": "array"
          },
          {
            "id": "8dy573e/t6fz346",
            "ref": "css_styles"
          },
          {
            "id": "8dy573e/21xxdy8"
          },
          {
            "id": "8dy573e/cuio21r"
          },
          {
            "id": "8dy573e/dx424v3",
            "value": "block"
          }
        ],
        "edges": [
          {
            "from": "8dy573e/576gi1y",
            "to": "8dy573e/8dy573e",
            "as": "children"
          },
          {
            "from": "8dy573e/t6fz346",
            "to": "8dy573e/576gi1y",
            "as": "arg2"
          },
          {
            "from": "8dy573e/21xxdy8",
            "to": "8dy573e/t6fz346",
            "as": "css_object"
          },
          {
            "from": "8dy573e/cuio21r",
            "to": "8dy573e/21xxdy8",
            "as": "#node-editor-info-canvas"
          },
          {
            "from": "8dy573e/dx424v3",
            "to": "8dy573e/cuio21r",
            "as": "display"
          }
        ]
      },
      {
        "id": "1lgkj23",
        "value": "gl",
        "ref": "arg"
      },
      {
        "id": "derz1cv",
        "value": "vtx",
        "ref": "arg"
      },
      {
        "id": "duubxl9",
        "value": "frg",
        "ref": "arg"
      },
      {
        "id": "5pjjo2a",
        "value": "return `#version 300 es\n\n    precision highp float;\n\n    uniform int uData[1024];\n\n    in vec2 texCoord;\n\n    out vec4 fragmentColor;\n    \n    void main() {\n      int idx = int(floor(1024.*gl_FragCoord.x/300.0));\n      float val = float(uData[idx]) / 128.;\n      fragmentColor = vec4(val,val,val, 1.0);\n    }\n  `;",
        "ref": "script"
      },
      {
        "id": "4r5fc0b",
        "value": "buffer",
        "ref": "arg"
      },
      {
        "id": "fbru2p5",
        "value": "const shaderProgram = gl.createProgram();\n  gl.attachShader(shaderProgram, vertexShader);\n  gl.attachShader(shaderProgram, fragmentShader);\n  gl.linkProgram(shaderProgram);\n\n  // If creating the shader program failed, alert\n\n  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {\n    throw new Error(gl.getProgramInfoLog(shaderProgram));\n    return null;\n  }\n\n  return shaderProgram;",
        "ref": "script"
      },
      {
        "id": "01l4ilv",
        "value": "  gl.clearColor(0.0, 0.0, 0.0, 1.0);  // Clear to black, fully opaque\n  gl.clearDepth(1.0);                 // Clear everything\n\n  // Clear the canvas before we start drawing on it.\n\n  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);\n\n  // Tell WebGL to use our program when drawing\n  \n\n  gl.useProgram(programInfo.program);\ngl.uniform1fv(programInfo.uniformLocations.dataBuffer, buffers.data);\n\n  {\n    const offset = 0;\n    const vertexCount = 3;\n    gl.drawArrays(gl.TRIANGLE_STRIP, offset, vertexCount);\n  }",
        "name": "",
        "ref": "script"
      },
      {
        "id": "tfz84l0",
        "ref": "cache"
      },
      {
        "id": "5bt6mgs",
        "ref": "cache"
      },
      {
        "id": "njrst9d",
        "value": "const valBuffer = gl.createBuffer();\ngl.bindBuffer(gl.ARRAY_BUFFER, valBuffer);\n\ngl.bufferData(gl.ARRAY_BUFFER, buffer.data, gl.STATIC_DRAW);\n\nreturn {\n  val: valBuffer,\n  data: buffer.data\n}",
        "name": "",
        "ref": "script"
      }
    ],
    "edges": [
      {
        "from": "8dy573e/8dy573e",
        "to": "out",
        "as": "display"
      },
      {
        "from": "j219svq",
        "to": "out",
        "as": "subscribe"
      },
      {
        "from": "04xuprq",
        "to": "out",
        "as": "args"
      },
      {
        "from": "jidlrdv",
        "to": "gkv4bqi",
        "as": "value"
      },
      {
        "from": "gkv4bqi",
        "to": "04xuprq",
        "as": "gl"
      },
      {
        "from": "7i0o3pn",
        "to": "04xuprq",
        "as": "vtx"
      },
      {
        "from": "5pjjo2a",
        "to": "04xuprq",
        "as": "frg"
      },
      {
        "from": "ea0tgct",
        "to": "bu3m3jq",
        "as": "source"
      },
      {
        "from": "hzz1ww4",
        "to": "bu3m3jq",
        "as": "shader_type"
      },
      {
        "from": "rh45l5q",
        "to": "hzz1ww4",
        "as": "gl"
      },
      {
        "from": "qjktjzv",
        "to": "bu3m3jq",
        "as": "gl"
      },
      {
        "from": "l41589j",
        "to": "camgxqu",
        "as": "source"
      },
      {
        "from": "5luq4y5",
        "to": "camgxqu",
        "as": "shader_type"
      },
      {
        "from": "3j7l8wk",
        "to": "camgxqu",
        "as": "gl"
      },
      {
        "from": "wrpwzyg",
        "to": "5luq4y5",
        "as": "gl"
      },
      {
        "from": "2mgzzwp",
        "to": "out",
        "as": "value"
      },
      {
        "from": "wyb1z00",
        "to": "2mgzzwp",
        "as": "args"
      },
      {
        "from": "bkeent2",
        "to": "p2ibbe3",
        "as": "shaderProgram"
      },
      {
        "from": "qbj2tl2",
        "to": "p2ibbe3",
        "as": "gl"
      },
      {
        "from": "esayius",
        "to": "fbru2p5",
        "as": "gl"
      },
      {
        "from": "01l4ilv",
        "to": "2mgzzwp",
        "as": "value"
      },
      {
        "from": "8njh1mx",
        "to": "njrst9d",
        "as": "gl"
      },
      {
        "from": "ca17ykm",
        "to": "01l4ilv",
        "as": "gl"
      },
      {
        "from": "camgxqu",
        "to": "fbru2p5",
        "as": "fragmentShader"
      },
      {
        "from": "bu3m3jq",
        "to": "fbru2p5",
        "as": "vertexShader"
      },
      {
        "from": "ng2kjpd",
        "to": "njrst9d",
        "as": "buffer"
      },
      {
        "from": "1lgkj23",
        "to": "wyb1z00",
        "as": "gl"
      },
      {
        "from": "derz1cv",
        "to": "wyb1z00",
        "as": "vtx"
      },
      {
        "from": "duubxl9",
        "to": "wyb1z00",
        "as": "frg"
      },
      {
        "from": "njrst9d",
        "to": "01l4ilv",
        "as": "buffers"
      },
      {
        "from": "4r5fc0b",
        "to": "wyb1z00",
        "as": "buffer"
      },
      {
        "from": "tfz84l0",
        "to": "wyb1z00",
        "as": "shaderProgram"
      },
      {
        "from": "fbru2p5",
        "to": "tfz84l0",
        "as": "value"
      },
      {
        "from": "5bt6mgs",
        "to": "01l4ilv",
        "as": "programInfo"
      },
      {
        "from": "p2ibbe3",
        "to": "5bt6mgs",
        "as": "value"
      }
    ],
    "out": "out"
  }, {
    "id": "load_shader",
    "description": "Loads the `source` shader program in webgl context `gl`",
    "name": "load_shader",
    "nodes": [
      {
        "id": "37nc07d"
      },
      {
        "id": "c0cr54c",
        "value": "const shader = gl.createShader(shader_type);\n\n  // Send the source to the shader object\n\n  gl.shaderSource(shader, source);\n\n  // Compile the shader program\n\n  gl.compileShader(shader);\n\n  // See if it compiled successfully\n\n  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {\n    alert('An error occurred compiling the shaders: ' + gl.getShaderInfoLog(shader));\n    gl.deleteShader(shader);\n    return null;\n  }\n\n  return shader;",
        "name": "",
        "ref": "script"
      },
      {
        "id": "l3qddzc",
        "value": "gl",
        "ref": "arg"
      },
      {
        "id": "e5uhxrd",
        "value": "source",
        "ref": "arg"
      },
      {
        "id": "6o4os08",
        "value": "shader_type",
        "ref": "arg"
      },
      {
        "id": "bu3m3jq",
        "name": "export",
        "ref": "return"
      }
    ],
    "edges": [
      {
        "from": "37nc07d",
        "to": "bu3m3jq",
        "as": "args"
      },
      {
        "from": "c0cr54c",
        "to": "bu3m3jq",
        "as": "value"
      },
      {
        "from": "l3qddzc",
        "to": "c0cr54c",
        "as": "gl"
      },
      {
        "from": "e5uhxrd",
        "to": "c0cr54c",
        "as": "source"
      },
      {
        "from": "6o4os08",
        "to": "c0cr54c",
        "as": "shader_type"
      }
    ],
    "out": "bu3m3jq"
  },
  {"id":"subscribe_many","name":"subscribe_many","nodes":[{"id":"ld37qq4","name":"subscribe_many","ref":"return"},{"id":"ndna6vl"},{"id":"r0v26jn","name":"","ref":"reduce"},{"id":"0n8k0b7","value":"events","ref":"arg"},{"id":"kd528s8","name":"","ref":"runnable"},{"id":"rxoook3","ref":"merge_objects"},{"id":"daykk9b"},{"id":"6kwqo8l","value":"previous","name":"","ref":"arg"},{"id":"bzkaiyo","name":"","ref":"set"},{"id":"hsq8vrp","value":"base","ref":"arg"},{"id":"5mzlv42"},{"id":"pkd8b0p","value":"current","ref":"arg"},{"id":"8zi1gzy","value":"runnable","ref":"arg"},{"id":"9716t7q","name":"","ref":"sequence"},{"id":"hi50l05","ref":"get"},{"id":"opox5xi","value":"base","ref":"arg"},{"id":"5szjf17","value":"current","ref":"arg"},{"id":"it3evdr"},{"id":"qd1bvw9"},{"id":"6barb7g","ref":"cache"},{"id":"i7tgtne","value":"evt_runnable","ref":"arg"},{"id":"7rpfcmk","ref":"cache"},{"id":"xk6e7zh"},{"id":"pf10ku6","ref":"runnable"},{"id":"km7iwa0","ref":"set_mutable"},{"id":"zyqw0ko","value":"datacache","ref":"arg"},{"id":"f0roa3q","value":"current","ref":"arg"},{"id":"rat3zkt","value":"data","ref":"arg"},{"id":"2mcffa6","value":"base","ref":"arg"}],"edges":[{"from":"ndna6vl","to":"ld37qq4","as":"args"},{"from":"r0v26jn","to":"ld37qq4","as":"return"},{"from":"0n8k0b7","to":"r0v26jn","as":"array"},{"from":"kd528s8","to":"r0v26jn","as":"fn"},{"from":"2mcffa6","to":"r0v26jn","as":"initial"},{"from":"rxoook3","to":"kd528s8","as":"fn"},{"from":"daykk9b","to":"kd528s8","as":"args"},{"from":"hsq8vrp","to":"daykk9b","as":"base"},{"from":"5mzlv42","to":"bzkaiyo","as":"target"},{"from":"pkd8b0p","to":"bzkaiyo","as":"path"},{"from":"opox5xi","to":"hi50l05","as":"target"},{"from":"5szjf17","to":"hi50l05","as":"path"},{"from":"9716t7q","to":"bzkaiyo","as":"value"},{"from":"8zi1gzy","to":"daykk9b","as":"evt_runnable"},{"from":"it3evdr","to":"9716t7q","as":"args"},{"from":"6barb7g","to":"it3evdr","as":"data"},{"from":"qd1bvw9","to":"6barb7g","as":"value"},{"from":"xk6e7zh","to":"7rpfcmk","as":"value"},{"from":"7rpfcmk","to":"daykk9b","as":"datacache"},{"from":"hi50l05","to":"9716t7q","as":"arg2"},{"from":"pf10ku6","to":"9716t7q","as":"arg0"},{"from":"km7iwa0","to":"pf10ku6","as":"fn"},{"from":"zyqw0ko","to":"km7iwa0","as":"target"},{"from":"f0roa3q","to":"km7iwa0","as":"path"},{"from":"rat3zkt","to":"km7iwa0","as":"value"},{"from":"6kwqo8l","to":"rxoook3","as":"arg0"},{"from":"bzkaiyo","to":"rxoook3","as":"arg1"},{"from":"i7tgtne","to":"9716t7q","as":"arg1"}],"out":"ld37qq4"},
  {
    "id": "slider",
    "nodes": [
      {
        "id": "j219svq"
      },
      {
        "id": "5mog0bc",
        "value": "input",
        "ref": "html_element"
      },
      {
        "id": "24q0egm"
      },
      {
        "id": "mpbvtrq",
        "value": "range"
      },
      {
        "id": "y407zfo",
        "ref": "html_element"
      },
      {
        "id": "sb9qdgy",
        "ref": "array"
      },
      {
        "id": "kyu6h8m",
        "ref": "html_text"
      },
      {
        "id": "a4y3jfa",
        "value": "1.0"
      },
      {
        "id": "yv0o41n",
        "ref": "default"
      },
      {
        "id": "z3jopgg",
        "value": "step",
        "ref": "arg"
      },
      {
        "id": "racg3p7",
        "value": "label",
        "ref": "arg"
      },
      {
        "id": "0i85qjj"
      },
      {
        "id": "u4k2auv",
        "value": "Slider"
      },
      {
        "id": "a6rdag9"
      },
      {
        "id": "sxjhepz"
      },
      {
        "id": "93rx3ru",
        "value": "flex"
      },
      {
        "id": "q8ugbch",
        "value": "row"
      },
      {
        "id": "wnr7m0u",
        "value": "__graph_value",
        "ref": "arg"
      },
      {
        "id": "doz740g",
        "ref": "html_text"
      },
      {
        "id": "20w95l2",
        "value": "test"
      },
      {
        "id": "gibdj45",
        "value": "event.target.value",
        "ref": "arg"
      },
      {
        "id": "q09a315",
        "value": "0.01",
        "ref": ""
      },
      {
        "id": "qi4odll",
        "value": "return value || otherwise",
        "ref": "script"
      },
      {
        "id": "16b092x",
        "ref": "default"
      },
      {
        "id": "9fk784a",
        "value": "max",
        "ref": "arg"
      },
      {
        "id": "7c2vt3d",
        "ref": "default"
      },
      {
        "id": "fd7yax9",
        "value": "min",
        "ref": "arg"
      },
      {
        "id": "r1ah7g2",
        "value": "0.0"
      },
      {
        "id": "bts7694",
        "value": "result",
        "ref": "arg"
      },
      {
        "id": "out",
        "name": "slider",
        "ref": "return"
      },
      {
        "id": "t1deznd",
        "ref": "state"
      },
      {
        "id": "ewycyaq",
        "ref": "default"
      },
      {
        "id": "old0t0c",
        "ref": "ap"
      },
      {
        "id": "ezx9hxj"
      },
      {
        "id": "l5bzesi",
        "value": "_sliderval.set",
        "ref": "arg"
      },
      {
        "id": "vgishln",
        "value": "_sliderval.state",
        "ref": "arg"
      },
      {
        "id": "sv49nso",
        "value": "_sliderval.state",
        "ref": "arg"
      },
      {
        "id": "7hff44y",
        "ref": "default"
      },
      {
        "id": "n4i4t17",
        "value": "_sliderval.state",
        "ref": "arg"
      },
      {
        "id": "zs6k9cd",
        "ref": "default"
      },
      {
        "id": "fbc9r4j",
        "value": "max",
        "ref": "arg"
      },
      {
        "id": "d68tdna",
        "value": "1.0"
      }
    ],
    "edges": [
      {
        "from": "j219svq",
        "to": "out",
        "as": "subscribe"
      },
      {
        "from": "24q0egm",
        "to": "5mog0bc",
        "as": "props"
      },
      {
        "from": "mpbvtrq",
        "to": "24q0egm",
        "as": "type"
      },
      {
        "from": "sb9qdgy",
        "to": "y407zfo",
        "as": "children"
      },
      {
        "from": "yv0o41n",
        "to": "24q0egm",
        "as": "step"
      },
      {
        "from": "q09a315",
        "to": "yv0o41n",
        "as": "otherwise"
      },
      {
        "from": "z3jopgg",
        "to": "yv0o41n",
        "as": "value"
      },
      {
        "from": "5mog0bc",
        "to": "sb9qdgy",
        "as": "arg1"
      },
      {
        "from": "0i85qjj",
        "to": "out",
        "as": "args"
      },
      {
        "from": "u4k2auv",
        "to": "0i85qjj",
        "as": "label"
      },
      {
        "from": "a6rdag9",
        "to": "y407zfo",
        "as": "props"
      },
      {
        "from": "sxjhepz",
        "to": "a6rdag9",
        "as": "style"
      },
      {
        "from": "93rx3ru",
        "to": "sxjhepz",
        "as": "display"
      },
      {
        "from": "q8ugbch",
        "to": "sxjhepz",
        "as": "flex-direction"
      },
      {
        "from": "wnr7m0u",
        "to": "qi4odll",
        "as": "value"
      },
      {
        "from": "doz740g",
        "to": "sb9qdgy",
        "as": "arg0"
      },
      {
        "from": "qi4odll",
        "to": "doz740g",
        "as": "text"
      },
      {
        "from": "kyu6h8m",
        "to": "sb9qdgy",
        "as": "arg2"
      },
      {
        "from": "racg3p7",
        "to": "qi4odll",
        "as": "otherwise"
      },
      {
        "from": "20w95l2",
        "to": "0i85qjj",
        "as": "key"
      },
      {
        "from": "ewycyaq",
        "to": "kyu6h8m",
        "as": "text"
      },
      {
        "from": "16b092x",
        "to": "24q0egm",
        "as": "max"
      },
      {
        "from": "a4y3jfa",
        "to": "16b092x",
        "as": "otherwise"
      },
      {
        "from": "9fk784a",
        "to": "16b092x",
        "as": "value"
      },
      {
        "from": "r1ah7g2",
        "to": "7c2vt3d",
        "as": "otherwise"
      },
      {
        "from": "fd7yax9",
        "to": "7c2vt3d",
        "as": "value"
      },
      {
        "from": "7c2vt3d",
        "to": "24q0egm",
        "as": "min"
      },
      {
        "from": "bts7694",
        "to": "ewycyaq",
        "as": "otherwise"
      },
      {
        "from": "t1deznd",
        "to": "0i85qjj",
        "as": "_sliderval"
      },
      {
        "from": "sv49nso",
        "to": "24q0egm",
        "as": "value"
      },
      {
        "from": "ezx9hxj",
        "to": "old0t0c",
        "as": "args"
      },
      {
        "from": "l5bzesi",
        "to": "old0t0c",
        "as": "fn"
      },
      {
        "from": "old0t0c",
        "to": "24q0egm",
        "as": "oninput"
      },
      {
        "from": "vgishln",
        "to": "ewycyaq",
        "as": "value"
      },
      {
        "from": "gibdj45",
        "to": "ezx9hxj",
        "as": "value"
      },
      {
        "from": "zs6k9cd",
        "to": "7hff44y",
        "as": "otherwise"
      },
      {
        "from": "n4i4t17",
        "to": "7hff44y",
        "as": "value"
      },
      {
        "from": "d68tdna",
        "to": "zs6k9cd",
        "as": "otherwise"
      },
      {
        "from": "fbc9r4j",
        "to": "zs6k9cd",
        "as": "value"
      },
      {
        "from": "7hff44y",
        "to": "y407zfo",
        "as": "value"
      },
      {
        "from": "y407zfo",
        "to": "out",
        "as": "value"
      }
    ],
    "out": "out"
  }
    ,{
    "id": "export",
    "nodes": [
      {
        "id": "args"
      },
      {
        "id": "main/out",
        "name": "export",
        "ref": "return"
      },
      {
        "id": "jklqh38",
        "ref": "html_element"
      },
      {
        "id": "8dy573e",
        "value": "a",
        "ref": "html_element"
      },
      {
        "id": "6qkew20",
        "ref": "array"
      },
      {
        "id": "zihm1kd"
      },
      {
        "id": "2dz33fg",
        "value": "_new"
      },
      {
        "id": "n7aaoju",
        "value": "Export",
        "ref": "html_text"
      },
      {
        "id": "jdoak4g",
        "value": "return ns + '.json';",
        "ref": "script"
      },
      {
        "id": "3b7bnzm",
        "ref": "state"
      },
      {
        "id": "ug26ugw",
        "value": "hrefstate.state",
        "name": "",
        "ref": "arg"
      },
      {
        "id": "pni2xuu",
        "value": "href",
        "ref": "log"
      },
      {
        "id": "pcx97n4",
        "value": "input",
        "ref": "html_element",
        "__isnodysseus": true
      },
      {
        "id": "rk7hcxc"
      },
      {
        "id": "b8wohxv",
        "value": "select",
        "__isnodysseus": true
      },
      {
        "id": "x200f4j",
        "value": "export-list",
        "__isnodysseus": true
      },
      {
        "id": "et5g0m1",
        "__isnodysseus": true,
        "ref": "map"
      },
      {
        "id": "9tv13iq",
        "value": "return _lib.no.runtime.refs()",
        "ref": "script",
        "__isnodysseus": true
      },
      {
        "id": "dd6st1b",
        "value": "element",
        "ref": "arg",
        "__isnodysseus": true
      },
      {
        "id": "2yur4h7",
        "ref": "runnable",
        "__isnodysseus": true
      },
      {
        "id": "xdot36k"
      },
      {
        "id": "1edrrwq",
        "value": "option",
        "ref": "html_element",
        "__isnodysseus": true
      },
      {
        "id": "skqnl08",
        "__isnodysseus": true,
        "ref": "html_text"
      },
      {
        "id": "3y8pyc2",
        "value": "datalist",
        "ref": "html_element",
        "__isnodysseus": true
      },
      {
        "id": "tfwqhqf",
        "value": "export-list",
        "__isnodysseus": true
      },
      {
        "id": "xp4pv1h",
        "value": "return element",
        "ref": "script",
        "__isnodysseus": true
      },
      {
        "id": "i5wnhvh",
        "ref": "ap"
      },
      {
        "id": "mp0ce5t",
        "value": "hrefstate.set",
        "ref": "arg"
      },
      {
        "id": "zucq3k4"
      },
      {
        "id": "8470sfe",
        "value": "return URL.createObjectURL(file)",
        "ref": "script"
      },
      {
        "id": "hke54sp",
        "value": "return new Blob([json], {type: \"application/json\"})",
        "ref": "script"
      },
      {
        "id": "syfso39",
        "ref": "stringify"
      },
      {
        "id": "kaiwusy",
        "value": "mapout",
        "ref": "log"
      },
      {
        "id": "db0reg4",
        "ref": "map"
      },
      {
        "id": "0pnyh3t",
        "value": "mapin",
        "ref": "log"
      },
      {
        "id": "l4o1umt",
        "value": "return _lib.no.runtime.refs().filter(r => r.startsWith('@' + namespace + '.') || r === namespace)",
        "ref": "script"
      },
      {
        "id": "w78q6vm",
        "value": "ns",
        "ref": "log"
      },
      {
        "id": "959i120",
        "ref": "runnable"
      },
      {
        "id": "a1vqjzz",
        "value": "element",
        "ref": "arg"
      },
      {
        "id": "1148sh5",
        "value": "2"
      },
      {
        "id": "1axuplc",
        "value": "event.target.value",
        "ref": "arg",
        "__isnodysseus": true
      },
      {
        "id": "tad7830",
        "ref": "state",
        "__isnodysseus": true
      },
      {
        "id": "jdufmth",
        "value": "namespace.state",
        "ref": "arg",
        "__isnodysseus": true
      },
      {
        "id": "91lhfar",
        "__isnodysseus": true,
        "ref": "sequence"
      },
      {
        "id": "898n6f7",
        "__isnodysseus": true,
        "ref": "ap"
      },
      {
        "id": "9jvfgj1",
        "value": "namespace.set",
        "ref": "arg",
        "__isnodysseus": true
      },
      {
        "id": "j2c518b"
      },
      {
        "id": "qpiqhgp",
        "value": "event.target.value",
        "ref": "arg",
        "__isnodysseus": true
      },
      {
        "id": "x8ik3x4",
        "value": "const graph = {..._lib.no.runtime.get_ref(ref)};\ndelete graph.__isnodysseus;\nreturn graph;",
        "ref": "script"
      }
    ],
    "edges": [
      {
        "from": "args",
        "to": "main/out",
        "as": "args"
      },
      {
        "from": "n7aaoju",
        "to": "8dy573e",
        "as": "children"
      },
      {
        "from": "jklqh38",
        "to": "main/out",
        "as": "display"
      },
      {
        "from": "6qkew20",
        "to": "jklqh38",
        "as": "children"
      },
      {
        "from": "8dy573e",
        "to": "6qkew20",
        "as": "arg0"
      },
      {
        "from": "zihm1kd",
        "to": "8dy573e",
        "as": "props"
      },
      {
        "from": "2dz33fg",
        "to": "zihm1kd",
        "as": "target"
      },
      {
        "from": "tad7830",
        "to": "args",
        "as": "namespace"
      },
      {
        "from": "jdufmth",
        "to": "jdoak4g",
        "as": "ns"
      },
      {
        "from": "jdoak4g",
        "to": "zihm1kd",
        "as": "download"
      },
      {
        "from": "3b7bnzm",
        "to": "args",
        "as": "hrefstate"
      },
      {
        "from": "pni2xuu",
        "to": "zihm1kd",
        "as": "href"
      },
      {
        "from": "ug26ugw",
        "to": "pni2xuu",
        "as": "value"
      },
      {
        "from": "pcx97n4",
        "to": "6qkew20",
        "as": "arg2"
      },
      {
        "from": "rk7hcxc",
        "to": "pcx97n4",
        "as": "props"
      },
      {
        "from": "b8wohxv",
        "to": "rk7hcxc",
        "as": "type"
      },
      {
        "from": "x200f4j",
        "to": "rk7hcxc",
        "as": "list"
      },
      {
        "from": "3y8pyc2",
        "to": "6qkew20",
        "as": "arg3"
      },
      {
        "from": "et5g0m1",
        "to": "3y8pyc2",
        "as": "children"
      },
      {
        "from": "9tv13iq",
        "to": "et5g0m1",
        "as": "array"
      },
      {
        "from": "2yur4h7",
        "to": "et5g0m1",
        "as": "fn"
      },
      {
        "from": "dd6st1b",
        "to": "xp4pv1h",
        "as": "element"
      },
      {
        "from": "xdot36k",
        "to": "3y8pyc2",
        "as": "props"
      },
      {
        "from": "1edrrwq",
        "to": "2yur4h7",
        "as": "fn"
      },
      {
        "from": "skqnl08",
        "to": "1edrrwq",
        "as": "children"
      },
      {
        "from": "xp4pv1h",
        "to": "skqnl08",
        "as": "text"
      },
      {
        "from": "tfwqhqf",
        "to": "xdot36k",
        "as": "id"
      },
      {
        "from": "zucq3k4",
        "to": "i5wnhvh",
        "as": "args"
      },
      {
        "from": "8470sfe",
        "to": "zucq3k4",
        "as": "value"
      },
      {
        "from": "hke54sp",
        "to": "8470sfe",
        "as": "file"
      },
      {
        "from": "syfso39",
        "to": "hke54sp",
        "as": "json"
      },
      {
        "from": "1148sh5",
        "to": "syfso39",
        "as": "spacer"
      },
      {
        "from": "kaiwusy",
        "to": "syfso39",
        "as": "object"
      },
      {
        "from": "db0reg4",
        "to": "kaiwusy",
        "as": "value"
      },
      {
        "from": "959i120",
        "to": "db0reg4",
        "as": "fn"
      },
      {
        "from": "0pnyh3t",
        "to": "db0reg4",
        "as": "array"
      },
      {
        "from": "l4o1umt",
        "to": "0pnyh3t",
        "as": "value"
      },
      {
        "from": "w78q6vm",
        "to": "l4o1umt",
        "as": "namespace"
      },
      {
        "from": "1axuplc",
        "to": "w78q6vm",
        "as": "value"
      },
      {
        "from": "x8ik3x4",
        "to": "959i120",
        "as": "fn"
      },
      {
        "from": "a1vqjzz",
        "to": "x8ik3x4",
        "as": "ref"
      },
      {
        "from": "mp0ce5t",
        "to": "i5wnhvh",
        "as": "fn"
      },
      {
        "from": "91lhfar",
        "to": "rk7hcxc",
        "as": "onchange"
      },
      {
        "from": "i5wnhvh",
        "to": "91lhfar",
        "as": "arg1"
      },
      {
        "from": "898n6f7",
        "to": "91lhfar",
        "as": "arg0"
      },
      {
        "from": "9jvfgj1",
        "to": "898n6f7",
        "as": "fn"
      },
      {
        "from": "j2c518b",
        "to": "898n6f7",
        "as": "args"
      },
      {
        "from": "qpiqhgp",
        "to": "j2c518b",
        "as": "value"
      }
    ],
    "out": "main/out"
  },
  {
    "id": "delete_graph",
    "nodes": [
      {
        "id": "args"
      },
      {
        "id": "jklqh38",
        "ref": "html_element"
      },
      {
        "id": "6qkew20",
        "ref": "array"
      },
      {
        "id": "zihm1kd"
      },
      {
        "id": "3b7bnzm",
        "ref": "state"
      },
      {
        "id": "pcx97n4",
        "value": "input",
        "ref": "html_element",
        "__isnodysseus": true
      },
      {
        "id": "rk7hcxc"
      },
      {
        "id": "b8wohxv",
        "value": "select",
        "__isnodysseus": true
      },
      {
        "id": "x200f4j",
        "value": "export-list",
        "__isnodysseus": true
      },
      {
        "id": "et5g0m1",
        "__isnodysseus": true,
        "ref": "map"
      },
      {
        "id": "9tv13iq",
        "value": "return _lib.no.runtime.refs()",
        "ref": "script",
        "__isnodysseus": true
      },
      {
        "id": "dd6st1b",
        "value": "element",
        "ref": "arg",
        "__isnodysseus": true
      },
      {
        "id": "2yur4h7",
        "ref": "runnable",
        "__isnodysseus": true
      },
      {
        "id": "xdot36k"
      },
      {
        "id": "1edrrwq",
        "value": "option",
        "ref": "html_element",
        "__isnodysseus": true
      },
      {
        "id": "skqnl08",
        "__isnodysseus": true,
        "ref": "html_text"
      },
      {
        "id": "3y8pyc2",
        "value": "datalist",
        "ref": "html_element",
        "__isnodysseus": true
      },
      {
        "id": "tfwqhqf",
        "value": "export-list",
        "__isnodysseus": true
      },
      {
        "id": "xp4pv1h",
        "value": "return element",
        "ref": "script",
        "__isnodysseus": true
      },
      {
        "id": "tad7830",
        "ref": "state",
        "__isnodysseus": true
      },
      {
        "id": "jdufmth",
        "value": "namespace.state",
        "ref": "arg",
        "__isnodysseus": true
      },
      {
        "id": "91lhfar",
        "__isnodysseus": true,
        "ref": "sequence"
      },
      {
        "id": "898n6f7",
        "__isnodysseus": true,
        "ref": "ap"
      },
      {
        "id": "9jvfgj1",
        "value": "namespace.set",
        "ref": "arg",
        "__isnodysseus": true
      },
      {
        "id": "j2c518b"
      },
      {
        "id": "qpiqhgp",
        "value": "event.target.value",
        "ref": "arg",
        "__isnodysseus": true
      },
      {
        "id": "main/out",
        "name": "delete_graph",
        "ref": "return"
      },
      {
        "id": "8dy573e",
        "value": "button",
        "ref": "html_element"
      },
      {
        "id": "n7aaoju",
        "value": "delete",
        "ref": "html_text"
      },
      {
        "id": "ibmy4bt",
        "ref": "runnable"
      },
      {
        "id": "jdoak4g",
        "value": "localStorage.removeItem(ns);\nlocalStorage.setItem(\"graph_list\", JSON.stringify(JSON.parse(localStorage.getItem(\"graph_list\")).filter(g => g !== ns)))\n_lib.no.runtime.remove_ref(ns);",
        "ref": "script"
      }
    ],
    "edges": [
      {
        "from": "args",
        "to": "main/out",
        "as": "args"
      },
      {
        "from": "n7aaoju",
        "to": "8dy573e",
        "as": "children"
      },
      {
        "from": "jklqh38",
        "to": "main/out",
        "as": "display"
      },
      {
        "from": "6qkew20",
        "to": "jklqh38",
        "as": "children"
      },
      {
        "from": "zihm1kd",
        "to": "8dy573e",
        "as": "props"
      },
      {
        "from": "tad7830",
        "to": "args",
        "as": "namespace"
      },
      {
        "from": "jdufmth",
        "to": "jdoak4g",
        "as": "ns"
      },
      {
        "from": "3b7bnzm",
        "to": "args",
        "as": "hrefstate"
      },
      {
        "from": "pcx97n4",
        "to": "6qkew20",
        "as": "arg2"
      },
      {
        "from": "rk7hcxc",
        "to": "pcx97n4",
        "as": "props"
      },
      {
        "from": "b8wohxv",
        "to": "rk7hcxc",
        "as": "type"
      },
      {
        "from": "x200f4j",
        "to": "rk7hcxc",
        "as": "list"
      },
      {
        "from": "3y8pyc2",
        "to": "6qkew20",
        "as": "arg3"
      },
      {
        "from": "et5g0m1",
        "to": "3y8pyc2",
        "as": "children"
      },
      {
        "from": "9tv13iq",
        "to": "et5g0m1",
        "as": "array"
      },
      {
        "from": "2yur4h7",
        "to": "et5g0m1",
        "as": "fn"
      },
      {
        "from": "dd6st1b",
        "to": "xp4pv1h",
        "as": "element"
      },
      {
        "from": "xdot36k",
        "to": "3y8pyc2",
        "as": "props"
      },
      {
        "from": "1edrrwq",
        "to": "2yur4h7",
        "as": "fn"
      },
      {
        "from": "skqnl08",
        "to": "1edrrwq",
        "as": "children"
      },
      {
        "from": "xp4pv1h",
        "to": "skqnl08",
        "as": "text"
      },
      {
        "from": "tfwqhqf",
        "to": "xdot36k",
        "as": "id"
      },
      {
        "from": "91lhfar",
        "to": "rk7hcxc",
        "as": "onchange"
      },
      {
        "from": "898n6f7",
        "to": "91lhfar",
        "as": "arg0"
      },
      {
        "from": "9jvfgj1",
        "to": "898n6f7",
        "as": "fn"
      },
      {
        "from": "j2c518b",
        "to": "898n6f7",
        "as": "args"
      },
      {
        "from": "qpiqhgp",
        "to": "j2c518b",
        "as": "value"
      },
      {
        "from": "8dy573e",
        "to": "6qkew20",
        "as": "arg4"
      },
      {
        "from": "ibmy4bt",
        "to": "zihm1kd",
        "as": "onclick"
      },
      {
        "from": "jdoak4g",
        "to": "ibmy4bt",
        "as": "fn"
      }
    ],
    "out": "main/out"
  }

  ]
}
