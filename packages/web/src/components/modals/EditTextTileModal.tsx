import { useCallback, useState } from "react";
import ModalHeader from "./ModalHeader";
import ModalFooter from "./ModalFooter";
import { createTile, updateTile } from "@/utils/edit";
import type { ClientTextTile } from "@/types/tiles";
import styles from "./EditTextTileModal.module.css";

interface Props {
  pageId: string;
  close: () => void;
  tile?: ClientTextTile | null;
}

export default function EditTextTileModal({ pageId, close, tile }: Props) {
  const [content, setContent] = useState<string>(tile?.text.content ?? "");

  const change = useCallback(
    (event: React.ChangeEvent<HTMLTextAreaElement>) =>
      setContent(event.target.value),
    [],
  );

  const submit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      if (!content) {
        return;
      }

      if (tile) {
        await updateTile({
          pageId,
          id: tile.id,
          type: "TEXT",
          text: {
            content,
          },
        });
      } else {
        await createTile({
          pageId,
          type: "TEXT",
          text: {
            content,
          },
        });
      }

      close();
    },
    [close, content, pageId, tile],
  );

  return (
    <form onSubmit={submit}>
      <ModalHeader>Text</ModalHeader>

      <textarea
        className={styles.textarea}
        name="content"
        placeholder="Write something"
        autoFocus
        onChange={change}
        value={content}
      />

      <ModalFooter>
        <button className="primary" type="submit" aria-disabled={!content}>
          Save
        </button>
        <button className="secondary" type="button" onClick={close}>
          Cancel
        </button>
      </ModalFooter>
    </form>
  );
}
