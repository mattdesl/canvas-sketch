const { clamp01, linspace } = require('../../../examples/util/math');
const Painter = require('../../../examples/util/canvas-painter');
const Random = require('../../../examples/util/random');
const tween = require('../../../examples/util/tween');
const { vec2 } = require('gl-matrix');

const settings = {
  animate: true,
  hotkeys: false
};

const sketch = (app) => {
  const friction = 0.98;
  const particleCount = 300;
  let maxConnections = 5;
  let currentSpawnInterval = 0;
  let currentSpawnTime = 0;

  // Simple utility for 2D line/circle drawing
  const painter = Painter(app.context);

  // Create a list of 'particle' objects
  const particles = Array.from(new Array(particleCount)).map(() => {
    return {
      // We'll fill in the properties dynamically in spawn()
    };
  });

  const nextParticle = () => {
    return particles.find(p => !p.active);
  };

  const spawn = () => {
    const particle = nextParticle();
    if (!particle) return; // none left in pool

    // Mark particle as active, no longer in pool
    particle.active = true;

    // Reset time
    particle.time = 0;

    // Choose a new position, we are in 0..1 space here
    const center = [ 0.5, 0.5 ];
    const scale = 0.4;
    const offset = Random.gaussian(0, 0.05);
    particle.position = vec2.add([], Random.onSquare(scale + offset), center);

    // Set some new random properties
    particle.duration = Random.range(3, 5);
    particle.radius = Random.range(1, 2);
    particle.connectionRadius = Random.range(0.1, 0.2);
    particle.speed = 1 / 1000;
    particle.animationDuration = 1;

    // Use a random point on unit circle to get a random velocity vector
    particle.velocity = Random.onCircle(1, particle.velocity);

    return particle;
  };

  const spawnMultiple = () => {
    const count = Random.rangeFloor(1, 6);
    for (let i = 0; i < count; i++) spawn();
  };

  const tick = ({ deltaTime, width, height }) => {
    currentSpawnTime += deltaTime;
    if (currentSpawnTime > currentSpawnInterval) {
      currentSpawnTime = 0;
      currentSpawnInterval = Random.range(0.25, 0.35);
      spawnMultiple();
    }

    particles.forEach(particle => {
      if (!particle.active) return; // ignore dead/unused particles

      particle.time += deltaTime;
      if (particle.time > particle.duration) {
        particle.active = false;
        return;
      }

      // Move along velocity
      vec2.scaleAndAdd(particle.position, particle.position, particle.velocity, particle.speed);
      vec2.scale(particle.velocity, particle.velocity, friction);
    });
  };

  const render = ({ context, deltaTime, width, height }) => {
    painter.clear({ fill: 'white', width, height });

    context.save();

    // Update & draw each particle
    particles.forEach(particle => {
      // Skip inactive particles
      if (!particle.active) return;

      const size = particle.radius * tween({
        time: particle.time,
        ease: 'quadOut',
        edge: particle.animationDuration,
        duration: particle.duration
      });

      // Paint circle
      painter.circle({
        alpha: 0.2,
        position: [ particle.position[0] * width, particle.position[1] * height ],
        radius: size
      });

      // Paint connections
      const connectionRadius = particle.connectionRadius;
      for (let i = 0, c = 0; i < particles.length && c < maxConnections; i++) {
        const other = particles[i];
        if (other === particle || !other.active) continue; // skip self
        const dist = vec2.distance(other.position, particle.position);
        if (dist <= connectionRadius) {
          const distStr = Math.sin(Math.PI * clamp01(dist / connectionRadius));
          // Need to map from 0..1 to 0..screenSize
          const positions = [ particle.position, other.position ].map(p => (
            [ p[0] * width, p[1] * height ]
          ));
          painter.polyline(positions, {
            alpha: 0.2 * distStr,
            stroke: 'black',
            lineWidth: 0.25 * distStr
          });

          c++;
        }
      }
    });

    context.restore();
  };

  return {
    render,
    tick
  };
};

module.exports = sketch;
module.exports.settings = settings;
