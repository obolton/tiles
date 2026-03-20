import MenuItemGroup from "@/components/menus/MenuItemGroup";
import MenuItem from "@/components/menus/MenuItem";
import TextIcon from "@/icons/text.svg?jsx";
import ImageIcon from "@/icons/image.svg?jsx";
import LinkIcon from "@/icons/link.svg?jsx";
import TableIcon from "@/icons/table.svg?jsx";
import PlaceIcon from "@/icons/place.svg?jsx";
import GridLayoutIcon from "@/icons/grid-layout.svg?jsx";
import HorizontalLayoutIcon from "@/icons/horizontal-layout.svg?jsx";
import VerticalLayoutIcon from "@/icons/vertical-layout.svg?jsx";
import FreeformLayoutIcon from "@/icons/freeform-layout.svg?jsx";
import CalendarLayoutIcon from "@/icons/event.svg?jsx";
import { showModal } from "@/utils/modals";
import { uploadMedia } from "@/utils/media";
import { handleError } from "@/utils/errors";
import Editor from "@/editor/Editor";
import Text from "@/models/Text";
import Image from "@/models/Image";
import Link from "@/models/Link";
import PageLink from "@/models/PageLink";
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
              sizing: "AUTO",
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

  function createGrid() {
    Section.create(Editor.current.page, {
      beforeId: getBeforeId(),
      layout: "GRID",
      height: 15,
    }).catch(handleError);
  }

  function createHorizontal() {
    Section.create(Editor.current.page, {
      beforeId: getBeforeId(),
      layout: "HORIZONTAL",
      height: 15,
    }).catch(handleError);
  }

  function createVertical() {
    Section.create(Editor.current.page, {
      beforeId: getBeforeId(),
      layout: "VERTICAL",
      height: 15,
    }).catch(handleError);
  }

  function createFreeform() {
    Section.create(Editor.current.page, {
      beforeId: getBeforeId(),
      layout: "FREEFORM",
      sizing: "FOUR_THREE",
    }).catch(handleError);
  }

  function createCalendar() {
    Section.create(Editor.current.page, {
      beforeId: getBeforeId(),
      layout: "CALENDAR",
      sizing: "FOUR_THREE",
    }).catch(handleError);
  }

  function createMap() {
    showModal(PlaceModalLoader, {
      props: {},
      async onConfirm({ place }) {
        const section = await Section.create(Editor.current.page, {
          beforeId: getBeforeId(),
          layout: "MAP",
          sizing: "FOUR_THREE",
        });
        await Text.create(Editor.current.page, {
          sectionId: section.id,
          sizing: "AUTO",
          width: 8,
          lat: place.lat,
          long: place.long,
          content: [
            {
              type: "paragraph",
              children: [{ type: "text", format: 0, text: place.name }],
            },
          ],
        });
      },
    });
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
          icon={<GridLayoutIcon aria-hidden="true" />}
          on:click={createGrid}
        >
          Grid
        </MenuItem>

        <MenuItem
          icon={<HorizontalLayoutIcon aria-hidden="true" />}
          on:click={createHorizontal}
        >
          Horizontal
        </MenuItem>

        <MenuItem
          icon={<VerticalLayoutIcon aria-hidden="true" />}
          on:click={createVertical}
        >
          Vertical
        </MenuItem>

        <MenuItem
          icon={<FreeformLayoutIcon aria-hidden="true" />}
          on:click={createFreeform}
        >
          Freeform
        </MenuItem>

        <MenuItem
          icon={<CalendarLayoutIcon aria-hidden="true" />}
          on:click={createCalendar}
        >
          Calendar
        </MenuItem>

        <MenuItem icon={<PlaceIcon aria-hidden="true" />} on:click={createMap}>
          Map
        </MenuItem>
      </MenuItemGroup>
    </popover-menu>
  );
}
