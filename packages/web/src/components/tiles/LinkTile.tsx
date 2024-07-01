import useEditable from "@/hooks/useEditable";
import styles from "./LinkTile.module.css";
import type { ClientLinkTile } from "../../types/tiles";

type LinkTileProps = ClientLinkTile & {
  openEditModal: () => void;
};

export default function LinkTile({
  link: { url, title, description, siteName, imageUrl },
  openEditModal,
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
  return isEditable ? (
    <div className={styles["link-tile"]} onClick={openEditModal}>
      {content}
    </div>
  ) : (
    <a className={styles["link-tile"]} href={url}>
      {content}
    </a>
  );
}
