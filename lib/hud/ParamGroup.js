/** @jsx h */
import { h, Component } from 'preact';
import toParamProps, { reservedKeys } from './toParamProps';
import parseColor from 'parse-color';
import defined from 'defined';

const rgbToHex = (rgb) => {
  const r = rgb[0];
  const g = rgb[1];
  const b = rgb[2];
  return ((b | g << 8 | r << 16) | 1 << 24).toString(16).slice(1);
};

const parseColorOrText = (opt = {}) => {
  const type = opt.type;
  const value = opt.value;

  // Whether user is explicitly requesting a color
  const isColorType = type === 'color';

  if (typeof value === 'string') {
    // Value is a string so this may or may not be a color
    const parsedColor = (!type || type === 'color') ? parseColor(value) : null;
    if (parsedColor && parsedColor.hex) {
      // We could parse the text as color
      return { value: parsedColor.hex, type: 'color' };
    } else if (isColorType) {
      // User expects this to be a color but we can't parse it
      console.warn(`Could not parse the "${opt.name}" color string ${value}`);
      return { type: 'text', value };
    } else {
      // Could not parse as color, assume its text
      return { type: 'text', value };
    }
  } else if (Array.isArray(value) && isColorType) {
    if (value.length < 3) {
      console.warn(`Could not parse the "${opt.name}" color array: it must have a size of >= 3`);
      return null;
    }
    if (!opt.format) {
      console.warn(`Could not parse the "${opt.name}" color array: it must have a { format } option such as "rgb-byte"`);
      return null;
    }
    // Color formatting only works if type is "color"
    const format = defined(opt.format, 'rgb-byte');
    if (format === 'rgb-byte' || format === 'rgb-float') {
      const hex = rgbToHex(value.map(n => {
        if (format === 'rgb-byte') {
          return Math.max(0, Math.min(255, Math.floor(n)));
        } else {
          return Math.max(0, Math.min(255, Math.floor(n * 255)));
        }
      }));
      return { type: 'color', value: `#${hex}` };
    }
  }
};

const ParamNode = (opt = {}) => {
  let name = opt.name;
  let value = opt.value;
  let inputValue = value;
  let inputType;
  let attrs = {};

  const parsedResult = parseColorOrText(opt);
  if (parsedResult) {
    inputValue = parsedResult.value;
    inputType = parsedResult.type;
    // inputValue = parsedColor.value;
    // inputType = 'color';
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
    if (opt.type === 'color' && opt.format) {
      const parsed = parseColor(newValue);
      if (opt.format === 'rgb-byte') newValue = parsed.rgb.slice();
      else if (opt.format === 'rgb-float') newValue = parsed.rgb.map(n => n / 255);
    }
    opt.onChange(newValue);
    return newValue;
  };

  if (opt.type === 'button' || typeof value === 'function') {
    return <div class='canvas-sketch--hud-param-cell'>
      <div class='canvas-sketch--hud-param-value' title={name}>
        <button onClick={ev => {
          ev.preventDefault();
          if (typeof value === 'function') {
            value(opt.sketch.props, opt.sketch.settings);
          }
        }}>{name}</button>
      </div>
    </div>;
  } else {
    if (inputType) {
      if (inputValue == null) {
        if (inputType === 'number' || inputType === 'range') {
          inputValue = defined(attrs.min, 0);
        } else if (inputType === 'checkbox') {
          inputValue = false;
        }
      }
      value = <input
        {...attrs}
        onChange={ev => {
          const result = onChange(ev);
          opt.onFinishChange(result);
        }}
        onInput={onChange}
        type={inputType}
        value={inputValue}
      />;
    }

    return <div class='canvas-sketch--hud-param-cell'>
      <div class='canvas-sketch--hud-param-label' title={name}>{name}</div>
      <div class='canvas-sketch--hud-param-value'>{value}</div>
    </div>;
  }
};

const ParamGroup = (props = {}) => {
  const {
    params,
    filter,
    sketch,
    header
  } = props;

  const paramNodes = Object.keys(params).map(key => {
    const value = params[key];

    if (reservedKeys.includes(key)) {
      // Don't render reserved keys for now...
      return false;
    }

    const paramProps = toParamProps(key, value);
    // Param is hidden
    if (paramProps.visible === false) {
      return false;
    }

    // Param is filtered out
    if (filter && paramProps.name) {
      const matches = paramProps.name.toLowerCase().includes(filter);
      if (!matches) return false;
    }

    if (paramProps.type === 'folder') {
      return <ParamGroup
        {...props}
        header={paramProps.name}
        params={value}
      />;
    } else {
      return <ParamNode
        sketch={sketch}
        {...paramProps}
        key={key}
        onFinishChange={ev => {
          sketch._paramManager.applyChanges();
        }}
        onChange={ev => {
          const newParams = {};
          newParams[key] = ev;
          sketch.update({
            params: newParams
          });
        }}
      />;
    }
  }).filter(Boolean);

  return <div class='canvas-sketch--hud-params'>
    {header && <header class='canvas-sketch--hud-params-header'>{header}</header>}
    {paramNodes}
  </div>;
};

export default ParamGroup;
