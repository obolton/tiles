import TextIcon from "@/icons/text.svg?jsx";
import ImageIcon from "@/icons/image.svg?jsx";
import LinkIcon from "@/icons/link.svg?jsx";
import PlaceIcon from "@/icons/place.svg?jsx";
import TableIcon from "@/icons/table.svg?jsx";
import AddSectionIcon from "@/icons/add-section.svg?jsx";
import { registerModal, showModal } from "@/utils/modals";
import { uploadMedia } from "@/utils/media";
import { viewTransition } from "@/utils/transitions";
import type { LinkModalResult } from "@/components/modals/LinkModal";
import type { ImageModalResult } from "@/components/modals/image/ImageModal";
import type { PlaceModalResult } from "@/components/modals/PlaceModal";
import type { TileType } from "@/types/tiles";
import type { JSX } from "@/jsx/jsx";
import type Editor from "@/editor/Editor";

type TileButton = {
  label: string;
  type: TileType;
  Icon: JSX.Component<Partial<SVGSVGElement>>;
};

const BUTTONS: TileButton[] = [
  { label: "Text", type: "TEXT", Icon: TextIcon },
  { label: "Image", type: "IMAGE", Icon: ImageIcon },
  { label: "Map", type: "MAP", Icon: PlaceIcon },
  { label: "Link", type: "LINK", Icon: LinkIcon },
  { label: "Table", type: "TABLE", Icon: TableIcon },
];

registerModal("IMAGE", () => import("@/components/modals/image/ImageModal"));

registerModal("LINK", () => import("@/components/modals/LinkModal"));

registerModal("MAP", () => import("@/components/modals/PlaceModal"));

interface TileButtonsProps {
  editor: Editor;
  sectionId?: string;
}

export default function TileButtons({ editor, sectionId }: TileButtonsProps) {
  const onClick = async (event: MouseEvent) => {
    const button = event.currentTarget as HTMLButtonElement;
    const tileType = button.dataset.tileType as TileType;
    if (!tileType) {
      return;
    }

    switch (tileType) {
      case "TEXT":
        await editor.createText({
          sectionId: sectionId ?? editor.getCurrentSectionId(),
          width: 4,
          height: 4,
          content: [{ type: "paragraph", children: [] }],
        });
        break;

      case "IMAGE":
        showModal<ImageModalResult>("IMAGE", {
          async onConfirm(result) {
            if (!result) {
              return;
            }
            const imageKey = await uploadMedia(result.image, "image");
            await editor.createImage({
              sectionId: sectionId ?? editor.getCurrentSectionId(),
              imageKey,
            });
          },
        });
        break;

      case "LINK":
        showModal<LinkModalResult>("LINK", {
          workspaceId: editor.workspaceId,
          async onConfirm(result) {
            if ("linkedPageId" in result) {
              await editor.createPageLink({
                sectionId: sectionId ?? editor.getCurrentSectionId(),
                linkedPageId: result.linkedPageId,
              });
            } else if (result.url) {
              await editor.createLink({
                sectionId: sectionId ?? editor.getCurrentSectionId(),
                url: result.url,
              });
            }
          },
        });
        break;

      case "MAP":
        showModal<PlaceModalResult>("MAP", {
          async onConfirm({ place }) {
            await editor.createMap({
              sectionId: sectionId ?? editor.getCurrentSectionId(),
              place,
              width: 6,
              height: 6,
            });
          },
        });
        break;

      case "TABLE":
        await editor.createTable({
          sectionId: sectionId ?? editor.getCurrentSectionId(),
          columns: 3,
          rows: 5,
        });
        break;
    }
  };

  const createSection = () => {
    editor.createSection(viewTransition);
  };

  return (
    <ul role="group" aria-label="Create items">
      <>
        {BUTTONS.map(({ label, type, Icon }) => (
          <li role="presentation">
            <button
              role="menuitem"
              type="button"
              className="floating small"
              aria-label={label}
              data-tooltip={label}
              data-tile-type={type}
              onclick={onClick}
            >
              <Icon aria-hidden="true" />
            </button>
          </li>
        ))}
      </>
      <li role="presentation">
        <button
          role="menuitem"
          type="button"
          className="floating small"
          aria-label="Add a section"
          data-tooltip="Add a section"
          onclick={createSection}
        >
          <AddSectionIcon aria-hidden="true" />
        </button>
      </li>
    </ul>
  );
}
