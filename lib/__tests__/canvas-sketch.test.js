/**
 * @jest-environment jsdom
 */
import canvas from '../canvas-sketch';
import SketchManager from '../core/SketchManager';
import PaperSizes from '../paper-sizes';

describe('canvasSketch', () => {
  it('returns a promise', () => {
    expect(typeof canvas.canvasSketch().then).toBe('function');
  });

  it('includes PaperSizes', () => {
    expect(canvas.PaperSizes).toBe(PaperSizes);
  });

  it('returns SketchManager if sketch is not provided', () => {
    return canvas.canvasSketch().then(manager => {
      expect(manager).toBeInstanceOf(SketchManager);
    });
  });

  it('returns SketchManager if sketch is provided', () => {
    return canvas.canvasSketch(() => {}).then(manager => {
      expect(manager).toBeInstanceOf(SketchManager);
    });
  });
});
