const GUI = require('dat.gui').GUI;
const defined = require('defined');
const parseColor = require('parse-color');
const { EventEmitter } = require('events');

const gui = new GUI();
const fileName = process.env.SKETCH_ENTRY;
const LOCAL_STORAGE_PREFIX = fileName || __filename;
const parent = document.querySelector('.dg.ac');

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

function Color (value, options = {}) {
  const color = parseColor(value);
  const mode = options.mode || 'hex';
  if (!color || !color[mode]) {
    throw new Error(`Could not parse color ${value}`);
  }
  return {
    isControl: true,
    value: color[mode],
    attach: (target, key, parent) => parent.addColor(target, key),
    options
  };
}

function ColorParsed (value, options = {}) {
  return {
    isControl: true,
    value,
    attach: (target, key, parent) => parent.addColor(target, key),
    options
  };
}

function Slider (value, options = {}) {
  const range = options.range || [ 0, 1 ];
  const step = defined(options.step, 0.01);
  return {
    isControl: true,
    value,
    attach: (target, key, parent) => parent.add(target, key, range[0], range[1], step),
    options
  };
}

function Select (value, options = {}) {
  return {
    isControl: true,
    value,
    attach: (target, key, parent) => parent.add(target, key, options),
    options
  };
}

function Generic (value, options = {}) {
  return {
    isControl: true,
    value,
    attach: (target, key, parent) => parent.add(target, key),
    options
  };
}

function Value (value) {
  return {
    isRawValue: true,
    value
  };
}

function detect (value) {
  if (typeof value === 'string') {
    const result = parseColor(value);
    if (!result.hex) return Generic(value);
    return ColorParsed(result.hex);
  } else if (typeof value === 'boolean' || typeof value === 'function' || typeof value === 'number') {
    return Generic(value);
  } else {
    return null;
  }
}

function isValueProp (value) {
  return value && value.isRawValue;
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
  const p = new Proxy(obj, {
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
          const curPath = [ guiPath, key ].join('.');
          const storageKey = `${LOCAL_STORAGE_PREFIX}${curPath}`;
          const initialValue = getLocalStorage(storageKey);
          // Got a control for the GUI
          target[key] = defined(initialValue, control.value);
          putLocalStorage(storageKey, target[key]);
          const guiControl = control.attach(target, key, parent)
            .onChange(ev => {
              putLocalStorage(storageKey, target[key]);
              triggerChange(ev);
            });
          if (control.options.label) {
            guiControl.name(control.options.label);
          }
          if (control.options.step) {
            guiControl.step(control.options.step);
          }
          controls[key] = guiControl;
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
  Object.assign(p, opt);
  if (typeof cb === 'function') {
    const update = () => cb(obj);
    controls.on('change', update);
  }
  return p;
}

function getGUIPath (gui) {
  let name = gui.name || 'root';
  while (gui) {
    gui = gui.parent;
    if (gui) name = `${gui.name || 'root'}.${name}`;
  }
  return name;
}

function putLocalStorage (key, value) {
  window.localStorage.setItem(key, JSON.stringify(value));
}

function getLocalStorage (key) {
  try {
    const str = window.localStorage.getItem(key);
    if (str == null) return undefined;
    return JSON.parse(str);
  } catch (err) {
    console.warn('Error parsing JSON content');
    console.warn(err);
    return undefined;
  }
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

function save () {
  return gui.getSaveObject();
}

Object.assign(Controls, {
  Slider,
  Select,
  Checkbox: Generic,
  Folder,
  Color,
  Value,
  parent
});

module.exports = Controls;
