import ToolbarButton from "@/components/buttons/ToolbarButton";
import UndoIcon from "@/icons/undo.svg?jsx";
import RedoIcon from "@/icons/redo.svg?jsx";
import HistoryIcon from "@/icons/history.svg?jsx";
import If from "jsx/if";
import { reactive } from "carillon";
import {
  VERSION_HISTORY_BUTTON_ID,
  VERSION_HISTORY_PANEL_ID,
} from "@/components/versions/VersionHistory";
import type Editor from "@/editor/Editor";
import type { Reactive } from "carillon";

export interface EditingToolsProps {
  editor: Editor;
  /** Whether each tool is shown inline rather than in the overflow menu. */
  undoRedo?: Reactive<boolean>;
  versionHistory?: Reactive<boolean>;
}

export default function EditingTools({
  editor,
  undoRedo = reactive(true),
  versionHistory = reactive(true),
}: EditingToolsProps) {
  const { canUndo, canRedo } = editor;

  return (
    <>
      <If condition={undoRedo}>
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
      </If>

      <If condition={versionHistory}>
        <ToolbarButton
          id={VERSION_HISTORY_BUTTON_ID}
          label="Version history"
          aria-pressed={editor.versionHistory.isOpen}
          aria-controls={editor.versionHistory.isOpen.derive((open) =>
            open ? VERSION_HISTORY_PANEL_ID : undefined,
          )}
          on:click={() => editor.versionHistory.toggle()}
        >
          <HistoryIcon aria-hidden="true" />
        </ToolbarButton>
      </If>
    </>
  );
}
