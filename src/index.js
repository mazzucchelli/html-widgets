import shortid from "shortid";
// import { Events } from "./Events";

const COMPONENT_LIST = new Map();

const snakeToCamel = (str) =>
  str.replace(/([-_][a-z])/g, (group) =>
    group.toUpperCase().replace("-", "").replace("_", "")
  );

class DomObserver {
  constructor(options) {
    this.logs = !!options.logs;
    this.rootElement = options.rootElement;
    this.componentSelector = options.componentSelector;
    this.importedComponents = new Map();
  }

  get COMPONENT_LIST() {
    return COMPONENT_LIST;
  }

  get COMPONENT_SELECTOR() {
    const str = this.componentSelector.replace("[data-", "").replace("]", "");
    return snakeToCamel(str);
  }

  /**
   * List of components names
   *
   * @param {HTMLElement[]} components
   * @return {string[]}
   */
  getComponentsNames(components) {
    return components.map((el) => el.dataset[this.COMPONENT_SELECTOR].trim());
  }

  /**
   * Collect added dom elements and check if there are new components
   *
   * @param {Node[]} addedNodes
   * @return {void}
   */
  afterStateAttributeChanged(compId, changedAttr) {
    const comp = this.COMPONENT_LIST.get(compId);
    const cleanedState = changedAttr.replace("data-state-", "");
    if (!!!comp || !!!comp.EFFECTS[cleanedState]) return;

    if (this.logs) {
      console.log(
        `%c✶ [${comp.CNAME}] state update`,
        "color: #333; background-color: #49e4f8; padding: 3px 5px;"
      );
    }

    // emit state change event with new and old data
    comp.$ev.emit(
      `${cleanedState}_STATE_CHANGED`,
      comp.$state[cleanedState],
      comp.CSTATE[cleanedState]
    );

    // update state value
    comp.CSTATE[cleanedState] = comp.$state[cleanedState];
  }

  /**
   * Collect added dom elements and check if there are new components
   *
   * @param {Node[]} addedNodes
   * @return {void}
   */
  afterNodeAdded(addedNodes) {
    addedNodes
      .filter((el) => !!el.querySelectorAll)
      .forEach((addedNode) => {
        // Log.purple("ADDED HTML", addedNode);
        this.importComponents(addedNode);
      });
  }

  /**
   * Collect removed dom elements (and children) and check if are components
   *
   * @param {Node[]} removedNodes
   * @return {void}
   */
  afterNodeDeleted(removedNodes) {
    const findChildComponents = (removedNode) => {
      const removed = removedNode.querySelectorAll(this.componentSelector);

      if (this.logs) {
        console.log(
          `%c- [${removed.length}]`,
          "color: white; background-color: #9c27b0; padding: 3px 5px;"
        );
      }

      removed.forEach((comp) => {
        if (COMPONENT_LIST.has(comp.dataset[this.COMPONENT_SELECTOR + "Id"])) {
          this.onRemoveComponentInstance(
            comp.dataset[this.COMPONENT_SELECTOR + "Id"]
          );
        }
      });
    };

    removedNodes.forEach((removedNode) => {
      if (!!!removedNode.querySelectorAll) return;

      const CID = removedNode.CID;
      findChildComponents(removedNode);
      if (CID && COMPONENT_LIST.has(CID)) {
        this.onRemoveComponentInstance(CID);
      }
    });
  }

  /**
   * Function called after a new component is created
   *
   * @param {HTMLElement} comp
   * @return {void}
   */
  onNewComponentInstance(comp) {
    comp.componentSelector = {
      full: this.componentSelector,
      snake: this.COMPONENT_SELECTOR,
    };
    if (!!comp.__onBaseMounted) comp.__onBaseMounted();
    if (!!comp.__onMounted) comp.__onMounted();

    // if (!!comp.EFFECTS) {
    //   for (const [key, value] of Object.entries(comp.EFFECTS)) {
    //     comp.$ev.on(`${key}_STATE_CHANGED`, (newState, oldState) => {
    //       value(newState, oldState);
    //     });
    //   }
    // }

    // if (!!comp.EVENTS && !!comp.EVENTS.local) {
    //   for (const [key, value] of Object.entries(comp.EVENTS.local)) {
    //     console.log("key, value", key, value);
    //     comp.$ev.on(key, value);
    //   }
    // }

    // if (!!comp.EVENTS && !!comp.EVENTS.global) {
    //   for (const [key, value] of Object.entries(comp.EVENTS.global)) {
    //     Events.on(key, value);
    //   }
    // }

    if (this.logs) {
      console.log(
        `%c✔︎ [${comp.CNAME}] mounted - ID: ${comp.CID}`,
        "color: #333; background-color: #8bc34a; padding: 3px 5px;"
      );
      console.log("%c⎣", "color: #8bc34a;", comp.componentElement);
      // console.log("%cstate", "color: #8bc34a;", comp.$state);
    }
  }

