import canvas from '../canvas-sketch';
import SketchManager from '../core/SketchManager';

const { canvasSketch, PaperSizes } = canvas;

describe('canvasSketch', () => {
  it('returns a promise', () => {
    expect(typeof canvasSketch.canvasSketch().then).toBe('function');
  });

  it('returns SketchManager if sketch is not provided', () => {
    return canvasSketch().then(manager => {
      expect(manager).toBeInstanceOf(SketchManager);
    });
  });

  it('returns SketchManager if sketch is provided', () => {
    return canvasSketch(() => {}).then(manager => {
      expect(manager).toBeInstanceOf(SketchManager);
    });
  });
});
