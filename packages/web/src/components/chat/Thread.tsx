import Each from "jsx/each";
import { Switch, Case } from "jsx/switch";
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
      <Each items={editor.chat.messages}>{(message) => <MessageBubble message={message} />}</Each>

      <Switch value={state}>
        <Case value="pending">
          <ActivityIndicator />
        </Case>
        <Case value="responding">
          <StreamingBubble />
        </Case>
      </Switch>
    </section>
  );
}
