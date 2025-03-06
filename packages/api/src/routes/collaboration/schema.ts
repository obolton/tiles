import { z } from "zod";

export const InviteToPageSchema = z.object({
  pageId: z.string().uuid(),
  email: z.string().email().max(254),
});
export type InviteToPageSchema = z.infer<typeof InviteToPageSchema>;

export const AcceptInviteSchema = z.object({
  key: z.string(),
});
export type AcceptInviteSchema = z.infer<typeof AcceptInviteSchema>;

export const DeleteInviteSchema = z.object({
  pageId: z.string().uuid(),
  id: z.string().uuid(),
});
export type DeleteInviteSchema = z.infer<typeof DeleteInviteSchema>;

export const RevokePageAccessSchema = z.object({
  pageId: z.string().uuid(),
  userId: z.string().uuid(),
});
export type RevokePageAccessSchema = z.infer<typeof RevokePageAccessSchema>;
