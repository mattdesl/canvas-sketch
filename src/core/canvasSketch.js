import SketchManager from "./SketchManager";

export default async function canvasSketchCore(sketch, settings = {}) {
  const manager = new SketchManager();
  if (sketch) {
    await manager.load(sketch, settings);
  }
  return manager;
}
