import SketchManager from './core/SketchManager';
import PaperSizes from './paper-sizes';

function canvasSketch (sketch, settings = {}) {
  if (settings.p5) {
    if (settings.canvas || (settings.context && typeof settings.context !== 'string')) {
      throw new Error(`In { p5 } mode, you can't pass your own canvas or context, unless the context is a "webgl" or "2d" string`);
    }

    // Do not create a canvas on startup, since P5.js does that for us
    const context = typeof settings.context === 'string' ? settings.context : false;
    settings = Object.assign({}, settings, { canvas: false, context });
  }

  const manager = new SketchManager();
  if (sketch) {
    // Apply settings and create a canvas
    manager.setup(settings);
    // Mount the sketch to its parent element (or document.body)
    manager.mount();
    // Load the sketch
    return manager.loadAndRun(sketch);
  }
  return Promise.resolve(manager);
}

// TODO: Figure out a nice way to export things.
canvasSketch.canvasSketch = canvasSketch;
canvasSketch.PaperSizes = PaperSizes;

export default canvasSketch;
