import ToolbarButton from "@/components/buttons/ToolbarButton";
import MenuItem from "@/components/menus/MenuItem";
import MenuItemGroup from "@/components/menus/MenuItemGroup";
import WriteIcon from "@/icons/write.svg?jsx";
import DocumentIcon from "@/icons/document.svg?jsx";
import PresentationIcon from "@/icons/presentation.svg?jsx";
import EmptyIcon from "@/icons/empty.svg?jsx";
import client from "@/api/client";
import { handleError } from "@/utils/errors";
import { navigate } from "@/utils/navigation";
import type { PageType } from "api/types/pages";

export interface NewPageMenuProps {
  workspaceId: string;
}

export default function NewPageMenu({ workspaceId }: NewPageMenuProps) {
  async function createNewPage(type: PageType) {
    try {
      const { id } = await client.pages.create.mutate({
        workspaceId,
        title: "New page",
        type,
      });
      navigate(`/pages/${id}?edit=true`);
    } catch (error) {
      handleError(error);
    }
  }

  return (
    <>
      <ToolbarButton label="New page" popovertarget="new-page-menu" aria-haspopup="menu">
        <WriteIcon aria-hidden="true" />
      </ToolbarButton>
      <popover-menu id="new-page-menu">
        <MenuItemGroup>
          <MenuItem
            icon={<DocumentIcon aria-hidden="true" />}
            on:click={() => createNewPage("DOCUMENT")}
          >
            Document
          </MenuItem>
          <MenuItem
            icon={<PresentationIcon aria-hidden="true" />}
            on:click={() => createNewPage("PRESENTATION")}
          >
            Presentation
          </MenuItem>
          <MenuItem
            icon={<EmptyIcon aria-hidden="true" />}
            on:click={() => createNewPage("LAYOUT")}
          >
            Layout
          </MenuItem>
        </MenuItemGroup>
      </popover-menu>
    </>
  );
}
