import { useCallback } from "react";
import useEditable from "@/hooks/useEditable";
import { showModal } from "@/utils/modals";
import Tile from "./Tile";
import ArrowOutwardIcon from "@/icons/arrow-outward.svg?jsx";
import styles from "./LinkTile.module.css";
import { useEditor } from "@/context/editor";
import type { ClientLink } from "@/types/tiles";
import type { LinkModalResult } from "@/components/modals/LinkModal";

type LinkTileProps = ClientLink;

export default function LinkTile({
  id,
  url,
  title,
  description,
  siteName,
  imageUrl,
}: LinkTileProps) {
  const editor = useEditor();
  const isEditable = useEditable();
  const edit = useCallback(() => {
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
      <h3 className={styles.title}>{title || "Unnamed page"}</h3>
      {description && <p>{description}</p>}
      <p>{siteName || url}</p>
    </div>
  );

  return (
    <Tile backgroundImageUrl={imageUrl}>
      {isEditable ? (
        <div className={styles.link} onClick={edit}>
          {contents}
        </div>
      ) : (
        <a
          className={styles.link}
          href={url}
          target="_blank"
          rel="noreferrer ugc"
        >
          {contents}
          <ArrowOutwardIcon className={styles.icon} aria-hidden="true" />
        </a>
      )}
    </Tile>
  );
}
