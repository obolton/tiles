import { useCallback, useRef, useState } from "react";
import useEditable from "@/hooks/useEditable";
import useDraggable from "@/hooks/useDraggable";
import useScrollIntoView from "@/hooks/useScrollIntoView";
import ResizingTextarea from "@/components/inputs/ResizingTextarea";
import DeleteButton from "./DeleteButton";
import { updateTile, deleteTile } from "@/utils/edit";
import client from "@/api/client";
import { destroy } from "@/utils/animation/effects";
import styles from "./HeadingTile.module.css";
import { classNames } from "@/utils/css";
import type { ClientHeading } from "@/types/tiles";

type HeadingTileProps = {
  id: string;
  heading: ClientHeading;
};

function stripLineBreaks(value: string) {
  return value.replace(/\n/g, "");
}

export default function HeadingTile({ id, heading }: HeadingTileProps) {
  const { content } = heading;
  const ref = useRef<HTMLHeadingElement>(null);
  const isEditable = useEditable();
  useDraggable(ref, isEditable);
  useScrollIntoView(ref);
  const [value, setValue] = useState(content);

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
      if (!ref.current) {
        return;
      }
      event.stopPropagation();
      event.preventDefault();
      await client.tiles.delete.mutate({ id });
      await destroy(ref.current);
      deleteTile(id);
    },
    [id],
  );

  return (
    <header
      id={id}
      ref={ref}
      className={classNames(styles.heading, "editable")}
      data-drop-target={isEditable ? "true" : undefined}
      data-tile-id={id}
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
        <h1>{value || "Heading"}</h1>
      )}
    </header>
  );
}
