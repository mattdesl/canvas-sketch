const lerp = require('lerp');
const inverseLerp = require('unlerp');
const clamp = require('clamp');
const defined = require('defined');

const toFinite = (n, defaultValue = 0) => {
  return typeof n === 'number' && isFinite(n) ? n : defaultValue;
};

const expandVector = dims => {
  return (p, defaultValue = 0) => {
    let scalar;
    if (p == null) {
      // No vector, create a default one
      scalar = defaultValue;
    } else if (typeof p === 'number' && isFinite(p)) {
      // Expand single channel to multiple vector
      scalar = p;
    }

    const out = [];
    if (scalar == null) {
      for (let i = 0; i < dims; i++) {
        out[i] = toFinite(p[i], defaultValue);
      }
    } else {
      for (let i = 0; i < dims; i++) {
        out[i] = scalar;
      }
    }
    return out;
  };
};

const lerpArray = (min, max, t, out = []) => {
  if (min.length !== max.length) {
    throw new Error('min and max array are expected to have the same length');
  }
  for (let i = 0; i < min.length; i++) {
    out[i] = lerp(min[i], max[i], t);
  }
  return out;
};

const newArray = (n = 0, initialValue) => {
  const out = [];
  for (let i = 0; i < n; i++) out.push(initialValue);
  return out;
};

const linspace = (n = 0, opts = {}) => {
  if (typeof opts === 'boolean') {
    opts = { endpoint: true };
  }
  const offset = defined(opts.offset, 0);
  return opts.endpoint
    ? newArray(n).map((_, i) => n <= 1 ? 0 : ((i + offset) / (n - 1)))
    : newArray(n).map((_, i) => (i + offset) / n);
};

module.exports = {
  linspace,
  lerpArray,
  lerp,
  inverseLerp,
  clamp,
  clamp01: (v) => clamp(v, 0, 1),
  smoothstep: require('smoothstep'),
  expand2D: expandVector(2),
  expand3D: expandVector(3),
  expand4D: expandVector(4)
};

// clamp
// clamp01
// closestPowerOfTwo
// colorTemperatureToRGB
// deltaAngle
// inverseLerp
// lerpAngle
// isPowerOfTwo
// lerpUnclamped
// gammaToLinearSpace
// linearToGammaSpace
// nextPowerOfTwo
// sign
// fract
// lerp
// smoothStep / smoothstep
// smoothDamp
// smoothDampAngle