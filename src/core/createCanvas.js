import { isBrowser } from "../util/env";

function getCanvasContext(canvas, type, attributes = {}) {
  if (typeof type !== "string") {
    throw new TypeError(
      `The { context } type must be a string, or a CanvasRenderingContext`
    );
  }

  var gl;
  try {
    var names = [type];
    // prefix GL contexts
    if (type.indexOf("webgl") === 0) {
      names.push("experimental-" + type);
    }

    for (var i = 0; i < names.length; i++) {
      gl = canvas.getContext(names[i], attributes);
      if (gl) return gl;
    }
  } catch (e) {
    gl = null;
  }
  return gl || null; // ensure null on fail
}

function createCanvasElement(document) {
  return document.createElement("canvas");
}

export default function createCanvas(settings = {}) {
  let context, canvas;
  let ownsCanvas = false;
  if (settings.canvas !== false) {
    // Determine the canvas and context to create
    context = settings.context;
    if (!context || typeof context === "string") {
      let newCanvas = settings.canvas;
      if (!newCanvas) {
        const globalWindow = typeof window !== "undefined" ? window : null;
        const curWindow = settings.window || globalWindow;
        if (curWindow == null || curWindow.document == null) {
          throw new Error(
            "It appears you are runing from Node.js or a non-browser environment. Try passing in an existing { canvas } interface instead."
          );
        }
        newCanvas = curWindow.document.createElement("canvas");
        ownsCanvas = true;
      }
      const type = context || "2d";
      if (typeof newCanvas.getContext !== "function") {
        throw new Error(
          `The specified { canvas } element does not have a getContext() function, maybe it is not a <canvas> tag?`
        );
      }
      context = getCanvasContext(newCanvas, type, settings.contextAttributes);
      if (!context) {
        throw new Error(
          `Failed at canvas.getContext('${type}') - the browser may not support this context, or a different context may already be in use with this canvas.`
        );
      }
    }

    canvas = context.canvas;
    // Ensure context matches user's canvas expectations
    if (settings.canvas && canvas !== settings.canvas) {
      throw new Error(
        "The { canvas } and { context } settings must point to the same underlying canvas element"
      );
    }

    // Apply pixelation to canvas if necessary, this is mostly a convenience utility
    if (settings.pixelated) {
      context.imageSmoothingEnabled = false;
      context.mozImageSmoothingEnabled = false;
      context.oImageSmoothingEnabled = false;
      context.webkitImageSmoothingEnabled = false;
      context.msImageSmoothingEnabled = false;
      if (canvas.style) {
        canvas.style["image-rendering"] = "pixelated";
      }
    }
  }
  return { canvas, context, ownsCanvas };
}
