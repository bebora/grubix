import { mathUtils, projectionUtils } from "../utils.js";

/**
 * Represent the state of the canvas
 * @param {WebGL2RenderingContext} gl
 */
export function CanvasState(gl) {
  /**
   * Expand the canvas state and update the perspective matrix
   */
  this.expandToParent = function () {
    const parent = gl.canvas.parentElement;
    gl.canvas.width = parent.clientWidth;
    gl.canvas.height = parent.clientHeight;
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    this.perspectiveMatrix = this.toPerspectiveMatrix();
  };

  /**
   * Retrieve the perspective matrix from the canvas state
   * @return {number[]} the perspectiveMatrix
   */
  this.toPerspectiveMatrix = function () {
    return projectionUtils.makePerspective(
      90,
      gl.canvas.width / gl.canvas.height,
      0.1,
      100.0
    );
  };

  this.expandToParent();
}
