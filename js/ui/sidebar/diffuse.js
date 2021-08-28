/**
 * Retrieve an object with the HTML elements for controlling diffuse
 */
import { parseHexColor } from "../../utils.js";

function DiffuseHTMLOptions() {
  this.type = document.getElementById("diffuse-select");

  this.common = {
    color: document.getElementById("diffuse-color"),
    texture: document.getElementById("diffuse-texture"),
  };

  this.toon = {
    panel: document.getElementById("toon"),
    threshold: document.getElementById("diffuse-toon-threshold"),
  };
}

/**
 * Manage the current state of the sidebar diffuse options, updated through events
 * @param {DiffuseHTMLOptions} elements
 * @param {DiffuseState} diffuseState
 */
export function DiffuseOptions(elements, diffuseState) {
  // Note that these fields affect other classes than this, therefore their update event is managed in DiffuseSideBar
  this.type = elements.type.value;

  this.common = {
    color: parseHexColor(elements.common.color.value),
    texture: parseFloat(elements.common.texture.value),
  };

  this.toon = {
    threshold: parseFloat(elements.toon.threshold.value),
  };

  /**
   * Retrieve the options given the type
   */
  this.toOption = function () {
    switch (this.type) {
      case "lambert":
        return this.common;
      case "toon":
        return { ...this.common, threshold: this.toon.threshold };
    }
  };

  let that = this;

  // Every element in the lists contains the id of the HTML element, the object to modify, and the key of the object
  let elementsToFloat = [
    [elements.common.texture, this.common, "texture"],
    [elements.toon.threshold, this.toon, "threshold"],
  ];
  elementsToFloat.map(function (el) {
    el[0].addEventListener("input", (e) => {
      el[1][el[2]] = parseFloat(e.target.value);
      diffuseState.update(that.type, that.toOption());
    });
  });
  elements.common.color.addEventListener("input", (e) => {
    this.common.color = parseHexColor(e.target.value);
    diffuseState.update(that.type, that.toOption());
  });
}

/**
 * Manage the interaction with the sidebar
 * @constructor
 * @param {DiffuseState} diffuseState
 */
export function DiffuseSideBar(diffuseState) {
  let htmlElements = new DiffuseHTMLOptions();
  let diffuseOptions = new DiffuseOptions(htmlElements, diffuseState);
  let that = this;

  this.changeDiffuseType = function () {
    let diffuseType = htmlElements.type.value;

    htmlElements.toon.panel.classList.add("hidden");

    switch (diffuseType) {
      case "toon":
        htmlElements.toon.panel.classList.remove("hidden");
        break;
    }

    diffuseOptions.type = diffuseType;
    diffuseState.update(diffuseType, diffuseOptions.toOption());
  };

  htmlElements.type.addEventListener("input", (e) => {
    that.changeDiffuseType();
  });

  this.changeDiffuseType();
}
