# Example 1.2.5 Input ([Graph](https://nodysseus.ulysses.codes/#example_1_2_5))
Fetching a quote and outputting it as HTML.

<div align="center">
    <img src="https://gitlab.com/ulysses.codes/nodysseus/-/raw/main/docs/examples/images/1_2_5_graph.png" title="Example 1.2.5 Input" />
</div>


## Graph breakdown

1. `display` is set up as usual([Example 1.2.2](https://gitlab.com/ulysses.codes/nodysseus/-/blob/main/docs/examples/1_2_2_html_children.md))
2. The first element is "Hello, [text]!"
3. `text` is a `default` node which returns `value` if it is defined or `otherwise`. Before typing in the `input`, `text` is undefined, so it returns "world".
4. When a "name" event is received through Nodysseus, the value will become defined, and `default` will return the new value.
3. The second element is an `input` with two events defined: `onkeydown` and `oninput`. These `runnable` inputs are used as listeners in hyperapp's [action system](https://github.com/jorgebucaran/hyperapp/blob/main/docs/architecture/actions.md)
3. `onkeydown` takes `payload.event` from the values passed in by hyperapp. `payload.event` is the [keydown event](https://developer.mozilla.org/en-US/docs/Web/API/Element/keydown_event) and calls `stopPropagation`. This prevents Nodysseus from responding to keydown events arising from typing in the input.
4. `oninput` takes `payload.event.target.value` from the values passed in by hyperapp. `payload.event.target.value` is the input element's current value.
5. `event_publisher` in the `oninput` graph publishes a "name" event through Nodysseus, allowing other parts of the graph to respond.