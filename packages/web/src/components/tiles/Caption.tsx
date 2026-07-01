import ResizingTextarea from "@/components/inputs/ResizingTextarea";
import { classNames } from "@/utils/css";
import styles from "./Caption.module.css";
import type { Reactive } from "@/utils/reactivity";

export interface CaptionProps {
  isEditable: Reactive<boolean>;
  value: Reactive<string>;
  onChange: (value: string) => void;
  placeholder?: string;
}

function stopPropagation(event: Event) {
  event.stopPropagation();
}

export default function Caption({ isEditable, value, onChange, placeholder }: CaptionProps) {
  const handleChange = (event: Event) => {
    const element = event.currentTarget as HTMLTextAreaElement;
    const value = element.value;
    onChange(value);
  };

  return isEditable.derive((editable) =>
    editable ? (
      <figcaption
        className={classNames(styles.caption, styles.editable)}
        on:pointerdown={stopPropagation}
      >
        <ResizingTextarea
          className={styles.textarea}
          placeholder={placeholder}
          rows={1}
          value={value.value}
          on:change={handleChange}
        />
      </figcaption>
    ) : (
      value.derive((val) =>
        val ? <figcaption className={styles.caption}>{value}</figcaption> : null,
      )
    ),
  );
}
