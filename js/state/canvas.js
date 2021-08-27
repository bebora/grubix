import { mathUtils, projectionUtils } from "../utils.js";

/**
 * Represent the state of the canvas
 * @param {WebGL2RenderingContext} gl
 * @param {HTMLElement} canvas
 */
export function CanvasState(gl, canvas) {
  /**
   * Expand the canvas state and update the perspective matrix
   */
  this.expandToParent = function () {
    const parent = canvas.parentElement;
    canvas.width = parent.clientWidth;
    canvas.height = parent.clientHeight;
    gl.viewport(0, 0, canvas.width, canvas.height);

    this.perspectiveMatrix = this.toPerspectiveMatrix();
  };

  /**
   * Retrieve the perspective matrix from the canvas state
   * @return {number[]} the perspectiveMatrix
   */
  this.toPerspectiveMatrix = function () {
    return projectionUtils.makePerspective(
      90,
      canvas.width / canvas.height,
      0.1,
      100.0
    );
  };

  this.expandToParent();
}
