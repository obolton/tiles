import { describe, test, expect, vi, beforeEach } from "vitest";
import prisma from "@/database/prisma.ts";
import { fromHex } from "@/utils/arrays";
import { listThemes, createTheme, updateTheme, deleteTheme } from "../themes.ts";
import { THEME_FIELDS, type Theme } from "../fields";
import type { CreateThemeSchema } from "../schema";
import type { CreateQuery, FindManyQuery, UpdateQuery, DeleteQuery } from "@/test/prisma.ts";
import type { AuthenticatedWorkspaceProcedureContext } from "@/utils/middleware.ts";

const MOCK_CONTEXT: AuthenticatedWorkspaceProcedureContext = {
  res: {} as AuthenticatedWorkspaceProcedureContext["res"],
  sessionId: "session-1",
  userId: "user-1",
  serviceName: null,
  workspaceId: "workspace-1",
  role: "ADMIN",
};

const MOCK_THEME: Theme = {
  id: "theme-1",
  workspaceId: "workspace-1",
  name: "Light",
  background: { type: "color", color: "ffffffffffff" },
  colors: { text: "1a1a1a1a1a1a", accent: "0066ff0066ff" },
  fonts: { heading: "inter", body: "inter", code: "jetbrains-mono" },
  border: null,
};

const CREATE_INPUT: CreateThemeSchema = {
  workspaceId: "workspace-1",
  name: "Light",
  colors: { text: "1a1a1a1a1a1a", accent: "0066ff0066ff" },
  fonts: { heading: "inter", body: "inter", code: "jetbrains-mono" },
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("listThemes", () => {
  beforeEach(() => {
    vi.mocked(prisma.theme.findMany<FindManyQuery<typeof THEME_FIELDS>>).mockResolvedValue([
      MOCK_THEME,
    ]);
  });

  test("should list the workspace's themes in creation order", async () => {
    const result = await listThemes({ workspaceId: "workspace-1" }, MOCK_CONTEXT);

    expect(prisma.theme.findMany).toHaveBeenCalledWith({
      where: { workspaceId: "workspace-1" },
      select: THEME_FIELDS,
      orderBy: { createdAt: "asc" },
    });
    expect(result).toEqual([MOCK_THEME]);
  });
});

describe("createTheme", () => {
  const create = vi.mocked(prisma.theme.create<CreateQuery<typeof THEME_FIELDS>>);

  beforeEach(() => {
    create.mockResolvedValue(MOCK_THEME);
  });

  test("should encode colors and fonts for the workspace", async () => {
    const result = await createTheme(CREATE_INPUT, MOCK_CONTEXT);

    expect(create).toHaveBeenCalledWith({
      data: {
        workspaceId: "workspace-1",
        name: "Light",
        backgroundColor: fromHex("ffffffffffff"),
        backgroundGradient: null,
        textColor: fromHex("1a1a1a1a1a1a"),
        accentColor: fromHex("0066ff0066ff"),
        headingFont: "inter",
        bodyFont: "inter",
        codeFont: "jetbrains-mono",
        borderColor: null,
      },
      select: THEME_FIELDS,
    });
    expect(result).toEqual(MOCK_THEME);
  });

  test("should default to a white background when none is given", async () => {
    await createTheme(CREATE_INPUT, MOCK_CONTEXT);

    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          backgroundColor: fromHex("ffffffffffff"),
          backgroundGradient: null,
        }),
      }),
    );
  });

  test("should use the given color background", async () => {
    await createTheme(
      { ...CREATE_INPUT, background: { type: "color", color: "1a1a1a1a1a1a" } },
      MOCK_CONTEXT,
    );

    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          backgroundColor: fromHex("1a1a1a1a1a1a"),
          backgroundGradient: null,
        }),
      }),
    );
  });

  test("should use the given gradient background", async () => {
    await createTheme(
      {
        ...CREATE_INPUT,
        background: {
          type: "gradient",
          colorA: "080810103030",
          colorB: "184860609090",
          direction: "VERTICAL",
        },
      },
      MOCK_CONTEXT,
    );

    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          backgroundColor: fromHex("080810103030184860609090"),
          backgroundGradient: "VERTICAL",
        }),
      }),
    );
  });

  test("should encode the border color when given", async () => {
    await createTheme({ ...CREATE_INPUT, border: "e0e0e0e0e0e0" }, MOCK_CONTEXT);

    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ borderColor: fromHex("e0e0e0e0e0e0") }),
      }),
    );
  });

  test("should store no border color when the border is null", async () => {
    await createTheme({ ...CREATE_INPUT, border: null }, MOCK_CONTEXT);

    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ borderColor: null }),
      }),
    );
  });
});

describe("updateTheme", () => {
  const update = vi.mocked(prisma.theme.update<UpdateQuery<typeof THEME_FIELDS>>);

  beforeEach(() => {
    update.mockResolvedValue(MOCK_THEME);
  });

  test("should update the theme scoped to the current workspace", async () => {
    const result = await updateTheme({ id: "theme-1", name: "Dark" }, MOCK_CONTEXT);

    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "theme-1", workspaceId: "workspace-1" },
        select: THEME_FIELDS,
      }),
    );
    expect(result).toEqual(MOCK_THEME);
  });

  test("should leave omitted fields unchanged", async () => {
    await updateTheme({ id: "theme-1", name: "Dark" }, MOCK_CONTEXT);

    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          name: "Dark",
          textColor: undefined,
          accentColor: undefined,
          headingFont: undefined,
          bodyFont: undefined,
          codeFont: undefined,
          borderColor: undefined,
        },
      }),
    );
  });

  test("should encode the background when given", async () => {
    await updateTheme(
      {
        id: "theme-1",
        background: {
          type: "gradient",
          colorA: "080810103030",
          colorB: "184860609090",
          direction: "BOTTOM_RIGHT",
        },
      },
      MOCK_CONTEXT,
    );

    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          backgroundColor: fromHex("080810103030184860609090"),
          backgroundGradient: "BOTTOM_RIGHT",
        }),
      }),
    );
  });

  test("should encode only the colors that are given", async () => {
    await updateTheme({ id: "theme-1", colors: { text: "ffffffffffff" } }, MOCK_CONTEXT);

    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          textColor: fromHex("ffffffffffff"),
          accentColor: undefined,
        }),
      }),
    );
  });

  test("should update only the fonts that are given", async () => {
    await updateTheme({ id: "theme-1", fonts: { heading: "lora" } }, MOCK_CONTEXT);

    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          headingFont: "lora",
          bodyFont: undefined,
          codeFont: undefined,
        }),
      }),
    );
  });

  test("should encode the border color when given", async () => {
    await updateTheme({ id: "theme-1", border: "e0e0e0e0e0e0" }, MOCK_CONTEXT);

    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ borderColor: fromHex("e0e0e0e0e0e0") }),
      }),
    );
  });

  test("should clear the border color when the border is null", async () => {
    await updateTheme({ id: "theme-1", border: null }, MOCK_CONTEXT);

    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ borderColor: null }),
      }),
    );
  });
});

describe("deleteTheme", () => {
  beforeEach(() => {
    vi.mocked(prisma.theme.delete<DeleteQuery<{ id: true }>>).mockResolvedValue({
      id: "theme-1",
    });
  });

  test("should delete the theme scoped to the current workspace", async () => {
    const result = await deleteTheme({ id: "theme-1" }, MOCK_CONTEXT);

    expect(prisma.theme.delete).toHaveBeenCalledWith({
      where: { id: "theme-1", workspaceId: "workspace-1" },
      select: { id: true },
    });
    expect(result).toEqual({ id: "theme-1" });
  });
});
