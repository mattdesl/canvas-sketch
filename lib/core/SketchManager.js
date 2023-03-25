import assign from "object-assign";
import rightNow from "right-now";
import isPromise from "is-promise";
import {
  isBrowser,
  defined,
  isWebGLContext,
  is2DContext,
  isCanvas,
  getClientAPI,
} from "../util";
import deepEqual from "deep-equal";
import {
  resolveFilename,
  saveFile,
  saveDataURL,
  getTimeStamp,
  exportCanvas,
  streamStart,
  streamEnd,
} from "../save";
import { checkSettings } from "../accessibility";

import keyboardShortcuts from "./keyboardShortcuts";
import resizeCanvas from "./resizeCanvas";
import createCanvas from "./createCanvas";

class SketchManager {
  constructor() {
    this._settings = {};
    this._props = {};
    this._sketch = undefined;
    this._raf = null;
    this._recordTimeout = null;

    // Some hacky things required to get around p5.js structure
    this._lastRedrawResult = undefined;
    this._isP5Resizing = false;

    this._keyboardShortcuts = keyboardShortcuts({
      enabled: () => this.settings.hotkeys !== false,
      save: (ev) => {
        if (ev.shiftKey) {
          if (this.props.recording) {
            this.endRecord();
            this.run();
          } else this.record();
        } else if (!this.props.recording) {
          this.exportFrame();
        }
      },
      togglePlay: () => {
        if (this.props.playing) this.pause();
        else this.play();
      },
      commit: (ev) => {
        this.exportFrame({ commit: true });
      },
    });

    this._animateHandler = () => this.animate();

    this._resizeHandler = () => {
      const changed = this.resize();
      // Only re-render when size actually changes
      if (changed) {
        this.render();
      }
    };
  }

  get sketch() {
    return this._sketch;
  }

  get settings() {
    return this._settings;
  }

  get props() {
    return this._props;
  }

  _computePlayhead(currentTime, duration) {
    const hasDuration = typeof duration === "number" && isFinite(duration);
    return hasDuration ? currentTime / duration : 0;
  }

  _computeFrame(playhead, time, totalFrames, fps) {
    return isFinite(totalFrames) && totalFrames > 1
      ? Math.floor(playhead * (totalFrames - 1))
      : Math.floor(fps * time);
  }

  _computeCurrentFrame() {
    return this._computeFrame(
      this.props.playhead,
      this.props.time,
      this.props.totalFrames,
      this.props.fps
    );
  }

  _getSizeProps() {
    const props = this.props;
    return {
      width: props.width,
      height: props.height,
      pixelRatio: props.pixelRatio,
      canvasWidth: props.canvasWidth,
      canvasHeight: props.canvasHeight,
      viewportWidth: props.viewportWidth,
      viewportHeight: props.viewportHeight,
    };
  }

  run() {
    if (!this.sketch)
      throw new Error(
        "should wait until sketch is loaded before trying to play()"
      );

    // Start an animation frame loop if necessary
    if (this.settings.playing !== false) {
      this.play();
    }

    // Let's let this warning hang around for a few versions...
    if (typeof this.sketch.dispose === "function") {
      console.warn(
        "In canvas-sketch@0.0.23 the dispose() event has been renamed to unload()"
      );
    }

    // In case we aren't playing or animated, make sure we still trigger begin message...
    if (!this.props.started) {
      this._signalBegin();
      this.props.started = true;
    }

    // Render an initial frame
    this.tick();
    this.render();
    return this;
  }

  _cancelTimeouts() {
    if (
      this._raf != null &&
      typeof window !== "undefined" &&
      typeof window.cancelAnimationFrame === "function"
    ) {
      window.cancelAnimationFrame(this._raf);
      this._raf = null;
    }
    if (this._recordTimeout != null) {
      clearTimeout(this._recordTimeout);
      this._recordTimeout = null;
    }
  }

