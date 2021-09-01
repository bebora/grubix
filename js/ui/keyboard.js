/**
 * Create a handler for keyboard input
 * @param {ConfettiEmitter} confettiEmitter
 * @constructor
 */
export const KeyboardHandler = function (confettiEmitter) {
  /**
   *
   * @param {KeyboardEvent} event
   */
  const doKeyUp = (event) => {
    if (event.key === "c") {
      confettiEmitter.spawnConfetti();
    }
  };

  const initInputEventListeners = () => {
    window.addEventListener("keyup", doKeyUp, false);
  };

  return {
    initInputEventListeners: initInputEventListeners,
  };
};
