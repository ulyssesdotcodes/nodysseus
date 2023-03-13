const generic = {
  "id": "generic",
  "nodes": {
    "simple": {
      "id": "simple",
      "out": "out",
      "category": "templates",
      "edges": [
        {
          "from": "qgbinm2",
          "to": "8dy573e",
          "as": "children"
        },
        {
          "from": "8dy573e",
          "to": "out",
          "as": "display"
        },
        {
          "from": "output_val",
          "to": "out",
          "as": "value"
        },
        {
          "from": "args",
          "to": "out",
          "as": "args"
        }
      ],
      "nodes": [
        {
          "id": "args"
        },
        {
          "id": "qgbinm2",
          "value": "Hello, world!",
          "ref": "html_text"
        },
        {
          "id": "8dy573e",
          "ref": "html_element"
        },
        {
          "id": "output_val",
          "value": "some output"
        },
        {
          "id": "out",
          "ref": "return",
          "name": "simple"
        }
      ]
    },
    "log": {
      "id": "log",
      "description": "Prints value to console.log",
      "category": "debug",
      "out": "out",
      "nodes": [
        {
          "id": "in"
        },
        {
          "id": "value",
          "ref": "arg",
          "value": "value"
        },
        {
          "id": "graph_value",
          "ref": "arg",
          "value": "__graph_value"
        },
        {
          "id": "out",
          "args": [],
          "ref": "script",
          "value": "graph_value ? console.log(graph_value, value) : console.log(value); return value"
        }
      ],
      "edges": [
        {
          "from": "in",
          "to": "out",
          "as": "input",
          "type": "ref"
        },
        {
          "from": "graph_value",
          "to": "out",
          "as": "graph_value"
        },
        {
          "from": "value",
          "to": "out",
          "as": "value"
        }
      ]
    },
    "math": {
      "id": "math",
      "category": "math",
      "ref": "extern",
      "value": "extern.math"
    },
    "expect": {
      "id": "expect",
      "category": "debug",
      "ref": "extern",
      "value": "extern.expect"
    },
    "fetch": {
      "id": "fetch",
      "category": "network",
      "name": "fetch",
      "description": "Uses the <a target='_blank' href='https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API'>Fetch API</a> to get data.",
      "ref": "extern",
      "value": "extern.fetch"
    },
    "call": {
      "id": "call",
      "name": "call",
      "category": "functions",
      "description": "Calls `self.fn` with `args`. If `self is not found, uses the node's context.",
      "ref": "extern",
      "value": "extern.call"
    },
    "stringify": {
      "id": "stringify",
      "name": "stringify",
      "category": "data",
      "description": "<a target='_blank' href='https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify'>JSON.stringify</a> the `value` argument",
      "ref": "extern",
      "value": "extern.stringify"
    },
    "parse": {
      "id": "parse",
      "name": "parse",
      "category": "data",
      "description": "<a target='_blank' href='https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify'>JSON.parse</a> the `value` argument",
      "ref": "extern",
      "value": "extern.parse"
    },
    "add": {
      "id": "add",
      "ref": "extern",
      "category": "math",
      "value": "extern.add",
      "description": "The javascript <a target='_blank' href='https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Addition'>+ operator</a>"
    },
    "mult": {
      "id": "mult",
      "ref": "extern",
      "value": "extern.mult",
      "category": "math",
      "description": "The javascript <a target='_blank' href='https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Multiplication'>* operator</a>"
    },
    "divide": {
      "id": "divide",
      "ref": "extern",
      "value": "extern.divide",
      "category": "math",
      "description": "The javascript <a target='_blank' href='https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Division'>/ operator</a>"
    },
    "negate": {
      "id": "negate",
      "ref": "extern",
      "value": "extern.negate",
      "category": "math",
      "description": "The javascript <a target='_blank' href='https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Subtraction'>- operator</a>"
    },
    "and": {
      "id": "and",
      "ref": "extern",
      "value": "extern.and",
      "category": "math",
      "description": "The javascript <a target='_blank' href='https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Logical_AND'>&& operator</a>"
    },
    "liftarraypromise": {
      "id": "liftarraypromise",
      "ref": "extern",
      "value": "extern.liftarraypromise",
      "category": "data",
      "description": "If an array contains a promise, wrap the whole array with `Promise.all`."
    },
    "typeof": {
      "id": "typeof",
      "ref": "extern",
      "category": "data",
      "value": "extern.typeof",
      "description": "javascript typeof operator"
    },
    "new": {
      "id": "new",
      "ref": "extern",
      "category": "functions",
      "value": "extern.construct",
      "description": "javascript constructor"
    },
    "addEventListeners": {
      "id": "addEventListeners",
      "ref": "extern",
      "category": "events",
      "value": "extern.addEventListeners",
      "description": "add js event listeners to a target"
    },
    "ancestors": {
      "id": "ancestors",
      "out": "out",
      "category": "util",
      "description": "Gets the ancestors of the `node` in `graph`",
      "nodes": [
        {
          "id": "in"
        },
        {
          "id": "graph",
          "ref": "arg",
          "value": "graph"
        },
        {
          "id": "node",
          "ref": "arg",
          "value": "node"
        },
        {
          "id": "out",
          "ref": "script",
          "value": "const parents = (id) => (graph ?? _graph).edges.filter(e => e.to === id).flatMap(e => parents(e.from)).concat([id]); return parents(node ?? graph.out ?? 'out')"
        }
      ],
      "edges": [
        {
          "from": "in",
          "to": "out",
          "as": "_",
          "type": "ref"
        },
        {
          "from": "graph",
          "to": "out",
          "as": "graph"
        },
        {
          "from": "node",
          "to": "out",
          "as": "node"
        }
      ]
    },
    "append": {
      "id": "append",
      "category": "data",
      "description": "Appends `item` to `array`. `item` can be a single item or an array.",
      "nodes": [
        {
          "id": "in"
        },
        {
          "id": "array",
          "ref": "arg",
          "value": "array"
        },
        {
          "id": "item",
          "ref": "arg",
          "value": "item"
        },
        {
          "id": "out",
          "ref": "script",
          "value": "return array.concat(Array.isArray(item) ? item : [item])"
        }
      ],
      "edges": [
        {
          "from": "in",
          "to": "out",
          "as": "_",
          "type": "ref"
        },
        {
          "from": "array",
          "to": "out",
          "as": "array"
        },
        {
          "from": "item",
          "to": "out",
          "as": "item"
        }
      ]
    },
    "concat": {
      "id": "concat",
      "category": "data",
      "description": "Concats `items` to `array`.",
      "nodes": [
        {
          "id": "array",
          "ref": "arg",
          "value": "array"
        },
        {
          "id": "items",
          "ref": "arg",
          "value": "items"
        },
        {
          "id": "out",
          "args": [
            "item",
            "array"
          ],
          "ref": "script",
          "value": "return (array ?? []).concat(items ?? [])"
        }
      ],
      "edges": [
        {
          "from": "array",
          "to": "out",
          "as": "array"
        },
        {
          "from": "items",
          "to": "out",
          "as": "items"
        }
      ]
    },
    "filter_eq": {
      "id": "filter_eq",
      "name": "filter_eq",
      "category": "data",
      "description": "Filters `array` for items where `item.key` === `value`",
      "out": "lahq5z4",
      "nodes": [
        {
          "id": "lahq5z4",
          "args": [],
          "name": "filter/out",
          "ref": "script",
          "value": "return arr.filter(v => v[key] === value)"
        },
        {
          "id": "pfoypo5",
          "args": [],
          "ref": "arg",
          "value": "key"
        },
        {
          "id": "zinx621",
          "args": [],
          "ref": "arg",
          "value": "value"
        },
        {
          "id": "x2sz5kb",
          "args": [],
          "ref": "arg",
          "value": "array"
        },
        {
          "id": "74n1jfm",
          "args": [],
          "name": "filter/in"
        }
      ],
      "edges": [
        {
          "from": "pfoypo5",
          "to": "lahq5z4",
          "as": "key"
        },
        {
          "from": "zinx621",
          "to": "lahq5z4",
          "as": "value"
        },
        {
          "from": "x2sz5kb",
          "to": "lahq5z4",
          "as": "arr"
        },
        {
          "from": "74n1jfm",
          "to": "lahq5z4",
          "as": "input"
        }
      ]
    },
    "default": {
      "id": "default",
      "out": "out",
      "category": "data",
      "description": "Returns `value` if it's defined, if not then returns `otherwise`",
      "nodes": [
        {
          "id": "value",
          "ref": "arg",
          "value": "value"
        },
        {
          "id": "is_value_value",
          "ref": "arg",
          "value": "value"
        },
        {
          "id": "graph_value",
          "ref": "arg",
          "value": "__graph_value"
        },
        {
          "id": "otherwise_is",
          "ref": "arg",
          "value": "otherwise"
        },
        {
          "id": "otherwise_if",
          "ref": "arg",
          "value": "otherwise"
        },
        {
          "id": "otherwise_value",
          "ref": "arg",
          "value": "otherwise"
        },
        {
          "id": "is_otherwise",
          "ref": "script",
          "value": "return otherwise !== undefined && otherwise !== null"
        },
        {
          "id": "if_otherwise",
          "ref": "if"
        },
        {
          "id": "is_value",
          "ref": "script",
          "value": "return value !== undefined"
        },
        {
          "id": "if_value",
          "ref": "if"
        },
        {
          "id": "out",
          "ref": "return"
        }
      ],
      "edges": [
        {
          "from": "otherwise_if",
          "to": "if_otherwise",
          "as": "true"
        },
        {
          "from": "otherwise_is",
          "to": "is_otherwise",
          "as": "otherwise"
        },
        {
          "from": "is_otherwise",
          "to": "if_otherwise",
          "as": "pred"
        },
        {
          "from": "graph_value",
          "to": "if_otherwise",
          "as": "false"
        },
        {
          "from": "is_value_value",
          "to": "is_value",
          "as": "value"
        },
        {
          "from": "value",
          "to": "if_value",
          "as": "true"
        },
        {
          "from": "is_value",
          "to": "if_value",
          "as": "pred"
        },
        {
          "from": "otherwise_value",
          "to": "if_value",
          "as": "false"
        },
        {
          "from": "if_value",
          "to": "out",
          "as": "value"
        }
      ]
    },
    "switch": {"id": "switch", "ref": "extern", "value": "extern.switch"},
    "compare": {"id": "compare", "ref": "extern", "value": "compare"},
    "if": {
      "id": "if",
      "out": "out",
      "category": "flow",
      "description": "If `pred` exists in the node's context, return the value from the `true` branch. Otherwise, return the value from the `false` branch.",
      "nodes": [
        {
          "id": "pred",
          "ref": "arg",
          "value": "pred"
        },
        {
          "id": "true",
          "ref": "arg",
          "value": "true"
        },
        {
          "id": "false",
          "ref": "arg",
          "value": "false"
        },
        {
          "id": "predval",
          "ref": "script",
          "value": "return !!pred ? 'true_val' : 'false_val'"
        },
        {
          "id": "out",
          "ref": "extern",
          "value": "extern.switch"
        }
      ],
      "edges": [
        {
          "from": "true",
          "to": "out",
          "as": "true_val"
        },
        {
          "from": "false",
          "to": "out",
          "as": "false_val"
        },
        {
          "from": "pred",
          "to": "predval",
          "as": "pred"
        },
        {
          "from": "predval",
          "to": "out",
          "as": "input"
        }
      ]
    },
    "find_node": {
      "id": "find_node",
      "category": "util",
      "description": "Find the node with id `node_id` in `nodes`.",
      "ref": "script",
      "value": "if(!node_id){ return undefined } const nid = typeof node_id === 'string' ? node_id : node_id[0]; return nodes.find(n => n.id === nid || n.node_id === nid)"
    },
    "svg_text": {
      "id": "svg_text",
      "category": "html",
      "description": "Returns a hyperapp `svg` text element with `text` and `props`",
      "out": "out",
      "nodes": [
        {
          "id": "text",
          "ref": "arg",
          "value": "text"
        },
        {
          "id": "props",
          "ref": "arg",
          "value": "props"
        },
        {
          "id": "dom_type",
          "value": "text"
        },
        {
          "id": "text_el",
          "ref": "html_text"
        },
        {
          "id": "children",
          "ref": "script",
          "value": "return [text]"
        },
        {
          "id": "out",
          "ref": "html_element"
        }
      ],
      "edges": [
        {
          "from": "dom_type",
          "to": "out",
          "as": "dom_type"
        },
        {
          "from": "text",
          "to": "text_el",
          "as": "text"
        },
        {
          "from": "text_el",
          "to": "children",
          "as": "text"
        },
        {
          "from": "props",
          "to": "out",
          "as": "props"
        },
        {
          "from": "children",
          "to": "out",
          "as": "children"
        }
      ]
    },
    "runnable_return": {
      "id": "runnable_return",
      "description": "Combines `return` and `runnable` into one node.",
      "category": "flow",
      "out": "out",
      "nodes": [
        {
          "id": "return",
          "ref": "arg",
          "value": "return"
        },
        {
          "id": "display",
          "ref": "arg",
          "value": "display"
        },
        {
          "id": "subscribe",
          "ref": "arg",
          "value": "subscribe"
        },
        {
          "id": "publish",
          "ref": "arg",
          "value": "publish"
        },
        {
          "id": "return_edge_input",
          "ref": "input_edge",
          "value": "return"
        },
        {
          "id": "return_edge_arg",
          "ref": "arg",
          "value": "return_edge",
          "type": [
            "local",
            "internal"
          ]
        },
        {
          "id": "return_edge",
          "ref": "default"
        },
        {
          "id": "display_edge_input",
          "ref": "input_edge",
          "value": "display"
        },
        {
          "id": "display_edge_arg",
          "ref": "arg",
          "value": "display_edge",
          "type": [
            "local",
            "internal"
          ]
        },
        {
          "id": "display_edge",
          "ref": "default"
        },
        {
          "id": "publish_edge_input",
          "ref": "input_edge",
          "value": "publish"
        },
        {
          "id": "publish_edge_arg",
          "ref": "arg",
          "value": "publish_edge",
          "type": [
            "local",
            "internal"
          ]
        },
        {
          "id": "publish_edge",
          "ref": "default"
        },
        {
          "id": "subscribe_edge_input",
          "ref": "input_edge",
          "value": "subscribe"
        },
        {
          "id": "subscribe_edge_arg",
          "ref": "arg",
          "value": "subscribe_edge",
          "type": [
            "local",
            "internal"
          ]
        },
        {
          "id": "subscribe_edge",
          "ref": "default"
        },
        {
          "id": "args",
          "ref": "arg",
          "value": "args"
        },
        {
          "id": "merge_args",
          "ref": "merge_objects"
        },
        {
          "id": "return_node",
          "ref": "return"
        },
        {
          "id": "out",
          "ref": "runnable"
        }
      ],
      "edges": [
        {
          "from": "return_edge_arg",
          "to": "return_edge",
          "as": "value"
        },
        {
          "from": "return_edge_input",
          "to": "return_edge",
          "as": "otherwise"
        },
        {
          "from": "display_edge_arg",
          "to": "display_edge",
          "as": "value"
        },
        {
          "from": "display_edge_input",
          "to": "display_edge",
          "as": "otherwise"
        },
        {
          "from": "publish_edge_arg",
          "to": "publish_edge",
          "as": "value"
        },
        {
          "from": "publish_edge_input",
          "to": "publish_edge",
          "as": "otherwise"
        },
        {
          "from": "subscribe_edge_arg",
          "to": "subscribe_edge",
          "as": "value"
        },
        {
          "from": "subscribe_edge_input",
          "to": "subscribe_edge",
          "as": "otherwise"
        },
        {
          "from": "return_edge",
          "to": "return_node",
          "as": "return_edge"
        },
        {
          "from": "display_edge",
          "to": "return_node",
          "as": "display_edge"
        },
        {
          "from": "subscribe_edge",
          "to": "return_node",
          "as": "subscribe_edge"
        },
        {
          "from": "publish_edge",
          "to": "return_node",
          "as": "publish_edge"
        },
        {
          "from": "args",
          "to": "return_node",
          "as": "args"
        },
        {
          "from": "return_node",
          "to": "out",
          "as": "fn"
        }
      ]
    },
    "return": {
      "id": "return",
      "category": "flow",
      "description": "Creates an inline graph with args, pub/sub, etc. See docs for more detail.",
      "ref": "extern",
      "value": "extern.return"
    },
    "fold": {
      "id": "fold",
      "category": "data",
      "ref": "extern",
      "value": "extern.fold"
    },
    "runnable": {
      "id": "runnable",
      "category": "flow",
      "ref": "extern",
      "value": "extern.runnable"
    },
    "ap": {
      "id": "ap",
      "category": "flow",
      "ref": "extern",
      "value": "extern.ap"
    },
    "script": {
      "id": "script",
      "category": "functions",
      "description": "Runs this as a javascript function. `return` is needed at the end of the script to return anything.",
      "ref": "extern",
      "value": "extern.script"
    },
    "extern": {
      "id": "extern",
      "category": "nodysseus",
      "description": "Uses a function from the nodysseus extern library directly"
    },
    "array": {
      "id": "array",
      "name": "array",
      "category": "data",
      "description": "Create an array from all the inputs in alphabetical order",
      "ref": "extern",
      "value": "extern.new_array"
    },
    "create_fn": {
      "id": "create_fn",
      "ref": "extern",
      "category": "functions",
      "value": "extern.create_fn"
    },
    "merge_objects": {
      "id": "merge_objects",
      "category": "data",
      "description": "Merge the keys of two objects, in descending alphabetical order priority (`Object.assign(...inputs)`).",
      "ref": "extern",
      "value": "extern.merge_objects"
    },
    "merge_objects_mutable": {
      "id": "merge_objects_mutable",
      "category": "data",
      "description": "Merge the keys of one or more objects into the target object, in descending alphabetical order priority (`Object.assign(...inputs)`).",
      "ref": "extern",
      "value": "extern.merge_objects_mutable"
    },
    "get": {
      "id": "get",
      "category": "data",
      "description": "Get the value at the path of object. Accepts a `.` separated path e.g. get(target, 'a.b.c') returns target.a.b.c",
      "out": "out",
      "nodes": [
        {
          "id": "target",
          "ref": "arg",
          "value": "target: default"
        },
        {
          "id": "path",
          "ref": "arg",
          "value": "path"
        },
        {
          "id": "graph_value",
          "ref": "arg",
          "value": "__graph_value"
        },
        {
          "id": "otherwise",
          "ref": "arg",
          "value": "otherwise"
        },
        {
          "id": "out",
          "ref": "extern",
          "value": "extern.get"
        }
      ],
      "edges": [
        {
          "from": "graph_value",
          "to": "out",
          "as": "graphval"
        },
        {
          "from": "otherwise",
          "to": "out",
          "as": "def"
        },
        {
          "from": "path",
          "to": "out",
          "as": "path"
        },
        {
          "from": "target",
          "to": "out",
          "as": "target"
        }
      ]
    },
    "arg": {
      "id": "arg",
      "category": "flow",
      "description": "Get an input to the graph this is a part of.",
      "ref": "extern",
      "value": "extern.arg"
    },
    "set_mutable": {
      "id": "set_mutable",
      "description": "Sets `target` value at `path` to `value` and returns the object.",
      "category": "data",
      "ref": "extern",
      "value": "extern.set_mutable",
      "_out": "out",
      "_nodes": [
        {
          "id": "path",
          "ref": "arg",
          "value": "path"
        },
        {
          "id": "target",
          "ref": "arg",
          "value": "target"
        },
        {
          "id": "value",
          "ref": "arg",
          "value": "value"
        },
        {
          "id": "out",
          "ref": "extern",
          "value": "extern.set_mutable"
        }
      ],
      "_edges": [
        {
          "from": "path",
          "to": "out",
          "as": "path"
        },
        {
          "from": "target",
          "to": "out",
          "as": "target"
        },
        {
          "from": "value",
          "to": "out",
          "as": "value"
        }
      ]
    },
    "set": {
      "id": "set",
      "category": "data",
      "description": "Returns a new object with the property at `path` (or the node's value) on `target` set to `value`. Accepts a `.` separated path e.g. set(target, 'a.b', 'c') returns {...target, a: {...target.a, b: 'c'}}",
      "type": "(target: any, value: any, path: string) => any",
      "ref": "extern",
      "value": "extern.set"
    },
    "modify": {
      "id": "modify",
      "category": "data",
      "description": "Returns a new object with the property at `path` (or the node's value) on `target` modified with `fn`. Accepts a `.` separated path e.g. set(target, 'a.b', 'c') returns {...target, a: {...target.a, b: 'c'}}",
      "type": "(target: any, value: any, path: string) => any",
      "ref": "extern",
      "value": "extern.modify"
    },
    "delete": {
      "id": "delete",
      "category": "data",
      "description": "Deletes `target` property at `path`",
      "ref": "extern",
      "value": "extern.delete"
    },
    "tapbutton": {
      "id": "tapbutton",
      "category": "html",
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
          "name": "tapbutton",
          "ref": "return"
        },
        {
          "id": "qgbinm2",
          "value": "button",
          "ref": "html_element"
        },
        {"id": "label", "ref": "arg", "value": "__graph_value"},
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
          "id": "n2a984s_arr",
          "ref": "array"
        },
        {
          "id": "n2a984s",
          "ref": "ap"
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
        {"from": "label", "to": "9fogdzn", "as": "text"},
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
          "to": "_hbo5tmq",
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
          "to": "n2a984s_arr",
          "as": "arg0"
        },
        {
          "from": "a14g4yc",
          "to": "n2a984s_arr",
          "as": "arg1"
        },
        {
          "from": "n2a984s_arr",
          "to": "n2a984s",
          "as": "fn"
        }
      ],
      "out": "out"
    },
    "graphchangecache": {
    "id": "graphchangecache",
    "out": "out",
    "nodes": {
      "value": {
        "id": "value",
        "ref": "arg",
        "value": "value"
      },
      "graphid": {
        "id": "graphid",
        "ref": "arg",
        "value": "__graphid"
      },
      "recache": {
        "id": "recache",
        "ref": "arg",
        "value": "recache"
      },
      "cachevalue_state": {
        "id": "cachevalue_state",
        "value": "_cachevalue.state",
        "ref": "arg"
      },
      "pred_cachevalue_state": {
        "id": "pred_cachevalue_state",
        "value": "_cachevalue.state",
        "ref": "arg"
      },
      "pred_cache_state": {
        "id": "pred_cache_state",
        "value": "const docache = _reset || (recache === undefined ? (cachevaluestate === undefined || cachevaluestate === null) : (recache !== false && (typeof recache !== 'object' || Object.keys(recache).length > 0)))\n\nreturn docache;",
        "ref": "script"
      },
      "ap_cache_value": {
        "id": "ap_cache_value",
        "ref": "arg",
        "value": "value: default"
      },
      "ap_cache_args": {
        "id": "ap_cache_args"
      },
      "ap_cache_fn": {
        "id": "ap_cache_fn",
        "value": "_cachevalue.set",
        "ref": "arg"
      },
      "cache": {
        "id": "cache",
        "ref": "ap"
      },
      "if_cache_state": {
        "id": "if_cache_state",
        "ref": "if"
      },
      "cache_state": {
        "id": "cache_state",
        "ref": "state"
      },
      "cache_return_args": {
        "id": "cache_return_args"
      },
      "cache_return": {
        "id": "cache_return",
        "ref": "return"
      },
      "recache_button_fn": {
        "id": "recache_button_fn",
        "value": "_cachevalue.set",
        "ref": "arg"
      },
      "recache_button_fn_args": {
        "id": "recache_button_fn_args"
      },
      "recache_button_fn_value": {
        "id": "recache_button_fn_value",
        "ref": "arg",
        "value": "value"
      },
      "recache_button_ap": {
        "id": "recache_button_ap",
        "ref": "ap"
      },
      "recache_button": {
        "id": "recache_button",
        "value": "reset",
        "ref": "tapbutton"
      },
      "out": {
        "id": "out",
        "name": "graphchangecache",
        "ref": "return"
      },
      "fy9ee3e": {
        "id": "fy9ee3e"
      },
      "7rk5v07": {
        "id": "7rk5v07",
        "ref": "ap"
      },
      "gecwhp1": {
        "id": "gecwhp1",
        "value": "_reset.set",
        "ref": "arg"
      },
      "uwfswa7": {
        "id": "uwfswa7"
      },
      "eh9nyb7": {
        "id": "eh9nyb7",
        "value": "true"
      },
      "wx3yoem": {
        "id": "wx3yoem",
        "ref": "state"
      },
      "h56r87n": {
        "id": "h56r87n",
        "value": "_reset.state",
        "ref": "arg"
      },
      "xbhq0f0": {
        "id": "xbhq0f0",
        "value": "true"
      },
      "kqnga6d": {
        "id": "kqnga6d",
        "ref": "array"
      },
      "9w2cqoc": {
        "id": "9w2cqoc",
        "value": "0",
        "ref": "get"
      },
      "w7nd0t8": {
        "id": "w7nd0t8",
        "ref": "ap"
      },
      "mixjulh": {
        "id": "mixjulh",
        "value": "true"
      },
      "5647gh5": {
        "id": "5647gh5"
      },
      "atqq2qu": {
        "id": "atqq2qu",
        "value": "false"
      },
      "wa4gr84": {
        "id": "wa4gr84",
        "value": "_reset.set",
        "ref": "arg"
      },
      "c8r9x38": {
        "id": "c8r9x38",
        "ref": "refval"
      },
      "8shc9ct": {
        "id": "8shc9ct",
        "value": "_isrunning",
        "ref": "arg"
      },
      "x165dr6": {
        "id": "x165dr6",
        "value": "_isrunning.value = false;\n\nreturn value;",
        "ref": "script"
      },
      "ieg16nd": {
        "id": "ieg16nd",
        "value": "_isrunning",
        "ref": "arg"
      }
    },
    "edges": {
      "ap_cache_value": {
        "from": "ap_cache_value",
        "to": "x165dr6",
        "as": "value"
      },
      "ap_cache_args": {
        "from": "ap_cache_args",
        "to": "cache",
        "as": "args"
      },
      "ap_cache_fn": {
        "from": "ap_cache_fn",
        "to": "cache",
        "as": "fn"
      },
      "pred_cachevalue_state": {
        "from": "pred_cachevalue_state",
        "to": "pred_cache_state",
        "as": "cachevaluestate"
      },
      "recache": {
        "from": "recache",
        "to": "pred_cache_state",
        "as": "recache"
      },
      "cachevalue_state": {
        "from": "cachevalue_state",
        "to": "if_cache_state",
        "as": "false"
      },
      "cache": {
        "from": "cache",
        "to": "kqnga6d",
        "as": "arg0"
      },
      "pred_cache_state": {
        "from": "pred_cache_state",
        "to": "if_cache_state",
        "as": "pred"
      },
      "if_cache_state": {
        "from": "if_cache_state",
        "to": "cache_return",
        "as": "value"
      },
      "cache_state": {
        "from": "cache_state",
        "to": "cache_return_args",
        "as": "_cachevalue"
      },
      "cache_return_args": {
        "from": "cache_return_args",
        "to": "out",
        "as": "args"
      },
      "cache_return": {
        "from": "cache_return",
        "to": "out",
        "as": "value"
      },
      "recache_button_fn_value": {
        "from": "recache_button_fn_value",
        "to": "recache_button_fn_args",
        "as": "value"
      },
      "recache_button_fn_args": {
        "from": "recache_button_fn_args",
        "to": "recache_button_ap",
        "as": "args"
      },
      "recache_button_fn": {
        "from": "recache_button_fn",
        "to": "recache_button_ap",
        "as": "fn"
      },
      "recache_button_ap": {
        "from": "recache_button_ap",
        "to": "recache_button",
        "as": "ontap"
      },
      "recache_button": {
        "from": "recache_button",
        "to": "out",
        "as": "display"
      },
      "fy9ee3e": {
        "from": "fy9ee3e",
        "to": "out",
        "as": "subscribe"
      },
      "7rk5v07": {
        "from": "7rk5v07",
        "to": "fy9ee3e",
        "as": "graphchange"
      },
      "gecwhp1": {
        "from": "gecwhp1",
        "to": "7rk5v07",
        "as": "fn"
      },
      "uwfswa7": {
        "from": "uwfswa7",
        "to": "7rk5v07",
        "as": "args"
      },
      "eh9nyb7": {
        "from": "eh9nyb7",
        "to": "uwfswa7",
        "as": "value"
      },
      "wx3yoem": {
        "from": "wx3yoem",
        "to": "cache_return_args",
        "as": "_reset"
      },
      "h56r87n": {
        "from": "h56r87n",
        "to": "pred_cache_state",
        "as": "_reset"
      },
      "xbhq0f0": {
        "from": "xbhq0f0",
        "to": "cache",
        "as": "run"
      },
      "kqnga6d": {
        "from": "kqnga6d",
        "to": "9w2cqoc",
        "as": "target"
      },
      "9w2cqoc": {
        "from": "9w2cqoc",
        "to": "if_cache_state",
        "as": "true"
      },
      "w7nd0t8": {
        "from": "w7nd0t8",
        "to": "kqnga6d",
        "as": "arg1"
      },
      "mixjulh": {
        "from": "mixjulh",
        "to": "w7nd0t8",
        "as": "run"
      },
      "5647gh5": {
        "from": "5647gh5",
        "to": "w7nd0t8",
        "as": "args"
      },
      "atqq2qu": {
        "from": "atqq2qu",
        "to": "5647gh5",
        "as": "value"
      },
      "wa4gr84": {
        "from": "wa4gr84",
        "to": "w7nd0t8",
        "as": "fn"
      },
      "c8r9x38": {
        "from": "c8r9x38",
        "to": "cache_return_args",
        "as": "_isrunning"
      },
      "8shc9ct": {
        "from": "8shc9ct",
        "to": "pred_cache_state",
        "as": "_isrunning"
      },
      "x165dr6": {
        "from": "x165dr6",
        "to": "ap_cache_args",
        "as": "value"
      },
      "ieg16nd": {
        "from": "ieg16nd",
        "to": "x165dr6",
        "as": "_isrunning"
      }
    },
    "edges_in": {
      "x165dr6": {
        "ap_cache_value": {
          "from": "ap_cache_value",
          "to": "x165dr6",
          "as": "value"
        },
        "ieg16nd": {
          "from": "ieg16nd",
          "to": "x165dr6",
          "as": "_isrunning"
        }
      },
      "cache": {
        "ap_cache_args": {
          "from": "ap_cache_args",
          "to": "cache",
          "as": "args"
        },
        "ap_cache_fn": {
          "from": "ap_cache_fn",
          "to": "cache",
          "as": "fn"
        },
        "xbhq0f0": {
          "from": "xbhq0f0",
          "to": "cache",
          "as": "run"
        }
      },
      "pred_cache_state": {
        "pred_cachevalue_state": {
          "from": "pred_cachevalue_state",
          "to": "pred_cache_state",
          "as": "cachevaluestate"
        },
        "recache": {
          "from": "recache",
          "to": "pred_cache_state",
          "as": "recache"
        },
        "h56r87n": {
          "from": "h56r87n",
          "to": "pred_cache_state",
          "as": "_reset"
        },
        "8shc9ct": {
          "from": "8shc9ct",
          "to": "pred_cache_state",
          "as": "_isrunning"
        }
      },
      "if_cache_state": {
        "cachevalue_state": {
          "from": "cachevalue_state",
          "to": "if_cache_state",
          "as": "false"
        },
        "pred_cache_state": {
          "from": "pred_cache_state",
          "to": "if_cache_state",
          "as": "pred"
        },
        "9w2cqoc": {
          "from": "9w2cqoc",
          "to": "if_cache_state",
          "as": "true"
        }
      },
      "kqnga6d": {
        "cache": {
          "from": "cache",
          "to": "kqnga6d",
          "as": "arg0"
        },
        "w7nd0t8": {
          "from": "w7nd0t8",
          "to": "kqnga6d",
          "as": "arg1"
        }
      },
      "cache_return": {
        "if_cache_state": {
          "from": "if_cache_state",
          "to": "cache_return",
          "as": "value"
        }
      },
      "cache_return_args": {
        "cache_state": {
          "from": "cache_state",
          "to": "cache_return_args",
          "as": "_cachevalue"
        },
        "wx3yoem": {
          "from": "wx3yoem",
          "to": "cache_return_args",
          "as": "_reset"
        },
        "c8r9x38": {
          "from": "c8r9x38",
          "to": "cache_return_args",
          "as": "_isrunning"
        }
      },
      "out": {
        "cache_return_args": {
          "from": "cache_return_args",
          "to": "out",
          "as": "args"
        },
        "cache_return": {
          "from": "cache_return",
          "to": "out",
          "as": "value"
        },
        "recache_button": {
          "from": "recache_button",
          "to": "out",
          "as": "display"
        },
        "fy9ee3e": {
          "from": "fy9ee3e",
          "to": "out",
          "as": "subscribe"
        }
      },
      "recache_button_fn_args": {
        "recache_button_fn_value": {
          "from": "recache_button_fn_value",
          "to": "recache_button_fn_args",
          "as": "value"
        }
      },
      "recache_button_ap": {
        "recache_button_fn_args": {
          "from": "recache_button_fn_args",
          "to": "recache_button_ap",
          "as": "args"
        },
        "recache_button_fn": {
          "from": "recache_button_fn",
          "to": "recache_button_ap",
          "as": "fn"
        }
      },
      "recache_button": {
        "recache_button_ap": {
          "from": "recache_button_ap",
          "to": "recache_button",
          "as": "ontap"
        }
      },
      "fy9ee3e": {
        "7rk5v07": {
          "from": "7rk5v07",
          "to": "fy9ee3e",
          "as": "graphchange"
        }
      },
      "7rk5v07": {
        "gecwhp1": {
          "from": "gecwhp1",
          "to": "7rk5v07",
          "as": "fn"
        },
        "uwfswa7": {
          "from": "uwfswa7",
          "to": "7rk5v07",
          "as": "args"
        }
      },
      "uwfswa7": {
        "eh9nyb7": {
          "from": "eh9nyb7",
          "to": "uwfswa7",
          "as": "value"
        }
      },
      "9w2cqoc": {
        "kqnga6d": {
          "from": "kqnga6d",
          "to": "9w2cqoc",
          "as": "target"
        }
      },
      "w7nd0t8": {
        "mixjulh": {
          "from": "mixjulh",
          "to": "w7nd0t8",
          "as": "run"
        },
        "5647gh5": {
          "from": "5647gh5",
          "to": "w7nd0t8",
          "as": "args"
        },
        "wa4gr84": {
          "from": "wa4gr84",
          "to": "w7nd0t8",
          "as": "fn"
        }
      },
      "5647gh5": {
        "atqq2qu": {
          "from": "atqq2qu",
          "to": "5647gh5",
          "as": "value"
        }
      },
      "ap_cache_args": {
        "x165dr6": {
          "from": "x165dr6",
          "to": "ap_cache_args",
          "as": "value"
        }
      }
    }
  },
    "cache": {
    "id": "cache",
    "out": "out",
    "nodes": {
      "value": {
        "id": "value",
        "ref": "arg",
        "value": "value"
      },
      "graphid": {
        "id": "graphid",
        "ref": "arg",
        "value": "__graphid"
      },
      "recache": {
        "id": "recache",
        "ref": "arg",
        "value": "recache"
      },
      "cachevalue_state": {
        "id": "cachevalue_state",
        "ref": "arg",
        "value": "cachevalue.state"
      },
      "pred_cachevalue_state": {
        "id": "pred_cachevalue_state",
        "ref": "arg",
        "value": "cachevalue.state"
      },
      "pred_cache_state": {
        "id": "pred_cache_state",
        "value": "const docache = isrunning.value ? false : recache === undefined ? (cachevaluestate === undefined || cachevaluestate === null) : (recache !== false && (typeof recache !== 'object' || Object.keys(recache).length > 0));\n\nif(docache) {\n  isrunning.value = true;\n}\n\nreturn docache;",
        "ref": "script"
      },
      "ap_cache_value": {
        "id": "ap_cache_value",
        "ref": "arg",
        "value": "value: default"
      },
      "ap_cache_args": {
        "id": "ap_cache_args"
      },
      "ap_cache_run": {
        "id": "ap_cache_run",
        "value": "true"
      },
      "ap_cache_fn": {
        "id": "ap_cache_fn",
        "ref": "arg",
        "value": "cachevalue.set"
      },
      "cache": {
        "id": "cache",
        "ref": "ap"
      },
      "if_cache_state": {
        "id": "if_cache_state",
        "ref": "if"
      },
      "cache_state": {
        "id": "cache_state",
        "ref": "state"
      },
      "cache_return_args": {
        "id": "cache_return_args"
      },
      "cache_return": {
        "id": "cache_return",
        "ref": "return"
      },
      "recache_button_fn": {
        "id": "recache_button_fn",
        "ref": "arg",
        "value": "cachevalue.set"
      },
      "recache_button_fn_args": {
        "id": "recache_button_fn_args"
      },
      "recache_button_fn_value": {
        "id": "recache_button_fn_value",
        "value": "undefined"
      },
      "recache_button_ap": {
        "id": "recache_button_ap",
        "ref": "ap"
      },
      "recache_button": {
        "id": "recache_button",
        "value": "recache",
        "ref": "tapbutton"
      },
      "out": {
        "id": "out",
        "ref": "return",
        "name": "cache"
      },
      "jb9ua5s": {
        "id": "jb9ua5s",
        "ref": "refval"
      },
      "3s0n7mj": {
        "id": "3s0n7mj",
        "value": "isrunning",
        "ref": "arg"
      },
      "vviqt6a": {
        "id": "vviqt6a",
        "value": "isrunning.value = false;\nreturn value;",
        "ref": "script"
      },
      "vz70gvz": {
        "id": "vz70gvz",
        "value": "isrunning",
        "ref": "arg"
      }
    },
    "edges": {
      "ap_cache_value": {
        "from": "ap_cache_value",
        "to": "vviqt6a",
        "as": "value"
      },
      "ap_cache_args": {
        "from": "ap_cache_args",
        "to": "cache",
        "as": "args"
      },
      "ap_cache_run": {
        "from": "ap_cache_run",
        "to": "cache",
        "as": "run"
      },
      "ap_cache_fn": {
        "from": "ap_cache_fn",
        "to": "cache",
        "as": "fn"
      },
      "pred_cachevalue_state": {
        "from": "pred_cachevalue_state",
        "to": "pred_cache_state",
        "as": "cachevaluestate"
      },
      "recache": {
        "from": "recache",
        "to": "pred_cache_state",
        "as": "recache"
      },
      "cachevalue_state": {
        "from": "cachevalue_state",
        "to": "if_cache_state",
        "as": "false"
      },
      "cache": {
        "from": "cache",
        "to": "if_cache_state",
        "as": "true"
      },
      "pred_cache_state": {
        "from": "pred_cache_state",
        "to": "if_cache_state",
        "as": "pred"
      },
      "if_cache_state": {
        "from": "if_cache_state",
        "to": "cache_return",
        "as": "value"
      },
      "cache_state": {
        "from": "cache_state",
        "to": "cache_return_args",
        "as": "cachevalue"
      },
      "cache_return_args": {
        "from": "cache_return_args",
        "to": "out",
        "as": "args"
      },
      "cache_return": {
        "from": "cache_return",
        "to": "out",
        "as": "value"
      },
      "recache_button_fn_value": {
        "from": "recache_button_fn_value",
        "to": "recache_button_fn_args",
        "as": "value"
      },
      "recache_button_fn_args": {
        "from": "recache_button_fn_args",
        "to": "recache_button_ap",
        "as": "args"
      },
      "recache_button_fn": {
        "from": "recache_button_fn",
        "to": "recache_button_ap",
        "as": "fn"
      },
      "recache_button_ap": {
        "from": "recache_button_ap",
        "to": "recache_button",
        "as": "ontap"
      },
      "recache_button": {
        "from": "recache_button",
        "to": "out",
        "as": "display"
      },
      "jb9ua5s": {
        "from": "jb9ua5s",
        "to": "cache_return_args",
        "as": "isrunning"
      },
      "3s0n7mj": {
        "from": "3s0n7mj",
        "to": "pred_cache_state",
        "as": "isrunning"
      },
      "vviqt6a": {
        "from": "vviqt6a",
        "to": "ap_cache_args",
        "as": "value"
      },
      "vz70gvz": {
        "from": "vz70gvz",
        "to": "vviqt6a",
        "as": "isrunning"
      }
    },
    "edges_in": {
      "vviqt6a": {
        "ap_cache_value": {
          "from": "ap_cache_value",
          "to": "vviqt6a",
          "as": "value"
        },
        "vz70gvz": {
          "from": "vz70gvz",
          "to": "vviqt6a",
          "as": "isrunning"
        }
      },
      "cache": {
        "ap_cache_args": {
          "from": "ap_cache_args",
          "to": "cache",
          "as": "args"
        },
        "ap_cache_run": {
          "from": "ap_cache_run",
          "to": "cache",
          "as": "run"
        },
        "ap_cache_fn": {
          "from": "ap_cache_fn",
          "to": "cache",
          "as": "fn"
        }
      },
      "pred_cache_state": {
        "pred_cachevalue_state": {
          "from": "pred_cachevalue_state",
          "to": "pred_cache_state",
          "as": "cachevaluestate"
        },
        "recache": {
          "from": "recache",
          "to": "pred_cache_state",
          "as": "recache"
        },
        "3s0n7mj": {
          "from": "3s0n7mj",
          "to": "pred_cache_state",
          "as": "isrunning"
        }
      },
      "if_cache_state": {
        "cachevalue_state": {
          "from": "cachevalue_state",
          "to": "if_cache_state",
          "as": "false"
        },
        "cache": {
          "from": "cache",
          "to": "if_cache_state",
          "as": "true"
        },
        "pred_cache_state": {
          "from": "pred_cache_state",
          "to": "if_cache_state",
          "as": "pred"
        }
      },
      "cache_return": {
        "if_cache_state": {
          "from": "if_cache_state",
          "to": "cache_return",
          "as": "value"
        }
      },
      "cache_return_args": {
        "cache_state": {
          "from": "cache_state",
          "to": "cache_return_args",
          "as": "cachevalue"
        },
        "jb9ua5s": {
          "from": "jb9ua5s",
          "to": "cache_return_args",
          "as": "isrunning"
        }
      },
      "out": {
        "cache_return_args": {
          "from": "cache_return_args",
          "to": "out",
          "as": "args"
        },
        "cache_return": {
          "from": "cache_return",
          "to": "out",
          "as": "value"
        },
        "recache_button": {
          "from": "recache_button",
          "to": "out",
          "as": "display"
        }
      },
      "recache_button_fn_args": {
        "recache_button_fn_value": {
          "from": "recache_button_fn_value",
          "to": "recache_button_fn_args",
          "as": "value"
        }
      },
      "recache_button_ap": {
        "recache_button_fn_args": {
          "from": "recache_button_fn_args",
          "to": "recache_button_ap",
          "as": "args"
        },
        "recache_button_fn": {
          "from": "recache_button_fn",
          "to": "recache_button_ap",
          "as": "fn"
        }
      },
      "recache_button": {
        "recache_button_ap": {
          "from": "recache_button_ap",
          "to": "recache_button",
          "as": "ontap"
        }
      },
      "ap_cache_args": {
        "vviqt6a": {
          "from": "vviqt6a",
          "to": "ap_cache_args",
          "as": "value"
        }
      }
    }
  },
    "isunchanged": {
      "id": "isunchanged",
      "category": "data",
      "description": "Returns true if `value` is unchanged otherwise `false`.",
      "nodes": [
        {
          "id": "in"
        },
        {
          "id": "eq_fn_value",
          "ref": "arg",
          "value": "value"
        },
        {"id": "eq_fn_if", "ref": "arg", "value": "eq_fn"},
        {"id": "eq_fn_cache", "ref": "arg", "value": "eq_fn"},
        {
          "id": "cache_value",
          "ref": "arg",
          "value": "value"
        },
        {
          "id": "fn",
          "ref": "arg",
          "value": "fn"
        },
        {
          "id": "cached",
          "ref": "arg",
          "value": "cached",
          "type": "internal"
        },
        {
          "id": "eq_default",
          "ref": "eq"
        },
        {
          "id": "eq_runnable",
          "ref": "runnable"
        },
        {
          "id": "fn_runnable",
          "ref": "default"
        },
        {
          "id": "eq_fn_runnable",
          "ref": "script",
          "value": "return {...fn, args: {...(fn.args ?? {}), a, b}}"
        },
        { "id": "eq_fn", "ref": "run" },
        {"id": "eq_fn_return_args"},
        { "id": "cache", "ref": "set_arg", "value": "cached" },
        {"id": "if_eq_fn", "ref": "if"},
        { "id": "out", "ref": "return" }
      ],
      "edges": [
        {
          "from": "eq_default",
          "to": "eq_runnable",
          "as": "fn"
        },
        {
          "from": "eq_runnable",
          "to": "fn_runnable",
          "as": "otherwise"
        },
        {
          "from": "fn",
          "to": "fn_runnable",
          "as": "value"
        },
        {
          "from": "fn_runnable",
          "to": "eq_fn_runnable",
          "as": "fn"
        },
        {
          "from": "eq_fn_value",
          "to": "eq_fn_runnable",
          "as": "a"
        },
        {
          "from": "cached",
          "to": "eq_fn_runnable",
          "as": "b"
        },
        {
          "from": "eq_fn_runnable",
          "to": "eq_fn",
          "as": "runnable"
        },
        {
          "from": "eq_fn_if",
          "to": "if_eq_fn",
          "as": "pred"
        },
        {
          "from": "eq_fn",
          "to": "eq_fn_return_args",
          "as": "eq_fn"
        },
        {
          "from": "cache_value",
          "to": "cache",
          "as": "value"
        },
        {
          "from": "eq_fn_cache",
          "to": "cache",
          "as": "eq"
        },
        {
          "from": "cache",
          "to": "out",
          "as": "false"
        }
      ]
    },
    "refval": {
    "id": "refval",
    "out": "out",
    "nodes": {
      "path_text": {
        "id": "path_text",
        "value": "_ref.value",
        "ref": "arg"
      },
      "display_text": {
        "id": "display_text",
        "ref": "html_text"
      },
      "display": {
        "id": "display",
        "ref": "html_element"
      },
      "out_atom": {
        "id": "out_atom",
        "value": "set",
        "ref": "set_mutable"
      },
      "out": {
        "id": "out",
        "name": "refval",
        "ref": "return"
      },
      "d2paurd": {
        "id": "d2paurd"
      },
      "29wb1n1": {
        "id": "29wb1n1",
        "value": "_lib.no.runtime.update_args(graphid, {mutableref});\n\nreturn mutableref",
        "ref": "script"
      },
      "h9rv0lt": {
        "id": "h9rv0lt"
      },
      "k2ezrys": {
        "id": "k2ezrys",
        "value": "0"
      },
      "ggdfgm1": {
        "id": "ggdfgm1",
        "value": "_ref",
        "ref": "arg"
      },
      "826gizx": {
        "id": "826gizx",
        "ref": "return"
      },
      "pv1njne": {
        "id": "pv1njne"
      },
      "27k1xuw": {
        "id": "27k1xuw",
        "ref": "runnable"
      },
      "miswsup": {
        "id": "miswsup",
        "value": "if(value !== undefined) {\n  _ref.value = value;\n}\nreturn value",
        "ref": "script"
      },
      "12y4v2j": {
        "id": "12y4v2j",
        "ref": "arg",
        "value": "value"
      },
      "sfutvvr": {
        "id": "sfutvvr",
        "value": "_ref",
        "ref": "arg"
      },
      "ozs94yx": {
        "id": "ozs94yx"
      },
      "8jg1uvz": {
        "id": "8jg1uvz"
      },
      "z8oo627": {
        "id": "z8oo627",
        "value": "set",
        "ref": "arg"
      },
      "xvwr56e": {
        "id": "xvwr56e"
      },
      "bceqpks": {
        "id": "bceqpks",
        "ref": "ap"
      },
      "kedy2mx": {
        "id": "kedy2mx",
        "value": "set",
        "ref": "arg"
      },
      "qj9latb": {
        "id": "qj9latb",
        "ref": "if"
      },
      "484tq9a": {
        "id": "484tq9a",
        "value": "onframe",
        "ref": "arg"
      },
      "d89vgr1": {
        "id": "d89vgr1"
      },
      "x5va6dz": {
        "id": "x5va6dz",
        "ref": "ap"
      },
      "ltldy42": {
        "id": "ltldy42",
        "value": "onframe",
        "ref": "arg"
      },
      "3kj1w1a": {
        "id": "3kj1w1a",
        "value": "true"
      },
      "mue8w9r": {
        "id": "mue8w9r"
      },
      "7jg7rr8": {
        "id": "7jg7rr8",
        "value": "_ref",
        "ref": "arg"
      },
      "1mu7unt": {
        "id": "1mu7unt",
        "value": "__graphid",
        "ref": "arg"
      },
      "wvpeonf": {
        "id": "wvpeonf",
        "ref": "return"
      },
      "1r14v3m": {
        "id": "1r14v3m"
      },
      "0xlqgi2": {
        "id": "0xlqgi2",
        "value": "return _lib.no.runtime.get_args(graphid).mutableref;",
        "ref": "script"
      },
      "o689p4w": {
        "id": "o689p4w",
        "ref": "if"
      },
      "gfxlod4": {
        "id": "gfxlod4",
        "value": "current",
        "ref": "arg"
      },
      "bb9h44j": {
        "id": "bb9h44j",
        "value": "current",
        "ref": "arg"
      },
      "bi3dbrg": {
        "id": "bi3dbrg",
        "value": "__graphid",
        "ref": "arg"
      }
    },
    "edges": {
      "path_text": {
        "from": "path_text",
        "to": "display_text",
        "as": "text"
      },
      "display_text": {
        "from": "display_text",
        "to": "display",
        "as": "children"
      },
      "display": {
        "from": "display",
        "to": "out",
        "as": "display"
      },
      "out_atom": {
        "from": "out_atom",
        "to": "826gizx",
        "as": "value"
      },
      "d2paurd": {
        "from": "d2paurd",
        "to": "out",
        "as": "args"
      },
      "29wb1n1": {
        "from": "29wb1n1",
        "to": "o689p4w",
        "as": "false"
      },
      "h9rv0lt": {
        "from": "h9rv0lt",
        "to": "29wb1n1",
        "as": "mutableref"
      },
      "k2ezrys": {
        "from": "k2ezrys",
        "to": "h9rv0lt",
        "as": "value"
      },
      "ggdfgm1": {
        "from": "ggdfgm1",
        "to": "out_atom",
        "as": "target"
      },
      "826gizx": {
        "from": "826gizx",
        "to": "out",
        "as": "value"
      },
      "pv1njne": {
        "from": "pv1njne",
        "to": "826gizx",
        "as": "args"
      },
      "ozs94yx": {
        "from": "ozs94yx",
        "to": "27k1xuw",
        "as": "parameters"
      },
      "miswsup": {
        "from": "miswsup",
        "to": "27k1xuw",
        "as": "fn"
      },
      "sfutvvr": {
        "from": "sfutvvr",
        "to": "miswsup",
        "as": "_ref"
      },
      "12y4v2j": {
        "from": "12y4v2j",
        "to": "miswsup",
        "as": "value"
      },
      "8jg1uvz": {
        "from": "8jg1uvz",
        "to": "ozs94yx",
        "as": "value"
      },
      "27k1xuw": {
        "from": "27k1xuw",
        "to": "pv1njne",
        "as": "set"
      },
      "z8oo627": {
        "from": "z8oo627",
        "to": "out_atom",
        "as": "value"
      },
      "xvwr56e": {
        "from": "xvwr56e",
        "to": "826gizx",
        "as": "subscribe"
      },
      "bceqpks": {
        "from": "bceqpks",
        "to": "qj9latb",
        "as": "true"
      },
      "kedy2mx": {
        "from": "kedy2mx",
        "to": "bceqpks",
        "as": "fn"
      },
      "qj9latb": {
        "from": "qj9latb",
        "to": "xvwr56e",
        "as": "animationframe"
      },
      "484tq9a": {
        "from": "484tq9a",
        "to": "qj9latb",
        "as": "pred"
      },
      "d89vgr1": {
        "from": "d89vgr1",
        "to": "bceqpks",
        "as": "args"
      },
      "x5va6dz": {
        "from": "x5va6dz",
        "to": "d89vgr1",
        "as": "value"
      },
      "ltldy42": {
        "from": "ltldy42",
        "to": "x5va6dz",
        "as": "fn"
      },
      "3kj1w1a": {
        "from": "3kj1w1a",
        "to": "x5va6dz",
        "as": "run"
      },
      "mue8w9r": {
        "from": "mue8w9r",
        "to": "x5va6dz",
        "as": "args"
      },
      "7jg7rr8": {
        "from": "7jg7rr8",
        "to": "mue8w9r",
        "as": "ref"
      },
      "1mu7unt": {
        "from": "1mu7unt",
        "to": "29wb1n1",
        "as": "graphid"
      },
      "wvpeonf": {
        "from": "wvpeonf",
        "to": "d2paurd",
        "as": "_ref"
      },
      "1r14v3m": {
        "from": "1r14v3m",
        "to": "wvpeonf",
        "as": "args"
      },
      "0xlqgi2": {
        "from": "0xlqgi2",
        "to": "1r14v3m",
        "as": "current"
      },
      "o689p4w": {
        "from": "o689p4w",
        "to": "wvpeonf",
        "as": "value"
      },
      "gfxlod4": {
        "from": "gfxlod4",
        "to": "o689p4w",
        "as": "pred"
      },
      "bb9h44j": {
        "from": "bb9h44j",
        "to": "o689p4w",
        "as": "true"
      },
      "bi3dbrg": {
        "from": "bi3dbrg",
        "to": "0xlqgi2",
        "as": "graphid"
      }
    },
    "edges_in": {
      "display_text": {
        "path_text": {
          "from": "path_text",
          "to": "display_text",
          "as": "text"
        }
      },
      "display": {
        "display_text": {
          "from": "display_text",
          "to": "display",
          "as": "children"
        }
      },
      "out": {
        "display": {
          "from": "display",
          "to": "out",
          "as": "display"
        },
        "d2paurd": {
          "from": "d2paurd",
          "to": "out",
          "as": "args"
        },
        "826gizx": {
          "from": "826gizx",
          "to": "out",
          "as": "value"
        }
      },
      "826gizx": {
        "out_atom": {
          "from": "out_atom",
          "to": "826gizx",
          "as": "value"
        },
        "pv1njne": {
          "from": "pv1njne",
          "to": "826gizx",
          "as": "args"
        },
        "xvwr56e": {
          "from": "xvwr56e",
          "to": "826gizx",
          "as": "subscribe"
        }
      },
      "o689p4w": {
        "29wb1n1": {
          "from": "29wb1n1",
          "to": "o689p4w",
          "as": "false"
        },
        "gfxlod4": {
          "from": "gfxlod4",
          "to": "o689p4w",
          "as": "pred"
        },
        "bb9h44j": {
          "from": "bb9h44j",
          "to": "o689p4w",
          "as": "true"
        }
      },
      "29wb1n1": {
        "h9rv0lt": {
          "from": "h9rv0lt",
          "to": "29wb1n1",
          "as": "mutableref"
        },
        "1mu7unt": {
          "from": "1mu7unt",
          "to": "29wb1n1",
          "as": "graphid"
        }
      },
      "h9rv0lt": {
        "k2ezrys": {
          "from": "k2ezrys",
          "to": "h9rv0lt",
          "as": "value"
        }
      },
      "out_atom": {
        "ggdfgm1": {
          "from": "ggdfgm1",
          "to": "out_atom",
          "as": "target"
        },
        "z8oo627": {
          "from": "z8oo627",
          "to": "out_atom",
          "as": "value"
        }
      },
      "27k1xuw": {
        "ozs94yx": {
          "from": "ozs94yx",
          "to": "27k1xuw",
          "as": "parameters"
        },
        "miswsup": {
          "from": "miswsup",
          "to": "27k1xuw",
          "as": "fn"
        }
      },
      "miswsup": {
        "sfutvvr": {
          "from": "sfutvvr",
          "to": "miswsup",
          "as": "_ref"
        },
        "12y4v2j": {
          "from": "12y4v2j",
          "to": "miswsup",
          "as": "value"
        }
      },
      "ozs94yx": {
        "8jg1uvz": {
          "from": "8jg1uvz",
          "to": "ozs94yx",
          "as": "value"
        }
      },
      "pv1njne": {
        "27k1xuw": {
          "from": "27k1xuw",
          "to": "pv1njne",
          "as": "set"
        }
      },
      "qj9latb": {
        "bceqpks": {
          "from": "bceqpks",
          "to": "qj9latb",
          "as": "true"
        },
        "484tq9a": {
          "from": "484tq9a",
          "to": "qj9latb",
          "as": "pred"
        }
      },
      "bceqpks": {
        "kedy2mx": {
          "from": "kedy2mx",
          "to": "bceqpks",
          "as": "fn"
        },
        "d89vgr1": {
          "from": "d89vgr1",
          "to": "bceqpks",
          "as": "args"
        }
      },
      "xvwr56e": {
        "qj9latb": {
          "from": "qj9latb",
          "to": "xvwr56e",
          "as": "animationframe"
        }
      },
      "d89vgr1": {
        "x5va6dz": {
          "from": "x5va6dz",
          "to": "d89vgr1",
          "as": "value"
        }
      },
      "x5va6dz": {
        "ltldy42": {
          "from": "ltldy42",
          "to": "x5va6dz",
          "as": "fn"
        },
        "3kj1w1a": {
          "from": "3kj1w1a",
          "to": "x5va6dz",
          "as": "run"
        },
        "mue8w9r": {
          "from": "mue8w9r",
          "to": "x5va6dz",
          "as": "args"
        }
      },
      "mue8w9r": {
        "7jg7rr8": {
          "from": "7jg7rr8",
          "to": "mue8w9r",
          "as": "ref"
        }
      },
      "d2paurd": {
        "wvpeonf": {
          "from": "wvpeonf",
          "to": "d2paurd",
          "as": "_ref"
        }
      },
      "wvpeonf": {
        "1r14v3m": {
          "from": "1r14v3m",
          "to": "wvpeonf",
          "as": "args"
        },
        "o689p4w": {
          "from": "o689p4w",
          "to": "wvpeonf",
          "as": "value"
        }
      },
      "1r14v3m": {
        "0xlqgi2": {
          "from": "0xlqgi2",
          "to": "1r14v3m",
          "as": "current"
        }
      },
      "0xlqgi2": {
        "bi3dbrg": {
          "from": "bi3dbrg",
          "to": "0xlqgi2",
          "as": "graphid"
        }
      }
    }
  },
    "state": {
      "id": "state",
      "name": "state",
      "out": "out",
      "category": "data",
      "nodes": [
        {
          "id": "graphid_text",
          "ref": "arg",
          "value": "__graphid"
        },
        {
          "id": "graphid_atom",
          "ref": "arg",
          "value": "__graphid"
        },
        {
          "id": "set_state_val_graphid",
          "ref": "arg",
          "value": "__graphid"
        },
        {
          "id": "runnable_atom_graphid",
          "ref": "arg",
          "value": "__graphid"
        },
        {
          "id": "store_runnable_graphid",
          "ref": "arg",
          "value": "__graphid"
        },
        {
          "id": "path_text",
          "value": "state"
        },
        {
          "id": "path_atom",
          "value": "state"
        },
        {
          "id": "set_state_val_path",
          "value": "state"
        },
        {
          "id": "state_val_text",
          "ref": "script",
          "value": "return _lib.no.runtime.get_args(graphid)[path];"
        },
        {
          "id": "state_val_atom",
          "ref": "script",
          "value": "return _lib.no.runtime.get_args(graphid)[path];"
        },
        {
          "id": "value",
          "ref": "arg",
          "value": "value"
        },
        {
          "id": "set_state_val",
          "ref": "extern",
          "value": "extern.update_args",
          "_value": "value !== undefined && _lib.no.runtime.update_args(graphid, {[path]: value}); return value"
        },
        {
          "id": "set_state_val_runnable_args",
          "value": "{\"value\": \"undefined\"}"
        },
        {
          "id": "set_state_val_runnable",
          "ref": "runnable"
        },
        {"id": "store_runnable", "ref": "script", "value": "_lib.no.runtime.update_args(graphid, {_runnable: value}); return value"},
        {"id": "runnable_atom", "ref": "script", "value": "return _lib.no.runtime.get_args(graphid)._runnable"},
        {"id": "if_runnable", "ref": "default"},
        {
          "id": "display_text",
          "ref": "html_text"
        },
        {
          "id": "display",
          "ref": "html_element"
        },
        {
          "id": "out_atom"
        },
        {
          "id": "out",
          "ref": "return",
          "name": "state"
        }
      ],
      "edges": [
        {
          "from": "graphid_atom",
          "to": "state_val_atom",
          "as": "graphid"
        },
        {
          "from": "graphid_text",
          "to": "state_val_text",
          "as": "graphid"
        },
        {
          "from": "path_atom",
          "to": "state_val_atom",
          "as": "path"
        },
        {
          "from": "path_text",
          "to": "state_val_text",
          "as": "path"
        },
        {
          "from": "set_state_val_graphid",
          "to": "set_state_val",
          "as": "graphid"
        },
        {
          "from": "store_runnable_graphid",
          "to": "store_runnable",
          "as": "graphid"
        },
        {
          "from": "value",
          "to": "set_state_val",
          "as": "value"
        },
        {
          "from": "set_state_val_path",
          "to": "set_state_val",
          "as": "path"
        },
        {
          "from": "set_state_val_runnable_args",
          "to": "set_state_val_runnable",
          "as": "parameters"
        },
        {
          "from": "set_state_val",
          "to": "set_state_val_runnable",
          "as": "fn"
        },
        {
          "from": "runnable_atom",
          "to": "if_runnable",
          "as": "value"
        },
        {
          "from": "set_state_val_runnable",
          "to": "store_runnable",
          "as": "value"
        },
        {
          "from": "runnable_atom_graphid",
          "to": "runnable_atom",
          "as": "graphid"
        },
        {
          "from": "store_runnable",
          "to": "if_runnable",
          "as": "otherwise"
        },
        {
          "from": "if_runnable",
          "to": "out_atom",
          "as": "set"
        },
        {
          "from": "state_val_atom",
          "to": "out_atom",
          "as": "state"
        },
        {
          "from": "state_val_text",
          "to": "display_text",
          "as": "text"
        },
        {
          "from": "display_text",
          "to": "display",
          "as": "children"
        },
        {
          "from": "display",
          "to": "out",
          "as": "display"
        },
        {
          "from": "out_atom",
          "to": "out",
          "as": "value"
        }
      ]
    },
    "publish_event": {
      "id": "publish_event",
      "category": "events",
      "description": "Publishes a `name` (or this node's value) event with the data `value`.",
      "out": "out",
      "nodes": [
        {
          "id": "value",
          "ref": "arg",
          "value": "data"
        },
        {
          "id": "arg_name",
          "ref": "arg",
          "value": "name"
        },
        {
          "id": "graph_value",
          "ref": "arg",
          "value": "__graph_value"
        },
        {
          "id": "update_event",
          "ref": "arg",
          "value": "name"
        },
        {
          "id": "update_data",
          "ref": "arg",
          "value": "data"
        },
        {
          "id": "name",
          "ref": "default"
        },
        {
          "id": "update",
          "ref": "script",
          "value": "return _lib.no.runtime.publish(event_name, event_data)"
        },
        {
          "id": "ap_args"
        },
        {
          "id": "update_runnable",
          "ref": "runnable"
        },
        {
          "id": "out",
          "ref": "ap"
        }
      ],
      "edges": [
        {
          "from": "arg_name",
          "to": "name",
          "as": "value"
        },
        {
          "from": "graph_value",
          "to": "name",
          "as": "otherwise"
        },
        {
          "from": "name",
          "to": "update",
          "as": "event_name"
        },
        {
          "from": "value",
          "to": "ap_args",
          "as": "event_data"
        },
        {
          "from": "update_data",
          "to": "update",
          "as": "event_data"
        },
        {
          "from": "update",
          "to": "update_runnable",
          "as": "fn"
        },
        {
          "from": "update_runnable",
          "to": "out",
          "as": "fn"
        },
        {
          "from": "ap_args",
          "to": "out",
          "as": "args"
        }
      ]
    },
    "event_publisher_onchange": {
      "id": "event_publisher_onchange",
      "category": "events",
      "description": "Publishes a `name` (or this node's value) event with the data `value` when `value` changes.",
      "out": "out",
      "nodes": [
        {
          "id": "value",
          "ref": "arg",
          "value": "value"
        },
        {
          "id": "value_out",
          "ref": "arg",
          "value": "value"
        },
        {
          "id": "value_eq_a",
          "ref": "arg",
          "value": "a"
        },
        {
          "id": "value_eq_b",
          "ref": "arg",
          "value": "b"
        },
        {
          "id": "value_eq_fn",
          "ref": "script",
          "value": "return _lib.compare(a, b)"
        },
        {
          "id": "value_eq",
          "ref": "runnable"
        },
        {
          "id": "value_unchanged",
          "ref": "isunchanged"
        },
        {
          "id": "publisher",
          "ref": "event_publisher"
        },
        {
          "id": "out",
          "ref": "if"
        }
      ],
      "edges": [
        {
          "from": "value",
          "to": "value_eq",
          "as": "value"
        },
        {
          "from": "value_eq_a",
          "to": "value_eq_fn",
          "as": "a"
        },
        {
          "from": "value_eq_b",
          "to": "value_eq_fn",
          "as": "b"
        },
        {
          "from": "value_eq_fn",
          "to": "value_eq",
          "as": "fn"
        },
        {
          "from": "value_eq",
          "to": "value_unchanged",
          "as": "fn"
        },
        {
          "from": "value_unchanged",
          "to": "out",
          "as": "pred"
        },
        {
          "from": "publisher",
          "to": "out",
          "as": "false"
        },
        {
          "from": "value_out",
          "to": "out",
          "as": "true"
        }
      ]
    },
    "input_value": {
    "id": "input_value",
    "out": "out",
    "nodes": {
      "out": {
        "id": "out",
        "name": "input_value",
        "ref": "return"
      },
      "cfuymky": {
        "id": "cfuymky",
        "value": "{\"a\": 1, \"b\": {\"c\": 2, \"d\": 3}}"
      },
      "4d8qcss": {
        "id": "4d8qcss",
        "ref": "html_text"
      },
      "rpys4rr": {
        "id": "rpys4rr",
        "value": "value",
        "ref": "arg"
      },
      "1znvqbi": {
        "id": "1znvqbi",
        "value": "_stored.value",
        "ref": "arg"
      },
      "qwz3ftj": {
        "id": "qwz3ftj",
        "ref": "script",
        "value": "return typeof object !== 'object' || Array.isArray(object) || Object.getPrototypeOf(object) === Object.prototype ? JSON.stringify(object) : Object.getPrototypeOf(object) ? Object.getPrototypeOf(object).constructor.name : `${object}`"
      },
      "5a6pljw": {
        "id": "5a6pljw",
        "value": "pre",
        "ref": "html_element"
      },
      "17pcf8z": {
        "id": "17pcf8z",
        "value": "2"
      },
      "hm2lkjh": {
        "id": "hm2lkjh"
      },
      "9ukj84k": {
        "id": "9ukj84k",
        "ref": "refval"
      },
      "1c4vbjw": {
        "id": "1c4vbjw",
        "ref": "ap"
      },
      "dqau7vz": {
        "id": "dqau7vz",
        "value": "_stored.set",
        "ref": "arg"
      },
      "wo0j48j": {
        "id": "wo0j48j"
      },
      "rg59xbc": {
        "id": "rg59xbc",
        "value": "true"
      },
      "args": {
        "id": "args"
      }
    },
    "edges": {
      "5a6pljw": {
        "from": "5a6pljw",
        "to": "out",
        "as": "display"
      },
      "cfuymky": {
        "from": "cfuymky",
        "to": "args",
        "as": "value"
      },
      "4d8qcss": {
        "from": "4d8qcss",
        "to": "5a6pljw",
        "as": "children"
      },
      "1znvqbi": {
        "from": "1znvqbi",
        "to": "qwz3ftj",
        "as": "object"
      },
      "17pcf8z": {
        "from": "17pcf8z",
        "to": "qwz3ftj",
        "as": "spacer"
      },
      "qwz3ftj": {
        "from": "qwz3ftj",
        "to": "4d8qcss",
        "as": "text"
      },
      "rpys4rr": {
        "from": "rpys4rr",
        "to": "wo0j48j",
        "as": "value"
      },
      "hm2lkjh": {
        "from": "hm2lkjh",
        "to": "out",
        "as": "args"
      },
      "9ukj84k": {
        "from": "9ukj84k",
        "to": "hm2lkjh",
        "as": "_stored"
      },
      "1c4vbjw": {
        "from": "1c4vbjw",
        "to": "out",
        "as": "value"
      },
      "dqau7vz": {
        "from": "dqau7vz",
        "to": "1c4vbjw",
        "as": "fn"
      },
      "wo0j48j": {
        "from": "wo0j48j",
        "to": "1c4vbjw",
        "as": "args"
      },
      "rg59xbc": {
        "from": "rg59xbc",
        "to": "1c4vbjw",
        "as": "run"
      }
    },
    "edges_in": {
      "out": {
        "5a6pljw": {
          "from": "5a6pljw",
          "to": "out",
          "as": "display"
        },
        "hm2lkjh": {
          "from": "hm2lkjh",
          "to": "out",
          "as": "args"
        },
        "1c4vbjw": {
          "from": "1c4vbjw",
          "to": "out",
          "as": "value"
        }
      },
      "args": {
        "cfuymky": {
          "from": "cfuymky",
          "to": "args",
          "as": "value"
        }
      },
      "5a6pljw": {
        "4d8qcss": {
          "from": "4d8qcss",
          "to": "5a6pljw",
          "as": "children"
        }
      },
      "qwz3ftj": {
        "1znvqbi": {
          "from": "1znvqbi",
          "to": "qwz3ftj",
          "as": "object"
        },
        "17pcf8z": {
          "from": "17pcf8z",
          "to": "qwz3ftj",
          "as": "spacer"
        }
      },
      "4d8qcss": {
        "qwz3ftj": {
          "from": "qwz3ftj",
          "to": "4d8qcss",
          "as": "text"
        }
      },
      "wo0j48j": {
        "rpys4rr": {
          "from": "rpys4rr",
          "to": "wo0j48j",
          "as": "value"
        }
      },
      "hm2lkjh": {
        "9ukj84k": {
          "from": "9ukj84k",
          "to": "hm2lkjh",
          "as": "_stored"
        }
      },
      "1c4vbjw": {
        "dqau7vz": {
          "from": "dqau7vz",
          "to": "1c4vbjw",
          "as": "fn"
        },
        "wo0j48j": {
          "from": "wo0j48j",
          "to": "1c4vbjw",
          "as": "args"
        },
        "rg59xbc": {
          "from": "rg59xbc",
          "to": "1c4vbjw",
          "as": "run"
        }
      }
    }
  },
    "event_subscriber": {
      "id": "event_subscriber",
      "category": "events",
      "description": "Returns the last value of the `name` (or this node's value) event.",
      "out": "out",
      "nodes": [
        {
          "id": "name",
          "ref": "arg",
          "value": "name"
        },
        {
          "id": "onevent",
          "ref": "arg",
          "value": "onevent",
          "type": "local"
        },
        {
          "id": "data",
          "ref": "arg",
          "value": "_data: internal",
          "type": "internal"
        },
        {
          "id": "data_listener",
          "ref": "arg",
          "value": "_data: internal",
        },
        {
          "id": "data_log",
          "ref": "log"
        },
        {
          "id": "add_listener",
          "ref": "script",
          "value": "_lib.no.runtime.add_listener(event ?? __graph_value, 'evt-listener-' + _graph.id, (data) => { let update = true; if(onevent){ update = _lib.no.run(onevent.graph, onevent.fn, {...onevent.args, data, prev}); } if(update){ _lib.no.runtime.update_args(_graph, {_data: data.data}) } }, false); return _lib.no.runtime.get_args(_graph)['_data'];"
        },
        {
          "id": "out",
          "ref": "default"
        }
      ],
      "edges": [
        {
          "from": "name",
          "to": "add_listener",
          "as": "event"
        },
        {
          "from": "onevent",
          "to": "add_listener",
          "as": "onevent"
        },
        {
          "from": "data_listener",
          "to": "add_listener",
          "as": "prev"
        },
        {
          "from": "add_listener",
          "to": "out",
          "as": "otherwise"
        },
        {
          "from": "data",
          "to": "out",
          "as": "value"
        }
      ]
    },
    "events_broadcast_channel": {
      "id": "events_broadcast_channel",
      "category": "events",
      "description": "Runs `runnable` when a message is received from the events <a target='_blank' href='https://developer.mozilla.org/en-US/docs/Web/API/BroadcastChannel'>broadcast channel</a>. Can be used to communicate between tabs or worker processes.",
      "out": "out",
      "nodes": [
        {
          "id": "arg_onmessage",
          "ref": "arg",
          "value": "onmessage"
        },
        {
          "id": "message_data",
          "ref": "arg",
          "value": "message.data.data"
        },
        {
          "id": "message_name",
          "ref": "arg",
          "value": "message.data.name"
        },
        {
          "id": "publish_event",
          "ref": "event_publisher"
        },
        {
          "id": "publish_event_runnable",
          "ref": "runnable"
        },
        {
          "id": "onmessageseq",
          "ref": "sequence"
        },
        {
          "id": "setup_bc",
          "ref": "script",
          "value": "const bc = new BroadcastChannel('events'); bc.onmessage = e => { _lib.no.run(onmessage.graph, onmessage.fn, {message: e}, _lib); }; return bc;"
        },
        {
          "id": "out",
          "ref": "return",
          "name": "events_broadcast_channel"
        }
      ],
      "edges": [
        {
          "from": "message_data",
          "to": "publish_event",
          "as": "value"
        },
        {
          "from": "message_name",
          "to": "publish_event",
          "as": "name"
        },
        {
          "from": "publish_event",
          "to": "publish_event_runnable",
          "as": "fn"
        },
        {
          "from": "publish_event_runnable",
          "to": "onmessageseq",
          "as": "arg0"
        },
        {
          "from": "arg_onmessage",
          "to": "onmessageseq",
          "as": "arg1"
        },
        {
          "from": "onmessageseq",
          "to": "setup_bc",
          "as": "onmessage"
        },
        {
          "from": "setup_bc",
          "to": "out",
          "as": "value"
        }
      ]
    },
    "reduce": {
      "id": "reduce",
      "category": "data",
      "description": "<a target='_blank' href='https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/reduce'>Aray.reduce</a> the `array` with `fn`. Arguments for `fn` are `previous`, `current`, `index`, `array`, and a unique per nested loop `key`.",
      "name": "reduce",
      "in": "m3b5wg3",
      "out": "tgurdpo",
      "nodes": [
        {
          "id": "tgurdpo",
          "ref": "call",
          "name": "out"
        },
        {
          "id": "key",
          "ref": "arg",
          "value": "key"
        },
        {
          "id": "rielyq8",
          "value": "reduce",
          "name": "rielyq8"
        },
        {
          "ref": "arg",
          "id": "1rre4bx",
          "value": "array",
          "name": "1rre4bx"
        },
        {
          "ref": "arg",
          "id": "6g75abk",
          "value": "fn",
          "name": "6g75abk"
        },
        {
          "id": "w0zzawl",
          "ref": "array",
          "name": "w0zzawl"
        },
        {
          "id": "args",
          "ref": "arg",
          "value": "args",
          "type": "local"
        },
        {
          "id": "initial",
          "ref": "arg",
          "value": "initial"
        },
        {
          "id": "pdljod1",
          "name": "pdljod1",
          "ref": "script",
          "value": "return (previous, current, index, array) => _lib.no.run(fn?.graph ?? _graph, fn?.fn ?? fn, Object.assign({}, args ?? {}, fn.args ?? {}, {previous, current, index, array, key: outer_key ? `${index}_${outer_key}` : `${index}`}), _lib);"
        },
        {
          "id": "2lvs5dj",
          "ref": "script",
          "value": "return _graph",
          "name": "2lvs5dj"
        }
      ],
      "edges": [
        {
          "from": "rielyq8",
          "to": "tgurdpo",
          "as": "fn"
        },
        {
          "from": "1rre4bx",
          "to": "tgurdpo",
          "as": "self"
        },
        {
          "from": "w0zzawl",
          "to": "tgurdpo",
          "as": "args",
          "type": "resolve"
        },
        {
          "from": "pdljod1",
          "to": "w0zzawl",
          "as": "a0"
        },
        {
          "from": "initial",
          "to": "w0zzawl",
          "as": "a1"
        },
        {
          "from": "2lvs5dj",
          "to": "pdljod1",
          "as": "graph"
        },
        {
          "from": "key",
          "to": "pdljod1",
          "as": "outer_key"
        },
        {
          "from": "args",
          "to": "pdljod1",
          "as": "args"
        },
        {
          "from": "6g75abk",
          "to": "pdljod1",
          "as": "fn"
        }
      ]
    },
    "map": {
      "id": "map",
      "out": "out",
      "category": "data",
      "description": "<a target='_blank' href='https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/map'>Aray.map</a> the `array` with `fn`. Arguments for `fn` are `element`, `index`, `array`, and a unique per nested loop `key`.",
      "nodes": [
        {
          "id": "object",
          "ref": "arg",
          "value": "array"
        },
        {
          "id": "map_fn",
          "ref": "arg",
          "value": "fn"
        },
        {
          "id": "map_fn_args"
        },
        {
          "id": "run_map",
          "value": "true"
        },
        {
          "id": "map_element_fn",
          "ref": "extern",
          "value": "extern.ap"
        },
        {
          "id": "currentValue",
          "ref": "arg",
          "value": "currentValue"
        },
        {
          "id": "previousValue",
          "ref": "arg",
          "value": "previousValue"
        },
        {
          "id": "previousValue_map_fn",
          "ref": "arg",
          "value": "previousValue"
        },
        {
          "id": "append",
          "ref": "script",
          "value": "arr.push(value); return arr;"
        },
        {
          "id": "append_runnable_currentValue"
        },
        {
          "id": "append_runnable_previousValue"
        },
        {
          "id": "append_runnable_args"
        },
        {
          "id": "append_runnable",
          "ref": "runnable"
        },
        {
          "id": "initial",
          "value": "[]"
        },
        {
          "id": "fold",
          "ref": "extern",
          "value": "extern.fold"
        },
        {
          "id": "out",
          "ref": "return"
        }
      ],
      "edges": [
        {
          "from": "currentValue",
          "to": "map_fn_args",
          "as": "element"
        },
        {
          "from": "previousValue_map_fn",
          "to": "map_fn_args",
          "as": "array"
        },
        {
          "from": "map_fn_args",
          "to": "map_element_fn",
          "as": "args"
        },
        {
          "from": "map_fn",
          "to": "map_element_fn",
          "as": "fn"
        },
        {
          "from": "run_map",
          "to": "map_element_fn",
          "as": "run"
        },
        {
          "from": "map_element_fn",
          "to": "append",
          "as": "value"
        },
        {
          "from": "previousValue",
          "to": "append",
          "as": "arr"
        },
        {
          "from": "append_runnable_previousValue",
          "to": "append_runnable_args",
          "as": "previousValue"
        },
        {
          "from": "append_runnable_currentValue",
          "to": "append_runnable_args",
          "as": "currentValue"
        },
        {
          "from": "append_runnable_args",
          "to": "append_runnable",
          "as": "parameters"
        },
        {
          "from": "append",
          "to": "append_runnable",
          "as": "fn"
        },
        {
          "from": "append_runnable",
          "to": "fold",
          "as": "fn"
        },
        {
          "from": "object",
          "to": "fold",
          "as": "object"
        },
        {
          "from": "initial",
          "to": "fold",
          "as": "initial"
        },
        {
          "from": "fold",
          "to": "out",
          "as": "value"
        }
      ]
    },
    "filter": {
      "id": "filter",
      "category": "data",
      "description": "<a target='_blank' href='https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/filter'>Aray.filter</a> the `array` with `fn`. Arguments for `fn` are `element`, `index`, `array`, and a unique per nested loop `key`.",
      "out": "out",
      "nodes": [
        {
          "id": "object",
          "ref": "arg",
          "value": "array"
        },
        {
          "id": "pred_fn",
          "ref": "arg",
          "value": "fn"
        },
        {
          "id": "el_currentValue",
          "ref": "arg",
          "value": "currentValue"
        },
        {
          "id": "pred_fn_args"
        },
        {
          "id": "run_pred",
          "value": "true"
        },
        {
          "id": "pred_element_fn",
          "ref": "extern",
          "value": "extern.ap"
        },
        {
          "id": "currentValue",
          "ref": "arg",
          "value": "currentValue"
        },
        {
          "id": "previousValue",
          "ref": "arg",
          "value": "previousValue"
        },
        {
          "id": "pred_append",
          "ref": "script",
          "value": "if(pred !== false && pred !== undefined && pred !== null){ arr.push(value); } return arr;"
        },
        {
          "id": "pred_append_fn_args",
          "value": "{\"previousValue\": \"undefined\", \"currentValue\": \"undefined\"}"
        },
        {
          "id": "pred_append_fn",
          "ref": "runnable"
        },
        {
          "id": "initial",
          "value": "[]"
        },
        {
          "id": "fold",
          "ref": "extern",
          "value": "extern.fold"
        },
        {
          "id": "out",
          "ref": "return"
        }
      ],
      "edges": [
        {
          "from": "el_currentValue",
          "to": "pred_fn_args",
          "as": "element"
        },
        {
          "from": "pred_fn_args",
          "to": "pred_element_fn",
          "as": "args"
        },
        {
          "from": "pred_fn",
          "to": "pred_element_fn",
          "as": "fn"
        },
        {
          "from": "run_pred",
          "to": "pred_element_fn",
          "as": "run"
        },
        {
          "from": "currentValue",
          "to": "pred_append",
          "as": "value"
        },
        {
          "from": "previousValue",
          "to": "pred_append",
          "as": "arr"
        },
        {
          "from": "pred_element_fn",
          "to": "pred_append",
          "as": "pred"
        },
        {
          "from": "pred_append",
          "to": "pred_append_fn",
          "as": "fn"
        },
        {
          "from": "pred_append_fn_args",
          "to": "pred_append_fn",
          "as": "parameters"
        },
        {
          "from": "pred_append_fn",
          "to": "fold",
          "as": "fn"
        },
        {
          "from": "object",
          "to": "fold",
          "as": "object"
        },
        {
          "from": "initial",
          "to": "fold",
          "as": "initial"
        },
        {
          "from": "fold",
          "to": "out",
          "as": "value"
        }
      ]
    },
    "sequence": {
      "id": "sequence",
      "description": "Create a new runnable that runs the input runnables in sequence.",
      "name": "sequence",
      "category": "flow",
      "__out": "out",
      "_ref": "extern",
      "_value": "extern.sequence",
      "nodes": [
        {
          "id": "args",
          "ref": "arg",
          "value": "_args"
        },
        {
          "id": "fn",
          "ref": "script",
          "value": "console.log(args); return Object.values(args)"
        },
        {
          "id": "out",
          "ref": "ap"
        }
      ],
      "edges": [
        {
          "from": "args",
          "to": "fn",
          "as": "args"
        },
        {
          "from": "fn",
          "to": "out",
          "as": "fn"
        }
      ],
      "_nodes": [
        {
          "id": "args",
          "ref": "arg",
          "value": "__args"
        },
        {
          "id": "runnables",
          "ref": "arg",
          "value": "runnables"
        },
        {
          "id": "seq_ap_args",
          "ref": "arg",
          "value": "_args"
        },
        {
          "id": "seq_ap_par_args",
          "ref": "arg",
          "value": "__args.__args"
        },
        {
          "id": "delete_seq_ap_args",
          "ref": "script",
          "value": "const newargs = {...args, runnables, _seq_keys: Object.keys(args)}; return newargs"
        },
        {
          "id": "new_seq_ap_args",
          "ref": "script",
          "value": "return args"
        },
        {
          "id": "delete_args",
          "ref": "script",
          "value": "const ret = {...target}; delete ret.args; return ret;"
        },
        {
          "id": "seq_fold_currentValue",
          "ref": "arg",
          "value": "currentValue.1"
        },
        {
          "id": "seq_ap_run",
          "value": "true"
        },
        {
          "id": "seq_ap",
          "ref": "ap"
        },
        {
          "id": "seq_ap_runnable",
          "ref": "runnable"
        },
        {
          "id": "seq_fold",
          "ref": "fold"
        },
        {
          "id": "out_runnable",
          "ref": "runnable"
        },
        {
          "id": "out",
          "ref": "ap"
        }
      ],
      "_edges": [
        {
          "from": "args",
          "to": "delete_args",
          "as": "target"
        },
        {
          "from": "args",
          "to": "_seq_fold",
          "as": "object"
        },
        {
          "from": "seq_ap_args",
          "to": "new_seq_ap_args",
          "as": "args"
        },
        {
          "from": "delete_args",
          "to": "_seq_fold",
          "as": "object"
        },
        {
          "from": "runnables",
          "to": "seq_fold",
          "as": "object"
        },
        {
          "from": "seq_ap_run",
          "to": "seq_ap",
          "as": "run"
        },
        {
          "from": "seq_fold_currentValue",
          "to": "seq_ap",
          "as": "fn"
        },
        {
          "from": "seq_ap",
          "to": "seq_ap_runnable",
          "as": "fn"
        },
        {
          "from": "delete_args",
          "to": "delete_seq_ap_args",
          "as": "target"
        },
        {
          "from": "seq_ap_args",
          "to": "delete_seq_ap_args",
          "as": "args"
        },
        {
          "from": "seq_ap_par_args",
          "to": "delete_seq_ap_args",
          "as": "parargs"
        },
        {
          "from": "new_seq_ap_args",
          "to": "_seq_ap",
          "as": "args"
        },
        {
          "from": "seq_ap_runnable",
          "to": "seq_fold",
          "as": "fn"
        },
        {
          "from": "seq_fold",
          "to": "out_runnable",
          "as": "fn"
        },
        {
          "from": "delete_seq_ap_args",
          "to": "out",
          "as": "args"
        },
        {
          "from": "runnables",
          "to": "delete_seq_ap_args",
          "as": "runnables"
        },
        {
          "from": "out_runnable",
          "to": "out",
          "as": "fn"
        }
      ]
    },
    "import_json": {
      "id": "import_json",
      "description": "Imports the node or nodes found at the `url`.",
      "name": "import_json",
      "category": "nodysseus",
      "out": "out",
      "nodes": [
        {
          "id": "lapeojg",
          "ref": "script",
          "value": "import_graph.forEach(_lib.no.runtime.add_ref); _lib.no.runtime.change_graph(_lib.no.runtime.get_graph(graphid))",
          "name": "out"
        },
        {
          "id": "out",
          "ref": "return"
        },
        {
          "id": "3zfjt1h",
          "ref": "call"
        },
        {
          "id": "05eag47",
          "ref": "arg",
          "value": "name"
        },
        {
          "id": "graphid",
          "ref": "arg",
          "value": "__graphid"
        },
        {
          "id": "2vtokcl",
          "ref": "script",
          "value": "return fetch(url);"
        },
        {
          "id": "i9x02is",
          "value": "json"
        },
        {
          "id": "irr99xz",
          "ref": "arg",
          "value": "url"
        }
      ],
      "edges": [
        {
          "as": "import_graph",
          "from": "3zfjt1h",
          "to": "lapeojg"
        },
        {
          "from": "graphid",
          "to": "lapeojg",
          "as": "graphid"
        },
        {
          "from": "05eag47",
          "to": "lapeojg",
          "as": "name"
        },
        {
          "from": "lapeojg",
          "to": "out",
          "as": "value"
        },
        {
          "as": "self",
          "from": "2vtokcl",
          "to": "3zfjt1h"
        },
        {
          "from": "i9x02is",
          "to": "3zfjt1h",
          "as": "fn"
        },
        {
          "from": "irr99xz",
          "to": "2vtokcl",
          "as": "url"
        }
      ]
    },
    "object_entries": {
      "id": "object_entries",
      "category": "data",
      "description": "Calls <a target='_blank' href='https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/entries'>Object.entries</a> on `object`.",
      "name": "object_entries",
      "in": "tkd4tqn",
      "out": "j8c79uf",
      "nodes": [
        {
          "name": "out",
          "id": "j8c79uf",
          "ref": "filter"
        },
        {
          "id": "hfexsuu",
          "ref": "script",
          "value": "return !key?.startsWith('_');"
        },
        {
          "id": "runnable_args",
          "value": "{\"element\": \"undefined\"}"
        },
        {
          "id": "runnable",
          "ref": "runnable"
        },
        {
          "id": "bgi2g37",
          "ref": "script",
          "value": "return obj instanceof Map ? [...obj.entries()] : Object.entries(obj)"
        },
        {
          "id": "7gqcw0o",
          "ref": "arg",
          "value": "0.0"
        },
        {
          "id": "kpakw50",
          "ref": "arg",
          "value": "object"
        }
      ],
      "edges": [
        {
          "from": "runnable_args",
          "to": "runnable",
          "as": "parameters"
        },
        {
          "from": "hfexsuu",
          "to": "runnable",
          "as": "fn"
        },
        {
          "from": "runnable",
          "to": "j8c79uf",
          "as": "fn"
        },
        {
          "from": "bgi2g37",
          "to": "j8c79uf",
          "as": "array"
        },
        {
          "from": "7gqcw0o",
          "to": "hfexsuu",
          "as": "key"
        },
        {
          "from": "kpakw50",
          "to": "bgi2g37",
          "as": "obj"
        }
      ]
    },
    "css_styles": {
      "id": "css_styles",
      "category": "html",
      "description": "Creates a style element from `css_object`. Inputs to the object should be labeled with css selectors, and inputs to those objects with css properties.",
      "name": "css_styles",
      "in": "xw3pmx7",
      "out": "out",
      "nodes": [
        {
          "id": "out",
          "ref": "return",
          "name": "css_styles"
        },
        {
          "id": "5yxmxua",
          "ref": "html_element",
          "name": "out"
        },
        {
          "id": "vgv61zj",
          "ref": "html_text"
        },
        {
          "id": "jstjx7g"
        },
        {
          "id": "h40e3j9",
          "value": "style"
        },
        {
          "id": "xw3pmx7",
          "name": "in"
        },
        {
          "id": "jlgp7uy",
          "ref": "call",
          "name": "named_obj/out"
        },
        {
          "id": "o1j78dd",
          "value": "result-view"
        },
        {
          "id": "ij4z84e",
          "ref": "map"
        },
        {
          "id": "q3pwj9j",
          "value": "join"
        },
        {
          "id": "d6h3gdw",
          "ref": "array"
        },
        {
          "id": "j8c79uf",
          "name": "object_entries",
          "ref": "object_entries"
        },
        {
          "id": "n9g4wyq",
          "ref": "runnable"
        },
        {
          "id": "z63iaay",
          "ref": "script",
          "value": "return \"\\n\";"
        },
        {
          "id": "vwsgweb",
          "ref": "default"
        },
        {
          "id": "aelf1a7",
          "ref": "script",
          "value": "return key + '{' + value + '}'",
          "name": "out"
        },
        {
          "id": "mkwx4yx"
        },
        {
          "id": "fzr4mkv",
          "ref": "arg",
          "value": "css_object"
        },
        {
          "id": "5eqf77t",
          "value": "element.0",
          "ref": "arg"
        },
        {
          "id": "5pwetw5",
          "ref": "if"
        },
        {
          "id": "o5ojdyc",
          "ref": "script",
          "value": "return key.startsWith(\"@keyframes\")"
        },
        {
          "id": "1hpnid4",
          "ref": "call"
        },
        {
          "id": "slj7ynn/jlgp7uy",
          "ref": "call",
          "name": "named_obj/out"
        },
        {
          "id": "ft1oksl",
          "ref": "arg",
          "value": "element.0"
        },
        {
          "id": "bbbp82v",
          "ref": "map"
        },
        {
          "id": "cp66ig5",
          "value": "join"
        },
        {
          "id": "uwq9u81",
          "ref": "array"
        },
        {
          "id": "slj7ynn/ij4z84e",
          "ref": "map"
        },
        {
          "id": "slj7ynn/q3pwj9j",
          "value": "join"
        },
        {
          "id": "slj7ynn/d6h3gdw",
          "ref": "array"
        },
        {
          "id": "i1ifamx",
          "ref": "object_entries"
        },
        {
          "id": "druspar_args",
          "value": "{\"element\": \"\"}"
        },
        {
          "id": "n9g4wyq_args",
          "value": "{\"element\": \"\"}"
        },
        {
          "id": "slj7ynn/n9g4wyq_args",
          "value": "{\"element\": \"\"}"
        },
        {
          "id": "slj7ynn/druspar_args",
          "value": "{\"element\": \"\"}"
        },
        {
          "id": "druspar",
          "ref": "runnable"
        },
        {
          "id": "gth1wc2",
          "ref": "script",
          "value": "return \"\\n\";"
        },
        {
          "id": "slj7ynn/j8c79uf",
          "name": "object_entries",
          "ref": "object_entries"
        },
        {
          "id": "slj7ynn/n9g4wyq",
          "ref": "runnable"
        },
        {
          "id": "slj7ynn/z63iaay",
          "ref": "script",
          "value": "return \"\\n\";"
        },
        {
          "id": "y25dg2n",
          "value": "element.1",
          "ref": "arg"
        },
        {
          "id": "0d4yh8u",
          "ref": "script",
          "value": "return key + ': ' + value + \";\";"
        },
        {
          "id": "slj7ynn/vwsgweb",
          "ref": "default"
        },
        {
          "id": "slj7ynn/aelf1a7",
          "ref": "script",
          "value": "return key + '{' + value + '}'",
          "name": "out"
        },
        {
          "id": "h13a9fd",
          "ref": "arg",
          "value": "element.0"
        },
        {
          "id": "h7me3v8",
          "ref": "arg",
          "value": "element.1"
        },
        {
          "id": "slj7ynn/mkwx4yx"
        },
        {
          "id": "slj7ynn/fzr4mkv",
          "ref": "arg",
          "value": "element.1"
        },
        {
          "id": "slj7ynn/5eqf77t",
          "value": "element.0",
          "ref": "arg"
        },
        {
          "id": "slj7ynn/1hpnid4",
          "ref": "call"
        },
        {
          "id": "slj7ynn/bbbp82v",
          "ref": "map"
        },
        {
          "id": "slj7ynn/cp66ig5",
          "value": "join"
        },
        {
          "id": "slj7ynn/uwq9u81",
          "ref": "array"
        },
        {
          "id": "slj7ynn/i1ifamx",
          "ref": "object_entries"
        },
        {
          "id": "slj7ynn/druspar",
          "ref": "runnable"
        },
        {
          "id": "slj7ynn/gth1wc2",
          "ref": "script",
          "value": "return \"\\n\";"
        },
        {
          "id": "slj7ynn/y25dg2n",
          "value": "element.1",
          "ref": "arg"
        },
        {
          "id": "slj7ynn/0d4yh8u",
          "ref": "script",
          "value": "return key + ': ' + value + \";\";"
        },
        {
          "id": "slj7ynn/h13a9fd",
          "ref": "arg",
          "value": "element.0"
        },
        {
          "id": "slj7ynn/h7me3v8",
          "ref": "arg",
          "value": "element.1"
        }
      ],
      "edges": [
        {
          "from": "5yxmxua",
          "to": "out",
          "as": "value"
        },
        {
          "from": "vgv61zj",
          "to": "5yxmxua",
          "as": "children"
        },
        {
          "from": "jstjx7g",
          "to": "5yxmxua",
          "as": "props"
        },
        {
          "from": "h40e3j9",
          "to": "5yxmxua",
          "as": "dom_type"
        },
        {
          "from": "xw3pmx7",
          "to": "5yxmxua",
          "as": "arg3"
        },
        {
          "from": "jlgp7uy",
          "to": "vgv61zj",
          "as": "text"
        },
        {
          "from": "o1j78dd",
          "to": "jstjx7g",
          "as": "key"
        },
        {
          "from": "ij4z84e",
          "to": "jlgp7uy",
          "as": "self"
        },
        {
          "from": "q3pwj9j",
          "to": "jlgp7uy",
          "as": "fn"
        },
        {
          "from": "d6h3gdw",
          "to": "jlgp7uy",
          "as": "args"
        },
        {
          "from": "j8c79uf",
          "to": "ij4z84e",
          "as": "array"
        },
        {
          "as": "fn",
          "from": "n9g4wyq",
          "to": "ij4z84e"
        },
        {
          "from": "z63iaay",
          "to": "d6h3gdw",
          "as": "arg0"
        },
        {
          "from": "vwsgweb",
          "to": "j8c79uf",
          "as": "object"
        },
        {
          "as": "fn",
          "from": "aelf1a7",
          "to": "n9g4wyq"
        },
        {
          "from": "mkwx4yx",
          "to": "vwsgweb",
          "as": "otherwise"
        },
        {
          "from": "fzr4mkv",
          "to": "vwsgweb",
          "as": "value"
        },
        {
          "from": "5eqf77t",
          "to": "aelf1a7",
          "as": "key"
        },
        {
          "from": "5pwetw5",
          "to": "aelf1a7",
          "as": "value"
        },
        {
          "from": "o5ojdyc",
          "to": "5pwetw5",
          "as": "pred"
        },
        {
          "as": "false",
          "from": "1hpnid4",
          "to": "5pwetw5"
        },
        {
          "from": "slj7ynn/jlgp7uy",
          "to": "5pwetw5",
          "as": "true"
        },
        {
          "as": "key",
          "from": "ft1oksl",
          "to": "o5ojdyc"
        },
        {
          "from": "bbbp82v",
          "to": "1hpnid4",
          "as": "self"
        },
        {
          "from": "cp66ig5",
          "to": "1hpnid4",
          "as": "fn"
        },
        {
          "from": "uwq9u81",
          "to": "1hpnid4",
          "as": "args"
        },
        {
          "from": "slj7ynn/ij4z84e",
          "to": "slj7ynn/jlgp7uy",
          "as": "self"
        },
        {
          "from": "slj7ynn/q3pwj9j",
          "to": "slj7ynn/jlgp7uy",
          "as": "fn"
        },
        {
          "from": "slj7ynn/d6h3gdw",
          "to": "slj7ynn/jlgp7uy",
          "as": "args"
        },
        {
          "from": "i1ifamx",
          "to": "bbbp82v",
          "as": "array"
        },
        {
          "from": "slj7ynn/druspar_args",
          "as": "parameters",
          "to": "slj7ynn/druspar"
        },
        {
          "from": "slj7ynn/n9g4wyq_args",
          "as": "parameters",
          "to": "slj7ynn/n9g4wyq"
        },
        {
          "from": "n9g4wyq_args",
          "as": "parameters",
          "to": "n9g4wyq"
        },
        {
          "from": "druspar_args",
          "as": "parameters",
          "to": "druspar"
        },
        {
          "as": "fn",
          "from": "druspar",
          "to": "bbbp82v"
        },
        {
          "from": "gth1wc2",
          "to": "uwq9u81",
          "as": "arg0"
        },
        {
          "from": "slj7ynn/j8c79uf",
          "to": "slj7ynn/ij4z84e",
          "as": "array"
        },
        {
          "as": "fn",
          "from": "slj7ynn/n9g4wyq",
          "to": "slj7ynn/ij4z84e"
        },
        {
          "from": "slj7ynn/z63iaay",
          "to": "slj7ynn/d6h3gdw",
          "as": "arg0"
        },
        {
          "from": "y25dg2n",
          "to": "i1ifamx",
          "as": "object"
        },
        {
          "as": "fn",
          "from": "0d4yh8u",
          "to": "druspar"
        },
        {
          "from": "slj7ynn/vwsgweb",
          "to": "slj7ynn/j8c79uf",
          "as": "object"
        },
        {
          "as": "fn",
          "from": "slj7ynn/aelf1a7",
          "to": "slj7ynn/n9g4wyq"
        },
        {
          "from": "h13a9fd",
          "to": "0d4yh8u",
          "as": "key"
        },
        {
          "from": "h7me3v8",
          "to": "0d4yh8u",
          "as": "value"
        },
        {
          "from": "slj7ynn/mkwx4yx",
          "to": "slj7ynn/vwsgweb",
          "as": "otherwise"
        },
        {
          "from": "slj7ynn/fzr4mkv",
          "to": "slj7ynn/vwsgweb",
          "as": "value"
        },
        {
          "from": "slj7ynn/5eqf77t",
          "to": "slj7ynn/aelf1a7",
          "as": "key"
        },
        {
          "as": "value",
          "from": "slj7ynn/1hpnid4",
          "to": "slj7ynn/aelf1a7"
        },
        {
          "from": "slj7ynn/bbbp82v",
          "to": "slj7ynn/1hpnid4",
          "as": "self"
        },
        {
          "from": "slj7ynn/cp66ig5",
          "to": "slj7ynn/1hpnid4",
          "as": "fn"
        },
        {
          "from": "slj7ynn/uwq9u81",
          "to": "slj7ynn/1hpnid4",
          "as": "args"
        },
        {
          "from": "slj7ynn/i1ifamx",
          "to": "slj7ynn/bbbp82v",
          "as": "array"
        },
        {
          "as": "fn",
          "from": "slj7ynn/druspar",
          "to": "slj7ynn/bbbp82v"
        },
        {
          "from": "slj7ynn/gth1wc2",
          "to": "slj7ynn/uwq9u81",
          "as": "arg0"
        },
        {
          "from": "slj7ynn/y25dg2n",
          "to": "slj7ynn/i1ifamx",
          "as": "object"
        },
        {
          "as": "fn",
          "from": "slj7ynn/0d4yh8u",
          "to": "slj7ynn/druspar"
        },
        {
          "from": "slj7ynn/h13a9fd",
          "to": "slj7ynn/0d4yh8u",
          "as": "key"
        },
        {
          "from": "slj7ynn/h7me3v8",
          "to": "slj7ynn/0d4yh8u",
          "as": "value"
        }
      ]
    },
    "css_anim": {
      "id": "css_anim",
      "category": "html",
      "description": "Creates a css animation string. For use with `css_styles`.",
      "name": "css_anim",
      "in": "cawqofn",
      "out": "spy9h48",
      "nodes": [
        {
          "name": "out",
          "id": "spy9h48",
          "ref": "script",
          "value": "return Object.fromEntries((Array.isArray(arr[0]) ? arr[0] : arr).map((v, i, a) => [Math.floor((i / a.length)*100) + \"%\", v]))"
        },
        {
          "id": "cawqofn",
          "ref": "array",
          "name": "in"
        }
      ],
      "edges": [
        {
          "as": "arr",
          "from": "cawqofn",
          "to": "spy9h48",
          "type": "resolve"
        }
      ]
    },
    "input": {
      "category": "html",
      "edges": [
        {
          "from": "gvkhkfw",
          "to": "nn4twx9",
          "as": "children"
        },
        {
          "from": "7rhq0q5",
          "to": "nn4twx9",
          "as": "_"
        },
        {
          "from": "4972gx3",
          "to": "gvkhkfw",
          "as": "arg1"
        },
        {
          "from": "1ldhfah",
          "to": "gvkhkfw",
          "as": "arg0"
        },
        {
          "from": "ee5i5r2",
          "to": "4972gx3",
          "as": "dom_type"
        },
        {
          "from": "ro8n2gc",
          "to": "4972gx3",
          "as": "props"
        },
        {
          "from": "wet0jdv",
          "to": "1ldhfah",
          "as": "children"
        },
        {
          "from": "gcuxiw9",
          "to": "1ldhfah",
          "as": "props"
        },
        {
          "from": "875c1wk",
          "to": "1ldhfah",
          "as": "dom_type"
        },
        {
          "from": "t6q6rvf",
          "to": "ro8n2gc",
          "as": "arg0"
        },
        {
          "from": "rjwtb3c",
          "to": "ro8n2gc",
          "as": "props"
        },
        {
          "from": "utkc9o6",
          "to": "wet0jdv",
          "as": "arg0"
        },
        {
          "from": "jxl9r29",
          "to": "gcuxiw9",
          "as": "for"
        },
        {
          "from": "2zxw9oo",
          "to": "t6q6rvf",
          "as": "onkeydown"
        },
        {
          "from": "i7y9dyy",
          "to": "t6q6rvf",
          "as": "onchange"
        },
        {
          "from": "vks4vul",
          "to": "rjwtb3c",
          "as": "value"
        },
        {
          "from": "ddfgy2s",
          "to": "rjwtb3c",
          "as": "otherwise"
        },
        {
          "from": "trd8ptp",
          "to": "utkc9o6",
          "as": "text"
        },
        {
          "from": "zfrrk0z",
          "to": "jxl9r29",
          "as": "value"
        },
        {
          "to": "2zxw9oo",
          "from": "qseh2tb",
          "as": "fn",
          "type": "ref"
        },
        {
          "from": "b0j8nyq",
          "to": "i7y9dyy",
          "as": "dispatch"
        },
        {
          "from": "eotod0l",
          "to": "i7y9dyy",
          "as": "seq"
        },
        {
          "from": "qxwvdfe",
          "to": "i7y9dyy",
          "as": "value"
        },
        {
          "from": "0dnqo5l",
          "to": "i7y9dyy",
          "as": "onchange_fn"
        },
        {
          "from": "1wps21n",
          "to": "qseh2tb",
          "as": "a1"
        },
        {
          "from": "y5q7mbn",
          "to": "qseh2tb",
          "as": "a0"
        },
        {
          "from": "qjc0zt6",
          "to": "eotod0l",
          "as": "arg"
        },
        {
          "from": "widk6u6",
          "to": "qjc0zt6",
          "as": "fn"
        },
        {
          "from": "506ntvb",
          "to": "qjc0zt6",
          "as": "value"
        },
        {
          "from": "4ck1vaf",
          "to": "widk6u6",
          "as": "fn"
        }
      ],
      "nodes": [
        {
          "id": "nn4twx9",
          "ref": "html_element",
          "inputs": [
            {
              "from": "bw4iez5/gvkhkfw",
              "to": "bw4iez5/nn4twx9",
              "as": "children"
            },
            {
              "from": "bw4iez5/7rhq0q5",
              "to": "bw4iez5/nn4twx9",
              "as": "props"
            }
          ],
          "name": "out"
        },
        {
          "id": "gvkhkfw",
          "ref": "array"
        },
        {
          "id": "7rhq0q5",
          "name": "in"
        },
        {
          "id": "1ldhfah",
          "ref": "html_element",
          "name": "label"
        },
        {
          "id": "4972gx3",
          "ref": "html_element"
        },
        {
          "id": "wet0jdv",
          "ref": "array"
        },
        {
          "id": "gcuxiw9"
        },
        {
          "id": "875c1wk",
          "value": "label"
        },
        {
          "id": "ee5i5r2",
          "value": "input"
        },
        {
          "id": "ro8n2gc",
          "ref": "merge_objects"
        },
        {
          "id": "n1qcxu2",
          "value": "true"
        },
        {
          "id": "utkc9o6",
          "ref": "html_text"
        },
        {
          "id": "jxl9r29",
          "ref": "script",
          "value": "return \"input-\" + name;"
        },
        {
          "id": "t6q6rvf"
        },
        {
          "id": "rjwtb3c",
          "ref": "default"
        },
        {
          "id": "varubwp"
        },
        {
          "id": "trd8ptp",
          "ref": "arg",
          "value": "name"
        },
        {
          "id": "zfrrk0z",
          "ref": "arg",
          "value": "name"
        },
        {
          "id": "2zxw9oo",
          "ref": "run",
          "name": "stop_propagation"
        },
        {
          "id": "sjw3rie",
          "ref": "default"
        },
        {
          "id": "vks4vul",
          "ref": "arg",
          "value": "props"
        },
        {
          "id": "ddfgy2s"
        },
        {
          "id": "671rzr9",
          "ref": "arg",
          "value": "name"
        },
        {
          "id": "ccir2fl",
          "ref": "arg",
          "value": "name"
        },
        {
          "id": "qseh2tb",
          "ref": "array"
        },
        {
          "id": "i7y9dyy",
          "ref": "runnable"
        },
        {
          "id": "fihihz0",
          "ref": "arg",
          "value": "oninput"
        },
        {
          "id": "1wps21n",
          "name": "stop propagation effect",
          "out": "hj2cig0",
          "nodes": [
            {
              "id": "hj2cig0",
              "ref": "array",
              "name": "stop propagation effect"
            },
            {
              "id": "1pvaim9",
              "ref": "run"
            },
            {
              "id": "0o86xp3",
              "ref": "arg",
              "value": "1"
            },
            {
              "id": "d60jwms",
              "ref": "script",
              "value": "payload.stopPropagation();"
            },
            {
              "id": "xgbubrq",
              "ref": "arg",
              "value": "1"
            }
          ],
          "edges": [
            {
              "from": "1pvaim9",
              "to": "hj2cig0",
              "as": "a0"
            },
            {
              "from": "0o86xp3",
              "to": "hj2cig0",
              "as": "a1"
            },
            {
              "from": "d60jwms",
              "to": "1pvaim9",
              "as": "fn",
              "type": "ref"
            },
            {
              "from": "xgbubrq",
              "to": "d60jwms",
              "as": "payload"
            }
          ]
        },
        {
          "id": "y5q7mbn",
          "ref": "arg",
          "value": "0"
        },
        {
          "id": "y9bkhqc"
        },
        {
          "id": "6m6m1hq_1/ocuonub/qjc0zt6",
          "ref": "event_publisher"
        },
        {
          "id": "nb2sswc",
          "ref": "arg",
          "value": "name"
        },
        {
          "id": "6m6m1hq_1/ocuonub/506ntvb",
          "value": "event.target.value",
          "ref": "arg"
        },
        {
          "id": "6m6m1hq_1/ocuonub/4ck1vaf",
          "ref": "arg",
          "value": "name"
        }
      ],
      "out": "nn4twx9",
      "in": "7rhq0q5",
      "name": "input",
      "id": "input"
    },
    "html_text": {
      "id": "html_text",
      "category": "html",
      "description": "Some HTML plaintext of `text` (or this node's value). Usually used as a child of html_element.",
      "out": "out",
      "nodes": [
        {
          "id": "arg_text",
          "ref": "arg",
          "value": "text"
        },
        {
          "id": "value_text",
          "ref": "arg",
          "value": "__graph_value"
        },
        {
          "id": "text",
          "ref": "default"
        },
        {
          "id": "text_value",
          "value": "text_value"
        },
        {
          "id": "out"
        }
      ],
      "edges": [
        {
          "from": "text_value",
          "to": "out",
          "as": "dom_type"
        },
        {
          "from": "arg_text",
          "to": "text",
          "as": "value"
        },
        {
          "from": "value_text",
          "to": "text",
          "as": "otherwise"
        },
        {
          "from": "text",
          "to": "out",
          "as": "text"
        }
      ]
    },
    "html_element": {
      "id": "html_element",
      "category": "html",
      "out": "out_ret",
      "description": "An HTML Element. `children` is an array of html_element or html_text, `props` are the attributes for the html element as an object, `dom_type` (or this node's value) is the dom type, `memo` refers to <a target='_blank' href='https://github.com/jorgebucaran/hyperapp/blob/main/docs/api/memo.md'>hyperapp's memo</a>.",
      "nodes": [
        {
          "id": "children",
          "ref": "arg",
          "value": "children"
        },
        {
          "id": "props",
          "ref": "arg",
          "value": "props"
        },
        {
          "id": "dom_type",
          "ref": "arg",
          "value": "dom_type"
        },
        {
          "id": "memo",
          "ref": "arg",
          "value": "memo"
        },
        {
          "id": "value",
          "ref": "arg",
          "value": "value"
        },
        {
          "id": "element_dt",
          "ref": "arg",
          "value": "element.dom_type"
        },
        {
          "id": "element",
          "ref": "arg",
          "value": "element"
        },
        {
          "id": "element_tv",
          "ref": "arg",
          "value": "element.text_value"
        },
        {
          "id": "div",
          "value": "div"
        },
        {
          "id": "dom_type_value",
          "ref": "default"
        },
        {
          "id": "graph_value",
          "ref": "arg",
          "value": "__graph_value"
        },
        {
          "id": "filter_children_fn",
          "ref": "script",
          "value": "return !!(element_dt || element_tv)"
        },
        {
          "id": "filter_children_fn_runnable_args",
          "value": "{\"element\": \"undefined\"}"
        },
        {
          "id": "filter_children_fn_runnable",
          "ref": "runnable"
        },
        {
          "id": "fill_children_fn",
          "ref": "script",
          "value": "return element?.el ?? typeof element === 'string' ? {dom_type: 'text_value', text: element} : element"
        },
        {
          "id": "fill_children_fn_runnable_args",
          "value": "{\"element\": \"undefined\"}"
        },
        {
          "id": "fill_children_fn_runnable",
          "ref": "runnable"
        },
        {
          "id": "wrapped_children",
          "ref": "script",
          "value": "return Array.isArray(children) ? children : children !== undefined ? [children] : []"
        },
        {
          "id": "filter_children",
          "ref": "filter"
        },
        {
          "id": "fill_children",
          "ref": "map"
        },
        {
          "id": "fill_props",
          "ref": "script",
          "value": "return props ?? {}"
        },
        {
          "id": "dom_type_def",
          "ref": "default"
        },
        {
          "id": "out",
          "ref": "script",
          "value": "if(!(typeof dom_type === 'string' && typeof children === 'object')){ throw new Error('invalid element');} return {dom_type, props, children: children, memo, value}"
        },
        {
          "id": "out_ret",
          "ref": "return"
        }
      ],
      "edges": [
        {
          "from": "children",
          "to": "wrapped_children",
          "as": "children"
        },
        {
          "from": "wrapped_children",
          "to": "fill_children",
          "as": "array"
        },
        {
          "from": "props",
          "to": "fill_props",
          "as": "props"
        },
        {
          "from": "memo",
          "to": "out",
          "as": "memo"
        },
        {
          "from": "element_dt",
          "to": "filter_children_fn",
          "as": "element_dt"
        },
        {
          "from": "element_tv",
          "to": "filter_children_fn",
          "as": "element_tv"
        },
        {
          "from": "filter_children_fn_runnable_args",
          "to": "filter_children_fn_runnable",
          "as": "parameters"
        },
        {
          "from": "filter_children_fn",
          "to": "filter_children_fn_runnable",
          "as": "fn"
        },
        {
          "from": "filter_children_fn_runnable",
          "to": "filter_children",
          "as": "fn"
        },
        {
          "from": "element",
          "to": "fill_children_fn",
          "as": "element"
        },
        {
          "from": "fill_children_fn_runnable_args",
          "to": "fill_children_fn_runnable",
          "as": "parameters"
        },
        {
          "from": "fill_children_fn",
          "to": "fill_children_fn_runnable",
          "as": "fn"
        },
        {
          "from": "fill_children_fn_runnable",
          "to": "fill_children",
          "as": "fn"
        },
        {
          "from": "fill_children",
          "to": "filter_children",
          "as": "array"
        },
        {
          "from": "filter_children",
          "to": "out",
          "as": "children"
        },
        {
          "from": "value",
          "to": "out",
          "as": "value"
        },
        {
          "from": "fill_props",
          "to": "out",
          "as": "props"
        },
        {
          "from": "dom_type",
          "to": "dom_type_def",
          "as": "value"
        },
        {
          "from": "div",
          "to": "dom_type_value",
          "as": "otherwise"
        },
        {
          "from": "graph_value",
          "to": "dom_type_value",
          "as": "value"
        },
        {
          "from": "dom_type_value",
          "to": "dom_type_def",
          "as": "otherwise"
        },
        {
          "from": "dom_type_def",
          "to": "out",
          "as": "dom_type"
        },
        {
          "from": "out",
          "to": "out_ret",
          "as": "value"
        }
      ]
    },
    "icon": {
      "id": "icon",
      "description": "A ionicon in hyperapp format.",
      "category": "html",
      "name": "icon",
      "out": "c2sko9c",
      "nodes": [
        {
          "id": "c2sko9c",
          "ref": "html_element",
          "name": "ionicon"
        },
        {
          "id": "2lr3ihi",
          "value": "ion-icon"
        },
        {
          "id": "empty_obj",
          "value": {}
        },
        {
          "id": "props",
          "ref": "arg",
          "value": "props"
        },
        {
          "id": "props_pred",
          "ref": "arg",
          "value": "props"
        },
        {
          "id": "defined_props",
          "ref": "if"
        },
        {
          "id": "name_path",
          "value": "name"
        },
        {
          "id": "a0jb5es",
          "ref": "set"
        },
        {
          "id": "s5x2r1f",
          "ref": "arg",
          "value": "icon"
        }
      ],
      "edges": [
        {
          "from": "2lr3ihi",
          "to": "c2sko9c",
          "as": "dom_type"
        },
        {
          "from": "props",
          "to": "defined_props",
          "as": "true"
        },
        {
          "from": "props_pred",
          "to": "defined_props",
          "as": "pred"
        },
        {
          "from": "empty_obj",
          "to": "defined_props",
          "as": "false"
        },
        {
          "from": "defined_props",
          "to": "a0jb5es",
          "as": "target"
        },
        {
          "from": "name_path",
          "to": "a0jb5es",
          "as": "path"
        },
        {
          "from": "a0jb5es",
          "to": "c2sko9c",
          "as": "props"
        },
        {
          "from": "s5x2r1f",
          "to": "a0jb5es",
          "as": "value"
        }
      ]
    },
    "not": {
      "id": "not",
      "ref": "script",
      "category": "data",
      "value": "return !target"
    },
    "canvas_behind_editor": {
      "id": "canvas_behind_editor",
      "category": "html",
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
          "value": "unset"
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
          "id": "z54r0bl"
        },
        {
          "id": "tok49em",
          "value": "4"
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
          "as": "#node-info-wrapper, #graph-actions"
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
        },
        {
          "from": "ejd0zjg",
          "to": "45uuwjl",
          "as": "#node-editor-editor"
        },
        {
          "from": "z54r0bl",
          "to": "45uuwjl",
          "as": "#node-editor-error"
        },
        {
          "from": "tok49em",
          "to": "z54r0bl",
          "as": "z-index"
        }
      ],
      "out": "out"
    },
    "import_module": {
      "id": "import_module",
      "category": "javascript",
      "description": "Dynamically import an es6 module",
      "ref": "extern",
      "value": "extern.import_module"
    },
    "import": {
    "id": "import",
    "out": "out",
      "category": "nodysseus",
    "nodes": {
      "args": {
        "id": "args"
      },
      "8dy573e": {
        "id": "8dy573e",
        "ref": "html_element"
      },
      "out": {
        "id": "out",
        "name": "import",
        "ref": "return"
      },
      "arcnyff": {
        "id": "arcnyff",
        "ref": "array"
      },
      "qgbinm2": {
        "id": "qgbinm2",
        "value": "Upload a json file",
        "ref": "html_text"
      },
      "rtrp3nj": {
        "id": "rtrp3nj",
        "value": "input",
        "ref": "html_element"
      },
      "vnibm4q": {
        "id": "vnibm4q"
      },
      "07fjn2b": {
        "id": "07fjn2b",
        "value": "file"
      },
      "rdt0k55": {
        "id": "rdt0k55",
        "value": ".json"
      },
      "jmqcpll": {
        "id": "jmqcpll",
        "ref": "runnable"
      },
      "o9ukwn8": {
        "id": "o9ukwn8",
        "value": "event.target.files.0",
        "ref": "arg"
      },
      "1672j69": {
        "id": "1672j69",
        "value": "text",
        "ref": "call"
      },
      "jvoijof": {
        "id": "jvoijof",
        "ref": "parse"
      },
      "uymxrxe": {
        "id": "uymxrxe",
        "ref": "map"
      },
      "yu0e7mk": {
        "id": "yu0e7mk",
        "ref": "runnable"
      },
      "3z8hhss": {
        "id": "3z8hhss",
        "value": "element",
        "ref": "arg"
      },
      "ij46kiv": {
        "id": "ij46kiv",
        "value": "return ({id: graph.id, value: graph.value, name: graph.name, nodes: graph.nodes, edges: graph.edges, out: graph.out})",
        "ref": "script"
      },
      "hcp6xds": {
        "id": "hcp6xds",
        "ref": "log"
      },
      "cixrltc": {
        "id": "cixrltc",
        "value": "_lib.no.runtime.change_graph(graph); return graph;",
        "ref": "script"
      },
      "sl7qlmj": {
        "id": "sl7qlmj",
        "value": "scripts.save_graph",
        "ref": "call"
      },
      "ukrwz7a": {
        "id": "ukrwz7a"
      },
      "xr7en45": {
        "id": "xr7en45"
      },
      "o58l5no": {
        "id": "o58l5no"
      },
      "n8fhfq0": {
        "id": "n8fhfq0"
      }
    },
    "edges": {
      "8dy573e": {
        "from": "8dy573e",
        "to": "out",
        "as": "display"
      },
      "args": {
        "from": "args",
        "to": "out",
        "as": "args"
      },
      "arcnyff": {
        "from": "arcnyff",
        "to": "8dy573e",
        "as": "children"
      },
      "qgbinm2": {
        "from": "qgbinm2",
        "to": "arcnyff",
        "as": "arg0"
      },
      "rtrp3nj": {
        "from": "rtrp3nj",
        "to": "arcnyff",
        "as": "arg1"
      },
      "vnibm4q": {
        "from": "vnibm4q",
        "to": "rtrp3nj",
        "as": "props"
      },
      "07fjn2b": {
        "from": "07fjn2b",
        "to": "vnibm4q",
        "as": "type"
      },
      "rdt0k55": {
        "from": "rdt0k55",
        "to": "vnibm4q",
        "as": "accept"
      },
      "jmqcpll": {
        "from": "jmqcpll",
        "to": "vnibm4q",
        "as": "onchange"
      },
      "o9ukwn8": {
        "from": "o9ukwn8",
        "to": "1672j69",
        "as": "self"
      },
      "1672j69": {
        "from": "1672j69",
        "to": "jvoijof",
        "as": "string"
      },
      "uymxrxe": {
        "from": "uymxrxe",
        "to": "jmqcpll",
        "as": "fn"
      },
      "jvoijof": {
        "from": "jvoijof",
        "to": "uymxrxe",
        "as": "array"
      },
      "yu0e7mk": {
        "from": "yu0e7mk",
        "to": "uymxrxe",
        "as": "fn"
      },
      "3z8hhss": {
        "from": "3z8hhss",
        "to": "ij46kiv",
        "as": "graph"
      },
      "ij46kiv": {
        "from": "ij46kiv",
        "to": "hcp6xds",
        "as": "value"
      },
      "hcp6xds": {
        "from": "hcp6xds",
        "to": "cixrltc",
        "as": "graph"
      },
      "sl7qlmj": {
        "from": "sl7qlmj",
        "to": "yu0e7mk",
        "as": "fn"
      },
      "cixrltc": {
        "from": "cixrltc",
        "to": "sl7qlmj",
        "as": "args"
      },
      "ukrwz7a": {
        "from": "ukrwz7a",
        "to": "jmqcpll",
        "as": "parameters"
      },
      "xr7en45": {
        "from": "xr7en45",
        "to": "ukrwz7a",
        "as": "event"
      },
      "o58l5no": {
        "from": "o58l5no",
        "to": "yu0e7mk",
        "as": "parameters"
      },
      "n8fhfq0": {
        "from": "n8fhfq0",
        "to": "o58l5no",
        "as": "element"
      }
    }
  },
    "import_nodes": {
      "id": "import_nodes",
      "description": "Imports the passed in `nodes`",
      "name": "import_nodes",
      "category": "nodysseus",
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
    },
    "offscreen-canvas": {
      "id": "offscreen-canvas",
      "category": "html",
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
    "delete_ref": {
      "id": "delete_ref",
      "name": "delete_ref",
      "out": "main/out",
      "category": "nodysseus",
      "nodes": {
        "args": {
          "id": "args"
        },
        "jklqh38": {
          "id": "jklqh38",
          "ref": "html_element"
        },
        "6qkew20": {
          "id": "6qkew20",
          "ref": "array"
        },
        "zihm1kd": {
          "id": "zihm1kd"
        },
        "3b7bnzm": {
          "id": "3b7bnzm",
          "ref": "state"
        },
        "pcx97n4": {
          "id": "pcx97n4",
          "value": "input",
          "ref": "html_element",
        },
        "rk7hcxc": {
          "id": "rk7hcxc"
        },
        "b8wohxv": {
          "id": "b8wohxv",
          "value": "select",
        },
        "x200f4j": {
          "id": "x200f4j",
          "value": "export-list",
        },
        "et5g0m1": {
          "id": "et5g0m1",
          "ref": "map"
        },
        "9tv13iq": {
          "id": "9tv13iq",
          "value": "return _lib.no.runtime.refs()",
          "ref": "script"
        },
        "dd6st1b": {
          "id": "dd6st1b",
          "value": "element",
          "ref": "arg"
        },
        "2yur4h7": {
          "id": "2yur4h7",
          "ref": "runnable",
        },
        "xdot36k": {
          "id": "xdot36k"
        },
        "1edrrwq": {
          "id": "1edrrwq",
          "value": "option",
          "ref": "html_element",
        },
        "skqnl08": {
          "id": "skqnl08",
          "ref": "html_text"
        },
        "3y8pyc2": {
          "id": "3y8pyc2",
          "value": "datalist",
          "ref": "html_element",
        },
        "tfwqhqf": {
          "id": "tfwqhqf",
          "value": "export-list",
        },
        "tad7830": {
          "id": "tad7830",
          "ref": "state"
        },
        "jdufmth": {
          "id": "jdufmth",
          "value": "namespace.state",
          "ref": "arg",
        },
        "898n6f7": {
          "id": "898n6f7",
          "ref": "ap"
        },
        "9jvfgj1": {
          "id": "9jvfgj1",
          "value": "namespace.set",
          "ref": "arg",
        },
        "j2c518b": {
          "id": "j2c518b"
        },
        "qpiqhgp": {
          "id": "qpiqhgp",
          "value": "event.target.value",
          "ref": "arg"
        },
        "main/out": {
          "id": "main/out",
          "name": "delete_ref",
          "ref": "return"
        },
        "8dy573e": {
          "id": "8dy573e",
          "value": "button",
          "ref": "html_element"
        },
        "n7aaoju": {
          "id": "n7aaoju",
          "value": "delete",
          "ref": "html_text"
        },
        "ibmy4bt": {
          "id": "ibmy4bt",
          "ref": "runnable"
        },
        "jdoak4g": {
          "id": "jdoak4g",
          "value": "localStorage.removeItem(ns);\nlocalStorage.setItem(\"graph_list\", JSON.stringify(JSON.parse(localStorage.getItem(\"graph_list\")).filter(g => g !== ns)))\n_lib.no.runtime.remove_ref(ns);",
          "ref": "script"
        },
        "a32fufq": {
          "id": "a32fufq",
          "ref": "icon"
        },
        "pfmdyvv": {
          "id": "pfmdyvv"
        },
        "9cwkm4z": {
          "id": "9cwkm4z",
          "value": "trash-outline"
        },
        "h10oho6": {
          "id": "h10oho6",
          "ref": "if"
        },
        "2r1dra9": {
          "id": "2r1dra9",
          "value": "checkmark-outline"
        },
        "semslq4": {
          "id": "semslq4",
          "value": "console.log(namespace);\nconst ref = _lib.no.runtime.get_ref(namespace);\nref?.then ? ref.then(console.log) : console.log(ref)\nreturn _lib.no.runtime.get_ref(namespace)",
          "ref": "script"
        },
        "vffalrt": {
          "id": "vffalrt",
          "value": "namespace.state",
          "ref": "arg"
        },
        "7yg0tro": {
          "id": "7yg0tro"
        },
        "vqk5ztl": {
          "id": "vqk5ztl"
        },
        "ygewxjl": {
          "id": "ygewxjl"
        },
        "i153jv4": {
          "id": "i153jv4",
          "ref": "ap"
        },
        "nxihxr3": {
          "id": "nxihxr3",
          "ref": "array"
        },
        "pdox5d1": {
          "id": "pdox5d1",
          "value": "graphupdate",
          "ref": "publish_event"
        },
        "qvl4qif": {
          "id": "qvl4qif",
          "value": "__graphid",
          "ref": "arg"
        },
        "dqujder": {
          "id": "dqujder"
        },
        "7c6mxi9": {
          "id": "7c6mxi9",
          "ref": "array"
        },
        "00fj2qe": {
          "id": "00fj2qe",
          "value": "graphupdate",
          "ref": "publish_event"
        },
        "rgoguh4": {
          "id": "rgoguh4"
        },
        "o2uz727": {
          "id": "o2uz727",
          "value": "__graphid",
          "ref": "arg"
        }
      },
      "edges": {
        "args": {
          "from": "args",
          "to": "main/out",
          "as": "args"
        },
        "n7aaoju": {
          "from": "n7aaoju",
          "to": "8dy573e",
          "as": "children"
        },
        "jklqh38": {
          "from": "jklqh38",
          "to": "main/out",
          "as": "display"
        },
        "6qkew20": {
          "from": "6qkew20",
          "to": "jklqh38",
          "as": "children"
        },
        "zihm1kd": {
          "from": "zihm1kd",
          "to": "8dy573e",
          "as": "props"
        },
        "tad7830": {
          "from": "tad7830",
          "to": "args",
          "as": "namespace"
        },
        "jdufmth": {
          "from": "jdufmth",
          "to": "jdoak4g",
          "as": "ns"
        },
        "3b7bnzm": {
          "from": "3b7bnzm",
          "to": "args",
          "as": "hrefstate"
        },
        "pcx97n4": {
          "from": "pcx97n4",
          "to": "6qkew20",
          "as": "arg2"
        },
        "rk7hcxc": {
          "from": "rk7hcxc",
          "to": "pcx97n4",
          "as": "props"
        },
        "b8wohxv": {
          "from": "b8wohxv",
          "to": "rk7hcxc",
          "as": "type"
        },
        "x200f4j": {
          "from": "x200f4j",
          "to": "rk7hcxc",
          "as": "list"
        },
        "3y8pyc2": {
          "from": "3y8pyc2",
          "to": "6qkew20",
          "as": "arg3"
        },
        "et5g0m1": {
          "from": "et5g0m1",
          "to": "3y8pyc2",
          "as": "children"
        },
        "9tv13iq": {
          "from": "9tv13iq",
          "to": "et5g0m1",
          "as": "array"
        },
        "2yur4h7": {
          "from": "2yur4h7",
          "to": "et5g0m1",
          "as": "fn"
        },
        "dd6st1b": {
          "from": "dd6st1b",
          "to": "7yg0tro",
          "as": "value"
        },
        "xdot36k": {
          "from": "xdot36k",
          "to": "3y8pyc2",
          "as": "props"
        },
        "1edrrwq": {
          "from": "1edrrwq",
          "to": "2yur4h7",
          "as": "fn"
        },
        "skqnl08": {
          "from": "skqnl08",
          "to": "1edrrwq",
          "as": "children"
        },
        "tfwqhqf": {
          "from": "tfwqhqf",
          "to": "xdot36k",
          "as": "id"
        },
        "898n6f7": {
          "from": "898n6f7",
          "to": "rk7hcxc",
          "as": "onchange"
        },
        "9jvfgj1": {
          "from": "9jvfgj1",
          "to": "7c6mxi9",
          "as": "arg0"
        },
        "j2c518b": {
          "from": "j2c518b",
          "to": "898n6f7",
          "as": "args"
        },
        "qpiqhgp": {
          "from": "qpiqhgp",
          "to": "j2c518b",
          "as": "value"
        },
        "8dy573e": {
          "from": "8dy573e",
          "to": "6qkew20",
          "as": "arg4"
        },
        "ibmy4bt": {
          "from": "ibmy4bt",
          "to": "nxihxr3",
          "as": "arg0"
        },
        "jdoak4g": {
          "from": "jdoak4g",
          "to": "ibmy4bt",
          "as": "fn"
        },
        "a32fufq": {
          "from": "a32fufq",
          "to": "6qkew20",
          "as": "arg5"
        },
        "pfmdyvv": {
          "from": "pfmdyvv",
          "to": "a32fufq",
          "as": "props"
        },
        "9cwkm4z": {
          "from": "9cwkm4z",
          "to": "h10oho6",
          "as": "true"
        },
        "h10oho6": {
          "from": "h10oho6",
          "to": "a32fufq",
          "as": "icon"
        },
        "2r1dra9": {
          "from": "2r1dra9",
          "to": "h10oho6",
          "as": "false"
        },
        "semslq4": {
          "from": "semslq4",
          "to": "h10oho6",
          "as": "pred"
        },
        "vffalrt": {
          "from": "vffalrt",
          "to": "semslq4",
          "as": "namespace"
        },
        "7yg0tro": {
          "from": "7yg0tro",
          "to": "skqnl08",
          "as": "text"
        },
        "vqk5ztl": {
          "from": "vqk5ztl",
          "to": "2yur4h7",
          "as": "parameters"
        },
        "ygewxjl": {
          "from": "ygewxjl",
          "to": "vqk5ztl",
          "as": "element"
        },
        "i153jv4": {
          "from": "i153jv4",
          "to": "zihm1kd",
          "as": "onclick"
        },
        "nxihxr3": {
          "from": "nxihxr3",
          "to": "i153jv4",
          "as": "fn"
        },
        "pdox5d1": {
          "from": "pdox5d1",
          "to": "nxihxr3",
          "as": "arg1"
        },
        "qvl4qif": {
          "from": "qvl4qif",
          "to": "dqujder",
          "as": "graphid"
        },
        "dqujder": {
          "from": "dqujder",
          "to": "pdox5d1",
          "as": "data"
        },
        "7c6mxi9": {
          "from": "7c6mxi9",
          "to": "898n6f7",
          "as": "fn"
        },
        "rgoguh4": {
          "from": "rgoguh4",
          "to": "00fj2qe",
          "as": "data"
        },
        "o2uz727": {
          "from": "o2uz727",
          "to": "rgoguh4",
          "as": "graphid"
        },
        "00fj2qe": {
          "from": "00fj2qe",
          "to": "7c6mxi9",
          "as": "arg1"
        }
      }
    },
    "changed": {
      "id": "changed",
      "category": "data",
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
    "webgl": {
      "id": "webgl",
      "category": "graphics",
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
    },
    "load_shader": {
      "id": "load_shader",
      "category": "graphics",
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
    "subscribe_many": {
      "id": "subscribe_many",
      "name": "subscribe_many",
      "nodes": [
        {
          "id": "ld37qq4",
          "name": "subscribe_many",
          "ref": "return"
        },
        {
          "id": "ndna6vl"
        },
        {
          "id": "r0v26jn",
          "name": "",
          "ref": "reduce"
        },
        {
          "id": "0n8k0b7",
          "value": "events",
          "ref": "arg"
        },
        {
          "id": "kd528s8",
          "name": "",
          "ref": "runnable"
        },
        {
          "id": "rxoook3",
          "ref": "merge_objects"
        },
        {
          "id": "daykk9b"
        },
        {
          "id": "6kwqo8l",
          "value": "previous",
          "name": "",
          "ref": "arg"
        },
        {
          "id": "bzkaiyo",
          "name": "",
          "ref": "set"
        },
        {
          "id": "hsq8vrp",
          "value": "base",
          "ref": "arg"
        },
        {
          "id": "5mzlv42"
        },
        {
          "id": "pkd8b0p",
          "value": "current",
          "ref": "arg"
        },
        {
          "id": "8zi1gzy",
          "value": "runnable",
          "ref": "arg"
        },
        {
          "id": "9716t7q",
          "name": "",
          "ref": "sequence"
        },
        {
          "id": "hi50l05",
          "ref": "get"
        },
        {
          "id": "opox5xi",
          "value": "base",
          "ref": "arg"
        },
        {
          "id": "5szjf17",
          "value": "current",
          "ref": "arg"
        },
        {
          "id": "it3evdr"
        },
        {
          "id": "qd1bvw9"
        },
        {
          "id": "6barb7g",
          "ref": "cache"
        },
        {
          "id": "i7tgtne",
          "value": "evt_runnable",
          "ref": "arg"
        },
        {
          "id": "7rpfcmk",
          "ref": "cache"
        },
        {
          "id": "xk6e7zh"
        },
        {
          "id": "pf10ku6",
          "ref": "runnable"
        },
        {
          "id": "km7iwa0",
          "ref": "set_mutable"
        },
        {
          "id": "zyqw0ko",
          "value": "datacache",
          "ref": "arg"
        },
        {
          "id": "f0roa3q",
          "value": "current",
          "ref": "arg"
        },
        {
          "id": "rat3zkt",
          "value": "data",
          "ref": "arg"
        },
        {
          "id": "2mcffa6",
          "value": "base",
          "ref": "arg"
        }
      ],
      "edges": [
        {
          "from": "ndna6vl",
          "to": "ld37qq4",
          "as": "args"
        },
        {
          "from": "r0v26jn",
          "to": "ld37qq4",
          "as": "return"
        },
        {
          "from": "0n8k0b7",
          "to": "r0v26jn",
          "as": "array"
        },
        {
          "from": "kd528s8",
          "to": "r0v26jn",
          "as": "fn"
        },
        {
          "from": "2mcffa6",
          "to": "r0v26jn",
          "as": "initial"
        },
        {
          "from": "rxoook3",
          "to": "kd528s8",
          "as": "fn"
        },
        {
          "from": "daykk9b",
          "to": "kd528s8",
          "as": "args"
        },
        {
          "from": "hsq8vrp",
          "to": "daykk9b",
          "as": "base"
        },
        {
          "from": "5mzlv42",
          "to": "bzkaiyo",
          "as": "target"
        },
        {
          "from": "pkd8b0p",
          "to": "bzkaiyo",
          "as": "path"
        },
        {
          "from": "opox5xi",
          "to": "hi50l05",
          "as": "target"
        },
        {
          "from": "5szjf17",
          "to": "hi50l05",
          "as": "path"
        },
        {
          "from": "9716t7q",
          "to": "bzkaiyo",
          "as": "value"
        },
        {
          "from": "8zi1gzy",
          "to": "daykk9b",
          "as": "evt_runnable"
        },
        {
          "from": "it3evdr",
          "to": "9716t7q",
          "as": "args"
        },
        {
          "from": "6barb7g",
          "to": "it3evdr",
          "as": "data"
        },
        {
          "from": "qd1bvw9",
          "to": "6barb7g",
          "as": "value"
        },
        {
          "from": "xk6e7zh",
          "to": "7rpfcmk",
          "as": "value"
        },
        {
          "from": "7rpfcmk",
          "to": "daykk9b",
          "as": "datacache"
        },
        {
          "from": "hi50l05",
          "to": "9716t7q",
          "as": "arg2"
        },
        {
          "from": "pf10ku6",
          "to": "9716t7q",
          "as": "arg0"
        },
        {
          "from": "km7iwa0",
          "to": "pf10ku6",
          "as": "fn"
        },
        {
          "from": "zyqw0ko",
          "to": "km7iwa0",
          "as": "target"
        },
        {
          "from": "f0roa3q",
          "to": "km7iwa0",
          "as": "path"
        },
        {
          "from": "rat3zkt",
          "to": "km7iwa0",
          "as": "value"
        },
        {
          "from": "6kwqo8l",
          "to": "rxoook3",
          "as": "arg0"
        },
        {
          "from": "bzkaiyo",
          "to": "rxoook3",
          "as": "arg1"
        },
        {
          "from": "i7tgtne",
          "to": "9716t7q",
          "as": "arg1"
        }
      ],
      "out": "ld37qq4"
    },
    "slider": {
    "id": "slider",
    "out": "out",
    "nodes": {
      "5mog0bc": {
        "id": "5mog0bc",
        "value": "input",
        "ref": "html_element"
      },
      "24q0egm": {
        "id": "24q0egm"
      },
      "mpbvtrq": {
        "id": "mpbvtrq",
        "value": "range"
      },
      "y407zfo": {
        "id": "y407zfo",
        "ref": "html_element"
      },
      "sb9qdgy": {
        "id": "sb9qdgy",
        "ref": "array"
      },
      "kyu6h8m": {
        "id": "kyu6h8m",
        "ref": "html_text"
      },
      "a4y3jfa": {
        "id": "a4y3jfa",
        "value": "1.0"
      },
      "yv0o41n": {
        "id": "yv0o41n",
        "ref": "default"
      },
      "z3jopgg": {
        "id": "z3jopgg",
        "value": "step",
        "ref": "arg"
      },
      "racg3p7": {
        "id": "racg3p7",
        "value": "label",
        "ref": "arg"
      },
      "0i85qjj": {
        "id": "0i85qjj"
      },
      "u4k2auv": {
        "id": "u4k2auv",
        "value": "Slider"
      },
      "a6rdag9": {
        "id": "a6rdag9"
      },
      "sxjhepz": {
        "id": "sxjhepz"
      },
      "93rx3ru": {
        "id": "93rx3ru",
        "value": "flex"
      },
      "q8ugbch": {
        "id": "q8ugbch",
        "value": "row"
      },
      "doz740g": {
        "id": "doz740g",
        "ref": "html_text"
      },
      "gibdj45": {
        "id": "gibdj45",
        "value": "event.target.value",
        "ref": "arg"
      },
      "parseval": {
        "id": "parseval",
        "ref": "script",
        "value": "return parseFloat(val)"
      },
      "q09a315": {
        "id": "q09a315",
        "value": "0.01",
        "ref": ""
      },
      "16b092x": {
        "id": "16b092x",
        "ref": "default"
      },
      "9fk784a": {
        "id": "9fk784a",
        "value": "max",
        "ref": "arg"
      },
      "7c2vt3d": {
        "id": "7c2vt3d",
        "ref": "default"
      },
      "fd7yax9": {
        "id": "fd7yax9",
        "value": "min",
        "ref": "arg"
      },
      "r1ah7g2": {
        "id": "r1ah7g2",
        "value": "0.0"
      },
      "t1deznd": {
        "id": "t1deznd",
        "ref": "state"
      },
      "ewycyaq": {
        "id": "ewycyaq",
        "ref": "default"
      },
      "old0t0c": {
        "id": "old0t0c",
        "ref": "ap"
      },
      "ezx9hxj": {
        "id": "ezx9hxj"
      },
      "l5bzesi": {
        "id": "l5bzesi",
        "value": "_sliderval.set",
        "ref": "arg"
      },
      "vgishln": {
        "id": "vgishln",
        "value": "_sliderval.state",
        "ref": "arg"
      },
      "sv49nso": {
        "id": "sv49nso",
        "value": "_sliderval.state",
        "ref": "arg"
      },
      "7hff44y": {
        "id": "7hff44y",
        "ref": "default"
      },
      "n4i4t17": {
        "id": "n4i4t17",
        "value": "_sliderval.state",
        "ref": "arg"
      },
      "out": {
        "id": "out",
        "name": "slider",
        "ref": "return"
      },
      "j219svq": {
        "id": "j219svq",
        "value": "{}"
      },
      "2wp8ffd": {
        "id": "2wp8ffd",
        "ref": "array"
      },
      "4dh6wzn": {
        "id": "4dh6wzn",
        "value": "oninput",
        "ref": "arg"
      },
      "c74vowk": {
        "id": "c74vowk",
        "ref": "default"
      },
      "blapbo4": {
        "id": "blapbo4",
        "value": "return (max + min) * 0.5;",
        "ref": "script"
      },
      "fn7qsxi": {
        "id": "fn7qsxi",
        "ref": "default"
      },
      "8tugpnc": {
        "id": "8tugpnc",
        "value": "1.0"
      },
      "k51obwl": {
        "id": "k51obwl",
        "ref": "default"
      },
      "fohdjl3": {
        "id": "fohdjl3",
        "value": "min",
        "ref": "arg"
      },
      "rxad35l": {
        "id": "rxad35l",
        "value": "0.0"
      },
      "avvpzh5": {
        "id": "avvpzh5",
        "value": "return (max + min) * 0.5;",
        "ref": "script"
      },
      "ygxb70y": {
        "id": "ygxb70y",
        "ref": "default"
      },
      "kb6l0sn": {
        "id": "kb6l0sn",
        "value": "min",
        "ref": "arg"
      },
      "yo8jarp": {
        "id": "yo8jarp",
        "value": "0.0"
      },
      "h6f5dw0": {
        "id": "h6f5dw0",
        "ref": "default"
      },
      "v5bj4o0": {
        "id": "v5bj4o0",
        "value": "max",
        "ref": "arg"
      },
      "2rjv9by": {
        "id": "2rjv9by",
        "value": "1.0"
      },
      "7135lyp": {
        "id": "7135lyp",
        "ref": "default"
      },
      "gfcxpmm": {
        "id": "gfcxpmm",
        "value": "return (max + min) * 0.5;",
        "ref": "script"
      },
      "ecvb67i": {
        "id": "ecvb67i",
        "ref": "default"
      },
      "069irt7": {
        "id": "069irt7",
        "value": "min",
        "ref": "arg"
      },
      "hbbs5nk": {
        "id": "hbbs5nk",
        "value": "0.0"
      },
      "d0lq01a": {
        "id": "d0lq01a",
        "ref": "default"
      },
      "90buk8f": {
        "id": "90buk8f",
        "ref": "default"
      },
      "kxuzh9y": {
        "id": "kxuzh9y",
        "value": "max",
        "ref": "arg"
      },
      "54kj5rw": {
        "id": "54kj5rw",
        "value": "1.0"
      },
      "39pwh53": {
        "id": "39pwh53",
        "ref": "default"
      },
      "cpb7sy3": {
        "id": "cpb7sy3",
        "ref": "default"
      },
      "auybq8d": {
        "id": "auybq8d",
        "value": "__graph_value",
        "ref": "arg"
      },
      "8nwncub": {
        "id": "8nwncub",
        "value": "max",
        "ref": "arg"
      },
      "8ujztxk": {
        "id": "8ujztxk",
        "value": "return parseFloat(inpt);",
        "ref": "script"
      },
      "sy3nn9u": {
        "id": "sy3nn9u",
        "value": "return parseFloat(inpt);",
        "ref": "script"
      },
      "n1h98h3": {
        "id": "n1h98h3",
        "value": "__graph_value",
        "ref": "arg"
      },
      "o0rpwm4": {
        "id": "o0rpwm4",
        "value": "return parseFloat(inpt);",
        "ref": "script"
      },
      "ze5bcmv": {
        "id": "ze5bcmv",
        "value": "__graph_value",
        "ref": "arg"
      },
      "b0pgnet": {
        "id": "b0pgnet",
        "value": "return parseFloat(inpt);",
        "ref": "script"
      },
      "9ecvhcn": {
        "id": "9ecvhcn",
        "value": "__graph_value",
        "ref": "arg"
      }
    },
    "edges": {
      "j219svq": {
        "from": "j219svq",
        "to": "out",
        "as": "subscribe"
      },
      "24q0egm": {
        "from": "24q0egm",
        "to": "5mog0bc",
        "as": "props"
      },
      "mpbvtrq": {
        "from": "mpbvtrq",
        "to": "24q0egm",
        "as": "type"
      },
      "sb9qdgy": {
        "from": "sb9qdgy",
        "to": "y407zfo",
        "as": "children"
      },
      "yv0o41n": {
        "from": "yv0o41n",
        "to": "24q0egm",
        "as": "step"
      },
      "q09a315": {
        "from": "q09a315",
        "to": "yv0o41n",
        "as": "otherwise"
      },
      "z3jopgg": {
        "from": "z3jopgg",
        "to": "yv0o41n",
        "as": "value"
      },
      "5mog0bc": {
        "from": "5mog0bc",
        "to": "sb9qdgy",
        "as": "arg1"
      },
      "0i85qjj": {
        "from": "0i85qjj",
        "to": "out",
        "as": "args"
      },
      "u4k2auv": {
        "from": "u4k2auv",
        "to": "0i85qjj",
        "as": "label"
      },
      "a6rdag9": {
        "from": "a6rdag9",
        "to": "y407zfo",
        "as": "props"
      },
      "sxjhepz": {
        "from": "sxjhepz",
        "to": "a6rdag9",
        "as": "style"
      },
      "93rx3ru": {
        "from": "93rx3ru",
        "to": "sxjhepz",
        "as": "display"
      },
      "q8ugbch": {
        "from": "q8ugbch",
        "to": "sxjhepz",
        "as": "flex-direction"
      },
      "doz740g": {
        "from": "doz740g",
        "to": "sb9qdgy",
        "as": "arg0"
      },
      "kyu6h8m": {
        "from": "kyu6h8m",
        "to": "sb9qdgy",
        "as": "arg2"
      },
      "racg3p7": {
        "from": "racg3p7",
        "to": "doz740g",
        "as": "text"
      },
      "ewycyaq": {
        "from": "ewycyaq",
        "to": "kyu6h8m",
        "as": "text"
      },
      "16b092x": {
        "from": "16b092x",
        "to": "24q0egm",
        "as": "max"
      },
      "a4y3jfa": {
        "from": "a4y3jfa",
        "to": "16b092x",
        "as": "otherwise"
      },
      "9fk784a": {
        "from": "9fk784a",
        "to": "39pwh53",
        "as": "value"
      },
      "r1ah7g2": {
        "from": "r1ah7g2",
        "to": "7c2vt3d",
        "as": "otherwise"
      },
      "fd7yax9": {
        "from": "fd7yax9",
        "to": "7c2vt3d",
        "as": "value"
      },
      "7c2vt3d": {
        "from": "7c2vt3d",
        "to": "24q0egm",
        "as": "min"
      },
      "t1deznd": {
        "from": "t1deznd",
        "to": "0i85qjj",
        "as": "_sliderval"
      },
      "sv49nso": {
        "from": "sv49nso",
        "to": "c74vowk",
        "as": "value"
      },
      "ezx9hxj": {
        "from": "ezx9hxj",
        "to": "old0t0c",
        "as": "args"
      },
      "old0t0c": {
        "from": "old0t0c",
        "to": "24q0egm",
        "as": "oninput"
      },
      "vgishln": {
        "from": "vgishln",
        "to": "ewycyaq",
        "as": "value"
      },
      "gibdj45": {
        "from": "gibdj45",
        "to": "parseval",
        "as": "val"
      },
      "parseval": {
        "from": "parseval",
        "to": "ezx9hxj",
        "as": "value"
      },
      "n4i4t17": {
        "from": "n4i4t17",
        "to": "7hff44y",
        "as": "value"
      },
      "7hff44y": {
        "from": "7hff44y",
        "to": "y407zfo",
        "as": "value"
      },
      "y407zfo": {
        "from": "y407zfo",
        "to": "out",
        "as": "display"
      },
      "2wp8ffd": {
        "from": "2wp8ffd",
        "to": "old0t0c",
        "as": "fn"
      },
      "l5bzesi": {
        "from": "l5bzesi",
        "to": "2wp8ffd",
        "as": "arg0"
      },
      "4dh6wzn": {
        "from": "4dh6wzn",
        "to": "2wp8ffd",
        "as": "arg1"
      },
      "c74vowk": {
        "from": "c74vowk",
        "to": "24q0egm",
        "as": "value"
      },
      "blapbo4": {
        "from": "blapbo4",
        "to": "c74vowk",
        "as": "otherwise"
      },
      "8tugpnc": {
        "from": "8tugpnc",
        "to": "fn7qsxi",
        "as": "otherwise"
      },
      "fn7qsxi": {
        "from": "fn7qsxi",
        "to": "blapbo4",
        "as": "max"
      },
      "rxad35l": {
        "from": "rxad35l",
        "to": "k51obwl",
        "as": "otherwise"
      },
      "fohdjl3": {
        "from": "fohdjl3",
        "to": "k51obwl",
        "as": "value"
      },
      "k51obwl": {
        "from": "k51obwl",
        "to": "blapbo4",
        "as": "min"
      },
      "h6f5dw0": {
        "from": "h6f5dw0",
        "to": "avvpzh5",
        "as": "max"
      },
      "ygxb70y": {
        "from": "ygxb70y",
        "to": "avvpzh5",
        "as": "min"
      },
      "yo8jarp": {
        "from": "yo8jarp",
        "to": "ygxb70y",
        "as": "otherwise"
      },
      "kb6l0sn": {
        "from": "kb6l0sn",
        "to": "ygxb70y",
        "as": "value"
      },
      "2rjv9by": {
        "from": "2rjv9by",
        "to": "h6f5dw0",
        "as": "otherwise"
      },
      "v5bj4o0": {
        "from": "v5bj4o0",
        "to": "7135lyp",
        "as": "value"
      },
      "avvpzh5": {
        "from": "avvpzh5",
        "to": "7hff44y",
        "as": "otherwise"
      },
      "7135lyp": {
        "from": "7135lyp",
        "to": "h6f5dw0",
        "as": "value"
      },
      "d0lq01a": {
        "from": "d0lq01a",
        "to": "gfcxpmm",
        "as": "max"
      },
      "ecvb67i": {
        "from": "ecvb67i",
        "to": "gfcxpmm",
        "as": "min"
      },
      "hbbs5nk": {
        "from": "hbbs5nk",
        "to": "ecvb67i",
        "as": "otherwise"
      },
      "069irt7": {
        "from": "069irt7",
        "to": "ecvb67i",
        "as": "value"
      },
      "54kj5rw": {
        "from": "54kj5rw",
        "to": "d0lq01a",
        "as": "otherwise"
      },
      "90buk8f": {
        "from": "90buk8f",
        "to": "d0lq01a",
        "as": "value"
      },
      "kxuzh9y": {
        "from": "kxuzh9y",
        "to": "90buk8f",
        "as": "value"
      },
      "gfcxpmm": {
        "from": "gfcxpmm",
        "to": "ewycyaq",
        "as": "otherwise"
      },
      "39pwh53": {
        "from": "39pwh53",
        "to": "16b092x",
        "as": "value"
      },
      "8nwncub": {
        "from": "8nwncub",
        "to": "cpb7sy3",
        "as": "value"
      },
      "auybq8d": {
        "from": "auybq8d",
        "to": "8ujztxk",
        "as": "inpt"
      },
      "cpb7sy3": {
        "from": "cpb7sy3",
        "to": "fn7qsxi",
        "as": "value"
      },
      "8ujztxk": {
        "from": "8ujztxk",
        "to": "cpb7sy3",
        "as": "otherwise"
      },
      "n1h98h3": {
        "from": "n1h98h3",
        "to": "sy3nn9u",
        "as": "inpt"
      },
      "sy3nn9u": {
        "from": "sy3nn9u",
        "to": "90buk8f",
        "as": "otherwise"
      },
      "ze5bcmv": {
        "from": "ze5bcmv",
        "to": "o0rpwm4",
        "as": "inpt"
      },
      "o0rpwm4": {
        "from": "o0rpwm4",
        "to": "39pwh53",
        "as": "otherwise"
      },
      "9ecvhcn": {
        "from": "9ecvhcn",
        "to": "b0pgnet",
        "as": "inpt"
      },
      "b0pgnet": {
        "from": "b0pgnet",
        "to": "7135lyp",
        "as": "otherwise"
      }
    },
    "edges_in": {
      "out": {
        "j219svq": {
          "from": "j219svq",
          "to": "out",
          "as": "subscribe"
        },
        "0i85qjj": {
          "from": "0i85qjj",
          "to": "out",
          "as": "args"
        },
        "y407zfo": {
          "from": "y407zfo",
          "to": "out",
          "as": "value"
        }
      },
      "5mog0bc": {
        "24q0egm": {
          "from": "24q0egm",
          "to": "5mog0bc",
          "as": "props"
        }
      },
      "24q0egm": {
        "mpbvtrq": {
          "from": "mpbvtrq",
          "to": "24q0egm",
          "as": "type"
        },
        "yv0o41n": {
          "from": "yv0o41n",
          "to": "24q0egm",
          "as": "step"
        },
        "16b092x": {
          "from": "16b092x",
          "to": "24q0egm",
          "as": "max"
        },
        "7c2vt3d": {
          "from": "7c2vt3d",
          "to": "24q0egm",
          "as": "min"
        },
        "old0t0c": {
          "from": "old0t0c",
          "to": "24q0egm",
          "as": "oninput"
        },
        "c74vowk": {
          "from": "c74vowk",
          "to": "24q0egm",
          "as": "value"
        }
      },
      "y407zfo": {
        "sb9qdgy": {
          "from": "sb9qdgy",
          "to": "y407zfo",
          "as": "children"
        },
        "a6rdag9": {
          "from": "a6rdag9",
          "to": "y407zfo",
          "as": "props"
        },
        "7hff44y": {
          "from": "7hff44y",
          "to": "y407zfo",
          "as": "value"
        }
      },
      "yv0o41n": {
        "q09a315": {
          "from": "q09a315",
          "to": "yv0o41n",
          "as": "otherwise"
        },
        "z3jopgg": {
          "from": "z3jopgg",
          "to": "yv0o41n",
          "as": "value"
        }
      },
      "sb9qdgy": {
        "5mog0bc": {
          "from": "5mog0bc",
          "to": "sb9qdgy",
          "as": "arg1"
        },
        "doz740g": {
          "from": "doz740g",
          "to": "sb9qdgy",
          "as": "arg0"
        },
        "kyu6h8m": {
          "from": "kyu6h8m",
          "to": "sb9qdgy",
          "as": "arg2"
        }
      },
      "0i85qjj": {
        "u4k2auv": {
          "from": "u4k2auv",
          "to": "0i85qjj",
          "as": "label"
        },
        "t1deznd": {
          "from": "t1deznd",
          "to": "0i85qjj",
          "as": "_sliderval"
        }
      },
      "a6rdag9": {
        "sxjhepz": {
          "from": "sxjhepz",
          "to": "a6rdag9",
          "as": "style"
        }
      },
      "sxjhepz": {
        "93rx3ru": {
          "from": "93rx3ru",
          "to": "sxjhepz",
          "as": "display"
        },
        "q8ugbch": {
          "from": "q8ugbch",
          "to": "sxjhepz",
          "as": "flex-direction"
        }
      },
      "doz740g": {
        "racg3p7": {
          "from": "racg3p7",
          "to": "doz740g",
          "as": "text"
        }
      },
      "kyu6h8m": {
        "ewycyaq": {
          "from": "ewycyaq",
          "to": "kyu6h8m",
          "as": "text"
        }
      },
      "16b092x": {
        "a4y3jfa": {
          "from": "a4y3jfa",
          "to": "16b092x",
          "as": "otherwise"
        },
        "39pwh53": {
          "from": "39pwh53",
          "to": "16b092x",
          "as": "value"
        }
      },
      "39pwh53": {
        "9fk784a": {
          "from": "9fk784a",
          "to": "39pwh53",
          "as": "value"
        },
        "o0rpwm4": {
          "from": "o0rpwm4",
          "to": "39pwh53",
          "as": "otherwise"
        }
      },
      "7c2vt3d": {
        "r1ah7g2": {
          "from": "r1ah7g2",
          "to": "7c2vt3d",
          "as": "otherwise"
        },
        "fd7yax9": {
          "from": "fd7yax9",
          "to": "7c2vt3d",
          "as": "value"
        }
      },
      "c74vowk": {
        "sv49nso": {
          "from": "sv49nso",
          "to": "c74vowk",
          "as": "value"
        },
        "blapbo4": {
          "from": "blapbo4",
          "to": "c74vowk",
          "as": "otherwise"
        }
      },
      "old0t0c": {
        "ezx9hxj": {
          "from": "ezx9hxj",
          "to": "old0t0c",
          "as": "args"
        },
        "2wp8ffd": {
          "from": "2wp8ffd",
          "to": "old0t0c",
          "as": "fn"
        }
      },
      "ewycyaq": {
        "vgishln": {
          "from": "vgishln",
          "to": "ewycyaq",
          "as": "value"
        },
        "gfcxpmm": {
          "from": "gfcxpmm",
          "to": "ewycyaq",
          "as": "otherwise"
        }
      },
      "parseval": {
        "gibdj45": {
          "from": "gibdj45",
          "to": "parseval",
          "as": "val"
        }
      },
      "ezx9hxj": {
        "parseval": {
          "from": "parseval",
          "to": "ezx9hxj",
          "as": "value"
        }
      },
      "7hff44y": {
        "n4i4t17": {
          "from": "n4i4t17",
          "to": "7hff44y",
          "as": "value"
        },
        "avvpzh5": {
          "from": "avvpzh5",
          "to": "7hff44y",
          "as": "otherwise"
        }
      },
      "2wp8ffd": {
        "l5bzesi": {
          "from": "l5bzesi",
          "to": "2wp8ffd",
          "as": "arg0"
        },
        "4dh6wzn": {
          "from": "4dh6wzn",
          "to": "2wp8ffd",
          "as": "arg1"
        }
      },
      "fn7qsxi": {
        "8tugpnc": {
          "from": "8tugpnc",
          "to": "fn7qsxi",
          "as": "otherwise"
        },
        "cpb7sy3": {
          "from": "cpb7sy3",
          "to": "fn7qsxi",
          "as": "value"
        }
      },
      "blapbo4": {
        "fn7qsxi": {
          "from": "fn7qsxi",
          "to": "blapbo4",
          "as": "max"
        },
        "k51obwl": {
          "from": "k51obwl",
          "to": "blapbo4",
          "as": "min"
        }
      },
      "k51obwl": {
        "rxad35l": {
          "from": "rxad35l",
          "to": "k51obwl",
          "as": "otherwise"
        },
        "fohdjl3": {
          "from": "fohdjl3",
          "to": "k51obwl",
          "as": "value"
        }
      },
      "avvpzh5": {
        "h6f5dw0": {
          "from": "h6f5dw0",
          "to": "avvpzh5",
          "as": "max"
        },
        "ygxb70y": {
          "from": "ygxb70y",
          "to": "avvpzh5",
          "as": "min"
        }
      },
      "ygxb70y": {
        "yo8jarp": {
          "from": "yo8jarp",
          "to": "ygxb70y",
          "as": "otherwise"
        },
        "kb6l0sn": {
          "from": "kb6l0sn",
          "to": "ygxb70y",
          "as": "value"
        }
      },
      "h6f5dw0": {
        "2rjv9by": {
          "from": "2rjv9by",
          "to": "h6f5dw0",
          "as": "otherwise"
        },
        "7135lyp": {
          "from": "7135lyp",
          "to": "h6f5dw0",
          "as": "value"
        }
      },
      "7135lyp": {
        "v5bj4o0": {
          "from": "v5bj4o0",
          "to": "7135lyp",
          "as": "value"
        },
        "b0pgnet": {
          "from": "b0pgnet",
          "to": "7135lyp",
          "as": "otherwise"
        }
      },
      "gfcxpmm": {
        "d0lq01a": {
          "from": "d0lq01a",
          "to": "gfcxpmm",
          "as": "max"
        },
        "ecvb67i": {
          "from": "ecvb67i",
          "to": "gfcxpmm",
          "as": "min"
        }
      },
      "ecvb67i": {
        "hbbs5nk": {
          "from": "hbbs5nk",
          "to": "ecvb67i",
          "as": "otherwise"
        },
        "069irt7": {
          "from": "069irt7",
          "to": "ecvb67i",
          "as": "value"
        }
      },
      "d0lq01a": {
        "54kj5rw": {
          "from": "54kj5rw",
          "to": "d0lq01a",
          "as": "otherwise"
        },
        "90buk8f": {
          "from": "90buk8f",
          "to": "d0lq01a",
          "as": "value"
        }
      },
      "90buk8f": {
        "kxuzh9y": {
          "from": "kxuzh9y",
          "to": "90buk8f",
          "as": "value"
        },
        "sy3nn9u": {
          "from": "sy3nn9u",
          "to": "90buk8f",
          "as": "otherwise"
        }
      },
      "cpb7sy3": {
        "8nwncub": {
          "from": "8nwncub",
          "to": "cpb7sy3",
          "as": "value"
        },
        "8ujztxk": {
          "from": "8ujztxk",
          "to": "cpb7sy3",
          "as": "otherwise"
        }
      },
      "8ujztxk": {
        "auybq8d": {
          "from": "auybq8d",
          "to": "8ujztxk",
          "as": "inpt"
        }
      },
      "sy3nn9u": {
        "n1h98h3": {
          "from": "n1h98h3",
          "to": "sy3nn9u",
          "as": "inpt"
        }
      },
      "o0rpwm4": {
        "ze5bcmv": {
          "from": "ze5bcmv",
          "to": "o0rpwm4",
          "as": "inpt"
        }
      },
      "b0pgnet": {
        "9ecvhcn": {
          "from": "9ecvhcn",
          "to": "b0pgnet",
          "as": "inpt"
        }
      }
    }
  },
"export": {
    "id": "export",
    "out": "main/out",
      "category": "nodysseus",
    "nodes": {
      "args": {
        "id": "args"
      },
      "main/out": {
        "id": "main/out",
        "name": "export",
        "ref": "return"
      },
      "jklqh38": {
        "id": "jklqh38",
        "ref": "html_element"
      },
      "8dy573e": {
        "id": "8dy573e",
        "value": "a",
        "ref": "html_element"
      },
      "6qkew20": {
        "id": "6qkew20",
        "ref": "array"
      },
      "zihm1kd": {
        "id": "zihm1kd"
      },
      "2dz33fg": {
        "id": "2dz33fg",
        "value": "_new"
      },
      "n7aaoju": {
        "id": "n7aaoju",
        "value": "Export",
        "ref": "html_text"
      },
      "jdoak4g": {
        "id": "jdoak4g",
        "value": "return ns + '.json';",
        "ref": "script"
      },
      "3b7bnzm": {
        "id": "3b7bnzm",
        "ref": "state"
      },
      "ug26ugw": {
        "id": "ug26ugw",
        "value": "hrefstate.state",
        "name": "",
        "ref": "arg"
      },
      "pni2xuu": {
        "id": "pni2xuu",
        "value": "href",
        "ref": "log"
      },
      "pcx97n4": {
        "id": "pcx97n4",
        "value": "input",
        "ref": "html_element"
      },
      "rk7hcxc": {
        "id": "rk7hcxc"
      },
      "b8wohxv": {
        "id": "b8wohxv",
        "value": "select"
      },
      "x200f4j": {
        "id": "x200f4j",
        "value": "export-list"
      },
      "et5g0m1": {
        "id": "et5g0m1",
        "ref": "map"
      },
      "9tv13iq": {
        "id": "9tv13iq",
        "value": "return _lib.no.runtime.refs()",
        "ref": "script"
      },
      "dd6st1b": {
        "id": "dd6st1b",
        "value": "element",
        "ref": "arg",
      },
      "2yur4h7": {
        "id": "2yur4h7",
        "ref": "runnable",
      },
      "xdot36k": {
        "id": "xdot36k"
      },
      "1edrrwq": {
        "id": "1edrrwq",
        "value": "option",
        "ref": "html_element"
      },
      "skqnl08": {
        "id": "skqnl08",
        "ref": "html_text"
      },
      "3y8pyc2": {
        "id": "3y8pyc2",
        "value": "datalist",
        "ref": "html_element"
      },
      "tfwqhqf": {
        "id": "tfwqhqf",
        "value": "export-list"
      },
      "xp4pv1h": {
        "id": "xp4pv1h",
        "value": "return element",
        "ref": "script"
      },
      "i5wnhvh": {
        "id": "i5wnhvh",
        "ref": "ap"
      },
      "mp0ce5t": {
        "id": "mp0ce5t",
        "value": "hrefstate.set",
        "ref": "arg"
      },
      "zucq3k4": {
        "id": "zucq3k4"
      },
      "8470sfe": {
        "id": "8470sfe",
        "value": "return URL.createObjectURL(file)",
        "ref": "script"
      },
      "hke54sp": {
        "id": "hke54sp",
        "value": "return new Blob([json], {type: \"application/json\"})",
        "ref": "script"
      },
      "syfso39": {
        "id": "syfso39",
        "ref": "stringify"
      },
      "kaiwusy": {
        "id": "kaiwusy",
        "value": "mapout",
        "ref": "log"
      },
      "db0reg4": {
        "id": "db0reg4",
        "ref": "map"
      },
      "0pnyh3t": {
        "id": "0pnyh3t",
        "value": "mapin",
        "ref": "log"
      },
      "l4o1umt": {
        "id": "l4o1umt",
        "value": "return _lib.no.runtime.refs().filter(r => r.startsWith('@' + namespace + '.') || r === namespace)",
        "ref": "script"
      },
      "w78q6vm": {
        "id": "w78q6vm",
        "value": "ns",
        "ref": "log"
      },
      "959i120": {
        "id": "959i120",
        "ref": "runnable"
      },
      "a1vqjzz": {
        "id": "a1vqjzz",
        "value": "element",
        "ref": "arg"
      },
      "1148sh5": {
        "id": "1148sh5",
        "value": "2"
      },
      "1axuplc": {
        "id": "1axuplc",
        "value": "event.target.value",
        "ref": "arg",
      },
      "tad7830": {
        "id": "tad7830",
        "ref": "state",
      },
      "jdufmth": {
        "id": "jdufmth",
        "value": "namespace.state",
        "ref": "arg",
      },
      "91lhfar_arr": {
        "id": "91lhfar_arr",
        "ref": "array"
      },
      "91lhfar": {
        "id": "91lhfar",
        "ref": "ap"
      },
      "898n6f7": {
        "id": "898n6f7",
        "ref": "ap"
      },
      "9jvfgj1": {
        "id": "9jvfgj1",
        "value": "namespace.set",
        "ref": "arg",
      },
      "j2c518b": {
        "id": "j2c518b"
      },
      "qpiqhgp": {
        "id": "qpiqhgp",
        "value": "event.target.value",
        "ref": "arg",
      },
      "x8ik3x4": {
        "id": "x8ik3x4",
        "value": "const graph = {...ref};\ndelete graph._nodes_old;\ndelete graph._edges_old;\nreturn graph;",
        "ref": "script"
      },
      "6ag8lnc": {
        "id": "6ag8lnc"
      },
      "9rf8bds": {
        "id": "9rf8bds"
      },
      "690ivn1": {
        "id": "690ivn1",
        "value": "val",
        "ref": "log"
      },
      "zpv5bk2": {
        "id": "zpv5bk2"
      },
      "6dadrg0": {
        "id": "6dadrg0",
        "value": "event",
        "ref": "arg"
      },
      "i60dlmh": {
        "id": "i60dlmh"
      },
      "g7pa2bl": {
        "id": "g7pa2bl"
      },
      "8zvzwb5": {
        "id": "8zvzwb5",
        "value": "return _lib.no.runtime.get_ref(ref);",
        "ref": "script"
      }
    },
    "edges": {
      "args": {
        "from": "args",
        "to": "main/out",
        "as": "args"
      },
      "n7aaoju": {
        "from": "n7aaoju",
        "to": "8dy573e",
        "as": "children"
      },
      "jklqh38": {
        "from": "jklqh38",
        "to": "main/out",
        "as": "display"
      },
      "6qkew20": {
        "from": "6qkew20",
        "to": "jklqh38",
        "as": "children"
      },
      "8dy573e": {
        "from": "8dy573e",
        "to": "6qkew20",
        "as": "arg0"
      },
      "zihm1kd": {
        "from": "zihm1kd",
        "to": "8dy573e",
        "as": "props"
      },
      "2dz33fg": {
        "from": "2dz33fg",
        "to": "zihm1kd",
        "as": "target"
      },
      "tad7830": {
        "from": "tad7830",
        "to": "args",
        "as": "namespace"
      },
      "jdufmth": {
        "from": "jdufmth",
        "to": "jdoak4g",
        "as": "ns"
      },
      "jdoak4g": {
        "from": "jdoak4g",
        "to": "zihm1kd",
        "as": "download"
      },
      "3b7bnzm": {
        "from": "3b7bnzm",
        "to": "args",
        "as": "hrefstate"
      },
      "pni2xuu": {
        "from": "pni2xuu",
        "to": "zihm1kd",
        "as": "href"
      },
      "ug26ugw": {
        "from": "ug26ugw",
        "to": "pni2xuu",
        "as": "value"
      },
      "pcx97n4": {
        "from": "pcx97n4",
        "to": "6qkew20",
        "as": "arg2"
      },
      "rk7hcxc": {
        "from": "rk7hcxc",
        "to": "pcx97n4",
        "as": "props"
      },
      "b8wohxv": {
        "from": "b8wohxv",
        "to": "rk7hcxc",
        "as": "type"
      },
      "x200f4j": {
        "from": "x200f4j",
        "to": "rk7hcxc",
        "as": "list"
      },
      "3y8pyc2": {
        "from": "3y8pyc2",
        "to": "6qkew20",
        "as": "arg3"
      },
      "et5g0m1": {
        "from": "et5g0m1",
        "to": "3y8pyc2",
        "as": "children"
      },
      "9tv13iq": {
        "from": "9tv13iq",
        "to": "et5g0m1",
        "as": "array"
      },
      "2yur4h7": {
        "from": "2yur4h7",
        "to": "et5g0m1",
        "as": "fn"
      },
      "dd6st1b": {
        "from": "dd6st1b",
        "to": "xp4pv1h",
        "as": "element"
      },
      "xdot36k": {
        "from": "xdot36k",
        "to": "3y8pyc2",
        "as": "props"
      },
      "1edrrwq": {
        "from": "1edrrwq",
        "to": "2yur4h7",
        "as": "fn"
      },
      "skqnl08": {
        "from": "skqnl08",
        "to": "1edrrwq",
        "as": "children"
      },
      "xp4pv1h": {
        "from": "xp4pv1h",
        "to": "skqnl08",
        "as": "text"
      },
      "tfwqhqf": {
        "from": "tfwqhqf",
        "to": "xdot36k",
        "as": "id"
      },
      "zucq3k4": {
        "from": "zucq3k4",
        "to": "i5wnhvh",
        "as": "args"
      },
      "8470sfe": {
        "from": "8470sfe",
        "to": "zucq3k4",
        "as": "value"
      },
      "hke54sp": {
        "from": "hke54sp",
        "to": "8470sfe",
        "as": "file"
      },
      "syfso39": {
        "from": "syfso39",
        "to": "hke54sp",
        "as": "json"
      },
      "1148sh5": {
        "from": "1148sh5",
        "to": "syfso39",
        "as": "spacer"
      },
      "kaiwusy": {
        "from": "kaiwusy",
        "to": "syfso39",
        "as": "object"
      },
      "db0reg4": {
        "from": "db0reg4",
        "to": "kaiwusy",
        "as": "value"
      },
      "959i120": {
        "from": "959i120",
        "to": "db0reg4",
        "as": "fn"
      },
      "0pnyh3t": {
        "from": "0pnyh3t",
        "to": "db0reg4",
        "as": "array"
      },
      "l4o1umt": {
        "from": "l4o1umt",
        "to": "0pnyh3t",
        "as": "value"
      },
      "w78q6vm": {
        "from": "w78q6vm",
        "to": "l4o1umt",
        "as": "namespace"
      },
      "1axuplc": {
        "from": "1axuplc",
        "to": "w78q6vm",
        "as": "value"
      },
      "x8ik3x4": {
        "from": "x8ik3x4",
        "to": "959i120",
        "as": "fn"
      },
      "a1vqjzz": {
        "from": "a1vqjzz",
        "to": "8zvzwb5",
        "as": "ref"
      },
      "mp0ce5t": {
        "from": "mp0ce5t",
        "to": "i5wnhvh",
        "as": "fn"
      },
      "91lhfar": {
        "from": "91lhfar",
        "to": "rk7hcxc",
        "as": "onchange"
      },
      "i5wnhvh": {
        "from": "i5wnhvh",
        "to": "91lhfar_arr",
        "as": "arg1"
      },
      "898n6f7": {
        "from": "898n6f7",
        "to": "91lhfar_arr",
        "as": "arg0"
      },
      "91lhfar_arr": {
        "from": "91lhfar_arr",
        "to": "91lhfar",
        "as": "fn"
      },
      "9jvfgj1": {
        "from": "9jvfgj1",
        "to": "898n6f7",
        "as": "fn"
      },
      "qpiqhgp": {
        "from": "qpiqhgp",
        "to": "j2c518b",
        "as": "value"
      },
      "6ag8lnc": {
        "from": "6ag8lnc",
        "to": "2yur4h7",
        "as": "parameters"
      },
      "9rf8bds": {
        "from": "9rf8bds",
        "to": "6ag8lnc",
        "as": "element"
      },
      "690ivn1": {
        "from": "690ivn1",
        "to": "898n6f7",
        "as": "args"
      },
      "j2c518b": {
        "from": "j2c518b",
        "to": "690ivn1",
        "as": "value"
      },
      "zpv5bk2": {
        "from": "zpv5bk2",
        "to": "91lhfar",
        "as": "args"
      },
      "6dadrg0": {
        "from": "6dadrg0",
        "to": "zpv5bk2",
        "as": "event"
      },
      "i60dlmh": {
        "from": "i60dlmh",
        "to": "959i120",
        "as": "parameters"
      },
      "g7pa2bl": {
        "from": "g7pa2bl",
        "to": "i60dlmh",
        "as": "element"
      },
      "8zvzwb5": {
        "from": "8zvzwb5",
        "to": "x8ik3x4",
        "as": "ref"
      }
    }
  },
    "switch_inputs": {
      "id": "switch_inputs",
      "out": "out",
      "nodes": {
        "args": {
          "id": "args"
        },
        "8dy573e": {
          "id": "8dy573e",
          "ref": "html_element"
        },
        "out": {
          "id": "out",
          "name": "switch_inputs_local",
          "ref": "return"
        },
        "6280gtl": {
          "id": "6280gtl",
          "ref": "get"
        },
        "gqi2qi3": {
          "id": "gqi2qi3",
          "value": "select",
          "ref": "html_element"
        },
        "9r6mj9s": {
          "id": "9r6mj9s"
        },
        "8f9x43u": {
          "id": "8f9x43u",
          "ref": "ap"
        },
        "2j5rxq0": {
          "id": "2j5rxq0"
        },
        "q0h1zer": {
          "id": "q0h1zer",
          "value": "event.target.value",
          "ref": "arg"
        },
        "hyw65dk": {
          "id": "hyw65dk",
          "value": "_chosen.set",
          "ref": "arg"
        },
        "ddhrxjw": {
          "id": "ddhrxjw",
          "ref": "map"
        },
        "4ujfj58": {
          "id": "4ujfj58",
          "value": "return (object instanceof Map ? [...object.keys()] : Object.keys(object)).filter(k => !k.startsWith(\"_\"))",
          "ref": "script"
        },
        "s35ms5l": {
          "id": "s35ms5l",
          "value": "_args",
          "ref": "arg"
        },
        "jdajqk3": {
          "id": "jdajqk3",
          "ref": "runnable"
        },
        "evpcvvi": {
          "id": "evpcvvi",
          "value": "option",
          "ref": "html_element"
        },
        "86zvrx4": {
          "id": "86zvrx4",
          "value": "element",
          "ref": "arg"
        },
        "m24351r": {
          "id": "m24351r"
        },
        "1s77djh": {
          "id": "1s77djh",
          "value": "element",
          "ref": "arg"
        },
        "65wrg0t": {
          "id": "65wrg0t",
          "ref": "state"
        },
        "y5r6re6": {
          "id": "y5r6re6",
          "value": "_args",
          "ref": "arg"
        },
        "0adxu2g": {
          "id": "0adxu2g"
        },
        "vz8dmxf": {
          "id": "vz8dmxf"
        },
        "77z7u64": {
          "id": "77z7u64",
          "ref": "ap"
        },
        "4w1wh15": {
          "id": "4w1wh15",
          "value": "true"
        },
        "fob1r0t": {
          "id": "fob1r0t",
          "value": "_chosen.state",
          "ref": "arg"
        },
        "7uzzghh": {
          "id": "7uzzghh",
          "value": "_chosen.state",
          "ref": "arg"
        },
        "meoy2m1": {
          "id": "meoy2m1",
          "ref": "default"
        },
        "p53f7fz": {
          "id": "p53f7fz",
          "value": "return (args instanceof Map ? [...args.keys()] : Object.keys(args)).filter(k => !k.startsWith(\"_\"))[0];",
          "ref": "script"
        },
        "c8500l8": {
          "id": "c8500l8",
          "value": "_args",
          "ref": "arg"
        },
        "dqzwfa3": {
          "id": "dqzwfa3",
          "ref": "default"
        },
        "y1oibqk": {
          "id": "y1oibqk",
          "value": "return (args instanceof Map ? [...args.keys()] : Object.keys(args)).filter(k => !k.startsWith(\"_\"))[0];",
          "ref": "script"
        },
        "pbl7fry": {
          "id": "pbl7fry",
          "value": "_args",
          "ref": "arg"
        }
      },
      "edges": {
        "8dy573e": {
          "from": "8dy573e",
          "to": "out",
          "as": "display"
        },
        "args": {
          "from": "args",
          "to": "out",
          "as": "args"
        },
        "6280gtl": {
          "from": "6280gtl",
          "to": "77z7u64",
          "as": "fn"
        },
        "ddhrxjw": {
          "from": "ddhrxjw",
          "to": "gqi2qi3",
          "as": "children"
        },
        "9r6mj9s": {
          "from": "9r6mj9s",
          "to": "gqi2qi3",
          "as": "props"
        },
        "8f9x43u": {
          "from": "8f9x43u",
          "to": "9r6mj9s",
          "as": "onchange"
        },
        "hyw65dk": {
          "from": "hyw65dk",
          "to": "8f9x43u",
          "as": "fn"
        },
        "2j5rxq0": {
          "from": "2j5rxq0",
          "to": "8f9x43u",
          "as": "args"
        },
        "q0h1zer": {
          "from": "q0h1zer",
          "to": "2j5rxq0",
          "as": "value"
        },
        "jdajqk3": {
          "from": "jdajqk3",
          "to": "ddhrxjw",
          "as": "fn"
        },
        "4ujfj58": {
          "from": "4ujfj58",
          "to": "ddhrxjw",
          "as": "array"
        },
        "s35ms5l": {
          "from": "s35ms5l",
          "to": "4ujfj58",
          "as": "object"
        },
        "evpcvvi": {
          "from": "evpcvvi",
          "to": "jdajqk3",
          "as": "fn"
        },
        "m24351r": {
          "from": "m24351r",
          "to": "evpcvvi",
          "as": "props"
        },
        "86zvrx4": {
          "from": "86zvrx4",
          "to": "evpcvvi",
          "as": "children"
        },
        "1s77djh": {
          "from": "1s77djh",
          "to": "m24351r",
          "as": "value"
        },
        "gqi2qi3": {
          "from": "gqi2qi3",
          "to": "8dy573e",
          "as": "children"
        },
        "65wrg0t": {
          "from": "65wrg0t",
          "to": "args",
          "as": "_chosen"
        },
        "y5r6re6": {
          "from": "y5r6re6",
          "to": "6280gtl",
          "as": "target"
        },
        "0adxu2g": {
          "from": "0adxu2g",
          "to": "jdajqk3",
          "as": "parameters"
        },
        "vz8dmxf": {
          "from": "vz8dmxf",
          "to": "0adxu2g",
          "as": "element"
        },
        "77z7u64": {
          "from": "77z7u64",
          "to": "out",
          "as": "value"
        },
        "4w1wh15": {
          "from": "4w1wh15",
          "to": "77z7u64",
          "as": "run"
        },
        "fob1r0t": {
          "from": "fob1r0t",
          "to": "dqzwfa3",
          "as": "value"
        },
        "7uzzghh": {
          "from": "7uzzghh",
          "to": "meoy2m1",
          "as": "value"
        },
        "meoy2m1": {
          "from": "meoy2m1",
          "to": "6280gtl",
          "as": "path"
        },
        "c8500l8": {
          "from": "c8500l8",
          "to": "p53f7fz",
          "as": "args"
        },
        "p53f7fz": {
          "from": "p53f7fz",
          "to": "meoy2m1",
          "as": "otherwise"
        },
        "dqzwfa3": {
          "from": "dqzwfa3",
          "to": "9r6mj9s",
          "as": "arg0"
        },
        "pbl7fry": {
          "from": "pbl7fry",
          "to": "y1oibqk",
          "as": "args"
        },
        "y1oibqk": {
          "from": "y1oibqk",
          "to": "dqzwfa3",
          "as": "otherwise"
        }
      },
    },
    "store_file": {
      "id": "store_file",
      "category": "nodysseus",
      "nodes": [
        {
          "id": "args"
        },
        {
          "id": "8dy573e",
          "ref": "html_element"
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
          "id": "jmqcpll",
          "ref": "runnable"
        },
        {
          "id": "o9ukwn8",
          "value": "event.target.files.0",
          "ref": "arg"
        },
        {
          "id": "out",
          "name": "store_file",
          "ref": "return"
        },
        {
          "id": "1672j69",
          "value": "arrayBuffer",
          "ref": "call"
        },
        {
          "id": "qzp14wr",
          "value": "add_asset",
          "ref": "extern"
        },
        {
          "id": "v99fk3p",
          "ref": "array"
        },
        {
          "id": "y58g8pm",
          "value": "img",
          "ref": "html_element"
        },
        {
          "id": "pldugnx"
        },
        {
          "id": "ceomp2r",
          "ref": "array"
        },
        {
          "id": "uyspmvr",
          "value": "get_asset",
          "ref": "extern"
        },
        {
          "id": "psxdib2",
          "ref": "return"
        },
        {
          "id": "nxdj21x"
        },
        {
          "id": "gsrb9e6"
        },
        {
          "id": "4j186m3",
          "value": "50vh"
        },
        {
          "id": "rdt0k55",
          "value": "image/*"
        },
        {
          "id": "gi30q1h"
        },
        {
          "id": "0clgvk2",
          "value": "event.target.files.0.type",
          "ref": "arg"
        },
        {
          "id": "yj9sw4x",
          "value": "asset",
          "ref": "arg"
        },
        {
          "id": "c0gcfke",
          "value": "asset.data",
          "ref": "arg"
        },
        {
          "id": "qh60wjb",
          "value": "asset.type",
          "ref": "arg"
        },
        {
          "id": "ncih0ts",
          "value": "asset_id",
          "ref": "arg"
        },
        {
          "id": "zugbd71",
          "ref": "if"
        },
        {
          "id": "fmostjp",
          "value": "get_asset",
          "ref": "extern"
        },
        {
          "id": "hj6upcm",
          "ref": "array"
        },
        {
          "id": "eviegts",
          "value": "asset_id",
          "ref": "arg"
        },
        {
          "id": "kldqqu0",
          "value": "asset.type",
          "ref": "arg"
        },
        {
          "id": "ic7fy1m",
          "value": "asset.data",
          "ref": "arg"
        },
        {
          "id": "yx80n2x",
          "ref": "return"
        },
        {
          "id": "2qd7694",
          "value": "const blob = new Blob([data], {type: filetype})\nconst url = URL.createObjectURL(blob);\nreturn url",
          "ref": "script"
        },
        {
          "id": "5mfdcg0"
        },
        {
          "id": "izkowx6",
          "ref": "default"
        },
        {
          "id": "i6lfbjh",
          "value": "__graph_value",
          "ref": "arg"
        },
        {
          "id": "b444vmf",
          "ref": "default"
        },
        {
          "id": "lpet497",
          "value": "asset_id",
          "ref": "arg"
        },
        {
          "id": "lkz76u7",
          "value": "__graph_value",
          "ref": "arg"
        },
        {
          "id": "6t8kqs9",
          "ref": "default"
        },
        {
          "id": "ke8lvin",
          "value": "__graph_value",
          "ref": "arg"
        },
        {
          "id": "j7ct5iw",
          "value": "const blob = new Blob([data], {type: filetype})\nconst url = URL.createObjectURL(blob);\nreturn url",
          "ref": "script"
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
          "from": "qzp14wr",
          "to": "jmqcpll",
          "as": "fn"
        },
        {
          "from": "v99fk3p",
          "to": "qzp14wr",
          "as": "args"
        },
        {
          "from": "y58g8pm",
          "to": "arcnyff",
          "as": "arg2"
        },
        {
          "from": "ceomp2r",
          "to": "uyspmvr",
          "as": "args"
        },
        {
          "from": "nxdj21x",
          "to": "psxdib2",
          "as": "args"
        },
        {
          "from": "qgbinm2",
          "to": "arcnyff",
          "as": "arg0"
        },
        {
          "from": "psxdib2",
          "to": "pldugnx",
          "as": "src"
        },
        {
          "from": "pldugnx",
          "to": "y58g8pm",
          "as": "props"
        },
        {
          "from": "gsrb9e6",
          "to": "pldugnx",
          "as": "style"
        },
        {
          "from": "4j186m3",
          "to": "gsrb9e6",
          "as": "max-width"
        },
        {
          "from": "gi30q1h",
          "to": "v99fk3p",
          "as": "arg1"
        },
        {
          "from": "1672j69",
          "to": "gi30q1h",
          "as": "data"
        },
        {
          "from": "0clgvk2",
          "to": "gi30q1h",
          "as": "type"
        },
        {
          "from": "qh60wjb",
          "to": "j7ct5iw",
          "as": "filetype"
        },
        {
          "from": "c0gcfke",
          "to": "j7ct5iw",
          "as": "data"
        },
        {
          "from": "j7ct5iw",
          "to": "zugbd71",
          "as": "true"
        },
        {
          "from": "yj9sw4x",
          "to": "zugbd71",
          "as": "pred"
        },
        {
          "from": "yx80n2x",
          "to": "out",
          "as": "value"
        },
        {
          "from": "uyspmvr",
          "to": "nxdj21x",
          "as": "asset"
        },
        {
          "from": "zugbd71",
          "to": "psxdib2",
          "as": "value"
        },
        {
          "from": "hj6upcm",
          "to": "fmostjp",
          "as": "args"
        },
        {
          "from": "kldqqu0",
          "to": "2qd7694",
          "as": "filetype"
        },
        {
          "from": "ic7fy1m",
          "to": "2qd7694",
          "as": "data"
        },
        {
          "from": "2qd7694",
          "to": "yx80n2x",
          "as": "value"
        },
        {
          "from": "5mfdcg0",
          "to": "yx80n2x",
          "as": "args"
        },
        {
          "from": "fmostjp",
          "to": "5mfdcg0",
          "as": "asset"
        },
        {
          "from": "izkowx6",
          "to": "ceomp2r",
          "as": "arg0"
        },
        {
          "from": "i6lfbjh",
          "to": "izkowx6",
          "as": "otherwise"
        },
        {
          "from": "ncih0ts",
          "to": "izkowx6",
          "as": "value"
        },
        {
          "from": "lkz76u7",
          "to": "b444vmf",
          "as": "otherwise"
        },
        {
          "from": "lpet497",
          "to": "b444vmf",
          "as": "value"
        },
        {
          "from": "b444vmf",
          "to": "v99fk3p",
          "as": "arg0"
        },
        {
          "from": "6t8kqs9",
          "to": "hj6upcm",
          "as": "arg0"
        },
        {
          "from": "eviegts",
          "to": "6t8kqs9",
          "as": "value"
        },
        {
          "from": "ke8lvin",
          "to": "6t8kqs9",
          "as": "otherwise"
        }
      ],
      "out": "out"
    }
  },
  "edges": {
  }
}

Object.values(generic.nodes).map(graph => {
  if(graph.nodes && Array.isArray(graph.nodes)) {
    graph.nodes = Object.fromEntries(graph.nodes.map(g => [g.id, g]))
    graph.edges = Object.fromEntries(graph.edges.map(e => [e.from, e]))
  }
})

export default generic
