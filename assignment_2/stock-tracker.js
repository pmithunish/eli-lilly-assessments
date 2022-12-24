const tickInput = document.getElementById("tick-input");
const tickError = document.getElementById("tick-error");
const trackTickSymbolButton = document.getElementById(
  "track-tick-symbol-button"
);
const tickInputSection = document.getElementById("tick-input-section");
const stockTrackerSection = document.getElementById("stock-tracker-section");

const stockTrackerLineGraphContainer = document.getElementById(
  "stock-tracker-line-graph-container"
);
const stockTrackerLineGraph = document.getElementById(
  "stock-tracker-line-graph"
);

const INTERVAL = 1;
const TICK_INTERVAL_IN_MS = 1 * 60 * 1000;
const DEMO_TICK_INTERVAL_IN_MS = TICK_INTERVAL_IN_MS / 100; // Kept at 600 for demo purpose;
const INVALID_TICK_ERROR_MESSAGE =
  "Invalid Stock Tick Symbol entered. Please type one of the above Stock Tick Symbols.";
const EMPTY_TICK_ERROR_MESSAGE =
  "Please enter a Tick Symbol in the above input box to track it.";

const META_DATA_KEYS_MAP = {
  info: { label: "Information", key: "1. Information" },
  symbol: { label: "Symbol", key: "2. Symbol" },
  lastRefresh: { label: "Last Refreshed", key: "3. Last Refreshed" },
  interval: { label: "Interval", key: "4. Interval" },
  outputSize: { label: "Output Size", key: "5. Output Size" },
  timezone: { label: "Time Zone", key: "6. Time Zone" },
};

const TIME_SERIES_DATA_KEYS_MAP = {
  open: "1. open",
  high: "2. high",
  low: "3. low",
  close: "4. close",
  volume: "5. volume",
  datetime: "datetime",
};

const processData = ({ rawData, interval }) => {
  const timeSeriesKey = `Time Series (${interval}min)`;

  const processedData = Object.keys(rawData[timeSeriesKey])
    .map((datetime) => ({
      ...{
        open: rawData[timeSeriesKey][datetime][TIME_SERIES_DATA_KEYS_MAP.open],
        high: rawData[timeSeriesKey][datetime][TIME_SERIES_DATA_KEYS_MAP.high],
        low: rawData[timeSeriesKey][datetime][TIME_SERIES_DATA_KEYS_MAP.low],
        close:
          rawData[timeSeriesKey][datetime][TIME_SERIES_DATA_KEYS_MAP.close],
        volume:
          rawData[timeSeriesKey][datetime][TIME_SERIES_DATA_KEYS_MAP.volume],
      },
      datetime,
    }))
    .splice(6) // NOTE: Removing observed inconsistent data
    .reverse();

  return processedData;
};

const getMetaData = ({ rawData }) => {
  const metaDataKey = "Meta Data";

  const metaData = {
    [META_DATA_KEYS_MAP.info.label]:
      rawData[metaDataKey][META_DATA_KEYS_MAP.info.key],
    [META_DATA_KEYS_MAP.symbol.label]:
      rawData[metaDataKey][META_DATA_KEYS_MAP.symbol.key],
    [META_DATA_KEYS_MAP.lastRefresh.label]:
      rawData[metaDataKey][META_DATA_KEYS_MAP.lastRefresh.key],
    [META_DATA_KEYS_MAP.interval.label]:
      rawData[metaDataKey][META_DATA_KEYS_MAP.interval.key],
    [META_DATA_KEYS_MAP.outputSize.label]:
      rawData[metaDataKey][META_DATA_KEYS_MAP.outputSize.key],
    [META_DATA_KEYS_MAP.timezone.label]:
      rawData[metaDataKey][META_DATA_KEYS_MAP.timezone.key],
  };

  return metaData;
};

