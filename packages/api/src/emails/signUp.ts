import assert from "node:assert";
import type { Email } from "@/utils/email.ts";

interface SignUpEmailOptions {
  id: string;
  name: string;
}

assert(process.env.CLIENT_ORIGIN, "CLIENT_ORIGIN is required");
const BASE_URL = process.env.CLIENT_ORIGIN;

// TODO: Escaping
export function signUpEmail({ id, name }: SignUpEmailOptions): Email {
  return {
    subject: "Welcome to Tiles",
    body: `<p>Hi ${name},</p>
<p>Welcome to <a href="${BASE_URL}" target="_blank">Tiles</a>!</p>
<p>Your new <a href="${BASE_URL}/profiles/${id}" target="_blank">profile page</a> is waiting for you. Have fun!</p>
<p>-- Tiles</p>`,
  };
}
