import Thread from "./Thread";
import Prompt from "@/components/prompt/Prompt";
import Editor from "@/editor/Editor";
import { submitPrompt } from "@/utils/ai";
import styles from "./ChatPanel.module.css";
import type { Reactive } from "carillon";

export interface ChatPanelProps {
  isOpen: Reactive<boolean>;
}

async function onSubmit(prompt: string) {
  await submitPrompt(prompt);
}

export default function ChatPanel({ isOpen }: ChatPanelProps) {
  const editor = Editor.current;

  function onCancel() {
    editor.closePromptToolbar();
  }

  return (
    <div classList={{ [styles.panel]: true, [styles.open]: isOpen }}>
      <Thread />
      <Prompt
        className={styles.prompt}
        inputId="prompt-input"
        placeholder="Ask anything"
        submitTooltip="Send"
        onSubmit={onSubmit}
        onCancel={onCancel}
      />
    </div>
  );
}
