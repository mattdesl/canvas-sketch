import raf from "raf";
import defined from "../util/defined";
import rightNow from "right-now";
import {
  secondsToFrameIndex,
  isFiniteNumber,
  frameIndexToSeconds
} from "../util/timing";
import { safelyAwait } from "../util/async";

const noop = () => {};

export default class Timeline {
  constructor(opt = {}) {
    this._raf = null;
    this.fps = defined(opt.fps, 30);
    this.timeScale = defined(opt.timeScale, 1);
    this.frame = 0;
    this.time = 0;
    this.mode = "default";
    this.loop = true;
    this.playing = false;
    this.recording = false;
    this.loopStart = undefined;
    this.loopEnd = undefined;
    this.hasLoopStarted = false;
    this.hasStarted = false;

    if (isFiniteNumber(opt.totalFrames)) this.setTotalFrames(opt.totalFrames);
    else if (isFiniteNumber(opt.duration)) this.setDuration(opt.duration);

    this.onStart = opt.onStart || noop;
    this.onEnd = opt.onEnd || noop;
    this.onLoopStart = opt.onLoopStart || noop;
    this.onLoopEnd = opt.onLoopEnd || noop;
    this.onFrameChanging = opt.onFrameChanging || noop;
    this.onFrameSubmit = opt.onFrameSubmit || noop;

    this.onRecordStart = opt.onRecordStart || noop;
    this.onRecordEnd = opt.onRecordEnd || noop;

    this._lastTime = rightNow();
    this._rafCallback = () => this._animate();
  }

  play() {
    this.playing = true;
    this._lastTime = rightNow();
    // Cancel to ensure only one instance of the loop
    // is running at a time
    this._cancelAnimationFrame();
    // Now request the loop
    this._requestAnimationFrame();
  }

  pause() {
    this.playing = false;
    this._cancelAnimationFrame();
  }

  stop() {
    this.pause();
    this.setFrame(0);
    this.hasStarted = false;
    this.hasLoopStarted = false;
  }

  restart() {
    this.setFrame(0);
  }

  setFrame(frame) {
    this.frame = frame;
    this.time = frameIndexToSeconds(this.frame, this.fps);
  }

  setTime(time) {
    this.time = time;
    // Note: this will be clamped, so setTime(duration) == max
    // Even though technically in a loop, setTime(duration) == loopStart
    this.frame = secondsToFrameIndex(this.time, this.fps, this.totalFrames);
  }

  setDuration(seconds) {
    this.duration = seconds;
    this.totalFrames = Math.floor(this.fps * seconds);
  }

  setTotalFrames(totalFrames) {
    this.totalFrames = totalFrames;
    this.duration = totalFrames / this.fps;
  }

  hasDuration() {
    return isFiniteNumber(this.duration) && isFiniteNumber(this.totalFrames);
  }

  stepByTime(deltaTime = 0) {
    let newTime = this.time + deltaTime;
    let newFrame = secondsToFrameIndex(newTime, this.fps);
    return this.step(newTime, newFrame);
  }

  stepByFrame(deltaFrames = 0) {
    let newFrame = this.frame + deltaFrames;
    let newTime = frameIndexToSeconds(newFrame, this.fps);
    return this.step(newTime, newFrame);
  }

  async startRecordFrames(cb = noop) {
    if (this.recording) return;

    this.stop();
    this.playing = true;
    this.recording = true;
    this._cancelAnimationFrame();

    let framesRendered = 0;
    const totalFrames = this.totalFrames;
    const nextFrame = async () => {
      // bailing out early
      if (!this.recording || !this.playing) return;
      // Step the frame forward and render another frame
      const nextFrameResult = this.stepByFrame(1);
      // Pass this to the callback and wait for it
      // to finish writing/saving/etc
      await safelyAwait(cb, nextFrameResult);
      framesRendered++;
      // Still going...
      if (this.playing && this.recording && framesRendered < totalFrames) {
        return this._requestAnimationFrameAsync(nextFrame).then(() =>
          nextFrame()
        );
      } else {
        this.endRecordFrames();
      }
    };

    this.onRecordStart();

    // Trigger the initial frame we are sitting on
    // by doing step with no frame increment
    const firstResult = this.init();
    await safelyAwait(cb, firstResult);
    framesRendered++;
    // Trigger all remaining frames
    await nextFrame();
  }

