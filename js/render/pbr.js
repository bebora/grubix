/**
 * Manage the rendering of the pbrState, by injecting the uniform values related to the PBR options
 * @param {PbrState} pbrState
 * @param {WebGL2RenderingContext} gl
 * @param {WebGLProgram} program
 * @constructor
 */
export function PbrRenderer(pbrState, gl, program) {
  this.initUniforms = function () {
    const pbrPrefix = "pbr";
    return {
      enabled: gl.getUniformLocation(program, `${pbrPrefix}.enabled`),
      metallic: gl.getUniformLocation(program, `${pbrPrefix}.metallic`),
      roughness: gl.getUniformLocation(program, `${pbrPrefix}.roughness`),
    };
  };

  const uniforms = this.initUniforms();

  this.injectUniform = function () {
    let parameters = pbrState.getParameters();

    gl.uniform1i(uniforms.enabled, parameters.enabled ? 1 : 0);
    gl.uniform1f(uniforms.metallic, parameters.metallic);
    gl.uniform1f(uniforms.roughness, parameters.roughness);
  };
}
