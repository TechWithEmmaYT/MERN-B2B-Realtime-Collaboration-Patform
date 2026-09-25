---
title: "Offline support in text editors"
---

# Offline support in text editors

Yjs, Tiptap, and BlockNote all have offline support. This means that once a
document has been opened, it’s saved locally on the browser, and can be shown
instantly without a loading screen. As soon as Liveblocks connects, any remote
changes will be synchronized, without any load spinner. Enable this by passing a
`offlineSupport_experimental` value.

```tsx
import { useLiveblocksExtension } from "@liveblocks/react-tiptap";

function TextEditor() {
  const liveblocks = useLiveblocksExtension({
    offlineSupport_experimental: true,
  });

  // ...
}
```

To make sure that your editor loads instantly, you must structure your app
carefully to avoid any Liveblocks hooks and `ClientSideSuspense` components from
triggering a loading screen. For example, if you’re displaying threads in your
editor with `useThreads`, you must place this inside a separate component and
wrap it in `ClientSideSuspense`.

```tsx
"use client";

import { ClientSideSuspense, useThreads } from "@liveblocks/react/suspense";
import {
  useLiveblocksExtension,
  AnchoredThreads,
  FloatingComposer,
} from "@liveblocks/react-tiptap";
import { Editor, EditorContent, useEditor } from "@tiptap/react";

export function TiptapEditor() {
  const liveblocks = useLiveblocksExtension({
    offlineSupport_experimental: true,
  });

  const editor = useEditor({
    extensions: [
      liveblocks,
      // ...
    ],
    immediatelyRender: false,
  });

  return (
    <>
      <EditorContent editor={editor} />
      <FloatingComposer editor={editor} style={{ width: 350 }} />
      <ClientSideSuspense fallback={null}>
        <Threads editor={editor} />
      </ClientSideSuspense>
    </>
  );
}

function Threads({ editor }: { editor: Editor }) {
  const { threads } = useThreads();

  return <AnchoredThreads editor={editor} threads={threads} />;
}
```

## BlockNote

Here's the BlockNote option, it works in the same way:

```tsx
import { useCreateBlockNoteWithLiveblocks } from "@liveblocks/react-blocknote";

function TextEditor() {
  const editor = useCreateBlockNoteWithLiveblocks(
    {},
    {
      offlineSupport_experimental: true,
    }
  );

  // ...
}
```
