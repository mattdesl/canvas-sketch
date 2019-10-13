const test = require("ava");
const { Timeline } = require("../");
const { createMockSettings } = require("./helpers/mock");

test("should handle timeline and recording", async t => {
  const events = [];
  const expectedEvents = [
    "recordStart",
    "start",
    "loopStart",
    "frameSubmit",
    "loopEnd",
    "end",
    "recordEnd"
  ];
  const timeline = new Timeline({
    fps: 4,
    frame: 0,
    duration: 2,
    onLoopStart() {
      if (!events.includes("loopStart")) events.push("loopStart");
    },
    onLoopEnd() {
      if (!events.includes("loopEnd")) events.push("loopEnd");
    },
    onStart() {
      if (!events.includes("start")) events.push("start");
    },
    onEnd() {
      if (!events.includes("end")) events.push("end");
    },
    onRecordStart() {
      if (!events.includes("recordStart")) events.push("recordStart");
    },
    onRecordEnd() {
      if (!events.includes("recordEnd")) events.push("recordEnd");
    },
    onFrameSubmit(deltaTime, deltaFrames) {
      if (!events.includes("frameSubmit")) events.push("frameSubmit");
      return {
        deltaTime,
        deltaFrames,
        time: this.time,
        frame: this.frame
      };
    }
  });

  const interval = 1 / timeline.fps;
  const expectedResults = new Array(8).fill(0).map((_, i) => {
    return {
      deltaTime: i === 0 ? 0 : interval,
      deltaFrames: i === 0 ? 0 : 1,
      time: i * interval,
      frame: i
    };
  });
  const actualResults = [];

  await timeline.startRecordFrames(async result => {
    actualResults.push(result);
    await new Promise(resolve => setTimeout(resolve, 0));
  });
  t.deepEqual(expectedResults, actualResults);
  t.deepEqual(expectedEvents, events);
  t.pass();
});
