const canvasSketch = require('canvas-sketch');

// Import Two.js — make sure to have greater than v0.7.0-alpha.1
// because previous versions don't support module loading or headless environments
const Two = require('two.js');

const settings = {
  dimensions: [ 2048, 2048 ],
  // Make the loop animated
  animate: true
};

const sketch = ({ canvas, width, height, pixelRatio }) => {

  // Create the instance of Two.js with settings based on canvas-sketch
  const two = new Two({
    width: width,
    height: height,
    // Pass the canvas-sketch domElement into Two
    domElement: canvas,
    ratio: pixelRatio
  });

  // Create a radial gradient background
  const background = new Two.Rectangle(0, 0, two.width, two.height);
  background.noStroke();
  // Radial Gradient has origin x, y a radius then an array of color stops
  // Each stop requires an offset value (0 - 1) and a CSS compatible color
  background.fill = new Two.RadialGradient(0, 0, two.height / 2, [
    new Two.Stop(0, 'tomato'),
    new Two.Stop(1, 'rgb(255, 50, 50)')
  ]);

  // Create the subject of the visual output
  const rectangle = new Two.Rectangle(0, 0, two.width / 5, two.width / 5);
  rectangle.noStroke();

  // Add both the background and rectangle to the scene
  // Order matters here:
  two.add(background, rectangle);

  // Orient the scene to make 0, 0 the center of the canvas
  two.scene.translation.set(two.width / 2, two.height / 2);

  return {
    resize ({ pixelRatio, viewportWidth, viewportHeight }) {

      // Update width and height of Two.js scene based on
      // canvas-sketch auto changing viewport parameters
      two.width = viewportWidth;
      two.height = viewportHeight;
      two.ratio = pixelRatio;

      // This needs to be passed down to the renderer's width and height as well
      two.renderer.width = two.width;
      two.renderer.height = two.height;

      // Reorient the scene to the center of the new canvas dimensions
      two.scene.translation.set(two.width / 2, two.height / 2);

      // Update the background's width and height to adhere
      // to the bounds of the canvas.
      background.width = two.width;
      background.height = two.height;

    },
    render ({ time, deltaTime }) {
      // Rotate the rectangle
      rectangle.rotation += 2 * deltaTime;
      // Update two.js via the `render` method — *not* the `update` method.
      two.render();
    }
  };
};

canvasSketch(sketch, settings);
