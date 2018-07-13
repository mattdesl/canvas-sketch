const canvasSketch = require('canvas-sketch');
const GUI = require('./util/gui');
const { lerp } = require('./util/math');
const Painter = require('./util/canvas-painter');
const { vec2 } = require('gl-matrix');
const { Controls, parent, panel } = GUI({ width: 250 });
const Random = require('./util/Random');
const { grid } = require('./util/procedural');

const settings = {
  parent,
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

const controls = Controls({
  dimensionsSelect: Controls.Select([ 'a4', 'a5', 'a6', 'a7', 'a8', 'letter', 'legal', 'postcard' ], { label: 'dimensions', target: 'dimensions' }),
  orientationSelect: Controls.Select([ 'portrait', 'landscape' ], { label: 'orientation', target: 'orientation' }),
  background: Controls.Color('#fff'),
  foreground: Controls.Color('#000'),
  stroke: Controls.Checkbox(false),
  count: Controls.Slider(300, { range: [ 1, 1500 ], dp: 0 }),
  radius: Controls.Slider(0.5, { range: [ 0, 0.05 ], dp: 4 }),
  seed: Controls.Slider(100, { range: [ 1, 1500 ], dp: 0 }),
  genRadius: Controls.Slider(0.1, { range: [ 0, 2 ], dp: 2 }),
  lineWidth: Controls.Slider(3, { range: [ 0.1, 20 ] }),
  // lineCapSelect: Controls.Select([ 'round', 'butt', 'square' ], { label: 'lineCap', target: 'lineCap' })
});

const persist = () => {
  const data = Controls.save();
  window.localStorage.setItem('data', JSON.stringify(data));
};

const loadData = () => {
  try {
    const data = JSON.parse(window.localStorage.getItem('data'));
    Controls.load(data);
    panel.getGroups().forEach(group => {
      group.getComponents().forEach(component => {
        if (component._value) {
          component._value = component._obj[component._key];
          component._updateColor();
        }
      });
    });
  } catch (err) {
    throw err;
  }
};

loadData();
persist();
Controls.onChange(persist);

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
  Controls({
    export: exportFrame
  });

  let seed, count;
  const circles = [];
  const connections = [];

  const toPos = (position) => {
    // const border = 0.3;
    // const aspect = width / height;
    // return [
    //   lerp(-1 + border / aspect, 1 - border / aspect, position[0]),
    //   lerp(-1 + border, 1 - border, position[1])
    // ]
    // return position;
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
        radius: Math.abs(Random.gaussian()) * controls.genRadius,
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
    console.log('generate')
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
    update(controls);
    render();
  };

  change();
  Controls.onChange(change);

  return ({ context, width, height }) => {
    const size = controls.radius;
    const newSeed = controls.seed;
    const newCount =  Math.floor(controls.count);
    if (newSeed !== seed || newCount !== count) {
      generate(newSeed, newCount);
    }

    paint.clear({ width, height, fill: controls.background });

    context.save();

    const border = height * 0.1;
    let scale = Math.min(width, height) / 2;
    context.translate(width / 2, height / 2);
    context.scale(scale, scale);

    connections.forEach(connection => {
      paint.polyline(connection, {
        stroke: controls.foreground,
        lineCap: 'round',
        lineJoin: 'round',
        alpha: 0.9,
        lineWidth: controls.lineWidth / scale
      });
    });
    circles.forEach(({ position, radius, altRadius }) => {
      paint.circle({
        position: toPos(position),
        radius: altRadius * controls.radius,
        fill: controls.stroke ? false : controls.foreground,
        lineWidth: controls.lineWidth / scale,
        stroke: controls.stroke ? controls.foreground : false
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

// const canvasSketch = require('canvas-sketch');
// const GUI = require('./util/gui');
// const painter = require('./util/canvas-painter');

// const { Controls, parent } = GUI();

// const settings = {
//   parent,
//   animate: true,
//   dimensions: 'a4',
//   scaleToView: true,
//   // Output resolution, we can use 300PPI for print
//   pixelsPerInch: 300,
//   // all our dimensions and rendering units will use inches
//   units: 'in'
// };

// const sketch = ({ context, render }) => {
//   Controls.onChange(render);

//   const controls = Controls({
//     background: Controls.Color(),
//     foreground: Controls.Color(),
//     position: Controls.Pad(),
//     radius: Controls.Slider(0, { range: [ 0, 1 ] })
//   });

//   console.log(controls.position)

//   const paint = painter(context);
//   return ({ context, scale, width, frame }) => {
//     paint.clear({ fill: controls.background, width, height });
//     paint.circle({
//       fill: controls.foreground,
//       position: [ width / 2, height / 2 ],
//       radius: controls.radius
//     })
//   };
// };

// canvasSketch(sketch, settings);
// persist all values into localStorage
// on Cmd + S, user can save out the data as well
// on another computer they can drag + drop the JSON
// Cmd + Z undo UI changes
// Cmd + Shift + Z or Cmd + Y redos UI changes
// History is persisted across uses
// Entire history + UI state can be saved if desired



// 1D Slider
// Number Slider
// 2D Pad
// Checkbox
// Drop-down
// Filter box
// Rulers/guides for cm/m/px

