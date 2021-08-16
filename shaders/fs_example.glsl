#version 300 es

precision mediump float;

in vec2 fs_textureCoord;

in vec3 fs_normal;
uniform vec3 materialDiffuseColor; //material diffuse color
uniform vec3 lightDirection; // directional light direction vec
uniform vec3 lightColor; //directional light color
uniform vec3 ambientColor; // ambient color
uniform float textureIntensity; // texture intensity that balances texture and diffuse color

uniform sampler2D u_texture;

out vec4 outColor;

void main() {
  vec3 norm = normalize(fs_normal);
  vec3 nLightDir = normalize(lightDirection);
  float cosine = clamp(dot(norm, nLightDir), 0.0, 1.0);

  vec3 base_texture_colour = vec3(texture(u_texture, fs_textureCoord));
  // TODO should we clamp the input uniforms?
  vec3 compound_diffuse_colour = textureIntensity * base_texture_colour + (1.0 - textureIntensity) * materialDiffuseColor;

  vec3 diffuse_contribute = lightColor * compound_diffuse_colour * cosine;
  vec3 ambient_contribute = ambientColor * compound_diffuse_colour;
  vec3 colour_with_ambient = clamp(diffuse_contribute + ambient_contribute , .0, 1.0);
  outColor = vec4(colour_with_ambient, 1.0);
}
