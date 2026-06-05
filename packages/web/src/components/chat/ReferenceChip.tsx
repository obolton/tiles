import Chip from "@/components/prompt/Chip";
import { TILE_ICONS } from "@/constants/icons";
import type { ChatReference } from "./types";

export interface ReferenceChipProps {
  reference: ChatReference;
}

export default function ReferenceChip({ reference }: ReferenceChipProps) {
  return (
    <Chip
      icon={TILE_ICONS[reference.type]}
      label={reference.type.toLowerCase()}
      href={`#${reference.id}`}
    />
  );
}
