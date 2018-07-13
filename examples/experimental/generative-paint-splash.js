const sketcher = require('canvas-sketch');

const settings = {
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
    context.fillStyle = '#000';
    context.fillRect(0, 0, width, height);

    context.strokeStyle = '#fff';
    context.fillStyle = '#fff';
    context.lineWidth = 0.005;
    const count = 32 * 4;
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
