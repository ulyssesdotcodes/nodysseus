# Nodysseus

A generic node-based editor. Built with hyperapp.

## Examples
New nodes introduced in the example are included in parentheses.

### Debugging and viewing data
1. [Simple logging (`input_value`, `log`)](https://nodysseus.ulysses.codes/#example_1_1)

### HTML
1. [Simple text (`html_element`, `html_text`)](https://nodysseus.ulysses.codes/#example_1_2_1)
2. [Children (`array`, `dom_type`)](https://nodysseus.ulysses.codes/#example_1_2_2)
3. [CSS (`css_styles`, `props`)](https://nodysseus.ulysses.codes/#example_1_2_3)
4. [Using http requests (`fetch`, `call`, `cache`)](https://nodysseus.ulysses.codes/#example_1_2_4)
4. [Input response (`runnable`, `event_subscriber`, `event_publisher`)](https://nodysseus.ulysses.codes/#example_1_2_5)

## Reading a graph

- Each node does something or passes data to its child. 
- Edges (connections/lines) define the relationships between nodes. 
- A node can have many parents, which pass data in, but only one child. 
- A node can reference another hidden node to copy its functionality. By default, nodes have no reference and simply pass along input data to their child
- If a node references `arg`, it will draw use it's `value` like a javascript variable or function argument

## Editing

You can edit a node by using keybindings or by clicking/tapping the selected node's value or reference.

You can edit an edge by using keybindings or clicking/tapping the edge name.

## References

Nodes that have something other than `object` or `value` in *italics* reference other hidden nodes. It's similar to calling a function with the input nodes as arguments. Using the node menu, you can copy the referenced node or create a reference from the node.

Some common nodes and their Typescript function types:

#### log
`log: (value: any) => any` - `console.log`s the value and returns it. Useful for inserting logs into node chains.

#### input_value
`input_value: (value: any) => any` - uses the received value as the nodes `value` and shows it.

#### if
`if: (pred: boolean, true?: any, false?: any) => any` - if `pred` is true, returns `true` otherwise returns `false`

#### default
`default: (value: any, otherwise: any) => any` - if `value` is not `undefined`, returns `value`, otherwise returns `otherwise`

#### switch
`switch: (input: string, ...args) => any` - returns the value of the input edge labeled `input`

#### html_element
`html_element: (children: (html_element | html_text | (html_element|html_text)[], dom_type: string, props: any) => html_element` - use with `result_display` to add html to the page

#### html_text
`html_text: (text: string) => html_text` - use with `html_element` to create a [DOM text node](https://developer.mozilla.org/en-US/docs/Web/API/Text)

#### css_styles
`css_styles: (css_object: {[selector]: {[attribute]: value}}) => html_element` - creates a `style` element from the passed in css_object with the object keys as selectors and the object values as attribute/value objects.

#### fetch
`fetch: (url: string, params: any) => response` - calls `fetch` with the url and params given. Note that this returns a Promise, which Nodysseus should handle automatically.

#### runnable
`runnable: (fn: node, args?: any) => {fn: node.id, args}` - creates a reference to the input graph to be used in other places (e.g. html input events, a `run` node)

#### event_publisher
`event_publisher: (name: string, value: any) => void` - publishes `value` as a `name` event

#### event_subscriber
`event_subscriber: (name: string) => any` - subscribes to `name` events

## Edge content
An edge takes the return value from one node and feeds it into another node. The edge is labeled `as` something, which indicates what `reference` input it refers to, or what property it should be in an `object`.

## Graph execution

The graph is rerun whenever it changes.
- Using `switch`, `if`, or `default` will only evaluate the branches that are chosen. All the other branches will not execute.
- If the return value of any executed node is a Promise, the nodes following that node will all return promises. 
- If the return value contains the key `display`, then `display` will be added to the html document using hyperapp. 

The graph is executed using a pull model - each node asks its parents (if it has any) for new data before running itself. 


## Shortcuts

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
- **x** delete node (edges are adjusted automatically)

### edges

- **e** edit output edge