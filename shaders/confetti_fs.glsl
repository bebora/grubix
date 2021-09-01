#version 300 es

precision mediump float;

in vec4 fs_colour;

out vec4 outColor;

void main() {
  outColor = fs_colour;
}
