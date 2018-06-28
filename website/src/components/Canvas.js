/** @jsx h */
const { h, Component } = require('preact');

// Grab our sketch & settings
const sketch = require('./background-sketch');

// The actual canvas-sketch library
const canvasSketch = require('canvas-sketch');

module.exports = class Canvas extends Component {

  componentDidMount () {
    // Since we render() the canvas, it will be the 'base' element
    const canvas = this.base;

    // Setup a new canvas-sketch
    canvasSketch(sketch, Object.assign({}, sketch.settings, { canvas }));
  }

  shouldComponentUpdate () {
    return false;
  }

  render () {
    return <canvas />;
  }
};
