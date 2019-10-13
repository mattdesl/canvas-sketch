const test = require("ava");
const canvasSketch = require("../");
const { createMockSettings } = require("./helpers/mock");

test("should mount canvas", async t => {
  const { window, canvas } = createMockSettings();

  const manager = await canvasSketch(() => {}, {
    window,
    canvas
  });

  t.is(window.document.body.childNodes[0], canvas);

  manager.unmount();
  t.is(window.document.body.childNodes.length, 0);

  t.pass();
});
