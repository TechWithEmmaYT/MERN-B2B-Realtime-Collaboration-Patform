---
title: "Dark mode style"
---

# Dark mode styles

To import dark mode styling, as well as the default styles, use the following
snippets:

```tsx
import "@liveblocks/react-ui/styles.css";

// Dark mode using the system theme with `prefers-color-scheme`
import "@liveblocks/react-ui/styles/dark/media-query.css";
```

There's an alternate dark mode you can use instead:

```tsx
import "@liveblocks/react-ui/styles.css";

// Dark mode using `className="dark"`, `data-theme="dark"`, or `data-dark="true"`
import "@liveblocks/react-ui/styles/dark/attributes.css";
```

## CSS imports are supported

You can also import into CSS files.

```css
@import "@liveblocks/react-ui/styles.css";
@import "@liveblocks/react-ui/styles/dark/media-query.css";
```

## Other libraries

Remember that other Liveblocks libraries have _additional_ style sheets, so
don't remove them, for example Tiptap:

```tsx
import "@liveblocks/react-tiptap/styles.css";
```
