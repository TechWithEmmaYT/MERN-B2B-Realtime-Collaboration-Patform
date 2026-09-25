---
title: "Performant others and presence"
---

# Performant others and presence

Liveblocks presence and others can update as much as 60 times per second. This
means it's best to build your app in ways that don't cause unnecessary renders.

## ❌ useOthers updates a lot

[`useOthers`](https://liveblocks.io/docs/api-reference/liveblocks-react#useOthers)
returns an array of other users in the room. This array is updated every time
any users presence changes, which can be many times per second.

```tsx
import { useOthers } from "@liveblocks/react/suspense";

// ❌ Updates on every presence change
function Cursors() {
  const others = useOthers();

  return (
    <div>
      {others.map((other) => (
        <MyCursorComponent
          key={other.connectionId}
          name={other.info.name}
          x={other.presence.cursor.x}
          y={other.presence.cursor.y}
        />
      ))}
    </div>
  );
}
```

## ✅ useOtherConnectionIds updates only when users join or leave

Using
[`useOtherConnectionIds`](https://liveblocks.io/docs/api-reference/liveblocks-react#useOtherConnectionIds)
returns an array of connection IDs for other users in the room. This array is
only updated when a user joins or leaves the room, and NOT when a user's
presence changes.

Use this in combination with
[`useOther`](https://liveblocks.io/docs/api-reference/liveblocks-react#useOther)
to update components only when this user's presence changes.

```tsx
import { useOthers } from "@liveblocks/react/suspense";

// ✅ Updates only when users join or leave
function Cursors() {
  const others = useOthers();

  return (
    <div>
      {others.map((other) => (
        <Cursor key={other.connectionId} connectionId={other.connectionId} />
      ))}
    </div>
  );
}

// ✅ Updates only when this user's presence changes
function Cursor({ connectionId }: { connectionId: number }) {
  const other = useOther(connectionId);

  return (
    <MyCursorComponent
      name={other.info.name}
      x={other.presence.cursor.x}
      y={other.presence.cursor.y}
    />
  );
}
```

## ✅ useOthersMapped updates only when a subset of their presence changes

Using
[`useOthersMapped`](https://liveblocks.io/docs/api-reference/liveblocks-react#useOthersMapped)
returns an array of a certain part of user's presence, and only updates when
this part of the presence changes. For example, if your app haas the concept of
a user typing, and if you'd just like to check if each user is typing or not,
return an array of their `isTyping` properties.

```tsx
import { useOthersMapped } from "@liveblocks/react/suspense";

// ✅ Updates only when a user's `isTyping` property changes
function Typing() {
  const others = useOthersMapped((other) => other.presence.isTyping);

  // [true, false, true]
  console.log(others);

  // ...
}
```

## useOthers with a selector

With a selector and the `shallow` option, you can run operations on the list,
for example `.filter`, and return only users that are typing. `shallow` is a
shallow comparison, that checks if the array values have changed, instead of
checking if the array reference has changed.

```tsx
import { shallow, useOthers } from "@liveblocks/react/suspense";

// Updates when any users presence value changes, but not on every render
function Typing() {
  const typingUsers = useOthers(
    (others) => others.filter((other) => other.presence.isTyping),
    shallow // 👈
  );

  // ...
}
```

This still updates when any user's presence value changes, but its more
efficient that not using `shallow`, which would update it on every render.
