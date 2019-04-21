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

Use the `--output` flag to specify a folder relative to your current working directory, and exported files will be saved there.

```sh
canvas-sketch src/index.js --output=media/
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

When you use `Cmd + Shift + S` or `Ctrl + Shift + S` to export an animation, it will begin recording frames and log progress in the browser console. You can hit this keystroke again to stop recording.

> :warning:
>
> <sup>If your animation has no defined duration (i.e. it is endless), it will continue exporting frames forever!</sup>

Frame numbers are exported with left-padded zeros, such as `0005.png`. If you have multiple layers, they will be exported as `[layer]-[frame][extension]`.

After exporting all your frames to a folder, you can use FFMPEG, After Effects, Photoshop, or your favourite "PNG Sequence to Movie" software.

The `canvas-sketch-cli` also includes two built-in utilities for converting image sequences to GIF and MP4 formats. Both of these tool depend on `ffmpeg`:

- `canvas-sketch-gif` converts frames to GIF
- `canvas-sketch-mp4` converts frames to MP4

These tools depend on `ffmpeg` and expect it to be available on the PATH environment (see [How to Install `ffmpeg`](./troubleshooting.md#installing-ffmpeg-for-animation-sequences) for details).

> :bulb:
>
> <sup>If you don't have `ffmpeg` installed, you can use the free online tool [https://giftool.surge.sh/](https://giftool.surge.sh/)</sup>

Example usage:

```sh
# Do some sketching and export sequence to tmp/
canvas-sketch foo.js --output=tmp/

# Now convert the sequence of 0-padded PNGs to a GIF
canvas-sketch-gif tmp/ output.gif --fps=24

# Or to a MP4 file, generating a new filename by timestamp
canvas-sketch-mp4 tmp/ --fps=24
```

> :bulb:
>
> <sup>Make sure to match the `--fps` flag to your `{ fps }` sketch settings for best results.</sup>


You can read the full CLI documentation in [Converting GIF and MP4 Files](./cli.md#converting-gif-and-mp4-files).

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
const Canvas = require('canvas');

// Create a new 'node-canvas' interface
const canvas = new Canvas();

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