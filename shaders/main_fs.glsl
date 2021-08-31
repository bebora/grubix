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

struct DiffuseInfo {
  int type;
  vec3 color;
  float texture;
  float threshold;
};

struct SpecularInfo {
  int type;
  vec3 color;
  float shininess;
};

uniform DirectLight directLights[10];
uniform PointLight pointLights[10];
uniform SpotLight spotLights[10];
uniform int ambientType;
uniform vec3 ambientColor;
uniform HemisphericAmbient hemispheric;
uniform DiffuseInfo diffuse;
uniform SpecularInfo specular;
uniform mat4 transposeViewMatrix;

in vec2 fs_textureCoord;
in vec3 fs_tangent;
in vec3 fs_bitangent;
in vec3 fs_position; // TODO use it when necessary. Useless at the moment.
in mat3 TBN;
in mat3 transpTBN;

uniform sampler2D u_texture;
uniform sampler2D u_normalMap;
uniform sampler2D u_depthMap;

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
  vec3 diffuseColour = lightInfo.color * compoundDiffuseColour;
  float lightDotNormals = clamp(dot(normal, lightInfo.direction), 0.0, 1.0);

  if (diffuse.type == 0) {
    // Lambert
    return diffuseColour * lightDotNormals;
  }
  else {
    // Toon
    if (lightDotNormals > diffuse.threshold) {
      return diffuseColour;
    }
    else
      return vec3(0,0,0);
  }
}

vec3 computeSpecular(LightInfo lightInfo, vec3 normal, vec3 eyeDirection) {
  vec3 reflection = -reflect(lightInfo.direction, normal);
  float lightDotNormals = clamp(dot(normal, lightInfo.direction), 0.0, 1.0);

  // If the dot product between the light and the normal is less than 0, no specular contribute
  vec3 color = lightDotNormals > 0.0 ? lightInfo.color * specular.color : vec3(0,0,0);

  if (specular.type == 0) {
    // Phong
    // Compute the dot product between the reflection and the eye direction to get cos(alpha)
    float reflectionDotEye = clamp(dot(reflection, eyeDirection), 0.0, 1.0);
    return color * pow(reflectionDotEye, specular.shininess);
  }
  else {
    // Blinn
    // Compute half vector between light direction and the eye direction
    vec3 halfVector = normalize(lightInfo.direction + eyeDirection);
    // Compute the dot product between the normals and the half vector
    float normalDotHalfVector = clamp(dot(normal, halfVector), 0.0, 1.0);
    return color * pow(normalDotHalfVector, specular.shininess);
  }
}

vec3 computeDiffuseSpecularContribute(vec3 compoundDiffuseColour, vec3 normal) {
  vec3 diffuseContribute = vec3(0,0,0);
  vec3 specularContribute = vec3(0,0,0);

  // Camera is in 0 since we are in camera space
  vec3 eyeDirection = normalize(-fs_position);

  // Compute contributes from direct lights
  for (int i = 0; i < 10; i++) {
    if (directLights[i].valid == 0) {
      break;
    }
    LightInfo directLight = directLightInfo(directLights[i].direction, directLights[i].color);
    diffuseContribute += computeDiffuse(directLight, compoundDiffuseColour, normal);
    specularContribute += computeSpecular(directLight, normal, eyeDirection);
  }
  // Compute contributes from point lights
  for (int i = 0; i < 10; i++) {
    if (pointLights[i].valid == 0) {
      break;
    }
    LightInfo pointLight = pointLightInfo(pointLights[i].position, pointLights[i].decay, pointLights[i].target, pointLights[i].color);
    diffuseContribute += computeDiffuse(pointLight, compoundDiffuseColour, normal);
    specularContribute += computeSpecular(pointLight, normal, eyeDirection);
  }
  // Compute contributes from spot lights
  for (int i = 0; i < 10; i++) {
    if (spotLights[i].valid == 0) {
      break;
    }
    LightInfo spotLight = spotLightInfo(spotLights[i].position, spotLights[i].direction, spotLights[i].decay, spotLights[i].target, spotLights[i].color, spotLights[i].coneOut, spotLights[i].coneIn);
    diffuseContribute += computeDiffuse(spotLight, compoundDiffuseColour, normal);
    specularContribute += computeSpecular(spotLight, normal, eyeDirection);
  }

  return diffuseContribute + specularContribute;
}

