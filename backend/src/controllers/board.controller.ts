import { HTTPSTATUS } from "../config/http-status.config";
import { asyncHandler } from "../middlewares/asyncHandler.middleware";
import { createBoard, getBoard, listBoards } from "../services/board.service";
import { getBoardTemplate } from "../templates";
import {
  boardTemplateParamsSchema,
  createBoardSchema,
  listBoardsQuerySchema,
} from "../validators/board.validator";

export const listBoardsHandler = asyncHandler(async (request, response) => {
  const { teamId } = listBoardsQuerySchema.parse(request.query);

  const boards = await listBoards(
    request.workspaceId!,
    teamId,
    request.user!.id,
    request.workspaceRole!,
  );

  response.status(HTTPSTATUS.OK).json({ success: true, data: { boards } });
});

export const createBoardHandler = asyncHandler(async (request, response) => {
  const input = createBoardSchema.parse(request.body);

  const board = await createBoard(
    request.workspaceId!,
    {
      teamId: input.teamId,
      title: input.title ?? "Untitled board",
      description: input.description,
      templateKey: input.templateKey,
    },
    request.user!.id,
    request.workspaceRole!,
  );

  response.status(HTTPSTATUS.CREATED).json({
    success: true,
    data: {
      board: {
        id: board._id.toString(),
        title: board.title,
        teamId: board.teamId.toString(),
        iconKey: board.iconKey,
        templateKey: board.templateKey,
      },
    },
  });
});

export const getBoardHandler = asyncHandler(async (request, response) => {
  const board = await getBoard(request.params.boardId as string, request.user!.id);

  response.status(HTTPSTATUS.OK).json({ success: true, data: { board } });
});

export const getBoardTemplateHandler = asyncHandler(async (request, response) => {
  const { key } = boardTemplateParamsSchema.parse(request.params);
  const template = getBoardTemplate(key);

  response.status(HTTPSTATUS.OK).json({ success: true, data: { template: { key, ...template } } });
});
