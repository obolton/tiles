import { describe, test, expect, vi, beforeEach } from "vitest";
import { MOCK_TOOL_CONTEXT } from "@/test/fixtures/ai.ts";
import { DELETE_TILES_TOOL } from "../deleteTile.ts";

describe("DELETE_TILES_TOOL", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("resolves a single tile ID and returns delete action", async () => {
    const result = await DELETE_TILES_TOOL.function(
      { ids: [0] },
      MOCK_TOOL_CONTEXT,
    );

    expect(MOCK_TOOL_CONTEXT.resolveArtifactId).toHaveBeenCalledWith(0);
    expect(result).toEqual({
      actions: [
        {
          type: "tile.delete",
          data: { tileIds: ["resolved-0"] },
        },
      ],
    });
  });

  test("resolves multiple tile IDs", async () => {
    const result = await DELETE_TILES_TOOL.function(
      { ids: [0, 1, 2] },
      MOCK_TOOL_CONTEXT,
    );

    expect(MOCK_TOOL_CONTEXT.resolveArtifactId).toHaveBeenCalledTimes(3);
    expect(result).toEqual({
      actions: [
        {
          type: "tile.delete",
          data: {
            tileIds: ["resolved-0", "resolved-1", "resolved-2"],
          },
        },
      ],
    });
  });
});
