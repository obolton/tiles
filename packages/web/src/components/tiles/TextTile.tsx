import { useCallback, useState } from "react";
import useEditable from "@/hooks/useEditable";
import { updateTile } from "@/utils/edit";
import Tile from "./Tile";
import styles from "./TextTile.module.css";
import type { ClientTextTile } from "@/types/tiles";

type TextTileProps = {
  tile: ClientTextTile;
};

export default function TextTile({ tile }: TextTileProps) {
  const {
    id,
    text: { content },
  } = tile;
  const isEditable = useEditable();
  const [value, setValue] = useState(content);
  const onChange = useCallback(
    (event: React.ChangeEvent<HTMLTextAreaElement>) =>
      setValue(event.target.value),
    [],
  );

  const onBlur = useCallback(async () => {
    await updateTile({
      id,
      type: "TEXT",
      text: {
        content: value,
      },
    });
  }, [id, value]);

  const onPointerDown = useCallback(
    (event: React.PointerEvent | React.MouseEvent) => {
      event.stopPropagation();
    },
    [],
  );

  return (
    <Tile tile={tile} showInLightbox={false}>
      {isEditable ? (
        <textarea
          className={styles.textarea}
          value={value}
          onPointerDownCapture={onPointerDown}
          onClickCapture={onPointerDown}
          onBlur={onBlur}
          onChange={onChange}
        />
      ) : (
        <div className={styles.text}>{value}</div>
      )}
    </Tile>
  );
}
