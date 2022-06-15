import { nanoid } from "nanoid";
import { ObservableMembrane } from "observable-membrane";
import { ProxyPropertyKey } from "observable-membrane/dist/shared";

import { convertType, snakeToCamel } from "./utils";

export type HWidget<Props> = WidgetInstance<Props>;

export class WidgetInstance<Props> {
  private readonly $htmlEl: HTMLElement;
  private readonly propsMap: { [key: string]: string };

  public destroy: () => void;
  public id: string;
  public props: Props;

  constructor(htmlEl: HTMLElement, handler: any) {
    this.id = `rh_${nanoid(6)}`;
    this.$htmlEl = htmlEl;
    this.propsMap = {};
    this.props = {} as Props;

    htmlEl.setAttribute("data-r-id", this.id);

    this.collectProps();

    const destroyFun = handler(this);
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
    // temp props object
    const obj = {} as any;

    // cycle dataset and only handle interesting attributes
    for (const [key, value] of Object.entries(this.$htmlEl.dataset)) {
      if (key.startsWith("r") && key !== "r" && !key.startsWith("rId")) {
        // adjust prop name: r-prop-name -> propName
        const [firstLetter, ...restOfWord] = key.substring(1);
        const cleanKey = snakeToCamel(
          firstLetter.toLowerCase() + restOfWord
        );

        // save original attribute name
        this.propsMap[cleanKey] = key;

        // store the converted value in temp props object
        obj[cleanKey] = convertType(value);
      }
    }

    // make props object reactive, so it can auto update the DOM
    this.props = this.useState(obj, () => {
      for (const [key, value] of Object.entries(this.props)) {
        const datasetKey = this.propsMap[key];
        this.$htmlEl.dataset[datasetKey] = JSON.stringify(value);
      }
    });
  };
}
