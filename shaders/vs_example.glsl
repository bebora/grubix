#version 300 es

in vec3 a_position;
in vec3 a_normal;
in vec2 a_uv;
out vec2 uvFS;
out vec3 fs_norm;

uniform mat4 matrix;
uniform mat4 nMatrix;

void main() {
  uvFS = a_uv;
  fs_norm = mat3(nMatrix) * a_normal;
  gl_Position = matrix * vec4(a_position,1.0);
}