  play() {
    let animate = this.settings.animate;
    if ("animation" in this.settings) {
      animate = true;
      console.warn(
        "[canvas-sketch] { animation } has been renamed to { animate }"
      );
    }
    if (!animate) return;
    if (!isBrowser()) {
      console.error(
        "[canvas-sketch] WARN: Using { animate } in Node.js is not yet supported"
      );
      return;
    }
    if (this.props.playing) return;
    if (!this.props.started) {
      this._signalBegin();
      this.props.started = true;
    }

    // console.log('play', this.props.time)

    // Start a render loop
    this.props.playing = true;
    this._cancelTimeouts();
    this._lastTime = rightNow();
    this._raf = window.requestAnimationFrame(this._animateHandler);
  }

  pause() {
    if (this.props.recording) this.endRecord();
    this.props.playing = false;

    this._cancelTimeouts();
  }

  togglePlay() {
    if (this.props.playing) this.pause();
    else this.play();
  }

  // Stop and reset to frame zero
  stop() {
    this.pause();
    this.props.frame = 0;
    this.props.playhead = 0;
    this.props.time = 0;
    this.props.deltaTime = 0;
    this.props.started = false;
    this.render();
  }

  record() {
    if (this.props.recording) return;
    if (!isBrowser()) {
      console.error(
        "[canvas-sketch] WARN: Recording from Node.js is not yet supported"
      );
      return;
    }

    this.stop();
    this.props.playing = true;
    this.props.recording = true;

    const exportOpts = this._createExportOptions({ sequence: true });

    const frameInterval = 1 / this.props.fps;
    // Render each frame in the sequence
    this._cancelTimeouts();
    const tick = () => {
      if (!this.props.recording) return Promise.resolve();
      this.props.deltaTime = frameInterval;
      this.tick();
      return this.exportFrame(exportOpts).then(() => {
        if (!this.props.recording) return; // was cancelled before
        this.props.deltaTime = 0;
        this.props.frame++;
        if (this.props.frame < this.props.totalFrames) {
          this.props.time += frameInterval;
          this.props.playhead = this._computePlayhead(
            this.props.time,
            this.props.duration
          );
          this._recordTimeout = setTimeout(tick, 0);
        } else {
          console.log("Finished recording");
          this._signalEnd();
          this.endRecord();
          this.stop();
          this.run();
        }
      });
    };

    // Trigger a start event before we begin recording
    if (!this.props.started) {
      this._signalBegin();
      this.props.started = true;
    }

    // Trigger 'begin record' event
    if (this.sketch && typeof this.sketch.beginRecord === "function") {
      this._wrapContextScale((props) => this.sketch.beginRecord(props));
    }

    // Initiate a streaming start if necessary
    streamStart(exportOpts)
      .catch((err) => {
        console.error(err);
      })
      .then((response) => {
        this._raf = window.requestAnimationFrame(tick);
      });
  }

  _signalBegin() {
    if (this.sketch && typeof this.sketch.begin === "function") {
      this._wrapContextScale((props) => this.sketch.begin(props));
    }
  }

  _signalEnd() {
    if (this.sketch && typeof this.sketch.end === "function") {
      this._wrapContextScale((props) => this.sketch.end(props));
    }
  }

  endRecord() {
    const wasRecording = this.props.recording;

    this._cancelTimeouts();
    this.props.recording = false;
    this.props.deltaTime = 0;
    this.props.playing = false;

    // tell CLI that stream has finished
    return streamEnd()
      .catch((err) => {
        console.error(err);
      })
      .then(() => {
        // Trigger 'end record' event
        if (
          wasRecording &&
          this.sketch &&
          typeof this.sketch.endRecord === "function"
        ) {
          this._wrapContextScale((props) => this.sketch.endRecord(props));
        }
      });
  }

  _createExportOptions(opt = {}) {
    return {
      sequence: opt.sequence,
      save: opt.save,
      fps: this.props.fps,
      frame: opt.sequence ? this.props.frame : undefined,
      file: this.settings.file,
      name: this.settings.name,
      prefix: this.settings.prefix,
      suffix: this.settings.suffix,
      encoding: this.settings.encoding,
      encodingQuality: this.settings.encodingQuality,
      timeStamp: opt.timeStamp || getTimeStamp(),
      totalFrames: isFinite(this.props.totalFrames)
        ? Math.max(0, this.props.totalFrames)
        : 1000,
    };
  }

