const canvasSketch = require('canvas-sketch');
const load = require('load-asset');

// Import Two.js - make sure to have greater than v0.7.0-alpha.1
// because previous versions don't support module loading or headless environments
const Two = require('two.js');

const settings = {
  dimensions: [ 2048, 2048 ],
  // Make the loop animated
  animate: true
};

const sketch = async ({ canvas }) => {
  // Create the instance of Two.js
  const two = new Two({ domElement: canvas });

  // Generate the image and wait for load to finish before
  // moving forward with rendering.
  const image = await load('assets/baboon.jpg');

  // Get the dimensions of the baboon image
  const imageWidth = image.width;
  const imageHeight = image.height;

  // How many strips will there be?
  const amount = 25;
  // The height of each strip we will create
  const stripHeight = Math.ceil(imageHeight / amount);

  for (let i = 0; i < amount; i++) {
    let pct = i / (amount - 1);
    let y = imageHeight * (pct - 0.5);
    // Create a rectangle strip that represents a slice of the image
    let sprite = new Two.Rectangle(0, y, imageWidth, stripHeight);

    // Set the fill of the strip to be a texture
    sprite.fill = new Two.Texture(image);
    // Make the texture repeat in the x direction
    sprite.fill.repeat = 'repeat-x';
    // Offset the image's y position so that when all strips line up
    // they roughly create the reference image in full
    sprite.fill.offset.y = imageHeight * ((1 - pct) - 0.5);
    // Set the stroke to be the fill ensuring that there isn't any
    // leftover white space between the strips
    sprite.stroke = sprite.fill;

    // Add the sprite to the scene
    two.add(sprite);
  }

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

      // Position scene to be at the center of the canvas
      two.scene.translation.set(two.width / 2, two.height / 2);

      // Scale the scene to fit the canvas
      two.scene.scale = two.width / imageWidth;
    },
    render ({ time }) {
      // Define the speed at which the offset smear occurs
      const speed = (1 + Math.sin(time * 5)) / 2;

      for (let i = 0; i < amount; i++) {
        const sprite = two.scene.children[i];
        // The normalized value of the strip's index
        const pct = i / amount;

        // Set the repeated image offset
        sprite.fill.offset.x += speed * Math.sin(pct * Math.PI * 3);
      }

      // Update two.js via the `render` method - *not* the `update` method.
      two.render();
    }
  };
};

canvasSketch(sketch, settings);
