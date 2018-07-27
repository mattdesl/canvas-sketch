const canvasSketch = require('canvas-sketch');
const { vec2 } = require('gl-matrix');
const { grid } = require('./util/procedural');
const { lerp, lerpArray, lerpKeyframes, smoothstep } = require('./util/math');
const Painter = require('./util/canvas-painter');
const Random = require('./util/random');

const settings = {
  animate: true,
  duration: 3,
  dimensions: [ 512, 512 ],
  playbackRate: 'throttle',
  fps: 24
};

// Start the sketch
canvasSketch(({ context, width, height }) => {
  const painter = Painter(context);

  const count = 19;
  const radius = 1 / count;
  const points = grid({
    min: [ -1, -1 ],
    max: [ 1, 1 ],
    count
  }).map(({ position }) => {
    return {
      position,
      speed: 1,
      arcLength: 0.5,
      radius,
      color: 'black',
      isFill: Random.chance(0.75),
      direction: 1,
      arcStart: Math.PI / 2
    };
  });

  const rnd = Random.pick(points);
  const mid = Math.floor(count / 2);
  Object.assign(points[Math.floor(mid + mid * count)], {
    color: '#db2525',
    // arcLength: 1,
    radius: radius * 1,
    isFill: true
  });

  return ({ playhead }) => {
    painter.clear({ fill: 'white', width, height });
    points.forEach(({ color, isFill, radius, direction, arcStart, arcLength, speed, position }) => {
      const noiseFrequency = 0.35;
      const changeFrequency = 1 * speed;
      const input = [ position[0], position[1] ];
      const n = loopNoise(input[0] * noiseFrequency, input[1] * noiseFrequency, playhead, changeFrequency);
      const norm = n * 0.5 + 0.5;

      const edge = width * 0.2;
      const x = lerp(edge, width - edge, position[0] * 0.5 + 0.5);
      const y = lerp(edge, width - edge, position[1] * 0.5 + 0.5);

      const hue = lerpKeyframes([ 0.3, 0.85 ], norm);
      const sat = 0.65;
      const light = 0.0;
      // const color = `hsl(${Math.floor(hue * 360)}, ${Math.floor(sat * 100)}%, ${Math.floor(light * 100)}%)`;
      arcStart += playhead * Math.PI * 2 * direction;
      painter.circle({
        arcStart,
        arcEnd: arcStart + norm * arcLength * 2 * Math.PI,
        stroke: isFill ? false : color,
        fill: isFill ? color : false,
        position: [ x, y ],
        lineWidth: 2,
        radius: radius * width / 4
      });
    });
  };

  function loopNoise (x, y, t, scale = 1) {
    const duration = scale;
    const current = t * scale;
    return ((duration - current) * Random.noise3D(x, y, current) + current * Random.noise3D(x, y, current - duration)) / duration;
  }

  function shape ({ position, color, length, lineWidth, direction }) {
    const a = vec2.scaleAndAdd([], position, direction, -length);
    const b = vec2.scaleAndAdd([], position, direction, length);
    painter.polyline([ a, b ], { lineWidth, stroke: color });
  }
}, settings);
