import ToolbarButton from "@/components/buttons/ToolbarButton";
import UndoIcon from "@/icons/undo.svg?jsx";
import RedoIcon from "@/icons/redo.svg?jsx";
import ShareIcon from "@/icons/share.svg?jsx";
import HistoryIcon from "@/icons/history.svg?jsx";
import { SHARE_BUTTON_ID, SHARE_PANEL_ID } from "@/components/collaboration/Share";
import {
  VERSION_HISTORY_BUTTON_ID,
  VERSION_HISTORY_PANEL_ID,
} from "@/components/versions/VersionHistory";
import type Editor from "@/editor/Editor";

export interface EditingToolsProps {
  editor: Editor;
}

export default function EditingTools({ editor }: EditingToolsProps) {
  const { canUndo, canRedo } = editor;

  return (
    <>
      <ToolbarButton
        label="Undo"
        aria-disabled={canUndo.derive((v) => (v ? undefined : "true"))}
        on:click={() => editor.undo()}
      >
        <UndoIcon aria-hidden="true" />
      </ToolbarButton>

      <ToolbarButton
        label="Redo"
        aria-disabled={canRedo.derive((v) => (v ? undefined : "true"))}
        on:click={() => editor.redo()}
      >
        <RedoIcon aria-hidden="true" />
      </ToolbarButton>

      <ToolbarButton
        id={SHARE_BUTTON_ID}
        label="Share"
        aria-pressed={editor.share.isOpen}
        aria-controls={SHARE_PANEL_ID}
        on:click={() => editor.share.toggle()}
      >
        <ShareIcon aria-hidden="true" />
      </ToolbarButton>

      <ToolbarButton
        id={VERSION_HISTORY_BUTTON_ID}
        label="Version history"
        aria-pressed={editor.versionHistory.isOpen}
        aria-controls={VERSION_HISTORY_PANEL_ID}
        on:click={() => editor.versionHistory.toggle()}
      >
        <HistoryIcon aria-hidden="true" />
      </ToolbarButton>
    </>
  );
}
