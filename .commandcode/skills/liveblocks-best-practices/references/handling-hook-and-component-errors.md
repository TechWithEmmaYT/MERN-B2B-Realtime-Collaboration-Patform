---
title: "Handling hook and component errors"
---

# Handling hook and component errors

Pre-built components such as `Thread` and hooks such as `useCreateThread` can
throw errors.
[`useErrorListener`](https://liveblocks.io/docs/api-reference/liveblocks-react#useErrorListener)
allows you to catch these errors. It must be used inside of
[`LiveblocksProvider`](https://liveblocks.io/docs/api-reference/liveblocks-react#LiveblocksProvider).

```tsx
import { useErrorListener, useThreads } from "@liveblocks/react/suspense";

// This component is used within `LiveblocksProvider`
function Comments() {
  const { threads } = useThreads();

  useErrorListener((error) => {
    if (error.context.type === "CREATE_THREAD_ERROR") {
      const { roomId, threadId, commentId, body, metadata } = error.context;
      // ...
    }
  });

  return (
    <div>
      {threads.map((thread) => (
        <Thread key={thread.id} thread={thread} />
      ))}
    </div>
  );
}
```

```tsx
import { useErrorListener, useCreateThread } from "@liveblocks/react/suspense";

// This component is used within `LiveblocksProvider`
function Comments() {
  const createThread = useCreateThread();

  useErrorListener((error) => {
    if (error.context.type === "CREATE_THREAD_ERROR") {
      const { roomId, threadId, commentId, body, metadata } = error.context;
      // ...
    }
  });

  return (
    <button
      onClick={() =>
        createThread({
          body: {
            /* ... */
          },
          attachments: [],
          metadata: {},
          commentMetadata: {},
        })
      }
    >
      Create thread
    </button>
  );
}
```

## Other errors

There are many different errors, and each can be handled separately by checking
the value of `error.context.type`. Below we’ve listed each error and the context
it provides.

```tsx
import { useErrorListener } from "@liveblocks/react/suspense";

useErrorListener((error) => {
  switch (error.context.type) {
    // Can happen if you use Presence, Storage, or Yjs
    case "ROOM_CONNECTION_ERROR": {
      const { code } = error.context;
      // -1   = Authentication error
      // 4001 = You don't have access to this room
      // 4005 = Room was full
      // 4006 = Room ID has changed
      break;
    }

    // Can happen if you use Comments or Notifications
    case "CREATE_THREAD_ERROR":
      const { roomId, threadId, commentId, body, metadata } = error.context;
      break;

    case "DELETE_THREAD_ERROR":
      const { roomId, threadId } = error.context;
      break;

    case "EDIT_THREAD_METADATA_ERROR":
      const { roomId, threadId, metadata } = error.context;
      break;

    case "MARK_THREAD_AS_RESOLVED_ERROR":
    case "MARK_THREAD_AS_UNRESOLVED_ERROR":
      const { roomId, threadId } = error.context;
      break;

    case "CREATE_COMMENT_ERROR":
    case "EDIT_COMMENT_ERROR":
      const { roomId, threadId, commentId, body } = error.context;
      break;

    case "DELETE_COMMENT_ERROR":
      const { roomId, threadId, commentId } = error.context;
      break;

    case "ADD_REACTION_ERROR":
    case "REMOVE_REACTION_ERROR":
      const { roomId, threadId, commentId, emoji } = error.context;
      break;

    case "MARK_INBOX_NOTIFICATION_AS_READ_ERROR":
      const { inboxNotificationId, roomId } = error.context;
      break;

    case "DELETE_INBOX_NOTIFICATION_ERROR":
      const { roomId } = error.context;
      break;

    case "MARK_ALL_INBOX_NOTIFICATIONS_AS_READ_ERROR":
    case "DELETE_ALL_INBOX_NOTIFICATIONS_ERROR":
      break;

    case "UPDATE_ROOM_SUBSCRIPTION_SETTINGS_ERROR":
      const { roomId } = error.context;
      break;

    default:
      // Ignore any error from the future
      break;
  }
});
```
