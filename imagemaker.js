window.addEventListener(
  "load",
  function (ev) {
    let parts = [];
    let colorGroups;
    // code below this line controls functionality
    // dw about if you're just editing visual assets

    /* relative path to the folder containing part folders */
    const assetsPath = "imagemakerAssets/";

    // DOM Elements
    const canvas = document.getElementById("my-canvas-object");
    const context = canvas.getContext("2d");

    const WIDTH = canvas.width;
    const HEIGHT = canvas.height;

    const randomButton = document.getElementById("random_button");
    const infoButton = document.getElementById("info_button");
    const paletteButton = document.getElementById("palette_button");
    const itemsButton = document.getElementById("items_button");
    const saveButton = document.getElementById("save_button");
    const loading = document.getElementById("loading");
    /* 1d array of part select button DOM elements */
    const partsElements = [];
    /* 2d array of item select button DOM elements */
    const itemsElements = [];

    /* Render layers to this 1st and then canvas so that images render all at 
			 once instead of one layer at a time */
    const workingCanvas = document.createElement("canvas");
    workingCanvas.height = HEIGHT;
    workingCanvas.width = WIDTH;
    const workingContext = workingCanvas.getContext("2d");

    // global state variables
    /* Is the extra info screen currently visible? */
    let infoVisible = false;
    /* Is the palette select menu visible and item select menu invisible? */
    let paletteVisible = false;
    /* Index of part whose menu is currently displayed */
    let selectedPart = 0;
    /* 1d array of colors where selectedColors[i] is the color selected for part i */
    let selectedColors = [];
    /* 1d array of indices of items currently selected,
			 where selectedItemIndex[i] is the index of the selected item for of part i*/
    let selectedItemIndex = [];
    /* 1d array of canvases of items currently selected, 
			 where layerCanvases[i] depicts the selected item of part i in the selected color*/
    const layerCanvases = [];

    init();

    async function init() {
      await initParts();
      initButtons();
      initCanvases();
      await initArrays();
      initPalette();
      await initItemFunctions();
      await randomize();
      await updateSelectedPart(0);
    }

    /**
     * Fetch parts info from parts.json and initialize the parts variable.
     */
    async function initParts(data) {
      const response = await fetch("./parts.json");
      const json = await response.json();
      parts = json.parts;
      colorGroups = json.colorGroups;
    }

    /**
     * Assign canvases to list of layer canvases
     */
    function initCanvases() {
      for (let partIdx = 0; partIdx < parts.length; partIdx++) {
        let cnv = document.createElement("canvas");
        cnv.height = HEIGHT;
        cnv.width = WIDTH;
        layerCanvases.push(cnv);
      }
    }

    /**
     * Assign functions to buttons.
     */
    function initButtons() {
      randomButton.addEventListener("click", randomize);
      paletteButton.addEventListener("click", togglePalette);
      itemsButton.addEventListener("click", toggleItems);
      return null;
    }

    /**
     * Initialize partsElements, itemsElements
     */
    async function initArrays() {
      initPartsElements();
      initItemsElements();
      return null;
    }

    function partColors(partId) {
      if (parts[partId].colorGroup) {
        return colorGroups[parts[partId].colorGroup];
      } else {
        return parts[partId].colors;
      }
    }

    /**
     * Create color select DOM elements for every part's colors
     */
    function initPalette() {
      for (let i = 0; i < parts.length; i++) {
        for (let j = 0; j < partColors(i).length; j++) {
          let colorElement = document.createElement("button");
          colorElement.style.backgroundColor = "#" + partColors(i)[j];
          colorElement.addEventListener("click", function () {
            selectColor(i, j);
          });
          colorElement.id = "color_" + i.toString() + "_" + j.toString();
          colorElement.style.display = "none";
          colorElement.ariaLabel =
            parts[i].folder.toString() + " " + ntc.name(partColors(i)[j])[1];
          document
            .getElementById("colorpalette_list")
            .appendChild(colorElement);
        }
      }
      return null;
    }

    /**
     * Update UI to visibly select a part and display that part's items
     * @param {number} partId The id of the selected part
     */
    async function updateSelectedPart(partId) {
      selectedPart = partId;
      for (let i = 0; i < parts.length; i++) {
        if (i == partId) {
          partsElements[i].classList.add("selected");
        } else {
          partsElements[i].classList.remove("selected");
        }
        for (
          let j = 0;
          j < parts[i].items.length + Number(parts[i].noneAllowed);
          j++
        ) {
          if (i == partId) {
            itemsElements[i][j].style.display = "inline-flex";
          } else {
            itemsElements[i][j].style.display = "none";
          }
        }
      }
      if (partColors(partId).length === 0) {
        paletteButton.style.display = "none";
      } else {
        paletteButton.style.display = "inline-flex";
      }
      updatePalette();
      toggleItems();
      return null;
    }

    /**
     * Display image with randomly selected items
     */
    async function randomize() {
      for (let i = 0; i < parts.length; i++) {
        let noneCount = Number(parts[i].noneAllowed);
        let itemRange = parts[i].items.length + noneCount;
        let itemIndex = Math.floor(Math.random() * itemRange);
        let colorRange = partColors(i).length;
        let colorIndex = Math.floor(Math.random() * colorRange);
        setColorQuietly(i, colorIndex);
        if (noneCount > 0 && itemIndex === 0) {
          selectedItemIndex[i] = null;
        } else {
          selectedItemIndex[i] = itemIndex - noneCount;
        }
        for (j = 0; j < itemRange; j++) {
          if (j == itemIndex) {
            itemsElements[i][j].classList.add("selected");
          } else {
            itemsElements[i][j].classList.remove("selected");
          }
        }
      }
      await renderLayerStack();
      return null;
    }

    /**
     * Assign item select callback functions to partsElements and itemsElements members
     */
    async function initItemFunctions() {
      for (let i = 0; i < parts.length; i++) {
        partsElements[i].addEventListener("click", function () {
          updateSelectedPart(i);
        });
        for (
          let j = 0;
          j < parts[i].items.length + Number(parts[i].noneAllowed);
          j++
        ) {
          itemsElements[i][j].addEventListener("click", function () {
            updateSelectedItem(i, j);
          });
        }
      }
      return null;
    }

    /**
     * Render Images in layerStack to canvas and update save URL
     */
    async function renderLayerStack() {
      clearCanvas(workingCanvas);
      let timer = setTimeout(function () {
        loading.style.display = "block";
      }, 500);

      // create a copy of the parts array that is sorted in the correct layer order, while maintaining the original index
      const sortedParts = parts
        .map((part, index) => {
          return { ...part, originalId: index };
        })
        .sort((a, b) => {
          return a.layerOrder - b.layerOrder;
        });
      // iterate through the sorted parts array and render, referencing the original array info
      for (let partId = 0; partId < parts.length; partId++) {
        const originalId = sortedParts[partId].originalId;
        clearCanvas(layerCanvases[originalId]);
        if (selectedItemIndex[originalId] !== null) {
          await imageFromIndex(
            originalId,
            selectedItemIndex[originalId],
            selectedColors[originalId]
          );
        }
        workingContext.drawImage(layerCanvases[originalId], 0, 0);
      }
      clearCanvas(canvas);
      clearTimeout(timer);
      loading.style.display = "none";
      context.drawImage(workingCanvas, 0, 0);
      await updateSave();
      return null;
    }

    /**
     * Initialize partsElements
     */
    function initPartsElements() {
      for (let i = 0; i < parts.length; i++) {
        let part = document.createElement("button");
        let partIcon = document.createElement("img");
        partIcon.src = assetsPath + parts[i].folder + "/icon.png";
        part.appendChild(partIcon);
        part.id = "part_" + i.toString();
        document.getElementById("parts_list").appendChild(part);
        partIcon.alt = parts[i].folder.toString();
        partsElements[i] = part;
      }
      return null;
    }

    /**
     * Initialize itemsElements
     */
    function initItemsElements() {
      for (let i = 0; i < parts.length; i++) {
        itemsElements.push([]);
        for (let j = 0; j < parts[i].items.length; j++) {
          itemsElements[i].push(null);
        }
      }
      for (let i = 0; i < parts.length; i++) {
        if (parts[i].noneAllowed) {
          let noneButton = document.createElement("button");
          let noneButtonIcon = document.createElement("img");
          noneButtonIcon.src = assetsPath + "none_button.svg";
          noneButton.appendChild(noneButtonIcon);
          noneButtonIcon.alt = "none";
          document.getElementById("itemlist_list").appendChild(noneButton);
          noneButton.style.display = "none";

          itemsElements[i][0] = noneButton;
        }
        for (let j = 0; j < parts[i].items.length; j++) {
          let item = document.createElement("button");
          let itemIcon = document.createElement("img");
          itemIcon.id = "icon_" + i.toString() + "_" + j.toString();
          itemIcon.src =
            assetsPath + parts[i].folder + "/" + parts[i].items[j] + ".png";
          itemIcon.alt = parts[i].folder + " " + parts[i].items[j].toString();
          item.appendChild(itemIcon);
          item.id = "item_" + i.toString() + "_" + j.toString();
          item.style.display = "none";
          document.getElementById("itemlist_list").appendChild(item);
          itemsElements[i][j + Number(parts[i].noneAllowed)] = item;
        }
      }
      return null;
    }

    function clearCanvas(canvas) {
      return canvas
        .getContext("2d")
        .clearRect(0, 0, canvas.width, canvas.height);
    }

    /**
     * Update UI to visibly select a parts[partId].items[itemId] and render it to the canvas
     */
    async function updateSelectedItem(partId, itemId) {
      for (
        let j = 0;
        j < parts[partId].items.length + Number(parts[partId].noneAllowed);
        j++
      ) {
        if (j == itemId) {
          itemsElements[partId][j].classList.add("selected");
        } else {
          itemsElements[partId][j].classList.remove("selected");
        }
      }
      let selectedNone = parts[partId].noneAllowed && itemId == 0;
      if (selectedNone) {
        selectedItemIndex[partId] = null;
      } else {
        selectedItemIndex[partId] = itemId - Number(parts[partId].noneAllowed);
      }
      await renderLayerStack();
      return null;
    }

    /**
     * Update download save button with latest version of the canvas
     */
    async function updateSave() {
      save.href = canvas.toDataURL("image/png");
      return null;
    }

    /**
     * Create a new Image from a path
     *
     * @image {string} the path to the Image source .png
     */
    async function newLayer(image) {
      let myLayer;
      if (image === null) {
        myLayer = null;
      } else {
        myLayer = await loadImage(image);
      }
      return myLayer;
    }

    /**
     * Force newLayer to wait until an image is fully loaded before assigning it to layerStack
     *
     * @path {string} the path to the Image source .png
     */
    function loadImage(path) {
      return new Promise((resolve) => {
        const image = new Image();
        image.addEventListener("load", () => {
          resolve(image);
        });
        image.src = path;
      });
    }

    /**
     * Display info menu if it's visible, hide it if it's invisible
     */
    function toggleInfo() {
      let infoWrap = document.getElementById("info_wrap");
      if (infoVisible) {
        infoWrap.style.display = "none";
        infoVisible = false;
        infoButton.textContent = "?";
      } else {
        infoWrap.style.display = "block";
        infoVisible = true;
        infoButton.textContent = "X";
      }
    }

    /**
     * Display palette of selectedPart
     */
    function updatePalette() {
      for (let i = 0; i < parts.length; i++) {
        for (let j = 0; j < partColors(i).length; j++) {
          if (i === selectedPart) {
            document.getElementById(
              "color_" + i.toString() + "_" + j.toString()
            ).style.display = "inline-block";
          } else {
            document.getElementById(
              "color_" + i.toString() + "_" + j.toString()
            ).style.display = "none";
          }
        }
      }
    }

    /**
     * Display palette menu, hide item menu
     */
    function togglePalette() {
      paletteVisible = true;
      document.getElementById("imagemaker_colorpalette").style.display = "flex";
      document.getElementById("imagemaker_itemlist").style.display = "none";
    }

    /**
     * Display item menu, hide palette menu
     */
    function toggleItems() {
      paletteVisible = false;
      document.getElementById("imagemaker_colorpalette").style.display = "none";
      document.getElementById("imagemaker_itemlist").style.display = "flex";
    }

    /**
     * Helper function to change the color of the an item without triggering a refresh.
     * This is useful for setting the initial color of a part, or any other scenarios
     * in which you want to update multiple parts at once, then trigger a single refresh.
     */
    async function setColorQuietly(partId, colorId) {
      selectedColors[partId] = colorId;
      // check if part is part of a color group
      if (parts[partId].colorGroup) {
        const selectedColorGroup = parts[partId].colorGroup;
        console.log(selectedColorGroup);
        // iterate through all layers
        parts.forEach((part, index) => {
          // if part is part of the same color group
          if (part.colorGroup === selectedColorGroup) {
            selectedColors[index] = colorId;
          }
        });
      }
    }

    /**
     * Helper function to determine if a specific part change should trigger a refresh.
     * Returns true if the part is selected (not null), or if the part is connected to
     * a color group. Otherwise returns null */
    function shouldTriggerRender(partId) {
      if (selectedItemIndex[partId] != null) {
        return true;
      } else {
        if (parts[partId].colorGroup) {
          return true;
        }
      }
      return false;
    }

    /**
     * Change the color of the item selected for part[partId] to part[partId].colors[colorId]
     */
    async function selectColor(partId, colorId) {
      setColorQuietly(partId, colorId);
      if (shouldTriggerRender(partId)) {
        await renderLayerStack();
      }
      return null;
    }

    /**
     * Render parts[partIndex].items[itemIndex] in color
     * parts[partIndex].colors[colorIndex] to layerCanvases[partIndex]
     */
    async function imageFromIndex(partIndex, itemIndex, colorIndex) {
      let imgPath =
        partColors(partIndex).length > 0
          ? assetsPath +
            parts[partIndex].folder +
            "/" +
            parts[partIndex].items[itemIndex] +
            "_" +
            partColors(partIndex)[colorIndex] +
            ".png"
          : assetsPath +
            parts[partIndex].folder +
            "/" +
            parts[partIndex].items[itemIndex] +
            ".png";
      let img = await loadImage(imgPath);
      clearCanvas(layerCanvases[partIndex]);
      ctx = layerCanvases[partIndex].getContext("2d");
      ctx.drawImage(img, 0, 0);
    }
  },
  false
);