  exportFrame(opt = {}) {
    if (!this.sketch) return Promise.all([]);
    if (typeof this.sketch.preExport === "function") {
      this.sketch.preExport();
    }

    // Options for export function
    let exportOpts = this._createExportOptions(opt);

    const client = getClientAPI();
    let p = Promise.resolve();
    if (client && opt.commit && typeof client.commit === "function") {
      const commitOpts = assign({}, exportOpts);
      const hash = client.commit(commitOpts);
      if (isPromise(hash)) p = hash;
      else p = Promise.resolve(hash);
    }

    return p
      .then((hash) => {
        return this._doExportFrame(
          assign({}, exportOpts, { hash: hash || "" })
        );
      })
      .then((result) => {
        // Most common usecase is to export a single layer,
        // so let's optimize the user experience for that.
        if (result.length === 1) return result[0];
        else return result;
      });
  }

  _doExportFrame(exportOpts = {}) {
    this._props.exporting = true;

    // Resize to output resolution
    this.resize();

    // Draw at this output resolution
    let drawResult = this.render();

    // The self owned canvas (may be undefined...!)
    const canvas = this.props.canvas;

    // Get list of results from render
    if (typeof drawResult === "undefined") {
      drawResult = [canvas];
    }
    drawResult = [].concat(drawResult).filter(Boolean);

    // Transform the canvas/file descriptors into a consistent format,
    // and pull out any data URLs from canvas elements
    drawResult = drawResult.map((result) => {
      const hasDataObject =
        typeof result === "object" &&
        result &&
        ("data" in result || "dataURL" in result);
      const data = hasDataObject ? result.data : result;
      const opts = hasDataObject ? assign({}, result, { data }) : { data };
      if (isCanvas(data)) {
        const encoding = opts.encoding || exportOpts.encoding;
        const encodingQuality = defined(
          opts.encodingQuality,
          exportOpts.encodingQuality,
          0.95
        );
        const { dataURL, extension, type } = exportCanvas(data, {
          encoding,
          encodingQuality,
        });
        return Object.assign(opts, { dataURL, extension, type });
      } else {
        return opts;
      }
    });

    // Now return to regular rendering mode
    this._props.exporting = false;
    this.resize();
    this.render();

    // And now we can save each result
    return Promise.all(
      drawResult.map((result, i, layerList) => {
        // By default, if rendering multiple layers we will give them indices
        const curOpt = assign(
          {
            extension: "",
            prefix: "",
            suffix: "",
          },
          exportOpts,
          result,
          {
            layer: i,
            totalLayers: layerList.length,
          }
        );

        // If export is explicitly not saving, make sure nothing saves
        // Otherwise default to the layer save option, or fallback to true
        const saveParam = exportOpts.save === false ? false : result.save;
        curOpt.save = saveParam !== false;

        // Resolve a full filename from all the options
        curOpt.filename = resolveFilename(curOpt);

        // Clean up some parameters that may be ambiguous to the user
        delete curOpt.encoding;
        delete curOpt.encodingQuality;

        // Clean it up further by just removing undefined values
        for (let k in curOpt) {
          if (typeof curOpt[k] === "undefined") delete curOpt[k];
        }

        let savePromise = Promise.resolve({});
        if (curOpt.save) {
          // Whether to actually save (download) this fragment
          const data = curOpt.data;
          if (curOpt.dataURL) {
            const dataURL = curOpt.dataURL;
            savePromise = saveDataURL(dataURL, curOpt);
          } else {
            savePromise = saveFile(data, curOpt);
          }
        }
        return savePromise.then((saveResult) => {
          return Object.assign({}, curOpt, saveResult);
        });
      })
    ).then((ev) => {
      const savedEvents = ev.filter((e) => e.save);
      if (savedEvents.length > 0) {
        // Log the saved exports
        const eventWithOutput = savedEvents.find((e) => e.outputName);
        const isClient = savedEvents.some((e) => e.client);
        const isStreaming = savedEvents.some((e) => e.stream);
        let item;
        // many files, just log how many were exported
        if (savedEvents.length > 1) item = savedEvents.length;
        // in CLI, we know exact path dirname
        else if (eventWithOutput)
          item = `${eventWithOutput.outputName}/${savedEvents[0].filename}`;
        // in browser, we can only know it went to "browser download folder"
        else item = `${savedEvents[0].filename}`;
        let ofSeq = "";
        if (exportOpts.sequence) {
          const hasTotalFrames = isFinite(this.props.totalFrames);
          ofSeq = hasTotalFrames
            ? ` (frame ${exportOpts.frame + 1} / ${this.props.totalFrames})`
            : ` (frame ${exportOpts.frame})`;
        } else if (savedEvents.length > 1) {
          ofSeq = ` files`;
        }
        const client = isClient ? "canvas-sketch-cli" : "canvas-sketch";
        const action = isStreaming ? "Streaming into" : "Exported";
        console.log(
          `%c[${client}]%c ${action} %c${item}%c${ofSeq}`,
          "color: #8e8e8e;",
          "color: initial;",
          "font-weight: bold;",
          "font-weight: initial;"
        );
      }
      if (typeof this.sketch.postExport === "function") {
        this.sketch.postExport();
      }
      return ev;
    });
  }

