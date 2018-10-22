const regl = require('regl');

let instance;
setInterval(() => {
  if (instance) {
    
  }
  const canvas = document.createElement('canvas');
  const gl = canvas.getContext('webgl');
  gl.canvas = null;
  console.log('next');
  // instance = regl({
  //   gl
  // });
}, 200)

// const canvasSketch = require('canvas-sketch');
// const createShader = require('canvas-sketch-util/shader');
// const glsl = require('glslify');

// // Setup our sketch
// const settings = {
//   context: 'webgl',
//   animate: true,
//   params: {
//     color1: {
//       type: 'color',
//       value: 'red',
//       format: 'rgb-float'
//     },
//     color2: {
//       type: 'color',
//       value: 'blue',
//       format: 'rgb-float'
//     },
//     slider: { type: 'range', value: 0.5 },
//     foo: {
//       value: 1
//     }
//   }
// };

// // Your glsl code
// const frag = glsl(`
//   precision highp float;

//   uniform float time;
//   uniform float aspect;
//   uniform vec3 color1;
//   uniform vec3 color2;
//   varying vec2 vUv;

//   #pragma glslify: noise = require('glsl-noise/simplex/4d');

//   void main () {
//     vec2 q = vUv - 0.5;
//     q.x *= aspect;

//     float t = noise(vec4(q * 2.0, time, 0.0)) * 0.5 + 0.5;

//     float len = length(q);

//     // d += t;
//     float d = step(0.25 + t * 0.05, len);

//     vec3 ball = color1;
//     vec3 grad = mix(ball, color2, d);

//     gl_FragColor = vec4(vec3(0.6), 1.0);
//   }
// `);

// // Your sketch, which simply returns the shader
// const sketch = ({ gl }) => {
//   // Create the shader and return it
//   return createShader({
//     // Pass along WebGL context
//     gl,
//     // Specify fragment and/or vertex shader strings
//     frag,
//     // Specify additional uniforms to pass down to the shaders
//     uniforms: {
//       // Expose props from canvas-sketch
//       time: ({ time }) => time,
//       color1: ({ params }) => params.color1,
//       color2: ({ params }) => params.color2,
//       aspect: ({ width, height }) => width / height
//     }
//   });
// };

// canvasSketch(sketch, settings);