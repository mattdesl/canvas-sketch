/**
 * A Canvas2D example of a spiraling flower pattern,
 * which is set to the physical size of a typical business
 * card (3.5 x 2 inches with 1/8" bleed).
 * @author Matt DesLauriers (@mattdesl)
 */

const canvasSketch = require('canvas-sketch');

const settings = {
  // 300 PPI for print resolution
  pixelsPerInch: 300,
  // All our dimensions and rendering units will use inches
  units: 'in',
  // 3.5x2 inches
  dimensions: [ 3.5, 2 ],
  // Include 1/8 inch 'bleed' to the dimensions above
  bleed: 1 / 8
};

const sketch = ({ context }) => {
  return props => {
    const {
      context, exporting, bleed,
      width, height,
      trimWidth, trimHeight
    } = props;

    // Clear canvas and fill with a color
    // All units are inches including 'width' and 'height'
    context.clearRect(0, 0, width, height);
    context.fillStyle = '#eff3f4';
    context.fillRect(0, 0, width, height);

    // Visualize the trim area with a yellow guide
    // This is ignored on export
    if (!exporting && bleed > 0) {
      context.strokeStyle = 'hsl(0, 80%, 80%)';
      context.lineWidth = 0.0075;
      context.strokeRect(bleed, bleed, trimWidth, trimHeight);
    }

    // Use a foreground color for the points
    const color = '#2b82b5';
    context.fillStyle = color;

    // Make circles expand to edge of smallest trim (card) edge,
    // but with a 1/4" padding.
    const maxRadius = (Math.min(trimWidth, trimHeight) / 2) - (1 / 4);

    // Draw points
    const points = 200;
    for (let i = 1; i <= points; i++) {
      const t = i / points;
      // Here phi is the golden ratio
      const phi = (Math.sqrt(5) + 1) / 2;
      // Pick our angle based on the golden ratio
      const theta = 2 * Math.PI * i * phi;
      // Get back a distance 0..1 based on current step
      const distance = Math.sqrt(t);
      // Find the cartesian point on a unit circle
      const x = Math.cos(theta);
      const y = Math.sin(theta);
      // Scale this point to our max dimensions
      const r = distance * maxRadius;
      // Find the point on the paper in inches
      const cx = width / 2 + x * r;
      const cy = height / 2 + y * r;
      // Now draw a circle at each point
      // Make them smaller when closer to centre
      const radius = 0.02 * Math.pow(t, 0.5);
      context.beginPath();
      context.arc(cx, cy, radius, 0, Math.PI * 2, false);
      context.fill();
    }
  };
};

canvasSketch(sketch, settings);
