import createCanvas from "./createCanvas";
import resizeCanvas from "./resizeCanvas";
import defined from "../../util/defined";
import deepEqual from "deep-equal";

function isDefinedNumber(d) {
  return typeof d === "number" && isFinite(d);
}

function computePlayhead(currentTime, duration) {
  const hasDuration = isDefinedNumber(duration);
  return hasDuration ? currentTime / duration : 0;
}

function computeFrame(playhead, time, totalFrames, fps) {
  return isDefinedNumber(totalFrames) && totalFrames > 1
    ? Math.floor(playhead * (totalFrames - 1))
    : Math.floor(fps * time);
}

// 0.0  0.25  0.5  0.75
// 0    1     2    3

function getTimeProps(settings) {
  // Get timing data
  let duration = settings.duration;
  let totalFrames = settings.totalFrames;
  const timeScale = defined(settings.timeScale, 1);
  const fps = defined(settings.fps, 30);
  const hasDuration = isDefinedNumber(duration);
  const hasTotalFrames = isDefinedNumber(totalFrames);

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

  totalFrames = defined(totalFrames, totalFramesFromDuration, Infinity);
  duration = defined(duration, durationFromTotalFrames, Infinity);

  const startTime = settings.time;
  const startFrame = settings.frame;
  const hasStartTime = isDefinedNumber(startTime);
  const hasStartFrame = isDefinedNumber(startFrame);

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
    playhead = computePlayhead(time, duration);
    frame = computeFrame(playhead, time, totalFrames, fps);
  } else if (hasStartFrame) {
    // User specifies frame number, we infer time from FPS
    frame = startFrame;
    time = frame / fps;
    playhead = computePlayhead(time, duration);
  }

  return {
    playhead,
    time,
    frame,
    duration,
    totalFrames,
    fps,
    timeScale
  };
}

export default class Props {
  constructor(actions, settings) {
    this.state = {};
    Object.assign(this.state, {
      ...actions,
      deltaTime: 0,
      started: false,
      exporting: false,
      playing: false,
      recording: false
    });
    this.update(settings);
  }

  get settings() {
    return this.state.settings;
  }

  // The "significant" size props are those
  // that will cause a true canvas resize event,
  // i.e. thus clearing the canvas and requiring a re-draw.
  // Size props like styleWidth/styleHeight are not
  // significant enough to clear and re-draw the canvas.
  getSignificantSizeProps() {
    const props = this.state;
    return {
      width: props.width,
      height: props.height,
      units: props.units,
      pixelRatio: props.pixelRatio,
      pixelsPerInch: props.pixelsPerInch,
      canvasWidth: props.canvasWidth,
      canvasHeight: props.canvasHeight,
      viewportWidth: props.viewportWidth,
      viewportHeight: props.viewportHeight
    };
  }

  update(settings) {
    // get the old settings
    const oldSettings = Object.assign({}, this.settings);

    // canvas or context has changed, update both
    if (this.state.canvas && this.state.ownsCanvas) {
      // TODO: Destroy old canvas when user requests a new one?
      console.warn(
        "[canvas-sketch] You are providing a new { canvas } and/or { context } but the old one is unchanged"
      );
    }
    const canvasProps = createCanvas(settings);
    Object.assign(this.state, canvasProps);

    // update remaining time & size props
    const timeProps = getTimeProps(settings);
    const sizeProps = resizeCanvas(this.state, settings);
    Object.assign(this.state, timeProps, sizeProps);

    this.state.settings = settings;
    this.state.data = settings.data;
  }

  resize() {
    // Store the old significant size properties
    // Ignoring some like styleWidth/styleHeight which should not
    // cause a re-draw
    const oldSizes = this.getSignificantSizeProps();

    // Now get all the new props and update our state
    const newProps = resizeCanvas(this.state, this.settings);
    Object.assign(this.state, newProps);

    // Apply new canvas size from the state
    this.applyCanvasSize();

    // Get the newly adapted size properties
    const newSizes = this.getSignificantSizeProps();

    // Return true if a change occurred
    return !deepEqual(oldSizes, newSizes);
  }

  applyCanvasSize() {
    const {
      canvas,
      pixelRatio,
      canvasWidth,
      canvasHeight,
      styleWidth,
      styleHeight
    } = this.state;

    const { resizeCanvas, styleCanvas } = this.settings;

    // Update canvas settings
    if (canvas && resizeCanvas !== false) {
      // Force canvas size
      if (canvas.width !== canvasWidth) canvas.width = canvasWidth;
      if (canvas.height !== canvasHeight) canvas.height = canvasHeight;
      // Update canvas style
      if (styleCanvas !== false && canvas.style != null) {
        canvas.style.width = `${styleWidth}px`;
        canvas.style.height = `${styleHeight}px`;
      }
    }
  }
}

// TODO:
// render: () => this.render(),
// togglePlay: () => this.togglePlay(),
// dispatch: (cb) => this.dispatch(cb),
// tick: () => this.tick(),
// resize: () => this.resize(),
// update: (opt) => this.update(opt),
// exportFrame: opt => this.exportFrame(opt),
// record: () => this.record(),
// play: () => this.play(),
// pause: () => this.pause(),
// stop: () => this.stop()
