const canvasSketch = require('canvas-sketch');

// Import Two.js - make sure to have greater than v0.7.0-alpha.1
// because previous versions don't support module loading or headless environments
const Two = require('two.js');

const settings = {
  animate: true
};

const sketch = ({ canvas, width, height, pixelRatio }) => {
  // Create the instance of Two.js with settings based on canvas-sketch
  const two = new Two({
    // Pass the canvas-sketch domElement into Two
    domElement: canvas
  });

  // Create a background rectangle
  const background = new Two.Rectangle(0, 0, two.width, two.height);

  // Disable outline/stroke
  background.noStroke();

  // Fill the background with a radial gradient
  background.fill = new Two.RadialGradient(0, 0, 1, [
    new Two.Stop(0, 'hsl(0, 50%, 75%)'),
    new Two.Stop(1, 'hsl(0, 50%, 50%)')
  ]);

  // Create a rectangle element
  const rectangle = new Two.Rectangle(0, 0, two.width / 5, two.width / 5);
  rectangle.noStroke();

  // Add both components to the scene
  two.add(background);
  two.add(rectangle);

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

      // Reorient the scene to the center of the new canvas dimensions
      two.scene.translation.set(two.width / 2, two.height / 2);

      // Make the gradient fill the screen
      background.fill.radius = Math.max(two.width, two.height) * 0.65;

      // Update the background's width and height to adhere
      // to the bounds of the canvas.
      background.width = two.width;
      background.height = two.height;
    },
    render ({ time }) {
      // Rotate the rectangle
      rectangle.rotation = time * 2;

      // Update two.js via the `render` method - *not* the `update` method.
      two.render();
    }
  };
};

canvasSketch(sketch, settings);