const fetchData = async ({ aTickSymbol }) => {
  try {
    const API_KEY = "LWB4TOPKZZ100K0B";
    const url = `https://www.alphavantage.co/query?function=TIME_SERIES_INTRADAY&symbol=${aTickSymbol}&interval=${INTERVAL}min&apikey=${API_KEY}`;

    const response = await fetch(url);
    const rawData = await response.json();

    const processedData = processData({ rawData, interval: INTERVAL });
    const metaData = getMetaData({ rawData });

    return { processedData, metaData };
  } catch (error) {
    throw error;
  }
};

const showTickInputError = ({ anErrorMessage }) => {
  tickError.textContent = anErrorMessage;
  tickError.style.display = "block";
};

const showStockTracker = () => {
  tickInputSection.style.display = "none";
  stockTrackerSection.style.display = "flex";
};

trackTickSymbolButton.addEventListener("click", async () => {
  if (tickInput.value === "")
    return showTickInputError({ anErrorMessage: EMPTY_TICK_ERROR_MESSAGE });

  const aTickSymbol = tickInput.value.trim();

  try {
    const { processedData, metaData } = await fetchData({
      aTickSymbol,
    });
    showStockTracker();
    drawLineGraph({ processedData, metaData });
  } catch (error) {
    return showTickInputError({ anErrorMessage: INVALID_TICK_ERROR_MESSAGE });
  }
});

const leftMargin = 80;
const bottomMargin = 130;
const rightMargin = 50;
const topMargin = 20;
const noOfPointsOnYAxis = 6;
const noOfPointsOnXAxis = noOfPointsOnYAxis * 10;

const getLineGraphLineCordinates = ({
  high,
  low,
  index,
  shiftedPlotPoint,
  previousPoint,
  currentPoint,
  stockTrackerLineGraphContainerWidth,
  stockTrackerLineGraphContainerHeight,
}) => {
  const x1 =
    leftMargin +
    index *
      ((stockTrackerLineGraphContainerWidth - leftMargin - rightMargin) /
        noOfPointsOnXAxis);
  const y1 =
    stockTrackerLineGraphContainerHeight -
    bottomMargin -
    ((stockTrackerLineGraphContainerHeight - topMargin - bottomMargin) /
      (high - low)) *
      (previousPoint.open - low);
  const x2 =
    leftMargin +
    (!shiftedPlotPoint && index === 0 ? 0 : index + 1) *
      ((stockTrackerLineGraphContainerWidth - leftMargin - rightMargin) /
        noOfPointsOnXAxis);
  const y2 =
    stockTrackerLineGraphContainerHeight -
    bottomMargin -
    ((stockTrackerLineGraphContainerHeight - topMargin - bottomMargin) /
      (high - low)) *
      (currentPoint.open - low);

  return { x1, y1, x2, y2 };
};

const getLineGraphLineSegment = ({ x1, y1, x2, y2, id }) => {
  const LINE_SEGMENT_STROKE_WIDTH = 2;
  const LINE_SEGMENT_STROKE = "black";

  const aLineSegment = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "line"
  );

  aLineSegment.setAttribute("x1", x1);
  aLineSegment.setAttribute("y1", y1);
  aLineSegment.setAttribute("x2", x2);
  aLineSegment.setAttribute("y2", y2);
  aLineSegment.setAttribute("stroke", LINE_SEGMENT_STROKE);
  aLineSegment.setAttribute("stroke-width", LINE_SEGMENT_STROKE_WIDTH);
  aLineSegment.setAttribute("id", `stock-tracker-line-segment-${id}`);

  return aLineSegment;
};

