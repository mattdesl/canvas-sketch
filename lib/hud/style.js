export default `
.canvas-sketch--hud-container {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol";
  font-size: 14px;
  align-self: flex-start;
  height: 100%;
  max-width: 20vw;
  flex-grow: 1;
  flex-shrink: 1;
  overflow-y: auto;
  background: hsl(0, 0%, 95%);
  min-width: 225px;
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

.canvas-sketch--hud-container input[type='text'],
.canvas-sketch--hud-container input[type='number'] {
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

.canvas-sketch--hud-params {
  box-sizing: border-box;
}
.canvas-sketch--hud-params .canvas-sketch--hud-params {
  border-left: 5px solid hsl(0, 0%, 65%);
}
.canvas-sketch--hud-params-header {
  min-height: 26px;
  display: flex;
  justify-content: flex-start;
  align-items: center;
  line-height: 26px;
  min-height: 26px;
  padding: 0px 5px;
  background: hsl(0, 0%, 75%);
  min-width: 100px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  border-bottom: 1px solid black;
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

.canvas-sketch--hud-param-label {
  line-height: 26px;
  min-height: 26px;
  padding: 5px;
  min-width: 100px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  border-right: 1px solid black;
}

.canvas-sketch--hud-container button {
  outline: none;
  background: #fff;
  padding: 5px 10px;
  border: 1px solid #cccccc;
  border-radius: 5px;
  width: 100%;
  cursor: pointer;
}
.canvas-sketch--hud-container button:hover {
  border-color: #a9a9a9;
}
.canvas-sketch--hud-container button:active {
  background: #eaeaea;
}

.canvas-sketch--hud-filter {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 5px;
  margin: 0px;
  box-sizing: border-box;
  width: 100%;
  border-bottom: 1px solid black;
}
.canvas-sketch--hud-filter input[type='text'] {
  width: 100%;
  padding: 5px;
  border: 1px solid #cccccc;
  border-radius: 5px;
  margin: 0px;
}
.canvas-sketch--hud-filter input[type='text']::placeholder {
  opacity: 0.5;
  font-style: italic;
}
`;
