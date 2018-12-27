const canvasSketch = require('canvas-sketch');

// Import Two.js - make sure to have greater than v0.7.0-alpha.1
// because previous versions don't support module loading or headless environments
const Two = require('two.js');

const settings = {
  dimensions: [ 2048, 2048 ],
  // Make the loop animated
  animate: true
};

const sketch = ({ canvas, width, height, pixelRatio }) => {
  // Create the instance of Two.js
  const two = new Two({
    width,
    height,
    ratio: pixelRatio,
    domElement: canvas,
    overdraw: true
  });

  // Create the subject of the visual output
  const star = new Two.Star(0, 0, two.width / 10, two.width / 5, 5);
  star.stroke = 'white';
  star.linewidth = 8;
  star.fill = '#000';
  two.add(star);

  return {
    resize ({ pixelRatio, width, height }) {
      // Update width and height of Two.js scene based on
      // canvas-sketch auto changing viewport parameters
      two.width = width;
      two.height = height;
      two.ratio = pixelRatio;

      // This needs to be passed down to the renderer's width and height as well
      two.renderer.width = two.width;
      two.renderer.height = two.height;
    },
    render ({ time }) {
      const x = Math.random() * two.width;
      const y = Math.random() * two.height;

      // Place the star randomly on the canvas
      star.translation.set(x, y);
      // Change how many sides it has
      star.sides = Math.floor(Math.random() * 8) + 4;
      // Change the rotation
      star.rotation = Math.random() * Math.PI * 2;

      // Swap the stroke / fill every frame randomly
      if (Math.random() > 0.5) {
        star.stroke = '#000';
        star.fill = 'white';
      } else {
        star.stroke = 'white';
        star.fill = '#000';
      }

      // Update two.js via the `render` method - *not* the `update` method.
      two.render();
    }
  };
};

canvasSketch(sketch, settings);
