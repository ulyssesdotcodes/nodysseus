# Reference graphs

Any graph created in Nodysseus can be used as a `ref` in another graph. It's like having a library of all the classes you've created available for easy access. Graphs will always have `return` as the bottommost output node.


## Creating graphs

Graphs can be created in two ways: by copying an existing graph or by collapsing a `return` node in an existing graph.

To copy an existing graph, rename the output node to an unused graph name. A new graph will be created that's a copy of the original graph, but with the new name.

A graph can also be created by collapsing a `return` node inside an existing graph then clicking "make ref". When collapsing a `return` node, its `args` will be moved to inputs to the newly created subgraph. After collapsing, clicking "make ref" will move the subgraph to its own graph and replace the subgraph with a `ref`. The new graph can be opened in the same way any other graph can be opened.

## Opening graphs

Graphs can be opened by renaming the output node to an existing graph name. When a graph is opened, the result display in the bottom left is replaced with the new graph's display. A graph's output can be pinned using the pin in the top right to keep the old graph's display while editing a reference graph.

Most of the nodes which come with Nodysseus (like `cache`, `slider`, etc) can be opened to see how they work. This is a great way to discover techniques for working with graphs! However, to avoid unexpected behavior, the nodes that come with Nodysseus can't be modified. They can be copied and edited separately though.

## Arguments

The `args` from the bottom output node of a graph are accessible using an `arg` node anywhere in the graph. Any inputs to a node referencing the graph are also available using `arg` nodes. E.g. if there is a graph called `test123` that has an `arg` node with the value `hello`, then any node referencing `test123` will have an autocompleted input of `hello` and the value will be the output of any `hello` `arg` node.

