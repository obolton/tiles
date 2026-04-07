import Editor from "@/editor/Editor";
import StreamRenderer from "./StreamRenderer";
import { classNames } from "@/utils/css";
import bubbleStyles from "./MessageBubble.module.css";
import styles from "./StreamingBubble.module.css";

export default function StreamingBubble() {
  const editor = Editor.current;

  return (
    <article
      className={classNames(
        bubbleStyles.bubble,
        bubbleStyles.assistant,
        styles.streaming,
        "rich-text",
      )}
      aria-label="AI"
      aria-live="polite"
      ref={(el) => {
        const renderer = new StreamRenderer();
        el.appendChild(renderer.container);
        editor.chat.destination = renderer.container;
        editor.chat.subscribe((event) => {
          renderer.append(event);
        });
      }}
    />
  );
}
