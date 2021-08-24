import { RubiksCube } from "./rubikscube.js";
import { mathUtils, projectionUtils } from "./utils.js";

/**
 * Create a handler for user input
 * @param {HTMLCanvasElement} canvasParam
 * @param {RubiksCube} cubeParam
 * @param {Object} cameraStateParam contains elevation, angle and lookRadius of camera
 */
const InputHandler = function (
  canvasParam,
  cubeParam,
  cameraStateParam,
  matricesParam
) {
  let pointerInputState = false;
  let lastMouseX = -100,
    lastMouseY = -100;
  const canvas = canvasParam;
  const cube = cubeParam;
  const cameraState = cameraStateParam;
  const matrices = matricesParam;
  let cubeActivated = false;
  let moveActivated = false;
  let faceToMove = "F";
  let startPoint = [];
  let endPoint = [];
  let oldEndPoint = [];
  let threshold = 0.2;
  let lockedDir = [];
  let lockedFace = "";
  let activeFacelet = null;
  let maxRot = 2.5;
  let rotAmount = 0;
  let accumulator1 = 0;
  let accumulator2 = 0;
  let animationInProgress = false;
  // let clickedFace = "";
  // let faceDir1 = null;
  // let faceDir2 = null;

  // Mouse events
  /**
   * @param {MouseEvent} event
   */
  function doMouseDown(event) {
    lastMouseX = event.clientX;
    lastMouseY = event.clientY;
    console.log("mouse DOWN, clientXY: " + [lastMouseX, lastMouseY]);

    let normalisedRayDir = getNormRayDir(lastMouseX, lastMouseY);
    //console.log("normalised ray dir " + normalisedRayDir);
    //The ray starts from the camera in world coordinates
    let rayStartPoint = [cameraState.cx, cameraState.cy, cameraState.cz];
    let [intersectedFacelet, intersectionPoint] = cube.intersectFacelets(
      rayStartPoint,
      normalisedRayDir
    );
    if (!animationInProgress && intersectedFacelet != null) {
      //console.log(intersectedFacelet.faces);
      activeFacelet = intersectedFacelet;
      cubeActivated = true;
      startPoint = intersectionPoint;
      console.log(
        "mouse DOWN, pixel coordinates: " +
          getPixelCoordinates(intersectionPoint)
      );
    } else {
      cubeActivated = false;
    }
    //startPoint =  provaIntersect(rayStartPoint, normalisedRayDir);
    //console.log(cameraState.cz);
    // if (
    //   startPoint[0] > 1 &&
    //   startPoint[0] < 3 &&
    //   startPoint[2] > 1 &&
    //   startPoint[2] < 3
    // ) {
    //   //console.log(startPoint, "INTERSECATO");
    //   cubeActivated = true;
    // } else {
    //   //console.log(startPoint, "NON INTERSECATO");
    //   cubeActivated = false;
    // }

    // if (lastMouseX < canvas.width / 2) {
    //   cubeActivated = true;
    // } else {
    //   cubeActivated = false;
    // }
    pointerInputState = true;
  }

  /**
   * @param {MouseEvent} event
   */
  async function doMouseUp(event) {
    lastMouseX = -100;
    lastMouseY = -100;
    if (moveActivated) {
      moveActivated = false;
      pointerInputState = false;

      animationInProgress = true;
      await cube.realignWithAnimation(lockedFace);
      animationInProgress = false;
    }
    moveActivated = false;
    pointerInputState = false;
    lockedDir = [];
    lockedFace = "";
    activeFacelet = null;
    rotAmount = 0;
    oldEndPoint = null;
    endPoint = null;
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
          cameraState.angle = cameraState.angle + 0.5 * dx;
          cameraState.elevation = cameraState.elevation + 0.5 * dy;
          matrices.viewMatrix = projectionUtils.makeView(
            cameraState.cx,
            cameraState.cy,
            cameraState.cz,
            cameraState.elevation,
            -cameraState.angle
          );
        }
      } else {
        //cube.turnFaceABit(faceToMove, dx);

        let normalisedRayDir = getNormRayDir(lastMouseX, lastMouseY);
        //console.log("normalised ray dir " + normalisedRayDir);
        //The ray starts from the camera in world coordinates
        let rayStartPoint = [cameraState.cx, cameraState.cy, cameraState.cz];

        let endPoint = activeFacelet.face.intersectRay(
          rayStartPoint,
          normalisedRayDir
        );
        if (endPoint == null) {
          console.log("\nA\nA\nA\nA\na\na\na\na\nabatman");
          //TODO: non so se è possibile smettere di intersecare il piano, però forse va gestito
        }
        //provaIntersect(rayStartPoint, normalisedRayDir);

        let diffVect = mathUtils.subtractVectors3(endPoint, startPoint);

        // let distanceStartCamera = mathUtils.distance3(
        //   startPoint,
        //   rayStartPoint
        // );
        // let distanceEndCamera = mathUtils.distance3(endPoint, rayStartPoint);
        // let avgDistanceCamera =
        //   Math.abs(distanceEndCamera - distanceStartCamera) / 2;

        if (lockedDir.length == 0) {
          //qui chiamo funzione che mi restituisce dir e facce da muovere
          // let dir1 = [1, 0, 0];
          // let dir2 = [0, 0, -1];
          let [faceName1, dir1] = Object.entries(activeFacelet.directions)[0];
          let [faceName2, dir2] = Object.entries(activeFacelet.directions)[1];

          // function projectDirToScreen(start, dir) {
          //   let end = mathUtils.sumVectors3(
          //     start,
          //     mathUtils.multiplyVectorScalar(dir, 3)
          //   );
          //   let startScreen = getPixelCoordinates(start);
          //   let endScreen = getPixelCoordinates(end);
          //   return [startScreen, endScreen];
          // }

          // let dir1proj = projectDirToScreen(startPoint, dir1);
          // let dir1Origin = mathUtils.subtractVectors2(dir1proj[1], dir1proj[0]);
          // let dist2d_1 =
          //   mathUtils.scalarProduct2([dx, dy], dir1Origin) /
          //   mathUtils.vectorNorm2(dir1Origin);

          // let dir2proj = projectDirToScreen(startPoint, dir1);
          // let dir2Origin = mathUtils.subtractVectors2(dir2proj[1], dir2proj[0]);
          // let dist2d_2 =
          //   mathUtils.scalarProduct2([dx, dy], dir2Origin) /
          //   mathUtils.vectorNorm2(dir2Origin);

          // let projStartDir1 = projectPointOnLine(startPoint, dir1);
          // let projEndDir1 = projectPointOnLine(endPoint, dir1);
          // let projStartScreen1 = getPixelCoordinates(projStartDir1);
          // let projEndScreen1 = getPixelCoordinates(projEndDir1);
          // let screenDistance1 = mathUtils.distance2(
          //   projStartScreen1,
          //   projEndScreen1
          // );

          // let projStartDir2 = projectPointOnLine(startPoint, dir2);
          // let projEndDir2 = projectPointOnLine(endPoint, dir2);
          // let projStartScreen2 = getPixelCoordinates(projStartDir2);
          // let projEndScreen2 = getPixelCoordinates(projEndDir2);
          // let screenDistance2 = mathUtils.distance2(
          //   projStartScreen2,
          //   projEndScreen2
          // );

          //let dir1 = activeFacelet.directions
          let scalarProduct1 = mathUtils.scalarProduct3(diffVect, dir1);
          let scalarProduct2 = mathUtils.scalarProduct3(diffVect, dir2);

          if (
            Math.abs(scalarProduct1) > Math.abs(scalarProduct2) &&
            Math.abs(accumulator1 + scalarProduct1) > threshold
          ) {
            lockedDir = dir1;
            lockedFace = faceName1;
            moveActivated = true;
            cube.turnFaceABit(faceName1, accumulator1 + scalarProduct1);
            //rotAmount += accumulator1 + scalarProduct1;
          } else if (
            Math.abs(scalarProduct2) > Math.abs(scalarProduct1) &&
            Math.abs(accumulator2 + scalarProduct2) > threshold
          ) {
            lockedDir = dir2;
            lockedFace = faceName2;
            moveActivated = true;
            cube.turnFaceABit(faceName2, accumulator2 + scalarProduct2);
            //rotAmount += accumulator2 + scalarProduct2;
          } else {
            accumulator1 += scalarProduct1;
            accumulator2 += scalarProduct2;
          }
        } else {
          let scalarProduct = mathUtils.scalarProduct3(diffVect, lockedDir);
          // let sign = Math.sign(scalarProduct);

          // let projStartDir = projectPointOnLine(startPoint, lockedDir);
          // let projEndDir = projectPointOnLine(endPoint, lockedDir);
          // let projStartScreen = getPixelCoordinates(projStartDir);
          // let projEndScreen = getPixelCoordinates(projEndDir);
          // let screenDistance =
          //   sign * mathUtils.distance2(projStartScreen, projEndScreen);
          // console.log(
          //   "\nscalarProduct: " +
          //     scalarProduct +
          //     "\nscreenDistance: " +
          //     screenDistance +
          //     "\nprojStartScreen: " +
          //     projStartScreen +
          //     "\nprojEndScreen: " +
          //     projEndScreen +
          //     "\nmouseXY" +
          //     [lastMouseX, lastMouseY]
          // );

          // let tempDiff = mathUtils.subtractVectors3(endPoint, oldEndPoint);
          // let tempDiffNorm = mathUtils.vectorNorm3(tempDiff);

          //let tempRotAmount = scalarProduct * 10 - rotAmount;
          let clippedScalarProduct = Math.min(
            Math.max(scalarProduct * 1000, -maxRot * 1.5),
            maxRot * 1.5
          );
          // let tempRotAmount = Math.min(
          //   Math.max(clippedScalarProduct, -maxRot * 2),
          //   maxRot
          // );
          // if (tempRotAmount * scalarProduct < 0) {
          //   console.log("neg");
          //   tempRotAmount = -tempRotAmount;
          // }

          cube.turnFaceABit(
            lockedFace,
            clippedScalarProduct
            //clippedScalarProduct * 10
            //screenDistance / 10 - rotAmount
            //scalarProduct * 10
            // ((scalarProduct * 10) / mathUtils.vectorNorm3(diffVect)) *
            //  Math.sqrt(dx * dx + dy * dy)
          );
          //rotAmount += tempRotAmount; //screenDistance / 10 - rotAmount;
        }
        startPoint = endPoint;
        //oldEndPoint = endPoint;
      }
    }
  }

  function projectPointOnLine(p, lineDir) {
    //A + dot(AP,AB) / dot(AB,AB) * AB
    let dotABAB = mathUtils.scalarProduct3(lineDir, lineDir);
    let dotAPAB = mathUtils.scalarProduct3(p, lineDir);
    let result = []; // lineDir / dotABAB * dotAPAB
    result[0] = (lineDir[0] / dotABAB) * dotAPAB;
    result[1] = (lineDir[1] / dotABAB) * dotAPAB;
    result[2] = (lineDir[2] / dotABAB) * dotAPAB;
    return result;
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
    //pNCD[2] = pp[2] / pp[3];

    let x = (canvas.width * (pNCD[0] + 1.0)) / 2.0;
    let y = (canvas.height * (1.0 - pNCD[1])) / 2.0;
    return [Math.round(x), Math.round(y)];
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
    //console.log("Ray direction " + rayDir);
    return mathUtils.normaliseVector3(rayDir);
  }

  // Keyboard events
  /**
   * Handle keyboard input
   * @param {KeyboardEvent} e
   */
  const keyFunction = function (e) {
    /*if (e.code === "Digit1") {
      cube.turnFaceABit("R", 50);
      cube.realign("R");
      //cube.move("R", true);
    } else if (e.code === "Digit2") {
      cube.turnFaceABit("R", -50);
      cube.realign("R");
      //cube.move("R", false);
    } else if (e.code === "Digit3") {
      cube.turnFaceABit("U", 50);
      cube.realign("U");
      //cube.move("U", true);
    } else if (e.code === "Digit4") {
      cube.turnFaceABit("U", -50);
      cube.realign("U");
      //cube.move("U", false);
    } else*/ if ("FBLRUDMES".includes(e.key.toUpperCase()))
      faceToMove = e.key.toUpperCase();
  };

  /**
   * Handle wheel zoom event
   * @param {WheelEvent} event
   */
  const doWheel = function (event) {
    event.preventDefault();
    const increment = event.deltaY * 0.0005 * cameraState.lookRadius; // Increment increase as radius increase to keep the "scaling" effect consistent
    cameraState.lookRadius = Math.min(
      Math.max(cameraState.lookRadius + increment, 5.5),
      20
    );
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

    matrices.viewMatrix = projectionUtils.makeView(
      cameraState.cx,
      cameraState.cy,
      cameraState.cz,
      cameraState.elevation,
      -cameraState.angle
    );
  };

  function initInputEventListeners() {
    canvas.addEventListener("mousedown", doMouseDown, false);
    canvas.addEventListener("mouseup", doMouseUp, false);
    canvas.addEventListener("mousemove", doMouseMove, false);
    window.addEventListener("keyup", keyFunction, false);
    canvas.addEventListener("wheel", doWheel, false);
  }

  return {
    initInputEventListeners: initInputEventListeners,
  };
};

export { InputHandler };
