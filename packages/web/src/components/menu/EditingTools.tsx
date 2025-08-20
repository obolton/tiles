import CollaborationButtons from "./CollaborationButtons";
import PageSettingsPopover from "@/components/pages/PageSettingsPopover";
import SettingsIcon from "@/icons/settings.svg?jsx";
import type Editor from "@/editor/Editor";
import type { Reactive } from "@/utils/reactivity";

interface EditingToolsProps {
  editor: Editor;
  isPublished: Reactive<boolean>;
  allowPublish: boolean;
  allowDelete: boolean;
}

export default function EditingTools({
  editor,
  isPublished,
  allowPublish,
  allowDelete,
}: EditingToolsProps) {
  return (
    <>
      <CollaborationButtons
        editor={editor}
        isPublished={isPublished}
        allowPublish={allowPublish}
      />

      <ul role="group" aria-label="More tools">
        <li role="presentation">
          <button
            id="page-settings-button"
            type="button"
            className="floating"
            role="menuitem"
            popoverTarget="page-settings-popover"
            aria-label="Page settings"
            aria-haspopup="menu"
            aria-expanded="false"
            data-tooltip="Page settings"
          >
            <SettingsIcon aria-hidden="true" />
          </button>

          <PageSettingsPopover
            editor={editor}
            allowDelete={allowDelete}
            id="page-settings-popover"
            anchor="page-settings-button"
          />
        </li>
      </ul>
    </>
  );
}
