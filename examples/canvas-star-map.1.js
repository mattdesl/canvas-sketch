const canvasSketch = require('canvas-sketch');
const GUI = require('./util/controls');
const { lerp } = require('./util/math');
const Painter = require('./util/canvas-painter');
const { vec2 } = require('gl-matrix');
const Random = require('./util/Random');
const { grid } = require('./util/procedural');

const settings = {
  parent: GUI.parent,
  pixelsPerInch: 300,
  dimensions: 'postcard',
  scaleToView: true
};

const circleCollides = (a, b, padding = 0) => {
  const radii = a.radius + b.radius + padding;
  const radiiSq = (radii * radii);
  const x = b.position[0] - a.position[0];
  const y = b.position[1] - a.position[1];
  const distSq = x * x + y * y;
  return distSq <= radiiSq;
};

// ---- Sketch / Artwork Code

const config = GUI({
  background: 'white',
  foreground: 'black',
  stroke: false,
  count: GUI.Slider(300, { range: [ 1, 1500 ], step: 1 }),
  radius: GUI.Slider(0.5, { range: [ 0, 0.05 ], step: 0.001 }),
  seed: GUI.Slider(100, { range: [ 1, 1500 ], step: 1 }),
  genRadius: GUI.Slider(0.1, { range: [ 0, 2 ], step: 0.001 }),
  lineWidth: GUI.Slider(3, { range: [ 0.1, 20 ], step: 0.001 }),
  // lineCapSelect: GUI.Select('butt', [ 'round', 'butt', 'square' ])
});

const inCircle = (point, circle) => {
  const distSq = circle.radius * circle.radius;
  return vec2.squaredDistance(point, circle.position) <= distSq;
};

const pointsOnCircles = (a, b, padding = 0.0005) => {
  const circleADir = vec2.sub([], b.position, a.position);
  vec2.normalize(circleADir, circleADir);
  const r1 = a.radius + Random.gaussian(0, 0.005);
  const r2 = b.radius + Random.gaussian(0, 0.005);
  const newA = vec2.scaleAndAdd([], a.position, circleADir, r1 + padding);
  const circleBDir = vec2.sub([], a.position, b.position);
  vec2.normalize(circleBDir, circleBDir);
  const newB = vec2.scaleAndAdd([], b.position, circleBDir, r2 + padding);
  return [ newA, newB ];
};

const sketch = ({ render, update, context, exportFrame, width, height }) => {
  let seed, count;
  const circles = [];
  const connections = [];

  const toPos = (position) => {
    return [
      (position[0] * 2 - 1),
      (position[1] * 2 - 1)
    ];
  };

  const pack = () => {
    const darts = 600;
    const newCircles = [];
    // const padding = 0.005;
    // throw N darts on board
    for (let i = 0; i < darts; i++) {
      const position = Random.insideSquare([ 1, 1 / (width / height) ]);
      const border = 1 - 0.2;
      position[0] *= border;
      position[1] *= border;
      position[0] = position[0] * 0.5 + 0.5;
      position[1] = position[1] * 0.5 + 0.5;
      
      newCircles.push({
        radius: Math.abs(Random.gaussian()) * config.genRadius,
        position,
        // position: [ Random.value(), Random.value() ],
        collisions: 0,
        altRadius: 1 + Math.abs(Random.gaussian()) * 0.25
      });
    }
    // collide each dart with all other circles
    const padding = Random.gaussian(0, 0.01);
    newCircles.forEach(circle => {

      circles.forEach(other => {
        const collides = circleCollides(circle, other, padding);
        if (collides) {
          circle.collisions++;
        }
      });
    });
    // find best fit
    newCircles.sort((a, b) => a.collisions - b.collisions)

    circles.push(newCircles[0]);
  };

  const generate = (newSeed = 0, newCount = 100) => {
    seed = newSeed;
    count = newCount;
    Random.setSeed(newSeed);
    circles.length = 0;
    for (let i = 0; i < count; i++) {
      pack();
    }
    connections.length = 0;
    circles.forEach(circle => {
      const maxNearest = 20;
      const maxDist = Math.abs(Random.range(0.025, 0.05)) * (1 + 0.1 * Math.abs(Random.gaussian())) * 1.0;
      const maxDistSq = maxDist * maxDist;
      const padding = Random.gaussian(0, 0.01);
      for (let i = 0, c = 0; c < maxNearest && i < circles.length; i++) {
        const other = circles[i];
        if (other === circle) continue;
        const distSq = vec2.squaredDistance(other.position, circle.position);
        if (distSq < maxDistSq && !circleCollides(circle, other, padding)) {
          const line = pointsOnCircles(circle, other);
          if (line) {
            connections.push(line.map(position => toPos(position)));
            c++;
          }
        }
      }
    });
  };

  const paint = Painter(context);

  const change = () => {
    update(config);
    render();
  };

  change();
  config.controls.on('change', change);

  return ({ context, width, height }) => {
    const size = config.radius;
    const newSeed = config.seed;
    const newCount = Math.floor(config.count);
    if (newSeed !== seed || newCount !== count) {
      generate(newSeed, newCount);
    }

    paint.clear({ width, height, fill: config.background });

    context.save();

    const border = height * 0.1;
    let scale = Math.min(width, height) / 2;
    context.translate(width / 2, height / 2);
    context.scale(scale, scale);

    connections.forEach(connection => {
      paint.polyline(connection, {
        stroke: config.foreground,
        lineCap: 'round',
        lineJoin: 'round',
        alpha: 0.9,
        lineWidth: config.lineWidth / scale
      });
    });
    circles.forEach(({ position, radius, altRadius }) => {
      paint.circle({
        position: toPos(position),
        radius: altRadius * config.radius,
        fill: config.stroke ? false : config.foreground,
        lineWidth: config.lineWidth / scale,
        stroke: config.stroke ? config.foreground : false
      });
    });

    context.restore();

    return [
      context.canvas,
      // { extension: '.json', data: JSON.stringify(Controls.save(), null, 2) }
    ];
  };
};

canvasSketch(sketch, settings);
