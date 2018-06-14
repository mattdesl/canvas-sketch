/** @jsx h */
const { h, Component, render } = require('preact');
const rightNow = require('right-now');
const defined = require('defined');
const isPromise = require('is-promise');
const { saveCanvas, saveFile, saveDataURL, getCanvasDataURL } = require('texel/util/exporter');
const getCanvasContext = require('get-canvas-context');
const convertUnits = require('convert-units');
const isDOM = require('is-dom');
const isClass = require('is-class');
const GUI = require('../gui');

const availableUnits = [ 'px', 'm', 'cm', 'mm', 'in', 'ft' ]

class Surface extends Component {

  constructor (props) {
    super(props);

    this._lastTime = 0;
    this._lastFrameTime = 0;
    this._time = 0;

    let context = this.props.settings.context;
    if (!context || typeof context === 'string') {
      const newCanvas = this.props.settings.canvas || document.createElement('canvas');
      const type = context || '2d';
      context = getCanvasContext(type, { canvas: newCanvas });
      if (!context) {
        throw new Error(`Failed at canvas.getContext('${type}') - the browser may not support this context, or a different context may already be in use with this canvas.`);
      }
    }

    if (this.props.settings.canvas && context.canvas !== this.props.settings.canvas) {
      throw new Error('The { canvas } and { context } settings must point to the same underlying canvas element');
    }

    const canvas = context.canvas;

    if (this.props.settings.pixelated) {
      context.imageSmoothingEnabled = false;
      context.mozImageSmoothingEnabled = false;
      context.oImageSmoothingEnabled = false;
      context.webkitImageSmoothingEnabled = false;
      context.msImageSmoothingEnabled = false;
      canvas.style['image-rendering'] = 'pixelated';
    }

    let duration = this.props.settings.duration;
    let totalFrames = this.props.settings.totalFrames;
    const timeScale = defined(this.props.settings.timeScale, 1);
    const fps = defined(this.props.settings.fps, 30);
    const hasDuration = typeof duration === 'number' && isFinite(duration);
    const hasTotalFrames = typeof totalFrames === 'number' && isFinite(totalFrames);

    const loop = this.props.settings.loop !== false;
    const totalFramesFromDuration = hasDuration ? Math.floor(fps * duration) : undefined;
    const durationFromTotalFrames = hasTotalFrames ? (totalFrames / fps) : undefined;
    if (typeof totalFramesFromDuration !== 'undefined' && typeof durationFromTotalFrames !== 'undefined') {
      throw new Error('You must specify either duration or totalFrames, but not both');
    }

    totalFrames = defined(totalFrames, totalFramesFromDuration, Infinity);
    duration = defined(duration, durationFromTotalFrames, Infinity);

    this.state = {
      currentGUIs: [],
      sketch: null
    };

    const GUIHandler = Object.assign((params, opt) => {
      const ui = GUI(params, opt);
      const currentGUIs = this.state.currentGUIs.slice();
      currentGUIs.push(ui);
      process.nextTick(() => ui.attach().on('change', this.onGUIChange));
      this.setState({ currentGUIs });
      return ui;
    }, GUI);

    // Initial render state features
    this.renderState = {
      // State
      canvas,
      context,
      gl: isWebGLContext(context) ? context : undefined,
      fps,
      frame: 0,
      time: 0,
      deltaTime: 0,
      playhead: 0,
      duration,
      recording: false,
      playing: this.props.settings.playing !== false,
      totalFrames,
      timeScale,
      loop,
      // Actions
      render: () => this.draw(),
      GUI: GUIHandler
    };

    this.resizeCanvas();
  }

  componentDidMount () {
    const { canvas, context } = this.getRenderState();

    // If the canvas doesn't have a parent yet, attach it to this element
    if (!canvas.parentNode) {
      this.base.parentElement.insertBefore(canvas, this.base.parentElement.firstChild);
    }

    window.addEventListener('keydown', this.saveHandler);
    window.addEventListener('resize', this.resizeHandler);
  }

