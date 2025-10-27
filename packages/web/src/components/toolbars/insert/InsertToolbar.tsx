import ToolbarButton from "@/components/buttons/ToolbarButton";
import TextIcon from "@/icons/text.svg?jsx";
import ImageIcon from "@/icons/image.svg?jsx";
import LinkIcon from "@/icons/link.svg?jsx";
import PlaceIcon from "@/icons/place.svg?jsx";
import TableIcon from "@/icons/table.svg?jsx";
import ChartIcon from "@/icons/chart.svg?jsx";
import { showModal } from "@/utils/modals";
import { uploadMedia } from "@/utils/media";
import { handleError } from "@/utils/errors";
import Editor from "@/editor/Editor";
import "./InsertToolbar.module.css";
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

export interface InsertToolbarProps extends JSX.Attributes<PopoverMenu> {
  sectionId?: string | null;
  afterId?: string | null;
  orientation?: "horizontal" | "vertical";
}

export default function InsertToolbar({
  sectionId,
  afterId,
  orientation = "vertical",
  ...props
}: InsertToolbarProps) {
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
        Editor.current
          .createText({
            sectionId: insertSectionId,
            afterId,
            block: true,
            content: [{ type: "paragraph", children: [] }],
          })
          .catch(handleError);
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
            await Editor.current.createImage({
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
              await Editor.current.createPageLink({
                sectionId: insertSectionId,
                afterId,
                linkedPageId: result.linkedPageId,
                width: 5,
                height: 5,
              });
            } else if (result.url) {
              await Editor.current.createLink({
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
            await Editor.current.createMap({
              sectionId: insertSectionId,
              afterId,
              places: [place],
              height: 15,
            });
          },
        });
        break;

      case "TABLE":
        Editor.current
          .createTable({
            sectionId: insertSectionId,
            afterId,
            height: 10,
            columns: 3,
            rows: 5,
          })
          .catch(handleError);
        break;

      case "CHART":
        Editor.current
          .createChart({
            sectionId: insertSectionId,
            afterId,
            height: 10,
          })
          .catch(handleError);
        break;
    }
  }

  return (
    <popover-menu align="center" {...props}>
      <floating-toolbar
        className={orientation}
        aria-label="Insert content"
        data-tooltip-position="left"
      >
        <ul role="group" aria-label="Create items">
          {BUTTONS.map(({ label, type, Icon }) => (
            <li role="presentation">
              <ToolbarButton
                label={label}
                data-tile-type={type}
                on:click={onClick}
              >
                <Icon aria-hidden="true" />
              </ToolbarButton>
            </li>
          ))}
        </ul>
      </floating-toolbar>
    </popover-menu>
  );
}
