import { useCallback, lazy } from "react";
import useEditable from "@/hooks/useEditable";
import textIcon from "@/icons/text.svg";
import imageIcon from "@/icons/image.svg";
import linkIcon from "@/icons/link.svg";
import placeIcon from "@/icons/place.svg";
import eventIcon from "@/icons/event.svg";
import sectionIcon from "@/icons/section.svg";
import { registerModal, showModal } from "@/utils/modals";
import type { LinkModalResult } from "@/components/modals/LinkModal";
import type { ImageModalResult } from "@/components/modals/image/ImageModal";
import type { EventModalResult } from "@/components/modals/EventModal";
import type { PlaceModalResult } from "@/components/modals/PlaceModal";
import { uploadMedia } from "@/utils/media";
import { useEditor } from "@/context/editor";

type ItemType = "TEXT" | "IMAGE" | "MAP" | "LINK" | "EVENT" | "SECTION";

type TileButton = {
  label: string;
  type: ItemType;
  icon: string;
};

const BUTTONS: TileButton[] = [
  { label: "Text", type: "TEXT", icon: textIcon.src },
  { label: "Image", type: "IMAGE", icon: imageIcon.src },
  { label: "Map", type: "MAP", icon: placeIcon.src },
  { label: "Link", type: "LINK", icon: linkIcon.src },
  { label: "Event", type: "EVENT", icon: eventIcon.src },
  { label: "Section", type: "SECTION", icon: sectionIcon.src },
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
  exclude?: ItemType[];
}

export default function TileButtons({
  collectionId,
  exclude,
}: TileButtonsProps) {
  const editor = useEditor();
  const isEditable = useEditable();

  const onClick = useCallback(
    async (event: React.MouseEvent<HTMLButtonElement>) => {
      const tileType = event.currentTarget.dataset.tileType as ItemType;
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

        case "SECTION":
          await editor.createSection();
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
      {BUTTONS.filter(({ type }) => !exclude?.includes(type)).map(
        ({ label, type, icon }) => (
          <button
            key={type}
            className="floating"
            type="button"
            aria-label={label}
            data-tooltip={label}
            data-tile-type={type}
            onClick={onClick}
          >
            <img src={icon} alt={label} />
          </button>
        ),
      )}
    </>
  );
}
