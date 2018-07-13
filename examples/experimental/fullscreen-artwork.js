const sketcher = require('canvas-sketch');

const sketch = () => {
  return ({ context, width, height }) => {
    // Fill browser with solid color
    context.fillStyle = 'black';
    context.fillRect(0, 0, width, height);

    // Draw a 12px thick stroke circle
    context.lineWidth = 12;
    context.strokeStyle = 'white';
    context.beginPath();
    context.arc(width / 2, height / 2, Math.min(width, height) / 4, 0, Math.PI * 2, false);
    context.stroke();
  };
};

sketcher(sketch);
