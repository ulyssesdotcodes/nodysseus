# Example 1.1 Viewing Data

<div align="center">
    <img src="https://gitlab.com/ulysses.codes/nodysseus/-/raw/main/docs/examples/images/1_1_graph.png" title="Example 1.1 Viewing Data" />
</div>


## Graph breakdown

1. The top node creates a value ("Hello, World!"), and passes it to `input_value`. 
2. `input_value` sets its own value to the data from the input labeled `value` and then passes the value onward
3. `log` calls `console.log` with the data passed in at `value` and its own id.

## Exercises

### Changing value

1. Change the `value` from "Hello, world!" to "Hello, [your name]!". Notice how it propagates to the other nodes.

### Adding a log tag

1. Open up your browser developer tools inspector and go to the console tab. Notice that the log shows the node's hidden id before "Hello, world!" (you might have to refresh the page).
2. Click on the `log` node if it's not already highlighted. Click `tag` in the node's info popup to create a `tag` input.
3. Press the "v" key or click on `undefined` in the `tag` node to change its value to "value log" (or anything else). Notice how now "value log" is printed before "Hello, world!" in the console.

