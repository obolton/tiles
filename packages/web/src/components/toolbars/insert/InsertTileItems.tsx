import MenuItemGroup from "@/components/menus/MenuItemGroup";
import MenuItem from "@/components/menus/MenuItem";
import TextIcon from "@/icons/text.svg?jsx";
import ImageIcon from "@/icons/image.svg?jsx";
import LinkIcon from "@/icons/link.svg?jsx";
import TableIcon from "@/icons/table.svg?jsx";
import { showModal } from "@/utils/modals";
import { uploadMedia } from "@/utils/media";
import { handleError } from "@/utils/errors";
import Editor from "@/editor/Editor";
import Text from "@/models/Text";
import Image from "@/models/Image";
import Link from "@/models/Link";
import PageLink from "@/models/PageLink";
import Table from "@/models/Table";
import type { TileType } from "doc/types/enums";
import type { JSX } from "@/jsx/jsx";

type InsertTileButton = {
  label: string;
  type: TileType;
  Icon: JSX.Component<JSX.Attributes<"svg">>;
};

const BUTTONS: readonly InsertTileButton[] = [
  { label: "Text", type: "TEXT", Icon: TextIcon },
  { label: "Image", type: "IMAGE", Icon: ImageIcon },
  { label: "Link", type: "LINK", Icon: LinkIcon },
  { label: "Table", type: "TABLE", Icon: TableIcon },
];

const ImageModalLoader = () => import("@/components/modals/image/ImageModal");
const LinkModalLoader = () => import("@/components/modals/LinkModal");

export interface InsertTileItemsProps {
  /** Resolves the parent for inserted tiles. May throw if there is no valid target. */
  getParentId: () => string | undefined;
}

/** Menu items for inserting content tiles, shared by the insert menu variants. */
export default function InsertTileItems({ getParentId }: InsertTileItemsProps) {
  async function onClick(event: PointerEvent) {
    const button = event.currentTarget as HTMLButtonElement;
    const tileType = button.dataset.tileType as TileType;
    if (!tileType) {
      return;
    }

    try {
      const sectionId = getParentId();

      switch (tileType) {
        case "TEXT":
          await Text.create(Editor.current.page, {
            parentId: sectionId,
            beforeId: null,
            sizing: "AUTO",
          });
          break;

        case "IMAGE":
          await showModal(ImageModalLoader, {
            props: {},
            async onConfirm(result) {
              if (!result) {
                return;
              }
              const { id, width, height } = await uploadMedia({
                file: result.image,
                purpose: "content",
                workspaceId: Editor.current.workspaceId,
              });
              await Image.create(Editor.current.page, {
                parentId: sectionId,
                beforeId: null,
                imageId: id,
                size: { width, height },
                sizing: "AUTO",
                width: Editor.current.page.width.value,
              });
            },
          });
          break;

        case "LINK":
          await showModal(LinkModalLoader, {
            props: {
              workspaceId: Editor.current.workspaceId,
            },
            async onConfirm(result) {
              if ("linkedPage" in result) {
                await PageLink.create(Editor.current.page, {
                  parentId: sectionId,
                  beforeId: null,
                  linkedPage: result.linkedPage,
                  width: 5,
                  height: 5,
                });
              } else if (result.url) {
                await Link.create(Editor.current.page, {
                  parentId: sectionId,
                  beforeId: null,
                  url: result.url,
                  width: 5,
                  height: 5,
                });
              }
            },
          });
          break;

        case "TABLE":
          await Table.create(Editor.current.page, {
            parentId: sectionId,
            beforeId: null,
            height: 15,
            columns: 3,
            rows: 5,
          });
          break;
      }
    } catch (error) {
      handleError(error);
    }
  }

  return (
    <MenuItemGroup>
      {BUTTONS.map(({ label, type, Icon }) => (
        <MenuItem icon={<Icon aria-hidden="true" />} data-tile-type={type} on:click={onClick}>
          {label}
        </MenuItem>
      ))}
    </MenuItemGroup>
  );
}
