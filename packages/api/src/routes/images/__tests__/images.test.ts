import { describe, it, expect, vi, beforeAll } from "vitest";
import prisma from "@/database/prisma.ts";
import {
  IMAGE_FIELDS,
  createImage,
  updateImage,
  type Image,
} from "../images.ts";
import type { CreateQuery, UpdateQuery } from "@/test/prisma.ts";

const MOCK_IMAGE: Image = {
  id: "test-image",
  imageKey: "test-image-key",
  caption: "Test caption",
  originX: 0.5,
  originY: 0.5,
};

const MOCK_PLACEMENT = {
  placementId: "test-tile",
  position: 2,
  rows: 1,
  columns: 1,
};

describe("createImage", () => {
  beforeAll(() => {
    vi.mocked(
      prisma.imageTile.create<CreateQuery<typeof IMAGE_FIELDS>>,
    ).mockResolvedValue(MOCK_IMAGE);
    vi.mock("@/routes/tiles/tiles.ts", () => ({
      createTilePlacement: async () => MOCK_PLACEMENT,
    }));
  });

  it("should return an image", async () => {
    const result = await createImage({
      pageId: "1",
      imageKey: "test-image-key",
      caption: "Test caption",
    });

    expect(result).toEqual({
      type: "IMAGE",
      ...MOCK_PLACEMENT,
      ...MOCK_IMAGE,
    });
  });
});

describe("updateImage", () => {
  beforeAll(() => {
    vi.mocked(
      prisma.imageTile.update<UpdateQuery<typeof IMAGE_FIELDS>>,
    ).mockResolvedValue(MOCK_IMAGE);
  });

  it("should update and return an image", async () => {
    const result = await updateImage({
      id: "1",
      caption: "New caption",
    });

    expect(result).toEqual({
      type: "IMAGE",
      ...MOCK_IMAGE,
    });
  });
});
