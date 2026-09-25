---
title: "Prevent unsaved changes being lost"
---

# Prevent unsaved changes being lost

Liveblocks usually synchronizes milliseconds after a local change, but if a user
immediately closes their tab, or if they have a slow connection, it may take
longer for changes to synchronize. Enabling preventUnsavedChanges will stop tabs
with unsaved changes closing, by opening a dialog that warns users. In usual
circumstances, it will very rarely trigger.

```tsx
function Page() {
  return (
    <LiveblocksProvider
      preventUnsavedChanges

      // Other options
      // ...
    >
      ...
    </LiveblocksProvider>
  );
}
```

[More info](https://liveblocks.io/docs/api-reference/liveblocks-react#prevent-users-losing-unsaved-changes).
