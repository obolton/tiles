import ToolbarButton from "@/components/buttons/ToolbarButton";
import ToolbarGroup from "@/components/toolbars/ToolbarGroup";
import MenuItemGroup from "@/components/menus/MenuItemGroup";
import MenuItem from "@/components/menus/MenuItem";
import ArrowUpIcon from "@/icons/arrow-up.svg?jsx";
import ArrowDownIcon from "@/icons/arrow-down.svg?jsx";
import DuplicateIcon from "@/icons/duplicate.svg?jsx";
import HiddenIcon from "@/icons/hidden.svg?jsx";
import TrashIcon from "@/icons/trash.svg?jsx";
import MoreIcon from "@/icons/more.svg?jsx";
import DockTopIcon from "@/icons/dock-top.svg?jsx";
import DockBottomIcon from "@/icons/dock-bottom.svg?jsx";
import DockLeftIcon from "@/icons/dock-left.svg?jsx";
import DockRightIcon from "@/icons/dock-right.svg?jsx";
import { handleError } from "@/utils/errors";
import type Tile from "@/models/Tile";
import type { DockEdge } from "@/models/Tile";

export interface TileToolsProps {
  tile: Tile;
}

export default function TileTools({ tile }: TileToolsProps) {
  function moveUp() {
    tile.moveUp().catch(handleError);
  }

  function moveDown() {
    tile.moveDown().catch(handleError);
  }

  function duplicate() {
    tile
      .duplicate({ sectionId: tile.sectionId, beforeId: tile.next?.id ?? null })
      .catch(handleError);
  }

  function toggleHide() {
    tile.setHidden(!tile.hide.value).catch(handleError);
  }

  function deleteTile() {
    tile.delete().catch(handleError);
  }

  function setDock(dock: DockEdge | null) {
    tile.setDock(dock).catch(handleError);
  }

  return (
    <ToolbarGroup label="More tools">
      <ToolbarButton
        id={`${tile.id}-options-button`}
        label="More options"
        popovertarget={`${tile.id}-options`}
        aria-haspopup="menu"
        aria-expanded="false"
      >
        <MoreIcon aria-hidden="true" />
      </ToolbarButton>

      <popover-menu id={`${tile.id}-options`}>
        <MenuItemGroup>
          <MenuItem icon={<ArrowUpIcon aria-hidden="true" />} on:click={moveUp}>
            Move up
          </MenuItem>
          <MenuItem
            icon={<ArrowDownIcon aria-hidden="true" />}
            on:click={moveDown}
          >
            Move down
          </MenuItem>
        </MenuItemGroup>

        <MenuItemGroup>
          <MenuItem
            role="menuitemradio"
            icon={<DockTopIcon aria-hidden="true" />}
            checked={tile.dock.derive((d) => d === "TOP")}
            on:click={() => setDock("TOP")}
          >
            Dock to top
          </MenuItem>
          <MenuItem
            role="menuitemradio"
            icon={<DockBottomIcon aria-hidden="true" />}
            checked={tile.dock.derive((d) => d === "BOTTOM")}
            on:click={() => setDock("BOTTOM")}
          >
            Dock to bottom
          </MenuItem>
          <MenuItem
            role="menuitemradio"
            icon={<DockLeftIcon aria-hidden="true" />}
            checked={tile.dock.derive((d) => d === "LEFT")}
            on:click={() => setDock("LEFT")}
          >
            Dock to left
          </MenuItem>
          <MenuItem
            role="menuitemradio"
            icon={<DockRightIcon aria-hidden="true" />}
            checked={tile.dock.derive((d) => d === "RIGHT")}
            on:click={() => setDock("RIGHT")}
          >
            Dock to right
          </MenuItem>
          <MenuItem
            role="menuitemradio"
            checked={tile.dock.derive((d) => d === null)}
            on:click={() => setDock(null)}
          >
            Undock
          </MenuItem>
        </MenuItemGroup>

        <MenuItemGroup>
          <MenuItem
            icon={<DuplicateIcon aria-hidden="true" />}
            on:click={duplicate}
          >
            Duplicate
          </MenuItem>
          <MenuItem
            icon={<HiddenIcon aria-hidden="true" />}
            checked={tile.hide}
            on:click={toggleHide}
          >
            Hide
          </MenuItem>
          <MenuItem
            icon={<TrashIcon aria-hidden="true" />}
            destructive
            on:click={deleteTile}
          >
            Delete
          </MenuItem>
        </MenuItemGroup>
      </popover-menu>
    </ToolbarGroup>
  );
}
