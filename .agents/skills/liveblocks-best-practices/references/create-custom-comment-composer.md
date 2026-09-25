---
title: "Create custom comment composers"
---

# Create custom comment composer

You can create a custom comment composer with
[`useComposer`](https://liveblocks.io/docs/api-reference/liveblocks-react-ui#useComposer).

```tsx
import { Composer, useComposer } from "@liveblocks/react-ui/primitives";
import { useCreateThread } from "@liveblocks/react/suspense";

function MyComposer() {
  const createThread = useCreateThread();

  return (
    <Composer.Form
      onComposerSubmit={({ body, attachments }) => {
        const thread = createThread({
          body,
          attachments,
          metadata: {},
        });
      }}
    >
      <Editor />
    </Composer.Form>
  );
}

function Editor() {
  const { createMention } = useComposer();

  return (
    <>
      <Composer.Editor components={/* Your custom component parts */} />
      <button onClick={createMention}>Add mention</button>
    </>
  );
}
```

[More info](https://liveblocks.io/docs/api-reference/liveblocks-react-ui#Custom-composer-behavior).