  _wrapContextScale(cb) {
    this._preRender();
    cb(this.props);
    this._postRender();
  }

  _preRender() {
    const props = this.props;

    // Scale context for unit sizing
    if (is2DContext(props.context) && !props.p5) {
      props.context.save();
      if (this.settings.scaleContext !== false) {
        props.context.scale(props.scaleX, props.scaleY);
      }
    } else if (props.p5) {
      props.p5.scale(
        props.scaleX / props.pixelRatio,
        props.scaleY / props.pixelRatio
      );
    }
  }

  _postRender() {
    const props = this.props;

    if (is2DContext(props.context) && !props.p5) {
      props.context.restore();
    }

    // Flush by default, this may be revisited at a later point.
    // We do this to ensure toDataURL can be called immediately after.
    // Most likely browsers already handle this, so we may revisit this and
    // remove it if it improves performance without any usability issues.
    if (props.gl && this.settings.flush !== false && !props.p5) {
      props.gl.flush();
    }
  }

  tick() {
    if (this.sketch && typeof this.sketch.tick === "function") {
      this._preRender();
      this.sketch.tick(this.props);
      this._postRender();
    }
  }

  render() {
    if (this.props.p5) {
      this._lastRedrawResult = undefined;
      this.props.p5.redraw();
      return this._lastRedrawResult;
    } else {
      return this.submitDrawCall();
    }
  }

  submitDrawCall() {
    if (!this.sketch) return;

    const props = this.props;
    this._preRender();

    let drawResult;

    if (typeof this.sketch === "function") {
      drawResult = this.sketch(props);
    } else if (typeof this.sketch.render === "function") {
      drawResult = this.sketch.render(props);
    }

    this._postRender();

    return drawResult;
  }

  update(opt = {}) {
    // Currently update() is only focused on resizing,
    // but later we will support other options like switching
    // frames and such.
    const notYetSupported = ["animate"];

    Object.keys(opt).forEach((key) => {
      if (notYetSupported.indexOf(key) >= 0) {
        throw new Error(
          `Sorry, the { ${key} } option is not yet supported with update().`
        );
      }
    });

    const oldCanvas = this._settings.canvas;
    const oldContext = this._settings.context;

    // Merge new options into settings
    for (let key in opt) {
      const value = opt[key];
      if (typeof value !== "undefined") {
        // ignore undefined
        this._settings[key] = value;
      }
    }

    // Merge in time props
    const timeOpts = Object.assign({}, this._settings, opt);
    if ("time" in opt && "frame" in opt)
      throw new Error("You should specify { time } or { frame } but not both");
    else if ("time" in opt) delete timeOpts.frame;
    else if ("frame" in opt) delete timeOpts.time;
    if ("duration" in opt && "totalFrames" in opt)
      throw new Error(
        "You should specify { duration } or { totalFrames } but not both"
      );
    else if ("duration" in opt) delete timeOpts.totalFrames;
    else if ("totalFrames" in opt) delete timeOpts.duration;

    // Merge in user data without copying
    if ("data" in opt) this._props.data = opt.data;

    const timeProps = this.getTimeProps(timeOpts);
    Object.assign(this._props, timeProps);

    // If either canvas or context is changed, we should re-update
    if (
      oldCanvas !== this._settings.canvas ||
      oldContext !== this._settings.context
    ) {
      const { canvas, context } = createCanvas(this._settings);

      this.props.canvas = canvas;
      this.props.context = context;

      // Delete or add a 'gl' prop for convenience
      this._setupGLKey();

      // Re-mount the new canvas if it has no parent
      this._appendCanvasIfNeeded();
    }

    // Special case to support P5.js
    if (opt.p5 && typeof opt.p5 !== "function") {
      this.props.p5 = opt.p5;
      this.props.p5.draw = () => {
        if (this._isP5Resizing) return;
        this._lastRedrawResult = this.submitDrawCall();
      };
    }

    // Update playing state if necessary
    if ("playing" in opt) {
      if (opt.playing) this.play();
      else this.pause();
    }

    checkSettings(this._settings);

    // Draw new frame
    this.resize();
    this.render();
    return this.props;
  }

