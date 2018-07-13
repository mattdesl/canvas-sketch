const canvasSketch = require('canvas-sketch');

const settings = {
  // Output resolution, we can use 300PPI for print
  pixelsPerInch: 300,
  // Standard business card size
  dimensions: [ 3.5, 2 ],
  // all our dimensions and rendering units will use inches
  units: 'in'
};

const sketch = ({ context }) => {
  // Utility to draw a circle with or without a fill
  const circle = (x, y, radius, fill = false) => {
    context.beginPath();
    context.arc(x, y, radius, 0, Math.PI * 2, false);
    if (fill) context.fill();
    context.stroke();
  };

  return ({ context, width, height, frame }) => {
    // Fill page with solid color
    // The 'width' and 'height' will be in inches here
    context.fillStyle = '#000';
    context.fillRect(0, 0, width, height);

    context.strokeStyle = '#fff';
    context.fillStyle = '#fff';
    context.lineWidth = 0.01;
    for (let i = 0; i < 5; i++) {
      const x = i / 4 * width;
      const y = height / 2;
      const radius = i % 2 === 0 ? 0.5 : 0.25;
      const fill = i % 4 === 0;
      circle(x, y, radius, fill);
    }
  };
};

canvasSketch(sketch, settings);
