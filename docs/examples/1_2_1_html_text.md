# Example 1.2.1 HTML text ([Graph](https://nodysseus.ulysses.codes/#example_1_2_1))
Showing simple HTML text elements.

<div align="center">
    <img src="https://gitlab.com/ulysses.codes/nodysseus/-/raw/main/docs/examples/images/1_2_1_graph.png" title="Example 1.2.1 HTML Text" />
</div>


## Graph breakdown

1. Nodysseus takes the value from the last node's `display` input edge and passes it to hyperapp to create HTML elements on the page.
2. `html_element` uses hyperapp to create an HTML element that wraps the text node passed in as `children`. ([Example 1.2.2](https://gitlab.com/ulysses.codes/nodysseus/-/blob/main/docs/examples/1_2_2_html_children.md))
3. `html_text` creates a [DOM Text Node](https://developer.mozilla.org/en-US/docs/Web/API/Text) using [hyperapp](https://github.com/JorgeBucaran/hyperapp) from the `text` input.
4. The top node creates the value "Hello, World!" ([Example 1.1](https://gitlab.com/ulysses.codes/nodysseus/-/blob/main/docs/examples/1_1_viewing_data.md))

## Exercises

### Changing value

1. Change the `value` from "Hello, world!" to "Hello, [your name]!".