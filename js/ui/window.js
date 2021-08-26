/**
 * Manages the events concerning the window
 * @constructor
 * @param {WebGL2RenderingContext} gl
 * @param {CanvasState} canvasState
 */
export function Window(canvasState) {
  window.addEventListener("resize", () => {
    canvasState.expandToParent();
  });
}
