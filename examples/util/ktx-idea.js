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