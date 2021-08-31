import { mathUtils } from "../utils.js";
import { removeLoadingInfo, setLoadingInfo } from "../ui/loading.js";
import {
  DEPTH_MAP_OFFSET,
  NORMAL_MAP_OFFSET,
  TEXTURE_OFFSET,
} from "../constants/offsets.js";

/**
 * Manage the rendering of the Rubik cube :cube:
 * @param {CubeState} cube
 * @param {WebGL2RenderingContext} gl
 * @param {WebGLProgram} program
 * @param {string} textureDir
 */
export function CubeRenderer(cube, gl, program, textureDir) {
  this.init = function () {
    // Obtain locations for common uniforms
    const positionAttributeLocation = gl.getAttribLocation(
      program,
      "a_position"
    );
    const normalAttributeLocation = gl.getAttribLocation(program, "a_normal");
    this.worldViewProjectionMatrixLocation = gl.getUniformLocation(
      program,
      "worldViewProjectionMatrix"
    );
    this.worldViewMatrixLocation = gl.getUniformLocation(
      program,
      "worldViewMatrix"
    );
    this.transposeViewMatrixLocation = gl.getUniformLocation(
      program,
      "transposeViewMatrix"
    );

    const uvAttributeLocation = gl.getAttribLocation(program, "a_textureCoord");
    const tangentAttributeLocation = gl.getAttribLocation(program, "a_tangent");
    const bitangentAttributeLocation = gl.getAttribLocation(
      program,
      "a_bitangent"
    );
    this.textLocation = gl.getUniformLocation(program, "u_texture");
    this.normalMapLocation = gl.getUniformLocation(program, "u_normalMap");
    this.depthMapLocation = gl.getUniformLocation(program, "u_depthMap");

    for (let i = 0; i < 26; i++) {
      let vao = gl.createVertexArray();
      cube.pieceArray[i].vao = vao;
      gl.bindVertexArray(vao);

      let vertices = cube.pieceArray[i].vertices;
      let normals = cube.pieceArray[i].normals;
      let indices = cube.pieceArray[i].indices;
      let uvCoords = cube.pieceArray[i].textures;
      let tangents = cube.pieceArray[i].tangents;
      let bitangents = cube.pieceArray[i].bitangents;

      let positionBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
      gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array(vertices),
        gl.STATIC_DRAW
      );
      gl.enableVertexAttribArray(positionAttributeLocation);
      gl.vertexAttribPointer(
        positionAttributeLocation,
        3,
        gl.FLOAT,
        false,
        0,
        0
      );

      const normalsBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, normalsBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals), gl.STATIC_DRAW);
      gl.enableVertexAttribArray(normalAttributeLocation);
      gl.vertexAttribPointer(normalAttributeLocation, 3, gl.FLOAT, false, 0, 0);

      const indexBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
      gl.bufferData(
        gl.ELEMENT_ARRAY_BUFFER,
        new Uint16Array(indices),
        gl.STATIC_DRAW
      );

      const uvBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, uvBuffer);
      gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array(uvCoords),
        gl.STATIC_DRAW
      );
      gl.enableVertexAttribArray(uvAttributeLocation);
      gl.vertexAttribPointer(uvAttributeLocation, 2, gl.FLOAT, false, 0, 0);

      const tangentBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, tangentBuffer);
      gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array(tangents),
        gl.STATIC_DRAW
      );
      gl.enableVertexAttribArray(tangentAttributeLocation);
      gl.vertexAttribPointer(
        tangentAttributeLocation,
        3,
        gl.FLOAT,
        false,
        0,
        0
      );

      const bitangentBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, bitangentBuffer);
      gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array(bitangents),
        gl.STATIC_DRAW
      );
      gl.enableVertexAttribArray(bitangentAttributeLocation);
      gl.vertexAttribPointer(
        bitangentAttributeLocation,
        3,
        gl.FLOAT,
        false,
        0,
        0
      );
    }
  };

  /**
   * Load the texture
   */
  this.loadTexture = async function () {
    // Set the image sources to start the loading
    const image = new Image();
    image.src = `${textureDir}customCubeTexture.png`;
    const normalImage = new Image();
    normalImage.src = `${textureDir}customCubeNormal.png`;
    const depthImage = new Image();
    depthImage.src = `${textureDir}customCubeHeight.png`;

    // Create cube texture
    setLoadingInfo("texture", "Loading texture");
    const texture = gl.createTexture();
    // Load the texture
    await image.decode();
    gl.activeTexture(gl.TEXTURE0 + TEXTURE_OFFSET);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.generateMipmap(gl.TEXTURE_2D);

    removeLoadingInfo("texture");

    // Create normal texture
    setLoadingInfo("normalmap", "Loading normal map");
    const normalTexture = gl.createTexture();
    // Load the normal texture
    await normalImage.decode();
    gl.activeTexture(gl.TEXTURE0 + NORMAL_MAP_OFFSET);
    gl.bindTexture(gl.TEXTURE_2D, normalTexture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      normalImage
    );
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.generateMipmap(gl.TEXTURE_2D);

    removeLoadingInfo("normalmap");

    const depthTexture = gl.createTexture();
    // Load the depth texture
    await depthImage.decode();
    gl.activeTexture(gl.TEXTURE0 + DEPTH_MAP_OFFSET);
    gl.bindTexture(gl.TEXTURE_2D, depthTexture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      depthImage
    );
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.generateMipmap(gl.TEXTURE_2D);

    removeLoadingInfo("depthmap");
  };

  this.init();

  /**
   * Render the Rubik's cube by drawing the 26 cubes
   * @param {{perspectiveMatrix: number[], viewMatrix: number[], transposeViewMatrix: number[]}} matrices
   */
  this.renderCube = function (matrices) {
    gl.uniform1i(this.textLocation, TEXTURE_OFFSET);
    gl.uniform1i(this.normalMapLocation, NORMAL_MAP_OFFSET);
    gl.uniform1i(this.depthMapLocation, DEPTH_MAP_OFFSET);
    gl.uniformMatrix4fv(
      this.transposeViewMatrixLocation,
      false,
      mathUtils.transposeMatrix(matrices.transposeViewMatrix)
    );
    // Draw cubes
    for (let i = 0; i < 26; i++) {
      let worldMatrix = cube.pieceArray[i].worldMatrix;

      let viewWorldMatrix = mathUtils.multiplyMatrices(
        matrices.viewMatrix,
        worldMatrix
      );

      let projectionMatrix = mathUtils.multiplyMatrices(
        matrices.perspectiveMatrix,
        viewWorldMatrix
      );

      gl.uniformMatrix4fv(
        this.worldViewProjectionMatrixLocation,
        false,
        mathUtils.transposeMatrix(projectionMatrix)
      );
      gl.uniformMatrix4fv(
        this.worldViewMatrixLocation,
        false,
        mathUtils.transposeMatrix(viewWorldMatrix)
      );

      // Bind VAO to obtain buffers set outside of the rendering loop
      gl.bindVertexArray(cube.pieceArray[i].vao);
      gl.drawElements(
        gl.TRIANGLES,
        cube.pieceArray[i].indices.length,
        gl.UNSIGNED_SHORT,
        0
      );
    }
  };
}
