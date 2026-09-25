---
title: "Multiplayer React Flow"
---

# Multiplayer React Flow

Use the LiveblocksReact Flow package to create multiplayer diagrams.

```bash
npm install @liveblocks/react-flow @xyflow/react
```

```tsx
"use client";

import { ReactFlow } from "@xyflow/react";
import { useLiveblocksFlow, Cursors } from "@liveblocks/react-flow";
import "@xyflow/react/dist/style.css";
import "@liveblocks/react-ui/styles.css";
import "@liveblocks/react-flow/styles.css";

export function Flow() {
  const { nodes, edges, onNodesChange, onEdgesChange, onConnect, onDelete } =
    useLiveblocksFlow({
      suspense: true,
      nodes: {
        initial: [
          {
            id: "1",
            type: "input",
            data: { label: "Start" },
            position: { x: 250, y: 0 },
          },
          {
            id: "2",
            data: { label: "Process" },
            position: { x: 100, y: 110 },
          },
          {
            id: "3",
            type: "output",
            data: { label: "End" },
            position: { x: 250, y: 220 },
          },
          // ...
        ],
      },
      edges: {
        initial: [
          { id: "e1-2", source: "1", target: "2" },
          { id: "e2-3", source: "2", target: "3" },
          // ...
        ],
      },
    });

  return (
    <div style={{ width: "100%", height: "100vh" }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onDelete={onDelete}
      >
        <Cursors />
      </ReactFlow>
    </div>
  );
}
```

Make sure to connect to a room and authenticate users as with all Liveblocks
apps. [Learn more](https://liveblocks.io/docs/get-started/nextjs-react-flow).
