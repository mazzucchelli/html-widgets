import { nanoid } from "nanoid";
import { ObservableMembrane } from "observable-membrane";
import { ProxyPropertyKey } from "observable-membrane/dist/shared";

import Configs from "./configs";

import { convertType } from "./utils";

export type Widget<Props> = {
  $el: HTMLElement;
  id: string;
  props: Props;
};

export class WidgetInstance<Props> {
  private readonly $htmlEl: HTMLElement;
  private readonly propsMap: { [key: string]: string };

  public destroy: () => void;
  public id: string;
  public props: Props;

  constructor(
    htmlEl: HTMLElement,
    handler: (
      ctx: Widget<Props>,
      helpers: { [x: string]: any }
    ) => void | (() => void)
  ) {
    this.id = `${Configs.idPrefix}${nanoid(6)}`;
    this.$htmlEl = htmlEl;
    this.propsMap = {};
    this.props = {} as Props;

    htmlEl.setAttribute(Configs.widgetId.datasetHtmlAttribute, this.id);

    this.collectProps();

    const destroyFun = handler(
      {
        $el: this.$htmlEl,
        props: this.props,
        id: this.id,
      },
      {
        qs: this.qs,
        qsa: this.qsa,
        useState: this.useState,
        useDebouncedState: this.useDebouncedState,
      }
    );

    this.destroy = destroyFun ? destroyFun : () => {};
  }

  get $el() {
    return this.$htmlEl;
  }

  qs = <T extends HTMLElement>(name: string): T => {
    return this.$htmlEl.querySelector(name) as T;
  };

  qsa = <T extends HTMLElement>(name: string): T[] => {
    return Array.from(this.$htmlEl.querySelectorAll(name));
  };

  useState = <T extends object>(proxy: T, onChange: () => void): T => {
    const membrane = new ObservableMembrane({
      valueObserved(target: any, key: ProxyPropertyKey) {
        // where target is the object that was accessed
        // and key is the key that was read
        // console.log("accessed ", key, target);
      },
      valueMutated(target: any, key: ProxyPropertyKey) {
        // where target is the object that was mutated
        // and key is the key that was mutated
        // console.log("mutated ", key, target);
        onChange();
      },
    });

    return membrane.getProxy(proxy);
  };

  useDebouncedState = <T extends object>(
    proxy: T,
    onChange: () => void,
    delay: number
  ): T => {
    let timer: any = null;
    const membrane = new ObservableMembrane({
      valueObserved(target: any, key: ProxyPropertyKey) {
        // where target is the object that was accessed
        // and key is the key that was read
        // console.log("accessed ", key, target);
      },
      valueMutated(target: any, key: ProxyPropertyKey) {
        if (timer) {
          clearTimeout(timer);
          timer = null;
        }

        timer = setTimeout(() => {
          onChange();
        }, delay);
      },
    });

    return membrane.getProxy(proxy);
  };

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
