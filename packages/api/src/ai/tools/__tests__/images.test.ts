import { Buffer } from "node:buffer";
import { beforeEach, describe, expect, test, vi } from "vitest";
import * as Y from "yjs";
import { createToolContext, getCreatedTile } from "@/test/fixtures/ai.ts";
import { createImageTile } from "../images.ts";
import type { ToolContext } from "../types.ts";
import type { ResponseOutputItem } from "openai/resources/responses/responses";

vi.mock("@/utils/storage.ts", () => ({
  upload: vi.fn(),
  IMAGES_BUCKET: "images",
}));

const CALL = {
  type: "image_generation_call",
  status: "completed",
  result: Buffer.from("fake-image-bytes").toString("base64"),
  id: "img-call-1",
} as unknown as ResponseOutputItem.ImageGenerationCall;

describe("createImageTile", () => {
  let doc: Y.Doc;
  let context: ToolContext;

  beforeEach(() => {
    vi.clearAllMocks();
    ({ doc, context } = createToolContext());
  });

  test("creates an image tile in the doc", async () => {
    const result = await createImageTile(CALL, context);

    const map = getCreatedTile(doc, result);
    expect(map.get("type")).toBe("IMAGE");
    expect(map.get("imageId")).toBeTypeOf("string");
    expect(map.get("size")).toEqual({ width: 1024, height: 1024 });
    expect(map.get("width")).toBe(12);
    expect(map.get("height")).toBe(12);
  });

  test("places the image inside the context section", async () => {
    context.sectionId = "section-1";

    const result = await createImageTile(CALL, context);

    expect(getCreatedTile(doc, result).get("parentId")).toBe("section-1");
  });
});
