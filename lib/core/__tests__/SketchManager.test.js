import SketchManager from '../SketchManager';

let manager;

beforeEach(() => {
  manager = new SketchManager();
});

// afterEach(() => {
//   manager.destroy();
// });

describe('SketchManager', () => {
  it('constructor', () => {
    expect(manager.props).toEqual({});
    expect(manager.settings).toEqual({});
    expect(manager.sketch).toBeUndefined();
  });

  describe('load', () => {
    it('calls createSketch function', () => {
      const loaderFn = jest.fn();
      const createSketch = jest.fn(() => loaderFn);
      return manager.load(createSketch).then(() => {
        expect(createSketch).toBeCalled();
      });
    });

    it('returns SketchManager', () => {
      const createSketch = () => ({});
      return manager.load(createSketch).then(loaded => {
        expect(loaded).toBeInstanceOf(SketchManager);
      });
    });

    it('sets createSketch return value as SketchManager.sketch', () => {
      const sketch = 'foo';
      const createSketch = () => sketch;
      return manager.load(createSketch).then(loaded => {
        expect(loaded.sketch).toBe('foo');
      });
    });

    it('sets empty object as SketchManager.sketch if createSketch returns nothing', () => {
      const createSketch = () => {};
      return manager.load(createSketch).then(loaded => {
        expect(loaded.sketch).toEqual({});
      });
    });

    it('unloads existing sketch, adds new sketch to SketchManager', () => {
      const unload = jest.fn();
      let firstSketch;
      const createSketch = () => ({ unload });
      return manager
        .load(createSketch)
        .then(loaded => {
          expect(unload).not.toBeCalled();
          firstSketch = loaded.sketch;
          return manager.load(createSketch);
        })
        .then(loaded => {
          expect(unload).toBeCalled();
          expect(loaded.sketch).not.toBe(firstSketch);
          expect(loaded.sketch).toEqual(createSketch());
        });
    });

    it('calls sketch.resize on initial load', () => {
      const resize = jest.fn();
      const createSketch = () => ({ resize });
      return manager.load(createSketch).then(loaded => {
        expect(resize).toBeCalledWith({});
      });
    });

    it.todo('updates with newSettings if provided');
    it.todo('adds event listeners if in browser');

    it('throws if no createSketch provided', () => {
      expect(() => manager.load()).toThrow(/must take in a function as the first parameter/i);
    });
  });
});
