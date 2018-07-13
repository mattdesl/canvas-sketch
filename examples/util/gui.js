const insertCSS = require('insert-css');
const { EventEmitter } = require('events');

const css = `
  #controlKit .panel {
    border-radius: 0;
    box-shadow: none;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol";
  }
`;

class ControlProp extends EventEmitter {
  constructor (type, defaultValue, options = {}) {
    super();
    this.type = type;
    this.defaultValue = getDefaultValue(this.type, defaultValue);
    this.options = options;
  }
}

class GroupProp extends EventEmitter {
  constructor (controls) {
    super();
    this.controls = controls;
  }
}

module.exports = function (opt = {}) {
  const ControlKit = require('controlkit');
  const controlKit = new ControlKit(opt);
  const align = opt.align || 'right';
  const panel = controlKit.addPanel(Object.assign({
    label: 'sketch controls'
  }, opt, {
    align
  }));

  const _addComponent = panel._addComponent;
  panel._addComponent = function () {
    let groups = this._groups;
    if (groups.length === 0) {
      return _addComponent.apply(this, arguments);
    }
    const idx = this._currentGroupIndex != null ? this._currentGroupIndex : groups.length - 1;
    const group = groups[idx];
    group.addComponent.apply(group, arguments);
    return this;
  };

  const parent = controlKit.getNode().getElement();
  Object.assign(parent.style, {
    display: 'flex',
    flexDirection: align === 'right' ? 'row-reverse' : 'row'
  });

  insertCSS(css);

  const Controls = createControls();

  return {
    Controls,
    addControl,
    controlKit,
    panel,
    parent
  };

  function addControl (target, key, control, currentPanel = panel, currentGroup, onChange = (() => {})) {
    if (!target) throw new Error('Must supply a target');
    const fnKey = `add${control.type}`;
    if (!(fnKey in panel)) {
      throw new Error(`Control type ${control.type} must map to a function like NumberInput or Color`);
    }
    if (key in target) {
      throw new Error(`Already a control with the key ${key} in this panel`);
    }
    target[key] = control.defaultValue;

    const options = Object.assign({}, control.options, {
      onChange: (ev) => {
        const parent = control.options.onChange || (() => {});
        const ret = parent(ev);
        onChange(ev);
        return ret;
      }
    });

    if (control.type === 'Select') {
      const targetKey = options.target || `${key}Target`;
      if (!options.target && targetKey in target) {
        throw new Error(`Already a key by name ${targetKey}, try specifying a new one with { target } option to Select`);
      }
      target[targetKey] = options.selected || control.defaultValue[0];
      currentPanel[fnKey](target, key, Object.assign({}, options, {
        target: targetKey
      }));
    } else if (control.type === 'Slider') {
      const rangeKey = options.rangeKey || `${key}Range`;
      if (rangeKey in target) {
        throw new Error(`Already a key by name ${rangeKey}, try specifying a new one with { rangeKey } option to Slider`);
      }
      target[rangeKey] = options.range || [ 0, 1 ];
      currentPanel[fnKey](target, key, rangeKey, options);
      if (options.showRange) {
        currentPanel.addRange(target, rangeKey, options);
      }
    } else if (control.type === 'Button') {
      currentPanel[fnKey](key, ev => {
        const ret = typeof control.defaultValue === 'function' ? control.defaultValue(ev) : undefined;
        onChange();
        return ret;
      }, options);
    } else {
      currentPanel[fnKey](target, key, options);
    }
  }

  function detectControlProp (value) {
    if (typeof value === 'number') {
      return new ControlProp('NumberOutput', value);
    } else if (typeof value === 'function') {
      return new ControlProp('Button', value);
    }
  }

  function createControls () {
    const listeners = [];

    const createObjectRecursive = (obj, onChange, target = {}, currentPanel = panel, currentGroup, depth = 0) => {
      Object.keys(obj).forEach(key => {
        const value = obj[key];
        if (value && typeof value === 'object') {
          if (value instanceof ControlProp) {
            // a single control
            addControl(target, key, value, currentPanel, currentGroup, onChange);
          } else {
            // a sub-group
            const panelOpt = { label: key };
            let newGroup;
            if (depth === 0) {
              currentPanel.addGroup(panelOpt);
              const groups = currentPanel.getGroups();
              newGroup = groups[groups.length - 1];
              console.log(newGroup)
            } else {
              currentPanel.addSubGroup(panelOpt);
            }
            const subTarget = {};
            target[key] = createObjectRecursive(value, onChange, subTarget, currentPanel, newGroup, depth + 1);
          }
        } else {
          const detected = detectControlProp(value);
          if (detected) addControl(target, key, detected, currentPanel, currentGroup, onChange);
        }
      });
      return target;
    };

    const createObject = (obj) => {
      const result = createObjectRecursive(obj, (ev) => {
        listeners.forEach(fn => fn(ev));
      });
      controlKit.update();
      return result;
    };

    const onChange = (cb) => {
      if (typeof cb !== 'function') throw new Error('expected function');
      listeners.push(cb);
      return createObject;
    };

    const save = () => {
      controlKit.update();
      const data = controlKit._panels.map(panel => panel.getData());
      return data;
    };

    const load = (settings) => {
      controlKit.loadSettings(settings);
      controlKit.update();
    };

    const typeFuncs = [
      'NumberInput',
      'NumberOutput',
      'StringInput',
      'StringOutput',
      'Slider',
      'Range',
      'Button',
      'Checkbox',
      'Select',
      'Color',
      'Pad',
      'FunctionPlotter',
      'ValuePlotter'
    ].reduce((dict, type) => {
      dict[type] = (defaultValue, opt = {}) => {
        return new ControlProp(type, defaultValue, opt);
      };
      return dict;
    }, {});

    return Object.assign(createObject, typeFuncs, {
      onChange,
      save,
      load,
      update: () => controlKit.update()
    });
  }
};

function getDefaultValue (type, defaultValue) {
  if (defaultValue) return defaultValue;

  if (type === 'Range') return [ 0, 1 ];
  else if (type === 'Color') return '#000000';
  else if (type === 'StringInput' || type === 'StringOutput') return '';
  else if (type === 'Button') return () => {};
  else if (type === 'Checkbox') return false;
  else if (type === 'Select') return [];
  else return 0;
}
