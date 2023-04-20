# three.js docs

Custom nodes are documented here, but any three.js class is available using a `@js.new` node with e.g. `THREE.BoxGeometry`.

## @three.applyForce

Applies an instantaneous force vector attribute to the velocity attribute. Then updates position based on velocity.


## @three.camera

A three.js [PerspectiveCamera](https://threejs.org/docs/?q=camera#api/en/cameras/PerspectiveCamera)


## @three.fx_pass

Import an EffectPass from three.js [postprocessing directory](https://github.com/mrdoob/three.js/tree/master/examples/jsm/postprocessing)


## @three.fx_shader_pass

Use a fragment shader as a three.js shader pass.


## @three.geometry_loader

Save and load assets such as geometry, images, etc.


## @three.hsl

Create a THREE.Color from hue, saturation, and lightness values.


## @three.setup

Creates a basic three.js scene with a camera, renderer, and scene. The `objects` input has the objects of the scene, evaluated every frame - make sure to cache. The `onupdate` input is a runnable with parameters `objects`, `camera`, and `scene` which is run every frame - keep. The `fx` input has effects for an EffectComposer.

