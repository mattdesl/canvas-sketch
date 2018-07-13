import assign from 'object-assign';
import getCanvasContext from 'get-canvas-context';
import { isBrowser } from '../util';

function createCanvasElement () {
  if (!isBrowser()) {
    throw new Error('It appears you are runing from Node.js or a non-browser environment. Try passing in an existing { canvas } interface instead.');
  }
  return document.createElement('canvas');
}

export default function createCanvas (settings = {}) {
  let context, canvas;
  if (settings.canvas !== false) {
    // Determine the canvas and context to create
    context = settings.context;
    if (!context || typeof context === 'string') {
      const newCanvas = settings.canvas || createCanvasElement();
      const type = context || '2d';
      context = getCanvasContext(type, assign({}, settings.attributes, { canvas: newCanvas }));
      if (!context) {
        throw new Error(`Failed at canvas.getContext('${type}') - the browser may not support this context, or a different context may already be in use with this canvas.`);
      }
    }

    canvas = context.canvas;
    // Ensure context matches user's canvas expectations
    if (settings.canvas && canvas !== settings.canvas) {
      throw new Error('The { canvas } and { context } settings must point to the same underlying canvas element');
    }

    // Apply pixelation to canvas if necessary, this is mostly a convenience utility
    if (settings.pixelated) {
      context.imageSmoothingEnabled = false;
      context.mozImageSmoothingEnabled = false;
      context.oImageSmoothingEnabled = false;
      context.webkitImageSmoothingEnabled = false;
      context.msImageSmoothingEnabled = false;
      canvas.style['image-rendering'] = 'pixelated';
    }
  }
  return { canvas, context };
}