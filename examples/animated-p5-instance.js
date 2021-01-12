const canvasSketch = require('canvas-sketch');
const p5 = require('p5');

// Optional preloader
const preload = p5 => {
  // Can p5.loadImage() here and so forth
};

const settings = {
  // Use p5 in instance mode, passing the preloader
  // Can also just pass { p5 } setting if you don't need preloader
  p5: { p5, preload },
  // Turn on a render loop
  animate: true
};

canvasSketch(() => {
  // Return a renderer, which is like p5.js 'draw' function
  return ({ p5, time, width, height }) => {
    // Draw with p5.js things
    p5.background(0);
    p5.fill(255);
    p5.noStroke();

    const anim = p5.sin(time - p5.PI / 2) * 0.5 + 0.5;
    p5.rect(0, 0, width * anim, height);
  };
}, settings);
