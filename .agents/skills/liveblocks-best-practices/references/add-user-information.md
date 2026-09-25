---
title: "Add user information"
---

# Add user information

Liveblocks Comments, Notifications, and other features require authentication
and resolvers to show user info.

## Authenticate users

First authenticate your users in an API endpoint. This is using ID tokens.
`name` and `color` are used in text editors to display the user's caret. Custom
properties can be accessed with `useSelf` or `useOthers`on the front end. These
properties are NOT used in comment threads, notifications, etc.

```ts
const { status, body } = await liveblocks.identifyUser(
  {
    userId: "marc@example.com",

    // Optional
    // organizationId: "org-id",
    // groupIds: ["group-id-1", "group-id-2"],
  },
  {
    userInfo: {
      name: "Marc",
      color: "#00ff00",

      // Your custom metadata
      // ...
    },
  }
);
```

```ts file="liveblocks.config.ts"
declare global {
  interface Liveblocks {
    UserMeta: {
      id: string;

      info: {
        name: string;
        color: string;

        // Your custom metadata
        // ...
      };
    };
  }
}
```

See the `authenticating-with-id-tokens` reference for more information on this
recommedned authentication method. An alternative is to use access tokens, see
the `authenticating-with-access-tokens` reference for more information.

## Resolving users

To show user info in
[`Thread`](https://liveblocks.io/docs/api-reference/liveblocks-react-ui#Thread),
[`InboxNotification`](https://liveblocks.io/docs/api-reference/liveblocks-react-ui#InboxNotification),
[`Cursors`](https://liveblocks.io/docs/api-reference/liveblocks-react-ui#Cursors),
and
[`AvatarStack`](https://liveblocks.io/docs/api-reference/liveblocks-react-ui#AvatarStack),
you must use
[`resolveUsers`](https://liveblocks.io/docs/api-reference/liveblocks-react#LiveblocksProviderResolveUsers)
in `LiveblocksProvider`.

```tsx
import { LiveblocksProvider } from "@liveblocks/react/suspense";

function App() {
  return (
    <LiveblocksProvider
      resolveUsers={async ({ userIds }) => {
        // ["marc@example.com", "nimesh@example.com"];
        console.log(userIds);

        return [
          { name: "Marc", avatar: "https://example.com/marc.png" },
          { name: "Nimesh", avatar: "https://example.com/nimesh.png" },
        ];
      }}

      // Other props
      // ...
    >
      {/* children */}
    </LiveblocksProvider>
  );
}
```

Users must be return in the same order they are passed. The array must be the
same length as the `userIds` array. You can also return custom information, for
example, a user’s `color`:

```tsx
import { LiveblocksProvider } from "@liveblocks/react/suspense";

function App() {
  return (
    <LiveblocksProvider
      resolveUsers={async ({ userIds }) => {
        // ["marc@example.com"];
        console.log(userIds);

        return [
          {
            name: "Marc",
            avatar: "https://example.com/marc.png",
            color: "purple",
          },
        ];
      }}

      // Other props
      // ...
    >
      {/* children */}
    </LiveblocksProvider>
  );
}
```

In a real-world example, you would fetch users from your back end:

```tsx
<LiveblocksProvider
  resolveUsers={async ({ userIds }) => {
    // Get users from your back end
    const users = await __fetchUsers__(userIds);

    // Return a list of users
    return users;
  }}

  // ...
/>
```

## Resolving mention suggestions

In commenting composers, you can mention other users (e.g. `@Marc`). Resolve
these mentions with
[`resolveMentionSuggestions`](https://liveblocks.io/docs/api-reference/liveblocks-react#LiveblocksProviderResolveMentionSuggestions)
in `LiveblocksProvider`.

```tsx
import { LiveblocksProvider } from "@liveblocks/react/suspense";

function App() {
  return (
    <LiveblocksProvider
      resolveMentionSuggestions={async ({ text, roomId }) => {
        const workspaceUsers = await __getWorkspaceUsersFromDB__(roomId);

        if (!text) {
          // Show all workspace users by default
          return __getUserIds__(workspaceUsers);
        } else {
          // Show users that match the current search (define your own logic for this, e.g. fuzzy search, )
          const matchingUsers = __findUsers__(workspaceUsers, text);
          return __getUserIds__(matchingUsers);
        }
      }}

      // Other props
      // ...
    >
      {/* children */}
    </LiveblocksProvider>
  );
}
```
