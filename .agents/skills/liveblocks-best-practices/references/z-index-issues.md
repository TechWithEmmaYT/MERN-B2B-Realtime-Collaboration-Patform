---
title: "z-index issues"
---

# z-index issues

Floating elements within Liveblocks default components (e.g. tooltips,
dropdowns, etc) are portaled to the end of the document to avoid z-index
conflicts and overflow issues.

When portaled, those elements are also wrapped in a container to handle their
positioning. These containers don’t have any specific class names or data
attributes so they shouldn’t be targeted or styled directly, but they will
mirror whichever z-index value is set on their inner element (which would be
auto by default).

To fix z-index issues, you need to set a specific z-index value on floating
elements directly, ignoring their containers. You can either target specific
floating elements (e.g. .lb-tooltip, .lb-dropdown, etc) or all of them at once
via the .lb-portal class name.

```css
/* Target all floating elements */
.lb-portal {
  z-index: 5;
}

/* Target a specific floating element */
.lb-tooltip {
  z-index: 10;
}
```
