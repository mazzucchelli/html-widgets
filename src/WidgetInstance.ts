import { nanoid } from "nanoid";

import Configs from "./configs";

import { convertType } from "./utils";

export type WidgetContext<Props> = {
  $el: HTMLElement;
  id: string;
  props: Props;
};

export type WidgetFunction<T, S> = (
  ctx: WidgetContext<T>,
  helpers: S
) => void | (() => void);

export class WidgetInstance<Props, S> {
  private readonly $htmlEl: HTMLElement;
  private readonly destroy: () => void;
  public readonly id: string;
  private props: Props;

  constructor(
    htmlEl: HTMLElement,
    handler: WidgetFunction<Props, S>,
    helpers: any
  ) {
    this.id = `${Configs.idPrefix}${nanoid(6)}`;
    this.$htmlEl = htmlEl;
    this.props = {} as Props;

    htmlEl.setAttribute(Configs.widgetId.datasetHtmlAttribute, this.id);

    this.collectProps();

    const customHelpers = helpers(htmlEl);
    const destroyFun = handler(
      {
        $el: this.$htmlEl,
        props: this.props,
        id: this.id,
      },
      customHelpers
    );

    this.destroy = destroyFun ? destroyFun : () => {};
  }

  get $el() {
    return this.$htmlEl;
  }

  collectProps = () => {
    const obj = {} as any;

    Object.values(this.$htmlEl.attributes)
      .filter((el) => el.name.startsWith(Configs.htmlProps.prefix))
      .forEach((el) => {
        obj[el.name.substring(1)] = convertType(el.value);
      });

    this.props = obj;
  };
}
