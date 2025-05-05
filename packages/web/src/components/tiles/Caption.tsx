import ResizingTextarea from "@/components/inputs/ResizingTextarea";
import { classNames } from "@/utils/css";
import styles from "./Caption.module.css";
import { Store } from "@/utils/stores";

interface CaptionProps {
  isEditable: Store<boolean>;
  value?: string | null;
  onChange: (value: string) => void;
  placeholder?: string;
}

export default function Caption({
  isEditable,
  value: initialValue,
  onChange,
  placeholder,
}: CaptionProps) {
  const value = new Store(initialValue ?? "");

  const handleChange = (event: Event) => {
    value.value = event.currentTarget.value;
  };
  const handlePointerDown = (event: PointerEvent) => event.stopPropagation();
  const commit = () => onChange(value.value);

  return isEditable.derive((editable) =>
    editable ? (
      <figcaption
        className={classNames(styles.caption, styles.editable)}
        onpointerdown={handlePointerDown}
      >
        <ResizingTextarea
          className={styles.textarea}
          placeholder={placeholder}
          onBlur={commit}
          onChange={handleChange}
          rows={1}
          value={value.value}
        />
      </figcaption>
    ) : (
      value.derive((val) =>
        val ? (
          <figcaption className={styles.caption}>{value}</figcaption>
        ) : null,
      )
    ),
  );
}
