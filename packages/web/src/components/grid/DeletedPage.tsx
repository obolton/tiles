import { useCallback, useTransition } from "react";
import PagesGridItem from "./PagesGridItem";
import PageTile from "@/components/tiles/PageTile";
import client from "@/api/client";
import { redirectWithToast } from "@/utils/toasts";
import { classNames } from "@/utils/css";
import styles from "./DeletedPage.module.css";
import type { PageTileProps } from "@/components/tiles/PageTile";

interface DeletedPageProps extends Omit<PageTileProps, "actions"> {
  id: string;
}

export default function DeletedPage({ id, ...props }: DeletedPageProps) {
  const [isPending, startTransition] = useTransition();

  const restorePage = useCallback(() => {
    startTransition(async () => {
      await client.pages.restore.mutate({ pageId: id });
      redirectWithToast(
        `/pages/${id}`,
        "The page was moved out of the trash.",
        "success",
      );
    });
  }, [id]);

  return (
    <PagesGridItem>
      <PageTile {...props}>
        <button
          type="button"
          className={classNames(
            "secondary",
            isPending && "pending",
            styles.restore,
          )}
          onClick={restorePage}
        >
          Restore
        </button>
      </PageTile>
    </PagesGridItem>
  );
}
