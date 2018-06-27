const eases = require('eases');
const lerp = require('lerp');

const tween = ({ time = 0, from = 0, to = 1, duration = 1, delay = 0, ease = 'linear' } = {}) => {
  if (duration === 0) return 0;
  let t = Math.min(1, Math.max(0, time - delay) / duration);
  if (ease && ease !== 'linear') {
    if (typeof ease === 'function') return ease(t);
    if (!(ease in eases)) {
      throw new Error(`Cannot find an easing function by the name of ${ease}`);
    }
    t = eases[ease](t);
  }
  return lerp(from, to, t);
};
module.exports = tween;
