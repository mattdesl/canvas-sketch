import defined from 'defined';
import { getDimensionsFromPreset, convertDistance } from '../distances';
import { isBrowser } from '../util';

function checkIfHasDimensions (settings) {
  if (!settings.dimensions) return false;
  if (typeof settings.dimensions === 'string') return true;
  if (Array.isArray(settings.dimensions) && settings.dimensions.length >= 2) return true;
  return false;
}

function getParentSize (props, settings) {
  // When no { dimension } is passed in node, we default to HTML canvas size
  if (!isBrowser) {
    return [ 300, 150 ];
  }

  let element = settings.parent || window;

  if (element === window ||
      element === document ||
      element === document.body) {
    return [ window.innerWidth, window.innerHeight ];
  } else {
    const { width, height } = element.getBoundingClientRect();
    return [ width, height ];
  }
}

export default function resizeCanvas (props, settings) {
  let width, height;
  let styleWidth, styleHeight;
  let canvasWidth, canvasHeight;

  const dimensions = settings.dimensions;
  const hasDimensions = checkIfHasDimensions(settings);
  const exporting = props.exporting;
  const scaleToFit = hasDimensions ? settings.scaleToFit !== false : false;
  const scaleToView = (!exporting && hasDimensions) ? settings.scaleToView : true;
  const units = settings.units;
  const pixelsPerInch = (typeof settings.pixelsPerInch === 'number' && isFinite(settings.pixelsPerInch)) ? settings.pixelsPerInch : 72;
  const bleed = defined(settings.bleed, 0);

  const defaultPixelRatio = isBrowser() ? window.devicePixelRatio : 1;
  let pixelRatio = defined(settings.pixelRatio, defaultPixelRatio);
  if (typeof settings.maxPixelRatio === 'number') {
    pixelRatio = Math.min(settings.maxPixelRatio, pixelRatio);
  }

  if (!scaleToView) {
    pixelRatio = 1;
  }

  // parentWidth = typeof parentWidth === 'undefined' ? defaultNodeSize[0] : parentWidth;
  // parentHeight = typeof parentHeight === 'undefined' ? defaultNodeSize[1] : parentHeight;

  let [ parentWidth, parentHeight ] = getParentSize(props, settings);
  let trimWidth, trimHeight;

  // You can specify a dimensions in pixels or cm/m/in/etc
  if (hasDimensions) {
    const result = getDimensionsFromPreset(dimensions, units, pixelsPerInch);
    const highest = Math.max(result[0], result[1]);
    const lowest = Math.min(result[0], result[1]);
    if (settings.orientation) {
      const landscape = settings.orientation === 'landscape';
      width = landscape ? highest : lowest;
      height = landscape ? lowest : highest;
    } else {
      width = result[0];
      height = result[1];
    }

    trimWidth = width;
    trimHeight = height;

    // Apply bleed which is assumed to be in the same units
    width += bleed * 2;
    height += bleed * 2;
  } else {
    width = parentWidth;
    height = parentHeight;
    trimWidth = width;
    trimHeight = height;
  }

  // Real size in pixels after PPI is taken into account
  let realWidth = width;
  let realHeight = height;
  if (hasDimensions && units) {
    // Convert to digital/pixel units if necessary
    realWidth = convertDistance(width, units, 'px', pixelsPerInch);
    realHeight = convertDistance(height, units, 'px', pixelsPerInch);
  }

  // How big to set the 'view' of the canvas in the browser (i.e. style)
  styleWidth = Math.round(realWidth);
  styleHeight = Math.round(realHeight);

  // If we wish to scale the view to the browser window
  if (scaleToFit && !exporting && hasDimensions) {
    const aspect = width / height;
    const windowAspect = parentWidth / parentHeight;
    const scaleToFitPadding = defined(settings.scaleToFitPadding, 40);
    const maxWidth = Math.round(parentWidth - scaleToFitPadding * 2);
    const maxHeight = Math.round(parentHeight - scaleToFitPadding * 2);
    if (styleWidth > maxWidth || styleHeight > maxHeight) {
      if (windowAspect > aspect) {
        styleHeight = maxHeight;
        styleWidth = Math.round(styleHeight * aspect);
      } else {
        styleWidth = maxWidth;
        styleHeight = Math.round(styleWidth / aspect);
      }
    }
  }

  // e.g. @2x exporting for PNG sprites
  let exportPixelRatio = 1;
  if (exporting) {
    exportPixelRatio = defined(settings.exportPixelRatio, hasDimensions ? 1 : pixelRatio);
    pixelRatio = exportPixelRatio;
  }

  canvasWidth = scaleToView ? Math.round(pixelRatio * styleWidth) : Math.round(exportPixelRatio * realWidth);
  canvasHeight = scaleToView ? Math.round(pixelRatio * styleHeight) : Math.round(exportPixelRatio * realHeight);

  const viewportWidth = scaleToView ? Math.round(styleWidth) : Math.round(realWidth);
  const viewportHeight = scaleToView ? Math.round(styleHeight) : Math.round(realHeight);

  const scaleX = canvasWidth / width;
  const scaleY = canvasHeight / height;

  // Assign to current props
  return {
    bleed,
    pixelRatio,
    width,
    height,
    dimensions: [ width, height ],
    units: units || 'px',
    scaleX,
    scaleY,
    viewportWidth,
    viewportHeight,
    canvasWidth,
    canvasHeight,
    trimWidth,
    trimHeight,
    styleWidth,
    styleHeight
  };
}
