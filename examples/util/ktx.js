const createRegl = require('regl');
const defined = require('defined');
const { inverseLerp } = require('./math');
const cssColorParse = require('parse-color');
const createPrimitiveCircle = require('primitive-circle');
const createPrimitiveQuad = require('primitive-quad');
const { vec3, quat, mat4 } = require('gl-matrix');
const mat4Recompose = require('mat4-recompose');
const boundPoints = require('bound-points');

const IDENTITY_MAT4 = mat4.identity([]);

const recenter = (vectors, center) => {
  return vectors.map(p => {
    p = p.slice();
    if (center) {
      p[0] *= 0.5;
      p[1] *= 0.5;
    } else {
      p[0] = (p[0] * 0.5 + 0.5);
      p[1] = (p[1] * 0.5 + 0.5);
    }
    return p;
  });
};

const get2DUV = positions => {
  const vecs = positions.map(p => p.slice(0, 2));
  const bounds = boundPoints(vecs);
  const w = bounds[1][0] - bounds[0][0];
  const h = bounds[1][1] - bounds[0][1];
  return positions.map(p => {
    const x = p[0];
    const y = p[1];
    const u = w === 0 ? 0 : inverseLerp(bounds[0][0], bounds[1][0], x);
    const v = h === 0 ? 0 : inverseLerp(bounds[0][1], bounds[1][1], y);
    return [ u, v ];
  });
}

const toFinite = (n, defaultValue = 0) => {
  return typeof n === 'number' && isFinite(n) ? n : defaultValue;
};

const expandVector = (p, defaultValue = 0) => {
  if (p == null) {
    return [ defaultValue, defaultValue, defaultValue ];
  }
  // Expand single channel to multiple vector
  if (typeof p === 'number' && isFinite(p)) {
    return [ p, p, p ];
  }
  return [
    toFinite(p[0], defaultValue),
    toFinite(p[1], defaultValue),
    toFinite(p[2], defaultValue)
  ];
};

const expandVectorList = (positions, defaultValue = 0) => {
  return positions.map(vector => expandVector(vector, defaultValue));
};

const basicFragShader = `
  precision highp float;
  uniform float alpha;
  uniform vec3 color;

  void main () {
    gl_FragColor = vec4(color, alpha);
  }
`;

const basicVertShader = `
  precision highp float;
  attribute vec3 position;
  attribute vec3 normal;
  attribute vec2 uv;

  uniform mat4 projection;
  uniform mat4 model;
  uniform mat4 view;

  varying vec2 vUv;
  varying vec3 vNormal;

  void main () {
    vUv = uv;
    vNormal = normal;
    gl_Position = projection * view * model * vec4(position.xyz, 1.0);
  }
`;

const getRGBColor = (value, defaultValue = [ 0, 0, 0 ]) => {
  if (!value) return defaultValue;
  if (typeof value === 'string') {
    return cssColorParse(value).rgb.map(n => n / 255);
  }
  if (Array.isArray(value)) {
    if (value.length !== 3) {
      throw new Error('Expected [ r, g, b ] array, got an array with a different length');
    }
    return value;
  }
  throw new Error('colour/fill/stroke value should either be a CSS color string or [ r, g, b ] float array');
};

module.exports = function (opt = {}) {
  const regl = createRegl(opt);
  const projection = mat4.clone(IDENTITY_MAT4);
  const cameraMatrix = mat4.clone(IDENTITY_MAT4);
  const view = mat4.clone(IDENTITY_MAT4);

  return {
    update: (opt = {}) => {
      const width = defined(opt.width, 1);
      const height = defined(opt.height, 1);
      mat4.ortho(projection, 0, width, height, 0, -100, 100);
      mat4.invert(view, cameraMatrix);
      regl.poll();
    },
    clear: (opt = {}) => {
      const stencil = defined(opt.stencil, 0);
      const depth = defined(opt.depth, 1);
      const rgb = getRGBColor(opt.color);
      const alpha = defined(opt.alpha, 0);
      const color = [ ...rgb, alpha ];
      regl.clear({ stencil, depth, color });
    },
    // Commands
    rect: (opt = {}) => {
      return mesh(createPrimitiveQuad(), opt);
    },
    circle: (opt = {}) => {
      const segments = defined(opt.segments, 128);
      const primitive = createPrimitiveCircle(1, segments);
      return mesh(primitive, Object.assign({ center: true }, opt, {
        primitive: 'triangle fan'
      }));
    }
  };

  function mesh (vertexData, opt = {}) {
    let { positions, cells } = vertexData;

    // Compute normals before recentering
    const normals = positions.map(p => {
      const vec = vec3.normalize([], expandVector(p));
      return vec;
    });

    const uvs = get2DUV(positions);
    positions = recenter(positions);
    positions = expandVectorList(positions);

    const model = mat4.clone(IDENTITY_MAT4);
    const centerOrigin = vec3.clone([ -0.5, -0.5, 0 ]);
    const tmpOrigin = vec3.create();
    const tmpPivot = vec3.create();
    const tmpPivotNegated = vec3.create();
    const defaultColor = getRGBColor(opt.color);

    const attributes = {
      position: regl.buffer(positions),
      uv: regl.buffer(uvs),
      normal: regl.buffer(normals)
    };

    const drawMesh = regl({
      // Fragment & Vertex shaders
      frag: (_, props) => props.frag || basicFragShader,
      vert: (_, props) => props.vert || basicVertShader,
      primitive: opt.primitive || 'triangles',
      uniforms: {
        projection: regl.prop('projection'),
        model: regl.prop('model'),
        view: regl.prop('view'),
        alpha: (_, props) => defined(props.alpha, 1),
        color: (_, props) => getRGBColor(props.color, defaultColor)
      },
      // Setup transparency blending
      blend: Object.assign({
        enable: true,
        func: {
          src: 'one',
          dst: 'one minus src alpha'
        }
      }, opt.blend),
      // Disable depth by default
      depth: Object.assign({
        enable: false
      }, opt.depth),
      attributes,
      elements: regl.elements(cells)
    });

    return (params = {}) => {
      // Merge in defaults
      params = Object.assign({}, opt, params);

      // Reset to model
      mat4.identity(model);

      const scale = expandVector(params.scale, 1);

      // Reposition mesh
      if (params.position) mat4.translate(model, model, expandVector(params.position));

      // Align to origin (center or corner mode)
      if (params.center) {
        vec3.multiply(tmpOrigin, scale, centerOrigin);
        mat4.translate(model, model, tmpOrigin);
      }

      // Apply rotation
      if (params.rotation) {
        const hasPivot = Boolean(params.pivot);
        if (hasPivot) {
          // Determine real pivot point
          const pivot = expandVector(params.pivot);

          // Cancel Z component in pivoting
          pivot[2] = 0;

          vec3.multiply(tmpPivot, scale, pivot);
          vec3.negate(tmpPivotNegated, tmpPivot);

          // Move to pivot point
          mat4.translate(model, model, tmpPivot);
        }

        // Apply rotation
        mat4.rotateZ(model, model, params.rotation);

        // Negate pivot
        if (hasPivot) {
          mat4.translate(model, model, tmpPivotNegated);
        }
      }

      // Apply scale
      mat4.scale(model, model, scale);

      // Apply user transforms
      if (params.transform) mat4.multiply(model, model, params.transform);

      return drawMesh(Object.assign({}, params, {
        projection,
        model,
        view
      }));
    };
  }
};
