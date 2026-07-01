import Thread from "./Thread";
import Prompt from "@/components/prompt/Prompt";
import Editor from "@/editor/Editor";
import { submitPrompt } from "@/utils/ai";
import styles from "./ChatPanel.module.css";

async function onSubmit(prompt: string) {
  await submitPrompt(prompt);
}

export default function ChatPanel() {
  const editor = Editor.current;

  function onCancel() {
    editor.closePromptToolbar();
  }

  return (
    <div className={styles.panel}>
      <Thread />
      <Prompt
        className={styles.prompt}
        placeholder="Ask anything"
        submitTooltip="Send"
        onSubmit={onSubmit}
        onCancel={onCancel}
      />
    </div>
  );
}
