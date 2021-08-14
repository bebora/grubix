import {
  expandCanvasToContainer,
  parseHexColor,
  fetchFile,
  mathUtils,
  projectionUtils,
  shaderUtils,
} from "./utils.js";
import "./webgl-obj-loader.min.js";

const ambientInputElement = document.getElementById("ambient-color");
let ambientColor = parseHexColor(ambientInputElement.value);

const canvas = document.getElementById("canvas");
/** @type{WebGL2RenderingContext} */
let gl = canvas.getContext("webgl2");
if (gl === null) {
  window.alert("Error getting GL context");
}

window.addEventListener("resize", () => {
  expandCanvasToContainer(canvas, gl);
});

expandCanvasToContainer(canvas, gl);

let sidebarOpen = true;
document.getElementById("toggle-sidebar").addEventListener("click", (e) => {
  const parent = e.target.parentElement;
  if (sidebarOpen) {
    parent.style.minWidth = "0";
    parent.style.maxWidth = "50px";
  } else {
    parent.style.minWidth = "20%";
    parent.style.maxWidth = "100%";
  }
  sidebarOpen = !sidebarOpen;
  expandCanvasToContainer(canvas, gl);
});

const mainTest = async function () {
  const path = window.location.pathname;
  const page = path.split("/").pop();
  const baseDir = window.location.href.replace(page, "");
  const shaderDir = `${baseDir}shaders/`;
  const assetDir = `${baseDir}assets/`;

  // Load .obj mesh
  const meshObjStr = await fetchFile(`${assetDir}textureTest.obj`);
  const meshObj = new OBJ.Mesh(meshObjStr);

  const vertices = meshObj.vertices;
  const normals = meshObj.vertexNormals;
  const indices = meshObj.indices;
  const uvCoords = meshObj.textures;

  // Load and compile shaders
  const vertexShaderStr = await fetchFile(`${shaderDir}vs_example.glsl`);
  const fragmentShaderStr = await fetchFile(`${shaderDir}fs_example.glsl`);
  const program = shaderUtils.createAndCompileShaders(gl, [
    vertexShaderStr,
    fragmentShaderStr,
  ]);
  gl.useProgram(program);

  // Shader and viewport variables
  const diffColor = [254.0 / 255.0, 156.0 / 255.0, 244.0 / 255.0];
  const directionalLightColor = [1.0, 1.0, 1.0];
  let angle = 0;

  //define directional light
  const dirLightAlpha = -mathUtils.degToRad(40);
  const dirLightBeta = -mathUtils.degToRad(110);

  const directionalLight = [
    -Math.cos(dirLightAlpha) * Math.cos(dirLightBeta),
    -Math.sin(dirLightAlpha),
    -Math.cos(dirLightAlpha) * Math.sin(dirLightBeta),
  ];

  // Clear viewport
  gl.clearColor(0.85, 1.0, 0.85, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  gl.enable(gl.DEPTH_TEST);

  // Obtain locations of attributes and uniforms
  const positionAttributeLocation = gl.getAttribLocation(program, "a_position");
  const normalsAttributeLocation = gl.getAttribLocation(program, "a_normal");
  const matrixLocation = gl.getUniformLocation(program, "matrix");
  const nMatrixLocation = gl.getUniformLocation(program, "nMatrix");
  const diffColorLocation = gl.getUniformLocation(program, "mDiffColor");
  const lightDirLocation = gl.getUniformLocation(program, "lightDirection");
  const lightColLocation = gl.getUniformLocation(program, "lightColor");
  const uvAttributeLocation = gl.getAttribLocation(program, "a_uv");
  const textLocation = gl.getUniformLocation(program, "u_texture");
  const ambientColorLocation = gl.getUniformLocation(program, "ambientColor");

  // Setup VAO and buffer data
  const vao = gl.createVertexArray();
  gl.bindVertexArray(vao);

  const positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(positionAttributeLocation);
  gl.vertexAttribPointer(positionAttributeLocation, 3, gl.FLOAT, false, 0, 0);

  const normalsBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, normalsBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(normalsAttributeLocation);
  gl.vertexAttribPointer(normalsAttributeLocation, 3, gl.FLOAT, false, 0, 0);

  const indexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  gl.bufferData(
    gl.ELEMENT_ARRAY_BUFFER,
    new Uint16Array(indices),
    gl.STATIC_DRAW
  );

  const uvBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, uvBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(uvCoords), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(uvAttributeLocation);
  gl.vertexAttribPointer(uvAttributeLocation, 2, gl.FLOAT, false, 0, 0);

  // Create texture
  const texture = gl.createTexture();
  // Load the texture
  const image = new Image();
  image.src = `${assetDir}/tex.png`;
  image.onload = function (e) {
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.generateMipmap(gl.TEXTURE_2D);
  };

  function drawFrame() {
    angle += 0.5;
    const worldMatrix = projectionUtils.makeWorld(
      0,
      Math.sin(angle / 10) / 10,
      0,
      0.0,
      angle,
      0.0,
      0.25
    );
    const perspectiveMatrix = projectionUtils.makePerspective(
      110,
      gl.canvas.width / gl.canvas.height,
      0.1,
      100.0
    );
    const viewMatrix = projectionUtils.makeView(0, 1, 3.0, -30.0, 0.0);

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    const viewWorldMatrix = mathUtils.multiplyMatrices(viewMatrix, worldMatrix);
    const projectionMatrix = mathUtils.multiplyMatrices(
      perspectiveMatrix,
      viewWorldMatrix
    );

    // Matrix to transform light direction from world to camera space
    const lightDirMatrix = mathUtils.invertMatrix(
      mathUtils.transposeMatrix(viewMatrix)
    );
    // Inverse transpose of the world view matrix for the normals
    const normalMatrix = mathUtils.invertMatrix(
      mathUtils.transposeMatrix(viewWorldMatrix)
    );
    // Directional light transformed by the 3x3 submatrix
    const directionalLightTransformed = mathUtils.multiplyMatrix3Vector3(
      mathUtils.sub3x3from4x4(lightDirMatrix),
      directionalLight
    );

    gl.uniformMatrix4fv(
      matrixLocation,
      false,
      mathUtils.transposeMatrix(projectionMatrix)
    );
    gl.uniformMatrix4fv(
      nMatrixLocation,
      false,
      mathUtils.transposeMatrix(normalMatrix)
    );
    gl.uniform3fv(diffColorLocation, diffColor);

    gl.uniform3fv(lightDirLocation, directionalLightTransformed);

    gl.uniform3fv(lightColLocation, directionalLightColor);

    gl.uniform3fv(ambientColorLocation, ambientColor);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.uniform1i(textLocation, 0);

    // Bind VAO to obtain buffers set outside of the rendering loop
    gl.bindVertexArray(vao);
    gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0);

    window.requestAnimationFrame(drawFrame);
  }

  drawFrame();
};

// Options change listeners
ambientInputElement.addEventListener("input", (e) => {
  ambientColor = parseHexColor(e.target.value);
});

await mainTest();
