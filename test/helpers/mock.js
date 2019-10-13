const { JSDOM } = require("jsdom");
const d3Path = require("d3-path").path;

module.exports.createMockSettings = function createMockSettings() {
  const window = module.exports.createMockWindow();
  return {
    window,
    canvas: module.exports.createMockCanvas(window.document)
  };
};

module.exports.createMockWindow = function createMockWindow() {
  const jsdom = new JSDOM("<!doctype html><html><body></body></html>");
  const { window } = jsdom;
  return window;
};

module.exports.createMockCanvas = function createMockCanvas(document) {
  const ctx = d3Path();
  ctx.save = () => {};
  ctx.restore = () => {};
  ctx.scale = () => {};
  const canvas = document.createElement("canvas");
  Object.assign(canvas, {
    width: 300,
    height: 150,
    getContext() {
      return ctx;
    }
  });
  ctx.canvas = canvas;
  return canvas;
};
