import { describe, test, expect, vi, beforeEach } from "vitest";
import { MOCK_TOOL_CONTEXT } from "@/test/fixtures/ai.ts";
import { FUNCTION_TOOLS, useFunctionTool } from "../tools.ts";

vi.mock("@/routes/text/text.ts", () => ({
  createText: vi.fn().mockResolvedValue({ type: "TEXT", id: "text-1" }),
}));

vi.mock("@/routes/tables/tables.ts", () => ({
  createTable: vi.fn().mockResolvedValue({ type: "TABLE", id: "table-1" }),
}));

vi.mock("@/routes/charts/charts.ts", () => ({
  createChart: vi.fn().mockResolvedValue({ type: "CHART", id: "chart-1" }),
  getTableColumns: vi.fn().mockResolvedValue([{ id: "col-1" }]),
}));

vi.mock("@/routes/links/links.ts", () => ({
  createLink: vi.fn().mockResolvedValue({ type: "LINK", id: "link-1" }),
}));

vi.mock("@/routes/sections/sections.ts", () => ({
  createSection: vi
    .fn()
    .mockResolvedValue({ type: "SECTION", id: "section-1" }),
}));

describe("FUNCTION_TOOLS", () => {
  test("contains all expected tools", () => {
    const toolNames = FUNCTION_TOOLS.map((t) => t.name);

    expect(toolNames).toContain("create_text");
    expect(toolNames).toContain("create_table");
    expect(toolNames).toContain("create_chart");
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
          sectionId: null,
          align: null,
          size: "medium",
        }),
        status: "completed",
      },
      MOCK_TOOL_CONTEXT,
    );

    expect(result).toEqual({ artifact: { type: "TEXT", id: "text-1" } });
  });

  test("finds and executes create_table tool", async () => {
    const result = await useFunctionTool(
      {
        type: "function_call",
        id: "call-1",
        call_id: "call-1",
        name: "create_table",
        arguments: JSON.stringify({
          sectionId: null,
          size: "medium",
          columns: [
            { title: "A", background: null },
            { title: "B", background: null },
          ],
          rows: [["1", "2"]],
        }),
        status: "completed",
      },
      MOCK_TOOL_CONTEXT,
    );

    expect(result).toEqual({ artifact: { type: "TABLE", id: "table-1" } });
  });

  test("finds and executes create_link tool", async () => {
    const result = await useFunctionTool(
      {
        type: "function_call",
        id: "call-1",
        call_id: "call-1",
        name: "create_link",
        arguments: JSON.stringify({
          sectionId: null,
          size: "medium",
          url: "https://example.com",
        }),
        status: "completed",
      },
      MOCK_TOOL_CONTEXT,
    );

    expect(result).toEqual({ artifact: { type: "LINK", id: "link-1" } });
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

    expect(result).toEqual({ artifact: { type: "SECTION", id: "section-1" } });
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
    ).rejects.toThrow();
  });
});
