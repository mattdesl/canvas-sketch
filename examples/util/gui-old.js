const dat = require('dat.gui');
const defined = require('defined');
const { EventEmitter } = require('events');
const parseColor = require('parse-color');

let gui;
let visible = true;
let enabled = true;

const noop = () => {};

const storage = {
  isVisible: () => {
    const result = window.localStorage.getItem('texel.param.gui.visible');
    return String(result) !== 'false';
  },
  setVisible: (bool) => window.localStorage.setItem('texel.param.gui.visible', String(bool))
};

const setVisible = (bool) => {
  visible = bool;
  const element = document.querySelector('.dg.ac');
  if (element) {
    storage.setVisible(bool);
    element.style.display = (enabled && bool) ? '' : 'none';
  }
};

const isVisible = () => visible;

const getRootGUI = () => {
  if (!gui) {
    window.removeEventListener('keydown', dat.GUI._keydownHandler, false);
    gui = new dat.GUI();
    setVisible(storage.isVisible());
    // document.querySelector('.dg.ac .close-button.close-bottom').textContent += ' (H key to hide/show)'
    window.addEventListener('keydown', ev => {
      if (ev.keyCode === 72) {
        setVisible(!isVisible());
      }
    });
  }
  return gui;
};

class Prop extends EventEmitter {
  constructor (defaultValue, opt = {}) {
    super();
    this.isProp = true;
    this.visible = opt.visible !== false;
    this.type = opt.type || 'prop';
    this._value = undefined;
    this.defaultValue = defaultValue;

    // copy over props
    Object.keys(opt).forEach(key => {
      this[key] = opt[key];
    });

    this.value = defaultValue;
  }

  get value () {
    return this._value;
  }

  set value (val) {
    if (this.type === 'color') {
      const input = val;
      val = toHexColor(String(val));
      if (typeof val === 'undefined') throw new TypeError(`Must specify a valid CSS color string to Param.color(), the input "${input}" is invalid`);
    } else if (this.type === 'number') {
      if (isFinite(this.min)) val = Math.max(this.min, val);
      if (isFinite(this.max)) val = Math.min(this.max, val);
    } else if (this.type === 'func') {
      const fn = val;
      const self = this;
      val = function () {
        return fn.apply(self, Array.prototype.slice.call(arguments));
      };
    } else if (this.type === 'option') {
      // TODO: Parse options in a smarter way?
      if (Array.isArray(this.values)) {
        const ret = this.values.find(n => n === val);
        if (ret) val = ret;
      } else if (this.values && typeof this.values === 'object') {
        const ret = Object.keys(this.values).find(n => n === val);
        if (ret) val = this.values[ret];
      }
      // if (typeof this.defaultValue === 'number' && typeof val === 'string') {
      //   val = parseFloat(val);
      // }
      // if (Array.isArray(this.values)) {
      //   console.log(typeof val);
      //   if (!this.values.includes(val)) val = this.values[0];
      // } else if (this.values && typeof this.values === 'object') {
      //   if (!(val in this.values)) val = Object.values(this.values)[0];
      // }
    } else if (this.type === 'string') {
      val = String(val || '');
    }

    const oldVal = this._value;
    this._value = val;
    if (oldVal !== val) {
      this.emit('change', val, oldVal);
    }
  }
}

class ParamGroup extends EventEmitter {
  constructor (props = {}, opt = {}) {
    super();
    this.props = props;
    this.name = opt.name;
    this.open = opt.open;
    this.visible = opt.visible !== false;
    this.isParamGroup = true;
    this._attached = false;
    this.gui = this;

    // Bind some functions to itself since these
    // might be destructured by user
    this.attach = this.attach.bind(this);
    this.detach = this.detach.bind(this);

    const _walkProps = (props) => {
      return Object.keys(props).reduce((dict, key) => {
        const propObject = props[key];
        if (propObject && propObject.isProp) {
          Object.defineProperty(dict, key, {
            enumerable: true,
            configurable: true,
            get: () => propObject.value,
            set: (val) => {
              propObject.value = val;
              propObject.emit('needs-update');
            }
          });
          propObject.on('change', () => this.emit('change', propObject));
        } else if (propObject && typeof propObject === 'object') {
          // try to walk it
          dict[key] = _walkProps(propObject, {});
        } else {
          dict[key] = propObject;
        }
        return dict;
      }, {});
    };
    this.params = _walkProps(this.props);
    this.attach(opt.parent);
  }

  detach () {
    console.warn('not yet implemented');
  }

