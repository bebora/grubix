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

struct HemisphericAmbient {
  vec3 upperColor;
  vec3 lowerColor;
  vec3 direction;
};

uniform DirectLight directLights[10];
uniform PointLight pointLights[10];
uniform SpotLight spotLights[10];
uniform int ambientType;
uniform vec3 ambientColor;
uniform HemisphericAmbient hemispheric;

in vec2 fs_textureCoord;
in vec3 fs_tangent;
in vec3 fs_bitangent;
in vec3 fs_position; // TODO use it when necessary. Useless at the moment.
in mat3 TBN;
in vec3 fs_normal;

uniform vec3 materialDiffuseColor; //material diffuse color
uniform float textureIntensity; // texture intensity that balances texture and diffuse color

uniform sampler2D u_texture;
uniform sampler2D u_normalMap;

uniform samplerCube u_irradianceMap;

out vec4 outColor;

LightInfo directLightInfo(vec3 direction, vec3 color) {
  return LightInfo(direction, color);
}

LightInfo pointLightInfo(vec3 position, int decay, float target, vec3 color) {
  float floatDecay = float(decay);
  vec3 pointColor = color * pow(target / length(position - fs_position), floatDecay);
  return LightInfo(normalize(position - fs_position), pointColor);
}

LightInfo spotLightInfo(vec3 position, vec3 direction, int decay, float target, vec3 color, float coneOut, float coneIn) {
  float cosOut = cos(radians(coneOut / 2.0));
  float cosIn = cos(radians(coneOut * coneIn / 2.0));

  vec3 spotDirection = normalize(position - fs_position);
  float cosAngle = dot(spotDirection, direction);
  float floatDecay = float(decay);
  vec3 spotColor =  color * clamp((cosAngle - cosOut) / (cosIn - cosOut), 0.0, 1.0) * pow(target / length(position - fs_position), floatDecay);
  return LightInfo(normalize(position - fs_position), spotColor);
}

vec3 computeDiffuse(LightInfo lightInfo, vec3 compoundDiffuseColour, vec3 normal) {
  return lightInfo.color * compoundDiffuseColour * clamp(dot(normal, lightInfo.direction), 0.0, 1.0);
}


vec3 computeDiffuseContribute(DirectLight directLights[10], PointLight pointLights[10], SpotLight spotLights[10], vec3 compoundDiffuseColour, vec3 norm) {
  vec3 diffuseContribute = vec3(0,0,0);
  // Compute contributes from direct lights
  for (int i = 0; i < 10; i++) {
    if (directLights[i].valid == 0) {
      break;
    }
    LightInfo directLight = directLightInfo(directLights[i].direction, directLights[i].color);
    diffuseContribute += computeDiffuse(directLight, compoundDiffuseColour, norm);
  }
  // Compute contributes from point lights
  for (int i = 0; i < 10; i++) {
    if (pointLights[i].valid == 0) {
      break;
    }
    LightInfo pointLight = pointLightInfo(pointLights[i].position, pointLights[i].decay, pointLights[i].target, pointLights[i].color);
    diffuseContribute += computeDiffuse(pointLight, compoundDiffuseColour, norm);
  }
  // Compute contributes from spot lights
  for (int i = 0; i < 10; i++) {
    if (spotLights[i].valid == 0) {
      break;
    }
    LightInfo spotLight = spotLightInfo(spotLights[i].position, spotLights[i].direction, spotLights[i].decay, spotLights[i].target, spotLights[i].color, spotLights[i].coneOut, spotLights[i].coneIn);
    diffuseContribute += computeDiffuse(spotLight, compoundDiffuseColour, norm);
  }

  return diffuseContribute;
}

vec3 computeAmbientContribute(vec3 normal, vec3 compoundAmbientDiffuseColour) {
  vec3 ambientContribute;
  if (ambientType == 1) {
    // Ambient regular
    ambientContribute = ambientColor * compoundAmbientDiffuseColour;
  }
  else if (ambientType == 2) {
    float ambientMultiplier = (dot(normal, hemispheric.direction) + 1.0) / 2.0;
    ambientContribute = (
    hemispheric.upperColor * ambientMultiplier +
    hemispheric.lowerColor * (1.0 - ambientMultiplier)
    ) * compoundAmbientDiffuseColour;
  }
  else {
    // Skybox with irradiance
    ambientContribute = texture(u_irradianceMap, normal).rgb;
  }
  return ambientContribute;
}


void main() {
  vec3 normalFromMap = vec3(texture(u_normalMap, fs_textureCoord));
  vec3 adjustedNormal = normalFromMap * 2.0 - 1.0;
  vec3 finalNormal = normalize(TBN * adjustedNormal);
  // vec3 norm = normalize(fs_normal); // TODO use fs_normal if normal map disabled
  vec3 norm = finalNormal;


  vec3 base_texture_colour = vec3(texture(u_texture, fs_textureCoord));
  // We assume that the material colour is the same for diffuse and ambient
  vec3 compoundAmbientDiffuseColour = textureIntensity * base_texture_colour + (1.0 - textureIntensity) * materialDiffuseColor;

  vec3 diffuseContribute = computeDiffuseContribute(directLights, pointLights, spotLights, compoundAmbientDiffuseColour, norm);
  vec3 ambientContribute = computeAmbientContribute(norm, compoundAmbientDiffuseColour);

  vec3 colour_with_ambient = clamp(diffuseContribute + ambientContribute , .0, 1.0);
  outColor = vec4(colour_with_ambient, 1.0);
}
