const canvasSketch = require('canvas-sketch');

canvasSketch.preset('legal')
legal, tabloid, ledger, letter, a0, a1, a2, a3, a4, a5, a6, a7, a8,
business-card, envelope-9, envelope-10,

web-square, // 2048x2048


const settings = {
  ...canvasSketch.preset('letter'),
  
}

const settings = {
  ...canvasSketch.size('A4', 'cm')
};

const sketch = () => {
  return ({ context, width, height }) => {
    context.fillStyle = 'white';
    context.fillRect(0, 0, width, height);
  };
};

canvasSketch(sketch, settings);
