import Tile from "./Tile";
import ChartToolbar from "@/components/toolbars/charts/ChartToolbar";
import If from "@/jsx/if";
import Each from "@/jsx/each";
import Portal from "@/jsx/portal";
import Editor from "@/editor/Editor";
import { toPlainText } from "@/utils/richText/plainText";
import styles from "./ChartTile.module.css";
import type { RichText } from "@/utils/richText/types";
import type { Reactive } from "@/utils/reactivity";
import type Chart from "@/models/Chart";

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
  chart: Chart;
  hasFocus: Reactive<boolean>;
}

export default function ChartTile({ chart, hasFocus }: ChartTileProps) {
  if (import.meta.env.SSR) {
    return <Tile background={chart.background}></Tile>;
  }

  return (
    <Tile border="none" background={chart.background}>
      <If condition={hasFocus}>
        <Portal>
          <ChartToolbar chart={chart} />
        </Portal>
      </If>

      <chart-view className={styles.chart}>
        <Each items={chart.series}>
          {(series) => (
            <chart-series
              type={series.type}
              $values={Editor.current
                .getTableColumnData(chart.tableId, series.column.value.id)
                .value.map(toNumber)}
            />
          )}
        </Each>
      </chart-view>
    </Tile>
  );
}
