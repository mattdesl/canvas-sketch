import paperSizes from './paper-sizes';
import convertLength from 'convert-length';

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
  return convertLength(dimension, unitsFrom, unitsTo, {
    pixelsPerInch,
    precision: 4,
    roundPixel: true
  });
}
