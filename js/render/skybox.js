import { fetchFile, mathUtils, shaderUtils } from "../utils.js";
import "../lib/webgl-obj-loader.min.js";
import { getTexturesWithTarget } from "../utils.js";

/**
 * Manage the rendering of a static skybox
 */
export class SkyBox {
  /**
   *
   * @param {WebGL2RenderingContext} gl the WebGl rendering context
   * @param {string} cubemapDir the directory of the cubemaps
   * @param {string} shaderDir the directory of the shaders
   */
  constructor(gl, cubemapDir, shaderDir) {
    this.vao = gl.createVertexArray();
    this.gl = gl;
    this.cubemapDir = cubemapDir;
    this.shaderDir = shaderDir;
  }

  async init() {
    // Load and compile shaders
    const vertexShaderStr = await fetchFile(`${this.shaderDir}/skybox_vs.glsl`);
    const fragmentShaderStr = await fetchFile(
      `${this.shaderDir}skybox_fs.glsl`
    );
    this.program = shaderUtils.createAndCompileShaders(this.gl, [
      vertexShaderStr,
      fragmentShaderStr,
    ]);

    // Get uniforms
    this.skyboxTexHandle = this.gl.getUniformLocation(
      this.program,
      "u_texture"
    );
    this.inverseViewProjMatrixHandle = this.gl.getUniformLocation(
      this.program,
      "inverseViewProjMatrix"
    );
    this.skyboxVertPosAttr = this.gl.getAttribLocation(
      this.program,
      "in_position"
    );

    // Load positionBuffer
    const skyboxVertPos = new Float32Array([
      -1, -1, 1.0, 1, -1, 1.0, -1, 1, 1.0, -1, 1, 1.0, 1, -1, 1.0, 1, 1, 1.0,
    ]);

    this.gl.bindVertexArray(this.vao);
    let positionBuffer = this.gl.createBuffer();

    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, positionBuffer);
    this.gl.bufferData(
      this.gl.ARRAY_BUFFER,
      skyboxVertPos,
      this.gl.STATIC_DRAW
    );
    this.gl.enableVertexAttribArray(this.skyboxVertPosAttr);
    this.gl.vertexAttribPointer(
      this.skyboxVertPosAttr,
      3,
      this.gl.FLOAT,
      false,
      0,
      0
    );

    await this.loadTexture();
  }

  /**
   * Load the texture
   */
  async loadTexture() {
    // Load the texture
    let texture = this.gl.createTexture();
    this.texture = texture;
    this.gl.activeTexture(this.gl.TEXTURE0 + 3);
    this.gl.bindTexture(this.gl.TEXTURE_CUBE_MAP, texture);

    let targetsWithTexture = getTexturesWithTarget(this.gl, this.cubemapDir);
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
      this.gl.texImage2D(
        target,
        0,
        this.gl.RGBA,
        256,
        256,
        0,
        this.gl.RGBA,
        this.gl.UNSIGNED_BYTE,
        null
      );

      await image.decode();
      // Now that the image has loaded upload it to the texture.
      this.gl.activeTexture(this.gl.TEXTURE0 + 3);
      this.gl.bindTexture(this.gl.TEXTURE_CUBE_MAP, texture);
      this.gl.texImage2D(
        target,
        0,
        this.gl.RGBA,
        this.gl.RGBA,
        this.gl.UNSIGNED_BYTE,
        image
      );
    }
    this.gl.generateMipmap(this.gl.TEXTURE_CUBE_MAP);
    this.gl.texParameteri(
      this.gl.TEXTURE_CUBE_MAP,
      this.gl.TEXTURE_MIN_FILTER,
      this.gl.LINEAR_MIPMAP_LINEAR
    );
  }

  /**
   * Render the skybox
   * @param {number[]} perspectiveMatrix
   * @param {CameraState} cameraState
   */
  renderSkyBox(perspectiveMatrix, cameraState) {
    this.gl.useProgram(this.program);

    this.gl.activeTexture(this.gl.TEXTURE0 + 3);
    this.gl.bindTexture(this.gl.TEXTURE_CUBE_MAP, this.texture);
    this.gl.uniform1i(this.skyboxTexHandle, 3);

    // Do not use the translation to create the view matrix since the camera should be at the center
    let viewMatrixNoTranslation = cameraState.viewMatrixCenter;
    let viewProjMat = mathUtils.multiplyMatrices(
      perspectiveMatrix,
      viewMatrixNoTranslation
    );

    let inverseViewProjMatrix = mathUtils.invertMatrix(viewProjMat);
    this.gl.uniformMatrix4fv(
      this.inverseViewProjMatrixHandle,
      false,
      mathUtils.transposeMatrix(inverseViewProjMatrix)
    );

    this.gl.bindVertexArray(this.vao);
    this.gl.depthFunc(this.gl.LEQUAL);
    this.gl.drawArrays(this.gl.TRIANGLES, 0, 6);
  }
}
