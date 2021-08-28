/**
 * Retrieve an object with the HTML elements for controlling specular
 */
import { parseHexColor } from "../../utils.js";

function SpecularHTMLOptions() {
  this.type = document.getElementById("specular-select");

  this.common = {
    color: document.getElementById("specular-color"),
    shininess: document.getElementById("specular-shininess"),
  };
}

/**
 * Manage the current state of the sidebar specular options, updated through events
 * @param {SpecularHTMLOptions} elements
 * @param {SpecularState} specularState
 */
export function SpecularOptions(elements, specularState) {
  this.type = elements.type.value;

  this.common = {
    color: parseHexColor(elements.common.color.value),
    shininess: parseFloat(elements.common.shininess.value),
  };

  /**
   * Retrieve the options given the type
   */
  this.toOption = function () {
    return this.common;
  };

  let that = this;

  elements.common.color.addEventListener("input", (e) => {
    this.common.color = parseHexColor(e.target.value);
    specularState.update(that.type, that.toOption());
  });
  elements.common.shininess.addEventListener("input", (e) => {
    this.common.shininess = parseFloat(e.target.value);
    specularState.update(that.type, that.toOption());
  });
}

/**
 * Manage the interaction with the sidebar
 * @constructor
 * @param {SpecularState} specularState
 */
export function SpecularSideBar(specularState) {
  let htmlElements = new SpecularHTMLOptions();
  let specularOptions = new SpecularOptions(htmlElements, specularState);
  let that = this;

  this.changeSpecularType = function () {
    let specularType = htmlElements.type.value;

    specularOptions.type = specularType;
    specularState.update(specularType, specularOptions.toOption());
  };

  htmlElements.type.addEventListener("input", (e) => {
    that.changeSpecularType();
  });

  this.changeSpecularType();
}
