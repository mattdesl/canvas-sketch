import createCanvas from '../createCanvas';

describe('createCanvas', () => {
  it('returns values by default', () => {
    const { canvas, context, ownsCanvas } = createCanvas();
    expect(canvas).toBeInstanceOf(HTMLCanvasElement);
    expect(context.canvas).toEqual(canvas);
    expect(typeof context.createPattern).toBe('function');
    expect(typeof context.drawImage).toBe('function');
    // ownsCanvas is true if no canvas is provided
    expect(ownsCanvas).toBe(true);
  });

  it('uses canvas element if provided', () => {
    const myCanvas = document.createElement('canvas');
    const { canvas, context, ownsCanvas } = createCanvas({ canvas: myCanvas });
    expect(canvas).toBeInstanceOf(HTMLCanvasElement);
    expect(context.canvas).toEqual(canvas);
    expect(typeof context.createPattern).toBe('function');
    expect(typeof context.drawImage).toBe('function');
    expect(ownsCanvas).toBe(false);
  });

  it('assigns attributes to canvas', () => {
    const attributes = { height: 50, width: 50 };
    const { canvas, context, ownsCanvas } = createCanvas({ attributes });
    expect(canvas.height).toEqual(50);
    expect(canvas.width).toEqual(50);
  });

  it('returns empty values if settings.canvas === false', () => {
    const { canvas, context, ownsCanvas } = createCanvas({ canvas: false });
    expect(canvas).toBeUndefined();
    expect(context).toBeUndefined();
    expect(ownsCanvas).toBe(false);
  });

  it('returns pixelated canvas if settings.pixelated is true', () => {
    const { canvas, context, ownsCanvas } = createCanvas({ pixelated: true });
    expect(context.imageSmoothingEnabled).toBe(false);
    expect(context.mozImageSmoothingEnabled).toBe(false);
    expect(context.oImageSmoothingEnabled).toBe(false);
    expect(context.webkitImageSmoothingEnabled).toBe(false);
    expect(context.msImageSmoothingEnabled).toBe(false);
    expect(canvas.style['image-rendering']).toBe('pixelated');
  });

  describe('Error cases', () => {
    it('throws if invalid context type', () => {
      expect(() => createCanvas({ canvas: 'invalid-canvas' })).toThrow(
        'The specified { canvas } element does not have a getContext() function'
      );
    });

    it('throws if invalid context type', () => {
      expect(() => createCanvas({ context: 'invalid-type' })).toThrow(
        "Failed at canvas.getContext('invalid-type')"
      );
    });
  });
});
