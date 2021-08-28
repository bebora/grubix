/**
 * Retrieve an object with the HTML elements for controlling ambient
 */
import { parseHexColor } from "../../utils.js";

function AmbientHTMLOptions() {
  this.type = document.getElementById("ambient-select");

  this.ambient = {
    panel: document.getElementById("ambient"),
    color: document.getElementById("ambient-color"),
  };

  this.hemispheric = {
    panel: document.getElementById("hemispheric"),
    upperColor: document.getElementById("hemispheric-upper-color"),
    lowerColor: document.getElementById("hemispheric-lower-color"),
    azimuth: document.getElementById("hemispheric-azimuth"),
    elevation: document.getElementById("hemispheric-elevation"),
  };
}

/**
 * Manage the current state of the sidebar ambient options, updated through events
 * @param {AmbientHTMLOptions} elements
 * @param {AmbientState} ambientState
 */
export function AmbientOptions(elements, ambientState) {
  // Note that these fields affect other classes than this, therefore their update event is managed in AmbientSideBar
  this.type = elements.type.value;

  this.ambient = {
    color: parseHexColor(elements.ambient.color.value),
  };

  this.hemispheric = {
    upperColor: parseHexColor(elements.hemispheric.upperColor.value),
    lowerColor: parseHexColor(elements.hemispheric.lowerColor.value),
    azimuth: parseFloat(elements.hemispheric.azimuth.value),
    elevation: parseFloat(elements.hemispheric.elevation.value),
  };

  /**
   * Retrieve the options given the type
   */
  this.toOption = function () {
    switch (this.type) {
      case "ambient":
        return this.ambient;
      case "hemispheric":
        return this.hemispheric;
    }
    return {};
  };

  let that = this;

  // Every element in the lists contains the id of the HTML element, the object to modify, and the key of the object
  let elementsToFloat = [
    [elements.hemispheric.azimuth, this.hemispheric, "azimuth"],
    [elements.hemispheric.elevation, this.hemispheric, "elevation"],
  ];
  elementsToFloat.map(function (el) {
    el[0].addEventListener("input", (e) => {
      el[1][el[2]] = parseFloat(e.target.value);
      ambientState.update(that.type, that.toOption());
    });
  });
  let elementsToColor = [
    [elements.ambient.color, this.ambient, "color"],
    [elements.hemispheric.upperColor, this.hemispheric, "upperColor"],
    [elements.hemispheric.lowerColor, this.hemispheric, "lowerColor"],
  ];
  elementsToColor.map(function (el) {
    el[0].addEventListener("input", (e) => {
      el[1][el[2]] = parseHexColor(e.target.value);
      ambientState.update(that.type, that.toOption());
    });
  });
}

/**
 * Manage the interaction with the sidebar
 * @constructor
 * @param {AmbientState} ambientState
 */
export function AmbientSideBar(ambientState) {
  let htmlElements = new AmbientHTMLOptions();
  let ambientOptions = new AmbientOptions(htmlElements, ambientState);
  let that = this;

  this.changeAmbientType = function () {
    let ambientType = htmlElements.type.value;

    htmlElements.hemispheric.panel.classList.add("hidden");
    htmlElements.ambient.panel.classList.add("hidden");

    switch (ambientType) {
      case "hemispheric":
        htmlElements.hemispheric.panel.classList.remove("hidden");
        break;
      case "ambient":
        htmlElements.ambient.panel.classList.remove("hidden");
        break;
    }

    ambientOptions.type = ambientType;
    ambientState.update(ambientType, ambientOptions.toOption());
  };

  htmlElements.type.addEventListener("input", (e) => {
    that.changeAmbientType();
  });
}
