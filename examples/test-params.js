const canvasSketch = require('canvas-sketch');
const createCamera = require('perspective-camera');
const createIcosphere = require('icosphere');

const settings = {
  dimensions: [ 1280, 2048 ],
  animate: true,
  params: {
    background: 'black',
    foreground: 'white',
    lineWidth: 5,
    resolution: { value: 0, min: 0, max: 2, step: 1 },
    distance: { value: 5, min: 2, max: 10, step: 0.01 }
  }
};

// Cleaner logging during hot loading
console.clear();

const sketch = () => {
  return ({ context, time, width, height, params }) => {
    // Camera & mesh setup
    const camera = createCamera();
    const mesh = createIcosphere(params.resolution);

    // Setup camera properties
    camera.fov = 45 * Math.PI / 180;
    camera.near = 0.01;
    camera.far = 100;

    // rotate our camera around the center
    const orbit = params.distance;
    const angle = time * 0.25;
    const x = Math.cos(angle) * orbit;
    const z = Math.sin(angle) * orbit;
    camera.identity();
    camera.translate([x, 0, z]);
    camera.lookAt([0, 0, 0]);
    camera.viewport = [ 0, 0, width, height ];
    camera.update();

    // Fill background
    context.fillStyle = params.background;
    context.fillRect(0, 0, width, height);

    // project the 3D points into 2D screen-space
    const positions = mesh.positions.map(point => camera.project(point));

    mesh.cells.forEach(cell => {
      context.beginPath();
      const path = cell.map(i => positions[i]);
      path.forEach(([ x, y ]) => context.lineTo(x, y));
      context.closePath();
      context.strokeStyle = params.foreground;
      context.lineWidth = params.lineWidth;
      context.lineJoin = 'round';
      context.lineCap = 'round';
      context.stroke();
    });
  };
};

canvasSketch(sketch, settings);
