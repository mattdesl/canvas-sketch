const createSketch = require('../');

const settings = {
  dimensions: [2048, 2048]
};

const sketch = props => {
  const tileCount = 20;
  const tiles = Array(tileCount)
    .fill(0)
    .map((_, i) => {
      return Array(tileCount)
        .fill(0)
        .map((_, j) => {
          const [width, height] = [
            props.width / tileCount,
            props.height / tileCount
          ];
          const randomNumber = Math.random();
          if (randomNumber > 0.5) {
            return {
              x: i * width,
              y: j * height,
              toX: i * width + width,
              toY: j * height + height
            };
          } else {
            return {
              x: i * width,
              y: j * height + height,
              toX: i * width + width,
              toY: j * height
            };
          }
        });
    });

  return ({ context, width, height }) => {
    context.fillStyle = 'black';
    context.fillRect(0, 0, width, height);

    context.lineWidth = '4';
    context.strokeStyle = 'white';

    tiles.map(row => {
      row.map(rect => {
        const randomNumber = Math.random();
        if (randomNumber > 0.5) {
        }
        context.beginPath();
        context.moveTo(rect.x, rect.y);
        context.lineTo(rect.toX, rect.toY);
        context.stroke();
      });
    });
  };
};

createSketch(sketch, settings);
