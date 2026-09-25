---
title: "Create rooms manually"
---

# Create rooms manually

Create Liveblocks rooms manually to control your own permissions and metadata.
It's recommended to use
[`getOrCreateRoom`](https://liveblocks.io/docs/api-reference/liveblocks-node#get-or-create-rooms-roomId)
for this and do standard
[error handling](https://liveblocks.io/docs/api-reference/liveblocks-node#error-handling).

```tsx
import { Liveblocks } from "@liveblocks/node";

const liveblocks = new Liveblocks({
  secret: process.env.LIVEBLOCKS_SECRET_KEY!,
});

export function fetchRoom(roomId: string) {
  let room;

  try {
    room = await liveblocks.getOrCreateRoom(roomId, {
      // The default room permissions. `[]` for private, `["room:write"]` for public.
      defaultAccesses: [],

      // Optional, custom metadata to attach to the room
      metadata: {
        title: "Untitled",
      },

      // Optional, the room's group ID permissions
      // groupsAccesses: {
      //   design: ["room:write"],
      //   engineering: ["room:presence:write", "room:read"],
      // },

      // Optional, the room's user ID permissions
      // usersAccesses: {
      //   "my-user-id": ["room:write"],
      // },

      // Optional, create it on a specific organization
      // organizationId: "acme-corp",
    });
  } catch (error) {
    if (error instanceof LiveblocksError) {
      // Handle specific LiveblocksError cases
      console.error(
        `Error getting or creating room: ${error.status} - ${error.message}`
      );
      switch (
        error.status
        // Specific cases based on status codes
      ) {
      }
    } else {
      // Handle general errors
      console.error(`Unexpected error: ${error.message}`);
    }
    return null;
  }

  return room;
}
```

How you might use this in Next.js.

```tsx file="app/document/[slug]/page.tsx"
export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const room = await fetchRoom(slug);

  if (!room) {
    return <ErrorPage />;
  }

  return <CollaborativeApp title={room.metadata.title} />;
}
```

A `title` is never required, but it is another reason you may wish to fetch the
room beforehand.
