# Creating UI Elements

UI elements can be created by making `html_element` and `html_text` nodes inputs to a return's `display` edge.

Suggested beginner reading: `html_text`, `html_element`

## `html_text`

`html_text` corresponds to a [hyperapp text node](https://github.com/jorgebucaran/hyperapp/blob/main/docs/api/text.md). The `text` input edge or the node's value will make plain HTML text.

## `html_element`

`html_element` corresponds to a [hyperapp virtual DOM node](https://github.com/jorgebucaran/hyperapp/blob/main/docs/api/h.md). Its input edges are:

- `dom_type` - the name of the [HTML element](https://developer.mozilla.org/en-US/docs/Web/HTML/Element) or [SVG Element](https://developer.mozilla.org/en-US/docs/Web/SVG/Element). This will also be read from the node's value. E.g. `div`, `button`, `input`
- `props` - the HTML or SVG properties defined as an object. E.g. a `html_element` with an `input` `dom_type` might have an object (no ref or value) node connected to it's `props` edge that has a `type` edge with an input node of value `range`.
- `children` - an `array` of `html_element` or `html_text` nodes which are nested inside the resulting HTML Element
- (Advanced) `memo` - a way of [hyperapp memoizing](https://github.com/jorgebucaran/hyperapp/blob/main/docs/api/memo.md) an element for quick rendering

### Special `props` considerations

There are a few props that are treated differently by hyperapp (and so by Nodysseus):

`class` can be an object node with the input edges named class names and the passed values true or false to set the class. It can also be an array of text classes or a objects.

`style` can be an object node with the input edges named css properties and the passed values the desired css property values. This allows style values to be computed by the node graph.

`onEvent` where `Event` is an [HTML event](https://developer.mozilla.org/en-US/docs/Web/Events) name like `Click` or `PointerOver`. The input `runnable` will be run whenever the event is fired with the HTML event available as an `event` arg. Usually these will be `set_arg_runnable` to communicate with the rest of the current graph, or `event_publish_runnable` to trigger a global event. More info can be found in the Runnable section of this guide.