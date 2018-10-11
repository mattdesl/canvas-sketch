#### <sup>:closed_book: [canvas-sketch](../README.md) → [Documentation](./README.md) → Other Topics</sup>

---

### Using WebGL

Often, you may want to take advantage of WebGL features to design a certain artwork. You can specify `{ context: 'webgl' }` in the settings, or specify an existing WebGL-enabled `{ context }` from a canvas.

When your sketch is WebGL-enabled, the `props` will also provide a `gl` option for better code readability.

Below is an example with [regl](https://github.com/regl-project/regl) (a thin WebGL wrapper), which simply fills the WebGL backbuffer with pure red.

```js
const canvasSketch = require('canvas-sketch');
const createRegl = require('regl');

const settings = {
  // Use a WebGL context instead of 2D canvas
  context: 'webgl',
  // Enable MSAA in WebGL
  attributes: {
    antialias: true
  }
};

canvasSketch(({ gl }) => {
  // Setup REGL with our canvas context
  const regl = createRegl({ gl });

  // Create your GL draw commands
  // ...

  // Return the renderer function
  return () => {
    // Update regl sizes
    regl.poll();

    // Clear back buffer with red
    regl.clear({
      color: [ 1, 0, 0, 1 ]
    });

    // Draw your meshes
    // ...
  };
}, settings);
```

### Using glslify for modular GLSL

The `canvas-sketch-cli` tool comes built-in with [glslify](https://github.com/glslify/glslify) support.

In the following example, `./cool-shader.frag` (a GLSL file) will be inlined into the JavaScript source as a string during development and at bundle time.

```js
const glslify = require('glslify');

// this will get inlined into a string at bundle time
const frag = glslify(path.resolve(__dirname, 'cool-shader.frag'));
```

You can also import shaders from npm, like [glsl-noise](https://github.com/hughsk/glsl-noise). Use the following command to add it to your `package.json` file:

```sh
npm install glsl-noise
```

Now, you can import it into your GLSL:

```js
const glslify = require('glslify');

const vertex = glslify(`
  #pragma glslify: noise = require('glsl-noise/simplex/3d');

  void main () {
    ...
  }
`)
```

This technique was used in the following animated WebGL sketch:

![blob](assets/images/blob.gif)

> <sub>See [here](../examples/animated-regl-dither-blob.js) for the full source code of this sketch.</sub>

### Using ThreeJS, P5.js, and other libraries

As you can see from the previous `regl` example, it is fairly straight-forward to use other libraries alongside `canvas-sketch`. In fact, `canvas-sketch` was intentionally designed to make *zero* assumptions about the rendering library being used.

Here are some examples:

- [ThreeJS – Basic Cube](../examples/animated-three-basic-cube.js)

### Utilities for Randomness, Math, Geometry, Color, etc.

See [canvas-sketch-util](https://github.com/mattdesl/canvas-sketch-util).

Examples:

```js
// Math utilities
const { lerp, clamp } = require('canvas-sketch-util/math');

// Randomness & noise utilities
const { noise2D } = require('canvas-sketch-util/random');
```

These utilities have been extracted into a separate module as they are not directly dependent on `canvas-sketch`, and can be useful outside the scope of this framework.

### Developing Pen Plotter Artwork

You can also use `canvas-sketch` to develop pen plotter artwork, for example with [AxiDraw V3](https://shop.evilmadscientist.com/productsmenu/846).

Some examples:

- [pen-plotter-circles.js](../examples/pen-plotter-circles.js) - Typical example of pen plotter artwork using polylines
- [pen-plotter-patchwork](../examples/pen-plotter-patchwork.js) - Advanced example of pen plotter algorithms, as well as manually exporting PNG and SVG layers

<p align="center">
  <img src="assets/images/penplot2.png" width="50%" />
</p>


You can use the `--template=penplot` flag in the CLI along with `--new` to quickly generate a new pen plotter print. (Since `canvas-sketch-cli@1.1.0`)

To learn more about AxiDraw and pen plotter art, see here:

- [Pen Plotter Art & Algorithms - Part 1](https://mattdesl.svbtle.com/pen-plotter-1)
- [Pen Plotter Art & Algorithms - Part 2](https://mattdesl.svbtle.com/pen-plotter-2)

### Async Sketches: Loading Images & Other Assets

Some artworks depend on images, sounds, fonts, and so forth. Your sketch can return a `Promise` that resolves to your *renderer* function, allowing you to load items specific to each sketch.

For convenience, we suggest the [load-asset](http://npmjs.com/package/load-asset) library and taking advantage of `async/await` support in latest browsers (like Chrome).

For example, let's say we want to load the below "Baboon" test image and glitch its pixels.

<img src="assets/images/baboon.jpg" width="25%" />

<p></p>

Our sketch might look like this:

```js
const canvasSketch = require('canvas-sketch');
const load = require('load-asset');

// We create an 'async' sketch
canvasSketch(async ({ update }) => {
  // Await the image loader, it returns the loaded <img>
  const image = await load('assets/baboon.jpg');

  // Once the image is loaded, we can update the output
  // settings to match it
  update({
    dimensions: [ image.width, image.height ]
  });

  // Now render our sketch
  return ({ context, width, height }) => {
    // Draw the loaded image to the canvas
    context.drawImage(image, 0, 0, width, height);

    // Extract bitmap pixel data
    const pixels = context.getImageData(0, 0, width, height);

    // Manipulate pixel data
    // ... sort & glitch pixels ...

    // Put new pixels back into canvas
    context.putImageData(pixels, 0, 0);
  };
});
```

After implementing some pixel sorting, we end up with:

<img src="assets/images/pixels-2.jpg" width="50%" />

<p></p>

> <sub>See [here](../examples/canvas-image-processing.js) for the full source code of this sketch.</sub>

### Building for Web, Installations & VJ

TODO.

## 

#### <sup>[← Back to Documentation](./README.md)
