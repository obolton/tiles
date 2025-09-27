import Tile from "./Tile";
import type { ChartProperties } from "@/types/tiles";

export interface ChartTileProps extends ChartProperties {}

export default function ChartTile({ id, background }: ChartTileProps) {
  const anchorName = `--chart-${id}`;

  return <Tile background={background} anchorName={anchorName} />;
}