  componentWillUnmount () {
    // Remove from DOM
    if (this.canvas && this.canvas.parentElement) {
      this.canvas.parentElement.removeChild(this.canvas);
    }
    window.removeEventListener('keydown', this.saveHandler);
    window.removeEventListener('resize', this.resizeHandler);
  }

  // shouldComponentUpdate () {
  //   return this.state.sketch !== this.;
  // }

  getRenderState () {
    return this.renderState;
  }

  load (createSketch) {
    let loader;
    if (isClass(createSketch)) {
      const initialState = this.getRenderState();
      const sketchResult = new createSketch(initialState);
      if (typeof sketchResult.load === 'function') {
        loader = sketchResult.load(initialState);
      }
      // ensure we have a promise
      if (!isPromise(loader)) loader = Promise.resolve();
      // pass along the created class instance
      loader = loader.then(() => sketchResult);
    } else {
      loader = createSketch(this.getRenderState());
      if (!isPromise(loader)) {
        loader = Promise.resolve(loader);
      }
    }
    
    return loader.then(result => {
      if (!result) result = {};
      this.setState({ sketch: result }, () => {
        this.resizeCanvas();

        let didEnter = Promise.resolve();
        if (result && typeof result.enter === 'function') {
          const p = result.enter();
          if (isPromise(p)) didEnter = p;
        }

        didEnter.then(() => {
          // Draw initial state
          this.draw();

          // Start playback
          if (this.renderState.playing) {
            this.play();
          }
        });
      });
    }).catch(err => {
      console.warn('Could not start sketch, the async loading function rejected with an error:\n    Error: ' + err.message);
      throw err;
    });
  }

  unload () {
    this.setState({ sketch: null });
  }

  onGUIChange = () => {
    this.draw();
  }

  componentDidUpdate (prevProps, prevState) {
    // if (prevState.ui !== this.state.ui) {
    //   if (this.state.ui) {
    //     console.log('attach')
    //     this.state.ui.attach().on('change', this.onGUIChange);
    //   } else {
    //     console.error('TODO: Should remove params.');
    //   }
    // }
    // const renderState = this.getRenderState();
    // if (prevState.renderState.canvasWidth !== renderState.canvasWidth || prevState.renderState.canvasHeight !== renderState.canvasHeight) {
    //   this.resizeCanvas();
    // }
    // this.draw();
  }

  resizeCanvas (opt = {}) {
    let width, height;
    let viewportWidth, viewportHeight;
    let canvasWidth, canvasHeight;

    const exporting = Boolean(opt.exporting);
    const settings = this.props.settings;
    const scaleToFit = settings.scaleToFit !== false;
    const scaleCanvas = settings.scaleCanvas !== false;
    let pixelRatio = defined(settings.pixelRatio, window.devicePixelRatio);
    if (typeof settings.maxPixelRatio === 'number') {
      pixelRatio = Math.min(settings.maxPixelRatio, pixelRatio);
    }

    // e.g. @2x exporting for PNG sprites
    if (exporting && typeof settings.exportPixelRatio === 'number') {
      pixelRatio = settings.exportPixelRatio;
    }

    if (!scaleCanvas) {
      pixelRatio = 1;
    }

    let parentWidth = window.innerWidth;
    let parentHeight = window.innerHeight;

    // You can specify a dimensions in pixels or cm/m/in/etc
    const dimensions = settings.dimensions;
    let hasDimensions = dimensions && Array.isArray(dimensions) && dimensions.length >= 2;
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
      const scaleToFitPadding = 40;
      if (windowAspect > aspect) {
        viewportHeight = Math.round(parentHeight - scaleToFitPadding * 2);
        viewportWidth = Math.round(viewportHeight * aspect);
      } else {
        viewportWidth = Math.round(parentWidth - scaleToFitPadding * 2);
        viewportHeight = Math.round(viewportWidth / aspect);
      }
    }

    canvasWidth = scaleCanvas ? Math.round(pixelRatio * viewportWidth) : realWidth;
    canvasHeight = scaleCanvas ? Math.round(pixelRatio * viewportHeight) : realHeight;

    const scaleX = canvasWidth / width;
    const scaleY = canvasHeight / height;

