import { WidgetInstance, HWidget } from "./WidgetInstance";

const RH_MEMORY = new Map();

type ComponentObj = {
  [key: string]: any;
};

type AsyncComponentObj = {
  [key: string]: string;
};

interface ObserverConstructor {
  components: ComponentObj;
  asyncComponents: AsyncComponentObj;
  rootElement?: string;
  selector?: string;
  logs?: boolean;
}

export class Observer {
  private readonly components: ComponentObj;
  private readonly asyncComponents: AsyncComponentObj;
  private readonly rootElement: HTMLElement;
  private selector: string;
  private readonly shouldLog: boolean;

  constructor({
    components,
    asyncComponents,
    rootElement = `[data-r-root]`,
    selector = `[data-r]`,
    logs = false,
  }: ObserverConstructor) {
    this.shouldLog = logs;
    this.rootElement = document.body.querySelector(rootElement);
    this.selector = selector;
    this.components = components;
    this.asyncComponents = asyncComponents;

    this.init();
  }

  get COMPONENT_LIST() {
    return Object.keys(this.components);
  }

  get ASYNC_COMPONENT_LIST() {
    return Object.keys(this.asyncComponents);
  }

  afterNodeDeleted(removedNodes: HTMLElement[]) {
    // const removed = removedNodes.querySelectorAll(this.selector);

    removedNodes
      .filter((el) => el.dataset.rId)
      .forEach((comp) => {
        const { rId, r } = comp.dataset;

        if (RH_MEMORY.has(rId)) {
          const instance = RH_MEMORY.get(rId);

          if (this.shouldLog) {
            console.log(
              `%c[${r} # ${rId}] destroyed`,
              "color: white; background-color: #9c27b0; padding: 3px 5px;"
            );
            console.log(comp);
          }

          instance.destroy();
          RH_MEMORY.delete(rId);
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
    ).filter((el) => !!el.dataset.r && !el.dataset.rId);
  }

  importComponents(target: HTMLElement) {
    return new Promise<void>((resolve, reject) => {
      try {
        const components = this.findComponents(target);

        components.forEach(async (component) => {
          const componentName = component.dataset.r;

          // if component is typeof string is considered a path to lazy import
          const shouldImport =
            this.ASYNC_COMPONENT_LIST.includes(componentName);

          let instance: HWidget<unknown> = null;

          if (shouldImport) {
            const asyncRh = await import(
              `~/${this.asyncComponents[componentName]}`
            );
            instance = new WidgetInstance(component, asyncRh.default);
          } else {
            const rh = this.components[componentName];
            instance = new WidgetInstance(component, rh);
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
      console.error("RH-ERR", e);
    }
  }
}
