/** @jsx h */
const { h, Component, render } = require('preact');
const rightNow = require('right-now');
const defined = require('defined');
const isPromise = require('is-promise');
const { saveCanvas, saveFile } = require('texel/util/exporter');
const Surface = require('./Surface');

module.exports = class CanvasSketcher extends Component {
  constructor (props) {
    super(props);
    this.state = {
    };
  }

  componentDidMount () {
    this.surface.load(this.props.sketch);
  }

  componentDidUpdate (prevProps) {
    if (prevProps.sketch !== this.props.sketch) {
      this.surface.load(this.props.sketch);
    }
  }

  render (props) {
    return <Surface {...props} ref={c => { this.surface = c; }} />;
  }
};
