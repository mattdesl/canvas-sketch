const canvasSketch = require('canvas-sketch');
const { GUI } = require('dat.gui');

const gui = new GUI();

const settings = {
  dimensions: 'postcard'
};

// UI Parameters
const config = {
  count: 300,
  background: '#ebb4b4',
  foreground: '#ffffff'
};

const sketch = ({ render, update, dispatch }) => {
  const boxes = [];

  // Generative function
  const generate = (props) => {
    boxes.length = 0;
    for (let i = 0; i < config.count; i++) {
      boxes.push({
        position: [ props.width * Math.random(), props.height * Math.random() ],
        size: Math.random() * (props.width * 0.05)
      });
    }
  };

  // Case A — UI controls that update the sketch size/settings
  const sizes = Object.keys(canvasSketch.PaperSizes);
  gui.add(settings, 'dimensions', sizes).onChange(() => update(settings));

  // Case B — UI controls that only need a re-render
  gui.addColor(config, 'background').onChange(render);

  // Case C — UI controls that need to re-generate the artwork
  gui.add(config, 'count', 0, 1000, 1).onChange(() => dispatch(generate));

  // We can return an object with other functions as well
  return {
    render ({ context, width, height }) {
      // draw background
      context.fillStyle = config.background;
      context.fillRect(0, 0, width, height);

      // draw foreground
      context.fillStyle = config.foreground;
      boxes.forEach(({ size, position }) => {
        context.fillRect(position[0] - size / 2, position[1] - size / 2, size, size);
      });
    },
    // When we get new width/height, we need to re-generate the sketch
    resize: generate
  };
};

canvasSketch(sketch, settings);
