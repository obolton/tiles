import ToolbarButton from "@/components/buttons/ToolbarButton";
import MenuItem from "@/components/buttons/MenuItem";
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
    tile.duplicate({ sectionId: tile.sectionId }).catch(handleError);
  }

  function toggleHide() {
    tile.setHidden(!tile.hide.value).catch(handleError);
  }

  function deleteTile() {
    tile.delete().catch(handleError);
  }

  return (
    <ul role="group" aria-label="More tools">
      <li role="presentation">
        <ToolbarButton
          id={`${tile.id}-options-button`}
          label="More options"
          popoverTarget={`${tile.id}-options`}
          aria-haspopup="menu"
          aria-expanded="false"
        >
          <MoreIcon aria-hidden="true" />
        </ToolbarButton>

        <popover-menu
          id={`${tile.id}-options`}
          anchor={`${tile.id}-options-button`}
        >
          <list-box>
            <ul className="menuitemgroup" role="group">
              <li>
                <MenuItem
                  classList={{ menuitem: true }}
                  icon={<ArrowUpIcon aria-hidden="true" />}
                  on:click={moveUp}
                >
                  Move up
                </MenuItem>
              </li>
              <li>
                <MenuItem
                  classList={{ menuitem: true }}
                  icon={<ArrowDownIcon aria-hidden="true" />}
                  on:click={moveDown}
                >
                  Move down
                </MenuItem>
              </li>
            </ul>

            <ul className="menuitemgroup" role="group">
              <li>
                <MenuItem
                  classList={{ menuitem: true }}
                  icon={<DuplicateIcon aria-hidden="true" />}
                  on:click={duplicate}
                >
                  Duplicate
                </MenuItem>
              </li>
              <li role="presentation">
                <MenuItem
                  classList={{ menuitem: true }}
                  icon={<HiddenIcon aria-hidden="true" />}
                  checked={tile.hide}
                  on:click={toggleHide}
                >
                  Hide
                </MenuItem>
              </li>
              <li>
                <MenuItem
                  classList={{ menuitem: true }}
                  icon={<TrashIcon aria-hidden="true" />}
                  destructive
                  on:click={deleteTile}
                >
                  Delete
                </MenuItem>
              </li>
            </ul>
          </list-box>
        </popover-menu>
      </li>
    </ul>
  );
}
