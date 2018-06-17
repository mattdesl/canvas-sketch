# canvas-sketch

A framework for generative sketching in JavaScript and the browser.

# :warning: Work in progress :warning:

This repo is heavily work in progress. 

# Quick Start

Super quick start with npm and terminal.

```sh
# Install the CLI tool globally
npm i canvas-sketch-cli -g

# Create an empty directory, move into it
mkdir my-sketches
cd my-sketches

# Start sketching
canvas-sketch --new --open
```

This will write a new plain sketch in a `sketches/` folder, generate a `package.json` if necessary, install any dependencies the sketch template requires, and then launch the development server and default browser. Now you can edit the newly created file in the `sketches/` folder.

A few other commands to try:

```sh
# run the dev server with an existing sketch file
canvas-sketch sketches/my-sketch.js

# Generate and launch a new regl sketch
canvas-sketch --new --template=regl --open
```

When sketching, you can hit `Cmd + S` in the browser window to export a high quality PNG to your Chrome `Downloads` folder. If you are in a Git repo, hit `Cmd + K` to commit your latest code and use the SHA-1 hash in your exported file name (i.e. for better reproducibilty later on).

# Next Steps

Now that you have the basics running, you can read through the intro guide here:

- [Intro - A Framework for Generative Sketching](./docs/basics.md)

Or browse the [examples/](./examples/) folder for more inspiration.

---

### What is this used for?

The goal of this framework is to streamline the creation of various types of Canvas2D and WebGL artworks in the browser. For example, it can be used to produce:

- High-quality Giclée print artwork (e.g. large framed wall art)
- SVG files that can be sent to a pen plotter, laser cutter, or other CNC machine
- Seamless GIF/MP4 animation loops
- Full-screen interactive web artwork, for e.g. for an art installation, projection mapping and VJing
- Pixel art, for example per-pixel manipulation that produces a small but pixel-perfect image
- More advanced workflows, such as exporting 3D OBJ files or a set of masks for a Risograph printer

Ultimately, `canvas-sketch` intends to be a loose collection of modules, resources, examples, and recommendations for creating generative browser art. It can be used alongside ThreeJS, regl, P5.js, or your favourite graphics library.

## License

MIT, see [LICENSE.md](http://github.com/mattdesl/canvas-sketch/blob/master/LICENSE.md) for details.