  endRecordFrames() {
    if (this.recording) {
      this._cancelAnimationFrame();
      this.onRecordEnd();
      this.recording = false;
      this.playing = false;
    }
  }

  init() {
    return this.step(this.time, this.frame);
  }

  step(newTime = this.time, newFrame = this.frame) {
    let oldFrame = this.frame;
    let oldTime = this.time;
    const deltaTime = newTime - oldTime;
    const deltaFrames = newFrame - oldFrame;

    // Handle Endings -> Handle Beginnings -> Draw Frame
    const hasDuration = this.hasDuration();

    const duration = this.duration;
    const totalFrames = this.totalFrames;
    const isLooping = this.loop;
    const isRecording = this.recording;
    const fps = this.fps;

    const loopStartFrame = Math.max(0, defined(this.loopStart, 0));
    const loopStartTime = frameIndexToSeconds(loopStartFrame, fps);
    const loopEndFrame = hasDuration && defined(this.loopEnd, totalFrames);
    const loopEndTime =
      hasDuration && Math.min(duration, frameIndexToSeconds(loopEndFrame, fps));

    let maxDuration = duration;
    let maxFrames = totalFrames;
    if (isRecording && isLooping) {
      maxDuration = loopEndTime;
      maxFrames = loopEndFrame;
    }

    // Only true when we actually need to stop raf loop
    let stopping = false;

    // Check loop end point before anything else
    if (hasDuration) {
      if (isLooping && !isRecording) {
        // Note: Loop end is exclusive; we only trigger this
        // when we go BEYOND the last frame, i.e. try to render
        // last frame + 1
        if (newTime >= loopEndTime || newFrame >= loopEndFrame) {
          // -- Reached the end of the loop
          // Wrap around the time
          newTime %= duration;
          newFrame = secondsToFrameIndex(newTime, fps, totalFrames);
          // Mark loop as not yet started
          this.hasLoopStarted = false;
        }
      } else if (newTime >= maxDuration || newFrame >= maxFrames - 1) {
        // -- Reached the end of the non-looping sequence (or recording)
        // In this case we hit this ON the last frame
        if (newTime > maxDuration) newTime = maxDuration;
        // Here we update the frame and also pass in total frames
        // to ensure it is clamped within the sequence
        newFrame = secondsToFrameIndex(newTime, fps, totalFrames);
        stopping = true;
      }
    }

    // Now let's consider the frame as starting
    if (!this.hasStarted) {
      this.onStart();
      this.hasStarted = true;
    }

    // And check loop start points
    if (isLooping) {
      // Loop on or beyond start point
      if (newTime >= loopStartTime || newTime >= loopStartFrame) {
        if (!this.hasLoopStarted) {
          this.onLoopStart();
          this.hasLoopStarted = true;
        }
      }
    }

    // Update timings
    this.frame = newFrame;
    this.time = newTime;

    // Notify a frame has changed
    if (this.frame !== oldFrame) {
      this.onFrameChanging(deltaTime, deltaFrames, this.frame, oldFrame);
    }

    // Trigger the 'frame' i.e. render it
    const result = this.onFrameSubmit(deltaTime, deltaFrames);

    // Finally see if we need to stop the loop
    if (stopping) {
      // Special case...
      if (isRecording && isLooping && this.hasLoopStarted) {
        this.onLoopEnd();
        this.hasLoopStarted = false;
      }
      if (this.hasStarted) {
        this.onEnd();
        this.hasStarted = false;
      }
      this.pause();
    }

    return result;
  }

  _animate() {
    this._requestAnimationFrame();
    const now = rightNow();
    const deltaTimeMS = now - this._lastTime;
    this._lastTime = now;

    this.stepByTime(deltaTime / 1000);
  }

  _requestAnimationFrame() {
    this._raf = raf(this._rafCallback);
  }

  _requestAnimationFrameAsync() {
    return new Promise(resolve => {
      this._raf = raf(resolve);
    });
  }

  _cancelAnimationFrame() {
    if (this._raf != null) {
      raf.cancel(this._raf);
      this._raf = null;
    }
  }
}
