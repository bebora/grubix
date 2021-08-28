import { mathUtils } from "../utils.js";

/**
 * Manage a single light with a given type and option
 */
function Light() {
  /**
   * Update the light with the related options
   * @param {string} type the type of the light
   * @param {Object} options the options related to the type
   */
  this.update = function (type, options) {
    this.type = type;
    this.options = Object.assign({}, options);
  };

  /**
   * Retrieve the parameters useful to render the light
   */
  this.getParameters = function () {
    if (this.type === "direct") {
      let color = this.options.color;
      let elevation = mathUtils.degToRad(this.options.elevation);
      let azimuth = mathUtils.degToRad(this.options.azimuth);
      let direction = [
        Math.sin(elevation) * Math.sin(azimuth),
        Math.cos(elevation),
        Math.sin(elevation) * Math.cos(azimuth),
      ];
      return {
        color,
        direction,
      };
    } else if (this.type === "point") {
      let color = this.options.color;
      let position = [
        this.options.x / 10,
        this.options.y / 10,
        this.options.z / 10,
      ];
      let decay = this.options.decay;
      let target = this.options.target / 10;
      return {
        color,
        position,
        decay,
        target,
      };
    } else if (this.type === "spot") {
      let color = this.options.color;
      let position = [
        this.options.x / 10,
        this.options.y / 10,
        this.options.z / 10,
      ];
      let decay = this.options.decay;
      let target = this.options.target / 10;
      let elevation = mathUtils.degToRad(this.options.elevation);
      let azimuth = mathUtils.degToRad(this.options.azimuth);
      let direction = [
        Math.sin(elevation) * Math.sin(azimuth),
        Math.cos(elevation),
        Math.sin(elevation) * Math.cos(azimuth),
      ];
      let coneIn = this.options.coneIn / 100;
      let coneOut = this.options.coneOut;
      return {
        color,
        position,
        decay,
        target,
        direction,
        coneIn,
        coneOut,
      };
    }
  };
}

/**
 * Manage the state of the lights
 * @constructor
 */
export function LightState() {
  /**
   * @type {Light[]}
   */
  this.lights = [];

  /**
   * Add a light
   * @param type the type of the light to add
   * @param options the options related to the given light
   */
  this.addLight = function (type, options) {
    let light = new Light();
    light.update(type, options);

    this.lights.push(light);
  };

  /**
   * Remove a light at the given index
   * @param {number} index
   */
  this.removeLight = function (index) {
    this.lights.splice(index, 1);
  };

  /**
   * Update a light
   * @param id the id of the light
   * @param type the type of the light to add
   * @param options the options related to the given light
   */
  this.updateLight = function (id, type, options) {
    let light = this.lights[id];
    light.update(type, options);
  };
}
