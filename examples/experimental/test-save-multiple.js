const sketcher = require('canvas-sketch');

const settings = {
  dimensions: [ 256, 256 ]
};

const sketch = ({ canvasWidth, canvasHeight }) => {
  // An off-screen canvas
  const otherCanvas = document.createElement('canvas');
  otherCanvas.width = canvasWidth;
  otherCanvas.height = canvasHeight;
  const otherContext = otherCanvas.getContext('2d');
  otherContext.fillStyle = 'pink';
  otherContext.fillRect(0, 0, canvasWidth, canvasHeight);

  return ({ context, width, height }) => {
    context.fillStyle = 'black';
    context.fillRect(0, 0, width, height);

    // Inset the square by 1 inch on the page
    const margin = 1;
    context.fillStyle = 'white';
    context.fillRect(margin, margin, width - margin * 2, height - margin * 2);

    // During export, we save the canvas, the off-screen canvas,
    // and some data files
    return [
      context.canvas,
      otherCanvas,
      { data: 'hello', extension: '.txt' },
      { data: JSON.stringify({ foo: 'bar' }), extension: '.json' }
    ];
  };
};

sketcher(sketch, settings);
