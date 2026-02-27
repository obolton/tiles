import MenuItemGroup from "@/components/menus/MenuItemGroup";
import MenuItem from "@/components/menus/MenuItem";
import TextIcon from "@/icons/text.svg?jsx";
import ImageIcon from "@/icons/image.svg?jsx";
import LinkIcon from "@/icons/link.svg?jsx";
import PlaceIcon from "@/icons/place.svg?jsx";
import TableIcon from "@/icons/table.svg?jsx";
import VerticalLayoutIcon from "@/icons/vertical-layout.svg?jsx";
import FreeformLayoutIcon from "@/icons/freeform-layout.svg?jsx";
import { showModal } from "@/utils/modals";
import { uploadMedia } from "@/utils/media";
import { handleError } from "@/utils/errors";
import Editor from "@/editor/Editor";
import Text from "@/models/Text";
import Image from "@/models/Image";
import Link from "@/models/Link";
import PageLink from "@/models/PageLink";
import Map from "@/models/Map";
import Table from "@/models/Table";
import Section from "@/models/Section";
import type { TileType } from "api/types/tiles";
import type { JSX } from "@/jsx/jsx";

type InsertTileButton = {
  label: string;
  type: TileType;
  Icon: JSX.Component<JSX.Attributes<"svg">>;
};

const BUTTONS: readonly InsertTileButton[] = [
  { label: "Text", type: "TEXT", Icon: TextIcon },
  { label: "Image", type: "IMAGE", Icon: ImageIcon },
  { label: "Map", type: "MAP", Icon: PlaceIcon },
  { label: "Link", type: "LINK", Icon: LinkIcon },
  { label: "Table", type: "TABLE", Icon: TableIcon },
];

const ImageModalLoader = () => import("@/components/modals/image/ImageModal");
const LinkModalLoader = () => import("@/components/modals/LinkModal");
const PlaceModalLoader = () => import("@/components/modals/PlaceModal");

export interface InsertMenuProps extends JSX.Attributes<"popover-menu"> {
  sectionId?: string | null;
  afterId?: string | null;
}

export default function InsertMenu({
  sectionId,
  afterId,
  ...props
}: InsertMenuProps) {
  function getBeforeId() {
    if (!afterId) {
      return null;
    }
    const tile = Editor.current.page.getTile(afterId);
    return tile?.next?.id ?? null;
  }

  function onClick(event: PointerEvent) {
    const button = event.currentTarget as HTMLButtonElement;
    const tileType = button.dataset.tileType as TileType;
    if (!tileType) {
      return;
    }

    const insertSectionId =
      sectionId === undefined ? Editor.current.activeSection?.id : sectionId;

    switch (tileType) {
      case "TEXT":
        Text.create(Editor.current.page, {
          sectionId: insertSectionId,
          beforeId: getBeforeId(),
          sizing: "AUTO",
          content: [{ type: "paragraph", children: [] }],
        }).catch(handleError);
        break;

      case "IMAGE":
        showModal(ImageModalLoader, {
          props: {},
          async onConfirm(result) {
            if (!result) {
              return;
            }
            const imageId = await uploadMedia({
              file: result.image,
              purpose: "content",
              workspaceId: Editor.current.workspaceId,
            });
            await Image.create(Editor.current.page, {
              sectionId: insertSectionId,
              beforeId: getBeforeId(),
              imageId,
              sizing: "FOUR_THREE",
            });
          },
        });
        break;

      case "LINK":
        showModal(LinkModalLoader, {
          props: {
            workspaceId: Editor.current.workspaceId,
          },
          async onConfirm(result) {
            if ("linkedPageId" in result) {
              await PageLink.create(Editor.current.page, {
                sectionId: insertSectionId,
                beforeId: getBeforeId(),
                linkedPageId: result.linkedPageId,
                width: 5,
                height: 5,
              });
            } else if (result.url) {
              await Link.create(Editor.current.page, {
                sectionId: insertSectionId,
                beforeId: getBeforeId(),
                url: result.url,
                width: 5,
                height: 5,
              });
            }
          },
        });
        break;

      case "MAP":
        showModal(PlaceModalLoader, {
          props: {},
          async onConfirm({ place }) {
            await Map.create(Editor.current.page, {
              sectionId: insertSectionId,
              beforeId: getBeforeId(),
              places: [place],
              sizing: "FOUR_THREE",
            });
          },
        });
        break;

      case "TABLE":
        Table.create(Editor.current.page, {
          sectionId: insertSectionId,
          beforeId: getBeforeId(),
          height: 15,
          columns: 3,
          rows: 5,
        }).catch(handleError);
        break;
    }
  }

  function createFreeformSection() {
    Section.create(Editor.current.page, {
      beforeId: getBeforeId(),
      layout: "FREEFORM",
      sizing: "FOUR_THREE",
    }).catch(handleError);
  }

  function createStack() {
    Section.create(Editor.current.page, {
      beforeId: getBeforeId(),
      layout: "VERTICAL",
      height: 15,
    }).catch(handleError);
  }

  return (
    <popover-menu {...props}>
      <MenuItemGroup>
        {BUTTONS.map(({ label, type, Icon }) => (
          <MenuItem
            icon={<Icon aria-hidden="true" />}
            data-tile-type={type}
            on:click={onClick}
          >
            {label}
          </MenuItem>
        ))}
      </MenuItemGroup>

      <MenuItemGroup>
        <MenuItem
          icon={<VerticalLayoutIcon aria-hidden="true" />}
          on:click={createStack}
        >
          Collection
        </MenuItem>

        <MenuItem
          icon={<FreeformLayoutIcon aria-hidden="true" />}
          on:click={createFreeformSection}
        >
          Canvas
        </MenuItem>
      </MenuItemGroup>
    </popover-menu>
  );
}
