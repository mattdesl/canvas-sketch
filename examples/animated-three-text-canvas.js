/**
 * A WebGL example of a basic rotating cube with text, using ThreeJS.
 *
 * This is similar to canvas-in-canvas.js example, in that it uses
 * a second sketch to hold the canvas. You may or may not consider
 * this to be overkill, depending on your application...
 *
 * @author Matt DesLauriers (@mattdesl)
 */

const canvasSketch = require('canvas-sketch');
const random = require('canvas-sketch-util/random');

// Import THREE and assign it to global scope
global.THREE = require('three');

// Now import any ThreeJS example utilities
require('three/examples/js/controls/OrbitControls');

// A sketch that simply renders the passed 'text' setting
// into the center of the canvas
const textSketch = () => {
  return ({ context, width, height, settings }) => {
    const { text } = settings;

    // Clear canvas
    context.clearRect(0, 0, width, height);

    // Draw background
    context.fillStyle = 'black';
    context.fillRect(0, 0, width, height);

    // Draw text
    const fontSize = 80;
    context.fillStyle = 'white';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.font = `${fontSize}px monospace`;
    context.fillText(text || '', width / 2, height / 2);
  };
};

// Setup our sketch
const settings = {
  // Make the loop animated
  animate: true,
  // Get a WebGL canvas rather than 2D
  context: 'webgl',
  // Turn on MSAA
  attributes: { antialias: true }
};

const sketch = async ({ context }) => {
  // Wait for text sketch to load up
  const textManager = await canvasSketch(textSketch, {
    dimensions: [ 512, 512 ],
    // Do not attach keyboard shortcuts
    hotkeys: false,
    // Do not attach to parent
    parent: false
  });

  // Get the other canvas
  const otherCanvas = textManager.props.canvas;

  // Create a renderer
  const renderer = new THREE.WebGLRenderer({
    context
  });

  // Black background
  renderer.setClearColor('hsl(0, 0%, 20%)', 1);

  // create a camera
  const camera = new THREE.PerspectiveCamera(45, 1, 0.01, 100);
  camera.position.set(2, 2, -4);
  camera.lookAt(new THREE.Vector3());

  // set up some orbit controls
  const controls = new THREE.OrbitControls(camera, context.canvas);

  // setup your scene
  const scene = new THREE.Scene();

  const map = new THREE.Texture(otherCanvas);

  // A cube with basic mamterial
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(1, 1, 1),
    new THREE.MeshBasicMaterial({
      map
    })
  );
  scene.add(mesh);

  // Update the text with a new string
  const setText = (text) => {
    // Pass in new settings, this triggers a re-render
    textManager.update({
      text
    });
    // Make sure WebGL gets the new texture
    map.needsUpdate = true;
  };

  // Set some random characters
  const remix = () => {
    const maxChars = 6;
    const chars = Array.from(new Array(maxChars)).map(() => {
      return String.fromCharCode(random.rangeFloor(33, 127));
    }).join('');
    setText(chars);
  };

  remix();
  setInterval(remix, 100);

  // draw each frame
  return {
    // Handle resize events here
    resize ({ pixelRatio, viewportWidth, viewportHeight }) {
      renderer.setPixelRatio(pixelRatio);
      renderer.setSize(viewportWidth, viewportHeight);
      camera.aspect = viewportWidth / viewportHeight;
      camera.updateProjectionMatrix();
    },
    // And render events here
    render ({ time, deltaTime }) {
      mesh.rotation.y += deltaTime * (5 * Math.PI / 180);
      controls.update();
      renderer.render(scene, camera);
    }
  };
};

canvasSketch(sketch, settings);
