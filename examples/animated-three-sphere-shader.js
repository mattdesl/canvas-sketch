/**
 * An example of a rotating rainbow sphere, using Nadieh Bremer's
 * loop as a reference, but implemented with a custom shader.
 *
 * See here:
 * https://twitter.com/NadiehBremer/status/1058016472759496711
 *
 * @author Matt DesLauriers (@mattdesl), inspired by Nadieh Bremer's loop
 */

const canvasSketch = require('canvas-sketch');
const THREE = require('three');
const glslify = require('glslify');

const settings = {
  dimensions: [ 512, 512 ],
  // Make the loop animated
  animate: true,
  // Get a WebGL canvas rather than 2D
  context: 'webgl',
  // Loop itme in seconds
  duration: 5,
  // Loop framerate
  fps: 24,
  // Visualize the above FPS in-browser
  playbackRate: 'throttle',
  // Turn on MSAA
  attributes: { antialias: true }
};

const sketch = ({ context }) => {
  // Create a renderer
  const renderer = new THREE.WebGLRenderer({
    context
  });

  // WebGL background color
  renderer.setClearColor('#fff', 1);

  // Setup a camera
  const camera = new THREE.PerspectiveCamera(45, 1, 0.01, 100);
  camera.position.set(0, 0, -4);
  camera.lookAt(new THREE.Vector3());

  // Setup your scene
  const scene = new THREE.Scene();

  const fragmentShader = glslify(/* glsl */`
    #pragma glslify: hsl2rgb = require('glsl-hsl2rgb');

    varying vec2 vUv;
    uniform float playhead;

    void main () {
      // number of horizontal bands
      float bands = 12.0;

      // offset texture by loop time
      float offset = playhead;

      // get a 0..1 value from this
      float y = mod(offset + vUv.y, 1.0);

      // get N discrete steps of hue
      float hue = floor(y * bands) / bands;

      // now get a color
      float sat = 0.55;
      float light = 0.6;
      vec3 color = hsl2rgb(hue, sat, light);

      gl_FragColor = vec4(color, 1.0);
    }
  `);

  const vertexShader = glslify(/* glsl */`
    varying vec2 vUv;
    void main () {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position.xyz, 1.0);
    }
  `);

  const mesh = new THREE.Mesh(
    new THREE.SphereGeometry(1, 64, 64),
    new THREE.ShaderMaterial({
      fragmentShader,
      vertexShader,
      uniforms: {
        playhead: { value: 0 }
      }
    })
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
    // Update & render your scene here
    render ({ playhead }) {
      mesh.material.uniforms.playhead.value = playhead;
      renderer.render(scene, camera);
    },
    // Dispose of events & renderer for cleaner hot-reloading
    unload () {
      renderer.dispose();
    }
  };
};

canvasSketch(sketch, settings);
