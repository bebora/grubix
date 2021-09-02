import { CubeState } from "../state/cube.js";
import { MouseQueue, mathUtils } from "../utils.js";

/**
 * Create a handler for mouse input
 * @param {HTMLCanvasElement} canvas
 * @param {CubeState} cube
 * @param {CameraState} cameraState state of the camera
 * @param {{viewMatrix: number[], perspectiveMatrix: number[]}} matrices
 */
const MouseHandler = function (canvas, cube, cameraState, matrices) {
  let pointerInputState = false;
  let lastMouseX = -100,
    lastMouseY = -100;
  let cubeActivated = false;
  let moveActivated = false;
  let startPoint = [];
  let sensitivity = 0.25;
  let moveThreshold = 7 * sensitivity;
  let lockedDir = null;
  let lockedFace = null;
  let activeFacelet = null;
  let accumulator1 = 0;
  let accumulator2 = 0;
  let currentTime = null;
  let startX = null;
  let startY = null;
  let inertiaThreshold = 0.8;
  let mouseQueue = new MouseQueue(50);

  // Mouse events
  /**
   * @param {MouseEvent} event
   */
  function doMouseDown(event) {
    startX = lastMouseX = event.clientX;
    startY = lastMouseY = event.clientY;

    let normalisedRayDir = getNormRayDir(lastMouseX, lastMouseY);
    //The ray starts from the camera in world coordinates
    let cameraPosition = cameraState.position;
    let rayStartPoint = [cameraPosition.x, cameraPosition.y, cameraPosition.z];
    let [intersectedFacelet, intersectionPoint] = cube.intersectFacelets(
      rayStartPoint,
      normalisedRayDir
    );
    if (!cube.transitionInProgress && intersectedFacelet != null) {
      activeFacelet = intersectedFacelet;
      cubeActivated = true;
      startPoint = intersectionPoint;
    } else {
      cubeActivated = false;
    }
    pointerInputState = true;
  }

  /**
   * @param {MouseEvent} event
   */
  async function releaseMouse(event) {
    let endX = event.clientX;
    let endY = event.clientY;
    lastMouseX = -100;
    lastMouseY = -100;

    if (moveActivated) {
      // Compute inertia
      currentTime = new Date().getTime();
      let mouseRecord = mouseQueue.getValidElement(currentTime);

      let inertia = false;
      if (mouseRecord !== null) {
        let deltaTime = currentTime - mouseRecord.time;
        let deltaSpace = mathUtils.distance2(
          [mouseRecord.x, mouseRecord.y],
          [endX, endY]
        );
        let speed = deltaSpace / deltaTime;
        let diffVect = [endX - mouseRecord.x, endY - mouseRecord.y];
        let inertiaDir = Math.sign(
          mathUtils.scalarProduct2(diffVect, lockedDir)
        );
        inertia = speed ? (speed > inertiaThreshold ? inertiaDir : 0) : 0;
      }

      moveActivated = false;
      pointerInputState = false;
      mouseQueue = new MouseQueue(50);
      cube.transitionInProgress = true;
      await cube.moveWithAnimation(lockedFace, inertia);
      cube.transitionInProgress = false;
    }
    moveActivated = false;
    pointerInputState = false;
    lockedDir = null;
    lockedFace = null;
    activeFacelet = null;
    accumulator1 = 0;
    accumulator2 = 0;
  }

  /**
   * @param {MouseEvent} event
   */
  function doMouseMove(event) {
    if (pointerInputState) {
      const dx = event.pageX - lastMouseX;
      const dy = event.pageY - lastMouseY;
      lastMouseX = event.pageX;
      lastMouseY = event.pageY;

      if (!cubeActivated) {
        if (dx !== 0 || dy !== 0) {
          // When the elevation is over 90 degrees or under -90 degrees, the camera is upside down,
          // and the azimuth angle increment should be the opposite to feel natural
          let normalizedElevation = mathUtils.mod(cameraState.elevation, 360);
          let sign = 1;
          if (normalizedElevation > 90 && normalizedElevation < 270) {
            sign = -1;
          }

          cameraState.update(
            cameraState.elevation + 0.5 * -dy,
            cameraState.angle + 0.5 * dx * sign,
            cameraState.lookRadius
          );
        }
      } else {
        // Cube has been clicked

        // Record mouse state
        mouseQueue.push({
          x: event.clientX,
          y: event.clientY,
          time: new Date().getTime(),
        });

        let diffVect = [dx, dy];

        if (lockedDir == null) {
          // There is no locked direction, then the mouse movement will possibly lock one
          let [faceName1, worldDir1] = Object.entries(
            activeFacelet.directions
          )[0];
          let [faceName2, worldDir2] = Object.entries(
            activeFacelet.directions
          )[1];

          let projDir1 = projectDirToScreen(startPoint, worldDir1);
          let dir1 = mathUtils.normaliseVector2(projDir1);
          let scalarProduct1 =
            sensitivity * mathUtils.scalarProduct2(diffVect, dir1);

          let projDir2 = projectDirToScreen(startPoint, worldDir2);
          let dir2 = mathUtils.normaliseVector2(projDir2);
          let scalarProduct2 =
            sensitivity * mathUtils.scalarProduct2(diffVect, dir2);

          if (
            Math.abs(scalarProduct1) > Math.abs(scalarProduct2) &&
            Math.abs(accumulator1 + scalarProduct1) > moveThreshold
          ) {
            // Direction and face 1 must be locked
            lockedDir = dir1;
            lockedFace = faceName1;
            moveActivated = true;
            cube.turnFaceABit(faceName1, accumulator1 + scalarProduct1);
          } else if (
            Math.abs(scalarProduct2) > Math.abs(scalarProduct1) &&
            Math.abs(accumulator2 + scalarProduct2) > moveThreshold
          ) {
            // Direction and face 2 must be locked
            lockedDir = dir2;
            lockedFace = faceName2;
            moveActivated = true;
            cube.turnFaceABit(faceName2, accumulator2 + scalarProduct2);
          } else {
            // No face has reached the moveThreshold yet, thus the movement is accumulated
            accumulator1 += scalarProduct1;
            accumulator2 += scalarProduct2;
          }
        } else {
          // There is a locked direction (and a locked face)
          let scalarProduct =
            sensitivity * mathUtils.scalarProduct2(diffVect, lockedDir);

          //Move the locked face
          cube.turnFaceABit(lockedFace, scalarProduct);
        }
      }
    }
  }

  /**
   * Get pixel coordinates from a point in world space.
   * @param {number[]} pParam the 3D point to project on screen
   * @returns the pixel coordinates (2D) of the given point and is z coordinate in camera space
   */
  function getPixelCoordinates(pParam) {
    let p = [];
    p[0] = pParam[0];
    p[1] = pParam[1];
    p[2] = pParam[2];
    p[3] = 1;

    // Camera space
    let pv = mathUtils.multiplyMatrixVector(matrices.viewMatrix, p);

    // Projection space
    let pp = mathUtils.multiplyMatrixVector(matrices.perspectiveMatrix, pv);

    // Normalized device coordinates
    let pNDC = [];
    pNDC[0] = pp[0] / pp[3];
    pNDC[1] = pp[1] / pp[3];

    // Screen coordinates
    let x = (canvas.width * (pNDC[0] + 1.0)) / 2.0;
    let y = (canvas.height * (1.0 - pNDC[1])) / 2.0;

    return [Math.round(x), Math.round(y), pv[2]];

    // To have even more precision, casting to int can be avoided
    // pv[2] is the z coordinate in camera space: if positive, the point that is gonna be projected on screen is behind us,
    //  (behind the camera), thus it will be used to invert the direction along which the face can be moved
  }

  /**
   * Project a direction to screen. This is done by projecting the starting point of the line
   * and a second point chosen arbitrarily far on the same line
   * @param {number[]} start the starting point of the line
   * @param {number[]} dir the direction of the line
   * @returns {number[]} the projected direction
   */
  function projectDirToScreen(start, dir) {
    let end = mathUtils.sumVectors3(
      start,
      mathUtils.multiplyVectorScalar3(dir, 10000)
      // This multiplier sets the precision when converting everything into pixel coordinates
      // The bigger it is, the more precise will be the line on screen
    );
    let startScreen = [lastMouseX, lastMouseY];
    let endScreen = [];
    let endTemp = getPixelCoordinates(end);
    endScreen[0] = endTemp[0];
    endScreen[1] = endTemp[1];

    let projDir = mathUtils.subtractVectors2(endScreen, startScreen);
    if (endTemp[2] > 0.0)
      projDir = mathUtils.multiplyVectorScalar2(projDir, -1.0);
    return projDir;
  }

  /**
   * Casts a ray that starts from the camera and passes through the near plane.
   * The position on the near plane is computed by feeding the reversed pipeline with the pixel coordinates.
   * @param {number} x pixel x coordinate
   * @param {*} y pixel y coordinate
   * @returns
   */
  function getNormRayDir(x, y) {
    //Here we calculate the normalised device coordinates from the pixel coordinates of the canvas
    let normX = (2.0 * x) / canvas.width - 1.0;
    let normY = 1.0 - (2.0 * y) / canvas.height;

    //We need to go through the transformation pipeline in the inverse order so we invert the matrices
    let projInv = mathUtils.invertMatrix(matrices.perspectiveMatrix);
    let viewInv = mathUtils.invertMatrix(matrices.viewMatrix);

    //Find the point (un)projected on the near plane, from clip space coords to eye coords
    //z = -1 makes it so the point is on the near plane
    //w = 1 is for the homogeneous coordinates in clip space
    let pointEyeCoords = mathUtils.multiplyMatrixVector(projInv, [
      normX,
      normY,
      -1.0,
      1.0,
    ]);

    //This finds the direction of the ray in eye space
    //Formally, to calculate the direction you would do dir = point - eyePos but since we are in eye space eyePos = [0,0,0]
    //w = 0 is because this is not a point anymore but is considered as a direction
    let rayEyeCoords = [
      pointEyeCoords[0],
      pointEyeCoords[1],
      pointEyeCoords[2],
      0.0,
    ];

    //We find the direction expressed in world coordinates by multiplying with the inverse of the view matrix
    let rayDir = mathUtils.multiplyMatrixVector(viewInv, rayEyeCoords);
    return mathUtils.normaliseVector3(rayDir);
  }

  /**
   * Handle wheel zoom event
   * @param {WheelEvent} event
   */
  const doWheel = function (event) {
    event.preventDefault();
    const increment = event.deltaY * 0.0005 * cameraState.lookRadius; // Increment increase as radius increase to keep the "scaling" effect consistent
    let newLookRadius = Math.min(
      Math.max(cameraState.lookRadius + increment, 5.5),
      20
    );
    cameraState.update(cameraState.elevation, cameraState.angle, newLookRadius);
  };

  function initInputEventListeners() {
    canvas.addEventListener("mousedown", doMouseDown, false);
    canvas.addEventListener("mouseup", releaseMouse, false);
    canvas.addEventListener("mouseout", releaseMouse, false);
    canvas.addEventListener("mousemove", doMouseMove, false);
    canvas.addEventListener("wheel", doWheel, false);
  }

  return {
    initInputEventListeners: initInputEventListeners,
  };
};

export { MouseHandler };
