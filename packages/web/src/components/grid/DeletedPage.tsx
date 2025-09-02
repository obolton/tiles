import PagesGridItem from "./PagesGridItem";
import PageTile from "@/components/tiles/PageTile";
import client from "@/api/client";
import { redirectWithToast } from "@/utils/toasts";
import { handleError } from "@/utils/errors";
import { classNames } from "@/utils/css";
import styles from "./DeletedPage.module.css";
import type { PageTileProps } from "@/components/tiles/PageTile";

export interface DeletedPageProps extends Omit<PageTileProps, "actions"> {
  id: string;
  workspaceId: string;
}

export default function DeletedPage({
  id,
  workspaceId,
  ...props
}: DeletedPageProps) {
  async function restorePage(event: Event) {
    const button = event.currentTarget as HTMLButtonElement;
    button.classList.add("pending");
    try {
      await client.pages.restore.mutate({ workspaceId, pageId: id });
      redirectWithToast(
        `/pages/${id}`,
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
      <PageTile {...props}>
        <button
          type="button"
          className={classNames("secondary", "small", styles.restore)}
          on:click={restorePage}
        >
          Restore
        </button>
      </PageTile>
    </PagesGridItem>
  );
}
