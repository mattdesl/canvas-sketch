import test from "ava";
import canvasSketch from "../dist/canvasSketch.js";
import { JSDOM } from "jsdom";
import { path as d3Path } from "d3-path";

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

test("should get props", async t => {
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

function createMockSettings() {
  return {
    window: createMockWindow(),
    canvas: createMockCanvas()
  };
}

function createMockWindow() {
  const jsdom = new JSDOM("<!doctype html><html><body></body></html>");
  const { window } = jsdom;
  return window;
}

function createMockCanvas() {
  const ctx = d3Path();
  const canvas = {
    width: 300,
    height: 100,
    style: {},
    getContext() {
      return ctx;
    }
  };
  ctx.canvas = canvas;
  return canvas;
}
