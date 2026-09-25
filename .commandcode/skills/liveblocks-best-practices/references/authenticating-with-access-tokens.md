---
title: "Authenticating with Access Tokens"
---

## Authenticating with Access Tokens

Access tokens is a simpler method for authentication (the recommended method is
ID tokens). Start this with
[`identifyUser`](https://liveblocks.io/docs/api-reference/liveblocks-node#access-tokens),
before returning the `body` and `status` from your API endpoint.

```ts
import { Liveblocks } from "@liveblocks/node";

const liveblocks = new Liveblocks({
  secret: process.env.LIVEBLOCKS_SECRET_KEY!,
});

export async function POST(request: Request) {
  // Get the current user from your database
  const user = __getUserFromDB__(request);

  const session = liveblocks.prepareSession(
    // Required, the current user's ID
    user.id,
    {
      // Optional, used to provision room access on group level
      // groupIds: ["design", "engineering"],

      // Optional, the organization the user belongs to
      // organizationId: "acme-corp",

      // Optional, custom user metadata
      userInfo: user.metadata,
    }
  );

  // Use a naming pattern to allow access to rooms with wildcards
  // Giving the user read access on their org, and write access on their group
  session.allow(`${user.organization}:*`, session.READ_ACCESS);
  session.allow(`${user.organization}:${user.group}:*`, session.FULL_ACCESS);

  // Authorize the user and return the result
  const { status, body } = await session.authorize();
  return new Response(body, { status });
}
```

## Naming pattern

It's recommended to use a naming pattern for your rooms with access tokens, to
allow access to rooms with wildcards.

Let's picture an organization in your product, Acme, set up using workspace
permissions. This customer has a number of group, and each group contains a
number of documents. In your application, each group and document has a unique
ID, and we can use these to create a naming pattern for your rooms. For example,
the Acme organization has a Product group (`product`) with two documents inside
(`6Dsw12`, `L2hr8p`).

```diagram
   Organization        Room ID
        │                 │
  ┌─────▼────┐    ┌───────▼────────┐
  │   acme   │    │ product:6Dsw1z │
  └──────────┘    └────┬───────┬───┘
                       │       │
                    Group   Document
```

An example of a naming pattern would be to combine these IDs into a unique room
ID separating them with symbols, such as `<group_id>:<document_id>`. A room ID
following this pattern may look like `product:6Dsw1z`. The acme organization is
also added as an `organizationId`.

## See also

- [Authenticating with access Tokens](https://liveblocks.io/docs/authentication/access-token.md)
