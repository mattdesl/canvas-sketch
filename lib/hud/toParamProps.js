// TODO: Use a smaller library that is just CSS compliant
// import parseColor from 'parse-color';

export default (key, value, defaults) => {
  let name = key;
  let opt = defaults != null ? Object.assign({}, defaults) : {};
  delete opt.meta; // don't maintain this from previous values
  if (value && typeof value === 'object') {
    opt = value;
    if (opt.name != null) name = opt.name;
    value = opt.value;
  }

  // if (typeof value === 'string') {
  //   const parsedColor = opt.type !== 'text' ? parseColor(value) : null;

  //   if (parsedColor) {
  //     console.log(parsedColor);
  //     // opt.meta = {
  //     //   parsedColor: parsedColor
  //     // };
  //   }
  // }

  return Object.assign({}, opt, {
    value,
    name: name || ''
  });
};

export const reservedKeys = [ 'settings' ];
