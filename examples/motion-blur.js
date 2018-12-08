const canvasSketch = require('canvas-sketch');

const settings = {
  dimensions: [ 512, 512 ],
  duration: 3,
  animate: true,
  fps: 24
};

const sketch = () => {
  const render = ({ context, width, height, playhead }) => {
    context.fillStyle = 'white';
    context.fillRect(0, 0, width, height);

    // Draw a rotated rectangle
    const x = width / 2;
    const y = height / 2;
    const rectWidth = width * 0.5;
    const rectHeight = width * 0.05;
    const rotation = playhead * Math.PI * 2;

    context.save();
    context.fillStyle = 'black';
    context.translate(x, y);
    context.rotate(rotation);
    context.translate(-rectWidth / 2, -rectHeight / 2);
    context.fillRect(0, 0, rectWidth, rectHeight);
    context.restore();
  };

  return createMotionBlur(render, {
    samplesPerFrame: 20,
    shutterAngle: 0.85
  });
};

canvasSketch(sketch, settings);

// A utility that blurs the render() function by averaging samples over many frames
function createMotionBlur (render, opts = {}) {
  const {
    samplesPerFrame = 4,
    shutterAngle = 1
  } = opts;
  const otherCanvas = document.createElement('canvas');
  const otherContext = otherCanvas.getContext('2d');

  return (props = {}) => {
    const {
      context,
      canvasWidth,
      canvasHeight,
      totalFrames,
      exporting,
      frame
    } = props;

    // Ignore blur if not exporting, it is too slow...
    if (!exporting) {
      return render(props);
    }

    otherCanvas.width = canvasWidth;
    otherCanvas.height = canvasHeight;
    otherContext.clearRect(0, 0, canvasWidth, canvasHeight);

    const size = canvasWidth * canvasHeight * 4;
    const composite = new Float32Array(size);
    for (let i = 0; i < size; i++) {
      composite[i] = 0;
    }

    // For every sample, run the render function and add the new pixel values to
    // the composite array
    for (let sample = 0; sample < samplesPerFrame; sample++) {
      const sampleFrame = frame + sample * shutterAngle / samplesPerFrame;
      render(Object.assign({}, props, {
        frame: sampleFrame % totalFrames,
        playhead: (sampleFrame / (totalFrames - 1)) % 1
      }));

      const pixels = context.getImageData(0, 0, canvasWidth, canvasHeight).data;
      for (let idx = 0; idx < pixels.length; idx++) {
        composite[idx] += pixels[idx];
      }
    }

    // Fill the pixels in `imageData` with averaged values from `composite`
    const imageData = context.createImageData(canvasWidth, canvasHeight);
    for (let idx = 0; idx < imageData.data.length; idx++) {
      imageData.data[idx] = composite[idx] / samplesPerFrame;
    }

    // Draw the averaged image data to the canvas
    context.putImageData(imageData, 0, 0);
  };
};
