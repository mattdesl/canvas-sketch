#### <sup>:closed_book: [canvas-sketch](../README.md) → [Documentation](./README.md) → Animated Sketches</sup>

---

### Animated Sketches

To make animated artworks, specify `{ animate: true }` in your `settings` parameter. This starts a `requestAnimationFrame` loop once your sketch is loaded.

Now in renderer function, you can use the following `props` to determine how to draw your content:

- `time` - the current time of the loop in seconds
- `playhead` - the current playhead of the loop in 0..1 range (only defined when there is a fixed loop duration)
- `frame` - the current frame index of the animation
- And more (see [full API docs](./api.md) for details)

For seamless loops, you can multiply `playhead` by `Math.PI` to get a number that wraps around perfectly. For endless loops with no fixed duration, you can animate with the `time` prop instead.

Here is an example of a spinning rectangle:

```js
const canvasSketch = require('canvas-sketch');

const settings = {
  // Enable an animation loop
  animate: true,
  // Set loop duration to 3
  duration: 3,
  // Use a small size for better GIF file size
  dimensions: [ 256, 256 ],
  // Optionally specify a frame rate, defaults to 30
  fps: 30
};

// Start the sketch
canvasSketch(() => {
  return ({ context, width, height, playhead }) => {
    // Fill the canvas with pink
    context.fillStyle = 'pink';
    context.fillRect(0, 0, width, height);

    // Get a seamless 0..1 value for our loop
    const t = Math.sin(playhead * Math.PI);

    // Animate the thickness with 'playhead' prop
    const thickness = Math.max(5, Math.pow(t, 0.55) * width * 0.5);

    // Rotate with PI to create a seamless animation
    const rotation = playhead * Math.PI;

    // Draw a rotating white rectangle around the center
    const cx = width / 2;
    const cy = height / 2;
    const length = height * 0.5;
    context.fillStyle = 'white';
    context.save();
    context.translate(cx, cy);
    context.rotate(rotation);
    context.fillRect(-thickness / 2, -length / 2, thickness, length);
    context.restore();
  };
}, settings);
```

The result:

![anim](assets/images/loop-1.gif)

For details on how to export animations (like the GIF above), see the [Exporting](./exporting-artwork.md) guide.

## 

<sub>After animation, you might like to read about using [Hot Reloading](./hot-reloading.md) during development.</sub>

#### <sup>[← Back to Documentation](./README.md)