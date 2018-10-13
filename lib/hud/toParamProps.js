export default (key, value, defaults) => {
  let name = key;
  let opt = defaults != null ? defaults : {};
  if (value && Array.isArray(value)) {
    const items = value;
    value = undefined;
    if (items.length > 0) value = items[0];
    if (items.length > 1) opt.min = items[1];
    if (items.length > 2) opt.max = items[2];
    if (items.length > 3) opt.step = items[3];
  } else if (value && typeof value === 'object') {
    opt = value;
    if (opt.name != null) name = opt.name;
    value = opt.value;
  }
  return Object.assign({}, opt, {
    value,
    name: name || ''
  });
};

export const reservedKeys = [ 'settings' ];