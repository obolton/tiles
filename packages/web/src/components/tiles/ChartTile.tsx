import Tile from "./Tile";
import ChartToolbar from "@/components/toolbars/charts/ChartToolbar";
import ChartView from "@/components/charts/ChartView";
import If from "jsx/if";
import Portal from "jsx/portal";
import styles from "./ChartTile.module.css";
import type { Reactive } from "reactivity";
import type Chart from "@/models/Chart";

export interface ChartTileProps {
  chart: Chart;
  showToolbar: Reactive<boolean>;
}

export default function ChartTile({ chart, showToolbar }: ChartTileProps) {
  return (
    <Tile>
      <If condition={showToolbar}>
        <Portal element="toolbar-slot">
          <ChartToolbar chart={chart} />
        </Portal>
      </If>

      <ChartView chart={chart} className={styles.chart} />
    </Tile>
  );
}
