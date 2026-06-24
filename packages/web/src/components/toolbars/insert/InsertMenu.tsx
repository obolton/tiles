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
const PlaceModalLoader = () => import("@/components/modals/PlaceModal");

export default function InsertMenu({
  ...props
}: JSX.Attributes<"popover-menu">) {
  function onClick(event: PointerEvent) {
    const button = event.currentTarget as HTMLButtonElement;
    const tileType = button.dataset.tileType as TileType;
    if (!tileType) {
      return;
    }

    const sectionId = Editor.current.activeSection?.id;

    switch (tileType) {
      case "TEXT":
        Text.create(Editor.current.page, {
          parentId: sectionId,
          beforeId: null,
          sizing: "AUTO",
        }).catch(handleError);
        break;

      case "IMAGE":
        showModal(ImageModalLoader, {
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
        showModal(LinkModalLoader, {
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
        Table.create(Editor.current.page, {
          parentId: sectionId,
          beforeId: null,
          height: 15,
          columns: 3,
          rows: 5,
        }).catch(handleError);
        break;
    }
  }

  function createGrid() {
    Section.create(Editor.current.page, {
      beforeId: null,
      layout: "GRID",
      height: 15,
    }).catch(handleError);
  }

  function createHorizontal() {
    Section.create(Editor.current.page, {
      beforeId: null,
      layout: "HORIZONTAL",
      height: 15,
    }).catch(handleError);
  }

  function createVertical() {
    Section.create(Editor.current.page, {
      beforeId: null,
      layout: "VERTICAL",
      height: 15,
    }).catch(handleError);
  }

  function createFreeform() {
    Section.create(Editor.current.page, {
      beforeId: null,
      layout: "FREEFORM",
      sizing: "FOUR_THREE",
    }).catch(handleError);
  }

  function createCalendar() {
    Section.create(Editor.current.page, {
      beforeId: null,
      layout: "CALENDAR",
      sizing: "FOUR_THREE",
    }).catch(handleError);
  }

  function createMap() {
    showModal(PlaceModalLoader, {
      props: {},
      async onConfirm({ place }) {
        const section = await Section.create(Editor.current.page, {
          beforeId: null,
          layout: "MAP",
          sizing: "FOUR_THREE",
        });
        await Text.create(Editor.current.page, {
          parentId: section.id,
          sizing: "AUTO",
          width: 8,
          coordinates: { lat: place.lat, long: place.long },
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
