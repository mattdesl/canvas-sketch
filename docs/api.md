#### <sup>:closed_book: [canvas-sketch](../README.md) → [Documentation](./README.md) → API Docs</sup>

---

<style>
.param-table table {
  font-size: 13px;
}
.param-table table tr td:nth-child(2) {
  min-width: 130px;
}
.param-table table tr td:nth-child(3) {
  min-width: 120px;
}
.param-table table td {
  padding: 20px 13px;
}
</style>

### `canvas-sketch` — API Docs

Here is the JavaScript API documentation for the `canvas-sketch` library. It should work in Node.js and the browser, including browserify, Webpack, Rollup, and similar build tools.

## Importing

The default export is a function, `canvasSketch` which can be imported like so:

```js
// ES Modules
import canvasSketch from 'canvas-sketch';

// Node.js/CommonJS
const canvasSketch = require('canvas-sketch');
```

CommonJS is recommended for better compatibility with Node.js (i.e. for generating super-high resolution prints).

## Functions

#### `canvasSketch(sketch, [settings])`

The library exports the default `canvasSketch` function, which takes in a `sketch` function and optional [`settings` object](#settings).

The `sketch` function can be sync or async (i.e. returns a promise), and is expected to have a signature similar to:

```js
// Sync + ES5
function sketch (initialProps) {
  // ... load & setup content
  return function (renderProps) {
    // ... render content 
  };
}

// Async + ES6
const sketch = async () => {
  await someLoader();
  return ({ width, height }) => {
    // ... Render...
  };
}
```

See the [props](#props) for details about what is contained in the object passed to these functions.

You can also return a [renderer object](#renderer-object) for more advanced functionality, for example to react to canvas resize events.

```js
const sketch = () => {
  return {
    render ({ frame }) {
      console.log('Rendering frame #%d', frame);
    },
    resize ({ width, height }) {
      console.log('Canvas has resized to %d x %d', width, height);
    }
  };
}
```

The return value of `canvasSketch` is a promise, resolved to a [`SketchManager` instance](#sketchmanager).

## Settings

The `settings` object often looks like this:

```js
// 11 x 7 inches artwork
const settings = {
  dimensions: [ 11, 7 ],
  units: 'in'
}
```

<div class="param-table">

#### Size Settings

parameter | type | default | description
--- | --- | --- | ---
`dimension` | Array \| String | *window size* | The dimension of your sketch in `[width, height]` units. If not specified, the sketch will fill the browser window. You can also specify a [preset string](#dimension-presets) such as `"A4"` or `"Letter"`.
`units` | String | `"px"` | The working units if `dimensions` is specified, can be `"in"`, `"cm"`, `"px"`, `"ft"`, `"m"`, `"mm"`.
`pixelsPerInch` | Number | 72 | When `units` is a physical measurement (e.g. inches), this value will be used as the resolution to convert inches to pixels for exporting and rendering.
`orientation` | String | `"initial"` | If `"landscape"` or `"portrait"` are specified, the dimensions will be rotated to the respective orientation, otherwise no change will be made. Useful alongside [`dimensions` presets](#dimension-presets). 
`scaleToFit` | Boolean | true | When true, scales down the canvas to fit within the browser window.
`scaleToView` | Boolean | false | When true, scales up or down the canvas so that it is no larger or smaller than it needs to be based on the window size. This makes rendering more crisp and performant, but may not accurately represent the exported image. This is ignored during export.
`bleed` | Number | 0 | You can pad the dimensions of your artwork by `bleed` units, e.g. for print trim and safe zones.
`pixelRatio` | Number | device ratio | The pixel ratio of the canvas for rendering and export. Defaults to `window.devicePixelRatio`.
`exportPixelRatio` | Number | `pixelRatio` | The pixel ratio to use when exporting, defaults to `pixelRatio`.
`maxPixelRatio` | Number | Infinity | A maximum value for pixel ratio, in order to clamp the density for Retina displays.
`scaleContext` | Boolean | true | WHen true, 2D contexts will be scaled to account for the difference between `width` / `height` (physical measurements) and `canvasWidth` / `canvasHeight` (in-browser measurements).
`resizeCanvas` | Boolean | true | When true, canvas width and height will be set. You can stop the canvas from being resized by setting this to false.
`styleCanvas` | Boolean | true | When true, canvas style width and height will be added to account for pixelRatio scaling. Disable this by setting it to false.

#### DOM Settings

parameter | type | default | description
--- | --- | --- | ---
`canvas` | `<canvas>` | undefined | A canvas to use for the artwork, otherwise will create a new canvas.
`context` | String \| Context | `"2d"` | Can be an existing canvas context, or a string like `"webgl"` or `"2d"` hinting which canvas type should be created.
`attributes` | Object | `{}` | Optional context attributes when creating a new canvas in WebGL or 2D
`parent` | Element | `<body>` | The parent to append to when mounting, if the canvas is not already added to the DOM.

#### Export Settings

parameter | type | default | description
--- | --- | --- | ---
`file` | String \| Function | undefined | If specified, the exported file will use this string signature including its extension. Can also be a function that takes in current properties and returns a string.
`name` | String | *time stamp* | When `file` is not specified, generates a new file name on export using the `name` (do not include extension), or defaults to current time stamp.
`prefix` | String | `""` | When `file` is not specified, use this prefix in the export file name generation.
`suffix` | String | `""` | When `file` is not specified, use this suffix in the export file name generation.

#### Animation Settings

parameter | type | default | description
--- | --- | --- | ---
`animate` | Boolean | false | If true, will set up a `requestAnimationFrame` loop and trigger a render on each frame.
`playing` | Boolean | true | If true, and when `animate` is true, the loop will play.
`loop` | Boolean | true | If true, when the last frame is reached, start again from the first frame to form a seamless loop. If false, the animation loop will stop when reaching the last frame.
`duration` | Number | Infinity | A number in seconds defining the total duration of your loop; when not specified, the loop will never end. You can use this or `totalFrames`, but should not try to set both together.
`totalFrames` | Number | Infinity | A number in frames defining the total duration of your loop; when not specified, the loop will never end. You can use this or `duration`, but should not try to set both together.
`fps` | Number | 24 | The frame rate, defaults to 24 frames per second. This is used during export and to compute the `totalFrames` when duration is passed in seconds. To throttle the animation in-browser, you must also specify a `playbackRate`.
`playbackRate` | String | undefined | By default, the `requestAnimationFrame` rendering will run as fast as possible, generally 60 FPS in browsers. You can throttle rendering by setting this to `"throttle"`, so that it more closely resembles your GIF export, or set it to `"fixed"` to step the frames forward at a fixed interval each frame (based on the `fps`).
`timeScale` | Number | 1 | Stretches the delta time per frame by a factor, allowing you to slow down your animation (using a number smaller than 1) or speed it up (using a number larger than 1). This does not change your loop duration.
`frame` | Number | 0 | The initial frame to start on when the sketch is first run. You can use this or `time`, but should not try to set both together.
`time` | Number | 0 | The initial time in seconds to start on when the sketch is first run. You can use this or `frame`, but should not try to set both together.

#### Misc Settings

parameter | type | default | description
--- | --- | --- | ---
`flush` | Boolean | true | When true, WebGL contexts will be flushed after each render call in order to ensure the exported content is in sync with the GL calls.
`pixelated` | Boolean | false | When true, the canvas will be set up with image smoothing ideal for pixel art.
`hotkeys` | Boolean | true | Attaches hotkeys like `Cmd + S` to the window, for exporting and other features. Set this to false to disable export hotkeys.
`p5` | Boolean \| P5 | false | Specify `true` or a P5 instance to integrate this sketch with P5.js.


</div>

### `dimension` presets

#### <sup>[← Back to Documentation](./README.md)