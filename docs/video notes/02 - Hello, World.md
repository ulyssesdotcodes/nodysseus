# Script

Hey everyone, in this video we'll go over making a simple "Hello, world!" graph and then use it to display your name.

# Starting simple

To start, we'll open up the simple graph and rename it to `hello_world`. Head to [https://nodysseus.io/#simple](https://nodysseus.io/#simple) or if you already have Nodysseus open, change to the "simple" graph. This is how changing graphs works in Nodysseus - it's similar to opening different files of a desktop application. Recent graphs are shown on the root node and clicking them takes you to that graph.

The first thing we'll do is give this graph a name. Click on the root node at the bottom of the graph if it isn't selected already, and rename it "hello_world". Click "save" or press "Ctrl+s" to save the graph.


# Adding it all up

We want to change this graph to be able to accept a name argument and put it in the "Hello world!" text.

First thing we'll do is change the `value` of the `html_text` node. Click on it, and change "Hello, world!" to "Hello, [your name]!". We can see the change in the bottom left of the screen.

The next step is to replace the `value` with a text input. A lot of nodes will use their `value` for a specific input if that input is missing. The `html_text` node only takes one input, as shown at the top of the info window, `text`, so that's the input that value replaces. Click the `text` input to create a new node, click on the new node, and type in "Hello again!" to its value parameter, then tab or click out to update the bottom left. Since we're not using the `html_text` value anymore, you can clear that parameter.

