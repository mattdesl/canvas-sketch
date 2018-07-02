const euclideanDistance = require('euclidean-distance');
const { vec2 } = require('gl-matrix');

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
}
