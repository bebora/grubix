/**
 * Manage the rendering of the parallaxState, by injecting the uniform values related to the parallax options
 * @param {ParallaxState} parallaxState
 * @param {WebGL2RenderingContext} gl
 * @param {WebGLProgram} program
 * @constructor
 */
export function ParallaxRenderer(parallaxState, gl, program) {
  this.initUniforms = function () {
    const parallaxPrefix = "parallax";
    return {
      enabled: gl.getUniformLocation(program, `${parallaxPrefix}.enabled`),
      scale: gl.getUniformLocation(program, `${parallaxPrefix}.scale`),
    };
  };

  const uniforms = this.initUniforms();

  this.injectUniform = function () {
    let parameters = parallaxState.getParameters();

    gl.uniform1i(uniforms.enabled, parameters.enabled ? 1 : 0);
    gl.uniform1f(uniforms.scale, parameters.scale);
  };
}
