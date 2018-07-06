/**
 * A Canvas2D example of async loading and image processing.
 * @author Matt DesLauriers (@mattdesl)
 */

const canvasSketch = require('canvas-sketch');
const load = require('load-asset');

canvasSketch(async ({ update }) => {
  const image = await load('assets/baboon.jpg');

  // Update our sketch with new settings
  update({
    dimensions: [ image.width, image.height ]
  });

  // Render our sketch
  return ({ context, width, height }) => {
    // Render to canvas
    context.drawImage(image, 0, 0, width, height);

    // Extract bitmap pixel data
    const pixels = context.getImageData(0, 0, width, height);

    // Manipulate pixels
    const data = pixels.data;
    let len = width;
    while (len) {
      const newX = Math.floor(Math.random() * len--);
      const oldX = len;

      // Sometimes leave row in tact
      if (Math.random() > 0.85) continue;

      for (let y = 0; y < height; y++) {
        // Sometimes leave column in tact
        if (Math.random() > 0.925) continue;

        // Copy new random column into old column
        const newIndex = newX + y * width;
        const oldIndex = oldX + y * width;

        // Make 'grayscale' by just copying blue channel
        data[oldIndex * 4 + 0] = data[newIndex * 4 + 2];
        data[oldIndex * 4 + 1] = data[newIndex * 4 + 2];
        data[oldIndex * 4 + 2] = data[newIndex * 4 + 2];
      }
    }

    // Put new pixels back into canvas
    context.putImageData(pixels, 0, 0);
  };
});
