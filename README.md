# Nodysseus

A generic node-based IDE and visual programming language for touchscreen devices.

[https://nodysssus.io/](https://nodysssus.io/)

## Getting started

The most simple graph is the [helloWorld](https://nodysseus.io/#helloWorld) default graph which just shows "Hello, world!" in the result display. Head there now to follow along for the rest of this section.

### UI Basics

Each graph has a return or output node at the bottom of the graph. It's a special node that will be explained in the next section.

Clicking on a node shows the node info window. The info window has 3 fields: `graph`, `data`, and `comment`. The next couple sections explain `graph` and `data` more. The `comment` field is there to make node notes which will scale as the view zooms out - it (usually) does not change the functionality of the graph.

Every node has a number of input edges and a single output edge. The output edge has a label which is set in the node info window. Data flows from each node along it's output edge to the next node. The label of the edge determines how that data is used in the next node. It's like a named function parameter, or the name of a field in an object.

### Changing graphs

To create a new graph that's a copy of this one, click on the output node and change the `graph` field that currently shows "helloWorld" to "gettingStarted" (or any name you'd like that's *not* available in the dropdown). You can also see graphs you've created before and graphs in the standard library.

#### Changing node value

Try editing the `@html/html_text` node to put your name: 
1. Click on the node, 
2. Edit the text field that has "Hello, world!" in it, e.g. by replacing "world" with your name
3. Your new text should show up in the bottom left of the screen

#### Creating new nodes

Create a new node by clicking "+text" at the top of the node. The  will create a new node as the "text" input for the `@html.html_text` node.

All the inputs for a node can be found at the top of the node. Clicking an existing input will take you to that node, and clicking a non-existing input will create a new node for that input.

#### Changing graph references

Click on the new node that was created. In the graph field, enter `@time.frame`. The display in the bottom right will now show the frames since the node was changed.


### Referencing user-created graphs

Created graphs can be referenced in the `graph` field. The data they pass along their out edge is their `value` input.

1. Change graph to `helloWorld` using the instructions from before (changing the `name` of the output node) or by pressing the browser's back button
2. Create a new graph with the name `reuseExample`
3. Change the data of the output node's `value` input node from "some output" to "Hello again"
4. Go back to the `gettingStarted` graph using the output node `name`
5. Change the graph of the `@time.frame` node from before to `reuseExample`

The output should now show "Hello again".

### Examples

There are a number of example graphs to get a sense of how Nodysseus works. These can be accessed using the links below or by changing the graph. The standard library graphs are also all visible, although to make changes to them you'll need to rename them to something new.


Some examples use only the standard library:

[@example.script](https://nodysseus.ulysses.codes/#@example.script): using javascript with the `@js.script` node
[@example.debugInputValue](https://nodysseus.ulysses.codes/#@example.debugInputValue): debugging using the `@debug.inputValue` node
[@example.htmlEvent](https://nodysseus.ulysses.codes/#@example.htmlEvent): responding to user input with html events
[@example.referencePersist](https://nodysseus.ulysses.codes/#@example.referencePersist): storing and persisting values in variables using `@memory.reference`
[@example.switchInputs](https://nodysseus.ulysses.codes/#@example.switchInputs): switching inputs with a dropdown using the @flow.switchInputs node
[@example.returnDependencies](https://nodysseus.ulysses.codes/#@example.returnDependencies): fine-grained control over whether a node reruns or keeps its value
[@example.ramp](https://nodysseus.ulysses.codes/#@example.ramp): introduces a new node, @html.ramp, that remaps a 0 - 1 value to a custom range.
[@example.nodeDisplay](https://nodysseus.ulysses.codes/#@example.nodeDisplay): using the display of a node in the graph's display

And some integrate third party libraries using ESM modules:

[Markdown](https://nodysseus.ulysses.codes/#@example.markdown): markdown using marked.js
[Three.js](https://nodysseus.ulysses.codes/#@example.threejs): 3D shapes and rendering using Three.js
[Strudel](https://nodysseus.ulysses.codes/#@example.strudel): sounds and music with strudel


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

In the default mode, the graph is rerun whenever it changes.
- Using `@flow.switch`, `@flow.if`, or `@flow.default` will only evaluate the branches that are chosen. All the other branches will not execute.
- If the return value of any executed node is a Promise, the nodes following that node will all return promises. 
- If the return value contains the key `display`, then `display` will be added to the html document using hyperapp. 

Pressing the pause button in the top right turns on rerun mode. The graph will only be rerun when pressing ctrl + enter or clicing the forward icon next to the play button. Pressing the play button returns to the default mode.


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

- **d** change data
- **g** change graph
- **c** change comment
- **shift-enter** expand / collapse

### node creation/deletion
- **o** create parent node
- **a** create parent `arg` node
- **x** delete node (edges are adjusted automatically)
- **ctrl-c** copy
- **ctrl-v** paste

### edges

- **e** edit output edge

## Why use Nodysseus?

### Simple low-code environment

A user needs to know and/or write very little actual code to be able to use Nodysseus effectively. Simple graphs can be created from scratch by anyone, and more complex graphs containing complex programming logic can still be edited by someone without prior programming experience.

Nodysseus also aims to simplify the experience of node-based editing by changing the paradigms employed by many industry-standard applications today. There are a few simple rules taht make it easier to avoid spaghetti networks and allow nodysseus to automatically layout the graph:

1. Nodes can have many inputs but only one output. Edges are labeled to allow function-argument-like access.
2. There is only one node that stores information - the `state` node
3. The `return` node is the main utility that allows argument reuse, event publish/subscribe, and library management

These rules are derived from a mixture of functional programming paradigms, design decisions of the React library, and experimentation within the platform itself.

## Notes

- This is still very much in alpha. It is slow (but I'm working on it!) and there are bugs.
- Exporting 

### Runtime

Nodysseus uses a custom `Map` based runtime for graph execution. The runtime stores graphs, nodes, and arguments; implements event pubsub and caching; and is used extensively in nodes such as `input_value`, `cache` and `event_publisher` (among others).
