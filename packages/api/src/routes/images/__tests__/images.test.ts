import { describe, it, expect, vi, beforeAll } from "vitest";
import prisma from "@/database/prisma.ts";
import { createImage, updateImage } from "../images.ts";
import { IMAGE_FIELDS, type Image } from "../fields";
import type { CreateQuery, UpdateQuery } from "@/test/prisma.ts";

const MOCK_IMAGE: Image = {
  id: "test-image",
  imageUrl: "https://example.com/test-image-key",
  alt: null,
  text: [
    {
      type: "paragraph",
      children: [{ type: "text", format: 0, text: "Test caption" }],
    },
  ],
  originX: 0.5,
  originY: 0.5,
};

const MOCK_PLACEMENT = {
  id: "test-tile",
  position: 2,
  rows: 1,
  columns: 1,
};

vi.mock("@/routes/tiles/tiles", () => ({
  createTile: async () => ({
    type: "IMAGE",
    image: MOCK_IMAGE,
    ...MOCK_PLACEMENT,
  }),
}));

describe("createImage", () => {
  beforeAll(() => {
    vi.mocked(
      prisma.imageTile.create<CreateQuery<typeof IMAGE_FIELDS>>,
    ).mockResolvedValue(MOCK_IMAGE);
  });

  it("should return an image", async () => {
    const result = await createImage({
      pageId: "1",
      sectionId: "test-collection",
      imageId: "test-image-id",
      text: [
        {
          type: "paragraph",
          children: [{ type: "text", format: 0, text: "Test caption" }],
        },
      ],
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
      pageId: "1",
      id: "1",
      text: [
        {
          type: "paragraph",
          children: [{ type: "text", format: 0, text: "New caption" }],
        },
      ],
    });

    expect(result).toEqual({
      type: "IMAGE",
      ...MOCK_IMAGE,
    });
  });
});
