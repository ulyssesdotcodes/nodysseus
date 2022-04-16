# Example 1.2.1 HTML text ([Graph](https://nodysseus.ulysses.codes/#example_1_2_2))
Building up a more complex example by combining HTML nodes.

<div align="center">
    <img src="https://gitlab.com/ulysses.codes/nodysseus/-/raw/main/docs/examples/images/1_2_2_graph.png" title="Example 1.2.2 HTML Children" />
</div>


## Graph breakdown

1. Nodysseus takes the value from the last node's `display` input edge and passes it to hyperapp to create HTML elements on the page.
2. `array` creates an array from all of the inputs in input label alphabetical order.
3. `html_element` creates a DOM node using the node or node array from the input `children` (or no children if it doesn't exist) and the DOM element type from the input `dom_type` (or `div` if it doesn't exist).
4. `html_text` creates DOM nodes from the ([Example 1.2.1](https://gitlab.com/ulysses.codes/nodysseus/-/blob/main/docs/examples/1_2_1_html_text.md))
6. The "Hello, ", "world", and "!" nodes are all simple value nodes ([Example 1.1](https://gitlab.com/ulysses.codes/nodysseus/-/blob/main/docs/examples/1_1_viewing_data.md))

## Exercises

### Changing dom_type

1. Change the value of the `span` node to `p`

### Adding a dom_type
Goal: changing the HTML element to `pre`

1. Add a `dom_type` input to the final `html_element`
2. Change the new node's value by clicking "undefined" or pressing "v" to `pre`

### Adding more children
Goal: add another child to the final `html_element`

1. Click `array` and add the `arg3` input
2. Change the new node's reference by clicking "object" or pressing "r" to `html_text`
3. Add a text input with a value

### Adding more children using `array`
Goal: change an element with one child to an element with many children

1. Click the "+" button on the edge labeled "children" between the "world" `html_text` and its `html_element`
2. Change the reference of the new node to `array`
3. Create an `arg1` input from the new node
4. Change the new `arg1` input node's reference to `html_text`
5. Create a new `text` input from the `html_text` node
6. Change the new input's value to some text.