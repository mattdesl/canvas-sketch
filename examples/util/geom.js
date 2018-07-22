const Random = require('./random');
const euclideanDistance = require('euclidean-distance');
const { vec2, vec3 } = require('gl-matrix');
const lineclip = require('lineclip');
const arrayAlmostEqual = require('array-almost-equal');
const triangleCentroid = require('triangle-centroid');
const insideTriangle = require('point-in-triangle');

const tmp1 = [];
const tmp2 = [];
const tmpTriangle = [ 0, 0, 0 ];

// Random point in N-dimensional triangle
module.exports.randomPointInTriangle = (out = [], a, b, c, u = Random.value(), v = Random.value()) => {
  if ((u + v) > 1) {
    u = 1 - u;
    v = 1 - v;
  }
  const dim = a.length;
  const Q = 1 - u - v;
  for (let i = 0; i < dim; i++) {
    out[i] = (a[i] * u) + (b[i] * v) + (c[i] * Q);
  }
  return out;
};

module.exports.getPolylinePerimeter = (points, closed = false) => {
  let perimeter = 0;
  let lastPosition = points.length - 1;
  for (let i = 0; i < lastPosition; i++) {
    perimeter += euclideanDistance(points[i], points[i + 1]);
  }
  if (closed && points.length > 1) {
    perimeter += euclideanDistance(points[points.length - 1], points[0]);
  }
  return perimeter;
};

module.exports.getPolylineArclengths = (path) => {
  let totalDistance = 0;
  const distances = [];
  for (let i = 0; i < path.length; i++) {
    if (i > 0) {
      const last = path[i - 1];
      const cur = path[i];
      totalDistance += euclideanDistance(last, cur);
    }
    distances.push(totalDistance);
  }
  for (let i = 0; i < distances.length; i++) {
    distances[i] /= totalDistance;
  }
  return distances;
};

module.exports.resampleLineBySpacing = (points, spacing = 1, closed = false) => {
  if (spacing <= 0) {
    throw new Error('Spacing must be positive and larger than 0');
  }
  let totalLength = 0;
  let curStep = 0;
  let lastPosition = points.length - 1;
  if (closed) {
    lastPosition++;
  }
  const result = [];
  const tmp = [ 0, 0 ];
  for (let i = 0; i < lastPosition; i++) {
    const repeatNext = i === points.length - 1;
    const cur = points[i];
    const next = repeatNext ? points[0] : points[i + 1];
    const diff = vec2.subtract(tmp, next, cur);

    let curSegmentLength = vec2.length(diff);
    totalLength += curSegmentLength;

    while (curStep * spacing <= totalLength) {
      let curSample = curStep * spacing;
      let curLength = curSample - (totalLength - curSegmentLength);
      let relativeSample = curLength / curSegmentLength;
      result.push(vec2.lerp([], cur, next, relativeSample));
      curStep++;
    }
  }
  return result;
}

module.exports.resampleLineByCount = (points, count = 1, closed = false) => {
  if (count <= 0) return [];
  const perimeter = module.exports.getPolylinePerimeter(points, closed);
  return module.exports.resampleLineBySpacing(points, perimeter / count, closed);
}

// Returns a list that is a cubic spline of the input points
// This function could probably be optimized for real-time a bit better
module.exports.cubicSpline = (points, tension = 0.5, segments = 25, closed = false) => {
  // unroll pairs into flat array
  points = points.reduce((a, b) => a.concat(b), []);

  var pts; // for cloning point array
  var i = 1;
  var l = points.length;
  var rPos = 0;
  var rLen = (l - 2) * segments + 2 + (closed ? 2 * segments : 0);
  var res = new Float32Array(rLen);
  var cache = new Float32Array((segments + 2) * 4);
  var cachePtr = 4;
  var st, st2, st3, st23, st32, parse;

  pts = points.slice(0);
  if (closed) {
    pts.unshift(points[l - 1]); // insert end point as first point
    pts.unshift(points[l - 2]);
    pts.push(points[0], points[1]); // first point as last point
  } else {
    pts.unshift(points[1]); // copy 1. point and insert at beginning
    pts.unshift(points[0]);
    pts.push(points[l - 2], points[l - 1]); // duplicate end-points
  }
  // cache inner-loop calculations as they are based on t alone
  cache[0] = 1; // 1,0,0,0
  for (; i < segments; i++) {
    st = i / segments;
    st2 = st * st;
    st3 = st2 * st;
    st23 = st3 * 2;
    st32 = st2 * 3;
    cache[cachePtr++] = st23 - st32 + 1; // c1
    cache[cachePtr++] = st32 - st23; // c2
    cache[cachePtr++] = st3 - 2 * st2 + st; // c3
    cache[cachePtr++] = st3 - st2; // c4
  }
  cache[++cachePtr] = 1; // 0,1,0,0

  parse = function (pts, cache, l) {
    var i = 2;
    var t, pt1, pt2, pt3, pt4, t1x, t1y, t2x, t2y, c, c1, c2, c3, c4;

    for (i; i < l; i += 2) {
      pt1 = pts[i];
      pt2 = pts[i + 1];
      pt3 = pts[i + 2];
      pt4 = pts[i + 3];
      t1x = (pt3 - pts[i - 2]) * tension;
      t1y = (pt4 - pts[i - 1]) * tension;
      t2x = (pts[i + 4] - pt1) * tension;
      t2y = (pts[i + 5] - pt2) * tension;
      for (t = 0; t < segments; t++) {
        // t * 4
        c = t << 2; // jshint ignore: line
        c1 = cache[c];
        c2 = cache[c + 1];
        c3 = cache[c + 2];
        c4 = cache[c + 3];

        res[rPos++] = c1 * pt1 + c2 * pt3 + c3 * t1x + c4 * t2x;
        res[rPos++] = c1 * pt2 + c2 * pt4 + c3 * t1y + c4 * t2y;
      }
    }
  };

  // calc. points
  parse(pts, cache, l);

  if (closed) {
    // l = points.length
    pts = [];
    pts.push(points[l - 4], points[l - 3], points[l - 2], points[l - 1]); // second last and last
    pts.push(points[0], points[1], points[2], points[3]); // first and second
    parse(pts, cache, 4);
  }
  // add last point
  l = closed ? 0 : points.length - 2;
  res[rPos++] = points[l];
  res[rPos] = points[l + 1];

  // roll back up into pairs
  const rolled = [];
  for (let i = 0; i < res.length / 2; i++) {
    rolled.push([ res[i * 2 + 0], res[i * 2 + 1] ]);
  }
  return rolled;
};

