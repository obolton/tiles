import { describe, it, expect, vi, beforeAll } from "vitest";
import prisma from "@/database/prisma.ts";
import { TEXT_FIELDS, createText, updateText, type Text } from "../text.ts";
import type { CreateQuery, UpdateQuery } from "../../../../test/prisma.ts";

const MOCK_TEXT: Text = {
  id: "test-text",
  content: [
    {
      type: "paragraph",
      children: [{ type: "text", text: "Test content", format: 0 }],
    },
  ],
  theme: "LIGHT",
  hue: 120,
};

const MOCK_PLACEMENT = {
  placementId: "test-tile",
  position: 2,
  rows: 1,
  columns: 1,
};

describe("createText", () => {
  beforeAll(() => {
    vi.mocked(
      prisma.textTile.create<CreateQuery<typeof TEXT_FIELDS>>,
    ).mockResolvedValue(MOCK_TEXT);
    vi.mock("@/routes/tiles/tiles.ts", () => ({
      createTilePlacement: async () => MOCK_PLACEMENT,
    }));
  });

  it("should return a text tile", async () => {
    const result = await createText({
      pageId: "1",
      content: MOCK_TEXT.content,
    });

    expect(result).toEqual({
      type: "TEXT",
      ...MOCK_PLACEMENT,
      ...MOCK_TEXT,
    });
  });
});

describe("updateText", () => {
  beforeAll(() => {
    vi.mocked(
      prisma.textTile.update<UpdateQuery<typeof TEXT_FIELDS>>,
    ).mockResolvedValue(MOCK_TEXT);
  });

  it("should update and return a text tile", async () => {
    const result = await updateText({
      pageId: "1",
      id: "1",
      content: MOCK_TEXT.content,
    });

    expect(result).toEqual({
      type: "TEXT",
      ...MOCK_TEXT,
    });
  });
});
