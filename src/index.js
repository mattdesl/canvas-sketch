import defined from 'defined';
import assign from 'object-assign';
import getCanvasContext from 'get-canvas-context';
import rightNow from 'right-now';
import isPromise from 'is-promise';
import { toPixels, isWebGLContext, isCanvas } from './util';
import deepEqual from 'deep-equal';
import { saveFile, saveCanvas, saveDataURL } from './save';

class SketchManager {

  constructor () {
    this._settings = {};
    this._props = {};
    this._sketch = undefined;
    this._raf = null;

    this._animateHandler = () => this.animate();

    this._resizeHandler = () => {
      const oldSizes = this._getSizeProps();
      this.resize();

      // For now, this avoids unnecessary re-renders
      // However, it might just be overkill for games/etc.
      if (!deepEqual(oldSizes, this._getSizeProps())) {
        this.draw();
      }
    };

    this._exportHandler = ev => {
      if (this.settings.hotkeys === false) return;
      if (ev.keyCode === 83 && (ev.metaKey || ev.ctrlKey)) {
        // Cmd + S
        ev.preventDefault();
        if (ev.shiftKey) {
          if (this.props.recording) {
            this.endRecord();
            this.play();
          } else this.record();
        } else this.exportFrame();
      } else if (ev.keyCode === 32) {
        if (this.props.playing) this.pause();
        else this.play();
      }
    };
  }

  get sketch () {
    return this._sketch;
  }

  get settings () {
    return this._settings;
  }

  get props () {
    return this._props;
  }

  _computePlayhead (currentTime, duration) {
    const hasDuration = typeof duration === 'number' && isFinite(duration);
    return hasDuration ? currentTime / duration : 0;
  }

  _computeFrame (playhead, time, totalFrames, fps) {
    return (isFinite(totalFrames) && totalFrames > 1)
      ? Math.floor(playhead * (totalFrames - 1))
      : Math.floor(fps * time);
  }

  _computeCurrentFrame () {
    return this._computeFrame(
      this.props.playhead, this.props.time,
      this.props.totalFrames, this.props.fps
    );
  }

  _getSizeProps () {
    const props = this.props;
    return {
      width: props.width,
      height: props.height,
      pixelRatio: props.pixelRatio,
      canvasWidth: props.canvasWidth,
      canvasHeight: props.canvasHeight,
      viewportWidth: props.viewportWidth,
      viewportHeight: props.viewportHeight
    };
  }

  play () {
    if (!this.sketch) throw new Error('should wait until sketch is loaded before trying to play()');

    this.draw();

    // Start an animation frame loop
    if (this.settings.animation) {
      this.props.playing = true;
      if (this._raf != null) window.cancelAnimationFrame(this._raf);
      this._lastTime = rightNow();
      this._raf = window.requestAnimationFrame(this._animateHandler);
    }
  }

  pause () {
    if (this.props.recording) this.endRecord();
    this.props.playing = false;
    if (this._raf != null) window.cancelAnimationFrame(this._raf);
  }

  // Stop and reset to zero
  stop () {
    this.pause();
    this.props.frame = 0;
    this.props.playhead = 0;
    this.props.time = 0;
    this.props.deltaTime = 0;
    this.draw();
  }

  record () {
    if (this.props.recording) return;
    this.stop();
    this.props.playing = true;
    this.props.recording = true;

    const frameInterval = 1 / this.props.fps;
    // Render each frame in the sequence
    if (this._raf != null) window.cancelAnimationFrame(this._raf)
    const tick = () => {
      if (!this.props.recording) return Promise.resolve();
      this.props.deltaTime = frameInterval;
      const frame = this.props.frame;
      return this.exportFrame({ sequence: true })
        .then(() => {
          console.log(`Saved Frame ${frame} of ${this.props.totalFrames}`);
          if (!this.props.recording) return; // was cancelled before
          this.props.deltaTime = 0;
          this.props.frame++;
          if (this.props.frame < this.props.totalFrames) {
            this.props.time += frameInterval;
            this.props.playhead = this._computePlayhead(this.props.time, this.props.duration);
            this._raf = window.requestAnimationFrame(tick);
          } else {
            console.log('Finished recording');
            this.endRecord();
            this.play();
          }
        });
    };
    this._raf = window.requestAnimationFrame(tick);
  }

  endRecord () {
    if (this._raf != null) window.cancelAnimationFrame(this._raf);
    this.props.recording = false;
    this.props.deltaTime = 0;
  }

