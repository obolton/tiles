import { describe, it, expect, vi, beforeAll } from "vitest";
import prisma from "@/database/prisma.ts";
import { createImage, updateImage, type Image } from "../images.ts";
import { mockCreate, mockUpdate } from "../../../../test/prisma.ts";
import type { Tile } from "@prisma/client";

describe("createImage", () => {
  beforeAll(() => {
    vi.mocked(prisma.imageTile.create).mockImplementation(
      mockCreate<Image>({ id: "1", originX: 0.5, originY: 0.5 }),
    );
    vi.mocked(prisma.tile.count).mockResolvedValue(2);
    vi.mocked(prisma.tile.create).mockImplementation(
      mockCreate<Tile>({ id: "2" }),
    );
  });

  it("should return an image", async () => {
    const result = await createImage({
      pageId: "1",
      imageKey: "test-image-key",
      caption: "Test caption",
    });

    expect(result).toEqual({
      type: "IMAGE",
      id: "1",
      placementId: "2",
      columns: 1,
      rows: 1,
      position: 2,
      imageKey: "test-image-key",
      caption: "Test caption",
      originX: 0.5,
      originY: 0.5,
    });
  });
});

describe("updateImage", () => {
  beforeAll(() => {
    vi.mocked(prisma.imageTile.update).mockImplementation(
      mockUpdate<Image>({
        id: "1",
        imageKey: "test-image-key",
        caption: "Test caption",
        originX: 0.5,
        originY: 0.5,
      }),
    );
  });

  it("should update and return an image", async () => {
    const result = await updateImage({
      id: "1",
      caption: "New caption",
      origin: { x: 0, y: 1 },
    });

    expect(result).toEqual({
      type: "IMAGE",
      id: "1",
      imageKey: "test-image-key",
      caption: "New caption",
      originX: 0,
      originY: 1,
    });
  });
});
