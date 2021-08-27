#version 300 es

precision mediump float;

struct DirectLight
{
  int valid;
  vec3 direction;
  vec3 color;
};

struct PointLight {
  int valid;
  vec3 position;
  int decay;
  vec3 color;
  float target;
};

struct SpotLight {
  int valid;
  vec3 position;
  int decay;
  float target;
  vec3 color;
  vec3 direction;
  float coneOut;
  float coneIn;
};

struct LightInfo {
  vec3 direction;
  vec3 color;
};

uniform DirectLight directLights[10];
uniform PointLight pointLights[10];
uniform SpotLight spotLights[10];

in vec2 fs_textureCoord;
in vec3 fs_tangent;
in vec3 fs_bitangent;
in vec3 fs_position; // TODO use it when necessary. Useless at the moment.
in mat3 TBN;
in vec3 fs_normal;

uniform vec3 materialDiffuseColor; //material diffuse color
uniform vec3 mainAmbientColor; // ambient color or upper color for hemispheric
uniform vec3 secondaryAmbientColor; // lower color for hemispheric
uniform vec3 ambientUpVector; // up direction for hemispheric
uniform int ambientType; // 0 = regular ambient, 1 = hemispheric
uniform float textureIntensity; // texture intensity that balances texture and diffuse color

uniform sampler2D u_texture;
uniform sampler2D u_normalMap;

out vec4 outColor;

LightInfo directLightInfo(vec3 direction, vec3 color) {
  return LightInfo(direction, color);
}

LightInfo pointLightInfo(vec3 position, int decay, float target, vec3 color) {
  vec3 pointColor = color * pow(target / length(position - fs_position), float(decay));
  return LightInfo(normalize(position - fs_position), pointColor);
}

LightInfo spotLightInfo(vec3 position, vec3 direction, int decay, float target, vec3 color, float coneOut, float coneIn) {
  float cosOut = cos(radians(coneOut / 2.0));
  float cosIn = cos(radians(coneOut * coneIn / 2.0));

  vec3 spotDirection = normalize(position - fs_position);
  float cosAngle = dot(spotDirection, direction);
  vec3 spotColor =  clamp((cosAngle - cosOut) / (cosIn - cosOut), 0.0, 1.0) * color * pow(target / length(position - fs_position), target);

  return LightInfo(normalize(position - fs_position), spotColor);
}

vec3 computeDiffuse(LightInfo lightInfo, vec3 compoundDiffuseColour, vec3 normal) {
  return lightInfo.color * compoundDiffuseColour * clamp(dot(normal, lightInfo.direction), 0.0, 1.0);
}


void main() {
  vec3 normalFromMap = vec3(texture(u_normalMap, fs_textureCoord));
  vec3 adjustedNormal = normalFromMap * 2.0 - 1.0;
  vec3 finalNormal = normalize(TBN * adjustedNormal);
  // vec3 norm = normalize(fs_normal); // TODO use fs_normal if normal map disabled
  vec3 norm = finalNormal;


  vec3 base_texture_colour = vec3(texture(u_texture, fs_textureCoord));
  vec3 compoundDiffuseColour = textureIntensity * base_texture_colour + (1.0 - textureIntensity) * materialDiffuseColor;

  vec3 diffuseContribute = vec3(0,0,0);
  // Compute contributes from direct lights
  for (int i = 0; i < 10; i++) {
    if (directLights[i].valid == 0)
      break;
    LightInfo directLight = directLightInfo(directLights[i].direction, directLights[i].color);
    diffuseContribute += computeDiffuse(directLight, compoundDiffuseColour, norm);
  }
  // Compute contributes from point lights
  for (int i = 0; i < 10; i++) {
    if (pointLights[i].valid == 0)
    break;
    LightInfo pointLight = pointLightInfo(pointLights[i].position, pointLights[i].decay, pointLights[i].target, pointLights[i].color);
    diffuseContribute += computeDiffuse(pointLight, compoundDiffuseColour, norm);
  }
  // Compute contributes from spot lights
  for (int i = 0; i < 10; i++) {
    if (spotLights[i].valid == 0)
      break;
    LightInfo spotLight = spotLightInfo(spotLights[i].position, spotLights[i].direction, spotLights[i].decay, spotLights[i].target, spotLights[i].color, spotLights[i].coneOut, spotLights[i].coneIn);
    diffuseContribute += computeDiffuse(spotLight, compoundDiffuseColour, norm);
  }

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
