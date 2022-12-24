const uploadImageButton = document.getElementById("upload-image-button");
const uploadImageButtonLabel = document.getElementById(
  "upload-image-button-label"
);
const uploadImageInvalidFileError = document.getElementById(
  "upload-image-invalid-file-error"
);

const imageDisplayMain = document.getElementById("image-display-main");
const imageDisplayContainer = document.getElementById(
  "image-display-container"
);
const imageDisplay = document.getElementById("image-display");
const imageDisplayMap = document.getElementById("image-display-map");

const imageMapPointDescriptionDialog = document.getElementById(
  "image-map-point-description-dialog"
);
const imageMapPointDescriptionDialogInput = document.getElementById(
  "image-map-point-description-dialog-input"
);
const imageMapPointDescriptionDialogCancelButton = document.getElementById(
  "image-map-point-description-dialog-cancel-button"
);
const imageMapPointDescriptionDialogSaveButton = document.getElementById(
  "image-map-point-description-dialog-save-button"
);

const imageDetailsMimeType = document.getElementById("image-details-mime-type");
const imageDetailsImageName = document.getElementById(
  "image-details-image-name"
);
const imageDetailsDimensions = document.getElementById(
  "image-details-dimensions"
);

const pointsTableBody = document.getElementById("points-table-body");

const IMAGE_DISPLAY_MAP_POINT_CIRCLE_RADIUS = 7.5;
const IMAGE_DISPLAY_SOLID_FILTER_WIDTH = 1.1;
const IMAGE_DISPLAY_SOLID_FILTER_HEIGHT = 1.1;

const getRealFileType = (aHeader) => {
  let aFileType = "";

  switch (aHeader) {
    case "89504e47":
      aFileType = "image/png";
      break;
    case "47494638":
      aFileType = "image/gif";
      break;
    case "52494646":
      aFileType = "image/webp";
      break;
    case "ffd8ffe0":
    case "ffd8ffe1":
    case "ffd8ffe2":
    case "ffd8ffe3":
    case "ffd8ffe8":
    case "ffd8ffdb":
      aFileType = "image/jpeg";
      break;
    case "3c3f786d":
      aFileType = "image/svg+xml";
      break;
    default:
      aFileType = "";
      break;
  }

  return aFileType;
};

const validateFileType = (aHeader) => {
  if (!aHeader) return false;

  const aFileType = getRealFileType(aHeader);

  if (!aFileType) return false;

  return true;
};

const getFileHeader = (anImageSrc) => {
  if (!anImageSrc) return;

  const theFirst4Bytes = new Uint8Array(anImageSrc).subarray(0, 4);

  const aHeader = theFirst4Bytes.reduce(
    (acc, byte) => (acc += byte.toString(16)),
    ""
  );

  return aHeader;
};

const getImageDimensions = (anImageSrc) => {
  return new Promise((resolve) => {
    const anImage = new Image();

    const processDimensions = ((theDimensions) => {
      const handler = () => {
        theDimensions = {
          height: anImage.height,
          width: anImage.width,
        };
        resolve(theDimensions);
        anImage.removeEventListener("load", handler);
      };

      return handler;
    })({ height: 0, width: 0 });

    anImage.addEventListener("load", processDimensions);

    anImage.src = anImageSrc;
  });
};

const showImageDisplayMap = () => {
  uploadImageButtonLabel.style.display = "none";
  imageDisplayMain.style.display = "flex";
};

const displayImageDetails = ({ width, height, firstFile, header }) => {
  const mimeType = document.createElement("span");
  const imageName = document.createElement("span");
  const dimensions = document.createElement("span");
  mimeType.textContent = `: ${getRealFileType(header)}`;
  imageName.textContent = `: ${firstFile.name}`;
  dimensions.textContent = `: ${width} x ${height}`;

  imageDetailsMimeType.appendChild(mimeType);
  imageDetailsImageName.appendChild(imageName);
  imageDetailsDimensions.appendChild(dimensions);
};

