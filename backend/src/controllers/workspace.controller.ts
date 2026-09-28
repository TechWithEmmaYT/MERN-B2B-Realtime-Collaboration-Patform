import { HTTPSTATUS } from "../config/http-status.config";
import { asyncHandler } from "../middlewares/asyncHandler.middleware";
import {
  checkSlugAvailability,
  createWorkspace,
  getWorkspaceSettings,
  listMyWorkspaces,
  updateWorkspaceSettings,
} from "../services/workspace.service";
import {
  createWorkspaceSchema,
  slugQuerySchema,
  updateWorkspaceSchema,
} from "../validators/workspace.validator";

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

export const getWorkspaceHandler = asyncHandler(async (request, response) => {
  const workspace = await getWorkspaceSettings(request.workspaceId!, request.user!.id);

  response.status(HTTPSTATUS.OK).json({ success: true, data: { workspace } });
});

export const updateWorkspaceHandler = asyncHandler(async (request, response) => {
  const input = updateWorkspaceSchema.parse(request.body);
  const workspace = await updateWorkspaceSettings(
    request.workspaceId!,
    input,
    request.user!.id,
  );

  response.status(HTTPSTATUS.OK).json({ success: true, data: { workspace } });
});
