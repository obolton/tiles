import MenuItemGroup from "@/components/menus/MenuItemGroup";
import MenuItem from "@/components/menus/MenuItem";
import TextIcon from "@/icons/text.svg?jsx";
import ImageIcon from "@/icons/image.svg?jsx";
import LinkIcon from "@/icons/link.svg?jsx";
import TableIcon from "@/icons/table.svg?jsx";
import { showModal } from "@/utils/modals";
import { uploadMedia } from "@/utils/media";
import { handleError } from "@/utils/errors";
import { getAspect } from "@/utils/aspect";
import { getFreeformPlacement, type FreeformPlacement } from "@/utils/freeform";
import Editor from "@/editor/Editor";
import Section from "@/models/Section";
import Text from "@/models/Text";
import Image from "@/models/Image";
import Link from "@/models/Link";
import PageLink from "@/models/PageLink";
import Table from "@/models/Table";
import type { TileType } from "doc/types/enums";
import type { JSX } from "jsx/jsx";

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

// Nominal aspect ratios used to position auto-height tiles on freeform sections
const TEXT_ASPECT = 3;
const LINK_ASPECT = 1;
const TABLE_ASPECT = 2;
const TABLE_FREEFORM_WIDTH = 200 / 3;

const ImageModalLoader = () => import("@/components/modals/image/ImageModal");
const LinkModalLoader = () => import("@/components/modals/LinkModal");

/** Default geometry for a tile inserted into `sectionId`, or null when the parent is not freeform. */
function getPlacement(
  sectionId: string | undefined,
  contentAspect: number,
  width?: number,
): FreeformPlacement | null {
  const section = sectionId ? Editor.current.page.index.get(sectionId) : undefined;
  if (!(section instanceof Section) || section.layout.value !== "FREEFORM") {
    return null;
  }
  const sectionAspect = getAspect(
    section.sizing.value,
    section.width.value ?? section.page.width.value,
    section.height.value,
  );
  return getFreeformPlacement(sectionAspect, contentAspect, width);
}

export interface InsertTileItemsProps {
  /** Resolves the parent for inserted tiles. May throw if there is no valid target. */
  getParentId: () => string | undefined;
}

/** Menu items for inserting content tiles, shared by the insert menu variants. */
export default function InsertTileItems({ getParentId }: InsertTileItemsProps) {
  async function insertTile(tileType: TileType) {
    try {
      const sectionId = getParentId();

      switch (tileType) {
        case "TEXT":
          await Text.create(Editor.current.page, {
            parentId: sectionId,
            beforeId: null,
            sizing: "AUTO",
            ...getPlacement(sectionId, TEXT_ASPECT),
          });
          break;

        case "IMAGE":
          await showModal(ImageModalLoader, {
            props: {},
            async onConfirm(result) {
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
                ...getPlacement(sectionId, width / height),
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
              const geometry = {
                parentId: sectionId,
                beforeId: null,
                width: 5,
                height: 5,
                ...getPlacement(sectionId, LINK_ASPECT),
              };
              if ("linkedPage" in result) {
                await PageLink.create(Editor.current.page, {
                  ...geometry,
                  linkedPage: result.linkedPage,
                });
              } else if (result.url) {
                await Link.create(Editor.current.page, {
                  ...geometry,
                  url: result.url,
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
            ...getPlacement(sectionId, TABLE_ASPECT, TABLE_FREEFORM_WIDTH),
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
        <MenuItem icon={<Icon aria-hidden="true" />} on:click={() => insertTile(type)}>
          {label}
        </MenuItem>
      ))}
    </MenuItemGroup>
  );
}
