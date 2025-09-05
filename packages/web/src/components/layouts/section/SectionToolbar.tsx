import MoreIcon from "@/icons/more.svg?jsx";
import TrashIcon from "@/icons/trash.svg?jsx";
import { handleError } from "@/utils/errors";
import { layoutTransition } from "@/utils/animation/layout";
import type Editor from "@/editor/Editor";
import type { SectionWithTiles } from "@/types/tiles";

export interface SectionToolbarProps {
  editor: Editor;
  section: SectionWithTiles;
  anchorName: string;
}

export default function SectionToolbar({
  editor,
  section,
  anchorName,
}: SectionToolbarProps) {
  function deleteSection() {
    editor
      .deleteSection({ id: section.id }, layoutTransition)
      .catch(handleError);
  }

  return (
    <floating-toolbar
      className="vertical anchored inside"
      style={{ positionAnchor: anchorName }}
      data-tooltip-position="right"
      aria-label="Section toolbar"
    >
      <ul role="group" aria-label="More options">
        <li role="presentation">
          <button
            type="button"
            role="menuitem"
            id={`${section.id}-options-button`}
            className="floating"
            popoverTarget={`${section.id}-options`}
            aria-label="More options"
            data-tooltip="More options"
            aria-haspopup="menu"
            aria-expanded="false"
          >
            <MoreIcon aria-hidden="true" />
          </button>

          <popover-menu
            id={`${section.id}-options`}
            anchor={`${section.id}-options-button`}
          >
            <menu>
              <li>
                <button
                  type="button"
                  className="destructive"
                  on:click={deleteSection}
                >
                  <TrashIcon aria-hidden="true" />
                  Delete section
                </button>
              </li>
            </menu>
          </popover-menu>
        </li>
      </ul>
    </floating-toolbar>
  );
}
