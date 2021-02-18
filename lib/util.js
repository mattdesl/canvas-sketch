import isDOM from 'is-dom';

export function getClientAPI () {
  return typeof window !== 'undefined' && window['canvas-sketch-cli'];
}

export function defined () {
  for (let i = 0; i < arguments.length; i++) {
    if (arguments[i] != null) {
      return arguments[i];
    }
  }
  return undefined;
}

export function isBrowser () {
  return typeof document !== 'undefined';
}

export function isWebGLContext (ctx) {
  return typeof ctx.clear === 'function' && typeof ctx.clearColor === 'function' && typeof ctx.bufferData === 'function';
}

export function isCanvas (element) {
  return isDOM(element) && /canvas/i.test(element.nodeName) && typeof element.getContext === 'function';
}

export function getGlobal () {
  return typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {};
}

export const rightNow = (() => {
  const global = getGlobal();
  if (global.performance && global.performance.now) {
    return function now () {
      return performance.now();
    }
  } else if (typeof process !== 'undefined') {
    return function now () {
      const time = process.hrtime()
      return time[0] * 1e3 + time[1] / 1e6
    };
  } else {
    return Date.now || function now () {
      return +new Date();
    }
  }
})();
