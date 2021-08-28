import { getTexturesWithTarget, mathUtils } from "../utils.js";
import { fromTypeToId } from "../state/ambient.js";

/**
 * Manage the rendering of the ambientState, by injecting the uniform values related to the ambient options
 * @param {AmbientState} ambientState
 * @param {WebGL2RenderingContext} gl
 * @param {WebGLProgram} program
 * @param {string} irradianceDir
 * @constructor
 */
export function AmbientRenderer(ambientState, gl, program, irradianceDir) {
  this.initUniforms = function () {
    let type = gl.getUniformLocation(program, "ambientType");

    // Get uniforms for ambient
    let ambient = {
      color: gl.getUniformLocation(program, "ambientColor"),
    };

    // Get uniforms for hemispheric
    let hemisphericPrefix = "hemispheric";
    let hemispheric = {
      upperColor: gl.getUniformLocation(
        program,
        `${hemisphericPrefix}.upperColor`
      ),
      lowerColor: gl.getUniformLocation(
        program,
        `${hemisphericPrefix}.lowerColor`
      ),
      direction: gl.getUniformLocation(
        program,
        `${hemisphericPrefix}.direction`
      ),
    };

    let irradianceTex = gl.getUniformLocation(program, "u_irradianceMap");

    return {
      type,
      ambient,
      hemispheric,
      irradianceTex,
    };
  };
  this.loadTexture = async function (gl) {
    // Load the texture
    let texture = gl.createTexture();
    this.texture = texture;
    gl.activeTexture(gl.TEXTURE0 + 4);
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture);

    let targetsWithTexture = getTexturesWithTarget(gl, irradianceDir);
    let targetsWithImages = targetsWithTexture.map((el) => {
      let image = new Image();
      image.src = el.url;
      image.decode();
      return {
        target: el.target,
        image,
      };
    });
    for (const textureWithTarget of targetsWithImages) {
      const { target, image } = textureWithTarget;

      // render in the texture, before it's loaded
      gl.texImage2D(
        target,
        0,
        gl.RGBA,
        256,
        256,
        0,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        null
      );

      await image.decode();
      // Now that the image has loaded upload it to the texture.
      gl.activeTexture(gl.TEXTURE0 + 4);
      gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture);
      gl.texImage2D(target, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
    }
    gl.generateMipmap(gl.TEXTURE_CUBE_MAP);
    gl.texParameteri(
      gl.TEXTURE_CUBE_MAP,
      gl.TEXTURE_MIN_FILTER,
      gl.LINEAR_MIPMAP_LINEAR
    );
  };

  let uniforms = this.initUniforms();

  /**
   * Pass view matrix to transform light position and direction in camera space from world space
   * @param viewMatrix
   * @param lightDirMatrix
   */
  this.injectUniform = function (viewMatrix, lightDirMatrix) {
    gl.activeTexture(gl.TEXTURE0 + 4);
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, this.texture);
    gl.uniform1i(uniforms.irradianceTex, 4);

    // Inject type uniform
    gl.uniform1i(uniforms.type, fromTypeToId[ambientState.type]);

    let parameters = ambientState.getParameters();

    // Inject uniforms for ambient light
    if (ambientState.type === "ambient") {
      gl.uniform3f(uniforms.ambient.color, ...parameters.color);
    } else if (ambientState.type === "hemispheric") {
      let cameraSpaceAmbientDirection = mathUtils.multiplyMatrix3Vector3(
        mathUtils.sub3x3from4x4(lightDirMatrix),
        parameters.direction
      );
      gl.uniform3f(uniforms.hemispheric.upperColor, ...parameters.upperColor);
      gl.uniform3f(uniforms.hemispheric.lowerColor, ...parameters.lowerColor);
      gl.uniform3f(
        uniforms.hemispheric.direction,
        ...cameraSpaceAmbientDirection
      );
    }
  };
}
