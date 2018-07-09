// a utility for random number generation
const seedRandom = require('seed-random');
const SimplexNoise = require('simplex-noise');
const { lerpArray, expand2D } = require('./math');
const { getPolylineArclengths } = require('./geom');

class NoiseGenerator {
  constructor (rnd) {
    this._simplex = new SimplexNoise(rnd);
  }

  noise1D (x) {
    return this._simplex.noise2D(x, 0);
  }

  noise2D (x, y) {
    return this._simplex.noise2D(x, y);
  }

  noise3D (x, y, z) {
    return this._simplex.noise3D(x, y, z);
  }

  noise4D (x, y, z, w) {
    return this._simplex.noise4D(x, y, z, w);
  }
}

class Rand {
  constructor (defaultSeed = null, opt = {}) {
    this.defaultRandom = Math.random;
    this.quiet = opt.quiet !== false;
    this._nextGaussian = null;
    this._hasNextGaussian = false;
    this.setSeed(defaultSeed);
  }

  createInstance (seed, opt) {
    return new Rand(seed, opt);
  }

  getRandomSeed () {
    const seed = String(Math.floor(Math.random() * 1000000));
    return seed;
  }

  setSeed (seed, opt = {}) {
    if (typeof seed === 'number' || typeof seed === 'string') {
      this.seed = String(seed);
      if (!this.quiet) console.log('[util-random] Current Seed:', this.seed);
      this.random = seedRandom(this.seed, opt);
    } else {
      this.seed = null;
      this.random = this.defaultRandom;
    }
    this.noiseGenerator = this._createNoise();
    this._nextGaussian = null;
    this._hasNextGaussian = false;
  }

  value () {
    return this.random();
  }

  valueNonZero () {
    let u = 0;
    while (u === 0) u = this.value();
    return u;
  }

  getSeed () {
    return this.seed;
  }

  // Should this be public?
  _createNoise () {
    return new NoiseGenerator(this.random);
  }

  permuteNoise () {
    this.noiseGenerator = this._createNoise();
  }

  noise1D (x) {
    return this.noiseGenerator.noise1D(x);
  }

  noise2D (x, y) {
    return this.noiseGenerator.noise2D(x, y);
  }

  noise3D (x, y, z) {
    return this.noiseGenerator.noise3D(x, y, z);
  }

  noise4D (x, y, z, w) {
    return this.noiseGenerator.noise4D(x, y, z, w);
  }

  sign () {
    return this.boolean() ? 1 : -1;
  }

  boolean () {
    return this.value() > 0.5;
  }

  chance (n = 0.5) {
    return this.value() < n;
  }

  range (min, max) {
    if (max === undefined) {
      max = min;
      min = 0;
    }

    if (typeof min !== 'number' || typeof max !== 'number') {
      throw new TypeError('Expected all arguments to be numbers');
    }

    return this.value() * (max - min) + min;
  }

  rangeFloor (min, max) {
    if (max === undefined) {
      max = min;
      min = 0;
    }

    if (typeof min !== 'number' || typeof max !== 'number') {
      throw new TypeError('Expected all arguments to be numbers');
    }

    return Math.floor(this.range(min, max));
  }

  pick (array) {
    if (array.length === 0) return undefined;
    return array[this.rangeFloor(0, array.length)];
  }

  shuffle (arr) {
    if (!Array.isArray(arr)) {
      throw new TypeError('Expected Array, got ' + typeof arr);
    }

    var rand;
    var tmp;
    var len = arr.length;
    var ret = arr.slice();
    while (len) {
      rand = Math.floor(this.value() * len--);
      tmp = ret[len];
      ret[len] = ret[rand];
      ret[rand] = tmp;
    }
    return ret;
  }

  insideSquare (scale = 1, out = []) {
    scale = expand2D(scale, 1);
    out[0] = scale[0] * this.range(-1, 1);
    out[1] = scale[1] * this.range(-1, 1);
    return out;
  }

  onSquare (scale = 1, out = []) {
    scale = expand2D(scale, 1);
    const path = [
      [ -scale[0], -scale[1] ], [ scale[0], -scale[1] ],
      [ scale[0], scale[1] ], [ -scale[0], scale[1] ]
    ];
    path.push(path[0]);
    return this.onPolyline(path, out);
  }

  onPolyline (path, out = []) {
    if (path.length === 0) {
      throw new Error('The path has no points; cannot determine a random point along it.');
    }
    if (path.length === 1) {
      return path[0].slice();
    }

    const arclengths = getPolylineArclengths(path);
    const edges = [];
    for (let i = 0; i < path.length - 1; i++) {
      edges.push(arclengths[i + 1] - arclengths[i]);
    }

    const index = this.weighted(edges);
    return this.onLineSegment(path[index], path[index + 1], out);
  }

  onLineSegment (a, b, out = []) {
    const t = this.value();
    return lerpArray(a, b, t, out);
  }

  onCircle (radius = 1, out = []) {
    const theta = this.value() * 2.0 * Math.PI;
    out[0] = radius * Math.cos(theta);
    out[1] = radius * Math.sin(theta);
    return out;
  }

  insideCircle (radius = 1, out = []) {
    this.onCircle(1, out);
    const r = radius * Math.sqrt(this.value());
    out[0] *= r;
    out[1] *= r;
    return out;
  }