const getLineGraphTooltip = ({ currentPoint, x2, id }) => {
  const TOOLTIP_OPACITY = 0;
  const TOOLTIP_FONT_SIZE = 12;

  const aTooltip = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "text"
  );
  aTooltip.setAttribute("x", x2);
  aTooltip.setAttribute("y", topMargin);
  aTooltip.style.opacity = TOOLTIP_OPACITY;
  aTooltip.style.fontSize = TOOLTIP_FONT_SIZE;
  aTooltip.setAttribute("dy", 0);
  aTooltip.setAttribute("id", `stock-tracker-tooltip-${id}`);
  Object.keys(currentPoint).map((key, index) => {
    const aDetail = getTickDetail({
      x: x2,
      index,
      key,
      tickData: currentPoint,
    });

    aTooltip.appendChild(aDetail);
  });

  return aTooltip;
};

const getLineGraphTooltipLine = ({
  stockTrackerLineGraphContainerWidth,
  stockTrackerLineGraphContainerHeight,
  index,
  id,
}) => {
  const TOOLTIP_LINE_OPACITY = 0.01;
  const TOOLTIP_LINE_STROKE_WIDTH = 15;
  const TOOLTIP_LINE_STROKE = "black";

  const aTooltipLine = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "line"
  );
  aTooltipLine.style.opacity = TOOLTIP_LINE_OPACITY;
  aTooltipLine.setAttribute("stroke", TOOLTIP_LINE_STROKE);
  aTooltipLine.setAttribute("stroke-width", TOOLTIP_LINE_STROKE_WIDTH);
  aTooltipLine.setAttribute("id", `stock-tracker-tooltip-line-${id}`);
  aTooltipLine.setAttribute(
    "x1",
    leftMargin +
      (index + 1) *
        ((stockTrackerLineGraphContainerWidth - leftMargin - rightMargin) /
          noOfPointsOnXAxis)
  );
  aTooltipLine.setAttribute("y1", topMargin);
  aTooltipLine.setAttribute(
    "x2",
    leftMargin +
      (index + 1) *
        ((stockTrackerLineGraphContainerWidth - leftMargin - rightMargin) /
          noOfPointsOnXAxis)
  );
  aTooltipLine.setAttribute(
    "y2",
    stockTrackerLineGraphContainerHeight - bottomMargin
  );

  return aTooltipLine;
};

const getTickDetail = ({ x, key, index, tickData }) => {
  const tickDetail = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "tspan"
  );

  tickDetail.setAttribute("x", x);
  tickDetail.setAttribute("dy", `${index === 0 ? 0.6 : 1.2}em`);
  tickDetail.textContent = ` ${key}: ${
    key === TIME_SERIES_DATA_KEYS_MAP.datetime ||
    key === META_DATA_KEYS_MAP.lastRefresh.label ||
    isNaN(parseFloat(tickData[key]))
      ? tickData[key]
      : parseFloat(tickData[key]).toFixed(2)
  } `;

  return tickDetail;
};

const getCurrentTickDetails = ({
  stockTrackerLineGraphContainerHeight,
  stockTrackerLineGraphContainerWidth,
  tickData,
}) => {
  const CURRENT_TICK_DETAILS_FONT_SIZE = 15;
  const CURRENT_TICK_DETAILS_Y_OFFSET = 15;
  const CURRENT_TICK_DETAILS_X_OFFSET = 250;

  const currentTick = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "g"
  );
  currentTick.setAttribute("id", "stock-tracker-current-point");

  const currentTickDetails = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "text"
  );
  currentTickDetails.setAttribute("id", "stock-tracker-current-point-details");

  const x = stockTrackerLineGraphContainerWidth - CURRENT_TICK_DETAILS_X_OFFSET;
  currentTickDetails.setAttribute("x", x);
  currentTickDetails.setAttribute(
    "y",
    stockTrackerLineGraphContainerHeight -
      bottomMargin +
      CURRENT_TICK_DETAILS_Y_OFFSET
  );
  currentTickDetails.style.fontSize = CURRENT_TICK_DETAILS_FONT_SIZE;
  currentTickDetails.setAttribute("dy", 0);

  Object.keys(tickData).map((key, i) => {
    const currentPointDetail = getTickDetail({
      x,
      index: i,
      key,
      tickData,
    });
    currentTickDetails.appendChild(currentPointDetail);
  });

  currentTick.appendChild(currentTickDetails);

  return currentTick;
};

