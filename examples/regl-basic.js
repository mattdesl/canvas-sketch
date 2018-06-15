const canvasSketch = require('../');
const createRegl = require('regl');

const settings = {
  // Use a WebGL context instead of 2D canvas
  context: 'webgl',
  // Enable MSAA in WebGL
  attributes: {
    antialias: true
  }
};

canvasSketch(({ gl }) => {
  // Setup REGL with our canvas context
  const regl = createRegl({ gl });

  // Create your GL draw commands
  // ...

  // Return the renderer function
  return () => {
    // Update regl sizes
    regl.poll();

    // Clear back buffer with red
    regl.clear({
      color: [ 1, 0, 0, 1 ]
    });

    // Draw your meshes
    // ...
  };
}, settings);