const getScaleFactor = ({ width, height }) => {
  const maxWidth = imageDisplayContainer.clientWidth;
  const maxHeight = imageDisplayContainer.clientHeight;

  const scale = Math.min(maxWidth / width, maxHeight / height);

  return scale;
};

const setupImageDisplay = ({ imageDimensions, imageSrc }) => {
  const scale = getScaleFactor({
    width: imageDimensions.width,
    height: imageDimensions.height,
  });

  const width = scale * imageDimensions.width;
  const height = scale * imageDimensions.height;

  imageDisplayMap.setAttribute("viewbox", `0 0 ${width} ${height}`);
  imageDisplayMap.setAttribute("height", height);
  imageDisplayMap.setAttribute("width", width);
  imageDisplay.setAttribute("height", height);
  imageDisplay.setAttribute("width", width);
  imageDisplay.setAttribute("href", imageSrc);
};

uploadImageButton.addEventListener("change", (event) => {
  const aFileReader = new FileReader();

  if (uploadImageButton.files.length === 0) return;

  const [firstFile] = uploadImageButton.files;

  let isValid;
  let header = "";
  aFileReader.addEventListener("load", async (event) => {
    const imageSrc = event.target.result;
    if (isValid === undefined) {
      header = getFileHeader(imageSrc);
      isValid = validateFileType(header);
      return aFileReader.readAsDataURL(firstFile);
    }

    if (!isValid) return (uploadImageInvalidFileError.style.display = "block");

    const imageDimensions = await getImageDimensions(imageSrc);

    showImageDisplayMap();

    displayImageDetails({
      width: imageDimensions.width,
      height: imageDimensions.height,
      firstFile,
      header,
    });

    setupImageDisplay({ imageDimensions, imageSrc });
  });
  aFileReader.readAsArrayBuffer(firstFile);
});

const getImageDisplayMapPointCircle = ({ mapPoint, mapPointIndex }) => {
  const aCircle = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "circle"
  );

  aCircle.setAttribute("cx", mapPoint.x);
  aCircle.setAttribute("cy", mapPoint.y);
  aCircle.setAttribute("r", IMAGE_DISPLAY_MAP_POINT_CIRCLE_RADIUS);
  aCircle.setAttribute("fill", "red");
  aCircle.setAttribute("id", `image-display-map-point-point-${mapPointIndex}`);
  aCircle.classList.add("image-display-map-point");

  return aCircle;
};

const getImageDisplayMapPointTooltip = ({ mapPoint, mapPointIndex }) => {
  const TOOLTIP_OFFSET = 15;

  const aTooltip = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "text"
  );

  aTooltip.setAttribute("x", mapPoint.x + TOOLTIP_OFFSET);
  aTooltip.setAttribute("y", mapPoint.y + TOOLTIP_OFFSET);
  aTooltip.setAttribute(
    "id",
    `image-display-map-point-tooltip-${mapPointIndex}`
  );
  aTooltip.classList.add("image-display-map-point-text");
  aTooltip.textContent = mapPoint.text;
  aTooltip.setAttribute("filter", "url(#solid)");

  return aTooltip;
};

const showTooltip = ({ aTooltip }) => {
  const handler = () => {
    const textSVGRect = aTooltip.getBBox();
    const imageDisplayMapBoundingClient =
      imageDisplayMap.getBoundingClientRect();

    if (
      textSVGRect.x +
        IMAGE_DISPLAY_MAP_POINT_CIRCLE_RADIUS * 3 +
        textSVGRect.width * IMAGE_DISPLAY_SOLID_FILTER_WIDTH >
      imageDisplayMapBoundingClient.width
    ) {
      aTooltip.setAttribute(
        "dx",
        -(
          IMAGE_DISPLAY_MAP_POINT_CIRCLE_RADIUS * 3 +
          textSVGRect.width * IMAGE_DISPLAY_SOLID_FILTER_WIDTH
        )
      );
    }

    if (
      textSVGRect.y + textSVGRect.height * IMAGE_DISPLAY_SOLID_FILTER_HEIGHT >
      imageDisplayMapBoundingClient.height
    ) {
      aTooltip.setAttribute(
        "dy",
        -(textSVGRect.height * IMAGE_DISPLAY_SOLID_FILTER_WIDTH)
      );
    }

    if (aTooltip.textContent.length > 0) {
      aTooltip.style.opacity = 1;
    }
  };

  return handler;
};

