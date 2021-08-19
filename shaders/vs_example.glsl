#version 300 es

in vec3 a_position;
in vec3 a_normal;
in vec2 a_textureCoord;
in vec3 a_tangent;
in vec3 a_bitangent;

out vec2 fs_textureCoord;
out vec3 fs_normal;
out vec3 fs_tangent;
out vec3 fs_bitangent;
out vec3 fs_position;
out mat3 TBN;

uniform mat4 worldViewProjectionMatrix;
uniform mat4 worldViewMatrix;
uniform mat4 normalMatrix;

void main() {
  fs_textureCoord = a_textureCoord;
  fs_normal = mat3(normalMatrix) * a_normal;
  fs_tangent = a_tangent;
  fs_bitangent = a_bitangent;

  vec3 T = normalize(vec3(worldViewMatrix * vec4(a_tangent, 0.0)));
  vec3 B = normalize(vec3(worldViewMatrix * vec4(a_bitangent, 0.0)));
  vec3 N = normalize(vec3(worldViewMatrix * vec4(a_normal, 0.0)));
  TBN = mat3(T, B, N);

  fs_position = (worldViewMatrix * vec4(a_position, 1.0)).xyz;
  gl_Position = worldViewProjectionMatrix * vec4(a_position, 1.0);
}
