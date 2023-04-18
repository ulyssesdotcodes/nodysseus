# arg

Get an input to the graph this is a part of.


# return

Creates an inline graph with args, pub/sub, etc. See docs for more detail.


# @js.script

Runs this as a javascript function. `return` is needed at the end of the script to return anything.


# @debug.log

Prints value to console.log


# @network.fetch

Uses the <a target='_blank' href='https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API'>Fetch API</a> to get data.


# @js.call

Calls `self.fn` with `args`. If `self is not found, uses the node's context.


# @data.stringify

<a target='_blank' href='https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify'>JSON.stringify</a> the `value` argument


# @data.parse

<a target='_blank' href='https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify'>JSON.parse</a> the `value` argument


# @math.add

The javascript <a target='_blank' href='https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Addition'>+ operator</a>


# @math.mult

The javascript <a target='_blank' href='https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Multiplication'>* operator</a>


# @math.divide

The javascript <a target='_blank' href='https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Division'>/ operator</a>


# @math.negate

The javascript <a target='_blank' href='https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Subtraction'>- operator</a>


# @math.and

The javascript <a target='_blank' href='https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Logical_AND'>&& operator</a>


# @js.typeof

javascript typeof operator


# @js.new

javascript constructor


# @js.addEventListeners

add js event listeners to a target


# @graph.ancestors

Gets the ancestors of the `node` in `graph`


# @data.append

Appends `item` to `array`. `item` can be a single item or an array.


# @data.concat

Concats `items` to `array`.


# @flow.default

Returns `value` if it's defined, if not then returns `otherwise`


# @flow.if

If `pred` exists in the node's context, return the value from the `true` branch. Otherwise, return the value from the `false` branch.


# @html.svg_text

Returns a hyperapp `svg` text element with `text` and `props`


# extern

Uses a function from the nodysseus extern library directly


# @data.array

Create an array from all the inputs in alphabetical order


# @data.merge_objects

Merge the keys of two objects, in descending alphabetical order priority (`Object.assign(...inputs)`).


# @data.merge_objects_mutable

Merge the keys of one or more objects into the target object, in descending alphabetical order priority (`Object.assign(...inputs)`).


# @data.get

Get the value at the path of object. Accepts a `.` separated path e.g. get(target, 'a.b.c') returns target.a.b.c


# @data.set_mutable

Sets `target` value at `path` to `value` and returns the object.


# @data.set

Returns a new object with the property at `path` (or the node's value) on `target` set to `value`. Accepts a `.` separated path e.g. set(target, 'a.b', 'c') returns {...target, a: {...target.a, b: 'c'}}


# @data.modify

Returns a new object with the property at `path` (or the node's value) on `target` modified with `fn`. Accepts a `.` separated path e.g. set(target, 'a.b', 'c') returns {...target, a: {...target.a, b: 'c'}}


# @data.delete

Deletes `target` property at `path`


# @event.event_publisher_onchange

Publishes a `name` (or this node's value) event with the data `value` when `value` changes.


# @data.reduce

<a target='_blank' href='https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/reduce'>Aray.reduce</a> the `array` with `fn`. Arguments for `fn` are `previous`, `current`, `index`, `array`, and a unique per nested loop `key`.


# @data.map

<a target='_blank' href='https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/map'>Aray.map</a> the `array` with `fn`. Arguments for `fn` are `element`, `index`, `array`, and a unique per nested loop `key`.


# @data.filter

<a target='_blank' href='https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/filter'>Aray.filter</a> the `array` with `fn`. Arguments for `fn` are `element`, `index`, `array`, and a unique per nested loop `key`.


# @nodysseus.import_json

Imports the node or nodes found at the `url`.


# @data.object_entries

Calls <a target='_blank' href='https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/entries'>Object.entries</a> on `object`.


# @html.css_styles

Creates a style element from `css_object`. Inputs to the object should be labeled with css selectors, and inputs to those objects with css properties.


# @html.css_anim

Creates a css animation string. For use with `css_styles`.


# @html.html_text

Some HTML plaintext of `text` (or this node's value). Usually used as a child of html_element.


# @html.html_element

An HTML Element. `children` is an array of html_element or html_text, `props` are the attributes for the html element as an object, `dom_type` (or this node's value) is the dom type, `memo` refers to <a target='_blank' href='https://github.com/jorgebucaran/hyperapp/blob/main/docs/api/memo.md'>hyperapp's memo</a>.


# @html.icon

A ionicon in hyperapp format.


# @js.import_module

Dynamically import an es6 module


# @nodysseus.import_nodes

Imports the passed in `nodes`


# @graphics.offscreenCanvas

Creates an offscreen canvas for rendering WebGL content. Multiple canvases can be created to allow switching content on a canvas behind the node editor or the info popup canvas.


# @data.changed

Returns true if `value` has changed


# @graphics.webgl

Creates a webgl program with vertex shader `vtx`, fragment shader `frg`, in gl context `gl`.


# @graphics.load_shader

Loads the `source` shader program in webgl context `gl`

