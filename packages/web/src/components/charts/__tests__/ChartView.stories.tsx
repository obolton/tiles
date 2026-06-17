import Editor from "@/editor/Editor";
import Chart from "@/models/Chart";
import ChartView from "../ChartView";
import { PAGE } from "@/test/fixtures/Page";
import { createDoc } from "@/test/fixtures/doc";
import { buildTableMap } from "doc/tiles/table";
import { buildChartMap } from "doc/tiles/chart";
import type { Meta, Story } from "@/test/storybook";

const doc = createDoc([
  buildTableMap({
    id: "table",
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
  buildChartMap({
    id: "chart-default",
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
  buildChartMap({
    id: "chart-single",
    tableId: "table",
    series: [
      {
        type: "BAR",
        column: { id: "col-2", title: "Expenses" },
        fill: { type: "color", color: "ff3498db0000" },
      },
    ],
  }),
  buildChartMap({
    id: "chart-area",
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
  buildChartMap({ id: "chart-empty", tableId: "table", series: [] }),
]);

const editor = Editor.init(PAGE, doc);

const meta = {
  title: "ChartView",
} satisfies Meta;
export default meta;

export const Default: Story = {
  render: () => {
    const chart = editor.page.getTile("chart-default", Chart);
    return <ChartView chart={chart} />;
  },
};

export const SingleSeries: Story = {
  render: () => {
    const chart = editor.page.getTile("chart-single", Chart);
    return <ChartView chart={chart} />;
  },
};

export const GradientArea: Story = {
  render: () => {
    const chart = editor.page.getTile("chart-area", Chart);
    return <ChartView chart={chart} />;
  },
};

export const Empty: Story = {
  render: () => {
    const chart = editor.page.getTile("chart-empty", Chart);
    return <ChartView chart={chart} />;
  },
};
