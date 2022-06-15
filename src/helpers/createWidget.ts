import Configs from "./configs";

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
      rootTag.dataset[key] = value;
    }
  }

  return rootTag;
};
