/**
 * Retrieve an object with the HTML elements for controlling lights
 */
import { parseHexColor } from "../../utils.js";
import { LightState } from "../../state/light.js";
import { rgbToHex } from "../../utils.js";

function LightHTMLOptions() {
  this.id = document.getElementById("light-id");
  this.type = document.getElementById("light-type");
  this.addLight = document.getElementById("add-light");
  this.removeLight = document.getElementById("remove-light");

  this.direct = {
    panel: document.getElementById("light-direct"),
    azimuth: document.getElementById("light-direct-azimuth"),
    elevation: document.getElementById("light-direct-elevation"),
    color: document.getElementById("light-direct-color"),
  };

  this.point = {
    panel: document.getElementById("light-point"),
    x: document.getElementById("light-point-x"),
    y: document.getElementById("light-point-y"),
    z: document.getElementById("light-point-z"),
    color: document.getElementById("light-point-color"),
    decay: document.getElementById("light-point-decay"),
    target: document.getElementById("light-point-target"),
  };

  this.spot = {
    panel: document.getElementById("light-spot"),
    x: document.getElementById("light-spot-x"),
    y: document.getElementById("light-spot-y"),
    z: document.getElementById("light-spot-z"),
    color: document.getElementById("light-spot-color"),
    decay: document.getElementById("light-spot-decay"),
    azimuth: document.getElementById("light-spot-azimuth"),
    elevation: document.getElementById("light-spot-elevation"),
    target: document.getElementById("light-spot-target"),
    coneOut: document.getElementById("light-spot-cone-out"),
    coneIn: document.getElementById("light-spot-cone-in"),
  };
}

/**
 * Manage the current state of the sidebar light options, updated through events
 * @param {LightHTMLOptions} elements
 * @param {LightState} lightState
 */
export function LightOptions(elements, lightState) {
  // Note that these fields affect other classes than this, therefore their update event is managed in LightSideBar
  this.general = {
    id: parseInt(elements.id.value),
    type: elements.type.value,
  };

  this.direct = {
    azimuth: parseFloat(elements.direct.azimuth.value),
    elevation: parseFloat(elements.direct.azimuth.value),
    color: parseHexColor(elements.direct.color.value),
  };

  this.point = {
    x: parseFloat(elements.point.x.value),
    y: parseFloat(elements.point.y.value),
    z: parseFloat(elements.point.z.value),
    color: parseHexColor(elements.point.color.value),
    decay: parseInt(elements.point.decay.value),
    target: parseFloat(elements.point.target.value),
  };

  this.spot = {
    x: parseFloat(elements.spot.x.value),
    y: parseFloat(elements.spot.y.value),
    z: parseFloat(elements.spot.z.value),
    azimuth: parseFloat(elements.spot.azimuth.value),
    elevation: parseFloat(elements.spot.elevation.value),
    color: parseHexColor(elements.spot.color.value),
    decay: parseInt(elements.spot.decay.value),
    target: parseFloat(elements.spot.target.value),
    coneOut: parseFloat(elements.spot.coneOut.value),
    coneIn: parseFloat(elements.spot.coneIn.value),
  };

  /**
   * Retrieve the options given the type
   */
  this.toOption = function () {
    switch (this.general.type) {
      case "direct":
        return this.direct;
      case "point":
        return this.point;
      case "spot":
        return this.spot;
    }
  };

  let that = this;

  // Every element in the lists contains the id of the HTML element, the object to modify, and the key of the object
  let elementsToInt = [
    [elements.point.decay, this.point, "decay"],
    [elements.spot.decay, this.spot, "decay"],
  ];
  elementsToInt.map(function (el) {
    el[0].addEventListener("input", (e) => {
      el[1][el[2]] = parseInt(e.target.value);
      lightState.updateLight(
        that.general.id,
        that.general.type,
        that.toOption()
      );
    });
  });
  let elementsToFloat = [
    [elements.direct.azimuth, this.direct, "azimuth"],
    [elements.direct.elevation, this.direct, "elevation"],
    [elements.point.x, this.point, "x"],
    [elements.point.y, this.point, "y"],
    [elements.point.z, this.point, "z"],
    [elements.point.target, this.point, "target"],
    [elements.spot.azimuth, this.spot, "azimuth"],
    [elements.spot.elevation, this.spot, "elevation"],
    [elements.spot.x, this.spot, "x"],
    [elements.spot.y, this.spot, "y"],
    [elements.spot.z, this.spot, "z"],
    [elements.spot.target, this.spot, "target"],
    [elements.spot.coneOut, this.spot, "coneOut"],
    [elements.spot.coneIn, this.spot, "coneIn"],
  ];
  elementsToFloat.map(function (el) {
    el[0].addEventListener("input", (e) => {
      el[1][el[2]] = parseFloat(e.target.value);
      lightState.updateLight(
        that.general.id,
        that.general.type,
        that.toOption()
      );
    });
  });
  let elementsToColor = [
    [elements.direct.color, this.direct, "color"],
    [elements.point.color, this.point, "color"],
    [elements.spot.color, this.spot, "color"],
  ];
  elementsToColor.map(function (el) {
    el[0].addEventListener("input", (e) => {
      el[1][el[2]] = parseHexColor(e.target.value);
      lightState.updateLight(
        that.general.id,
        that.general.type,
        that.toOption()
      );
    });
  });
}

/**
 * Manage the interaction with the sidebar and updates the light state accordingly
 * Support up to 10 lights
 * @constructor
 * @param {LightState} lightState
 */
