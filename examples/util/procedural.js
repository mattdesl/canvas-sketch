const { lerp, expand2D } = require('./math');

module.exports.grid = grid;
function grid (opt = {}) {
  const min = expand2D(opt.min, 0);
  const max = expand2D(opt.max, 1);
  const [ xCount, yCount ] = expand2D(opt.count);

  const points = [];
  for (let x = 0; x < xCount; x++) {
    for (let y = 0; y < yCount; y++) {
      const tx = xCount <= 1 ? 0.5 : x / (xCount - 1);
      const ty = yCount <= 1 ? 0.5 : y / (yCount - 1);
      points.push({
        cell: [ x, y ],
        position: [
          lerp(min[0], max[0], tx),
          lerp(min[1], max[1], ty)
        ]
      });
    }
  }
  return points;
}
