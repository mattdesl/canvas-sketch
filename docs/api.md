#### <sup>:closed_book: [canvas-sketch](../README.md) → [Documentation](./README.md) → API Docs</sup>

---

### `canvas-sketch` — API Docs

Below are the docs for the `canvas-sketch` JavaScript library. It should work in Node.js and the browser, including browserify, Webpack, Rollup, and similar build tools.

> :bulb: If you are just getting started, you may want to look at some of the guides first, such as the [Installation](./installation.md) guide, or [A "Hello, World" Sketch](./hello-world.md).

## Contents

- [Importing](#importing)
- [Methods](#methods)
- [Settings](#settings)
- [Props](#props)
- [Renderer Objects](#renderer-objects)
- [`SketchManager`](#sketchmanager)

## Importing

The default export is a function, `canvasSketch` which can be imported like so:

```js
// Node.js/CommonJS
const canvasSketch = require('canvas-sketch');

// ES Modules
import canvasSketch from 'canvas-sketch';
```

CommonJS is recommended for better compatibility with Node.js (i.e. for generating super-high resolution prints).

## Methods

#### `promise = canvasSketch(sketch, [settings])`

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

You can also return a [renderer object](#renderer-objects) for more advanced functionality, for example to react to canvas resize events.

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
};
```

<div class="param-table" style="font-size: 13px">

#### Size Settings

parameter | type | default | description
--- | --- | --- | ---
`dimensions` | Array \| String | *window size* | The dimensions of your sketch in `[width, height]` units. If not specified, the sketch will fill the browser window. You can also specify a [preset string](./physical-units.md#paper-size-presets) such as `"A4"` or `"Letter"`.
`units` | String | `"px"` | The working units if `dimensions` is specified, can be `"in"`, `"cm"`, `"px"`, `"ft"`, `"m"`, `"mm"`.
`pixelsPerInch` | Number | 72 | When `units` is a physical measurement (e.g. inches), this value will be used as the resolution to convert inches to pixels for exporting and rendering.
`orientation` | String | `"initial"` | If `"landscape"` or `"portrait"` are specified, the dimensions will be rotated to the respective orientation, otherwise no change will be made. Useful alongside [`dimensions` presets](./physical-units.md#paper-size-presets). 
`scaleToFit` | Boolean | true | When true, scales down the canvas to fit within the browser window.
`scaleToView` | Boolean | false | When true, scales up or down the canvas so that it is no larger or smaller than it needs to be based on the window size. This makes rendering more crisp and performant, but may not accurately represent the exported image. This is ignored during export.
`bleed` | Number | 0 | You can pad the dimensions of your artwork by `bleed` units, e.g. for print trim and safe zones.
`pixelRatio` | Number | device ratio | The pixel ratio of the canvas for rendering and export. Defaults to `window.devicePixelRatio`.
`exportPixelRatio` | Number | `pixelRatio` | The pixel ratio to use when exporting, defaults to `pixelRatio`. Not affected by `maxPixelRatio`.
`maxPixelRatio` | Number | Infinity | A maximum value for pixel ratio, in order to clamp the density for Retina displays.
`scaleContext` | Boolean | true | When true, 2D contexts will be scaled to account for the difference between `width` / `height` (physical measurements) and `canvasWidth` / `canvasHeight` (in-browser measurements).
`resizeCanvas` | Boolean | true | When true, canvas width and height will be set. You can stop the canvas from being resized by setting this to false.
`styleCanvas` | Boolean | true | When true, canvas style width and height will be added to account for pixelRatio scaling. Disable this by setting it to false.

#### DOM Settings

parameter | type | default | description
--- | --- | --- | ---
`canvas` | `<canvas>` | undefined | A canvas to use for the artwork, otherwise will create a new canvas.
`context` | String \| Context | `"2d"` | Can be an existing canvas context, or a string like `"webgl"` or `"2d"` hinting which canvas type should be created.
`attributes` | Object | `{}` | Optional context attributes when creating a new canvas in WebGL or 2D
`parent` | Element \| Boolean | `<body>` | The parent to append to when mounting, if the canvas is not already added to the DOM. If `false`, the canvas will not be mounted to DOM.

#### Export Settings

parameter | type | default | description
--- | --- | --- | ---
`file` | String \| Function | undefined | If specified, the exported file will use this string signature including its extension. Can also be a function that takes in current properties and returns a string.
`name` | String | *time stamp* | When `file` is not specified, generates a new file name on export using the `name` (do not include extension), or defaults to current time stamp.
`prefix` | String | `""` | When `file` is not specified, use this prefix in the export file name generation.
`suffix` | String | `""` | When `file` is not specified, use this suffix in the export file name generation.
`encoding` | String | `"image/png"` | The default encoding to use when converting `<canvas>` elements to images on export, can be `image/png`, `image/jpeg` or `image/webp`
`encodingQuality` | Number | 0.95 | The output quality for images using JPEG or WEBP `encoding`

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
`id` | String | undefined | When using `--hot` through the CLI tool, sketches are managed by a unique string identifier. If you have more than one sketch in your application, you must provide unique string identifiers to each sketch with the `id` setting in order to use hot replacement on all of them.
`data` | any | undefined | If you want to pass arbitrary data along to your sketch, you can use this key and it will be available as a `{ data }` prop in your render function.

</div>

## Props

The `props` object is passed to your *sketch* function, as well as passed to your *render* (and similar) functions.

```js
const sketch = (initialProps) => {
  return (renderProps) => { /* ... */ };
};
```

These are typically destructured with ES6, such as `{ width, height }`.

> :bulb: **Note:** For performance reasons, the same object reference is passed to all functions. This means you can store the object once and access its properties like `time` in each render. However, we recommend treating it like an immutable object where possible.

#### Size Props

prop | type | description
--- | --- | ---
`units` | String | The working units, which will be `'px'` if you didn't specify one.
`width` | Number | The width of your artwork in working `units`.
`height` | Number | The height of your artwork in working `units`.
`canvasWidth` | Number | The current pixel width of the canvas.
`canvasHeight` | Number | The current pixel height of the canvas.
`styleWidth` | Number | The current CSS width of the canvas element, which may be smaller than the canvas width when scaled to Retina screens.
`styleHeight` | Number | The current CSS height of the canvas element, which may be smaller than the canvas height when scaled to Retina screens.
`scaleX` | Number | The current X scaling factor of the context, which is equivalent to `canvasWidth / width`
`scaleY` | Number | The current Y scaling factor of the context, which is equivalent to `canvasHeight / height`
`pixelRatio` | Number | The current pixel density being used when rendering the canvas and adjusting the CSS style size. e.g. Full-screen canvas in Retina devices will have a pixelRatio of 2.
`pixelsPerInch` | Number | When `units` is a physical measurement (e.g. inches), this value will be used as the resolution to convert inches to pixels for exporting and rendering.

#### DOM Props

parameter | type | description
--- | --- | ---
`canvas` | `<canvas>` | The canvas element currently being rendered into.
`context` | CanvasContext | The WebGL or 2D canvas context currently being rendered into

#### Animation Props

parameter | type | description
--- | --- | ---
`time` | Number | The current elapsed time of the loop in seconds
`frame` | Number | The current elapsed frame index of the loop
`playhead` | Number | The current playhead of the loop, between 0 and 1 (inclusive), which will always be 0 when `duration` and `totalFrames` is not defined.
`deltaTime` | Number | The delta time in seconds since last frame
`playing` | Boolean | Whether the loop is currently playing
`duration` | Number | The duration of the loop, or Infinity if the animation has no defined duration
`totalFrames` | Number | The total number of frames in the loop, or Infinity if the animation has no defined duration
`fps` | Number | The current frames per second

#### Misc Props

parameter | type | description
--- | --- | ---
`exporting` | Boolean | When rendering to a file or an animation sequence, this flag will be true.
`recording` | Boolean | When rendering to an animation sequence, this flag will be true.
`settings` | Object | A reference to the settings that were instantiated with this sketch, defaulting to an empty object if no settings were passed.

#### Function Props

Some properties are actually functions you can call, for example:

```js
const sketch = ({ render }) => {
  // Re-render on click
  window.addEventListener('click', () => render());
  return () => {
    // ... draw something ...
  };
};
```

function | description
--- | ---
`render()` | Dispatches a re-draw, which will in turn trigger your sketch's renderer.
`update(obj)` | Pass new settings, such as `{ width, height }` or `{ canvas }` to mutate the state of the sketch.
`exportFrame(obj)` | Programmatically trigger a frame export. You can specify `{ commit: true }` if you also wish to git commit before exporting, or `{ save: false }` if you wish to disable file saving and return with a promise of the exported layers (data, dataURL, etc).
`play()` | Play/resume the loop. If already playing, this does nothing.
`pause()` | Pause the loop. If already paused, this does nothing.
`stop()` | Stop the loop and return to frame zero. If already stopped, this does nothing.
`togglePlay()` | Toggles play/pause depending on current state. If playing, this will pause the loop, and if paused, this will resume the loop.

## Renderer Objects

> :warning: The Renderer Objects feature is still experimental. If you wish to contribute to its architecture/design, please create a new issue.

Instead of returning a function, you can return an object with various methods, for example:

```js
const sketch = () => {
  return {
    render ({ frame }) {
      console.log('Rendering frame #%d', frame);
    },
    begin () {
      // First frame of loop
    },
    end () {
      // Last frame of loop
    }
  };
}
```

#### TODO: Still need to document these. They include:

- render, resize, begin, end, tick, unload, preExport, postExport

## `SketchManager`

> :warning: The SketchManager interface is still experimental. If you wish to contribute to its architecture/design, please create a new issue.

The `canvasSketch()` function is resolved to a SketchManager instance, which allows you to control the sketch programmatically:

```js
const start = async () => {
  const manager = await canvasSketch(sketch, settings);
  window.addEventListener('click', () => {
    if (manager.props.playing) manager.pause();
    else manager.play();
  });
};
```

Functions include:

- `manager.play()`, `manager.pause()`, `manager.stop()` — control playback
- `manager.render()` — trigger a re-render of current frame
- `manager.exportFrame()` — trigger export of current frame
- `manager.update(newSettings)` — update sketch with new settings
- `manager.unload()` — dispose of the current sketch
- `manager.loadAndRun(sketch, settings)` — this unloads and starts up a new sketch

Instance variables include:

- `manager.props` — A getter to retrieve the current properties of the sketch
- `manager.settings` — A getter to retrieve the settings applied to the sketch
- `manager.sketch` — A getter to retrieve the 'sketch' interface, which may be a renderer function or a [renderer object](#renderer-object)

#### <sup>[← Back to Documentation](./README.md)
