import dateformat from 'dateformat';
import assign from 'object-assign';
import padLeft from 'pad-left';
import extname from 'get-ext';

const noop = () => {};
const link = document.createElement('a');

export function dataURIToBlob (dataURI) {
  const binStr = window.atob(dataURI.split(',')[1]);
  const len = binStr.length;
  const arr = new Uint8Array(len);
  for (var i = 0; i < len; i++) {
    arr[i] = binStr.charCodeAt(i);
  }
  return new window.Blob([arr]);
}

export function saveDataURL (dataURI, opts = {}) {
  return window.fetch(dataURI)
    .then(res => res.blob())
    .then(blob => saveBlob(blob, opts));
}

export function saveBlob (blob, opts = {}) {
  return new Promise(resolve => {
    // force download
    opts = assign({ extension: '', prefix: '', suffix: '' }, opts);
    link.download = resolveFilename(opts);
    link.href = window.URL.createObjectURL(blob);
    link.onclick = () => {
      link.onclick = noop;
      setTimeout(() => {
        window.URL.revokeObjectURL(blob);
        link.removeAttribute('href');
        resolve();
      });
    };
    link.click();
  });
}

export function getDefaultFile (prefix = '', suffix = '', ext) {
  const dateFormatStr = `yyyy-mm-dd 'at' h.MM.ss TT`;
  return `${prefix}${dateformat(new Date(), dateFormatStr)}${suffix}${ext}`;
}

export function saveCanvas (canvas, opts = {}) {
  const uri = canvas.toDataURL(canvas, 'image/png');
  return saveDataURL(uri, assign({}, opts, { extension: '.png' }));
}

export function saveFile (data, opts = {}) {
  const parts = Array.isArray(data) ? data : [ data ];
  const blob = new window.Blob(parts, { type: opts.type || '' });
  return saveBlob(blob, opts);
}

function resolveFilename (opt = {}) {
  const file = opt.file;

  let frame = null;
  let extension;
  if (typeof opt.extension === 'string') extension = opt.extension;
  else if (file) extension = extname(file);

  if (typeof opt.frame === 'number') {
    let totalFrames;
    if (typeof opt.totalFrames === 'number') {
      totalFrames = opt.totalFrames;
    } else {
      totalFrames = Math.max(1000, opt.frame);
    }
    frame = padLeft(String(opt.frame), String(totalFrames).length, '0');
  }

  const formattedFile = formatFile(file, extension, frame);
  if (frame != null) {
    if (file) return formattedFile;
    return `${frame}${extension}`;
  } else {
    if (file) return formattedFile;
    else return getDefaultFile(opt.prefix, opt.suffix, extension);
  }
}

function formatFile (file = '', extension = '', frame = 0) {
  return file.replace(/%d/, frame).replace(/%s/, extension);
}
