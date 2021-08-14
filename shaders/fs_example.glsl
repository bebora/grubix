#version 300 es

precision mediump float;

in vec2 uvFS;

in vec3 fs_norm;
uniform vec3 mDiffColor; //material diffuse color
uniform vec3 lightDirection; // directional light direction vec
uniform vec3 lightColor; //directional light color

uniform sampler2D u_texture;

out vec4 outColor;

void main() {
  vec3 norm = normalize(fs_norm);
  vec3 nLightDir = normalize(lightDirection);
  float cosine = clamp(dot(norm, nLightDir), 0.0, 1.0);
  vec3 final_colour = lightColor * mDiffColor * cosine;
  vec3 texture_colour = lightColor * vec3(texture(u_texture, uvFS)) * cosine;
  vec3 colour_with_ambient = clamp(texture_colour + vec3(.1, .1, .1), .0, 1.0);
  outColor = vec4(colour_with_ambient, 1.0);
}
