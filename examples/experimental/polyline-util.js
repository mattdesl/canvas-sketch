var util = require('polyline-miter-util');
var { vec2 } = require('gl-matrix');

var lineA = [0, 0];
var lineB = [0, 0];
var tangent = [0, 0];
var miter = [0, 0];

module.exports = function (points, closed) {
  var curNormal = null;
  var out = [];
  if (closed) {
    points = points.slice();
    points.push(points[0]);
  }

  var total = points.length;
  for (var i = 1; i < total; i++) {
    var last = points[i - 1];
    var cur = points[i];
    var next = i < points.length - 1 ? points[i + 1] : null;

    util.direction(lineA, cur, last);
    if (!curNormal) {
      curNormal = [0, 0];
      util.normal(curNormal, lineA);
    }

    if (i === 1) { // add initial normals
      addNext(out, curNormal, 1);
    }

    if (!next) { // no miter, simple segment
      util.normal(curNormal, lineA); // reset normal
      addNext(out, curNormal, 1);
    } else { // miter with last
      // get unit dir of next line
      util.direction(lineB, next, cur);

      // stores tangent & miter
      var miterLen = util.computeMiter(tangent, miter, lineA, lineB, 1);
      let dot = vec2.dot(tangent, curNormal);
      addNext(out, miter, miterLen, dot);
    }
  }

  // if the polyline is a closed loop, clean up the last normal
  if (points.length > 2 && closed) {
    var last2 = points[total - 2];
    var cur2 = points[0];
    var next2 = points[1];

    util.direction(lineA, cur2, last2);
    util.direction(lineB, next2, cur2);
    util.normal(curNormal, lineA);

    var miterLen2 = util.computeMiter(tangent, miter, lineA, lineB, 1);
    let dot = vec2.dot(tangent, curNormal);
    const features = [ out[0], out[total - 1] ];
    features.forEach(feature => {
      feature.normal = miter.slice();
      feature.length = miterLen2;
      feature.dot = dot;
    });
    out.pop();
  }

  return out;
};

function addNext (out, normal, length, dot = 0) {
  out.push({
    normal: [ normal[0], normal[1] ],
    length,
    dot
  });
}
