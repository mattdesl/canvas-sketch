const canvasSketch = require('canvas-sketch');
const GUI = require('./util/gui');
const Painter = require('./util/canvas-painter');
const { vec2 } = require('gl-matrix');
const { Controls, parent, panel } = GUI({ width: 250 });

const settings = {
  parent,
  pixelsPerInch: 300,
  dimensions: 'a4',
  scaleToView: true,
};

// It seems like Math.random() is causing trouble
// with paint worklets ... let's use a seeded one instead
const createRandom = (seed) => {
  // From:
  // https://gist.github.com/blixt/f17b47c62508be59987b
  let _seed = seed % 2147483647;
  if (_seed <= 0) _seed += 2147483646;
  const next = () => {
    _seed = _seed * 16807 % 2147483647;
    return _seed;
  };
  const value = () => {
    return (next() - 1) / 2147483646;
  };
  const gaussian = () => {
    return Math.sqrt(-2.0 * Math.log(value())) * Math.cos(2.0 * Math.PI * value())
  };
  return {
    value,
    gaussian
  };
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
  count: Controls.Slider(300, { range: [ 1, 500 ], dp: 0 }),
  radius: Controls.Slider(0.5),
  seed: Controls.Slider(100, { range: [ 1, 500 ], dp: 0 }),
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

// loadData();
persist();
Controls.onChange(persist);

const pointsOnCircles = (a, b) => {
  const circleADir = vec2.sub([], b.position, a.position);
  vec2.normalize(circleADir, circleADir);
  const newA = vec2.scaleAndAdd([], a.position, circleADir, a.radius);
  const circleBDir = vec2.sub([], a.position, b.position);
  vec2.normalize(circleBDir, circleBDir);
  const newB = vec2.scaleAndAdd([], b.position, circleBDir, b.radius);
  return [ newA, newB ];
};

const sketch = ({ render, update, context, exportFrame }) => {
  Controls({
    export: exportFrame
  });

  let seed, random, count;
  const circles = [];
  const connections = [];

  const pack = () => {
    const darts = 500;
    const newCircles = [];
    const padding = 0.005;
    // throw N darts on board
    for (let i = 0; i < darts; i++) {
      newCircles.push({
        radius: Math.abs(random.gaussian()) * 0.1,
        position: [ random.value(), random.value() ],
        collisions: 0
      });
    }
    // collide each dart with all other circles
    newCircles.forEach(circle => {
      circles.forEach(other => {
        const collides = circleCollides(circle, other, padding);
        if (collides) circle.collisions++;
      });
    });
    // find best fit
    newCircles.sort((a, b) => a.collisions - b.collisions)

    circles.push(newCircles[0]);
  };

  const generate = (newSeed = 0, newCount = 100) => {
    seed = newSeed;
    count = newCount;
    random = createRandom(seed);
    circles.length = 0;
    for (let i = 0; i < count; i++) {
      pack();
    }
    connections.length = 0;
    circles.forEach(circle => {
      const maxNearest = 3;
      const maxDist = 0.05;

      for (let i = 0, c = 0; c < maxNearest && i < circles.length; i++) {
        const other = circles[i];
        if (other === circle) continue;
        const dist = vec2.distance(other.position, circle.position);
        if (dist < maxDist) {
          connections.push(pointsOnCircles(circle, other));
          c++;
        }
      }
    });
  };

  generate();
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
    const newCount = Math.floor(controls.count);
    if (newSeed !== seed || newCount !== count) {
      generate(newSeed, newCount);
    }

    paint.clear({ width, height, fill: controls.background });

    context.save();

    const scale = Math.max(width, height);
    context.scale(scale, scale);

    circles.forEach(({ position, radius }) => {
      paint.circle({ 
        position,
        radius: radius * size,
        fill: controls.stroke ? false : controls.foreground,
        lineWidth: controls.lineWidth / scale,
        stroke: controls.stroke ? controls.foreground : false
      });
    });

    paint.polylines(connections, {
      stroke: controls.foreground,
      lineWidth: controls.lineWidth / scale
    });
    context.restore();

    return [ context.canvas, { extension: '.json', data: JSON.stringify(Controls.save(), null, 2) } ];
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
//   return ({ context, width, height, frame }) => {
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
