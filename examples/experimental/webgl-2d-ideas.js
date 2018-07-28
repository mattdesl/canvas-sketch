const opts = {
  fill: 'red', // true -> black
  stroke: 'blue', // true -> black
  alpha: 0.5,
  lineWidth,
  lineCap,
  lineJoin,
  vertex,
  fragment,
  blend,
  projection,
  view,
  uniforms
};

const line = ktx.line([ [ 25, 25 ], [ 20, 10 ] ], {});
const polyline = ktx.polyline([ [ 25, 10 ], [ 20, 10 ], [ 20, 30 ] ], {});
const circle = ktx.circle([ 25, 10 ], 5, {});
const poly = ktx.polygon([
  [ [ 25, 10 ], [ 30, 30 ], [ 20, 10 ] ]
], {});
const mesh = ktx.mesh({ cells, positions, normals, uvs });
const rect = ktx.rect([ 25, 10, 50, 50 ], {});
const points = ktx.pointCloud([ [ 15, 10 ], [ 10, 10 ] ], {});

ktx.clear();
ktx.clear({ rect: [ 0, 0, 10, 10 ], color: 'red', alpha: 0.5 });


line, circle, rect, triangle (a, b, c), polygon, polyline, mesh

sphere, icosphere, torus, cube

const { positions, cells } = ktx.geometry.icosphere();
const mesh = ktx.icosphere();
const mesh = ktx.

"render data" -> color, position, etc
"constructor data" -> segments + any render data

line()  // single line render, set position uniform in shader, per-instance stuff
curve() // single curve render, can be bezier or quadratic, primitive is a plane w/ segments, per-instance stuff
polyline() // not per-instance, 
polygon() // triangulated then rendered

Later:
polylines() // list of lines all submitted in a single draw call; maybe useful for alpha stuff?


// Would be handy for 2D canvas convenience as well...

const circle = ktx.circle();
...
  ktx.update({ width, height });
  ktx.clear();
  circle({ position: [ 25, 15 ] });
