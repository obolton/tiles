import { useCallback } from "react";
import ModalHeader from "./ModalHeader";
import ModalBody from "./ModalBody";
import ModalFooter from "./ModalFooter";
import styles from "./LinkModal.module.css";
import type { ModalProps } from "@/utils/modals";
import useInputState from "@/hooks/useInputState";
import PagesGrid from "@/components/grid/PagesGrid";
import PageLinkTile from "@/components/tiles/PageLinkTile";

export type LinkModalResult = { linkedPageId: string } | { url: string | null };

interface LinkModalProps extends ModalProps<LinkModalResult> {
  url?: string;
  showPages?: boolean;
  showRemove?: boolean;
}

export default function LinkModal({
  close,
  url: initialUrl = "",
  showPages = true,
  showRemove = false,
}: LinkModalProps) {
  const [url, onChangeUrl] = useInputState(initialUrl);

  const selectPage = useCallback(
    (linkedPageId: string) => close({ linkedPageId }),
    [close],
  );

  const submit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      if (!url) {
        return;
      }

      close({ url });
    },
    [url, close],
  );

  const remove = useCallback(() => close({ url: null }), [close]);

  const cancel = useCallback(() => close(), [close]);

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

            <div className={styles.pages}>
              <PagesGrid
                render={(page) =>
                  page.id === pageId ? null : (
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
                  )
                }
              />
            </div>
          </>
        ) : null}
      </ModalBody>

      <ModalFooter>
        <button className="primary" type="submit" aria-disabled={!url}>
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
