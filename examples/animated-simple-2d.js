/**
 * A Canvas2D example of a basic animation.
 * @author Matt DesLauriers (@mattdesl)
 */

const canvasSketch = require('canvas-sketch');

const settings = {
  animate: true,
  duration: 3,
  fps: 24,
  dimensions: [ 256, 256 ]
};

// Utility to draw a rotated line
const fillLine = (context, cx, cy, thickness, length, rotation = 0) => {
  context.save();
  context.translate(cx, cy);
  context.rotate(rotation);
  context.fillRect(-thickness / 2, -length / 2, thickness, length);
  context.restore();
};

// Start the sketch
canvasSketch(() => {
  return ({ context, width, height, playhead }) => {
    // Fill the canvas with pink
    context.fillStyle = 'pink';
    context.fillRect(0, 0, width, height);

    // Draw a rotating rectangle around the center
    const cx = width / 2;
    const cy = height / 2;
    // Get a seamless 0..1 value for our loop
    const seamless = Math.sin(playhead * Math.PI);
    // Animate the thickness with playhead
    const thickness = Math.max(5, Math.pow(seamless, 0.55) * width * 0.5);
    const length = height * 0.5;
    // Rotate with PI to create a seamless animation
    const rotation = playhead * Math.PI;
    // Draw the scene
    context.fillStyle = 'white';
    fillLine(context, cx, cy, thickness, length, rotation);
  };
}, settings);
