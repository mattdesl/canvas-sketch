const canvasSketch = require('canvas-sketch');
const { renderPolylines } = require('canvas-sketch-util/penplot');
const { clipPolylinesToBox } = require('canvas-sketch-util/geometry');

const settings = {
  dimensions: 'A4',
  orientation: 'portrait',
  pixelsPerInch: 300,
  scaleToView: true,
  units: 'cm',
};

const sketch = ({ width, height }) => {
  // List of polylines for our pen plot
  let lines = [];

  // Draw some circles expanding outward
  const steps = 5;
  const count = 20;
  const spacing = Math.min(width, height) * 0.05;
  const radius = Math.min(width, height) * 0.25;
  for (let j = 0; j < count; j++) {
    const r = radius + j * spacing;
    const circle = [];
    for (let i = 0; i < steps; i++) {
      const t = i / Math.max(1, steps - 1);
      const angle = Math.PI * 2 * t;
      circle.push([
        width / 2 + Math.cos(angle) * r,
        height / 2 + Math.sin(angle) * r
      ]);
    }
    lines.push(circle);
  }

  // Clip all the lines to a margin
  const margin = 1.0;
  const box = [ margin, margin, width - margin, height - margin ];
  lines = clipPolylinesToBox(lines, box);

  // The 'penplot' util includes a utility to render
  // and export both PNG and SVG files
  return props => renderPolylines(lines, props);
};

canvasSketch(sketch, settings);
