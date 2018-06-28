#extension GL_OES_standard_derivatives : enable
precision highp float;
varying vec4 screenPos;

uniform float fade;
uniform float time;
uniform float aspect;

#pragma glslify: noise = require('glsl-noise/simplex/3d');
#pragma glslify: aastep = require('glsl-aastep');
#pragma glslify: hsl2rgb = require('glsl-hsl2rgb');

float noise05 (float freq, vec3 coord) {
  return noise(coord * freq) * 0.5 + 0.5;
}

float terrain (vec3 coord) {
  float e = 1.0 * noise05(1.0, coord) + 
      0.5 * noise05(2.0, coord) +
      0.25 * noise05(4.0, coord) +
      0.13 * noise05(8.0, coord) +
      0.06 * noise05(16.0, coord) +
      0.03 * noise05(32.0, coord);
  e /= (1.0 + 0.5 + 0.25 + 0.13 + 0.06 + 0.03);
  e = pow(e, 4.0);
  e = clamp(e, 0.0, 1.0);
  return e;
}

vec4 isoline (vec2 uv) {
  vec2 scroll = vec2(time * 0.01, 0.0);
  float zoom = mix(0.75, 1.0, fade);
  float morph = time * 0.01;


  float bandCount = 30.0;
  float y = terrain(vec3(scroll + uv * zoom, morph));
  float ty = floor(y * bandCount) / bandCount;
  float L = clamp(ty / 0.25, 0.0, 1.0);

  float center = fract(y * bandCount);
  float thickness = 2.0;
  float lineWidth = fwidth(y * bandCount) * thickness;
  float smoothness = 0.0025;
  float line = smoothstep(center - smoothness, center + smoothness, lineWidth);

  float saturation = mix(0.0, 0.75, pow(L, 1.5));
  float hue = sin(time * 0.5) * 0.5 + 0.5;
  float light = 0.5;
  return vec4(hsl2rgb(hue, saturation, light), line);
}

void main () {
  vec2 vUv = screenPos.xy;
  vec2 uv = vUv;
  if (aspect > 1.0) uv /= vec2(1.0, aspect);
  else uv *= vec2(aspect, 1.0);

  vec4 iso = isoline(uv);
  gl_FragColor = iso;
  gl_FragColor.a *= fade;
}