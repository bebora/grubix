#version 300 es

precision mediump float;

in vec3 in_position;

uniform mat4 inverseViewProjMatrix;

out vec4 v_pos;

void main() {
  vec4 pos = vec4(in_position,1.0);

  gl_Position = pos;
  v_pos = inverseViewProjMatrix * pos;
}