import { fetchFile, mathUtils, shaderUtils } from "./utils.js";
import { initializeCube } from "./state/cube.js";
import { MouseHandler } from "./ui/mouse.js";
import { CameraState } from "./state/camera.js";
import { SkyBox } from "./render/skybox.js";
import "./lib/webgl-obj-loader.min.js";
import { CanvasState } from "./state/canvas.js";
import { Window } from "./ui/window.js";
import { LightSideBar } from "./ui/sidebar/light.js";
import { LightState } from "./state/light.js";
import { LightRenderer } from "./render/light.js";
import { AmbientState } from "./state/ambient.js";
import { AmbientSideBar } from "./ui/sidebar/ambient.js";
import { AmbientRenderer } from "./render/ambient.js";
import { DiffuseState } from "./state/diffuse.js";
import { DiffuseSideBar } from "./ui/sidebar/diffuse.js";
import { DiffuseRenderer } from "./render/diffuse.js";
import { SpecularState } from "./state/specular.js";
import { SpecularSideBar } from "./ui/sidebar/specular.js";
import { SpecularRenderer } from "./render/specular.js";
import { ToggleSideBar } from "./ui/sidebar/toggle.js";
import { CubeSideBar } from "./ui/sidebar/cube.js";
import { CubeRenderer } from "./render/cube.js";

// Check and retrieve webgl rendering context
const canvas = document.getElementById("canvas");
/** @type{WebGL2RenderingContext} */
let gl = canvas.getContext("webgl2");
if (gl === null) {
  window.alert("Error getting GL context");
}

// Retrieve directories
const path = window.location.pathname;
const page = path.split("/").pop();
const baseDir = window.location.href.replace(page, "");
const shaderDir = `${baseDir}shaders/`;
const assetDir = `${baseDir}assets/`;
const meshDir = `${assetDir}meshes/`;
const textureDir = `${assetDir}textures/`;
const skyboxDir = `${assetDir}skybox/`;
const irradianceDir = `${assetDir}irradiance/`;

let cube = await initializeCube(meshDir);

// Initialize the states
const cameraState = new CameraState();
const canvasState = new CanvasState(gl, canvas);
const lightState = new LightState();
const ambientState = new AmbientState();
const diffuseState = new DiffuseState();
const specularState = new SpecularState();

const matrices = {
  perspectiveMatrix: canvasState.perspectiveMatrix,
  viewMatrix: cameraState.viewMatrix,
};

// Initialize UI managers
new Window(canvasState);
const mouseHandler = new MouseHandler(gl.canvas, cube, cameraState, matrices);
mouseHandler.initInputEventListeners();
new LightSideBar(lightState);
new AmbientSideBar(ambientState);
new DiffuseSideBar(diffuseState);
new SpecularSideBar(specularState);
new ToggleSideBar(canvasState);
new CubeSideBar(cube);

// Load skybox
const skyBox = new SkyBox(gl, skyboxDir, shaderDir);
await skyBox.init();

// Load and compile shaders
const vertexShaderStr = await fetchFile(`${shaderDir}main_vs.glsl`);
const fragmentShaderStr = await fetchFile(`${shaderDir}main_fs.glsl`);
const program = shaderUtils.createAndCompileShaders(gl, [
  vertexShaderStr,
  fragmentShaderStr,
]);
gl.useProgram(program);

// Load cube-related renderers
let lightRenderer = new LightRenderer(lightState, gl, program);
let ambientRenderer = new AmbientRenderer(
  ambientState,
  gl,
  program,
  irradianceDir
);
let diffuseRenderer = new DiffuseRenderer(diffuseState, gl, program);
let specularRenderer = new SpecularRenderer(specularState, gl, program);
await ambientRenderer.loadTexture(gl);
let cubeRenderer = new CubeRenderer(cube, gl, program, textureDir);
await cubeRenderer.loadTexture();

// Clear viewport
gl.clearColor(0.85, 1.0, 0.85, 1.0);
gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
gl.enable(gl.DEPTH_TEST);

function drawFrame() {
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  gl.useProgram(program);

  // Setup main matrices
  matrices.perspectiveMatrix = canvasState.perspectiveMatrix;
  matrices.viewMatrix = cameraState.viewMatrix;
  matrices.transposeViewMatrix = mathUtils.transposeMatrix(
    cameraState.viewMatrix
  );

  // Matrix to transform light direction from world to camera space
  let lightDirMatrix = mathUtils.invertMatrix(
    mathUtils.transposeMatrix(matrices.viewMatrix)
  );

  // Inject uniforms
  lightRenderer.injectUniform(matrices.viewMatrix, lightDirMatrix);
  ambientRenderer.injectUniform(matrices.viewMatrix, lightDirMatrix);
  diffuseRenderer.injectUniform();
  specularRenderer.injectUniform();

  // Draw the cubes
  cubeRenderer.renderCube(matrices);

  // Draw skybox if the ambient is skybox
  if (ambientState.type === "skybox")
    skyBox.renderSkyBox(matrices.perspectiveMatrix, cameraState);

  window.requestAnimationFrame(drawFrame);
}
document.getElementById("loading-spinner-container").style.display = "none";
drawFrame();
