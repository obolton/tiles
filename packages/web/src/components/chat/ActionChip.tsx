import Chip from "@/components/prompt/Chip";
import { TILE_ICONS } from "@/constants/icons";
import TextIcon from "@/icons/text.svg?jsx";
import type { ChatAction } from "./types";
import type { TileType } from "api/types/tiles";

export interface ActionChipProps {
  action: ChatAction;
}

export default function ActionChip({ action }: ActionChipProps) {
  const icon = TILE_ICONS[action.type as TileType] ?? TextIcon;
  const href = action.id ? `#${action.id}` : undefined;
  return <Chip icon={icon} label={action.label} href={href} />;
}
