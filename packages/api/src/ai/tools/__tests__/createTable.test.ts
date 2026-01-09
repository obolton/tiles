import { describe, test, expect, vi, beforeEach } from "vitest";
import { createTableWithData } from "@/routes/tables/tables.ts";
import { MOCK_TOOL_CONTEXT } from "@/test/fixtures/ai.ts";
import { TABLE_TILE } from "@/test/fixtures/Tile.ts";
import { CREATE_TABLE_TOOL } from "../createTable.ts";

vi.mock("@/routes/tables/tables.ts", () => ({
  createTableWithData: vi.fn(),
}));

describe("CREATE_TABLE_TOOL", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(createTableWithData).mockResolvedValue(TABLE_TILE);
  });

  test("passes columns and rows to createTableWithData", async () => {
    const columns = [{ title: "Name" }, { title: "Age" }];
    const rows = [
      ["Alice", "30"],
      ["Bob", "25"],
    ];

    await CREATE_TABLE_TOOL.function(
      { sectionId: null, columns, rows },
      MOCK_TOOL_CONTEXT,
    );

    expect(createTableWithData).toHaveBeenCalledWith(
      expect.objectContaining({ columns, rows }),
    );
  });

  test("uses context sectionId when args.sectionId is null", async () => {
    const context = { ...MOCK_TOOL_CONTEXT, sectionId: "context-section" };

    await CREATE_TABLE_TOOL.function(
      {
        sectionId: null,
        columns: [{ title: "A" }, { title: "B" }],
        rows: [["1", "2"]],
      },
      context,
    );

    expect(createTableWithData).toHaveBeenCalledWith(
      expect.objectContaining({ sectionId: "context-section" }),
    );
  });

  test("resolves sectionId when provided in args", async () => {
    await CREATE_TABLE_TOOL.function(
      {
        sectionId: "section-0",
        columns: [{ title: "A" }, { title: "B" }],
        rows: [["1", "2"]],
      },
      MOCK_TOOL_CONTEXT,
    );

    expect(MOCK_TOOL_CONTEXT.resolveArtifactId).toHaveBeenCalledWith(
      "section-0",
    );
    expect(createTableWithData).toHaveBeenCalledWith(
      expect.objectContaining({ sectionId: "resolved-section-0" }),
    );
  });

  test("passes pageId from context", async () => {
    await CREATE_TABLE_TOOL.function(
      {
        sectionId: null,
        columns: [{ title: "A" }, { title: "B" }],
        rows: [["1", "2"]],
      },
      MOCK_TOOL_CONTEXT,
    );

    expect(createTableWithData).toHaveBeenCalledWith(
      expect.objectContaining({ pageId: "page-1" }),
    );
  });

  test("returns artifact from createTableWithData", async () => {
    const result = await CREATE_TABLE_TOOL.function(
      {
        sectionId: null,
        columns: [{ title: "A" }, { title: "B" }],
        rows: [["1", "2"]],
      },
      MOCK_TOOL_CONTEXT,
    );

    expect(result).toEqual({ artifact: TABLE_TILE });
  });
});
