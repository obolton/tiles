import { useCallback, useState } from "react";
import useEditable from "@/hooks/useEditable";
import ResizingTextarea from "@/components/inputs/ResizingTextarea";
import { updateHeading } from "@/utils/edit";
import styles from "./HeadingTile.module.css";
import { classNames } from "@/utils/css";
import Tile from "./Tile";

type HeadingTileProps = {
  id: string;
  content: string;
};

function stripLineBreaks(value: string) {
  return value.replace(/\n/g, "");
}

export default function HeadingTile({ id, content }: HeadingTileProps) {
  const isEditable = useEditable();
  const [value, setValue] = useState(content);

  const onChange = useCallback(
    (event: React.ChangeEvent<HTMLTextAreaElement>) =>
      setValue(stripLineBreaks(event.target.value)),
    [],
  );

  const onBlur = useCallback(
    async () =>
      updateHeading({
        id,
        content: value,
      }),
    [id, value],
  );

  const onPointerDown = useCallback(
    (event: React.PointerEvent | React.MouseEvent) => {
      event.stopPropagation();
    },
    [],
  );

  return (
    <Tile id={id} showBorder={false}>
      <header className={classNames(styles.heading, "editable")}>
        {isEditable ? (
          <ResizingTextarea
            rows={1}
            placeholder="Heading"
            onPointerDownCapture={onPointerDown}
            onClickCapture={onPointerDown}
            onBlur={onBlur}
            onChange={onChange}
            value={value}
          />
        ) : (
          <h1>{value || "Heading"}</h1>
        )}
      </header>
    </Tile>
  );
}
