import { Liveblocks } from "@liveblocks/node";

import { Env } from "./env.config";

let client: Liveblocks | null = null;

export const getLiveblocks = (): Liveblocks => {
  if (!Env.LIVEBLOCKS_SECRET_KEY) {
    throw new Error("LIVEBLOCKS_SECRET_KEY is not configured");
  }

  client ??= new Liveblocks({ secret: Env.LIVEBLOCKS_SECRET_KEY });
  return client;
};
