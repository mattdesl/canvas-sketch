const canvasSketch = require('canvas-sketch');
const { clipPolylinesToBox } = require('./util/geom');
const { exportPolylines } = require('./util/penplot');
const { linspace } = require('canvas-sketch-util/math');
const Painter = require('./util/canvas-painter');

const settings = {
  pixelsPerInch: 300,
  dimensions: 'a4',
  orientation: 'portrait',
  units: 'cm'
};

const sketch = ({ context, width, height }) => {
  const lines = generate({ width, height });
  const painter = Painter(context);

  return ({ dimensions, units }) => {
    painter.clear({ width, height, fill: 'white' });

    lines.forEach(line => painter.polyline(line, {
      lineWidth: 0.05,
      lineJoin: 'round',
      lineCap: 'round',
      stroke: 'black'
    }));

    return [
      context.canvas,
      exportPolylines(lines, { dimensions, units })
    ];
  };

  function generate ({ width, height }) {
    // Create some polylines
    const circles = 12;
    const size = Math.min(width, height) * 0.75;
    let lines = linspace(circles, { offset: 1, endpoint: true }).map(t => {
      const steps = 9;
      return linspace(steps, { endpoint: true }).map(k => {
        const a = k * Math.PI * 2;
        const r = Math.pow(t, 0.75) * size;
        const x = width / 2;
        const y = height / 2;
        return [ x + Math.cos(a) * r, y + Math.sin(a) * r ];
      });
    });

    // Clip all the lines to a margin
    const margin = 1.5;
    const box = [ margin, margin, width - margin, height - margin ];
    lines = clipPolylinesToBox(lines, box);
    return lines;
  }
};

canvasSketch(sketch, settings);
