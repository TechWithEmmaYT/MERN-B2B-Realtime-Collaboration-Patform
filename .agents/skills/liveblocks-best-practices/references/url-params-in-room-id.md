---
title: "URL params in room ID"
---

# URL params in room ID

When setting up rooms, which often represend documents in your application, its
recommended to use URL params as room IDs. For example, common apps use these
formats:

```
https://www.figma.com/design/GTGJzKyc1k1Wm8Pn0DgjnO
https://docs.google.com/document/d/1QlfyUA4F8uKwxEt0tDbHRIw1hzgWuzmFkj3J2GcS-KA
https://www.notion.so/liveblocks/32682084c81280e6bc52e987f7c58019
```

In Next.js, it may work like this:

```tsx file="app/document/[slug]/page.tsx"
import { Room } from "./room";

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  return <Room roomId={slug}>{/* Your app */}</Room>;
}
```

```tsx file="app/document/[slug]/room.tsx"
"use client";

import { ReactNode } from "react";
import { RoomProvider } from "@liveblocks/react";

export function Room({
  roomId,
  children,
}: {
  roomId: string;
  children: ReactNode;
}) {
  return <RoomProvider id={roomId}>{children}</RoomProvider>;
}
```

## Using a naming pattern

It may also be helpful to set up a naming pattern for your room IDs, to help you
identify and filter certains rooms. For example, those created by each customer.
You can combine this with URL params, for example like this:

```tsx file="app/document/[slug]/page.tsx"
import { Room } from "./room";
import { useSession } from "your-auth-library";

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { user } = await useSession();

  if (!user) {
    return <div>Please sign in to access this document</div>;
  }

  const roomId = `${user.organization}:${slug}`;
  return <Room roomId={roomId}>{/* Your app */}</Room>;
}
```

### Document title in URL

Some apps also incorportate document titles in the URL. Notion does this, for
example, both of these work:

```
# Regular
https://www.notion.so/liveblocks/32682084c81280e6bc52e987f7c58019

# Includes title
https://www.notion.so/liveblocks/my-room-title-here-32682084c81280e6bc52e987f7c58019
```

Set this up with a simple `.split`, using an identifier that isn't used in the
room ID. In Notion's case, this is the `-` character. Here it is, combined with
the naming pattern:

```tsx file="app/document/[slug]/page.tsx"
import { Room } from "./room";
import { useSession } from "your-auth-library";

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { user } = await useSession();

  if (!user) {
    return <div>Please sign in to access this document</div>;
  }

  // Ignore the title part of the URL
  // e.g. "my-room-title-here-"
  const slugSplit = slug.split("-");
  const slugId = slugSplit[slugSplit.length - 1];

  const roomId = `${user.organization}:${slugId}`;
  return <Room roomId={roomId}>{/* Your app */}</Room>;
}
```
