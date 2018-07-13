const canvasSketch = require('canvas-sketch');
const Random = require('./util/random');

const rough = require('roughjs');

const colors = {
  background: '#f4d9be',
  foreground: '#ff911c',
  pen: '#1975ff'
};

const settings = {
  // animate: true,
  // When exporting, use the seed as the suffix
  // This way we can reproduce it more easily later
  dimensions: [ 1280, 1280 ],
  exportPixelRatio: 2
};

const sketch = ({ context, width, height }) => {
  const roughCanvas = rough.canvas(context.canvas);
  const margin = width * 0.1;

  // Make a few 'stems' for the fruit at different angles
  const stemAngles = [
    20,
    100,
    50
  ];

  // The stems are just rectangles really...
  const stems = stemAngles.map(angle => {
    const rotation = Random.gaussian(angle, 10) * Math.PI / 180;
    const size = [ Random.gaussian(30, 10), Random.gaussian(120, 20) ];
    const position = [ width / 2, height / 2 - width * 0.33 / 2 - Random.gaussian(0, 10) ];
    return {
      fill: true,
      position,
      size,
      rotation
    };
  });

  // Render the shapes
  return ({ time }) => {
    context.fillStyle = 'white';
    context.fillRect(0, 0, width, height);
    context.lineJoin = 'round';
    context.lineCap = 'round';

    // Draw a background
    roughCanvas.rectangle(margin, margin, width - margin * 2, height - margin * 2, {
      fill: colors.background,
      fillStyle: 'solid',
      stroke: colors.background,
      strokeWidth: 20
    });

    // Draw the fruit
    roughCanvas.circle(width / 2, height / 2, width * 0.33, {
      fillStyle: 'solid',
      fill: colors.foreground,
      stroke: colors.pen,
      strokeWidth: 1.5
    });

    // Draw the 'stems'
    stems.forEach(({ position, size, rotation, fill }) => {
      context.translate(position[0], position[1]);
      context.rotate(rotation);
      context.translate(-position[0], -position[1]);

      const params = fill ? {
        fillStyle: 'hachure',
        fill: colors.pen,
        stroke: 'transparent',
        strokeWidth: 2
      } : {
        stroke: colors.pen,
        strokeWidth: 1
      };
      roughCanvas.rectangle(position[0] - size[0] / 2, position[1] - size[1] / 2, size[0], size[1], params);
    });
  };
};

canvasSketch(sketch, settings);
