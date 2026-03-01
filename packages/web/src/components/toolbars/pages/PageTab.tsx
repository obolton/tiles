import FolderPicker from "@/components/inputs/FolderPicker";
import ToolbarButton from "@/components/buttons/ToolbarButton";
import ToolbarGroup from "@/components/toolbars/ToolbarGroup";
import MenuItemGroup from "@/components/menus/MenuItemGroup";
import MenuItem from "@/components/menus/MenuItem";
import TrashIcon from "@/icons/trash.svg?jsx";
import MoreIcon from "@/icons/more.svg?jsx";
import { handleError } from "@/utils/errors";
import { redirectWithToast } from "@/utils/toasts";
import type Page from "@/models/Page";

export interface PageTabProps {
  page: Page;
  allowDelete?: boolean;
}

export default function PageTab({ page, allowDelete = true }: PageTabProps) {
  function setFolder(folderId: string | null) {
    page.setFolder(folderId).catch(handleError);
  }

  function deletePage() {
    page
      .delete()
      .then(() =>
        redirectWithToast(
          `/workspaces/${page.workspaceId}/trash`,
          "The page was deleted.",
          "success",
        ),
      )
      .catch(handleError);
  }

  return (
    <toolbar-tab name="page" label="Page">
      <ToolbarGroup label="Page settings">
        <FolderPicker
          value={page.folderId}
          onChange={setFolder}
          aria-label="Folder"
          data-tooltip="Folder"
        />
      </ToolbarGroup>

      <ToolbarGroup label="More tools">
        <ToolbarButton
          id="page-options-button"
          label="More options"
          popovertarget="page-options"
          aria-haspopup="menu"
          aria-expanded="false"
        >
          <MoreIcon aria-hidden="true" />
        </ToolbarButton>

        <popover-menu id="page-options">
          <MenuItemGroup>
            <MenuItem
              icon={<TrashIcon aria-hidden="true" />}
              destructive
              disabled={allowDelete ? undefined : true}
              on:click={deletePage}
            >
              Delete page
            </MenuItem>
          </MenuItemGroup>
        </popover-menu>
      </ToolbarGroup>
    </toolbar-tab>
  );
}
