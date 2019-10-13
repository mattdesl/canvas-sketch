const test = require("ava");
const canvasSketch = require("../");
const { createMockSettings } = require("./helpers/mock");

test("should load async sketch", async t => {
  let done = false;
  const renderFn = () => {};
  const mySketch = new Promise(resolve => {
    setTimeout(() => {
      done = true;
      resolve(renderFn);
    }, 1000);
  });
  const sketch = () => {
    return mySketch;
  };
  const manager = await canvasSketch(sketch, {
    ...createMockSettings()
  });
  t.deepEqual(done, true);
  t.is(manager.sketch, renderFn);
  t.pass();
});

test("fullscreen size", async t => {
  const sketch = () => {};

  const { window, canvas } = createMockSettings();
  window.innerWidth = 723;
  window.innerHeight = 423;
  window.devicePixelRatio = 2;
  const manager = await canvasSketch(sketch, {
    window,
    canvas
  });
  t.deepEqual(manager.props.width, 723);
  t.deepEqual(manager.props.height, 423);
  t.deepEqual(manager.props.canvasWidth, 723 * 2);
  t.deepEqual(manager.props.canvasHeight, 423 * 2);
  t.deepEqual(manager.props.styleWidth, 723);
  t.deepEqual(manager.props.styleHeight, 423);
  t.deepEqual(manager.props.viewportWidth, 723);
  t.deepEqual(manager.props.viewportHeight, 423);
  t.deepEqual(manager.props.pixelsPerInch, 72);
  t.deepEqual(manager.props.pixelRatio, 2);
  t.deepEqual(manager.props.units, "px");
  canvasSizesEqual(t, manager);
  t.pass();
});

test("dimensions size", async t => {
  const sketch = () => {};

  const { window, canvas } = createMockSettings();
  window.innerWidth = 1000;
  window.innerHeight = 1000;
  window.devicePixelRatio = 2;
  const manager = await canvasSketch(sketch, {
    window,
    canvas,
    dimensions: [700, 500]
  });
  t.deepEqual(manager.props.width, 700);
  t.deepEqual(manager.props.height, 500);
  t.deepEqual(manager.props.canvasWidth, 700);
  t.deepEqual(manager.props.canvasHeight, 500);
  t.deepEqual(manager.props.styleWidth, 700);
  t.deepEqual(manager.props.styleHeight, 500);
  t.deepEqual(manager.props.viewportWidth, 700);
  t.deepEqual(manager.props.viewportHeight, 500);
  t.deepEqual(manager.props.pixelsPerInch, 72);
  t.deepEqual(manager.props.pixelRatio, 1);
  t.deepEqual(manager.props.units, "px");
  canvasSizesEqual(t, manager);
  t.pass();
});

test("dimensions size preset", async t => {
  const sketch = () => {};

  const { window, canvas } = createMockSettings();
  window.innerWidth = 1000;
  window.innerHeight = 1000;
  window.devicePixelRatio = 1.5;
  const manager = await canvasSketch(sketch, {
    window,
    canvas,
    scaleToFitPadding: 20,
    pixelsPerInch: 300,
    orientation: "landscape",
    units: "cm",
    dimensions: "A4"
  });
  t.deepEqual(manager.props.width, 29.7);
  t.deepEqual(manager.props.height, 21);
  t.deepEqual(manager.props.canvasWidth, 3508);
  t.deepEqual(manager.props.canvasHeight, 2480);
  t.deepEqual(manager.props.styleWidth, 960);
  t.deepEqual(manager.props.styleHeight, 679);
  t.deepEqual(manager.props.viewportWidth, 3508);
  t.deepEqual(manager.props.viewportHeight, 2480);
  t.deepEqual(manager.props.pixelsPerInch, 300);
  t.deepEqual(manager.props.pixelRatio, 1);
  t.deepEqual(manager.props.units, "cm");
  canvasSizesEqual(t, manager);
  t.pass();
});

test("dimensions size preset scale to view", async t => {
  const sketch = () => {};

  const { window, canvas } = createMockSettings();
  window.innerWidth = 1000;
  window.innerHeight = 1000;
  window.devicePixelRatio = 1.5;
  const manager = await canvasSketch(sketch, {
    window,
    canvas,
    scaleToFitPadding: 10,
    pixelsPerInch: 300,
    orientation: "landscape",
    scaleToView: true,
    units: "cm",
    dimensions: "A4"
  });
  t.deepEqual(manager.props.width, 29.7);
  t.deepEqual(manager.props.height, 21);
  t.deepEqual(manager.props.canvasWidth, 1470);
  t.deepEqual(manager.props.canvasHeight, 1040);
  t.deepEqual(manager.props.styleWidth, 980);
  t.deepEqual(manager.props.styleHeight, 693);
  t.deepEqual(manager.props.viewportWidth, 980);
  t.deepEqual(manager.props.viewportHeight, 693);
  t.deepEqual(manager.props.pixelsPerInch, 300);
  t.deepEqual(manager.props.pixelRatio, 1.5);
  t.deepEqual(manager.props.units, "cm");
  canvasSizesEqual(t, manager);
  t.pass();
});

