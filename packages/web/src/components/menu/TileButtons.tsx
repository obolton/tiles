import { useCallback, lazy } from "react";
import useEditable from "@/hooks/useEditable";
import textIcon from "@/icons/text.svg";
import imageIcon from "@/icons/image.svg";
import linkIcon from "@/icons/link.svg";
import placeIcon from "@/icons/place.svg";
import headingIcon from "@/icons/heading.svg";
import eventIcon from "@/icons/event.svg";
import { createText, createHeading } from "@/utils/edit";
import { registerModal, showModal } from "@/utils/modals";
import type { TileType } from "@/types/tiles";
import { classNames } from "@/utils/css";

type TileButton = {
  label: string;
  type: TileType;
  icon: string;
};

const BUTTONS: TileButton[] = [
  { label: "Heading", type: "HEADING", icon: headingIcon.src },
  { label: "Image", type: "IMAGE", icon: imageIcon.src },
  { label: "Text", type: "TEXT", icon: textIcon.src },
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
  lazy(() => import("@/components/modals/EditPlaceTileModal")),
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
      if (tileType === "HEADING") {
        await createHeading({
          content: "",
        });
      } else if (tileType === "TEXT") {
        await createText({
          content: [],
        });
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
