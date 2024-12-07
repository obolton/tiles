import { describe, it, expect, vi, beforeAll } from "vitest";
import prisma from "@/database/prisma.ts";
import { createText, updateText, type Text } from "../text.ts";
import type { RichTextSchema } from "@/schema/RichText.ts";
import { mockCreate, mockUpdate } from "../../../../test/prisma.ts";
import type { Tile } from "@prisma/client";

describe("createText", () => {
  beforeAll(() => {
    vi.mocked(prisma.textTile.create).mockImplementation(
      mockCreate<Text>({ id: "1" }),
    );
    vi.mocked(prisma.tile.count).mockResolvedValue(2);
    vi.mocked(prisma.tile.create).mockImplementation(
      mockCreate<Tile>({ id: "2" }),
    );
  });

  it("should return a text tile", async () => {
    const content = [
      {
        type: "paragraph",
        children: [{ type: "text", text: "Test content", format: 0 }],
      },
    ] as RichTextSchema;

    const result = await createText({
      pageId: "1",
      content,
      theme: "LIGHT",
      hue: 120,
    });

    expect(result).toEqual({
      type: "TEXT",
      id: "1",
      placementId: "2",
      columns: 1,
      rows: 1,
      position: 2,
      content,
      theme: "LIGHT",
      hue: 120,
    });
  });
});

describe("updateText", () => {
  beforeAll(() => {
    vi.mocked(prisma.textTile.update).mockImplementation(
      mockUpdate<Text>({ id: "1" }),
    );
  });

  it("should update and return a text tile", async () => {
    const content = [
      {
        type: "paragraph",
        children: [{ type: "text", text: "Updated content", format: 0 }],
      },
    ] as RichTextSchema;

    const result = await updateText({
      id: "1",
      content,
      theme: "DARK",
      hue: 60,
    });

    expect(result).toEqual({
      type: "TEXT",
      id: "1",
      content,
      theme: "DARK",
      hue: 60,
    });
  });
});
