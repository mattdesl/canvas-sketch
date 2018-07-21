const Controls = require('./util/controls');
const Random = require('./util/random');
const { vec2 } = require('gl-matrix');
const { linspace } = require('./util/math');
const { intersectLineSegmentLineSegment } = require('./util/geom');
const canvasSketch = require('canvas-sketch');
const painter = require('./util/canvas-painter');
const kdbush = require('kdbush').default;
const simplify = require('simplify-path');
// Three ways to update:
// - Re-run artwork to build new generative sketch
// 

const settings = {
  parent: Controls.parent,
  orientation: 'portrait',
  units: 'in',
  dimensions: 'a4'
};

// The generative artwork
const sketch = ({ context, width, height, render }) => {
  const generate = () => {
    makeShapes({ width, height });
    render();
  };

  // per-render controls, updated on the fly
  const state = Controls.Folder('State', {
    background: '#ff0000',
    foreground: 'white',
    circleRadius: Controls.Slider(0.1, { range: [ 0, 0.1 ], step: 0.01 }),
    lineWidth: Controls.Slider(0.1, { range: [ 0, 0.1 ], step: 0.01 })
  }, render);

  // generative controls, force re-build of artwork
  const config = Controls.Folder('Config', {
    seed: 0,
    radius: Controls.Slider(0.5),
    stepCount: Controls.Slider(3, { range: [ 0, 50 ], step: 1 }),
    minSteps: Controls.Slider(3, { range: [ 0, 50 ], step: 1 }),
    killSize: Controls.Slider(0.25),
    simplify: Controls.Slider(0.25),
    count: Controls.Slider(100, { range: [ 0, 4500 ], step: 1 }),
    skipChance: Controls.Slider(0.5),
    radiusMean: Controls.Slider(0.5, { range: [ 0, 5 ] }),
    radiusDeviation: Controls.Slider(0.5, { range: [ 0, 1 ] }),
  }, generate);

  const paint = painter(context);
  let points = [];
  let lines = [];
  let edges = [];

  // seed initially
  generate();

  return {
    render () {
      paint.clear({
        width,
        height,
        fill: state.background
      });

      points.forEach(position => {
        paint.circle({ position, fill: state.foreground, radius: state.circleRadius });
      });

      lines.forEach(line => {
        paint.polyline(line, {
          stroke: state.foreground,
          lineWidth: state.lineWidth
        });
      });
    }
  };

  function walk (index, point, previous, ignorePoints) {
    // find a few points nearby
    const radius = Random.gaussian(config.radiusMean, config.radiusDeviation);
    const indices = index.within(point[0], point[1], radius);

    // map indices to positions
    let positions = indices.map(i => points[i]);

    // filter out this point
    positions = positions.filter(p => p !== point && !ignorePoints.includes(p));

    if (positions.length === 0) return;

    // get lines to all neighbour points, and let's count collisions
    const newLines = positions.map(p => {
      const line = [ point, p ];

      let collisions = edges.reduce((sum, otherLine) => {
        const result = intersectLineSegmentLineSegment(
          line[0],
          line[1],
          otherLine[0],
          otherLine[1]
        );
        const inc = result ? 1 : 0;
        return sum + inc;
      }, 0);
      return {
        angle: previous ? Math.abs(getLineJoinAngle(previous, point, p)) : 0,
        target: p,
        collisions,
        line
      };
    }).filter(p => p.collisions < 1);

    // if (newLines.length === 0) return null;
    // return Random.pick(newLines).target;
    newLines.sort((a, b) => {
      return (b.collisions - a.collisions);
    });
    if (newLines.length > 0 && newLines[0].collisions <= 0) return newLines[0].target;
    return null;
  }

  // Given the line that forms three points, find the join angle
  function getLineJoinAngle (p1, p2, p3) {
    return Math.atan2(p3[1] - p1[1], p3[0] - p1[0]) - Math.atan2(p2[1] - p1[1], p2[0] - p1[0]);
  }

  function makeShapes (props) {
    Random.setSeed(config.seed);
    const count = config.count;
    points = Array.from(new Array(count)).map(() => {
      const center = [ width / 2, height / 2 ];
      const radius = width * config.radius;
      return vec2.add([], center, Random.insideCircle(radius));
    });

    const index = kdbush(points);

    lines.length = 0;
    edges.length = 0;
    const ignorePoints = [];
    points.forEach(point => {
      // skip some targets entirely
      if (Random.chance(config.skipChance)) return;

      const stepCount = config.stepCount;
      let curPoint = point;
      let steps = [ curPoint ];
      for (let i = 0; i < stepCount; i++) {
        const previous = steps.length > 1 ? steps[i - 1] : null;
        const next = walk(index, curPoint, previous, ignorePoints);
        if (!next) break;
        curPoint = next;
        steps.push(next);
      }

      if (steps.length > config.minSteps) {
        steps = simplify(steps, config.simplify);
        steps.forEach((s, i) => {
          if (i < steps.length - 1) {
            edges.push([ s, steps[i + 1] ]);
          }
          ignorePoints.push(s);
          const radius = config.killSize * Random.gaussian(config.radiusMean, config.radiusDeviation);
          let others = index.within(s[0], s[1], radius).map(i => points[i]);
          others.forEach(other => {
            if (!ignorePoints.includes(other)) ignorePoints.push(other);
          });
        });
        lines.push(steps);
      }
    });
  }
};

canvasSketch(sketch, settings);
