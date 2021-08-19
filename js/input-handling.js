import { RubiksCube } from "./rubikscube.js";

/**
 * Create a handler for user input
 * @param {HTMLCanvasElement} canvasParam
 * @param {RubiksCube} cubeParam
 * @param {Object} cameraStateParam contains elevation, angle and lookRadius of camera
 */
const InputHandler = function (canvasParam, cubeParam, cameraStateParam) {
  let pointerInputState = false;
  let lastMouseX = -100,
    lastMouseY = -100;
  const canvas = canvasParam;
  const cube = cubeParam;
  const cameraState = cameraStateParam;

  // Mouse events
  /**
   * @param {MouseEvent} event
   */
  function doMouseDown(event) {
    lastMouseX = event.pageX;
    lastMouseY = event.pageY;
    pointerInputState = true;
  }

  /**
   * @param {MouseEvent} event
   */
  function doMouseUp(event) {
    lastMouseX = -100;
    lastMouseY = -100;
    pointerInputState = false;
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

      if (dx !== 0 || dy !== 0) {
        cameraState.angle = cameraState.angle + 0.5 * dx;
        cameraState.elevation = cameraState.elevation + 0.5 * dy;
      }
    }
  }

  // Keyboard events
  /**
   * Handle keyboard input
   * @param {KeyboardEvent} e
   */
  const keyFunction = function (e) {
    if (e.code === "Digit1") {
      cube.move("R", true);
    } else if (e.code === "Digit2") {
      cube.move("R", false);
    } else if (e.code === "Digit3") {
      cube.move("U", true);
    } else if (e.code === "Digit4") {
      cube.move("U", false);
    }
  };

  /**
   * Handle wheel zoom event
   * @param {WheelEvent} event
   */
  const doWheel = function (event) {
    event.preventDefault();
    const increment = event.deltaY * 0.0005 * cameraState.lookRadius; // Increment increase as radius increase to keep the "scaling" effect consistent
    cameraState.lookRadius = Math.min(
      Math.max(cameraState.lookRadius + increment, 1.25),
      20
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
