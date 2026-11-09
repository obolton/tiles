import ModalHeader from "./ModalHeader";
import ModalBody from "./ModalBody";
import ModalFooter from "./ModalFooter";
import styles from "./LinkModal.module.css";
import LibraryCard from "@/components/library/LibraryCard";
import Search from "@/components/search/Search";
import SearchToolbar from "@/components/search/SearchToolbar";
import client from "@/api/client";
import { handleError } from "@/utils/errors";
import { LinkPreviewError } from "@/models/Link";
import { flag, reactive } from "reactivity";
import type { LibraryPage } from "@/components/library/LibraryCard";
import type { ModalProps } from "@/utils/modals";
import type { LinkedPage } from "doc/tiles/pageLink";

export type LinkModalResult =
  | { linkedPage: LinkedPage }
  | { url: string; preview: boolean }
  | { url: null };

export interface LinkModalProps extends ModalProps<LinkModalResult> {
  workspaceId: string;
  url?: string;
  showPages?: boolean;
  showRemove?: boolean;
}

const PREVIEW_FAILED_MESSAGE =
  "Couldn’t load a preview for this link. Check the URL and try again, or save it without a preview.";

export default function LinkModal({
  cancel,
  confirm,
  workspaceId,
  url: initialUrl = "",
  showPages = true,
  showRemove = false,
}: LinkModalProps) {
  const isPending = flag(false);
  const previewFailed = flag(false);
  const query = reactive("");
  const pages = reactive<LibraryPage[]>([]);
  const nextCursor = reactive<string | null | undefined>(undefined);

  const search = async (query: string, cursor: string | null) => {
    try {
      const { pages: resultPages, nextCursor: resultNextCursor } = await client.pages.list.query({
        workspaceId,
        query: query || undefined,
        cursor: cursor ?? undefined,
      });
      if (!cursor) {
        pages.value = resultPages;
      } else {
        pages.value = [...pages.value, ...resultPages];
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

    const input = form.elements.namedItem("url");
    if (isPending.value || !(input instanceof HTMLInputElement) || !input.value) {
      return;
    }

    isPending.on();
    try {
      // A second save after a failed preview adds the link without one
      await confirm({ url: input.value, preview: !previewFailed.value });
    } catch (error) {
      if (error instanceof LinkPreviewError) {
        previewFailed.on();
        input.focus();
      } else {
        handleError(error);
      }
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
    void selectPage(page);
  }

  return (
    <form on:submit={submit}>
      <ModalHeader>
        <h2>Add a link</h2>
      </ModalHeader>

      <ModalBody className={styles.body}>
        <div className={styles.field}>
          <label>
            Link URL
            <input
              id="link-url"
              type="url"
              name="url"
              className={styles.input}
              placeholder="Enter a link URL"
              autofocus
              required
              value={initialUrl}
              aria-describedby="link-url-message"
              on:input={previewFailed.off.bind(previewFailed)}
            />
          </label>
          <p id="link-url-message" className={styles.message} role="alert">
            {previewFailed.derive((failed) => (failed ? PREVIEW_FAILED_MESSAGE : null))}
          </p>
        </div>

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
              render={(page) => (page.id === pageId ? null : <LibraryCard page={page} />)}
              renderPlaceholder={() => <p>There are no results.</p>}
            />
          </section>
        ) : null}
      </ModalBody>

      <ModalFooter>
        <button type="submit" classList={{ primary: true, pending: isPending }}>
          {previewFailed.derive((failed) => (failed ? "Save without preview" : "Save"))}
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