module.exports.intersectLineSegmentLineSegment = intersectLineSegmentLineSegment;
function intersectLineSegmentLineSegment (p1, p2, p3, p4) {
  // Reference:
  // https://github.com/evil-mad/EggBot/blob/master/inkscape_driver/eggbot_hatch.py
  const d21x = p2[0] - p1[0];
  const d21y = p2[1] - p1[1];
  const d43x = p4[0] - p3[0];
  const d43y = p4[1] - p3[1];

  // denominator
  const d = d21x * d43y - d21y * d43x;
  if (d === 0) return -1;

  const nb = (p1[1] - p3[1]) * d21x - (p1[0] - p3[0]) * d21y;
  const sb = nb / d;
  if (sb < 0 || sb > 1) return -1;

  const na = (p1[1] - p3[1]) * d43x - (p1[0] - p3[0]) * d43y;
  const sa = na / d;
  if (sa < 0 || sa > 1) return -1;
  return sa;
}

const FaceCull = {
  BACK: -1,
  FRONT: 1,
  NONE: 0
};
module.exports.FaceCull = FaceCull;

module.exports.isTriangleVisible = isTriangleVisible;
function isTriangleVisible (cell, vertices, rayDir, side = FaceCull.BACK) {
  if (side === FaceCull.NONE) return true;
  const verts = cell.map(i => vertices[i]);
  const v0 = verts[0];
  const v1 = verts[1];
  const v2 = verts[2];
  vec3.subtract(tmp1, v1, v0);
  vec3.subtract(tmp2, v2, v0);
  vec3.cross(tmp1, tmp1, tmp2);
  vec3.normalize(tmp1, tmp1);
  const d = vec3.dot(rayDir, tmp1);
  return side === FaceCull.BACK ? d > 0 : d <= 0;
}

// Whether the 3D triangle face is visible to the camera
// i.e. backface / frontface culling
module.exports.isFaceVisible = isFaceVisible;
function isFaceVisible (cell, vertices, rayDir, side = FaceCull.BACK) {
  if (side === FaceCull.NONE) return true;
  if (cell.length === 3) {
    return isTriangleVisible(cell, vertices, rayDir, side);
  }
  if (cell.length !== 4) throw new Error('isFaceVisible can only handle triangles and quads');
};

module.exports.clipPolylinesToBox = clipPolylinesToBox;
function clipPolylinesToBox (polylines, bbox, border = false, closeLines = true) {
  if (border) {
    return polylines.map(line => {
      const result = lineclip.polygon(line, bbox);
      if (closeLines && result.length > 2) result.push(result[0]);
      return result;
    }).filter(lines => lines.length > 0);
  } else {
    return polylines.map(line => {
      return lineclip.polyline(line, bbox);
    }).reduce((a, b) => a.concat(b), []);
  }
}

// Normal of a 3D triangle face
module.exports.computeFaceNormal = computeFaceNormal;
function computeFaceNormal (cell, positions, out = []) {
  const a = positions[cell[0]];
  const b = positions[cell[1]];
  const c = positions[cell[2]];
  vec3.subtract(out, c, b);
  vec3.subtract(tmp2, a, b);
  vec3.cross(out, out, tmp2);
  vec3.normalize(out, out);
  return out;
}

