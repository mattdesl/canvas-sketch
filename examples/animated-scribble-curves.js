/**
 * A Canvas2D example of a procedurally animated 'scribble'.
 * @author Matt DesLauriers (@mattdesl)
 */

const canvasSketch = require('canvas-sketch');

const Random = require('canvas-sketch-util/random');
const { clamp, linspace } = require('canvas-sketch-util/math');

// Setup our sketch & export parameters
const settings = {
  dimensions: [ 1024, 1024 ],
  animate: true,
  fps: 25,
  duration: 20,
  scaleToView: true,
  playbackRate: 'throttle'
};

const sketch = ({ context, width, height, render }) => {
  // Parametric equation for a 3D torus
  const torus = (a, c, u, v, out = []) => {
    out[0] = (c + a * Math.cos(v)) * Math.cos(u);
    out[1] = (c + a * Math.cos(v)) * Math.sin(u);
    out[2] = a * Math.sin(v);
    return out;
  };

  // Generate a slice of the curve at theta
  const generate = (theta) => {
    // Size of resulting curve
    const amplitude = 0.7;

    // Higher frequency leads to more chaotic curves
    const freq = 2;

    // Use a high number to get really fine line
    const resolution = 5000;

    // Size of parametric torus
    const torusRadius = 0.25;
    const torusInnerRadius = 1.5;

    // How fast to walk around the torus while drawing
    const rotation = theta * 5;

    // How much of the curve to draw at once (0..1)
    const sliceSize = 0.15;

    // Make the loop last just a bit longer
    // so that the curve fully disappears into the void
    const tailingDuration = 1.2;

    // Create the full curve
    // Note: This is a bit inefficient! We could just compute only the slice we want.
    const array = linspace(resolution, true).map(t => {
      const angle = Math.PI * 2 * t;

      // Get point along torus
      let point = torus(torusRadius, torusInnerRadius, angle, rotation);

      let [ x, y, z ] = point;

      // Apply noise frequency to coordinates
      x *= freq;
      y *= freq;
      z *= freq;

      // Compute noise coordinates
      return [
        amplitude * Random.noise4D(x, y, z, -1),
        amplitude * Random.noise4D(x, y, z, 1)
      ];
    });

    // Get just a slice of the curve
    const drawLength = Math.floor(resolution * sliceSize);
    const draw = theta * resolution * tailingDuration - drawLength / 2;
    const start = clamp(Math.floor(draw - drawLength / 2), 0, resolution);
    const end = clamp(Math.floor(draw + drawLength / 2), 0, resolution);
    return array.slice(start, end);
  };

  // Initial value for slowly rotation hue
  let hueStart;

  // Gets new random noise & hue
  const randomize = () => {
    // Reset our random noise function to a new seed
    Random.setSeed(Random.getRandomSeed());
    // Choose a new starting hue
    hueStart = Random.value();
    // Log the seed for later reproducibility
    console.log('Seed:', Random.getSeed());
  };

  return {
    render: ({ context, width, height, playhead }) => {
      // Clear the background with nearly black
      context.fillStyle = 'hsl(0, 0%, 5%)';
      context.fillRect(0, 0, width, height);

      context.save();

      // First we translate all the -1..1 points into 0..scale range
      const scale = width / 2;
      context.translate(width / 2, height / 2);
      context.scale(scale, scale);

      // Create a HSL from the loop playhead
      const hue = (playhead + hueStart) % 1;
      const sat = 0.75;
      const light = 0.5;
      const hsl = [
        Math.floor(hue * 360),
        `${Math.floor(100 * sat)}%`,
        `${Math.floor(100 * light)}%`
      ].join(', ');
      const stroke = `hsl(${hsl})`;

      const line = generate(playhead);
      context.lineWidth = 6 / scale;
      context.lineCap = 'round';
      context.lineJoin = 'round';
      context.beginPath();
      line.forEach(point => {
        context.lineTo(point[0], point[1]);
      });
      context.strokeStyle = stroke;
      context.stroke();

      context.restore();
    },
    begin: () => {
      // On loop start, re-compute the noise tables so we get a new
      // set of random values on the next loop
      randomize();
    }
  };
};

canvasSketch(sketch, settings);
