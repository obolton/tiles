import Editor from "@/editor/Editor";
import Chart from "@/models/Chart";
import ChartView from "../ChartView";
import { PAGE } from "@/test/fixtures/Page";
import { CHART_TILE, TABLE_TILE } from "@/test/fixtures/Tile";
import type { Meta, Story } from "@/test/storybook";

const TABLE_DATA = {
  ...TABLE_TILE,
  sectionId: null,
  rows: [
    {
      id: "row-1",
      height: 40,
      data: { "col-1": "Q1", "col-2": "100", "col-3": "60" },
      background: null,
    },
    {
      id: "row-2",
      height: 40,
      data: { "col-1": "Q2", "col-2": "180", "col-3": "120" },
      background: null,
    },
    {
      id: "row-3",
      height: 40,
      data: { "col-1": "Q3", "col-2": "150", "col-3": "100" },
      background: null,
    },
    {
      id: "row-4",
      height: 40,
      data: { "col-1": "Q4", "col-2": "240", "col-3": "200" },
      background: null,
    },
  ],
};

const editor = Editor.init({
  ...PAGE,
  tiles: [
    TABLE_DATA,
    { ...CHART_TILE, id: "chart-default", sectionId: null },
    {
      ...CHART_TILE,
      id: "chart-single",
      sectionId: null,
      series: [
        {
          id: "series-1",
          type: "BAR",
          fill: { type: "color", color: "ff3498db0000" },
          column: { id: "col-2", title: "Expenses" },
        },
      ],
    },
    {
      ...CHART_TILE,
      id: "chart-area",
      sectionId: null,
      series: [
        {
          id: "series-1",
          type: "AREA",
          fill: {
            type: "gradient",
            colorA: "ff9b59b60000",
            colorB: "ff3498db0000",
            direction: "BOTTOM_RIGHT",
          },
          column: { id: "col-2", title: "Expenses" },
        },
      ],
    },
    { ...CHART_TILE, id: "chart-empty", sectionId: null, series: [] },
  ],
});

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
