# log

Prints input value to console.log labeled with node's value.


# fetch

Uses the <a target='_blank' href='https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API'>Fetch API</a> to get data.


# call

Calls `self.fn` with `args`. If `self` is not found, uses the node's context (i.e. window or lib). If there's no fn input, uses the node's value.


# stringify

<a target='_blank' href='https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify'>JSON.stringify</a> the `value` argument


# parse

<a target='_blank' href='https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify'>JSON.parse</a> the `value` argument


# add

The javascript <a target='_blank' href='https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Addition'>+ operator</a>


# mult

The javascript <a target='_blank' href='https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Multiplication'>* operator</a>


# divide

The javascript <a target='_blank' href='https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Division'>/ operator</a>


# negate

The javascript <a target='_blank' href='https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Subtraction'>- operator</a>


# ancestors

Gets the ancestors of the `node` in `graph`


# append

Appends `item` to `array`. `item` can be a single item or an array.


# concat

Concats `items` to `array`.


# filter_eq

Filters `array` for items where `item.key` === `value`


# default

Returns `value` if it's defined, if not then returns `otherwise`


# switch

Returns the result  of the branch passed into it by `input`


# if_arg

If this node's `value` exists in the node's context, return the value from the `true` branch


# if

If `pred` exists in the node's context, return the value from the `true` branch. Otherwise, return the value from the `false` branch.


# find_node

Find the node with id `node_id` in `nodes`.


# svg_text

Returns a hyperapp `svg` text element with `text` and `props`


# edge_in_argx

Returns all edges labeled `arg` and a number, e.g. `arg0`, `arg1`, etc.


# input_edge

Finds the input edge labeled with this node's `value`


# runnable_return

Combines `return` and `runnable` into one node.


# return

Creates an inline graph with args, pub/sub, etc. See docs for more detail.


# runnable

Creates a reference to `fn` that can be run in various contexts.


# function

Creates a function from the `fn` input.


# script

Runs this as a javascript function. `return` is needed at the end of the script to return anything.


# resolve

Resolves any `Proxy` inputs and returns an object.


# array

Create an array from all the inputs in alphabetical order


# merge_objects

Merge the keys of two objects, in descending alphabetical order priority (`Object.assign(...inputs)`).


# get

Get the value at the path of object. Accepts a `.` separated path e.g. get(target, 'a.b.c') returns target.a.b.c


# arg

Get an input to the graph this is a part of.


# set_mutable

Sets `target` value at `path` to `value` and returns the object.


# set

Returns a new object with the property at `path` (or the node's value) on `target` set to `value`. Accepts a `.` separated path e.g. set(target, 'a.b', 'c') returns {...target, a: {...target.a, b: 'c'}}


# modify

Returns a new object with the property at `path` (or the node's value) on `target` modified with `fn`. Accepts a `.` separated path e.g. set(target, 'a.b', 'c') returns {...target, a: {...target.a, b: 'c'}}


# delete

Deletes `target` property at `path`


# cache

Stores the first value that's `!== undefined` and returns that value whenever called. If used within a `map`, `filter`, or `reduce` node, each iteration's value will be cached separately.


# isunchanged

Returns true if `value` is unchanged otherwise `false`.


# run_path

Runs the node at `path` (or this node's value).Path is determined as a route from the output node of the graph


# get_arg

Gets the value at `path` (or this node's value) from the context. Similar to an arg node. Accepts a `.` separated path e.g. get(target, 'a.b.c') returns target.a.b.c


# set_arg

Sets the value at `path` (or this node's value) on this graph's context. If used within a `map`, `filter`, or `reduce`, the arg will be separate for each loop. This behaviour can be changed by passing in a `key` separately.


# event_publisher

Publishes a `name` (or this node's value) event with the data `value`.


# event_publisher_onchange

Publishes a `name` (or this node's value) event with the data `value` when `value` changes.


# input_value

Displays the last `value` received. Will display "undefined" if this node has not been run.


# event_subscriber

Returns the last value of the `name` (or this node's value) event.


# events_broadcast_channel

Runs `runnable` when a message is received from the events <a target='_blank' href='https://developer.mozilla.org/en-US/docs/Web/API/BroadcastChannel'>broadcast channel</a>. Can be used to communicate between tabs or worker processes.


# run

Runs `runnable` and returns the result.


# create_fn

Returns a function created from `runnable`


# reduce

<a target='_blank' href='https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/reduce'>Aray.reduce</a> the `array` with `fn`. Arguments for `fn` are `previous`, `current`, `index`, `array`, and a unique per nested loop `key`.


# map

<a target='_blank' href='https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/map'>Aray.map</a> the `array` with `fn`. Arguments for `fn` are `element`, `index`, `array`, and a unique per nested loop `key`.


# filter

Filters an array using `fn: (element) => boolean`


# sequence

Create a new runnable that runs the input runnables in sequence.


# import_json

Imports the node or nodes found at the `url`.


# object_entries

Calls <a target='_blank' href='https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/entries'>Object.entries</a> on `object`.


# css_styles

Creates a style element from `css_object`. Inputs to the object should be labeled with css selectors, and inputs to those objects with css properties.


# css_anim

Creates a css animation string. For use with `css_styles`.


# input

undefined


# html_text

Some HTML plaintext of `text` (or this node's value). Usually used as a child of html_element.


# html_element

An HTML Element. `children` is an array of html_element or html_text, `props` are the attributes for the html element as an object, `dom_type` (or this node's value) is the dom type, `memo` refers to <a target='_blank' href='https://github.com/jorgebucaran/hyperapp/blob/main/docs/api/memo.md'>hyperapp's memo</a>.


# icon

A ionicon in hyperapp format.


# not

undefined


# walk_graph

undefined


# canvas_behind_editor

Creates a HTML canvas behind the node editor


# call_method

Calls the method corresponding to this node's value of `self`. It can be '.' separated path. If `self` is not set, the node's context will be used.


# import_module

Dynamically import an es6 module


# import

Imports the node or nodes from the provided json file


# import_nodes

Imports the passed in `nodes`


# offscreen-canvas

Creates an offscreen canvas for rendering WebGL content. Multiple canvases can be created to allow switching content on a canvas behind the node editor or the info popup canvas.


# deleteref

Deletes the graph with the name provided in the text field.


# changed

Returns true if `value` has changed


# webgl

Creates a webgl program with vertex shader `vtx`, fragment shader `frg`, in gl context `gl`.


# load_shader

Loads the `source` shader program in webgl context `gl`


# subscribe_many

Modifies the `base` subscribe object to include a single `runnable` that receives events from all `events`.


# slider

A basic HTML input range slider labelled `label` (or this node's value). `step`, `min`, and `max` are optional.
