/**
 * A Canvas2D example of pixel-perfect RGBA manipualation.
 * @author Matt DesLauriers (@mattdesl)
 */

const sketcher = require('canvas-sketch');

const settings = {
  // Disable canvas smoothing
  pixelated: true,
  // A 128x128px output image
  dimensions: [ 128, 128 ]
};

const sketch = () => {
  return ({ context, width, height }) => {
    // Clear canvas
    context.clearRect(0, 0, width, height);

    // Pure RGBA pixel manipulation
    const image = context.getImageData(0, 0, width, height);
    const pixels = image.data;
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const i = x + y * width;

        // Stepped gradient
        const steps = 7;
        const xWhole = (x / width) * steps;
        const xInt = Math.floor(xWhole);
        const px = xInt / steps;

        // Red to white gradient
        const L = Math.floor(px * 255);
        pixels[i * 4 + 0] = 255;
        pixels[i * 4 + 1] = L;
        pixels[i * 4 + 2] = L;
        pixels[i * 4 + 3] = 255;
      }
    }

    // Apply manipulation
    context.putImageData(image, 0, 0);
  };
};

sketcher(sketch, settings);
