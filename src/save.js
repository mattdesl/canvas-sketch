import dateformat from 'dateformat';
import assign from 'object-assign';
import padLeft from 'pad-left';
import extname from 'get-ext';

const noop = () => {};
let link;

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
    if (!link) link = document.createElement('a');
    const file = resolveFilename(opts);
    link.download = file;
    link.href = window.URL.createObjectURL(blob);
    link.onclick = () => {
      link.onclick = noop;
      setTimeout(() => {
        window.URL.revokeObjectURL(blob);
        link.removeAttribute('href');
        resolve({
          file
        });
      });
    };
    link.click();
  });
}

export function saveFile (data, opts = {}) {
  const parts = Array.isArray(data) ? data : [ data ];
  const blob = new window.Blob(parts, { type: opts.type || '' });
  return saveBlob(blob, opts);
}

export function getFileName () {
  const dateFormatStr = `yyyy.mm.dd-HH.MM.ss`;
  return dateformat(new Date(), dateFormatStr);
}

export function getDefaultFile (prefix = '', suffix = '', ext) {
  // const dateFormatStr = `yyyy.mm.dd-HH.MM.ss`;
  const dateFormatStr = `yyyy-mm-dd 'at' h.MM.ss TT`;
  return `${prefix}${dateformat(new Date(), dateFormatStr)}${suffix}${ext}`;
}

function resolveFilename (opt = {}) {
  opt = assign({}, opt);

  // Custom filename function
  if (typeof opt.file === 'function') {
    return opt.file(opt);
  }

  let frame = null;
  let extension = '';
  if (typeof opt.extension === 'string') extension = opt.extension;

  if (opt.file && extname(opt.file) === extension) {
    const idx = opt.file.lastIndexOf(extension);
    opt.file = opt.file.substring(0, idx);
  }

  if (typeof opt.frame === 'number') {
    let totalFrames;
    if (typeof opt.totalFrames === 'number') {
      totalFrames = opt.totalFrames;
    } else {
      totalFrames = Math.max(1000, opt.frame);
    }
    frame = padLeft(String(opt.frame), String(totalFrames).length, '0');
  }

  const layerStr = isFinite(opt.totalLayers) && isFinite(opt.layer) && opt.totalLayers > 1 ? `${opt.layer}` : '';
  if (frame != null) {
    return [ frame, layerStr ].join('-') + extension;
  } else {
    const defaultFileName = [ opt.timeStamp, layerStr, opt.hash ].filter(Boolean).join('-');
    return [ opt.prefix, opt.file || defaultFileName, opt.suffix ].filter(Boolean).join('-') + extension;
  }
}
