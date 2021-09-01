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

struct ParallaxInfo {
  int enabled;
  float scale;
};

struct PbrInfo {
  int enabled;
  float metallic;
  float roughness;
};

uniform DirectLight directLights[10];
uniform PointLight pointLights[10];
uniform SpotLight spotLights[10];
uniform int ambientType;
uniform vec3 ambientColor;
uniform HemisphericAmbient hemispheric;
uniform DiffuseInfo diffuse;
uniform SpecularInfo specular;
uniform ParallaxInfo parallax;
uniform PbrInfo pbr;
uniform mat4 transposeViewMatrix;

in vec2 fs_textureCoord;
in vec3 fs_tangent;
in vec3 fs_bitangent;
in vec3 fs_position;
in mat3 TBN;
in mat3 transpTBN;

uniform sampler2D u_texture;
uniform sampler2D u_normalMap;
uniform sampler2D u_depthMap;

uniform samplerCube u_irradianceMap;
uniform samplerCube u_environmentMap;


const float PI = 3.14159265359;

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

vec3 fresnelSchlick(float cosTheta, vec3 F0){
    return F0 + (1.0 - F0) * pow(max(1.0 - cosTheta, 0.0), 5.0);
}  

float DistributionGGX(vec3 N, vec3 H, float roughness){
    float a      = roughness*roughness;
    float a2     = a*a;
    float NdotH  = max(dot(N, H), 0.0);
    float NdotH2 = NdotH*NdotH;
	
    float num   = a2;
    float denom = (NdotH2 * (a2 - 1.0) + 1.0);
    denom = PI * denom * denom;
	
    return num / denom;
}

float GeometrySchlickGGX(float NdotV, float roughness){
    float r = (roughness + 1.0);
    float k = (r*r) / 8.0;

    float num   = NdotV;
    float denom = NdotV * (1.0 - k) + k;
	
    return num / denom;
}

float GeometrySmith(vec3 N, vec3 V, vec3 L, float roughness){
    float NdotV = max(dot(N, V), 0.0);
    float NdotL = max(dot(N, L), 0.0);
    float ggx2  = GeometrySchlickGGX(NdotV, roughness);
    float ggx1  = GeometrySchlickGGX(NdotL, roughness);
	
    return ggx1 * ggx2;
}

vec3 computeSpecular(LightInfo lightInfo, vec3 normal, vec3 eyeDirection, vec3 halfVector) {
  vec3 reflection = -reflect(lightInfo.direction, normal);
  float lightDotNormals = clamp(dot(normal, lightInfo.direction), 0.0, 1.0);

  // If the dot product between the light and the normal is less than 0, no specular contribute
  vec3 color = lightDotNormals > 0.0 ? lightInfo.color * specular.color : vec3(0,0,0);

  if(pbr.enabled == 1){
    // Cook-Torrance
    vec3 L = lightInfo.direction;
    vec3 H = normalize(lightInfo.direction + eyeDirection);
    vec3 N = normal;
    
    // cook-torrance brdf
    float NDF = DistributionGGX(N, H, pbr.roughness);        
    float G   = GeometrySmith(N, eyeDirection, L, pbr.roughness);       
    
    float numerator    = NDF * G; // we'll multiply by F later, when computing kD and kS
    float denominator = 4.0 * max(dot(N, eyeDirection), 0.0) * max(dot(N, L), 0.0);
    vec3 specular     = vec3(numerator / max(denominator, 0.001) * lightDotNormals);
    return specular;
  } 
  else{
    if (specular.type == 0) {
      // Phong
      // Compute the dot product between the reflection and the eye direction to get cos(alpha)
      float reflectionDotEye = clamp(dot(reflection, eyeDirection), 0.0, 1.0);
      return color * pow(reflectionDotEye, specular.shininess);
    }
    else {
      // Blinn
      // Compute the dot product between the normals and the half vector
      float normalDotHalfVector = clamp(dot(normal, halfVector), 0.0, 1.0);
      return color * pow(normalDotHalfVector, specular.shininess);
    }
  }
}

vec3 computeLightDiffuseSpecular(LightInfo lightInfo, vec3 compoundDiffuseColour, vec3 normal, vec3 eyeDirection){
  vec3 kS = vec3(1.0);
  vec3 kD = vec3(1.0);
  // Compute half vector between light direction and the eye direction
  vec3 halfVector = normalize(lightInfo.direction + eyeDirection);

  if(pbr.enabled == 1){
    vec3 F0 = vec3(0.04); 
    F0 = mix(F0, compoundDiffuseColour, pbr.metallic);
    vec3 F    = fresnelSchlick(max(dot(halfVector, eyeDirection), 0.0), F0);       
    kS = F;
    kD = vec3(1.0) - kS;
    kD *= 1.0 - pbr.metallic;
  }

  return  kD * computeDiffuse(lightInfo, compoundDiffuseColour, normal) + 
          kS * computeSpecular(lightInfo, normal, eyeDirection, halfVector);
}

