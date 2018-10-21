const canvasSketch = require('canvas-sketch');
const createShader = require('canvas-sketch-util/shader');
const glsl = require('glslify');

// Setup our sketch
const settings = {
  context: 'webgl',
  animate: true
};

// Your glsl code
const frag = glsl(`
  precision highp float;

  uniform float time;
  uniform float aspect;
  varying vec2 vUv;

  #pragma glslify: noise = require('glsl-noise/simplex/4d');

  void main () {
    vec2 uv = vUv - 0.5;
    uv.x *= aspect;

    float anim = sin(time) * 0.5 + 0.5;

    float a = 0.05;
    float b = 1.0;
    float c = 0.5;
    uv.x += a * noise(vec4(uv.xy * b, time * c, -1.0));
    uv.y += a * noise(vec4(uv.xy * b, time * c, 1.0));

    float len = mod(fract(length(uv) * 5.0) + time * 0.25, 1.0);

    vec3 color = mix(vec3(0.25), vec3(0.5), len);
    gl_FragColor = vec4(color, 1.0);
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
    // Specify additional uniforms to pass down to the shaders
    uniforms: {
      // Expose props from canvas-sketch
      time: ({ time }) => time,
      aspect: ({ width, height }) => width / height
    }
  });
};

canvasSketch(sketch, settings);