import dateformat from 'dateformat';
import assign from 'object-assign';
import padLeft from 'pad-left';
import { getClientAPI } from './util';

const noop = () => {};
let link;

export function saveDataURL (dataURI, opts = {}) {
  return window.fetch(dataURI)
    .then(res => res.blob())
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
      if (!link) link = document.createElement('a');
      link.download = filename;
      link.href = window.URL.createObjectURL(blob);
      link.onclick = () => {
        link.onclick = noop;
        setTimeout(() => {
          window.URL.revokeObjectURL(blob);
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
