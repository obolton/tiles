import { z } from "zod";
import { AuthenticationProvider } from "@/generated/prisma/client";

export const SignInSchema = z.object({
  provider: z.enum(AuthenticationProvider),
  providerId: z.string().min(1),
  name: z.string().min(1),
  email: z.email(),
  emailVerified: z.boolean(),
  imageUrl: z.string().optional(),
});
export type SignInSchema = z.infer<typeof SignInSchema>;
