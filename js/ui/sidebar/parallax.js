/**
 * Retrieve an object with the HTML elements for controlling parallax occlusion mapping
 */

function ParallaxHTMLOptions() {
  this.enabled = document.getElementById("enable-pom");
  this.scale = document.getElementById("pom-scale");
}

/**
 * Manage the current state of the sidebar parallax occlusion mapping options, updated through events
 * @param {ParallaxHTMLOptions} elements
 * @param {ParallaxState} parallaxState
 */
export function ParallaxOptions(elements, parallaxState) {
  this.enabled = elements.enabled.checked;
  this.scale = elements.scale.value;

  /**
   * Retrieve the options given the type
   */
  this.toOption = function () {
    return { enabled: this.enabled, scale: this.scale };
  };

  let that = this;

  elements.enabled.addEventListener("input", (e) => {
    console.log(e);
    this.enabled = e.target.checked;
    parallaxState.update(that.toOption());
  });
  elements.scale.addEventListener("input", (e) => {
    this.scale = parseFloat(e.target.value);
    parallaxState.update(that.toOption());
  });
}

/**
 * Manage the interaction with the sidebar
 * @constructor
 * @param {ParallaxState} parallaxState
 */
export function ParallaxSideBar(parallaxState) {
  const htmlElements = new ParallaxHTMLOptions();
  const parallaxOptions = new ParallaxOptions(htmlElements, parallaxState);

  parallaxState.update(parallaxOptions.toOption());
}
