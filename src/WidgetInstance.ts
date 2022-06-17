import { nanoid } from "nanoid";

import Configs from "./configs";

import { convertType } from "./utils";

export type WidgetContext<Props> = {
  id: string;
  $el: HTMLElement;
  props: Props;
};

export type WidgetFunction<T, S> = (
  ctx: WidgetContext<T>,
  helpers: S
) => void | (() => void);

export class WidgetInstance<Props, S> {
  private readonly helpers: any;
  private readonly widgetHandlerFunction: WidgetFunction<Props, S>;
  private props: Props;
  readonly $el: HTMLElement;
  readonly id: string;
  readonly name: string;
  destroy: () => void;

  constructor(
    htmlEl: HTMLElement,
    handler: WidgetFunction<Props, S>,
    helpers: any
  ) {
    this.id = `${Configs.idPrefix}${nanoid(6)}`;
    this.$el = htmlEl;
    this.props = {} as Props;
    this.helpers = helpers;
    this.widgetHandlerFunction = handler;

    this.init();
  }

  private get CONTEXT(): WidgetContext<Props> {
    return {
      id: this.id,
      $el: this.$el,
      props: this.props,
    };
  }

  private get HELPERS() {
    return this.helpers(this.CONTEXT);
  }

  // add the id as data attribute to the current HTMLElement
  private setWidgetIdAttribute() {
    const { $el, id } = this;
    $el.setAttribute(Configs.widgetId.datasetHtmlAttribute, id);
  }

  private collectProps = () => {
    const obj = {} as any;

    Object.values(this.$el.attributes)
      .filter((el) => el.name.startsWith(Configs.htmlProps.prefix))
      .forEach((el) => {
        obj[el.name.substring(1)] = convertType(el.value);
      });

    this.props = obj;
  };

  private init() {
    // add the id as data attribute, it will be used to run the destroy method
    this.setWidgetIdAttribute();

    // collect attributes with `:` prefix
    this.collectProps();

    // call widget function
    const widgetHandler = this.widgetHandlerFunction(
      this.CONTEXT,
      this.HELPERS
    );

    // if the widget return a function use it as destroyer handler
    this.destroy = widgetHandler ? widgetHandler : () => {};
  }
}
