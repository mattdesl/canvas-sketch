import SketchManager from './core/SketchManager';
import PaperSizes from './paper-sizes';
import { getClientAPI, defined } from './util';

const CACHE = 'hot-id-cache';
const runtimeCollisions = [];

function isHotReload () {
  const client = getClientAPI();
  return client && client.hot;
}

function cacheGet (id) {
  const client = getClientAPI();
  if (!client) return undefined;
  client[CACHE] = client[CACHE] || {};
  return client[CACHE][id];
}

function cachePut (id, data) {
  const client = getClientAPI();
  if (!client) return undefined;
  client[CACHE] = client[CACHE] || {};
  client[CACHE][id] = data;
}

function getTimeProp (oldManager, newSettings) {
  // Static sketches ignore the time persistency
  return newSettings.animate ? { time: oldManager.props.time } : undefined;
}

/**
 * The main function of the canvasSketch library, responsible for initializing a sketch.
 *
 * @param {Function} sketch - The sketch function. This function should be asynchronous and 
 *                            receive an object with the properties 'width' and 'height'.
 * @param {Object} settings - The settings object for the sketch.
 * @param {Array<number>|String} settings.dimensions - The dimensions of your sketch in [width, height] units. If not specified, the sketch will fill the browser window. You can also specify a preset string such as "A4" or "Letter".
 * @param {"in" | "cm" | "px" | "ft" | "m" | "mm"} settings.units - The working units if dimensions is specified.
 * @param {Number} settings.pixelsPerInch - When units is a physical measurement (e.g. inches), this value will be used as the resolution to convert inches to pixels for exporting and rendering.
 * @param {String} settings.orientation - If "landscape" or "portrait" are specified, the dimensions will be rotated to the respective orientation, otherwise no change will be made.
 * @param {Boolean} settings.scaleToFit - When true, scales down the canvas to fit within the browser window.
 * @param {Boolean} settings.scaleToView - When true, scales up or down the canvas so that it is no larger or smaller than it needs to be based on the window size.
 * @param {Number} settings.bleed - You can pad the dimensions of your artwork by bleed units, e.g. for print trim and safe zones.
 * @param {Number} settings.pixelRatio - The pixel ratio of the canvas for rendering and export. Defaults to window.devicePixelRatio.
 * @param {Number} settings.exportPixelRatio - The pixel ratio to use when exporting, defaults to pixelRatio.
 * @param {Number} settings.maxPixelRatio - A maximum value for pixel ratio, in order to clamp the density for Retina displays.
 * @param {Boolean} settings.scaleContext - When true, 2D contexts will be scaled to account for the difference between width / height (physical measurements) and canvasWidth / canvasHeight (in-browser measurements).
 * @param {Boolean} settings.resizeCanvas - When true, canvas width and height will be set. You can stop the canvas from being resized by setting this to false.
 * @param {Boolean} settings.styleCanvas - When true, canvas style width and height will be added to account for pixelRatio scaling. Disable this by setting it to false.
 * @param {Boolean} settings.animate - If true, will set up a requestAnimationFrame loop and trigger a render on each frame.
 * @param {Boolean} settings.playing - If true, and when animate is true, the loop will play.
 * @param {Boolean} settings.loop - If true, when the last frame is reached, start again from the first frame to form a seamless loop. If false, the animation loop will stop when reaching the last frame.
 * @param {Number} settings.duration - A number in seconds defining the total duration of your loop; when not specified, the loop will never end. You can use this or totalFrames, but should not try to set both together.
 * @param {Number} settings.totalFrames - A number in frames defining the total duration of your loop; when not specified, the loop will never end. You can use this or duration, but should not try to set both together.
 * @param {Number} settings.fps - The frame rate, defaults to 24 frames per second. This is used during export and to compute the totalFrames when duration is passed in seconds.
 * @param {String} settings.playbackRate - By default, the requestAnimationFrame rendering will run as fast as possible, generally 60 FPS in browsers. You can throttle rendering by setting this to "throttle", so that it more closely resembles your GIF export, or set it to "fixed" to step the frames forward at a fixed interval each frame (based on the fps).
 * @param {Number} settings.timeScale - Stretches the delta time per frame by a factor, allowing you to slow down your animation (using a number smaller than 1) or speed it up (using a number larger than 1). This does not change your loop duration.
 * @param {Number} settings.frame - The initial frame to start on when the sketch is first run. You can use this or time, but should not try to set both together.
 * @param {Number} settings.time - The initial time in seconds to start on when the sketch is first run. You can use this or frame, but should not try to set both together.
 *
 * @returns {Promise<SketchManager>} A promise that resolves to an instance of SketchManager.
 */
function canvasSketch (sketch, settings = {}) {
  if (settings.p5) {
    if (settings.canvas || (settings.context && typeof settings.context !== 'string')) {
      throw new Error(`In { p5 } mode, you can't pass your own canvas or context, unless the context is a "webgl" or "2d" string`);
    }

    // Do not create a canvas on startup, since P5.js does that for us
    const context = typeof settings.context === 'string' ? settings.context : false;
    settings = Object.assign({}, settings, { canvas: false, context });
  }

  const isHot = isHotReload();
  let hotID;
  if (isHot) {
    // Use a magic name by default, force user to define each sketch if they
    // require more than one in an application. Open to other ideas on how to tackle
    // this as well...
    hotID = defined(settings.id, '$__DEFAULT_CANVAS_SKETCH_ID__$');
  }
  let isInjecting = isHot && typeof hotID === 'string';

  if (isInjecting && runtimeCollisions.includes(hotID)) {
    console.warn(`Warning: You have multiple calls to canvasSketch() in --hot mode. You must pass unique { id } strings in settings to enable hot reload across multiple sketches. `, hotID);
    isInjecting = false;
  }

  let preload = Promise.resolve();

  if (isInjecting) {
    // Mark this as already spotted in this runtime instance
    runtimeCollisions.push(hotID);

    const previousData = cacheGet(hotID);
    if (previousData) {
      const next = () => {
        // Grab new props from old sketch instance
        const newProps = getTimeProp(previousData.manager, settings);
        // Destroy the old instance
        previousData.manager.destroy();
        // Pass along new props
        return newProps;
      };

      // Move along the next data...
      preload = previousData.load.then(next).catch(next);
    }
  }

  return preload.then(newProps => {
    const manager = new SketchManager();
    let result;
    if (sketch) {
      // Merge with incoming data
      settings = Object.assign({}, settings, newProps);

      // Apply settings and create a canvas
      manager.setup(settings);

      // Mount to DOM
      manager.mount();

      // load the sketch first
      result = manager.loadAndRun(sketch);
    } else {
      result = Promise.resolve(manager);
    }
    if (isInjecting) {
      cachePut(hotID, { load: result, manager });
    }
    return result;
  });
}

// TODO: Figure out a nice way to export things.
canvasSketch.canvasSketch = canvasSketch;
canvasSketch.PaperSizes = PaperSizes;

export default canvasSketch;
