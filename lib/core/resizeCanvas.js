import { getDimensionsFromPreset, convertDistance } from '../distances';
import { isBrowser, defined } from '../util';

function checkIfHasDimensions (settings) {
  if (!settings.dimensions) return false;
  if (typeof settings.dimensions === 'string') return true;
  if (Array.isArray(settings.dimensions) && settings.dimensions.length >= 2) return true;
  return false;
}

function getParentSize (props, settings) {
  // When no { dimension } is passed in node, we default to HTML canvas size
  if (!isBrowser()) {
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

  const browser = isBrowser();
  const dimensions = settings.dimensions;
  const hasDimensions = checkIfHasDimensions(settings);
  const exporting = props.exporting;
  let scaleToFit = hasDimensions ? settings.scaleToFit !== false : false;
  let scaleToView = (!exporting && hasDimensions) ? settings.scaleToView : true;
  // in node, cancel both of these options
  if (!browser) scaleToFit = scaleToView = false;
  const units = settings.units;
  const pixelsPerInch = (typeof settings.pixelsPerInch === 'number' && isFinite(settings.pixelsPerInch)) ? settings.pixelsPerInch : 72;
  const bleed = defined(settings.bleed, 0);

  const devicePixelRatio = browser ? window.devicePixelRatio : 1;
  const basePixelRatio = scaleToView ? devicePixelRatio : 1;

  let pixelRatio, exportPixelRatio;

  // If a pixel ratio is specified, we will use it.
  // Otherwise:
  //  -> If dimension is specified, use base ratio (i.e. size for export)
  //  -> If no dimension is specified, use device ratio (i.e. size for screen)
  if (typeof settings.pixelRatio === 'number' && isFinite(settings.pixelRatio)) {
    // When { pixelRatio } is specified, it's also used as default exportPixelRatio.
    pixelRatio = settings.pixelRatio;
    exportPixelRatio = defined(settings.exportPixelRatio, pixelRatio);
  } else {
    if (hasDimensions) {
      // When a dimension is specified, use the base ratio rather than screen ratio
      pixelRatio = basePixelRatio;
      // Default to a pixel ratio of 1 so that you end up with the same dimension
      // you specified, i.e. [ 500, 500 ] is exported as 500x500 px
      exportPixelRatio = defined(settings.exportPixelRatio, 1);
    } else {
      // No dimension is specified, assume full-screen retina sizing
      pixelRatio = devicePixelRatio;
      // Default to screen pixel ratio, so that it's like taking a device screenshot
      exportPixelRatio = defined(settings.exportPixelRatio, pixelRatio);
    }
  }

  // Clamp pixel ratio
  if (typeof settings.maxPixelRatio === 'number' && isFinite(settings.maxPixelRatio)) {
    pixelRatio = Math.min(settings.maxPixelRatio, pixelRatio);
  }

  // Handle export pixel ratio
  if (exporting) {
    pixelRatio = exportPixelRatio;
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

  canvasWidth = scaleToView ? Math.round(pixelRatio * styleWidth) : Math.round(pixelRatio * realWidth);
  canvasHeight = scaleToView ? Math.round(pixelRatio * styleHeight) : Math.round(pixelRatio * realHeight);

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
    pixelsPerInch,
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
