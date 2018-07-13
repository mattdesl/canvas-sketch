import { getClientAPI } from '../util';

export default function (opt = {}) {
  const handler = ev => {
    if (!opt.enabled()) return;

    const client = getClientAPI();
    if (ev.keyCode === 83 && !ev.altKey && (ev.metaKey || ev.ctrlKey)) {
      // Cmd + S
      ev.preventDefault();
      opt.save(ev);
    } else if (ev.keyCode === 32) {
      // Space
      // TODO: what to do with this? keep it, or remove it?
      opt.togglePlay(ev);
    } else if (client && !ev.altKey && ev.keyCode === 75 && (ev.metaKey || ev.ctrlKey)) {
      // Cmd + K, only when canvas-sketch-cli is used
      ev.preventDefault();
      opt.commit(ev);
    }
  };

  const attach = () => {
    window.addEventListener('keydown', handler);
  };

  const detach = () => {
    window.removeEventListener('keydown', handler);
  };

  return {
    attach,
    detach
  };
}
