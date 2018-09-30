export default `
.canvas-sketch--hud-container {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol";
  font-size: 14px;
  align-self: flex-start;
  height: 100%;
  background: hsl(0, 0%, 95%);
  min-width: 270px;
}

.canvas-sketch--hud-float {
  position: absolute;
  right: 0;
  top: 0;
}

.canvas-sketch--hud-sketch > header {
  background: gray;
  padding: 5px;
  color: white;
}

.canvas-sketch--hud-sketch input[type='text'], .canvas-sketch--hud-sketch input[type='number'] {
  font-family: "Andale Mono", monospace;
  width: 100%;
  outline: none;
  padding: 5px;
  margin: 0;
}

.canvas-sketch--hud-sketch input[type='range'] {
  width: 100%;
  cursor: pointer;
  outline: none;
  padding: 0px;
  margin: 0;
}

.canvas-sketch--hud-sketch input[type='color'] {
  border: none;
  width: 100%;
  padding: 0;
  cursor: pointer;
  outline: none;
  margin: 0;
  background: transparent;
  -webkit-appearance: none;
  height: 16px;
}
.canvas-sketch--hud-sketch input[type="color"]::-webkit-color-swatch-wrapper {
  padding: 0;
  background: transparent;
}
.canvas-sketch--hud-sketch input[type="color"]::-webkit-color-swatch {
  border: none;
  background: transparent;
  border-radius: 2px;
}

.canvas-sketch--hud-param-cell {
  display: flex;
  justify-content: flex-start;
  align-items: center;
  border-bottom: 1px solid black;
  flex-direction: row;
}

.canvas-sketch--hud-param-value {
  min-height: 26px;
  display: flex;
  padding: 5px 5px;
  min-width: 100px;
  justify-content: flex-start;
  align-items: center;
  width: 100%;
  flex-direction: row;
}

/*.canvas-sketch--hud-param-cell:last-child {
  border-bottom: none;
}*/

.canvas-sketch--hud-param-header {
  line-height: 26px;
  min-height: 26px;
  padding: 5px;
  min-width: 100px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  border-right: 1px solid black;
}
`;
