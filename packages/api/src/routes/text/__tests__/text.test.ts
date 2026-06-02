import { describe, it, expect, vi, beforeAll } from "vitest";
import prisma from "@/database/prisma.ts";
import { createText } from "../text.ts";
import { TEXT_FIELDS, type Text } from "../fields";
import type { CreateQuery } from "@/test/prisma.ts";

const MOCK_TEXT: Text = {
  id: "test-text",
  content: [
    {
      type: "paragraph",
      children: [{ type: "text", text: "Test content", format: 0 }],
    },
  ],
  align: "TOP",
};

const MOCK_PLACEMENT = {
  id: "test-tile",
  position: 2,
  rows: 1,
  columns: 1,
};

vi.mock("@/routes/tiles/tiles", () => ({
  createTile: async () => ({
    type: "TEXT",
    text: MOCK_TEXT,
    ...MOCK_PLACEMENT,
  }),
}));

describe("createText", () => {
  beforeAll(() => {
    vi.mocked(
      prisma.textTile.create<CreateQuery<typeof TEXT_FIELDS>>,
    ).mockResolvedValue(MOCK_TEXT);
  });

  it("should return a text tile", async () => {
    const result = await createText({
      pageId: "1",
      sectionId: "test-collection",
      content: MOCK_TEXT.content,
    });

    expect(result).toEqual({
      type: "TEXT",
      ...MOCK_PLACEMENT,
      ...MOCK_TEXT,
    });
  });
});
