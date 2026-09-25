---
title: "Handling unstable connections"
---

# Handling unstable connections

Very short connections dips are ignored by Liveblocks, and your app will
continue to work correctly. However, when a connection drops for more than 5
seconds,
[`useLostConnectionListener`](https://liveblocks.io/docs/api-reference/liveblocks-react#useLostConnectionListener)
can be used to render UI, allowing you to tell users about this. It must be used
inside of
[`LiveblocksProvider`](https://liveblocks.io/docs/api-reference/liveblocks-react#LiveblocksProvider).

```tsx
import { toast } from "my-preferred-toast-library";

function App() {
  useLostConnectionListener((event) => {
    switch (event) {
      case "lost":
        toast.warn("Still trying to reconnect...");
        break;

      case "restored":
        toast.success("Successfully reconnected again!");
        break;

      case "failed":
        toast.error("Could not restore the connection");
        break;
    }
  });
}
```

Edit the amount of time until the callback is called with the
[`lostConnectionTimeout`](https://liveblocks.io/docs/api-reference/liveblocks-react#LiveblocksProviderLostConnectionTimeout)
option on `LiveblocksProvider`. The default is `5000`, 5 seconds.

```tsx
import { LiveblocksProvider } from "@liveblocks/react/suspense";

function App() {
  return (
    <LiveblocksProvider
      lostConnectionTimeout={5000}

      // Other props
      // ...
    >
      {/* children */}
    </LiveblocksProvider>
  );
}
```
