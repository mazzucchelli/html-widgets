var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
import shortid from "shortid";
// import { Events } from "./Events";
var COMPONENT_LIST = new Map();
var snakeToCamel = function (str) {
    return str.replace(/([-_][a-z])/g, function (group) {
        return group.toUpperCase().replace("-", "").replace("_", "");
    });
};
var DomObserver = /** @class */ (function () {
    function DomObserver(options) {
        this.logs = !!options.logs;
        this.rootElement = options.rootElement;
        this.componentSelector = options.componentSelector;
        this.importedComponents = new Map();
    }
    Object.defineProperty(DomObserver.prototype, "COMPONENT_LIST", {
        get: function () {
            return COMPONENT_LIST;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(DomObserver.prototype, "COMPONENT_SELECTOR", {
        get: function () {
            var str = this.componentSelector.replace("[data-", "").replace("]", "");
            return snakeToCamel(str);
        },
        enumerable: false,
        configurable: true
    });
    /**
     * List of components names
     *
     * @param {HTMLElement[]} components
     * @return {string[]}
     */
    DomObserver.prototype.getComponentsNames = function (components) {
        var _this = this;
        return components.map(function (el) { return el.dataset[_this.COMPONENT_SELECTOR].trim(); });
    };
    /**
     * Collect added dom elements and check if there are new components
     *
     * @param {Node[]} addedNodes
     * @return {void}
     */
    DomObserver.prototype.afterStateAttributeChanged = function (compId, changedAttr) {
        var comp = this.COMPONENT_LIST.get(compId);
        var cleanedState = changedAttr.replace("data-state-", "");
        if (!!!comp || !!!comp.EFFECTS[cleanedState])
            return;
        if (this.logs) {
            console.log("%c\u2736 [" + comp.CNAME + "] state update", "color: #333; background-color: #49e4f8; padding: 3px 5px;");
        }
        // emit state change event with new and old data
        comp.$ev.emit(cleanedState + "_STATE_CHANGED", comp.$state[cleanedState], comp.CSTATE[cleanedState]);
        // update state value
        comp.CSTATE[cleanedState] = comp.$state[cleanedState];
    };
    /**
     * Collect added dom elements and check if there are new components
     *
     * @param {Node[]} addedNodes
     * @return {void}
     */
    DomObserver.prototype.afterNodeAdded = function (addedNodes) {
        var _this = this;
        addedNodes
            .filter(function (el) { return !!el.querySelectorAll; })
            .forEach(function (addedNode) {
            // Log.purple("ADDED HTML", addedNode);
            _this.importComponents(addedNode);
        });
    };
    /**
     * Collect removed dom elements (and children) and check if are components
     *
     * @param {Node[]} removedNodes
     * @return {void}
     */
    DomObserver.prototype.afterNodeDeleted = function (removedNodes) {
        var _this = this;
        var findChildComponents = function (removedNode) {
            var removed = removedNode.querySelectorAll(_this.componentSelector);
            if (_this.logs) {
                console.log("%c- [" + removed.length + "]", "color: white; background-color: #9c27b0; padding: 3px 5px;");
            }
            removed.forEach(function (comp) {
                if (COMPONENT_LIST.has(comp.dataset[_this.COMPONENT_SELECTOR + "Id"])) {
                    _this.onRemoveComponentInstance(comp.dataset[_this.COMPONENT_SELECTOR + "Id"]);
                }
            });
        };
        removedNodes.forEach(function (removedNode) {
            if (!!!removedNode.querySelectorAll)
                return;
            var CID = removedNode.CID;
            findChildComponents(removedNode);
            if (CID && COMPONENT_LIST.has(CID)) {
                _this.onRemoveComponentInstance(CID);
            }
        });
    };
    /**
     * Function called after a new component is created
     *
     * @param {HTMLElement} comp
     * @return {void}
     */
    DomObserver.prototype.onNewComponentInstance = function (comp) {
        comp.componentSelector = {
            full: this.componentSelector,
            snake: this.COMPONENT_SELECTOR,
        };
        if (!!comp.__onBaseMounted)
            comp.__onBaseMounted();
        if (!!comp.__onMounted)
            comp.__onMounted();
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
            console.log("%c\u2714\uFE0E [" + comp.CNAME + "] mounted - ID: " + comp.CID, "color: #333; background-color: #8bc34a; padding: 3px 5px;");
            console.log("%c⎣", "color: #8bc34a;", comp.componentElement);
            // console.log("%cstate", "color: #8bc34a;", comp.$state);
        }
    };
    /**
     * Function called after a component is removed from DOM
     * Update component list and destroy component
     *
     * @param {HTMLElement} comp
     * @return {void}
     */
    DomObserver.prototype.onRemoveComponentInstance = function (CID) {
        var comp = COMPONENT_LIST.get(CID);
        COMPONENT_LIST.delete(CID);
        if (!!comp.__onBaseDestroy)
            comp.__onBaseDestroy();
        if (!!comp.__onDestroy)
            comp.__onDestroy();
        if (this.logs) {
            console.log("%c\u2717 [" + comp.CNAME + "] - [" + comp.CID + "] destroyed", "color: #333; background-color: #ffc107; padding: 3px 5px;");
            console.log("%c⎣", "color: #ffc107;", comp.componentElement);
        }
    };
    /**
     * Search not initialized components in HTML and set CID for them
     *
     * @param {HTMLElement} $html
     * @return {HTMLElement[]}
     */
    DomObserver.prototype.findComponents = function ($html) {
        var _this = this;
        var $target = $html !== document.body ? $html.parentNode : document.body;
        if (!$target)
            return [];
        var components = Array.from($target.querySelectorAll(this.componentSelector)).filter(function (el) { return !el.CID && el.dataset[_this.COMPONENT_SELECTOR] !== ""; });
        if (components.length) {
            console.log("%c+ [" + components.length + "]", "color: white; background-color: #9c27b0; padding: 3px 5px;");
            // console.log("%c⎣", "color: #9c27b0;", components);
        }
        return components.map(function (el) {
            var newId = shortid.generate();
            el.CID = newId;
            el.dataset[_this.COMPONENT_SELECTOR + "Id"] = newId;
            return el;
        });
    };
    /**
     * Init MutationObserver on <body> and observe it
     * afterNodeDeleted() and afterNodeAdded() are used to handle DOM changes
     *
     * @return {void}
     */
    DomObserver.prototype.observeDomChanges = function () {
        return __awaiter(this, void 0, void 0, function () {
            var config, observer;
            var _this = this;
            return __generator(this, function (_a) {
                config = { attributes: true, childList: true, subtree: true };
                observer = new MutationObserver(function (mutationsList) {
                    for (var _i = 0, mutationsList_1 = mutationsList; _i < mutationsList_1.length; _i++) {
                        var mutation = mutationsList_1[_i];
                        if (mutation.type === "childList") {
                            var addedNodes = Array.from(mutation.addedNodes);
                            var removedNodes = Array.from(mutation.removedNodes);
                            if (mutation.target && removedNodes.length) {
                                _this.afterNodeDeleted(removedNodes);
                            }
                            if (mutation.target && addedNodes.length) {
                                _this.afterNodeAdded(addedNodes);
                            }
                        }
                        else {
                            if (mutation.attributeName.includes("data-state") &&
                                !!mutation.target.CID) {
                                _this.afterStateAttributeChanged(mutation.target.CID, mutation.attributeName);
                            }
                        }
                    }
                });
                observer.observe(this.rootElement, config);
                return [2 /*return*/];
            });
        });
    };
    /**
     * Create new Component() for every [data-component] found in target
     * Import chunk.[component_name].js if not loaded before
     *
     * @param {HTMLElement} target
     * @return {void}
     */
    DomObserver.prototype.importComponents = function (target) {
        return __awaiter(this, void 0, void 0, function () {
            var components, names;
            var _this = this;
            return __generator(this, function (_a) {
                components = this.findComponents(target);
                if (!components.length)
                    return [2 /*return*/];
                names = this.getComponentsNames(components);
                names.forEach(function (compName, i) { return __awaiter(_this, void 0, void 0, function () {
                    var element, ComponentClass, res, ImportedClass, comp, comp, err_1;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0:
                                element = components[i];
                                _a.label = 1;
                            case 1:
                                _a.trys.push([1, 5, , 6]);
                                ComponentClass = this.importedComponents.get(compName);
                                if (!!!!ComponentClass) return [3 /*break*/, 3];
                                return [4 /*yield*/, import("COMPONENTS/" + compName + ".ts")];
                            case 2:
                                res = _a.sent();
                                if (this.logs) {
                                    console.log("%c\u26A1\uFE0F [" + res.default.name + ".chunk.js] loaded", "color: white; background-color: #3f51b5; padding: 3px 5px;");
                                }
                                ImportedClass = res.default;
                                comp = new ImportedClass(element);
                                this.importedComponents.set(compName, ImportedClass);
                                COMPONENT_LIST.set(element.CID, comp);
                                this.onNewComponentInstance(comp);
                                return [3 /*break*/, 4];
                            case 3:
                                comp = new ComponentClass(element);
                                COMPONENT_LIST.set(element.CID, comp);
                                this.onNewComponentInstance(comp);
                                _a.label = 4;
                            case 4: return [3 /*break*/, 6];
                            case 5:
                                err_1 = _a.sent();
                                console.error("[" + compName + "] init error at ::", element, err_1);
                                return [3 /*break*/, 6];
                            case 6: return [2 /*return*/];
                        }
                    });
                }); });
                return [2 /*return*/];
            });
        });
    };
    /**
     * Init class functionalities
     */
    DomObserver.prototype.init = function () {
        var _this = this;
        try {
            this.importComponents(this.rootElement).then(function () {
                _this.observeDomChanges();
            });
        }
        catch (e) {
            console.error(e);
        }
    };
    return DomObserver;
}());
export var ComponentDispatcher = new DomObserver({
    rootElement: document.body,
    componentSelector: "[data-sharp]",
    logs: LOGS || false,
});
// export const getComponentInstance = (CID) => {
//   return ComponentDispatcher.COMPONENT_LIST.get(CID);
// };
// window.getComponentInstance = getComponentInstance;
