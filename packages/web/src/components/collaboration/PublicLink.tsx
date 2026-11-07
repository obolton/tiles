import ToolbarButton from "@/components/buttons/ToolbarButton";
import CopyIcon from "@/icons/duplicate.svg?jsx";
import CheckIcon from "@/icons/check.svg?jsx";
import OpenIcon from "@/icons/arrow-outward.svg?jsx";
import If from "jsx/if";
import { flag } from "reactivity";
import { getPublicPageUrl } from "@/utils/pages";
import { handleError } from "@/utils/errors";
import { showToast } from "@/utils/toasts";
import styles from "./SharePanel.module.css";
import sidebarStyles from "@/components/pages/Sidebar.module.css";
import type Page from "@/models/Page";

const COPIED_DURATION = 2000;

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
  const copied = flag(false);
  let copiedTimeout: ReturnType<typeof setTimeout> | undefined;

  function setPublished(event: Event) {
    if (event.currentTarget instanceof HTMLInputElement) {
      page.setPublished(event.currentTarget.checked).catch(handleError);
    }
  }

  function copyUrl() {
    navigator.clipboard
      .writeText(url)
      .then(() => {
        showToast("Link copied", "success");
        copied.on();
        clearTimeout(copiedTimeout);
        copiedTimeout = setTimeout(() => copied.off(), COPIED_DURATION);
      })
      .catch(handleError);
  }

  return (
    <section className={styles.section} aria-labelledby="share-public-link">
      <h3 id="share-public-link" className={sidebarStyles.heading}>
        Public link
      </h3>

      <label>
        Anyone with the link can view
        <input type="checkbox" role="switch" on:change={setPublished} checked={page.isPublished} />
      </label>

      <If condition={page.isPublished}>
        <div className={styles.link}>
          <input type="url" value={url} readonly aria-label="Public link" on:focus={selectUrl} />
          <ToolbarButton
            classList={{ small: true }}
            label={copied.derive((value) => (value ? "Copied" : "Copy link"))}
            on:click={copyUrl}
          >
            {copied.derive((value) =>
              value ? <CheckIcon aria-hidden="true" /> : <CopyIcon aria-hidden="true" />,
            )}
          </ToolbarButton>
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
