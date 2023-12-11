# Nodysseus

A generic node-based editor. Built with hyperapp.

## Why use Nodysseus?

### Simple low-code environment

A user needs to know and/or write very little actual code to be able to use Nodysseus effectively. Simple graphs can be created from scratch by anyone, and more complex graphs containing complex programming logic can still be edited by someone without prior programming experience.

Nodysseus also aims to simplify the experience of node-based editing by changing the paradigms employed by many industry-standard applications today. There are a few simple rules taht make it easier to avoid spaghetti networks and allow nodysseus to automatically layout the graph:

1. Nodes can have many inputs but only one output. Edges are labeled to allow function-argument-like access.
2. There is only one node that stores information - the `state` node
3. The `return` node is the main utility that allows argument reuse, event publish/subscribe, and library management

These rules are derived from a mixture of functional programming paradigms, design decisions of the React library, and experimentation within the platform itself.

## Getting started

The most simple graph is the [helloWorld](https://nodysseus.io/#helloWorld) which just shows "Hello, world!" in the result display. Try editing the html_text node to put your name, or create a "text" input using the "+text" button on the node.

A number of the basic nodes can be found in the references doc.

### Examples
New nodes introduced in the example are included in parentheses.

[Three.js](https://nodysseus.ulysses.codes/#threejs_example)


## Reading a graph

- Each node does something or passes data to its child. 
- Edges (connections/lines) define the relationships between nodes. 
- A node can have many parents, which pass data in, but only one child. 
- A node can reference another hidden node to copy its functionality. By default, nodes have no reference and simply pass along input data to their child
- If a node references `arg`, it will use its `value` like a javascript variable or function argument

## Editing

You can edit a node by using keybindings or by clicking/tapping the selected node's value or reference.

You can edit an edge by using keybindings or clicking/tapping the edge name.

You can edit the graph name by clicking the graph menu in the top right.

## Graph execution

The graph is rerun whenever it changes.
- Using `switch`, `if`, or `default` will only evaluate the branches that are chosen. All the other branches will not execute.
- If the return value of any executed node is a Promise, the nodes following that node will all return promises. 
- If the return value contains the key `display`, then `display` will be added to the html document using hyperapp. 

The graph is executed using a pull model - each node asks its parents (if it has any) for new data before running itself. It uses a [Proxy](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy) object for inputs until they are needed, allowing lazy evaluation while retaining js-compatible objects and correct handling of `switch`, `if`, etc.

## Exporting

Exporting can be done through the root node menu by opening the appropriate `@nodysseus.export` graph.

### JSON

Downloads the JSON representation of the graph. This can be used with `import_json` to import into another node.

Planned improvements:
- loading a .json graph file
- selective importing from a .json file

### JS

Downloads the graph as a runnable .js file. It uses `import "nodysseus"` so make sure wherever you're running it you have access to the [`nodysseus` npm package](https://www.npmjs.com/package/nodysseus).

### HTML

Downloads a html file which will show the graph display result without showing the graph itself. It uses the latest version of nodysseus from npmjs.


## NPM Package ([link](https://www.npmjs.com/package/nodysseus))

The npm package can be used to run graphs from javascript and includes Typescript bindings. It exports `editor` to enable embedding editable or static graphs in a webpage, and `runGraph` for running a graph.

## Shortcuts

### graph actions
- **ctrl-s** save
- **ctrl-z** undo
- **ctrl-y** redo

### navigation

- **up/k** move to left most parent node
- **down/j** move to child node
- **left/h** move to sibling node to the left
- **right/l** move to sibling node to the right
- **enter** open node menu
- **f** search
- **esc** exit search

### node edit mode

- **v** change value
- **s** change script
- **r** change reference
- **n** change name
- **shift-enter** expand / collapse

### node creation/deletion
- **o** create parent node
- **a** create parent `arg` node
- **x** delete node (edges are adjusted automatically)
- **ctrl-c** copy
- **ctrl-v** paste

### edges

- **e** edit output edge


## Notes

- This is still very much in alpha. It is slow (but I'm working on it!) and there are bugs.
- Exporting 

### Runtime

Nodysseus uses a custom `Map` based runtime for graph execution. The runtime stores graphs, nodes, and arguments; implements event pubsub and caching; and is used extensively in nodes such as `input_value`, `cache` and `event_publisher` (among others).
