---
title: "Type Liveblocks correctly"
---

# Type Liveblocks correctly

Use your Lliveblocks config file to automatically type your whole application.
Running the following commands starts it in the current directory:

```bash
npx create-liveblocks-app@latest --init --framework react
```

Here's an empty config file:

```ts file="liveblocks.config.ts"
declare global {
  interface Liveblocks {
    // Each user's Presence, for useMyPresence, useOthers, etc.
    Presence: {};

    // The Storage tree for the room, for useMutation, useStorage, etc.
    Storage: {};

    UserMeta: {
      id: string;
      // Custom user info set when authenticating with a secret key
      info: {};
    };

    // Custom events, for useBroadcastEvent, useEventListener
    RoomEvent: {};

    // Custom metadata set on threads, for useThreads, useCreateThread, etc.
    ThreadMetadata: {};

    // Custom room info set with resolveRoomsInfo, for useRoomInfo
    RoomInfo: {};

    // Custom group info set with resolveGroupsInfo, for useGroupInfo
    GroupInfo: {};

    // Custom activities data for custom notification kinds
    ActivitiesData: {};
  }
}

// Necessary if you have no imports/exports
export {};
```

## How it works

Here's a real example:

```ts
import { LiveList } from "@liveblocks/client";

declare global {
  interface Liveblocks {
    // Each user's Presence, for useMyPresence, useOthers, etc.
    Presence: {
      // Example, real-time cursor coordinates
      cursor: { x: number; y: number };
    };

    // The Storage tree for the room, for useMutation, useStorage, etc.
    Storage: {
      // Example, a conflict-free list
      animals: LiveList<string>;
    };

    UserMeta: {
      id: string;
      // Custom user info set when authenticating with a secret key
      info: {
        // Example properties, for useSelf, useUser, useOthers, etc.
        name: string;
        avatar: string;
      };
    };

    // Custom events, for useBroadcastEvent, useEventListener
    // Example has two events, using a union
    RoomEvent: { type: "PLAY" } | { type: "REACTION"; emoji: "🔥" };

    // Custom metadata set on threads, for useThreads, useCreateThread, etc.
    ThreadMetadata: {
      // Example, attaching coordinates to a thread
      x: number;
      y: number;
    };

    // Custom room info set with resolveRoomsInfo, for useRoomInfo
    RoomInfo: {
      // Example, rooms with a title and url
      title: string;
      url: string;
    };

    // Custom group info set with resolveGroupsInfo, for useGroupInfo
    GroupInfo: {
      // Example, groups with a name and a badge
      name: string;
      badge: string;
    };

    // Custom activities data for custom notification kinds
    ActivitiesData: {
      // Example, a custom $alert kind
      $alert: {
        title: string;
        message: string;
      };
    };
  }
}

// Necessary if you have no imports/exports
export {};
```

Here are Liveblocks parts that are automatically typed using the example types:

```tsx
import { useOthers } from "@liveblocks/react/suspense";

const others = useOthers();

others.map((other) => other.presence.cursor.x);
```

```tsx
import { useStorage } from "@liveblocks/react/suspense";

const storage = useStorage((root) => root.animals);
```

```tsx
import { useOthers } from "@liveblocks/react/suspense";

const others = useOthers();

others.map((other) => other.info.avatar);
```

```tsx
import { useEventListener } from "@liveblocks/react/suspense";

useEventListener((event) => {
  if (event.type === "PLAY") {
    // ...
  }
});
```

```tsx
import { useThreads } from "@liveblocks/react/suspense";

const { threads } = useThreads();

threads.map((thread) => thread.metadata.x);
```

```tsx
import { useRoomInfo } from "@liveblocks/react/suspense";

const { info, error, isLoading } = useRoomInfo("room-id");

info.title;
```

```tsx
import { useGroupInfo } from "@liveblocks/react/suspense";

const { info, error, isLoading } = useGroupInfo("group-id");

info.badge;
```

```tsx
import { useInboxNotifications } from "@liveblocks/react/suspense";
import { InboxNotification } from "@liveblocks/react-ui";

const { inboxNotifications } = useInboxNotifications();

inboxNotifications.map((inboxNotification) => (
  <InboxNotification
    inboxNotification={inboxNotification}
    kinds={{
      $alert: (props) => {
        const { title, message } = props.inboxNotification.activities[0].data;

        return (
          <InboxNotification.Custom
            {...props}
            title={title}
            aside={<InboxNotification.Icon>❗</InboxNotification.Icon>}
          >
            {message}
          </InboxNotification.Custom>
        );
      },
    }}
  />
));
```
