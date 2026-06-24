import ModalHeader from "./ModalHeader";
import ModalBody from "./ModalBody";
import ModalFooter from "./ModalFooter";
import styles from "./LinkModal.module.css";
import LibraryCard from "@/components/library/LibraryCard";
import Search from "@/components/search/Search";
import SearchToolbar from "@/components/search/SearchToolbar";
import client from "@/api/client";
import { handleError } from "@/utils/errors";
import { flag, reactive } from "@/utils/reactivity";
import type { LibraryPage } from "@/components/library/LibraryCard";
import type { ModalProps } from "@/utils/modals";
import type { PageLinkTile } from "doc/types/tiles";

type LinkedPage = NonNullable<PageLinkTile["linkedPage"]>;

export type LinkModalResult =
  | { linkedPage: LinkedPage }
  | { url: string | null };

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
  const query = reactive("");
  const pages = reactive<LibraryPage[]>([]);
  const nextCursor = reactive<string | null | undefined>(undefined);

  const search = async (query: string, cursor: string | null) => {
    try {
      const { pages: resultPages, nextCursor: resultNextCursor } =
        await client.pages.list.query({
          workspaceId,
          query: query || undefined,
          cursor: cursor ?? undefined,
        });
      if (!cursor) {
        pages.value = resultPages;
      } else {
        pages.value = [...(pages.value ?? []), ...resultPages];
      }
      nextCursor.value = resultNextCursor;
    } catch (error) {
      handleError(error);
    }
  };

  const selectPage = async (page: LibraryPage) => {
    if (isPending.value) {
      return;
    }
    isPending.on();
    try {
      await confirm({ linkedPage: { ...page } });
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

  function onPageClick(event: MouseEvent) {
    if (event.ctrlKey || event.shiftKey || event.altKey || event.metaKey) {
      return;
    }
    const link = (event.target as Element).closest("a");
    if (!link) {
      return;
    }
    const card = link.closest<HTMLElement>("[data-id]");
    if (!card?.dataset.id) {
      return;
    }
    const page = pages.value.find((p) => p.id === card.dataset.id);
    if (!page) {
      return;
    }
    event.preventDefault();
    selectPage(page);
  }

  return (
    <form on:submit={submit}>
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
          <section on:click={onPageClick}>
            <h3>Recent pages</h3>

            <SearchToolbar
              id="search-pages"
              classList={{ [styles.toolbar]: true }}
              placeholder="Search pages"
              autofocus={false}
              query={query}
            />

            <Search
              itemsClassName={styles.pages}
              search={search}
              results={pages}
              nextCursor={nextCursor}
              query={query}
              render={(page) =>
                page.id === pageId ? null : <LibraryCard page={page} />
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
