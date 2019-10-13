import Props from "./props/Props";
import { getWindow } from "../util/env";
// import createLoop from "../loop/createLoop";
import raf from "raf";
import rightNow from "right-now";
import { safelyAwait } from "../util/async";

export default class SketchManager {
  constructor() {
    this._sketch = undefined;
    this._props = null;
    this._raf = null;
    this._animateHandler = () => this._animate();
    this.actions = {};
  }

  get sketch() {
    return this._sketch;
  }

  get props() {
    return this._props ? this._props.state : undefined;
  }

  get settings() {
    return this._props ? this._props.settings : undefined;
  }

  async load(sketchLoader, settings = {}) {
    if (typeof sketchLoader !== "function") {
      throw new Error(`You must specify a "sketch" function to canvasSketch, for example:

 const sketch = () => {
   return ({ context, width, height }) => {
     // ... render your content
   };
 };`);
    }

    // First we unload any previous sketch
    if (this.sketch) await this.unload();

    // Now we setup the sketch initially,
    // this will create a new canvas if necessary
    this._props = new Props(this.actions, settings);

    // Set the initial size on the canvas
    this._props.resize();

    // mount the canvas
    this.mount();

    // This is a bit of a tricky case; we set up the auto-scaling here
    // in case the user decides to render anything to the context *before* the
    // render() function...
    // Users are recommended to use begin() event instead for this sort of thing.
    this._preRender();

    // Now load the sketch and get the result
    const sketchResult = await safelyAwait(sketchLoader, this.props);
    this._sketch = sketchResult || {};

    // Finish rendering
    this._postRender();

    // Trigger an initial resize event
    this._sizeChanged();

    // Steps the frame forward by one
    this.stepFrame(1);

    // Start playing
    if (this.settings.playing !== false) {
      this.play();
    }
  }

  play() {
    if (!this.sketch) {
      return;
    }

    // Check if we are animated or not
    let animate = this.settings.animate;
    if ("animation" in this.settings) {
      animate = true;
      console.warn(
        "[canvas-sketch] { animation } has been renamed to { animate }"
      );
    }

    // Before we start rendering, trigger a begin
    // event if we aren't considered started already
    if (!this.props.started) {
      this._signalBegin();
      this.props.started = true;
    }

    if (animate && !this.props.playing) {
      this.props.playing = true;
      this._cancelRaf();
      this._lastTime = rightNow();
      this._raf = raf(this._animateHandler);
    }
  }

  pause() {
    this._loop.pause();
  }

  togglePlay() {
    this._loop.togglePlay();
  }

  stop() {
    this._loop.stop();
  }

  stepFrame(relative = 1) {}

  render() {
    if (!this.sketch) return;
    this._preRender();
    let result;
    if (typeof this.sketch === "function") {
      result = this.sketch(props);
    } else if (typeof this.sketch.render === "function") {
      result = this.sketch.render(props);
    }
    this._postRender();
    return result;
  }

  update(newSettings = {}) {}

  resize() {
    // Tell the props to update their values
    // Return true if the canvas requires a re-draw
    const sizeChanged = this._props.resize();
    if (sizeChanged) {
      this._sizeChanged();
      this.render();
    }
    return sizeChanged;
  }

  mount() {
    const { parent } = this.settings;
    const { canvas } = this.props;

    // Mount to current window or document body
    const curWindow = getWindow(this.settings);
    if (canvas && !canvas.parentElement) {
      let defaultParent = parent;
      if (!defaultParent && curWindow && curWindow.document) {
        defaultParent = curWindow.document.body;
      }
      if (defaultParent && typeof defaultParent.appendChild === "function") {
        defaultParent.appendChild(canvas);
      }
    }
  }

  unmount() {
    const curWindow = getWindow(this.settings);
    if (curWindow && typeof curWindow.removeEventListener === "function") {
      curWindow.removeEventListener("resize", this._resizeHandler);
    }

    const { canvas } = this.props;
    if (
      canvas.parentElement &&
      typeof canvas.parentElement.removeChild === "function"
    ) {
      canvas.parentElement.removeChild(canvas);
    }
  }

  async unload() {}

  async destroy() {
    await this.unload();
    this.unmount();
  }

  _animate() {}

  _cancelRaf() {
    if (this._raf != null) {
      raf.cancel(this._raf);
      this._raf = null;
    }
  }

  _preRender() {
    const props = this.props;

    // Scale context for unit sizing
    if (!props.gl && props.context) {
      props.context.save();
      if (this.settings.scaleContext !== false) {
        props.context.scale(props.scaleX, props.scaleY);
      }
    }
  }

  _postRender() {
    const props = this.props;

    if (!props.gl && props.context) {
      props.context.restore();
    }

    // Flush by default, this may be revisited at a later point.
    // We do this to ensure toDataURL can be called immediately after.
    // Most likely browsers already handle this, so we may revisit this and
    // remove it if it improves performance without any usability issues.
    if (props.gl && this.settings.flush !== false) {
      props.gl.flush();
    }
  }

  _sizeChanged() {
    if (typeof this.sketch.resize === "function") {
      this.sketch.resize(this.props);
    }
  }

  _wrapContextScale(cb) {
    this._preRender();
    cb(this.props);
    this._postRender();
  }

  _signalBegin() {
    if (typeof this.sketch.begin === "function") {
      this._wrapContextScale(props => this.sketch.begin(props));
    }
  }

  _signalEnd() {
    if (typeof this.sketch.end === "function") {
      this._wrapContextScale(props => this.sketch.end(props));
    }
  }
}

/*
await load()
mount()
*/
