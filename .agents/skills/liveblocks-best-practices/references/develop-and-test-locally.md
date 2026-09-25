---
title: "Develop and test locally"
---

# Develop and test locally

The Liveblocks dev server is a local server that lets you develop and test
multiplayer features without connecting to Liveblocks production servers. It is
built on our open-source `@liveblocks/server` package.

It may not support all Liveblocks features, but fully supports Storage, Yjs,
text editors. Check the table for
[up to date info](https://liveblocks.io/docs/tools/dev-server.md).

## Set up

1. Install bun: `npm install -g bun`
2. Start the dev server: `npx liveblocks dev`
3. Copy the prompt from the terminal with "p" and paste it into your AI chat
   (this makes all the code changes, modifying `baseUrl` and
   `secret`/`publicApiKey` to the correct values).
4. Done.

- [Up to date info](https://liveblocks.io/docs/tools/dev-server.md).
- [Set up CI testing](https://liveblocks.io/docs/guides/how-to-set-up-continuous-integration-ci-testing.md).
- [Set up E2E testing](vhttps://liveblocks.io/docs/guides/how-to-set-up-end-to-end-e2e-testing-with-playwright.md).
