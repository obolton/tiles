import MenuItem from "@/components/buttons/MenuItem";
import TextIcon from "@/icons/text.svg?jsx";
import ImageIcon from "@/icons/image.svg?jsx";
import LinkIcon from "@/icons/link.svg?jsx";
import PlaceIcon from "@/icons/place.svg?jsx";
import TableIcon from "@/icons/table.svg?jsx";
import ChartIcon from "@/icons/chart.svg?jsx";
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
import Chart from "@/models/Chart";
import Section from "@/models/Section";
import type { TileType } from "api/types/tiles";
import type { JSX } from "@/jsx/jsx";
import type PopoverMenu from "@/elements/menu/PopoverMenu";

type InsertTileButton = {
  label: string;
  type: TileType;
  Icon: JSX.Component<Partial<SVGSVGElement>>;
};

const BUTTONS: readonly InsertTileButton[] = [
  { label: "Text", type: "TEXT", Icon: TextIcon },
  { label: "Image", type: "IMAGE", Icon: ImageIcon },
  { label: "Map", type: "MAP", Icon: PlaceIcon },
  { label: "Link", type: "LINK", Icon: LinkIcon },
  { label: "Table", type: "TABLE", Icon: TableIcon },
  { label: "Chart", type: "CHART", Icon: ChartIcon },
];

const ImageModalLoader = () => import("@/components/modals/image/ImageModal");
const LinkModalLoader = () => import("@/components/modals/LinkModal");
const PlaceModalLoader = () => import("@/components/modals/PlaceModal");

export interface InsertMenuProps extends JSX.Attributes<PopoverMenu> {
  sectionId?: string | null;
  afterId?: string | null;
}

export default function InsertMenu({
  sectionId,
  afterId,
  ...props
}: InsertMenuProps) {
  function onClick(event: PointerEvent) {
    const button = event.currentTarget as HTMLButtonElement;
    const tileType = button.dataset.tileType as TileType;
    if (!tileType) {
      return;
    }

    const insertSectionId =
      typeof sectionId === "undefined"
        ? Editor.current.activeSection?.id
        : sectionId;

    switch (tileType) {
      case "TEXT":
        Text.create(Editor.current, {
          sectionId: insertSectionId,
          afterId,
          block: true,
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
            await Image.create(Editor.current, {
              sectionId: insertSectionId,
              afterId,
              imageId,
              height: 10,
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
              await PageLink.create(Editor.current, {
                sectionId: insertSectionId,
                afterId,
                linkedPageId: result.linkedPageId,
                width: 5,
                height: 5,
              });
            } else if (result.url) {
              await Link.create(Editor.current, {
                sectionId: insertSectionId,
                afterId,
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
            await Map.create(Editor.current, {
              sectionId: insertSectionId,
              afterId,
              places: [place],
              height: 15,
            });
          },
        });
        break;

      case "TABLE":
        Table.create(Editor.current, {
          sectionId: insertSectionId,
          afterId,
          height: 10,
          columns: 3,
          rows: 5,
        }).catch(handleError);
        break;

      case "CHART":
        Chart.create(Editor.current, {
          sectionId: insertSectionId,
          afterId,
          height: 10,
        }).catch(handleError);
        break;
    }
  }

  function createFreeformSection() {
    Section.create(Editor.current, {
      afterId,
      layout: "FREEFORM",
    }).catch(handleError);
  }

  function createStack() {
    Section.create(Editor.current, {
      afterId,
      layout: "VERTICAL",
    }).catch(handleError);
  }

  return (
    <popover-menu {...props}>
      <list-box>
        <ul className="menuitemgroup" role="group">
          {BUTTONS.map(({ label, type, Icon }) => (
            <li role="presentation">
              <MenuItem
                classList={{ menuitem: true }}
                icon={<Icon aria-hidden="true" />}
                data-tile-type={type}
                on:click={onClick}
              >
                {label}
              </MenuItem>
            </li>
          ))}
        </ul>

        <ul className="menuitemgroup" role="group">
          <li role="presentation">
            <MenuItem
              classList={{ menuitem: true }}
              icon={<VerticalLayoutIcon aria-hidden="true" />}
              on:click={createStack}
            >
              Collection
            </MenuItem>
          </li>

          <li role="presentation">
            <MenuItem
              classList={{ menuitem: true }}
              icon={<FreeformLayoutIcon aria-hidden="true" />}
              on:click={createFreeformSection}
            >
              Canvas
            </MenuItem>
          </li>
        </ul>
      </list-box>
    </popover-menu>
  );
}
