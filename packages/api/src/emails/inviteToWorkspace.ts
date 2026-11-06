import { escapeUTF8 } from "entities";
import type { Email } from "@/utils/email";
import { env } from "@/env";

export interface InviteToWorkspaceEmailOptions {
  inviter: { id: string; name: string };
  workspaceName: string;
  key: string;
}

const BASE_URL = env.CLIENT_ORIGIN;

export function inviteToWorkspaceEmail({
  inviter,
  workspaceName,
  key,
}: InviteToWorkspaceEmailOptions): Email {
  return {
    subject: `${inviter.name} has invited you to ${workspaceName} on Tiles`,
    body: `<p>Hi,</p>
<p><strong>${escapeUTF8(inviter.name)}</strong> has invited you to join the ${escapeUTF8(workspaceName)} workspace on Tiles.</p>
<p><a href="${BASE_URL}/invites/join-workspace/${key}" target="_blank">Accept the invite</a>.</p>
<p>-- Tiles</p>`,
  };
}
