var createRegl = require('regl');
var createQuad = require('primitive-quad');
var parseColor = require('parse-color');
var defined = require('defined');

module.exports = createShader;

function createShader (opt) {
  opt = opt || {};
  if (!opt.gl) {
    throw new Error('Must specify { context: "webgl" } in sketch settings, or a WebGL-enabled canvas');
  }

  var gl = opt.gl;
  var reglOpts = { gl: gl };

  // regl is strict on what options you pass in
  if (typeof opt.extensions !== 'undefined') reglOpts.extensions = opt.extensions;
  if (typeof opt.optionalExtensions !== 'undefined') reglOpts.optionalExtensions = opt.optionalExtensions;
  if (typeof opt.profile !== 'undefined') reglOpts.profile = opt.profile;
  if (typeof opt.onDone !== 'undefined') reglOpts.onDone = opt.onDone;

  // Create regl for handling GL stuff
  var regl = createRegl(reglOpts);

  // A mesh for a flat plane
  var quad = createQuad();

  // Wire up user uniforms nicely
  var uniformsMap = opt.uniforms || {};
  var uniforms = {};
  Object.keys(uniformsMap).forEach(function (key) {
    var fn = uniformsMap[key];
    uniforms[key] = function (state, props, batchID) {
      return fn.call(uniformsMap, props, batchID);
    };
  });

  // Get the drawing command
  var drawQuad;
  try {
    drawQuad = createDrawQuad();
  } catch (err) {
    handleError(err);
  }

  // Nicely get a clear color for the canvas
  var clearColor = defined(opt.clearColor, 'black');
  if (typeof clearColor === 'string') {
    var parsed = parseColor(clearColor);
    if (!parsed.rgb) {
      throw new Error('Error parsing { clearColor } color string "' + clearColor + '"');
    }
    clearColor = parsed.rgb.slice(0, 3).map(function (n) {
      return n / 255;
    });
  } else if (clearColor && (!Array.isArray(clearColor) || clearColor.length < 3)) {
    throw new Error('Error with { clearColor } option, must be a string or [ r, g, b ] float array');
  }

  var clearAlpha = defined(opt.clearAlpha, 1);
  var clear = clearColor ? clearColor.concat([ clearAlpha || 0 ]) : false;

  // Return a renderer object
  return {
    render: function (props) {
      // On each tick, update regl timers and sizes
      regl.poll();

      // Clear backbuffer with color
      if (clear) {
        regl.clear({
          color: clear,
          depth: 1,
          stencil: 0
        });
      }

      // Draw generative / shader art
      if (drawQuad) {
        try {
          drawQuad(props);
        } catch (err) {
          if (handleError(err)) {
            if (props == null) {
              console.warn('Warning: shader.render() is not called with any "props" parameter');
            }
          }
        }
      }

      // Flush pending GL calls for this frame
      gl.flush();
    },
    unload: function () {
      // Unload the current regl instance
      regl.destroy();
    }
  };

  // Draw command
  function createDrawQuad () {
    return regl({
      // Pass down props from javascript
      uniforms: uniforms,
      // Fall back to a simple fragment shader
      frag: opt.frag || [
        'precision highp float;',
        '',
        'void main () {',
        '  gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);',
        '}'
      ].join('\n'),
      // Fall back to a simple vertex shader
      vert: opt.vert || [
        'precision highp float;',
        'attribute vec3 position;',
        'varying vec2 vUv;',
        '',
        'void main () {',
        '  gl_Position = vec4(position.xyz, 1.0);',
        '  vUv = gl_Position.xy * 0.5 + 0.5;',
        '}'
      ].join('\n'),
      // Setup transparency blending
      blend: {
        enable: true,
        func: {
          srcRGB: 'src alpha',
          srcAlpha: 1,
          dstRGB: 'one minus src alpha',
          dstAlpha: 1
        }
      },
      // Send mesh vertex attributes to shader
      attributes: {
        position: quad.positions
      },
      // The indices for the quad mesh
      elements: quad.cells
    });
  }

  function handleError (err) {
    if (/^\(regl\)/.test(err.message)) {
      // Regl already logs a message to the console :\
      // so let's just avoid re-printing the same thing
      return true;
    } else {
      throw err;
    }
  }
}
