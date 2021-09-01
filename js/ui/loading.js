const loadingBox = document.getElementById("loading-spinner-container");
const loadingState = {};

/**
 * Add or update a text box describing what is being loaded
 * @param {string} key short name to reference a text box
 * @param {string} text text inside the new text box
 */
const setLoadingInfo = (key, text) => {
  let textBox;
  if (loadingState.hasOwnProperty(key)) {
    textBox = loadingState[key];
  } else {
    textBox = document.createElement("div");
    textBox.classList.add("loading-text");
    loadingBox.appendChild(textBox);

    loadingState[key] = textBox;
  }

  textBox.textContent = text;
};

/**
 * Remove a previously created text box
 * @param key short name to reference a text box
 */
const removeLoadingInfo = (key) => {
  if (loadingState.hasOwnProperty(key)) {
    loadingBox.removeChild(loadingState[key]);
    delete loadingState[key];
  }
};

const removeLoadingOverlay = () => {
  loadingBox.style.display = "none";
};

export { setLoadingInfo, removeLoadingInfo, removeLoadingOverlay };
