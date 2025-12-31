import AIIcon from "@/icons/ai.svg?jsx";
import DeleteIcon from "@/icons/trash.svg?jsx";
import ToolbarButton from "@/components/buttons/ToolbarButton";
import ToolbarGroup from "@/components/toolbars/ToolbarGroup";
import Editor from "@/editor/Editor";

function deleteSelection() {
  Editor.current.deleteSelection();
}

export default function SelectionToolbar() {
  return (
    <floating-toolbar
      className="primary"
      data-tooltip-position="bottom"
      aria-label="Selection tools"
    >
      <toolbar-tab label="Selection">
        <ToolbarGroup label="AI tools">
          <ToolbarButton label="AI">
            <AIIcon aria-hidden="true" />
          </ToolbarButton>
        </ToolbarGroup>

        <ToolbarGroup label="More tools">
          <ToolbarButton label="Delete" destructive on:click={deleteSelection}>
            <DeleteIcon aria-hidden="true" />
          </ToolbarButton>
        </ToolbarGroup>
      </toolbar-tab>
    </floating-toolbar>
  );
}
