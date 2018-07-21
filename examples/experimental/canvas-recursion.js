const canvasSketch = require('canvas-sketch');
const painter = require('./util/canvas-painter');
const Random = require('./util/random');

const settings = {
  dimensions: 'postcard',
  orientation: 'landscape',
  units: 'in',
  pixelsPerInch: 300,
  bleed: 1 / 8
};

const sketch = ({ context, }) => {
  const paint = painter(context);

  const divide = (rect, minSize = 0.01) => {
    const max = rect[1];
    const min = rect[0];
    const width = max[0] - min[0];
    const height = max[1] - min[1];
    if (width < minSize || height < minSize) return null;

    const multiplier = [ 2 / 3, 1 ];
    if (Random.boolean()) multiplier.reverse();

    const newMax = [
      min[0] + width * multiplier[0],
      min[1] + height * multiplier[1]
    ];
    return [ min, newMax ];
  };

  const rect = [ [ 0, 0 ], [ 1, 1 ] ];
  console.log();

  return props => {
    const {
      bleed,
      exporting,
      width, height,
      trimWidth, trimHeight
    } = props;

    paint.clear({ fill: '#fff', width, height });

    if (!exporting) {
      paint.rect({
        stroke: 'green',
        lineWidth: 0.015, // fraction of an inch
        position: bleed,
        width: trimWidth,
        height: trimHeight
      });
    }

    // Margin from trim border
    // const margin = 1 / 4;
    
  };
};

canvasSketch(sketch, settings);
