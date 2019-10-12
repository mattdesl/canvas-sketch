import SketchManager from "./SketchManager";
const noop = () => {};

export default async function canvasSketch(sketch, settings = {}) {
  const manager = new SketchManager();
  await manager.load(sketch, settings);
  return manager;
}
