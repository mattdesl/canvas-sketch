#### <sup>:closed_book: [canvas-sketch](../README.md) → [Documentation](./README.md) → Exporting Artwork</sup>

---

### Exporting Artwork to PNG, GIF, MP4, SVG and Other Files

One of the main features of `canvas-sketch` is a unified structure for exporting image sequences, print-resolution PNGs, and even other formats like SVG and JSON.

### Keyboard Shortcuts

With the browser in focus, you can use the following shortcuts to export your artwork:

- `Cmd + S` or `Ctrl + S`

  - Export a single frame

- `Cmd + Shift + S` or `Ctrl + Shift + S`

  - Start/stop exporting a sequence of frames

- `Cmd + K` or `Ctrl + K`

  - Apply a new `git commit` and export appending the SHA-1 hash in the file name (see [here](#git-commit--file-hashing) for more details)

By default, exported files will be saved to your `~/Downloads` folder.

### How It Works

When using `canvas-sketch-cli`, the frontend will POST the file Blobs to the running Node.js server, providing a smooth and streamlined experience for large files and long animation sequences.

When using `canvas-sketch` with other servers (such as Webpack, Parcel, Rollup, etc), the tool falls back to triggering native browser downloading, which provides a less optimal experience.

### Changing the Output Folder

If you are using `canvas-sketch-cli`, you can control where the exported media is saved to.

By default, the CLI will try to export to your `Downloads` folder. Use the `--output` flag to specify a folder relative to your current working directory, and exported files will be saved there instead.

```sh
canvas-sketch src/index.js --output=media/
```

You can also use an environment variable, `CANVAS_SKETCH_OUTPUT`, which will override the default Downloads path, but won't take precedence over the `--output` flag. This variable can be an absolute path, or relative (it will be resolved relative to the current working directory).

```sh
CANVAS_SKETCH_OUTPUT=./outputs canvas-sketch src/index.js
```

### File Naming

By default, the naming scheme is as follows, where `name` defaults to the current timestamp and `hash` is a possible git SHA-1 hash (see [Git Commit & File Hashing](#git-commit--file-hashing)).

`[prefix]-[name]-[layer]-[hash]-[suffix][extension]`

Most values will be omitted if they are empty or unnecessary. You can pass `settings` to change some of these values:

```js
const settings = {
  // The file name without extension, defaults to current time stamp
  name: 'foobar',
  // Optional prefix applied to the file name
  prefix: 'artwork',
  // Optional suffix applied to the file name
  suffix: '.draft'
};
```

Alternatively, you can also specify a `{ file }` option, which will ignore the naming scheme and use your name as-is.

### Exporting Animations

When you use `Cmd + Shift + S` or `Ctrl + Shift + S` to export an animation, it will begin recording image frames and log progress in the browser console. You can hit this keystroke again to stop recording.

> :warning: 
>
> <sup>If your animation has no defined duration (i.e. it is endless), it will continue exporting frames forever!</sup>

There are currently two approaches to exporting MP4 and GIF files:

- [Frame Sequences](#frame-sequences) — (default behaviour) you can export a sequence of frames, and then later process them into a video
- [FFMPEG Streaming](#ffmpeg-streaming) — this uses `ffmpeg` to stream frames into an MP4 or GIF file

#### Frame Sequences

If you'd like to encode your own movie files, you can export a sequence of frames from your sketch. This is the default behaviour of canvas-sketch, and it also works with custom file types (useful for e.g. generating a sequence of SVG or GLTF files).

Frame numbers are exported with left-padded zeros, such as `0005.png`. If you have multiple layers, they will be exported as `[layer]-[frame][extension]`.

After exporting all your frames to a folder, you can use FFMPEG, After Effects, Photoshop, or your favourite "PNG Sequence to Movie" software.

#### FFMPEG Streaming

> Note: This feature needs at least `canvas-sketch@0.5.x` and `canvas-sketch-cli@1.10.1` to work.

First, you'll need `ffmpeg` or a variant installed. If you haven't installed this before, you can do the following to install a global utility:

```sh
npm install @ffmpeg-installer/ffmpeg --global
```

Now you should be able to use the `--stream` flag with `canvas-sketch-cli` to enable FFMPEG streaming. Animations will be saved directly into a MP4 or GIF file, instead of a sequence.

Examples:

```sh
# Save animations to MP4 file
canvas-sketch animation.js --output=tmp --stream

# Save animations to GIF file instead
canvas-sketch animation.js --output=tmp --stream=gif

# Save animations to GIF but scale it down to 512 px wide
canvas-sketch animation.js --output=tmp --stream [ gif --scale=512:-1 ]
```

If you pass `--stream` with no options, it will default to `--stream=mp4`.

### Exporting Other File Types

Sometimes artworks are visualized in the browser, but exported in a different format than PNG. For example, a pen plotter artwork may be exported as SVG or G-code.

In these cases, your renderer function can return a "file descriptor" object. The object can either be a `<canvas>` element which will be saved as PNG, or an object containing `{ data, extension }` options. The `data` property is typically a string, ArrayBuffer or Blob.

For example, exporting a JSON file:

```js
canvasSketch(() => {
  return ({ context, width, height } => {
    // Render your scene...
    // ...

    // Export your file
    return {
      data: JSON.stringify({ foo: 'bar' }),
      extension: '.json'
    };
  };
});
```

### Exporting JPEG or WEBP

You can use the `{ encoding, encodingQuality }` settings to export a lossy format, for example:

```js
const settings = {
  dimensions: 'a4',
  encoding: 'image/jpeg',
  encodingQuality: 0.75,
  pixelsPerInch: 300,
  units: 'in'
};
```

### Exporting Pen Plotter Artwork (SVG)

You can export your own SVG file as a string, like in the above examples. Since this is a common task, we've included some third-party utilities specifically designed to export SVGs compatible with AxiDraw V3 mecahnical pen plotter.

You can read more about it in [Developing Pen Plotter Artwork](./other-topics.md#developing-pen-plotter-artwork).

### Exporting Multiple Layers

Some artworks may be composed of multiple files, for example:

- Triptychs that render three images instead of one
- Parametric models composed of OBJ and MTL files
- Pen plotter artworks that are rendered as both PNG (for web) and SVG (for print)

You can return an array of file descriptors, and each is exported as a separate "layer" in the output directory.

For example, this will render out JSON and two different images:

```js
canvasSketch(() => {
  return ({ canvas, width, height } => {
    // Render your scene...
    // ...

    // Export your file
    return [
      // layer0 = JSON
      { data: JSON.stringify({ foo: 'bar' }), extension: '.json' },
      // layer1 = <canvas> i.e. PNG
      canvas,
      // layer2 = <canvas> i.e. PNG
      { data: someOtherCanvas, suffix: '.thumb' },
    ];
  };
});
```

Also note, file descriptors can have other options like `file, suffix, prefix, name` to override the defaults.

<a name="node-export"></a>

### Running `canvas-sketch` in Node.js for Very Large Prints

In some cases, you might run up against browser limitations in maximum canvas size (for example, prints above 15,000 x 15,000 pixels). In these cases, when using plain Canvas2D API, you might be able to run your sketch in Node.js.

You will need to install the [canvas](https://github.com/Automattic/node-canvas) module, which is a Cairo backend for Node.js with an API almost identical to browser Canvas2D. Now, you can create a new canvas and pass it into `canvas-sketch` like so:

```js
const canvasSketch = require('canvas-sketch');
const {createCanvas} = require('canvas');

// Create a new 'node-canvas' interface
const canvas = createCanvas();

const settings = {
  // Pass in the Cairo-backed canvas
  canvas
  // Optionally set dimensions / units / etc
  // ...
};

const sketch = () => {
  return ({ context }) => {
    // ... draw your artwork just like in the browser ...
  };
};

canvasSketch(sketch, settings)
  .then(() => {
    // Once sketch is loaded & rendered, stream a PNG with node-canvas
    const out = fs.createWriteStream('output.png');
    const stream = canvas.createPNGStream();
    stream.pipe(out);
    out.on('finish', () => console.log('Done rendering'));
  });
```

> :bulb: This feature is still experimental and doesn't support all aspects of `canvas-sketch` API. Some things, like WebGL and P5.js, may not work at all in Node.js.

### Git Commit & File Hashing

If you are doing a lot of generative artwork, you might start to accumulate artworks that cannot be reproduced since the exact combination of code & randomness for that print has been lost over time.

To combat this, one solution is to commit your code and *then* export your media, named in such a way that it points back to your latest git SHA-1 commit hash.

If you are using `canvas-sketch-cli` from within a git repo, you can use `Cmd + K` or `Ctrl + K` to automate this. It will `git add` and `git commit` your latest code changes, then export a file using the SHA-1 hash of the latest commit.

To further improve reproducibility, you can export a JSON metadata layer (for example, containing `dat.gui` slider parameters), or embed information (like a random seed) into the `{ suffix }` option.

## 

<sub>Next, check out the guide on [WebGL, GLSL and ThreeJS](./webgl.md).</sub>

#### <sup>[← Back to Documentation](./README.md)
