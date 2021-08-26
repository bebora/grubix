import { mathUtils, projectionUtils } from "../utils.js";

/**
 * Represent the state of the camera
 * @constructor
 */
export function CameraState() {
  /**
   * Camera properties
   */
  this.elevation = 0.0;
  this.angle = 0.0;
  this.lookRadius = 9;

  /**
   * Update the camera state and update the cached matrices
   * @param {number} elevation the elevation of the camera
   * @param {number} angle the angle of the camera
   * @param {number} lookRadius the look radius of the camera
   */
  this.update = function (elevation, angle, lookRadius) {
    this.elevation = elevation;
    this.angle = angle;
    this.lookRadius = lookRadius;

    this.position = this.toPosition();
    this.viewMatrix = this.toViewMatrix();
    this.viewMatrixCenter = this.toViewMatrixCenter();
  };

  /**
   * Retrieve the position of the camera given its properties
   * @return {{x: number, y: number, z: number}} the position of the camera
   */
  this.toPosition = function () {
    let x =
      this.lookRadius *
      Math.sin(mathUtils.degToRad(-this.angle)) *
      Math.cos(mathUtils.degToRad(-this.elevation));
    let y = this.lookRadius * Math.sin(mathUtils.degToRad(-this.elevation));
    let z =
      this.lookRadius *
      Math.cos(mathUtils.degToRad(-this.angle)) *
      Math.cos(mathUtils.degToRad(-this.elevation));

    return { x: x, y: y, z: z };
  };

  /**
   * Retrieve the view matrix from the camera state
   * @return {number[]} the view matrix
   */
  this.toViewMatrix = function () {
    return projectionUtils.makeView(
      this.position.x,
      this.position.y,
      this.position.z,
      this.elevation,
      -this.angle
    );
  };

  /**
   * Retrieve the view matrix from the camera state, with the camera in the center (we care only about the direction)
   * @return {number[]} the view matrix with the camera in the center
   */
  this.toViewMatrixCenter = function () {
    return projectionUtils.makeView(0, 0, 0, this.elevation, -this.angle);
  };

  /**
   * Computed properties
   */
  this.position = this.toPosition();
  this.viewMatrix = this.toViewMatrix();
  this.viewMatrixCenter = this.toViewMatrixCenter();
}
