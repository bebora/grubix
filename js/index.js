import {
  expandCanvasToContainer,
  parseHexColor,
  fetchFile,
  mathUtils,
  projectionUtils,
  shaderUtils,
} from "./utils.js";
import { initializeCube } from "./rubikscube.js";
import "./webgl-obj-loader.min.js";

var cx = 4.5;
var cy = 0.0;
var cz = 10.0;
var elevation = 0.0;
var angle = 0.0;
var lookRadius = 5.0;

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

var mouseState = false;
var lastMouseX = -100,
  lastMouseY = -100;
function doMouseDown(event) {
  lastMouseX = event.pageX;
  lastMouseY = event.pageY;
  mouseState = true;
}
function doMouseUp(event) {
  lastMouseX = -100;
  lastMouseY = -100;
  mouseState = false;
}
function doMouseMove(event) {
  if (mouseState) {
    var dx = event.pageX - lastMouseX;
    var dy = lastMouseY - event.pageY;
    lastMouseX = event.pageX;
    lastMouseY = event.pageY;

    if (dx != 0 || dy != 0) {
      angle = angle + 0.5 * dx;
      elevation = elevation + 0.5 * dy;
    }
  }
}

const mainTest = async function () {
  let cube = await initializeCube();

  var keyFunction = function (e) {
    if (e.keyCode == 49) {
      cube.move("R", true);
    } else if (e.keyCode == 50) {
      cube.move("R", false);
    } else if (e.keyCode == 51) {
      cube.move("U", true);
    } else if (e.keyCode == 52) {
      cube.move("U", false);
    }
  };
  window.addEventListener("keyup", keyFunction, false);

  window.addEventListener("mousedown", doMouseDown, false);
  window.addEventListener("mouseup", doMouseUp, false);
  window.addEventListener("mousemove", doMouseMove, false);

  const path = window.location.pathname;
  const page = path.split("/").pop();
  const baseDir = window.location.href.replace(page, "");
  const shaderDir = `${baseDir}shaders/`;
  const assetDir = `${baseDir}assets/`;

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
  //let angle = 0;

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

  for (let i = 0; i < 26; i++) {
    let vao = gl.createVertexArray();
    cube.pieceArray[i].vao = vao;
    gl.bindVertexArray(vao);

    let vertices = cube.pieceArray[i].vertices;
    let normals = cube.pieceArray[i].normals;
    let indices = cube.pieceArray[i].indices;
    let uvCoords = cube.pieceArray[i].textures;

    let positionBuffer = gl.createBuffer();
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
  }

  // Create texture
  var texture = gl.createTexture();
  // Load the texture
  var image = new Image();
  image.src = `${assetDir}/customCubeTexture.png`;
  image.onload = function () {
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.generateMipmap(gl.TEXTURE_2D);
  };

  let perspectiveMatrix = projectionUtils.makePerspective(
    110,
    gl.canvas.width / gl.canvas.height,
    0.1,
    100.0
  );

  function drawFrame() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    for (let i = 0; i < 26; i++) {
      let worldMatrix = mathUtils.multiplyMatrices(
        projectionUtils.makeWorld(0, 0, 0, 0.0, 0, 0.0, 0.25),
        cube.pieceArray[i].worldMatrix
      );

      cz =
        lookRadius *
        Math.cos(mathUtils.degToRad(-angle)) *
        Math.cos(mathUtils.degToRad(-elevation));
      cx =
        lookRadius *
        Math.sin(mathUtils.degToRad(-angle)) *
        Math.cos(mathUtils.degToRad(-elevation));
      cy = lookRadius * Math.sin(mathUtils.degToRad(-elevation));
      let viewMatrix = projectionUtils.makeView(cx, cy, cz, elevation, -angle);

      // Matrix to transform light direction from world to camera space
      let lightDirMatrix = mathUtils.invertMatrix(
        mathUtils.transposeMatrix(viewMatrix)
      );

      // Directional light transformed by the 3x3 submatrix
      let directionalLightTransformed = mathUtils.multiplyMatrix3Vector3(
        mathUtils.sub3x3from4x4(lightDirMatrix),
        directionalLight
      );

      let viewWorldMatrix = mathUtils.multiplyMatrices(viewMatrix, worldMatrix);

      // Inverse transpose of the world view matrix for the normals
      let normalMatrix = mathUtils.invertMatrix(
        mathUtils.transposeMatrix(viewWorldMatrix)
      );

      let projectionMatrix = mathUtils.multiplyMatrices(
        perspectiveMatrix,
        viewWorldMatrix
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

  drawFrame();
};

// Options change listeners
ambientInputElement.addEventListener("input", (e) => {
  ambientColor = parseHexColor(e.target.value);
});

await mainTest();
