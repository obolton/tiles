import ResizingTextarea from "@/components/inputs/ResizingTextarea";
import { classNames } from "@/utils/css";
import { useCallback, useState, type ChangeEvent } from "react";
import styles from "./Caption.module.css";

interface CaptionProps {
  isEditable?: boolean;
  value?: string | null;
  onChange: (value: string) => void;
  placeholder?: string;
}

export default function Caption({
  isEditable = false,
  value: initialValue,
  onChange,
  placeholder,
}: CaptionProps) {
  const [value, setValue] = useState(initialValue ?? "");

  const handleChange = useCallback(
    (event: ChangeEvent<HTMLTextAreaElement>) => setValue(event.target.value),
    [],
  );
  const handlePointerDown = useCallback(
    (event: React.PointerEvent) => event.stopPropagation(),
    [],
  );
  const commit = useCallback(() => onChange(value), [onChange, value]);

  if (isEditable) {
    return (
      <figcaption
        className={classNames(styles.caption, styles.editable)}
        onPointerDownCapture={handlePointerDown}
      >
        <ResizingTextarea
          className={styles.textarea}
          placeholder={placeholder}
          onBlur={commit}
          onChange={handleChange}
          rows={1}
          value={value}
        />
      </figcaption>
    );
  }

  if (!value) {
    return null;
  }

  return <figcaption className={styles.caption}>{value}</figcaption>;
}
