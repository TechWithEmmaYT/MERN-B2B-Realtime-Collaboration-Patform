---
title: "Performant storage with selectors"
---

# Performant storage with selectors

Using selectors with
[`useStorage`](https://liveblocks.io/docs/api-reference/liveblocks-react#useStorage)
can help you avoid unnecessary renders. Selectors are functions that return a
subset of the storage tree, for example `(root) => root.animals` will only
render when `animals` changes.

```tsx
import { useStorage } from "@liveblocks/react/suspense";

function Storage() {
  const storage = useStorage((root) => root.animals);

  // ...
}
```

## Examples

Here's some more comples examples, given the following Storage types:

```ts file="liveblocks.config.ts"
import { LiveList, LiveMap, LiveObject } from "@liveblocks/client";

type Tags = LiveList<string>;

type Shape = LiveObject<{
  id: string;
  color: string;
  tags: Tags;
}>;

declare global {
  interface Liveblocks {
    Storage: {
      shapes: LiveList<string, Shape>;
      people: LiveMap<string, { name: string }>;
    };
  }
}
```

`useStorage` updates whenever the selector value changes, so if you create a new
array, map, or object (e.g. with `.filter`), make sure to pass a `shallow`
comparison. Here's how they render:

```tsx
import { shallow, useStorage } from "@liveblocks/react/suspense";

// ❌ Renders when people or shapes change
const storage = useStorage((root) => root);

// Renders when any shape changes
const storage = useStorage((root) => root.shapes);

// Renders when only the first shape changes
const firstShape = useStorage((root) => root.shapes[0]);

// Renders when only the first shape's color changes
const firstShapeColor = useStorage((root) => root.shapes[0].color);

// Renders when only the first shape's first tag changes
const firstShapeTags = useStorage((root) => root.shapes[0].tags[0]);

// Renders when only the a shape's first tag length changes
const thisShapesTagLength = useStorage(
  (root) => root.shapes[SHAPE_INDEX].tags.length
);

// Renders when a shape becomes red, or is no longer red
const redShapes = useStorage(
  (root) => root.shapes.filter((shape) => shape.color === "red"),
  shallow // 👈
);
```

## ✅ Be efficient

Try to be efficient as possible at every stage. For example, use `useStorage` in
two places, like this. First get the key of every shape, then get the shape from
its key.

```tsx
import { shallow, useStorage } from "@liveblocks/react/suspense";

function Canvas() {
  // ✅ Only updates when a shape is added or removed to the LiveList
  const shapeIds = useStorage(
    (root) => root.shapes.map((shape) => shape.id),
    shallow
  );

  return shapeIds.map((id) => <Shape key={id} id={id} />);
}

function Shape({ id }: { id: string }) {
  // ✅ Updates only when this shape LiveObject changes
  const shape = useStorage(
    (root) => root.shapes.find((shape) => shape.id === id),
    shallow
  );

  return <div style={{ backgroundColor: shape.color }} />;
}
```