vec3 computeDiffuseSpecularContribute(vec3 compoundDiffuseColour, vec3 normal) {
  vec3 diffuseSpecularContribute = vec3(0,0,0);

  // Camera is in 0 since we are in camera space
  vec3 eyeDirection = normalize(-fs_position);

  // Compute contributes from direct lights
  for (int i = 0; i < 10; i++) {
    if (directLights[i].valid == 0) {
      break;
    }
    LightInfo directLight = directLightInfo(directLights[i].direction, directLights[i].color);
    diffuseSpecularContribute += computeLightDiffuseSpecular(directLight, compoundDiffuseColour, normal, eyeDirection);    
  }

  // Compute contributes from point lights
  for (int i = 0; i < 10; i++) {
    if (pointLights[i].valid == 0) {
      break;
    }
    LightInfo pointLight = pointLightInfo(pointLights[i].position, pointLights[i].decay, pointLights[i].target, pointLights[i].color);
    diffuseSpecularContribute += computeLightDiffuseSpecular(pointLight, compoundDiffuseColour, normal, eyeDirection);
  }

  // Compute contributes from spot lights
  for (int i = 0; i < 10; i++) {
    if (spotLights[i].valid == 0) {
      break;
    }
    LightInfo spotLight = spotLightInfo(spotLights[i].position, spotLights[i].direction, spotLights[i].decay, spotLights[i].target, spotLights[i].color, spotLights[i].coneOut, spotLights[i].coneIn);
    diffuseSpecularContribute += computeLightDiffuseSpecular(spotLight, compoundDiffuseColour, normal, eyeDirection);
  }

  return diffuseSpecularContribute;
}

vec3 fresnelSchlickRoughness(float cosTheta, vec3 F0, float roughness){
    return F0 + (max(vec3(1.0 - roughness), F0) - F0) * pow(clamp(1.0 - cosTheta, 0.0, 1.0), 5.0);
}

vec3 computeAmbientContribute(vec3 normal, vec3 compoundDiffuseColour) {
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
    // Skybox - ambient contribute is irradiance (diffuse) + specular (from env map mipmap)
    vec3 normalWorldSpace = normalize(mat3(transposeViewMatrix) * normal);
    vec3 eyeDirection = normalize(-fs_position);
    vec3 ambientDiffuse = texture(u_irradianceMap, normalWorldSpace).rgb; // irradiance

    // Compute specualar contribute
    vec3 cameraSpaceReflectDirection = -reflect(eyeDirection, normal);
    vec3 worldSpaceReflectDirection = normalize(mat3(transposeViewMatrix) * cameraSpaceReflectDirection);
    float mipCount = 11.0; // resolution of 2048*2048
    // if PBR is disabled, we get the maximum level of detail (lod = 0), otherwise roughness
    float levelOfDetail = pbr.enabled == 1 ? (pbr.roughness * mipCount) : 0.0;
    vec3 ambientSpecular = textureLod(u_environmentMap, worldSpaceReflectDirection, levelOfDetail).rgb;

    if(pbr.enabled == 1){
      vec3 F0 = vec3(0.04); 
      F0 = mix(F0, compoundDiffuseColour, pbr.metallic);
      vec3 kS = fresnelSchlickRoughness(max(dot(normal, eyeDirection), 0.0), F0, pbr.roughness); 
      vec3 kD = 1.0 - kS;
      ambientDiffuse *= kD;
    }

    ambientContribute = ambientDiffuse + ambientSpecular;
  }
  return compoundDiffuseColour * ambientContribute;
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
  vec2 P = viewDir.xy / viewDir.z * parallax.scale;
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

/* Prevent coordinates from going over the borders of the texture, so that
  vertices on the borders do not use colours from neighbouring faces in the texture */
vec2 adjustParallaxCoordinates(vec2 pom_coords, vec2 orig_coords) {
  // 4 horizontal slots => 1 / 4; 2 vertical slots => 1 / 2
  float pom_x_offset = floor(pom_coords.x / .25);
  float pom_y_offset = floor(pom_coords.y / .5);
  float orig_x_offset = floor(orig_coords.x / .25);
  float orig_y_offset = floor(orig_coords.y / .5);

  if (pom_x_offset != orig_x_offset) {
    pom_coords.x = orig_coords.x;
  }
  if (pom_y_offset != orig_y_offset) {
    pom_coords.y = orig_coords.y;
  }

  return pom_coords;
}

vec2 computeParallaxedCoordinates(vec3 fragment_position, vec2 original_texture_coordinates) {
  if (parallax.enabled == 0) {
    return original_texture_coordinates;
  }
  else {
    vec3 tangentSpaceCameraPosition = transpTBN * vec3(0.0, 0.0, 0.0); // Camera is in the origin
    vec3 tangentSpaceFragmentPosition = transpTBN * fragment_position;

    vec3 tangentSpaceViewDir = normalize(tangentSpaceCameraPosition - tangentSpaceFragmentPosition);
    vec2 texCoords = original_texture_coordinates;
    texCoords = ParallaxMapping(texCoords, tangentSpaceViewDir);
    texCoords = adjustParallaxCoordinates(texCoords, original_texture_coordinates);

    return texCoords;
  }
}



void main() {
  vec2 texCoords = computeParallaxedCoordinates(fs_position, fs_textureCoord);

  vec3 normalFromMap = vec3(texture(u_normalMap, texCoords));
  vec3 adjustedNormal = normalFromMap * 2.0 - 1.0;
  vec3 finalNormal = normalize(TBN * adjustedNormal);
  vec3 normal = finalNormal;


  vec3 base_texture_colour = vec3(texture(u_texture, texCoords));
  // We assume that the material colour is the same for diffuse and ambient
  vec3 compoundAmbientDiffuseColour = diffuse.texture * base_texture_colour + (1.0 - diffuse.texture) * diffuse.color;

  vec3 diffuseSpecularContribute = computeDiffuseSpecularContribute(compoundAmbientDiffuseColour, normal);

  vec3 ambientContribute = computeAmbientContribute(normal, compoundAmbientDiffuseColour);

  vec3 colour_with_ambient = clamp(ambientContribute + diffuseSpecularContribute, 0.0, 1.0);
  outColor = vec4(colour_with_ambient, 1.0);
}
