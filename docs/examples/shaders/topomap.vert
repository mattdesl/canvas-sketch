precision highp float;
attribute vec3 position;
varying vec4 screenPos;
uniform mat4 projectionMatrix;
uniform mat4 modelViewMatrix;

void main () {
  gl_Position = vec4(position.xyz, 1.0);
  screenPos = gl_Position.xyzw;
}