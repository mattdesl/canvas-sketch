import canvasSketchCore from "./core/canvasSketch";
import SketchManager from "./core/SketchManager";
import Timeline from "./timeline/Timeline";

export { SketchManager, Timeline };

export default async function canvasSketch(sketch, settings = {}) {
  return canvasSketchCore(sketch, settings);
}

canvasSketch.SketchManager = SketchManager;
canvasSketch.Timeline = Timeline;
