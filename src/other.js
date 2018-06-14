/** @jsx h */
const { h, render } = require('preact');
const CanvasSketcher = require('./CanvasSketcher');
const { EventEmitter } = require('events');

module.exports = function (sketch, settings = {}) {
  if (!sketch || typeof sketch !== 'function') throw new Error('Must specify a sketch function as the first argument');

  const parent = settings.parent || document.body;
  render(<CanvasSketcher sketch={sketch} settings={settings} />, parent);
};
