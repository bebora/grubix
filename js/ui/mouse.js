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
  let sensitivity = 0.5;
  let moveThreshold = 7 * sensitivity;
  let lockedDir = null;
  let lockedFace = null;
  let activeFacelet = null;
  let accumulator1 = 0;
  let accumulator2 = 0;
  let currentTime = null;
  let oldTime = null;
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

    oldTime = new Date().getTime();
    //console.log("mouse DOWN, clientXY: " + [lastMouseX, lastMouseY]);

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
  async function doMouseUp(event) {
    let endX = event.clientX;
    let endY = event.clientY;
    lastMouseX = -100;
    lastMouseY = -100;

    if (moveActivated) {
      // Compute inertia
      currentTime = new Date().getTime();
      let mouseRecord = mouseQueue.getValidElement(currentTime);
      let speed = null;
      if (mouseRecord !== null) {
        let deltaTime = currentTime - mouseRecord.time;
        let deltaSpace = mathUtils.distance2(
          [mouseRecord.x, mouseRecord.y],
          [endX, endY]
        );
        speed = deltaSpace / deltaTime;
      }
      let inertia = speed ? speed > inertiaThreshold : false;
      console.log(inertia);

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
      const dy = lastMouseY - event.pageY;
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
            cameraState.elevation + 0.5 * dy,
            cameraState.angle + 0.5 * dx * sign,
            cameraState.lookRadius
          );
        }
      } else {
        // Record mouse state
        mouseQueue.push({
          x: event.clientX,
          y: event.clientY,
          time: new Date().getTime(),
        });

        let diffVect = [dx, -dy];

        if (lockedDir == null) {
          let [faceName1, dir1] = Object.entries(activeFacelet.directions)[0];
          let [faceName2, dir2] = Object.entries(activeFacelet.directions)[1];

          let temp1 = projectDirToScreen(startPoint, dir1);
          dir1 = mathUtils.normaliseVector2(temp1[1]);
          let scalarProduct1 =
            sensitivity * mathUtils.scalarProduct2(diffVect, dir1); /// mathUtils.vectorNorm2(dir1Origin);

          let temp2 = projectDirToScreen(startPoint, dir2);
          dir2 = mathUtils.normaliseVector2(temp2[1]);
          let scalarProduct2 =
            sensitivity * mathUtils.scalarProduct2(diffVect, dir2); /// mathUtils.vectorNorm2(dir1Origin);

          if (
            Math.abs(scalarProduct1) > Math.abs(scalarProduct2) &&
            Math.abs(accumulator1 + scalarProduct1) > moveThreshold
          ) {
            lockedDir = dir1;
            lockedFace = faceName1;
            moveActivated = true;
            cube.turnFaceABit(faceName1, accumulator1 + scalarProduct1);
          } else if (
            Math.abs(scalarProduct2) > Math.abs(scalarProduct1) &&
            Math.abs(accumulator2 + scalarProduct2) > moveThreshold
          ) {
            lockedDir = dir2;
            lockedFace = faceName2;
            moveActivated = true;
            cube.turnFaceABit(faceName2, accumulator2 + scalarProduct2);
          } else {
            accumulator1 += scalarProduct1;
            accumulator2 += scalarProduct2;
          }
        } else {
          let scalarProduct =
            sensitivity * mathUtils.scalarProduct2(diffVect, lockedDir);

          cube.turnFaceABit(lockedFace, scalarProduct);
        }
      }
    }
  }

  function getPixelCoordinates(pParam) {
    let p = [];
    p[0] = pParam[0];
    p[1] = pParam[1];
    p[2] = pParam[2];
    p[3] = 1;
    let pv = mathUtils.multiplyMatrixVector(matrices.viewMatrix, p);
    let pp = mathUtils.multiplyMatrixVector(matrices.perspectiveMatrix, pv);
    let pNCD = [];
    pNCD[0] = pp[0] / pp[3];
    pNCD[1] = pp[1] / pp[3];

    let x = (canvas.width * (pNCD[0] + 1.0)) / 2.0;
    let y = (canvas.height * (1.0 - pNCD[1])) / 2.0;
    return [Math.round(x), Math.round(y), pv[2]]; //to have even more precision, casting to int can be avoided
    // pv[2] is the z coordinate in camera space: if positive, the point that is gonna be projected on screen is behind us,
    //  (behind the camera), thus it will be used to invert the direction along which the face can be moved
  }

  function projectDirToScreen(start, dir) {
    let end = mathUtils.sumVectors3(
      start,
      mathUtils.multiplyVectorScalar3(dir, 10000)
      //this multiplier sets the precision when converting everything into pixel coordinates
    );
    let startScreen = [lastMouseX, lastMouseY];
    let endScreen = [];
    let endTemp = getPixelCoordinates(end);
    endScreen[0] = endTemp[0];
    endScreen[1] = endTemp[1];

    let screenDir = mathUtils.subtractVectors2(endScreen, startScreen);
    if (endTemp[2] > 0.0)
      screenDir = mathUtils.multiplyVectorScalar2(screenDir, -1.0);
    return [startScreen, screenDir];
  }

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

    //We find the direction expressed in world coordinates by multipling with the inverse of the view matrix
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
    canvas.addEventListener("mouseup", doMouseUp, false);
    canvas.addEventListener("mousemove", doMouseMove, false);
    canvas.addEventListener("wheel", doWheel, false);

    const scrambleButtonElement = document.getElementById("scramble");
    scrambleButtonElement.addEventListener("click", async function () {
      cube.transitionInProgress = true;
      await cube.scramble();
      cube.transitionInProgress = false;
    });

    const solveButtonElement = document.getElementById("solve");
    solveButtonElement.addEventListener("click", async function () {
      cube.transitionInProgress = true;
      await cube.solve();
      cube.transitionInProgress = false;
    });

    const resetButtonElement = document.getElementById("reset");
    resetButtonElement.addEventListener("click", function () {
      cube.reset();
    });
  }

  return {
    initInputEventListeners: initInputEventListeners,
  };
};

export { MouseHandler };
