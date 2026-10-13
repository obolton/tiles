import assert from "node:assert";
import type { Email } from "@/utils/email.ts";
import { escapeHtml } from "@/utils/html.ts";

interface InviteToPageEmailOptions {
  inviter: { id: string; name: string };
  title: string;
  key: string;
}

assert(process.env.CLIENT_ORIGIN, "CLIENT_ORIGIN is required");
const BASE_URL = process.env.CLIENT_ORIGIN;

export function inviteToPageEmail({ inviter, title, key }: InviteToPageEmailOptions): Email {
  return {
    subject: `${inviter.name} has invited you to collaborate on "${title}"`,
    body: `<p>Hi,</p>
<p><strong>${escapeHtml(inviter.name)}</strong> has invited you to collaborate on "${escapeHtml(title)}"</p>
<p><a href="${BASE_URL}/invites/accept/${key}" target="_blank">Accept the invite</a>.</p>
<p>-- Tiles</p>`,
  };
}
