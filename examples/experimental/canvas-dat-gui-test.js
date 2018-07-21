const Controls = require('./util/controls');
const Random = require('./util/random');
const { vec2 } = require('gl-matrix');
const { linspace } = require('./util/math');
const canvasSketch = require('canvas-sketch');
const painter = require('./util/canvas-painter');

// Things that re-update the sketch
const settings = Controls({
  orientation: Controls.Select('landscape', [ 'initial', 'portrait', 'landscape' ]),
  units: Controls.Select('in', [ 'in', 'px', 'cm', 'm' ]),
  dimensions: Controls.Select('a4', Object.keys(canvasSketch.PaperSizes)),
});

// Things that re-load the sketch
const config = Controls.Folder('Config', {
  count: Controls.Slider(100, { range: [ 0, 500 ], step: 1 })
});

// Things that re-render the sketch
const state = Controls.Folder('State', {
  background: '#ff0000',
  alpha: Controls.Slider(1)
});

// The generative artwork
const sketch = ({ context, width, height }) => {
  const paint = painter(context);
  let points = linspace(config.count).map(() => {
    const radius = width / 4;
    return vec2.add([], [ width / 2, height / 2 ], Random.insideCircle(radius));
  });
  return () => {
    paint.clear({ width, height, fill: state.background, alpha: state.alpha });

    points.forEach(position => {
      paint.circle({ position, fill: 'black', radius: 0.1 });
    });
  };
};

// Start sketch & wire up settings
canvasSketch(sketch, settings)
  .then(manager => {
    // UI Params that re-load the whole sketch function
    config.controls.on('change', () => manager.loadAndRun(sketch, settings));
    // UI Params that re-render sketch
    state.controls.on('change', () => manager.render());
    // UI Params that re-load sketch with new settings override
    settings.controls.on('change', () => manager.loadAndRun(sketch, settings));
    // UI Params that only update sketch properties (e.g. dimensions)
    // settings.controls.on('change', () => manager.update(settings));
  });
