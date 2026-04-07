import ActionChip from "./ActionChip";
import { classNames } from "@/utils/css";
import styles from "./MessageBubble.module.css";
import type { ChatMessage } from "./types";

export interface MessageBubbleProps {
  message: ChatMessage;
}

export default function MessageBubble({ message }: MessageBubbleProps) {
  return (
    <>
      {message.content ? (
        <article
          className={classNames(
            styles.bubble,
            styles[message.role],
            message.role === "assistant" && "rich-text",
          )}
          aria-label={message.role === "user" ? "You" : "AI"}
        >
          {message.content}
        </article>
      ) : null}
      {message.role === "assistant" && message.actions?.length ? (
        <div className={styles.actions}>
          {message.actions.map((action) => (
            <ActionChip action={action} />
          ))}
        </div>
      ) : null}
    </>
  );
}
