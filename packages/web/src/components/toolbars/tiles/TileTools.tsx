import ToolbarButton from "@/components/buttons/ToolbarButton";
import ArrowUpIcon from "@/icons/arrow-up.svg?jsx";
import ArrowDownIcon from "@/icons/arrow-down.svg?jsx";
import DuplicateIcon from "@/icons/duplicate.svg?jsx";
import TrashIcon from "@/icons/trash.svg?jsx";
import MoreIcon from "@/icons/more.svg?jsx";
import { handleError } from "@/utils/errors";
import type Tile from "@/models/Tile";

export interface TileToolsProps {
  tile: Tile;
}

export default function TileTools({ tile }: TileToolsProps) {
  function moveUp() {
    tile.editor.moveTileUp(tile.id).catch(handleError);
  }

  function moveDown() {
    tile.editor.moveTileDown(tile.id).catch(handleError);
  }

  function duplicate() {
    tile.duplicate({ sectionId: tile.sectionId.value }).catch(handleError);
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
          <menu>
            <li>
              <button type="button" on:click={moveUp}>
                <ArrowUpIcon aria-hidden="true" />
                Move up
              </button>
            </li>
            <li>
              <button type="button" on:click={moveDown}>
                <ArrowDownIcon aria-hidden="true" />
                Move down
              </button>
            </li>
            <li>
              <button type="button" on:click={duplicate}>
                <DuplicateIcon aria-hidden="true" />
                Duplicate
              </button>
            </li>
            <li>
              <button
                type="button"
                className="destructive"
                on:click={deleteTile}
              >
                <TrashIcon aria-hidden="true" />
                Delete
              </button>
            </li>
          </menu>
        </popover-menu>
      </li>
    </ul>
  );
}
