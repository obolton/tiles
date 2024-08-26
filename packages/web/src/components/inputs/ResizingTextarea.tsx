import { useLayoutEffect, useRef } from "react";
import { classNames } from "@/utils/css";
import styles from "./ResizingTextarea.module.css";

type ResizingTextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

// https://developer.mozilla.org/en-US/docs/Web/CSS/field-sizing
const SUPPORTS_FIELD_SIZING =
  typeof window !== "undefined" && CSS.supports("field-sizing", "content");

export default function ResizingTextarea({
  className,
  value,
  ...props
}: ResizingTextareaProps) {
  const ref = useRef<HTMLTextAreaElement>(null);

  useLayoutEffect(() => {
    if (SUPPORTS_FIELD_SIZING || !ref.current) {
      return;
    }
    ref.current.style.setProperty("height", "auto");
    ref.current.style.setProperty("height", `${ref.current.scrollHeight}px`);
  }, [value]);

  return (
    <textarea
      {...props}
      className={classNames(styles.textarea, className)}
      ref={ref}
      value={value}
    />
  );
}
