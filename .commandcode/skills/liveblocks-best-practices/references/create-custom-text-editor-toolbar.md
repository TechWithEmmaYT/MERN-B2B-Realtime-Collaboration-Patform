---
title: "Create custom text editor toolbar"
---

# Create custom text editor toolbar

Tiptap and Lexical allow you to create custom toolbars, with sty;es that match
the existing toolbar and Liveblocks components. This works the same way for
`Toolbar` and `FloatingToolbar`. `FloatingToolbar` floats below the current text
selection.

```tsx
import { Toolbar } from "@liveblocks/react-tiptap";
import { Icon } from "@liveblocks/react-ui";
import { Editor } from "@tiptap/react";

function CustomToolbar({ editor }: { editor: Editor | null }) {
  return (
    <Toolbar editor={editor}>
      <Toolbar.SectionHistory />
      <Toolbar.Separator />
      <Toolbar.Button
        name="Help"
        icon={<Icon.QuestionMark />}
        shortcut="CMD-H"
        onClick={() => console.log("help")}
      />
      <Toolbar.Toggle
        name="Highlight"
        icon={<div>🖊️</div>}
        active={editor?.isActive("highlight") ?? false}
        onClick={() => editor?.chain().focus().toggleHighlight().run()}
        disabled={!editor?.can().chain().focus().toggleHighlight().run()}
      />
    </Toolbar>
  );
}
```

## Buttons

Buttons can be customized lots:

```tsx
import { Toolbar } from "@liveblocks/react-tiptap";
import { Icon } from "@liveblocks/react-ui";

// Button says "Question"
<Toolbar.Toggle name="Question" onClick={/* ... */} />

// Tooltip says "Question [⌘+Q]"
<Toolbar.Button name="Question" shortcut="CMD+Q" onClick={/* ... */} />

// Custom icon, replaces the name in the button
<Toolbar.Button name="Question" icon={<div>?</div>} onClick={/* ... */} />

// Using a Liveblocks icon, replaces the name in the button
<Toolbar.Button name="Question" icon={<Icon.QuestionMark />} onClick={/* ... */} />

// Passing children visually replaces the `name` and `icon`
<Toolbar.Button name="Question" onClick={/* ... */}>
  ? Ask a question
</Toolbar.Button>

// Props are passed to the inner `button`
<Toolbar.Button
  name="Question"
  style={{ marginLeft: 10 }}
  className="custom-button"
  onMouseOver={() => console.log("Hovered")}
/>
```

## Toggles

Toggles too:

```tsx
import { Toolbar } from "@liveblocks/react-tiptap";
import { Icon } from "@liveblocks/react-ui";

// Button says "Highlight"
<Toolbar.Toggle
  name="Highlight"
  active={/* ... */}
  onClick={/* ... */}
/>

// Tooltip says "Highlight [⌘+H]"
<Toolbar.Toggle
  name="Highlight"
  shortcut="CMD+H"
  active={/* ... */}
  onClick={/* ... */}
/>

// Custom icon, replaces the name in the button
<Toolbar.Toggle
  name="Highlight"
  icon={<div>🖊</div>}
  active={/* ... */}
  onClick={/* ... */}
/>

// Using a Liveblocks icon, replaces the name in the button
<Toolbar.Toggle
  name="Highlight"
  icon={<Icon.QuestionMark />}
  active={/* ... */}
  onClick={/* ... */}
/>

// Passing children visually replaces the `name` and `icon`
<Toolbar.Toggle
  name="Highlight"
  active={/* ... */}
  onClick={/* ... */}
>
  🖊️Highlight
</Toolbar.Toggle>

// Props are passed to the inner `button`
<Toolbar.Toggle
  name="Highlight"
  active={/* ... */}
  onClick={/* ... */}
  style={{ marginLeft: 10 }}
  className="custom-toggle"
  onMouseOver={() => console.log("Hovered")}
/>
```

## BlockSelector

Also the `BlockSelector`:

```tsx
import { Toolbar } from "@liveblocks/react-tiptap";

<Toolbar editor={editor}>
  <Toolbar.BlockSelector
    items={(defaultItems) => [
      ...defaultItems,
      {
        name: "Code block",
        icon: <div>❮ ❯</div>, // Optional
        // label: <div className="font-mono">Code</div>, // Optional, overwrites `icon` + `name`
        isActive: (editor) => editor.isActive("codeBlock"),
        setActive: (editor) =>
          editor.chain().focus().clearNodes().toggleCodeBlock().run(),
      },
    ]}
  />
</Toolbar>;
```

```tsx
import { Toolbar } from "@liveblocks/react-tiptap";

<Toolbar.BlockSelector
  items={(defaultItems) =>
    defaultItems.map((item) => {
      let label;

      if (item.name === "Text") {
        label = <span>Regular text</span>;
      }

      if (item.name === "Heading 1") {
        label = (
          <span style={{ fontSize: 18, fontWeight: "bold" }}>Heading 1</span>
        );
      }

      if (item.name === "Heading 2") {
        label = (
          <span style={{ fontSize: 16, fontWeight: "bold" }}>Heading 2</span>
        );
      }

      if (item.name === "Heading 3") {
        label = (
          <span style={{ fontSize: 15, fontWeight: "bold" }}>Heading 3</span>
        );
      }

      if (item.name === "Blockquote") {
        label = (
          <span style={{ borderLeft: "3px solid gray", paddingLeft: 8 }}>
            Blockquote
          </span>
        );
      }

      return {
        ...item,
        label,
        icon: null, // Hide all icons
      };
    })
  }
/>;
```

Remember to export from `"@liveblocks/react-lexical"` for Lexical. Export and
use `{ FloatingToolbar }` if you'd like to modify the floating version.

```tsx
import { FloatingToolbar, Toolbar } from "@liveblocks/react-lexical";
import { Icon } from "@liveblocks/react-ui";
import { Editor } from "@tiptap/react";

function CustomToolbar({ editor }: { editor: Editor | null }) {
  return (
    <FloatingToolbar editor={editor}>
      <Toolbar.SectionHistory />
      <Toolbar.Separator />
      <Toolbar.Button
        name="Help"
        icon={<Icon.QuestionMark />}
        shortcut="CMD-H"
        onClick={() => console.log("help")}
      />
      <Toolbar.Toggle
        name="Highlight"
        icon={<div>🖊️</div>}
        active={editor?.isActive("highlight") ?? false}
        onClick={() => editor?.chain().focus().toggleHighlight().run()}
        disabled={!editor?.can().chain().focus().toggleHighlight().run()}
      />
    </FloatingToolbar>
  );
}
```
