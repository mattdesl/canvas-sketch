/**
 * Highly experimental! Subject to removal.
 */

const GUI = require('dat.gui').GUI;
const defined = require('defined');
const parseColor = require('parse-color');
const { EventEmitter } = require('events');

const gui = new GUI();
const fileName = process.env.SKETCH_ENTRY;
const LOCAL_STORAGE_KEY = `${fileName || __filename}:gui`;
const parent = document.querySelector('.dg.ac');

let store = {};
let currentControls = [];

if (parent) {
  const child = document.querySelector('.dg.main');
  if (child) child.style.margin = '0';
  Object.assign(parent.style, {
    width: '100%',
    height: '100%',
    display: 'flex',
    flexDirection: 'row-reverse'
  });
}

function defaultStep (n, min = -Infinity, max = Infinity) {
  if (typeof n !== 'undefined') {
    if (!isFinite(n)) {
      throw new Error('Cannot use a { step } of Infinity');
    }
    return n;
  }
  if (isFinite(min) && isFinite(max)) {
    const difference = Math.abs(max - min);
    if (difference !== 0) return difference * 0.01;
  }
  return 0.01;
}

function Color (value, options = {}) {
  if (typeof options === 'string') {
    options = { mode: options };
  }
  const color = parseColor(value);
  const mode = options.mode || 'hex';
  if (!color || !color[mode]) {
    throw new Error(`Could not parse color ${value}`);
  }
  return {
    isControl: true,
    value: color[mode],
    type: 'color',
    attach: (target, key, parent) => parent.addColor(target, key),
    options: Object.assign({}, options, { mode })
  };
}

function ColorParsed (value, options = {}) {
  return {
    isControl: true,
    value,
    type: 'color',
    attach: (target, key, parent) => parent.addColor(target, key),
    options
  };
}

function Slider (value, options = {}) {
  let min, max, step;
  if (typeof arguments[1] === 'number' || arguments.length > 2) {
    // shorthand: Slider(300, 0, 1, 0.5)
    min = arguments[1];
    max = arguments[2];
    step = arguments[3];
    options = {};
  } else {
    // longhand: Slider(300, { label: 'foo', range: [ 0, 1 ] })
    if (options.range) throw new Error('{ range } deprecated, use min/max');
    min = options.min;
    max = options.max;
    step = options.step;
  }

  // Manage defaults
  min = defined(min, 0);
  max = defined(max, 1);

  if (!isFinite(min) || !isFinite(max)) {
    throw new Error('Cannot use a { min } or { max } of Infinity');
  }

  step = defaultStep(step, min, max);

  return {
    isControl: true,
    value,
    type: 'slider',
    attach: (target, key, parent) => parent.add(target, key, min, max, step),
    options: Object.assign({}, options, { min, max, step })
  };
}

function Select (value, options = {}) {
  return {
    isControl: true,
    value,
    type: 'select',
    attach: (target, key, parent) => parent.add(target, key, options),
    options
  };
}

function Checkbox (value, options = {}) {
  return {
    isControl: true,
    value,
    type: 'checkbox',
    attach: (target, key, parent) => parent.add(target, key),
    options
  };
}

function Button (value, options = {}) {
  return {
    isControl: true,
    value,
    type: 'button',
    attach: (target, key, parent) => parent.add(target, key),
    options
  };
}

function StringInput (value, options = {}) {
  return {
    isControl: true,
    value,
    type: 'button',
    attach: (target, key, parent) => parent.add(target, key),
    options
  };
}

function NumberInput (value, options) {
  const hasArgs = typeof arguments[1] === 'number' || arguments.length > 2;
  const args = hasArgs ? Array.from(arguments).slice(1) : [];
  options = options || {};
  if (typeof value !== 'number') value = Number(value) || 0;
  return {
    isControl: true,
    value,
    type: 'number',
    attach: (target, key, parent) => {
      return parent.add(target, key);
    },
    options
  };
}

function Value (value) {
  return {
    isRawValue: true,
    type: 'value',
    value
  };
}

function detect (value) {
  if (typeof value === 'string') {
    const result = parseColor(value);
    if (!result.hex) return StringInput(value);
    return ColorParsed(result.hex);
  } else if (typeof value === 'boolean') {
    return Checkbox(value);
  } else if (typeof value === 'function') {
    return Button(value);
  } else if (typeof value === 'number') {
    return NumberInput(value);
  } else {
    // No type detected, fall back to non-gui property
    return null;
  }
}

function isValueProp (value) {
  return value && value.isRawValue;
}

function clampNumber (value, options) {
  if (typeof value === 'number' && isFinite(value)) {
    if (typeof options.min !== 'undefined') value = Math.max(value, options.min);
    if (typeof options.max !== 'undefined') value = Math.min(value, options.max);
  }
  return value;
}