// Area of 2D or 3D triangle
module.exports.computeTriangleArea = computeTriangleArea;
function computeTriangleArea (a, b, c) {
  if (a.length >= 3 && b.length >= 3 && c.length >= 3) {
    vec3.subtract(tmp1, c, b);
    vec3.subtract(tmp2, a, b);
    vec3.cross(tmp1, tmp1, tmp2);
    return vec3.length(tmp1) * 0.5;
  } else {
    return Math.abs((a[0] - c[0]) * (b[1] - a[1]) - (a[0] - b[0]) * (c[1] - a[1])) * 0.5;
  }
}

module.exports.createHatchLines = createHatchLines;
function createHatchLines (bounds, angle = -Math.PI / 4, spacing = 0.5, out = []) {
  // Reference:
  // https://github.com/evil-mad/EggBot/blob/master/inkscape_driver/eggbot_hatch.py
  spacing = Math.abs(spacing);
  if (spacing === 0) throw new Error('cannot use a spacing of zero as it will run an infinite loop!');

  const xmin = bounds[0][0];
  const ymin = bounds[0][1];
  const xmax = bounds[1][0];
  const ymax = bounds[1][1];

  const w = xmax - xmin;
  const h = ymax - ymin;
  if (w === 0 || h === 0) return out;
  const r = Math.sqrt(w * w + h * h) / 2;
  const rotAngle = Math.PI / 2 - angle;
  const ca = Math.cos(rotAngle);
  const sa = Math.sin(rotAngle);
  const cx = bounds[0][0] + (w / 2);
  const cy = bounds[0][1] + (h / 2);
  let i = -r;
  while (i <= r) {
    // Line starts at (i, -r) and goes to (i, +r)
    const x1 = cx + (i * ca) + (r * sa); //  i * ca - (-r) * sa
    const y1 = cy + (i * sa) - (r * ca); //  i * sa + (-r) * ca
    const x2 = cx + (i * ca) - (r * sa); //  i * ca - (+r) * sa
    const y2 = cy + (i * sa) + (r * ca); //  i * sa + (+r) * ca
    i += spacing;
    // Remove any potential hatch lines which are entirely
    // outside of the bounding box
    if ((x1 < xmin && x2 < xmin) || (x1 > xmax && x2 > xmax)) {
      continue;
    }
    if ((y1 < ymin && y2 < ymin) || (y1 > ymax && y2 > ymax)) {
      continue;
    }
    out.push([ [ x1, y1 ], [ x2, y2 ] ]);
  }
  return out;
}

module.exports.expandTriangle = expandTriangle;
function expandTriangle (triangle, border = 0) {
  if (border === 0) return triangle;
  let centroid = triangleCentroid(triangle);
  triangle[0] = expandVector(triangle[0], centroid, border);
  triangle[1] = expandVector(triangle[1], centroid, border);
  triangle[2] = expandVector(triangle[2], centroid, border);
  return triangle;
}

module.exports.expandVector = expandVector;
function expandVector (point, centroid, amount = 0) {
  point = vec2.copy([], point);
  const dir = vec2.subtract([], centroid, point);
  const maxLen = vec2.length(dir);
  const len = Math.min(maxLen, amount);
  if (maxLen !== 0) vec2.scale(dir, dir, 1 / maxLen); // normalize
  vec2.scaleAndAdd(point, point, dir, len);
  return point;
}

module.exports.clipLineToTriangle = clipLineToTriangle;
function clipLineToTriangle (p1, p2, a, b, c, border = 0, result = []) {
  if (border !== 0) {
    let centroid = triangleCentroid([ a, b, c ]);
    a = expandVector(a, centroid, border);
    b = expandVector(b, centroid, border);
    c = expandVector(c, centroid, border);
  }

  // first check if all points are inside triangle
  tmpTriangle[0] = a;
  tmpTriangle[1] = b;
  tmpTriangle[2] = c;
  if (insideTriangle(p1, tmpTriangle) && insideTriangle(p2, tmpTriangle)) {
    result[0] = p1.slice();
    result[1] = p2.slice();
    return true;
  }

  // triangle segments
  const segments = [
    [ a, b ],
    [ b, c ],
    [ c, a ]
  ];

  for (let i = 0; i < 3; i++) {
    // test against each triangle edge
    const segment = segments[i];
    let p3 = segment[0];
    let p4 = segment[1];

    const fract = intersectLineSegmentLineSegment(p1, p2, p3, p4);
    if (fract >= 0 && fract <= 1) {
      result.push([
        p1[0] + fract * (p2[0] - p1[0]),
        p1[1] + fract * (p2[1] - p1[1])
      ]);
      // when we have 2 result we can stop checking
      if (result.length >= 2) break;
    }
  }

  if (arrayAlmostEqual(result[0], result[1])) {
    // if the two points are close enough they are basically
    // touching, or if the border pushed them close together,
    // then ignore this altogether
    result.length = 0;
  }

  return result.length === 2;
}
