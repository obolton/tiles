import client from "@/api/client";
import { handleError } from "@/utils/errors";
import { showToast } from "@/utils/toasts";
import ToolbarButton from "@/components/buttons/ToolbarButton";
import ToolbarGroup from "@/components/toolbars/ToolbarGroup";
import FolderPicker from "@/components/inputs/FolderPicker";
import CloseIcon from "@/icons/close.svg?jsx";
import TrashIcon from "@/icons/trash.svg?jsx";
import UndoIcon from "@/icons/undo.svg?jsx";
import type { ReactiveSet } from "@/utils/reactivity";

interface LibrarySelectionToolbarProps {
  workspaceId: string;
  selection: ReactiveSet<string>;
  move?: boolean;
  trash?: boolean;
  restore?: boolean;
  onComplete: () => void;
}

export default function LibrarySelectionToolbar({
  workspaceId,
  selection,
  move,
  trash,
  restore,
  onComplete,
}: LibrarySelectionToolbarProps) {
  async function deleteSelected() {
    const pageIds = Array.from(selection);
    try {
      await client.pages.delete.mutate({ workspaceId, pageIds });
      const count = pageIds.length;
      showToast(`Moved ${count} ${count === 1 ? "page" : "pages"} to trash`);
      selection.clear();
      onComplete();
    } catch (error) {
      handleError(error);
    }
  }

  async function restoreSelected() {
    const pageIds = Array.from(selection);
    try {
      await client.pages.restore.mutate({ workspaceId, pageIds });
      const count = pageIds.length;
      showToast(`Restored ${count} ${count === 1 ? "page" : "pages"}`);
      selection.clear();
      onComplete();
    } catch (error) {
      handleError(error);
    }
  }

  async function moveToFolder(folderId: string | null) {
    const pageIds = Array.from(selection);
    try {
      await client.pages.move.mutate({ workspaceId, pageIds, folderId });
      const count = pageIds.length;
      showToast(
        folderId
          ? `Moved ${count} ${count === 1 ? "page" : "pages"} to folder`
          : `Removed ${count} ${count === 1 ? "page" : "pages"} from folder`,
      );
      selection.clear();
      onComplete();
    } catch (error) {
      handleError(error);
    }
  }

  return (
    <floating-toolbar
      className="primary"
      data-tooltip-position="bottom"
      aria-label="Bulk actions"
    >
      <toolbar-tab label="Actions">
        <ToolbarGroup label="Selection">
          <ToolbarButton
            label="Clear selection"
            on:click={() => selection.clear()}
          >
            <CloseIcon aria-hidden="true" />
          </ToolbarButton>
        </ToolbarGroup>

        <ToolbarGroup label="Actions">
          {move ? <FolderPicker onChange={moveToFolder} /> : null}
          {trash ? (
            <ToolbarButton
              label="Move to trash"
              destructive
              on:click={deleteSelected}
            >
              <TrashIcon aria-hidden="true" />
            </ToolbarButton>
          ) : null}
          {restore ? (
            <ToolbarButton label="Restore" on:click={restoreSelected}>
              <UndoIcon aria-hidden="true" />
            </ToolbarButton>
          ) : null}
        </ToolbarGroup>
      </toolbar-tab>
    </floating-toolbar>
  );
}
