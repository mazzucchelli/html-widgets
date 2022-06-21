import { nanoid } from "nanoid";

import Configs from "./configs";
import { convertType } from "./utils";

export type WidgetContext<Props> = {
  id: string;
  $el: HTMLElement;
  props: Props;
  propEffect: (propName: keyof Props, effect: () => void) => any;
};

export type WidgetFunction<T, S> = (
  ctx: WidgetContext<T>,
  plugins: S
) => void | (() => void);

type PluginFunction<T, S> = (ctx: WidgetContext<T>) => S;
export class WidgetInstance<Props, S> {
  private readonly plugins: PluginFunction<Props, S>;
  private readonly widgetHandlerFunction: WidgetFunction<Props, S>;
  props: Props;
  readonly $el: HTMLElement;
  effects: any;
  observables: any;
  readonly id: string;
  readonly name: string;
  destroy: () => void;

  constructor(
    htmlEl: HTMLElement,
    handler: WidgetFunction<Props, S>,
    plugins: PluginFunction<Props, S>
  ) {
    this.id = `${Configs.idPrefix}${nanoid(6)}`;
    this.$el = htmlEl;

    const p = this.collectProps();
    this.props = p;

    this.plugins = plugins;
    this.widgetHandlerFunction = handler;
    this.observables = {};

    this.init();
  }

  propEffect = (propName: keyof Props, effect: () => void) => {
    const obj = {
      current: this.props[propName],
    };

    const handler = {
      get(obj: any, prop: any) {
        return obj[prop];
      },
      set(obj: any, prop: any, value: any) {
        obj[prop] = value;
        effect();
        return true;
      },
    };

    const proxy = new Proxy(obj, handler);
    this.observables[propName] = proxy;

    return [
      this.observables[propName],
      (newValue: any) => {
        this.$el.setAttribute(`:${String(propName)}`, newValue);
      },
    ];
  };

  watchAttributes() {
    const observer = new MutationObserver((mutationsList) => {
      for (let mutation of mutationsList) {
        if (mutation.type !== "attributes") return;
        const prop = mutation.attributeName.substring(1);
        const newValue = convertType(
          this.$el.getAttribute(mutation.attributeName)
        );
        this.observables[prop].current = newValue;
      }
    });

    observer.observe(this.$el, {
      attributes: true,
      childList: false,
      subtree: false,
    });
  }

  private get CONTEXT(): WidgetContext<Props> {
    return {
      id: this.id,
      $el: this.$el,
      props: this.props,
      propEffect: this.propEffect,
    };
  }

  private get PLUGINS() {
    return this.plugins(this.CONTEXT);
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

    return obj;
  };

  private init() {
    // add the id as data attribute, it will be used to run the destroy method
    this.setWidgetIdAttribute();

    this.watchAttributes();

    // call widget function
    const widgetHandler = this.widgetHandlerFunction(
      this.CONTEXT,
      this.PLUGINS
    );

    // if the widget return a function use it as destroyer handler
    this.destroy = widgetHandler ? widgetHandler : () => {};
  }
}
