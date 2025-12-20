import AIIcon from "@/icons/ai.svg?jsx";
import DeleteIcon from "@/icons/trash.svg?jsx";
import ToolbarButton from "@/components/buttons/ToolbarButton";
import Editor from "@/editor/Editor";

function deleteSelection() {
  Editor.current.deleteSelection();
}

export default function SelectionToolbar() {
  return (
    <floating-toolbar
      className="primary"
      data-tooltip-position="top"
      aria-label="Selection tools"
    >
      <toolbar-tab label="Selection">
        <ul role="group" aria-label="AI tools">
          <li role="presentation">
            <ToolbarButton label="AI">
              <AIIcon aria-hidden="true" />
            </ToolbarButton>
          </li>
        </ul>

        <ul role="group" aria-label="More tools">
          <li role="presentation">
            <ToolbarButton
              label="Delete"
              destructive
              on:click={deleteSelection}
            >
              <DeleteIcon aria-hidden="true" />
            </ToolbarButton>
          </li>
        </ul>
      </toolbar-tab>
    </floating-toolbar>
  );
}
