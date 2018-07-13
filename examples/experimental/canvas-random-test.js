const canvasSketch = require('canvas-sketch'); // not yet released
const Random = require('./util/random');
const { lerp, expand2D, expand3D, inverseLerp } = require('./util/math');
const { mat4, vec2 } = require('gl-matrix');
const defined = require('defined');
const createPerspectiveCamera = require('perspective-camera');
const PD = require('probability-distributions');
const rough = require('roughjs');

// We can force a random seed or a specific string/number
// Random.setSeed(100);
// Random.setSeed(Random.getRandomSeed());

const settings = {
  // animate: true,
  // When exporting, use the seed as the suffix
  // This way we can reproduce it more easily later
  suffix: Random.getSeed(),
  dimensions: [ 1280, 1280 ]
  // dimensions: [ 7, 11 ],
  // pixelsPerInch: 300,
  // units: 'in'
};

const boundArray = array => {
  let max = -Infinity;
  let min = Infinity;
  array.forEach(i => {
    if (i > max) max = i;
    if (i < min) min = i;
  });
  if (!isFinite(max)) max = 0;
  if (!isFinite(min)) min = 0;
  return [ min, max ];
};

const distribute = array => {
  const [ min, max ] = boundArray(array);
  return array.map(i => {
    return min === max ? min : inverseLerp(min, max, i);
  });
};

const sketch = ({ context, width, height }) => {
  const ktx = createContextUtil(context);
  const roughCanvas = rough.canvas(context.canvas);
  const roughGenerator = roughCanvas.generator;

  // const count = 20000;
  // const points = Array.from(new Array(count)).map(() => {
  //   const r = Random.insideCircle();
  //   return vec2.add([], [ width / 2, height / 2 ], r);
  // });

  // const samples = PD.rlaplace(count, 1, 0.05);
  // const samples = PD.rnorm(count, 1, 0.05);
  // const samples = PD.rgamma(count, 2, 10)
  // const samples = PD.rbeta(count, 1000, 0.25);
  // const samples = PD.rbinom(count, 50, 0.65);
  
  // const points3D = (samples).map(t => {
  //   const scale = 1;
  //   const T = 1 + 0.1 * Random.gaussian();
  //   // // return expand3D([ s * Random.gaussianFast(), s * Random.gaussianFast() ]);
  //   // return expand3D(Random.onCircle(scale * t));
  //   // return expand3D([ Random.gaussian(), Random.gaussian() ]);
  //   return expand3D(Random.onCircle(scale * T));
  //   // return expand3D(Random.onLineSegment([ -1, -1, -1 ], [ 1, 1, 1 ]));
  // });

  const points = [];

  const stemAngles = [
    20,
    100,
    50
  ];
  
  const stems = stemAngles.map(angle => {
    const rotation = Random.gaussian(angle, 10) * Math.PI / 180;
    const size = [ Random.gaussian(30, 10), Random.gaussian(120, 20) ];
    const position = [ width / 2, height / 2 - width * 0.33 / 2 - Random.gaussian(0, 10) ];
    return {
      fill: true,
      position,
      size,
      rotation
    };
  });

  const camera = createPerspectiveCamera({
    fov: Math.PI / 4,
    near: 0.01,
    far: 100,
    viewport: [0, 0, width, height]
  });

  return ({ time }) => {
    ktx.update({ width, height });
    ktx.clear({ fill: 'white' });
    context.lineJoin = 'round';
    context.lineCap = 'round';

    const margin = width * 0.1;

    roughCanvas.rectangle(margin, margin, width - margin * 2, height - margin * 2, {
      fill: '#f4d9be',
      fillStyle: 'solid',
      stroke: '#f4d9be',
      strokeWidth: 20
    });

    roughCanvas.circle(width / 2, height / 2, width * 0.33, {
      fillStyle: 'solid',
      fill: '#ff911c',
      stroke: '#1975ff',
      strokeWidth: 1.5
    });

    stems.forEach(({ position, size, rotation, fill }) => {
      context.translate(position[0], position[1]);
      context.rotate(rotation);
      context.translate(-position[0], -position[1]);

      const params = fill ? {
        fillStyle: 'hachure',
        fill: '#1975ff',
        stroke: 'transparent',
        strokeWidth: 2
      } : {
        stroke: '#1975ff',
        strokeWidth: 1
      };
      roughCanvas.rectangle(position[0] - size[0] / 2, position[1] - size[1] / 2, size[0], size[1], params);
    });
    

    const r = 6;
    const angle = Math.PI / 2 + time * 0.25;
    const x = Math.cos(angle) * r;
    const z = Math.sin(angle) * r;
    camera.identity();
    camera.translate([ x, 0, z ]);
    camera.lookAt([ 0, 0, 0 ]);
    camera.update();

    // points3D.forEach(p => {
    //   ktx.circle({ position: camera.project(p), radius: 1 });
    // })
    // points.forEach(position => ktx.circle({ position, radius: 0.035 }));
  };
};

canvasSketch(sketch, settings);

function createContextUtil (context) {
  const projection = mat4.identity([]);
  const view = mat4.identity([]);
  const cameraMatrix = mat4.identity([]);
  let width = 1;
  let height = 1;

  return {
    update: (opt = {}) => {
      width = defined(opt.width, 1);
      height = defined(opt.height, 1);
      mat4.ortho(projection, 0, width, height, 0, -100, 100);
      mat4.invert(view, cameraMatrix);
    },
    clear: meshRenderer(opt => {
      context.clearRect(0, 0, width, height);
      if (opt.fill || opt.stroke) context.rect(0, 0, width, height);
    }),
    circle: meshRenderer(opt => {
      context.beginPath();
      const position = expand2D(opt.position);
      const radius = defined(opt.radius, 1);
      const startAngle = defined(opt.startAngle, 0);
      const endAngle = defined(opt.endAngle, Math.PI * 2);
      const counterclockwise = Boolean(opt.counterclockwise);
      context.arc(position[0], position[1], radius, startAngle, endAngle, counterclockwise);
    })
  };

  function meshRenderer (fn) {
    return (opt = {}) => {
      context.save();
      fn(opt);
      let stroke = opt.stroke;
      let fill = opt.fill;
      if (stroke == null && fill == null) {
        fill = 'black';
      }

      if (stroke) {
        context.lineWidth = defined(opt.lineWidth, 1);
        context.lineCap = opt.lineCap || 'butt';
        context.lineJoin = opt.lineJoint || 'miter';
        context.strokeStyle = stroke;
        context.stroke();
      }
      if (fill) {
        context.fillStyle = fill;
        context.fill();
      }
      context.restore();
    };
  }

  function mesh (fn, opt = {}) {
    
  }
}