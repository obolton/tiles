import Tile from "./Tile";
import ChartToolbar from "@/components/toolbars/charts/ChartToolbar";
import If from "@/jsx/if";
import Editor from "@/editor/Editor";
import { toPlainText } from "@/utils/richText/plainText";
import styles from "./ChartTile.module.css";
import type { ChartProperties } from "@/types/tiles";
import type { RichText } from "@/utils/richText/types";
import type { Reactive } from "@/utils/reactivity";
import type ChartView from "@/elements/chart/ChartView";

function toNumber(input: number | string | RichText | null | undefined) {
  if (typeof input === "number") {
    return input;
  }

  if (!input) {
    return null;
  }

  const text = Array.isArray(input) ? toPlainText(input) : input;
  const value = parseFloat(text);

  return Number.isNaN(value) ? null : value;
}

export interface ChartTileProps extends ChartProperties {
  hasFocus: Reactive<boolean>;
}

export default function ChartTile({
  id,
  background,
  series,
  hasFocus,
}: ChartTileProps) {
  let chart: ChartView | null = null;

  function ref(element: ChartView) {
    chart = element;
  }

  const anchorName = `--chart-${id}`;

  if (import.meta.env.SSR) {
    return <Tile background={background} anchorName={anchorName}></Tile>;
  }

  const data = series.derive((seriesItem) =>
    seriesItem.map(({ column }) => ({
      marks: Editor.current
        .getTableColumnData(column.tableId, column.id)
        .value.map((value, i) => ({ label: i, value: toNumber(value) })),
    })),
  );

  return (
    <Tile background={background} anchorName={anchorName}>
      <If condition={hasFocus}>
        <ChartToolbar id={id} background={background} anchorName={anchorName} />
      </If>

      <chart-view ref={ref} className={styles.chart} $series={data.value} />
    </Tile>
  );
}
