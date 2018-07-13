const canvasSketch = require('canvas-sketch'); // not yet released
const Random = require('./util/random');
const { lerp } = require('./util/math');
const { vec2 } = require('gl-matrix');
const createWebGL2D = require('./util/webgl-2d');
const polyline = require('./util/primitive-polyline');
const boundPoints = require('bound-points');

const settings = {
  dimensions: [ 8, 11 ],
  units: 'in',
  pixelsPerInch: 300,
  context: 'webgl',
  animate: true,
  attributes: {
    premultipliedAlpha: true,
    antialias: true // turn on MSAA
  }
};

const sketch = ({ gl, width, height }) => {
  const glx = createWebGL2D({ gl });

  const pointCount = 50;
  const points = Array.from(new Array(pointCount)).map(() => {
    return vec2.add([], [ width / 2, height / 2 ], Random.insideBox([], width / 2));
  });

  const drawPoint = glx.circle({
    // uniforms: {¡
    //   other: [ 1, 0, 0 ]
    // },
    // frag: `
    //   precision highp float;
    //   varying vec2 vUv;
    //   uniform vec3 other;
    //   void main () {
    //     gl_FragColor = vec4(vec3(vUv.x) * other, 1.0);
    //   }
    // `,
    // segments: 4
  });

  const square = glx.rect({
    attributes: (data, opt = {}) => {
      return {
        random: data.positions.map(p => Random.onSphere())
      };
    }
  });

  // const path = [ [ 2, 2 ], [ 3, 3 ], [ 2, 4 ], [ 1, 3 ] ];
  // const path = [ [ 2, 2 ], [ 3, 3 ], [ 2, 4 ], [ 1, 4 ], [ 3, 2 ] ]
  // const path = [ [ 1.5, 1 ], [ 2, 3 ], [ 1, 8 ] ];
  // const path = [ [ 1, 1 ], [ 2, 3 ], [ 2, 5 ] ];
  // const path = [ [ 1, 1 ], [ 2, 3 ], [ 0, 8 ] ];
  // const path = [
  //   [ 1, 1 ],
  //   { position: [ 2, 3 ], thickness: 1 },
  //   [ 3, 2 ]
  // ];
  // const path = [ [ 1, 1 ], [ 2, 3 ] ];
  const path = [ [ 1, 1 ], [ 2, 3 ], [ 0, 2 ] ];
  const lines = glx.polyline({
    uniforms: {
      other: [ 1, 0, 0 ]
    },
    frag: `
      precision highp float;
      varying vec2 vUv;
      uniform vec3 other;
      void main () {
        gl_FragColor = vec4(vec3(vUv.x) * other, 1.0);
      }
    `,
    lineWidth: 0.1,
    closed: true,
    color: 'red'
  });

  lines.updateGeometry({ data: path });
  lines.update({
    pivot: [ 0.5, 0.5 ]
  });

  return ({ gl, width, height, time }) => {
    glx.update({ width, height });
    glx.clear({ color: 'white', alpha: 1 });
    
    lines({ rotation: time });
    const data = lines.geometry;
    data.positions.forEach((position, i) => {
      drawPoint({
        color: i > data.positions.length / 2 - 1 ? 'green' : 'blue',
        position,
        scale: 0.1
      });
    });

    square({
      rotation: 1,
      center: true,
      pivot: [ 0.5, 0.5 ],
      scale: [ 2, 1 ],
      position: [ width / 2, height / 2 ]
    })

    // square({
    //   vert: `
    //   precision highp float;
    //   attribute vec3 position;
    //   attribute vec3 normal;
    //   attribute vec2 uv;
    //   attribute vec3 random;
    
    //   uniform mat4 projection;
    //   uniform mat4 model;
    //   uniform mat4 view;
    
    //   varying vec2 vUv;
    //   varying vec3 vNormal;
    
    //   void main () {
    //     vUv = uv;
    //     vNormal = normal;
    //     gl_Position = projection * view * model * vec4(position.xyz + random.xyz, 1.0);
    //   }
    // `,
    //   position: [ width / 2, height / 2 ],
    //   color: 'blue'
    // });
  };
};

canvasSketch(sketch, settings);