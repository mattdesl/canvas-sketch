/** @jsx h */
import { render, h } from 'preact';

const App = (props) => {
  return <div>
    hello
  </div>;
};

function HUD () {
  const attached = [];
  let element = null;

  return {
    attach,
    detach
  };

  function detach (manager) {
    const idx = attached.indexOf(manager);
    if (idx !== -1) {
      attached.splice(idx, 1);
      update();
    }
  }

  function attach (manager) {
    if (!attached.includes(manager)) {
      attached.push(manager);
      update();
    }
  }

  function update () {
    console.log('re-render components');
    if (attached.length > 0 && !element) {
      element = document.createElement('div');
      element.classList.add('canvas-sketch--hud');
      document.body.appendChild(element);
      render(<App sketches={attached} />, element);
    } else if (attached.length === 0 && element) {
      if (element.parentElement) element.parentElement.removeChild(element);
      element = null;
    }
  }
}

export default HUD();
