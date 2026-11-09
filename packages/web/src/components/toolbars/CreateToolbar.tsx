import AIButton from "@/components/buttons/AIButton";
import ToolbarGroup from "@/components/toolbars/ToolbarGroup";
import type { Reactive } from "reactivity";
import type { JSX } from "jsx/jsx";

export interface CreateToolbarProps {
  isPromptOpen: Reactive<boolean>;
  children?: JSX.Node;
}

/** The persistent AI and Insert actions at the end of the editor's bottom bar. */
export default function CreateToolbar({ isPromptOpen, children }: CreateToolbarProps) {
  return (
    <floating-toolbar aria-label="Create tools" data-tooltip-position="top">
      <toolbar-tab name="create" label="Create">
        <ToolbarGroup label="AI">
          <AIButton isOpen={isPromptOpen} />
        </ToolbarGroup>
        <ToolbarGroup id="insert-slot" label="Insert">
          {children}
        </ToolbarGroup>
      </toolbar-tab>
    </floating-toolbar>
  );
}
