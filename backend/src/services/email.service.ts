import { Env } from "../config/env.config";
import { resend } from "../config/resend.config";
import { logger } from "../utils/logger";

const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, (char) => `&#${char.charCodeAt(0)};`);

export const sendInvitationEmail = async (input: {
  invitationId: string;
  to: string;
  token: string;
  workspaceName: string;
  inviterName: string;
}) => {
  const inviteUrl = `${Env.APP_URL}/invite/${input.token}`;

  if (!resend) {
    logger.warn("RESEND_API_KEY is not set; skipping invitation email", {
      to: input.to,
      inviteUrl,
    });
    return;
  }

  const workspaceName = escapeHtml(input.workspaceName);
  const inviterName = escapeHtml(input.inviterName);

  const { error } = await resend.emails.send(
    {
      from: Env.RESEND_FROM_EMAIL,
      to: input.to,
      subject: `${input.inviterName} invited you to ${input.workspaceName} on Kano`,
      text: `${input.inviterName} invited you to collaborate in ${input.workspaceName} on Kano.

Accept the invitation: ${inviteUrl}

This invitation expires in 7 days.`,
      html: `
      <div style="font-family:Inter,Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#18181b">
        <h1 style="font-size:20px;margin:0 0 12px">Join ${workspaceName} on Kano</h1>
        <p style="font-size:14px;line-height:1.6;margin:0 0 20px">
          ${inviterName} invited you to collaborate in <strong>${workspaceName}</strong>.
        </p>
        <a href="${inviteUrl}" style="display:inline-block;background:#facc15;color:#18181b;text-decoration:none;font-weight:600;font-size:14px;padding:10px 18px;border-radius:8px">
          Accept invitation
        </a>
        <p style="font-size:12px;color:#71717a;margin:20px 0 0">This invitation expires in 7 days.</p>
      </div>
    `,
    },
    // Prevents duplicate sends if this request is retried.
    { idempotencyKey: `workspace-invite/${input.invitationId}` },
  );

  if (error) {
    logger.error("Failed to send invitation email", {
      to: input.to,
      error: error.message,
    });
  }
};
