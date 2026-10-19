import { z } from "zod";

export const InviteToPageSchema = z.object({
  pageId: z.uuid(),
  email: z.email().max(254).optional(),
});
export type InviteToPageSchema = z.infer<typeof InviteToPageSchema>;

export const AcceptPageInviteSchema = z.object({
  key: z.string(),
});
export type AcceptPageInviteSchema = z.infer<typeof AcceptPageInviteSchema>;

export const DeletePageInviteSchema = z.object({
  pageId: z.uuid(),
  id: z.uuid(),
});
export type DeletePageInviteSchema = z.infer<typeof DeletePageInviteSchema>;

export const RevokePageAccessSchema = z.object({
  pageId: z.uuid(),
  userId: z.uuid(),
});
export type RevokePageAccessSchema = z.infer<typeof RevokePageAccessSchema>;
