import { fromTypeToId } from "../state/specular.js";

/**
 * Manage the rendering of the specularState, by injecting the uniform values related to the specular options
 * @param {SpecularState} specularState
 * @param {WebGL2RenderingContext} gl
 * @param {WebGLProgram} program
 * @constructor
 */
export function SpecularRenderer(specularState, gl, program) {
  this.initUniforms = function () {
    // Get uniforms for toon
    let specularPrefix = "specular";
    return {
      type: gl.getUniformLocation(program, `${specularPrefix}.type`),
      color: gl.getUniformLocation(program, `${specularPrefix}.color`),
      shininess: gl.getUniformLocation(program, `${specularPrefix}.shininess`),
    };
  };

  let uniforms = this.initUniforms();

  this.injectUniform = function () {
    // Inject type uniform
    gl.uniform1i(uniforms.type, fromTypeToId[specularState.type]);

    let parameters = specularState.getParameters();

    gl.uniform3f(uniforms.color, ...parameters.color);
    gl.uniform1f(uniforms.shininess, parameters.shininess);
  };
}
