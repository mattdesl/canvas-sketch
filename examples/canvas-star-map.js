const canvasSketch = require('canvas-sketch');
const kdbush = require('kdbush').default;
const { linspace } = require('./util/math');
const Random = require('./util/random');
const Painter = require('./util/canvas-painter');
const Controls = require('./util/controls');

const settings = {
  parent: Controls.parent,
  units: 'in',
  dimensions: 'a4',
  scaleToView: true,
  pixelsPerInch: 300
};

const config = Controls({
  'Reset': Controls.button(() => Controls.reset()),
  test: Controls.Folder('Foo', {
    'Reset': Controls.button(() => Controls.reset()),
  }),
  seed: Controls.number(5, 0, 1, 0.5),
  radius: Controls.slider(0.5, 0, 0.4),
  count: Controls.slider(0.5)
});

const sketch = ({ context, width, height }) => {
  const paint = Painter(context);

  const points = [];

  addPoints(5);

  return ({ }) => {
    context.fillStyle = 'white';
    context.fillRect(0, 0, width, height);

    points.forEach(position => {
      const radius = config.radius;
      paint.circle({ position, radius });
    });
  };

  function addPoints (n) {
    for (let i = 0; i < n; i++) {
      const point = [ Random.range(0, width), Random.range(0, height) ];
      points.push(point);
    }
  }
};

canvasSketch(sketch, settings)
  .then(manager => {
    // re-run sketch on settings change
    config.controls.on('change', () => manager.loadAndRun(sketch, settings));
  });
