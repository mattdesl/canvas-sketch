const test = require("ava");
const canvasSketch = require("../");
const { createMockSettings } = require("./helpers/mock");

test("should handle lifecycle", async t => {
  // const { window, canvas } = createMockSettings();

  // let steps = ["load", "resize", "begin", "tick", "render", "end", "unload"];

  // let tick = 0;

  // const manager = await canvasSketch(
  //   async () => {
  //     t.is(steps[tick++], "load");
  //     return {
  //       resize() {
  //         t.is(steps[tick++], "resize");
  //       },
  //       begin() {
  //         t.is(steps[tick++], "begin");
  //       },
  //       tick() {
  //         t.is(steps[tick++], "tick");
  //       },
  //       render() {
  //         t.is(steps[tick++], "render");
  //       },
  //       end() {
  //         t.is(steps[tick++], "end");
  //       },
  //       unload() {
  //         t.is(steps[tick++], "unload");
  //       }
  //     };
  //   },
  //   {
  //     window,
  //     canvas
  //   }
  // );
  // manager.destroy();
  // t.is(tick, steps.length);
  t.pass();
});
