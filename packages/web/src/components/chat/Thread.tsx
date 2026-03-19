import Each from "@/jsx/each";
import If from "@/jsx/if";
import Editor from "@/editor/Editor";
import MessageBubble from "./MessageBubble";
import StreamingBubble from "./StreamingBubble";
import ActivityIndicator from "./ActivityIndicator";
import styles from "./Thread.module.css";

export default function Thread() {
  const editor = Editor.current;
  const { state } = editor.chat;

  return (
    <section className={styles.thread} role="log" aria-label="Messages">
      <Each items={editor.chat.messages}>
        {(message) => <MessageBubble message={message} />}
      </Each>

      <If condition={state.derive((s) => s === "pending")}>
        <ActivityIndicator />
      </If>

      <If condition={state.derive((s) => s === "responding")}>
        <StreamingBubble />
      </If>
    </section>
  );
}
