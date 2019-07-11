const test = require('ava');
const canvasSketch = require('../dist/canvas-sketch');

test('foo', t => {
  canvasSketch();
  t.pass()
});
