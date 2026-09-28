import { HTTPSTATUS } from "../config/http-status.config";
import { getLiveblocks } from "../config/liveblocks.config";
import { asyncHandler } from "../middlewares/asyncHandler.middleware";
import { Board } from "../models/board.model";
import { Membership } from "../models/membership.model";
import { TeamMembership } from "../models/team-membership.model";
import { User } from "../models/user.model";
import { getUserColor } from "../utils/user-color";

export const liveblocksAuthHandler = asyncHandler(async (request, response) => {
  const { room } = request.body as { room?: string };
  const userId = request.user!.id;

  if (!room) {
    return response
      .status(HTTPSTATUS.BAD_REQUEST)
      .json({ error: "forbidden", reason: "Missing room id" });
  }

  const board = await Board.findOne({ roomId: room, archivedAt: null });
  if (!board) {
    return response
      .status(HTTPSTATUS.NOT_FOUND)
      .json({ error: "forbidden", reason: "Board not found" });
  }

  const membership = await Membership.findOne({
    workspaceId: board.workspaceId,
    userId,
  });
  const role = membership?.role;

  const hasAccess =
    role === "owner" || role === "admin"
      ? true
      : await TeamMembership.exists({
          workspaceId: board.workspaceId,
          teamId: board.teamId,
          userId,
        });

  if (!hasAccess) {
    return response
      .status(HTTPSTATUS.FORBIDDEN)
      .json({ error: "forbidden", reason: "You do not have access to this board" });
  }

  const teamMemberships = await TeamMembership.find({
    workspaceId: board.workspaceId,
    userId,
  });

  const user = await User.findById(userId);

  const { status, body } = await getLiveblocks().identifyUser(
    {
      userId,
      organizationId: board.workspaceId.toString(),
      groupIds: teamMemberships.map((tm) => tm.teamId.toString()),
    },
    {
      userInfo: {
        name: user?.name ?? "Unknown",
        avatar: user?.avatarUrl ?? "",
        color: getUserColor(userId),
      },
    },
  );

  response.status(status).type("application/json").send(body);
});
