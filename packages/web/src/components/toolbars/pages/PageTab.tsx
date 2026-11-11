import FolderPicker from "@/components/inputs/FolderPicker";
import ThemePicker from "@/components/themes/ThemePicker";
import ToolbarButton from "@/components/buttons/ToolbarButton";
import ToolbarGroup from "@/components/toolbars/ToolbarGroup";
import ListOption from "@/components/lists/ListOption";
import ListGroup from "@/components/lists/ListGroup";
import SizeIcon from "@/icons/size.svg?jsx";
import AlignLeftIcon from "@/icons/align-left.svg?jsx";
import AlignCenterIcon from "@/icons/align-center.svg?jsx";
import AlignRightIcon from "@/icons/align-right.svg?jsx";
import TrashIcon from "@/icons/trash.svg?jsx";
import { handleError } from "@/utils/errors";
import { redirectWithToast } from "@/utils/toasts";
import { viewTransition } from "@/utils/transitions";
import type { HorizontalAlignment } from "doc/types/enums";
import type ListSelect from "@/elements/list-select/ListSelect";
import type Page from "@/models/Page";
import type Theme from "@/models/Theme";

export interface PageTabProps {
  page: Page;
  /** Show the control for aligning the page body within the viewport. */
  showAlignment?: boolean;
}

export default function PageTab({ page, showAlignment = false }: PageTabProps) {
  function setFolder(folderId: string | null) {
    page.setFolder(folderId).catch(handleError);
  }

  function setTheme(theme: Theme | null) {
    page.editor?.undoManager?.stopCapturing();
    viewTransition(() => page.setTheme(theme));
  }

  function setWidth(event: Event) {
    const value = (event.currentTarget as ListSelect).value;
    if (value) {
      page.width.value = parseInt(value, 10);
    }
  }

  function setAlignment(event: Event) {
    page.alignment.value = (event.currentTarget as ListSelect).value as HorizontalAlignment;
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
      <ToolbarGroup label="Organize">
        <FolderPicker
          value={page.folderId}
          onChange={setFolder}
          aria-label="Folder"
          data-tooltip="Folder"
        />
      </ToolbarGroup>

      <ToolbarGroup label="Style">
        <ThemePicker
          id="page-theme"
          value={page.theme}
          onChange={setTheme}
          aria-label="Theme"
          data-tooltip="Theme"
        />

        <list-select label="Page width" value={page.width} showvalue on:change={setWidth}>
          <SizeIcon slot="default-icon" aria-hidden="true" />
          <ListGroup>
            <ListOption value="32">Standard</ListOption>
            <ListOption value="24">Narrow</ListOption>
            <ListOption value="40">Wide</ListOption>
            <ListOption value="48">Full</ListOption>
          </ListGroup>
        </list-select>

        {showAlignment ? (
          <list-select
            label="Page alignment"
            value={page.alignment}
            showvalue
            on:change={setAlignment}
          >
            <ListGroup>
              <ListOption icon={<AlignLeftIcon aria-hidden="true" />} value="LEFT">
                Left
              </ListOption>
              <ListOption icon={<AlignCenterIcon aria-hidden="true" />} value="CENTER">
                Center
              </ListOption>
              <ListOption icon={<AlignRightIcon aria-hidden="true" />} value="RIGHT">
                Right
              </ListOption>
            </ListGroup>
          </list-select>
        ) : null}
      </ToolbarGroup>

      <ToolbarGroup label="Delete">
        <ToolbarButton label="Delete page" destructive on:click={deletePage}>
          <TrashIcon aria-hidden="true" />
        </ToolbarButton>
      </ToolbarGroup>
    </toolbar-tab>
  );
}
