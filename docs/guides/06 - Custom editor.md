# Custom Editor

The `custom_editor` graph runs when nodysseus starts up and allows users to customize the editor.

## value

Any setup can be done here by creating another input the the `value` node.

## value -> rtcroom

`rtcroom` on the value output is the room used for syncing with collaborators. Changing the value of the node with `rtcroom` output on two different devices will sync opened nodes between the devices. Requires a refresh after changing to take effect.

## subscribe

`subscribe` works like the `subscribe` input to any `return` value, and lets the user react to events in a custom way. For example, if the user sets up a midi listener on the `value` input, they might want to set up a subscription to the `nodeselect` event and change the selected node.
