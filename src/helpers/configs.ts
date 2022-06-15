export default {
  idPrefix: "w_",
  rootElement: "[data-widgets-root]",
  widgetSelector: {
    datasetHtmlAttribute: "data-widget", // for querySelector('[data-widget]')
    datasetKey: "widget", // for dataset.widget
  },
  widgetId: {
    datasetHtmlAttribute: "data-widget-id", // for querySelector('[data-widget-id]')
    datasetKey: "widgetId", // for dataset.widgetId
  },
};
