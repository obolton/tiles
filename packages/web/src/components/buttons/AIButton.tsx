import AIIcon from "@/icons/ai.svg?jsx";
import Editor from "@/editor/Editor";
import type { Reactive } from "reactivity";

export interface AIButtonProps {
  isOpen: Reactive<boolean>;
}

function onClick() {
  Editor.current.togglePromptToolbar();
}

export default function AIButton({ isOpen }: AIButtonProps) {
  return (
    <button
      id="ai-button"
      type="button"
      classList={{ floating: true }}
      aria-label="AI prompt"
      aria-pressed={isOpen}
      data-tooltip="AI prompt"
      on:click={onClick}
    >
      <AIIcon aria-hidden="true" />
    </button>
  );
}
