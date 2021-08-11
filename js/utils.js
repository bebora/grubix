/**
 * Expand canvas to fill its parent
 * @param {HTMLCanvasElement} canvas
 */
const expandCanvasToContainer = function (canvas) {
  const parent = canvas.parentElement;
  canvas.width = parent.clientWidth;
  canvas.height = parent.clientHeight;
}

export {expandCanvasToContainer}
