const canvasSketch = require('canvas-sketch');
const Random = require('./util/random');
const { lerp, clamp, clamp01 } = require('./util/math');
const { vec2 } = require('gl-matrix');

const colors = {
  background: '#f4d9be',
  foreground: '#ff911c',
  pen: '#1975ff'
};

const settings = {
  // animate: true,
  // When exporting, use the seed as the suffix
  // This way we can reproduce it more easily later
  animate: true,
  dimensions: [ 9, 14 ],
  units: 'in',
  pixelsPerInch: 300
};

const sketch = ({ context, width, height }) => {
  const margin = -1;

  const pointCount = 500;
  const aspect = width / height;
  const points = Array.from(new Array(pointCount)).map((_, i) => {
    const t = pointCount <= 1 ? 0.5 : i / (pointCount - 1);
    const size = width * 0.45;
    const position = vec2.add([], [ width / 2, height / 2 ], Random.onSquare([ aspect * size, 1 * size ]));
    // const position = vec2.add([], [ width / 2, height / 2 ], Random.onCircle(2));
    // const position = [ lerp(margin, width - margin, t), height / 2 ];
    return {
      attractionRadius: Random.range(0, 1),
      attractionForce: Random.gaussian(0, 0.1),
      maxFriends: Random.rangeFloor(0, pointCount),
      friends: [],
      radius: 0.01 * Random.gaussian(1, 0.1),
      speed: Random.gaussian(0.0, 0.025),
      velocity: Random.onCircle(),
      history: [],
      lineWidth: Math.abs(0.01 * Random.gaussian(1, 0.25)),
      previous: position.slice(),
      newPointThrehold: Math.abs(Random.gaussian(0, 0.0001)),
      position
    };
  });

  points.forEach(point => {
    const other = Random.shuffle(points).filter(p => p !== point);
    point.friends = other.slice(0, point.maxFriends);
  });

  const step = () => {
    points.forEach(point => {
      const offset = Random.insideCircle(Random.gaussian(0, 0.1));
      vec2.add(point.position, point.position, offset);

      vec2.scaleAndAdd(point.position, point.position, point.velocity, point.speed);

      point.friends.forEach(friend => {
        const distance = vec2.distance(friend.position, point.position);
        if (distance <= point.attractionRadius) {
          const strength = 1 - clamp01(distance / point.attractionRadius);
          const force = vec2.sub([], friend.position, point.position);
          vec2.normalize(force, force);
          vec2.scaleAndAdd(point.velocity, point.velocity, force, point.attractionForce * strength);
        }
      });

      const maxVel = 2;
      point.velocity = point.velocity.map(n => clamp(n, -maxVel, maxVel));
      vec2.scale(point.velocity, point.velocity, 0.98);

      if (vec2.distance(point.position, point.previous) >= point.newPointThrehold) {
        point.history.push(point.position.slice());
        point.previous = point.position.slice();
      }
    });
  };

  const clearing = false;

  // Render the shapes
  return ({ time, frame }) => {
    if (frame === 0 || clearing) {
      context.fillStyle = 'white';
      context.fillRect(0, 0, width, height);
    }
    step();

    // context.fillStyle = 'white';
    // context.fillRect(0, 0, width, height);

    points.forEach(point => {
      point.history.forEach(history => {
        context.beginPath();
        context.arc(history[0], history[1], point.radius, 0, Math.PI * 2, false);
        context.fillStyle = 'black';
        context.fill();
      });
    });

    // points.forEach(point => {
    //   context.beginPath();
    //   point.history.forEach(p => context.lineTo(p[0], p[1]));
    //   context.lineWidth = point.lineWidth;
    //   context.globalAlpha = 0.5;
    //   context.stroke();
    //   // point.history.forEach(history => {
    //   //   context.beginPath();
    //   //   context.arc(history[0], history[1], point.radius, 0, Math.PI * 2, false);
    //   //   context.fillStyle = 'black';
    //   //   context.fill();
    //   // });
    // });
  };
};

canvasSketch(sketch, settings);
