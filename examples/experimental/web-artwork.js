const sketcher = require('canvas-sketch');

const settings = {
  dimensions: [ 1280, 720 ],
  // If you want to test in the browser
  // at a lower resolution, and then up-scale
  // on Cmd+S export, you can use this.
  exportPixelRatio: 2
};

const sketch = () => {
  return {
    preExport () {
      // Can take some action before exporting a frame
    },
    postExport () {
      // Can also do something here on post export
    },
    render ({ context, exporting, width, height }) {
      // Fill browser with solid color
      context.fillStyle = 'black';
      context.fillRect(0, 0, width, height);

      // Draw a 12px thick stroke circle
      context.lineWidth = 12;
      context.strokeStyle = 'white';
      context.beginPath();
      context.arc(width / 2, height / 2, Math.min(width, height) / 4, 0, Math.PI * 2, false);
      context.stroke();
    }
  };
};

window.app = sketcher(sketch, settings);
