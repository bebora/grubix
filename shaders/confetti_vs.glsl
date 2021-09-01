#version 300 es

precision mediump float;

in vec3 in_position;
in vec3 in_colour;

out vec3 gs_position;
out vec4 fs_colour;

uniform mat4 worldViewProjectionMatrix;

void main() {
  gl_Position = worldViewProjectionMatrix * vec4(in_position, 1.0);
  fs_colour = vec4(in_colour, 1.0);
  gl_PointSize = 10.0;
}
