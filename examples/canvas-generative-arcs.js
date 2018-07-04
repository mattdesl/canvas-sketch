/**
 * A Canvas2D example of generative/algorithmic artwork, sized for web & social media.
 * @author Matt DesLauriers (@mattdesl)
 */

const sketcher = require('canvas-sketch');

const settings = {
  // Pixel [width,height] of our artwork
  dimensions: [ 800, 1280 ],
  // Export at a higher resolution than what we see
  // in the browser
  exportPixelRatio: 2
};

const sketch = () => {
  // Utility function, random number between [min..max] range
  const random = (min, max) => Math.random() * (max - min) + min;

  // Generate a whole bunch of circles/arcs
  const count = 1000;
  const circles = Array.from(new Array(count)).map(() => {
    const arcStart = Math.PI * 2 - random(0, Math.PI * 2 / 3);
    const arcLength = random(-0.1, 0.3) * Math.PI * 2;
    const segmentCount = Math.floor(random(5, 200));
    const spread = 0.085;
    return {
      segments: Array.from(new Array(segmentCount)).map(() => random(0, 1)),
      arcStart,
      arcEnd: arcStart + arcLength,
      arcLength,
      thickness: random(0.01, 1),
      alpha: random(0.25, 0.5),
      radius: random(0.1, 0.75),
      x: 0.5 + random(-1, 1) * spread,
      y: 0.5 + random(-1, 1) * spread
    };
  });

  return ({ context, width, height }) => {
    // Fill browser with solid color
    context.globalCompositeOperation = 'source-over';
    context.fillStyle = 'black';
    context.globalAlpha = 1;
    context.fillRect(0, 0, width, height);

    const side = Math.min(width, height);
    const globalThickness = 1.5;

    // Now draw each arc
    context.strokeStyle = 'white';
    context.fillStyle = 'white';
    circles.forEach(circle => {
      context.beginPath();
      context.globalCompositeOperation = 'lighter';
      // Instead of just drawing an arc, we will draw little dots along
      // the arc, somewhat randomly jittered around
      circle.segments.forEach(t => {
        const angle = circle.arcStart + circle.arcLength * t;
        const radius = circle.radius * side + random(-1, 1) * 0.5;
        const x = circle.x * width + Math.cos(angle) * radius;
        const y = circle.y * height + Math.sin(angle) * radius;
        context.beginPath();
        context.arc(x, y, circle.thickness * random(0.5, 1.25) * globalThickness, 0, Math.PI * 2, false);
        context.fill();
        context.globalAlpha = circle.alpha;
      });
    });
  };
};

// Setup the sketch
sketcher(sketch, settings);