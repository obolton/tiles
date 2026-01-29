import { describe, test, expect, vi, beforeEach } from "vitest";
import { createChart, getTableColumns } from "@/routes/charts/charts.ts";
import { MOCK_TOOL_CONTEXT } from "@/test/fixtures/ai.ts";
import { CHART_TILE } from "@/test/fixtures/Tile.ts";
import { CREATE_CHART_TOOL } from "../createChart.ts";

vi.mock("@/routes/charts/charts.ts", () => ({
  createChart: vi.fn(),
  getTableColumns: vi.fn(),
}));

const MOCK_COLUMNS = [{ id: "col-a" }, { id: "col-b" }, { id: "col-c" }];

const BASE_ARGS = {
  sectionId: null,
  size: "medium" as const,
  background: null,
  animation: null,
  frame: null,
  dock: null,
  hide: null,
  position: null,
  tableId: "table-0",
  labelColumnIndex: null,
  series: [{ columnIndex: 0, type: "bar" as const, color: null }],
};

describe("CREATE_CHART_TOOL", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(createChart).mockResolvedValue(CHART_TILE);
    vi.mocked(getTableColumns).mockResolvedValue(MOCK_COLUMNS);
  });

  test("resolves tableId via resolveArtifactId", async () => {
    await CREATE_CHART_TOOL.function(BASE_ARGS, MOCK_TOOL_CONTEXT);
    expect(MOCK_TOOL_CONTEXT.resolveArtifactId).toHaveBeenCalledWith("table-0");
  });

  test("fetches table columns with pageId and resolved tableId", async () => {
    await CREATE_CHART_TOOL.function(BASE_ARGS, MOCK_TOOL_CONTEXT);
    expect(getTableColumns).toHaveBeenCalledWith(
      "test-page",
      "resolved-table-0",
    );
  });

  test("maps columnIndex to columnId for each series", async () => {
    await CREATE_CHART_TOOL.function(
      {
        ...BASE_ARGS,
        series: [
          { columnIndex: 0, type: "bar", color: null },
          { columnIndex: 1, type: "line", color: null },
        ],
      },
      MOCK_TOOL_CONTEXT,
    );

    expect(createChart).toHaveBeenCalledWith(
      expect.objectContaining({
        series: [
          expect.objectContaining({ columnId: "col-a", type: "BAR" }),
          expect.objectContaining({ columnId: "col-b", type: "LINE" }),
        ],
      }),
    );
  });

  test("transforms chart type to uppercase", async () => {
    await CREATE_CHART_TOOL.function(
      {
        ...BASE_ARGS,
        series: [
          { columnIndex: 0, type: "bar", color: null },
          { columnIndex: 1, type: "line", color: null },
          { columnIndex: 2, type: "area", color: null },
        ],
      },
      MOCK_TOOL_CONTEXT,
    );

    expect(createChart).toHaveBeenCalledWith(
      expect.objectContaining({
        series: [
          expect.objectContaining({ type: "BAR" }),
          expect.objectContaining({ type: "LINE" }),
          expect.objectContaining({ type: "AREA" }),
        ],
      }),
    );
  });

  test("throws error when column index is out of bounds", async () => {
    await expect(
      CREATE_CHART_TOOL.function(
        {
          ...BASE_ARGS,
          series: [{ columnIndex: 10, type: "bar", color: null }],
        },
        MOCK_TOOL_CONTEXT,
      ),
    ).rejects.toThrow("Column index 10 out of bounds");
  });

  test("resolves labelColumnIndex to labelColumnId", async () => {
    await CREATE_CHART_TOOL.function(
      {
        ...BASE_ARGS,
        labelColumnIndex: 0,
        series: [{ columnIndex: 1, type: "bar", color: null }],
      },
      MOCK_TOOL_CONTEXT,
    );

    expect(createChart).toHaveBeenCalledWith(
      expect.objectContaining({ labelColumnId: "col-a" }),
    );
  });

  test("passes undefined labelColumnId when labelColumnIndex is null", async () => {
    await CREATE_CHART_TOOL.function(BASE_ARGS, MOCK_TOOL_CONTEXT);
    expect(createChart).toHaveBeenCalledWith(
      expect.objectContaining({ labelColumnId: undefined }),
    );
  });

  test("transforms series color to fill object", async () => {
    await CREATE_CHART_TOOL.function(
      {
        ...BASE_ARGS,
        series: [{ columnIndex: 0, type: "bar", color: "ff0000000000" }],
      },
      MOCK_TOOL_CONTEXT,
    );

    expect(createChart).toHaveBeenCalledWith(
      expect.objectContaining({
        series: [
          expect.objectContaining({
            fill: { type: "color", color: "ff0000000000" },
          }),
        ],
      }),
    );
  });

  test("passes undefined fill when series color is null", async () => {
    await CREATE_CHART_TOOL.function(BASE_ARGS, MOCK_TOOL_CONTEXT);
    expect(createChart).toHaveBeenCalledWith(
      expect.objectContaining({
        series: [expect.objectContaining({ fill: undefined })],
      }),
    );
  });

  test("passes background to createChart", async () => {
    await CREATE_CHART_TOOL.function(
      { ...BASE_ARGS, background: { type: "color", color: "00ff00000000" } },
      MOCK_TOOL_CONTEXT,
    );

    expect(createChart).toHaveBeenCalledWith(
      expect.objectContaining({
        background: { type: "color", color: "00ff00000000" },
      }),
    );
  });

  test("uses correct dimensions from size", async () => {
    await CREATE_CHART_TOOL.function(
      { ...BASE_ARGS, size: "large" },
      MOCK_TOOL_CONTEXT,
    );

    expect(createChart).toHaveBeenCalledWith(
      expect.objectContaining({ width: 24, height: 20 }),
    );
  });

  test("returns artifact from createChart", async () => {
    const result = await CREATE_CHART_TOOL.function(
      BASE_ARGS,
      MOCK_TOOL_CONTEXT,
    );
    expect(result).toEqual({ artifact: CHART_TILE });
  });
});