  exportFrame (opt = {}) {
    if (!this.sketch) return Promise.all([]);
    if (typeof this.sketch.preExport === 'function') {
      this.sketch.preExport();
    }

    this._props.exporting = true;

    // Resize to output resolution
    this.resize();

    // Draw at this output resolution
    let drawResult = this.draw();

    // The self owned canvas
    const canvas = this.props.canvas;

    // Get list of results from render
    if (typeof drawResult === 'undefined') {
      drawResult = [ canvas ];
    }
    drawResult = [].concat(drawResult).filter(Boolean);

    // Options for export function
    let exportOpts = assign({
      frame: opt.sequence ? this.props.frame : undefined
    }, this.settings.exporter, {
      totalFrames: Math.max(100, this.props.totalFrames)
    });

    // Whether one of the results to save is our own canvas
    const hasSelfCanvas = drawResult.some(r => r === canvas);

    // If so, grab the data URL immediately
    let dataURL;
    if (hasSelfCanvas) {
      dataURL = canvas.toDataURL('image/png');
    }

    // Now return to regular rendering mode
    this._props.exporting = false;
    this.resize();
    this.draw();

    // And now we can save each result
    return Promise.all(drawResult.map((ret, i) => {
      const prefix = drawResult.length > 1 ? `Render ${i} - ` : undefined;
      const curOpt = assign({ prefix }, exportOpts);
      if (ret === canvas) {
        // this canvas, use dataURL we already captured
        return saveDataURL(dataURL, assign({}, curOpt, { extension: '.png' }));
      } else if (isCanvas(ret)) {
        return saveCanvas(ret, assign({}, curOpt, { extension: '.png' }));
      } else if (typeof ret.data !== 'undefined' && typeof ret.extension !== 'undefined') {
        return saveFile(ret.data, Object.assign(curOpt, { type: ret.type, extension: ret.extension }));
      } else {
        throw new Error('Invalid return type; expected canvas, file descriptor as in { extension, data }, or an array of file descriptors');
      }
    })).then(() => {
      if (typeof this.sketch.postExport === 'function') {
        this.sketch.postExport();
      }
    });
  }

  draw () {
    if (!this.sketch) return;

    const props = this.props;
    const autoScale = !props.gl && this.settings.scaleContext !== false;

    // Scale context for unit sizing
    if (autoScale) {
      props.context.save();
      props.context.scale(props.scaleX, props.scaleY);
    }

    let drawResult;
    if (typeof this.sketch.render === 'function') {
      drawResult = this.sketch.render(props);
    } else if (typeof this.sketch === 'function') {
      drawResult = this.sketch(props);
    } else {
      throw new Error('Sketch must return a function or an object with a render() function.')
    }

    if (autoScale) {
      props.context.restore();
    }

    return drawResult;
  }

