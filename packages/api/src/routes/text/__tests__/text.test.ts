import { describe, it, expect, vi, beforeAll } from "vitest";
import prisma from "@/database/prisma.ts";
import { createText } from "../text.ts";
import type { RichTextSchema } from "@/schema/RichText.ts";
import { mockCreate } from "../../../../test/prisma.ts";

describe("createText", () => {
  beforeAll(() => {
    vi.mocked(prisma.textTile.create).mockImplementation(
      mockCreate({ id: "1" }),
    );
    vi.mocked(prisma.tile.count).mockResolvedValue(2);
    vi.mocked(prisma.tile.create).mockImplementation(mockCreate({ id: "2" }));
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
      theme: "LIGHT" as const,
      hue: 120,
    });

    expect(result).toEqual({
      id: "1",
      placementId: "2",
      columns: 1,
      rows: 1,
      position: 2,
      content,
      type: "TEXT",
      theme: "LIGHT",
      hue: 120,
    });
  });
});
