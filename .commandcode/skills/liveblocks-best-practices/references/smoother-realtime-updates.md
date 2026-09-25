---
title: "Smoother realtime updates"
---

# Smoother realtime updates

By default, Liveblocks presence and storage updates 10 times per second. Make it
smoother by updating the
[`throttle`](https://liveblocks.io/docs/api-reference/liveblocks-react#LiveblocksProviderThrottle)
value. The default is `100`, once every 100ms, 10FPS. The minimum value is `16`,
once every 16ms, 60FPS.

```tsx
import { LiveblocksProvider } from "@liveblocks/react/suspense";

function App() {
  return (
    <LiveblocksProvider
      throttle={16}

      // Other options
      // ...
    >
      {/* children */}
    </LiveblocksProvider>
  );
}
```

Note that rooms with lots of high frequency updates by multiple users may become
laggy with a low throttle value.
