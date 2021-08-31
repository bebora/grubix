/**
 * Manage the current parallax occlusion mapping options
 */
export function ParallaxState() {
  this.enabled = true;
  /**
   * Update the parallax with the related options
   * @param {{enabled: boolean, scale: number}} options
   */
  this.update = function (options) {
    this.enabled = options.enabled;
    this.scale = options.scale;
  };

  /**
   * Retrieve the parameters useful to render the parallax
   */
  this.getParameters = function () {
    return {
      enabled: this.enabled,
      scale: this.scale,
    };
  };
}
