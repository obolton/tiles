import InsertTileItems from "./InsertTileItems";
import type { JSX } from "jsx/jsx";

export interface PresentationInsertMenuProps extends JSX.Attributes<"popover-menu"> {
  getParentId: () => string | undefined;
}

export default function PresentationInsertMenu({
  getParentId,
  ...props
}: PresentationInsertMenuProps) {
  return (
    <popover-menu {...props}>
      <InsertTileItems getParentId={getParentId} />
    </popover-menu>
  );
}
