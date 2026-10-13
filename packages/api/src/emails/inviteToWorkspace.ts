import assert from "node:assert";
import { escapeUTF8 } from "entities";
import type { Email } from "@/utils/email.ts";

export interface InviteToWorkspaceEmailOptions {
  inviter: { id: string; name: string };
  workspaceName: string;
  key: string;
}

assert(process.env.CLIENT_ORIGIN, "CLIENT_ORIGIN is required");
const BASE_URL = process.env.CLIENT_ORIGIN;

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
