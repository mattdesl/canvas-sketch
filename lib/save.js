import dateformat from 'dateformat';
import assign from 'object-assign';
import padLeft from 'pad-left';
import { getClientAPI } from './util';

const noop = () => {};
let link;

// Alternative solution for saving files,
// a bit slower and does not work in Safari
// function fetchBlobFromDataURL (dataURL) {
//   return window.fetch(dataURL).then(res => res.blob());
// }

const supportedEncodings = [
  'image/png',
  'image/jpeg',
  'image/webp'
];

export function exportCanvas (canvas, opt = {}) {
  const encoding = opt.encoding || 'image/png';
  if (!supportedEncodings.includes(encoding)) throw new Error(`Invalid canvas encoding ${encoding}`);
  let extension = (encoding.split('/')[1] || '').replace(/jpeg/i, 'jpg');
  if (extension) extension = `.${extension}`.toLowerCase();
  return {
    extension,
    type: encoding,
    dataURL: canvas.toDataURL(encoding, opt.encodingQuality)
  };
}

function createBlobFromDataURL (dataURL) {
  return new Promise((resolve) => {
    const splitIndex = dataURL.indexOf(',');
    if (splitIndex === -1) {
      resolve(new window.Blob());
      return;
    }
    const base64 = dataURL.slice(splitIndex + 1);
    const byteString = window.atob(base64);
    const mimeMatch = /data:([^;+]);/.exec(dataURL);
    const mime = (mimeMatch ? mimeMatch[1] : '') || undefined;
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (var i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    resolve(new window.Blob([ ab ], { type: mime }));
  });
}

export function saveDataURL (dataURL, opts = {}) {
  return createBlobFromDataURL(dataURL)
    .then(blob => saveBlob(blob, opts));
}

export function saveBlob (blob, opts = {}) {
  return new Promise(resolve => {
    opts = assign({ extension: '', prefix: '', suffix: '' }, opts);
    const filename = resolveFilename(opts);

    const client = getClientAPI();
    if (client && typeof client.saveBlob === 'function' && client.output) {
      // native saving using a CLI tool
      return client.saveBlob(blob, assign({}, opts, { filename }))
        .then(ev => resolve(ev));
    } else {
      // force download
      if (!link) {
        link = document.createElement('a');
        link.style.visibility = 'hidden';
        link.target = '_blank';
      }
      link.download = filename;
      link.href = window.URL.createObjectURL(blob);
      document.body.appendChild(link);
      link.onclick = () => {
        link.onclick = noop;
        setTimeout(() => {
          window.URL.revokeObjectURL(blob);
          document.body.removeChild(link);
          link.removeAttribute('href');
          resolve({ filename, client: false });
        });
      };
      link.click();
    }
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
  } else if (opt.file) {
    return opt.file;
  }

  let frame = null;
  let extension = '';
  if (typeof opt.extension === 'string') extension = opt.extension;

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
    return [ layerStr, frame ].filter(Boolean).join('-') + extension;
  } else {
    const defaultFileName = opt.timeStamp;
    return [ opt.prefix, opt.name || defaultFileName, layerStr, opt.hash, opt.suffix ].filter(Boolean).join('-') + extension;
  }
}
