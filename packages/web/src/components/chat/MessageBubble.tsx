import ActionChip from "./ActionChip";
import { classNames } from "@/utils/css";
import styles from "./MessageBubble.module.css";
import type { ChatMessage } from "./types";

export interface MessageBubbleProps {
  message: ChatMessage;
}

export default function MessageBubble({ message }: MessageBubbleProps) {
  return (
    <article
      className={classNames(styles.bubble, styles[message.role])}
      aria-label={message.role === "user" ? "You" : "AI"}
    >
      <div className={styles.content}>{message.content}</div>
      {message.role === "assistant" && message.actions.length > 0 ? (
        <div className={styles.actions}>
          {message.actions.map((action) => (
            <ActionChip action={action} />
          ))}
        </div>
      ) : null}
    </article>
  );
}
