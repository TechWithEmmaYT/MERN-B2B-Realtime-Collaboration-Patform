---
title: "Handling full rooms"
---

# Handling full rooms

Only a certain amount of users can join your room, and this limit is set by your
plan, for example 20 or 50.
[`useErrorListener`](https://liveblocks.io/docs/api-reference/liveblocks-react#useErrorListener)
allows you to intercept a user joining a full room and handle it. It must be
used inside of
[`LiveblocksProvider`](https://liveblocks.io/docs/api-reference/liveblocks-react#LiveblocksProvider).

```tsx
import { useErrorListener, useThreads } from "@liveblocks/react/suspense";

// This component is used within `LiveblocksProvider`
function Component() {
  useErrorListener((error) => {
    if (
      error.context.type === "ROOM_CONNECTION_ERROR" &&
      error.context.code === 4005
    ) {
      // Room is full, handle this by e.g. redirecting or showing an error component
      // redirect("/error");
      // ...
    }
  });

  // ...
}
```

To avoid this happening, read the reference on `avoid-hitting-user-limit-in-rooms`.
