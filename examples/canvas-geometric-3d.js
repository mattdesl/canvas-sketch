const canvasSketch = require('canvas-sketch');
const convexHull = require('convex-hull');
const cameraProject = require('camera-project');
const createCamera = require('perspective-camera');
const { mat4, vec3 } = require('gl-matrix');
const BezierEasing = require('bezier-easing');

// A utility for random number generation
const Random = require('canvas-sketch-util/random');

// Sketch settings/export params
const settings = {
  duration: 8,
  animate: true,
  playbackRate: 'throttle',
  fps: 24,
  dimensions: [ 512, 512 ]
};

// A utility that creates a 3D "crystal" mesh
// The return value is { positions, cells }
const createMesh = () => {
  // Our crystal mesh is the convex hull of N random points on a sphere
  const pointCount = 10;
  const radius = 1;
  const positions = Array.from(new Array(pointCount)).map(() => {
    return Random.onSphere(radius);
  });

  // Now let's center the mesh by finding its "centroid"
  const centroid = positions.reduce((sum, pos) => {
    return vec3.add(sum, sum, pos);
  }, [ 0, 0, 0 ]);
  if (positions.length >= 1) {
    vec3.scale(centroid, centroid, 1 / positions.length);
  }

  // Translate all the points in the mesh away from centroid
  positions.forEach(pos => {
    vec3.sub(pos, pos, centroid);
  });

  // And now get the triangles (i.e. cells) of the 3D mesh
  const cells = convexHull(positions);
  return { cells, positions };
};

// A utility to stroke an array of 2D points
const stroke = (context, points) => {
  context.beginPath();
  points.forEach(p => context.lineTo(p[0], p[1]));
  context.lineWidth = 3;
  context.lineJoin = 'round';
  context.lineCap = 'round';
  context.strokeStyle = '#fff';
  context.stroke();
};

// A simple and fast way to draw a mesh of 2D positions and cells (triangles)
// This will lead to overlapping edges where two triangles meet
const drawCells = (context, positions, cells) => {
  cells.forEach(cell => {
    // A 'cell' holds indices into our positions array, so get 2D points
    const points = cell.map(i => positions[i]);

    // make sure to close the path before drawing the triangle
    points.push(points[0]);

    // stroke the path
    stroke(context, points);
  });
};

// One quick n' dirty way to fix the above issue of overlapping
// lines is to instead draw each line as a unique segment, like so:
const drawCellsNoOverlap = (context, positions, cells) => {
  const edgeMap = {};
  cells.forEach(cell => {
    // For each cell, get a pair of edges
    // Give the pair a 'key' name and ensure it is unique
    for (let i = 0; i < cell.length; i++) {
      const a = cell[i];
      const b = cell[(i + 1) % cell.length];
      const edge = [ a, b ].sort();
      const edgeKey = edge.join(':');
      if (!(edgeKey in edgeMap)) {
        edgeMap[edgeKey] = true;
      }
    }
  });

  // Get all unique keys and find positions from indices
  const keys = Object.keys(edgeMap);
  keys.forEach(pair => {
    const indices = pair.split(':');
    const points = indices.map(i => positions[i]);
    // Stroke the line segment A->B
    stroke(context, points);
  });
};

// Our actual artwork/sketch
const sketch = async ({ width, height }) => {
  // Force a fixed random seed
  Random.setSeed(1);

  // Setup a 3D perspective camera
  const camera = createCamera({
    fov: 80 * Math.PI / 180,
    near: 0.01,
    far: 1000,
    viewport: [ 0, 0, width, height ]
  });

  // Create our 3D mesh
  const { positions, cells } = createMesh();

  // Define some easing functions instead of just boring linear movement
  const easeA = new BezierEasing(0.14, 0.28, 0.48, 0.45);
  const easeB = new BezierEasing(0.14, 0.28, 0.67, 0.46);

  // Render function
  return ({ context, playhead, width, height }) => {
    // Background color
    context.fillStyle = '#e7b1b4';
    context.fillRect(0, 0, width, height);

    // Define a viewport for the camera & projection
    const viewport = [ 0, 0, width, height ];
    camera.viewport = viewport;

    // Make the camera swing back/forward a little
    const zOffset = Math.sin(playhead * Math.PI * -2) * 0.5;

    // Reset camera position, translate it outward, then look at world center
    camera.identity();
    camera.translate([ 0, 0, 3 + zOffset ]);
    camera.lookAt([ 0, 0, 0 ]);
    camera.update();

    // A 3D scene is made up of:
    // - 4x4 Projection Matrix (defines perspective)
    // - 4x4 View Matrix (inverse of camera transformation matrix)
    // - 4x4 Model Matrix (the mesh transformations like rotation, scale, etc)

    const projection = camera.projection;
    const view = camera.view;
    const model = mat4.identity([]);

    // Rotate the mesh in place
    mat4.rotateY(model, model, easeA(playhead) * Math.PI * 2);
    mat4.rotateX(model, model, easeB(playhead) * Math.PI * 2);

    // Get a combined (projection * view * model) matrix
    const combined = mat4.identity([]);
    mat4.multiply(combined, view, model);
    mat4.multiply(combined, projection, combined);

    // "Project" the 3D positions into 2D [ x, y ] points in pixel space
    const points = positions.map(position => {
      return cameraProject([], position, viewport, combined);
    });

    // Draw the mesh
    drawCellsNoOverlap(context, points, cells);
  };
};

canvasSketch(sketch, settings);
