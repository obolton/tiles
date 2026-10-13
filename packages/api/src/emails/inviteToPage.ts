import assert from "node:assert";
import { escapeUTF8 } from "entities";
import type { Email } from "@/utils/email.ts";

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
<p><strong>${escapeUTF8(inviter.name)}</strong> has invited you to collaborate on "${escapeUTF8(title)}"</p>
<p><a href="${BASE_URL}/invites/accept/${key}" target="_blank">Accept the invite</a>.</p>
<p>-- Tiles</p>`,
  };
}
