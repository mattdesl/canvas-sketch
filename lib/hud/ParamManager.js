import toParamProps, { reservedKeys } from './toParamProps';
import { isBrowser } from '../util';
import defined from 'defined';

export default class ParamManager {
  constructor () {
    this.props = {};
    this.proxy = {};
    this.storageKey = null;
    this.storage = null;
    this.setStorageKey();
  }

  clear () {
    // Clear both in case user added any for some reason...
    Object.keys(this.props).forEach(key => this.clearProp(key));
    this.storage = null;
  }

  enabled () {
    return Object.keys(this.props).filter(n => !reservedKeys.includes(n)).length > 0;
  }

  serialize (pretty = false) {
    return JSON.stringify(this.props, undefined, pretty ? 2 : undefined);
  }

  setStorageKey (storageKey) {
    const lastStorageKey = this.storageKey;
    const newStorage = defined(storageKey, global.CANVAS_SKETCH_DEFAULT_STORAGE_KEY, window.location.href);
    this.storageKey = newStorage;
    // Clear any last storage as we have a new key coming in
    if (lastStorageKey !== newStorage) {
      this.storage = null;
    }
  }

  ensureStorageLoaded () {
    if (this.storage == null) {
      this.storage = getStorage(this.storageKey);
    }
    return this.storage;
  }

  store () {
    putStorage(this.storageKey, this.serialize());
  }

  clearProp (key) {
    delete this.props[key];
    delete this.proxy[key];
  }

  clampProp (prop) {
    if (typeof prop.value !== 'number') {
      return false;
    }

    if (typeof prop.min === 'number' && isFinite(prop.min)) {
      prop.value = Math.max(prop.min, prop.value);
    }

    if (typeof prop.max === 'number' && isFinite(prop.max)) {
      prop.value = Math.min(prop.max, prop.value);
    }
  }

  addProp (key, opt = {}) {
    opt = Object.assign({}, opt);
    opt.initialValue = opt.value;
    if (this.storage != null && key in this.storage) {
      // Only take persisted value if the user hasn't updated the code
      if (opt.initialValue === this.storage[key].initialValue) {
        opt.value = this.storage[key].value;
      }
    }
    this.props[key] = opt;
  }

  updateProp (key, opt = {}) {
    opt = Object.assign({}, opt);
    Object.assign(this.props[key], opt);
  }

  merge (params = {}) {
    // now load from storage if we haven't already
    this.ensureStorageLoaded();
    Object.keys(params).forEach(key => {
      let value = params[key];

      if (value === null) {
        // User is deleting a specific param
        this.clearProp(key);
      } else {
        const paramProps = toParamProps(key, value, this.props[key]);
        if (key in this.props) {
          this.updateProp(key, paramProps);
        } else {
          this.addProp(key, paramProps);
        }
        this.clampProp(this.props[key]);
        this.updatePropValue(key, value, paramProps);
      }
    });
    this.store();
  }

  updatePropValue (key, value, computedProps) {
    const curProp = this.props[key] || {};
    if (reservedKeys.includes(key)) {
      if (typeof computedProps.value !== 'undefined') {
        console.warn(`The { params } object has a parameter called "${key}" but this key is reserved for GUI metadata`);
      }
      this.proxy[key] = value;
    } else if (curProp.type === 'color') {
      this.proxy[key] = curProp.value;
    } else {
      this.proxy[key] = curProp.value;
    }
  }

  applyChanges () {
  }
}

function getStorage (key) {
  if (!isBrowser()) return {};
  if (key) {
    const value = window.localStorage.getItem(key);
    if (value == null) return {};
    try {
      return JSON.parse(value);
    } catch (err) {
      console.warn(`Could not parse localStorage at ${key}`);
      console.warn(err);
      return {};
    }
  } else {
    return {};
  }
}

function putStorage (key, data) {
  if (!isBrowser()) return;
  if (key) {
    window.localStorage.setItem(key, data);
  }
}
