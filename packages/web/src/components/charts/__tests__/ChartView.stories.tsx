import Editor from "@/editor/Editor";
import Chart from "@/models/Chart";
import ChartView from "../ChartView";
import { PAGE } from "@/test/fixtures/Page";
import { createDoc } from "@/test/fixtures/doc";
import { buildTableMap } from "doc/tiles/table";
import { buildChartMap } from "doc/tiles/chart";
import type { Meta, Story } from "@/test/storybook";

const doc = createDoc({
  table: buildTableMap({
    columns: [
      { id: "col-1", title: "Quarter" },
      { id: "col-2", title: "Expenses" },
      { id: "col-3", title: "Profit" },
    ],
    rows: [
      { cells: ["Q1", "100", "60"] },
      { cells: ["Q2", "180", "120"] },
      { cells: ["Q3", "150", "100"] },
      { cells: ["Q4", "240", "200"] },
    ],
  }),
  "chart-default": buildChartMap({
    tableId: "table",
    label: { id: "col-1", title: "Quarter" },
    series: [
      {
        type: "BAR",
        column: { id: "col-2", title: "Expenses" },
        fill: { type: "color", color: "ff3498db0000" },
      },
      {
        type: "LINE",
        column: { id: "col-3", title: "Profit" },
        fill: { type: "color", color: "ff2ecc710000" },
      },
    ],
  }),
  "chart-single": buildChartMap({
    tableId: "table",
    series: [
      {
        type: "BAR",
        column: { id: "col-2", title: "Expenses" },
        fill: { type: "color", color: "ff3498db0000" },
      },
    ],
  }),
  "chart-area": buildChartMap({
    tableId: "table",
    series: [
      {
        type: "AREA",
        column: { id: "col-2", title: "Expenses" },
        fill: {
          type: "gradient",
          colorA: "ff9b59b60000",
          colorB: "ff3498db0000",
          direction: "BOTTOM_RIGHT",
        },
      },
    ],
  }),
  "chart-empty": buildChartMap({ tableId: "table", series: [] }),
  "chart-missing-table": buildChartMap({
    tableId: "deleted-table",
    series: [{ type: "BAR", column: { id: "col-2", title: "Expenses" }, fill: null }],
  }),
  "sparse-table": buildTableMap({
    columns: [
      { id: "col-1", title: "Month" },
      { id: "col-2", title: "Sunny days" },
      { id: "col-3", title: "Rainy days" },
    ],
    rows: [
      { cells: ["Jan", "8", "14"] },
      { cells: ["Feb", "10", "12"] },
      { cells: ["Mar", "13", null] },
      { cells: [null, null, null] },
      { cells: [null, null, null] },
    ],
  }),
  "chart-defaults": buildChartMap({
    tableId: "sparse-table",
    label: { id: "col-1", title: "Month" },
    series: [
      { type: "BAR", column: { id: "col-2", title: "Sunny days" }, fill: null },
      { type: "LINE", column: { id: "col-3", title: "Rainy days" }, fill: null },
    ],
  }),
});

const editor = Editor.init(PAGE, doc);

const FRAME = { display: "grid", width: "640px", height: "400px" };

function framed(id: string) {
  return (
    <div style={FRAME}>
      <ChartView chart={editor.page.getTile(id, Chart)} />
    </div>
  );
}

const meta = {
  title: "ChartView",
} satisfies Meta;
export default meta;

export const Default: Story = {
  render: () => framed("chart-default"),
};

export const SingleSeries: Story = {
  render: () => framed("chart-single"),
};

export const GradientArea: Story = {
  render: () => framed("chart-area"),
};

export const Empty: Story = {
  render: () => framed("chart-empty"),
};

/** Default colours, a legend, and trailing empty rows left out. */
export const DefaultColors: Story = {
  render: () => framed("chart-defaults"),
};

export const MissingTable: Story = {
  render: () => framed("chart-missing-table"),
};
