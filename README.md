# HTML Widgets

Automatically call funcitons (widgets) when DOM loads and changes.

## Quick overview

```html
<div data-widgets-root>
  <!-- ... -->
  <div data-widget="MyWidget" :msg="Hello World!"></div>
  <!-- ... -->
</div>
```

```javascript
// components/MyWidget.js

export default ({ $el, props }) => {
  $el.innerHTML = props.msg;
};
```

## Setup

```
yarn add html-widgets
```

```javascript
import HtmlWidgets from "html-widgets";
import MyWidget from "./components/MyWidget";

new HtmlWidgets({
  components: { MyWidget },
});
```

## `Props`

`:props` allow you to consume data declared in the HTML, it's basically a `getAttribute` with fancy things around

```html
<div
  data-widget="MyWidget"
  :string="lorem ipsum"
  :number="123"
  :object="{'a':1,'b':'second','c':[1,2,3],'d':{'a':'a','b':2}}"
  :array="[1,2,3]"
></div>
```

```javascript
// components/MyWidget.js

export default ({ props }) => {
  console.log(typeof props.string); // String
  console.log(typeof props.number); // Number
  console.log(typeof props.object); // Object
  console.log(typeof props.array); // Array
};
```

## `Helpers`

Let you define custom functionalities for your widgets

```javascript
new HtmlWidgets({
  // ...
  helpers: ($widget) => {
    qs: (target) => $widget.querySelector(name);
  },
});
```

```html
<div data-widget="MyWidget">
  <div class="js_child">yo</div>
</div>
```

```javascript
export default (props, { helpers }) => {
  const child = helpers.qs(".js_child");
  console.log(child.innerText); // yo
};
```

## `Destroy`

Usefull to remove listeners, a widget can return a void function, that will be called once the related HTML is removed from the DOM

```javascript
export default (props, { helpers }) => {
  // init logic

  () => {
    // destroy logic
  };
};
```

## Async import

Add this to your webpack file

```javascript
resolve: {
    extensions: [".ts", ".js"],
    alias: {
        "~": path.resolve(__dirname, "./path/to/widgets/folder/"),
    },
},
```

Then init the library using the `asyncComponents` option, this will import the widget file only if requested by the DOM

```javascript
import HtmlWidgets from "html-widgets";

new HtmlWidgets({
  asyncComponents: { MyWidget: "MyWidget.js" },
});
```

## Use with `Typescript`

```typescript
import HtmlWidgets, {
  WidgetFunction as BaseWidgetFunction,
} from "html-widgets";

const helpers = ($htmlEl: HTMLElement) => ({
  qs: <T extends HTMLElement>(name: string): T => {
    return $htmlEl.querySelector(name) as T;
  },
});

type WidgetFunction<T> = BaseWidgetFunction<T, ReturnType<typeof helpers>>;

interface Props {
  msg: string;
}

const components = {
    MyWidget: WidgetFunction<Props> = (ctx, helpers) => {
        console.log(ctx, helpers);
    }
}

new HtmlWidgets({
  components,
  helpers,
});
```
