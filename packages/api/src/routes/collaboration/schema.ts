import { z } from "zod";

export const InviteToPageSchema = z.object({
  pageId: z.string().uuid(),
  email: z.string().email().max(254),
});
export type InviteToPageSchema = z.infer<typeof InviteToPageSchema>;

export const AcceptPageInviteSchema = z.object({
  key: z.string(),
});
export type AcceptPageInviteSchema = z.infer<typeof AcceptPageInviteSchema>;

export const DeletePageInviteSchema = z.object({
  pageId: z.string().uuid(),
  id: z.string().uuid(),
});
export type DeletePageInviteSchema = z.infer<typeof DeletePageInviteSchema>;

export const RevokePageAccessSchema = z.object({
  pageId: z.string().uuid(),
  userId: z.string().uuid(),
});
export type RevokePageAccessSchema = z.infer<typeof RevokePageAccessSchema>;
