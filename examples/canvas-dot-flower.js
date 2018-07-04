/**
 * A Canvas2D example of a spiraling flower pattern,
 * which is set to the physical size of a typical business
 * card (3.5 x 2 inches).
 * @author Matt DesLauriers (@mattdesl)
 */

const sketcher = require('canvas-sketch');

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
  const circle = (x, y, radius, fill) => {
    context.beginPath();
    context.arc(x, y, radius, 0, Math.PI * 2, false);
    if (fill) context.fill();
    context.stroke();
  };

  return ({ context, width, height, frame }) => {
    // Fill page with solid color
    // The 'width' and 'height' will be in inches here
    context.fillStyle = '#1d1d1d';
    context.fillRect(0, 0, width, height);

    // Set a line thickness for all strokes
    context.lineWidth = 0.005;

    // Fill and stroke with pure white
    const color = '#fff';
    context.fillStyle = context.strokeStyle = color;

    const count = 63 * 4;
    for (let i = 0; i < count; i++) {
      const t = i / count;
      const angle = t * Math.PI * 40;
      const offset = Math.pow(t, 0.5) * 0.75;
      const tx = Math.cos(angle) * offset;
      const ty = Math.sin(angle) * offset;
      const cx = width / 2 + tx;
      const cy = height / 2 + ty;
      const radius = 0.02 * Math.pow(t, 0.5);

      circle(cx, cy, radius, i % 2 === 0);
    }
  };
};

sketcher(sketch, settings);
