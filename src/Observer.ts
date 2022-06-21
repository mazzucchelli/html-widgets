import { WidgetContext, WidgetInstance } from "./WidgetInstance";
import Configs from "./configs";

const RH_MEMORY = new Map();

type ComponentObj = {
  [key: string]: any;
};

type AsyncComponentObj = {
  [key: string]: string;
};

interface ObserverConstructor {
  lazyImport: (componentName: string) => Promise<any>;
  plugins: (ctx: WidgetContext<unknown>) => {
    [x: string]: (...args: any[]) => any;
  };
  widgets?: ComponentObj;
  asyncWidgets?: AsyncComponentObj;
  rootElement?: string;
  selector?: string;
  logs?: boolean;
}

export class Observer {
  private readonly widgets: ComponentObj;
  private readonly asyncWidgets: AsyncComponentObj;
  private readonly rootElement: HTMLElement;
  private readonly plugins: (ctx: WidgetContext<unknown>) => {
    [x: string]: (...args: any[]) => any;
  };
  private readonly selector: string;
  readonly lazyImport: (componentName: string) => Promise<any>;
  readonly shouldLog: boolean;

  constructor({
    lazyImport,
    plugins,
    widgets,
    asyncWidgets,
    rootElement = Configs.rootElement,
    selector = `[${Configs.widgetSelector.datasetHtmlAttribute}]`,
    logs = false,
  }: ObserverConstructor) {
    this.plugins = plugins;
    this.lazyImport = lazyImport;
    this.shouldLog = logs;
    this.rootElement = document.body.querySelector(rootElement);
    this.selector = selector;
    this.widgets = widgets;
    this.asyncWidgets = asyncWidgets;

    this.init();
  }

  get COMPONENT_LIST() {
    return Object.keys(this.widgets || {});
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
        this.importWidgets(addedNode);
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

  findWidgets(target: HTMLElement) {
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

  importWidgets(target: HTMLElement) {
    return new Promise<void>((resolve, reject) => {
      try {
        const widgets = this.findWidgets(target);

        widgets.forEach(async (component) => {
          const componentName =
            component.dataset[Configs.widgetSelector.datasetKey];

          // if component is typeof string is considered a path to lazy import
          const shouldImport = !this.COMPONENT_LIST.includes(componentName);

          const p = this.plugins;

          let instance: WidgetInstance<
            unknown,
            ReturnType<typeof p>
          > = null;

          if (shouldImport) {
            const asyncWidgetHandler = await this.lazyImport(componentName);
            instance = new WidgetInstance(
              component,
              asyncWidgetHandler.default,
              this.plugins
            );
          } else {
            const widgetHandler = this.widgets[componentName];
            instance = new WidgetInstance(
              component,
              widgetHandler,
              this.plugins
            );
          }

          // store component reference
          RH_MEMORY.set(instance.id, instance);

          if (this.shouldLog) {
            console.log(
              `%c${shouldImport ? "⚡️ " : ""}[${componentName}] initiated`,
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
      await this.importWidgets(this.rootElement);
      await this.observeDomChanges(this.rootElement);
    } catch (e) {
      console.error("WIDGETS-ERR", e);
    }
  }
}