  resize() {
    const oldSizes = this._getSizeProps();

    const settings = this.settings;
    const props = this.props;

    // Recompute new properties based on current setup
    const newProps = resizeCanvas(props, settings);

    // Assign to current props
    Object.assign(this._props, newProps);

    // Now we actually update the canvas width/height and style props
    const { pixelRatio, canvasWidth, canvasHeight, styleWidth, styleHeight } =
      this.props;

    // Update canvas settings
    const canvas = this.props.canvas;
    if (canvas && settings.resizeCanvas !== false) {
      if (props.p5) {
        // P5.js specific edge case
        if (canvas.width !== canvasWidth || canvas.height !== canvasHeight) {
          this._isP5Resizing = true;
          // This causes a re-draw :\ so we ignore draws in the mean time... sorta hacky
          props.p5.pixelDensity(pixelRatio);
          props.p5.resizeCanvas(
            canvasWidth / pixelRatio,
            canvasHeight / pixelRatio,
            false
          );
          this._isP5Resizing = false;
        }
      } else {
        // Force canvas size
        if (canvas.width !== canvasWidth) canvas.width = canvasWidth;
        if (canvas.height !== canvasHeight) canvas.height = canvasHeight;
      }
      // Update canvas style
      if (isBrowser() && settings.styleCanvas !== false) {
        canvas.style.width = `${styleWidth}px`;
        canvas.style.height = `${styleHeight}px`;
      }
    }

    const newSizes = this._getSizeProps();
    let changed = !deepEqual(oldSizes, newSizes);
    if (changed) {
      this._sizeChanged();
    }
    return changed;
  }

  _sizeChanged() {
    // Send resize event to sketch
    if (this.sketch && typeof this.sketch.resize === "function") {
      this.sketch.resize(this.props);
    }
  }

