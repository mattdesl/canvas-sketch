const canvasSketch = require('canvas-sketch');

const settings = {
  gui: true,
  dimensions: 'a4'
};

const sketch = ({ render, update }) => {
  return ({ context, width, height }) => {
    context.fillStyle = 'gray';
    context.fillRect(0, 0, width, height);
  };
};

canvasSketch(sketch, settings);

/*
HUD

Settings:
- Dimensions
- Orientation
- 

*/

