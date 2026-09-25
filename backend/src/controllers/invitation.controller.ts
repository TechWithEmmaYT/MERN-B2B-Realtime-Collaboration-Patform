import { HTTPSTATUS } from "../config/http-status.config";
import { asyncHandler } from "../middlewares/asyncHandler.middleware";
import { createInvitations } from "../services/invitation.service";
import { createInvitationsSchema } from "../validators/workspace.validator";

export const createInvitationsHandler = asyncHandler(async (request, response) => {
  const input = createInvitationsSchema.parse(request.body);

  const result = await createInvitations({
    workspaceId: request.workspaceId!,
    invites: input.invites,
    defaultRole: input.defaultRole,
    actorId: request.user!.id,
  });

  response.status(HTTPSTATUS.CREATED).json({ success: true, data: result });
});
