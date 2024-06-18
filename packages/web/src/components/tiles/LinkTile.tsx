import useEditable from "../../hooks/useEditable";
import styles from "./LinkTile.module.css";
import type { ClientLinkTile } from "../../types/tiles";

type LinkTileProps = ClientLinkTile["link"];

export default function LinkTile({
  url,
  title,
  description,
  siteName,
  imageUrl,
}: LinkTileProps) {
  const isEditable = useEditable();
  const content = (
    <>
      {imageUrl && <img className={styles.image} src={imageUrl} alt="TODO" />}
      <div className={styles.metadata}>
        <h3 className={styles.title}>{title || "Unnamed page"}</h3>
        {description && <p className={styles.meta}>{description}</p>}
        <p className={styles.meta}>{siteName || url}</p>
      </div>
    </>
  );
  return (
    <div className={styles.linkTile}>
      {isEditable ? (
        content
      ) : (
        <a className={styles.link} href={url}>
          {content}
        </a>
      )}
    </div>
  );
}
