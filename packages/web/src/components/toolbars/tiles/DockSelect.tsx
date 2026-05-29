import ListOption from "@/components/lists/ListOption";
import ListGroup from "@/components/lists/ListGroup";
import DockTopIcon from "@/icons/dock-top.svg?jsx";
import DockBottomIcon from "@/icons/dock-bottom.svg?jsx";
import DockLeftIcon from "@/icons/dock-left.svg?jsx";
import DockRightIcon from "@/icons/dock-right.svg?jsx";
import { dockParentId, parseParentId } from "@/models/parentId";
import type Tile from "@/models/Tile";
import type { DockEdge } from "@/models/Tile";
import type ListSelect from "@/elements/list-select/ListSelect";

export interface DockSelectProps {
  tile: Tile;
}

export default function DockSelect({ tile }: DockSelectProps) {
  function handleChange(event: Event) {
    const value = (event.currentTarget as ListSelect).value as DockEdge | "";
    tile.move({ parentId: value ? dockParentId(value) : null });
  }

  const value = tile.parentId.derive((parentId) => {
    const parent = parseParentId(parentId);
    return parent.type === "dock" ? parent.edge : "";
  });

  return (
    <list-select
      label="Dock"
      data-tooltip="Dock"
      orientation="vertical"
      value={value}
      showvalue
      on:change={handleChange}
    >
      <DockTopIcon slot="default-icon" aria-hidden="true" />
      <ListGroup>
        <ListOption value="">None</ListOption>
      </ListGroup>
      <ListGroup>
        <ListOption icon={<DockTopIcon aria-hidden="true" />} value="TOP">
          Top
        </ListOption>
        <ListOption icon={<DockBottomIcon aria-hidden="true" />} value="BOTTOM">
          Bottom
        </ListOption>
        <ListOption icon={<DockLeftIcon aria-hidden="true" />} value="LEFT">
          Left
        </ListOption>
        <ListOption icon={<DockRightIcon aria-hidden="true" />} value="RIGHT">
          Right
        </ListOption>
      </ListGroup>
    </list-select>
  );
}
