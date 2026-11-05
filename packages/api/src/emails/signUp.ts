import { escapeUTF8 } from "entities";
import type { Email } from "@/utils/email";
import { env } from "@/env";

interface SignUpEmailOptions {
  id: string;
  name: string;
}

const BASE_URL = env.CLIENT_ORIGIN;

export function signUpEmail({ name }: SignUpEmailOptions): Email {
  return {
    subject: "Welcome to Tiles",
    body: `<p>Hi ${escapeUTF8(name)},</p>
<p>Welcome to <a href="${BASE_URL}" target="_blank">Tiles</a>!</p>
<p><a href="${BASE_URL}/library" target="_blank">Get started</a></p>
<p>-- Tiles</p>`,
  };
}
