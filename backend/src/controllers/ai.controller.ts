import { HTTPSTATUS } from "../config/http-status.config";
import { asyncHandler } from "../middlewares/asyncHandler.middleware";
import { getBoard } from "../services/board.service";
import { stopAiReply, streamAiReply } from "../services/ai.service";
import { logger } from "../utils/logger";
import { aiChatSchema, stopAiChatSchema } from "../validators/ai.validator";

// Authorizes board access via `getBoard`, then answers straight away (202) and
// streams the reply into the board's Liveblocks feed in the background. The reply
// reaches everyone through the feed, so the HTTP request doesn't wait for it —
// waiting made long replies hit the client's 20s request timeout.
export const aiChatHandler = asyncHandler(async (request, response) => {
  const { feedId, messages } = aiChatSchema.parse(request.body);
  const board = await getBoard(request.params.boardId as string, request.user!.id);

  void streamAiReply({ roomId: board.roomId, feedId, messages }).catch((error) => {
    logger.error("AI reply failed", {
      boardId: request.params.boardId,
      feedId,
      error: error instanceof Error ? error.message : String(error),
    });
  });

  response.status(HTTPSTATUS.ACCEPTED).json({ success: true, data: { accepted: true } });
});

// Stops an in-flight reply so the assistant message finalizes with the partial text.
export const stopAiChatHandler = asyncHandler(async (request, response) => {
  const { feedId } = stopAiChatSchema.parse(request.body);
  const board = await getBoard(request.params.boardId as string, request.user!.id);

  stopAiReply(board.roomId, feedId);

  response.status(HTTPSTATUS.OK).json({ success: true, data: { ok: true } });
});
