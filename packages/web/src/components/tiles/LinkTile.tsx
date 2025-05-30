import { showModal } from "@/utils/modals";
import Tile from "./Tile";
import ArrowOutwardIcon from "@/icons/arrow-outward.svg?jsx";
import LinkIcon from "@/icons/link.svg?jsx";
import styles from "./LinkTile.module.css";
import type { Reactive } from "@/utils/reactivity";
import type { LinkModalResult } from "@/components/modals/LinkModal";
import type Editor from "@/editor/Editor";
import type { LinkProperties } from "@/types/tiles";

interface LinkTileProps extends LinkProperties {
  editor: Editor;
  hasFocus: Reactive<boolean>;
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
          const link = await editor.updateLink({ id, url: result.url });
          url.value = link.url;
          title.value = link.title;
          description.value = link.description;
          siteName.value = link.siteName;
          imageUrl.value = link.imageUrl;
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
          <floating-toolbar
            data-tooltip-position="top"
            aria-label="Link toolbar"
          >
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
          </floating-toolbar>
        ) : null,
      )}
    </Tile>
  );
}