const showToolTip = ({ aTooltip, x2, stockTrackerLineGraphContainerWidth }) => {
  const handler = () => {
    const { width: tickDetailsWidth } = aTooltip.getBBox();

    aTooltip.style.opacity = 1;

    aTooltip.childNodes.forEach((node) =>
      node.setAttribute(
        "dx",
        x2 + tickDetailsWidth > stockTrackerLineGraphContainerWidth
          ? -(tickDetailsWidth - (stockTrackerLineGraphContainerWidth - x2))
          : 0
      )
    );
    aTooltip.setAttribute(
      "dx",
      x2 + tickDetailsWidth > stockTrackerLineGraphContainerWidth
        ? -(tickDetailsWidth - (stockTrackerLineGraphContainerWidth - x2))
        : 0
    );
  };
  return handler;
};

const hideToolTip = ({ aTooltip }) => {
  const handler = () => {
    aTooltip.style.opacity = 0;
  };
  return handler;
};

const replaceLineGraphElement = ({ id, newElement }) => {
  const oldElement = document.getElementById(id);
  oldElement.parentNode.replaceChild(newElement, oldElement);
};

const getStockTrackerHighLowValues = ({ plotPoints }) => {
  const reducedSet = Array.from(
    plotPoints
      .reduce((acc, point) => {
        return acc.add(Math.floor(point.open));
      }, new Set())
      .values()
  ).sort((a, b) => a - b);

  let high;
  let low;
  if (reducedSet.length === 1) {
    high = reducedSet[0] + 1 + 3;
    low = reducedSet[0] - 3;
  }
  if (reducedSet.length > 1) {
    high = reducedSet[reducedSet.length - 1] + 1 + 3;
    low = reducedSet[0] - 3;
  }

  return { high, low };
};

const setupStrokeTrackerLineGraph = ({
  stockTrackerLineGraphContainerHeight,
  stockTrackerLineGraphContainerWidth,
}) => {
  stockTrackerLineGraph.setAttribute(
    "viewbox",
    `0 0 ${stockTrackerLineGraphContainerWidth} ${stockTrackerLineGraphContainerHeight}`
  );
  stockTrackerLineGraph.setAttribute(
    "height",
    stockTrackerLineGraphContainerHeight
  );
  stockTrackerLineGraph.setAttribute(
    "width",
    stockTrackerLineGraphContainerWidth
  );
};

const drawLineGraphAxis = ({
  stockTrackerLineGraphContainerHeight,
  stockTrackerLineGraphContainerWidth,
}) => {
  const AXIS_OPACITY = 0.2;
  const AXIS_STROKE_WIDTH = 0.25;
  const AXIS_STROKE = "black";

  const yAxis = document.createElementNS("http://www.w3.org/2000/svg", "g");
  new Array(noOfPointsOnYAxis).fill(undefined).map((val, index) => {
    const aLine = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "line"
    );

    aLine.setAttribute("opacity", AXIS_OPACITY);
    aLine.setAttribute("stroke-width", AXIS_STROKE_WIDTH);
    aLine.setAttribute("stroke", AXIS_STROKE);
    aLine.setAttribute("x1", leftMargin);
    aLine.setAttribute(
      "y1",
      stockTrackerLineGraphContainerHeight -
        bottomMargin -
        index *
          ((stockTrackerLineGraphContainerHeight - topMargin - bottomMargin) /
            noOfPointsOnYAxis)
    );
    aLine.setAttribute("x2", stockTrackerLineGraphContainerWidth - rightMargin);
    aLine.setAttribute(
      "y2",
      stockTrackerLineGraphContainerHeight -
        bottomMargin -
        index *
          ((stockTrackerLineGraphContainerHeight - topMargin - bottomMargin) /
            noOfPointsOnYAxis)
    );

    yAxis.appendChild(aLine);
  });

  stockTrackerLineGraph.appendChild(yAxis);

  const xAxis = document.createElementNS("http://www.w3.org/2000/svg", "g");
  new Array(noOfPointsOnXAxis).fill(undefined).map((val, index) => {
    const aLine = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "line"
    );

    aLine.setAttribute("opacity", AXIS_OPACITY);
    aLine.setAttribute("stroke-width", AXIS_STROKE_WIDTH);
    aLine.setAttribute("stroke", AXIS_STROKE);
    aLine.setAttribute(
      "x1",
      leftMargin +
        (index + 1) *
          ((stockTrackerLineGraphContainerWidth - leftMargin - rightMargin) /
            noOfPointsOnXAxis)
    );
    aLine.setAttribute("y1", topMargin);
    aLine.setAttribute(
      "x2",
      leftMargin +
        (index + 1) *
          ((stockTrackerLineGraphContainerWidth - leftMargin - rightMargin) /
            noOfPointsOnXAxis)
    );
    aLine.setAttribute(
      "y2",
      stockTrackerLineGraphContainerHeight - bottomMargin
    );

    xAxis.appendChild(aLine);
  });

  stockTrackerLineGraph.appendChild(xAxis);
};

