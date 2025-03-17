import { useCallback } from "react";
import useEditable from "@/hooks/useEditable";
import { showModal } from "@/utils/modals";
import Tile from "./Tile";
import FloatingToolbar from "@/components/toolbars/FloatingToolbar";
import ArrowOutwardIcon from "@/icons/arrow-outward.svg?jsx";
import LinkIcon from "@/icons/link.svg?jsx";
import styles from "./LinkTile.module.css";
import { useEditor } from "@/context/editor";
import type { ClientLink } from "@/types/tiles";
import type { LinkModalResult } from "@/components/modals/LinkModal";

interface LinkTileProps extends ClientLink {
  hasFocus: boolean;
}

function preventDefault(event: React.MouseEvent) {
  event.preventDefault();
}

export default function LinkTile({
  id,
  url,
  title,
  description,
  siteName,
  imageUrl,
  hasFocus,
}: LinkTileProps) {
  const editor = useEditor();
  const isEditable = useEditable();

  const editLink = useCallback(() => {
    showModal<LinkModalResult>("LINK", {
      url,
      showPages: false,
      async onConfirm(result) {
        if (result && "url" in result && result.url) {
          await editor.updateLink({ id, url: result.url });
        }
      },
    });
  }, [editor, id, url]);

  const contents = (
    <div className={styles.caption}>
      <p className={styles.title}>{title || "Untitled page"}</p>
      {description && <p>{description}</p>}
      <p>{siteName || url}</p>
    </div>
  );

  return (
    <Tile backgroundImageUrl={imageUrl}>
      <a
        className={styles.link}
        href={url}
        target="_blank"
        rel="noreferrer ugc"
        onClick={isEditable ? preventDefault : undefined}
      >
        {contents}
        <ArrowOutwardIcon className={styles.icon} aria-hidden="true" />
      </a>

      {hasFocus ? (
        <FloatingToolbar>
          <button
            type="button"
            className="floating small"
            aria-label="Edit link"
            data-tooltip="Edit link"
            onClick={editLink}
          >
            <LinkIcon aria-hidden="true" />
          </button>
        </FloatingToolbar>
      ) : null}
    </Tile>
  );
}
