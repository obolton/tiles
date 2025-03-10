import { useCallback, lazy } from "react";
import useEditable from "@/hooks/useEditable";
import TextIcon from "@/icons/text.svg?jsx";
import ImageIcon from "@/icons/image.svg?jsx";
import LinkIcon from "@/icons/link.svg?jsx";
import PlaceIcon from "@/icons/place.svg?jsx";
import EventIcon from "@/icons/event.svg?jsx";
import { registerModal, showModal } from "@/utils/modals";
import type { LinkModalResult } from "@/components/modals/LinkModal";
import type { ImageModalResult } from "@/components/modals/image/ImageModal";
import type { EventModalResult } from "@/components/modals/EventModal";
import type { PlaceModalResult } from "@/components/modals/PlaceModal";
import { uploadMedia } from "@/utils/media";
import { useEditor } from "@/context/editor";
import type { TileType } from "@/types/tiles";

type TileButton = {
  label: string;
  type: TileType;
  Icon: React.ComponentType<React.SVGAttributes<SVGElement>>;
};

const BUTTONS: TileButton[] = [
  { label: "Text", type: "TEXT", Icon: TextIcon },
  { label: "Image", type: "IMAGE", Icon: ImageIcon },
  { label: "Map", type: "MAP", Icon: PlaceIcon },
  { label: "Link", type: "LINK", Icon: LinkIcon },
  { label: "Event", type: "EVENT", Icon: EventIcon },
];

registerModal(
  "IMAGE",
  lazy(() => import("@/components/modals/image/ImageModal")),
);

registerModal(
  "LINK",
  lazy(() => import("@/components/modals/LinkModal")),
);

registerModal(
  "MAP",
  lazy(() => import("@/components/modals/PlaceModal")),
);

registerModal(
  "EVENT",
  lazy(() => import("@/components/modals/EventModal")),
);

interface TileButtonsProps {
  collectionId?: string;
}

export default function TileButtons({ collectionId }: TileButtonsProps) {
  const editor = useEditor();
  const isEditable = useEditable();

  const onClick = useCallback(
    async (event: React.MouseEvent<HTMLButtonElement>) => {
      const tileType = event.currentTarget.dataset.tileType as TileType;
      if (!tileType) {
        return;
      }

      switch (tileType) {
        case "TEXT":
          await editor.createText({
            collectionId: collectionId ?? editor.getCurrentCollectionId(),
            content: [],
            columns: 3,
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
                collectionId: collectionId ?? editor.getCurrentCollectionId(),
                imageKey,
              });
            },
          });
          break;

        case "LINK":
          showModal<LinkModalResult>("LINK", {
            async onConfirm(result) {
              if ("linkedPageId" in result) {
                await editor.createPageLink({
                  collectionId: collectionId ?? editor.getCurrentCollectionId(),
                  linkedPageId: result.linkedPageId,
                });
              } else if (result.url) {
                await editor.createLink({
                  collectionId: collectionId ?? editor.getCurrentCollectionId(),
                  url: result.url,
                });
              }
            },
          });
          break;

        case "EVENT":
          showModal<EventModalResult>("EVENT", {
            async onConfirm(result) {
              await editor.createEvent({
                collectionId: collectionId ?? editor.getCurrentCollectionId(),
                ...result,
              });
            },
          });
          break;

        case "MAP":
          showModal<PlaceModalResult>("MAP", {
            async onConfirm({ place }) {
              await editor.createMap({
                collectionId: collectionId ?? editor.getCurrentCollectionId(),
                place,
                columns: 3,
              });
            },
          });
          break;
      }
    },
    [collectionId, editor],
  );

  if (!isEditable) {
    return null;
  }

  return (
    <>
      {BUTTONS.map(({ label, type, Icon }) => (
        <button
          key={type}
          className="floating"
          type="button"
          aria-label={label}
          data-tooltip={label}
          data-tile-type={type}
          onClick={onClick}
        >
          <Icon aria-hidden="true" />
        </button>
      ))}
    </>
  );
}
