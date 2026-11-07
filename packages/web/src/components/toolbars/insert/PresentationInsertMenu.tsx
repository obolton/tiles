import InsertTileItems from "./InsertTileItems";
import type { TilePlacementInput } from "@/models/TileContainer";
import type { JSX } from "jsx/jsx";

export interface PresentationInsertMenuProps extends JSX.Attributes<"popover-menu"> {
  getPlacement: () => TilePlacementInput;
}

export default function PresentationInsertMenu({
  getPlacement,
  ...props
}: PresentationInsertMenuProps) {
  return (
    <popover-menu {...props}>
      <InsertTileItems getPlacement={getPlacement} />
    </popover-menu>
  );
}
