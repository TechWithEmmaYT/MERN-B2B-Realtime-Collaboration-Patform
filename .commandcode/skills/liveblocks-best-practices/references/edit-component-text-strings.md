---
title: "Edit component text strings"
---

# Edit component text strings

Overrides can be used to customize components’ strings and localization-related
properties, such as locale and reading direction. For example, you can change
"Reply" to say "Comment", or any other string. They can be set globally for all
components using `LiveblocksUiConfig`:

```tsx
import { LiveblocksUiConfig } from "@liveblocks/react-ui";

export function App() {
  return (
    <LiveblocksUiConfig
      overrides={{ locale: "fr", USER_UNKNOWN: "Anonyme" /* ... */ }}
    >
      {/* ... */}
    </LiveblocksUiConfig>
  );
}
```

Overrides can also be set per-component, and these settings will take precedence
over global settings. This is particularly useful in certain contexts, for
example when you’re using a `<Composer />` component for creating replies to
threads:

```tsx
<Composer
  overrides={{
    COMPOSER_PLACEHOLDER: "Reply to thread…",
    COMPOSER_SEND: "Reply",
  }}
/>
```

[A full list of override names are here](https://liveblocks.io/docs/api-reference/liveblocks-react-ui#Override-names).
