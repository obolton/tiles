import { z } from "zod";
import { AuthenticationProvider } from "@prisma/client";

export const SignInSchema = z.object({
  provider: z.nativeEnum(AuthenticationProvider),
  providerId: z.string().min(1),
  name: z.string().min(1),
  email: z.string().min(3),
  emailVerified: z.boolean(),
  imageUrl: z.string().optional(),
});
export type SignInSchema = z.infer<typeof SignInSchema>;
