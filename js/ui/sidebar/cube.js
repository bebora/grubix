/**
 * Manage the interaction with the cube
 * @param {CubeState} cube the rubik cube
 * @constructor
 */
export function CubeSideBar(cube) {
  this.solve = document.getElementById("solve");
  this.reset = document.getElementById("reset");
  this.scramble = document.getElementById("scramble");
  let that = this;

  const scrambleButtonElement = document.getElementById("scramble");
  scrambleButtonElement.addEventListener("click", async function () {
    cube.transitionInProgress = true;
    that.changeButtonState(false);
    await cube.scramble();
    cube.transitionInProgress = false;
    that.changeButtonState(true);
  });

  const solveButtonElement = document.getElementById("solve");
  solveButtonElement.addEventListener("click", async function () {
    cube.transitionInProgress = true;
    that.changeButtonState(false);
    await cube.solve();
    cube.transitionInProgress = false;
    that.changeButtonState(true);
  });

  const resetButtonElement = document.getElementById("reset");
  resetButtonElement.addEventListener("click", function () {
    cube.transitionInProgress = true;
    that.changeButtonState(false);
    cube.reset();
    cube.transitionInProgress = false;
    that.changeButtonState(true);
  });

  /**
   * Change buttons state
   * @param {boolean} state whether to enable or disable the cubes
   */
  this.changeButtonState = function (state) {
    [scrambleButtonElement, solveButtonElement, resetButtonElement].forEach(
      (button) => {
        button.disabled = !state;
      }
    );
  };
}
