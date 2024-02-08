/**
 * A p5.js example integrating with canvas-sketch.
 * Here, canvas-sketch handles the frame loop, resizing
 * and exporting.
 * @author Matt DesLauriers (@mattdesl)
 */

const canvasSketch = require('canvas-sketch');
const { random } = require('canvas-sketch-util');
import { Pane } from 'tweakpane';



// Grab P5.js from npm
const p5 = require('p5');

// Attach p5.js it to global scope
new p5();


/**
 * using Tweakpane 3.1.4
 * Tweak pane parameters and panels
 */
const PARAMS = {
	joinLineStroke: 0.05,
	mods: '',
	pSize: 5,
	velocity: 1,
	// particles: 1
}
const pane = new Pane();
pane.addInput(PARAMS, 'joinLineStroke', {
	min: 0.1,
	max: 1
})
pane.addInput(PARAMS, 'pSize', {
	min: 1,
	max: 50,
	step: 1
})
pane.addInput(PARAMS, 'velocity', {
	min: 0,
	max: 100,
	step: 1

})
pane.addInput(PARAMS, 'mods', {
	options: {
		//   none: '',
		default: '',
		random: 'random',
		blink: 'blink',
	},
});


const settings = {
	// Tell canvas-sketch we're using p5.js
	p5: true,
	// Turn on a render loop (it's off by default in canvas-sketch)
	animate: true,
	// Optional loop duration
	duration: 6,
	attributes: {
		antialias: true
	},
	dimensions: [1080, 1080],
	fps: 60,


};

// Optionally preload before you load the sketch
window.preload = () => {
	// Preload sounds/images/etc...
};
let particles = [];
let counter = 0;
canvasSketch(() => {
	// Inside this is a bit like p5.js 'setup' function
	// ...

	// colorMode(HSB);
	//   angleMode(DEGREES);
	colorMode(RGBA);
	for (var i = 1; i < width / 10; i++) {

		particles.push(new Particle)
	}
	frameRate(20);


	// Return a renderer to 'draw' the p5.js content
	return ({ width, height }) => {
		background('#0f0f0f');
		particles.forEach((particle, i) => {
			particle.createParticle();
			particle.particleColor(PARAMS.mods); // values: 'random' , 'blink', 'color_name or color_code'
			particle.moveParticle();
			particle.joinParticles(particles.slice(i));
		});
	};
}, settings);


class Particle {
	constructor() {
		this.x = random.range(0, width);
		this.y = random.range(0, height);
		// this.r = random.range(1, 10);
		this.xVel = random.range(-2, 2)
		this.yVel = random.range(-1, 1.5)

		this.red = random.range(0, 255);
		this.green = random.range(0, 255);
		this.blue = random.range(0, 255);
		this.alpha = random.range(0, 1);



	}
	createParticle() {
		noStroke();
		circle(this.x, this.y, PARAMS.pSize)
	}

	particleColor(colorParam) {

		if (colorParam == 'random') {
			fill(this.red, this.green, this.blue);
		} else if (colorParam == undefined || colorParam == '') {
			fill('#fff');
		} else if (colorParam == 'blink') {
			let mycolor = (random.range(0, 255));
			fill(mycolor)
		} else {
			fill(colorParam);
		}

	}
	moveParticle() {
		if (this.x < 0 || this.x > width) {
			this.xVel *= -1;
		}
		if (this.y < 0 || this.y > height) {
			this.yVel *= -1;
		}
		this.x += this.xVel * PARAMS.velocity
		this.y += this.yVel * PARAMS.velocity
	}

	joinParticles(particles) {
		particles.forEach(element => {
			let dis = dist(this.x, this.y, element.x, element.y);
			if (dis < 85) {
				// stroke('rgba(255,255,255,0.08)');
				stroke('rgba(255,255,255,' + PARAMS.joinLineStroke + ')');
				line(this.x, this.y, element.x, element.y)
			}
		})
	}
}