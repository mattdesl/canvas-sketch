/**
 * A WebGL example of a basic rotating cube, using ThreeJS.
 * @author Matt DesLauriers (@mattdesl)
 */

const canvasSketch = require('canvas-sketch');

// Import THREE and assign it to global scope
global.THREE = require('three');

// Now import any ThreeJS example utilities
require('three/examples/js/controls/OrbitControls');

// Setup our sketch
const settings = {
  // Make the loop animated
  animate: true,
  // Get a WebGL canvas rather than 2D
  context: 'webgl',
  // Turn on MSAA
  attributes: { antialias: true }
};

const sketch = ({ context }) => {
  // Create a renderer
  const renderer = new THREE.WebGLRenderer({
    context
  });

  // Black background
  renderer.setClearColor('#000', 1);

  // create a camera
  const camera = new THREE.PerspectiveCamera(45, 1, 0.01, 100);
  camera.position.set(2, 2, -4);
  camera.lookAt(new THREE.Vector3());

  // set up some orbit controls
  const controls = new THREE.OrbitControls(camera);

  // setup your scene
  const scene = new THREE.Scene();

  // A cube with PBR mamterial
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(1, 1, 1),
    new THREE.MeshPhysicalMaterial({
      color: 'white',
      roughness: 0.75,
      flatShading: true
    })
  );
  scene.add(mesh);

  // Specify an ambient/unlit colour
  scene.add(new THREE.AmbientLight('#59314f'));

  // Add some light
  const light = new THREE.PointLight('#45caf7', 1, 15.5);
  light.position.set(2, 2, -4).multiplyScalar(1.5);
  scene.add(light);

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
      mesh.rotation.y = time * (10 * Math.PI / 180);
      controls.update();
      renderer.render(scene, camera);
    },
    unload () {
      renderer.dispose();
    }
  };
};

canvasSketch(sketch, settings);
