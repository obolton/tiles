import MenuItem from "@/components/menus/MenuItem";
import MenuItemGroup from "@/components/menus/MenuItemGroup";
import DocumentIcon from "@/icons/document.svg?jsx";
import PresentationIcon from "@/icons/presentation.svg?jsx";
import EmptyIcon from "@/icons/empty.svg?jsx";
import client from "@/api/client";
import { handleError } from "@/utils/errors";
import { navigate } from "@/utils/navigation";
import type { PageType } from "api/types/pages";
import type { JSX } from "jsx/jsx";

const PAGE_TYPES: { type: PageType; name: string; icon: () => JSX.Node }[] = [
  { type: "DOCUMENT", name: "Document", icon: () => <DocumentIcon aria-hidden="true" /> },
  {
    type: "PRESENTATION",
    name: "Presentation",
    icon: () => <PresentationIcon aria-hidden="true" />,
  },
  { type: "LAYOUT", name: "Layout", icon: () => <EmptyIcon aria-hidden="true" /> },
];

export async function createPage(workspaceId: string, type: PageType) {
  try {
    const { id } = await client.pages.create.mutate({ workspaceId, title: "New page", type });
    navigate(`/pages/${id}?edit=true`);
  } catch (error) {
    handleError(error);
  }
}

export interface NewPageMenuItemsProps {
  workspaceId: string;
  /** Name items "New document" and so on, for menus where the context doesn't say so. */
  prefixed?: boolean;
}

export default function NewPageMenuItems({ workspaceId, prefixed }: NewPageMenuItemsProps) {
  return (
    <MenuItemGroup label="New page">
      {PAGE_TYPES.map(({ type, name, icon }) => (
        <MenuItem icon={icon()} on:click={() => createPage(workspaceId, type)}>
          {prefixed ? `New ${name.toLowerCase()}` : name}
        </MenuItem>
      ))}
    </MenuItemGroup>
  );
}
