const canvasSketch = require('canvas-sketch');

// Sketch parameters
const settings = {
  dimensions: 'a4',
  // encoding: 'image/jpeg',
  // encodingQuality: 0.95,
  // pixelsPerInch: 300,
  // units: 'in'
};

// Artwork function
const sketch = ({ exportFrame }) => {
  window.addEventListener('click', async () => {
    const result = await exportFrame({  });
    console.log('Exported Result', result.dataURL);
  });
  return ({ context, width, height }) => {
    // Margin in inches
    const margin = 1 / 4;

    // Off-white background
    context.fillStyle = 'hsl(0, 0%, 98%)';
    context.fillRect(0, 0, width, height);

    // Gradient foreground
    const fill = context.createLinearGradient(0, 0, 0, height);
    fill.addColorStop(0, 'red');
    fill.addColorStop(1, 'green');

    context.fillStyle = fill;
    context.fillRect(margin, margin, width - margin * 2, height - margin * 2);
  };
};

// Start the sketch
canvasSketch(sketch, settings);