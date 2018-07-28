const polylineNormals = require('./polyline-util');
const defined = require('defined');
const earcut = require('earcut');
const cdt2d = require('cdt2d');
const { vec2 } = require('gl-matrix');

const list = (path, normalData, closed, lineWidth, side) => {
  const result = path.map((point, i) => {
    const data = normalData[i];
    const normal = data.normal;
    const miterLength = data.length;
    const position = typeof point.position !== 'undefined' ? point.position : point;
    const thickness = typeof point.thickness === 'number' && isFinite(point.thickness) ? point.thickness : 1;
    const computedLineWidth = defined(point.lineWidth, lineWidth);
    const length = thickness * computedLineWidth / 2 * miterLength;
    let t;
    if (path.length <= 1) t = 0;
    else if (closed) t = i / path.length;
    else t = i / (path.length - 1);
    return {
      position: vec2.scaleAndAdd([], position, normal, length * side),
      normal,
      uv: [ t, side ]
    };
  });
  return result;
};

const getPoints = path => {
  if (path.length === 0) return path;
  return path.map(point => {
    return typeof point.position !== 'undefined' ? point.position : point;
  });
};

// module.exports = function (path, opt = {}) {
//   return module.exports.contours(path, opt).map(contour => {
//     return contour.map(p => p.position);
//   });
// };

module.exports = function (path, opt = {}) {
  if (path.length < 2) {
    return {
      positions: [],
      cells: []
    };
  }

  const points = getPoints(path);
  const closed = path.length > 2 && opt.closed;
  const lineWidth = defined(opt.lineWidth, 1);
  const normalData = polylineNormals(points, closed);

  const edgeList = [ 1, -1 ].map(side => {
    return list(path, normalData, closed, lineWidth, side);
  });

  edgeList[1].reverse();

  if (closed) {
    // If we need to flip
    // const flip = true;
    const flip = !normalData.every(p => p.dot <= 0);

    // const initialNormal = normalData[0][0];
    if (flip) edgeList.reverse();
  }

  // Flatten edge list into a single polygon
  const edges = edgeList.reduce((a, b) => a.concat(b), []);

  if (edges.some(p => p.position.some(n => !isFinite(n)))) {
    throw new Error('Some values in the input path are not finite, i.e. NaN or Infinity');
  }

  const mesh = {
    positions: edges.map(p => p.position),
    uvs: edges.map(p => p.uv),
    normals: edges.map(p => p.normal)
  };

  // Convert to a list of contours
  // An open stroke is just a regular polygon, a closed stroke
  // is more like a polygon with a hole
  const contours = closed
    ? edgeList.map(edges => edges.map(p => p.position))
    : [ mesh.positions ];

  // const result = triangulateCdt2d(contours);
  const result = triangulateEarcut(contours);

  return Object.assign({}, mesh, result);
};

function triangulateCdt2d (contours) {
  const positions = contours.reduce((a, b) => a.concat(b), []);
  let edges = [];
  let edgeIndex = 0;
  let edgeStart = 0;
  contours.forEach(contour => {
    contour.forEach(_ => {
      const a = edgeIndex;
      const b = ++edgeIndex;
      edges.push([ (a % contour.length) + edgeStart, (b % contour.length) + edgeStart ])
    });
    edgeStart += contour.length;
  });

  // TODO: Handle this with normals + uvs somehow?
  let normals;
  const positionsBefore = positions.length;
  // if (require('clean-pslg')(positions, edges)) {
  //   const positionsAfter = positions.length;
  //   console.log('after before', positionsAfter, positionsBefore);
  // }

  const cells = cdt2d(positions, edges, {
    delaunay: false,
    interior: true,
    exterior: false
  });

  const outputData = { positions, cells };

  return outputData;
}

function triangulateEarcut (contours) {
  const flat = earcut.flatten(contours);
  const indices = earcut(flat.vertices, flat.holes, flat.dimensions);
  const cells = [];
  for (let i = 0; i < indices.length / 3; i++) {
    const cell = [];
    for (let d = 0; d < 3; d++) {
      cell.push(indices[i * 3 + d]);
    }
    cells.push(cell);
  }
  return { cells, positions: contours.reduce((a, b) => a.concat(b), []) };
}


const shoelace = (ring) => {
  let sum = 0;
  let i = 1;
  let prev;
  let cur;

  while (i < ring.length) {
    prev = cur || ring[0];
    cur = ring[i];
    sum += ((cur[0] - prev[0]) * (cur[1] + prev[1]));
    i++;
  }
  return sum;
};
