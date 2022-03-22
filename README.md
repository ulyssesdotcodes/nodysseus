# Nodysseus

A generic node-based editor. Built with hyperapp.

## Reading a graph

- Each node does something or passes data to its child. 
- Edges (connections/lines) define the relationships between nodes. 
- A node can have many parents, which pass data in, but only one child. 
- A node can reference another hidden node to copy its functionality. By default, nodes have no reference and simply pass along input data to their child
- If a node references `arg`, it will draw use it's `value` like a javascript variable or function argument

## Editing

You can edit a node by using keybindings or by clicking/tapping the selected node to bring up the node menu.

You can edit an edge by using keybindings or clicking/tapping the edge name.

## References

Nodes that have something other than `object` in *italics* reference other hidden nodes. It's similar to calling a function with the input nodes as arguments. Using the node menu, you can copy the referenced node or create a reference from the node.

Some common nodes and their Typescript function types:

`log: (value: any) => any` - `console.log`s the value and returns it. Useful for inserting logs into node chains.
`if: (pred: boolean, true?: any, false?: any) => any` - if `pred` is true, returns `true` otherwise returns `false`
`default: (value: any, otherwise: any) => any` - if `value` is not `undefined`, returns `value`, otherwise returns `otherwise`
`switch: (input: string, ...args) => any` - returns the value of the input edge labeled `input`
`html_element: (children: (html_element | html_text | (html_element|html_text)[], dom_type: string, props: any)` - use with `result_display` to add html to the page
`event_publisher: (name: string, value: any) => void` - publishes `value` as a `name` event
`event_subscriber: (name: string) => any` - subscribes to `name` events

## Edge content
An edge takes the return value from one node and feeds it into another node. The edge is labeled `as` something, which indicates what `reference` input it refers to, or what property it should be in an `object`.

## Graph execution

The graph is rerun whenever it change. The return value of `main/out` can be retrieved using an `arg` node. Any time such an `arg` changes in the result, the graph is rerun. If the return value contains the key `result_display`, then `result_display` will be added to the html using hyperapp.

The graph is executed using a pull model - each node asks its parents (if it has any) for new data before running itself.

## Caching and Proxies

Nodysseus caches results and proxies return values automatically. A node will not be rerun unless any of its parents change. The input values of `object` nodes are proxied so they will only be evaluated when necessary. This allows nodes like `if`, `switch`, and `default` to control execution flow.

## Shortcuts

### navigation

- **up** move to left most parent node
- **down** move to child node
- **left** move to sibling node to the left
- **right** move to sibling node to the right
- **enter** open subgraph
- **f** search
- **esc** exit search

### node edit mode

- **a** change args
- **v** change value
- **s** change script
- **n** change name
- **t** change type
- **shift-t** create type (node name is used as type `id`)
- **esc** exit edit mode and save

### node creation/deletion
- **o** create node below
- **shift-o** create node above
- **x** delete node (edges are adjusted automatically)

### edge creation

When `to` and `from` are both present, an edge will be created if there isn't one, or destroyed if there is.

- **c** set pending edge `from` value
- **shift-c** set pending edge `to` value


### edge edit mode

- **e** edit edge edit mode
- **left** move left to sibling edge
- **right** move right to sibling edge
- **a** change "as"
- **t** change type