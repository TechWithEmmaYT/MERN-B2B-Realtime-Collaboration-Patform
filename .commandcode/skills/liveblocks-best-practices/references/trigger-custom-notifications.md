---
title: "Trigger custom notifications"
---

# Trigger custom notifications

Notifications are triggered in Liveblocks when a user is tagged or has an unread
comment. However, you can also render completely custom notifications with
[`triggerInboxNotification`](https://liveblocks.io/docs/api-reference/liveblocks-node#post-inbox-notifications-trigger),
useful for any purpose.

```tsx
import { Liveblocks } from "@liveblocks/node";

const liveblocks = new Liveblocks({
  secret: process.env.LIVEBLOCKS_SECRET_KEY!,
});

await liveblocks.triggerInboxNotification({
  // The ID of the user that will receive the inbox notification
  userId: "steven@example.com",

  // The custom notification kind, must start with a $
  kind: "$fileUploaded",

  // Custom ID for this specific notification
  subjectId: "my-file",

  // Custom data related to the activity that you need to render the inbox notification
  activityData: {
    // Data can be a string, number, or boolean
    file: "https://example.com/my-file.zip",
    size: 256,
    success: true,
  },

  // Optional, define the room ID the notification was sent from
  roomId: "my-room-id",

  // Optional, trigger it for a specific organization
  organizationId: "acme-corp",
});
```

To type custom notifications, edit the ActivitiesData type in your config file.

```ts file="liveblocks.config.ts"
declare global {
  interface Liveblocks {
    // Custom activities data for custom notification kinds
    ActivitiesData: {
      // Example, a custom $alert kind
      $alert: {
        title: string;
        message: string;
      };
    };

    // Other kinds
    // ...
  }
}
```

## Render in your app

Render them in your inbox like this:

```tsx
import { useInboxNotifications } from "@liveblocks/react/suspense";
import { InboxNotification } from "@liveblocks/react-ui";

const { inboxNotifications } = useInboxNotifications();

inboxNotifications.map((inboxNotification) => (
  <InboxNotification
    inboxNotification={inboxNotification}
    kinds={{
      $alert: (props) => {
        const { title, message } = props.inboxNotification.activities[0].data;

        return (
          <InboxNotification.Custom
            {...props}
            title={title}
            aside={<InboxNotification.Icon>❗</InboxNotification.Icon>}
          >
            {message}
          </InboxNotification.Custom>
        );
      },
    }}
  />
));
```

Alternatively, structure like this:

```tsx
import {
  InboxNotification,
  InboxNotificationCustomKindProps,
} from "@liveblocks/react-ui";

function AlertNotification(props: InboxNotificationCustomKindProps<"$alert">) {
  // `title` and `message` are correctly typed, as defined in your config
  const { title, message } = props.inboxNotification.activities[0].data;

  return (
    <InboxNotification.Custom
      {...props}
      title={title}
      aside={<InboxNotification.Icon>❗</InboxNotification.Icon>}
    >
      {message}
    </InboxNotification.Custom>
  );
}

function Notification({ inboxNotification }) {
  return (
    <InboxNotification
      inboxNotification={inboxNotification}
      kinds={{ $alert: AlertNotification }}
    />
  );
}
```

## Batching custom notifications

You can configure a custom notification kind to have batching enabled. When it’s
enabled, triggering an inbox notification activity for a specific `subjectId`,
will update the existing inbox notification instead of creating a new one.

To use this, you must first
[enable batching in the dashboard](https://liveblocks.io/docs/ready-made-features/notifications/concepts#Notification-batching).
Next, trigger a notification with the same `subjectId` as an existing
notification, and the result will be added to the `activityData` array.

```ts
const options = {
  userId: "steven@example.com",
  kind: "$fileUploaded",
  subjectId: "my-file",
};

await liveblocks.triggerInboxNotification({
  ...options,

  activityData: {
    status: "processing",
  },
});

await liveblocks.triggerInboxNotification({
  ...options,

  activityData: {
    status: "complete",
  },
});

const { data: inboxNotifications } = await liveblocks.getInboxNotifications({
  userId: "steven@example.com",
});

// {
//   id: "in_3dH7sF3...",
//   kind: "$fileUploaded",
//   activities: [
//     { status: "processing" },
//     { status: "complete" },
//   ],
//   ...
// }
console.log(inboxNotifications[0]);
```

### Rendering batched notifications

If you’re batching custom notifications, you can then render each activity
inside a single notification.

```tsx
<InboxNotification
  inboxNotification={inboxNotification}
  kinds={{
    $alert: (props) => {
      // Each batched `activityData` is added to the `activities` array
      const { activities } = props.inboxNotification;

      return (
        <InboxNotification.Custom
          {...props}
          title={title}
          aside={<InboxNotification.Icon>❗</InboxNotification.Icon>}
        >
          {activities.map((activity) => (
            <div key={activity.id}>
              <div>{activity.data.title}</div>
              <div>{activity.data.message}</div>
            </div>
          ))}
        </InboxNotification.Custom>
      );
    },
  }}
/>
```
