# Exporting Media

One of the key features of this framework is the ability to export images and other types of files, such as SVG, GCode, JSON metadata, and even 3D models.

## Keyboard Shotcuts

When the canvas is in focus, you can trigger exports and playback changes with these keyboard shortcuts:

- `CmdOrCtrl + S` - Export a single frame of media
- `CmdOrCtrl + Shift + S` - Export a sequence of frames
- `CmdOrCtrl + K` - Commit and export a single frame of media
- `Space` - toggle play/pause when `{ animate: true }` is used

Where `CmdOrCtrl` can be `Command` or `Control` keys, depending on your keyboard preference.

By default, files are exported to your Downloads folder.

## Exporting with `canvas-sketch-cli`

When using the CLI tool, the exporter will use a server plugin to make exporting more streamlined, rather than relying fully on the browser. This gives you more control over exporting, especially with long frame sequences.

By default, the CLI will search for your `~/Downloads` folder (and similar across platforms). You can change the output folder like so, choosing a location relative to the current working directory:

```sh
canvas-sketch src/index.js --output=media/
```

Alternatively, you can disable the CLI export plugin and rely entirely on the browser exporter.

```sh
canvas-sketch src/index.js --no-output
```

## Exporting without `canvas-sketch-cli`

If you are not using the CLI tool, or if you are using this library with a different development server (i.e. Parcel, Webpack, etc), the files will try to be downloaded via the browser. This works best in Chrome, although you may have to "Accept Multiple File Downloads" before using it.

Chrome also defaults to standard `~/Downloads` folders, but you can change it in `Settings > Advanced > Downloads > Location`.

## File Naming

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

Alternatively, you can also specify a `{ file }` option, which will ignore the naming scheme and just be used as-is.

## Exporting Other File Types

Sometimes artworks are visualized in the browser, but exported in a different format than PNG. For example, a pen plotter artwork may be exported as SVG or G-code.

In these cases, your *renderer* function can return a "file descriptor" object. The object can either be a `<canvas>` element, or an object containing `{ data, extension }` and possibly other properties.

For example, exporting a JSON file:

```js
canvasSketch(() => {
  return ({ context, width, height } => {
    // Render your scene...
    // ...

    // Export your file
    return { data: JSON.stringify({ foo: 'bar' }), extension: '.json' };
  };
});
```

## Exporting Multiple Layers

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
      // layer1 = <canvas>
      canvas,
      // layer2 = <canvas>
      { data: someOtherCanvas, suffix: '.thumb' },
    ];
  };
});
```

## Exporting Animations

When you use `CmdOrCtrl + Shift + S` to export an animation, it will begin recording frames. You can hit this keystroke again to stop recording.

> :warning: If your animation has no defined duration (i.e. it is endless), it will continue exporting frames forever!

Frame numbers are exported with left-padded zeros, such as `0005.png`. If you have multiple layers, they will be exported as `[layer]-[frame][extension]`.

After exporting all your frames to a folder, you can use FFMPEG, After Effects, Photoshop, or your favourite "PNG Sequence to Movie" software.

For example, a high quality 256x256 GIF sequence at 24 FPS can be generated with `ffmpeg` like so:

```sh
ffmpeg -r 24 -i %03d.png -y -vf \
  fps=24,scale=256:-1:flags=lanczos,palettegen \
  output_palette.png && ffmpeg -i tmp/%03d.png \
  -i output_palette.png -y -filter_complex \
  "fps=24,scale=256:-1:flags=lanczos[x];[x][1:v]paletteuse" \
  output.gif
```

Or, to create an MP4 with `ffmpeg`:

```sh
ffmpeg -framerate 24 -i %03d.png -y -c:v libx264 -profile:v high -crf 20 -pix_fmt yuv420p output.mp4
```

## Git Commit & File Hashing

If you are doing a lot of generative artwork, you might start to accumulate artworks that cannot be reproduced since the exact combination of code & randomness for that print has been lost over time.

To combat this, one solution is to commit your code and *then* export your media, named in such a way that it points back to your latest git SHA-1 commit hash.

If you are using `canvas-sketch-cli` from within a git repo, you can use `CmdOrCtrl + K` to automate this. It will `git add` and `git commit` your latest code changes, then export a file using the SHA-1 hash of the latest commit.

To further improve reproducibility, you can export a JSON metadata layer (for example, containing `dat.gui` slider parameters), or embed information (like a random seed) into the `{ suffix }` option.