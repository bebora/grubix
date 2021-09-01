/**
 * Manage the current PBR options
 */
export function PbrState() {
  this.enabled = true;
  /**
   * Update the PBR with the related options
   * @param {{enabled: boolean, metallic: number, roughness: number}} options
   */
  this.update = function (options) {
    this.enabled = options.enabled;
    if (this.enabled) {
      document.getElementById("specular").classList.add("hidden");
    } else {
      document.getElementById("specular").classList.remove("hidden");
    }
    this.metallic = options.metallic;
    this.roughness = options.roughness;
  };

  /**
   * Retrieve the PBR parameters
   */
  this.getParameters = function () {
    return {
      enabled: this.enabled,
      metallic: this.metallic,
      roughness: this.roughness,
    };
  };
}
