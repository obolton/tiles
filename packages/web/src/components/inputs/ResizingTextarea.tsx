import styles from "./ResizingTextarea.module.css";
import type { JSX } from "jsx/jsx";

type ResizingTextareaProps = JSX.Attributes<"textarea">;

// https://developer.mozilla.org/en-US/docs/Web/CSS/field-sizing
const SUPPORTS_FIELD_SIZING = !import.meta.env.SSR && CSS.supports("field-sizing", "content");

function onInput(event: Event) {
  const element = event.currentTarget as HTMLTextAreaElement;
  element.style.setProperty("height", "auto");
  element.style.setProperty("height", `${element.scrollHeight}px`);
}

export default function ResizingTextarea({ classList, value, ...props }: ResizingTextareaProps) {
  return (
    <textarea
      {...props}
      classList={{ [styles.textarea]: true, ...classList }}
      on:input={SUPPORTS_FIELD_SIZING ? undefined : onInput}
    >
      {value}
    </textarea>
  );
}
