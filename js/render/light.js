/**
 * Manage the rendering of the lightState, by injecting the uniform values related to the light options
 * @param {LightState} lightState
 * @param {WebGL2RenderingContext} gl
 * @param {WebGLProgram} program
 * @constructor
 */
import { mathUtils } from "../utils.js";

/**
 * Manage the rendering of the lights
 * @param {LightState} lightState
 * @param {WebGL2RenderingContext} gl
 * @param {WebGLProgram} program
 * @constructor
 */
export function LightRenderer(lightState, gl, program) {
  this.initUniforms = function () {
    // Get uniforms for point lights
    let directUniforms = [];
    let directUniformPrefix = "directLights";
    for (let i = 0; i < 10; i++) {
      directUniforms.push({
        valid: gl.getUniformLocation(
          program,
          `${directUniformPrefix}[${i}].valid`
        ),
        color: gl.getUniformLocation(
          program,
          `${directUniformPrefix}[${i}].color`
        ),
        direction: gl.getUniformLocation(
          program,
          `${directUniformPrefix}[${i}].direction`
        ),
      });
    }

    // Get uniforms for point lights
    let pointUniforms = [];
    let pointUniformPrefix = "pointLights";
    for (let i = 0; i < 10; i++) {
      pointUniforms.push({
        valid: gl.getUniformLocation(
          program,
          `${pointUniformPrefix}[${i}].valid`
        ),
        position: gl.getUniformLocation(
          program,
          `${pointUniformPrefix}[${i}].position`
        ),
        color: gl.getUniformLocation(
          program,
          `${pointUniformPrefix}[${i}].color`
        ),
        decay: gl.getUniformLocation(
          program,
          `${pointUniformPrefix}[${i}].decay`
        ),
        target: gl.getUniformLocation(
          program,
          `${pointUniformPrefix}[${i}].target`
        ),
      });
    }

    // Get uniforms for spot lights
    let spotUniforms = [];
    let spotUniformPrefix = "spotLights";
    for (let i = 0; i < 10; i++) {
      spotUniforms.push({
        valid: gl.getUniformLocation(
          program,
          `${spotUniformPrefix}[${i}].valid`
        ),
        direction: gl.getUniformLocation(
          program,
          `${spotUniformPrefix}[${i}].direction`
        ),
        position: gl.getUniformLocation(
          program,
          `${spotUniformPrefix}[${i}].position`
        ),
        color: gl.getUniformLocation(
          program,
          `${spotUniformPrefix}[${i}].color`
        ),
        decay: gl.getUniformLocation(
          program,
          `${spotUniformPrefix}[${i}].decay`
        ),
        target: gl.getUniformLocation(
          program,
          `${spotUniformPrefix}[${i}].target`
        ),
        coneOut: gl.getUniformLocation(
          program,
          `${spotUniformPrefix}[${i}].coneOut`
        ),
        coneIn: gl.getUniformLocation(
          program,
          `${spotUniformPrefix}[${i}].coneIn`
        ),
      });
    }

    return {
      direct: directUniforms,
      point: pointUniforms,
      spot: spotUniforms,
    };
  };

  let uniforms = this.initUniforms();

  /**
   * Pass view matrix to transform light position and direction in camera space from world space
   * @param viewMatrix
   * @param lightDirMatrix
   */
  this.injectUniform = function (viewMatrix, lightDirMatrix) {
    let pointLights = lightState.lights.filter((el) => el.type === "point");
    let spotLights = lightState.lights.filter((el) => el.type === "spot");
    let directLights = lightState.lights.filter((el) => el.type === "direct");

    // Inject uniforms for direct lights
    for (let i = 0; i < 10; i++) {
      if (i < directLights.length) {
        let parameters = directLights[i].getParameters();

        // Directional light transformed by the 3x3 submatrix
        let directionalLightTransformed = mathUtils.multiplyMatrix3Vector3(
          mathUtils.sub3x3from4x4(lightDirMatrix),
          parameters.direction
        );
        gl.uniform1i(uniforms.direct[i].valid, 1);
        gl.uniform3f(
          uniforms.direct[i].direction,
          ...directionalLightTransformed
        );
        gl.uniform3f(uniforms.direct[i].color, ...parameters.color);
      } else {
        gl.uniform1i(uniforms.direct[i].valid, 0);
      }
    }

    // Inject uniforms for point lights
    for (let i = 0; i < 10; i++) {
      if (i < pointLights.length) {
        let parameters = pointLights[i].getParameters();

        // Positional light transformed by the view matrix
        let positionLightTransformed = mathUtils.multiplyMatrixVector(
          viewMatrix,
          [
            parameters.position[0],
            parameters.position[1],
            parameters.position[2],
            1,
          ]
        );
        gl.uniform1i(uniforms.point[i].valid, 1);
        gl.uniform3f(
          uniforms.point[i].position,
          ...positionLightTransformed.slice(0, 3)
        );
        gl.uniform3f(uniforms.point[i].color, ...parameters.color);
        gl.uniform1i(uniforms.point[i].decay, parameters.decay);
        gl.uniform1f(uniforms.point[i].target, parameters.target);
      } else {
        gl.uniform1i(uniforms.point[i].valid, 0);
      }
    }

    // Inject uniforms for spot lights
    for (let i = 0; i < 10; i++) {
      if (i < spotLights.length) {
        let parameters = spotLights[i].getParameters();

        // Directional light transformed by the 3x3 submatrix
        let directionalLightTransformed = mathUtils.multiplyMatrix3Vector3(
          mathUtils.sub3x3from4x4(lightDirMatrix),
          parameters.direction
        );
        // Positional light transformed by the view matrix
        let positionLightTransformed = mathUtils.multiplyMatrixVector(
          viewMatrix,
          [
            parameters.position[0],
            parameters.position[1],
            parameters.position[2],
            1,
          ]
        );
        gl.uniform1i(uniforms.spot[i].valid, 1);
        gl.uniform3f(
          uniforms.spot[i].direction,
          ...directionalLightTransformed
        );
        gl.uniform3f(
          uniforms.spot[i].position,
          ...positionLightTransformed.slice(0, 3)
        );
        gl.uniform3f(uniforms.spot[i].color, ...parameters.color);
        gl.uniform1i(uniforms.spot[i].decay, parameters.decay);
        gl.uniform1f(uniforms.spot[i].target, parameters.target);
        gl.uniform1f(uniforms.spot[i].coneIn, parameters.coneIn);
        gl.uniform1f(uniforms.spot[i].coneOut, parameters.coneOut);
      } else {
        gl.uniform1i(uniforms.spot[i].valid, 0);
      }
    }
  };
}
