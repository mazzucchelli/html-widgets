import { WidgetInstance } from "./WidgetInstance";
import Configs from "./configs";

const RH_MEMORY = new Map();

type ComponentObj = {
  [key: string]: any;
};

type AsyncComponentObj = {
  [key: string]: string;
};

interface ObserverConstructor {
  helpers: (el: HTMLElement) => { [x: string]: (...args: any[]) => unknown };
  components?: ComponentObj;
  asyncComponents?: AsyncComponentObj;
  rootElement?: string;
  selector?: string;
  logs?: boolean;
}

export class Observer {
  private readonly components: ComponentObj;
  private readonly asyncComponents: AsyncComponentObj;
  private readonly rootElement: HTMLElement;
  private readonly helpers: (el: HTMLElement) => {
    [x: string]: (...args: any[]) => unknown;
  };
  private selector: string;
  private readonly shouldLog: boolean;

  constructor({
    helpers,
    components,
    asyncComponents,
    rootElement = Configs.rootElement,
    selector = `[${Configs.widgetSelector.datasetHtmlAttribute}]`,
    logs = false,
  }: ObserverConstructor) {
    this.helpers = helpers;
    this.shouldLog = logs;
    this.rootElement = document.body.querySelector(rootElement);
    this.selector = selector;
    this.components = components;
    this.asyncComponents = asyncComponents;

    this.init();
  }

  get COMPONENT_LIST() {
    return Object.keys(this.components || {});
  }

  get ASYNC_COMPONENT_LIST() {
    return Object.keys(this.asyncComponents || {});
  }

  afterNodeDeleted(removedNodes: HTMLElement[]) {
    removedNodes
      .filter((el) => el.dataset && el.dataset[Configs.widgetId.datasetKey])
      .forEach((comp) => {
        const widgetId = comp.dataset[Configs.widgetId.datasetKey];
        const widgetName = comp.dataset[Configs.widgetSelector.datasetKey];

        if (RH_MEMORY.has(widgetId)) {
          const instance = RH_MEMORY.get(widgetId);

          if (this.shouldLog) {
            console.log(
              `%c[${widgetName} # ${widgetId}] destroyed`,
              "color: white; background-color: #9c27b0; padding: 3px 5px;"
            );
            console.log(comp);
          }

          instance.destroy();
          RH_MEMORY.delete(widgetId);
        }
      });
  }

  afterNodeAdded(addedNodes: HTMLElement[]) {
    addedNodes
      .filter((el) => !!el.querySelectorAll)
      .forEach((addedNode) => {
        this.importComponents(addedNode);
      });
  }

  async observeDomChanges(target: HTMLElement) {
    const observer = new MutationObserver((mutationsList) => {
      for (let mutation of mutationsList) {
        // handle only added and removed nodes
        if (mutation.type !== "childList") return;

        const addedNodes = Array.from(mutation.addedNodes);
        const removedNodes = Array.from(mutation.removedNodes);

        if (mutation.target && removedNodes.length) {
          this.afterNodeDeleted(removedNodes as HTMLElement[]);
        }

        if (mutation.target && addedNodes.length) {
          this.afterNodeAdded(addedNodes as HTMLElement[]);
        }
      }
    });

    observer.observe(target, {
      attributes: false,
      childList: true,
      subtree: true,
    });
  }

  findComponents(target: HTMLElement) {
    const finalTarget =
      target !== this.rootElement ? target.parentNode : this.rootElement;
    return Array.from(
      finalTarget.querySelectorAll(this.selector) as NodeListOf<HTMLElement>
    ).filter(
      (el) =>
        !!el.dataset[Configs.widgetSelector.datasetKey] &&
        !el.dataset[Configs.widgetId.datasetKey]
    );
  }

  importComponents(target: HTMLElement) {
    return new Promise<void>((resolve, reject) => {
      try {
        const components = this.findComponents(target);

        components.forEach(async (component) => {
          const componentName =
            component.dataset[Configs.widgetSelector.datasetKey];

          // if component is typeof string is considered a path to lazy import
          const shouldImport =
            this.ASYNC_COMPONENT_LIST.includes(componentName);

          let instance: WidgetInstance<
            unknown,
            ReturnType<typeof this.helpers>
          > = null;

          if (shouldImport) {
            const asyncWidgetHandler = await import(
              `~/${this.asyncComponents[componentName]}`
            );
            instance = new WidgetInstance(
              component,
              asyncWidgetHandler.default,
              this.helpers
            );
          } else {
            const widgetHandler = this.components[componentName];
            instance = new WidgetInstance(
              component,
              widgetHandler,
              this.helpers
            );
          }

          // store component reference
          RH_MEMORY.set(instance.id, instance);

          if (this.shouldLog) {
            console.log(
              `%c[${componentName} # ${instance.id}] initiated`,
              "color: white; background-color: #3f51b5; padding: 3px 5px;"
            );
            console.log(instance.$el);
          }
        });
        resolve();
      } catch (e) {
        reject(e);
      }
    });
  }

  async init() {
    try {
      await this.importComponents(this.rootElement);
      await this.observeDomChanges(this.rootElement);
    } catch (e) {
      console.error("WIDGETS-ERR", e);
    }
  }
}
