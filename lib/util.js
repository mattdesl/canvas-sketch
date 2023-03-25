// TODO: We can remove a huge chunk of bundle size by using a smaller
// utility module for converting units.
import isDOM from "is-dom";

export function getClientAPI() {
  return typeof window !== "undefined" && window["canvas-sketch-cli"];
}

export function defined() {
  for (let i = 0; i < arguments.length; i++) {
    if (arguments[i] != null) {
      return arguments[i];
    }
  }
  return undefined;
}

export function isBrowser() {
  return typeof document !== "undefined";
}

export function isWebGLContext(ctx) {
  return (
    ctx &&
    typeof ctx.clear === "function" &&
    typeof ctx.clearColor === "function" &&
    typeof ctx.bufferData === "function"
  );
}

export function is2DContext(ctx) {
  return (
    ctx &&
    typeof ctx.save === "function" &&
    typeof ctx.scale === "function" &&
    typeof ctx.restore === "function"
  );
}

export function isCanvas(element) {
  return (
    isDOM(element) &&
    /canvas/i.test(element.nodeName) &&
    typeof element.getContext === "function"
  );
}
