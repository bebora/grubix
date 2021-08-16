#version 300 es

precision mediump float;

in vec2 fs_textureCoord;

in vec3 fs_normal;
uniform vec3 materialDiffuseColor; //material diffuse color
uniform vec3 lightDirection; // directional light direction vec
uniform vec3 lightColor; //directional light color
uniform vec3 mainAmbientColor; // ambient color or upper color for hemispheric
uniform vec3 secondaryAmbientColor; // lower color for hemispheric
uniform vec3 ambientUpVector; // up direction for hemispheric
uniform int ambientType; // 0 = regular ambient, 1 = hemispheric
uniform float textureIntensity; // texture intensity that balances texture and diffuse color

uniform sampler2D u_texture;

out vec4 outColor;

void main() {
  vec3 norm = normalize(fs_normal);
  vec3 nLightDir = normalize(lightDirection);
  float cosine = clamp(dot(norm, nLightDir), 0.0, 1.0);

  vec3 base_texture_colour = vec3(texture(u_texture, fs_textureCoord));
  // TODO should we clamp the input uniforms?
  vec3 compoundDiffuseColour = textureIntensity * base_texture_colour + (1.0 - textureIntensity) * materialDiffuseColor;

  vec3 diffuseContribute = lightColor * compoundDiffuseColour * cosine;


  vec3 ambientContribute;
  if (ambientType == 0) {
    ambientContribute = mainAmbientColor * compoundDiffuseColour;
  }
  else if (ambientType == 1) {
    float ambientMultiplier = (dot(norm, ambientUpVector) + 1.0) / 2.0;
    ambientContribute = (
      mainAmbientColor * ambientMultiplier +
      secondaryAmbientColor * (1.0 - ambientMultiplier)
    ) * compoundDiffuseColour;
  }
  vec3 colour_with_ambient = clamp(diffuseContribute + ambientContribute , .0, 1.0);
  outColor = vec4(colour_with_ambient, 1.0);
}
