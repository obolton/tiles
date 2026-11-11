import Thread from "./Thread";
import Prompt from "@/components/prompt/Prompt";
import Editor from "@/editor/Editor";
import If from "jsx/if";
import WriteIcon from "@/icons/write.svg?jsx";
import { combine, flag, type Reactive } from "carillon";
import { submitPrompt } from "@/utils/ai";
import styles from "./ChatPanel.module.css";

export interface ChatPanelProps {
  isOpen: Reactive<boolean>;
}

const INPUT_ID = "prompt-input";

export default function ChatPanel({ isOpen }: ChatPanelProps) {
  const editor = Editor.current;
  const { chat } = editor;
  const hasMessages = chat.messages.derive((messages) => messages.length > 0);
  // Covers the request as well as the response stream, so a reply never lands in a new chat
  const isSubmitting = flag(false);
  const isBusy = combine(
    { isSubmitting, state: chat.state },
    ({ isSubmitting, state }) => isSubmitting || state !== "idle",
  );

  async function onSubmit(prompt: string) {
    isSubmitting.on();
    try {
      await submitPrompt(prompt);
    } finally {
      isSubmitting.off();
    }
  }

  function onNewChat() {
    chat.clear();
    document.getElementById(INPUT_ID)?.focus();
  }

  function onCancel() {
    editor.closePromptToolbar();
  }

  return (
    <div classList={{ [styles.panel]: true, [styles.open]: isOpen }}>
      <Thread />
      <Prompt
        className={styles.prompt}
        inputId={INPUT_ID}
        placeholder="Ask anything"
        submitTooltip="Send"
        actions={
          <If condition={hasMessages}>
            <button
              type="button"
              classList={{ floating: true, small: true }}
              disabled={isBusy}
              aria-label="New chat"
              data-tooltip="New chat"
              on:click={onNewChat}
            >
              <WriteIcon aria-hidden="true" />
            </button>
          </If>
        }
        onSubmit={onSubmit}
        onCancel={onCancel}
      />
    </div>
  );
}
