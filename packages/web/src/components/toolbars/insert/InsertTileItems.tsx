import MenuItemGroup from "@/components/menus/MenuItemGroup";
import MenuItem from "@/components/menus/MenuItem";
import TextIcon from "@/icons/text.svg?jsx";
import ImageIcon from "@/icons/image.svg?jsx";
import VideoIcon from "@/icons/video.svg?jsx";
import LinkIcon from "@/icons/link.svg?jsx";
import TableIcon from "@/icons/table.svg?jsx";
import ChartIcon from "@/icons/chart.svg?jsx";
import If from "jsx/if";
import { showModal } from "@/utils/modals";
import { uploadMedia } from "@/utils/media";
import { handleError } from "@/utils/errors";
import Editor from "@/editor/Editor";
import Text from "@/models/Text";
import Image from "@/models/Image";
import Video from "@/models/Video";
import Link from "@/models/Link";
import PageLink from "@/models/PageLink";
import Table from "@/models/Table";
import Chart from "@/models/Chart";
import type { TileType } from "doc/types/enums";
import type { TilePlacementInput } from "@/models/TileContainer";
import type { JSX } from "jsx/jsx";
import type { Reactive } from "reactivity";

type InsertTileButton = {
  label: string;
  type: TileType;
  Icon: JSX.Component<JSX.Attributes<"svg">>;
};

const BUTTONS: readonly InsertTileButton[] = [
  { label: "Text", type: "TEXT", Icon: TextIcon },
  { label: "Image", type: "IMAGE", Icon: ImageIcon },
  { label: "Video", type: "VIDEO", Icon: VideoIcon },
  { label: "Link", type: "LINK", Icon: LinkIcon },
  { label: "Table", type: "TABLE", Icon: TableIcon },
  { label: "Chart", type: "CHART", Icon: ChartIcon },
];

const ImageModalLoader = () => import("@/components/modals/image/ImageModal");
const VideoModalLoader = () => import("@/components/modals/VideoModal");
const LinkModalLoader = () => import("@/components/modals/LinkModal");

export interface InsertTileItemsProps {
  /** Resolves where inserted tiles go. May throw if there is no valid target. */
  getPlacement: () => TilePlacementInput;
  /** Whether a text tile can be inserted; text is typed directly into a document body. */
  showText?: Reactive<boolean>;
}

/** Menu items for inserting content tiles, shared by the insert menu variants. */
export default function InsertTileItems({ getPlacement, showText }: InsertTileItemsProps) {
  async function insertTile(tileType: TileType) {
    try {
      const placement = getPlacement();

      switch (tileType) {
        case "TEXT":
          await Text.create(Editor.current.page, {
            ...placement,
            sizing: "AUTO",
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
                ...placement,
                imageId: id,
                size: { width, height },
                sizing: "AUTO",
                width: Editor.current.page.width.value,
              });
            },
          });
          break;

        case "VIDEO":
          await showModal(VideoModalLoader, {
            props: {},
            async onConfirm({ url }) {
              await Video.create(Editor.current.page, {
                ...placement,
                url,
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
                  ...placement,
                  linkedPage: result.linkedPage,
                  width: 5,
                  height: 5,
                });
              } else if (result.url) {
                await Link.create(Editor.current.page, {
                  ...placement,
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
            ...placement,
            height: 15,
            columns: 3,
            rows: 5,
          });
          break;

        case "CHART": {
          const selected = Editor.current.lastSelectedTile;
          await (selected instanceof Table
            ? Chart.createFromTable(selected)
            : Chart.createWithSampleData(Editor.current.page, placement));
          break;
        }
      }
    } catch (error) {
      handleError(error);
    }
  }

  return (
    <MenuItemGroup>
      {BUTTONS.map(({ label, type, Icon }) => {
        const item = (
          <MenuItem icon={<Icon aria-hidden="true" />} on:click={() => insertTile(type)}>
            {label}
          </MenuItem>
        );
        return type === "TEXT" && showText ? <If condition={showText}>{item}</If> : item;
      })}
    </MenuItemGroup>
  );
}
