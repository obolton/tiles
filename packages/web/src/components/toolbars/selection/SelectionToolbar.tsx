import AIIcon from "@/icons/ai.svg?jsx";
import DeleteIcon from "@/icons/trash.svg?jsx";
import Editor from "@/editor/Editor";

function deleteSelection() {
  Editor.current.deleteSelection();
}

export default function SelectionToolbar() {
  return (
    <floating-toolbar
      className="bottom-left"
      data-tooltip-position="top"
      aria-label="Selection tools"
    >
      <ul role="group" aria-label="AI tools">
        <li role="presentation">
          <button
            type="button"
            role="menuitem"
            className="floating"
            aria-label="AI"
            data-tooltip="AI"
          >
            <AIIcon aria-hidden="true" />
          </button>
        </li>
      </ul>

      <ul role="group" aria-label="More tools">
        <li role="presentation">
          <button
            type="button"
            role="menuitem"
            className="floating destructive"
            aria-label="Delete"
            data-tooltip="Delete"
            on:click={deleteSelection}
          >
            <DeleteIcon aria-hidden="true" />
          </button>
        </li>
      </ul>
    </floating-toolbar>
  );
}
