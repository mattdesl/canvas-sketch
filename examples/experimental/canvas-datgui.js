const canvasSketch = require('canvas-sketch');
const { GUI } = require('dat.gui');

const gui = new GUI();

const settings = {
  // Setup the canvas for print artwork
  units: 'in',
  pixelsPerInch: 300,
  scaleToView: true,
  dimensions: 'postcard'
};

// UI Parameters
const config = {
  count: 300,
  background: '#ebb4b4',
  foreground: '#ffffff'
};

const sketch = ({ render, update }) => {
  const boxes = [];

  // Generative function
  const generate = () => {
    boxes.length = 0;
    for (let i = 0; i < config.count; i++) {
      boxes.push({
        position: [ Math.random() * 2 - 1, Math.random() * 2 - 1 ],
        size: Math.random() * 0.05
      });
    }
  };

  // Examples of UI changing things...

  // Case A — UI controls that update the sketch size/settings
  const sizes = Object.keys(canvasSketch.PaperSizes);
  gui.add(settings, 'dimensions', sizes).onChange(() => update(settings));

  // Case B — UI controls that only need a re-render
  gui.addColor(config, 'background').onChange(render);

  // Case C — UI controls that need to re-generate the artwork
  gui.add(config, 'count', 0, 1000, 1).onChange(() => {
    // Build a new generation
    generate();
    // Now trigger a re-render
    render();
  });

  // Seed the artwork initially
  generate();

  return ({ context, width, height }) => {
    // draw background
    context.fillStyle = config.background;
    context.fillRect(0, 0, width, height);

    // recenter & scale from -1...1
    context.translate(width / 2, height / 2);

    const scale = Math.min(width, height) / 3;
    context.scale(scale, scale);

    // draw foreground
    context.fillStyle = config.foreground;
    boxes.forEach(({ size, position }) => {
      context.fillRect(position[0] - size / 2, position[1] - size / 2, size, size);
    });
  };
};

canvasSketch(sketch, settings);
