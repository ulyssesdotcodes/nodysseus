# Nodysseus

A generic node-based editor. Built with hyperapp.

## Reading a graph

Each node does something or passes its data to its children. Edges define the relationships between nodes.

### Node content

Graph nodes are labeled with either their name, value, or id, in that order. A node has one of the following to determine what it does:

- **value**: passes this value to its children
- **script**: a function body that runs when evaluated with **args** available as variables

If a node has no value or script, it passes all of the data it receives as an object.

### Edge content
An edge connects two nodes, possibly with an `as` value or an edge `type`. If no "as" value is defined, the data is passed by object key/value pairs. Passing a non-object value with no "as" will result in an error.

Types are

- **ref**: the parent's id is passed to the child as a string
- **inputs**: determines which parent nodes to evaluate by passing an array of "as" values
- **concat**: all the values from the parent are passed as an array to the child

If no type is defined, it will pass the returned value as data.


## Graph Execution

A graph is executed by pulling in data to the output node. The edges determine the name of the data coming into each node.

If a node has `nodes` and `edges` property, these are expanded before execution.

If a node has a `type`, then the node with the `id` matching `type` is merged into the node.


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