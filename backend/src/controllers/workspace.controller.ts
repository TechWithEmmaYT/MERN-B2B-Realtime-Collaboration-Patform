import { HTTPSTATUS } from "../config/http-status.config";
import { asyncHandler } from "../middlewares/asyncHandler.middleware";
import {
  checkSlugAvailability,
  createWorkspace,
  listMyWorkspaces,
} from "../services/workspace.service";
import { createWorkspaceSchema, slugQuerySchema } from "../validators/workspace.validator";

export const listMyWorkspacesHandler = asyncHandler(async (request, response) => {
  const workspaces = await listMyWorkspaces(request.user!.id);

  response.status(HTTPSTATUS.OK).json({ success: true, data: { workspaces } });
});

export const createWorkspaceHandler = asyncHandler(async (request, response) => {
  const input = createWorkspaceSchema.parse(request.body);
  const workspace = await createWorkspace(input, request.user!.id);

  response.status(HTTPSTATUS.CREATED).json({
    success: true,
    data: {
      workspace: {
        id: workspace._id.toString(),
        name: workspace.name,
        slug: workspace.slug,
        iconType: workspace.iconType,
        iconValue: workspace.iconValue,
        iconColor: workspace.iconColor,
        ownerId: workspace.ownerId.toString(),
        createdAt: workspace.createdAt,
      },
    },
  });
});

export const checkSlugHandler = asyncHandler(async (request, response) => {
  const { slug } = slugQuerySchema.parse(request.query);
  const result = await checkSlugAvailability(slug);

  response.status(HTTPSTATUS.OK).json({ success: true, data: result });
});
