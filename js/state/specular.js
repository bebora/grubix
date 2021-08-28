export const fromTypeToId = {
  phong: 0,
  blinn: 1,
};

/**
 * Manage the current specular options
 */
export function SpecularState() {
  this.type = "lambert";
  /**
   * Update the specular with the related options
   * @param {string} type the type of the specular
   * @param {Object} options the options related to the type
   */
  this.update = function (type, options) {
    this.type = type;
    this.options = Object.assign({}, options);
  };

  /**
   * Retrieve the parameters useful to render the specular
   */
  this.getParameters = function () {
    return {
      color: this.options.color,
      shininess: this.options.shininess,
    };
  };
}
