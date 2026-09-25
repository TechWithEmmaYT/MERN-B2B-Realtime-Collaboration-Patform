---
title: "Utility components"
---

# Utility components

A number of utility components are avaialble.

## Timestamp

[`Timestamp`](https://liveblocks.io/docs/api-reference/liveblocks-react-ui#primitives-Timestamp)
displays a formatted date, and automatically re-renders to support relative
formatting. Defaults to relative formatting for nearby dates (e.g. “5 minutes
ago” or "in 1 day") and a short absolute formatting for more distant ones (e.g.
“25 Aug”).

```tsx
import { Timestamp } from "@liveblocks/react-ui/primitives";

<Timestamp date={new Date()} />;
```

## Duration

[`Duration`](https://liveblocks.io/docs/api-reference/liveblocks-react-ui#primitives-Duration)
displays a formatted duration, and automatically re-renders to if the duration
is in progress. Defaults to a short format (e.g. “5s” or “1m 40s”).

```tsx
import { Duration } from "@liveblocks/react-ui/primitives";

<Duration duration={3 * 60 * 1000} />;
```

## FileSize

[`FileSize`](https://liveblocks.io/docs/api-reference/liveblocks-react-ui#primitives-FileSize)
displays a formatted file size.

```tsx
import { FileSize } from "@liveblocks/react-ui/primitives";

<FileSize size={100000} />;
```

## Emoji Picker

[Emoji Picker](https://liveblocks.io/docs/api-reference/liveblocks-react-ui#emoji-picker).
Using [Frimousse](https://frimousse.liveblocks.io) a package originally designed
for Comments, and built by the Liveblocks team, you can easily add an emoji
picker.

```tsx
import { EmojiPicker } from "frimousse";

export function MyEmojiPicker() {
  return (
    <EmojiPicker.Root>
      <EmojiPicker.Search />
      <EmojiPicker.Viewport>
        <EmojiPicker.Loading>Loading…</EmojiPicker.Loading>
        <EmojiPicker.Empty>No emoji found.</EmojiPicker.Empty>
        <EmojiPicker.List />
      </EmojiPicker.Viewport>
    </EmojiPicker.Root>
  );
}
```

### Styled picker

With Tailwind styles.

```tsx
"use client";

import { EmojiPicker } from "frimousse";

export function MyEmojiPicker() {
  return (
    <EmojiPicker.Root className="isolate flex h-[368px] w-fit flex-col bg-white dark:bg-neutral-900">
      <EmojiPicker.Search className="z-10 mx-2 mt-2 appearance-none rounded-md bg-neutral-100 px-2.5 py-2 text-sm dark:bg-neutral-800" />
      <EmojiPicker.Viewport className="relative flex-1 outline-hidden">
        <EmojiPicker.Loading className="absolute inset-0 flex items-center justify-center text-neutral-400 text-sm dark:text-neutral-500">
          Loading…
        </EmojiPicker.Loading>
        <EmojiPicker.Empty className="absolute inset-0 flex items-center justify-center text-neutral-400 text-sm dark:text-neutral-500">
          No emoji found.
        </EmojiPicker.Empty>
        <EmojiPicker.List
          className="select-none pb-1.5"
          components={{
            CategoryHeader: ({ category, ...props }) => (
              <div
                className="bg-white px-3 pt-3 pb-1.5 font-medium text-neutral-600 text-xs dark:bg-neutral-900 dark:text-neutral-400"
                {...props}
              >
                {category.label}
              </div>
            ),
            Row: ({ children, ...props }) => (
              <div className="scroll-my-1.5 px-1.5" {...props}>
                {children}
              </div>
            ),
            Emoji: ({ emoji, ...props }) => (
              <button
                className="flex size-8 items-center justify-center rounded-md text-lg data-[active]:bg-neutral-100 dark:data-[active]:bg-neutral-800"
                {...props}
              >
                {emoji.emoji}
              </button>
            ),
          }}
        />
      </EmojiPicker.Viewport>
    </EmojiPicker.Root>
  );
}
```
