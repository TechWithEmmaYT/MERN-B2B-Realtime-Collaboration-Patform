---
title: "Rendering error components"
---

# Rendering error components

It's recommended to structure your app using the suspense version of Liveblocks
hooks, alongside `ErrorBoundary` and its `fallback` property used as a an error
component. Make sure it's installed:

```
npm install react-error-boundary
```

Instead of wrapping your entire Liveblocks application inside single
`ClientSideSuspense` and `ErrorBoundary` components, you can use multiple of
these components in different parts of your application, and each will work as a
loading fallbacks and error fallbacks for any components further down your tree.

Simple hooks don't need error boundaries, but hooks returning a `{ ... }` format
do.

```tsx
import {
  ClientSideSuspense,
  useThreads,
  useOthers,
} from "@liveblocks/react/suspense"; // ← /suspense export
import { ErrorBoundary } from "react-error-boundary";

function Page() {
  return (
    <LiveblocksProvider authEndpoint="/api/liveblocks-auth">
      <RoomProvider id="my-room-id">
        <header>My title</header>

        <main>
          // +++
          <ErrorBoundary fallback={<div>Canvas error</div>}>
            <ClientSideSuspense fallback={<div>Loading…</div>}>
              <Comments />
            </ClientSideSuspense>
          </ErrorBoundary>
          // +++
        </main>

        <aside>
          // +++
          <ClientSideSuspense fallback={<div>Loading…</div>}>
            <LiveAvatars />
          </ClientSideSuspense>
          // +++
        </aside>
      </RoomProvider>
    </LiveblocksProvider>
  );
}

function Comments() {
  const { threads } = useThreads(); // ← complex hooks use { ... } and can error

  // ...
}

function Avatars() {
  const others = useOthers(); // ← simple hook, never errors

  // ...
}
```

Note that suspense hooks are exported from `"@liveblocks/react/suspense"`. This
is a great way to build a static skeleton around your dynamic collaborative
application.

## When not using suspense

When not using suspense, you can check for `null` or `isLoading` to create
loading components. Most hooks use `null` such as `useStorage`, but complex
paginated hooks like `useThreads` and `useInboxNotifications` return an
`isLoading` state.

```tsx
import { useThreads, useOthers } from "@liveblocks/react"; // ← NOT /suspense export
import { ErrorBoundary } from "react-error-boundary";

function Page() {
  return (
    <LiveblocksProvider authEndpoint="/api/liveblocks-auth">
      <RoomProvider id="my-room-id">
        <header>My title</header>

        <main>
          // +++
          <Comments />
          // +++
        </main>

        <aside>
          // +++
          <LiveAvatars />
          // +++
        </aside>
      </RoomProvider>
    </LiveblocksProvider>
  );
}

function Comments() {
  const { threads, error, isLoading } = useThreads(); // ← complex hooks use { ... } and can error

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Comments error</div>;
  }

  // ...
}

function Avatars() {
  const others = useOthers(); // ← simple hook, never errors

  if (!others) {
    return <div>Loading...</div>;
  }

  // ...
}
```

Note that regular hooks are exported from `"@liveblocks/react"`.

## Summary

It's recommend to use the suspense versions of hooks and `ErrorBoundary` to
create loading states.
