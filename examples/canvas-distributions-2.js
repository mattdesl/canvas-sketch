const canvasSketch = require('canvas-sketch');
const Random = require('./util/random');
const { lerp, clamp, clamp01 } = require('./util/math');
const { cubicSpline, resampleLineBySpacing, getPolylinePerimeter } = require('./util/geom');
const { vec2 } = require('gl-matrix');
const polylineNormals = require('./util/polyline-util');
const defined = require('defined');

const colors = {
  background: '#f4d9be',
  foreground: '#ff911c',
  pen: '#1975ff'
};

const settings = {
  // animation: true,
  // When exporting, use the seed as the suffix
  // This way we can reproduce it more easily later
  animation: true,
  dimensions: [ 1280, 1280 ]
  // units: 'in',
  // pixelsPerInch: 300
};

const sketch = ({ context, width, height }) => {
  const margin = -1;

  const circle = (x, y, radius, steps = 8) => {
    const points = [];
    for (let i = 0; i < steps; i++) {
      const t = i / steps;
      const angle = Math.PI * 2 * t + Math.PI / 4;
      const px = x + Math.cos(angle) * radius;
      const py = y + Math.sin(angle) * radius;
      points.push([ px, py ]);
    }
    return points;
  };

  const rough = (path, opt = {}) => {
    const roughness = defined(opt.roughness, 1);
    const jitter = defined(opt.jitter, 1);
    const spacing = defined(opt.spacing, 0.1);
    const closed = opt.closed;
    const isSpline = opt.spline;
    const tension = defined(opt.tension, 0.5);
    const segments = defined(opt.segments, 25);
    const dist = opt.dist || ((...args) => Random.gaussian(...args));

    const perturbed = path.map(point => {
      const p = dist() * jitter;
      return vec2.scaleAndAdd([], point, Random.onCircle(), p);
    });
    const spline = isSpline ? cubicSpline(perturbed, tension, segments, closed) : perturbed;
    let points = resampleLineBySpacing(spline, spacing, closed);
    points = points.map(point => {
      const r = dist() * roughness;
      return vec2.scaleAndAdd([], point, Random.onCircle(), r);
    });
    return points;
  };

  const path = circle(width / 2, height / 2, width * 0.175, 8);
  const lineWidth = 3;
  const shapes = [ {
    spacing: 15,
    jitter: 7,
    roughness: 0.5,
    dist: () => Random.gaussian(),
    spline: true,
    segments: 100,
    tension: 0.5,
    closed: true
  }, {
    spacing: 15,
    jitter: 10,
    roughness: 0.75,
    dist: () => Random.gaussian(),
    spline: true,
    segments: 100,
    tension: 0.5,
    closed: true
  } ].map(opts => rough(path, opts));

  const backgroundShape = rough(circle(width / 2, height / 2, width * 0.575, 4), {
    spacing: 10,
    jitter: 10,
    roughness: 0.5,
    spline: true,
    segments: 100,
    tension: 0.025,
    closed: true
  });

  // Render the shapes
  return ({ time, frame }) => {
    context.fillStyle = 'white';
    context.lineJoin = 'round';
    context.fillRect(0, 0, width, height);

    context.beginPath();
    backgroundShape.forEach(point => {
      context.lineTo(point[0], point[1]);
    });
    context.closePath();
    context.strokeStyle = context.fillStyle = colors.background;
    context.fill();

    shapes.forEach((points, i) => {
      context.lineWidth = lineWidth;
      context.beginPath();
      points.forEach(point => {
        context.lineTo(point[0], point[1]);
      });
      context.closePath();
      const stroke = i > 0;
      context.strokeStyle = context.fillStyle = stroke ? colors.pen : colors.foreground;
      if (stroke) context.stroke();
      else context.fill();
    });
  };
};

canvasSketch(sketch, settings);
