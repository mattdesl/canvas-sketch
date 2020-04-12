const canvasSketch = require('canvas-sketch');
const d3 = require('d3');
const Random = require('canvas-sketch-util/random');
const Color = require('canvas-sketch-util/color');
const { linspace } = require('canvas-sketch-util/math');

const settings = {
  // For SVG to resize easily we will have to set this to true
  scaleToView: true,
  // Do not append <canvas> element
  parent: false,
  // Additional settings as desired
  dimensions: [ 512, 512 ]
};

const sketch = ({ canvas, width, height }) => {
  // Create some random circle data
  const data = linspace(250).map(() => {
    const [ cx, cy ] = Random.insideCircle(width / 4)
    return {
      x: cx + width / 2,
      y: cy + height / 2,
      r: Math.max(1, Random.gaussian(width * 0.001, width * 0.02)),
      fill: Color.parse({ hsl: [
        Random.range(140, 240),
        50,
        50
      ] }).hex
    }
  });

  // Create a svg element
  const svg = d3.select('body')
    .append('svg');

  // Background
  svg.append('rect')
    .attr('x', 0)
    .attr('y', 0)
    .attr('width', width)
    .attr('height', height)
    .attr('fill', 'pink');

  // Create circles from data
  svg
    .selectAll('circle')
    .data(data)
    .enter()
    .append('circle')
    .attr('cx', d => d.x)
    .attr('cy', d => d.y)
    .attr('fill', d => d.fill)
    .attr('r', d => d.r);

  return ({ exporting, width, height, styleWidth, styleHeight }) => {
    // First update the sizes to our viewport
    svg
      .attr('width', styleWidth)
      .attr('height', styleHeight)
      .attr('viewBox', `0 0 ${width} ${height}`);

    // If exporting, serialize SVG to Blob
    if (exporting) {
      // Clone the SVG element and resize to output dimensions
      const copy = d3
        .select(svg.node().cloneNode(true))
        .attr('width', width)
        .attr('height', height);

      // Make a blob out of the SVG and return that
      const data = svgToBlob(copy.node());
      return { data, extension: '.svg' };
    }
  };
};

canvasSketch(sketch, settings);

function svgToBlob (svg) {
  const svgAsXML = new window.XMLSerializer().serializeToString(svg);
  return new window.Blob([ svgAsXML ], { type: 'image/svg+xml' });
}
