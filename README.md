Tiny UI framework, _typescript friendly_, for server rendered websites.

Designed to be easy to use and learn. Thinked for anyone who wants a similar approach to other modern frameworks but can't use them for whatever reason.

### **Goal**:

- **Watch** the DOM and **search** `[data-widget]` elements
- **Lazy load** the chunk (_or just run a function_) you define for it
- Run a **destroy** function **when** the element in **removed** from the DOM

---

## Table of contents

- [Quick overview](#quick-overview)
- [Init options](#init-options)
- [Context](#context)
  - [props](#props)
  - [propsEffect](#prop-effect)
- [Plugins](#plugins)
- [Use with typescript](#typescript)

---

## <h2 id="quick-overview">Quick overview</h2>

Install

```
yarn add html-widgets
```

Define the widget

```html
<div data-widget="MyWidget">...</div>
```

Write the `WidgetFunction`

```javascript
export default (context, plugins) => {
  console.log("MyWidget found in the DOM");

  () => {
    console.log("MyWidget removed from the DOM");
  };
};
```

Init the observer and register the widgets

```javascript
import HtmlWidgets from "html-widgets";
import MyWidget from "./widgets/MyWidget";

new HtmlWidgets({
  widgets: { MyWidget },
});
```

---

## <h2 id="init-options">Init options</h2>

```typescript
{
  // root html element to watch, default [data-widgets-root]
  rootElement?: string;

  // log when a Widget is initiated or destroyed
  logs?: boolean;

  // object of imported WidgetFunctions, not lazy loaded
  widgets?: { [x: string] : WidgetFunction };

  // lazy load method, like:
  // async (widget) => await import(`~/${widget}`)
  lazyImport: (componentName: string) => Promise<WidgetFunction>

  // helper functions that have access to same context of a WidgetFunction
  // accessible as second argument of a WidgetFunction
  plugins: (context: WidgetContext<unknown>) => {
    [x: string]: (...args: any[]) => any;
  };
}
```

in order to use `lazyImport` remember to update your webpack config:

```javascript
// lazyImport: async (widget) => await import(`~/${widget}`)

resolve: {
    extensions: [".ts", ".js"],
    alias: {
        "~": path.resolve(__dirname, "./path/to/widgets/folder/"),
    },
},
```

---

## <h2 id="context">Context</h2>

First argument of a `WidgetFunction`, it contains:

- `$el` | HTMLElement that called the function
- `name` | the name found in `[data-widget]`
- `props` | found and converted attributes when initiated
- `propEffect` | a function that is called every time a specific attribute (only props) changes

### <h3 id="props">props</h3>

```html
<div
  data-widget="MyWidget"
  :some-string="lorem ipsum"
  :some-number="123"
  :some-object="{ 'foo': 'bar' }"
  :some-array="[1, 2, 3]"
></div>
```

```javascript
export default ({ props }) => {
  console.log(typeof props["some-string"]); // String
  console.log(typeof props["some-number"]); // Number
  console.log(typeof props["some-object"]); // Object
  console.log(typeof props["some-array"]); // Array
};
```

### <h3 id="prop-effect">propEffect()</h3>

```javascript
export default ({ propEffect }) => {
  const [name, setName] = propEffect("name", () => {
    console.log(":name attribute just changed, new value:", name.current);
  });

  // name.current -> updated and converted attribute value
  // setName(v) -> update method, also working with $el.setAttribute(`:${name}`, v)
};
```

---

## <h2 id="plugins">Plugins</h2>

It's possible to register custom functionalities for your widgets using the plugins option. Functions declared here are accessible through the second argument of your widget function and have access to the same context of a WidgetFunction

Very simple example:

```javascript
new HtmlWidgets({
  // ...
  plugins: (context) => {
    qs: (target) => context.$el.querySelector(target);
  },
});
```

```html
<div data-widget="MyWidget">
  <div class="js_child">foo</div>
</div>
```

```javascript
export default (context, { qs }) => {
  const child = qs(".js_child");
  console.log(child.innerText); // foo
};
```

---

## <h2 id="typescript">Use with `Typescript`</h2>

```typescript
import HtmlWidgets, {
  WidgetFunction as BaseWidgetFunction, WidgetContext
} from "html-widgets";

const plugins = (context: WidgetContext<any>) => ({
  qs: <T extends HTMLElement>(name: string): T => {
    return context.$el.querySelector(name) as T;
  },
});

type WidgetFunction<T> = BaseWidgetFunction<T, ReturnType<typeof plugins>>;

interface Props {
  msg: string;
}

const MyWidget: WidgetFunction<Props> = (context, plugins) => {
    console.log(context, plugins);
}

new HtmlWidgets({
  widgets: { MyWidget }
  plugins,
});
```
