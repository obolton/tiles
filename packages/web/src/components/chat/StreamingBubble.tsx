import Editor from "@/editor/Editor";
import { classNames } from "@/utils/css";
import bubbleStyles from "./MessageBubble.module.css";
import styles from "./StreamingBubble.module.css";

export default function StreamingBubble() {
  const editor = Editor.current;
  const content = document.createElement("span");

  editor.chat.subscribeToContent((chunk) => {
    content.append(chunk);
  });

  return (
    <article
      className={classNames(
        bubbleStyles.bubble,
        bubbleStyles.assistant,
        styles.streaming,
      )}
      aria-label="AI"
      aria-live="polite"
    >
      <div className={bubbleStyles.content}>
        {content}
        <span className={styles.cursor} />
      </div>
    </article>
  );
}
