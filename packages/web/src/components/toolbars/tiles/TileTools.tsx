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
import { handleError } from "@/utils/errors";
import type Tile from "@/models/Tile";

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
