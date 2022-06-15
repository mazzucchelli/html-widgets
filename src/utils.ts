import Configs from "./configs";

export const convertType = (value: any) => {
  if (
    (value.startsWith("{") && value.endsWith("}")) ||
    (value.startsWith("[") && value.endsWith("]"))
  ) {
    return JSON.parse(value.replace(/'/g, '"'));
  } else {
    switch (value) {
      case "false":
        return false;
      case "true":
        return true;
      case "null":
        return null;
      default:
        return !isNaN(value) ? parseFloat(value) : value;
    }
  }
};

interface createWidgetParams {
  name?: string;
  className?: string;
  template?: string;
  tag?: string;
  props?: { [x: string]: string };
}

export const createWidget = ({
  name,
  template,
  tag,
  props,
  className,
}: createWidgetParams) => {
  const rootTag = document.createElement(tag || "div");

  if (name) rootTag.dataset[Configs.widgetSelector.datasetKey] = name;

  if (className) {
    rootTag.classList.add(className);
  }

  if (template) {
    rootTag.innerHTML = template;
  }

  if (props) {
    for (const [key, value] of Object.entries(props)) {
      rootTag.setAttribute(`${Configs.htmlProps.prefix}${key}`, value);
    }
  }

  return rootTag;
};
