import ModalHeader from "./ModalHeader";
import ModalBody from "./ModalBody";
import ModalFooter from "./ModalFooter";
import styles from "./LinkModal.module.css";
import PagesGridItem from "@/components/grid/PagesGridItem";
import PageLinkTile from "@/components/tiles/PageLinkTile";
import Search from "@/components/search/Search";
import client from "@/api/client";
import { handleError } from "@/utils/errors";
import { flag, value } from "@/utils/reactivity";
import type { AppRouterOutputs } from "@/api/client";
import type { ModalProps } from "@/utils/modals";

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
  const isPending = flag(false);
  const pages = value<Pages["pages"]>([]);
  const hasMore = flag(true);

  const search = async (query: string, offset: number = 0) => {
    try {
      const { pages: resultPages, hasMore: resultHasMore } =
        await client.pages.list.query({
          query: query || undefined,
          offset,
        });
      if (offset === 0) {
        pages.value = resultPages;
      } else {
        pages.value = [...(pages.value ?? []), ...resultPages];
      }
      hasMore.value = resultHasMore;
    } catch (error) {
      handleError(error);
    }
  };

  const selectPage = async (linkedPageId: string) => {
    if (isPending.value) {
      return;
    }
    isPending.on();
    try {
      await confirm({ linkedPageId });
    } catch (error) {
      handleError(error);
    } finally {
      isPending.off();
    }
  };

  const submit = async (event: Event) => {
    const form = event.currentTarget as HTMLFormElement;
    event.preventDefault();

    const formData = new FormData(form);
    const url = formData.get("url") as string;

    if (isPending.value || !url) {
      return;
    }

    isPending.on();
    try {
      await confirm({ url });
    } catch (error) {
      handleError(error);
    } finally {
      isPending.off();
    }
  };

  const remove = async () => {
    if (isPending.value) {
      return;
    }

    isPending.on();

    try {
      await confirm({ url: null });
    } catch (error) {
      handleError(error);
    } finally {
      isPending.off();
    }
  };

  const pageId = document.body.dataset.pageId;

  return (
    <form onSubmit={submit}>
      <ModalHeader>
        <h2>Add a link</h2>
      </ModalHeader>

      <ModalBody className={styles.body}>
        <label>
          Link URL
          <input
            className={styles.input}
            type="url"
            name="url"
            placeholder="Enter a link URL"
            autofocus
            required
            value={initialUrl}
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
                  <PagesGridItem>
                    <PageLinkTile
                      id={page.id}
                      linkedPage={value(page)}
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
        <button classList={{ primary: true, pending: isPending }} type="submit">
          Save
        </button>
        {showRemove ? (
          <button className="secondary" type="button" onclick={remove}>
            Remove link
          </button>
        ) : null}
        <button className="secondary" type="button" onclick={cancel}>
          Cancel
        </button>
      </ModalFooter>
    </form>
  );
}