  onSphere (radius = 1, out = []) {
    const u = this.value() * Math.PI * 2;
    const v = this.value() * 2 - 1;
    const phi = u;
    const theta = Math.acos(v);
    out[0] = radius * Math.sin(theta) * Math.cos(phi);
    out[1] = radius * Math.sin(theta) * Math.sin(phi);
    out[2] = radius * Math.cos(theta);
    return out;
  }

  insideSphere (radius = 1, out = []) {
    const u = this.value() * Math.PI * 2;
    const v = this.value() * 2 - 1;
    const k = this.value();

    const phi = u;
    const theta = Math.acos(v);
    const r = radius * Math.cbrt(k);
    out[0] = r * Math.sin(theta) * Math.cos(phi);
    out[1] = r * Math.sin(theta) * Math.sin(phi);
    out[2] = r * Math.cos(theta);
    return out;
  }

  quaternion (out = []) {
    const u1 = this.value();
    const u2 = this.value();
    const u3 = this.value();

    const sq1 = Math.sqrt(1 - u1);
    const sq2 = Math.sqrt(u1);

    const theta1 = Math.PI * 2 * u2;
    const theta2 = Math.PI * 2 * u3;

    const x = Math.sin(theta1) * sq1;
    const y = Math.cos(theta1) * sq1;
    const z = Math.sin(theta2) * sq2;
    const w = Math.cos(theta2) * sq2;
    out[0] = x;
    out[1] = y;
    out[2] = z;
    out[3] = w;
    return out;
  }

  weightedSet (set = []) {
    if (set.length === 0) return null;
    return set[this.weightedSetIndex(set)].value;
  }

  weightedSetIndex (set = []) {
    if (set.length === 0) return -1;
    return this.weighted(set.map(s => s.weight));
  }

  weighted (weights = []) {
    if (weights.length === 0) return -1;
    let totalWeight = 0;

    for (let i = 0; i < weights.length; i++) {
      totalWeight += weights[i];
    }

    if (totalWeight <= 0) throw new Error('Weights must sum to > 0');

    let random = this.value() * totalWeight;
    for (let i = 0; i < weights.length; i++) {
      if (random < weights[i]) {
        return i;
      }
      random -= weights[i];
    }
    return 0;
  }

  // Distributions

  gaussian (mean = 0, standardDerivation = 1) {
    // https://github.com/openjdk-mirror/jdk7u-jdk/blob/f4d80957e89a19a29bb9f9807d2a28351ed7f7df/src/share/classes/java/util/Random.java#L496
    if (this._hasNextGaussian) {
      this._hasNextGaussian = false;
      const result = this._nextGaussian;
      this._nextGaussian = null;
      return mean + standardDerivation * result;
    } else {
      let v1 = 0;
      let v2 = 0;
      let s = 0;
      do {
        v1 = this.value() * 2 - 1; // between -1 and 1
        v2 = this.value() * 2 - 1; // between -1 and 1
        s = v1 * v1 + v2 * v2;
      } while (s >= 1 || s === 0);
      const multiplier = Math.sqrt(-2 * Math.log(s) / s);
      this._nextGaussian = (v2 * multiplier);
      this._hasNextGaussian = true;
      return mean + standardDerivation * (v1 * multiplier);
    }
  }

  laplace (mean = 0, std = 1) {
    let u = this.value();
    u = u + u - 1.0;
    if (u > 0) return mean + std * -Math.log(1.0 - u);
    else return mean + std * Math.log(1.0 + u);
  }

  logistic (mean = 0, std = 1) {
    return mean + std * (-Math.log(1.0 / this.valueNonZero() - 1.0));
  }

  powerLaw (mean = 0, std = 1, alpha = 0, cut = 1) {
    if (alpha < 0) throw new Error('alpha must be >= 0');
    return mean + std * (cut * Math.pow(this.value(), 1.0 / (alpha + 1.0)));
  }

  weibull (mean = 0, std = 1, alpha = 1, beta = 1) {
    if (alpha <= 0) throw new Error('alpha must be > 0');
    return mean + std * Math.pow(beta * (-Math.log(1.0 - this.value())), 1.0 / alpha);
  }

  erlang (mean = 0, std = 1, exp = 1, variance = 1) {
    if (variance === 0) throw new Error('variance must be != 0');
    let k = Math.floor((exp * exp) / variance + 0.5);
    k = (k > 0) ? k : 1;
    let a = k / exp;
    let prod = 1.0;
    for (let i = 0; i < k; i++) prod *= this.value();
    return mean + std * (-Math.log(prod) / a);
  }

  lambda (mean = 0, std = 1, l3 = 1, l4 = 1) {
    let lSign = ((l3 < 0) || (l4 < 0)) ? -1 : 1;
    let u = this.valueNonZero();
    let x = lSign * (Math.exp(Math.log(u) * l3) - Math.exp(Math.log(1.0 - u) * l4));
    return mean + std * x;
  }

  triangular (mean = 0, std = 1) {
    let u = this.value();
    if (u <= 0.5) return mean + std * (Math.sqrt(2.0 * u) - 1.0);
    else return mean + std * (1.0 - Math.sqrt(2.0 * (1.0 - u)));
  }

  cauchy (mean = 0, std = 1) {
    return mean + std * Math.tan(Math.PI * this.value());
  }
}

module.exports = new Rand();
