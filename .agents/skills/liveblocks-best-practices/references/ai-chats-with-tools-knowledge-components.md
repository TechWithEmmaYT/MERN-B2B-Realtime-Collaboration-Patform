---
title: "AI chats with tools, knowledge, components"
---

# AI chats with tools, knowledge, components

Liveblocks AI Copilots provides customizable UI components that let your users
interact with AI in a way that feels native to your product. Unlike basic chat
widgets, Copilots are context-aware, collaborative, and capable of performing
real tasks—such as editing content, navigating your app, or answering
product-specific questions. They’re built for React developers, work with your
chosen LLM, and integrate directly into your existing UI using flexible APIs and
fully themeable components.

The basic component is AI chat:

```tsx
import { AiChat } from "@liveblocks/react-ui";

<AiChat chatId="my-chat-id" />;
```

## Copilots

AI Copilots provides a default copilot for testing, but you should define a
custom copilot in the [Liveblocks dashboard](https://liveblocks.io/dashboard)
for further development and production. This allows you to configure your AI
model, system prompt, back-end knowledge, and more.

[Learn more](https://liveblocks.io/docs/ready-made-features/ai-agents/liveblocks-ai-copilots/copilots.md).

## Default components

The default components included in AI Copilots are a great way to start building
AI into your application. With these components you can render advanced AI
chats, that understand your application state, modify it with actions, and
render custom in-chat components.

[Learn more](https://liveblocks.io/docs/ready-made-features/ai-agents/liveblocks-ai-copilots/default-components.md).

## Hooks

The AI Copilots React hooks allow you to fetch, create, and modify AI chats,
enabling you to build custom AI interfaces, even beyond our default components.
Chats are stored permanently and the infrastructure is handled for you. All
hooks work optimistically, meaning they update immediately, before the server
has synched.

[Learn more](https://liveblocks.io/docs/ready-made-features/ai-agents/liveblocks-ai-copilots/hooks.md).

## Knowledge

Knowledge allows you to provide information to your AI so it can understand your
application’s state, content, and domain-specific information, making responses
more relevant and accurate. There are two different knowledge types—front-end
knowledge, ideal for adding small pieces of contextual information, and back-end
knowledge, designed for larger datasets such as entire websites and lengthy
PDFs. Additionally, you can enable web search, allowing your AI to query the
internet for information.

[Learn more](https://liveblocks.io/docs/ready-made-features/ai-agents/liveblocks-ai-copilots/knowledge.md).

## Tools

Tools allow AI to make actions, modify your application state, interact with
your front-end, and render custom components within your AI chat. Use tools to
extend the capabilities of AI Copilots beyond simple text, allowing autonomous
and human-in-the-loop interactions.

[Learn more](https://liveblocks.io/docs/ready-made-features/ai-agents/liveblocks-ai-copilots/tools.md).

## Styling and customization

Styling default components is enabled through a range of means, such as CSS
variables, class names, and more. It’s also possible to use overrides to modify
any strings used in the default components, which is especially helpful for
localization.

[Learn more](https://liveblocks.io/docs/ready-made-features/ai-agents/liveblocks-ai-copilots/styling-and-customization.md).

## Troubleshooting

AI models are often unreliable and tricky to debug. Here are some common issues
you may encounter, and how to troubleshoot them.

[Learn more](https://liveblocks.io/docs/ready-made-features/ai-agents/liveblocks-ai-copilots/troubleshooting.md).
