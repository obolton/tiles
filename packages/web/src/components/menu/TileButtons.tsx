import { useCallback, lazy } from "react";
import useEditable from "@/hooks/useEditable";
import textIcon from "@/icons/text.svg";
import imageIcon from "@/icons/image.svg";
import linkIcon from "@/icons/link.svg";
import placeIcon from "@/icons/place.svg";
import eventIcon from "@/icons/event.svg";
import {
  createText,
  createLink,
  createPageLink,
  createImage,
} from "@/utils/edit";
import { registerModal, showModal } from "@/utils/modals";
import type { TileType } from "@/types/tiles";
import type { LinkModalResult } from "@/components/modals/LinkModal";
import type { ImageModalResult } from "@/components/modals/ImageModal";
import { classNames } from "@/utils/css";

type TileButton = {
  label: string;
  type: TileType;
  icon: string;
};

const BUTTONS: TileButton[] = [
  { label: "Text", type: "TEXT", icon: textIcon.src },
  { label: "Image", type: "IMAGE", icon: imageIcon.src },
  { label: "Map", type: "MAP", icon: placeIcon.src },
  { label: "Link", type: "LINK", icon: linkIcon.src },
  { label: "Event", type: "EVENT", icon: eventIcon.src },
];

registerModal(
  "IMAGE",
  lazy(() => import("@/components/modals/ImageModal")),
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
  lazy(() => import("@/components/modals/EditEventTileModal")),
);

interface TileButtonsProps {
  tooltipPosition?: "top" | "right" | "bottom" | "left";
}

export default function TileButtons({
  tooltipPosition = "left",
}: TileButtonsProps) {
  const isEditable = useEditable();

  const onClick = useCallback(
    async (event: React.MouseEvent<HTMLButtonElement>) => {
      const tileType = event.currentTarget.dataset.tileType as
        | TileType
        | undefined;
      if (!tileType) {
        return;
      }
      if (tileType === "TEXT") {
        await createText({
          content: [],
          columns: 3,
        });
      } else if (tileType === "IMAGE") {
        const image = await showModal<ImageModalResult>("IMAGE");
        if (!image) {
          return;
        }
        await createImage(image);
      } else if (tileType === "LINK") {
        const link = await showModal<LinkModalResult>("LINK");
        if (!link) {
          return;
        }
        if ("linkedPageId" in link) {
          await createPageLink(link);
        } else if (link.url) {
          await createLink({ url: link.url });
        }
      } else {
        showModal(tileType);
      }
    },
    [],
  );

  if (!isEditable) {
    return null;
  }

  return (
    <>
      {BUTTONS.map(({ label, type, icon }) => (
        <button
          key={type}
          className={classNames("floating", `tooltip-${tooltipPosition}`)}
          type="button"
          aria-label={label}
          data-tile-type={type}
          onClick={onClick}
        >
          <img src={icon} alt={label} />
        </button>
      ))}
    </>
  );
}
