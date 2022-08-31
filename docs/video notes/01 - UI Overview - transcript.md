# Script

Hello, and welcome to the Nodysseus UI Overview video. In this video I'll explain the various parts of the UI and how you interact with them.

# UI Sections

To begin, we have the main node graph viewer which shows the current open graph. It's like a source file or document. The last node of the graph is the output node - similar to a return statement or the final result of a math equation.

In the bottom left is the display section. It displays what's connected to the output node along the edge named display. In this grpah, it's showing the html_text "Hello, world!"

In the top right there's a find button. When you search for text here, it'll take you to the most relevant node. Pressing enter or shift+enter cycles through the nodes it finds. Pressing escape or clicking the graph hides the window.

Finally there's the node info popup. This is where the functionality of the node can be changed.

 # Node display

Each node has two text lines. The top line shows the name or value of an element. The second line shows its `ref` or reference graph. I can change the name of a node to make it easier to find or understand later. Changing the reference graph changes the function of the node, so I'll leave that alone for now. This node references the `html_element` graph, and it's parent above references the `html_text` graph. If a node doesn't have a `name`, then its value will be shown in the first line.

# Edge display
The line connecting two nodes is an edge. It has an input node, an output node, and a name. The edge name can be changed on the node info popup.

Clicking the (+) icon on an edge will insert a node in between the edge's input and output nodes.

# Node info popup
The node info popup lets you change the functionality of a node.

The first section has all of the arguments to the reference graph. These are like named parameters for a javascript function. `html_element` (from the wonderful hyperapp library) has children, props, dom_type and some more.

Clicking on an argument will create a new node for that argument with a named edge if one doesn't exist already. If the named edge exists already, then clicking will take you to the named edge's input node.

You can set the `value`, `name`, `ref`erenced graph, and `edge` name of a node. If a node has no referenced graph, then it will output it's value. For example, we can change "Hello, world!" to change the `display` in the bottom left.

The value of a node that references another graph will sometimes replace a specific parameter. For example, on the slider node it replaces the `label` input.

Below the attributes is a space for a node's custom view. For example, the slider has a slider here! 

As we saw before, the `name` attribute is primarily for labeling nodes, but on the graph's output node it behaves slightly differently. Changing the `name` here opens up another graph.

Whoops! This graph has an error. In the top left you can see where errors are displayed, and you'll notice that the erroring node turns red. Let's go back to the tutorial graph.

Changing a node's `ref`erence graph changes it's functionality to what that graph does. You can see a list of all the available graphs to reference - including graphs that you've saved before! For now we'll keep it a `html_element`.

At the bottom of the node info popup there are actions. You can collapse a node and all of its ancestors above it into a node-graph or expand a collapsed node graph. There's a copy action to copy a node and it's ancestors, and then you can paste it elsewhere in the graph (or in another graph entirely). `delete` deletes a node and connects the node's inputs to the node's output. On the graph's output node there is `save` action which saves the graph in your browser and allows it to be used as a reference graph for nodes.

# Summary

That wraps up this video, thanks for watching and check out the other nodysseus tutorials!
