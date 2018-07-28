const createRegl = require('regl');
const defined = require('defined');
const { inverseLerp } = require('./math');
const cssColorParse = require('parse-color');
const { vec3, quat, mat4 } = require('gl-matrix');
const mat4Recompose = require('mat4-recompose');
const boundPoints = require('bound-points');
const { vertexNormals, faceNormals } = require('normals');

const createPrimitive = {
  sphere: require('primitive-sphere'),
  icosphere: require('primitive-icosphere'),
  torus: require('primitive-torus'),
  quad: require('primitive-quad'),
  circle: require('primitive-circle'),
  polyline: require('./primitive-polyline')
};

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
};

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

    // 2D Meshes
    rect: (opt = {}) => {
      const data = getNormalizedPrimitive2D(createPrimitive.quad(), {
        center: true
      });
      return mesh(data, Object.assign({}, opt, {
        unitShape: true
      }));
    },
    circle: (opt = {}) => {
      const fn = (params = {}) => {
        const segments = defined(params.segments, 128);
        return getNormalizedPrimitive2D(createPrimitive.circle(1, segments), {
          center: true
        });
      };
      return mesh(fn, Object.assign({}, opt, {
        unitShape: true,
        primitive: 'triangle fan'
      }));
    },
    polyline: (opt = {}) => {
      const fn = (params = {}) => {
        const data = createPrimitive.polyline(params.data || [], params);
        const result = getNormalizedPrimitive2D(data);
        return result;
      };
      return mesh(fn, opt);
    },
    // // 3D Meshes
    // sphere: (opt = {}) => {
    //   const segments = defined(opt.segments, 32);
    //   const primitive = createPrimitive.sphere(1, { segments });
    //   return mesh3D(primitive, opt);
    // }
  };

  // A unit 2D rectangle, circle, etc
  function getNormalizedPrimitive2D ({ positions, cells, normals, uvs }, opt = {}) {
    // Default to assuming the positions are a unit circle/box/etc
    normals = normals ? expandVectorList(normals) : positions.map(p => vec3.normalize([], expandVector(p)));
    // Planar UV across bounding box of mesh
    uvs = uvs || get2DUV(positions);
    // Assume 2D primitives are centered in -1..1 space, recenter to 0..1
    positions = opt.center ? recenter(positions) : positions;
    // Expand to 3D
    positions = expandVectorList(positions);
    return {
      positions,
      uvs,
      normals,
      cells
    };
  }

  // A unit 3D sphere, torus, etc
  function getNormalizedPrimitive3D ({ positions, cells, normals, uvs }, opt = {}) {
    return {
      positions,
      uvs,
      normals,
      cells
    };
  }

  function computeBoundingBox (points, output = {}) {
    if (!output.min) output.min = [ 0, 0, 0 ];
    if (!output.max) output.max = [ 0, 0, 0 ];
    if (!output.size) output.size = [ 0, 0, 0 ];
    vec3.set(output.min, Infinity, Infinity, Infinity);
    vec3.set(output.max, -Infinity, -Infinity, -Infinity);
    points.forEach(point => {
      for (let i = 0; i < point.length; i++) {
        if (point[i] < output.min[i]) output.min[i] = point[i];
        if (point[i] > output.max[i]) output.max[i] = point[i];
      }
    });
    for (let i = 0; i < output.min.length; i++) {
      if (!isFinite(output.min[i])) output.min[i] = 0;
      if (!isFinite(output.max[i])) output.max[i] = 0;
      output.size[i] = output.max[i] - output.min[i];
    }
    return output;
  }

  function mesh (vertexData, opt = {}) {
    let geometry = typeof vertexData === 'function' ? vertexData(opt) : vertexData;
    let destroyed = false;

    const model = mat4.clone(IDENTITY_MAT4);
    const centerOrigin = vec3.clone([ -0.5, -0.5, 0 ]);
    const tmpOrigin = vec3.create();
    const tmpPivot = vec3.create();
    const tmpPivotNegated = vec3.create();
    const defaultColor = getRGBColor(opt.color);
    const bounds = computeBoundingBox(geometry.positions);

    const attributes = {
      position: regl.buffer(geometry.positions),
      uv: regl.buffer(geometry.uvs),
      normal: regl.buffer(geometry.normals)
    };

    // mix in new attributes
    if (typeof opt.attributes === 'function') {

    }

    const elements = regl.elements(geometry.cells);

    const drawMesh = regl({
      // Fragment & Vertex shaders
      frag: (_, props) => props.frag || basicFragShader,
      vert: (_, props) => props.vert || basicVertShader,
      primitive: opt.primitive || 'triangles',
      uniforms: Object.assign({}, opt.uniforms, {
        projection: regl.prop('projection'),
        model: regl.prop('model'),
        view: regl.prop('view'),
        alpha: (_, props) => defined(props.alpha, 1),
        color: (_, props) => getRGBColor(props.color, defaultColor)
      }),
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
      elements
    });

    const draw = (params = {}) => {
      // Skip rendering if destroyed
      if (destroyed) return;

      // Merge in defaults
      params = Object.assign({}, opt, params);

      // Reset to model
      mat4.identity(model);

      const scale = expandVector(params.scale, 1);

      // Reposition mesh
      if (params.position) mat4.translate(model, model, expandVector(params.position));

      // Align to origin (center or corner mode)
      if (params.unitShape && params.center !== false) {
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

          vec3.multiply(tmpPivot, bounds.size, scale);
          vec3.multiply(tmpPivot, tmpPivot, pivot);
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

      // Finally submit GL draw call
      return drawMesh(Object.assign({}, params, {
        projection,
        model,
        view
      }));
    };

    // Maintain reference to the gometry of the mesh in case
    // user wishes to render it wireframe, vertices, etc...
    draw.geometry = geometry;

    // Update default parameters
    draw.update = (params = {}) => {
      Object.assign(opt, params);
    };

    // Send new vertex data to GPU
    draw.updateGeometry = (params = {}) => {
      if (typeof vertexData === 'function') {
        // Merge in defaults
        params = Object.assign({}, opt, params);

        const newData = vertexData(params, params);
        attributes.position(newData.positions);
        attributes.normal(newData.normals);
        attributes.uv(newData.uvs);
        elements(newData.cells);
        computeBoundingBox(newData.positions, bounds);
        draw.geometry = newData;
      }
    };

    // Destroy this command
    draw.destroy = () => {
      if (destroyed) return;
      destroyed = true;
      elements.destroy();
      Object.keys(attributes).forEach(key => {
        attributes[key].destroy();
      });
      draw.geometry = {};
    };

    return draw;
  }
};
