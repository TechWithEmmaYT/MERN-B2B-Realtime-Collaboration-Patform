---
title: "Remove Liveblocks branding"
---

# Remove Liveblocks branding

By default, Liveblocks displays a "Powered by Liveblocks" badge in your
application. If you wish to remove remove the badge entirely, you can do so by
following these steps:

In the Liveblocks dashboard, navigate to your team’s settings. Under General,
toggle on the remove "Powered by Liveblocks" branding option.

---

Removing the "Powered by Liveblocks" badge on your projects requires a paid
plan. See the [pricing page](https://liveblocks.io/pricing) for more
information.

## Adjust its position

You can adjust the position of the badge by setting the badgeLocation property
on LiveblocksProvider.

```tsx
// "top-right", "bottom-right", "bottom-left", "top-left"
<LiveblocksProvider badgeLocation="bottom-right">
  <App />
</LiveblocksProvider>
```
