const canvasSketch = require('canvas-sketch');

// Import THREE and assign it to global scope
global.THREE = require('three');

// Now import any examples
require('three/examples/js/controls/OrbitControls');

// Setup our sketch
const settings = {
  animation: true,
  context: 'webgl'
};

const sketch = ({ context }) => {
  // Get your renderer
  const renderer = new THREE.WebGLRenderer({
    context,
    antialias: true
  });

  renderer.setClearColor('#000', 1);

  // create a camera
  const camera = new THREE.PerspectiveCamera(45, 1, 0.01, 100);
  camera.position.set(2, 2, -4);
  camera.lookAt(new THREE.Vector3());

  // set up some orbit controls
  const controls = new THREE.OrbitControls(camera);

  // setup your scene
  const scene = new THREE.Scene();
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(1, 1, 1),
    new THREE.MeshBasicMaterial({ color: 'white', wireframe: true })
  );
  scene.add(mesh);

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
    render ({ time }) {
      controls.update();
      renderer.render(scene, camera);
    }
  };
};

canvasSketch(sketch, settings);