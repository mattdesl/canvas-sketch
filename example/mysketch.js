const canvasSketch = require("../dist/canvasSketch.umd.js");

const settings = {
  dimensions: [512, 512]
};

canvasSketch(() => {
  return {
    render({ context, width, height }) {
      context.fillRect(0, 0, width / 2, height);
    }
  };
});
