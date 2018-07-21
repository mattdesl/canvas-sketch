const canvasSketch = require('canvas-sketch');
const GUI = require('../util/gui');

const { Controls, parent, panel } = GUI();

const settings = {
  parent: parent,
  dimensions: 'a4',
  scaleToView: true,
  // Output resolution, we can use 300PPI for print
  pixelsPerInch: 300,
  // all our dimensions and rendering units will use inches
  units: 'in'
};

const sketch = ({ context, render }) => {
  const controls = Controls({
    // background: Controls.NumberInput(0.25, { label: 'foobar' }),
    foo: Controls.NumberOutput(2.2, {  }),
    range: Controls.Range([ -1, 1 ]),
    width: Controls.Slider(1, { range: [ 0, 1 ], showRange: true }),
  });

  const circles = Controls({
    render: () => console.log('wut'),
    radius: Controls.NumberInput(0.5)
  });

  // Hook up render function
  Controls.onChange((() => {
    console.log('render')
  }));

  // const number = 
  // addControl('value', number);

  // const controls = Controls({
  //   background: '#ff0000',
  // }).on('update', render);

  // panel.addColor(controls, 'background', { onChange: render });

  // const controls = addControls({
  //   background: '#ff00ff',
  //   render: () => {
  //     console.log('regenerate')
  //   },
  //   slider: 
  // });

  return ({ context, width, height, frame }) => {
    // Fill page with solid color
    // The 'width' and 'height' will be in inches here
    // context.fillStyle = controls.background;
    context.clearRect(0, 0, width, height);
    context.fillRect(0, 0, width, height);
  };
};

canvasSketch(sketch, settings);
