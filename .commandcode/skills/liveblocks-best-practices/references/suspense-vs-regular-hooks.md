---
title: "Suspense vs Regular hooks"
---

# Suspense vs Regular hooks

All Liveblocks React components and hooks can be exported from two different
locations, `@liveblocks/react/suspense` and `@liveblocks/react`. This is because
Liveblocks provides two types of hooks; those that support
[React Suspense](https://react.dev/reference/react/Suspense), and those that
don’t.

```tsx
// Import the Suspense hook
import { useThreads } from "@liveblocks/react/suspense";

// Import the regular hook
import { useThreads } from "@liveblocks/react";
```

### Suspense hooks (often easier)

Suspense hooks can be wrapped in `ClientSideSuspense`, which acts as a
loading spinner for any components below it. When using this, all components
below will only render once their hook contents have been loaded.

```tsx
import { ClientSideSuspense, useStorage } from "@liveblocks/react/suspense";

function App() {
  <ClientSideSuspense fallback={<div>Loading…</div>}>
    <Component />
  </ClientSideSuspense>;
}

function Component() {
  // `animals` is always defined
  const animals = useStorage((root) => root.animals);

  // ...
}
```

Advanced hooks using the `{ ..., error, isLoading }` syntax, such as
[`useThreads`](https://liveblocks.io/docs/api-reference/liveblocks-react#useThreads),
can also use [`ErrorBoundary`](https://github.com/bvaughn/react-error-boundary)
to render an error if the hook runs into a problem.

```tsx
import { ClientSideSuspense, useThreads } from "@liveblocks/react/suspense";
import { ErrorBoundary } from "react-error-boundary";

function App() {
  return (
    <ErrorBoundary fallback={<div>Error</div>}>
      <ClientSideSuspense fallback={<div>Loading…</div>}>
        <Component />
      </ClientSideSuspense>
    </ErrorBoundary>
  );
}

function Component() {
  // `threads` is always defined
  const { threads } = useThreads();

  // ...
}
```

An advantage of Suspense hooks is that you can have multiple different hooks in
your tree, and you only need a single `ClientSideSuspense` component to render a
loading spinner for all of them.

### Regular hooks (often harder)

While it's easier to use Suspense hooks, regular hooks are available too.
Regular hooks often return `null` whilst a component is loading, and you must
check for this to render a loading spinner.

```tsx
import { useStorage } from "@liveblocks/react";

function Component() {
  // `animals` is `null` when loading
  const animals = useStorage((root) => root.animals);

  if (!animals) {
    return <div>Loading…</div>;
  }

  // ...
}
```

Advanced hooks using the `{ ..., error, isLoading }` syntax, such as
[`useThreads`](https://liveblocks.io/docs/api-reference/liveblocks-react#useThreads),
require you to make sure there isn’t a problem before using the data.

```tsx
import { useThreads } from "@liveblocks/react";

function Component() {
  // Check for `error` and `isLoading` before `threads` is defined
  const { threads, error, isLoading } = useThreads();

  if (error) {
    return <div>Error</div>;
  }

  if (isLoading) {
    return <div>Loading…</div>;
  }

  // ...
}
```

### ClientSideSuspense

Liveblocks provides a component named `ClientSideSuspense` which works as a
replacement for `Suspense`. This is helpful as our Suspense hooks will throw an
error when they’re run on the server, and this component avoids this issue by
always rendering the `fallback` on the server.

```tsx
import { ClientSideSuspense } from "@liveblocks/react/suspense";

function Page() {
  return (
    <LiveblocksProvider authEndpoint="/api/liveblocks-auth">
      <RoomProvider id="my-room-id">
        +++
        <ClientSideSuspense fallback={<div>Loading…</div>}>
          <App />
        </ClientSideSuspense>
        +++
      </RoomProvider>
    </LiveblocksProvider>
  );
}
```

### Loading spinners and error components

Instead of wrapping your entire Liveblocks application inside single
`ClientSideSuspense` and `ErrorBoundary` components, you can use multiple of
these components in different parts of your application, and each will work as a
loading fallbacks and error fallbacks for any components further down your tree.

```tsx
import { ClientSideSuspense } from "@liveblocks/react/suspense";
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
              <Canvas />
            </ClientSideSuspense>
          </ErrorBoundary>
          // +++
        </main>

        <aside>
          // +++
          <ErrorBoundary fallback={<div>Live avatars error</div>}>
            <ClientSideSuspense fallback={<div>Loading…</div>}>
              <LiveAvatars />
            </ClientSideSuspense>
          </ErrorBoundary>
          // +++
        </aside>
      </RoomProvider>
    </LiveblocksProvider>
  );
}
```

This is a great way to build a static skeleton around your dynamic collaborative
application.
