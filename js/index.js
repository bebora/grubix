import {
  expandCanvasToContainer,
  parseHexColor,
  fetchFile,
  mathUtils,
  projectionUtils,
  shaderUtils,
} from "./utils.js";
import { initializeCube } from "./rubikscube.js";
import { InputHandler } from "./input-handling.js";
import "./webgl-obj-loader.min.js";

// TODO move to appropriate file this function
let optionToLightDirection = function (opt) {
  switch (parseInt(opt)) {
    case 1:
      return [0.0, 1.0, 0.0];
    case 2:
      return [0.0, -1.0, 0.0];
    case 3:
      return [1.0, 0.0, 0.0];
    case 4:
      return [-1.0, 0.0, 0.0];
    case 5:
      return [0.0, 0.0, 1.0];
    case 6:
      return [0.0, 0.0, -1.0];
  }
};

const lightDirectionInputElement = document.getElementById("light-dir-select");
let lightDirection = optionToLightDirection(lightDirectionInputElement.value);

const mainAmbientColorInputElement =
  document.getElementById("ambient-color-up");
let mainAmbientColor = parseHexColor(mainAmbientColorInputElement.value);

const secondaryAmbientColorInputElement =
  document.getElementById("ambient-color-down");
let secondaryAmbientColor = parseHexColor(
  secondaryAmbientColorInputElement.value
);

const ambientAzimuthInputElement = document.getElementById("ambient-azimuth");
let ambientAzimuth = parseFloat(ambientAzimuthInputElement.value);

const ambientElevationInputElement =
  document.getElementById("ambient-elevation");
let ambientElevation = parseFloat(ambientElevationInputElement.value);

const ambientTypeInputElement = document.getElementById("ambient-select");
let ambientType = parseHexColor(secondaryAmbientColorInputElement.value);

const textureIntensityInputElement =
  document.getElementById("texture-intensity");
let textureIntensity = parseFloat(textureIntensityInputElement.value) / 100;

const materialDiffuseColorInputElement =
  document.getElementById("material-color");
let materialDiffuseColor = parseHexColor(
  materialDiffuseColorInputElement.value
);

//let initialCx = 4.5;
//let initialCy = 0.0;
//let initialCz = 10.0;
let initialElevation = 0.0;
let initialAngle = 0.0;
let initialLookRadius = 9;

let initialCz =
  initialLookRadius *
  Math.cos(mathUtils.degToRad(-initialAngle)) *
  Math.cos(mathUtils.degToRad(-initialElevation));
let initialCx =
  initialLookRadius *
  Math.sin(mathUtils.degToRad(-initialAngle)) *
  Math.cos(mathUtils.degToRad(-initialElevation));
