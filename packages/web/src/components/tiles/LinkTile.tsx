import { showModal } from "@/utils/modals";
import Tile from "./Tile";
import FloatingToolbar from "@/components/toolbars/FloatingToolbar";
import ArrowOutwardIcon from "@/icons/arrow-outward.svg?jsx";
import LinkIcon from "@/icons/link.svg?jsx";
import styles from "./LinkTile.module.css";
import type { StoreInterface } from "@/utils/stores";
import type { ClientLink } from "@/types/tiles";
import type { LinkModalResult } from "@/components/modals/LinkModal";
import type Editor from "@/editor/Editor";

interface LinkTileProps extends ClientLink {
  editor: Editor;
  hasFocus: StoreInterface<boolean>;
}

export default function LinkTile({
  editor,
  id,
  url,
  title,
  description,
  siteName,
  imageUrl,
  hasFocus,
}: LinkTileProps) {
  const { isEditable } = editor;

  const editLink = () => {
    showModal<LinkModalResult>("LINK", {
      url,
      showPages: false,
      async onConfirm(result) {
        if (result && "url" in result && result.url) {
          await editor.updateLink({ id, url: result.url });
        }
      },
    });
  };

  const contents = (
    <div className={styles.caption}>
      <p className={styles.title}>{title || "Untitled page"}</p>
      {description && <p>{description}</p>}
      <p>{siteName || url}</p>
    </div>
  );

  const onClick = (event: Event) => {
    if (isEditable.value) {
      event.preventDefault();
    }
  };

  return (
    <Tile backgroundImageUrl={imageUrl}>
      <a
        className={styles.link}
        href={url}
        target="_blank"
        rel="noreferrer ugc"
        onclick={onClick}
      >
        {contents}
        <ArrowOutwardIcon className={styles.icon} aria-hidden="true" />
      </a>

      {hasFocus.derive((value) =>
        value ? (
          <FloatingToolbar>
            <button
              role="menuitem"
              type="button"
              className="floating small"
              aria-label="Edit link"
              data-tooltip="Edit link"
              onclick={editLink}
            >
              <LinkIcon aria-hidden="true" />
            </button>
          </FloatingToolbar>
        ) : null,
      )}
    </Tile>
  );
}