  attach (parentGUI) {
    if (this._attached) return;
    this._attached = true;
    if (!parentGUI) parentGUI = getRootGUI();
    const addGUI = (folder, name, prop) => {
      const obj = { value: prop.value };
      const key = 'value';
      const onChange = () => {
        prop.value = obj.value;
      };
      const getItem = (type) => {
        switch (prop.type) {
          case 'color':
            return folder.addColor(obj, key);
          case 'bool':
          case 'func':
          case 'string':
            return folder.add(obj, key);
          case 'option':
            return folder.add(obj, key, prop.values);
          case 'number':
            let result = folder.add(obj, key, prop.min, prop.max);
            if (prop.step != null) result.step(prop.step);
            return result;
          default:
            throw new TypeError(`Invalid prop type ${prop.type}`);
        }
      };
      const controller = getItem(prop.type).name(name);
      if (prop.type !== 'func') controller.onChange(onChange);
      prop.on('needs-update', () => {
        obj[key] = prop.value;
        controller.updateDisplay();
      });
      return controller;
    };

    const _walkProps = (props, parentFolder) => {
      return Object.keys(props).forEach(key => {
        const propObject = props[key];
        if (propObject && propObject.isParamGroup) {
          if (propObject.visible) {
            const folder = parentFolder.addFolder(defined(propObject.name, key));
            if (propObject.open !== false) folder.open();
            else folder.close();
            _walkProps(propObject.props, folder);
          }
        } else if (propObject && propObject.isProp) {
          if (propObject.visible) {
            addGUI(parentFolder, propObject.name || key, propObject);
          }
        } else if (propObject && typeof propObject === 'object') {
          const folder = parentFolder.addFolder(key);
          folder.open();
          _walkProps(propObject, folder);
        } else {
          // Just ignore non-props for now
        }
      });
    };
    if (this.visible) {
      if (this.name) {
        parentGUI = parentGUI.addFolder(this.name);
        if (this.open !== false) parentGUI.open();
        else parentGUI.close();
      }
      _walkProps(this.props, parentGUI);
    }
    return this;
  }
}

module.exports = function (opt = {}, groupOpts = {}) {
  // Convert options into valid Prop types first
  const _walk = (props) => {
    return Object.keys(props).reduce((dict, key) => {
      let propObject = props[key];
      if (propObject != null && !propObject.isProp && !propObject.isParamGroup) {
        const detected = detectProp(propObject, key);
        if (detected) {
          const defaultValue = detected.value;
          delete detected.value;
          propObject = module.exports.prop(defaultValue, detected);
        }
      }

      if (!propObject) {
        throw new Error(`Invalid Param value for key "${key}", try using a value that can be coerced to a property, or explicitly state the param type with Param.prop() methods.`);
      }

      if (propObject && typeof propObject === 'object' && !propObject.isProp && !propObject.isParamGroup) {
        propObject = _walk(propObject);
      }

      dict[key] = propObject;
      return dict;
    }, {});
  };

  const props = _walk(opt);
  return new ParamGroup(props, groupOpts);
};

module.exports.prop = function (defaultValue, opt = {}) {
  return new Prop(defaultValue, opt);
};

module.exports.bool = function (defaultValue = false, opt = {}) {
  return module.exports.prop(defaultValue, {
    ...opt,
    type: 'bool'
  });
};

module.exports.color = function (defaultValue = '#ffffff', opt = {}) {
  return module.exports.prop(defaultValue, {
    ...opt,
    type: 'color'
  });
};

module.exports.string = function (defaultValue = '', opt = {}) {
  return module.exports.prop(defaultValue, {
    ...opt,
    type: 'string'
  });
};

module.exports.func = function (defaultValue = noop, opt = {}) {
  return module.exports.prop(defaultValue, {
    ...opt,
    type: 'func'
  });
};

module.exports.folder = function (values = {}, opt = {}) {
  return module.exports.prop(values, {
    ...opt,
    type: 'folder'
  });
};

module.exports.option = function (defaultValue = [], opt = {}) {
  return module.exports.prop(defaultValue, {
    values: opt,
    type: 'option'
  });
};

module.exports.number = function (defaultValue = 0, opt = {}) {
  const args = Array.prototype.slice.call(arguments);
  const numberArgs = args.slice(1);
  if (numberArgs.some(n => typeof n === 'number')) {
    const min = numberArgs[0];
    const max = numberArgs[1];
    const step = numberArgs[2];
    const newOpt = numberArgs[3] || {};
    opt = { min, max, step, ...newOpt };
  }
  return module.exports.prop(defaultValue, {
    ...opt,
    type: 'number'
  });
};

module.exports.setEnabled = function (bool) {
  enabled = bool;
  setVisible(bool);
};

module.exports.isEnabled = function () {
  return enabled;
};

function toHexColor (val) {
  if (typeof val !== 'string') throw new Error('Param.color must provide a default color string');
  return parseColor(val).hex;
}

function detectError (key) {
  throw new Error(`Cannot detect Param value ${key}, try specifying { type } string or use one of the convenience Param.color/number/etc functions`);
}

// function detectProp (value, key) {
//   let valueToDetect = value;
//   if (value && typeof value === 'object' && !Array.isArray(value)) {
//     if (!('value' in value)) {
//       return detectError(key);
//     }
//     valueToDetect = value.value;
//   }
//   const type = detectPropType(value);
//   if (type == null) return detectError(key);

// }

function detectProp (value, key) {
  let type = typeof value;
  if (value && type === 'object') return null;
  const detected = detectPropType(value, key);
  if (detected) {
    return module.exports.prop(value, { type: detected });
  }
  return null;
}

function detectPropType (value, key) {
  let type = typeof value;
  // if (Array.isArray(value)) {
  //   return { type: 'option', value: value[0], values: value };
  // }
  // Can be an object with other props or a prop already
  if (value && type === 'object') return null;
  if (type === 'number') return 'number';
  if (type === 'function') return 'func';
  if (type === 'boolean') return 'bool';
  if (type === 'string') {
    const hex = toHexColor(value);
    if (typeof hex === 'undefined') return 'string';
    return 'color';
  }
}
