import Tile from "./Tile";
import ChartToolbar from "@/components/toolbars/charts/ChartToolbar";
import ChartView from "@/components/charts/ChartView";
import ChartIcon from "@/icons/chart.svg?jsx";
import If from "jsx/if";
import Portal from "jsx/portal";
import styles from "./ChartTile.module.css";
import { combine, type Reactive } from "reactivity";
import type Chart from "@/models/Chart";

export interface ChartTileProps {
  chart: Chart;
  showToolbar: Reactive<boolean>;
}

export default function ChartTile({ chart, showToolbar }: ChartTileProps) {
  // Guidance shown in place of a chart with nothing to draw, while editing.
  const placeholder = combine(
    { table: chart.table, series: chart.series, editable: chart.editor.isEditable },
    ({ table, series, editable }) => {
      if (!editable) {
        return null;
      }
      if (!table) {
        return "The table this chart was based on has been deleted.";
      }
      if (series.length === 0) {
        return "Choose a column to chart from the Series panel.";
      }
      return null;
    },
  );

  return (
    <Tile>
      <If condition={showToolbar}>
        <Portal element="toolbar-slot">
          <ChartToolbar chart={chart} />
        </Portal>
      </If>

      <ChartView chart={chart} className={styles.chart} />

      {placeholder.derive(
        (message) =>
          message && (
            <div className={styles.placeholder}>
              <ChartIcon aria-hidden="true" />
              <p>{message}</p>
            </div>
          ),
      )}
    </Tile>
  );
}
