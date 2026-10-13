import Chip from "./Chip";
import { TILE_ICONS } from "@/constants/icons";
import { getTileLabel } from "@/utils/tileLabel";
import type Tile from "@/models/Tile";

interface ReferenceChipProps {
  tile: Tile;
  onRemove: () => void;
}

export default function ReferenceChip({ tile, onRemove }: ReferenceChipProps) {
  const icon = TILE_ICONS[tile.type];
  const label = getTileLabel(tile);

  return <Chip icon={icon} label={label} href={`#${tile.id}`} onRemove={onRemove} />;
}
