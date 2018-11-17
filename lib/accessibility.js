// Handle some common typos
const commonTypos = {
  dimension: 'dimensions',
  animated: 'animate',
  animating: 'animate',
  unit: 'units',
  P5: 'p5',
  pixellated: 'pixelated',
  looping: 'loop',
  pixelPerInch: 'pixels'
};

// Handle all other typos
const allKeys = [
  'dimensions', 'units', 'pixelsPerInch', 'orientation',
  'scaleToFit', 'scaleToView', 'bleed', 'pixelRatio',
  'exportPixelRatio', 'maxPixelRatio', 'scaleContext',
  'resizeCanvas', 'styleCanvas', 'canvas', 'context', 'attributes',
  'parent', 'file', 'name', 'prefix', 'suffix', 'animate', 'playing',
  'loop', 'duration', 'totalFrames', 'fps', 'playbackRate', 'timeScale',
  'frame', 'time', 'flush', 'pixelated', 'hotkeys', 'p5', 'id',
  'scaleToFitPadding', 'data', 'params', 'encoding', 'encodingQuality'
];

// This is fairly opinionated and forces users to use the 'data' parameter
// if they want to pass along non-setting objects...
export const checkSettings = (settings) => {
  const keys = Object.keys(settings);
  keys.forEach(key => {
    if (key in commonTypos) {
      const actual = commonTypos[key];
      console.warn(`[canvas-sketch] Could not recognize the setting "${key}", did you mean "${actual}"?`);
    } else if (!allKeys.includes(key)) {
      console.warn(`[canvas-sketch] Could not recognize the setting "${key}"`);
    }
  });
};
