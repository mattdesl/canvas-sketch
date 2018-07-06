import convertUnits from 'convert-units';
import paperSizes from './paper-sizes';

const availableUnits = [ 'px', 'm', 'cm', 'mm', 'in', 'km', 'ft' ];

function roundFractional (n) {
  return parseFloat(n.toFixed(4));
}

export function inchesToPixels (inches, pixelsPerInch = 72) {
  return Math.round(pixelsPerInch * inches);
}

export function getDimensionsFromPreset (dimensions, unitsTo = 'px', pixelsPerInch = 72) {
  if (typeof dimensions === 'string') {
    const key = dimensions.toLowerCase();
    if (!(key in paperSizes)) {
      throw new Error(`The dimension preset "${dimensions}" is not supported or could not be found; try using a4, a3, postcard, letter, etc.`)
    }
    const preset = paperSizes[key];
    return preset.dimensions.map(d => {
      return convertDistance(d, preset.units, unitsTo, pixelsPerInch);
    });
  } else {
    return dimensions;
  }
}

export function convertDistance (dimension, unitsFrom = 'px', unitsTo = 'px', pixelsPerInch = 72) {
  if (unitsFrom === unitsTo) return dimension;

  if (unitsTo === 'px') {
    // Converting distance to pixels...
    return toPixels(dimension, unitsFrom, pixelsPerInch);
  } else if (unitsFrom === 'px') {
    // Converting pixels to distance...
    const inches = dimension * pixelsPerInch;
    return roundFractional(convertUnits(inches).from('in').to(unitsTo));
  }

  // Converting from measurement to another measurement
  if (availableUnits.includes(unitsFrom) && availableUnits.includes(unitsTo)) {
    return roundFractional(convertUnits(dimension).from(unitsFrom).to(unitsTo));
  } else {
    throw new Error(`Unsupported unit specified, try one of the following: m, cm, mm, in, ft`);
  }
}

export function toPixels (dimension, units, pixelsPerInch = 72) {
  if (typeof units !== 'string') throw new Error("Invalid unit type, must be a string like 'cm' or 'in'");
  if (units === 'px') return dimension;
  if (availableUnits.includes(units)) {
    const inches = convertUnits(dimension).from(units).to('in');
    return inchesToPixels(inches, pixelsPerInch);
  } else {
    throw new Error(`Unsupported unit ${units}, try one of the following: m, cm, mm, in, ft`);
  }
}
