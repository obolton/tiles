import { beforeEach, describe, expect, test, vi } from "vitest";
import * as Y from "yjs";
import { generateAndUploadImage } from "@/ai/tools/images";
import { createToolContext, getCreatedTile } from "@/test/fixtures/ai";
import { CREATE_IMAGE_TOOL } from "../createImage";
import type { ToolContext } from "../types";

vi.mock("@/ai/tools/images.ts", () => ({
  generateAndUploadImage: vi.fn(),
}));

const BASE_ARGS = {
  parentId: null,
  prompt: "a red circle on a white background",
  coordinates: null,
};

describe("CREATE_IMAGE_TOOL", () => {
  let doc: Y.Doc;
  let context: ToolContext;

  beforeEach(() => {
    vi.clearAllMocks();
    ({ doc, context } = createToolContext());
    vi.mocked(generateAndUploadImage).mockResolvedValue("generated-image-id");
  });

  test("generates an image from the prompt and creates an image tile", async () => {
    const result = await CREATE_IMAGE_TOOL.function(BASE_ARGS, context);

    expect(generateAndUploadImage).toHaveBeenCalledWith(
      "a red circle on a white background",
      context,
    );
    const map = getCreatedTile(doc, result);
    expect(map.get("type")).toBe("IMAGE");
    expect(map.get("imageId")).toBe("generated-image-id");
    expect(map.get("size")).toEqual({ width: 1024, height: 1024 });
    expect(map.get("width")).toBe(12);
    expect(map.get("height")).toBe(12);
  });

  test("resolves an args parentId to the parent", async () => {
    const result = await CREATE_IMAGE_TOOL.function(
      { ...BASE_ARGS, parentId: 0 },
      context,
    );

    expect(context.resolveArtifactId).toHaveBeenCalledWith(0);
    expect(getCreatedTile(doc, result).get("parentId")).toBe("resolved-0");
  });

  test("places the image at map coordinates", async () => {
    const result = await CREATE_IMAGE_TOOL.function(
      { ...BASE_ARGS, coordinates: { lat: 51.5, long: -0.1 } },
      context,
    );

    expect(getCreatedTile(doc, result).get("coordinates")).toEqual({
      lat: 51.5,
      long: -0.1,
    });
  });
});
