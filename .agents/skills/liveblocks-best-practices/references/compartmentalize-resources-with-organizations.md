---
title: "Compartmentalize resources with organizations"
---

# Compartmentalize resources with organizations

Setting an `organizationId` on various resources will compartmentalize it to
that organization, which can be used like a workspace in your application. Here
are some examples, note that all are server-side API calls.

```ts
const room = await liveblocks.createRoom("my-room-id", {
  organizationId: "my-organization-id",
});

const { data: rooms, nextCursor } = await liveblocks.getRooms({
  organizationId: "my-organization-id",
});

await liveblocks.triggerInboxNotification({
  userId: "steven@example.com",
  kind: "$fileUploaded",
  subjectId: "my-file",
  activityData: {},
  organizationId: "my-organization-id",
});

await liveblocks.deleteAllInboxNotifications({
  userId: "steven@example.com",
  organizationId: "my-organization-id",
});

const { data, nextCursor } = await liveblocks.getUserRoomSubscriptionSettings({
  userId: "steven@example.com",
  organizationId: "my-organization-id",
});
```

When no `organizationId` is set, the `"default"` organization is used.

## Adding a user to an organization

When authorizing a user with Liveblocks, you can specify the organization they
belong to. Each user is only authorized for one organization at a time, meaning
they need to re-authenticate to access resources in another organization, such
as notifications. Organizations can be used with both ID Token and Access Token
authentication.

### ID tokens

When using ID tokens, you can set the `organizationId` when using
`identifyUser`. Tokens generated for a specific organization, will only allow
access to resources inside this organization, even if the user has access to
rooms in other organizations.

```ts
const { body, status } = await liveblocks.identifyUser({
  userId: "olivier@example.com",
  organizationId: "organization123",
});

// '{ token: "eyJga7..." }'
console.log(body);
```

### Access tokens

When using access tokens, you can set the organizationId when you prepare a
session. Tokens generated for a specific organization, will only allow access to
resources inside this organization, even if the token has permissions to rooms
in other organizations.

```ts
const session = liveblocks.prepareSession("olivier@example.com", {
  organizationId: "organization123",
});

// Giving full access to one room
session.allow("Vu78Rt:design:9Hdu73", session.FULL_ACCESS);

// Give full access to every room with an ID beginning with "Vu78Rt:product:"
session.allow("Vu78Rt:product:*", session.FULL_ACCESS);

const { body, status } = await session.authorize();
```

## Front-end

After authenticating, the front-end will have access to resources that are part
of that organization, for example notifications with `useInboxNotifications`.

## See also

- [Organizations](https://liveblocks.io/docs/authentication/organizations.md)
