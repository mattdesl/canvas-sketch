const canvasSketch = require('canvas-sketch');
const createShader = require('canvas-sketch-util/shader');
const glsl = require('glslify');

// Setup our sketch
const settings = {
  context: 'webgl',
  animate: true,
  params: {
    scale: { type: 'range', step: 0.001, value: 0.5 }
  }
};

// Your glsl code
const frag = glsl(`
  #extension GL_OES_standard_derivatives : enable
  precision highp float;

  #pragma glslify: aastep = require('glsl-aastep');

  uniform float time;
  uniform float scale;
  uniform float aspect;

  uniform vec3 offsets;
  varying vec2 vUv;

  void main () {
    vec2 q = vUv - 0.5;
    q.x *= aspect;

    float dist = length(q);
    dist = aastep(scale, dist);
    gl_FragColor = vec4(vec3(dist), 1.0);
  }
`);

// Your sketch, which simply returns the shader
const sketch = ({ gl }) => {
  // Create the shader and return it
  return createShader({
    // Pass along WebGL context
    gl,
    // Specify fragment and/or vertex shader strings
    frag,
    extensions: [ 'OES_standard_derivatives' ],
    // Specify additional uniforms to pass down to the shaders
    uniforms: {
      // Expose props from canvas-sketch
      time: ({ time }) => time,
      aspect: ({ width, height }) => width / height,
      scale: ({ params }) => params.scale
    }
  });
};

canvasSketch(sketch, settings);
