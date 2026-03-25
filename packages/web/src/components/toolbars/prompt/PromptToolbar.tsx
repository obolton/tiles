import Prompt from "@/components/prompt/Prompt";
import Editor from "@/editor/Editor";
import { submitPrompt } from "@/utils/ai";
import { focusInside } from "@/utils/focus";
import styles from "./PromptToolbar.module.css";

export default function PromptToolbar() {
  const editor = Editor.current;

  async function onSubmit(prompt: string) {
    await submitPrompt(prompt);
  }

  function onCancel() {
    editor.closePromptToolbar();
  }

  function onTabChange(event: Event) {
    focusInside(event.currentTarget as HTMLElement);
  }

  return (
    <floating-toolbar
      id="prompt-toolbar"
      className="primary prompt"
      aria-label="AI prompt"
      data-tooltip-position="bottom"
      on:tabchange={onTabChange}
    >
      <toolbar-tab name="prompt" label="AI" className={styles.tab}>
        <Prompt
          className={styles.prompt}
          placeholder="Ask anything"
          submitTooltip="Send"
          onSubmit={onSubmit}
          onCancel={onCancel}
        />
      </toolbar-tab>
    </floating-toolbar>
  );
}
