import type { Invite } from "@/types/collaboration";

export const PAGE_INVITE: Invite = {
  id: "invite-id",
  email: "user@example.com",
  key: "invite-key",
  createdAt: "2024-01-15T10:30:00.000Z",
};

export const PAGE_LINK_INVITE: Invite = {
  id: "link-invite-id",
  email: null,
  key: "link-invite-key",
  createdAt: "2024-01-16T10:30:00.000Z",
};
