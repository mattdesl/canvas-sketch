/**
 * A Canvas2D + SVG Pen Plotter example with circles missing a quarter segment
 *
 * @author Stephane Tombeur (https://github.com/stombeur)
 */

const canvasSketch = require('canvas-sketch');
const penplot = require('./util/penplotsvg');

// create an instance of SvgFile to store the svg lines and arcs
const svgFile = new penplot.SvgFile();

const settings = {
  dimensions: 'A3',
  orientation: 'portrait',
  pixelsPerInch: 300,
  scaleToView: true,
  units: 'cm',
};

const getRandomInt = (max, min = 0) => min + Math.floor(Math.random() * Math.floor(max));

const sketch = (context) => {
  let margin = 0.2;
  let radius = 1;
  let columns = 8;
  let rows = 14;
  
  let drawingWidth = (columns * (radius * 2 + margin)) - margin;
  let drawingHeight = (rows * (radius * 2 + margin)) - margin;
  let marginLeft = (context.width - drawingWidth) / 2;
  let marginTop = (context.height - drawingHeight) / 2;
  
  // randomize missing circle segments
  let o = [];
  for (let r = 0; r < rows; r++) {
    o[r] = [];
    for (let i = 0; i < columns; i++) {
      let angle = getRandomInt(4,0) * 90; // there are four segments of 90degrees in a circle
      o[r].push(angle);
    }
  }
  
  return ({ context, width, height, units }) => {
    // draw an arc on the canvas and also add it to the svg file
    const drawArc = (cx, cy, radius, sAngle, eAngle) => {
      context.beginPath();
      context.arc(cx, cy, radius, (Math.PI / 180) * sAngle, (Math.PI / 180) * eAngle);
      context.stroke();
    
      svgFile.addArc(cx, cy, radius, sAngle, eAngle);
    }

    context.fillStyle = 'white';
    context.fillRect(0, 0, width, height);
    context.strokeStyle = 'black';
    context.lineWidth = 0.01;

    let posX = marginLeft;
    let posY = marginTop;

    let increments = 15; // nr of lines inside the circle
    let step = radius / increments;

    for (let r = 0; r < rows; r++) {
    	for (let c = 0; c < columns; c++) {
            for (let s = 0; s < (increments); s++) {
                // draw a 270degree arc, starting from a random 90degree segment
                drawArc(posX + radius, posY + radius, s * step, o[r][c], o[r][c] + 270); 
            }
    		posX = posX + (radius * 2) + margin;
    	}
    	posX = marginLeft;
    	posY = posY + radius * 2 + margin;
    }

    return [
      // Export PNG as first layer
      context.canvas,
      // Export SVG for pen plotter as second layer
      {
        data: svgFile.toSvg({
          width,
          height,
          units
        }),
        extension: '.svg',
      }
    ];
  };
};

canvasSketch(sketch, settings);
