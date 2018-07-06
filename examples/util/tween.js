const eases = require('eases');
const lerp = require('lerp');

const tween = (props = {}) => {
  const {
    time = 0,
    from = 0,
    to = 1,
    duration = 1,
    delay = 0,
    edge = 0,
    ease = 'linear'
  } = props;

  if (duration === 0) return 0;

  let t;

  let curEase = ease;
  let flip = false;
  let isEaseDef = typeof curEase === 'object' && (curEase.in || curEase.out);
  // EXPERIMENTAL... should figure out a better syntax
  if (edge !== 0) {
    const elapsed = Math.max(0, time - delay);
    const minEdge = Math.max(0, Math.min(edge, duration));
    const end = Math.max(0, duration - edge);
    if (elapsed <= minEdge) { // Animating in
      t = Math.min(1, elapsed / minEdge);
      if (isEaseDef) curEase = curEase.in || 'linear';
    } else if (edge < duration && elapsed > end) { // Animating out
      t = Math.min(1, Math.max(0, elapsed - end) / edge);
      flip = true;
      if (isEaseDef) {
        curEase = curEase.out || 'linear';
      }
    } else { // In middle
      t = 1;
      if (isEaseDef) curEase = curEase.middle || 'linear';
      else curEase = 'linear';
    }
  } else {
    t = Math.min(1, Math.max(0, time - delay) / duration);
    if (isEaseDef) curEase = curEase.in || 'linear';
  }

  if (curEase && curEase !== 'linear') {
    if (typeof curEase === 'function') return ease(t);
    if (!(curEase in eases)) {
      throw new Error(`Cannot find an easing function by the name of ${curEase}`);
    }
    t = eases[curEase](t);
    if (flip) t = 1 - t;
  }
  return lerp(from, to, t);
};
module.exports = tween;
