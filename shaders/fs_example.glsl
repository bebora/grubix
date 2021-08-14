#version 300 es

precision mediump float;

in vec2 uvFS;

in vec3 fs_norm;
uniform vec3 mDiffColor; //material diffuse color
uniform vec3 lightDirection; // directional light direction vec
uniform vec3 lightColor; //directional light color
uniform vec3 ambientColor; // ambient color

uniform sampler2D u_texture;

out vec4 outColor;

void main() {
  vec3 norm = normalize(fs_norm);
  vec3 nLightDir = normalize(lightDirection);
  float cosine = clamp(dot(norm, nLightDir), 0.0, 1.0);
  vec3 final_colour = lightColor * mDiffColor * cosine;
  vec3 base_texture_colour = vec3(texture(u_texture, uvFS));
  vec3 texture_diffuse_contribute = lightColor * base_texture_colour * cosine;
  vec3 texture_ambient_contribute = ambientColor * base_texture_colour;
  vec3 colour_with_ambient = clamp(texture_diffuse_contribute + texture_ambient_contribute , .0, 1.0);
  outColor = vec4(colour_with_ambient, 1.0);
}
