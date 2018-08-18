/**
 * A Canvas2D example of generative/algorithmic artwork, sized for print.
 * @author Matt DesLauriers (@mattdesl)
 */

const canvasSketch = require('canvas-sketch');
const Random = require('canvas-sketch-util/random');
const { lerp } = require('canvas-sketch-util/math');

// We can force a random seed or a specific string/number
Random.setSeed(Random.getRandomSeed());

const settings = {
  pixelsPerInch: 300,
  // When exporting, use the seed as the suffix
  // This way we can reproduce it more easily later
  suffix: Random.getSeed(),
  // Standard A4 paper size
  dimensions: 'A4',
  // We'll work in inches for the rendering
  units: 'in'
};

const sketch = ({ width, height }) => {
  const margin = 0;

  const sliceCount = 50000;
  const slices = Array.from(new Array(sliceCount)).map((_, i, list) => {
    const t = list.lenth <= 1 ? 0 : i / (list.length - 1);

    const noiseAngle = t * Math.PI * 2;
    const nx = Math.cos(noiseAngle);
    const ny = Math.sin(noiseAngle);
    const nf = 0.05 + Random.range(0, 0.5);
    const amplitude = 2;
    const noise = Random.noise2D(nx * nf, ny * nf);
    const noise01 = noise * 0.5 + 0.5;

    const tOffset = Random.gaussian(0, 0.01);

    const cx = width / 2;
    const x = cx + noise * amplitude;
    return {
      alpha: Random.range(0.75, 1) * (1 - noise01),
      color: 'white',
      lineWidth: Random.range(0.005, 0.02) * 0.1,
      length: Random.gaussian() * noise01 * 0.5,
      angle: Random.gaussian(0, 1),
      x,
      y: lerp(margin, height - margin, t + tOffset)
    };
  });

  return ({ context }) => {
    context.globalCompositeOperation = 'source-over';
    context.fillStyle = 'black';
    context.fillRect(0, 0, width, height);
    context.globalCompositeOperation = 'lighter';

    slices.forEach(slice => {
      context.save();
      context.beginPath();
      context.translate(slice.x, slice.y);
      context.rotate(slice.angle);
      context.lineTo(slice.length / 2, 0);
      context.lineTo(-slice.length / 2, 0);
      context.lineWidth = slice.lineWidth;
      context.strokeStyle = slice.color;
      context.globalAlpha = slice.alpha;
      context.stroke();
      context.restore();
    });
  };
};

canvasSketch(sketch, settings);
