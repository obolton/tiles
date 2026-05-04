import Tile from "@/components/tiles/Tile";
import ChartView from "@/components/charts/ChartView";
import styles from "./ChartTileThumbnail.module.css";
import type Chart from "@/models/Chart";

export interface ChartTileThumbnailProps {
  chart: Chart;
}

export default function ChartTileThumbnail({ chart }: ChartTileThumbnailProps) {
  return (
    <Tile>
      <ChartView chart={chart} className={styles.chart} />
    </Tile>
  );
}