vec3 computeAmbientContribute(vec3 normal) {
  vec3 ambientContribute;
  if (ambientType == 1) {
    // Ambient regular
    ambientContribute = ambientColor;
  }
  else if (ambientType == 2) {
    float ambientMultiplier = (dot(normal, hemispheric.direction) + 1.0) / 2.0;
    ambientContribute = (
    hemispheric.upperColor * ambientMultiplier +
    hemispheric.lowerColor * (1.0 - ambientMultiplier)
    );
  }
  else {
    // Skybox with irradiance
    vec3 normalWorldSpace = vec3(normalize(transposeViewMatrix * vec4(normal,1)));
    ambientContribute = texture(u_irradianceMap, normalWorldSpace).rgb;
  }
  return ambientContribute;
}

vec2 ParallaxMapping(vec2 texCoords, vec3 viewDir) {
  // Number of depth layers
  const float minLayers = 16.0;
  const float maxLayers = 64.0;
  float numLayers = mix(maxLayers, minLayers, abs(dot(vec3(0.0, 0.0, 1.0), viewDir)));
  // Calculate the size of each layer
  float layerDepth = 1.0 / numLayers;
  // Depth of current layer
  float currentLayerDepth = 0.0;
  // The amount to shift the texture coordinates per layer (from vector P)
  vec2 P = viewDir.xy / viewDir.z * 0.03; //TODO replace constant multiplier with a uniform
  vec2 deltaTexCoords = P / numLayers;

  // Get initial values
  vec2  currentTexCoords = texCoords;
  float currentDepthMapValue = 1.0 - texture(u_depthMap, currentTexCoords).r;

  for (int step = 0; step < 64 && currentLayerDepth < currentDepthMapValue; step++) {
    // Shift texture coordinates along direction of P
    currentTexCoords -= deltaTexCoords;
    // Get depthmap value at current texture coordinates
    currentDepthMapValue = 1.0 - texture(u_depthMap, currentTexCoords).r;
    // Get depth of next layer
    currentLayerDepth += layerDepth;
  }

  // Get texture coordinates before collision (reverse operations)
  vec2 prevTexCoords = currentTexCoords + deltaTexCoords;

  // Get depth after and before collision for linear interpolation
  float afterDepth  = currentDepthMapValue - currentLayerDepth;
  float beforeDepth = 1.0 - texture(u_depthMap, prevTexCoords).r - currentLayerDepth + layerDepth;

  // Interpolation of texture coordinates
  float weight = afterDepth / (afterDepth - beforeDepth);
  vec2 finalTexCoords = prevTexCoords * weight + currentTexCoords * (1.0 - weight);

  return finalTexCoords;
}



void main() {
  vec3 tangentSpaceCameraPosition = transpTBN * vec3(0.0, 0.0, 0.0); // Camera is in the origin
  vec3 tangentSpaceFragmentPosition = transpTBN * fs_position;

  vec3 tangentSpaceViewDir = normalize(tangentSpaceCameraPosition - tangentSpaceFragmentPosition);
  vec2 texCoords = fs_textureCoord;
  texCoords = ParallaxMapping(texCoords, tangentSpaceViewDir);

  vec3 normalFromMap = vec3(texture(u_normalMap, texCoords));
  vec3 adjustedNormal = normalFromMap * 2.0 - 1.0;
  vec3 finalNormal = normalize(TBN * adjustedNormal);
  vec3 normal = finalNormal;


  vec3 base_texture_colour = vec3(texture(u_texture, texCoords));
  // We assume that the material colour is the same for diffuse and ambient
  vec3 compoundAmbientDiffuseColour = diffuse.texture * base_texture_colour + (1.0 - diffuse.texture) * diffuse.color;

  vec3 diffuseSpecularContribute = computeDiffuseSpecularContribute(compoundAmbientDiffuseColour, normal);

  vec3 ambientContribute = compoundAmbientDiffuseColour * computeAmbientContribute(normal);

  vec3 colour_with_ambient = clamp(ambientContribute + diffuseSpecularContribute, 0.0, 1.0);
  outColor = vec4(colour_with_ambient, 1.0);
}
