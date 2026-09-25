---
title: "Exhaustive deps with useMutation"
---

# Exhaustive deps with useMutation

`useMutation` from `@liveblocks/react` accepts a dependency array, just like
React's `useCallback`. If your project uses the `react-hooks/exhaustive-deps`
ESLint rule, the linter will **not** automatically check `useMutation` deps
unless you explicitly configure it.

## The problem

Without configuration, `useMutation` calls with missing or stale dependencies
won't trigger lint warnings, which can lead to subtle stale-closure bugs:

```tsx
const name = "Alice";

const update = useMutation(({ storage }) => {
  storage.get("user").set("name", name);
}, []);
// ~~ ❌ `name` not listed as a dependency
```

## The fix

Add `useMutation` to the `additionalHooks` option of
`react-hooks/exhaustive-deps`.

### Flat config (`eslint.config.js` / `eslint.config.mjs`)

```js
import reactHooks from "eslint-plugin-react-hooks";

export default [
  reactHooks.configs.flat.recommended,
  {
    rules: {
      "react-hooks/exhaustive-deps": [
        "error",
        { additionalHooks: "(useMutation)" },
      ],
    },
  },
];
```

### Legacy config (`.eslintrc` / `.eslintrc.json`)

```json
{
  "rules": {
    "react-hooks/exhaustive-deps": [
      "error",
      { "additionalHooks": "(useMutation)" }
    ]
  }
}
```

After this change the linter will warn about missing deps in `useMutation`, just
as it does for `useCallback` and `useMemo`.
