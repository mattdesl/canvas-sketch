#

### :warning:
### WORK IN PROGRESS

**This is in early beta stages, don't expect it to work reliably across versions yet. I'm looking for collaborators and beta testers, so please post an issue if you find any problems or want to help out with this project in some way.**

---

### canvas-sketch

`canvas-sketch` is a loose collection of tools, modules and resources for creating generative art in JavaScript and the browser.

<!-- - :sparkles: Website (not yet public) -->

- :closed_book: [Documentation](./docs/README.md)

- :wrench: [Examples](./examples/)

#

<p align="center">
  <sub>example of <code>canvas-sketch</code> running in Chrome</sub>
</p>

<p align="center">
  <sub>↓</sub> 
</p>

<p align="center">
  <img src="docs/assets/images/chrome-example.png" width="50%" />
</p>

### Quick Start with Node.js & npm

To jump directly into `canvas-sketch`, try the following terminal commands with `node@8.x` and `npm@5.x` or newer.

```sh
# Install the CLI tool globally
npm install canvas-sketch-cli -g

# Make a new folder to hold all your generative sketches
mkdir my-sketches

# Move into that folder
cd my-sketches

# Scaffold a new 'sketch.js' file and open the browser
canvas-sketch sketch.js --new --open
```

While in the browser, hit `Cmd + S` or `Ctrl + S` to export a high-resolution PNG of your artwork to your `~/Downloads` folder.

Some other commands to try:

```sh
# Start the tool on an existing file and change PNG export folder
canvas-sketch src/foobar.js --output=./tmp/

# Start a new sketch from the Three.js template
canvas-sketch --new --template=three --open

# Build your sketch to a sharable HTML + JS website
canvas-sketch src/foobar.js --build

# Develop with "Hot Reloading" instead of full page reload
canvas-sketch src/foobar.js --hot
```

For more features and details, see the [Documentation](./docs/README.md).

### Code Example

Once you have the CLI tool running, you can try this example of an A4 print artwork.

```js
const canvasSketch = require('canvas-sketch');

// Sketch parameters
const settings = {
  dimensions: 'a4',
  pixelsPerInch: 300,
  units: 'in'
};

// Artwork function
const sketch = () => {
  return ({ context, width, height }) => {
    // Margin in inches
    const margin = 1 / 4;

    // Off-white background
    context.fillStyle = 'hsl(0, 0%, 98%)';
    context.fillRect(0, 0, width, height);

    // Gradient foreground
    const fill = context.createLinearGradient(0, 0, width, height);
    fill.addColorStop(0, 'cyan');
    fill.addColorStop(1, 'orange');

    // Fill rectangle
    context.fillStyle = fill;
    context.fillRect(margin, margin, width - margin * 2, height - margin * 2);
  };
};

// Start the sketch
canvasSketch(sketch, settings);
```

When exporting the image in browser with `Cmd + S` or `Ctrl + S` keystrokes, the saved PNG file matches 21 x 29.7 cm at 300 DPI, and can be printed with archival ink on quality paper.

Resulting image looks something like this:

<img src="docs/assets/images/gradient.png" width="50%" />

###### <sup>Note: The above PNG file has been scaled/optimized for web.</sup>

### Roadmap

There are many features still outstanding, such as:

- API & CLI Docs
- Easy & beginner-friendly examples
- Website/frontend
- HUD/GUI controls
- "Gallery Mode" for viewing many local sketches
- External Module for utilities (randomness, geometry, etc)
- Unit tests
- More??

### License

MIT, see [LICENSE.md](http://github.com/mattdesl/canvas-sketch/blob/master/LICENSE.md) for details.
