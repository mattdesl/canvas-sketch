/**
 * A proof-of-concept showing one canvasSketch interface
 * interacting with a child canvasSketch interface.
 *
 * Here we use an off-screen sketch to draw text to a canvas,
 * and the main on-screen sketch will render that at a smaller
 * scale to produce crisper text rendering.
 *
 * Most likely, this is overkill, and simply creating and manually
 * scaling a second canvas will be far simpler and easier to manage.
 * However, this demo proves the capability of using multiple sketches,
 * if you so desire.
 *
 * @author Matt DesLauriers (@mattdesl)
 */

const canvasSketch = require('canvas-sketch');

const textBox = ({ context, update }) => {
  const fontSize = 100;
  let curText;

  const layout = () => {
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.font = `${fontSize}px "Arial"`;
  };

  const setText = (text = '') => {
    curText = text;

    // Layout and compute text size
    layout();

    const width = Math.max(1, context.measureText(text).width);
    const height = fontSize; // approximate height

    // This is optional but will give a pixel border to our canvas
    // Otherwise sometimes pixels get cut off near the edge
    const bleed = 10;

    // Then update canvas with new size
    // The update() function will trigger a re-render
    update({
      dimensions: [ width, height ],
      bleed
    });
  };

  // Set an initial state
  setText('');

  return {
    render ({ width, height }) {
      context.clearRect(0, 0, width, height);

      context.fillStyle = 'hsl(0, 0%, 90%)';
      context.fillRect(0, 0, width, height);

      // Re-layout before rendering to ensure sizing works correctly
      layout();

      // Render current text
      context.fillStyle = 'black';
      context.fillText(curText, width / 2, height / 2);
    },
    // Expose the function to parent modules
    setText
  };
};

const createText = async () => {
  // Startup and wait for a new sketch with the textBox function
  const manager = await canvasSketch(textBox, {
    // Avoid attaching to body
    parent: false
  });

  // Return a nicer API/interface for end-users
  return {
    setText: manager.sketch.setText,
    canvas: manager.props.canvas
  };
};

const settings = {
  dimensions: [ 1024, 512 ]
};

const sketch = async ({ render }) => {
  // Wait and load for a text interface
  const text = await createText();

  let tick = 0;
  setInterval(() => {
    // Re-render the child text canvas with new text string
    text.setText(`Tick ${tick++}`);

    // Now we also need to re-render this canvas
    render();
  }, 100);

  return ({ context, width, height }) => {
    context.fillStyle = 'white';
    context.fillRect(0, 0, width, height);

    // Draw the canvas centred and scaled down by N
    // This will give us crisper looking text in retina
    const density = 1;
    context.save();
    context.translate(width / 2, height / 2);
    context.scale(1 / density, 1 / density);
    context.translate(-text.canvas.width / 2, -text.canvas.height / 2);
    context.drawImage(text.canvas, 0, 0);
    context.restore();
  };
};

canvasSketch(sketch, settings);
