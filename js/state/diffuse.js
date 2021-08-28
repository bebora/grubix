export const fromTypeToId = {
  lambert: 0,
  toon: 1,
};

/**
 * Manage the current diffuse options
 */
export function DiffuseState() {
  this.type = "lambert";
  /**
   * Update the diffuse with the related options
   * @param {string} type the type of the diffuse
   * @param {Object} options the options related to the type
   */
  this.update = function (type, options) {
    this.type = type;
    this.options = Object.assign({}, options);
  };

  /**
   * Retrieve the parameters useful to render the diffuse
   */
  this.getParameters = function () {
    let common = {
      color: this.options.color,
      texture: this.options.texture / 100,
    };
    if (this.type === "lambert") {
      return common;
    } else if (this.type === "toon") {
      return {
        ...common,
        threshold: this.options.threshold / 100,
      };
    }
  };
}
