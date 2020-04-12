const canvasSketch = require('canvas-sketch');
const createShader = require('canvas-sketch-util/shader');
const glslify = require('glslify');

// These are unused in the browser environment
const createHeadless = require('gl');
const { PNG } = require('pngjs');
const fs = require('fs');

const isNode = typeof document === 'undefined';

const attributes = {
  alpha: true,
  preserveDrawingBuffer: true,
  antialias: false
};

const settings = {
  dimensions: 'A3',
  pixelsPerInch: 300,
  scaleToView: true,
  units: 'cm',
  context: isNode
    ? createHeadless(350, 100, attributes)
    : 'webgl',
  attributes
};

// Your glsl + glslify code
const frag = glslify(`
  precision highp float;

  #pragma glslify: noise = require('glsl-noise/simplex/2d');
  #pragma glslify: hsl2rgb = require('glsl-hsl2rgb');

  uniform float aspect;

  varying vec2 vUv;

  void main () {
    vec2 uv = vUv.xy;
    uv.x *= aspect;

    float n = noise(vec2(uv * 1.5)) * 0.5 + 0.5;
    vec3 color = hsl2rgb(0.5 + pow(n * 0.5 + 0.5, 2.25) * 0.15, 0.5, 0.5);
    gl_FragColor = vec4(color, 1.0);
  }
`);

const sketch = ({ gl }) => {
  // Setup a shader with our utility
  const shader = createShader({
    gl,
    frag,
    uniforms: {
      aspect: ({ width, height }) => width / height
    }
  });

  return {
    render (props) {
      // Render the full-screen shader
      shader.render(props);
    },
    resize ({ canvasWidth, canvasHeight }) {
      // Handle headless-gl resize
      const ext = gl.getExtension('STACKGL_resize_drawingbuffer');
      if (ext) {
        ext.resize(canvasWidth, canvasHeight);
      }
    },
    unload () {
      // Dispose of the shader
      shader.unload();

      // Handle headless-gl unload
      const ext = gl.getExtension('STACKGL_destroy_context');
      if (ext) {
        ext.destroy();
      }
    }
  };
};

(async () => {
  // Setup our sketch...
  const manager = await canvasSketch(sketch, settings);

  // Now write the pixels to a file
  if (isNode) {
    const { gl, canvasWidth, canvasHeight } = manager.props;

    const data = new Uint8Array(canvasWidth * canvasHeight * 4)
    gl.readPixels(0, 0, canvasWidth, canvasHeight, gl.RGBA, gl.UNSIGNED_BYTE, data);

    const buf = PNG.sync.write({
      width: canvasWidth,
      height: canvasHeight,
      data
    });

    fs.writeFileSync('node-output.png', buf);
  }
})();
