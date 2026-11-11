import ToolbarButton from "@/components/buttons/ToolbarButton";
import UndoIcon from "@/icons/undo.svg?jsx";
import RedoIcon from "@/icons/redo.svg?jsx";
import If from "jsx/if";
import { reactive } from "carillon";
import type Editor from "@/editor/Editor";
import type { Reactive } from "carillon";

export interface EditingToolsProps {
  editor: Editor;
  /** Whether undo and redo are shown inline rather than in the overflow menu. */
  undoRedo?: Reactive<boolean>;
}

export default function EditingTools({ editor, undoRedo = reactive(true) }: EditingToolsProps) {
  const { canUndo, canRedo } = editor;

  return (
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
  );
}
