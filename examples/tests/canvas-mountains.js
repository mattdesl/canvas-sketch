const canvasSketch = require('canvas-sketch');
const { vec2 } = require('gl-matrix');
const defined = require('defined');
const Random = require('./util/random');
const { lerpArray, expand2D } = require('./util/math');
const { cubicSpline } = require('./util/geom');

const settings = {
  dimensions: [ 1024, 1024 ],
  exportPixelRatio: 2
};

const sketch = ({ context, width, height, render }) => {
  const paint = (opt = {}) => {
    let fill = Boolean(opt.fill);
    let stroke = Boolean(opt.stroke);
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

  // Create a dense array of specified length
  const array = n => Array.from(new Array(n));

  // Get N uniformly distributed arclengths from 0 to 1 (exclusive)
  const arcs = n => array(n).map((_, i) => i / n);

  // Get N uniformly distributed arclengths, from 0 to 1 (inclusive)
  const arcs01 = n => array(n).map((_, i) => (
    n <= 1 ? 0 : i / (n - 1)
  ));

  // Wavy line across the page
  // const line = arcs01(100).map(t => {
  //   return [ t * 2 - 1, Random.noise1D(t * 5) * 0.25 ];
  // });

  // const startPoint = [ -0.5, -0.5 ];
  // const endPoint = [ 0.5, 0 ];
  // const points = arcs01(20).map(t => {
  //   return lerpArray(startPoint, endPoint, t);
  // });

  const generate = () => {
    Random.setSeed(Random.getRandomSeed());
    const freq = Random.range(0.5, 1.25);
    const twists = Random.range(150, 200);
    const amplitude = 0.75;
    return arcs01(50000).map(t => {
      const angle = Math.PI * 2 * twists * Math.pow(t, 2.5);
      const x = Math.cos(angle) * freq;
      const y = Math.sin(angle) * freq;
      return [
        amplitude * Random.noise3D(x, y, -1),
        amplitude * Random.noise3D(x, y, 1)
      ];
    });
  };

  let line = generate();

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

  return ({ context, width, height }) => {
    context.fillStyle = 'white';
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

    polyline(line, {
      stroke: 'black',
      lineWidth: 1 / scale
    });

    context.restore();
    // line.forEach(position => circle({ position, radius: 0.0015 }));
    // points.forEach(position => circle({ position, radius: 0.005 }));
    // o.forEach(f => circle(f[0], f[1], 0.005));
  };
};

canvasSketch(sketch, settings);
