import { useCallback } from "react";
import useEditable from "../../hooks/useEditable";
import textIcon from "../../icons/text.svg";
import imageIcon from "../../icons/image.svg";
import linkIcon from "../../icons/link.svg";
import placeIcon from "../../icons/place.svg";
import { openCreateTileModal } from "../../utils/edit";
import styles from "./CreateTileToolbar.module.css";
import type { TileType } from "../../types/tiles";

type TileButton = {
  label: string;
  type: TileType;
  icon: string;
};

const BUTTONS: TileButton[] = [
  { label: "Image", type: "IMAGE", icon: imageIcon.src },
  { label: "Text", type: "TEXT", icon: textIcon.src },
  { label: "Place", type: "PLACE", icon: placeIcon.src },
  { label: "Link", type: "LINK", icon: linkIcon.src },
];

interface CreateTileToolbarProps {
  pageId: string;
}

export default function CreateTileToolbar({ pageId }: CreateTileToolbarProps) {
  const isEditable = useEditable();

  const onClick = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
    const tileType = event.currentTarget.dataset.tileType as
      | TileType
      | undefined;
    if (tileType) {
      openCreateTileModal(tileType);
    }
  }, []);

  if (!isEditable) {
    return null;
  }

  return (
    <div
      className={styles.toolbar}
      role="toolbar"
      aria-label="Create a new tile"
      aria-orientation="vertical"
    >
      {BUTTONS.map(({ label, type, icon }) => (
        <button
          key={type}
          className="floating"
          type="button"
          aria-label={label}
          data-tile-type={type}
          onClick={onClick}
        >
          <span>{label}</span>
          <img src={icon} alt={label} />
        </button>
      ))}
    </div>
  );
}
