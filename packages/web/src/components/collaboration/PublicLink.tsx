import CopyButton from "@/components/buttons/CopyButton";
import OpenIcon from "@/icons/arrow-outward.svg?jsx";
import If from "jsx/if";
import { getPublicPageUrl } from "@/utils/pages";
import { handleError } from "@/utils/errors";
import styles from "./SharePanel.module.css";
import type Page from "@/models/Page";

export interface PublicLinkProps {
  page: Page;
}

function selectUrl(event: Event) {
  if (event.currentTarget instanceof HTMLInputElement) {
    event.currentTarget.select();
  }
}

export default function PublicLink({ page }: PublicLinkProps) {
  const url = getPublicPageUrl(page.id);

  function setPublished(event: Event) {
    if (event.currentTarget instanceof HTMLInputElement) {
      page.setPublished(event.currentTarget.checked).catch(handleError);
    }
  }

  return (
    <section className={styles.section} aria-labelledby="share-public-link">
      <h3 id="share-public-link" className={styles.heading}>
        Public link
      </h3>

      <label>
        Anyone with the link can view
        <input type="checkbox" role="switch" on:change={setPublished} checked={page.isPublished} />
      </label>

      <If condition={page.isPublished}>
        <div className={styles.link}>
          <input type="url" value={url} readonly aria-label="Public link" on:focus={selectUrl} />
          <CopyButton
            classList={{ small: true }}
            text={url}
            label="Copy link"
            message="Link copied"
          />
          <a
            className="floating small"
            href={url}
            target="_blank"
            rel="noopener"
            aria-label="Open in new tab"
          >
            <OpenIcon aria-hidden="true" />
          </a>
        </div>
      </If>
    </section>
  );
}