  resize () {
    let width, height;
    let viewportWidth, viewportHeight;
    let canvasWidth, canvasHeight;

    const settings = this.settings;

    const dimensions = settings.dimensions;
    const hasDimensions = dimensions && Array.isArray(dimensions) && dimensions.length >= 2;
    const exporting = this.props.exporting;
    const scaleToFit = hasDimensions ? settings.scaleToFit !== false : false;
    const scaleToView = hasDimensions ? settings.scaleToView : true;
    let pixelRatio = defined(settings.pixelRatio, window.devicePixelRatio);
    if (typeof settings.maxPixelRatio === 'number') {
      pixelRatio = Math.min(settings.maxPixelRatio, pixelRatio);
    }

    if (!scaleToView) {
      pixelRatio = 1;
    }

    let parentWidth = window.innerWidth;
    let parentHeight = window.innerHeight;

    // You can specify a dimensions in pixels or cm/m/in/etc
    if (hasDimensions) {
      width = dimensions[0];
      height = dimensions[1];
    } else {
      width = parentWidth;
      height = parentHeight;
    }

    // Real size in pixels after PPI is taken into account
    const pixelsPerInch = (typeof settings.pixelsPerInch === 'number' && isFinite(settings.pixelsPerInch)) ? settings.pixelsPerInch : 72;
    const units = settings.units;
    let realWidth = width;
    let realHeight = height;
    if (hasDimensions && units) {
      // Convert to units if necessary
      realWidth = toPixels(width, units, pixelsPerInch);
      realHeight = toPixels(height, units, pixelsPerInch);
    }

    // How big to set the 'view' of the canvas in the browser (i.e. style)
    viewportWidth = Math.round(realWidth);
    viewportHeight = Math.round(realHeight);

    // If we wish to scale the view to the browser window
    if (scaleToFit && !exporting && hasDimensions) {
      const aspect = width / height;
      const windowAspect = parentWidth / parentHeight;
      const scaleToFitPadding = defined(settings.scaleToFitPadding, 40);
      const maxWidth = Math.round(parentWidth - scaleToFitPadding * 2);
      const maxHeight = Math.round(parentHeight - scaleToFitPadding * 2);
      if (viewportWidth > maxWidth || viewportHeight > maxHeight) {
        if (windowAspect > aspect) {
          viewportHeight = maxHeight;
          viewportWidth = Math.round(viewportHeight * aspect);
        } else {
          viewportWidth = maxWidth;
          viewportHeight = Math.round(viewportWidth / aspect);
        }
      }
    }

    // e.g. @2x exporting for PNG sprites
    let exportPixelRatio = 1;
    if (exporting && typeof settings.exportPixelRatio === 'number') {
      exportPixelRatio = settings.exportPixelRatio;
      pixelRatio = exportPixelRatio;
    }

    canvasWidth = scaleToView ? Math.round(pixelRatio * viewportWidth) : Math.round(exportPixelRatio * realWidth);
    canvasHeight = scaleToView ? Math.round(pixelRatio * viewportHeight) : Math.round(exportPixelRatio * realHeight);

    const scaleX = canvasWidth / width;
    const scaleY = canvasHeight / height;

    // Assign to current props
    Object.assign(this._props, {
      pixelRatio,
      width,
      height,
      scaleX,
      scaleY,
      canvasWidth,
      canvasHeight,
      viewportWidth,
      viewportHeight
    });

    // Update canvas settings
    const canvas = this.props.canvas;
    if (canvas.width !== canvasWidth) canvas.width = canvasWidth;
    if (canvas.height !== canvasHeight) canvas.height = canvasHeight;
    canvas.style.width = `${viewportWidth}px`;
    canvas.style.height = `${viewportHeight}px`;

    // Send resize event to sketch
    if (this.sketch && typeof this.sketch.resize === 'function') {
      this.sketch.resize(this.props);
    }
  }

  animate () {
    if (!this.props.playing) return;
    this._raf = window.requestAnimationFrame(this._animateHandler);

    let now = rightNow();

    const fps = this.props.fps;
    const frameIntervalMS = 1000 / fps;
    let deltaTimeMS = now - this._lastTime;

    const duration = this.props.duration;
    const hasDuration = typeof duration === 'number' && isFinite(duration);

    let isNewFrame = true;
    const playbackRate = this.settings.playbackRate;
    if (playbackRate === 'fixed') {
      deltaTimeMS = frameIntervalMS;
    } else if (playbackRate === 'throttle') {
      if (deltaTimeMS > frameIntervalMS) {
        now = now - (deltaTimeMS % frameIntervalMS);
        this._lastTime = now;
      } else {
        isNewFrame = false;
      }
    } else {
      this._lastTime = now;
    }

    const deltaTime = deltaTimeMS / 1000;
    let newTime = this.props.time + deltaTime * this.props.timeScale;

    // Handle reverse time scale
    if (newTime < 0 && hasDuration) {
      newTime = duration + newTime;
    }

    // Re-start animation
    if (hasDuration && newTime >= duration) {
      isNewFrame = true;

      // Re-start animation
      if (this.settings.loop !== false) {
        newTime = newTime % duration;
      } else {
        newTime = duration;
        this.stop();
      }
    }

    if (isNewFrame) {
      this.props.deltaTime = deltaTime;
      this.props.time = newTime;
      this.props.playhead = this._computePlayhead(newTime, duration);
      this.props.frame = this._computeCurrentFrame();
      this.draw();
      this.props.deltaTime = 0;
    }
  }

  mount (defaultParent = document.body) {
    if (!this.props.canvas) throw new Error('Tried to mount() but not canvas has been setup() yet');
    if (!this.props.canvas.parentElement) {
      defaultParent.appendChild(this.props.canvas);
    }

    window.addEventListener('resize', this._resizeHandler);
    window.addEventListener('keydown', this._exportHandler);
  }

  unmount () {
    window.removeEventListener('resize', this._resizeHandler);
    window.removeEventListener('keydown', this._exportHandler);
  }

