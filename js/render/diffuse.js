import { getTexturesWithTarget, mathUtils } from "../utils.js";
import { fromTypeToId } from "../state/diffuse.js";

/**
 * Manage the rendering of the diffuseState, by injecting the uniform values related to the diffuse options
 * @param {DiffuseState} diffuseState
 * @param {WebGL2RenderingContext} gl
 * @param {WebGLProgram} program
 * @constructor
 */
export function DiffuseRenderer(diffuseState, gl, program) {
  this.initUniforms = function () {
    // Get uniforms for toon
    let diffusePrefix = "diffuse";
    return {
      type: gl.getUniformLocation(program, `${diffusePrefix}.type`),
      color: gl.getUniformLocation(program, `${diffusePrefix}.color`),
      texture: gl.getUniformLocation(program, `${diffusePrefix}.texture`),
      toonThreshold: gl.getUniformLocation(
        program,
        `${diffusePrefix}.threshold`
      ),
    };
  };

  let uniforms = this.initUniforms();

  this.injectUniform = function () {
    // Inject type uniform
    gl.uniform1i(uniforms.type, fromTypeToId[diffuseState.type]);

    let parameters = diffuseState.getParameters();

    gl.uniform3f(uniforms.color, ...parameters.color);
    gl.uniform1f(uniforms.texture, parameters.texture);

    // Inject uniforms for lambert light
    if (diffuseState.type === "toon") {
      gl.uniform1f(uniforms.toonThreshold, parameters.threshold);
    }
  };
}