  /**
   * Function called after a component is removed from DOM
   * Update component list and destroy component
   *
   * @param {HTMLElement} comp
   * @return {void}
   */
  onRemoveComponentInstance(CID) {
    const comp = COMPONENT_LIST.get(CID);
    COMPONENT_LIST.delete(CID);

    if (!!comp.__onBaseDestroy) comp.__onBaseDestroy();
    if (!!comp.__onDestroy) comp.__onDestroy();

    if (this.logs) {
      console.log(
        `%c✗ [${comp.CNAME}] - [${comp.CID}] destroyed`,
        "color: #333; background-color: #ffc107; padding: 3px 5px;"
      );
      console.log("%c⎣", "color: #ffc107;", comp.componentElement);
    }
  }

  /**
   * Search not initialized components in HTML and set CID for them
   *
   * @param {HTMLElement} $html
   * @return {HTMLElement[]}
   */
  findComponents($html) {
    const $target = $html !== document.body ? $html.parentNode : document.body;
    if (!$target) return [];

    const components = Array.from(
      $target.querySelectorAll(this.componentSelector)
    ).filter((el) => !el.CID && el.dataset[this.COMPONENT_SELECTOR] !== "");

    if (components.length) {
      console.log(
        `%c+ [${components.length}]`,
        "color: white; background-color: #9c27b0; padding: 3px 5px;"
      );
      // console.log("%c⎣", "color: #9c27b0;", components);
    }

    return components.map((el) => {
      const newId = shortid.generate();
      el.CID = newId;
      el.dataset[this.COMPONENT_SELECTOR + "Id"] = newId;
      return el;
    });
  }

  /**
   * Init MutationObserver on <body> and observe it
   * afterNodeDeleted() and afterNodeAdded() are used to handle DOM changes
   *
   * @return {void}
   */
  async observeDomChanges() {
    const config = { attributes: true, childList: true, subtree: true };
    const observer = new MutationObserver((mutationsList) => {
      for (let mutation of mutationsList) {
        if (mutation.type === "childList") {
          const addedNodes = Array.from(mutation.addedNodes);
          const removedNodes = Array.from(mutation.removedNodes);

          if (mutation.target && removedNodes.length) {
            this.afterNodeDeleted(removedNodes);
          }

          if (mutation.target && addedNodes.length) {
            this.afterNodeAdded(addedNodes);
          }
        } else {
          if (
            mutation.attributeName.includes("data-state") &&
            !!mutation.target.CID
          ) {
            this.afterStateAttributeChanged(
              mutation.target.CID,
              mutation.attributeName
            );
          }
        }
      }
    });

    observer.observe(this.rootElement, config);
  }

  /**
   * Create new Component() for every [data-component] found in target
   * Import chunk.[component_name].js if not loaded before
   *
   * @param {HTMLElement} target
   * @return {void}
   */
  async importComponents(target) {
    const components = this.findComponents(target);
    if (!components.length) return;

    const names = this.getComponentsNames(components);
    names.forEach(async (compName, i) => {
      // const element = components.filter(
      //   (el) => el.dataset[this.COMPONENT_SELECTOR].trim() === compName
      // )[0];
      const element = components[i];

      try {
        let ComponentClass = this.importedComponents.get(compName);

        if (!!!ComponentClass) {
          const res = await import(`COMPONENTS/${compName}.ts`);

          if (this.logs) {
            console.log(
              `%c⚡️ [${res.default.name}.chunk.js] loaded`,
              "color: white; background-color: #3f51b5; padding: 3px 5px;"
            );
          }

          const ImportedClass = res.default;
          const comp = new ImportedClass(element);
          this.importedComponents.set(compName, ImportedClass);
          COMPONENT_LIST.set(element.CID, comp);
          this.onNewComponentInstance(comp);
        } else {
          const comp = new ComponentClass(element);
          COMPONENT_LIST.set(element.CID, comp);
          this.onNewComponentInstance(comp);
        }
      } catch (err) {
        console.error(`[${compName}] init error at ::`, element, err);
      }
    });
  }

  /**
   * Init class functionalities
   */
  init() {
    try {
      this.importComponents(this.rootElement).then(() => {
        this.observeDomChanges();
      });
    } catch (e) {
      console.error(e);
    }
  }
}

export const ComponentDispatcher = new DomObserver({
  rootElement: document.body,
  componentSelector: "[data-sharp]",
  logs: true,
});

// export const getComponentInstance = (CID) => {
//   return ComponentDispatcher.COMPONENT_LIST.get(CID);
// };

// window.getComponentInstance = getComponentInstance;
