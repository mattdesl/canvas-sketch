/** @jsx h */
const { h, Component } = require('preact');

// Grab our sketch & settings
const sketch = require('./background-sketch');

// The actual canvas-sketch library
const canvasSketch = require('canvas-sketch');

// Utility for preact className
const classnames = require('classnames');

module.exports = class Canvas extends Component {

  componentDidMount () {
    // Since we render() the canvas, it will be the 'base' element
    const canvas = this.base;

    // Setup a new canvas-sketch
    this.sketch = canvasSketch(sketch, Object.assign({}, sketch.settings, { canvas }));
    this._handleActive(this.props);
  }

  componentWillReceiveProps (newProps) {
    this._handleActive(newProps);
  }

  _handleActive (newProps) {
    this.sketch.then(sketch => {
      if (newProps.active && !sketch.playing) sketch.play();
      else sketch.stop();
    });
  }

  shouldComponentUpdate (newProps) {
    return newProps.active !== this.props.active;
  }

  render () {
    const className = classnames('background-canvas', {
      active: this.props.active
    });
    return <canvas className={className} />;
  }
};
