import { z } from "zod";
import { ColorSchema } from "@/schema/Color";
import { ColorBackgroundSchema, GradientBackgroundSchema } from "@/schema/Background";
import { FontIdSchema } from "fonts/config";

const ThemeBackgroundSchema = z.discriminatedUnion("type", [
  ColorBackgroundSchema,
  GradientBackgroundSchema,
]);
export type ThemeBackgroundSchema = z.infer<typeof ThemeBackgroundSchema>;

const ThemeColorsSchema = z.object({
  text: ColorSchema,
  accent: ColorSchema,
});
export type ThemeColorsSchema = z.infer<typeof ThemeColorsSchema>;

const ThemeFontsSchema = z.object({
  heading: FontIdSchema,
  body: FontIdSchema,
  code: FontIdSchema,
});
export type ThemeFontsSchema = z.infer<typeof ThemeFontsSchema>;

export const ListThemesSchema = z.object({
  workspaceId: z.uuid(),
});
export type ListThemesSchema = z.infer<typeof ListThemesSchema>;

export const CreateThemeSchema = z.object({
  workspaceId: z.uuid(),
  name: z.string().min(1).max(50),
  background: ThemeBackgroundSchema.optional(),
  colors: ThemeColorsSchema,
  fonts: ThemeFontsSchema,
  border: ColorSchema.nullable().optional(),
});
export type CreateThemeSchema = z.infer<typeof CreateThemeSchema>;

export const UpdateThemeSchema = z.object({
  id: z.uuid(),
  name: z.string().min(1).max(50).optional(),
  background: ThemeBackgroundSchema.optional(),
  colors: ThemeColorsSchema.partial().optional(),
  fonts: ThemeFontsSchema.partial().optional(),
  border: ColorSchema.nullable().optional(),
});
export type UpdateThemeSchema = z.infer<typeof UpdateThemeSchema>;

export const DeleteThemeSchema = z.object({
  id: z.uuid(),
});
export type DeleteThemeSchema = z.infer<typeof DeleteThemeSchema>;