    Object.assign(this.renderState, {
      exporting,
      pixelRatio,
      width,
      height,
      scaleX,
      scaleY,
      canvasWidth,
      canvasHeight,
      viewportWidth,
      viewportHeight,
    });

    // Update canvas settings
    const canvas = this.renderState.canvas;
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    canvas.style.width = `${viewportWidth}px`;
    canvas.style.height = `${viewportHeight}px`;
  }

  saveHandler = ev => {
    if (process.env.NODE_ENV !== 'development') return;
    if (ev.keyCode === 83 && (ev.metaKey || ev.ctrlKey)) {
      ev.preventDefault();
      this.save();
    } else if (ev.keyCode === 32 && (ev.shiftKey)) {
      ev.preventDefault();
      if (this.renderState.recording) {
        this.endRecord();
        this.play();
      } else this.record();
    } else if (ev.keyCode === 32) {
      ev.preventDefault();
      this.togglePlay();
    }
  }

  save (opt = {}) {
    this.resizeCanvas({ exporting: true })
    let drawResult = this.draw();

    const canvas = this.getRenderState().canvas;
    if (typeof drawResult === 'undefined') drawResult = [ canvas ];
    drawResult = [].concat(drawResult).filter(Boolean);

    const exportOpts = Object.assign({
      frame: opt.sequence ? this.renderState.frame : undefined
    }, this.props.settings.exporter, {
      totalFrames: Math.max(100, this.renderState.totalFrames)
    });

    const hasSelfCanvas = drawResult.some(r => r === canvas);
    let dataURL;
    if (hasSelfCanvas) {
      dataURL = getCanvasDataURL(canvas, exportOpts);
    }

    // Reset state immediately after dataURI is captured so there is no flicker
    this.resizeCanvas();
    this.draw();

    const chain = Promise.all(drawResult.map(ret => {
      if (ret === canvas) {
        // this canvas, use dataURL we already captured
        return saveDataURL(dataURL, exportOpts);
      } else if (isCanvas(ret)) {
        return saveCanvas(ret, exportOpts);
      } else if (typeof ret.data !== 'undefined' && typeof ret.extension !== 'undefined') {
        return saveFile(ret.data, Object.assign(exportOpts, { extension: ret.extension }))
      } else {
        throw new Error('Invalid return type; expected canvas, file descriptor as in { extension, data }, or an array of file descriptors');
      }
    }));

    return chain.then(ev => {
      if (!opt.sequence) {
        if (ev.length === 1) {
          console.log('Saved', ev[0].fileRelative);
        } else if (ev.length > 1) {
          console.log(`Saved ${ev.length} files`);
        }
      }
      return ev;
    });
  }

  draw = () => {
    if (!this.state.sketch) return;

    const renderState = this.getRenderState();
    const autoScale = this.props.settings.scaleContext !== false && !renderState.gl;

    if (autoScale) {
      renderState.context.save();
      renderState.context.scale(renderState.scaleX, renderState.scaleY);
    }

    let drawResult;
    if (typeof this.state.sketch.render === 'function') {
      drawResult = this.state.sketch.render(renderState);
    } else if (typeof this.state.sketch === 'function') {
      drawResult = this.state.sketch(renderState);
    } else {
      throw new Error('Sketch must return a function or an object with a render() function.')
    }

    if (autoScale) {
      renderState.context.restore();
    }

    return drawResult;
  }

  resizeHandler = () => {
    this.resizeCanvas();
    this.draw();
  }

  record = () => {
    if (this.renderState.recording) return;
    this.stop();
    this.renderState.playing = true;
    this.renderState.recording = true;

    const frameInterval = 1 / this.renderState.fps;
    const hasDuration = typeof this.renderState.duration === 'number' && isFinite(this.renderState.duration);
    // Render each frame in the sequence
    if (this._raf != null) window.cancelAnimationFrame(this._raf)
    const tick = () => {
      if (!this.renderState.recording) return Promise.resolve();
      return this.save({ sequence: true })
        .then(() => {
          console.log(`Saved Frame ${this.renderState.frame}`);
          this.renderState.frame++;
          if (this.renderState.frame < this.renderState.totalFrames) {
            this.renderState.time += frameInterval;
            this.renderState.deltaTime = frameInterval;
            this.renderState.playhead = 0;
            if (hasDuration && this.renderState.totalFrames > 1) {
              this.renderState.playhead = this.renderState.frame / (this.renderState.totalFrames - 1);
            }
            this._time = this.renderState.time;
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

  endRecord = () => {
    if (this._raf != null) window.cancelAnimationFrame(this._raf);
    this.renderState.recording = false;
    this.renderState.deltaTime = 0;
  }

  play = () => {
    this.renderState.playing = true;
    if (this._raf != null) window.cancelAnimationFrame(this._raf);
    this._lastTime = rightNow();
    this._raf = window.requestAnimationFrame(this.animate);
  }

  pause = () => {
    if (this.renderState.recording) this.endRecord();
    this.renderState.playing = false;
    if (this._raf != null) window.cancelAnimationFrame(this._raf);
  }

  stop = () => {
    this.pause();
    this.renderState.frame = 0;
    this.renderState.playhead = 0;
    this.renderState.time = 0;
    this._time = 0;
  }

  togglePlay = () => {
    if (this.renderState.playing) this.pause();
    else this.play();
  }

  animate = () => {
    if (!this.renderState.playing) return;
    this._raf = window.requestAnimationFrame(this.animate);
    let now = rightNow();
    const fps = this.renderState.fps;
    const frameIntervalMS = 1000 / fps;
    let deltaTimeMS = now - this._lastTime;

    let isNewFrame = true;
    if (this.props.settings.fpsStep) {
      deltaTimeMS = frameIntervalMS;
    } else if (this.props.settings.throttleFrames) {
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
    let newTime = this.renderState.time + deltaTime * this.renderState.timeScale;

    const duration = this.renderState.duration;
    const hasDuration = typeof duration === 'number' && isFinite(duration);

    // Handle reverse time scale
    if (newTime < 0 && hasDuration) {
      newTime = duration + newTime;
    }

    // Re-start animation
    if (hasDuration && newTime > duration) {
      isNewFrame = true;

      // Re-start animation
      if (this.renderState.loop !== false) {
        newTime = newTime % duration;
      } else {
        newTime = duration;
        this.stop();
      }
    }

    if (isNewFrame) {
      this.renderState.deltaTime = deltaTime;
      this.renderState.time = newTime;
      this.renderState.playhead = hasDuration ? this.renderState.time / this.renderState.duration : 0;
      this.renderState.frame = this.renderState.totalFrames > 1
        ? Math.floor(this.renderState.playhead * (this.renderState.totalFrames - 1))
        : 0;
      this.draw();
      this.renderState.deltaTime = 0;
    }

    this._time = newTime;
  }

  render () {
    return null;
  }
}

Surface.defaultProps = {
  settings: {}
};

module.exports = Surface;

function isWebGLContext (ctx) {
  return typeof ctx.clear === 'function' && typeof ctx.clearColor === 'function' && typeof ctx.bufferData === 'function';
}

function parseUnit (str, out) {
  if (!out)
      out = [ 0, '' ]
  str = String(str)
  var num = parseFloat(str, 10)
  out[0] = num
  out[1] = str.match(/[\d.\-\+]*\s*(.*)/)[1] || ''
  return out
}

function inchesToPixels (inches, pixelsPerInch = 72) {
  return Math.round(pixelsPerInch * inches)
}

function toPixels (dimension, units, pixelsPerInch) {
  if (typeof units !== 'string') throw new Error("Invalid unit type, must be a string like 'cm' or 'in'");
  if (units === 'px') return dimension;
  if (availableUnits.includes(units)) {
    const inches = convertUnits(dimension).from(units).to('in');
    return Math.round(dimension * pixelsPerInch);
  } else {
    throw new Error(`Unsupported unit ${units}, try one of the following: m, cm, mm, in, ft`);
  }
}

function isCanvas (element) {
  return isDOM(element) && /canvas/i.test(element.nodeName)
}