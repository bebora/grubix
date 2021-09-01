/**
 * Retrieve an object with the HTML elements for controlling PBR
 */

function PbrHTMLOptions() {
  this.enabled = document.getElementById("enable-pbr");
  this.metallic = document.getElementById("pbr-metallic");
  this.roughness = document.getElementById("pbr-roughness");
}

/**
 * Manage the current state of the sidebar PBR options, updated through events
 * @param {PbrHTMLOptions} elements
 * @param {PbrState} pbrState
 */
export function PbrOptions(elements, pbrState) {
  this.enabled = elements.enabled.checked;
  this.metallic = elements.metallic.value;
  this.roughness = elements.roughness.value;

  /**
   * Retrieve the options given the type
   */
  this.toOption = function () {
    return {
      enabled: this.enabled,
      metallic: this.metallic,
      roughness: this.roughness,
    };
  };

  let that = this;

  elements.enabled.addEventListener("input", (e) => {
    console.log(e);
    this.enabled = e.target.checked;
    pbrState.update(that.toOption());
  });
  elements.metallic.addEventListener("input", (e) => {
    this.metallic = parseFloat(e.target.value);
    pbrState.update(that.toOption());
  });
  elements.roughness.addEventListener("input", (e) => {
    this.roughness = parseFloat(e.target.value);
    pbrState.update(that.toOption());
  });
}

/**
 * Manage the interaction with the sidebar
 * @constructor
 * @param {PbrState} pbrState
 */
export function PbrSideBar(pbrState) {
  const htmlElements = new PbrHTMLOptions();
  const pbrOptions = new PbrOptions(htmlElements, pbrState);

  pbrState.update(pbrOptions.toOption());
}
