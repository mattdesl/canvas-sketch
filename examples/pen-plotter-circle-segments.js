/**
 * A Canvas2D + SVG Pen Plotter example with circles missing a quarter segment
 *
 * @author Stephane Tombeur (https://github.com/stombeur)
 */

const canvasSketch = require('canvas-sketch');
const penplot = require('./util/penplotsvg');

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
  let elementWidth = 2;
  let elementHeight = 2;
  let columns = 8;
  let rows = 14;
  
  let drawingWidth = (columns * (elementWidth + margin)) - margin;
  let drawingHeight = (rows * (elementHeight + margin)) - margin;
  let marginLeft = (context.width - drawingWidth) / 2;
  let marginTop = (context.height - drawingHeight) / 2;
  
  let o = [];
  for (let r = 0; r < rows; r++) {
    o[r] = [];
    for (let i = 0; i < columns; i++) {
      let angle = getRandomInt(4,0) * 90;
      o[r].push(angle);
    }
  }
  
  return ({ context, width, height, units }) => {
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

    let radius = elementWidth / 2;
    let divide = 15
    let step = radius / divide;

    for (let r = 0; r < rows; r++) {
    	for (let i = 0; i < columns; i++) {
        
        for (let s = 0; s < (divide); s++) {
          drawArc(posX + radius, posY + radius, s * step, o[r][i], o[r][i] + 270);
        }
    		posX = posX + (elementWidth) + margin;
    	}
    	posX = marginLeft;
    	posY = posY + elementHeight + margin;
    }

    console.log(svgFile);

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