function createControls (opt = {}, cb, label, parent) {
  const controls = new EventEmitter();
  const obj = { controls };
  const reserved = [ 'controls' ];
  const guiPath = getGUIPath(parent);

  const triggerChange = (ev) => {
    controls.emit('change', ev);
  };

  if ('controls' in opt) {
    throw new Error('The { controls } key is reserved for GUI reasons, please choose another key');
  }

  // Sync store to new state
  readLocalStorage();

  const proxy = new Proxy(obj, {
    set (target, key, value) {
      if (reserved.includes(key)) {
        throw new Error(`The { ${key} } property is reserved for GUI controls, please choose another key name`);
      }
      if (isValueProp(value)) {
        target[key] = value.value;
        return true;
      }

      if (!(key in target)) {
        // GUI being added
        let control;
        if (value && value.isControl) {
          control = value;
        } else {
          control = detect(value);
        }

        if (control) {
          const storageKey = [ guiPath, key ].join('.');
          const currentValue = getLocalStorage(control, storageKey);
          const defaultValue = control.value;
          console.log(storageKey, defaultValue, currentValue);
          target[key] = clampNumber(defined(currentValue, defaultValue), control.options);
          putLocalStorage(control, storageKey, target[key]);
          const guiControl = control.attach(target, key, parent);
          if (guiControl.name && control.options.label) {
            guiControl.name(control.options.label);
          }
          controls[key] = guiControl;
          guiControl.reset = () => {
            proxy[key] = defaultValue;
          };
          guiControl.onChange(ev => {
            putLocalStorage(control, storageKey, target[key]);
            triggerChange(ev);
          });
          currentControls.push(guiControl);
        } else {
          // Not auto-detected, maybe a regular object or
          // something that shouldn't be added to GUI
          target[key] = value;

          // also add to controls if it's an object, to make a tree
          if (typeof value === 'object' && value && value.controls) {
            if (typeof value.controls.on !== 'function') {
              throw new Error('The { controls } field is a reserved word for the GUI, it should point to a UI control mapping');
            }
            controls[key] = value.controls;
            value.controls
              .on('change', triggerChange);
          }
        }
      } else if (value && value.isControl) {
        throw new Error('Re-assigning values to a new control is not yet supported');
      } else {
        // GUI being manually mutated
        target[key] = value;
        if (key in controls) {
          controls[key].updateDisplay();
        }
      }
      return true;
    },
    get (target, key) {
      if (key === 'controls') return controls;
      const result = target[key];
      return result;
    }
  });
  Object.assign(proxy, opt);
  if (typeof cb === 'function') {
    const update = () => cb(obj);
    controls.on('change', update);
  }
  return proxy;
}

function getGUIPath (gui) {
  let name = gui.name || 'root';
  while (gui) {
    gui = gui.parent;
    if (gui) name = `${gui.name || 'root'}.${name}`;
  }
  return name;
}

function putLocalStorage (currentControl, key, value) {
  if (JSON.stringify(value)) {
    store[key] = { value, type: currentControl.type, defaultValue: currentControl.value };
    writeLocalStorage();
  }
}

function getLocalStorage (currentControl, key) {
  if (key in store) {
    const stored = store[key];
    if (!stored) return undefined;
    if (currentControl.type !== stored.type) return undefined;
    if (currentControl.value !== stored.defaultValue) return undefined;
    // console.log('CHECK CHECK', key, currentControl.value, stored.defaultValue)
    return stored.value;
  }
  return undefined;
}

function readLocalStorage () {
  // Parse new store, usually just happens at startup
  try {
    const str = window.localStorage.getItem(LOCAL_STORAGE_KEY);
    if (str == null) {
      // No storage yet identified, no need to keep anything around yet
      clearStorage();
      return;
    }
    const newStore = JSON.parse(str);
    store = newStore; // assign new store
  } catch (err) {
    console.warn(`The localStorage at ${LOCAL_STORAGE_KEY} could not be parsed due to a JSON error.`);
    console.warn(err);
    // Clear the error so it doesn't keep polluting logs
    clearStorage();
  }
}

function clearStorage () {
  window.localStorage.removeItem(LOCAL_STORAGE_KEY);
  store = {};
}

function reset () {
  clearStorage();
  currentControls.forEach(control => {
    control.reset();
  });
}

function writeLocalStorage () {
  const str = JSON.stringify(store);
  if (str == null) {
    console.warn('The storage could not be stringified as JSON, skipping localStorage');
    return;
  }
  window.localStorage.setItem(LOCAL_STORAGE_KEY, str);
}

function Controls (opts = {}, cb) {
  return createControls(opts, cb, 'root', gui);
}

function Folder (label, opts = {}, cb) {
  if (!label) throw new Error('Must specify a label for Folder()');
  const folder = gui.addFolder(label);
  folder.open();
  return createControls(opts, cb, label, folder);
}

Object.assign(Controls, {
  parent,
  number: NumberInput,
  string: StringInput,
  slider: Slider,
  select: Select,
  checkbox: Checkbox,
  button: Button,
  folder: Folder,
  color: Color,
  value: Value,
  clearStorage,
  reset,

  // Deprecated
  Slider,
  Number,
  Select,
  Button,
  Checkbox,
  Folder,
  Color,
  Value
});

module.exports = Controls;
