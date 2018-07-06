/**
 * A Canvas2D example of a spiraling flower pattern,
 * which is set to the physical size of a typical business
 * card (3.5 x 2 inches with 1/8" bleed).
 * @author Matt DesLauriers (@mattdesl)
 */

const sketcher = require('canvas-sketch');

const settings = {
  // 300 PPI for print resolution
  pixelsPerInch: 300,
  // We can use a preset
  dimensions: [ 3.5, 2 ],
  // All our dimensions and rendering units will use inches
  units: 'in',
  // Include a bit of 'bleed' to the dimensions above
  bleed: 1 / 8
};

const sketch = ({ context }) => {
  // Utility to draw a circle with or without a fill
  const circle = (x, y, radius, fill) => {
    context.beginPath();
    context.arc(x, y, radius, 0, Math.PI * 2, false);
    if (fill) context.fill();
    context.stroke();
  };

  return props => {
    const {
      context, exporting, bleed,
      width, height,
      trimWidth, trimHeight
    } = props;

    // Fill entire page with solid color
    // All units are inches including 'width' and 'height'
    context.fillStyle = '#1d1d1d';
    context.fillRect(0, 0, width, height);

    // Visualize the trim area with a yellow guide (ignored on export)
    if (!exporting && bleed > 0) {
      context.strokeStyle = 'yellow';
      context.lineWidth = 0.0075;
      context.strokeRect(bleed, bleed, trimWidth, trimHeight);
    }

    // Set a line thickness for all strokes
    context.lineWidth = 0.005;

    // Fill and stroke with pure white
    const color = '#fff';
    context.fillStyle = context.strokeStyle = color;

    // Make circles expand to edge of smallest trim (card) edge,
    // but with a 1/4" padding.
    const maxRadius = (Math.min(trimWidth, trimHeight) / 2) - (1 / 4);

    // Draw circles
    const count = 63 * 4;
    for (let i = 0; i < count; i++) {
      const t = i / count;
      const angle = t * Math.PI * 40;
      const offset = maxRadius * Math.pow(t, 0.5);
      const tx = Math.cos(angle) * offset;
      const ty = Math.sin(angle) * offset;
      const cx = width / 2 + tx;
      const cy = height / 2 + ty;
      const radius = 0.02 * Math.pow(t, 0.5);
      circle(cx, cy, radius, i % 2 === 0);
    }

    context.restore();
  };
};

sketcher(sketch, settings);
