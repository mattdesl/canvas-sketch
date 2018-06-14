const sketcher = require('../');

const settings = {
  // Output resolution, we can use 300PPI for print
  pixelsPerInch: 300,
  // US Letter size 8.5x11 inches
  dimensions: [ 8.5, 11 ],
  // all our dimensions and rendering units will use inches
  units: 'in'
};

const sketch = () => {
  return ({ context, width, height }) => {
    // Fill page with solid color
    // The 'width' and 'height' will be in inches here
    context.fillStyle = 'black';
    context.fillRect(0, 0, width, height);

    // Inset the square by 1 inch on the page
    const margin = 1;
    context.fillStyle = 'white';
    context.fillRect(margin, margin, width - margin * 2, height - margin * 2);
  };
};

sketcher(sketch, settings);
