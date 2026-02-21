import prisma from "@/database/prisma";
import { fromHex } from "@/utils/arrays";
import { getBackgroundProperties } from "@/utils/themes";
import type {
  GetThemeByIdSchema,
  ListThemesSchema,
  CreateThemeSchema,
  UpdateThemeSchema,
  DeleteThemeSchema,
} from "./schema";
import type { AuthenticatedWorkspaceProcedureContext } from "@/utils/middleware";
import { THEME_FIELDS } from "./fields";

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
  { workspaceId, name, background, colors, fonts, border }: CreateThemeSchema,
  _ctx: AuthenticatedWorkspaceProcedureContext,
) {
  return prisma.theme.create({
    data: {
      workspaceId,
      name,
      ...getBackgroundProperties(background),
      textColor: fromHex(colors.text),
      accentColor: fromHex(colors.accent),
      headingFont: fonts.heading,
      bodyFont: fonts.body,
      codeFont: fonts.code,
      borderColor: border?.color ? fromHex(border.color) : null,
      borderRadius: border?.radius ?? null,
    },
    select: THEME_FIELDS,
  });
}

export async function updateTheme(
  { id, name, background, colors, fonts, border }: UpdateThemeSchema,
  { workspaceId }: AuthenticatedWorkspaceProcedureContext,
) {
  return prisma.theme.update({
    where: { id, workspaceId },
    data: {
      name,
      ...getBackgroundProperties(background),
      textColor: colors?.text ? fromHex(colors.text) : undefined,
      accentColor: colors?.accent ? fromHex(colors.accent) : undefined,
      headingFont: fonts?.heading,
      bodyFont: fonts?.body,
      codeFont: fonts?.code,
      borderColor:
        border?.color !== undefined
          ? border.color
            ? fromHex(border.color)
            : null
          : undefined,
      borderRadius: border?.radius !== undefined ? border.radius : undefined,
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
