import ModalHeader from "./ModalHeader";
import ModalBody from "./ModalBody";
import ModalFooter from "./ModalFooter";
import styles from "./LinkModal.module.css";
import PagesGridItem from "@/components/grid/PagesGridItem";
import PageLinkTile from "@/components/tiles/PageLinkTile";
import Search from "@/components/search/Search";
import client from "@/api/client";
import { handleError } from "@/utils/errors";
import { flag, reactive } from "@/utils/reactivity";
import PageLink from "@/items/PageLink";
import Editor from "@/editor/Editor";
import type { AppRouterOutputs } from "@/api/client";
import type { ModalProps } from "@/utils/modals";

type Pages = AppRouterOutputs["pages"]["list"];
export type LinkModalResult = { linkedPageId: string } | { url: string | null };

export interface LinkModalProps extends ModalProps<LinkModalResult> {
  workspaceId: string;
  url?: string;
  showPages?: boolean;
  showRemove?: boolean;
}

export default function LinkModal({
  cancel,
  confirm,
  workspaceId,
  url: initialUrl = "",
  showPages = true,
  showRemove = false,
}: LinkModalProps) {
  const isPending = flag(false);
  const pages = reactive<Pages["pages"]>([]);
  const hasMore = flag(true);

  const search = async (query: string, offset: number = 0) => {
    try {
      const { pages: resultPages, hasMore: resultHasMore } =
        await client.pages.list.query({
          workspaceId,
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
            type="url"
            name="url"
            className={styles.input}
            placeholder="Enter a link URL"
            autofocus
            required
            value={initialUrl}
          />
        </label>

        {showPages ? (
          <section>
            <h3>Recent pages</h3>

            <Search
              itemsClassName={styles.pages}
              id="search-pages"
              search={search}
              results={pages}
              hasMore={hasMore}
              placeholder="Search pages"
              render={(page) =>
                page.id === pageId ? null : (
                  <PagesGridItem>
                    <PageLinkTile
                      pageLink={
                        new PageLink(Editor.current, { linkedPage: page })
                      }
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
          </section>
        ) : null}
      </ModalBody>

      <ModalFooter>
        <button type="submit" classList={{ primary: true, pending: isPending }}>
          Save
        </button>
        {showRemove ? (
          <button type="button" className="secondary" on:click={remove}>
            Remove link
          </button>
        ) : null}
        <button type="button" className="secondary" on:click={cancel}>
          Cancel
        </button>
      </ModalFooter>
    </form>
  );
}
