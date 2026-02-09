import { describe, test, expect, vi, beforeEach } from "vitest";
import { createTable } from "@/routes/tables/tables.ts";
import { MOCK_TOOL_CONTEXT } from "@/test/fixtures/ai.ts";
import { TABLE_TILE } from "@/test/fixtures/Tile.ts";
import { CREATE_TABLE_TOOL } from "../createTable.ts";

vi.mock("@/routes/tables/tables.ts", () => ({
  createTable: vi.fn(),
}));

const BASE_ARGS = {
  sectionId: null,
  size: "medium" as const,
  columns: [
    { title: "A", background: null },
    { title: "B", background: null },
  ],
  rows: [["1", "2"]],
};

describe("CREATE_TABLE_TOOL", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(createTable).mockResolvedValue(TABLE_TILE);
  });

  test("passes columns and rows to createTable", async () => {
    const columns = [
      { title: "Name", background: null },
      { title: "Age", background: null },
    ];
    const rows = [
      ["Alice", "30"],
      ["Bob", "25"],
    ];

    await CREATE_TABLE_TOOL.function(
      { ...BASE_ARGS, columns, rows },
      MOCK_TOOL_CONTEXT,
    );

    expect(createTable).toHaveBeenCalledWith(
      expect.objectContaining({
        columns: [
          { title: "Name", background: null },
          { title: "Age", background: null },
        ],
        rows,
      }),
    );
  });

  test("uses context sectionId when args.sectionId is null", async () => {
    const context = { ...MOCK_TOOL_CONTEXT, sectionId: "context-section" };

    await CREATE_TABLE_TOOL.function(BASE_ARGS, context);

    expect(createTable).toHaveBeenCalledWith(
      expect.objectContaining({ sectionId: "context-section" }),
    );
  });

  test("resolves sectionId when provided in args", async () => {
    await CREATE_TABLE_TOOL.function(
      { ...BASE_ARGS, sectionId: 0 },
      MOCK_TOOL_CONTEXT,
    );

    expect(MOCK_TOOL_CONTEXT.resolveArtifactId).toHaveBeenCalledWith(0);
    expect(createTable).toHaveBeenCalledWith(
      expect.objectContaining({ sectionId: "resolved-0" }),
    );
  });

  test("passes pageId from context", async () => {
    await CREATE_TABLE_TOOL.function(BASE_ARGS, MOCK_TOOL_CONTEXT);

    expect(createTable).toHaveBeenCalledWith(
      expect.objectContaining({ pageId: "test-page" }),
    );
  });

  test("returns artifact from createTable", async () => {
    const result = await CREATE_TABLE_TOOL.function(
      BASE_ARGS,
      MOCK_TOOL_CONTEXT,
    );

    expect(result).toEqual({ artifact: TABLE_TILE });
  });
});
