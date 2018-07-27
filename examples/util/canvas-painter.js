const defined = require('defined');
const { expand2D } = require('./math');

module.exports = function (context) {
  const paint = (opt = {}) => {
    let fill = opt.fill;
    let stroke = opt.stroke;
    const defaultColor = 'black';
    const alpha = defined(opt.alpha, 1);

    // Default to fill-only
    if (opt.fill == null && opt.stroke == null) fill = true;

    if (fill) {
      const fillAlpha = defined(opt.fillAlpha, 1);
      context.fillStyle = typeof fill === 'boolean' ? defaultColor : fill;
      context.globalAlpha = alpha * fillAlpha;
      context.fill();
    }
    const lineWidth = defined(opt.lineWidth, 1);
    if (stroke && lineWidth > 0) {
      const strokeAlpha = defined(opt.strokeAlpha, 1);
      context.strokeStyle = typeof stroke === 'boolean' ? defaultColor : stroke;
      context.lineWidth = lineWidth;
      context.lineCap = opt.lineCap || 'butt';
      context.lineJoin = opt.lineJoin || 'miter';
      context.miterLimit = defined(opt.miterLimit, 10);
      context.globalAlpha = alpha * strokeAlpha;
      context.stroke();
    }
  };

  const circle = (opt = {}) => {
    context.beginPath();
    const radius = Math.max(0, defined(opt.radius, 1));
    const position = expand2D(opt.position);
    const arcStart = defined(opt.arcStart, 0);
    const arcEnd = defined(opt.arcEnd, Math.PI * 2);
    context.arc(position[0], position[1], radius, arcStart, arcEnd, false);
    paint(opt);
  };

  const rect = (opt = {}) => {
    context.beginPath();
    const position = expand2D(opt.position);
    const width = defined(opt.width, 1);
    const height = defined(opt.height, 1);
    context.rect(position[0], position[1], width, height);
    paint(opt);
  };

  const _line = (path, opt = {}, defaultToStroke = false) => {
    opt = Object.assign({}, opt);

    if (defaultToStroke) {
      if (opt.fill == null && opt.stroke == null) opt.stroke = true;
    }

    context.beginPath();
    path.forEach(point => context.lineTo(point[0], point[1]));
    if (opt.closed) context.closePath();
    paint(opt);
  };

  const polyline = (path, opt = {}) => _line(path, opt, true);
  const shape = (shape, opt = {}) => _line(shape, opt, false);

  const polylines = (lines, opt = {}) => {
    lines.forEach(path => polyline(path, opt));
  };

  const clear = (opt = {}) => {
    const position = expand2D(opt.position);
    const width = defined(opt.width, context.canvas.width);
    const height = defined(opt.height, context.canvas.height);

    // clear first in case we have a translucent fill
    context.clearRect(position[0], position[1], width, height);

    // now allow user to fill
    if (opt.fill) {
      context.beginPath();
      context.rect(position[0], position[1], width, height);
      paint(opt);
    }
  };

  return {
    clear,
    paint,
    rect,
    circle,
    polyline,
    polylines,
    shape
  };
};
