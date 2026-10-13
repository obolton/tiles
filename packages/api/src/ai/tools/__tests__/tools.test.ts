import { describe, test, expect, vi, beforeEach } from "vitest";
import { MOCK_TOOL_CONTEXT } from "@/test/fixtures/ai";
import { FUNCTION_TOOLS, useFunctionTool } from "../tools";

vi.mock("@/routes/links/links.ts", () => ({
  resolveLinkMetadata: vi.fn().mockResolvedValue({
    type: "LINK",
    url: "https://example.com",
    title: null,
    description: null,
    siteName: null,
    imageId: null,
  }),
}));

describe("FUNCTION_TOOLS", () => {
  test("contains all expected tools", () => {
    const toolNames = FUNCTION_TOOLS.map((t) => t.name);

    expect(toolNames).toContain("create_text");
    expect(toolNames).toContain("create_image");
    expect(toolNames).toContain("create_link");
    expect(toolNames).toContain("create_map");
    expect(toolNames).toContain("create_section");
    expect(toolNames).toContain("delete_tiles");
    expect(toolNames).toContain("edit_style");
  });

  test("each tool has required properties", () => {
    for (const tool of FUNCTION_TOOLS) {
      expect(tool).toHaveProperty("name");
      expect(tool).toHaveProperty("description");
      expect(tool).toHaveProperty("schema");
      expect(tool).toHaveProperty("function");
      expect(typeof tool.name).toBe("string");
      expect(typeof tool.description).toBe("string");
      expect(typeof tool.function).toBe("function");
    }
  });
});

describe("useFunctionTool", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("finds and executes create_text tool", async () => {
    const result = await useFunctionTool(
      {
        type: "function_call",
        id: "call-1",
        call_id: "call-1",
        name: "create_text",
        arguments: JSON.stringify({
          parentId: null,
          align: null,
          size: "medium",
          coordinates: null,
        }),
        status: "completed",
      },
      MOCK_TOOL_CONTEXT,
    );

    expect(result).toEqual({ tileId: expect.any(String), type: "TEXT" });
  });

  test("finds and executes create_link tool", async () => {
    const result = await useFunctionTool(
      {
        type: "function_call",
        id: "call-1",
        call_id: "call-1",
        name: "create_link",
        arguments: JSON.stringify({
          parentId: null,
          size: "medium",
          url: "https://example.com",
          coordinates: null,
        }),
        status: "completed",
      },
      MOCK_TOOL_CONTEXT,
    );

    expect(result).toEqual({ tileId: expect.any(String), type: "LINK" });
  });

  test("finds and executes create_section tool", async () => {
    const result = await useFunctionTool(
      {
        type: "function_call",
        id: "call-1",
        call_id: "call-1",
        name: "create_section",
        arguments: JSON.stringify({
          size: "medium",
          layout: "GRID",
        }),
        status: "completed",
      },
      MOCK_TOOL_CONTEXT,
    );

    expect(result).toEqual({ tileId: expect.any(String), type: "SECTION" });
  });

  test("throws error for unknown tool name", async () => {
    await expect(
      useFunctionTool(
        {
          type: "function_call",
          id: "call-1",
          call_id: "call-1",
          name: "unknown_tool",
          arguments: "{}",
          status: "completed",
        },
        MOCK_TOOL_CONTEXT,
      ),
    ).rejects.toThrow("Unknown tool: unknown_tool");
  });

  test("throws error for invalid JSON arguments", async () => {
    await expect(
      useFunctionTool(
        {
          type: "function_call",
          id: "call-1",
          call_id: "call-1",
          name: "create_text",
          arguments: "invalid json",
          status: "completed",
        },
        MOCK_TOOL_CONTEXT,
      ),
    ).rejects.toThrow(SyntaxError);
  });
});
