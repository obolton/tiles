import { Prisma } from "@/generated/prisma/client";
import prisma, { type ExtensionArgs } from "@/database/prisma";
import { fromHex } from "@/utils/arrays";
import type {
  GetThemeByIdSchema,
  ListThemesSchema,
  CreateThemeSchema,
  UpdateThemeSchema,
  DeleteThemeSchema,
} from "./schema";
import type { AuthenticatedWorkspaceProcedureContext } from "@/utils/middleware";

export const THEME_FIELDS = {
  id: true,
  workspaceId: true,
  name: true,
  colors: true,
  fonts: true,
} as const satisfies Prisma.ThemeSelect<ExtensionArgs>;

export type Theme = Prisma.Result<
  typeof prisma.theme,
  { select: typeof THEME_FIELDS },
  "findUniqueOrThrow"
>;

export async function getThemeById({ id }: GetThemeByIdSchema) {
  return prisma.theme.findUniqueOrThrow({
    where: { id },
    select: THEME_FIELDS,
  });
}

export async function listThemes(
  { workspaceId }: ListThemesSchema,
  _ctx: AuthenticatedWorkspaceProcedureContext,
) {
  return prisma.theme.findMany({
    where: { workspaceId },
    select: THEME_FIELDS,
    orderBy: { createdAt: "asc" },
  });
}

export async function createTheme(
  { workspaceId, name, colors, fonts }: CreateThemeSchema,
  _ctx: AuthenticatedWorkspaceProcedureContext,
) {
  return prisma.theme.create({
    data: {
      workspaceId,
      name,
      backgroundColor: fromHex(colors.background),
      textColor: fromHex(colors.text),
      accentColor: fromHex(colors.accent),
      headingFont: fonts.heading,
      bodyFont: fonts.body,
      codeFont: fonts.code,
    },
    select: THEME_FIELDS,
  });
}

export async function updateTheme(
  { id, name, colors, fonts }: UpdateThemeSchema,
  { workspaceId }: AuthenticatedWorkspaceProcedureContext,
) {
  return prisma.theme.update({
    where: { id, workspaceId },
    data: {
      name,
      backgroundColor: colors?.background
        ? fromHex(colors.background)
        : undefined,
      textColor: colors?.text ? fromHex(colors.text) : undefined,
      accentColor: colors?.accent ? fromHex(colors.accent) : undefined,
      headingFont: fonts?.heading,
      bodyFont: fonts?.body,
      codeFont: fonts?.code,
    },
    select: THEME_FIELDS,
  });
}

export async function deleteTheme(
  { id }: DeleteThemeSchema,
  { workspaceId }: AuthenticatedWorkspaceProcedureContext,
) {
  return prisma.theme.delete({
    where: { id, workspaceId },
    select: { id: true },
  });
}
