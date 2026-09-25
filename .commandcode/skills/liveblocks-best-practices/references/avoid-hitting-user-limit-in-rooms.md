---
title: "Avoid hitting user limit in rooms"
---

# Avoid hitting user limit in rooms

Only a certain amount of users can join your room, and this limit is set by your
plan, for example 20 or 50. One way to avoid hitting this limit is to set
[`backgroundKeepAliveTimeout`](https://liveblocks.io/docs/api-reference/liveblocks-react#LiveblocksProviderBackgroundKeepAliveTimeout)
on `LiveblocksProvider`. This disconnects users that have not opened their
Liveblocks tab after a certain amount of time, helping you avoid hitting the
limit.

```tsx
import { LiveblocksProvider } from "@liveblocks/react/suspense";

export function Providers() {
  return (
    <LiveblocksProvider
      // Disconnect users after 15 minutes of inactivity
      backgroundKeepAliveTimeout={15 * 60 * 1000}

      // Other props
      // ...
    >
      {/* children */}
    </LiveblocksProvider>
  );
}
```

Users will connect seamlessly when they reopen the tab.

## Render static documents

Another option is to use the Node.js back end or REST APIs to render static
documents. This only works if users never need to interact with the document, so
it only works in specific use cases.

Here's an example using Storage.

```ts
import { Liveblocks } from "@liveblocks/node";

const liveblocks = new Liveblocks({
  secret: process.env.LIVEBLOCKS_SECRET_KEY!,
});

async function Page() {
  const storage = await liveblocks.getStorageDocument("my-room-id", "json");

  return <ReadOnlyApp storage={storage} />
}
```
