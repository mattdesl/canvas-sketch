#### <sup>:closed_book: [canvas-sketch](../README.md) → [Documentation](./README.md) → Hot Reloading</sup>

---

### Hot Reloading

The `canvas-sketch` CLI can support *Hot Reloading* in your sketches. When enabled, code changes will be evaluated and applied without forcing an entire page reload. Use the `--hot` flag to enable it:

```sh
canvas-sketch my-sketch.js --hot
```

This provides a much better feedback loop while developing creative content, as you no longer have jarring flashes as the page reloads, and the `{ time }` and `{ frame }` parameters will be persisted between code updates.

## How it works

This is implemented by destroying the previous state of your sketch, unmounting it from the DOM, and then re-creating and re-mounting it from your new code. This way, you can change settings and other properties that are outside the scope of your sketch and render function, and the changes will still be applied without losing the current time.

## Gotchas

The feature is 

## Multiple Sketches

If you happen to have multiple sketches (multiple `canvasSketch()` calls) in a single application, you will need to provide a unique `{ id }` for each sketch to ensure that hot reloading is applied correctly.

```js
canvasSketch(mainSketch, { id: 'primary' });
canvasSketch(otherSketch, { id: 'secondary' });
```

## 

<sub>Now that you know about hot replacement, you may want to read about [Developing with Physical Units](./physical-units.md).</sub>

#### <sup>[← Back to Documentation](./README.md)