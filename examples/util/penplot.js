const defined = require('defined');
const convertUnits = require('convert-units');

// 96 DPI for SVG programs like Inkscape etc
const TO_PX = 35.43307;
const DEFAULT_SVG_LINE_WIDTH = 0.03;

function cm (value, unit) {
  return convertUnits(value).from(unit).to('cm');
}

module.exports.exportPolylines = exportPolylines;
function exportPolylines (polylines, opt = {}) {
  const dimensions = opt.dimensions;
  if (!dimensions) throw new TypeError('must specify dimensions currently');
  if (!opt.units || typeof opt.units !== 'string') throw new TypeError('must specify { units } string as well as dimensions, such as: { units: "in" }');
  const units = opt.units.toLowerCase();
  if (units === 'px') throw new Error('px units are not yet supported by this function, your print should be defined in "cm" or "in"');
  const decimalPlaces = 5;

  let commands = [];
  polylines.forEach(line => {
    line.forEach((point, j) => {
      const type = (j === 0) ? 'M' : 'L';
      const x = (TO_PX * cm(point[0], units)).toFixed(decimalPlaces);
      const y = (TO_PX * cm(point[1], units)).toFixed(decimalPlaces);
      commands.push(`${type} ${x} ${y}`);
    });
  });

  const svgPath = commands.join(' ');
  const dimensionsInCM = dimensions.map(d => cm(d, units));
  const viewWidth = (dimensionsInCM[0] * TO_PX).toFixed(decimalPlaces);
  const viewHeight = (dimensionsInCM[1] * TO_PX).toFixed(decimalPlaces);
  const fillStyle = opt.fillStyle || 'none';
  const strokeStyle = opt.strokeStyle || 'black';
  const lineWidth = defined(opt.lineWidth, DEFAULT_SVG_LINE_WIDTH);

  const data = `<?xml version="1.0" standalone="no"?>
  <!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" 
    "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">
  <svg width="${dimensionsInCM[0]}cm" height="${dimensionsInCM[1]}cm"
       xmlns="http://www.w3.org/2000/svg" version="1.1" viewBox="0 0 ${viewWidth} ${viewHeight}">
   <g>
     <path d="${svgPath}" fill="${fillStyle}" stroke="${strokeStyle}" stroke-width="${lineWidth}cm" />
   </g>
</svg>`;
  return { data, extension: '.svg' };
}