const displayMetaData = ({
  stockTrackerLineGraphContainerHeight,
  metaData,
}) => {
  const CURRENT_TICK_DETAILS_FONT_SIZE = 15;
  const CURRENT_TICK_DETAILS_Y_OFFSET = 15;
  const CURRENT_TICK_DETAILS_X_OFFSET = 15;

  const metaDataGroup = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "g"
  );
  metaDataGroup.setAttribute("id", "stock-tracker-meta-data");

  const metaDataDetails = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "text"
  );
  metaDataDetails.setAttribute("id", "stock-tracker-current-point-details");

  const x = 0 + CURRENT_TICK_DETAILS_X_OFFSET;
  metaDataDetails.setAttribute("x", x);
  metaDataDetails.setAttribute(
    "y",
    stockTrackerLineGraphContainerHeight -
      bottomMargin +
      CURRENT_TICK_DETAILS_Y_OFFSET
  );
  metaDataDetails.style.fontSize = CURRENT_TICK_DETAILS_FONT_SIZE;
  metaDataDetails.setAttribute("dy", 0);

  Object.keys(metaData).map((key, index) => {
    const metaDataDetail = getTickDetail({
      x,
      index,
      key,
      tickData: metaData,
    });
    metaDataDetails.appendChild(metaDataDetail);
  });

  metaDataGroup.appendChild(metaDataDetails);
  stockTrackerLineGraph.appendChild(metaDataGroup);
};

const drawLineGraphYAxisLabels = ({
  stockTrackerLineGraphContainerHeight,
  high,
  low,
}) => {
  const LABEL_OFFSET = 60;
  const LABEL_OPACITY = 0.5;
  const LABEL_FONT_SIZE = 12;

  const yAxisLabels = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "g"
  );
  yAxisLabels.setAttribute("id", "stock-tracker-y-axis-labels");

  new Array(noOfPointsOnYAxis).fill(undefined).map((val, index) => {
    const aLabel = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "text"
    );

    aLabel.setAttribute("x", leftMargin - LABEL_OFFSET);
    aLabel.setAttribute("opacity", LABEL_OPACITY);
    aLabel.style.fontSize = LABEL_FONT_SIZE;
    aLabel.setAttribute(
      "y",
      stockTrackerLineGraphContainerHeight -
        bottomMargin -
        index *
          ((stockTrackerLineGraphContainerHeight - topMargin - bottomMargin) /
            noOfPointsOnYAxis)
    );
    aLabel.textContent = (
      low +
      index * ((high - low) / noOfPointsOnYAxis)
    ).toFixed(2);

    yAxisLabels.appendChild(aLabel);
  });

  replaceLineGraphElement({
    id: "stock-tracker-y-axis-labels",
    newElement: yAxisLabels,
  });
};

