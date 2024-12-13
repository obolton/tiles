import { useCallback } from "react";
import useEditable from "@/hooks/useEditable";
import { showModal } from "@/utils/modals";
import { updateLink } from "@/utils/edit";
import Tile, { type TileProps } from "./Tile";
import styles from "./LinkTile.module.css";
import type { ClientLink } from "@/types/tiles";
import type { LinkModalResult } from "@/components/modals/LinkModal";

interface LinkTileProps extends TileProps, ClientLink {}

export default function LinkTile({
  id,
  url,
  title,
  description,
  siteName,
  imageUrl,
}: LinkTileProps) {
  const isEditable = useEditable();
  const edit = useCallback(async () => {
    const result = await showModal<LinkModalResult>("LINK", {
      url,
      showPages: false,
    });
    if (result && "url" in result && result.url) {
      await updateLink({ id, url: result.url });
    }
  }, [id, url]);

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
        </a>
      )}
    </Tile>
  );
}
