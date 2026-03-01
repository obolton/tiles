import ToolbarButton from "@/components/buttons/ToolbarButton";
import ToolbarGroup from "@/components/toolbars/ToolbarGroup";
import CollaborationPopover from "@/components/collaboration/CollaborationPopover";
import UndoIcon from "@/icons/undo.svg?jsx";
import RedoIcon from "@/icons/redo.svg?jsx";
import PeopleIcon from "@/icons/people.svg?jsx";
import type Editor from "@/editor/Editor";

export interface EditingToolsProps {
  editor: Editor;
}

export default function EditingTools({ editor }: EditingToolsProps) {
  const { canUndo, canRedo } = editor;

  return (
    <>
      <ToolbarGroup label="History">
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
      </ToolbarGroup>

      <ToolbarGroup label="More tools">
        <ToolbarButton
          id="collaboration-button"
          label="Collaboration"
          popovertarget="collaboration-popover"
          aria-haspopup="menu"
        >
          <PeopleIcon aria-hidden="true" />
        </ToolbarButton>

        <CollaborationPopover page={editor.page} id="collaboration-popover" />
      </ToolbarGroup>
    </>
  );
}
