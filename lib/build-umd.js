const banner = `(function (root, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
	typeof define === 'function' && define.amd ? define(factory) :
	(root.canvasSketch = factory());
}(this, function factory (global) {
`;

const footer = `  return canvasSketch.default;
}));`

const esbuild = require('esbuild');
const path = require('path');

(async () => {
  esbuild.build({
    entryPoints: [path.resolve(__dirname, './canvas-sketch.js')],
    bundle: true,
    globalName: 'canvasSketch',
    sourcemap: true,
    banner,
    footer,
    target: 'chrome58,firefox57,safari11,edge16'.split(','),
    format: 'iife',
    outfile: path.resolve(__dirname, '../dist/canvas-sketch.umd.js'),
  }).then(result => {
    console.log('done!')
  });
})();
