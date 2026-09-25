---
title: "Auth endpoint callback"
---

# Auth endpoint callback

Liveblocks recommends using an auth endpoint to authenticate users, usually like
this:

```tsx
import { LiveblocksProvider } from "@liveblocks/react/suspense";

function App() {
  return (
    <LiveblocksProvider authEndpoint="/api/liveblocks-auth">
      {/* children */}
    </LiveblocksProvider>
  );
}
```

However you can also define a callback function, and write your own fetch logic:

```tsx
import { LiveblocksProvider } from "@liveblocks/react/suspense";

function App() {
  return (
    <LiveblocksProvider
      authEndpoint={async (room) => {
        const response = await fetch("/api/liveblocks-auth", {
          method: "POST",
          headers: {
            Authentication: "<your own headers here>",
            "Content-Type": "application/json",
          },
          // Don't forget to pass `room` down. Note that it
          // can be undefined when using Notifications.
          body: JSON.stringify({ room }),
        });
        return await response.json();
      }}
    >
      {/* children */}
    </LiveblocksProvider>
  );
}
```

In your auth endpoint, a token is returned, see `authenticating-with-id-tokens`
for more information on setting this up. It will return a token in the following
format, which you must return, as we are with `await response.json()` in the
example above:

```
{ "token": "..." }
```

## Prevent reconnection

If the returned token or data is invalid, Liveblocks will repeatedly retry the
callback, and try to reconnect. If you wish to prevent this, manually return a
token with the following format:

```
{ "error": "forbidden", "reason": "..." }
```

When Liveblocks sees `"error": "forbidden"`, it will no longer try to reconnect.
