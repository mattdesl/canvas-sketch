import SketchManager from './core/SketchManager';
import PaperSizes from './paper-sizes';

const CACHE = 'canvas-sketch-file-cache';

function cacheGet (file) {
  window[CACHE] = window[CACHE] || {};
  return window[CACHE][file];
}

function cachePut (file, data) {
  window[CACHE] = window[CACHE] || {};
  window[CACHE][file] = data;
}

function canvasSketch (sketch, settings = {}, file) {
  if (settings.p5) {
    if (settings.canvas || (settings.context && typeof settings.context !== 'string')) {
      throw new Error(`In { p5 } mode, you can't pass your own canvas or context, unless the context is a "webgl" or "2d" string`);
    }

    // Do not create a canvas on startup, since P5.js does that for us
    const context = typeof settings.context === 'string' ? settings.context : false;
    settings = Object.assign({}, settings, { canvas: false, context });
  }

  const isCaching = typeof file === 'string';

  let preload = Promise.resolve();

  if (isCaching) {
    const previousData = cacheGet(file);
    if (previousData) {
      preload = previousData.load.then(manager => {
        const newProps = Object.assign({}, manager.props);
        manager.destroy();
        return {
          time: newProps.time
        };
      }).catch(() => {
        // If an error occurred during load, we will just
        // destroy old manager and reset props
        previousData.manager.destroy();
        return null;
      });
    }
  }

  return preload.then(newProps => {
    const manager = new SketchManager();
    let result;
    if (sketch) {
      // Apply settings and create a canvas
      manager.setup(settings);
      if (newProps) manager.update(newProps);
      manager.mount();
      // load the sketch first
      result = manager.loadAndRun(sketch);
    } else {
      result = Promise.resolve(manager);
    }
    if (isCaching) {
      cachePut(file, { load: result, manager });
    }
    return result;
  });
}

// TODO: Figure out a nice way to export things.
canvasSketch.canvasSketch = canvasSketch;
canvasSketch.PaperSizes = PaperSizes;

export default canvasSketch;
