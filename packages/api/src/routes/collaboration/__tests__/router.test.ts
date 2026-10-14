import { vi } from "vitest";
import {
  inviteToPage,
  acceptPageInvite,
  deletePageInvite,
  revokePageAccess,
} from "@/routes/collaboration/collaboration";
import { describeRouter } from "@/test/procedures";
import { PAGE_ID } from "@/test/mocks/middleware";

vi.mock("@/routes/collaboration/collaboration");
vi.mock("@/utils/cdn", () => ({ invalidateCachedPages: vi.fn() }));

const INVITE_ID = "66666666-6666-4666-8666-666666666666";
const USER_ID = "77777777-7777-4777-8777-777777777777";

describeRouter("collaboration", {
  inviteToPage: {
    guard: "page",
    handler: inviteToPage,
    input: { pageId: PAGE_ID, email: "bob@example.com" },
    invalid: { pageId: PAGE_ID, email: "not-an-email" },
  },
  acceptPageInvite: {
    guard: "authenticated",
    handler: acceptPageInvite,
    input: { key: "invite-key" },
  },
  deletePageInvite: {
    guard: "page",
    handler: deletePageInvite,
    input: { pageId: PAGE_ID, id: INVITE_ID },
    args: (input) => [input],
    invalid: { pageId: PAGE_ID, id: "not-a-uuid" },
  },
  revokePageAccess: {
    guard: "page",
    handler: revokePageAccess,
    input: { pageId: PAGE_ID, userId: USER_ID },
    args: (input) => [input],
    invalid: { pageId: PAGE_ID, userId: "not-a-uuid" },
  },
});
