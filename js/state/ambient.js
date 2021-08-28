import { mathUtils } from "../utils.js";

export const fromTypeToId = {
  skybox: 0,
  ambient: 1,
  hemispheric: 2,
};

/**
 * Manage the current ambient options
 */
export function AmbientState() {
  this.type = "skybox";
  /**
   * Update the ambient with the related options
   * @param {string} type the type of the ambient
   * @param {Object} options the options related to the type
   */
  this.update = function (type, options) {
    this.type = type;
    this.options = Object.assign({}, options);
  };

  /**
   * Retrieve the parameters useful to render the ambient
   */
  this.getParameters = function () {
    if (this.type === "skybox") {
      return {};
    } else if (this.type === "ambient") {
      let color = this.options.color;
      return {
        color,
      };
    } else if (this.type === "hemispheric") {
      let upperColor = this.options.upperColor;
      let lowerColor = this.options.lowerColor;
      let elevation = mathUtils.degToRad(this.options.elevation);
      let azimuth = mathUtils.degToRad(this.options.azimuth);
      let direction = [
        Math.sin(elevation) * Math.sin(azimuth),
        Math.cos(elevation),
        Math.sin(elevation) * Math.cos(azimuth),
      ];
      return {
        upperColor,
        lowerColor,
        direction,
      };
    }
  };
}
