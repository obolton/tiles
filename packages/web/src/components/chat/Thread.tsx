import Each from "@/jsx/each";
import If from "@/jsx/if";
import Editor from "@/editor/Editor";
import MessageBubble from "./MessageBubble";
import StreamingBubble from "./StreamingBubble";
import styles from "./Thread.module.css";

export default function Thread() {
  const editor = Editor.current;

  function handleBackdropClick(event: PointerEvent) {
    if (event.target === event.currentTarget) {
      editor.closePromptToolbar();
    }
  }

  return (
    <section
      className={styles.thread}
      role="log"
      aria-label="Messages"
      on:pointerdown={handleBackdropClick}
    >
      <Each items={editor.chat.messages}>
        {(message) => <MessageBubble message={message} />}
      </Each>

      <If condition={editor.chat.isStreaming}>
        <StreamingBubble />
      </If>
    </section>
  );
}
