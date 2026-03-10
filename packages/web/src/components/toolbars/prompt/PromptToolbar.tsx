import Prompt from "@/components/prompt/Prompt";
import Editor from "@/editor/Editor";
import client from "@/api/client";
import { insertFromStream } from "@/utils/richText/stream";
import { focusInside } from "@/utils/focus";
import styles from "./PromptToolbar.module.css";

export default function PromptToolbar() {
  const editor = Editor.current;

  async function onSubmit(prompt: string) {
    const pageId = editor.pageId;
    const sectionId = editor.activeSection?.id ?? null;
    const tileIds = editor.references.value.map((tile) => tile.id);
    const stream = await client.ai.write.mutate(
      { pageId, sectionId, prompt, context: { tileIds } },
      { context: { stream: true } },
    );
    await insertFromStream(null, stream);
    editor.closePromptToolbar();
  }

  function onCancel() {
    editor.closePromptToolbar();
  }

  function onTabChange(event: Event) {
    focusInside(event.currentTarget as HTMLElement);
  }

  return (
    <floating-toolbar
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
