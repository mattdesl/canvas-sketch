// TODO: We can remove a huge chunk of bundle size by using a smaller
// utility module for converting units.
import isDOM from 'is-dom';

export function getClientAPI () {
  return window['canvas-sketch-cli'];
}

export function isWebGLContext (ctx) {
  return typeof ctx.clear === 'function' && typeof ctx.clearColor === 'function' && typeof ctx.bufferData === 'function';
}

export function isCanvas (element) {
  return isDOM(element) && /canvas/i.test(element.nodeName) && typeof element.getContext === 'function';
}
