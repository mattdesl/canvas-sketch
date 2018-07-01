// a utility for random number generation
const seedRandom = require('seed-random');
const SimplexNoise = require('simplex-noise');

class Rand {
  constructor (defaultSeed = null, opt = {}) {
    this.defaultRandom = Math.random;
    this.quiet = opt.quiet !== false;
    this.setSeed(defaultSeed);
  }

  createInstance (seed, opt) {
    return new Rand(seed, opt);
  }

  getRandomSeed () {
    const seed = String(Math.floor(Math.random() * 1000000));
    return seed;
  }

  setSeed (seed) {
    if (typeof seed === 'number' || typeof seed === 'string') {
      this.seed = String(seed);
      if (!this.quiet) console.log('[util-random] Current Seed:', this.seed);
      this.random = seedRandom(this.seed);
    } else {
      this.seed = null;
      this.random = this.defaultRandom;
    }
    this.simplex = new SimplexNoise(this.random);
  }

  getSeed () {
    return this.seed;
  }

  noise2D (x, y) {
    return this.simplex.noise2D(x, y);
  }

  noise3D (x, y, z) {
    return this.simplex.noise3D(x, y, z);
  }

  noise4D (x, y, z, w) {
    return this.simplex.noise4D(x, y, z, w);
  }

  gaussian () {
    return Math.sqrt(-2.0 * Math.log(this.random())) * Math.cos(2.0 * Math.PI * this.random());
  }

  sign () {
    return this.randomBoolean() ? 1 : -1;
  }

  boolean () {
    return this.random() > 0.5;
  }

  range (min, max) {
    if (max === undefined) {
      max = min;
      min = 0;
    }

    if (typeof min !== 'number' || typeof max !== 'number') {
      throw new TypeError('Expected all arguments to be numbers');
    }

    return this.random() * (max - min) + min;
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

  shuffleArray (arr) {
    if (!Array.isArray(arr)) {
      throw new TypeError('Expected Array, got ' + typeof arr);
    }

    var rand;
    var tmp;
    var len = arr.length;
    var ret = arr.slice();
    while (len) {
      rand = Math.floor(this.random() * len--);
      tmp = ret[len];
      ret[len] = ret[rand];
      ret[rand] = tmp;
    }
    return ret;
  }

  insideBox (out = [], scale = 1) {
    if (!Array.isArray(scale)) scale = [ scale, scale ];
    out[0] = scale[0] * this.range(-1, 1) / 2;
    out[1] = scale[1] * this.range(-1, 1) / 2;
    return out;
  }

  onCircle (out = [], scale = 1) {
    var r = this.random() * 2.0 * Math.PI;
    out[0] = Math.cos(r) * scale;
    out[1] = Math.sin(r) * scale;
    return out;
  }

  insideCircle (out = [], scale = 1) {
    return this.onCircle(out, this.range(0, scale));
  }

  onSphere (out = [], scale = 1) {
    var r = this.random() * 2.0 * Math.PI;
    var z = (this.random() * 2.0) - 1.0;
    var zScale = Math.sqrt(1.0 - z * z) * scale;
    out[0] = Math.cos(r) * zScale;
    out[1] = Math.sin(r) * zScale;
    out[2] = z * scale;
    return out;
  }

  insideSphere (out = [], scale = 1) {
    return this.onSphere(out, this.range(0, scale));
  }

  onHemisphere (out = [], scale = 1) {
    var r = this.random() * 1.0 * Math.PI;
    var z = (this.random() * 2.0) - 1.0;
    var zScale = Math.sqrt(1.0 - z * z) * scale;
    out[0] = Math.cos(r) * zScale;
    out[1] = Math.sin(r) * zScale;
    out[2] = z * scale;
    return out;
  }

  insideHemisphere (out = [], scale = 1) {
    return this.onHemisphere(out, this.range(0, scale));
  }

  quaternion (out = []) {
    const u1 = this.random();
    const u2 = this.random();
    const u3 = this.random();

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

    let random = this.random() * totalWeight;
    for (let i = 0; i < weights.length; i++) {
      if (random < weights[i]) {
        return i;
      }
      random -= weights[i];
    }
    return 0;
  }
}

module.exports = new Rand();
