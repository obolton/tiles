import CollaborationPopover from "@/components/collaboration/CollaborationPopover";
import PeopleIcon from "@/icons/people.svg?jsx";
import PageSettingsPopover from "@/components/pages/PageSettingsPopover";
import SettingsIcon from "@/icons/settings.svg?jsx";
import type Editor from "@/editor/Editor";

export interface EditingToolsProps {
  editor: Editor;
  allowDelete: boolean;
}

export default function EditingTools({
  editor,
  allowDelete,
}: EditingToolsProps) {
  return (
    <ul role="group" aria-label="More tools">
      <li role="presentation">
        <button
          type="button"
          role="menuitem"
          id="collaboration-button"
          className="floating"
          aria-label="Collaboration"
          data-tooltip="Collaboration"
          popovertarget="collaboration-popover"
          aria-haspopup="menu"
          aria-expanded="false"
        >
          <PeopleIcon aria-hidden="true" />
        </button>

        <CollaborationPopover editor={editor} id="collaboration-popover" />
      </li>

      <li role="presentation">
        <button
          id="page-settings-button"
          type="button"
          className="floating"
          role="menuitem"
          popovertarget="page-settings-popover"
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
        />
      </li>
    </ul>
  );
}