  animate() {
    if (!this.props.playing) return;
    if (!isBrowser()) {
      console.error(
        "[canvas-sketch] WARN: Animation in Node.js is not yet supported"
      );
      return;
    }
    this._raf = window.requestAnimationFrame(this._animateHandler);

    let now = rightNow();

    const fps = this.props.fps;
    const frameIntervalMS = 1000 / fps;
    let deltaTimeMS = now - this._lastTime;

    const duration = this.props.duration;
    const hasDuration = typeof duration === "number" && isFinite(duration);

    let isNewFrame = true;
    const playbackRate = this.settings.playbackRate;
    if (playbackRate === "fixed") {
      deltaTimeMS = frameIntervalMS;
    } else if (playbackRate === "throttle") {
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
    let isFinished = false;
    let isLoopStart = false;

    const looping = this.settings.loop !== false;

    if (hasDuration && newTime >= duration) {
      // Re-start animation
      if (looping) {
        isNewFrame = true;
        newTime = newTime % duration;
        isLoopStart = true;
      } else {
        isNewFrame = false;
        newTime = duration;
        isFinished = true;
      }

      this._signalEnd();
    }

    if (isNewFrame) {
      this.props.deltaTime = deltaTime;
      this.props.time = newTime;
      this.props.playhead = this._computePlayhead(newTime, duration);
      const lastFrame = this.props.frame;
      this.props.frame = this._computeCurrentFrame();
      if (isLoopStart) this._signalBegin();
      if (lastFrame !== this.props.frame) this.tick();
      this.render();
      this.props.deltaTime = 0;
    }

    if (isFinished) {
      this.pause();
    }
  }

  dispatch(cb) {
    if (typeof cb !== "function")
      throw new Error("must pass function into dispatch()");
    cb(this.props);
    this.render();
  }

  mount() {
    this._appendCanvasIfNeeded();
  }

  unmount() {
    if (isBrowser()) {
      window.removeEventListener("resize", this._resizeHandler);
      this._keyboardShortcuts.detach();
    }
    if (this.props.canvas.parentElement) {
      this.props.canvas.parentElement.removeChild(this.props.canvas);
    }
  }

  _appendCanvasIfNeeded() {
    if (!isBrowser()) return;
    if (
      this.settings.parent !== false &&
      this.props.canvas &&
      !this.props.canvas.parentElement
    ) {
      const defaultParent = this.settings.parent || document.body;
      defaultParent.appendChild(this.props.canvas);
    }
  }

  _setupGLKey() {
    if (this.props.context) {
      if (isWebGLContext(this.props.context)) {
        this._props.gl = this.props.context;
      } else {
        delete this._props.gl;
      }
    }
  }

  getTimeProps(settings = {}) {
    // Get timing data
    let duration = settings.duration;
    let totalFrames = settings.totalFrames;
    const timeScale = defined(settings.timeScale, 1);
    const fps = defined(settings.fps, 24);
    const hasDuration = typeof duration === "number" && isFinite(duration);
    const hasTotalFrames =
      typeof totalFrames === "number" && isFinite(totalFrames);

    const totalFramesFromDuration = hasDuration
      ? Math.floor(fps * duration)
      : undefined;
    const durationFromTotalFrames = hasTotalFrames
      ? totalFrames / fps
      : undefined;
    if (
      hasDuration &&
      hasTotalFrames &&
      totalFramesFromDuration !== totalFrames
    ) {
      throw new Error(
        "You should specify either duration or totalFrames, but not both. Or, they must match exactly."
      );
    }

    if (
      typeof settings.dimensions === "undefined" &&
      typeof settings.units !== "undefined"
    ) {
      console.warn(
        `You've specified a { units } setting but no { dimension }, so the units will be ignored.`
      );
    }

    totalFrames = defined(totalFrames, totalFramesFromDuration, Infinity);
    duration = defined(duration, durationFromTotalFrames, Infinity);

    const startTime = settings.time;
    const startFrame = settings.frame;
    const hasStartTime = typeof startTime === "number" && isFinite(startTime);
    const hasStartFrame =
      typeof startFrame === "number" && isFinite(startFrame);

    // start at zero unless user specifies frame or time (but not both mismatched)
    let time = 0;
    let frame = 0;
    let playhead = 0;
    if (hasStartTime && hasStartFrame) {
      throw new Error(
        "You should specify either start frame or time, but not both."
      );
    } else if (hasStartTime) {
      // User specifies time, we infer frames from FPS
      time = startTime;
      playhead = this._computePlayhead(time, duration);
      frame = this._computeFrame(playhead, time, totalFrames, fps);
    } else if (hasStartFrame) {
      // User specifies frame number, we infer time from FPS
      frame = startFrame;
      time = frame / fps;
      playhead = this._computePlayhead(time, duration);
    }

    return {
      playhead,
      time,
      frame,
      duration,
      totalFrames,
      fps,
      timeScale,
    };
  }

  setup(settings = {}) {
    if (this.sketch)
      throw new Error("Multiple setup() calls not yet supported.");

    this._settings = Object.assign({}, settings, this._settings);

    checkSettings(this._settings);

    // Get initial canvas & context
    const { context, canvas } = createCanvas(this._settings);

    const timeProps = this.getTimeProps(this._settings);

    // Initial render state features
    this._props = {
      ...timeProps,
      canvas,
      context,
      deltaTime: 0,
      started: false,
      exporting: false,
      playing: false,
      recording: false,
      settings: this.settings,
      data: this.settings.data,

      // Export some specific actions to the sketch
      render: () => this.render(),
      togglePlay: () => this.togglePlay(),
      dispatch: (cb) => this.dispatch(cb),
      tick: () => this.tick(),
      resize: () => this.resize(),
      update: (opt) => this.update(opt),
      exportFrame: (opt) => this.exportFrame(opt),
      record: () => this.record(),
      play: () => this.play(),
      pause: () => this.pause(),
      stop: () => this.stop(),
    };

    // For WebGL sketches, a gl variable reads a bit better
    this._setupGLKey();

    // Trigger initial resize now so that canvas is already sized
    // by the time we load the sketch
    this.resize();
  }

  loadAndRun(canvasSketch, newSettings) {
    return this.load(canvasSketch, newSettings).then(() => {
      this.run();
      return this;
    });
  }

  unload() {
    this.pause();
    if (!this.sketch) return;
    if (typeof this.sketch.unload === "function") {
      this._wrapContextScale((props) => this.sketch.unload(props));
    }
    this._sketch = null;
  }

  destroy() {
    this.unload();
    this.unmount();
  }

  load(createSketch, newSettings) {
    // User didn't specify a function
    if (typeof createSketch !== "function") {
      throw new Error(
        "The function must take in a function as the first parameter. Example:\n  canvasSketcher(() => { ... }, settings)"
      );
    }

    if (this.sketch) {
      this.unload();
    }

    if (typeof newSettings !== "undefined") {
      this.update(newSettings);
    }

    // This is a bit of a tricky case; we set up the auto-scaling here
    // in case the user decides to render anything to the context *before* the
    // render() function... However, users should instead use begin() function for that.
    this._preRender();

    let preload = Promise.resolve();

    // Because of P5.js's unusual structure, we have to do a bit of
    // library-specific changes to support it properly.
    if (this.settings.p5) {
      if (!isBrowser()) {
        throw new Error(
          "[canvas-sketch] ERROR: Using p5.js in Node.js is not supported"
        );
      }
      preload = new Promise((resolve) => {
        let P5Constructor = this.settings.p5;
        let preload;
        if (P5Constructor.p5) {
          preload = P5Constructor.preload;
          P5Constructor = P5Constructor.p5;
        }

        // The sketch setup; disable loop, set sizing, etc.
        const p5Sketch = (p5) => {
          // Hook in preload if necessary
          if (preload) p5.preload = () => preload(p5);
          p5.setup = () => {
            const props = this.props;
            const isGL = this.settings.context === "webgl";
            const renderer = isGL ? p5.WEBGL : p5.P2D;
            p5.noLoop();
            p5.pixelDensity(props.pixelRatio);
            p5.createCanvas(
              props.viewportWidth,
              props.viewportHeight,
              renderer
            );
            if (isGL && this.settings.attributes) {
              p5.setAttributes(this.settings.attributes);
            }

            this.update({
              p5,
              canvas: p5.canvas,
              context: p5._renderer.drawingContext,
            });
            resolve();
          };
        };

        // Support global and instance P5.js modes
        if (typeof P5Constructor === "function") {
          new P5Constructor(p5Sketch);
        } else {
          if (typeof window.createCanvas !== "function") {
            throw new Error(
              "{ p5 } setting is passed but can't find p5.js in global (window) scope. Maybe you did not create it globally?\nnew p5(); // <-- attaches to global scope"
            );
          }
          p5Sketch(window);
        }
      });
    }

    return preload
      .then(() => {
        // Load the user's sketch
        let loader = createSketch(this.props);
        if (!isPromise(loader)) {
          loader = Promise.resolve(loader);
        }
        return loader;
      })
      .then((sketch) => {
        if (!sketch) sketch = {};
        this._sketch = sketch;

        // Once the sketch is loaded we can add the events
        if (isBrowser()) {
          this._keyboardShortcuts.attach();
          window.addEventListener("resize", this._resizeHandler);
        }

        this._postRender();

        // The initial resize() in the constructor will not have
        // triggered a resize() event on the sketch, since it was before
        // the sketch was loaded. So we send the signal here, allowing
        // users to react to the initial size before first render.
        this._sizeChanged();
        return this;
      })
      .catch((err) => {
        console.warn(
          "Could not start sketch, the async loading function rejected with an error:\n    Error: " +
            err.message
        );
        throw err;
      });
  }
}

export default SketchManager;
