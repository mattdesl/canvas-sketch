const canvasSketch = require('canvas-sketch');
const { GUI } = require('dat.gui');
const { linspace } = require('./util/math');
const { vec2 } = require('gl-matrix');
const Random = require('./util/random');
const Painter = require('./util/canvas-painter');
const kdbush = require('kdbush').default;

const gui = new GUI();

// attach the canvas to the dat gui so it's a bit off to the side
const parent = document.querySelector('.dg.ac');
Object.assign(parent.style, {
  display: 'flex',
  flexDirection: 'row-reverse',
  width: '100%',
  height: '100%'
});

const settings = {
  parent,
  // Setup the canvas for print artwork
  units: 'in',
  pixelsPerInch: 300,
  scaleToView: true,
  dimensions: [ 8, 8 ]
};

// UI Parameters
const config = {
  seed: 0,
  starCount: 300,
  mapSize: 2,
  starSizeMean: 0,
  starSizeDeviation: 0.1,
  background: '#ebb4b4',
  foreground: '#ffffff',
  nConstellations: 0.5,
  killDistance: 0,
  stepCount: 20,
  lineWidth: 0.01,
  minSearchDist: 0.1,
  searchRadius: 0.2
};

try {
  const data = JSON.parse(window.localStorage.getItem('data')) || {};
  Object.assign(config, data);
} catch (err) {
  throw err;
}

const sketch = ({ width, height, context, render }) => {
  let stars = [];
  let constellations = [];
  let index;

  const margin = 1; // in inches
  const painter = Painter(context);

  gui.addColor(config, 'background').onChange(render);
  gui.add(config, 'seed', 0, 10000, 1).onChange(recreate);
  gui.add(config, 'starCount', 0, 4000, 1).onChange(recreate);
  gui.add(config, 'mapSize', 0, 4, 0.001).onChange(recreate);
  gui.add(config, 'starSizeMean', 0, 0.1, 0.001).onChange(recreate);
  gui.add(config, 'starSizeDeviation', 0, 0.1, 0.001).onChange(recreate);
  gui.add(config, 'nConstellations', 0, 1, 0.001).onChange(recreate);
  gui.add(config, 'searchRadius', 0, 1, 0.001).onChange(recreate);
  gui.add(config, 'minSearchDist', 0, 1, 0.001).onChange(recreate);
  gui.add(config, 'lineWidth', 0, 1, 0.001).onChange(recreate);
  gui.add(config, 'stepCount', 0, 400, 1).onChange(recreate);
  gui.add(config, 'killDistance', 0, 1, 0.001).onChange(recreate);
  generate();

  return ({ context, width, height }) => {
    painter.clear({ width, height, fill: config.background });

    // draw foreground
    stars.forEach(({ position, radius }) => {
      painter.circle({ position, radius, fill: config.foreground });
    });

    constellations.forEach(path => painter.polyline(path, {
      stroke: config.foreground,
      lineJoin: 'round',
      lineWidth: config.lineWidth
    }));
  };

  function recreate () {
    window.localStorage.setItem('data', JSON.stringify(config));
    generate();
    render();
  }

  function generate () {
    Random.setSeed(config.seed);
    stars = Array.from(new Array(config.starCount)).map(() => {
      return {
        position: vec2.add([], Random.insideCircle(config.mapSize), [ width / 2, height / 2 ]),
        walked: false,
        radius: Math.abs(Random.gaussian(config.starSizeMean, config.starSizeDeviation))
      };
    });

    // spatial index of all stars
    index = kdbush(stars.map(p => p.position));

    const maxConstellations = Math.floor(stars.length * config.nConstellations);
    const targets = Random.shuffle(stars).slice(0, maxConstellations);

    // for each point, walk to others around it
    constellations = targets.map(initialStar => {
      const stepCount = config.stepCount;
      let maxSteps = stepCount + Math.trunc(Random.gaussian(0, 3));

      let currentStar = initialStar;
      const steps = [ currentStar ];

      const minDegree = 0;
      const maxDegree = 40;
      const minSearchDist = config.minSearchDist;
      const constellationSearchRadius = Math.max(0, config.searchRadius + Random.gaussian(0, 0.1));
      for (let i = 0; i < maxSteps; i++) {
        const searchRadius = Math.max(0, constellationSearchRadius + Random.gaussian(0, 0.001));
        // get a list of nearby stars
        let nearby = getNeighbours(currentStar, searchRadius);

        // filter out already-walked-on stars
        nearby = nearby.filter(s => s !== currentStar && !s.walked && !steps.includes(s));

        // filter out lines that are too sharp an angle
        const previous = steps.length > 1 ? steps[steps.length - 2] : null;
        if (previous) {
          nearby = nearby.filter(other => {
            const distance = vec2.distance(other.position, currentStar.position);
            if (distance < minSearchDist) return false;
            const angle = getLineJoinAngle(previous, currentStar, other);
            const degrees = Math.abs(angle) * 180 / Math.PI;
            return degrees >= minDegree && degrees <= maxDegree;
          });
        }

        // no nearby stars!
        if (nearby.length === 0) break;

        // choose a random one to walk toward
        const neighbour = Random.pick(nearby);

        // walk towards it
        steps.push(neighbour);

        // and make the newest star our new current
        currentStar = neighbour;
      }

      // If we've formed enough of a line to make a constellation
      const minSteps = 4;
      if (steps.length >= minSteps) {
        // Mark these as walked on so they don't become part of another constellation
        steps.forEach(s => {
          s.walked = true;

          // kill some neighbours as well
          const neighbours = getNeighbours(s, config.killDistance);
          neighbours.forEach(n => {
            n.walked = true;
          });
        });

        // Return the points of the polyline
        return steps.map(p => p.position);
      }

      // We didn't form a big enough polyline
      return false;
    }).filter(Boolean); // remove not-big-enough constellations
  }

  function getNeighbours (star, radius = 0.5) {
    const indices = index.within(star.position[0], star.position[1], radius);
    return indices.map(i => stars[i]);
  }

  // Given the line that forms three points, find the join angle
  function getLineJoinAngle (star1, star2, star3) {
    const p1 = star1.position;
    const p2 = star2.position;
    const p3 = star3.position;
    return Math.atan2(p3[1] - p1[1], p3[0] - p1[0]) - Math.atan2(p2[1] - p1[1], p2[0] - p1[0]);
  }
};

canvasSketch(sketch, settings);
