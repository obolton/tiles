import ToolbarButton from "@/components/buttons/ToolbarButton";
import ToolbarGroup from "@/components/toolbars/ToolbarGroup";
import ArrowUpIcon from "@/icons/arrow-up.svg?jsx";
import ArrowDownIcon from "@/icons/arrow-down.svg?jsx";
import DuplicateIcon from "@/icons/duplicate.svg?jsx";
import HiddenIcon from "@/icons/hidden.svg?jsx";
import TrashIcon from "@/icons/trash.svg?jsx";
import { handleError } from "@/utils/errors";
import type Tile from "@/models/Tile";

export interface TileToolsProps {
  tile: Tile;
}

export default function TileTools({ tile }: TileToolsProps) {
  function handleMoveUp() {
    tile.moveUp();
  }

  function handleMoveDown() {
    tile.moveDown();
  }

  function handleDuplicate() {
    try {
      tile.duplicate();
    } catch (error) {
      handleError(error);
    }
  }

  function toggleHide() {
    tile.hide.value = !tile.hide.value;
  }

  function handleDelete() {
    tile.delete().catch(handleError);
  }

  return (
    <>
      <ToolbarGroup label="Move">
        <ToolbarButton on:click={handleMoveUp}>
          <ArrowUpIcon aria-hidden="true" />
          Move up
        </ToolbarButton>
        <ToolbarButton on:click={handleMoveDown}>
          <ArrowDownIcon aria-hidden="true" />
          Move down
        </ToolbarButton>
      </ToolbarGroup>

      <ToolbarGroup label="Tile actions">
        <ToolbarButton on:click={handleDuplicate}>
          <DuplicateIcon aria-hidden="true" />
          Duplicate
        </ToolbarButton>

        <ToolbarButton aria-pressed={tile.hide} on:click={toggleHide}>
          <HiddenIcon aria-hidden="true" />
          Hide
        </ToolbarButton>
      </ToolbarGroup>

      <ToolbarGroup label="Delete">
        <ToolbarButton destructive on:click={handleDelete}>
          <TrashIcon aria-hidden="true" />
          Delete
        </ToolbarButton>
      </ToolbarGroup>
    </>
  );
}
