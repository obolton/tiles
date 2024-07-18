import { useCallback, useState } from "react";
import { serialize } from "@/utils/richText/serialize";
import RichTextEditor from "@/components/inputs/RichTextEditor/RichTextEditor";
import RichText from "@/components/text/RichText";
import useEditable from "@/hooks/useEditable";
import { updateTile } from "@/utils/edit";
import Tile from "./Tile";
import styles from "./TextTile.module.css";
import type { ClientTextTile } from "@/types/tiles";
import type { EditorState } from "@/components/inputs/RichTextEditor/RichTextEditor";

type TextTileProps = {
  tile: ClientTextTile;
};

export default function TextTile({ tile }: TextTileProps) {
  const {
    id,
    text: { content },
  } = tile;
  const isEditable = useEditable();
  const [editorState, setEditorState] = useState<EditorState | null>(null);

  const onBlur = useCallback(async () => {
    if (!editorState) {
      return;
    }
    const content = serialize(editorState);
    await updateTile({
      id,
      type: "TEXT",
      text: {
        content,
      },
    });
  }, [id, editorState]);

  const onPointerDown = useCallback(
    (event: React.PointerEvent | React.MouseEvent) => {
      event.stopPropagation();
    },
    [],
  );

  return (
    <Tile tile={tile} showBorder={tile.columns < 3} showInLightbox={false}>
      {isEditable ? (
        <RichTextEditor
          className={`${styles.text} ${styles.editor}`}
          onBlur={onBlur}
          onChange={setEditorState}
          onPointerDownCapture={onPointerDown}
          onClickCapture={onPointerDown}
          placeholder="Enter some text"
          value={content}
          editable
        />
      ) : (
        <div className={styles.text}>
          <RichText content={content} />
        </div>
      )}
    </Tile>
  );
}
