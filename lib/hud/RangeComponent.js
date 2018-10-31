/** @jsx h */
import { h, Component } from 'preact';
import defined from 'defined';

// TODO: Find a better module than this one...
const touches = require('touches');

function lerp (min, max, t) {
  return min * (1 - t) + max * t;
}

function unlerp (min, max, t) {
  if (Math.abs(min - max) < Number.EPSILON) return 0;
  else return (t - min) / (max - min);
}

export default class RangeComponent extends Component {

  constructor (props) {
    super(props);
    this.state = {
      finishing: false,
      value: this.props.value || 0
    };
    this.dragging = false;
  }

  componentDidMount () {
    this._touch = touches(window, {
      target: this.container,
      filtered: true,
      preventSimulated: false
    });

    this._touch.on('move', this.onMouseMove.bind(this));
    this._touch.on('start', this.onMouseStart.bind(this));
    this._touch.on('end', this.onMouseEnd.bind(this));

    this._setValue(this.state.value);
    this._updateState(this.state.value);
  }
  
  componentWillUnmount () {
    this._touch.disable();
  }
  
  componentWillUpdate (props, state) {
    if (this.state.value !== state.value) {
      this._updateState(state.value);
    }
  }

  componentDidUpdate (prevProps, prevState) {
    if (prevState.value !== this.state.value) {
      // opt.onFinishChange(result);
      this.props.onInput(this.state.value);
    }

    if (prevState.finishing !== this.state.finishing && this.state.finishing) {
      this.props.onChange(this.state.value);
      this.setState({ finishing: false });
    }
  }

  onMouseStart (ev, pos) {
    if (ev.target === this.container || ev.target === this.thumb) {
      this.dragging = true;
      this._update(ev, pos);
    }
  }

  onMouseEnd (ev, pos) {
    if (this.dragging) {
      this.dragging = false;
      this.setState({ finishing: true });
    }
  }

  onMouseMove (ev, pos) {
    if (!this.dragging) return false;
    this._update(ev, pos);
  }

  _update (ev, pos) {
    if (this.dragging) ev.preventDefault();
    const rect = this.container.getBoundingClientRect();
    const t = Math.max(0, Math.min(1, pos[0] / rect.width));

    const min = defined(this.props.min, 0);
    const max = defined(this.props.max, 1);
    const step = defined(this.props.step, 0.01);

    let newValue = lerp(min, max, t);
    newValue = (Math.round(newValue / step) * step);

    this._setValue(newValue);
  }

  _updateState (value) {
    const min = defined(this.props.min, 0);
    const max = defined(this.props.max, 1);
    const step = defined(this.props.step, 0.01);

    // clamp to step
    value = (Math.round(value / step) * step);

    const t = unlerp(min, max, value);

    this.thumb.style.width = `${(t * 100).toFixed(5)}%`;
  }

  _setValue (value) {
    this.setState({
      value
    });
  }

  render (props) {
    return <div
      ref={c => { this.container = c; }}
      class='canvas-sketch--hud-input-range'>
      <div
        ref={c => { this.thumb = c; }}
        class='canvas-sketch--hud-input-range-thumb'>
      </div>
    </div>;
  }
}