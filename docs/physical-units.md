#### <sup>:closed_book: [canvas-sketch](../README.md) → [Documentation](./README.md) → Developing with Physical Units</sup>

---

### Developing with Physical Units

A common challenge when working with code art is figuring out how best to scale it up to a real print, for example US Letter size (8.5 x 11 inches) or even larger formats (such as 3 ft x 3 ft).

Let's say we want a generative design for a business card, which is typically 3.5 x 2 inches. We can setup our artwork like so:

```js
const settings = {
  // Measurements of artwork
  dimensions: [ 3.5, 2 ],
  // Use a higher density for print resolution
  // (this defaults to 72, which is good for web)
  pixelsPerInch: 300,
  // All our units are inches
  units: 'in'
}
```

Now, our canvas fill be scaled to fit the browser window, but the units in our *renderer* function are assumed to be in inches, including the `width` and `height` properties. This means we can, for example, specify a radius of `0.5` for a circle, and it will result in a circle with an exactly 0.5 inch radius when exported and printed at 300 PPI.

Using the above `settings`, we can create a simple artwork with circles like so:

```js
...

const sketch = () => {
  // Utility to draw a circle
  const circle = (context, x, y, radius, fill) => {
    context.beginPath();
    context.arc(x, y, radius, 0, Math.PI * 2, false);
    if (fill) context.fill();
    context.stroke();
  };

  return ({ context, width, height }) => {
    // Here, the 'width' and 'height' are in inches
    // Fill the whole card with black
    context.fillStyle = '#000';
    context.fillRect(0, 0, width, height);

    // Now draw some circles with alternating radii
    // between 0.5 and 0.25 inches
    context.strokeStyle = '#fff';
    context.fillStyle = '#fff';
    context.lineWidth = 0.01;
    for (let i = 0; i < 5; i++) {
      const x = i / 4 * width;
      const y = height / 2;
      const radius = i % 2 === 0 ? 0.5 : 0.25;
      const fill = i % 4 === 0;
      circle(context, x, y, radius, fill);
    }
  };
};
...
```

When you save with `Cmd + S` or `Ctrl + S`, the output image will be 1050 x 600 px, which can be imported into a 3.5 x 2 inch document at 300 PPI resolution. You can see the exported artwork here:

<img src="assets/images/business-card-simple.png" width="75%" />

<p></p>

> <sub>See [here](#) for the full source code of this sketch.</sub>

Here is another business card example, using `cos()` and `sin()` to spiral many circles around the center.

<img src="assets/images/dot-flower.png" width="75%" />

<p></p>

> <sub>See [here](../examples/canvas-dot-flower.js) for the full source code of this sketch.</sub>

## 

<sub>Now that you're exporting high-resolution prints, you should read about [Exporting Artwork to PNG, GIF, MP4 and Other Files](./exporting-artwork.md).</sub>

#### <sup>[← Back to Documentation](./README.md)