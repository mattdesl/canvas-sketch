import SketchManager from './core/SketchManager';

export default async function canvasSketch (sketch, settings = {}) {
  const manager = new SketchManager();

  manager.update(settings);
  manager.mount();
  await manager.load();
  manager.start();

  return manager;
}
