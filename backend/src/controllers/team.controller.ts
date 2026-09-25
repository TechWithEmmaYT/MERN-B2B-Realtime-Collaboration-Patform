import { HTTPSTATUS } from "../config/http-status.config";
import { asyncHandler } from "../middlewares/asyncHandler.middleware";
import { createTeam, listTeams } from "../services/team.service";
import { createTeamSchema } from "../validators/team.validator";

export const listTeamsHandler = asyncHandler(async (request, response) => {
  const teams = await listTeams(
    request.workspaceId!,
    request.user!.id,
    request.workspaceRole!,
  );

  response.status(HTTPSTATUS.OK).json({ success: true, data: { teams } });
});

export const createTeamHandler = asyncHandler(async (request, response) => {
  const input = createTeamSchema.parse(request.body);
  const team = await createTeam(request.workspaceId!, input.name, request.user!.id);

  response.status(HTTPSTATUS.CREATED).json({ success: true, data: { team } });
});
