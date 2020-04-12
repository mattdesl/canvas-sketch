#### <sup>:closed_book: [canvas-sketch](../README.md) → [Documentation](./README.md) → Troubleshooting</sup>

---

### Troubleshooting

- [Supported Engines & Browsers](#supported-engines--browsers)
- [Installing Node.js, npm and a terminal](#installing-nodejs-npm-and-a-terminal)
- [Using `canvas-sketch` with Webpack and Other Bundlers](#using-canvas-sketch-with-webpack-and-other-bundlers)
- [Using `canvas-sketch` without Node.js and npm](#using-canvas-sketch-without-nodejs-and-npm)
- [Fixing EACCESS Error on `npm install -g`](#fixing-eaccess-error-on-npm-install--g)
- [Installing `ffmpeg` For Animation Sequences](#installing-ffmpeg-for-animation-sequences)

### Supported Engines & Browsers

The `canvas-sketch` ecosystem is generally designed with ES6 support in mind, intended to be run on modern browsers with support for hardware-accelerated Canvas/WebGL.

The JavaScript library/module is transpiled to ES5 syntax, but relies on some ES6 APIs such as Promise, fetch, etc. Polyfills may allow the library to work in legacy browsers, but it has not been tested.

It should work with a variety of bundlers (Webpack, Rollup, Parcel, Browserify, etc). If you run into integration issues, please open a new issue.

Recommended minimum versions:

- Safari 11+
- iOS Safari 10+
- FireFox 60+
- Chrome for Android 66+
- Chrome 66+
- Node.js 8.10.0+
- npm 5.6.0+

### Installing Node.js, npm and a terminal

If you [download Node.js from its website](https://nodejs.org/en/download/), it will also include a recent version of `npm`. After installation, reboot your computer and the software should be available in your terminal or command-line application:

- **macOS** users can use the built-in Terminal located at *Applications → Utilities → Terminal.app*
- **Windows** users can use the built-in cmd.exe, *Start Menu → (Search "cmd") → Select cmd.exe*
  - For a better development experience on Windows, try a Unix-like terminal emulator like [cmder](http://cmder.net/)

### Using `canvas-sketch` with Webpack and Other Bundlers

The `canvas-sketch` module exports a regular ES5 library, so you should be able to use it in Webpack, Rollup, and other bundlers.

```js
import canvasSketch from 'canvas-sketch';
```

However, without the `canvas-sketch-cli` tool running, file exporting will use regular browser APIs which can lead to a less optimal development experience.

### Using `canvas-sketch` without Node.js and npm

You can use this without a package manager by using the [unpkg.com](https://unpkg.com/) service and pointing to the UMD build. For example:

```html
<html>
  <body>
    <!-- Attaches canvasSketch to window global -->
    <script src="https://unpkg.com/canvas-sketch@latest/dist/canvas-sketch.umd.js"></script>
    <!-- Now you can use the library like normal -->
    <script>
      canvasSketch(() => {
        // ...
      });
    </script>
  </body>
</html>
```

You can also download the latest build [here](https://unpkg.com/canvas-sketch@latest/dist/canvas-sketch.umd.js) and include it yourself, which is easier for offline use.

### Fixing EACCESS Error on `npm install -g`

If you get an EACCESS error when installing `canvas-sketch-cli` globally, you may want to see these guides:

- [Fixing npm permissions](https://docs.npmjs.com/getting-started/fixing-npm-permissions#option-1-change-the-permission-to-npms-default-directory)
- [More Details (StackOverflow)](https://stackoverflow.com/questions/16151018/npm-throws-error-without-sudo)

### Installing `ffmpeg` For Animation Sequences

To use `canvas-sketch-mp4` and `canvas-sketch-gif`, you'll need to install `ffmpeg` for your platform. You can either install native `ffmpeg` (such as through `brew install ffmpeg` on macOS), or you can install this module which will be resolved locally or globally:

```sh
npm install @ffmpeg-installer/ffmpeg --global
```

Once installed, `ffmpeg` should be added to your PATH environment variable for. This may require restarting terminal or rebooting your computer.

## 

#### <sup>[← Back to Documentation](./README.md)

<!--
### Using `ffmpeg` manually and with custom commands

The `canvas-sketch-gif` tool is a thin wrapper around a command that looks like this, with configurable size and fps:

```sh
ffmpeg -r 24 -i %03d.png -y -vf \
  fps=24,scale=256:-1:flags=lanczos,palettegen \
  output_palette.png && ffmpeg -i tmp/%03d.png \
  -i output_palette.png -y -filter_complex \
  "fps=24,scale=256:-1:flags=lanczos[x];[x][1:v]paletteuse" \
  output.gif
```

And the `canvas-sketch-mp4` roughly translates to:

```sh
ffmpeg -framerate 24 -i %03d.png -y -c:v libx264 -profile:v high -crf 20 -pix_fmt yuv420p output.mp4
```
-->