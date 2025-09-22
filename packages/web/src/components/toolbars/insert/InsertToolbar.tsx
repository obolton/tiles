import TextIcon from "@/icons/text.svg?jsx";
import ImageIcon from "@/icons/image.svg?jsx";
import LinkIcon from "@/icons/link.svg?jsx";
import PlaceIcon from "@/icons/place.svg?jsx";
import TableIcon from "@/icons/table.svg?jsx";
import AddSectionIcon from "@/icons/add-section.svg?jsx";
import { showModal } from "@/utils/modals";
import { uploadMedia } from "@/utils/media";
import { viewTransition } from "@/utils/transitions";
import { handleError } from "@/utils/errors";
import "./InsertToolbar.module.css";
import type { TileType } from "@/types/tiles";
import type { JSX } from "@/jsx/jsx";
import type Editor from "@/editor/Editor";

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
];

const ImageModalLoader = () => import("@/components/modals/image/ImageModal");
const LinkModalLoader = () => import("@/components/modals/LinkModal");
const PlaceModalLoader = () => import("@/components/modals/PlaceModal");

export interface InsertToolbarProps {
  editor: Editor;
}

export default function InsertToolbar({ editor }: InsertToolbarProps) {
  function onClick(event: MouseEvent) {
    const button = event.currentTarget as HTMLButtonElement;
    const tileType = button.dataset.tileType as TileType;
    if (!tileType) {
      return;
    }

    switch (tileType) {
      case "TEXT":
        editor
          .createText({
            sectionId: editor.getCurrentSectionId(),
            height: 1,
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
            const imageKey = await uploadMedia({
              file: result.image,
              type: "image",
              workspaceId: editor.workspaceId,
            });
            await editor.createImage({
              sectionId: editor.getCurrentSectionId(),
              height: 10,
              imageKey,
            });
          },
        });
        break;

      case "LINK":
        showModal(LinkModalLoader, {
          props: {
            workspaceId: editor.workspaceId,
          },
          async onConfirm(result) {
            if ("linkedPageId" in result) {
              await editor.createPageLink({
                sectionId: editor.getCurrentSectionId(),
                width: 5,
                height: 5,
                linkedPageId: result.linkedPageId,
              });
            } else if (result.url) {
              await editor.createLink({
                sectionId: editor.getCurrentSectionId(),
                width: 5,
                height: 5,
                url: result.url,
              });
            }
          },
        });
        break;

      case "MAP":
        showModal(PlaceModalLoader, {
          props: {},
          async onConfirm({ place }) {
            await editor.createMap({
              sectionId: editor.getCurrentSectionId(),
              places: [place],
              height: 15,
            });
          },
        });
        break;

      case "TABLE":
        editor
          .createTable({
            sectionId: editor.getCurrentSectionId(),
            height: 10,
            columns: 3,
            rows: 5,
          })
          .catch(handleError);
        break;
    }
  }

  function createSection() {
    editor.createSection(viewTransition).catch(handleError);
  }

  return (
    <floating-toolbar
      id="insert-toolbar"
      className="bottom-right"
      aria-label="Insert content"
      data-tooltip-position="top"
    >
      <ul role="group" aria-label="Create items">
        {BUTTONS.map(({ label, type, Icon }) => (
          <li role="presentation">
            <button
              type="button"
              role="menuitem"
              className="floating"
              aria-label={label}
              data-tooltip={label}
              data-tile-type={type}
              on:click={onClick}
            >
              <Icon aria-hidden="true" />
            </button>
          </li>
        ))}

        <li role="presentation">
          <button
            type="button"
            role="menuitem"
            className="floating"
            aria-label="Add a section"
            data-tooltip="Add a section"
            on:click={createSection}
          >
            <AddSectionIcon aria-hidden="true" />
          </button>
        </li>
      </ul>
    </floating-toolbar>
  );
}