  setup (settings = {}) {
    if (this.sketch) throw new Error('Already have a sketch, try await unload() before another setup()');

    this._settings = Object.assign({}, settings);

    // Determine the canvas and context to create
    let context = settings.context;
    if (!context || typeof context === 'string') {
      const newCanvas = settings.canvas || document.createElement('canvas');
      const type = context || '2d';
      context = getCanvasContext(type, { canvas: newCanvas });
      if (!context) {
        throw new Error(`Failed at canvas.getContext('${type}') - the browser may not support this context, or a different context may already be in use with this canvas.`);
      }
    }

    const canvas = context.canvas;

    // Ensure context matches user's canvas expectations
    if (settings.canvas && canvas !== settings.canvas) {
      throw new Error('The { canvas } and { context } settings must point to the same underlying canvas element');
    }

    // Get timing data
    let duration = settings.duration;
    let totalFrames = settings.totalFrames;
    const timeScale = defined(settings.timeScale, 1);
    const fps = defined(settings.fps, 30);
    const hasDuration = typeof duration === 'number' && isFinite(duration);
    const hasTotalFrames = typeof totalFrames === 'number' && isFinite(totalFrames);

    const totalFramesFromDuration = hasDuration ? Math.floor(fps * duration) : undefined;
    const durationFromTotalFrames = hasTotalFrames ? (totalFrames / fps) : undefined;
    if (hasDuration && hasTotalFrames && totalFramesFromDuration !== totalFrames) {
      throw new Error('You should specify either duration or totalFrames, but not both. Or, they must match exactly.');
    }

    totalFrames = defined(totalFrames, totalFramesFromDuration, Infinity);
    duration = defined(duration, durationFromTotalFrames, Infinity);

    const startTime = settings.time;
    const startFrame = settings.frame;
    const hasStartTime = typeof startTime === 'number' && isFinite(startTime);
    const hasStartFrame = typeof startFrame === 'number' && isFinite(startFrame);

    // start at zero unless user specifies frame or time (but not both mismatched)
    let time = 0;
    let frame = 0;
    let playhead = 0;
    if (hasStartTime && hasStartFrame) {
      throw new Error('You should specify either start frame or time, but not both.');
    } else if (hasStartTime) {
      // User specifies time, we infer frames from FPS
      time = startTime;
      playhead = this._computePlayhead(time, duration);
      frame = this._computeFrame(
        playhead, time,
        totalFrames, fps
      );
    } else if (hasStartFrame) {
      // User specifies frame number, we infer time from FPS
      frame = startFrame;
      time = frame / fps;
      playhead = this._computePlayhead(time, duration);
    }

    // Apply pixelation to canvas if necessary, this is mostly a convenience utility
    if (settings.pixelated) {
      context.imageSmoothingEnabled = false;
      context.mozImageSmoothingEnabled = false;
      context.oImageSmoothingEnabled = false;
      context.webkitImageSmoothingEnabled = false;
      context.msImageSmoothingEnabled = false;
      canvas.style['image-rendering'] = 'pixelated';
    }

    // Initial render state features
    this._props = {
      canvas,
      context,
      fps,
      frame,
      time,
      deltaTime: 0,
      playhead,
      duration,
      exporting: false,
      playing: false,
      recording: false,
      totalFrames,
      timeScale
    };

    // For WebGL sketches, a gl variable reads a bit better
    if (isWebGLContext(context)) this._props.gl = context;

    // Trigger initial resize now so that canvas is already sized
    // by the time we load the sketch
    this.resize();
  }

  load (createSketch) {
    // User didn't specify a function
    if (typeof createSketch !== 'function') {
      throw new Error('The function must take in a function as the first parameter. Example:\n  canvasSketcher(() => { ... }, settings)');
    }

    // Load the user's sketch
    let loader = createSketch(this.props);
    if (!isPromise(loader)) {
      loader = Promise.resolve(loader);
    }

    return loader.then(sketch => {
      if (!sketch) sketch = {};
      this._sketch = sketch;
    }).catch(err => {
      console.warn('Could not start sketch, the async loading function rejected with an error:\n    Error: ' + err.message);
      throw err;
    });
  }
}

export default function (sketch, settings = {}) {
  const manager = new SketchManager();
  if (sketch) {
    // Apply settings and create a canvas
    manager.setup(settings);
    // Mount the sketch to its parent element (or document.body)
    manager.mount();
    // Load the sketch
    manager.load(sketch).then(() => {
      // Start playback/rendering
      manager.play();
    });
  }
  return manager;
}
