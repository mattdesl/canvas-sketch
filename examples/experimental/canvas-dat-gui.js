const canvasSketch = require('canvas-sketch');
const { linspace } = require('./util/math');
const GUI = require('./util/gui');

const paperSizes = Object.keys(canvasSketch.PaperSizes);

const canvas = document.createElement('canvas');

const canvasSketchOptions = {
  dimensions: GUI.option('a4', paperSizes),
  orientation: GUI.option('initial', [ 'initial', 'portrait', 'landscape' ]),
};

const { gui, params } = GUI({
  settings: {
    ...canvasSketchOptions
  },
  config: {
    // sketch stuff
    background: '#a690c5',
    count: GUI.number(25, { min: 0, max: 1000, step: 1 })
  }
});

const settings = {
  ...params.settings,
  styleCanvas: false,
  canvas
};

const canvasContainer = document.createElement('div');
const dat = document.querySelector('.dg.ac');
Object.assign(dat, {
  display: 'flex',
  'justify-content': 'space-between'
});
canvas.style.width = '100%';
dat.appendChild(canvasContainer);
canvasContainer.appendChild(canvas);

const sketch = ({ render, update }) => {
  const { config } = gui.on('change', () => update(params.settings)).params;

  return ({ context, width, height }) => {
    context.fillStyle = config.background;
    context.fillRect(0, 0, width, height);
  };
};

canvasSketch(sketch, settings);
