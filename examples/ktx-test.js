const canvasSketch = require('canvas-sketch'); // not yet released
const Random = require('./util/random');
const { lerp } = require('./util/math');
const { vec2 } = require('gl-matrix');
const createKtx = require('./util/ktx');

const settings = {
  dimensions: [ 8, 11 ],
  units: 'in',
  context: 'webgl',
  animation: false,
  attributes: {
    premultipliedAlpha: true,
    antialias: true // turn on MSAA
  }
};

const sketch = ({ gl, width, height }) => {
  const ktx = createKtx({ gl });

  const pointCount = 1000;
  const points = Array.from(new Array(pointCount)).map(() => {
    return vec2.add([], [ width / 2, height / 2 ], Random.insideBox([], width / 2));
  });

  const drawPoint = ktx.rect();

  return ({ gl, width, height, time }) => {
    ktx.update({ width, height });
    ktx.clear({ color: 'white', alpha: 1 });

    points.forEach(position => {
      drawPoint({
        position,
        pivot: [ 0.5, 0.5 ],
        scale: 0.25,
        alpha: 0.5
      });
    });

    gl.flush();
  };
};

canvasSketch(sketch, settings);