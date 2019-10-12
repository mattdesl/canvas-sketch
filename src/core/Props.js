import createCanvas from "./createCanvas";
import defined from "../util/defined";

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
  constructor(settings) {
    const { context, canvas } = createCanvas(settings);
    const timeProps = getTimeProps(settings);
    Object.assign(this, {
      ...timeProps,
      canvas,
      context,
      deltaTime: 0,
      started: false,
      exporting: false,
      playing: false,
      recording: false,
      settings,
      data: settings.data
    });
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
