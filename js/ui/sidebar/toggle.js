/**
 * Manage toggling the sidebar and expanding the canvas
 * @param canvasState
 */
export function ToggleSideBar(canvasState) {
  let sidebarOpen = true;

  document.getElementById("toggle-sidebar").addEventListener("click", (e) => {
    const parent = e.target.parentElement;
    if (sidebarOpen) {
      parent.style.minWidth = "0";
      parent.style.maxWidth = "50px";
    } else {
      parent.style.minWidth = "20%";
      parent.style.maxWidth = "100%";
    }
    sidebarOpen = !sidebarOpen;
    canvasState.expandToParent();
  });

  const resizeObserver = new ResizeObserver((_) => {
    canvasState.expandToParent();
  });
  resizeObserver.observe(document.getElementById("sidebar"));
}
