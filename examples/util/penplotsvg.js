const defined = require('defined');
const convertUnits = require('convert-units');
var convert = require('convert-length');

// 96 DPI for SVG programs like Inkscape etc
const TO_PX = 35.43307;
var DEFAULT_PIXELS_PER_INCH = 90;
var DEFAULT_PEN_THICKNESS = 0.03;
var DEFAULT_PEN_THICKNESS_UNIT = 'cm';

function cm(value, unit) {
  return convertUnits(value)
    .from(unit)
    .to('cm');
}

function polyLinesToSvgPaths(polylines, opt = {}) {
  if (!opt.units || typeof opt.units !== 'string')
    throw new TypeError(
      'must specify { units } string as well as dimensions, such as: { units: "in" }'
    );
  const units = opt.units.toLowerCase();
  const decimalPlaces = 5;

  let commands = [];
  polylines.forEach(line => {
    line.forEach((point, j) => {
      const type = j === 0 ? 'M' : 'L';
      const x = (TO_PX * cm(point[0], units)).toFixed(decimalPlaces);
      const y = (TO_PX * cm(point[1], units)).toFixed(decimalPlaces);
      commands.push(`${type} ${x} ${y}`);
    });
  });

  return commands;
}

function arcsToSvgPaths(arcs, opt = {}) {
  if (!opt.units || typeof opt.units !== 'string')
    throw new TypeError(
      'must specify { units } string as well as dimensions, such as: { units: "in" }'
    );
  const units = opt.units.toLowerCase();
  if (units === 'px')
    throw new Error(
      'px units are not yet supported by this function, your print should be defined in "cm" or "in"'
    );

  let commands = [];
  arcs.forEach(input => {
    let arc = input.toSvgPixels(units);
    commands.push(
      `M${arc.startX} ${arc.startY} A${arc.radiusX},${arc.radiusY} ${
        arc.rotX
      } ${arc.largeArcFlag},${arc.sweepFlag} ${arc.endX},${arc.endY}`
    );
  });

  return commands;
}

function pathsToSvgFile(paths, opt = {}) {
  opt = opt || {};

  var width = opt.width;
  var height = opt.height;

  var computeBounds =
    typeof width === 'undefined' || typeof height === 'undefined';
  if (computeBounds) {
    throw new Error('Must specify "width" and "height" options');
  }

  var units = opt.units || 'px';

  var convertOptions = {
    roundPixel: false,
    precision: defined(opt.precision, 5),
    pixelsPerInch: DEFAULT_PIXELS_PER_INCH
  };
  var svgPath = paths.join(' ');
  var viewWidth = convert(width, units, 'px', convertOptions).toString();
  var viewHeight = convert(height, units, 'px', convertOptions).toString();
  var fillStyle = opt.fillStyle || 'none';
  var strokeStyle = opt.strokeStyle || 'black';
  var lineWidth = opt.lineWidth;

  // Choose a default line width based on a relatively fine-tip pen
  if (typeof lineWidth === 'undefined') {
    // Convert to user units
    lineWidth = convert(
      DEFAULT_PEN_THICKNESS,
      DEFAULT_PEN_THICKNESS_UNIT,
      units,
      convertOptions
    ).toString();
  }

  return [
    '<?xml version="1.0" standalone="no"?>',
    '  <!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" ',
    '      "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">',
    '  <svg width="' + width + units + '" height="' + height + units + '"',
    '      xmlns="http://www.w3.org/2000/svg" version="1.1" viewBox="0 0 ' +
      viewWidth +
      ' ' +
      viewHeight +
      '">',
    '    <g>',
    '      <path d="' +
      svgPath +
      '" fill="' +
      fillStyle +
      '" stroke="' +
      strokeStyle +
      '" stroke-width="' +
      lineWidth +
      units +
      '" />',
    '    </g>',
    '</svg>'
  ].join('\n');
}

class Arc {
  constructor() {
    this.startX = 0;
    this.startY = 0;
    this.endX = 0;
    this.endY = 0;
    this.radiusX = 0;
    this.radiusY = 0;
    this.rotX = 0;
    this.largeArcFlag = 0;
    this.sweepFlag = 1;
  }

  toSvgPixels(units, decimalPlaces = 5) {
    let a = new Arc();
    a.startX = (TO_PX * cm(this.startX, units)).toFixed(decimalPlaces);
    a.startY = (TO_PX * cm(this.startY, units)).toFixed(decimalPlaces);
    a.endX = (TO_PX * cm(this.endX, units)).toFixed(decimalPlaces);
    a.endY = (TO_PX * cm(this.endY, units)).toFixed(decimalPlaces);

    a.radiusX = (TO_PX * cm(this.radiusX, units)).toFixed(decimalPlaces);
    a.radiusY = (TO_PX * cm(this.radiusY, units)).toFixed(decimalPlaces);
    a.rotX = this.rotX;
    a.largeArcFlag = this.largeArcFlag;
    a.sweepFlag = this.sweepFlag;

    return a;
  }
}

class SvgFile {
  constructor(options = {}) {
    this.lines = [];
    this.arcs = [];
    this.options = options;
  }

  addLine(line) {
    this.lines.push(line);
  }

  addCircle(cx, cy, radius) {
    this.arcs.push(...createCircle(cx, cy, radius));
  }

  addArc(cx, cy, radius, sAngle, eAngle) {
    this.arcs.push(createArc(cx, cy, radius, sAngle, eAngle));
  }

  toSvg(options = null){
    if (!options) { options = this.options; }
    let lineCommands = polyLinesToSvgPaths(this.lines, options);
    let arcCommands = arcsToSvgPaths(this.arcs, options);
    return pathsToSvgFile([...lineCommands, ...arcCommands], options);
  }
}

function createCircle(cx, cy, radius) {
  let a1 = new Arc();
  a1.startX = cx + radius;
  a1.startY = cy;
  a1.endX = cx - radius;
  a1.endY = cy;
  a1.radiusX = radius;
  a1.radiusY = radius;

  let a2 = new Arc();
  a2.startX = cx - radius;
  a2.startY = cy;
  a2.endX = cx + radius;
  a2.endY = cy;
  a2.radiusX = radius;
  a2.radiusY = radius;

  return [a1, a2];
}

function createArc(cx, cy, radius, sAngle, eAngle) {
  let zeroX = cx + radius,
    zeroY = cy,
    start = rotate([zeroX, zeroY], [cx, cy], sAngle),
    end = rotate([zeroX, zeroY], [cx, cy], eAngle);

  let a1 = new Arc();
  a1.radiusX = radius;
  a1.radiusY = radius;
  a1.startX = start[0];
  a1.startY = start[1];
  a1.endX = end[0];
  a1.endY = end[1];
  a1.largeArcFlag = (eAngle - sAngle) >= 180 ? 1 : 0;

  return a1;
}

const rotate = (point, center, angle) => {
  if (angle === 0) return point;

  let radians = (Math.PI / 180) * angle,
    x = point[0],
    y = point[1],
    cx = center[0],
    cy = center[1],
    cos = Math.cos(radians),
    sin = Math.sin(radians),
    nx = cos * (x - cx) - sin * (y - cy) + cx,
    ny = cos * (y - cy) + sin * (x - cx) + cy;
  return [nx, ny];
};

module.exports.arcsToSvgPaths = arcsToSvgPaths;
module.exports.polyLinesToSvgPaths = polyLinesToSvgPaths;
module.exports.pathsToSvgFile = pathsToSvgFile;
module.exports.Arc = Arc;
module.exports.SvgFile = SvgFile;
module.exports.createCircle = createCircle;
module.exports.createArc = createArc;
