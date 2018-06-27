import convertUnits from 'convert-units';
import isDOM from 'is-dom';

const availableUnits = [ 'px', 'm', 'cm', 'mm', 'in', 'ft' ];

export function getClientAPI () {
  return window['canvas-sketch-cli'];
}

export function isWebGLContext (ctx) {
  return typeof ctx.clear === 'function' && typeof ctx.clearColor === 'function' && typeof ctx.bufferData === 'function';
}

export function inchesToPixels (inches, pixelsPerInch = 72) {
  return Math.round(pixelsPerInch * inches);
}

export function toPixels (dimension, units, pixelsPerInch = 72) {
  if (typeof units !== 'string') throw new Error("Invalid unit type, must be a string like 'cm' or 'in'");
  if (units === 'px') return dimension;
  if (availableUnits.includes(units)) {
    // TODO: We can remove a huge chunk of bundle size by using a smaller
    // utility module for converting units.
    const inches = convertUnits(dimension).from(units).to('in');
    return inchesToPixels(inches, pixelsPerInch);
  } else {
    throw new Error(`Unsupported unit ${units}, try one of the following: m, cm, mm, in, ft`);
  }
}

export function isCanvas (element) {
  return isDOM(element) && /canvas/i.test(element.nodeName) && typeof element.getContext === 'function';
}