test("dimensions size alt units", async t => {
  const sketch = () => {};

  const { window, canvas } = createMockSettings();
  window.innerWidth = 1000;
  window.innerHeight = 1000;
  window.devicePixelRatio = 2;
  const manager = await canvasSketch(sketch, {
    window,
    canvas,
    scaleToFitPadding: 5,
    units: "in",
    pixelsPerInch: 100,
    dimensions: [12, 5]
  });
  t.deepEqual(manager.props.width, 12);
  t.deepEqual(manager.props.height, 5);
  t.deepEqual(manager.props.canvasWidth, 1200);
  t.deepEqual(manager.props.canvasHeight, 500);
  t.deepEqual(manager.props.styleWidth, 1000 - 10);
  t.deepEqual(manager.props.styleHeight, 413);
  t.deepEqual(manager.props.viewportWidth, 1200);
  t.deepEqual(manager.props.viewportHeight, 500);
  t.deepEqual(manager.props.pixelsPerInch, 100);
  t.deepEqual(manager.props.pixelRatio, 1);
  t.deepEqual(manager.props.units, "in");
  canvasSizesEqual(t, manager);
  t.pass();
});

test("no style", async t => {
  const sketch = () => {};

  const { window, canvas } = createMockSettings();
  window.innerWidth = 1000;
  window.innerHeight = 1000;
  window.devicePixelRatio = 2;
  const manager = await canvasSketch(sketch, {
    window,
    canvas,
    scaleToFitPadding: 0,
    units: "px",
    styleCanvas: false,
    dimensions: [1000, 1000]
  });
  t.deepEqual(manager.props.width, 1000);
  t.deepEqual(manager.props.height, 1000);
  t.deepEqual(manager.props.canvasWidth, 1000);
  t.deepEqual(manager.props.canvasHeight, 1000);
  t.deepEqual(manager.props.styleWidth, 1000);
  t.deepEqual(manager.props.styleHeight, 1000);
  t.deepEqual(manager.props.canvas.width, 1000);
  t.deepEqual(manager.props.canvas.height, 1000);
  t.deepEqual(manager.props.canvas.style.width, "");
  t.deepEqual(manager.props.canvas.style.height, "");
  t.pass();
});

test("no resize", async t => {
  const sketch = () => {};

  const { window, canvas } = createMockSettings();
  window.innerWidth = 1000;
  window.innerHeight = 1000;
  window.devicePixelRatio = 2;
  const manager = await canvasSketch(sketch, {
    window,
    canvas,
    scaleToFitPadding: 0,
    units: "px",
    resizeCanvas: false,
    dimensions: [1000, 1000]
  });
  t.deepEqual(manager.props.width, 1000);
  t.deepEqual(manager.props.height, 1000);
  t.deepEqual(manager.props.canvasWidth, 1000);
  t.deepEqual(manager.props.canvasHeight, 1000);
  t.deepEqual(manager.props.styleWidth, 1000);
  t.deepEqual(manager.props.styleHeight, 1000);
  t.deepEqual(manager.props.canvas.width, 300);
  t.deepEqual(manager.props.canvas.height, 150);
  t.deepEqual(manager.props.canvas.style.width, "");
  t.deepEqual(manager.props.canvas.style.height, "");
  t.pass();
});

test("should get time props", async t => {
  const sketch = () => {};

  const { window, canvas } = createMockSettings();
  const manager = await canvasSketch(sketch, {
    window,
    canvas,
    parent: false
  });
  t.deepEqual(manager.props.canvas, canvas);
  t.deepEqual(manager.props.context, canvas.getContext("2d"));
  t.deepEqual(manager.props.fps, 30);
  t.deepEqual(manager.props.time, 0);
  t.deepEqual(manager.props.duration, Infinity);
  t.deepEqual(manager.props.playhead, 0);

  const manager2 = await canvasSketch(sketch, {
    time: 5,
    duration: 10,
    fps: 25,
    timeScale: 0.5,
    window,
    canvas,
    parent: false
  });
  t.deepEqual(manager2.props.fps, 25);
  t.deepEqual(manager2.props.frame + 1, 125); // less than 1 because we start at 0
  t.deepEqual(manager2.props.totalFrames, 250);
  t.deepEqual(manager2.props.time, 5);
  t.deepEqual(manager2.props.duration, 10);
  t.deepEqual(manager2.props.timeScale, 0.5);
  t.deepEqual(manager2.props.playhead, 0.5);

  t.pass();
});

function canvasSizesEqual(t, manager) {
  t.deepEqual(manager.props.canvas.width, manager.props.canvasWidth);
  t.deepEqual(manager.props.canvas.height, manager.props.canvasHeight);
  t.deepEqual(
    manager.props.canvas.style.width,
    `${manager.props.styleWidth}px`
  );
  t.deepEqual(
    manager.props.canvas.style.height,
    `${manager.props.styleHeight}px`
  );
}