const drawLineGraph = ({ processedData, metaData }) => {
  const {
    width: stockTrackerLineGraphContainerWidth,
    height: stockTrackerLineGraphContainerHeight,
  } = stockTrackerLineGraphContainer.getBoundingClientRect();

  setupStrokeTrackerLineGraph({
    stockTrackerLineGraphContainerWidth,
    stockTrackerLineGraphContainerHeight,
  });

  drawLineGraphAxis({
    stockTrackerLineGraphContainerWidth,
    stockTrackerLineGraphContainerHeight,
  });

  displayMetaData({
    stockTrackerLineGraphContainerHeight,
    metaData,
  });

  const plotPoints = [processedData[0]];
  processedData.shift();

  let index = 0;

  const tickInterval = setInterval(() => {
    if (index === processedData.length) return clearInterval(tickInterval);

    let shiftedPlotPoint;
    if (plotPoints.length === noOfPointsOnXAxis) {
      shiftedPlotPoint = plotPoints[0];
      plotPoints.shift();
    }

    const currentTickDetails = getCurrentTickDetails({
      stockTrackerLineGraphContainerWidth,
      stockTrackerLineGraphContainerHeight,
      tickData: processedData[index],
    });

    replaceLineGraphElement({
      id: "stock-tracker-current-point",
      newElement: currentTickDetails,
    });

    plotPoints.push(processedData[index]);
    index++;

    const { high, low } = getStockTrackerHighLowValues({ plotPoints });

    drawLineGraphYAxisLabels({
      stockTrackerLineGraphContainerHeight,
      high,
      low,
    });

    const stockTrackerGraphLine = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "g"
    );
    stockTrackerGraphLine.setAttribute("id", "stock-tracker-line");

    const stockTrackerTooltips = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "g"
    );
    stockTrackerTooltips.setAttribute("id", "stock-tracker-tooltip");

    const stockTrackerTooltipLine = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "g"
    );
    stockTrackerTooltipLine.setAttribute("id", "stock-tracker-tooltip-line");

    plotPoints.map((currentPoint, index) => {
      const previousPoint =
        index === 0
          ? shiftedPlotPoint || plotPoints[index]
          : plotPoints[index - 1];
      const { x1, y1, x2, y2 } = getLineGraphLineCordinates({
        high,
        low,
        index,
        shiftedPlotPoint,
        previousPoint,
        currentPoint,
        stockTrackerLineGraphContainerWidth,
        stockTrackerLineGraphContainerHeight,
      });

      const aLineSegment = getLineGraphLineSegment({
        x1,
        y1,
        x2,
        y2,
        id: index,
      });
      stockTrackerGraphLine.appendChild(aLineSegment);

      const aTooltip = getLineGraphTooltip({ currentPoint, x2, id: index });
      stockTrackerTooltips.appendChild(aTooltip);

      const aTooltipLine = getLineGraphTooltipLine({
        stockTrackerLineGraphContainerWidth,
        stockTrackerLineGraphContainerHeight,
        id: index,
        index,
      });
      stockTrackerTooltipLine.appendChild(aTooltipLine);

      aTooltipLine.addEventListener(
        "mouseover",
        showToolTip({ aTooltip, x2, stockTrackerLineGraphContainerWidth })
      );

      aTooltipLine.addEventListener("mouseout", hideToolTip({ aTooltip }));
    });

    replaceLineGraphElement({
      id: "stock-tracker-tooltip-line",
      newElement: stockTrackerTooltipLine,
    });

    replaceLineGraphElement({
      id: "stock-tracker-tooltip",
      newElement: stockTrackerTooltips,
    });

    replaceLineGraphElement({
      id: "stock-tracker-line",
      newElement: stockTrackerGraphLine,
    });
  }, DEMO_TICK_INTERVAL_IN_MS);
};
