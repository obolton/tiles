import { useCallback, useRef, useState } from "react";
import useEditable from "@/hooks/useEditable";
import useDraggable from "@/hooks/useDraggable";
import ResizingTextarea from "@/components/inputs/ResizingTextarea";
import DeleteButton from "./DeleteButton";
import { updateTile, deleteTile } from "@/utils/edit";
import client from "@/api/client";
import styles from "./HeadingTile.module.css";
import type { ClientHeadingTile } from "@/types/tiles";

type HeadingTileProps = {
  tile: ClientHeadingTile;
};

function stripLineBreaks(value: string) {
  return value.replace(/\n/g, "");
}

export default function HeadingTile({ tile }: HeadingTileProps) {
  const {
    id,
    heading: { content },
  } = tile;
  const ref = useRef<HTMLHeadingElement>(null);
  const isEditable = useEditable();
  useDraggable(ref, isEditable);
  const [value, setValue] = useState(content);
  const [isDeleted, setIsDeleted] = useState(false);

  const onChange = useCallback(
    (event: React.ChangeEvent<HTMLTextAreaElement>) =>
      setValue(stripLineBreaks(event.target.value)),
    [],
  );

  const onBlur = useCallback(async () => {
    await updateTile({
      id,
      type: "HEADING",
      heading: {
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

  const onDelete = useCallback(
    async (event: React.MouseEvent) => {
      event.stopPropagation();
      event.preventDefault();
      await client.tiles.delete.mutate({ id: tile.id });
      setIsDeleted(true);
    },
    [tile],
  );

  const onAnimationEnd = useCallback(
    (event: React.AnimationEvent) => {
      if (event.animationName === styles.disappear) {
        deleteTile(tile.id);
      }
    },
    [tile],
  );

  return (
    <header
      ref={ref}
      className={`${styles.heading} editable ${isDeleted ? styles.deleted : ""}`}
      onAnimationEnd={onAnimationEnd}
      data-drop-target={isEditable ? "true" : undefined}
      data-tile-id={tile.id}
      data-tile={JSON.stringify(tile)}
    >
      {isEditable ? (
        <>
          <ResizingTextarea
            rows={1}
            placeholder="Heading"
            onPointerDownCapture={onPointerDown}
            onClickCapture={onPointerDown}
            onBlur={onBlur}
            onChange={onChange}
            value={value}
          />
          <DeleteButton onPress={onDelete} />
        </>
      ) : (
        <h1>{value}</h1>
      )}
    </header>
  );
}
