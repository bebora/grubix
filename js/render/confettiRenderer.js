import { fetchFile, mathUtils, shaderUtils } from "../utils.js";
import { ConfettiEmitter } from "../state/confetti.js";

export class ConfettiRenderer {
  /**
   *
   * @param {WebGL2RenderingContext} gl the WebGl rendering context
   * @param {string} shaderDir the directory of the shaders
   * @param {ConfettiEmitter} emitter the associated confetti state
   */
  constructor(gl, shaderDir, emitter = null) {
    this.vao = gl.createVertexArray();
    this.gl = gl;
    this.shaderDir = shaderDir;
    if (emitter !== null) {
      this.confettiEmitter = emitter;
    } else {
      this.confettiEmitter = new ConfettiEmitter();
    }
  }

  async init() {
    // Load and compile shaders
    const vertexShaderStr = await fetchFile(
      `${this.shaderDir}/confetti_vs.glsl`
    );
    const fragmentShaderStr = await fetchFile(
      `${this.shaderDir}confetti_fs.glsl`
    );
    this.program = shaderUtils.createAndCompileShaders(this.gl, [
      vertexShaderStr,
      fragmentShaderStr,
    ]);

    // Get uniforms
    this.worldViewProjectionMatrixLocation = this.gl.getUniformLocation(
      this.program,
      "worldViewProjectionMatrix"
    );
    this.confettiPositionLocation = this.gl.getAttribLocation(
      this.program,
      "in_position"
    );
    this.confettiColourLocation = this.gl.getAttribLocation(
      this.program,
      "in_colour"
    );
  }

  /**
   * Render the confetti
   * @param {{perspectiveMatrix: number[], viewMatrix: number[]}} matrices
   */
  renderConfetti(matrices) {
    if (this.confettiEmitter.confetti.length === 0) {
      return;
    }
    this.gl.useProgram(this.program);

    // Assume world matrix identity
    const worldViewProjectionMatrix = mathUtils.multiplyMatrices(
      matrices.perspectiveMatrix,
      matrices.viewMatrix
    );
    this.gl.uniformMatrix4fv(
      this.worldViewProjectionMatrixLocation,
      false,
      mathUtils.transposeMatrix(worldViewProjectionMatrix)
    );

    this.gl.bindVertexArray(this.vao);

    const positionBuffer = this.gl.createBuffer();

    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, positionBuffer);
    this.gl.bufferData(
      this.gl.ARRAY_BUFFER,
      new Float32Array(this.confettiEmitter.getPositions()),
      this.gl.STATIC_DRAW
    );
    this.gl.enableVertexAttribArray(this.confettiPositionLocation);
    this.gl.vertexAttribPointer(
      this.confettiPositionLocation,
      3,
      this.gl.FLOAT,
      false,
      0,
      0
    );

    const coloursBuffer = this.gl.createBuffer();

    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, coloursBuffer);
    this.gl.bufferData(
      this.gl.ARRAY_BUFFER,
      new Float32Array(this.confettiEmitter.getColours()),
      this.gl.STATIC_DRAW
    );
    this.gl.enableVertexAttribArray(this.confettiColourLocation);
    this.gl.vertexAttribPointer(
      this.confettiColourLocation,
      3,
      this.gl.FLOAT,
      false,
      0,
      0
    );

    this.gl.bindVertexArray(this.vao);
    this.gl.depthFunc(this.gl.LEQUAL);
    this.gl.drawArrays(this.gl.POINTS, 0, this.confettiEmitter.confetti.length);
    this.confettiEmitter.updateConfetti();
  }
}
