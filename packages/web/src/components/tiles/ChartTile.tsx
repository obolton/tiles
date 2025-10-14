import Tile from "./Tile";
import ChartToolbar from "@/components/toolbars/charts/ChartToolbar";
import If from "@/jsx/if";
import Each from "@/jsx/each";
import Editor from "@/editor/Editor";
import { toPlainText } from "@/utils/richText/plainText";
import styles from "./ChartTile.module.css";
import type { ChartProperties } from "@/types/tiles";
import type { RichText } from "@/utils/richText/types";
import type { Reactive } from "@/utils/reactivity";

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

export interface ChartTileProps {
  chart: ChartProperties;
  hasFocus: Reactive<boolean>;
}

export default function ChartTile({ chart, hasFocus }: ChartTileProps) {
  const anchorName = `--chart-${chart.id}`;

  if (import.meta.env.SSR) {
    return <Tile background={chart.background} anchorName={anchorName}></Tile>;
  }

  return (
    <Tile border="none" background={chart.background} anchorName={anchorName}>
      <If condition={hasFocus}>
        <ChartToolbar chart={chart} anchorName={anchorName} />
      </If>

      <chart-view className={styles.chart}>
        <Each items={chart.series}>
          {(series) => (
            <chart-series
              type={series.type}
              $values={Editor.current
                .getTableColumnData(chart.tableId.value, series.column.value.id)
                .value.map(toNumber)}
            />
          )}
        </Each>
      </chart-view>
    </Tile>
  );
}
