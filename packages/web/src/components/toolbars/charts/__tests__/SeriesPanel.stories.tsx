import Editor from "@/editor/Editor";
import Chart from "@/models/Chart";
import Table from "@/models/Table";
import SeriesPanel from "../SeriesPanel";
import { PAGE } from "@/test/fixtures/Page";
import { createDoc } from "@/test/fixtures/doc";
import { buildTableMap } from "doc/tiles/table";
import { buildChartMap } from "doc/tiles/chart";
import type { Meta, Story } from "@/test/storybook";

const doc = createDoc({
  table: buildTableMap({
    columns: [
      { id: "col-1", title: "Revenue" },
      { id: "col-2", title: "Expenses" },
      { id: "col-3", title: "Profit" },
      { id: "col-4", title: null },
    ],
  }),
  chart: buildChartMap({
    tableId: "table",
    label: { id: "col-1", title: "Revenue" },
    series: [
      {
        type: "BAR",
        column: { id: "col-2", title: "Expenses" },
        fill: { type: "color", color: "ffff40400000" },
      },
      {
        type: "LINE",
        column: { id: "col-3", title: "Profit" },
        fill: { type: "color", color: "ffff40404040" },
      },
    ],
  }),
  "empty-chart": buildChartMap({ tableId: "table", series: [] }),
  "table-2": buildTableMap({
    columns: [
      { id: "col-4", title: null },
      { id: "col-5", title: "" },
      { id: "col-6", title: "Named Column" },
    ],
  }),
  "chart-2": buildChartMap({
    tableId: "table-2",
    series: [
      {
        type: "AREA",
        column: { id: "col-4", title: null },
        fill: { type: "color", color: "ffff40400000" },
      },
    ],
  }),
});

const editor = Editor.init(PAGE, doc);

const meta = {
  title: "SeriesPanel",
} satisfies Meta;
export default meta;

export const Default: Story = {
  render: () => {
    const chart = editor.page.getTile("chart", Chart);
    const table = editor.page.getTile("table", Table);

    return (
      <>
        <button id="series-button" popovertarget="series-panel">
          Open Series Panel
        </button>
        <SeriesPanel id="series-panel" chart={chart} table={table} />
      </>
    );
  },
};

export const Empty: Story = {
  render: () => {
    const chart = editor.page.getTile("empty-chart", Chart);
    const table = editor.page.getTile("table", Table);

    return (
      <>
        <button id="empty-series-button" popovertarget="empty-series-panel">
          Open Series Panel
        </button>
        <SeriesPanel id="empty-series-panel" chart={chart} table={table} />
      </>
    );
  },
};

export const WithUnnamedColumns: Story = {
  render: () => {
    const chart = editor.page.getTile("chart-2", Chart);
    const table = editor.page.getTile("table-2", Table);

    return (
      <>
        <button id="unnamed-series-button" popovertarget="unnamed-series-panel">
          Open Series Panel
        </button>
        <SeriesPanel id="unnamed-series-panel" chart={chart} table={table} />
      </>
    );
  },
};