const hideTooltip = ({ aTooltip }) => {
  const handler = () => {
    aTooltip.style.opacity = 0;
  };

  return handler;
};

const showImageMapPointDescriptionDialog = ({ x, y }) => {
  const FIXED_IMAGE_MAP_POINT_DESCRIPTION_DIALOG_WIDTH = 220;

  imageMapPointDescriptionDialog.style.top = `${y}px`;
  imageMapPointDescriptionDialog.style.left = `${x}px`;
  if (x + FIXED_IMAGE_MAP_POINT_DESCRIPTION_DIALOG_WIDTH > window.innerWidth) {
    imageMapPointDescriptionDialog.style.transform = `translateX(-${FIXED_IMAGE_MAP_POINT_DESCRIPTION_DIALOG_WIDTH}px)`;
  } else {
    imageMapPointDescriptionDialog.style.transform = "none";
  }
  imageMapPointDescriptionDialog.showModal();
};

const mapPoints = [];
imageDisplayMap.addEventListener("click", (event) => {
  const mapPointIndex = mapPoints.length;
  const mapPoint = {
    id: `image-display-map-point-${mapPointIndex}`,
    x: event.layerX,
    y: event.layerY,
    text: "",
  };

  mapPoints.push(mapPoint);

  const aPointGroup = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "g"
  );
  aPointGroup.setAttribute(
    "id",
    `image-display-map-point-group-${mapPointIndex}`
  );

  const aTooltip = getImageDisplayMapPointTooltip({ mapPoint, mapPointIndex });

  const aCircle = getImageDisplayMapPointCircle({ mapPoint, mapPointIndex });

  aCircle.addEventListener("mouseover", showTooltip({ aTooltip }));

  aCircle.addEventListener("mouseout", hideTooltip({ aTooltip }));

  aPointGroup.appendChild(aCircle);
  aPointGroup.appendChild(aTooltip);

  imageDisplayMap.appendChild(aPointGroup);

  showImageMapPointDescriptionDialog({ x: event.x, y: event.y });
});

const imageMapPointDescriptionDialogCancel = () => {
  imageMapPointDescriptionDialogInput.value = "";
  imageMapPointDescriptionDialog.close();
};

const imageMapPointDescriptionDialogSave = () => {
  imageMapPointDescriptionDialog.close();
};

imageMapPointDescriptionDialogCancelButton.addEventListener(
  "click",
  imageMapPointDescriptionDialogCancel
);

imageMapPointDescriptionDialogSaveButton.addEventListener(
  "click",
  imageMapPointDescriptionDialogSave
);

const addImageMapPointToPointsTable = ({ x, y, text }) => {
  const tableRow = document.createElement("tr");

  [
    { class: "table-data-numbers", data: x },
    { class: "table-data-numbers", data: y },
    { class: "table-data-text", data: text },
  ].forEach((val) => {
    const tableData = document.createElement("td");
    tableData.textContent = val.data;
    tableData.classList.add(val.class);
    tableRow.appendChild(tableData);
  });

  pointsTableBody.appendChild(tableRow);
};

imageMapPointDescriptionDialog.addEventListener("close", (event) => {
  const textContent = imageMapPointDescriptionDialogInput.value || "";
  const trimmedTextContent = textContent.trim();
  const lastMapPointIndex = mapPoints.length - 1;
  const lastMapPoint = mapPoints[lastMapPointIndex];

  if (textContent === "") {
    imageDisplayMap.removeChild(
      document.getElementById(
        `image-display-map-point-group-${lastMapPointIndex}`
      )
    );
    return mapPoints.pop();
  }

  document.getElementById(
    `image-display-map-point-tooltip-${lastMapPointIndex}`
  ).textContent = trimmedTextContent;
  lastMapPoint.text = trimmedTextContent;

  addImageMapPointToPointsTable(lastMapPoint);

  imageMapPointDescriptionDialogInput.value = "";
});
