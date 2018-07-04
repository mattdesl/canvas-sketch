/**
 * A WebGL example of a dithered noise blob/sphere, using Regl.
 * @author Matt DesLauriers (@mattdesl)
 */

const canvasSketch = require('canvas-sketch');

// Import geometry & utilities
const createRegl = require('regl');
const createPrimitive = require('primitive-icosphere');
const createCamera = require('perspective-camera');
const glslify = require('glslify');
const hexRgb = require('hex-rgb');

// Utility to convert hex string to [ r, g, b] floats
const hexToRGB = hex => {
  const rgba = hexRgb(hex, { format: 'array' });
  return rgba.slice(0, 3).map(n => n / 255);
};

const settings = {
  // Output size
  dimensions: [ 256, 256 ],

  // Setup render loop
  animate: true,
  duration: 7,
  fps: 24,

  // Ensure we set up a canvas with WebGL context, not 2D
  context: 'webgl',

  // We can pass down some properties to the WebGL context...
  attributes: {
    antialias: true // turn on MSAA
  }
};

const sketch = ({ gl, canvasWidth, canvasHeight }) => {
  // Background & foreground colors
  const color = '#f2bac4';
  const foregroundRGB = hexToRGB(color);
  const backgroundRGBA = [ ...foregroundRGB, 1.0 ];

  // Setup REGL with our canvas context
  const regl = createRegl({ gl });

  // Create a simple sphere mesh
  const sphere = createPrimitive(1, { subdivisions: 5 });

  // Create a perspective camera
  const camera = createCamera({
    fov: 45 * Math.PI / 180
  });

  // Place our camera
  camera.translate([ 0, 0, 6 ]);
  camera.lookAt([ 0, 0, 0 ]);
  camera.update();

  // Build a draw command for the mesh
  const drawMesh = regl({
    // Fragment & Vertex shaders
    frag: glslify(`
      precision highp float;
      uniform vec3 color;
      uniform float time;
      uniform vec2 resolution;
      varying vec3 vNormal;
      varying vec3 vPosition;
      varying vec2 screenUV;

      #pragma glslify: dither = require('glsl-dither/8x8');

      void main () {
        // Spin light around a bit
        float angle = sin(time * 0.25) * 2.0 + 3.14 * 0.5;
        vec3 lightPosition = vec3(cos(angle), sin(time * 1.0), sin(angle));
        vec3 L = normalize(lightPosition);
        vec3 N = normalize(vNormal);

        // Get diffuse contribution
        float diffuse = max(0.0, dot(N, L));
        diffuse = smoothstep(0.0, 1.25, diffuse);
        diffuse = pow(diffuse, 0.25);
        diffuse *= max(0.0, 1.0 - distance(vPosition, lightPosition) / 2.0) * 1.0;
        diffuse += pow(vNormal.z, 0.95) * 0.05;
        diffuse = clamp(diffuse, 0.0, 1.0);

        float ditherSize = 256.0;
        diffuse = dither(gl_FragCoord.xy / resolution.xy * ditherSize, diffuse);
        
        gl_FragColor = vec4(color * diffuse, 1.0);
      }
    `),
    vert: glslify(`
      precision highp float;
      attribute vec3 position;
      uniform mat4 projectionMatrix;
      uniform mat4 modelViewMatrix;
      uniform float time;
      varying vec3 vPosition;
      varying vec3 vNormal;
      varying vec2 screenUV;

      #pragma glslify: noise = require('glsl-noise/classic/4d');

      void main () {
        // Get initial normal
        vNormal = normalize(position);

        // Contribute noise
        vec3 pos = position;
        pos += vNormal * pow(noise(vec4(position.xyz * 1.0, time * 0.25)), 0.75) * 1.0;
        pos += vNormal * pow(noise(vec4(position.xyz * 0.75, time * 0.25)), 0.75) * 0.5;
        pos += vNormal * pow(noise(vec4(position.xyz * 40.0, time * 0.5)), 0.1) * 0.3;
        pos *= 0.75;

        // Update normal
        vNormal = normalize(pos);
        vPosition = pos;

        // Final position
        gl_Position = projectionMatrix * modelViewMatrix * vec4(pos.xyz, 1.0);
        screenUV = gl_Position.xy;
      }
    `),
    uniforms: {
      projectionMatrix: regl.prop('projectionMatrix'),
      modelViewMatrix: regl.prop('modelViewMatrix'),
      color: foregroundRGB,
      resolution: [ canvasWidth, canvasHeight ],
      time: regl.prop('time')
    },
    attributes: {
      position: regl.buffer(sphere.positions),
      normal: regl.buffer(sphere.normals)
    },
    elements: regl.elements(sphere.cells)
  });

  return ({ viewportWidth, viewportHeight, time, playhead }) => {
    // On each tick, update regl timers and sizes
    regl.poll();

    // Clear backbuffer with black
    regl.clear({
      color: backgroundRGBA,
      depth: 1,
      stencil: 0
    });

    camera.viewport = [ 0, 0, viewportWidth, viewportHeight ];
    camera.update();

    drawMesh({
      projectionMatrix: camera.projection,
      modelViewMatrix: camera.view,
      time
    });
  };
};

canvasSketch(sketch, settings);
