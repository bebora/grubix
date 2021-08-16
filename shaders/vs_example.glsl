#version 300 es

in vec3 a_position;
in vec3 a_normal;
in vec2 a_textureCoord;

out vec2 fs_textureCoord;
out vec3 fs_normal;

uniform mat4 worldViewProjectionMatrix;
uniform mat4 normalMatrix;

void main() {
  fs_textureCoord = a_textureCoord;
  fs_normal = mat3(normalMatrix) * a_normal;
  gl_Position = worldViewProjectionMatrix * vec4(a_position,1.0);
}