let initialCy =
  initialLookRadius * Math.sin(mathUtils.degToRad(-initialElevation));

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

  let cube = await initializeCube(assetDir);

  const cameraState = {
    elevation: initialElevation,
    angle: initialAngle,
    lookRadius: initialLookRadius,
    cx: initialCx,
    cy: initialCy,
    cz: initialCz,
  };

  const matrices = {
    perspectiveMatrix: projectionUtils.makePerspective(
      90,
      canvas.width / canvas.height,
      0.1,
      100.0
    ),
    viewMatrix: projectionUtils.makeView(
      cameraState.cx,
      cameraState.cy,
      cameraState.cz,
      cameraState.elevation,
      -cameraState.angle
    ),
  };

  // Start listening to user input
  const inputHandler = new InputHandler(canvas, cube, cameraState, matrices);
  inputHandler.initInputEventListeners();

  // Load and compile shaders
  const vertexShaderStr = await fetchFile(`${shaderDir}vs_example.glsl`);
  const fragmentShaderStr = await fetchFile(`${shaderDir}fs_example.glsl`);
  const program = shaderUtils.createAndCompileShaders(gl, [
    vertexShaderStr,
    fragmentShaderStr,
  ]);
  gl.useProgram(program);

  // Shader and viewport variables
  const directionalLightColor = [1.0, 1.0, 1.0];

  // Clear viewport
  gl.clearColor(0.85, 1.0, 0.85, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  gl.enable(gl.DEPTH_TEST);

  // Obtain locations of attributes and uniforms
  const positionAttributeLocation = gl.getAttribLocation(program, "a_position");
  const normalAttributeLocation = gl.getAttribLocation(program, "a_normal");
  const worldViewProjectionMatrixLocation = gl.getUniformLocation(
    program,
    "worldViewProjectionMatrix"
  );
  const worldViewMatrixLocation = gl.getUniformLocation(
    program,
    "worldViewMatrix"
  );
  const normalMatrixLocation = gl.getUniformLocation(program, "normalMatrix");
  const textureIntensityLocation = gl.getUniformLocation(
    program,
    "textureIntensity"
  );
  const materialDiffuseColorLocation = gl.getUniformLocation(
    program,
    "materialDiffuseColor"
  );
  const lightDirLocation = gl.getUniformLocation(program, "lightDirection");
  const lightColLocation = gl.getUniformLocation(program, "lightColor");
  const uvAttributeLocation = gl.getAttribLocation(program, "a_textureCoord");
  const tangentAttributeLocation = gl.getAttribLocation(program, "a_tangent");
  const bitangentAttributeLocation = gl.getAttribLocation(
    program,
    "a_bitangent"
  );
  const textLocation = gl.getUniformLocation(program, "u_texture");
  const normalMapLocation = gl.getUniformLocation(program, "u_normalMap");
  const mainAmbientColorLocation = gl.getUniformLocation(
    program,
    "mainAmbientColor"
  );
  const secondaryAmbientColorLocation = gl.getUniformLocation(
    program,
    "secondaryAmbientColor"
  );
  const ambientUpVectorLocation = gl.getUniformLocation(
    program,
    "ambientUpVector"
  );
  const ambientTypeLocation = gl.getUniformLocation(program, "ambientType");

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
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(positionAttributeLocation);
    gl.vertexAttribPointer(positionAttributeLocation, 3, gl.FLOAT, false, 0, 0);

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
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(uvCoords), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(uvAttributeLocation);
    gl.vertexAttribPointer(uvAttributeLocation, 2, gl.FLOAT, false, 0, 0);

    const tangentBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, tangentBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(tangents), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(tangentAttributeLocation);
    gl.vertexAttribPointer(tangentAttributeLocation, 3, gl.FLOAT, false, 0, 0);

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

  // Set the image sources
  const image = new Image();
  image.src = `${assetDir}/customCubeTexture.png`;
  const normalImage = new Image();
  normalImage.src = `${assetDir}/customCubeNormal.png`;

  // Create texture
  const texture = gl.createTexture();
  // Load the texture
  await image.decode();
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.generateMipmap(gl.TEXTURE_2D);

  // Create normal texture
  const normalTexture = gl.createTexture();
  // Load the normal texture
  await normalImage.decode();
  gl.activeTexture(gl.TEXTURE0 + 1);
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

  function drawFrame() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    matrices.perspectiveMatrix = projectionUtils.makePerspective(
      90,
      gl.canvas.width / gl.canvas.height,
      0.1,
      100.0
    );
    for (let i = 0; i < 26; i++) {
      let worldMatrix = cube.pieceArray[i].worldMatrix;

      cameraState.cz =
        cameraState.lookRadius *
        Math.cos(mathUtils.degToRad(-cameraState.angle)) *
        Math.cos(mathUtils.degToRad(-cameraState.elevation));
      cameraState.cx =
        cameraState.lookRadius *
        Math.sin(mathUtils.degToRad(-cameraState.angle)) *
        Math.cos(mathUtils.degToRad(-cameraState.elevation));
      cameraState.cy =
        cameraState.lookRadius *
        Math.sin(mathUtils.degToRad(-cameraState.elevation));

      const ambientInnerRadius = Math.cos(mathUtils.degToRad(ambientElevation));
      const ambientUpVector = [
        ambientInnerRadius * Math.cos(mathUtils.degToRad(ambientAzimuth)),
        Math.sin(mathUtils.degToRad(ambientElevation)),
        -ambientInnerRadius * Math.sin(mathUtils.degToRad(ambientAzimuth)),
      ];

      matrices.viewMatrix = projectionUtils.makeView(
        cameraState.cx,
        cameraState.cy,
        cameraState.cz,
        cameraState.elevation,
        -cameraState.angle
      );
      // Matrix to transform light direction from world to camera space
      let lightDirMatrix = mathUtils.invertMatrix(
        mathUtils.transposeMatrix(matrices.viewMatrix)
      );

      // Directional light transformed by the 3x3 submatrix
      let directionalLightTransformed = mathUtils.multiplyMatrix3Vector3(
        mathUtils.sub3x3from4x4(lightDirMatrix),
        lightDirection
      );

      let viewWorldMatrix = mathUtils.multiplyMatrices(
        matrices.viewMatrix,
        worldMatrix
      );

      // Inverse transpose of the world view matrix for the normals
      let normalMatrix = mathUtils.invertMatrix(
        mathUtils.transposeMatrix(viewWorldMatrix)
      );

      let projectionMatrix = mathUtils.multiplyMatrices(
        matrices.perspectiveMatrix,
        viewWorldMatrix
      );

      const cameraSpaceAmbientDirection = mathUtils.multiplyMatrix3Vector3(
        mathUtils.sub3x3from4x4(lightDirMatrix),
        ambientUpVector
      );

      gl.uniformMatrix4fv(
        worldViewProjectionMatrixLocation,
        false,
        mathUtils.transposeMatrix(projectionMatrix)
      );
      gl.uniformMatrix4fv(
        worldViewMatrixLocation,
        false,
        mathUtils.transposeMatrix(viewWorldMatrix)
      );
      gl.uniformMatrix4fv(
        normalMatrixLocation,
        false,
        mathUtils.transposeMatrix(normalMatrix)
      );

      gl.uniform1f(textureIntensityLocation, textureIntensity);

      gl.uniform3fv(materialDiffuseColorLocation, materialDiffuseColor);

      gl.uniform3fv(lightDirLocation, directionalLightTransformed);

      gl.uniform3fv(lightColLocation, directionalLightColor);

      gl.uniform3fv(mainAmbientColorLocation, mainAmbientColor);

      gl.uniform3fv(secondaryAmbientColorLocation, secondaryAmbientColor);

      gl.uniform3fv(ambientUpVectorLocation, cameraSpaceAmbientDirection);

      gl.uniform1i(ambientTypeLocation, ambientType);

      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.activeTexture(gl.TEXTURE0 + 1);
      gl.bindTexture(gl.TEXTURE_2D, normalTexture);

      gl.uniform1i(textLocation, 0);
      gl.uniform1i(normalMapLocation, 1);

      // Bind VAO to obtain buffers set outside of the rendering loop
      gl.bindVertexArray(cube.pieceArray[i].vao);
      gl.drawElements(
        gl.TRIANGLES,
        cube.pieceArray[i].indices.length,
        gl.UNSIGNED_SHORT,
        0
      );
    }

    window.requestAnimationFrame(drawFrame);
  }
  document.getElementById("loading-spinner-container").style.display = "none";
  drawFrame();
};

// Options change listeners
lightDirectionInputElement.addEventListener("input", (e) => {
  lightDirection = optionToLightDirection(e.target.value);
});
mainAmbientColorInputElement.addEventListener("input", (e) => {
  mainAmbientColor = parseHexColor(e.target.value);
});
secondaryAmbientColorInputElement.addEventListener("input", (e) => {
  secondaryAmbientColor = parseHexColor(e.target.value);
});
ambientTypeInputElement.addEventListener("input", (e) => {
  ambientType = parseInt(e.target.value);
});
ambientAzimuthInputElement.addEventListener("input", (e) => {
  ambientAzimuth = parseFloat(e.target.value);
});
ambientElevationInputElement.addEventListener("input", (e) => {
  ambientElevation = parseFloat(e.target.value);
});
textureIntensityInputElement.addEventListener("input", (e) => {
  textureIntensity = parseFloat(e.target.value) / 100;
});
materialDiffuseColorInputElement.addEventListener("input", (e) => {
  materialDiffuseColor = parseHexColor(e.target.value);
});

await mainTest();
