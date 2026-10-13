import assert from "node:assert";
import { escapeUTF8 } from "entities";
import type { Email } from "@/utils/email.ts";

interface SignUpEmailOptions {
  id: string;
  name: string;
}

assert(process.env.CLIENT_ORIGIN, "CLIENT_ORIGIN is required");
const BASE_URL = process.env.CLIENT_ORIGIN;

export function signUpEmail({ name }: SignUpEmailOptions): Email {
  return {
    subject: "Welcome to Tiles",
    body: `<p>Hi ${escapeUTF8(name)},</p>
<p>Welcome to <a href="${BASE_URL}" target="_blank">Tiles</a>!</p>
<p><a href="${BASE_URL}/library" target="_blank">Get started</a></p>
<p>-- Tiles</p>`,
  };
}
