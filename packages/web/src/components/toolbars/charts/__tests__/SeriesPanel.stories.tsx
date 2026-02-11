import Editor from "@/editor/Editor";
import Chart from "@/models/Chart";
import Table from "@/models/Table";
import SeriesPanel from "../SeriesPanel";
import { PAGE } from "@/test/fixtures/Page";
import { CHART_TILE, TABLE_TILE } from "@/test/fixtures/Tile";
import type { Meta, Story } from "@/test/storybook";

const editor = Editor.init(PAGE);

const meta = {
  title: "SeriesPanel",
} satisfies Meta;
export default meta;

export const Default: Story = {
  render: () => {
    const chart = new Chart(editor.page, CHART_TILE);
    const table = new Table(editor.page, TABLE_TILE);

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
    const chart = new Chart(editor.page, {
      ...CHART_TILE,
      id: "empty-chart",
      series: [],
      label: null,
    });
    const table = new Table(editor.page, TABLE_TILE);

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
    const chart = new Chart(editor.page, {
      ...CHART_TILE,
      id: "unnamed-chart",
      series: [
        {
          id: "series-1",
          type: "AREA",
          fill: { type: "color", color: "ffff40400000" },
          column: { id: "col-4", title: null },
        },
      ],
      label: null,
    });
    const table = new Table(editor.page, {
      ...TABLE_TILE,
      id: "unnamed-table",
      columns: [
        { id: "col-4", title: null, width: 100, background: null },
        { id: "col-5", title: "", width: 100, background: null },
        { id: "col-6", title: "Named Column", width: 100, background: null },
      ],
    });

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
