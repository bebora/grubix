import { expandCanvasToContainer } from "./utils.js";

const canvas = document.getElementById("canvas");
/** @type{WebGL2RenderingContext} */
const gl = canvas.getContext("webgl2");
if (gl === null) {
  window.alert("Error getting GL context");
}

window.addEventListener("resize", () => expandCanvasToContainer(canvas));

expandCanvasToContainer(canvas);
