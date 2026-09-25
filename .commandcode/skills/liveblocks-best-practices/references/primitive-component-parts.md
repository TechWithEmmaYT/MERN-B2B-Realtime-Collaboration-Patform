---
title: "Primitive component parts"
---

# Primivite component parts

Primitives are headless and unstyled components, and can be used to construct
components that fit your own design system. Each primitive is made up of one or
more components, for example `Comment` only needs `Comment.Body`. This component
takes a comment’s body, and turns it into readable text, with links and
mentions.

```tsx
import { CommentData } from "@liveblocks/client";
import { Comment } from "@liveblocks/react-ui/primitives";

// Render a custom comment body
function MyComment({ comment }: { comment: CommentData }) {
  return (
    <Comment.Body
      body={comment.body}
      className="text-gray-500"
      style={{ width: "300px" }}
      onPointerEnter={() => {}}
    />
  );
}
```

Many primitives allow you to customize their parts by passing a `components`
property. In this example, we’re modifying links in the comment, so that they’re
purple and bold.

```tsx
import { CommentData } from "@liveblocks/client";
import { Comment, CommentBodyLinkProps } from "@liveblocks/react-ui/primitives";

// Render a custom comment body
function MyComment({ comment }: { comment: CommentData }) {
  return (
    <div>
      <Comment.Body
        body={comment.body}
        components={{
          Link,
        }}
      />
    </div>
  );
}

// Render a purple link in the comment, e.g. "https://liveblocks.io"
function Link({ href, children }: CommentBodyLinkProps) {
  return (
    <Comment.Link href={href} style={{ color: "purple", fontWeight: 700 }}>
      {children}
    </Comment.Link>
  );
}
```

Merge with your design system components. `asChild` is helpful.

```tsx
function DesignSystemLink({ url, children }) {
  return (
    <a href={url} target="_blank" class="underline font-medium">
      {children}
    </a>
  );
}

function Link({ href, children }: CommentBodyLinkProps) {
  return (
    <Comment.Link href={href} asChild>
      {children}
    </Comment.Link>
  );
}
```
