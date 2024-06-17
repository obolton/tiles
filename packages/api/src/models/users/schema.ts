import { z } from "zod";
import { AuthenticationProvider } from "@prisma/client";

export const SignInSchema = z.object({
  provider: z.nativeEnum(AuthenticationProvider),
  providerId: z.string().min(1),
  name: z.string().min(1),
  email: z.string().min(3),
  emailVerified: z.boolean(),
});
export type SignInSchema = z.infer<typeof SignInSchema>;

export const SignOutSchema = z.object({
  sessionId: z.string(),
});
export type SignOutSchema = z.infer<typeof SignOutSchema>;

export const GetUserInfoSchema = z.object({
  id: z.string(),
  name: z.string(),
});
export type GetUserInfoSchema = z.infer<typeof GetUserInfoSchema>;
