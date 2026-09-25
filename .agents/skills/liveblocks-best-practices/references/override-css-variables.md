---
title: "Override CSS variables"
---

# Override CSS variables

Style Liveblocks by using CSS variables. They can be applied to every Liveblocks
element:

```css
/* Styles all default Comments components */
.lb-root {
  --lb-accent: purple;
  --lb-spacing: 1em;
  --lb-radius: 0;
}
```

You can also choose to only apply them to certain elements:

```css
/* Styles only composers */
.lb-composer {
  --lb-line-height: 1.3;
}
```

Some elements have data attributes to provide contextual information. Also
remember that regular CSS properties work too.

```css
.lb-button[data-variant="primary"] {
  --lb-accent: blue;
}

.lb-avatar[data-loading] {
  opacity: 0.8;
}
```

[A full list of variables is here](https://liveblocks.io/docs/api-reference/liveblocks-react-ui#CSS-variables).
