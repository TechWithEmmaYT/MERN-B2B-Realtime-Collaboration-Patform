---
title: "Multiple text editors"
---

# Multiple text editors

Tiptap and BlockNote both support multiple text editors on one page by passing
values to the `field` property. Think of it like an ID for the current editor.

```tsx
import { useLiveblocksExtension } from "@liveblocks/react-tiptap";

function TextEditor() {
  const liveblocks = useLiveblocksExtension({
    field: "editor-one",
  });

  // ...
}
```

In real use, you could store each editor's ID in Liveblocks storage:

```tsx
import { useStorage, useMutation } from "@liveblocks/react/suspense";
import { useLiveblocksExtension } from "@liveblocks/react-tiptap";
import { useEditor, EditorContent } from "@tiptap/react";

function TextEditors() {
  const editorIds = useStorage((root) => root.editorIds);

  const newEditor = useMutation(({ storage }) => {
    const newId = nanoid();
    storage.get("editorsIds").push(newId);
  }, []);

  return (
    <div>
      {editorIds.map((editorId) => (
        <TextEditor key={editorId} field={editorId} />
      ))}
      <button>New editor</button>
    </div>
  );
}

function TextEditor({ field }: { field: string }) {
  const liveblocks = useLiveblocksExtension({
    field: "editor-one",
  });

  return (
    <div>
      <EditorContent editor={editor} />
    </div>
  );
}
```

```ts file="liveblocks.config.ts"
import { LiveList } from "@liveblocks/client";

declare global {
  interface Liveblocks {
    Storage: {
      editorIds: LiveList<string>;
    };
  }
}

// Necessary if you have no imports/exports
export {};
```

```tsx
import { LiveList } from "@liveblocks/client";
import { LiveblocksProvider } from "@liveblocks/react/suspense";

<LiveblocksProvider initialStorage={{ editorIds: new LiveList() }}>
```

## BlockNote

BlockNote works in the same way, with this option:

```tsx
import { useCreateBlockNoteWithLiveblocks } from "@liveblocks/react-blocknote";

function TextEditor() {
  const editor = useCreateBlockNoteWithLiveblocks(
    {},
    {
      field: "editor-one",
    }
  );

  // ...
}
```
