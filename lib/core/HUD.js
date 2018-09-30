/** @jsx h */
import { render, h } from 'preact';
import { isBrowser } from '../util';
import HUDApp from '../hud/App';
import insertCSS from 'insert-css';
import CSS from '../hud/style.js';

insertCSS(CSS);

function HUD () {
  const attached = [];
  let element = null;
  let floating = false;
  const browser = isBrowser();

  return {
    attach,
    detach,
    update,
    float,
    dock
  };

  function _updateFloat () {
    if (element) {
      element.classList.remove('canvas-sketch--hud-float');
      if (floating) element.classList.add('canvas-sketch--hud-float');
    }
  }

  function float () {
    floating = true;
    _updateFloat();
  }

  function dock () {
    floating = false;
    _updateFloat();
  }

  function detach (manager) {
    if (!browser) return;
    const idx = attached.indexOf(manager);
    if (idx !== -1) {
      attached.splice(idx, 1);
    }

    update();
  }

  function attach (manager) {
    if (!browser) return;
    if (!attached.includes(manager)) {
      attached.push(manager);
    }

    update();
  }

  function update () {
    if (attached.length > 0) {
      if (!element) {
        element = document.createElement('div');
        element.classList.add('canvas-sketch--hud-container');
        _updateFloat();
        document.body.appendChild(element);
      }
      render(<HUDApp sketches={attached} />, element, element.firstElementChild);
    } else if (attached.length === 0 && element) {
      if (element.parentElement) element.parentElement.removeChild(element);
      element = null;
    }
  }
}

export default HUD();
