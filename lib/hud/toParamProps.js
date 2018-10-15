// TODO: Use a smaller library that is just CSS compliant
// import parseColor from 'parse-color';

const parseThree = (obj) => {

};

export default (key, value, defaults) => {
  let name = key;
  let opt = defaults != null ? Object.assign({}, defaults) : {};

  if (value && typeof value === 'object' && !Array.isArray(value)) {
    opt = value;
    if (opt.name != null) name = opt.name;
    value = opt.value;
  }

  return Object.assign({}, opt, {
    value,
    name: name || ''
  });
};

export const reservedKeys = [];
