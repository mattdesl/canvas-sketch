const canvasSketch = require('canvas-sketch');
const { lerp } = require('canvas-sketch-util/math');
const palettes = require('nice-color-palettes');

// Params:
// time, frame, duration, fps

const settings = {
  animate: true,
  duration: 3,
  dimensions: [ 640, 640 ],
  scaleToView: true,
  playbackRate: 'throttle',
  fps: 24,
  parent: document.body,
  params: {
    seed: {
      value: 0,
      min: 0,
      max: 10000000,
      step: 1
    },
    count: 11,
    background: 'pink',
    foreground: {
      type: 'color',
      value: 'hsl(0, 0%, 0%)'
    },
    thickness: {
      value: 0.25,
      min: 0.01,
      max: 1,
      step: 0.01
    },
    length: {
      value: 0.25,
      min: 0.01,
      max: 1,
      step: 0.01
    },
    download: ({ exportFrame }) => exportFrame(),
    // togglePlay: ({ togglePlay }) => togglePlay()
  }
};

// Start the sketch
canvasSketch(({ update, exportFrame, paramControls }) => {
  return ({ context, frame, width, height, playhead, params }) => {
    context.clearRect(0, 0, width, height);
    context.fillStyle = params.background;
    context.fillRect(0, 0, width, height);

    const gridSize = params.count;
    const padding = width * 0.2;
    const tileSize = (width - padding * 2) / gridSize;

    for (let x = 0; x < gridSize; x++) {
      for (let y = 0; y < gridSize; y++) {
        // get a 0..1 UV coordinate
        const u = gridSize <= 1 ? 0.5 : x / (gridSize - 1);
        const v = gridSize <= 1 ? 0.5 : y / (gridSize - 1);

        // scale to dimensions with a border padding
        const tx = lerp(padding, width - padding, u);
        const ty = lerp(padding, height - padding, v);

        // here we get a 't' value between 0..1 that
        // shifts subtly across the UV coordinates
        const offset = u * 0.2 + v * 0.1;
        const t = (playhead + offset) % 1;

        // now we get a value that varies from 0..1 and back
        let mod = Math.sin(t * Math.PI);

        // we make it 'ease' a bit more dramatically with exponential
        mod = Math.pow(mod, 3);

        // now choose a length, thickness and initial rotation
        const length = tileSize * params.length;
        const thickness = tileSize * params.thickness;
        const initialRotation = Math.PI / 2;

        // And rotate each line a bit by our modifier
        const rotation = initialRotation + mod * Math.PI;

        // Now render...
        context.fillStyle = params.foreground;
        draw(context, tx, ty, length, thickness, rotation);
      }
    }
  };

  function draw (context, x, y, length, thickness, rotation) {
    context.save();

    // Rotate in place
    context.translate(x, y);
    context.rotate(rotation);
    context.translate(-x, -y);

    // Draw the line
    context.fillRect(x - length / 2, y - thickness / 2, length, thickness);
    context.restore();
  }
}, settings);
