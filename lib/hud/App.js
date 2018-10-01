/** @jsx h */
import { h, Component } from 'preact';

// TODO: Use a smaller library that is just CSS compliant
import parseColor from 'parse-color';

const Param = (props) => {
  let name = props.name;
  let value = props.value;
  let opt = {};
  if (typeof value === 'object') {
    opt = value;
    name = opt.name || props.name;
    value = opt.value;
  }

  if (opt.visible === false) {
    return false;
  }

  let inputValue = value;
  let inputType;
  let attrs = {};

  if (props.filter) {
    const matches = (name || '').toLowerCase().includes(props.filter);
    if (!matches) return false;
  }

  if (typeof value === 'string') {
    const parsedColor = opt.type !== 'text' ? parseColor(value) : null;
    if (parsedColor && parsedColor.hex) {
      inputValue = parsedColor.hex;
      inputType = 'color';
    } else {
      inputType = 'text';
    }
  } else if (typeof value === 'number') {
    const hasMin = typeof opt.min !== 'undefined';
    const hasMax = typeof opt.max !== 'undefined';

    if (opt.type !== 'number' && (hasMin && hasMax)) {
      inputType = 'range';
    } else {
      inputType = 'number';
    }

    if (hasMin) attrs.min = opt.min;
    if (hasMax) attrs.max = opt.max;
    if (typeof opt.step !== 'undefined') {
      attrs.step = opt.step;
    }
  } else if (opt.type === 'checkbox' || typeof value === 'boolean') {
    inputType = 'checkbox';
    if (value) attrs.checked = 'checked';
    inputValue = undefined;
  }

  const onChange = ev => {
    const target = ev.currentTarget;
    let newValue;
    if (inputType === 'range' || inputType === 'number') {
      newValue = target.valueAsNumber;
    } else if (inputType === 'checkbox') {
      newValue = Boolean(target.checked);
    } else {
      newValue = target.value;
    }
    props.onChange(newValue);
  };

  if (opt.type === 'button' || typeof value === 'function') {
    return <div class='canvas-sketch--hud-param-cell'>
      <div class='canvas-sketch--hud-param-value' title={name}>
        <button onClick={ev => {
          ev.preventDefault();
          if (typeof value === 'function') {
            value(props.sketch.props, props.sketch.settings);
          }
        }}>{name}</button>
      </div>
    </div>;
  } else {
    if (inputType) {
      value = <input
        {...attrs}
        onChange={onChange}
        onInput={onChange}
        type={inputType}
        value={inputValue}
      />;
    }

    return <div class='canvas-sketch--hud-param-cell'>
      <div class='canvas-sketch--hud-param-header' title={name}>{name}</div>
      <div class='canvas-sketch--hud-param-value'>{value}</div>
    </div>;
  }
};

const Sketch = (props) => {
  const filter = props.filter;
  const sketch = props.sketch;
  const params = sketch._params;
  const paramList = Object.keys(params).map(key => {
    return { key, value: params[key] };
  });
  return <div class='canvas-sketch--hud-sketch'>
    <header>{sketch.settings.name || 'untitled sketch'}</header>
    <div class='canvas-sketch--hud-params'>
      {
        paramList.map(({ key, value }) => {
          return <Param
            filter={filter}
            sketch={sketch}
            key={key}
            name={key}
            value={value}
            onChange={ev => {
              const newParams = {};
              newParams[key] = ev;
              sketch.update({
                params: newParams
              });
              props.onParamChange(ev, params, key, sketch)
            }}
          />;
        }).filter(Boolean)
      }
    </div>
  </div>;
};

const FilterBox = (props) => {
  const onChange = ev => {
    props.onChange(ev.currentTarget.value.toLowerCase());
  };
  return <div class='canvas-sketch--hud-filter'>
    <input
      onInput={onChange}
      onChange={onChange}
      type='text'
      placeholder='Filter parameters...'
    />
  </div>;
};

export default class App extends Component {
  constructor (props) {
    super(props);
    this.state = {
      filter: ''
    };
  }

  render (props) {
    const onParamChange = (ev, sketch) => {
    };
    return <div class='canvas-sketch--hud-sketch'>
      <FilterBox onChange={filter => this.setState({ filter })} />
      {
        props.sketches.map(sketch => {
          return <Sketch filter={this.state.filter} sketch={sketch} onParamChange={onParamChange} />;
        })
      }
    </div>;
  }
};
