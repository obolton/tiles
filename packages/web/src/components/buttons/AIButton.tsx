import AIIcon from "@/icons/ai.svg?jsx";
import Editor from "@/editor/Editor";
import type { Reactive } from "@/utils/reactivity";

export interface AIButtonProps {
  isOpen: Reactive<boolean>;
}

export default function AIButton({ isOpen }: AIButtonProps) {
  function onClick() {
    Editor.current.togglePromptToolbar();
  }

  return (
    <button
      id="ai-button"
      type="button"
      classList={{ floating: true }}
      aria-label="AI prompt"
      aria-pressed={isOpen}
      data-tooltip="AI prompt"
      data-tooltip-position="right"
      on:click={onClick}
    >
      <AIIcon aria-hidden="true" />
    </button>
  );
}
