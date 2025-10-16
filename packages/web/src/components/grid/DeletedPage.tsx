import PagesGridItem from "./PagesGridItem";
import PageLink from "@/components/tiles/PageLink";
import client from "@/api/client";
import { redirectWithToast } from "@/utils/toasts";
import { handleError } from "@/utils/errors";
import { classNames } from "@/utils/css";
import styles from "./DeletedPage.module.css";
import type { PageLinkProps } from "@/components/tiles/PageLink";

export interface DeletedPageProps extends PageLinkProps {
  workspaceId: string;
}

export default function DeletedPage({
  pageId,
  workspaceId,
  ...props
}: DeletedPageProps) {
  async function restorePage(event: Event) {
    const button = event.currentTarget as HTMLButtonElement;
    button.classList.add("pending");
    try {
      await client.pages.restore.mutate({ workspaceId, pageId });
      redirectWithToast(
        `/pages/${pageId}`,
        "The page was moved out of the trash.",
        "success",
      );
    } catch (error) {
      handleError(error);
    } finally {
      button.classList.remove("pending");
    }
  }

  return (
    <PagesGridItem>
      <PageLink pageId={pageId} {...props}>
        <button
          type="button"
          className={classNames("secondary", "small", styles.restore)}
          on:click={restorePage}
        >
          Restore
        </button>
      </PageLink>
    </PagesGridItem>
  );
}
