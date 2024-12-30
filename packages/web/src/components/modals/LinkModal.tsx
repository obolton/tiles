import { useCallback, useState, useTransition } from "react";
import ModalHeader from "./ModalHeader";
import ModalBody from "./ModalBody";
import ModalFooter from "./ModalFooter";
import styles from "./LinkModal.module.css";
import type { ModalProps } from "@/utils/modals";
import useInputState from "@/hooks/useInputState";
import PagesGridItem from "@/components/grid/PagesGridItem";
import PageLinkTile from "@/components/tiles/PageLinkTile";
import { classNames } from "@/utils/css";
import Search from "@/components/search/Search";
import useDebouncedCallback from "@/hooks/useDebouncedCallback";
import client from "@/api/client";
import type { AppRouterOutputs } from "@/api/client";
import { handleError } from "@/utils/errors";

type Pages = AppRouterOutputs["pages"]["list"];
export type LinkModalResult = { linkedPageId: string } | { url: string | null };

interface LinkModalProps extends ModalProps<LinkModalResult> {
  url?: string;
  showPages?: boolean;
  showRemove?: boolean;
}

export default function LinkModal({
  cancel,
  confirm,
  url: initialUrl = "",
  showPages = true,
  showRemove = false,
}: LinkModalProps) {
  const [isPending, startTransition] = useTransition();
  const [url, onChangeUrl] = useInputState(initialUrl);
  const [pages, setPages] = useState<Pages["pages"] | null>(null);
  const [hasMore, setHasMore] = useState(true);

  const search = useDebouncedCallback(
    async (query: string, offset: number = 0) => {
      try {
        const { pages: resultPages, hasMore } = await client.pages.list.query({
          query: query || undefined,
          offset,
        });
        if (offset === 0) {
          setPages(resultPages);
        } else {
          setPages((prevPages) => [...(prevPages ?? []), ...resultPages]);
        }
        setHasMore(hasMore);
      } catch (error) {
        handleError(error);
      }
    },
    300,
    [],
  );

  const selectPage = useCallback(
    (linkedPageId: string) => {
      if (isPending) {
        return;
      }
      startTransition(async () => confirm({ linkedPageId }));
    },
    [isPending, confirm],
  );

  const submit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      if (isPending || !url) {
        return;
      }

      startTransition(async () => confirm({ url }));
    },
    [isPending, url, confirm],
  );

  const remove = useCallback(() => {
    if (isPending) {
      return;
    }

    startTransition(async () => confirm({ url: null }));
  }, [isPending, confirm]);

  const pageId = document.body.dataset.pageId;

  return (
    <form onSubmit={submit}>
      <ModalHeader>Add a link</ModalHeader>

      <ModalBody>
        <label>
          Link URL
          <input
            className={styles.input}
            type="url"
            name="content"
            placeholder="Enter a link URL"
            autoFocus
            onChange={onChangeUrl}
            value={url}
          />
        </label>

        {showPages ? (
          <>
            <label>Recent pages</label>

            <Search
              itemsClassName={styles.pages}
              search={search}
              results={pages}
              hasMore={hasMore}
              placeholder="Search pages"
              render={(page) =>
                page.id === pageId ? null : (
                  <PagesGridItem key={page.id}>
                    <PageLinkTile
                      id={page.id}
                      linkedPage={page}
                      openInNewTab={false}
                      onClick={(event) => {
                        if (
                          event.ctrlKey ||
                          event.shiftKey ||
                          event.altKey ||
                          event.metaKey
                        ) {
                          return;
                        }
                        event.preventDefault();
                        selectPage(page.id);
                      }}
                    />
                  </PagesGridItem>
                )
              }
              renderPlaceholder={() => <p>There are no results.</p>}
            />
          </>
        ) : null}
      </ModalBody>

      <ModalFooter>
        <button
          className={classNames("primary", isPending && "pending")}
          type="submit"
          aria-disabled={!url}
        >
          Save
        </button>
        {showRemove ? (
          <button className="secondary" type="button" onClick={remove}>
            Remove link
          </button>
        ) : null}
        <button className="secondary" type="button" onClick={cancel}>
          Cancel
        </button>
      </ModalFooter>
    </form>
  );
}
