import Props from "./Props";

export default class SketchManager {
  constructor() {
    this._sketch = undefined;
    this._props = {};
    this._settings = {};
  }

  get sketch() {
    return this._sketch;
  }

  get props() {
    return this._props;
  }

  get settings() {
    return this._settings;
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
    this._setup(settings);

    // Then we update the props
    this.update(settings);

    // Now load the sketch and get the result
    const sketchResult = await safelyAwait(sketchLoader, this.props);
    this._sketch = sketchResult || {};
  }

  async unload() {}

  async destroy() {
    await this.unload();
    this.unmount();
  }

  mount() {}

  unmount() {}

  update(newSettings = {}) {}

  _setup(settings = {}) {
    this._settings = Object.assign({}, settings);
    this._props = new Props(this.settings);
  }
}

/*
await load()
mount()
*/

async function safelyAwait(fn, ...args) {
  const p = fn(...args);
  if (p && typeof p.then === "function") return await p;
  return p;
}
