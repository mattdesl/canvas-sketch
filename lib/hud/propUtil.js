import defined from 'defined';
import parseColor from 'parse-color';

export const getPropValue = (value, opt = {}) => {
  if (opt.type === 'color' && Array.isArray(value)) {
    const format = opt.format || 'rgb-byte';
    const rgb = value.map(n => Math.floor(n * 255)).join(', ');
    value = `rgb(${rgb})`;
  }
  if (opt.type === 'color' && opt.format) {
    const parsed = parseColor(value);
    if (opt.format === 'rgb-byte') value = parsed.rgb.slice();
    else if (opt.format === 'rgb-float') value = parsed.rgb.map(n => n / 255);
  }
  return value;
};

export const formatPropValue = (value, opt = {}) => {
  if (typeof value === 'number') {
    const step = defined(opt.step, 0.01);
    return (Math.round(value / step) * step).toLocaleString();
  }
  return value;
};
