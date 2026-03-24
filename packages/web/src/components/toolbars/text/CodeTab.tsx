import ToolbarGroup from "@/components/toolbars/ToolbarGroup";
import ToolbarButton from "@/components/buttons/ToolbarButton";
import ListOption from "@/components/lists/ListOption";
import ListGroup from "@/components/lists/ListGroup";
import CodeIcon from "@/icons/code.svg?jsx";
import LineNumbersIcon from "@/icons/line-numbers.svg?jsx";
import {
  SUPPORTED_LANGUAGES,
  findLanguageConfig,
} from "@/utils/richText/code/languages";
import {
  setCodeBlockLanguage,
  toggleCodeBlockLineNumbers,
} from "@/utils/richText/commands";
import type { Reactive } from "@/utils/reactivity";
import type { Format } from "@/utils/richText/format";
import type { Command } from "prosemirror-state";
import type ListSelect from "@/elements/list-select/ListSelect";

export interface CodeTabProps {
  format: Reactive<Format>;
  performCommand: (command: Command) => void;
}

export default function CodeTab({ format, performCommand }: CodeTabProps) {
  function changeLanguage(event: Event) {
    const value = (event.currentTarget as ListSelect).value ?? "";
    performCommand(setCodeBlockLanguage(value));
  }

  return (
    <toolbar-tab name="code" label="Code">
      <ToolbarGroup label="Language">
        <list-select
          aria-label="Language"
          orientation="vertical"
          align="center"
          showvalue
          value={format.derive((f) => {
            const config =
              f.codeLanguage !== null
                ? findLanguageConfig(f.codeLanguage)
                : undefined;
            return config?.id ?? "";
          })}
          on:change={changeLanguage}
        >
          <CodeIcon slot="default-icon" aria-hidden="true" />
          <ListGroup>
            {SUPPORTED_LANGUAGES.map((language) => (
              <ListOption value={language.id}>{language.name}</ListOption>
            ))}
          </ListGroup>
        </list-select>
      </ToolbarGroup>

      <ToolbarGroup label="Options">
        <ToolbarButton
          label="Line numbers"
          aria-pressed={format.derive((f) => f.codeLineNumbers)}
          on:click={() => performCommand(toggleCodeBlockLineNumbers)}
        >
          <LineNumbersIcon aria-hidden="true" />
          Line numbers
        </ToolbarButton>
      </ToolbarGroup>
    </toolbar-tab>
  );
}
