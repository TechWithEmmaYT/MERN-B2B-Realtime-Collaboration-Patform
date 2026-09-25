---
title: "Authenticating with ID Tokens"
---

## Authenticating with ID Tokens

The recommended authentication method for Liveblocks is ID tokens. Start this
with
[`identifyUser`](https://liveblocks.io/docs/api-reference/liveblocks-node#id-tokens),
before returning the `body` and `status` from your API endpoint.

```ts
import { Liveblocks } from "@liveblocks/node";

const liveblocks = new Liveblocks({
  secret: process.env.LIVEBLOCKS_SECRET_KEY!,
});

export async function POST(request: Request) {
  // Get the current user from your database
  const user = __getUserFromDB__(request);

  // Identify the user and return the result
  const { status, body } = await liveblocks.identifyUser(
    {
      // Required, the current user's ID
      userId: user.id,

      // Groups the user belongs to, optional
      // groupIds: ["design", "engineering"],

      // Optional, the organization the user belongs to
      // organizationId: "acme-corp",
    },
    // Optional, custom user metadata, available in React hooks
    { userInfo: user.metadata }
  );

  return new Response(body, { status });
}
```

ID token auth requires you to create rooms manually, and set permissions, for
example with
[`getOrCreateRoom`](https://liveblocks.io/docs/api-reference/liveblocks-node#get-or-create-rooms-roomId).
If you don't set permissions, the room will be private by default, and no one
will be able to join. You must set a form of permissions, either
`defaultAccesses`, `groupsAccesses`, or `usersAccesses`.

```ts
const room = await liveblocks.getOrCreateRoom("my-room-id", {
  // The default room permissions. `[]` for private, `["room:write"]` for public.
  defaultAccesses: [],

  // Optional, the room's group ID permissions
  groupsAccesses: {
    design: ["room:write"],
    engineering: ["room:presence:write", "room:read"],
  },

  // Optional, the room's user ID permissions
  usersAccesses: {
    "my-user-id": ["room:write"],
  },

  // Optional, custom metadata to attach to the room
  // metadata: {
  //   myRoomType: "whiteboard",
  // },

  // Optional, create it on a specific organization
  // organizationId: "acme-corp",
});
```

Read the `create-rooms-manually` reference for more information.

## See also

- [Authenticating with ID Tokens](https://liveblocks.io/docs/authentication.md)
