import set from 'just-safe-set';
import * as loki from 'lokijs';
import { openDB } from 'idb';
import * as ha from 'hyperapp';
import panzoom from 'panzoom';
import { forceSimulation, forceManyBody, forceCenter, forceLink, forceRadial, forceY, forceCollide, forceX } from 'd3-force';
import Fuse from 'fuse.js';
import { EditorView, basicSetup } from 'codemirror';
import { Compartment, EditorState } from '@codemirror/state';
import { language } from '@codemirror/language';
import { javascript } from '@codemirror/lang-javascript';
import { markdownLanguage, markdown } from '@codemirror/lang-markdown';

var generic = {
    "nodes": [
        {
            "id": "log",
            "description": "Prints value to console.log",
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
                    "id": "tag",
                    "ref": "arg",
                    "value": "tag"
                },
                {
                    "id": "graph_value",
                    "ref": "arg",
                    "value": "__graph_value"
                },
                {
                    "id": "out",
                    "args": [],
                    "script": "tag && console.log(tag); graph_value && console.log(graph_value); console.log(value); return value"
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
                    "from": "tag",
                    "to": "out",
                    "as": "tag"
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
        {
            "id": "math",
            "ref": "extern",
            "value": "extern.math"
        },
        {
            "id": "fetch",
            "name": "fetch",
            "description": "Uses the <a target='_blank' href='https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API'>Fetch API</a> to get data.",
            "ref": "extern",
            "value": "extern.fetch"
        },
        {
            "id": "call",
            "name": "call",
            "description": "Calls `self.fn` with `args`. If `self is not found, uses the node's context.",
            "ref": "extern",
            "value": "extern.call"
        },
        {
            "id": "stringify",
            "name": "stringify",
            "description": "<a target='_blank' href='https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify'>JSON.stringify</a> the `value` argument",
            "ref": "extern",
            "value": "extern.stringify"
        },
        {
            "id": "parse",
            "name": "parse",
            "description": "<a target='_blank' href='https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify'>JSON.parse</a> the `value` argument",
            "ref": "extern",
            "value": "extern.parse"
        },
        {
            "id": "add",
            "ref": "extern",
            "value": "extern.add",
            "description": "The javascript <a target='_blank' href='https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Addition'>+ operator</a>"
        },
        {
            "id": "mult",
            "ref": "extern",
            "value": "extern.mult",
            "description": "The javascript <a target='_blank' href='https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Multiplication'>* operator</a>"
        },
        {
            "id": "divide",
            "ref": "extern",
            "value": "extern.divide",
            "description": "The javascript <a target='_blank' href='https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Division'>/ operator</a>"
        },
        {
            "id": "negate",
            "ref": "extern",
            "value": "extern.negate",
            "description": "The javascript <a target='_blank' href='https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Subtraction'>- operator</a>"
        },
        {
            "id": "and",
            "ref": "extern",
            "value": "extern.and",
            "description": "The javascript <a target='_blank' href='https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Logical_AND'>&& operator</a>"
        },
        {
            "id": "liftarraypromise",
            "ref": "extern",
            "value": "extern.liftarraypromise",
            "description": "If an array contains a promise, wrap the whole array with `Promise.all`."
        },
        {
            "id": "typeof",
            "ref": "extern",
            "value": "extern.typeof",
            "description": "javascript typeof operator"
        },
        {
            "id": "ancestors",
            "out": "out",
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
                    "script": "const parents = (id) => (graph ?? _graph).edges.filter(e => e.to === id).flatMap(e => parents(e.from)).concat([id]); return parents(node ?? graph.out ?? 'out')"
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
        {
            "id": "append",
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
                    "script": "return array.concat(Array.isArray(item) ? item : [item])"
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
        {
            "id": "concat",
            "description": "Concats `items` to `array`.",
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
                    "script": "return (array ?? []).concat(items ?? [])"
                }
            ],
            "edges": [
                {
                    "from": "in",
                    "to": "out",
                    "as": "args"
                },
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
        {
            "id": "filter_eq",
            "name": "filter_eq",
            "description": "Filters `array` for items where `item.key` === `value`",
            "out": "lahq5z4",
            "nodes": [
                {
                    "id": "lahq5z4",
                    "args": [],
                    "name": "filter/out",
                    "script": "return arr.filter(v => v[key] === value)"
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
        {
            "id": "default",
            "out": "out",
            "description": "Returns `value` if it's defined, if not then returns `otherwise`",
            "nodes": [
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
                    "id": "otherwise",
                    "ref": "arg",
                    "value": "otherwise"
                },
                {
                    "id": "is_otherwise",
                    "ref": "script",
                    "value": "return otherwise !== undefined"
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
                    "from": "otherwise",
                    "to": "if_otherwise",
                    "as": "true"
                },
                {
                    "from": "otherwise",
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
                    "from": "value",
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
                    "from": "otherwise",
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
        {
            "id": "if_arg",
            "description": "If this node's `value` exists in the node's context, return the value from the `true` branch",
            "nodes": [
                {
                    "id": "name",
                    "ref": "arg",
                    "value": "__graph_value"
                },
                {
                    "id": "args",
                    "ref": "arg",
                    "value": "_args"
                },
                {
                    "id": "true",
                    "ref": "arg",
                    "value": "true"
                },
                {
                    "id": "get_name",
                    "ref": "get"
                },
                {
                    "id": "out",
                    "ref": "if"
                }
            ],
            "edges": [
                {
                    "from": "name",
                    "to": "get_name",
                    "as": "path"
                },
                {
                    "from": "args",
                    "to": "get_name",
                    "as": "target"
                },
                {
                    "from": "get_name",
                    "to": "out",
                    "as": "pred"
                }
            ]
        },
        {
            "id": "if",
            "out": "out",
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
                    "script": "return [text]"
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
            "edges": []
        },
        {
            "id": "runnable_return",
            "description": "Combines `return` and `runnable` into one node.",
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
            "value": "extern.runnable"
        },
        {
            "id": "ap",
            "ref": "extern",
            "value": "extern.ap"
        },
        {
            "id": "function",
            "description": "Creates a function from the `fn` input.",
            "nodes": [
                {
                    "id": "runnable",
                    "ref": "arg",
                    "value": "runnable"
                },
                {
                    "id": "out",
                    "script": "return (fnargs) => _lib.no.run(runnable.graph, runnable.fn, {...runnable.args, fnargs}, _lib)"
                }
            ],
            "edges": [
                {
                    "from": "runnable",
                    "to": "out",
                    "as": "runnable"
                }
            ]
        },
        {
            "id": "script",
            "description": "Runs this as a javascript function. `return` is needed at the end of the script to return anything.",
            "ref": "extern",
            "value": "extern.script"
        },
        {
            "id": "extern",
            "description": "Uses a function from the nodysseus extern library directly"
        },
        {
            "id": "resolve",
            "description": "Resolves any `Proxy` inputs and returns an object.",
            "ref": "extern",
            "value": "extern.resolve"
        },
        {
            "id": "array",
            "name": "array",
            "description": "Create an array from all the inputs in alphabetical order",
            "ref": "extern",
            "value": "extern.new_array"
        },
        {
            "id": "create_fn",
            "ref": "extern",
            "value": "extern.create_fn"
        },
        {
            "id": "merge_objects",
            "description": "Merge the keys of two objects, in descending alphabetical order priority (`Object.assign(...inputs)`).",
            "ref": "extern",
            "value": "extern.merge_objects"
        },
        {
            "id": "get",
            "description": "Get the value at the path of object. Accepts a `.` separated path e.g. get(target, 'a.b.c') returns target.a.b.c",
            "out": "out",
            "nodes": [
                {
                    "id": "target",
                    "ref": "arg",
                    "value": "target"
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
        {
            "id": "arg",
            "description": "Get an input to the graph this is a part of.",
            "ref": "extern",
            "value": "extern.arg"
        },
        {
            "id": "set_mutable",
            "description": "Sets `target` value at `path` to `value` and returns the object.",
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
        {
            "id": "set",
            "description": "Returns a new object with the property at `path` (or the node's value) on `target` set to `value`. Accepts a `.` separated path e.g. set(target, 'a.b', 'c') returns {...target, a: {...target.a, b: 'c'}}",
            "type": "(target: any, value: any, path: string) => any",
            "ref": "extern",
            "value": "extern.set"
        },
        {
            "id": "modify",
            "description": "Returns a new object with the property at `path` (or the node's value) on `target` modified with `fn`. Accepts a `.` separated path e.g. set(target, 'a.b', 'c') returns {...target, a: {...target.a, b: 'c'}}",
            "type": "(target: any, value: any, path: string) => any",
            "ref": "extern",
            "value": "extern.modify"
        },
        {
            "id": "delete",
            "description": "Deletes `target` property at `path`",
            "ref": "extern",
            "value": "extern.delete"
        },
        {
            "id": "cache",
            "description": "Stores the first value that's `!== undefined` and returns that value whenever called. If used within a `map`, `filter`, or `reduce` node, each iteration's value will be cached separately.",
            "out": "out",
            "nodes": [
                {
                    "id": "value",
                    "ref": "arg",
                    "value": "value"
                },
                {
                    "id": "graphid",
                    "ref": "arg",
                    "value": "__graphid"
                },
                {
                    "id": "recache",
                    "ref": "arg",
                    "value": "recache"
                },
                {
                    "id": "cachevalue_state",
                    "ref": "arg",
                    "value": "cachevalue.state"
                },
                {
                    "id": "pred_cache_state",
                    "ref": "script",
                    "value": "return !cachevaluestate || (recache !== false && recache !== undefined && (typeof recache !== 'object' || Object.keys(recache).length > 0))"
                },
                {
                    "id": "ap_cache_value",
                    "ref": "arg",
                    "value": "value"
                },
                {
                    "id": "ap_cache_args"
                },
                {
                    "id": "ap_cache_run",
                    "value": "true"
                },
                {
                    "id": "ap_cache_fn",
                    "ref": "arg",
                    "value": "cachevalue.set"
                },
                {
                    "id": "cache",
                    "ref": "ap"
                },
                {
                    "id": "if_cache_state",
                    "ref": "if"
                },
                {
                    "id": "cache_state",
                    "ref": "state"
                },
                {
                    "id": "cache_return_args"
                },
                {
                    "id": "cache_return",
                    "ref": "return"
                },
                {
                    "id": "out",
                    "ref": "return"
                }
            ],
            "edges": [
                {
                    "from": "ap_cache_value",
                    "to": "ap_cache_args",
                    "as": "value"
                },
                {
                    "from": "ap_cache_args",
                    "to": "cache",
                    "as": "args"
                },
                {
                    "from": "ap_cache_run",
                    "to": "cache",
                    "as": "run"
                },
                {
                    "from": "ap_cache_fn",
                    "to": "cache",
                    "as": "fn"
                },
                {
                    "from": "cachevalue_state",
                    "to": "pred_cache_state",
                    "as": "cachevaluestate"
                },
                {
                    "from": "recache",
                    "to": "pred_cache_state",
                    "as": "recache"
                },
                {
                    "from": "cachevalue_state",
                    "to": "if_cache_state",
                    "as": "false"
                },
                {
                    "from": "cache",
                    "to": "if_cache_state",
                    "as": "true"
                },
                {
                    "from": "pred_cache_state",
                    "to": "if_cache_state",
                    "as": "pred"
                },
                {
                    "from": "if_cache_state",
                    "to": "cache_return",
                    "as": "value"
                },
                {
                    "from": "cache_state",
                    "to": "cache_return_args",
                    "as": "cachevalue"
                },
                {
                    "from": "cache_return_args",
                    "to": "cache_return",
                    "as": "args"
                },
                {
                    "from": "cache_return",
                    "to": "out",
                    "as": "value"
                }
            ]
        },
        {
            "id": "isunchanged",
            "description": "Returns true if `value` is unchanged otherwise `false`.",
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
                    "script": "return {...fn, args: {...(fn.args ?? {}), a, b}}"
                },
                {
                    "id": "eq_fn",
                    "ref": "run"
                },
                {
                    "id": "cache",
                    "ref": "set_arg",
                    "value": "cached"
                },
                {
                    "id": "out",
                    "ref": "if"
                }
            ],
            "edges": [
                {
                    "from": "in",
                    "to": "out",
                    "as": "_"
                },
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
                    "from": "value",
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
                    "from": "eq_fn",
                    "to": "out",
                    "as": "pred"
                },
                {
                    "from": "eq_fn",
                    "to": "out",
                    "as": "true"
                },
                {
                    "from": "value",
                    "to": "cache",
                    "as": "value"
                },
                {
                    "from": "eq_fn",
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
        {
            "id": "run_path",
            "description": "Runs the node at `path` (or this node's value).Path is determined as a route from the output node of the graph",
            "out": "out",
            "nodes": [
                {
                    "id": "path",
                    "ref": "arg",
                    "value": "path"
                },
                {
                    "id": "value",
                    "ref": "arg",
                    "value": "__graph_value"
                },
                {
                    "id": "path_value",
                    "ref": "default"
                },
                {
                    "id": "args",
                    "ref": "arg",
                    "value": "_args",
                    "type": "internal"
                },
                {
                    "id": "runnable",
                    "script": "const parent = _lib.no.runtime.get_parent(_graph); const node_id = _lib.no.runtime.get_path(parent, path); return {fn: node_id, graph: parent, args: {...args, edge: args.edge ? {...args.edge, node_id: parent.id + '/' + node_id} : undefined}}"
                },
                {
                    "id": "run_runnable",
                    "ref": "run"
                },
                {
                    "id": "out",
                    "ref": "return"
                }
            ],
            "edges": [
                {
                    "from": "path",
                    "to": "path_value",
                    "as": "value"
                },
                {
                    "from": "value",
                    "to": "path_value",
                    "as": "otherwise"
                },
                {
                    "from": "path_value",
                    "to": "runnable",
                    "as": "path"
                },
                {
                    "from": "args",
                    "to": "runnable",
                    "as": "args"
                },
                {
                    "from": "runnable",
                    "to": "run_runnable",
                    "as": "runnable"
                },
                {
                    "from": "run_runnable",
                    "to": "out",
                    "as": "value"
                }
            ]
        },
        {
            "id": "get_arg",
            "description": "Gets the value at `path` (or this node's value) from the context. Similar to an arg node. Accepts a `.` separated path e.g. get(target, 'a.b.c') returns target.a.b.c",
            "nodes": [
                {
                    "id": "target",
                    "ref": "arg",
                    "value": "target"
                },
                {
                    "id": "path",
                    "ref": "arg",
                    "value": "path"
                },
                {
                    "id": "value_path",
                    "ref": "arg",
                    "value": "__graph_value"
                },
                {
                    "id": "def_path",
                    "ref": "default"
                },
                {
                    "id": "args",
                    "ref": "arg",
                    "value": "_args"
                },
                {
                    "id": "key",
                    "ref": "arg",
                    "value": "key"
                },
                {
                    "id": "key_def",
                    "ref": "default",
                    "value": ""
                },
                {
                    "id": "key_path",
                    "ref": "add"
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
                    "from": "in",
                    "to": "out",
                    "as": "input"
                },
                {
                    "from": "otherwise",
                    "to": "out",
                    "as": "def"
                },
                {
                    "from": "value_path",
                    "to": "def_path",
                    "as": "value"
                },
                {
                    "from": "path",
                    "to": "def_path",
                    "as": "otherwise"
                },
                {
                    "from": "def_path",
                    "to": "key_path",
                    "as": "a1"
                },
                {
                    "from": "key",
                    "to": "key_def",
                    "as": "value"
                },
                {
                    "from": "key_def",
                    "to": "key_path",
                    "as": "a2"
                },
                {
                    "from": "key_path",
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
        {
            "id": "state",
            "out": "out",
            "nodes": [
                {
                    "id": "graphid",
                    "ref": "arg",
                    "value": "__graphid"
                },
                {
                    "id": "path",
                    "value": "state"
                },
                {
                    "id": "state_val",
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
                    "ref": "script",
                    "value": "_lib.no.runtime.update_args(graphid, {[path]: value}); return value"
                },
                {
                    "id": "set_state_val_runnable",
                    "ref": "runnable"
                },
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
                    "ref": "return"
                }
            ],
            "edges": [
                {
                    "from": "graphid",
                    "to": "state_val",
                    "as": "graphid"
                },
                {
                    "from": "path",
                    "to": "state_val",
                    "as": "path"
                },
                {
                    "from": "graphid",
                    "to": "set_state_val",
                    "as": "graphid"
                },
                {
                    "from": "value",
                    "to": "set_state_val",
                    "as": "value"
                },
                {
                    "from": "path",
                    "to": "set_state_val",
                    "as": "path"
                },
                {
                    "from": "set_state_val",
                    "to": "set_state_val_runnable",
                    "as": "fn"
                },
                {
                    "from": "set_state_val_runnable",
                    "to": "out_atom",
                    "as": "set"
                },
                {
                    "from": "state_val",
                    "to": "out_atom",
                    "as": "state"
                },
                {
                    "from": "state_val",
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
        {
            "id": "set_arg",
            "description": "Sets the value at `path` (or this node's value) on this graph's context. If used within a `map`, `filter`, or `reduce`, the arg will be separate for each loop. This behaviour can be changed by passing in a `key` separately.",
            "out": "out_ret",
            "nodes": [
                {
                    "id": "value",
                    "ref": "arg",
                    "value": "value"
                },
                {
                    "id": "path",
                    "ref": "arg",
                    "value": "path"
                },
                {
                    "id": "graph",
                    "ref": "arg",
                    "value": "graph"
                },
                {
                    "id": "args",
                    "ref": "arg",
                    "value": "_args"
                },
                {
                    "id": "value_path",
                    "ref": "arg",
                    "value": "__graph_value"
                },
                {
                    "id": "graphid",
                    "ref": "arg",
                    "value": "__graphid"
                },
                {
                    "id": "def_path",
                    "ref": "default"
                },
                {
                    "id": "env",
                    "ref": "script",
                    "value": "return _lib.no.runtime.get_args(_lib.no.runtime.get_parent(graph ?? graphid))"
                },
                {
                    "id": "prev_value",
                    "ref": "get"
                },
                {
                    "id": "set_val",
                    "ref": "set"
                },
                {
                    "id": "update_args",
                    "ref": "script",
                    "value": "_lib.no.runtime.update_args(_lib.no.runtime.get_parent(graph ?? graphid), success); return success;"
                },
                {
                    "id": "on_false",
                    "script": "return value;"
                },
                {
                    "id": "on_true",
                    "ref": "arg",
                    "value": "value"
                },
                {
                    "id": "out",
                    "ref": "if"
                },
                {
                    "id": "out_ret",
                    "ref": "return"
                }
            ],
            "edges": [
                {
                    "from": "value_path",
                    "to": "def_path",
                    "as": "value"
                },
                {
                    "from": "path",
                    "to": "def_path",
                    "as": "otherwise"
                },
                {
                    "from": "def_path",
                    "to": "key_path",
                    "as": "a1"
                },
                {
                    "from": "def_path",
                    "to": "update_args",
                    "as": "path"
                },
                {
                    "from": "key",
                    "to": "key_def",
                    "as": "value"
                },
                {
                    "from": "key_def",
                    "to": "key_path",
                    "as": "a2"
                },
                {
                    "from": "def_path",
                    "to": "set_val",
                    "as": "path"
                },
                {
                    "from": "value",
                    "to": "set_val",
                    "as": "value",
                    "type": "resolve"
                },
                {
                    "from": "args",
                    "to": "env",
                    "as": "args"
                },
                {
                    "from": "graph",
                    "to": "env",
                    "as": "graph"
                },
                {
                    "from": "graphid",
                    "to": "env",
                    "as": "graphid"
                },
                {
                    "from": "graphid",
                    "to": "update_args",
                    "as": "graphid"
                },
                {
                    "from": "graph",
                    "to": "update_args",
                    "as": "graph"
                },
                {
                    "from": "env",
                    "to": "set_val",
                    "as": "target"
                },
                {
                    "from": "update_args",
                    "to": "on_false",
                    "as": "value"
                },
                {
                    "from": "on_false",
                    "to": "out",
                    "as": "false"
                },
                {
                    "from": "on_true",
                    "to": "out",
                    "as": "true"
                },
                {
                    "from": "env",
                    "to": "update_args",
                    "as": "env"
                },
                {
                    "from": "set_val",
                    "to": "update_args",
                    "as": "success"
                },
                {
                    "from": "update_args",
                    "to": "out",
                    "as": "pred"
                },
                {
                    "from": "out",
                    "to": "out_ret",
                    "as": "value"
                }
            ]
        },
        {
            "id": "set_arg_runnable",
            "description": "See set_arg",
            "out": "out",
            "nodes": [
                {
                    "id": "sa_value",
                    "ref": "arg",
                    "value": "value"
                },
                {
                    "id": "value_runnable",
                    "ref": "arg",
                    "value": "value_runnable"
                },
                {
                    "id": "key",
                    "ref": "arg",
                    "value": "key"
                },
                {
                    "id": "path",
                    "ref": "arg",
                    "value": "path"
                },
                {
                    "id": "value_path",
                    "ref": "arg",
                    "value": "__graph_value"
                },
                {
                    "id": "graph",
                    "ref": "arg",
                    "value": "_graph"
                },
                {
                    "id": "input_args",
                    "ref": "arg",
                    "value": "_args"
                },
                {
                    "id": "node_args",
                    "ref": "arg",
                    "value": "args"
                },
                {
                    "id": "inner_value",
                    "ref": "arg",
                    "value": "value"
                },
                {
                    "id": "_sa_value_args",
                    "ref": "set",
                    "value": "__args"
                },
                {
                    "id": "sa_value_args",
                    "ref": "script",
                    "value": "return {...target, __args: value}"
                },
                {
                    "id": "runnable_args"
                },
                {
                    "id": "unwrap_sa_value",
                    "ref": "extern",
                    "value": "extern.unwrap_proxy"
                },
                {
                    "id": "set_sa_value_args",
                    "ref": "set",
                    "value": "args"
                },
                {
                    "id": "run_sa_value",
                    "ref": "run"
                },
                {
                    "id": "def_path",
                    "ref": "default"
                },
                {
                    "id": "log_def_path",
                    "ref": "log",
                    "value": "logdefpath"
                },
                {
                    "id": "set",
                    "ref": "set_arg"
                },
                {
                    "id": "out",
                    "ref": "runnable"
                }
            ],
            "edges": [
                {
                    "from": "key",
                    "to": "set",
                    "as": "key"
                },
                {
                    "from": "sa_value",
                    "to": "unwrap_sa_value",
                    "as": "proxy"
                },
                {
                    "from": "node_args",
                    "to": "sa_value_args",
                    "as": "target"
                },
                {
                    "from": "input_args",
                    "to": "sa_value_args",
                    "as": "value"
                },
                {
                    "from": "value_runnable",
                    "to": "set_sa_value_args",
                    "as": "target"
                },
                {
                    "from": "sa_value_args",
                    "to": "set_sa_value_args",
                    "as": "value"
                },
                {
                    "from": "input_args",
                    "to": "_set_sa_value_args",
                    "as": "value"
                },
                {
                    "from": "set_sa_value_args",
                    "to": "run_sa_value",
                    "as": "runnable"
                },
                {
                    "from": "run_sa_value",
                    "to": "set",
                    "as": "value"
                },
                {
                    "from": "value_path",
                    "to": "def_path",
                    "as": "value"
                },
                {
                    "from": "path",
                    "to": "def_path",
                    "as": "otherwise"
                },
                {
                    "from": "unwrap_sa_value",
                    "to": "runnable_args",
                    "as": "value_runnable"
                },
                {
                    "from": "def_path",
                    "to": "log_def_path",
                    "as": "value"
                },
                {
                    "from": "def_path",
                    "to": "runnable_args",
                    "as": "path"
                },
                {
                    "from": "graph",
                    "to": "runnable_args",
                    "as": "graph"
                },
                {
                    "from": "runnable_args",
                    "to": "out",
                    "as": "args"
                },
                {
                    "from": "set",
                    "to": "out",
                    "as": "fn"
                }
            ]
        },
        {
            "id": "publish_event",
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
                    "value": "event_name"
                },
                {
                    "id": "update_data",
                    "ref": "arg",
                    "value": "event_data"
                },
                {
                    "id": "name",
                    "ref": "default"
                },
                {
                    "id": "update",
                    "script": "return _lib.no.runtime.publish(event_name, {data: event_data})"
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
                    "to": "ap_args",
                    "as": "event_name"
                },
                {
                    "from": "value",
                    "to": "ap_args",
                    "as": "event_data"
                },
                {
                    "from": "update_event",
                    "to": "update",
                    "as": "event_name"
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
        {
            "id": "event_publisher_onchange",
            "description": "Publishes a `name` (or this node's value) event with the data `value` when `value` changes.",
            "out": "out",
            "nodes": [
                {
                    "id": "value",
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
                    "script": "return _lib.compare(a, b)"
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
                    "from": "value",
                    "to": "out",
                    "as": "true"
                }
            ]
        },
        {
            "id": "input_value",
            "description": "Displays the last `value` received. Will display \"undefined\" if this node has not been run.",
            "out": "out",
            "nodes": [
                {
                    "id": "out",
                    "name": "input_value",
                    "ref": "return"
                },
                {
                    "id": "cfuymky",
                    "value": "{\"a\": 1, \"b\": {\"c\": 2, \"d\": 3}}"
                },
                {
                    "id": "4d8qcss",
                    "ref": "html_text"
                },
                {
                    "id": "rpys4rr",
                    "value": "value",
                    "ref": "arg"
                },
                {
                    "id": "1znvqbi",
                    "value": "value",
                    "ref": "arg"
                },
                {
                    "id": "qwz3ftj",
                    "ref": "script",
                    "value": "return typeof object !== 'object' || Array.isArray(object) || Object.getPrototypeOf(object) === Object.prototype ? JSON.stringify(object) : Object.getPrototypeOf(object) ? Object.getPrototypeOf(object).constructor.name : `${object}`"
                },
                {
                    "id": "5a6pljw",
                    "value": "pre",
                    "ref": "html_element"
                },
                {
                    "id": "17pcf8z",
                    "value": "2"
                }
            ],
            "edges": [
                {
                    "from": "5a6pljw",
                    "to": "out",
                    "as": "display"
                },
                {
                    "from": "cfuymky",
                    "to": "args",
                    "as": "value"
                },
                {
                    "from": "4d8qcss",
                    "to": "5a6pljw",
                    "as": "children"
                },
                {
                    "from": "1znvqbi",
                    "to": "qwz3ftj",
                    "as": "object"
                },
                {
                    "from": "17pcf8z",
                    "to": "qwz3ftj",
                    "as": "spacer"
                },
                {
                    "from": "qwz3ftj",
                    "to": "4d8qcss",
                    "as": "text"
                },
                {
                    "from": "rpys4rr",
                    "to": "out",
                    "as": "value"
                }
            ]
        },
        {
            "id": "event_subscriber",
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
                    "value": "_data",
                    "type": "internal"
                },
                {
                    "id": "data_log",
                    "ref": "log"
                },
                {
                    "id": "add_listener",
                    "script": "_lib.no.runtime.add_listener(event ?? __graph_value, 'evt-listener-' + _graph.id, (data) => { let update = true; if(onevent){ update = _lib.no.run(onevent.graph, onevent.fn, {...onevent.args, data, prev}); } if(update){ _lib.no.runtime.update_args(_graph, {_data: data.data}) } }, false); return _lib.no.runtime.get_args(_graph)['_data'];"
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
                    "from": "data",
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
        {
            "id": "events_broadcast_channel",
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
                    "id": "out",
                    "script": "const bc = new BroadcastChannel('events'); bc.onmessage = e => { _lib.no.run(onmessage.graph, onmessage.fn, {message: e}, _lib); }; return bc;"
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
                    "to": "out",
                    "as": "onmessage"
                }
            ]
        },
        {
            "id": "run",
            "description": "Runs `runnable` and returns the result.",
            "out": "out",
            "nodes": [
                {
                    "id": "runnable",
                    "ref": "arg",
                    "value": "runnable"
                },
                {
                    "id": "out",
                    "script": "return _lib.no.run(runnable.graph, runnable.fn, runnable.args, _lib)"
                }
            ],
            "edges": [
                {
                    "from": "runnable",
                    "to": "out",
                    "as": "runnable"
                }
            ]
        },
        {
            "id": "reduce",
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
                    "script": "return (previous, current, index, array) => _lib.no.run(fn?.graph ?? _graph, fn?.fn ?? fn, Object.assign({}, args ?? {}, fn.args ?? {}, {previous, current, index, array, key: outer_key ? `${index}_${outer_key}` : `${index}`}), _lib);"
                },
                {
                    "id": "2lvs5dj",
                    "script": "return _graph",
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
        {
            "id": "map",
            "out": "out",
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
                    "id": "element",
                    "ref": "arg",
                    "value": "element"
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
                    "id": "append",
                    "ref": "script",
                    "value": "arr.push(value); return arr;"
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
                    "from": "append",
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
        {
            "id": "filter",
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
                    "value": "if(pred === true){ arr.push(value); } return arr;"
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
        {
            "id": "sequence",
            "description": "Create a new runnable that runs the input runnables in sequence.",
            "name": "sequence",
            "out": "out",
            "_ref": "extern",
            "_value": "sequence",
            "nodes": [
                {
                    "id": "args",
                    "ref": "arg",
                    "value": "_args"
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
                    "id": "seq_fold",
                    "ref": "fold"
                },
                {
                    "id": "out",
                    "ref": "runnable"
                }
            ],
            "edges": [
                {
                    "from": "args",
                    "to": "delete_args",
                    "as": "target"
                },
                {
                    "from": "delete_args",
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
                    "to": "seq_fold",
                    "as": "fn"
                },
                {
                    "from": "seq_fold",
                    "to": "out",
                    "as": "fn"
                }
            ]
        },
        {
            "id": "import_json",
            "description": "Imports the node or nodes found at the `url`.",
            "name": "import_json",
            "out": "lapeojg",
            "nodes": [
                {
                    "id": "lapeojg",
                    "script": "import_graph.forEach(_lib.no.runtime.add_ref); _lib.no.runtime.change_graph(_lib.no.runtime.get_graph(graphid))",
                    "name": "out"
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
                    "script": "return fetch(url);"
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
        {
            "id": "object_entries",
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
                    "id": "tkd4tqn",
                    "name": "in"
                },
                {
                    "id": "hfexsuu",
                    "script": "return !key?.startsWith('_');"
                },
                {
                    "id": "runnable",
                    "ref": "runnable"
                },
                {
                    "id": "bgi2g37",
                    "script": "return Object.entries(obj)"
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
                    "from": "tkd4tqn",
                    "to": "j8c79uf",
                    "as": "_",
                    "type": "ref"
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
        {
            "id": "css_styles",
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
                    "script": "return \"\\n\";"
                },
                {
                    "id": "vwsgweb",
                    "ref": "default"
                },
                {
                    "id": "aelf1a7",
                    "script": "return key + '{' + value + '}'",
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
                    "script": "return key.startsWith(\"@keyframes\")"
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
                    "id": "druspar",
                    "ref": "runnable"
                },
                {
                    "id": "gth1wc2",
                    "script": "return \"\\n\";"
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
                    "script": "return \"\\n\";"
                },
                {
                    "id": "y25dg2n",
                    "value": "element.1",
                    "ref": "arg"
                },
                {
                    "id": "0d4yh8u",
                    "script": "return key + ': ' + value + \";\";"
                },
                {
                    "id": "slj7ynn/vwsgweb",
                    "ref": "default"
                },
                {
                    "id": "slj7ynn/aelf1a7",
                    "script": "return key + '{' + value + '}'",
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
                    "script": "return \"\\n\";"
                },
                {
                    "id": "slj7ynn/y25dg2n",
                    "value": "element.1",
                    "ref": "arg"
                },
                {
                    "id": "slj7ynn/0d4yh8u",
                    "script": "return key + ': ' + value + \";\";"
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
        {
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
                    "script": "return \"input-\" + name;"
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
                            "script": "payload.stopPropagation();"
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
        {
            "id": "html_text",
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
        {
            "id": "html_element",
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
                    "script": "return !!(element_dt || element_tv)"
                },
                {
                    "id": "filter_children_fn_runnable",
                    "ref": "runnable"
                },
                {
                    "id": "fill_children_fn",
                    "script": "return element.el ?? element"
                },
                {
                    "id": "fill_children_fn_runnable",
                    "ref": "runnable"
                },
                {
                    "id": "wrapped_children",
                    "script": "return Array.isArray(children) ? children : [children]"
                },
                {
                    "id": "filter_children",
                    "ref": "filter"
                },
                {
                    "id": "fill_children",
                    "ref": "map",
                    "_script": "return children === undefined ? [] : children.length !== undefined ? children.map(c => _lib.no.resolve(c)).filter(c => !!c).map(c => c.el ?? c) : [children.el ?? children.value ?? children]"
                },
                {
                    "id": "fill_props",
                    "script": "return props ?? {}"
                },
                {
                    "id": "dom_type_def",
                    "ref": "default"
                },
                {
                    "id": "out",
                    "script": "if(!(typeof dom_type === 'string' && typeof children === 'object')){ throw new Error('invalid element');} return {dom_type, props, children: children, memo, value}"
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
                    "to": "filter_children",
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
                    "from": "filter_children",
                    "to": "fill_children",
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
        {
            "id": "icon",
            "description": "A ionicon in hyperapp format.",
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
                    "from": "props",
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
        {
            "id": "not",
            "script": "return !target"
        },
        {
            "id": "walk_graph",
            "nodes": [
                {
                    "id": "args"
                },
                {
                    "id": "cfuymky",
                    "value": "testx"
                },
                {
                    "id": "5a6pljw",
                    "ref": "html_element"
                },
                {
                    "id": "out",
                    "name": "walk_graph",
                    "ref": "return"
                },
                {
                    "id": "5xlxejq",
                    "ref": "html_text"
                },
                {
                    "id": "8qkc61x",
                    "ref": "runnable"
                },
                {
                    "id": "dv0p0id",
                    "value": "walker",
                    "ref": "log"
                },
                {
                    "id": "dqs1arj",
                    "value": "graph",
                    "name": "",
                    "ref": "arg"
                },
                {
                    "id": "pe7geox",
                    "value": "return _lib.no.runtime.get_edges_in(graph.graph, graph.node)",
                    "ref": "script"
                },
                {
                    "id": "glnadhk",
                    "value": "return {node: _node.id, graph: _graph.id}",
                    "ref": "script"
                },
                {
                    "id": "yophjcb",
                    "ref": "map"
                },
                {
                    "id": "r3nrc31",
                    "ref": "runnable"
                },
                {
                    "id": "nhqynsn",
                    "value": "element.from",
                    "ref": "arg"
                },
                {
                    "id": "y4eppvf",
                    "value": "graph.graph",
                    "ref": "arg"
                },
                {
                    "id": "lxjljmp",
                    "value": "node",
                    "ref": "arg"
                },
                {
                    "id": "fo2ul3t",
                    "value": "fn",
                    "ref": "arg"
                },
                {
                    "id": "x2ieyic",
                    "ref": "walk_graph"
                },
                {
                    "id": "8kp4fri",
                    "value": "testz"
                },
                {
                    "id": "b8n58i0",
                    "value": "testa"
                },
                {
                    "id": "ik55pc7",
                    "value": "texty"
                },
                {
                    "id": "1ecvy51",
                    "value": "return {node: _lib.no.runtime.get_node(graph, edge_from), graph}",
                    "ref": "script"
                },
                {
                    "id": "27950jh"
                },
                {
                    "id": "deh12wg",
                    "value": "edge",
                    "ref": "arg"
                },
                {
                    "id": "sfwk3w6",
                    "value": "edge",
                    "ref": "log"
                },
                {
                    "id": "uw2yljj",
                    "value": "node",
                    "ref": "log"
                },
                {
                    "id": "dc70b7u",
                    "value": "element",
                    "ref": "arg"
                },
                {
                    "id": "fhqwbjg",
                    "value": "_lib.no.run(fn.graph, fn.fn, {node: node.node, edge}); return {graph: node.graph, node: node.node.id};",
                    "ref": "script"
                }
            ],
            "edges": [
                {
                    "from": "args",
                    "to": "out",
                    "as": "args"
                },
                {
                    "from": "5a6pljw",
                    "to": "out",
                    "as": "display"
                },
                {
                    "from": "cfuymky",
                    "to": "glnadhk",
                    "as": "arg0"
                },
                {
                    "from": "8kp4fri",
                    "to": "glnadhk",
                    "as": "arg1"
                },
                {
                    "from": "ik55pc7",
                    "to": "8kp4fri",
                    "as": "arg0"
                },
                {
                    "from": "5xlxejq",
                    "to": "5a6pljw",
                    "as": "children"
                },
                {
                    "from": "8qkc61x",
                    "to": "args",
                    "as": "fn"
                },
                {
                    "from": "dv0p0id",
                    "to": "8qkc61x",
                    "as": "fn"
                },
                {
                    "from": "glnadhk",
                    "to": "args",
                    "as": "graph"
                },
                {
                    "from": "dqs1arj",
                    "to": "pe7geox",
                    "as": "graph"
                },
                {
                    "from": "pe7geox",
                    "to": "yophjcb",
                    "as": "array"
                },
                {
                    "from": "r3nrc31",
                    "to": "yophjcb",
                    "as": "fn"
                },
                {
                    "from": "nhqynsn",
                    "to": "1ecvy51",
                    "as": "edge_from"
                },
                {
                    "from": "y4eppvf",
                    "to": "1ecvy51",
                    "as": "graph"
                },
                {
                    "from": "fo2ul3t",
                    "to": "fhqwbjg",
                    "as": "fn"
                },
                {
                    "from": "1ecvy51",
                    "to": "fhqwbjg",
                    "as": "node"
                },
                {
                    "from": "x2ieyic",
                    "to": "r3nrc31",
                    "as": "fn"
                },
                {
                    "from": "fhqwbjg",
                    "to": "x2ieyic",
                    "as": "graph"
                },
                {
                    "from": "yophjcb",
                    "to": "out",
                    "as": "return"
                },
                {
                    "from": "27950jh",
                    "to": "dv0p0id",
                    "as": "value"
                },
                {
                    "from": "sfwk3w6",
                    "to": "27950jh",
                    "as": "arg1"
                },
                {
                    "from": "deh12wg",
                    "to": "sfwk3w6",
                    "as": "value"
                },
                {
                    "from": "uw2yljj",
                    "to": "27950jh",
                    "as": "arg0"
                },
                {
                    "from": "lxjljmp",
                    "to": "uw2yljj",
                    "as": "value"
                },
                {
                    "from": "dc70b7u",
                    "to": "fhqwbjg",
                    "as": "edge"
                },
                {
                    "from": "b8n58i0",
                    "to": "glnadhk",
                    "as": "arg22"
                }
            ],
            "out": "out"
        },
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
                {
                    "id": "graphvalue",
                    "ref": "arg",
                    "value": "__graph_value"
                },
                {
                    "id": "graphvalue2",
                    "ref": "arg",
                    "value": "__graph_value"
                },
                {
                    "id": "graphvalue3",
                    "ref": "arg",
                    "value": "__graph_value"
                },
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
            ]
        },
        {
            "id": "import_module",
            "description": "Dynamically import an es6 module",
            "ref": "extern",
            "value": "extern.import_module"
        },
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
            ]
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
        },
        {
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
        },
        {
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
        {
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
        },
        {
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
};

const create_randid = ()=>Math.random().toString(36).substring(2, 9);
const flattenNode = (graph, levels = -1)=>{
    if (graph.nodes === undefined || levels === 0) {
        return graph;
    }
    // needs to not prefix base node because then flatten node can't run  next
    graph.id ? `${graph.id}/` : '';
    graph.id ? `${graph.name}/` : '';
    return graph.nodes.map((g)=>flattenNode(g, levels - 1)).reduce((acc, n)=>Object.assign({}, acc, {
            flat_nodes: acc.flat_nodes.concat(n.flat_nodes ? n.flat_nodes.flat() : []).map((fn)=>{
                // adjust for easy graph renaming
                if (fn.id === (graph.out || "out") && graph.name) {
                    fn.name = graph.name;
                }
                return fn;
            }),
            flat_edges: acc.flat_edges.map((e)=>n.flat_nodes ? e.to === n.id ? Object.assign({}, e, {
                    to: `${e.to}/${n.in || 'in'}`
                }) : e.from === n.id ? Object.assign({}, e, {
                    from: `${e.from}/${n.out || 'out'}`
                }) : e : e).flat().concat(n.flat_edges).filter((e)=>e !== undefined)
        }), Object.assign({}, graph, {
        flat_nodes: graph.nodes,
        flat_edges: graph.edges
    }));
};
const expand_node = (data)=>{
    var _node_edges_find;
    const nolib = data.nolib;
    const node_id = data.node_id;
    const node = data.display_graph.nodes.find((n)=>n.id === node_id);
    if (!(node && node.nodes)) {
        console.log('no nodes?');
        return {
            display_graph: data.display_graph,
            selected: [
                data.node_id
            ]
        };
    }
    const args_node = (_node_edges_find = node.edges.find((e)=>e.to === node.out && e.as === "args")) === null || _node_edges_find === void 0 ? void 0 : _node_edges_find.from;
    const flattened = flattenNode(node, 1);
    const new_id_map = flattened.flat_nodes.reduce((acc, n)=>nolib.no.runtime.get_node(data.display_graph, n.id) ? (acc[n.id] = create_randid(), acc) : n, {});
    var _new_id_map_e_from, _new_id_map_e_to;
    const new_display_graph = {
        nodes: data.display_graph.nodes.filter((n)=>n.id !== node_id).concat(flattened.flat_nodes.map((n)=>new_id_map[n.id] ? Object.assign({}, n, new_id_map[n.id]) : n)),
        edges: data.display_graph.edges.map((e)=>({
                ...e,
                from: (_new_id_map_e_from = new_id_map[e.from]) !== null && _new_id_map_e_from !== void 0 ? _new_id_map_e_from : e.from,
                to: ((_new_id_map_e_to = new_id_map[e.to]) !== null && _new_id_map_e_to !== void 0 ? _new_id_map_e_to : e.to === node_id) ? args_node : e.to
            })).concat(flattened.flat_edges)
    };
    var _new_id_map_node_out, _ref;
    return {
        display_graph: {
            ...data.display_graph,
            ...new_display_graph
        },
        selected: [
            (_ref = (_new_id_map_node_out = new_id_map[node.out]) !== null && _new_id_map_node_out !== void 0 ? _new_id_map_node_out : node.out) !== null && _ref !== void 0 ? _ref : 'out'
        ]
    };
};
const contract_node = (data, keep_expanded = false)=>{
    const nolib = data.nolib;
    const node = data.display_graph.nodes.find((n)=>n.id === data.node_id);
    const node_id = data.node_id;
    if (!node.nodes) {
        const inside_nodes = [
            Object.assign({}, node)
        ];
        const inside_node_map = new Map();
        inside_node_map.set(inside_nodes[0].id, inside_nodes[0]);
        const inside_edges = new Set();
        const q = data.display_graph.edges.filter((e)=>e.to === inside_nodes[0].id);
        let in_edge = [];
        let args_edge;
        while(q.length > 0){
            const e = q.shift();
            if (e.to === node.id && e.as === 'args') {
                args_edge = e;
            }
            in_edge.filter((ie)=>ie.from === e.from).forEach((ie)=>{
                inside_edges.add(ie);
            });
            in_edge = in_edge.filter((ie)=>ie.from !== e.from);
            const old_node = inside_nodes.find((i)=>e.from === i.id);
            let inside_node = old_node || Object.assign({}, data.display_graph.nodes.find((p)=>p.id === e.from));
            inside_node_map.set(inside_node.id, inside_node);
            inside_edges.add(e);
            if (!old_node) {
                delete inside_node.inputs;
                inside_nodes.push(inside_node);
            }
            if (!args_edge || e.from !== args_edge.from) {
                nolib.no.runtime.get_edges_in(data.display_graph, e.from).forEach((de)=>q.push(de));
            }
        }
        let in_node_id = args_edge ? args_edge.from : undefined;
        // just return the original graph if it's a single node 
        if (in_edge.find((ie)=>ie.to !== in_node_id) || inside_nodes.length < 2) {
            return {
                display_graph: data.display_graph,
                selected: [
                    data.node_id
                ]
            };
        }
        const out_node_id = data.node_id;
        const in_node = inside_node_map.get(in_node_id);
        let node_id_count = data.display_graph.nodes.filter((n)=>n.id === node_id).length;
        let final_node_id = node_id_count === 1 ? node_id : `${node_id}_${node_id_count}`;
        const edges = [];
        for (const e1 of inside_edges){
            edges.push({
                ...e1,
                from: e1.from.startsWith(node_id + "/") ? e1.from.substring(node_id.length + 1) : e1.from,
                to: e1.to.startsWith(node_id + "/") ? e1.to.substring(node_id.length + 1) : e1.to
            });
        }
        var _node_name;
        const new_display_graph = {
            nodes: data.display_graph.nodes.filter((n)=>n.id !== data.node_id).filter((n)=>keep_expanded || !inside_node_map.has(n.id)).concat([
                {
                    id: final_node_id,
                    name: (_node_name = node.name) !== null && _node_name !== void 0 ? _node_name : node.value,
                    in: in_node_id && in_node_id.startsWith(node_id + '/') ? in_node_id.substring(node_id.length + 1) : in_node_id,
                    out: out_node_id.startsWith(node_id + '/') ? out_node_id.substring(node_id.length + 1) : out_node_id,
                    nodes: inside_nodes.map((n)=>({
                            ...n,
                            id: n.id.startsWith(node_id + "/") ? n.id.substring(node_id.length + 1) : n.id
                        })),
                    edges
                }
            ]),
            edges: data.display_graph.edges.filter((e)=>keep_expanded || !(inside_node_map.has(e.from) && inside_node_map.has(e.to))).map((e)=>e.from === data.node_id ? {
                    ...e,
                    from: final_node_id
                } : e.to === in_node && in_node.id ? {
                    ...e,
                    to: final_node_id
                } : inside_node_map.has(e.to) ? {
                    ...e,
                    to: final_node_id
                } : e)
        };
        return {
            display_graph: {
                ...data.display_graph,
                ...new_display_graph
            },
            selected: [
                final_node_id
            ]
        };
    }
};
const findViewBox = (nodes, links, selected, node_el_width, htmlid, dimensions)=>{
    const visible_nodes = [];
    const visible_node_set = new Set();
    let selected_pos;
    links.forEach((l)=>{
        const el = document.getElementById(`link-${l.source.node_id}`);
        const info_el = document.getElementById(`edge-info-${l.source.node_id}`);
        if (el && info_el) {
            const source = {
                x: l.source.x - node_el_width * 0.5,
                y: l.source.y
            };
            const target = {
                x: l.target.x - node_el_width * 0.5,
                y: l.target.y
            };
            if (l.source.node_id === selected) {
                visible_nodes.push({
                    x: target.x,
                    y: target.y
                });
                visible_node_set.add(l.target.node_id);
            } else if (l.target.node_id === selected) {
                visible_nodes.push({
                    x: source.x,
                    y: source.y
                });
                visible_node_set.add(l.source.node_id);
            }
        }
    });
    links.forEach((l)=>{
        if (visible_node_set.has(l.target.node_id) && !visible_node_set.has(l.source.node_id)) {
            const source = {
                x: l.source.x - node_el_width * 0.5,
                y: l.source.y
            };
            visible_nodes.push({
                x: source.x,
                y: source.y
            });
        }
    });
    nodes.forEach((n)=>{
        const el = document.getElementById(`${htmlid}-${n.node_id}`);
        if (el) {
            const x = n.x - node_el_width * 0.5;
            const y = n.y;
            if (n.node_id === selected) {
                visible_nodes.push({
                    x,
                    y
                });
                selected_pos = {
                    x,
                    y
                };
            }
        }
    });
    const nodes_box = visible_nodes.reduce((acc, n)=>({
            min: {
                x: Math.min(acc.min.x, n.x - 24),
                y: Math.min(acc.min.y, n.y - 24)
            },
            max: {
                x: Math.max(acc.max.x, n.x + node_el_width * 0.5 - 24),
                y: Math.max(acc.max.y, n.y + 24)
            }
        }), {
        min: {
            x: selected_pos ? selected_pos.x - 96 : dimensions.x,
            y: selected_pos ? selected_pos.y - 256 : dimensions.y
        },
        max: {
            x: selected_pos ? selected_pos.x + 96 : -dimensions.x,
            y: selected_pos ? selected_pos.y + 128 : -dimensions.y
        }
    });
    const nodes_box_center = {
        x: (nodes_box.max.x + nodes_box.min.x) * 0.5,
        y: (nodes_box.max.y + nodes_box.min.y) * 0.5
    };
    const nodes_box_dimensions = {
        x: Math.max(dimensions.x * 0.5, Math.min(dimensions.x, nodes_box.max.x - nodes_box.min.x)),
        y: Math.max(dimensions.y * 0.5, Math.min(dimensions.y, nodes_box.max.y - nodes_box.min.y))
    };
    const center = !selected_pos ? nodes_box_center : {
        x: (selected_pos.x + nodes_box_center.x * 3) * 0.25,
        y: (selected_pos.y + nodes_box_center.y * 3) * 0.25
    };
    return {
        nodes_box_dimensions,
        center
    };
};
const ancestor_graph = (node_id, from_graph, nolib)=>{
    let edges_in;
    let queue = [
        node_id
    ];
    const graph = {
        nodes: [],
        edges: []
    };
    while(queue.length > 0){
        let node_id1 = queue.pop();
        graph.nodes.push({
            ...nolib.no.runtime.get_node(from_graph, node_id1)
        });
        edges_in = nolib.no.runtime.get_edges_in(from_graph, node_id1);
        graph.edges = graph.edges.concat(edges_in);
        edges_in.forEach((e)=>queue.push(e.from));
    }
    return graph;
};
const node_args = (nolib, ha, graph, node_id)=>{
    var _node_ref_nodes, _externfn_args;
    const node = nolib.no.runtime.get_node(graph, node_id);
    if (!node) {
        // between graph update and simulation update it's possible links are bad
        return [];
    }
    const node_ref = (node === null || node === void 0 ? void 0 : node.ref) ? nolib.no.runtime.get_ref(node.ref) : node;
    const edges_in = node_ref && nolib.no.runtime.get_edges_in(graph, node_id);
    const argslist_path = (node_ref === null || node_ref === void 0 ? void 0 : node_ref.nodes) && nolib.no.runtime.get_path(node_ref, "argslist");
    var _edges_in_filter_map;
    const nextIndexedArg = "arg" + ((_edges_in_filter_map = edges_in === null || edges_in === void 0 ? void 0 : edges_in.filter((l)=>{
        var _l_as;
        return ((_l_as = l.as) === null || _l_as === void 0 ? void 0 : _l_as.startsWith("arg")) && new RegExp("[0-9]+").test(l.as.substring(3));
    }).map((l)=>parseInt(l.as.substring(3)))) !== null && _edges_in_filter_map !== void 0 ? _edges_in_filter_map : []).reduce((acc, i)=>acc > i ? acc : i + 1, 0);
    const externfn = (node_ref === null || node_ref === void 0 ? void 0 : node_ref.ref) === "extern" && nolib.extern.get.fn({}, nolib, node_ref === null || node_ref === void 0 ? void 0 : node_ref.value);
    var _node_ref_nodes_filter_map_filter;
    const baseargs = !argslist_path && externfn ? externfn.args ? externfn.args : [
        'args'
    ] : (_node_ref_nodes_filter_map_filter = node_ref === null || node_ref === void 0 ? void 0 : (_node_ref_nodes = node_ref.nodes) === null || _node_ref_nodes === void 0 ? void 0 : _node_ref_nodes.filter((n)=>{
        var _n_value_split__toLowerCase, _n_value_split_, _n_value;
        return n.ref === "arg" && n.type !== "internal" && !((_n_value_split__toLowerCase = (_n_value_split_ = (_n_value = n.value) === null || _n_value === void 0 ? void 0 : _n_value.split(":")[1]) === null || _n_value_split_ === void 0 ? void 0 : _n_value_split_.toLowerCase()) === null || _n_value_split__toLowerCase === void 0 ? void 0 : _n_value_split__toLowerCase.includes("internal")) && !(Array.isArray(n.type) && n.type.includes("internal"));
    }).map((n)=>n.value).filter((a)=>a)) !== null && _node_ref_nodes_filter_map_filter !== void 0 ? _node_ref_nodes_filter_map_filter : [];
    var _edges_in_map;
    return [
        ...new Set(argslist_path ? nolib.no.runGraph(node_ref, argslist_path) : baseargs.filter((a)=>!a.includes('.') && !a.startsWith("_")).concat((_edges_in_map = edges_in === null || edges_in === void 0 ? void 0 : edges_in.map((e)=>e.as)) !== null && _edges_in_map !== void 0 ? _edges_in_map : []).concat((externfn === null || externfn === void 0 ? void 0 : (_externfn_args = externfn.args) === null || _externfn_args === void 0 ? void 0 : _externfn_args.includes("_node_args")) || baseargs.includes("_args") || node.ref === undefined && !node.value ? [
            nextIndexedArg
        ] : []))
    ];
};
const bfs = (graph, fn)=>{
    const visited = new Set();
    const iter = (id, level)=>{
        if (visited.has(id)) {
            return;
        }
        fn(id, level);
        visited.add(id);
        for (const e of graph.edges){
            if (e.to === id) {
                iter(e.from, level + 1);
            }
        }
    };
    return iter;
};
const calculateLevels = (nodes, links, graph, selected)=>{
    const find_childest = (n)=>{
        const e = graph.edges.find((ed)=>ed.from === n);
        if (e) {
            return find_childest(e.to);
        } else {
            return n;
        }
    };
    selected = selected[0];
    const top = find_childest(selected);
    const levels = new Map();
    bfs(graph, (id, level)=>levels.set(id, Math.min(levels.get(id) || Number.MAX_SAFE_INTEGER, level)))(top, 0);
    const parents = new Map(nodes.map((n)=>[
            n.node_id,
            links.filter((l)=>l.target.node_id === n.node_id).map((l)=>l.source.node_id)
        ]));
    [
        ...parents.values()
    ].forEach((nps)=>{
        nps.sort((a, b)=>parents.get(b).length - parents.get(a).length);
        for(let i = 0; i < nps.length * 0.5; i++){
            if (i % 2 === 1) {
                const tmp = nps[i];
                const endidx = nps.length - 1 - Math.floor(i / 2);
                nps[i] = nps[endidx];
                nps[endidx] = tmp;
            }
        }
    });
    const children = new Map(nodes.map((n)=>[
            n.node_id,
            links.filter((l)=>l.source.node_id === n.node_id).map((l)=>l.target.node_id)
        ]));
    const siblings = new Map(nodes.map((n)=>[
            n.node_id,
            [
                ...new Set(children.has(n.node_id) ? children.get(n.node_id).flatMap((c)=>parents.get(c) || []) : []).values()
            ]
        ]));
    const distance_from_selected = new Map();
    const connected_vertices = new Map();
    const calculate_selected_graph = (s, i, c)=>{
        const id = s;
        if (distance_from_selected.get(id) <= i) {
            return;
        }
        distance_from_selected.set(id, i);
        if (parents.has(s)) {
            parents.get(s).forEach((p)=>{
                calculate_selected_graph(p, i + 1);
            });
        }
        if (children.has(s)) {
            children.get(s).forEach((c)=>{
                calculate_selected_graph(c, i + 1);
            });
        }
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
        nodes_by_level: [
            ...levels.entries()
        ].reduce((acc, [n, l])=>(acc[l] ? acc[l].push(n) : acc[l] = [
                n
            ], acc), {}),
        connected_vertices
    };
};

const isNodeGraph = (n) => !!n.nodes;

const Nodysseus = () => {
    const isBrowser = typeof window !== 'undefined';
    const persistdb = new loki("nodysseus_persist.db", {
        env: isBrowser ? "BROWSER" : "NODEJS",
        persistenceMethod: "memory"
    });
    const refsdb = persistdb.addCollection("refs", {
        unique: [
            "id"
        ]
    });
    const db = new loki("nodysseus.db", {
        env: isBrowser ? "BROWSER" : "NODEJS",
        persistenceMethod: "memory"
    });
    const nodesdb = db.addCollection("nodes", {
        unique: [
            "id"
        ]
    });
    const statedb = db.addCollection("state", {
        unique: [
            "id"
        ]
    });
    const fnsdb = db.addCollection("fns", {
        unique: [
            "id"
        ]
    });
    const parentsdb = db.addCollection("parents", {
        unique: [
            "id"
        ]
    });
    if (isBrowser) {
        openDB("nodysseus", 2, {
            upgrade(db) {
                db.createObjectStore("assets");
            }
        }).then((db) => {
        });
    }
    return {
        refs: lokidbToStore(refsdb),
        parents: lokidbToStore(parentsdb),
        nodes: lokidbToStore(nodesdb),
        state: lokidbToStore(statedb),
        fns: lokidbToStore(fnsdb)
    };
};
const lokidbToStore = (collection) => {
    return {
        add: (id, data) => {
            const existing = collection.by("id", id);
            if (existing) {
                collection.update(Object.assign(existing, {
                    data
                }));
            }
            else {
                collection.insert({
                    id,
                    data
                });
            }
        },
        get: (id) => {
            var _collection_by;
            return (_collection_by = collection.by("id", id)) === null || _collection_by === void 0 ? void 0 : _collection_by.data;
        },
        remove: (id) => collection.remove(collection.by("id", id)),
        removeAll: () => collection.clear(),
        all: () => collection.where((_) => true).map((v) => v.data)
    };
};
const nodysseus = Nodysseus();
let resfetch = typeof fetch !== "undefined" ? fetch : (urlstr, params) => import('node:https').then((https) => new Promise((resolve, reject) => {
    const url = new URL(urlstr);
    const req = https.request({
        hostname: url.hostname,
        port: url.port,
        path: url.pathname + url.search,
        headers: params.headers,
        method: params.method.toUpperCase()
    }, async (response) => {
        const buffer = [];
        for await (const chunk of response) {
            buffer.push(chunk);
        }
        const data = Buffer.concat(buffer).toString();
        resolve(data);
    });
    if (params.body) {
        req.write(params.body);
    }
    req.end();
}));
function nodysseus_get(obj, propsArg, lib, defaultValue = undefined) {
    let objArg = obj;
    if (!obj) {
        return defaultValue;
    }
    const naive = obj[propsArg];
    if (naive) {
        return naive;
    }
    var props, prop;
    if (Array.isArray(propsArg)) {
        props = propsArg.slice(0);
    }
    if (typeof propsArg == 'string') {
        props = /\./.test(propsArg) ? propsArg.split('.') : [
            propsArg
        ];
    }
    if (typeof propsArg == 'symbol' || typeof propsArg === 'number') {
        props = [
            propsArg
        ];
    }
    if (!Array.isArray(props)) {
        throw new Error('props arg must be an array, a string or a symbol');
    }
    while (props.length) {
        if (obj) {
            const ran = run_runnable(obj, lib);
            if (ran === null || ran === void 0 ? void 0 : ran.__value) {
                obj = ran.__value;
                continue;
            }
        }
        if (obj && ispromise(obj)) {
            return obj.then((r) => props.length > 0 ? nodysseus_get(r, props.join('.'), lib, defaultValue) : r);
        }
        prop = props.length == 0 ? props[0] : props.shift();
        if (obj === undefined || typeof obj !== 'object' || obj[prop] === undefined && !(obj.hasOwnProperty && obj.hasOwnProperty(prop))) {
            return objArg && objArg.__args ? nodysseus_get(objArg.__args, propsArg, lib, defaultValue) : defaultValue;
        }
        obj = obj[prop];
        if (obj && ispromise(obj)) {
            return obj.then((r) => props.length > 0 ? nodysseus_get(r, props.join('.'), lib, defaultValue) : r);
        }
    }
    return obj;
}
function compare(value1, value2) {
    if (value1 === value2) {
        return true;
    }
    /* eslint-disable no-self-compare */ // if both values are NaNs return true
    if (value1 !== value1 && value2 !== value2) {
        return true;
    }
    if (!!value1 !== !!value2) {
        return false;
    }
    if (value1._Proxy || value2._Proxy) {
        return false;
    }
    if (typeof value1 !== typeof value2) {
        return false;
    }
    if (typeof value1 === 'function' || typeof value2 === 'function') {
        // no way to know if context of the functions has changed
        return false;
    }
    if (Array.isArray(value1)) {
        return compareArrays(value1, value2);
    }
    if (typeof value1 === 'object' && typeof value2 === 'object') {
        if (value1.fn && value1.fn === value2.fn && compare(value1.graph, value2.graph) && compare(value1.args, value2.args)) {
            return true;
        }
        if (value1 instanceof Map && value2 instanceof Map) {
            return compareArrays([
                ...value1.entries()
            ], [
                ...value2.entries()
            ]);
        }
        if (value1 instanceof Set && value2 instanceof Set) {
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
    if (value1._needsresolve || value2._needsresolve) {
        return false;
    }
    const keys1 = Object.keys(value1);
    const keys2 = Object.keys(value2);
    if (keys1.length !== keys2.length) {
        return false;
    }
    for (let key of keys1) {
        if (key === "__args") {
            continue;
        }
        if (value1[key] === value2[key]) {
            continue;
        }
        return false;
    }
    return true;
}
const hashcode = function (str, seed = 0) {
    let h1 = 0xdeadbeef ^ seed, h2 = 0x41c6ce57 ^ seed;
    let i = str.length, ch;
    while (i > 0) {
        i--;
        ch = str.charCodeAt(i);
        h1 = Math.imul(h1 ^ ch, 2654435761);
        h2 = Math.imul(h2 ^ ch, 1597334677);
    }
    h1 = Math.imul(h1 ^ h1 >>> 16, 2246822507) ^ Math.imul(h2 ^ h2 >>> 13, 3266489909);
    h2 = Math.imul(h2 ^ h2 >>> 16, 2246822507) ^ Math.imul(h1 ^ h1 >>> 13, 3266489909);
    return 4294967296 * (2097151 & h2) + (h1 >>> 0);
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
const node_value = (node) => {
    if (typeof node.value !== 'string') {
        return node.value;
    }
    if (node.value === "undefined") {
        return undefined;
    }
    if (typeof node.value === "string") {
        if (node.value.startsWith('"') && node.value.endsWith('"')) {
            return node.value.substring(1, node.value.length - 1);
        }
        if (node.value.startsWith('{') || node.value.startsWith('[')) {
            try {
                return JSON.parse(node.value.replaceAll("'", "\""));
            }
            catch (e) { }
        }
        if (node.value.match(/-?[0-9.]*/g)[0].length === node.value.length) {
            const float = parseFloat(node.value);
            if (!isNaN(float)) {
                return float;
            }
        }
        if (node.value === 'false' || node.value === 'true') {
            return node.value === 'true';
        }
    }
    return node.value;
};
const mockcombined = (data, graph_input_value) => {
    data.__args = graph_input_value;
    return data;
};
const node_nodes = (node, node_id, data, graph_input_value, lib) => {
    return run_graph(node, node_id, mockcombined(data, graph_input_value), lib);
};
const node_script = (node, nodeArgs, lib) => {
    let orderedargs = "";
    const data = {};
    let is_iv_promised = false;
    for (let i of Object.keys(nodeArgs)) {
        orderedargs += ", " + i;
        if (nodeArgs[i] !== undefined) {
            const graphval = run_runnable(nodeArgs[i], lib);
            data[i] = graphval;
            is_iv_promised || (is_iv_promised = ispromise(graphval));
        }
    }
    const name = node.name ? node.name.replace(/\W/g, "_") : node.id;
    var _node_script;
    const fn = lib.no.runtime.get_fn(node.id, name, `_lib, _node, _graph_input_value${orderedargs}`, (_node_script = node.script) !== null && _node_script !== void 0 ? _node_script : node.value);
    const result = is_iv_promised ? Promise.all(Object.keys(nodeArgs).map((iv) => Promise.resolve(data[iv]))).then((ivs) => {
        return lib.no.of(fn.apply(null, [
            lib,
            node,
            data,
            ...ivs.map((iv) => {
                return iv === null || iv === void 0 ? void 0 : iv.__value;
            })
        ]));
    }) : lib.no.of(fn.apply(null, [
        lib,
        node,
        data,
        ...Object.values(data).map((d) => {
            return d === null || d === void 0 ? void 0 : d.__value;
        })
    ]));
    return result;
};
const node_extern = (node, data, graphArgs, lib) => {
    const extern = nodysseus_get(lib, node.value, lib);
    let argspromise = false;
    const args = typeof extern === 'function' ? resolve_args(data, lib) : extern.args.map((arg) => {
        let newval;
        if (arg === '_node') {
            newval = node;
        }
        else if (arg === '_node_args') {
            newval = extern.rawArgs ? data : resolve_args(data, lib);
            newval = ispromise(newval) ? newval.then((v) => {
                return v === null || v === void 0 ? void 0 : v.__value;
            }) : extern.rawArgs ? newval : newval.__value;
        }
        else if (arg == '_lib') {
            newval = lib;
        }
        else if (arg == '_graph_input_value') {
            newval = graphArgs;
        }
        else {
            newval = extern.rawArgs ? data[arg] : run_runnable(data[arg], lib);
            newval = ispromise(newval) ? newval.then((v) => {
                return v === null || v === void 0 ? void 0 : v.__value;
            }) : newval && !extern.rawArgs ? newval.__value : newval;
        }
        argspromise || (argspromise = ispromise(newval));
        return newval;
    });
    argspromise || (argspromise = ispromise(args));
    if (argspromise) {
        return (Array.isArray(args) ? Promise.all(args) : args.then((v) => {
            return v === null || v === void 0 ? void 0 : v.__value.args;
        })).then((as) => {
            const res = (typeof extern === 'function' ? extern : extern.fn).apply(null, as);
            return extern.rawArgs ? res : lib.no.of(res);
        });
    }
    else {
        const res = (typeof extern === 'function' ? extern : extern.fn).apply(null, Array.isArray(args) ? args : args === null || args === void 0 ? void 0 : args.__value.args);
        return extern.rawArgs ? res : lib.no.of(res);
    }
};
const resolve_args = (data, lib) => {
    let is_promise = false;
    const result = {};
    Object.entries(data).forEach((kv) => {
        result[kv[0]] = run_runnable(kv[1], lib);
        is_promise = is_promise || !!kv[1] && ispromise(result[kv[0]]);
    });
    if (is_promise) {
        const promises = [];
        Object.entries(result).forEach((kv) => {
            promises.push(Promise.resolve(kv[1]).then((pv) => {
                return [
                    kv[0],
                    pv === null || pv === void 0 ? void 0 : pv.__value
                ];
            }));
        });
        return Promise.all(promises).then(Object.fromEntries).then((v) => lib.no.of(v));
    }
    return lib.no.of(Object.fromEntries(Object.entries(result).filter((d) => !d[0].startsWith("__")) // filter out private variables
        .map((e) => {
        var _e_;
        return [
            e[0],
            (_e_ = e[1]) === null || _e_ === void 0 ? void 0 : _e_.__value
        ];
    })));
};
const node_data = (nodeArgs, graphArgs, lib) => {
    return resolve_args(nodeArgs, lib);
};
// derives data from the args symbolic table
const create_data = (node_id, graph, inputs, graphArgs, lib) => {
    const data = {};
    let input;
    //TODO: remove
    const newgraphargs = graphArgs._output ? {
        ...graphArgs,
        _output: undefined
    } : graphArgs;
    // delete newgraphargs._output
    // grab inputs from state
    for (let i = 0; i < inputs.length; i++) {
        input = inputs[i];
        const val = {
            graph,
            fn: input.from,
            args: newgraphargs,
            isArg: true,
            __isnodysseus: true
        };
        // Check for duplicates
        if (data[input.as]) {
            const as_set = new Set();
            inputs.forEach((e) => {
                if (as_set.has(e.as)) {
                    throw new NodysseusError(graph.id + "/" + node_id, `Multiple input edges have the same label "${e.as}"`);
                }
                as_set.add(e.as);
            });
        }
        data[input.as] = val;
    }
    return data;
};
var _runnable_args;
const run_runnable = (runnable, lib) => {
    return !(runnable === null || runnable === void 0 ? void 0 : runnable.__isnodysseus) ? runnable : (runnable === null || runnable === void 0 ? void 0 : runnable.fn) && (runnable === null || runnable === void 0 ? void 0 : runnable.graph) ? run_graph(runnable.graph, runnable.fn, (_runnable_args = runnable.args) !== null && _runnable_args !== void 0 ? _runnable_args : {}, lib) : (runnable === null || runnable === void 0 ? void 0 : runnable.id) ? run_node(runnable, {}, {}, lib) : runnable;
};
// graph, node, symtable, parent symtable, lib
const run_node = (node, nodeArgs, graphArgs, lib) => {
    if (node.ref) {
        if (node.ref === "arg") {
            const resval = nolib.no.arg(node, graphArgs, lib, node.value);
            return resval && typeof resval === 'object' && Object.hasOwn(resval, "__value") ? resval : lib.no.of(resval);
        }
        else if (node.ref === "extern") {
            return node_extern(node, nodeArgs, graphArgs, lib);
        }
        else if (node.ref === "script") {
            return node_script(node, nodeArgs, lib);
        }
        let node_ref = lib.no.runtime.get_ref(node.ref);
        if (!node_ref) {
            throw new Error(`Unable to find ref ${node.ref} for node ${node.name || node.id}`);
        }
        const newGraphArgs = {
            _output: nodysseus_get(graphArgs, "_output", lib)
        };
        if (node_ref.nodes) {
            var _nodysseus_get;
            const graphid = (_nodysseus_get = nodysseus_get(graphArgs, "__graphid", lib)) === null || _nodysseus_get === void 0 ? void 0 : _nodysseus_get.__value;
            const newgraphid = (graphid ? graphid + "/" : "") + node.id;
            const current = lib.no.runtime.get_graph(newgraphid);
            lib.no.runtime.set_parent(newgraphid, graphid); // before so that change/update has the parent id
            if ((current === null || current === void 0 ? void 0 : current.refid) !== node_ref.id) {
                lib.no.runtime.change_graph({
                    ...node_ref,
                    id: newgraphid,
                    refid: node_ref.id
                });
            }
            else {
                lib.no.runtime.update_graph(newgraphid);
            }
            Object.assign(newGraphArgs, {
                __graphid: lib.no.of(newgraphid)
            });
        }
        return run_node(node_ref, {
            ...nodeArgs,
            __graph_value: lib.no.of(node.value)
        }, newGraphArgs, lib);
    }
    else if (node.nodes) {
        var _node_out;
        return node_nodes(node, (_node_out = node.out) !== null && _node_out !== void 0 ? _node_out : "out", nodeArgs, graphArgs, lib);
    }
    else if (node.fn && node.graph) {
        var _nodysseus_get1;
        const graphid1 = (_nodysseus_get1 = nodysseus_get(graphArgs, "__graphid", lib)) === null || _nodysseus_get1 === void 0 ? void 0 : _nodysseus_get1.__value;
        var _node_args;
        const nodegraphargs = (_node_args = node.args) !== null && _node_args !== void 0 ? _node_args : {};
        nodegraphargs.__graphid = graphid1 !== null && graphid1 !== void 0 ? graphid1 : lib.no.of(node.graph.id);
        nodegraphargs._output = nodysseus_get(graphArgs, "_output", lib);
        return node_nodes(node.graph, node.fn, nodeArgs, nodegraphargs, lib);
    }
    else if (node.script) {
        return node_script(node, nodeArgs, lib);
    }
    else if (Object.hasOwn(node, "value")) {
        return lib.no.of(node_value(node));
    }
    else if (Object.hasOwn(node, "__value")) {
        return node;
    }
    else {
        return node_data(nodeArgs, graphArgs, lib);
    }
};
// handles graph things like edges
const run_graph = (graph, node_id, graphArgs, lib) => {
    const node = lib.no.runtime.get_node(graph, node_id);
    try {
        const inputs = lib.no.runtime.get_edges_in(graph, node_id);
        lib.no.runtime.publish('noderun', {
            graph,
            node_id
        });
        const data = create_data(node_id, graph, inputs, graphArgs, lib);
        return run_node(node, data, graphArgs, lib);
    }
    catch (e) {
        console.log(`error in node`);
        if (e instanceof AggregateError) {
            e.errors.map(console.error);
        }
        else {
            console.error(e);
        }
        if (e instanceof NodysseusError) {
            lib.no.runtime.publish("grapherror", e);
            return;
        }
        const parentest = lib.no.runtime.get_parentest(graph);
        let error_node = parentest ? graph : node;
        lib.no.runtime.publish("grapherror", new NodysseusError(graph.id + "/" + error_node.id, e instanceof AggregateError ? "Error in node chain" : e));
    }
};
const ispromise = (a) => a && typeof a.then === 'function';
const getorset = (map, id, value_fn = undefined) => {
    let val = map.get(id);
    if (val) {
        return val;
    }
    else {
        let val1 = value_fn();
        if (val1 !== undefined) {
            map.set(id, val1);
        }
        return val1;
    }
};
const base_node = (node) => node.ref || node.extern ? {
    id: node.id,
    value: node.value,
    name: node.name,
    ref: node.ref
} : base_graph(node);
const base_graph = (graph) => ({
    id: graph.id,
    value: graph.value,
    name: graph.name,
    nodes: graph.nodes,
    edges: graph.edges,
    out: graph.out
});
const nolib = {
    no: {
        of: (value) => {
            return ispromise(value) ? value.then(nolib.no.of) : (value === null || value === void 0 ? void 0 : value.__value) ? value : {
                id: "out",
                __value: value,
                __isnodysseus: true
            };
        },
        arg: (node, target, lib, value) => {
            var _node_type, _node_type_includes, _node_type1, _node_type_includes1;
            let valuetype, nodevalue;
            if (value.includes(": ")) {
                const typedvalue = value.split(": ");
                nodevalue = typedvalue[0];
                valuetype = typedvalue[1];
            }
            else {
                nodevalue = value;
            }
            const newtarget = () => {
                const newt = Object.assign({}, target.__args);
                Object.keys(newt).forEach((k) => k.startsWith("_") && delete newt[k]);
                return newt;
            };
            const ret = nodevalue === undefined || target === undefined ? undefined : nodevalue === "_node" ? node : nodevalue.startsWith("_node.") ? nodysseus_get(node, nodevalue.substring("_node.".length), lib) : nodevalue.startsWith("_lib.") ? nodysseus_get(lib, nodevalue.substring("_lib.".length), lib) : nodevalue === "_args" ? newtarget() : nodysseus_get(node.type === "local" || ((_node_type = node.type) === null || _node_type === void 0 ? void 0 : (_node_type_includes = _node_type.includes) === null || _node_type_includes === void 0 ? void 0 : _node_type_includes.call(_node_type, "local")) ? newtarget() : node.type === "parent" || ((_node_type1 = node.type) === null || _node_type1 === void 0 ? void 0 : (_node_type_includes1 = _node_type1.includes) === null || _node_type_includes1 === void 0 ? void 0 : _node_type_includes1.call(_node_type1, "parent")) ? target.__args : target, nodevalue, lib);
            const retrun = (ret === null || ret === void 0 ? void 0 : ret.isArg) && valuetype !== "raw" ? run_runnable(ret, lib) : undefined;
            return ispromise(retrun) ? retrun.then((v) => {
                return v === null || v === void 0 ? void 0 : v.__value;
            }) : retrun ? retrun === null || retrun === void 0 ? void 0 : retrun.__value : ret;
        },
        base_graph,
        base_node,
        NodysseusError,
        runtime: function () {
            const new_graph_cache = (graph) => ({
                id: graph.id,
                graph,
                node_map: new Map(graph.nodes.map((n) => [
                    n.id,
                    n
                ])),
                in_edge_map: new Map(graph.nodes.map((n) => [
                    n.id,
                    graph.edges.filter((e) => e.to === n.id)
                ])),
                is_cached: new Set()
            });
            const event_listeners = new Map();
            const event_listeners_by_graph = new Map();
            const event_data = new Map(); // TODO: get rid of this
            const getorsetgraph = (graph, id, path, valfn) => getorset(get_cache(graph)[path], id, valfn);
            let animationframe;
            const publish = (event, data, lib) => {
                const runpublish = (data) => {
                    event_data.set(event, data);
                    if (event === "graphchange") {
                        const gcache = get_cache(data.id);
                        gcache.graph = data;
                    }
                    const listeners = getorset(event_listeners, event, () => new Map());
                    for (let l of listeners.values()) {
                        if (typeof l === "function") {
                            l(data);
                        }
                        else if (typeof l === "object" && l.fn && l.graph) {
                            run_graph(l.graph, l.fn, Object.assign({}, l.args || {}, {
                                data
                            }), lib);
                        }
                    }
                    if (event === "animationframe" && listeners.size > 0 && !animationframe) {
                        animationframe = requestAnimationFrame(() => {
                            animationframe = false;
                            publish("animationframe", {}, lib);
                        });
                    }
                };
                if (typeof data === "object" && ispromise(data)) {
                    data.then(runpublish);
                }
                else {
                    runpublish(data);
                }
                return data;
            };
            const add_listener = (event, listener_id, input_fn, remove, graph_id, prevent_initial_trigger, lib) => {
                const listeners = getorset(event_listeners, event, () => new Map());
                const fn = typeof input_fn === "function" ? input_fn : (args) => {
                    run_graph(input_fn.graph, input_fn.fn, {
                        ...args,
                        __args: input_fn.args
                    }, lib);
                };
                if (!listeners.has(listener_id)) {
                    if (!prevent_initial_trigger) {
                        requestAnimationFrame(() => {
                            if (event_data.has(event)) {
                                fn(event_data.get(event));
                            }
                        });
                    }
                    if (graph_id) {
                        const graph_id_listeners = getorset(event_listeners_by_graph, graph_id, () => new Map());
                        graph_id_listeners.set(event, listener_id);
                    }
                }
                if (remove) {
                    remove_listener(event, listener_id);
                }
                listeners.set(listener_id, fn);
                if (event === "animationframe") {
                    requestAnimationFrame(() => publish(event, {}, lib));
                }
            };
            const remove_listener = (event, listener_id) => {
                if (event === "*") {
                    [
                        ...event_listeners.values()
                    ].forEach((e) => e.delete(listener_id));
                }
                else {
                    const listeners = getorset(event_listeners, event, () => new Map());
                    listeners.delete(listener_id);
                }
            };
            const remove_graph_listeners = (graph_id) => {
                const graph_listeners = event_listeners_by_graph.get(graph_id);
                if (graph_listeners) {
                    for (const evt of graph_listeners.entries()) {
                        var _evt_;
                        getorset(event_listeners, (_evt_ = evt[0]) === null || _evt_ === void 0 ? void 0 : _evt_.delete(evt[1]));
                    }
                }
            };
            const delete_cache = (graph) => {
                if (graph) {
                    const graphid = typeof graph === "string" ? graph : graph.id;
                    // const nested = parentdb.find({ parent_id: graphid });
                    // nested.forEach((v) => nodysseus.nodes.remove(v.id));
                    nodysseus.nodes.remove(graphid);
                }
                else {
                    nodysseus.state.removeAll();
                    event_data.clear();
                }
            };
            const change_graph = (graph, lib) => {
                const new_cache = new_graph_cache(graph);
                const gcache = get_cache(graph.id);
                const old_graph = gcache && gcache.graph;
                const doc = get_cache(graph, new_cache);
                doc.graph = graph;
                doc.node_map = new_cache.node_map;
                doc.in_edge_map = new_cache.in_edge_map;
                doc.is_cached = new_cache.is_cached;
                if (lib) {
                    doc.lib = lib;
                }
                if (old_graph) {
                    for (const n of old_graph.nodes) {
                        if (get_node(graph, n.id) !== n) {
                            const nodegraphid = graph.id + "/" + n.id;
                            delete_cache(nodegraphid);
                        }
                    }
                }
                const parent = get_parentest(graph);
                if (parent) {
                    change_graph(parent, lib);
                }
                else {
                    nodysseus.refs.add(graph.id, graph.__isnodysseus ? graph : {
                        ...graph,
                        __isnodysseus: true
                    });
                    publish("graphchange", graph, lib);
                    publish("graphupdate", graph, lib);
                }
            };
            const update_args = (graph, args, lib) => {
                const graphid = typeof graph === "string" ? graph : graph.id;
                var _nodysseus_state_get;
                let prevargs = (_nodysseus_state_get = nodysseus.state.get(graphid)) !== null && _nodysseus_state_get !== void 0 ? _nodysseus_state_get : {};
                if (!prevargs) {
                    prevargs = {};
                    nodysseus.state.add(graphid, prevargs);
                }
                if (!compare(prevargs.data, args)) {
                    Object.assign(prevargs.data, args);
                    const fullgraph = get_graph(graphid);
                    var _get_parentest;
                    publish("graphupdate", (_get_parentest = get_parentest(fullgraph)) !== null && _get_parentest !== void 0 ? _get_parentest : fullgraph, lib);
                }
            };
            const get_ref = nodysseus.refs.get;
            const add_ref = (graph) => nodysseus.refs.add(graph.id, graph);
            const remove_ref = nodysseus.refs.remove;
            // const add_asset = nodysseus.assets.add
            // const get_asset = nodysseus.assets.get
            // const remove_asset = nodysseus.assets.remove
            const get_node = (graph, id) => getorsetgraph(graph, id, "node_map", () => get_graph(graph).nodes.find((n) => n.id === id));
            const get_edge = (graph, from) => get_cache(graph).graph.edges.find((e) => e.from === from);
            const get_edges_in = (graph, id) => getorsetgraph(graph, id, "in_edge_map", () => graph.edges.filter((e) => e.to === id));
            const get_edge_out = (graph, id) => get_cache(graph).graph.edges.find((e) => e.from === id);
            var _nodysseus_state_get_data;
            const get_args = (graph) => {
                var _nodysseus_state_get;
                return (_nodysseus_state_get_data = (_nodysseus_state_get = nodysseus.state.get(typeof graph === "string" ? graph : graph.id)) === null || _nodysseus_state_get === void 0 ? void 0 : _nodysseus_state_get.data) !== null && _nodysseus_state_get_data !== void 0 ? _nodysseus_state_get_data : {};
            };
            const get_graph = (graph) => {
                const cached = get_cache(graph);
                return ispromise(cached) ? cached.then((c) => c.graph) : cached ? cached.graph : typeof graph !== "string" ? graph : undefined;
            };
            const get_parent = (graph) => {
                const parent = nodysseus.parents.get(typeof graph === "string" ? graph : graph.id);
                return parent ? get_graph(parent.parent) : undefined;
            };
            const get_parentest = (graph) => {
                const parent = nodysseus.parents.get(typeof graph === "string" ? graph : graph.id);
                return parent && parent.parentest && get_graph(parent.parentest);
            };
            const get_cache = (graph, newgraphcache = undefined) => {
                const graphid = typeof graph === "string" ? graph : typeof graph === "object" ? graph.id : undefined;
                const lokiret = nodysseus.nodes.get(graphid);
                if (!lokiret && typeof graph === "object") {
                    const newcache = newgraphcache || new_graph_cache(graph);
                    nodysseus.nodes.add(newcache.id, newcache);
                    return newcache;
                }
                return lokiret;
            };
            const get_path = (graph, path) => {
                graph = get_graph(graph);
                let pathSplit = path.split(".");
                let node = graph.out || "out";
                while (pathSplit.length > 0 && node) {
                    let pathval = pathSplit.shift();
                    const edge = get_edges_in(graph, node).find((e) => e.as === pathval);
                    node = edge ? edge.from : undefined;
                }
                return node;
            };
            generic.nodes.map(add_ref);
            var _v_out;
            return {
                is_cached: (graph, id) => get_cache(graph.id),
                set_cached: (graph, id) => get_cache(graph.id).is_cached.add(id),
                get_ref,
                add_ref,
                remove_ref,
                // get_asset,
                // add_asset,
                // remove_asset,
                get_node,
                get_edge,
                get_edges_in,
                get_edge_out,
                get_parent,
                get_parentest,
                get_fn: (id, name, orderedargs, script) => {
                    const fnid = id + orderedargs;
                    let fn = nodysseus.fns.get(fnid);
                    if (!fn || fn.script !== script) {
                        fn = Object.assign(fn !== null && fn !== void 0 ? fn : {}, {
                            script,
                            fn: new Function(`return function _${name.replace(/(\s|\/)/g, "_")}(${orderedargs}){${script}}`)()
                        });
                        nodysseus.fns.add(fnid, fn);
                    }
                    return fn.fn;
                },
                change_graph,
                update_graph: (graphid, lib) => publish('graphupdate', {
                    graphid
                }, lib),
                update_args,
                delete_cache,
                get_graph,
                get_args,
                get_path,
                refs: () => nodysseus.refs.all().map((r) => r.id),
                ref_graphs: () => {
                    return nodysseus.refs.all().filter((v) => {
                        return isNodeGraph(v) && get_node(v, (_v_out = v === null || v === void 0 ? void 0 : v.out) !== null && _v_out !== void 0 ? _v_out : "out").ref === "return";
                    }).map((v) => v.id);
                },
                edit_edge: (graph, edge, old_edge, lib) => {
                    const gcache = get_cache(graph);
                    graph = gcache.graph;
                    gcache.in_edge_map.delete((old_edge || edge).to);
                    edge.as = edge.as || "arg0";
                    const new_graph = {
                        ...graph,
                        edges: graph.edges.filter((e) => !(e.to === (old_edge || edge).to && e.from === (old_edge || edge).from)).concat([
                            edge
                        ])
                    };
                    change_graph(new_graph, lib);
                },
                update_edges: (graph, add, remove = [], lib) => {
                    const gcache = get_cache(graph);
                    graph = gcache.graph;
                    const new_graph = {
                        ...graph,
                        edges: graph.edges.filter((e) => !remove.find((r) => r.from === e.from && r.to === e.to)).concat(add)
                    };
                    change_graph(new_graph, lib);
                },
                add_node: (graph, node, lib) => {
                    if (!(node && typeof node === "object" && node.id)) {
                        throw new Error(`Invalid node: ${JSON.stringify(node)}`);
                    }
                    const gcache = get_cache(graph);
                    graph = gcache.graph;
                    const new_graph = {
                        ...graph,
                        nodes: graph.nodes.filter((n) => n.id !== node.id).concat([
                            node
                        ])
                    };
                    // n.b. commented out because it blasts update_args which is not desirable
                    // delete_cache(graph)
                    change_graph(new_graph, lib);
                },
                delete_node: (graph, id, lib) => {
                    const gcache = get_cache(graph);
                    graph = gcache.graph;
                    const parent_edge = graph.edges.find((e) => e.from === id);
                    const child_edges = graph.edges.filter((e) => e.to === id);
                    const current_child_edges = graph.edges.filter((e) => e.to === parent_edge.to);
                    const new_child_edges = child_edges.map((e, i) => ({
                        ...e,
                        to: parent_edge.to,
                        as: i === 0 ? parent_edge.as : !e.as ? e.as : current_child_edges.find((ce) => ce.as === e.as && ce.from !== id) ? e.as + "1" : e.as
                    }));
                    const new_graph = {
                        ...graph,
                        nodes: graph.nodes.filter((n) => n.id !== id),
                        edges: graph.edges.filter((e) => e !== parent_edge && e.to !== id).concat(new_child_edges)
                    };
                    change_graph(new_graph, lib);
                },
                add_listener,
                add_listener_extern: {
                    args: [
                        "event",
                        "listener_id",
                        "fn"
                    ],
                    add_listener
                },
                remove_listener,
                remove_graph_listeners,
                publish: (event, data, lib) => publish(event, data, lib),
                set_parent: (graph, parent) => {
                    const graphid = graph;
                    const parentid = parent;
                    const parent_parent = nodysseus.parents.get(parentid);
                    const parentest = (parent_parent ? parent_parent.parentest : false) || parentid;
                    const new_parent = {
                        id: graphid,
                        parent: parentid,
                        parentest
                    };
                    nodysseus.parents.add(graphid, new_parent);
                },
                animate: () => {
                    publish("animationframe", {}, nolib);
                    requestAnimationFrame(() => nolib.no.runtime.animate());
                }
            };
        }()
    },
    extern: {
        // runGraph: F<A> => A
        ap: {
            rawArgs: true,
            args: [
                "fn",
                "args",
                "run",
                "_lib",
                "_graph_input_value"
            ],
            fn: (fn, args, run, lib, graph_input_value) => {
                var _run_runnable, _args_args;
                const runvalue = (_run_runnable = run_runnable(run, lib)) === null || _run_runnable === void 0 ? void 0 : _run_runnable.__value;
                const execute = (fn, fnr, rv, av) => {
                    if (fnr === undefined) {
                        return lib.no.of(undefined);
                    }
                    if ((av === null || av === void 0 ? void 0 : av.fn) && (av === null || av === void 0 ? void 0 : av.graph)) {
                        var _run_runnable;
                        av = (_run_runnable = run_runnable({
                            ...av,
                            args: {
                                ...av.args,
                                ...fn.args
                            }
                        }, lib)) === null || _run_runnable === void 0 ? void 0 : _run_runnable.__value;
                    }
                    const fnap = {
                        ...fnr,
                        args: {
                            // ...fn.args.__args,
                            ...fnr.args,
                            ...av,
                            __graphid: nodysseus_get(fnr.args, "__graphid", lib),
                            __args: {
                                ...fn.args.__args
                            }
                        }
                    };
                    return rv ? run_runnable(fnap, lib) : lib.no.of(fnap);
                };
                const execpromise = (fn, fnrg, rvg, avg) => {
                    const fnv = fnrg;
                    const rv = run_runnable(rvg, lib);
                    const av = run_runnable(avg, lib);
                    if (ispromise(fnv) || ispromise(rv) || ispromise(av)) {
                        return Promise.all([
                            fnv,
                            rv,
                            av
                        ]).then(([fnr, rv, av]) => {
                            return execute(fn, fnr === null || fnr === void 0 ? void 0 : fnr.__value, rv === null || rv === void 0 ? void 0 : rv.__value, av === null || av === void 0 ? void 0 : av.__value);
                        });
                    }
                    return execute(fn, fnv === null || fnv === void 0 ? void 0 : fnv.__value, rv === null || rv === void 0 ? void 0 : rv.__value, av === null || av === void 0 ? void 0 : av.__value);
                };
                const fnv = run_runnable(fn, lib);
                return runvalue ? execpromise(fn, fnv, run, args) : (args === null || args === void 0 ? void 0 : delete args.isArg, args === null || args === void 0 ? void 0 : (_args_args = args.args) === null || _args_args === void 0 ? void 0 : delete _args_args._output, lib.no.of({
                    "fn": "runfn",
                    "graph": {
                        "id": `run_${fn.fn}`,
                        "nodes": [
                            {
                                "id": "fnarg",
                                "ref": "arg",
                                "value": "fnr"
                            },
                            {
                                "id": "argsarg",
                                "ref": "arg",
                                "value": "argsr"
                            },
                            {
                                "id": "run",
                                "value": "true"
                            },
                            {
                                "id": "runfn",
                                "ref": "ap"
                            }
                        ],
                        "edges": [
                            {
                                "from": "fnarg",
                                "to": "runfn",
                                "as": "fn"
                            },
                            {
                                "from": "run",
                                "to": "runfn",
                                "as": "run"
                            },
                            {
                                "from": "argsarg",
                                "to": "runfn",
                                "as": "args"
                            }
                        ]
                    },
                    "args": {
                        fnr: fnv === null || fnv === void 0 ? void 0 : fnv.__value,
                        argsr: args
                    },
                    "__isnodysseus": true
                }));
            }
        },
        create_fn: {
            args: [
                "runnable",
                "_lib"
            ],
            fn: (runnable, lib) => {
                runnable.args.__args;
                const graph = ancestor_graph(runnable.fn, runnable.graph, lib);
                graph.id = runnable.fn + "-fn";
                const graphArgs = new Set(graph.nodes.filter((n) => n.ref === "arg").map((a) => a.value));
                for (const arg of graphArgs) {
                    nodysseus_get(runnable.args, arg, lib);
                }
                let text = "";
                const _extern_args = {};
                graph.nodes.forEach((n) => {
                    if (n.ref === "arg") {
                        return;
                    }
                    var _lib_no_runtime_get_ref;
                    const noderef = (_lib_no_runtime_get_ref = lib.no.runtime.get_ref(n.ref)) !== null && _lib_no_runtime_get_ref !== void 0 ? _lib_no_runtime_get_ref : n;
                    if (noderef.id === "script") {
                        // TODO: extract this logic from node_script
                        let inputs = graph.edges.filter((e) => e.to === n.id).map((edge) => ({
                            edge,
                            node: graph.nodes.find((n) => n.id === edge.from)
                        }));
                        var _n_script;
                        text += `function fn_${n.id}(){\n${inputs.map((input) => `let ${input.edge.as} = ${input.node.ref === "arg" ? `fnargs["${input.node.value}"]` : `fn_${input.node.id}()`};`).join("\n")}\n\n${(_n_script = n.script) !== null && _n_script !== void 0 ? _n_script : n.value}}\n\n`;
                    }
                    else if (noderef.ref == "extern") {
                        _extern_args[n.id] = {};
                        const extern = nodysseus_get(lib, noderef.value, lib);
                        let inputs1 = graph.edges.filter((e) => e.to === n.id).map((edge) => ({
                            edge,
                            node: graph.nodes.find((n) => n.id === edge.from)
                        }));
                        const varset = [];
                        extern.args.map((a) => {
                            if (a === "__graph_value" || a === "_node") {
                                _extern_args[n.id][a] = a === "__graph_value" ? n.value : n ;
                                varset.push(`let ${a} = _extern_args[${n.id}][${a}];`);
                            }
                            else if (a === "_node_args") {
                                varset.push(`let ${a} = {\n${inputs1.map((input) => `${input.edge.as}: ${input.node.ref === "arg" ? `fnargs.${input.node.value}` : `fn_${input.edge.from}()`}`).join(",\n")}};`);
                            }
                            else {
                                const input = inputs1.find((i) => i.edge.as === a);
                                const inputNode = graph.nodes.find((n) => n.id === input.edge.from);
                                varset.push(`let ${a} = ${inputNode.ref === "arg" ? `fnargs.${input.edge.as}` : `fn_${input.edge.from}()`};`);
                            }
                        });
                        text += `function fn_${n.id}(){\n${varset.join("\n")}\nreturn (${extern.fn.toString()})(${extern.args.join(", ")})}\n\n`;
                    }
                });
                graph.edges.filter((e) => e.to === runnable.fn);
                // for now just assumeing everything is an arg of the last node out
                // TODO: tree walk
                text += `return fn_${runnable.fn}()` //({${[...fninputs].map(rinput => `${rinput.as}: fnargs.${graph.nodes.find(n => n.id === rinput.from).value}`).join(",")}})`
                ;
                const fn = new Function("fnargs", text);
                return fn;
            }
        },
        switch: {
            rawArgs: true,
            args: [
                "input",
                "_node_args",
                "_lib"
            ],
            fn: (input, args, lib) => {
                const inputval = run_runnable(input, lib);
                return ispromise(inputval) ? inputval.then((ival) => {
                    return run_runnable(args[ival === null || ival === void 0 ? void 0 : ival.__value], lib);
                }) : run_runnable(args[inputval === null || inputval === void 0 ? void 0 : inputval.__value], lib);
            }
        },
        resolve: {
            rawArgs: false,
            args: [
                'object',
                '_lib'
            ],
            fn: (object, lib) => {
                return Object.fromEntries(Object.entries(object).map((e) => [
                    e[0],
                    run_runnable(e[1], lib)
                ]));
            }
        },
        fold: {
            rawArgs: true,
            args: [
                "fn",
                "object",
                "initial",
                "_lib"
            ],
            fn: (fn, object, initial, lib) => {
                if (Array.isArray(object) || ispromise(object)) {
                    debugger;
                }
                const foldvalue = (objectvalue) => {
                    var _run_runnable;
                    if (objectvalue === undefined)
                        return undefined;
                    const fnrunnable = fn;
                    const mapobjarr = (mapobj, mapfn, mapinit) => Array.isArray(mapobj) ? mapobj.reduce(mapfn, mapinit) : Object.entries(mapobj).sort((a, b) => a[0].localeCompare(b[0])).reduce(mapfn, mapinit);
                    var _run_runnable___value;
                    initial = (_run_runnable___value = (_run_runnable = run_runnable(initial, lib)) === null || _run_runnable === void 0 ? void 0 : _run_runnable.__value) !== null && _run_runnable___value !== void 0 ? _run_runnable___value : Array.isArray(objectvalue) ? [] : {};
                    const ret = mapobjarr(objectvalue, (previousValue, currentValue) => run_graph(fnrunnable.graph, fnrunnable.fn, mockcombined({
                        previousValue: lib.no.of(previousValue),
                        currentValue: lib.no.of(currentValue)
                    }, fnrunnable.args), lib).__value, initial);
                    return lib.no.of(ret);
                };
                const objectvalue = run_runnable(object, lib);
                return ispromise(objectvalue) ? objectvalue.then((ov) => foldvalue(ov.__value)) : foldvalue(objectvalue.__value);
            }
        },
        sequence: {
            rawArgs: true,
            args: [
                "_node_args",
                "_lib"
            ],
            fn: (_args, lib) => {
                const delayfn = (fn, args) => {
                    return lib.no.of({
                        "fn": "runfn",
                        "graph": {
                            "id": `run_${fn.fn}`,
                            "nodes": [
                                {
                                    "id": "fnarg",
                                    "ref": "arg",
                                    "value": "fn"
                                },
                                {
                                    "id": "argsarg",
                                    "ref": "arg",
                                    "value": "args"
                                },
                                {
                                    "id": "run",
                                    "value": "true"
                                },
                                {
                                    "id": "runfn",
                                    "ref": "ap"
                                }
                            ],
                            "edges": [
                                {
                                    "from": "fnarg",
                                    "to": "runfn",
                                    "as": "fn"
                                },
                                {
                                    "from": "run",
                                    "to": "runfn",
                                    "as": "run"
                                },
                                {
                                    "from": "argsarg",
                                    "to": "runfn",
                                    "as": "args"
                                }
                            ]
                        },
                        "args": {
                            fn: fn === null || fn === void 0 ? void 0 : fn.__value,
                            args
                        }
                    });
                };
                return lib.no.of(Object.entries(_args).filter((e) => e[0] !== "args").map((e) => delayfn(run_runnable(e[1], lib), _args.args)));
            }
        },
        runnable: {
            rawArgs: true,
            args: [
                "fn",
                "_lib"
            ],
            fn: (fn, lib) => {
                if (!fn) {
                    return lib.no.of(undefined);
                }
                delete fn.isArg;
                return lib.no.of(fn);
            }
        },
        entries: {
            args: [
                "object"
            ],
            fn: (obj) => {
                return Object.entries(obj);
            }
        },
        fromEntries: {
            args: [
                "entries"
            ],
            fn: (entries) => {
                return Object.fromEntries(entries);
            }
        },
        return: {
            resolve: false,
            rawArgs: true,
            args: [
                "value",
                "display",
                "subscribe",
                "argslist",
                "args",
                "lib",
                "_node",
                "_graph",
                "_graph_input_value",
                "_lib"
            ],
            fn: (value, display, subscribe, argslist, argsfn, lib, _node, _graph, _args, _lib) => {
                var _args__output;
                const output = (_args__output = _args["_output"]) === null || _args__output === void 0 ? void 0 : _args__output.__value;
                const edgemap = {
                    value,
                    display,
                    subscribe,
                    argslist,
                    lib
                };
                const runedge = output && output === display ? display : edgemap[output] ? output : "value";
                const return_result = (_lib, args) => {
                    const runedgeresult = edgemap[runedge] ? run_graph(edgemap[runedge].graph, edgemap[runedge].fn, {
                        ...args,
                        ...edgemap[runedge].args,
                        _output: _lib.no.of(runedge === "display" ? "display" : "value")
                    }, _lib) : {
                        __value: undefined
                    };
                    if (runedge === "value" && !value && display) {
                        var _run_graph___value;
                        runedgeresult.__value = (_run_graph___value = run_graph(display.graph, display.fn, {
                            ...display.args,
                            ...args
                        }, _lib).__value) === null || _run_graph___value === void 0 ? void 0 : _run_graph___value.value;
                    }
                    if (edgemap.subscribe) {
                        const subscriptions = run_graph(edgemap.subscribe.graph, edgemap.subscribe.fn, {
                            ...args,
                            ...edgemap.subscribe.args
                        }, _lib).__value;
                        const graphid = nodysseus_get(subscribe.args, "__graphid", _lib).__value;
                        const newgraphid = graphid + "/" + _node.id;
                        Object.entries(subscriptions).filter((kv) => kv[1]).forEach(([k, v]) => _lib.no.runtime.add_listener(k, 'subscribe-' + newgraphid, v, false, graphid, true, _lib));
                    }
                    return runedgeresult;
                };
                const libprom = lib && run_runnable(lib, _lib);
                if (ispromise(libprom)) {
                    return libprom.then((libr) => {
                        var _libr___value;
                        _lib = {
                            ..._lib,
                            ...(_libr___value = libr === null || libr === void 0 ? void 0 : libr.__value) !== null && _libr___value !== void 0 ? _libr___value : {}
                        };
                        Promise.resolve(argsfn ? run_runnable({
                            ...argsfn,
                            args: {
                                ...argsfn.args,
                                _output: _lib.no.of("value")
                            }
                        }, _lib) : {}).then((args) => {
                            return return_result(_lib, args === null || args === void 0 ? void 0 : args.__value);
                        });
                    });
                }
                else {
                    var _libprom___value;
                    _lib = libprom ? {
                        ..._lib,
                        ...(_libprom___value = libprom.__value) !== null && _libprom___value !== void 0 ? _libprom___value : {}
                    } : _lib;
                    const argsprom = argsfn && run_runnable({
                        ...argsfn,
                        args: {
                            ...argsfn.args,
                            _output: _lib.no.of("value")
                        }
                    }, _lib);
                    return ispromise(argsprom) ? argsprom.then((args) => {
                        return return_result(_lib, args === null || args === void 0 ? void 0 : args.__value);
                    }) : return_result(_lib, argsprom === null || argsprom === void 0 ? void 0 : argsprom.__value);
                }
            }
        },
        compare,
        eq: ({ a, b }) => a === b,
        get: {
            args: [
                "_graph",
                "target",
                "path",
                "def",
                "graphval",
                "_lib"
            ],
            fn: (graph, target, path, def, graph_value, lib) => {
                return nodysseus_get(target && target._Proxy ? target._value : target, path && path._Proxy ? path._value : graph_value || path, lib, def && def._Proxy ? def._value : def);
            }
        },
        set: {
            args: [
                "target",
                "path",
                "value",
                "__graph_value",
                "_graph_input_value"
            ],
            fn: (target, path, value, nodevalue, _args) => {
                const keys = (nodevalue || path).split(".");
                const check = (o, v, k) => {
                    var _o_hasOwn;
                    return k.length === 1 ? {
                        ...o,
                        [k[0]]: v
                    } : (o === null || o === void 0 ? void 0 : (_o_hasOwn = o.hasOwn) === null || _o_hasOwn === void 0 ? void 0 : _o_hasOwn.call(o, k[0])) ? {
                        ...o,
                        [k[0]]: check(o[k[0]], v, k.slice(1))
                    } : o;
                };
                const ret = value !== undefined && ispromise(value) || ispromise(target) ? Promise.all([
                    Promise.resolve(value),
                    Promise.resolve(target)
                ]).then((vt) => vt[1] !== undefined && check(vt[1], vt[0], keys)) : check(target, value, keys);
                return ret;
            }
        },
        set_mutable: {
            args: [
                "target",
                "path",
                "value",
                "__graph_value"
            ],
            fn: (target, path, value, nodevalue) => {
                set(target, nodevalue || path, value);
                return target;
            }
        },
        liftarraypromise: {
            args: [
                "array"
            ],
            resolve: true,
            fn: (array) => {
                const isarraypromise = array.reduce((acc, v) => acc || ispromise(v), false);
                return isarraypromise ? Promise.all(array) : array;
            }
        },
        script: {
            args: [
                "_node",
                "_node_args",
                "_graph",
                "_lib",
                "_graph_input_value"
            ],
            fn: (node, node_inputs, graph, _lib, _graph_input_value) => node_script(node, node_inputs, _lib)
        },
        new_array: {
            args: [
                "_node_args",
                "__graph_value"
            ],
            fn: (args, nodevalue) => {
                if (nodevalue) {
                    return nodevalue.split(/,\s+/);
                }
                const argskeys = Object.keys(args);
                const arr = args && argskeys.length > 0 ? argskeys.filter((k) => !k.startsWith("__")).sort().reduce((acc, k) => [
                    acc[0].concat([
                        args[k]
                    ]),
                    acc[1] || ispromise(args[k])
                ], [
                    [],
                    false
                ]) : JSON.parse("[" + nodevalue + "]");
                return arr[1] ? Promise.all(arr[0]) : arr[0];
            }
        },
        fetch: {
            resolve: true,
            args: [
                "_node",
                "url",
                "params"
            ],
            fn: (node, url, params) => resfetch(url || node.value, params)
        },
        import_module: {
            args: [
                "url",
                "__graph_value"
            ],
            fn: (url, graphvalue) => (url || graphvalue) && import(url || graphvalue)
        },
        call: {
            resolve: true,
            args: [
                "__graph_value",
                "self",
                "fn",
                "args",
                "_graph_input_value",
                "_lib"
            ],
            fn: (nodevalue, self, fn, args, _args, lib) => {
                const runfn = (args) => {
                    if (typeof self === "function") {
                        return Array.isArray(args) ? self(...args.reverse().reduce((acc, v) => [
                            !acc[0] && v !== undefined,
                            acc[0] || v !== undefined ? acc[1].concat([
                                v._Proxy ? v._value : v
                            ]) : acc[1]
                        ], [
                            false,
                            []
                        ])[1].reverse()) : self(args === undefined ? [] : args);
                    }
                    else {
                        const ng_fn = nodysseus_get(self !== null && self !== void 0 ? self : _args, fn || nodevalue, lib);
                        const fnargs = Array.isArray(args) ? (args || []).reverse().reduce((acc, v) => [
                            !acc[0] && v !== undefined,
                            acc[0] || v !== undefined ? acc[1].concat([
                                v._Proxy ? v._value : v
                            ]) : acc[1]
                        ], [
                            false,
                            []
                        ])[1].reverse() : args === undefined ? [] : [
                            args
                        ];
                        return lib.no.of(ispromise(ng_fn) ? ng_fn.then((f) => f.apply(fnargs)) : ng_fn.apply(self, fnargs));
                    }
                };
                return ispromise(args) ? args.then(runfn) : runfn(args);
            }
        },
        merge_objects: {
            args: [
                "_node_args"
            ],
            resolve: false,
            fn: (args) => {
                const keys = Object.keys(args).sort();
                const resolved = {};
                keys.forEach((k) => resolved[k] = args[k]._Proxy ? args[k]._value : args[k]);
                const promise = keys.reduce((acc, k) => acc || ispromise(resolved[k]), false);
                return promise ? Promise.all(keys.map((k) => Promise.resolve(resolved[k]))).then((es) => Object.assign({}, ...es.filter((a) => a && typeof a === "object"))) : Object.assign({}, ...keys.map((k) => resolved[k] && resolved[k]._Proxy ? resolved[k]._value : resolved[k]).filter((a) => a && typeof a === "object"));
            }
        },
        delete: {
            args: [
                "target",
                "path"
            ],
            resolve: false,
            fn: (target, path) => {
                while (target && target._Proxy) {
                    target = target._value;
                }
                const newval = Object.assign({}, target);
                delete newval[path];
                return newval;
            }
        },
        math: {
            args: [
                "__graph_value",
                "_node_args"
            ],
            resolve: true,
            fn: (graph_value, args) => Math[graph_value](...Object.entries(args).sort((a, b) => a[0].localeCompare(b[0])).map((kv) => kv[1]))
        },
        add: {
            args: [
                "_node_args"
            ],
            resolve: true,
            fn: (args) => Object.entries(args).sort((a, b) => a[0].localeCompare(b[0])).map((kv) => kv[1]).reduce((acc, v) => acc + v)
        },
        and: {
            args: [
                "_node_args"
            ],
            resolve: true,
            fn: (args) => Object.values(args).reduce((acc, v) => acc && !!v, true)
        },
        mult: {
            args: [
                "_node_args"
            ],
            resolve: true,
            fn: (args) => Object.values(args).reduce((acc, v) => acc * v, 1)
        },
        negate: {
            args: [
                "value"
            ],
            resolve: true,
            fn: (value) => -value
        },
        divide: {
            args: [
                "_node_args"
            ],
            resolve: true,
            fn: (args) => Object.values(args).reduce((acc, v) => acc / v, 1)
        },
        unwrap_proxy: {
            args: [
                "proxy"
            ],
            resolve: false,
            fn: (proxy) => ({
                fn: proxy._value._nodeid,
                graph: proxy._value._graphid,
                args: proxy._value._graph_input_value
            })
        },
        modify: {
            args: [
                "target",
                "path",
                "fn",
                "_node",
                "_lib",
                "_graph_input_value"
            ],
            resolve: false,
            fn: (target, path, fn, node, _lib, args) => {
                while (target === null || target === void 0 ? void 0 : target._Proxy) {
                    target = target._value;
                }
                const keys = (node.value || path).split(".");
                const check = (o, fn, k) => {
                    var _o_hasOwn;
                    return k.length === 1 ? {
                        ...o,
                        [k[0]]: run(fn._graphid, fn._nodeid, {
                            ...args,
                            value: o[k[0]]
                        }),
                        _needsresolve: true
                    } : (o === null || o === void 0 ? void 0 : (_o_hasOwn = o.hasOwn) === null || _o_hasOwn === void 0 ? void 0 : _o_hasOwn.call(o, k[0])) ? {
                        ...o,
                        [k[0]]: check(o[k[0]], fn, k.slice(1)),
                        _needsresolve: true
                    } : o;
                };
                return check(target, fn, keys);
            }
        },
        properties: {
            getOwnEnumerables: function (obj) {
                return this._getPropertyNames(obj, true, false, this._enumerable);
                // Or could use for..in filtered with hasOwnProperty or just this: return Object.keys(obj);
            },
            getOwnNonenumerables: function (obj) {
                return this._getPropertyNames(obj, true, false, this._notEnumerable);
            },
            getOwnEnumerablesAndNonenumerables: function (obj) {
                return this._getPropertyNames(obj, true, false, this._enumerableAndNotEnumerable);
                // Or just use: return Object.getOwnPropertyNames(obj);
            },
            getPrototypeEnumerables: function (obj) {
                return this._getPropertyNames(obj, false, true, this._enumerable);
            },
            getPrototypeNonenumerables: function (obj) {
                return this._getPropertyNames(obj, false, true, this._notEnumerable);
            },
            getPrototypeEnumerablesAndNonenumerables: function (obj) {
                return this._getPropertyNames(obj, false, true, this._enumerableAndNotEnumerable);
            },
            getOwnAndPrototypeEnumerables: function (obj) {
                return this._getPropertyNames(obj, true, true, this._enumerable);
                // Or could use unfiltered for..in
            },
            getOwnAndPrototypeNonenumerables: function (obj) {
                return this._getPropertyNames(obj, true, true, this._notEnumerable);
            },
            getOwnAndPrototypeEnumerablesAndNonenumerables: function (obj, includeArgs) {
                return this._getPropertyNames(obj, true, true, this._enumerableAndNotEnumerable, includeArgs);
            },
            // Private static property checker callbacks
            _enumerable: function (obj, prop) {
                return obj.propertyIsEnumerable(prop);
            },
            _notEnumerable: function (obj, prop) {
                return !obj.propertyIsEnumerable(prop);
            },
            _enumerableAndNotEnumerable: function (obj, prop) {
                return true;
            },
            // Inspired by http://stackoverflow.com/a/8024294/271577
            _getPropertyNames: function getAllPropertyNames(obj, iterateSelfBool, iteratePrototypeBool, includePropCb, includeArgs) {
                var props = [];
                do {
                    if (iterateSelfBool) {
                        Object.getOwnPropertyNames(obj).forEach(function (prop) {
                            if (props.indexOf(prop) === -1 && includePropCb(obj, prop)) {
                                props.push(prop);
                            }
                        });
                    }
                    if (!iteratePrototypeBool) {
                        break;
                    }
                    iterateSelfBool = true;
                } while (obj = Object.getPrototypeOf(obj));
                return props;
            }
        },
        stringify: {
            args: [
                "object",
                "spacer"
            ],
            resolve: true,
            fn: (obj, spacer) => {
                return JSON.stringify(obj, (key, value) => {
                    return (value === null || value === void 0 ? void 0 : value._Proxy) ? value._value : value;
                }, spacer);
            }
        },
        parse: {
            args: [
                "string"
            ],
            resolve: true,
            fn: (args) => JSON.parse(args)
        },
        typeof: {
            args: [
                "value"
            ],
            fn: (value) => typeof value
        }
    }
};
new Set(generic.nodes.map((n) => n.id));
const run = (node, args, lib = nolib) => {
    lib.no.runtime.update_graph(node.graph, lib);
    const res = run_node(node, Object.fromEntries(Object.entries(args !== null && args !== void 0 ? args : {}).map((e) => [
        e[0],
        lib.no.of(e[1])
    ])), node.args, lib);
    return ispromise(res) ? res.then((r) => {
        return r === null || r === void 0 ? void 0 : r.__value;
    }) : res === null || res === void 0 ? void 0 : res.__value;
};

const updateSimulationNodes = (dispatch, data)=>{
    var _links_;
    const simulation_node_data = new Map();
    if (!data.clear_simulation_cache) {
        data.simulation.nodes().forEach((n)=>{
            simulation_node_data.set(n.node_id, n);
        });
    }
    const start_sim_node_size = simulation_node_data.size;
    const simulation_link_data = new Map();
    if (!data.clear_simulation_cache) {
        data.simulation.force('links').links().forEach((l)=>{
            simulation_link_data.set(`${l.source.node_id}__${l.target.node_id}`, l);
        });
    }
    const start_sim_link_size = simulation_link_data.size;
    const main_node_map = new Map();
    const node_map = new Map(data.display_graph.nodes.map((n)=>[
            n.id,
            n
        ]));
    const children_map = new Map(data.display_graph.nodes.map((n)=>[
            n.id,
            data.display_graph.edges.filter((e)=>e.from === n.id).map((e)=>e.to)
        ]));
    const order = [];
    const queue = [
        data.display_graph.out
    ];
    const parents_map = new Map(data.display_graph.nodes.map((n)=>[
            n.id,
            data.display_graph.edges.filter((e)=>e.to === n.id).map((e)=>e.from)
        ]));
    let needsupdate = false;
    while(queue.length > 0){
        const node = queue.shift();
        order.push(node);
        needsupdate || (needsupdate = !simulation_node_data.has(node));
        main_node_map.set(node, node);
        parents_map.get(node).forEach((p)=>{
            needsupdate || (needsupdate = simulation_link_data.has(`${p}_${node}`));
            queue.push(p);
        });
    }
    const ancestor_count = new Map();
    const reverse_order = [
        ...order
    ];
    reverse_order.reverse();
    reverse_order.forEach((n)=>ancestor_count.set(n, parents_map.has(n) ? parents_map.get(n).reduce((acc, c)=>acc + (ancestor_count.get(c) || 0) + 1, 0) : 0));
    for (let ps of parents_map.values()){
        let i = 0;
        var _simulation_node_data_get_hash, _simulation_node_data_get;
        ps.sort((a, b)=>{
            var _simulation_node_data_get1;
            return parents_map.get(a).length === parents_map.get(b).length ? ((_simulation_node_data_get_hash = (_simulation_node_data_get1 = simulation_node_data.get(main_node_map.get(a))) === null || _simulation_node_data_get1 === void 0 ? void 0 : _simulation_node_data_get1.hash) !== null && _simulation_node_data_get_hash !== void 0 ? _simulation_node_data_get_hash : hashcode(a)) - ((_simulation_node_data_get = simulation_node_data.get(main_node_map.get(b))) !== null && _simulation_node_data_get !== void 0 ? _simulation_node_data_get : hashcode(b)) : (i++ % 2 * 2 - 1) * (parents_map.get(b).length - parents_map.get(a).length);
        });
    }
    //// pushes all root nodes, not just display_graph.out
    // data.display_graph.nodes.forEach(n => {
    //     const children = children_map.get(n.id);
    //     const node_id = children.length > 0 ? n.id + "_" + children[0] : n.id;
    //     main_node_map.set(n.id, node_id);
    // if(children_map.get(n.id).length === 0) {
    //     queue.push(n.id);
    // }
    // });
    const nodes = order.flatMap((nid)=>{
        var _simulation_node_data_get, _simulation_node_data_get1, _n_nodes, _n_edges, _simulation_node_data_get2, _simulation_node_data_get3, _parents_map_get, _simulation_node_data_get4, _simulation_node_data_get5, _parents_map_get1;
        let n = node_map.get(nid);
        const children = children_map.get(n.id);
        const node_id = main_node_map.get(n.id);
        const stored_siblings = parents_map.get(children[0]);
        stored_siblings === null || stored_siblings === void 0 ? void 0 : stored_siblings.sort((a, b)=>ancestor_count.get(a) - ancestor_count.get(b));
        const siblings = [];
        stored_siblings === null || stored_siblings === void 0 ? void 0 : stored_siblings.forEach((s, i)=>{
            if (i % 2 == 0) {
                siblings.push(s);
            } else {
                siblings.unshift(s);
            }
        });
        var _simulation_node_data_get_hash;
        const node_hash = (_simulation_node_data_get_hash = (_simulation_node_data_get = simulation_node_data.get(node_id)) === null || _simulation_node_data_get === void 0 ? void 0 : _simulation_node_data_get.hash) !== null && _simulation_node_data_get_hash !== void 0 ? _simulation_node_data_get_hash : hashcode(nid);
        const randpos = {
            x: node_hash * 0.254 % 256.0 / 256.0,
            y: node_hash * 0.874 % 256.0 / 256.0
        };
        const sibling_idx = siblings === null || siblings === void 0 ? void 0 : siblings.findIndex((v)=>v === n.id);
        const sibling_mult = sibling_idx - ((siblings === null || siblings === void 0 ? void 0 : siblings.length) - 1) * 0.5;
        const addorundefined = (a, b)=>{
            return a === undefined || b === undefined ? undefined : a + b;
        };
        var _simulation_node_data_get_hash1, _simulation_node_data_get_x, _ref, _simulation_node_data_get_y, _ref1, _simulation_node_data_get_hash2, _simulation_node_data_get_x1, _ref2, _ref3, _simulation_node_data_get_y1, _ref4, _ref5;
        const calculated_nodes = children.length === 0 ? [
            {
                node_id: n.id,
                hash: (_simulation_node_data_get_hash1 = (_simulation_node_data_get1 = simulation_node_data.get(node_id)) === null || _simulation_node_data_get1 === void 0 ? void 0 : _simulation_node_data_get1.hash) !== null && _simulation_node_data_get_hash1 !== void 0 ? _simulation_node_data_get_hash1 : hashcode(n.id),
                nested_node_count: (_n_nodes = n.nodes) === null || _n_nodes === void 0 ? void 0 : _n_nodes.length,
                nested_edge_count: (_n_edges = n.edges) === null || _n_edges === void 0 ? void 0 : _n_edges.length,
                x: Math.floor((_ref = (_simulation_node_data_get_x = (_simulation_node_data_get2 = simulation_node_data.get(node_id)) === null || _simulation_node_data_get2 === void 0 ? void 0 : _simulation_node_data_get2.x) !== null && _simulation_node_data_get_x !== void 0 ? _simulation_node_data_get_x : (_simulation_node_data_get3 = simulation_node_data.get(main_node_map.get((_parents_map_get = parents_map.get(n.id)) === null || _parents_map_get === void 0 ? void 0 : _parents_map_get[0]))) === null || _simulation_node_data_get3 === void 0 ? void 0 : _simulation_node_data_get3.x) !== null && _ref !== void 0 ? _ref : Math.floor(window.innerWidth * (randpos.x * .5 + .25))),
                y: Math.floor((_ref1 = (_simulation_node_data_get_y = (_simulation_node_data_get4 = simulation_node_data.get(node_id)) === null || _simulation_node_data_get4 === void 0 ? void 0 : _simulation_node_data_get4.y) !== null && _simulation_node_data_get_y !== void 0 ? _simulation_node_data_get_y : addorundefined((_simulation_node_data_get5 = simulation_node_data.get(main_node_map.get((_parents_map_get1 = parents_map.get(n.id)) === null || _parents_map_get1 === void 0 ? void 0 : _parents_map_get1[0]))) === null || _simulation_node_data_get5 === void 0 ? void 0 : _simulation_node_data_get5.y, 128)) !== null && _ref1 !== void 0 ? _ref1 : Math.floor(window.innerHeight * (randpos.y * .5 + .25)))
            }
        ] : children.map((c, i)=>{
            var _simulation_node_data_get, _n_nodes, _n_edges, _simulation_node_data_get1, _simulation_node_data_get2, _parents_map_get, _simulation_node_data_get3, _simulation_node_data_get4, _simulation_node_data_get5, _parents_map_get1, _parents_map_get2, _children_map_get, _simulation_node_data_get6, _children_map_get1;
            return {
                node_id: n.id,
                hash: (_simulation_node_data_get_hash2 = (_simulation_node_data_get = simulation_node_data.get(node_id)) === null || _simulation_node_data_get === void 0 ? void 0 : _simulation_node_data_get.hash) !== null && _simulation_node_data_get_hash2 !== void 0 ? _simulation_node_data_get_hash2 : hashcode(n.id),
                sibling_index_normalized: parents_map.get(c).findIndex((p)=>p === n.id) / parents_map.get(c).length,
                nested_node_count: (_n_nodes = n.nodes) === null || _n_nodes === void 0 ? void 0 : _n_nodes.length,
                nested_edge_count: (_n_edges = n.edges) === null || _n_edges === void 0 ? void 0 : _n_edges.length,
                x: Math.floor((_ref3 = (_ref2 = (_simulation_node_data_get_x1 = (_simulation_node_data_get1 = simulation_node_data.get(node_id)) === null || _simulation_node_data_get1 === void 0 ? void 0 : _simulation_node_data_get1.x) !== null && _simulation_node_data_get_x1 !== void 0 ? _simulation_node_data_get_x1 : (_simulation_node_data_get2 = simulation_node_data.get(main_node_map.get((_parents_map_get = parents_map.get(n.id)) === null || _parents_map_get === void 0 ? void 0 : _parents_map_get[0]))) === null || _simulation_node_data_get2 === void 0 ? void 0 : _simulation_node_data_get2.x) !== null && _ref2 !== void 0 ? _ref2 : addorundefined((_simulation_node_data_get3 = simulation_node_data.get(children[0])) === null || _simulation_node_data_get3 === void 0 ? void 0 : _simulation_node_data_get3.x, sibling_mult * (256 + 32 * Math.log(Math.max(1, ancestor_count.get(n.id)) / Math.log(1.01))))) !== null && _ref3 !== void 0 ? _ref3 : Math.floor(window.innerWidth * (randpos.x * .5 + .25))),
                y: Math.floor((_ref5 = (_ref4 = (_simulation_node_data_get_y1 = (_simulation_node_data_get4 = simulation_node_data.get(node_id)) === null || _simulation_node_data_get4 === void 0 ? void 0 : _simulation_node_data_get4.y) !== null && _simulation_node_data_get_y1 !== void 0 ? _simulation_node_data_get_y1 : addorundefined(256, (_simulation_node_data_get5 = simulation_node_data.get(main_node_map.get((_parents_map_get1 = parents_map.get(n.id)) === null || _parents_map_get1 === void 0 ? void 0 : _parents_map_get1[0]))) === null || _simulation_node_data_get5 === void 0 ? void 0 : _simulation_node_data_get5.y)) !== null && _ref4 !== void 0 ? _ref4 : addorundefined(-(16 + 32 * Math.log(Math.max(1, ancestor_count.get(n.id) * 0.5 + ((_parents_map_get2 = parents_map.get((_children_map_get = children_map.get(n.id)) === null || _children_map_get === void 0 ? void 0 : _children_map_get[0])) === null || _parents_map_get2 === void 0 ? void 0 : _parents_map_get2.length))) / Math.log(1.25)), (_simulation_node_data_get6 = simulation_node_data.get(main_node_map.get((_children_map_get1 = children_map.get(n.id)) === null || _children_map_get1 === void 0 ? void 0 : _children_map_get1[0]))) === null || _simulation_node_data_get6 === void 0 ? void 0 : _simulation_node_data_get6.y)) !== null && _ref5 !== void 0 ? _ref5 : Math.floor(window.innerHeight * (randpos.y * .5 + .25)))
            };
        });
        calculated_nodes.map((n)=>simulation_node_data.set(n.node_id, n));
        return calculated_nodes;
    });
    const links = data.display_graph.edges.filter((e)=>main_node_map.has(e.from) && main_node_map.has(e.to)).map((e)=>{
        var _parents_map_get, _parents_map_get1;
        simulation_link_data.get(`${e.from}__${e.to}`);
        var _parents_map_get_length, _parents_map_get_length1;
        const proximal = (((_parents_map_get_length = (_parents_map_get = parents_map.get(main_node_map.get(e.to))) === null || _parents_map_get === void 0 ? void 0 : _parents_map_get.length) !== null && _parents_map_get_length !== void 0 ? _parents_map_get_length : 0) + ((_parents_map_get_length1 = (_parents_map_get1 = parents_map.get(children_map.get(main_node_map.get(e.to)))) === null || _parents_map_get1 === void 0 ? void 0 : _parents_map_get1.length) !== null && _parents_map_get_length1 !== void 0 ? _parents_map_get_length1 : 0)) * 0.5;
        return {
            ...e,
            source: e.from,
            target: main_node_map.get(e.to),
            sibling_index_normalized: simulation_node_data.get(e.from).sibling_index_normalized,
            strength: 2 * (1.5 - Math.abs(simulation_node_data.get(e.from).sibling_index_normalized - 0.5)) / (1 + 2 * Math.min(4, proximal)),
            distance: 32 + 4 * Math.min(8, proximal)
        };
    }).filter((l)=>!!l);
    if (typeof (links === null || links === void 0 ? void 0 : (_links_ = links[0]) === null || _links_ === void 0 ? void 0 : _links_.source) === "string") {
        var _data_simulation_nodes, _data_simulation_force;
        if (simulation_node_data.size !== start_sim_node_size || simulation_link_data.size !== start_sim_link_size || ((_data_simulation_nodes = data.simulation.nodes()) === null || _data_simulation_nodes === void 0 ? void 0 : _data_simulation_nodes.length) !== nodes.length || ((_data_simulation_force = data.simulation.force('links')) === null || _data_simulation_force === void 0 ? void 0 : _data_simulation_force.links().length) !== links.length) {
            data.simulation.alpha(0.8);
        }
        data.simulation.nodes(nodes);
        data.simulation.force('links').links(links);
    // data.simulation.force('fuse_links').links(data.fuse_links);
    }
    const parentlengths = [
        ...parents_map.values()
    ].map((c)=>c.length).filter((l)=>l > 0);
    const maxparents = Math.max(...parentlengths);
    const avgparents = parentlengths.reduce((acc, v)=>acc + v, 0) / nodes.length;
    const logmaxparents = maxparents === 1 ? nodes.length : Math.log(nodes.length) / Math.log(1 + avgparents);
    data.simulation.force('link_direction').y((n)=>{
        var _parents_map_get, _children_map_get, _children_map_get1;
        return (((((_parents_map_get = parents_map.get(n.node_id)) === null || _parents_map_get === void 0 ? void 0 : _parents_map_get.length) > 0 ? 1 : 0) + (((_children_map_get = children_map.get(n.node_id)) === null || _children_map_get === void 0 ? void 0 : _children_map_get.length) > 0 ? -1 : 0) + (((_children_map_get1 = children_map.get(n.node_id)) === null || _children_map_get1 === void 0 ? void 0 : _children_map_get1.length) > 0 ? -1 : 0)) * (logmaxparents + 3) + .5) * window.innerHeight;
    }).strength((n)=>{
        var _parents_map_get, _children_map_get, _children_map_get1;
        return !!((_parents_map_get = parents_map.get(n.node_id)) === null || _parents_map_get === void 0 ? void 0 : _parents_map_get.length) === !((_children_map_get = children_map.get(n.node_id)) === null || _children_map_get === void 0 ? void 0 : _children_map_get.length) || ((_children_map_get1 = children_map.get(n.node_id)) === null || _children_map_get1 === void 0 ? void 0 : _children_map_get1.length) > 0 ? .01 : 0;
    });
    data.simulation.force('collide').radius(96);
// data.simulation.force('center').strength(n => (levels.parents_map.get(n.node_id)?.length ?? 0) * 0.25 + (levels.children_map.get(n.node_id)?.length ?? 0) * 0.25)
};
// Creates the simulation, updates the node elements when the simulation changes, and runs an action when the nodes have settled.
// This is probably doing too much.
const d3subscription = (dispatch, props)=>{
    var _l_distance;
    const simulation = hlib.d3.forceSimulation().force('charge', hlib.d3.forceManyBody().strength(-1024).distanceMax(1024).distanceMin(64)).force('collide', hlib.d3.forceCollide(64)).force('links', hlib.d3.forceLink([]).distance((l)=>(_l_distance = l.distance) !== null && _l_distance !== void 0 ? _l_distance : 128).strength((l)=>l.strength).id((n)=>n.node_id)).force('link_direction', hlib.d3.forceY().strength(.01))// .force('center', hlib.d3.forceCenter().strength(0.01))
    // .force('fuse_links', lib.d3.forceLink([]).distance(128).strength(.1).id(n => n.node_id))
    // .force('link_siblings', lib.d3.forceX().strength(1))
    // .force('selected', lib.d3.forceRadial(0, window.innerWidth * 0.5, window.innerHeight * 0.5).strength(2))
    .velocityDecay(0.7).alphaMin(.25);
    const abort_signal = {
        stop: false
    };
    simulation.stop();
    let htmlid;
    let stopped = false;
    let selected;
    const node_el_width = 256;
    const tick = ()=>{
        if (simulation.nodes().length === 0) {
            requestAnimationFrame(()=>dispatch((s)=>[
                        (htmlid = s.html_id, {
                            ...s,
                            simulation
                        }),
                        [
                            props.update,
                            s
                        ]
                    ]));
        }
        if (simulation.alpha() > simulation.alphaMin()) {
            const data = {
                nodes: simulation.nodes().map((n)=>{
                    return {
                        ...n,
                        x: Math.floor(n.x),
                        y: Math.floor(n.y)
                    };
                }),
                links: simulation.force('links').links().map((l)=>({
                        ...l,
                        as: l.as,
                        type: l.type,
                        source: {
                            node_id: l.source.node_id,
                            x: Math.floor(l.source.x),
                            y: Math.floor(l.source.y)
                        },
                        target: {
                            node_id: l.target.node_id,
                            x: Math.floor(l.target.x),
                            y: Math.floor(l.target.y)
                        }
                    }))
            };
            const ids = simulation.nodes().map((n)=>n.node_id).join(',');
            stopped = false;
            simulation.tick();
            dispatch([
                (s)=>(selected = s.selected[0], s.nodes.map((n)=>n.node_id).join(',') !== ids ? [
                        props.action,
                        data
                    ] : [
                        {
                            ...s,
                            stopped
                        },
                        !s.noautozoom && [
                            hlib.panzoom.effect,
                            {
                                ...s,
                                nodes: simulation.nodes().map((n)=>({
                                        ...n,
                                        x: n.x - 8,
                                        y: n.y
                                    })),
                                links: simulation.force('links').links(),
                                prevent_dispatch: true,
                                node_id: s.selected[0]
                            }
                        ]
                    ])
            ]);
            const visible_node_set = new Set();
            simulation.nodes().map((n)=>{
                const el = document.getElementById(`${htmlid}-${n.node_id.replaceAll("/", "_")}`);
                if (el) {
                    const x = n.x - node_el_width * 0.5;
                    const y = n.y;
                    el.setAttribute('x', Math.floor(x - 20));
                    el.setAttribute('y', Math.floor(y - 20));
                    if (n.node_id === selected) ;
                }
            });
            simulation.force('links').links().map((l)=>{
                const el = document.getElementById(`link-${l.source.node_id}`);
                const edge_label_el = document.getElementById(`edge-info-${l.source.node_id}`);
                const insert_el = document.getElementById(`insert-${l.source.node_id}`);
                if (el && edge_label_el) {
                    const source = {
                        x: l.source.x - node_el_width * 0.5,
                        y: l.source.y
                    };
                    const target = {
                        x: l.target.x - node_el_width * 0.5,
                        y: l.target.y
                    };
                    const length_x = Math.abs(source.x - target.x);
                    const length_y = Math.abs(source.y - target.y);
                    const length = Math.sqrt(length_x * length_x + length_y * length_y);
                    const lerp_length = 24;
                    // return {selected_distance, selected_edge, source: {...source, x: source.x + (target.x - source.x) * lerp_length / length, y: source.y + (target.y - source.y) * lerp_length / length}, target: {...target, x: source.x + (target.x - source.x) * (1 - (lerp_length / length)), y: source.y + (target.y - source.y) * (1 - (lerp_length / length))}}"
                    el.setAttribute('x1', Math.floor(Math.floor(source.x + (target.x - source.x) * lerp_length / length)));
                    el.setAttribute('y1', Math.floor(Math.floor(source.y + (target.y - source.y) * lerp_length / length)));
                    el.setAttribute('x2', Math.floor(Math.floor(source.x + (target.x - source.x) * (1 - lerp_length / length))));
                    el.setAttribute('y2', Math.floor(Math.floor(source.y + (target.y - source.y) * (1 - lerp_length / length))));
                    const min_edge_label_dist = 32 / Math.abs(target.y - source.y);
                    const max_edge_label_dist = Math.min(64 / Math.abs(target.y - source.y), 0.5);
                    const edge_label_dist = Math.min(max_edge_label_dist, Math.max(min_edge_label_dist, 0.125));
                    edge_label_el.setAttribute('x', (target.x - source.x) * edge_label_dist + source.x + 16);
                    edge_label_el.setAttribute('y', (target.y - source.y) * edge_label_dist + source.y);
                    if (insert_el) {
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
            simulation.force('links').links().map((l)=>{
                if (visible_node_set.has(l.target.node_id) && !visible_node_set.has(l.source.node_id)) {
                    ({
                        x: l.source.x - node_el_width * 0.5,
                        y: l.source.y
                    });
                }
            });
        } else if (!stopped) {
            const data1 = {
                nodes: simulation.nodes().map((n)=>{
                    return {
                        ...n,
                        x: Math.floor(n.x),
                        y: Math.floor(n.y)
                    };
                }),
                links: simulation.force('links').links().map((l)=>({
                        ...l,
                        as: l.as,
                        type: l.type,
                        source: {
                            node_id: l.source.node_id,
                            x: Math.floor(l.source.x),
                            y: Math.floor(l.source.y)
                        },
                        target: {
                            node_id: l.target.node_id,
                            x: Math.floor(l.target.x),
                            y: Math.floor(l.target.y)
                        }
                    }))
            };
            stopped = true;
            requestAnimationFrame(()=>{
                dispatch([
                    props.action,
                    data1
                ]);
                dispatch((s)=>[
                        {
                            ...s,
                            noautozoom: false,
                            stopped
                        },
                        !s.noautozoom && [
                            hlib.panzoom.effect,
                            {
                                ...s,
                                node_id: s.selected[0]
                            }
                        ]
                    ]);
            });
        }
        if (!abort_signal.stop) {
            requestAnimationFrame(tick);
        }
    };
    requestAnimationFrame(tick);
    return ()=>{
        abort_signal.stop = true;
    };
};
const keydownSubscription = (dispatch, options)=>{
    const handler = (ev)=>{
        if ((ev.key === "s" || ev.key === "o") && ev.ctrlKey) {
            ev.preventDefault();
        } else if (!ev.key) {
            return;
        }
        requestAnimationFrame(()=>dispatch(options.action, ev));
    };
    requestAnimationFrame(()=>addEventListener('keydown', handler));
    return ()=>removeEventListener('keydown', handler);
};
const graph_subscription = (dispatch, props)=>{
    let animframe = false;
    const listener = (graph)=>{
        if (props.display_graph_id === graph.id) {
            !animframe && requestAnimationFrame(()=>{
                animframe = false;
                dispatch((s)=>[
                        {
                            ...s,
                            display_graph: graph
                        },
                        [
                            UpdateSimulation
                        ]
                    ]);
            });
        }
    };
    nolib.no.runtime.add_listener('graphchange', 'update_hyperapp', listener);
    return ()=>nolib.no.runtime.remove_listener('graphchange', 'update_hyperapp');
};
const select_node_subscription = (dispatch, props)=>{
    const listener = (data)=>{
        dispatch(SelectNode, {
            node_id: data.data.substring(data.data.indexOf("/") + 1)
        });
    };
    nolib.no.runtime.add_listener("selectnode", 'hyperapp', listener);
    return ()=>nolib.no.runtime.remove_listener('selectnode', 'hyperapp');
};
const listen = (type, action)=>[
        listenToEvent,
        {
            type,
            action
        }
    ];
const listenToEvent = (dispatch, props)=>{
    const listener = (event)=>requestAnimationFrame(()=>dispatch(props.action, event.detail));
    requestAnimationFrame(()=>addEventListener(props.type, listener));
    return ()=>removeEventListener(props.type, listener);
};
const ap = (fn, v)=>fn(v);
const ap_promise = (p, fn, cfn)=>p && typeof p['then'] === 'function' ? cfn ? p.then(fn).catch(cfn) : p.then(fn) : ap(fn, p);
const refresh_graph = (graph, dispatch)=>{
    dispatch((s)=>s.error ? Object.assign({}, s, {
            error: false
        }) : s);
    const result = hlib.run({
        graph,
        fn: graph.out
    }, {
        _output: "value"
    }, {
        ...hlib,
        ...nolib
    });
    // const result = hlib.run(graph, graph.out, {});
    const display_fn = (result)=>hlib.run({
            graph,
            fn: graph.out
        }, {
            _output: "display"
        });
    // const display_fn = result => hlib.run(graph, graph.out, {}, "display");
    const update_result_display_fn = (display)=>result_display_dispatch(UpdateResultDisplay, {
            el: display && display.dom_type ? display : {
                dom_type: 'div',
                props: {},
                children: []
            }
        });
    const update_info_display_fn = ()=>dispatch((s)=>[
                s,
                s.selected[0] !== s.display_graph.out && !s.show_all && [
                    ()=>update_info_display({
                            fn: s.selected[0],
                            graph: s.display_graph,
                            args: {}
                        })
                ]
            ]);
    ap_promise(ap_promise(result, display_fn), update_result_display_fn);
    ap_promise(result, update_info_display_fn);
    return result;
};
const result_subscription = (dispatch, { display_graph_id  })=>{
    let animrun = false;
    const error_listener = (error)=>requestAnimationFrame(()=>{
            dispatch((s)=>Object.assign({}, s, {
                    error: s.error ? s.error.concat([
                        error
                    ]) : [
                        error
                    ]
                }));
        });
    nolib.no.runtime.add_listener('grapherror', 'update_hyperapp_error', error_listener);
    const change_listener = (graph)=>{
        if (graph.id === display_graph_id && !animrun) {
            cancelAnimationFrame(animrun);
            animrun = requestAnimationFrame(()=>{
                const result = refresh_graph(graph, dispatch);
                const reset_animrun = ()=>animrun = false;
                ap_promise(result, reset_animrun, reset_animrun);
            });
        }
    };
    nolib.no.runtime.add_listener('graphupdate', 'clear_hyperapp_error', change_listener);
    const timeouts = {};
    const animframes = {};
    const noderun_listener = (data)=>{
        if (data.graph.id === display_graph_id && !timeouts[data.node_id]) {
            const el = document.querySelector(`#node-editor-${data.node_id.replaceAll("/", "_")} .shape`);
            if (el) {
                timeouts[data.node_id] && clearTimeout(timeouts[data.node_id]);
                animframes[data.node_id] && cancelAnimationFrame(animframes[data.node_id]);
                el.classList.remove("flash-transition-out");
                el.classList.add("flash-transition");
                animframes[data.node_id] = requestAnimationFrame(()=>{
                    animframes[data.node_id] = false;
                    if (timeouts[data.node_id]) {
                        el.classList.add("flash-transition-out");
                        el.classList.remove("flash-transition");
                    }
                });
                timeouts[data.node_id] = setTimeout(()=>{
                    timeouts[data.node_id] = false;
                    el.classList.remove("flash-transition-out");
                }, 1000);
            // el.style.animationPlayState = "paused"
            // el.style.animationPlayState = "running"
            }
        }
    };
    nolib.no.runtime.add_listener('noderun', 'update_hyperapp_error', noderun_listener);
    return ()=>(nolib.no.runtime.remove_listener('graphupdate', 'clear_hyperapp_error', change_listener), nolib.no.runtime.remove_listener('grapherror', 'update_hyperapp_error', error_listener));
};
const pzobj = {
    effect: function(dispatch, payload) {
        if (!hlib.panzoom.instance || !payload.node_id) {
            return;
        }
        pzobj.lastpanzoom = performance.now();
        const viewbox = findViewBox(payload.nodes, payload.links, payload.node_id, payload.node_el_width, payload.html_id, payload.dimensions);
        const x = payload.dimensions.x * 0.5 - viewbox.center.x;
        const y = payload.dimensions.y * 0.5 - viewbox.center.y;
        const scale = hlib.panzoom.instance.getTransform().scale;
        hlib.panzoom.instance.moveTo(x, y);
        hlib.panzoom.instance.zoomTo(x, y, 1 / scale);
        if (!payload.prevent_dispatch) {
            requestAnimationFrame(()=>dispatch((s, p)=>[
                        {
                            ...s,
                            show_all: false
                        },
                        [
                            ()=>requestAnimationFrame(()=>nolib.no.runtime.publish('show_all', {
                                        data: false
                                    }))
                        ]
                    ]));
        }
    },
    getTransform: function() {
        return hlib.panzoom.instance.getTransform();
    },
    init: function(dispatch, sub_payload) {
        hlib.panzoom.lastpanzoom = 0;
        let init = requestAnimationFrame(()=>{
            hlib.panzoom.instance = panzoom(document.getElementById(sub_payload.id), {
                filterKey: (e)=>true,
                smoothScroll: false,
                onTouch: (e)=>{
                    if (e.target.id.endsWith("-editor") && performance.now() - hlib.panzoom.lastpanzoom > 100) {
                        dispatch(sub_payload.action, {
                            event: 'panstart',
                            transform: hlib.panzoom.instance.getTransform(),
                            noautozoom: true
                        });
                    }
                    return true;
                },
                beforeWheel: (e)=>{
                    if (e.target.id.endsWith("-editor") && performance.now() - hlib.panzoom.lastpanzoom > 100) {
                        dispatch(sub_payload.action, {
                            event: 'panstart',
                            transform: hlib.panzoom.instance.getTransform(),
                            noautozoom: true
                        });
                    }
                    return false;
                },
                beforeMouseDown: (e)=>{
                    const should_zoom = e.buttons == 4 || e.altKey;
                    if (!should_zoom && e.target.id.endsWith("-editor") && performance.now() - hlib.panzoom.lastpanzoom > 100) {
                        dispatch(sub_payload.action, {
                            event: 'panstart',
                            transform: hlib.panzoom.instance.getTransform(),
                            noautozoom: true
                        });
                    }
                    return should_zoom;
                }
            });
            let currentEvent = false;
            document.getElementById(sub_payload.id).ownerSVGElement.addEventListener("pointermove", (e)=>{
                if (e.buttons == 4 || e.altKey) {
                    if (!currentEvent) {
                        currentEvent = {
                            offset: {
                                x: e.offsetX,
                                y: e.offsetY
                            }
                        };
                    }
                    const movementSign = Math.abs(e.movementX) > Math.abs(e.movementY) ? e.movementX : -e.movementY;
                    const scaleMultiplier = 1 + movementSign * 0.01;
                    hlib.panzoom.instance.zoomTo(currentEvent.offset.x, currentEvent.offset.y, scaleMultiplier);
                } else {
                    currentEvent = false;
                }
            });
            document.getElementById(sub_payload.id).ownerSVGElement.addEventListener("pointerup", (e)=>{
                currentEvent = false;
            });
            hlib.panzoom.instance.moveTo(window.innerWidth * 0, window.innerHeight * 0.5);
        });
        return ()=>{
            var _hlib_panzoom_instance;
            cancelAnimationFrame(init);
            (_hlib_panzoom_instance = hlib.panzoom.instance) === null || _hlib_panzoom_instance === void 0 ? void 0 : _hlib_panzoom_instance.dispose();
        };
    }
};
const run_h = ({ dom_type , props , children , text  }, exclude_tags = [])=>{
    dom_type = dom_type && dom_type._Proxy ? dom_type._value : dom_type;
    var _text___value;
    text = (_text___value = text === null || text === void 0 ? void 0 : text.__value) !== null && _text___value !== void 0 ? _text___value : text;
    props = props && props.__value ? props.__value : props;
    var _kv____value;
    props = props ? Object.fromEntries(Object.entries(props).map((kv)=>{
        var _kv_;
        return [
            kv[0],
            (_kv____value = (_kv_ = kv[1]) === null || _kv_ === void 0 ? void 0 : _kv_.__value) !== null && _kv____value !== void 0 ? _kv____value : kv[1]
        ];
    })) : props;
    children = children && children._Proxy ? children._value : children;
    var _c_el, _children_map_filter_map;
    return dom_type === "text_value" ? ha.text(text) : ha.h(dom_type, props, (_children_map_filter_map = children === null || children === void 0 ? void 0 : children.map((c)=>(_c_el = c.el) !== null && _c_el !== void 0 ? _c_el : c).filter((c)=>!!c && !exclude_tags.includes(c.dom_type)).map((c)=>run_h(c, exclude_tags))) !== null && _children_map_filter_map !== void 0 ? _children_map_filter_map : []);
};
const UpdateSimulation = (dispatch, payload)=>payload ? !(payload.simulation || payload.static) ? undefined : updateSimulationNodes(dispatch, payload) : dispatch((state)=>[
            state,
            [
                ()=>!(state.simulation || state.static) ? undefined : updateSimulationNodes(dispatch, state)
            ]
        ]);
const UpdateGraphDisplay = (dispatch, payload)=>requestAnimationFrame(()=>dispatch((s)=>[
                {
                    ...s,
                    levels: calculateLevels(payload.nodes, payload.links, payload.display_graph, payload.selected)
                }
            ]));
const CustomDOMEvent = (_, payload)=>{
    var _document_getElementById;
    return (_document_getElementById = document.getElementById(`${payload.html_id}`)) === null || _document_getElementById === void 0 ? void 0 : _document_getElementById.dispatchEvent(new CustomEvent(payload.event, {
        detail: payload.detail
    }));
};
const SimulationToHyperapp = (state, payload)=>[
        {
            ...state,
            levels: calculateLevels(payload.nodes, payload.links, state.display_graph, state.selected),
            nodes: payload.nodes,
            links: payload.links,
            randid: create_randid()
        },
        [
            CustomDOMEvent,
            {
                html_id: state.html_id,
                event: 'updategraph',
                detail: {
                    graph: state.display_graph
                }
            }
        ]
    ];
const FocusEffect = (_, { selector  })=>setTimeout(()=>{
        const el = document.querySelector(selector);
        if (!el) return;
        el.focus();
        if (el instanceof HTMLInputElement && el.type === "text") {
            el.select();
        }
    }, 100);
const SetSelectedPositionStyleEffect = (_, { node , svg_offset , dimensions  })=>{
    const rt = document.querySelector(':root');
    var _svg_offset_scale, _svg_offset_x;
    rt.style.setProperty('--nodex', `${Math.min(node.x * ((_svg_offset_scale = svg_offset === null || svg_offset === void 0 ? void 0 : svg_offset.scale) !== null && _svg_offset_scale !== void 0 ? _svg_offset_scale : 1) + ((_svg_offset_x = svg_offset === null || svg_offset === void 0 ? void 0 : svg_offset.x) !== null && _svg_offset_x !== void 0 ? _svg_offset_x : 0) - 64, dimensions.x - 256)}px`);
    var _svg_offset_scale1, _svg_offset_y;
    rt.style.setProperty('--nodey', `${node.y * ((_svg_offset_scale1 = svg_offset === null || svg_offset === void 0 ? void 0 : svg_offset.scale) !== null && _svg_offset_scale1 !== void 0 ? _svg_offset_scale1 : 1) + ((_svg_offset_y = svg_offset === null || svg_offset === void 0 ? void 0 : svg_offset.y) !== null && _svg_offset_y !== void 0 ? _svg_offset_y : 0) + 32}px`);
};
const SelectNode = (state, { node_id , focus_property  })=>[
        state.selected[0] === node_id ? state : {
            ...state,
            selected: [
                node_id
            ],
            inputs: {}
        },
        !state.show_all && [
            pzobj.effect,
            {
                ...state,
                node_id: node_id
            }
        ],
        [
            UpdateGraphDisplay,
            {
                ...state,
                selected: [
                    node_id
                ]
            }
        ],
        (state.show_all || state.selected[0] !== node_id) && [
            pzobj.effect,
            {
                ...state,
                node_id
            }
        ],
        focus_property && [
            FocusEffect,
            {
                selector: `.node-info input.${focus_property}`
            }
        ],
        state.nodes.find((n)=>n.node_id === node_id) && [
            SetSelectedPositionStyleEffect,
            {
                node: state.nodes.find((n)=>n.node_id === node_id),
                svg_offset: pzobj.getTransform(),
                dimensions: state.dimensions
            }
        ],
        node_id === state.display_graph.out ? [
            ()=>info_display_dispatch({
                    el: {
                        dom_type: "div",
                        props: {},
                        children: [
                            {
                                dom_type: "text_value",
                                text: "Most recent graphs"
                            },
                            {
                                dom_type: "ul",
                                props: {},
                                children: localStorage.getItem("graph_list") ? JSON.parse(localStorage.getItem("graph_list")).slice(0, 10).map((gid)=>({
                                        dom_type: "li",
                                        props: {},
                                        children: [
                                            {
                                                dom_type: "a",
                                                props: {
                                                    href: "#",
                                                    onclick: (s)=>[
                                                            s,
                                                            [
                                                                ()=>main_app_dispatch((ms)=>[
                                                                            ms,
                                                                            [
                                                                                ChangeDisplayGraphId,
                                                                                {
                                                                                    id: gid
                                                                                }
                                                                            ]
                                                                        ])
                                                            ]
                                                        ]
                                                },
                                                children: [
                                                    {
                                                        dom_type: "text_value",
                                                        text: gid
                                                    }
                                                ]
                                            }
                                        ]
                                    })) : []
                            }
                        ]
                    }
                })
        ] : [
            ()=>update_info_display({
                    fn: node_id,
                    graph: state.display_graph,
                    args: {}
                })
        ],
        state.selected[0] !== node_id && [
            ()=>nolib.no.runtime.publish("nodeselect", {
                    data: node_id
                })
        ]
    ];
const CreateNode = (state, { node , child , child_as , parent  })=>[
        {
            ...state,
            history: state.history.concat([
                {
                    action: 'add_node',
                    node,
                    child,
                    child_as
                }
            ])
        },
        [
            (dispatch)=>{
                nolib.no.runtime.add_node(state.display_graph, node);
                nolib.no.runtime.update_edges(state.display_graph, parent ? [
                    {
                        from: node.id,
                        to: child,
                        as: parent.as
                    },
                    {
                        from: parent.from,
                        to: node.id,
                        as: 'arg0'
                    }
                ] : [
                    {
                        from: node.id,
                        to: child,
                        as: child_as
                    }
                ], parent ? [
                    {
                        from: parent.from,
                        to: child
                    }
                ] : []);
                // Hacky - have to wait until the node is finished adding and the graph callback takes place before updating selected node.
                setTimeout(()=>requestAnimationFrame(()=>dispatch(SelectNode, {
                            node_id: node.id
                        })), 50);
            }
        ]
    ];
const DeleteNode = (state, { node_id  })=>[
        {
            ...state,
            history: state.history.concat([
                {
                    action: 'delete_node',
                    node_id
                }
            ])
        },
        [
            (dispatch, { node_id  })=>requestAnimationFrame(()=>dispatch(SelectNode, {
                        node_id
                    })),
            {
                node_id: nolib.no.runtime.get_edge_out(state.display_graph, node_id).to
            }
        ],
        [
            ()=>nolib.no.runtime.delete_node(state.display_graph, node_id)
        ]
    ];
const ExpandContract = (state, { node_id  })=>{
    const node = state.display_graph.nodes.find((n)=>n.id === node_id);
    const update = node.nodes ? expand_node({
        nolib,
        node_id,
        display_graph: state.display_graph
    }) : contract_node({
        nolib,
        node_id,
        display_graph: state.display_graph
    });
    return [
        state,
        [
            (dispatch)=>{
                requestAnimationFrame(()=>{
                    // Have to be the same time so the right node is selected
                    nolib.no.runtime.change_graph(update.display_graph);
                    dispatch(SelectNode, {
                        node_id: update.selected[0]
                    });
                });
            }
        ]
    ];
};
const CreateRef = (state, { node  })=>[
        state,
        [
            (dispatch)=>{
                const graph = {
                    ...base_graph(node),
                    id: node.name,
                    value: undefined
                };
                nolib.no.runtime.change_graph(graph);
                save_graph(graph);
                nolib.no.runtime.add_node(state.display_graph, {
                    id: node.id,
                    value: node.value,
                    ref: node.name,
                    name: undefined
                });
            }
        ]
    ];
const Copy = (state, { cut , as  })=>{
    return {
        ...state,
        copied: {
            graph: ancestor_graph(nolib, state.selected[0], state.display_graph),
            root: state.selected[0],
            as
        }
    };
};
const Paste = (state)=>[
        {
            ...state
        },
        [
            (dispatch)=>{
                const node_id_map = {};
                state.copied.graph.nodes.forEach((n)=>{
                    const new_id = create_randid();
                    node_id_map[n.id] = new_id;
                    nolib.no.runtime.add_node(state.display_graph, {
                        ...n,
                        id: new_id
                    });
                });
                nolib.no.runtime.update_edges(state.display_graph, state.copied.graph.edges.map((e)=>({
                        ...e,
                        from: node_id_map[e.from],
                        to: node_id_map[e.to]
                    })).concat([
                    {
                        from: node_id_map[state.copied.root],
                        to: state.selected[0],
                        as: state.copied.as
                    }
                ]));
                requestAnimationFrame(()=>dispatch(SelectNode, {
                        node_id: node_id_map[state.copied.root],
                        focus_property: 'edge'
                    }));
            }
        ]
    ];
const update_graph_list = (graph_id)=>{
    var _JSON_parse;
    var _JSON_parse_filter;
    const graph_list = (_JSON_parse_filter = (_JSON_parse = JSON.parse(localStorage.getItem('graph_list'))) === null || _JSON_parse === void 0 ? void 0 : _JSON_parse.filter((l)=>l !== graph_id)) !== null && _JSON_parse_filter !== void 0 ? _JSON_parse_filter : [];
    graph_list.unshift(graph_id);
    localStorage.setItem('graph_list', JSON.stringify(graph_list));
};
const save_graph = (graph)=>{
    console.log(`saving ${graph.id}`);
    graph = base_graph(graph);
    const graphstr = JSON.stringify(base_graph(graph));
    localStorage.setItem(graph.id, graphstr);
    nolib.no.runtime.add_ref(graph);
};
const SaveGraph = (dispatch, payload)=>save_graph(payload.display_graph);
const ChangeDisplayGraphId = (dispatch, { id , select_out  })=>{
    requestAnimationFrame(()=>{
        const json = undefined; //localStorage.getItem(id);
        var _ref, _ref1, _ref2;
        const graphPromise = Promise.resolve((_ref2 = (_ref1 = (_ref = json ) !== null && _ref !== void 0 ? _ref : nolib.no.runtime.get_graph(id)) !== null && _ref1 !== void 0 ? _ref1 : nolib.no.runtime.get_ref(id)) !== null && _ref2 !== void 0 ? _ref2 : resfetch(`json/${id}.json`).then((r)=>r.status === 200 ? r.json() : undefined).catch((_)=>undefined));
        window.location.hash = '#' + id;
        graphPromise.then((graph)=>dispatch((state)=>[
                    {
                        ...state,
                        display_graph_id: id
                    },
                    [
                        (dispatch)=>{
                            requestAnimationFrame(()=>{
                                update_graph_list(id);
                                const new_graph = graph !== null && graph !== void 0 ? graph : Object.assign({}, base_graph(state.display_graph), {
                                    id
                                });
                                nolib.no.runtime.change_graph(new_graph);
                                nolib.no.runtime.remove_graph_listeners(state.display_graph_id);
                                dispatch((s)=>{
                                    const news = {
                                        ...s,
                                        display_graph: new_graph,
                                        selected: [
                                            new_graph.out
                                        ],
                                        display_graph_id: new_graph.id
                                    };
                                    return [
                                        news,
                                        [
                                            UpdateSimulation,
                                            {
                                                ...news,
                                                clear_simulation_cache: true
                                            }
                                        ]
                                    ];
                                });
                                if (!graph) {
                                    dispatch(UpdateNode, {
                                        node: nolib.no.runtime.get_node(new_graph, new_graph.out),
                                        property: "name",
                                        value: id,
                                        display_graph: new_graph
                                    });
                                }
                            // dispatch(SelectNode, {node_id: new_graph.out})
                            });
                        }
                    ]
                ]));
    });
};
const Search = (state, { payload , nodes  })=>{
    if (payload.key === "Escape") {
        return [
            {
                ...state,
                search: false,
                search_index: 0
            },
            [
                (dispatch)=>payload.target.value = ""
            ]
        ];
    }
    const direction = payload.key === "Enter" ? payload.shiftKey ? -1 : 1 : 0;
    const search_results = new Fuse(nodes.map((n)=>Object.assign({}, n, nolib.no.runtime.get_node(state.display_graph, n.node_id), nolib.no.runtime.get_edge_out(state.display_graph, n.node_id))), {
        keys: [
            'name',
            'ref',
            'value',
            'as'
        ]
    }).search(payload.target.value);
    var _state_search_index;
    const search_index = search_results.length > 0 ? (search_results.length + ((_state_search_index = state.search_index) !== null && _state_search_index !== void 0 ? _state_search_index : 0) + direction) % search_results.length : 0;
    return [
        {
            ...state,
            search: payload.target.value,
            search_index
        },
        search_results.length > 0 && [
            (dispatch)=>requestAnimationFrame(()=>dispatch(SelectNode, {
                        node_id: search_results[search_index].item.id
                    }))
        ]
    ];
};
const UpdateNodeEffect = (_, { display_graph , node  })=>nolib.no.runtime.add_node(display_graph, node);
const UpdateNode = (state, { node , property , value , display_graph  })=>[
        {
            ...state,
            history: state.history.concat([
                {
                    action: 'update_node',
                    node: node,
                    property,
                    value
                }
            ])
        },
        [
            UpdateNodeEffect,
            {
                display_graph: display_graph !== null && display_graph !== void 0 ? display_graph : state.display_graph,
                node: Object.assign({}, base_node(node !== null && node !== void 0 ? node : nolib.no.runtime.get_node(state.display_graph, state.selected[0])), {
                    [property]: value === "" ? undefined : value
                })
            }
        ]
    ];
const UpdateEdge = (state, { edge , as  })=>[
        state,
        [
            ()=>nolib.no.runtime.edit_edge(state.display_graph, {
                    ...edge,
                    as
                }, edge)
        ]
    ];
const fill_rect_el = ()=>ha.h('rect', {
        class: 'fill',
        width: '48',
        'height': '48'
    }, []);
const node_text_el = ({ node_id , primary , focus_primary , secondary  })=>ha.h('text', {
        x: 48,
        y: 12
    }, [
        ha.h('tspan', {
            class: "primary",
            dy: ".6em",
            x: "48",
            onclick: [
                SelectNode,
                {
                    node_id,
                    focus_property: focus_primary
                }
            ]
        }, ha.text(primary)),
        ha.h('tspan', {
            class: "secondary",
            dy: "1.2em",
            x: "48",
            onclick: [
                SelectNode,
                {
                    node_id,
                    focus_property: "ref"
                }
            ]
        }, ha.text(secondary))
    ]);
const defs = ()=>ha.h('defs', {}, [
        ha.h('filter', {
            id: "flood-background",
            width: 1.2,
            height: 1.1,
            x: 0,
            y: 0
        }, [
            ha.h('feFlood', {
                floodColor: "#000a"
            }),
            ha.h('feComposite', {
                in: "SourceGraphic",
                operator: "over"
            })
        ]),
        ha.h('marker', {
            id: "arrow",
            refX: 8,
            refY: 4,
            markerWidth: 8,
            markerHeight: 8,
            markerUnits: "userSpaceOnUse",
            orient: "auto"
        }, [
            ha.h('polyline', {
                points: "1 1, 8 4, 1 8"
            })
        ])
    ]);
const radius = 24;
const node_el = ({ html_id , selected , error , selected_distance , node_id , node_ref , node_name , node_value , has_nodes , nested_edge_count , nested_node_count  })=>ha.h('svg', {
        onclick: [
            SelectNode,
            {
                node_id
            }
        ],
        ontouchstart: [
            SelectNode,
            {
                node_id
            }
        ],
        width: '256',
        height: '64',
        key: html_id + '-' + node_id,
        id: html_id + '-' + node_id.replaceAll("/", "_"),
        class: {
            node: true,
            selected,
            [`distance-${selected_distance < 4 ? selected_distance : 'far'}`]: true
        }
    }, [
        ha.h(node_value !== undefined && !(node_ref && node_ref !== "arg") ? 'polygon' : node_ref === 'return' ? 'rect' : 'circle', node_value !== undefined && !(node_ref && node_ref !== "arg") ? {
            class: {
                shape: true,
                value: true,
                error
            },
            points: `4,${4 + radius} ${4 + radius},${4 + radius} ${4 + radius * 0.5},4`
        } : node_ref === 'return' ? {
            class: {
                shape: true,
                ref: true,
                error
            },
            width: radius,
            height: radius,
            x: 10,
            y: 10
        } : {
            class: {
                shape: true,
                none: true,
                error
            },
            r: radius * 0.5,
            cx: radius * 0.5 + 8,
            cy: radius * 0.5 + 8
        }),
        ha.memo(node_text_el, {
            node_id: node_id,
            primary: node_name ? node_name : node_value ? node_value : '',
            focus_primary: node_name ? "name" : "value",
            secondary: node_ref ? node_ref : has_nodes ? `graph (${nested_node_count}, ${nested_edge_count})` : node_value !== undefined ? 'value' : 'object'
        }),
        ha.memo(fill_rect_el)
    ]);
const link_el = ({ link , selected_distance  })=>ha.h('g', {}, [
        ha.h('line', {
            id: `link-${link.source.node_id}`,
            class: {
                "link": true,
                [`distance-${selected_distance}`]: true
            },
            "marker-end": "url(#arrow)"
        }),
        ha.h('svg', {
            id: `edge-info-${link.source.node_id}`,
            class: {
                "edge-info": true,
                [`distance-${selected_distance}`]: true
            },
            onclick: [
                SelectNode,
                {
                    node_id: link.source.node_id,
                    focus_property: "edge"
                }
            ],
            ontouchstart: [
                SelectNode,
                {
                    node_id: link.source.node_id,
                    focus_property: "edge"
                }
            ]
        }, [
            ha.h('rect', {}),
            ha.h('text', {
                fontSize: 14,
                y: 16
            }, [
                ha.text(link.as)
            ])
        ])
    ]);
const insert_node_el = ({ link , randid , node_el_width  })=>ha.h('svg', {
        viewBox: "0 0 512 512",
        id: `insert-${link.source.node_id}`,
        key: `insert-${link.source.node_id}`,
        height: "32px",
        width: "32px",
        x: Math.floor((link.source.x + link.target.x - node_el_width) * 0.5) - 16,
        y: Math.floor((link.source.y + link.target.y) * 0.5) - 16,
        class: 'insert-node',
        onclick: (s, p)=>[
                CreateNode,
                {
                    node: {
                        id: randid
                    },
                    child: link.target.node_id,
                    parent: {
                        from: link.source.node_id,
                        to: link.target.node_id,
                        as: link.as
                    }
                }
            ],
        ontouchstart: (s, p)=>[
                CreateNode,
                {
                    node: {
                        id: randid
                    },
                    child: link.target.node_id,
                    parent: {
                        from: link.source.node_id,
                        to: link.target.node_id,
                        as: link.as
                    }
                }
            ]
    }, [
        ha.h('path', {
            d: "M448 256c0-106-86-192-192-192S64 150 64 256s86 192 192 192 192-86 192-192z",
            class: "circle"
        }, []),
        ha.h('path', {
            d: "M256 176v160M336 256H176",
            class: "add"
        }, [])
    ]);
var _inputs_;
const input_el = ({ label , property , value , onchange , options , inputs , disabled  })=>ha.h('div', {
        class: 'value-input'
    }, [
        ha.h('label', {
            for: `edit-text-${property}`
        }, [
            ha.text(label)
        ]),
        ha.h('input', {
            class: property,
            id: `edit-text-${property}`,
            key: `edit-text-${property}`,
            name: `edit-text-${property}`,
            disabled,
            list: options && options.length > 0 ? `edit-text-list-${property}` : undefined,
            oninput: (s, e)=>[
                    {
                        ...s,
                        inputs: Object.assign(s.inputs, {
                            [`edit-text-${property}`]: e.target.value
                        })
                    }
                ],
            onchange: (s, e)=>[
                    {
                        ...s,
                        inputs: Object.assign(s.inputs, {
                            [`edit-text-${property}`]: undefined
                        })
                    },
                    [
                        (dispatch)=>dispatch(onchange, e)
                    ]
                ],
            onfocus: (state, event)=>[
                    {
                        ...state,
                        focused: event.target.id
                    }
                ],
            onblur: (state, event)=>[
                    {
                        ...state,
                        focused: false
                    }
                ],
            value: (_inputs_ = inputs[`edit-text-${property}`]) !== null && _inputs_ !== void 0 ? _inputs_ : value
        }),
        options && options.length > 0 && ha.h('datalist', {
            id: `edit-text-list-${property}`
        }, options.map((o)=>ha.h('option', {
                value: o
            })))
    ]);
const info_el = ({ node , hidden , edges_in , link_out , display_graph_id , randid , refs , ref_graphs , html_id , copied_graph , inputs , graph_out , editing  })=>{
    var _node_nodes, _node_nodes1, _node_nodes2;
    //const s.display_graph.id === s.display_graph_id && nolib.no.runtime.get_node(s.display_graph, s.selected[0]) && 
    const node_ref = node && node.ref ? nolib.no.runtime.get_ref(display_graph_id, node.ref) : node;
    const description = node_ref === null || node_ref === void 0 ? void 0 : node_ref.description;
    const node_arg_labels = (node === null || node === void 0 ? void 0 : node.id) ? node_args(nolib, ha, display_graph_id, node.id) : [];
    var _edges_in_filter_map_;
    return ha.h('div', {
        id: "node-info-wrapper"
    }, [
        ha.h('div', {
            class: "spacer before"
        }, []),
        ha.h('div', {
            class: {
                'node-info': true,
                hidden,
                editing,
                [node.ref]: !!node.ref
            },
            onfocusin: (state)=>[
                    {
                        ...state,
                        editing: true
                    }
                ],
            onblurout: (state)=>[
                    {
                        ...state,
                        editing: false
                    }
                ]
        }, [
            ha.h('div', {
                class: "args"
            }, node_arg_labels.map((n)=>ha.h('span', {
                    class: "clickable",
                    onclick: (_edges_in_filter_map_ = edges_in.filter((l)=>l.as === n).map((l)=>[
                            SelectNode,
                            {
                                node_id: l.from
                            }
                        ])[0]) !== null && _edges_in_filter_map_ !== void 0 ? _edges_in_filter_map_ : [
                        CreateNode,
                        {
                            node: {
                                id: randid
                            },
                            child: node.id,
                            child_as: n
                        }
                    ]
                }, [
                    ha.text(n)
                ]))),
            ha.h('div', {
                class: "inputs"
            }, [
                input_el({
                    label: "value",
                    value: node.value,
                    property: "value",
                    inputs,
                    onchange: (state, payload)=>[
                            UpdateNode,
                            {
                                node,
                                property: "value",
                                value: payload.target.value
                            }
                        ]
                }),
                input_el({
                    label: "name",
                    value: node.name,
                    property: "name",
                    inputs,
                    onchange: (state, payload)=>[
                            state,
                            node.id !== graph_out && [
                                (d)=>d(UpdateNode, {
                                        node,
                                        property: "name",
                                        value: payload.target.value
                                    })
                            ],
                            node.id === graph_out && [
                                ChangeDisplayGraphId,
                                {
                                    id: payload.target.value,
                                    select_out: true
                                }
                            ]
                        ],
                    options: node.id === graph_out && ref_graphs
                }),
                input_el({
                    label: 'ref',
                    value: node.ref,
                    property: 'ref',
                    inputs,
                    options: refs,
                    onchange: (state, event)=>[
                            UpdateNode,
                            {
                                node,
                                property: "ref",
                                value: event.target.value
                            }
                        ],
                    disabled: node.id === graph_out
                }),
                link_out && link_out.source && input_el({
                    label: "edge",
                    value: link_out.as,
                    property: "edge",
                    inputs,
                    options: node_args(nolib, ha, display_graph_id, link_out.to),
                    onchange: (state, payload)=>[
                            UpdateEdge,
                            {
                                edge: {
                                    from: link_out.from,
                                    to: link_out.to,
                                    as: link_out.as
                                },
                                as: payload.target.value
                            }
                        ]
                })
            ]),
            description && ha.h('div', {
                class: "description"
            }, ha.text(description)),
            ha.h('div', {
                id: `${html_id}-code-editor`
            }, []),
            ha.h('canvas', {
                id: `${html_id}-info-canvas`,
                class: "display-none",
                key: "node-editor-info-canvas"
            }, []),
            ha.h('div', {
                id: `${html_id}-info-display`
            }),
            ha.h('div', {
                class: "buttons"
            }, [
                node.node_id !== graph_out && ha.h('div', {
                    class: "action",
                    onclick: [
                        ExpandContract,
                        {
                            node_id: node.node_id
                        }
                    ]
                }, [
                    ha.h('ion-icon', {
                        name: ((_node_nodes = node.nodes) === null || _node_nodes === void 0 ? void 0 : _node_nodes.length) > 0 ? "expand" : "contract"
                    }),
                    ha.text(((_node_nodes1 = node.nodes) === null || _node_nodes1 === void 0 ? void 0 : _node_nodes1.length) > 0 ? "expand" : "collapse")
                ]),
                ((_node_nodes2 = node.nodes) === null || _node_nodes2 === void 0 ? void 0 : _node_nodes2.length) > 0 && node.name !== '' && ha.h('div', {
                    class: 'action',
                    onclick: [
                        CreateRef,
                        {
                            node
                        }
                    ]
                }, ha.text("make ref")),
                ha.h('div', {
                    class: "action",
                    onclick: [
                        Copy,
                        {
                            cut: false,
                            as: link_out.as
                        }
                    ],
                    key: "copy-action"
                }, [
                    ha.h('ion-icon', {
                        name: 'copy-outline'
                    }),
                    ha.text("copy")
                ]),
                copied_graph && ha.h('div', {
                    class: "action",
                    onclick: [
                        Paste
                    ],
                    key: "paste-action"
                }, [
                    ha.h('ion-icon', {
                        name: 'paste-outline'
                    }),
                    ha.text("paste")
                ]),
                node.node_id == graph_out && ha.h('div', {
                    class: "action",
                    onclick: (state, payload)=>[
                            state,
                            [
                                SaveGraph,
                                state
                            ]
                        ]
                }, [
                    ha.h('ion-icon', {
                        name: 'save-outline'
                    }),
                    ha.text("save")
                ]),
                node.node_id !== graph_out && ha.h('div', {
                    class: "action",
                    onclick: [
                        DeleteNode,
                        {
                            parent: link_out && link_out.source ? {
                                from: link_out.source.node_id,
                                to: link_out.target.node_id,
                                as: link_out.as
                            } : undefined,
                            node_id: node.node_id
                        }
                    ]
                }, [
                    ha.h('ion-icon', {
                        name: 'trash-outline'
                    }),
                    ha.text("delete")
                ])
            ])
        ]),
        ha.h('div', {
            class: "spacer after"
        }, [])
    ]);
};
const search_el = ({ search  })=>ha.h('div', {
        id: "search"
    }, [
        typeof search === "string" && ha.h('input', {
            type: "text",
            onkeydown: (state, payload)=>[
                    Search,
                    {
                        payload,
                        nodes: state.nodes
                    }
                ],
            onblur: (state, payload)=>[
                    {
                        ...state,
                        search: false
                    }
                ]
        }, []),
        typeof search !== "string" && ha.h('ion-icon', {
            name: 'search',
            onclick: (s)=>[
                    {
                        ...s,
                        search: ""
                    },
                    [
                        FocusEffect,
                        {
                            selector: "#search input"
                        }
                    ]
                ]
        }, [
            ha.text('search')
        ])
    ]);
const UpdateResultDisplay = (state, el)=>({
        ...state,
        el: el.el ? {
            ...el.el
        } : {
            ...el
        }
    });
const update_info_display = ({ fn , graph , args  })=>{
    const node = nolib.no.runtime.get_node(graph, fn);
    const node_ref = node && node.ref && nolib.no.runtime.get_ref(node.ref) || node;
    const out_ref = node && node.nodes && nolib.no.runtime.get_node(node, node.out) || node_ref.nodes && nolib.no.runtime.get_node(node_ref, node_ref.out);
    const node_display_el = (node.ref === "return" || out_ref && out_ref.ref === "return") && hlib.run({
        graph,
        fn
    }, {
        ...args,
        _output: "display"
    });
    const update_info_display_fn = (display)=>{
        return info_display_dispatch && requestAnimationFrame(()=>{
            info_display_dispatch(UpdateResultDisplay, {
                el: (display === null || display === void 0 ? void 0 : display.dom_type) ? display : ha.h('div', {})
            });
            requestAnimationFrame(()=>{
                if (window.getComputedStyle(document.getElementById("node-editor-code-editor")).getPropertyValue("display") !== "none") {
                    var _node_script;
                    code_editor.dispatch({
                        changes: {
                            from: 0,
                            to: code_editor.state.doc.length,
                            insert: (_node_script = node.script) !== null && _node_script !== void 0 ? _node_script : node.value
                        }
                    });
                }
            });
        });
    };
    ap_promise(node_display_el, update_info_display_fn);
};
const show_error = (e, t)=>({
        dom_type: 'div',
        props: {},
        children: [
            {
                dom_type: 'text_value',
                text: `Error: ${e}`
            },
            {
                dom_type: 'pre',
                props: {},
                children: [
                    {
                        dom_type: 'text_value',
                        text: t
                    }
                ]
            }
        ]
    });
const result_display = (html_id)=>ha.app({
        init: {
            el: {
                dom_type: 'div',
                props: {},
                children: []
            }
        },
        node: document.getElementById(html_id + "-result"),
        dispatch: middleware,
        view: (s)=>{
            try {
                return run_h({
                    dom_type: 'div',
                    props: {
                        id: `${html_id}-result`
                    },
                    children: [
                        s.el
                    ]
                });
            } catch (e1) {
                try {
                    return run_h(show_error(e1, JSON.stringify(s.el)));
                } catch (e) {
                    return run_h({
                        dom_type: 'div',
                        props: {},
                        children: [
                            {
                                dom_type: 'text_value',
                                text: 'Could not show error'
                            }
                        ]
                    });
                }
            }
        }
    });
const info_display = (html_id)=>ha.app({
        init: {
            el: {
                dom_type: 'div',
                props: {},
                children: []
            }
        },
        node: document.getElementById(html_id + "-info-display"),
        dispatch: middleware,
        view: (s)=>{
            return run_h(s.el, [
                'script'
            ]);
        }
    });
const custom_editor_display = (html_id)=>ha.app({
        init: {
            el: {
                dom_type: 'div',
                props: {},
                children: []
            }
        },
        node: document.getElementById(html_id + "-custom-editor-display"),
        dispatch: middleware,
        view: (s)=>{
            return run_h(s.el, [
                'script'
            ]);
        }
    });
const refresh_custom_editor = ()=>{
    if (localStorage.getItem("custom_editor")) {
        // TODO: combine with update_info
        const graph = JSON.parse(localStorage.getItem("custom_editor"));
        const result = hlib.run({
            graph,
            fn: graph.out
        }, {
            _output: "display"
        }, {
            ...hlib,
            ...nolib
        });
        custom_editor_display_dispatch(()=>({
                el: result
            }));
    } else {
        custom_editor_display_dispatch(()=>({
                el: {
                    dom_type: "div",
                    props: {},
                    children: []
                }
            }));
    }
};
let result_display_dispatch;
let info_display_dispatch;
let custom_editor_display_dispatch;
let code_editor;
const init_code_editor = (dispatch, { html_id  })=>{
    requestAnimationFrame(()=>{
        const languageConf = new Compartment();
        const autoLanguage = EditorState.transactionExtender.of((tr)=>{
            if (!tr.docChanged) return null;
            let docLang = document.getElementsByClassName("markdown").length > 0 ? 'markdown' : 'javascript';
            let stateLang = tr.startState.facet(language) == markdownLanguage ? 'markdown' : 'javascript';
            if (docLang === stateLang) return null;
            return {
                effects: languageConf.reconfigure(docLang === 'markdown' ? markdown() : javascript())
            };
        });
        const background = "#111";
        const highlightBackground = "#00000033";
        code_editor = new EditorView({
            extensions: [
                basicSetup,
                EditorView.theme({
                    "&": {
                        "backgroundColor": background
                    },
                    ".cm-content": {
                        caretColor: "#66ccff",
                        whiteSpace: "pre-wrap",
                        width: "325px"
                    },
                    ".cm-gutters": {
                        backgroundColor: background,
                        outline: "1px solid #515a6b"
                    },
                    "&.cm-activeLine, .cm-activeLine": {
                        backgroundColor: highlightBackground
                    },
                    "&.cm-focused .cm-cursor": {
                        borderLeftColor: "#fff"
                    },
                    "&.cm-focused .cm-selectionBackground, .cm-selectionBackground, ::selection": {
                        backgroundColor: "#233"
                    }
                }, {
                    dark: true
                }),
                languageConf.of(javascript()),
                autoLanguage,
                EditorView.domEventHandlers({
                    "blur": ()=>dispatch(UpdateNode, {
                            property: "value",
                            value: code_editor.state.doc.sliceString(0, code_editor.state.doc.length, "\n")
                        })
                })
            ],
            parent: document.getElementById(`${html_id}-code-editor`)
        });
    });
};
const error_nodes = (error)=>error instanceof AggregateError || Array.isArray(error) ? (Array.isArray(error) ? error : error.errors).map((e)=>e instanceof nolib.no.NodysseusError ? e.node_id : false).filter((n)=>n) : error instanceof nolib.no.NodysseusError ? [
        error.node_id
    ] : [];
const runapp = (init, load_graph, _lib)=>{
    var _s_nodes_map, _s_links_map;
    // return () => requestAnimationFrame(() => dispatch.dispatch(s => undefined));
    return ha.app({
        init: [
            init,
            [
                ()=>requestAnimationFrame(()=>{
                        result_display_dispatch = result_display(init.html_id);
                        info_display_dispatch = info_display(init.html_id);
                        custom_editor_display_dispatch = custom_editor_display(init.html_id);
                        refresh_custom_editor();
                        nolib.no.runtime.change_graph(init.display_graph);
                    })
            ],
            [
                ChangeDisplayGraphId,
                {
                    id: load_graph,
                    select_out: true
                }
            ],
            [
                UpdateSimulation,
                {
                    ...init,
                    action: SimulationToHyperapp
                }
            ],
            [
                init_code_editor,
                {
                    html_id: init.html_id
                }
            ]
        ],
        dispatch: middleware,
        view: (s)=>{
            var _s_nodes, _s_links, _s_links1, _s_copied;
            return ha.h('div', {
                id: s.html_id
            }, [
                ha.h('svg', {
                    id: `${s.html_id}-editor`,
                    width: s.dimensions.x,
                    height: s.dimensions.y
                }, [
                    ha.h('g', {
                        id: `${s.html_id}-editor-panzoom`
                    }, [
                        ha.memo(defs)
                    ].concat((_s_nodes_map = (_s_nodes = s.nodes) === null || _s_nodes === void 0 ? void 0 : _s_nodes.map((node)=>{
                        const newnode = Object.assign({}, node, nolib.no.runtime.get_node(s.display_graph, node.node_id));
                        return ha.memo(node_el, {
                            html_id: s.html_id,
                            selected: s.selected[0] === node.node_id,
                            error: !!error_nodes(s.error).find((e)=>e.startsWith(s.display_graph.id + "/" + node.node_id)),
                            selected_distance: s.show_all ? 0 : s.levels.distance_from_selected.get(node.node_id) > 3 ? 'far' : s.levels.distance_from_selected.get(node.node_id),
                            node_id: node.node_id,
                            node_name: newnode.name,
                            node_ref: newnode.ref,
                            node_value: newnode.value,
                            has_nodes: !!newnode.nodes,
                            nested_edge_count: newnode.nested_edge_count,
                            nested_node_count: newnode.nested_node_count
                        });
                    })) !== null && _s_nodes_map !== void 0 ? _s_nodes_map : []).concat((_s_links_map = (_s_links = s.links) === null || _s_links === void 0 ? void 0 : _s_links.map((link)=>ha.memo(link_el, {
                            link: Object.assign({}, link, nolib.no.runtime.get_edge(s.display_graph, link.source.node_id)),
                            selected_distance: s.show_all ? 0 : s.levels.distance_from_selected.get(link.source.node_id) > 3 ? 'far' : s.levels.distance_from_selected.get(link.source.node_id)
                        }))) !== null && _s_links_map !== void 0 ? _s_links_map : []).concat((_s_links1 = s.links) === null || _s_links1 === void 0 ? void 0 : _s_links1.filter((link)=>link.source.node_id == s.selected[0] || link.target.node_id === s.selected[0]).map((link)=>insert_node_el({
                            link,
                            randid: s.randid,
                            node_el_width: s.node_el_width
                        }))))
                ]),
                info_el({
                    node: Object.assign({}, s.nodes.find((n)=>n.node_id === s.selected[0]), nolib.no.runtime.get_node(s.display_graph, s.selected[0])),
                    hidden: s.show_all,
                    edges_in: nolib.no.runtime.get_edges_in(s.display_graph, s.selected[0]),
                    link_out: Object.assign({}, s.links.find((l)=>l.source.node_id === s.selected[0]), nolib.no.runtime.get_edge(s.display_graph, s.selected[0])),
                    display_graph_id: s.display_graph.id,
                    randid: s.randid,
                    editing: s.editing,
                    refs: nolib.no.runtime.refs(),
                    ref_graphs: nolib.no.runtime.ref_graphs(),
                    html_id: s.html_id,
                    copied_graph: (_s_copied = s.copied) === null || _s_copied === void 0 ? void 0 : _s_copied.graph,
                    inputs: s.inputs,
                    graph_out: s.display_graph.out
                }),
                ha.h('div', {
                    id: `${init.html_id}-custom-editor-display`
                }),
                ha.h('div', {
                    id: "graph-actions"
                }, [
                    search_el({
                        search: s.search,
                        _lib
                    }),
                    ha.h('ion-icon', {
                        name: 'sync-outline',
                        onclick: (s)=>[
                                s,
                                [
                                    (dispatch)=>{
                                        nolib.no.runtime.delete_cache();
                                        hlib.run(s.display_graph, s.display_graph.out, {
                                            _output: "value"
                                        });
                                        refresh_custom_editor();
                                        requestAnimationFrame(()=>dispatch((s)=>[
                                                    s,
                                                    [
                                                        ()=>{
                                                            s.simulation.alpha(1);
                                                            s.simulation.nodes([]);
                                                        }
                                                    ],
                                                    [
                                                        UpdateSimulation
                                                    ]
                                                ]));
                                    }
                                ]
                            ]
                    }, [
                        ha.text('refresh')
                    ])
                ]),
                ha.h('div', {
                    id: `${init.html_id}-result`
                }),
                s.error && ha.h('div', {
                    id: 'node-editor-error'
                }, run_h(show_error(s.error, s.error.node_id)))
            ]);
        },
        node: document.getElementById(init.html_id),
        subscriptions: (s)=>{
            return [
                [
                    d3subscription,
                    {
                        action: SimulationToHyperapp,
                        update: UpdateSimulation
                    }
                ],
                [
                    graph_subscription,
                    {
                        display_graph_id: s.display_graph_id
                    }
                ],
                [
                    select_node_subscription,
                    {}
                ],
                result_display_dispatch && [
                    result_subscription,
                    {
                        display_graph_id: s.display_graph_id
                    }
                ],
                [
                    keydownSubscription,
                    {
                        action: (state, payload)=>{
                            if (document.getElementById("node-editor-result").contains(payload.target)) {
                                return [
                                    state
                                ];
                            }
                            const mode = state.editing !== false ? 'editing' : state.search !== false ? 'searching' : 'graph';
                            const key_input = (payload.ctrlKey ? 'ctrl_' : '') + (payload.shiftKey ? 'shift_' : '') + (payload.key === '?' ? 'questionmark' : payload.key.toLowerCase());
                            let action;
                            let effects = [];
                            const selected = state.selected[0];
                            switch(key_input){
                                case "ctrl_o":
                                    {
                                        action = [
                                            SelectNode,
                                            {
                                                node_id: state.display_graph.out,
                                                focus_property: 'name'
                                            }
                                        ];
                                        payload.stopPropagation();
                                        payload.preventDefault();
                                        break;
                                    }
                                default:
                                    {
                                        const result = hlib.run(init.keybindings, "out", {}, hlib)[mode][key_input];
                                        switch(result){
                                            case "up":
                                                {
                                                    var _parent_edges_;
                                                    const parent_edges = nolib.no.runtime.get_edges_in(state.display_graph, selected);
                                                    const node_id = parent_edges === null || parent_edges === void 0 ? void 0 : (_parent_edges_ = parent_edges[Math.ceil(parent_edges.length / 2) - 1]) === null || _parent_edges_ === void 0 ? void 0 : _parent_edges_.from;
                                                    action = node_id ? [
                                                        SelectNode,
                                                        {
                                                            node_id
                                                        }
                                                    ] : [
                                                        state
                                                    ];
                                                    break;
                                                }
                                            case "down":
                                                {
                                                    const child_edge = state.display_graph.edges.find((e)=>e.from === selected);
                                                    const node_id1 = child_edge === null || child_edge === void 0 ? void 0 : child_edge.to;
                                                    action = node_id1 ? [
                                                        SelectNode,
                                                        {
                                                            node_id: node_id1
                                                        }
                                                    ] : [
                                                        state
                                                    ];
                                                    break;
                                                }
                                            case "left":
                                            case "right":
                                                {
                                                    var _siblings_reduce, _siblings_reduce_;
                                                    const dirmult = result === "left" ? 1 : -1;
                                                    const current_node = nolib.no.runtime.get_node(state.display_graph, selected);
                                                    const siblings = state.levels.siblings.get(selected);
                                                    const node_id2 = (_siblings_reduce = siblings.reduce((dist, sibling)=>{
                                                        const sibling_node = state.nodes.find((n)=>n.node_id === sibling);
                                                        if (!sibling_node) {
                                                            return dist;
                                                        }
                                                        const xdist = Math.abs(sibling_node.x - current_node.x);
                                                        dist = dirmult * (sibling_node.x - current_node.x) < 0 && xdist < dist[0] ? [
                                                            xdist,
                                                            sibling_node
                                                        ] : dist;
                                                        return dist;
                                                    }, [
                                                        state.dimensions.x
                                                    ])) === null || _siblings_reduce === void 0 ? void 0 : (_siblings_reduce_ = _siblings_reduce[1]) === null || _siblings_reduce_ === void 0 ? void 0 : _siblings_reduce_.node_id;
                                                    action = node_id2 ? [
                                                        SelectNode,
                                                        {
                                                            node_id: node_id2
                                                        }
                                                    ] : [
                                                        state
                                                    ];
                                                    break;
                                                }
                                            case "save":
                                                {
                                                    effects.push([
                                                        SaveGraph,
                                                        state
                                                    ]);
                                                    break;
                                                }
                                            case "copy":
                                                {
                                                    action = [
                                                        Copy,
                                                        {
                                                            as: nolib.no.runtime.get_edge_out(state.display_graph, state.selected[0]).as
                                                        }
                                                    ];
                                                    break;
                                                }
                                            case "paste":
                                                {
                                                    action = [
                                                        Paste
                                                    ];
                                                    break;
                                                }
                                            case "find":
                                                {
                                                    action = (s)=>[
                                                            {
                                                                ...s,
                                                                search: ""
                                                            },
                                                            [
                                                                FocusEffect,
                                                                {
                                                                    selector: "#search input"
                                                                }
                                                            ]
                                                        ];
                                                    break;
                                                }
                                            case "expand_contract":
                                                {
                                                    action = [
                                                        ExpandContract,
                                                        {
                                                            node_id: state.selected[0]
                                                        }
                                                    ];
                                                    break;
                                                }
                                            case "delete_node":
                                                {
                                                    action = [
                                                        DeleteNode,
                                                        {
                                                            node_id: state.selected[0]
                                                        }
                                                    ];
                                                    break;
                                                }
                                            case "edit_name":
                                                {
                                                    action = [
                                                        SelectNode,
                                                        {
                                                            node_id: state.selected[0],
                                                            focus_property: "name"
                                                        }
                                                    ];
                                                    break;
                                                }
                                            case "edit_value":
                                                {
                                                    action = [
                                                        SelectNode,
                                                        {
                                                            node_id: state.selected[0],
                                                            focus_property: "value"
                                                        }
                                                    ];
                                                    break;
                                                }
                                            case "edit_ref":
                                                {
                                                    action = [
                                                        SelectNode,
                                                        {
                                                            node_id: state.selected[0],
                                                            focus_property: "ref"
                                                        }
                                                    ];
                                                    break;
                                                }
                                            case "edit_edge":
                                                {
                                                    action = [
                                                        SelectNode,
                                                        {
                                                            node_id: state.selected[0],
                                                            focus_property: "edge"
                                                        }
                                                    ];
                                                    break;
                                                }
                                            case "end_editing":
                                                {
                                                    action = [
                                                        (state)=>[
                                                                {
                                                                    ...state,
                                                                    show_all: true,
                                                                    focused: false,
                                                                    editing: false
                                                                },
                                                                [
                                                                    ()=>requestAnimationFrame(()=>nolib.no.runtime.publish('show_all', {
                                                                                data: true
                                                                            }))
                                                                ]
                                                            ]
                                                    ];
                                                    break;
                                                }
                                            default:
                                                {
                                                    if (result !== undefined) {
                                                        console.log(`Not implemented ${result}`);
                                                    }
                                                    nolib.no.runtime.publish('keydown', {
                                                        data: key_input
                                                    });
                                                }
                                        }
                                    }
                            }
                            return action ? action : [
                                state,
                                ...effects
                            ];
                        }
                    }
                ],
                listen('resize', (s)=>[
                        {
                            ...s,
                            dimensions: {
                                x: document.getElementById(init.html_id).clientWidth,
                                y: document.getElementById(init.html_id).clientHeight
                            }
                        },
                        false 
                    ]),
                !!document.getElementById(`${init.html_id}-editor-panzoom`) && [
                    pzobj.init,
                    {
                        id: `${init.html_id}-editor-panzoom`,
                        action: (s, p)=>[
                                {
                                    ...s,
                                    show_all: p.event !== 'effect_transform',
                                    editing: p.event === 'effect_transform' && s.editing,
                                    focused: p.event === 'effect_transform' && s.focused,
                                    noautozoom: p.noautozoom && !s.stopped
                                },
                                [
                                    ()=>requestAnimationFrame(()=>nolib.no.runtime.publish('show_all', {
                                                data: p.event !== 'effect_transform'
                                            }))
                                ]
                            ]
                    }
                ]
            ];
        }
    });
};
let main_app_dispatch;
const editor = async function(html_id, display_graph, lib, norun) {
    const simple = await resfetch("json/simple.json").then((r)=>r.json());
    // TODO: clean this up it's just used for side effect of initializing the db
    run(simple);
    const url_params = new URLSearchParams(document.location.search);
    var _JSON_parse;
    const graph_list = (_JSON_parse = JSON.parse(localStorage.getItem("graph_list"))) !== null && _JSON_parse !== void 0 ? _JSON_parse : [];
    const hash_graph = window.location.hash.substring(1);
    const keybindings = await resfetch("json/keybindings.json").then((r)=>r.json());
    // let stored_graph = JSON.parse(localStorage.getItem(hash_graph ?? graph_list?.[0]));
    // stored_graph = stored_graph ? base_graph(stored_graph) : undefined
    await Promise.all(graph_list.map((id)=>localStorage.getItem(id)).filter((g)=>g).map((graph)=>JSON.parse(graph)).map((graph)=>Promise.resolve(nolib.no.runtime.add_ref(base_graph(graph)))));
    var _window_location_hash;
    // Promise.resolve(stored_graph ?? (hash_graph ? resfetch(`json/${hash_graph}.json`).then(r => r.status !== 200 ? simple : r.json()).catch(_ => simple) : simple))
    // .then(display_graph => {
    const init = {
        keybindings,
        display_graph_id: 'simple',
        display_graph: simple,
        hash: (_window_location_hash = window.location.hash) !== null && _window_location_hash !== void 0 ? _window_location_hash : "",
        url_params,
        html_id,
        dimensions: {
            x: document.getElementById(html_id).clientWidth,
            y: document.getElementById(html_id).clientHeight
        },
        readonly: false,
        norun: norun || url_params.get("norun") !== null,
        hide_types: false,
        offset: {
            x: 0,
            y: 0
        },
        nodes: [],
        links: [],
        focused: false,
        editing: false,
        search: false,
        show_all: false,
        show_result: false,
        node_el_width: 256,
        args_display: false,
        imports: {},
        history: [],
        redo_history: [],
        selected: [
            "out"
        ],
        inputs: {}
    };
    var _graph_list_;
    main_app_dispatch = runapp(init, hash_graph && hash_graph !== "" ? hash_graph : (_graph_list_ = graph_list === null || graph_list === void 0 ? void 0 : graph_list[0]) !== null && _graph_list_ !== void 0 ? _graph_list_ : 'simple', lib);
// })
};
const middleware = (dispatch)=>(ha_action, ha_payload)=>{
        const is_action_array_payload = Array.isArray(ha_action) && ha_action.length === 2 && (typeof ha_action[0] === 'function' || ha_action[0].hasOwnProperty('fn') && ha_action[0].hasOwnProperty('graph'));
        const is_action_obj_payload = typeof ha_action === 'object' && ha_action.hasOwnProperty('fn') && ha_action.hasOwnProperty('graph') && ha_action.hasOwnProperty('args');
        const action = is_action_array_payload ? ha_action[0] : ha_action;
        const payload = is_action_array_payload ? ha_action[1] : is_action_obj_payload ? {
            event: ha_payload
        } : ha_payload;
        return typeof action === 'object' && action.hasOwnProperty('fn') && action.hasOwnProperty('graph') ? dispatch((state, payload)=>{
            try {
                const result = action.stateonly ? hlib.run(action, state) : hlib.run(action, {
                    state,
                    ...payload
                });
                if (!result) {
                    return state;
                }
                var _result_effects;
                const effects = ((_result_effects = result.effects) !== null && _result_effects !== void 0 ? _result_effects : []).filter((e)=>e).map((e)=>{
                    if (typeof e === 'object' && e.hasOwnProperty('fn') && e.hasOwnProperty('graph')) {
                        const effect_fn = hlib.run({
                            graph: e.graph,
                            fn: e.fn
                        });
                        // Object.defineProperty(effect_fn, 'name', {value: e.fn, writable: false})
                        return effect_fn;
                    }
                    return e;
                }); //.map(fx => ispromise(fx) ? fx.catch(e => dispatch(s => [{...s, error: e}])) : fx);
                if (ispromise(result)) {
                    // TODO: handle promises properly
                    return state;
                }
                return result.hasOwnProperty("state") ? effects.length > 0 ? [
                    result.state,
                    ...effects
                ] : result.state : result.hasOwnProperty("action") && result.hasOwnProperty("payload") ? [
                    result.action,
                    result.payload
                ] : state;
            } catch (e) {
                return {
                    ...state,
                    error: e
                };
            }
        }, payload) : dispatch(action, payload);
    };
const runh = (el)=>el.d && el.p && el.c && ha.h(el.d, el.p, el.c);
const hlib = {
    ha: {
        middleware,
        h: {
            args: [
                'dom_type',
                'props',
                'children',
                'memo'
            ],
            fn: (dom_type, props, children, usememo)=>usememo ? ha.memo(runh, {
                    d: dom_type,
                    p: props,
                    c: children
                }) : runh({
                    d: dom_type,
                    p: props,
                    c: children
                })
        },
        app: ha.app,
        text: {
            args: [
                'text'
            ],
            fn: ha.text
        }
    },
    scripts: {
        d3subscription,
        updateSimulationNodes,
        keydownSubscription,
        calculateLevels,
        listen,
        graph_subscription,
        result_subscription,
        save_graph
    },
    effects: {
        position_by_selected: (id, selected, dimensions, nodes)=>{
            selected = Array.isArray(selected) ? selected[0] : selected;
            const el = document.getElementById(id.replaceAll("/", "_"));
            const node = nodes.find((n)=>n.id === selected);
            const x = node.x;
            const y = node.y;
            const svg_offset = hlib.panzoom.getTransform();
            var _svg_offset_scale, _svg_offset_x;
            el.setAttribute("left", `${Math.min(x * ((_svg_offset_scale = svg_offset === null || svg_offset === void 0 ? void 0 : svg_offset.scale) !== null && _svg_offset_scale !== void 0 ? _svg_offset_scale : 1) + ((_svg_offset_x = svg_offset === null || svg_offset === void 0 ? void 0 : svg_offset.x) !== null && _svg_offset_x !== void 0 ? _svg_offset_x : 0) - 64, dimensions.x - 256)}px`);
            var _svg_offset_scale1, _svg_offset_y;
            el.setAttribute("top", `${y * ((_svg_offset_scale1 = svg_offset === null || svg_offset === void 0 ? void 0 : svg_offset.scale) !== null && _svg_offset_scale1 !== void 0 ? _svg_offset_scale1 : 1) + ((_svg_offset_y = svg_offset === null || svg_offset === void 0 ? void 0 : svg_offset.y) !== null && _svg_offset_y !== void 0 ? _svg_offset_y : 0) + 32}px`);
        }
    },
    panzoom: pzobj,
    run: (node, args)=>run(node, args, {
            ...hlib,
            ...nolib
        }),
    d3: {
        forceSimulation,
        forceManyBody,
        forceCenter,
        forceLink,
        forceRadial,
        forceY,
        forceCollide,
        forceX
    }
};

Promise.all([
    "json/simple.json",
    "json/simple_html_hyperapp.json"
].map((url)=>fetch(url).then((e)=>e.json()))).then((examples)=>{
    // if('serviceWorker' in navigator) {
    //     navigator.serviceWorker.register('./sw.js');
    // }
    console.log(editor);
    editor('node-editor');
});
