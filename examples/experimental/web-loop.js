const sketcher = require('canvas-sketch');

const settings = {
  dimensions: [ 512, 512 ],
  duration: 3,
  animate: true,
  fps: 24,
  exportPixelRatio: 2
};

const sketch = () => {
  return ({ context, frame, totalFrames, time, playhead, width, height }) => {
    // Fill browser with solid color
    context.fillStyle = 'black';
    context.fillRect(0, 0, width, height);

    // Draw a 12px thick stroke circle
    context.lineWidth = 12;
    context.strokeStyle = 'white';
    context.beginPath();
    const radius = Math.min(width, height) / 4 * Math.sin(playhead * Math.PI);
    context.arc(width / 2, height / 2, radius, 0, Math.PI * 2, false);
    context.stroke();
  };
};

window.app = sketcher(sketch, settings);
