#version 300 es

in vec3 in_position;

out vec3 sampleDir;

void main() {
  gl_Position = vec4(in_position,1.0);
  sampleDir = in_position;
}