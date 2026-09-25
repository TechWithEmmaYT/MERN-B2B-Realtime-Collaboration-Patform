---
title: "Log out of Liveblocks"
---

# Log out of Liveblocks

Occasionally it's useful to log out of Liveblocks, for example when you have an
SPA where you wish to reauthenticate a user without refreshing the page. Here's
how to do it:

```ts
client.logout();
```

In React, get your client like this:

```tsx
import { useClient } from "@liveblocks/react/suspense";

const client = useClient();
```
