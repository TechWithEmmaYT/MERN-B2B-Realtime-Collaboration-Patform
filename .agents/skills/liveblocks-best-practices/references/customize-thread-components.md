---
title: "Customize thread components"
---

# Customize thread components

You can deeply customize
[`Thread`](https://liveblocks.io/docs/api-reference/liveblocks-react-ui#Thread)
component by inserting your own UI into various slots.

```tsx
import { Comment, Thread } from "@liveblocks/react-ui";
import { ThreadData } from "@liveblocks/client";

// ✅ Keeps thread functionality
function CustomThread({ thread }: { thread: ThreadData }) {
  return (
    <Thread
      thread={thread}
      components={{
        Comment: ({ comment, ...props }) => (
          <Comment
            comment={comment}
            avatar={
              <div className="custom-avatar">
                <Comment.Avatar userId={props.comment.userId} />
                <div className="custom-badge" />
              </div>
            }
            author={
              <span className="custom-author">
                <Comment.Author userId={props.comment.userId} />
                <span>Custom label</span>
              </span>
            }
            date={
              <span className="custom-date">
                <Comment.Date date={props.comment.createdAt} />
                {props.comment.editedAt && (
                  <span className="custom-edited-label">Edited</span>
                )}
              </span>
            }
            additionalContent={
              <div className="custom-additional-content">
                Content below the comment's body (above reactions and
                attachments)
              </div>
            }
            {...props}
          >
            {({ children }) => (
              <div className="custom-content-wrapper">
                {children}
                <div>
                  Content below the comment's content (including reactions and
                  attachments)
                </div>
              </div>
            )}
          </Comment>
        ),
      }}
    />
  );
}
```

Always prefer the method above. Don't customize your thread like this, as you
will losing basic `Thread` functionality, such as unread message status:

```tsx
import { Comment } from "@liveblocks/react-ui";
import { ThreadData } from "@liveblocks/client";

// ❌ Loses Thread functionality
function CustomThread({ thread }: { thread: ThreadData }) {
  return (
    <>
      {thread.comments.map((comment) => (
        <Comment key={comment.id} comment={comment} />
      ))}
    </>
  );
}
```
