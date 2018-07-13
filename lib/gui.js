/** @jsx h */

const { Component, render, h } = require('preact');
const insertCSS = require('insert-css');

// let hasInsertedCSS = false;
// const css = `
//   .canvas-sketch-hud {
    
//   }
// `;

function createStore () {
  const listeners = [];
  const onChange = (cb) => {
    listeners.push(cb);
  };
  return {
    _update: (sketches) => {
      listeners.forEach(fn => fn(sketches.slice()));
    },
    onChange
  };
}

const sketchStore = createStore();

class GUIApp extends Component {
  constructor () {
    this.state = {
      sketches: []
    };
  }

  componentDidMount () {
    sketchStore.onChange(sketches => {
      this.setState({ sketches });
    });
  }

  render (props) {
    const sketches = this.state.sketches || [];
    const sketchFolders = sketches.map((sketch, i) => {
      const key = `sketch${i}`;
      return <div className='canvas-sketch-gui-folder' key={key}>
        <div className='canvas-sketch-gui-folder-header'>sketch {i}</div>
        <ul className='canvas-sketch-gui-folder-props'>
          <li>Dimensions</li>
        </ul>
      </div>;
    })
    return <div className='canvas-sketch-gui-list'>
      {sketchFolders}
    </div>;
  }
}

class GUI {
  constructor () {
    this.sketches = [];
    this._mounted = false;
    this._element = null;
  }

  getElement () {
    if (!this._element) {
      this._element = document.createElement('div');
      this._element.className = 'canvas-sketch-gui';
    }
    return this._element;
  }

  hasSketch (sketch) {
    return this.sketches.indexOf(sketch) >= 0;
  }

  addSketch (sketch, parentElement) {
    this.sketches.push(sketch);
    this.updateElement(parentElement);
  }

  removeSketch (sketch) {
    const idx = this.sketches.indexOf(sketch);
    if (idx >= 0) {
      const ret = this.sketches.splice(idx, 1);
      this.updateElement();
      return ret;
    }
  }

  updateElement (parentElement = document.body) {
    if (this.sketches.length > 0 && !this._mounted) {
      const el = this.getElement();
      parentElement.insertBefore(el, parentElement.firstChild);
      render(<GUIApp />, el);
    } else if (this.sketches.length === 0 && this._mounted) {
      const el = this.getElement();
      el.parentElement.removeChild(el);
    }
    console.log('updating')

    sketchStore._update(this.sketches);
  }
}

export default GUI;
