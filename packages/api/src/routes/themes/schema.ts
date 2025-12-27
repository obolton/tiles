import { z } from "zod";
import { ColorSchema } from "@/schema/Color";
import { Font } from "@/generated/prisma/client";

const ThemeColorsSchema = z.object({
  background: ColorSchema,
  text: ColorSchema,
  accent: ColorSchema,
});
export type ThemeColorsSchema = z.infer<typeof ThemeColorsSchema>;

const ThemeFontsSchema = z.object({
  heading: z.enum(Font),
  body: z.enum(Font),
  code: z.enum(Font),
});
export type ThemeFontsSchema = z.infer<typeof ThemeFontsSchema>;

export const GetThemeByIdSchema = z.object({
  id: z.uuid(),
});
export type GetThemeByIdSchema = z.infer<typeof GetThemeByIdSchema>;

export const ListThemesSchema = z.object({
  workspaceId: z.uuid(),
});
export type ListThemesSchema = z.infer<typeof ListThemesSchema>;

export const CreateThemeSchema = z.object({
  workspaceId: z.uuid(),
  name: z.string().min(1).max(50),
  colors: ThemeColorsSchema,
  fonts: ThemeFontsSchema,
});
export type CreateThemeSchema = z.infer<typeof CreateThemeSchema>;

export const UpdateThemeSchema = z.object({
  id: z.uuid(),
  name: z.string().min(1).max(50).optional(),
  colors: ThemeColorsSchema.partial().optional(),
  fonts: ThemeFontsSchema.partial().optional(),
});
export type UpdateThemeSchema = z.infer<typeof UpdateThemeSchema>;

export const DeleteThemeSchema = z.object({
  id: z.uuid(),
});
export type DeleteThemeSchema = z.infer<typeof DeleteThemeSchema>;