export function LightSideBar(lightState) {
  let htmlElements = new LightHTMLOptions();
  let lightOptions = new LightOptions(htmlElements, lightState);
  let that = this;

  /**
   * Add light
   */
  this.addLight = function () {
    let idElement = htmlElements.id;
    // Edit the select element
    idElement.options.add(
      new Option(
        idElement.options.length.toString(),
        idElement.options.length.toString()
      )
    );
    idElement.value = idElement.options.length - 1;
    // Update the options
    lightOptions.general.id = idElement.options.length - 1;
    // Add the light to the state
    lightState.addLight(lightOptions.general.type, lightOptions.toOption());
    // Dispatch event to update sidebar
    htmlElements.id.dispatchEvent(new Event("input"));

    if (lightState.lights.length === 10) htmlElements.addLight.disabled = true;
    if (lightState.lights.length > 0) {
      htmlElements.removeLight.disabled = false;
      htmlElements.type.classList.remove("hidden");
    }
  };

  this.removeLight = function () {
    // Retrieve the current light
    let idElementToRemove = htmlElements.id.value;
    // Edit the selected element
    let newElement =
      idElementToRemove === 0 ? idElementToRemove + 1 : idElementToRemove - 1;
    htmlElements.id.value = newElement;
    lightOptions.general.id = newElement;
    htmlElements.id.options.remove(idElementToRemove);
    // Remove from the light state
    lightState.removeLight(idElementToRemove);

    // We need to shift all the subsequent lights to the correct id in the select
    for (let i = idElementToRemove; i < lightState.lights.length; i++) {
      htmlElements.id.options[i].text = i.toString();
      htmlElements.id.options[i].value = i.toString();
    }

    if (lightState.lights.length < 10) htmlElements.addLight.disabled = false;
    if (lightState.lights.length === 0) {
      htmlElements.removeLight.disabled = true;

      htmlElements.type.classList.add("hidden");
      htmlElements.direct.panel.classList.add("hidden");
      htmlElements.point.panel.classList.add("hidden");
      htmlElements.spot.panel.classList.add("hidden");
    } else {
      // Dispatch event to update sidebar
      htmlElements.id.dispatchEvent(new Event("input"));
    }
  };

  this.changeLightId = function () {
    // Get the current light
    let idElement = htmlElements.id;
    lightOptions.general.id = idElement.value;
    // Get the state of the current light
    let currentLight = lightState.lights[idElement.value];
    let currentOptions = currentLight.options;

    // Update the sidebar options following the state of the new light
    htmlElements.type.value = currentLight.type;
    htmlElements.type.dispatchEvent(new Event("input"));

    let toDispatch;
    switch (htmlElements.type.value) {
      case "direct": {
        let direct = htmlElements.direct;
        direct.azimuth.value = currentOptions.azimuth;
        direct.elevation.value = currentOptions.elevation;
        direct.color.value = rgbToHex(currentOptions.color);

        toDispatch = [direct.azimuth, direct.elevation, direct.color];
        break;
      }
      case "point": {
        let point = htmlElements.point;
        point.x.value = currentOptions.x;
        point.y.value = currentOptions.y;
        point.z.value = currentOptions.z;
        point.color.value = rgbToHex(currentOptions.color);
        point.decay.value = currentOptions.decay;
        point.target.value = currentOptions.target;

        toDispatch = [
          point.x,
          point.y,
          point.z,
          point.color,
          point.decay,
          point.target,
        ];
        break;
      }
      case "spot": {
        let spot = htmlElements.spot;
        spot.azimuth.value = currentOptions.azimuth;
        spot.elevation.value = currentOptions.elevation;
        spot.color.value = rgbToHex(currentOptions.color);
        spot.x.value = currentOptions.x;
        spot.y.value = currentOptions.y;
        spot.z.value = currentOptions.z;
        spot.color.value = rgbToHex(currentOptions.color);
        spot.decay.value = currentOptions.decay;
        spot.target.value = currentOptions.target;
        spot.coneOut.value = currentOptions.coneOut;
        spot.coneIn.value = currentOptions.coneIn;

        toDispatch = [
          spot.x,
          spot.y,
          spot.z,
          spot.color,
          spot.decay,
          spot.target,
          spot.azimuth,
          spot.elevation,
          spot.coneOut,
          spot.coneIn,
        ];
        break;
      }
    }

    toDispatch.forEach((el) => {
      el.dispatchEvent(new Event("input"));
    });
  };

  this.changeLightType = function () {
    let lightType = htmlElements.type.value;

    htmlElements.direct.panel.classList.add("hidden");
    htmlElements.point.panel.classList.add("hidden");
    htmlElements.spot.panel.classList.add("hidden");

    switch (lightType) {
      case "point":
        htmlElements.point.panel.classList.remove("hidden");
        break;
      case "spot":
        htmlElements.spot.panel.classList.remove("hidden");
        break;
      case "direct":
        htmlElements.direct.panel.classList.remove("hidden");
        break;
    }

    lightOptions.general.type = lightType;
    lightState.updateLight(
      lightOptions.general.id,
      lightType,
      lightOptions.toOption()
    );
  };

  htmlElements.addLight.addEventListener("click", (el) => {
    that.addLight();
  });

  htmlElements.removeLight.addEventListener("click", (el) => {
    that.removeLight();
  });

  htmlElements.id.addEventListener("input", (el) => {
    that.changeLightId();
  });

  htmlElements.type.addEventListener("input", (e) => {
    that.changeLightType();
  });

  // Add first light with default state
  this.addLight();
}
