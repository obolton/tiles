import { showModal } from "@/utils/modals";
import Tile from "./Tile";
import ToolbarButton from "@/components/buttons/ToolbarButton";
import ArrowOutwardIcon from "@/icons/arrow-outward.svg?jsx";
import LinkIcon from "@/icons/link.svg?jsx";
import If from "@/jsx/if";
import Portal from "@/jsx/portal";
import styles from "./LinkTile.module.css";
import type Link from "@/models/Link";
import type { Reactive } from "@/utils/reactivity";

const LinkModalLoader = () => import("@/components/modals/LinkModal");

export interface LinkTileProps {
  link: Link;
  hasFocus: Reactive<boolean>;
}

export default function LinkTile({ link, hasFocus }: LinkTileProps) {
  const { url, title, description, siteName, imageUrl, editor } = link;
  const { isEditable } = editor;
  const background = imageUrl.derive((url) => (url ? { imageUrl: url } : null));

  const editLink = () => {
    showModal(LinkModalLoader, {
      props: {
        workspaceId: editor.workspaceId,
        url: url.value,
        showPages: false,
      },
      async onConfirm(result) {
        if (result && "url" in result && result.url) {
          await link.setUrl(result.url);
        }
      },
    });
  };

  const contents = (
    <div className={styles.caption}>
      <p className={styles.title}>{title}</p>
      <If condition={description}>
        <p>{description}</p>
      </If>
      <If condition={siteName}>
        <p>{siteName}</p>
      </If>
    </div>
  );

  function onClick(event: Event) {
    if (isEditable.value) {
      event.preventDefault();
    }
  }

  return (
    <Tile background={background}>
      <a
        className={styles.link}
        href={url}
        target="_blank"
        rel="noreferrer ugc"
        on:click={onClick}
      >
        {contents}
        <ArrowOutwardIcon className={styles.icon} aria-hidden="true" />
      </a>

      <If condition={hasFocus}>
        <Portal>
          <floating-toolbar
            data-tooltip-position="top"
            aria-label="Link toolbar"
          >
            <ToolbarButton label="Edit link" on:click={editLink}>
              <LinkIcon aria-hidden="true" />
            </ToolbarButton>
          </floating-toolbar>
        </Portal>
      </If>
    </Tile>
  );
}
