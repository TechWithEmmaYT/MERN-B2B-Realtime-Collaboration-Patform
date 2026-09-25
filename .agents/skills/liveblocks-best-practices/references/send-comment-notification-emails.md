---
title: "Send comment notification emails"
---

# Send comment notification emails

`@liveblocks/emails` provides a set of functions that simplifies sending styled
emails with Notifications and webhooks from Node.js. This is helpful when you'd
like to notify users about unread comments in your application.

Example:

```ts
import { isThreadNotificationEvent, WebhookHandler } from "@liveblocks/node";
import { Liveblocks } from "@liveblocks/node";
import { prepareThreadNotificationEmailAsReact } from "@liveblocks/emails";

const liveblocks = new Liveblocks({
  secret: "sk_prod_xxxxxxxxxxxxxxxxxxxxxxxx",
});

const webhookHandler = new WebhookHandler(
  process.env.LIVEBLOCKS_WEBHOOK_SECRET_KEY as string
);

export async function POST(request: Request) {
  const body = await request.json();
  const headers = request.headers;

  // Verify if this is a real webhook request
  let event;
  try {
    event = webhookHandler.verifyRequest({
      headers: headers,
      rawBody: JSON.stringify(body),
    });
  } catch (err) {
    console.error(err);
    return new Response("Could not verify webhook call", { status: 400 });
  }

  // Using `@liveblocks/emails` to create an email
  if (isThreadNotificationEvent(event)) {
    const emailData = await prepareThreadNotificationEmailAsReact(
      liveblocks,
      event
    );

    if (emailData.type === "unreadMention") {
      const email = (
        <div>
          <div>
            @{emailData.comment.author.id} at {emailData.comment.createdAt}
          </div>
          <div>{emailData.comment.body}</div>
        </div>
      );

      // Send unread mention email
      // ...
    }
  }

  return new Response(null, { status: 200 });
}
```

[Learn more](https://liveblocks.io/docs/api-reference/liveblocks-emails.md).
