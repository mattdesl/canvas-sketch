const canvasSketch = require('canvas-sketch');
const { vec2, quat, mat4 } = require('gl-matrix');
const defined = require('defined');
const { cubicSpline } = require('./util/geom');
const Random = require('./util/random');
const { clamp, lerp, lerpArray, expand2D, linspace } = require('./util/math');
const simplify = require('simplify-path');
const hsl2rgb = require('float-hsl2rgb');
//73787, 720474, 822882, 40002, 708321
// Random.setSeed(Random.getRandomSeed());
Random.setSeed('708321');
console.log('Seed', Random.getSeed());

const settings = {
  dimensions: [ 1024, 1024 ],
  // exportPixelRatio: 2,
  animate: true,
  fps: 24,
  scaleToView: true,
  duration: 20,
  playbackRate: 'throttle'
};

const colors = {
  background: '#f4d9be',
  foreground: '#ff911c',
  pen: '#1975ff'
};

const sketch = ({ context, width, height, render }) => {
  const paint = (opt = {}) => {
    let fill = opt.fill;
    let stroke = opt.stroke;
    const defaultColor = 'black';
    const alpha = defined(opt.alpha, 1);

    // Default to fill-only
    if (opt.fill == null && opt.stroke == null) fill = true;

    if (fill) {
      const fillAlpha = defined(opt.fillAlpha, 1);
      context.fillStyle = typeof fill === 'boolean' ? defaultColor : fill;
      context.globalAlpha = alpha * fillAlpha;
      context.fill();
    }
    if (stroke) {
      const strokeAlpha = defined(opt.strokeAlpha, 1);
      context.strokeStyle = typeof stroke === 'boolean' ? defaultColor : stroke;
      context.lineWidth = defined(opt.lineWidth, 1);
      context.lineCap = opt.lineCap || 'butt';
      context.lineJoin = opt.lineJoin || 'miter';
      context.miterLimit = defined(opt.miterLimit, 10);
      context.globalAlpha = alpha * strokeAlpha;
      context.stroke();
    }
  };

  const circle = (opt = {}) => {
    context.beginPath();
    const radius = defined(opt.radius, 1);
    const position = expand2D(opt.position);
    context.arc(position[0], position[1], radius, 0, Math.PI * 2, false);
    paint(opt);
  };

  const segment = (x, y, length, angle, opt = {}) => {

  };

  const polyline = (path, opt = {}) => {
    context.beginPath();
    path.forEach(point => context.lineTo(point[0], point[1]));
    if (opt.closed) context.closePath();
    paint(opt);
  };

  const polylines = (lines, opt = {}) => {
    lines.forEach(path => {
      context.beginPath();
      path.forEach(point => context.lineTo(point[0], point[1]));
      if (opt.closed) context.closePath();
      paint(opt);
    });
  };


  // Wavy line across the page
  // const line = arcs01(100).map(t => {
  //   return [ t * 2 - 1, Random.noise1D(t * 5) * 0.25 ];
  // });

  // const startPoint = [ -0.5, -0.5 ];
  // const endPoint = [ 0.5, 0 ];
  // const points = arcs01(20).map(t => {
  //   return lerpArray(startPoint, endPoint, t);
  // });

  const freq = Random.range(0.5, 1.25);
  const twists = Random.range(150, 200);
  // const generate = (w) => {
  //   // Random.setSeed(Random.getRandomSeed());
  //   const amplitude = 0.75;
  //   return arcs01(50000).map(t => {
  //     const angle = Math.PI * 2 * twists * Math.pow(t, 2.5);
  //     const x = Math.cos(angle) * freq;
  //     const y = Math.sin(angle) * freq;
  //     return [
  //       amplitude * Random.noise4D(x, y, -1, w),
  //       amplitude * Random.noise4D(x, y, 1, w)
  //     ];
  //   });
  // };

  const torus = (a, c, u, v, out = []) => {
    out[0] = (c + a * Math.cos(v)) * Math.cos(u);
    out[1] = (c + a * Math.cos(v)) * Math.sin(u);
    out[2] = a * Math.sin(v);
    return out;
  };

  const generate = (theta) => {
    const amplitude = 0.7;
    const freq = 2.0;
    const resolution = 5000;
    const array = linspace(resolution, true).map(t => {
      // const angle = Math.PI * 2 * t;
      // let point = [ Math.cos(angle), Math.sin(angle) ];
      // vec2.scale(point, point, freq);
      // const [ x, y ] = point;
      // return [
      //   amplitude * Random.noise4D(x, y, theta, -1),
      //   amplitude * Random.noise4D(x, y, theta, 1)
      // ];
      const angle = Math.PI * 2 * t;
      let point = torus(0.25, 1.5, angle, theta * 5);
      vec2.scale(point, point, freq);
      const [ x, y, z ] = point;
      return [
        amplitude * Random.noise4D(x, y, z, -1),
        amplitude * Random.noise4D(x, y, z, 1)
      ];
    });

    const step = 0.15;
    const drawLength = Math.floor(resolution * step);
    const draw = theta * resolution * 1.2 - drawLength / 2 - drawLength * 0.15;
    const start = clamp(Math.floor(draw - drawLength / 2), 0, resolution);
    const end = clamp(Math.floor(draw + drawLength / 2), 0, resolution);
    return array.slice(start, end);
    // return array.slice(
    //   clamp(Math.floor(draw - drawLength / 2), 0, resolution), Math.floor(draw + drawLength / 2));
  };

  // const generate = () => {
  //   Random.setSeed(Random.getRandomSeed());
  //   const freq = Random.range(0.5, 1.25);
  //   const twists = Random.range(150, 200);
  //   const amplitude = 0.75;
  //   return arcs01(50000).map(t => {
  //     const angle = Math.PI * 2 * twists * Math.pow(t, 2.5);
  //     const x = Math.cos(angle) * freq;
  //     const y = Math.sin(angle) * freq;
  //     return [
  //       amplitude * Random.noise3D(x, y, -1),
  //       amplitude * Random.noise3D(x, y, 1)
  //     ];
  //   });
  // };

  // line = cubicSpline(line, 0.5, 1000, true);

  // const rings = 10;
  // const sides = 8;
  // const lines = arcs(rings).map(t => {
  //   const radius = t;
  //   return arcs(sides).map(a => {
  //     const angle = a * Math.PI * 2;
  //     return [ Math.cos(angle) * radius, Math.sin(angle) * radius ];
  //   });
  // });

  // const layerCount = 5;
  // const layers = Array.from(new Array(layerCount)).map((_, i) => {
  //   const t = layerCount <= 1 ? 0.0 : i / (layerCount - 1);

  // });

  // const edges = [];
  // for (let i = 0; i < line.length - 1; i++) {
  //   edges.push([ line[i], line[i + 1] ]);
  // }

  return ({ context, width, height, playhead }) => {
    context.fillStyle = 'hsl(0, 0%, 5%)';
    context.globalCompositeOperation = 'source-over';
    context.fillRect(0, 0, width, height);

    context.save();
    context.translate(width / 2, height / 2);
    const scale = width / 2;
    context.scale(scale, scale);

    context.lineJoin = 'round';
    context.lineCap = 'round';

    // polylines(lines, {
    //   stroke: 'black',
    //   closed: true,
    //   lineWidth: 8 / scale
    // });

    // edges.forEach(edge => {
    //   polyline(edge, {
    //     stroke: 'black',
    //     alpha: 0.05,
    //     lineWidth: 1.5 / scale
    //   });
    // });

    // polyline(line, {
    //   stroke: 'black',
    //   lineWidth: 1.5 / scale
    // });

    let line = generate(playhead);
    if (line.length > 2) {
      // line = simplify(line, 0.005).map(point => {
      //   return vec2.add([], point, Random.insideCircle(Random.gaussian(0, 0.1)));
      // });
      // line = cubicSpline(line, 0.5, 50, false);
      const h = lerp(0.0, 1, playhead);
      const s = 0.75;
      const l = 0.5;
      polyline(line, {
        // fill: 'black',
        // closed: true,
        stroke: `rgb(${hsl2rgb([ h, s, l ]).map(n => Math.floor(n * 255)).join(', ')})`,
        lineWidth: 6 / scale
      });
    }

    // line.forEach(position => {
    //   circle({ position, radius: 0.00 })
    // });

    context.restore();
    // line.forEach(position => circle({ position, radius: 0.0015 }));
    // points.forEach(position => circle({ position, radius: 0.005 }));
    // o.forEach(f => circle(f[0], f[1], 0.005));
  };
};

canvasSketch(sketch, settings);
